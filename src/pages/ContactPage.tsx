import { useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Seo } from "@/components/site/Seo";
import { Mail, Instagram, Youtube, Facebook, Send, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100, "Name must be under 100 characters"),
  email: z.string().trim().email("Please enter a valid email").max(255),
  subject: z.string().trim().min(1, "Please add a subject").max(200, "Subject must be under 200 characters"),
  message: z.string().trim().min(1, "Please enter a message").max(2000, "Message must be under 2000 characters"),
});

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.93a8.16 8.16 0 0 0 4.77 1.52V7a4.85 4.85 0 0 1-1.84-.31z" />
  </svg>
);

const socials = [
  { href: "https://www.instagram.com/handy_hans_/", label: "Instagram", icon: Instagram },
  { href: "https://www.tiktok.com/@handy_hans", label: "TikTok", icon: TikTokIcon },
  { href: "https://www.youtube.com/@handy_hans", label: "YouTube", icon: Youtube },
  { href: "https://www.facebook.com/handy.hansUK", label: "Facebook", icon: Facebook },
];

const ContactPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse({ name, email, subject, message });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    try {
      const { name: n, email: em, subject: sub, message: msg } = parsed.data;
      const { data, error } = await supabase.functions.invoke("send-contact-message", {
        body: { name: n, email: em, subject: sub, message: msg },
      });
      if (error || !data?.success) throw error || new Error("Failed to send");
      setSubmitted(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      toast.success("Thanks! Your message has been sent.");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
  <main className="min-h-screen bg-gradient-hero">
    <Seo
      title="Contact Hans — Handy Hans English"
      description="Contact Hans for any questions about English courses, scheduling or collaborations."
      path="/contact"
    />
    <Navbar />
    <section className="pt-32 pb-24 bg-gradient-hero">
      <div className="container max-w-2xl text-center">
        <h1 className="font-display text-3xl md:text-5xl font-semibold mt-3 mb-5">Contact Hans</h1>
        <p className="text-muted-foreground text-lg mb-10 text-center whitespace-pre-line">
          {"Questions about classes, scheduling or collaborations?\nSend me a message! I answer all emails."}
        </p>

        <a
          href="mailto:hello@handyhansenglish.com"
          className="inline-flex items-center gap-3 rounded-full bg-white text-foreground px-6 py-4 shadow-soft hover:bg-primary hover:text-primary-foreground transition-all"
        >
          <Mail className="h-5 w-5" />
          <span className="font-medium">hello@handyhansenglish.com</span>
        </a>

        <div className="mt-12 text-left">
          <h2 className="font-display text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground text-center">OR SEND A MESSAGE BELOW:</h2>
          {submitted ? (
            <div className="p-6 rounded-2xl bg-primary-soft border border-primary/20 text-center">
              <div className="font-medium text-primary-deep mb-1">Message sent! 🎉</div>
              <p className="text-sm text-muted-foreground">Thanks for reaching out – I'll get back to you as soon as I can.</p>
              <Button variant="ghost" className="mt-3" onClick={() => setSubmitted(false)}>Send another</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-card border border-border/60 p-6 shadow-soft">
              <div className="space-y-1.5">
                <label htmlFor="contact-name" className="text-sm font-medium text-foreground">Your name</label>
                <Input
                  id="contact-name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                  className="h-12 rounded-full px-5 bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="contact-email" className="text-sm font-medium text-foreground">Your email</label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={255}
                  className="h-12 rounded-full px-5 bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="contact-subject" className="text-sm font-medium text-foreground">Subject</label>
                <Input
                  id="contact-subject"
                  placeholder="What's this about?"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  maxLength={200}
                  className="h-12 rounded-full px-5 bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="contact-message" className="text-sm font-medium text-foreground">Message</label>
                <Textarea
                  id="contact-message"
                  placeholder="What would you like to ask?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  maxLength={2000}
                  rows={5}
                  className="rounded-2xl px-5 py-3 bg-background"
                />
              </div>
              <div className="flex justify-center">
                <Button type="submit" variant="hero" size="lg" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send message
                </Button>
              </div>
            </form>
          )}
        </div>

      </div>
    </section>
    <Footer />
  </main>
  );
};

export default ContactPage;
