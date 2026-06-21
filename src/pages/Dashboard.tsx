import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Sparkles, ExternalLink, Pencil, Check, X, Lock, BookOpen } from "lucide-react";
import { getStripeEnvironment } from "@/lib/stripe";
import { toast } from "@/hooks/use-toast";
import { CLASS_SLOTS, DEFAULT_SLOT_ID, getSlotById, type ClassSlot } from "@/lib/classSlots";

type OneOnOneBooking = {
  id: string;
  product_kind: string;
  title: string | null;
  starts_at: string;
  ends_at: string;
  status: string;
};

type StudentDocument = {
  google_doc_url: string;
};

function getUpcomingDates(slot: ClassSlot, count: number): Date[] {
  const out: Date[] = [];
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), slot.utcHour, slot.utcMinute, 0));
  let diff = (slot.weekday - d.getUTCDay() + 7) % 7;
  if (diff === 0 && now.getTime() >= d.getTime()) diff = 7;
  d.setUTCDate(d.getUTCDate() + diff);
  for (let i = 0; i < count; i++) {
    out.push(new Date(d));
    d.setUTCDate(d.getUTCDate() + 7);
  }
  return out;
}

type Subscription = {
  id: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  class_slot_id: string | null;
  class_day_label: string | null;
};

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

const Dashboard = () => {
  const { user, isAdmin, signOut } = useAuth();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [oneOnOneBookings, setOneOnOneBookings] = useState<OneOnOneBooking[]>([]);
  const [studentDoc, setStudentDoc] = useState<StudentDocument | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const sendPasswordReset = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/dashboard`,
    });
    setSendingReset(false);
    if (error) {
      toast({ title: "Couldn't send reset email", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Reset email sent", description: `Check ${user.email} for a password reset link.` });
  };

  const updatePassword = async () => {
    if (pw1.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    if (pw1 !== pw2) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    setSavingPw(false);
    if (error) {
      toast({ title: "Couldn't update password", description: error.message, variant: "destructive" });
      return;
    }
    setPw1("");
    setPw2("");
    toast({ title: "Password updated" });
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      const name = data?.display_name ?? "";
      // Trigger seeds display_name with email-prefix — treat that as "no name set" so we prompt the user.
      const emailPrefix = user.email?.split("@")[0] ?? "";
      setDisplayName(name && name !== emailPrefix ? name : "");
      setNameInput(name && name !== emailPrefix ? name : "");
    })();
  }, [user]);

  const saveName = async () => {
    if (!user) return;
    const trimmed = nameInput.trim();
    if (!trimmed) {
      toast({ title: "Please enter a name", variant: "destructive" });
      return;
    }
    if (trimmed.length > 80) {
      toast({ title: "Name too long", description: "Max 80 characters.", variant: "destructive" });
      return;
    }
    setSavingName(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: trimmed })
      .eq("user_id", user.id);
    setSavingName(false);
    if (error) {
      toast({ title: "Couldn't save name", description: error.message, variant: "destructive" });
      return;
    }
    setDisplayName(trimmed);
    setEditingName(false);
    toast({ title: "Name updated" });
  };

  useEffect(() => {
    if (!user) return;
    let env: string;
    try {
      env = getStripeEnvironment();
    } catch {
      setLoading(false);
      return;
    }
    (async () => {
      // Refresh subscription state from Stripe so cancellations made in the
      // billing portal show up immediately even if the webhook is delayed.
      try {
        await supabase.functions.invoke("sync-subscription", { body: { environment: env } });
      } catch {
        // best-effort
      }
      const { data } = await supabase
        .from("subscriptions")
        .select("id, status, current_period_end, cancel_at_period_end, class_slot_id, class_day_label")
        .eq("user_id", user.id)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setSub((data as Subscription | null) ?? null);

      // Fetch 1:1 bookings (upcoming + recent), and student progress doc
      const nowIso = new Date().toISOString();
      const [{ data: bookings }, { data: doc }] = await Promise.all([
        supabase
          .from("one_on_one_bookings")
          .select("id, product_kind, title, starts_at, ends_at, status")
          .eq("status", "confirmed")
          .gte("ends_at", nowIso)
          .order("starts_at", { ascending: true })
          .limit(20),
        supabase
          .from("student_documents")
          .select("google_doc_url")
          .maybeSingle(),
      ]);
      setOneOnOneBookings((bookings as OneOnOneBooking[] | null) ?? []);
      setStudentDoc((doc as StudentDocument | null) ?? null);

      setLoading(false);
    })();
  }, [user]);

  const hasActive = !!sub && (
    (ACTIVE_STATUSES.has(sub.status) && (!sub.current_period_end || new Date(sub.current_period_end) > new Date()))
    || (sub.status === "canceled" && !!sub.current_period_end && new Date(sub.current_period_end) > new Date())
  );

  const [portalLoading, setPortalLoading] = useState(false);
  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const env = getStripeEnvironment();
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: { environment: env, returnUrl: `${window.location.origin}/dashboard` },
      });
      if (error || !data?.url) throw new Error(error?.message || "Failed to open billing portal");
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast({
        title: "Couldn't open billing portal",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const statusLabel = (() => {
    if (!sub) return null;
    if (sub.status === "trialing") return "Free trial";
    if (sub.status === "active" && sub.cancel_at_period_end) return "Active — cancels at period end";
    if (sub.status === "active") return "Active";
    if (sub.status === "past_due") return "Payment past due";
    if (sub.status === "canceled") return "Canceled";
    return sub.status;
  })();

  const periodEndLabel = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <main className="min-h-screen bg-gradient-soft">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-display font-semibold">Handy Hans</span>
          </Link>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin">Admin</Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
          </div>
        </div>
      </header>

      <div className="container py-12">
        <div className="mb-8">
          {editingName ? (
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-2 max-w-md">
              <div className="flex-1">
                <Label htmlFor="display-name" className="text-xs text-muted-foreground">Your name</Label>
                <Input
                  id="display-name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Maria"
                  maxLength={80}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") saveName(); }}
                />

              </div>
              <div className="flex gap-2">
                <Button onClick={saveName} disabled={savingName} size="sm">
                  {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setEditingName(false); setNameInput(displayName); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-display text-3xl md:text-4xl font-semibold">
                Hello {displayName || "there"}
              </h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingName(true)}
                aria-label={displayName ? "Edit name" : "Add your name"}
              >
                <Pencil className="h-4 w-4" />
                <span className="ml-1 text-sm">{displayName ? "Edit" : "Add your name"}</span>
              </Button>
            </div>
          )}
          {user?.email && <p className="text-muted-foreground text-sm">{user.email}</p>}
        </div>


        {!loading && !hasActive && (
          <div className="mb-8 rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-8 shadow-elevated">
            <div className="flex items-start gap-3 mb-4">
              <div className="rounded-full bg-primary/15 p-2.5">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-primary mb-1">Free account</div>
                <h2 className="font-display text-2xl font-semibold">Upgrade to Live Group Classes</h2>
              </div>
            </div>
            <p className="text-muted-foreground mb-5">
              Weekly live English classes with Hans — small groups, real practice, cancel anytime.
            </p>
            <div className="flex items-baseline gap-1 mb-5">
              <span className="font-display text-4xl font-semibold">$30</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <Button variant="hero" size="lg" asChild>
              <Link to="/courses/group-class/overview?checkout=1">
                Subscribe to Live Group Classes
              </Link>
            </Button>
          </div>
        )}

        <div className="bg-card rounded-3xl border border-border/60 shadow-soft overflow-hidden mb-8">
          {loading ? (
            <div className="p-12 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : (
            <div className="p-6 md:p-8">
              <h3 className="font-display text-xl font-semibold mb-4">Upcoming registered classes:</h3>

              {hasActive ? (() => {
                const isCanceling = !!sub && (sub.cancel_at_period_end === true || sub.status === "canceled");
                const endDate = isCanceling && sub?.current_period_end ? new Date(sub.current_period_end) : null;
                const slot = getSlotById(sub?.class_slot_id) ?? getSlotById(DEFAULT_SLOT_ID) ?? CLASS_SLOTS[0];
                const upcoming = getUpcomingDates(slot, 8);
                const classes = endDate ? upcoming.filter((d) => d <= endDate) : upcoming.slice(0, 5);
                if (classes.length === 0) {
                  return (
                    <p className="text-muted-foreground mb-6">
                      No upcoming classes within your current subscription period.
                    </p>
                  );
                }
                return (
                  <ul className="divide-y divide-border mb-6">
                    {classes.slice(0, 5).map((d) => (
                      <li key={d.toISOString()} className="py-3 flex items-center justify-between gap-4">
                        <div className="font-medium">
                          {d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}
                        </div>
                      </li>
                    ))}
                  </ul>
                );
              })() : (
                <p className="text-muted-foreground mb-6">You haven't registered for any group classes yet.</p>
              )}

              {!loading && oneOnOneBookings.length > 0 && (
                <>
                  <h4 className="font-display text-base font-semibold mt-4 mb-2 text-muted-foreground uppercase tracking-wider text-xs">
                    Your 1:1 lessons
                  </h4>
                  <ul className="divide-y divide-border mb-6">
                    {oneOnOneBookings.map((b) => {
                      const d = new Date(b.starts_at);
                      const label = b.product_kind === "ten-pack" ? "1:1 (10-Pack)" : "1:1";
                      return (
                        <li key={b.id} className="py-3 flex items-center justify-between gap-4">
                          <div className="font-medium">
                            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary mr-2">
                              {label}
                            </span>
                            {d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              <Button variant="hero" asChild>
                <Link to="/#courses">Available classes</Link>
              </Button>
            </div>
          )}
        </div>

        {!loading && (
          <div className="mb-8 rounded-3xl border border-border/60 bg-card p-6 md:p-8 shadow-soft">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <h2 className="font-display text-xl font-semibold">Progress & material covered</h2>
            </div>
            {studentDoc ? (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Your personal progress doc — notes, vocab, and material covered in your lessons with Hans.
                </p>
                <Button variant="outline" asChild>
                  <a href={studentDoc.google_doc_url} target="_blank" rel="noopener noreferrer">
                    Open my progress doc
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your personal progress doc will appear here after you book your first 1:1 lesson with Hans.
              </p>
            )}
          </div>
        )}


        {!loading && sub && (
          <div className="rounded-3xl border border-border/60 bg-card p-6 md:p-8 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                  Live Group Classes subscription
                </div>
                <h2 className="font-display text-xl font-semibold mb-2">
                  Status:{" "}
                  <span
                    className={
                      sub.status === "active" && !sub.cancel_at_period_end
                        ? "text-primary"
                        : sub.status === "past_due"
                        ? "text-destructive"
                        : "text-foreground"
                    }
                  >
                    {statusLabel}
                  </span>
                </h2>
                {periodEndLabel && (
                  <p className="text-sm text-muted-foreground">
                    {sub.cancel_at_period_end || sub.status === "canceled"
                      ? `Access ends on ${periodEndLabel}.`
                      : `Auto-renews on ${periodEndLabel}.`}
                  </p>
                )}
              </div>
              {(sub.status !== "canceled" || (sub.current_period_end && new Date(sub.current_period_end) > new Date())) && (
                <Button variant="outline" onClick={openPortal} disabled={portalLoading}>
                  {portalLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Manage or cancel
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 rounded-3xl border border-border/60 bg-card p-6 md:p-8 shadow-soft">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-xl font-semibold">Account settings</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-5">Change your password.</p>
          <div className="grid sm:grid-cols-2 gap-4 max-w-xl">
            <div>
              <Label htmlFor="new-password" className="text-xs text-muted-foreground">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={pw1}
                onChange={(e) => setPw1(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password" className="text-xs text-muted-foreground">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                placeholder="Repeat new password"
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={updatePassword} disabled={savingPw || !pw1 || !pw2}>
              {savingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
            </Button>
            <Button variant="outline" onClick={sendPasswordReset} disabled={sendingReset || !user?.email}>
              {sendingReset ? <Loader2 className="h-4 w-4 animate-spin" /> : "Forgot password? Email me a reset link"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
