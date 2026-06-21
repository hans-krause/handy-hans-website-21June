import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const UnsubscribePage = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<"loading" | "valid" | "already" | "invalid" | "submitting" | "success" | "error">("loading");

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    fetch(`${FN_URL}?token=${encodeURIComponent(token)}`, { headers: { apikey: ANON } })
      .then(async (r) => {
        const data = await r.json();
        if (data.valid) setState("valid");
        else if (data.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      })
      .catch(() => setState("invalid"));
  }, [token]);

  const confirm = async () => {
    setState("submitting");
    try {
      const r = await fetch(FN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: ANON },
        body: JSON.stringify({ token }),
      });
      const data = await r.json();
      if (data.success) setState("success");
      else if (data.reason === "already_unsubscribed") setState("already");
      else setState("error");
    } catch {
      setState("error");
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-32 pb-24">
        <div className="container max-w-xl text-center">
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-6">Unsubscribe</h1>
          {state === "loading" && <Loader2 className="h-6 w-6 animate-spin mx-auto" />}
          {state === "valid" && (
            <>
              <p className="text-muted-foreground mb-6">Click below to confirm and stop receiving emails from Handy Hans English.</p>
              <Button variant="hero" size="lg" onClick={confirm}>Confirm unsubscribe</Button>
            </>
          )}
          {state === "submitting" && <Loader2 className="h-6 w-6 animate-spin mx-auto" />}
          {state === "success" && <p className="text-muted-foreground">You've been unsubscribed. Sorry to see you go!</p>}
          {state === "already" && <p className="text-muted-foreground">You're already unsubscribed.</p>}
          {state === "invalid" && <p className="text-muted-foreground">This unsubscribe link is invalid or has expired.</p>}
          {state === "error" && <p className="text-muted-foreground">Something went wrong. Please try again later.</p>}
        </div>
      </section>
      <Footer />
    </main>
  );
};

export default UnsubscribePage;
