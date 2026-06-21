import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import ukCircle from "@/assets/uk-circle.png";

const emailSchema = z.string().trim().email("Invalid email").max(255);
const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(100);
const nameSchema = z.string().trim().min(1, "Name required").max(80);
const OAUTH_IN_PROGRESS_STORAGE_KEY = "lovable:google-oauth-in-progress";
const OAUTH_SIGNUP_OPTIN_KEY = "lovable:google-oauth-signup-optin";
const OAUTH_REDIRECT_TO_KEY = "lovable:google-oauth-redirect-to";
const SHOW_GOOGLE_AUTH = false;

const getOAuthRedirectUri = (redirectTo: string) => {
  const origin = window.location.origin;
  const params = new URLSearchParams({ redirect: redirectTo });
  return `${origin}/auth?${params.toString()}`;
};

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [optInMarketing, setOptInMarketing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    // If this user just completed a Google signup, sync their marketing
    // preference to their profile and to Brevo before redirecting.
    const pendingOptIn = typeof window !== "undefined"
      ? window.sessionStorage.getItem(OAUTH_SIGNUP_OPTIN_KEY)
      : null;
    if (pendingOptIn !== null) {
      window.sessionStorage.removeItem(OAUTH_SIGNUP_OPTIN_KEY);
      const optIn = pendingOptIn === "true";
      (async () => {
        try {
          await supabase
            .from("profiles")
            .update({ opt_in_marketing: optIn })
            .eq("user_id", user.id);
        } catch (e) {
          console.warn("profile opt_in update failed", e);
        }
        try {
          await supabase.functions.invoke("brevo-sync-signup");
        } catch (e) {
          console.warn("brevo-sync-signup failed", e);
        }
        navigate(redirectTo, { replace: true });
      })();
      return;
    }
    navigate(redirectTo, { replace: true });
  }, [user, navigate, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailOk = emailSchema.safeParse(email);
    const passOk = passwordSchema.safeParse(password);
    if (!emailOk.success) return toast.error(emailOk.error.errors[0].message);
    if (!passOk.success) return toast.error(passOk.error.errors[0].message);

    setLoading(true);
    try {
      if (mode === "signup") {
        const nameOk = nameSchema.safeParse(displayName);
        if (!nameOk.success) { setLoading(false); return toast.error(nameOk.error.errors[0].message); }
        const { error } = await supabase.auth.signUp({
          email: emailOk.data,
          password: passOk.data,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { display_name: nameOk.data, opt_in_marketing: optInMarketing },
          },
        });
        if (error) throw error;
        // Sync the new account to Brevo List 12 (Account Created) — fire and
        // forget; failures here shouldn't block the user from signing up.
        supabase.functions.invoke("brevo-sync-signup").catch((e) => {
          console.warn("brevo-sync-signup failed", e);
        });
        toast.success("Account created! Check your inbox to confirm your email.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailOk.data,
          password: passOk.data,
        });
        if (error) throw error;
        navigate(redirectTo);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);

    try {
      if (typeof window !== "undefined") {
      window.sessionStorage.setItem(OAUTH_IN_PROGRESS_STORAGE_KEY, String(Date.now()));
      window.sessionStorage.setItem(OAUTH_REDIRECT_TO_KEY, redirectTo);
      if (mode === "signup") {
        window.sessionStorage.setItem(OAUTH_SIGNUP_OPTIN_KEY, String(optInMarketing));
      } else {
        window.sessionStorage.removeItem(OAUTH_SIGNUP_OPTIN_KEY);
      }
      console.log("[AuthPage] starting Google OAuth", {
        href: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        redirectTo,
      });
      }

      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: getOAuthRedirectUri(redirectTo),
        extraParams: {
          prompt: "select_account",
        },
      });

      if (result.error) {
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(OAUTH_IN_PROGRESS_STORAGE_KEY);
        }
        console.error("[AuthPage] Google OAuth failed", {
          error: {
            name: result.error.name,
            message: result.error.message,
            stack: result.error.stack,
          },
          redirectTo,
          href: typeof window !== "undefined" ? window.location.href : "",
        });
        setLoading(false);
        toast.error(result.error.message || "Google sign-in failed");
        return;
      }

      if (result.redirected) return;

      navigate(redirectTo, { replace: true });
    } catch (error) {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(OAUTH_IN_PROGRESS_STORAGE_KEY);
      }
      console.error("[AuthPage] Google OAuth crashed", {
        error: error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : error,
        redirectTo,
        href: typeof window !== "undefined" ? window.location.href : "",
      });
      setLoading(false);
      toast.error(error instanceof Error ? error.message : "Google sign-in failed");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-soft flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-elevated border border-border/60 p-8 md:p-10">
        <Link to="/" className="flex items-center gap-2 mb-6">
          <img src={ukCircle} alt="Union Jack" width={36} height={36} className="h-9 w-9 rounded-full object-cover shadow-soft" />
          <span className="font-display text-lg font-semibold">Handy Hans</span>
        </Link>
        <h1 className="font-display text-2xl md:text-3xl font-semibold mb-2">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          {mode === "signin" ? "Sign in to book classes and access your dashboard." : "Sign up to register for English classes."}
        </p>

        {mode === "signup" && (
          <div className="flex items-start gap-2 mb-4">
            <Checkbox
              id="opt-in"
              checked={optInMarketing}
              onCheckedChange={(v) => setOptInMarketing(v === true)}
              className="mt-0.5"
            />
            <Label htmlFor="opt-in" className="text-sm font-normal leading-snug text-muted-foreground cursor-pointer">
              (Optional) I want to receive Handy Hans English updates, page news, and occasional tips and course reminders via email. I can unsubscribe any time.
            </Label>
          </div>
        )}

        {SHOW_GOOGLE_AUTH && (
          <>
            <Button type="button" variant="outline" className="w-full mb-4" onClick={handleGoogle} disabled={loading}>
              {mode === "signin" ? "Continue with Google" : "Sign up with Google"}
            </Button>
            <div className="flex items-center gap-3 my-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <Label htmlFor="name">Your name</Label>
              <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            </div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
          {mode === "signin" && (
            <div className="text-center">
              <Link to="/auth/reset-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
          )}
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          {mode === "signin" ? "New here? " : "Already have an account? "}
          <button
            type="button"
            className="text-primary font-medium hover:underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </main>
  );
};

export default Auth;
