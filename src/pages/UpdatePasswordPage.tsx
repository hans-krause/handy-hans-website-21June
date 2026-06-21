import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import ukCircle from "@/assets/uk-circle.png";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100);

const UpdatePasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // When the user arrives via the recovery link, supabase-js parses the
    // tokens in the URL hash and fires a PASSWORD_RECOVERY event. We wait
    // for either that event or an existing session before allowing the form.
    let mounted = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
        setError(null);
      }
    });

    // Fallback: if the page is reloaded after the hash has already been
    // consumed, a session may already exist.
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) {
        setReady(true);
      } else {
        // Give supabase-js a moment to process the hash, then surface an
        // error if nothing came through.
        setTimeout(() => {
          if (mounted && !ready) {
            setError(
              "This password reset link is invalid or has expired. Please request a new one."
            );
          }
        }, 1500);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) return toast.error(parsed.error.errors[0].message);
    if (password !== confirm) return toast.error("Passwords do not match");

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: parsed.data });
      if (error) throw error;
      toast.success("Password updated. Please sign in with your new password.");
      await supabase.auth.signOut();
      navigate("/auth", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Couldn't update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-soft flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-elevated border border-border/60 p-8 md:p-10">
        <Link to="/" className="flex items-center gap-2 mb-6">
          <img
            src={ukCircle}
            alt="Union Jack"
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover shadow-soft"
          />
          <span className="font-display text-lg font-semibold">Handy Hans</span>
        </Link>
        <h1 className="font-display text-2xl md:text-3xl font-semibold mb-2">
          Choose a new password
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          Enter a new password for your account. You'll use it the next time you sign in.
        </p>

        {error ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-destructive/10 border border-destructive/30 p-4 text-sm">
              {error}
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/auth/reset-password">
                <ArrowLeft className="h-4 w-4 mr-2" /> Request a new link
              </Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                disabled={!ready}
                minLength={8}
              />
            </div>
            <div>
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                disabled={!ready}
                minLength={8}
              />
            </div>
            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={loading || !ready}
            >
              {(loading || !ready) && <Loader2 className="h-4 w-4 animate-spin" />}
              {ready ? "Update password" : "Verifying link…"}
            </Button>
            <Button type="button" variant="ghost" className="w-full" asChild>
              <Link to="/auth">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to sign in
              </Link>
            </Button>
          </form>
        )}
      </div>
    </main>
  );
};

export default UpdatePasswordPage;
