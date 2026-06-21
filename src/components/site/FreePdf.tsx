import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import hansCircle from "@/assets/hans-circle.png";

const signupSchema = z.object({
  name: z.string().trim().min(1, "Please enter your first name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
});

export const FreePdf = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isValid = name.trim().length > 0 && /^\S+@\S+\.\S+$/.test(email.trim()) && consent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signupSchema.safeParse({ name, email });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    if (!consent) {
      toast.error("Please tick the box to receive your PDF and updates.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("brevo-signup", {
        body: { name: parsed.data.name, email: parsed.data.email, consent: true },
      });
      if (error) throw error;
      if (data && (data as any).success === false) throw new Error((data as any).error || "Signup failed");
      setSubmitted(true);
      toast.success("Check your inbox — your PDF is on the way!");
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="free-pdf" className="py-24 bg-gradient-hero">
      <div className="container">
        <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-card border border-border/60 shadow-elevated overflow-hidden">
          <div className="grid md:grid-cols-5 gap-0">
            <div className="md:col-span-2 bg-gradient-primary p-10 flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full" />
                <div className="relative bg-background/95 rounded-2xl p-8 shadow-elevated rotate-[-4deg]">
                  <div className="flex items-center gap-3 mb-3">
                    <BookOpen className="h-16 w-16 text-primary" />
                    <img
                      src={hansCircle}
                      alt="Hans"
                      className="h-16 w-16 rounded-full object-cover border-2 border-background shadow-soft"
                      loading="lazy"
                    />
                  </div>
                  <div className="font-display text-lg font-semibold text-foreground leading-tight">
                    Hans's Top 20
                    <span className="block">Evil English Errors</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Free PDF · 6 pages</div>
                </div>
              </div>
            </div>
            <div className="md:col-span-3 p-10 md:p-12">
              <span className="text-sm font-medium text-primary uppercase tracking-wider">Free download</span>
              <h1 className="font-display text-3xl md:text-4xl font-semibold mt-3 mb-4">
                Hans's Top 20
                <span className="block">Evil English Errors</span>
              </h1>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Download my free English study sheet. Just pop in your details below and I'll send it straight to your inbox!
              </p>

              {submitted ? (
                <div className="p-5 rounded-2xl bg-primary-soft border border-primary/20">
                  <div className="font-medium text-primary-deep mb-1">You're in! 📧</div>
                  <p className="text-sm text-muted-foreground">
                    Your free PDF is on its way to your inbox. If you don't see it within a couple of minutes, please check your spam folder.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      type="text"
                      placeholder="First name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      maxLength={100}
                      className="h-12 rounded-full px-5 bg-background sm:flex-1"
                    />
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      maxLength={255}
                      className="h-12 rounded-full px-5 bg-background sm:flex-1"
                    />
                  </div>
                  <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-border accent-primary cursor-pointer"
                    />
                    <span>
                      Yes, please email me my free PDF and occasional updates about Handy Hans English courses, tips and offers. I can unsubscribe anytime.
                    </span>
                  </label>
                  <Button type="submit" variant="hero" size="lg" disabled={loading || !isValid} className="w-full sm:w-auto">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Get the PDF
                  </Button>
                </form>
              )}
              
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
