import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import ukCircle from "@/assets/uk-circle.png";

const emailSchema = z.string().trim().email("Please enter a valid email").max(255);

const ResetPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) return toast.error(parsed.error.errors[0].message);

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Password reset email sent");
    } catch (err: any) {
      toast.error(err.message || "Couldn't send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-soft flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-elevated border border-border/60 p-8 md:p-10">
        <Link to="/" className="flex items-center gap-2 mb-6">
          <img src={ukCircle} alt="Union Jack" width={36} height={36} className="h-9 w-9 rounded-full object-cover shadow-soft" />
          <span className="font-display text-lg font-semibold">Handy Hans</span>
        </Link>
        <h1 className="font-display text-2xl md:text-3xl font-semibold mb-2">Forgot your password?</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Enter your email and we'll send you a link to reset your password.
        </p>

        {sent ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-primary/10 border border-primary/30 p-4 text-sm">
              Check <span className="font-medium">{email}</span> for a password reset link. The email may take a minute to arrive.
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/auth"><ArrowLeft className="h-4 w-4 mr-2" /> Back to sign in</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Send reset link
            </Button>
            <Button type="button" variant="ghost" className="w-full" asChild>
              <Link to="/auth"><ArrowLeft className="h-4 w-4 mr-2" /> Back to sign in</Link>
            </Button>
          </form>
        )}
      </div>
    </main>
  );
};

export default ResetPasswordPage;
