import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type State = "loading" | "success" | "error";

const ConfirmSignupPage = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setState("error");
        setError("Missing confirmation token.");
        return;
      }
      try {
        const { data, error: invokeErr } = await supabase.functions.invoke(
          "confirm-pdf-signup",
          { body: { token } },
        );
        if (cancelled) return;
        if (invokeErr || !(data as any)?.success) {
          setState("error");
          setError((data as any)?.error || "We couldn't confirm your email. The link may be invalid or expired.");
          return;
        }
        setState("success");
      } catch (e) {
        if (cancelled) return;
        setState("error");
        setError("Something went wrong. Please try signing up again.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-32 pb-24">
        <div className="container max-w-xl text-center">
          {state === "loading" && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Confirming your email…</p>
            </div>
          )}
          {state === "success" && (
            <div className="rounded-2xl bg-primary-soft border border-primary/20 p-8">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-3" />
              <h1 className="font-display text-2xl md:text-3xl font-semibold mb-2">
                You're confirmed! 🎉
              </h1>
              <p className="text-muted-foreground">
                Thanks for verifying your email. Your PDF will land in your inbox in a minute.
              </p>
              <Link to="/" className="inline-block mt-6 text-primary font-medium hover:underline">
                Back to home
              </Link>
            </div>
          )}
          {state === "error" && (
            <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-8">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
              <h1 className="font-display text-2xl md:text-3xl font-semibold mb-2">
                Confirmation failed
              </h1>
              <p className="text-muted-foreground">{error}</p>
              <Link to="/free-pdf" className="inline-block mt-6 text-primary font-medium hover:underline">
                Sign up again
              </Link>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
};

export default ConfirmSignupPage;
