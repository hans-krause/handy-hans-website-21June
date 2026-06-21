import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Seo } from "@/components/site/Seo";
import { Button } from "@/components/ui/button";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { StripeEmbeddedCheckoutComponent } from "@/components/StripeEmbeddedCheckout";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Check, Clock, Globe, BookOpen, Users, Video } from "lucide-react";
import avatarAsset from "@/assets/avatar_circle.png.asset.json";
import { CLASS_SLOTS, type ClassSlot } from "@/lib/classSlots";
import { supabase } from "@/integrations/supabase/client";

const SLOT_CAPACITY: Record<string, number> = {
  "thu-1200-gmt": 12,
  "sat-1100-gmt": 12,
};

const SLOT_FULL_LABEL = "fully booked";

const PRICE_ID = "group_class_monthly_30";

type Slot = ClassSlot;

// Localised time-of-day for a given slot (in the viewer's TZ).
function getViewerLocalTime(slot: Slot) {
  const now = new Date();
  const ref = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), slot.utcHour, slot.utcMinute, 0),
  );
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(ref);
  return { time, tz };
}

// Returns the next occurrence of `slot` (at its UTC time) from `from`.
function getNextClassDate(slot: Slot, from: Date = new Date()): Date {
  const d = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), slot.utcHour, slot.utcMinute, 0),
  );
  const day = d.getUTCDay();
  let diff = (slot.weekday - day + 7) % 7;
  if (diff === 0 && from.getTime() >= d.getTime()) diff = 7;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

function useCountdown(target: Date) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

const includes = [
  { icon: Video, text: "Live on Zoom – 60-minute classes with Hans" },
  { icon: BookOpen, text: "Intermediate level material B1/B2" },
  { icon: Users, text: "Intimate group sizes (typically 6-8 students)" },
  { icon: Check, text: "Practise speaking & listening" },
  { icon: Check, text: "Learn new vocabulary, expressions & slang" },
  { icon: Check, text: "New topics every week (e.g. time, countries, prepositions, article reading, and more)" },
  { icon: Check, text: "Access to messaging forum to connect with peers " },
  { icon: Check, text: "Class notes and material provided" },
];

const CountdownBlock = ({ slot }: { slot: Slot }) => {
  const target = useMemo(() => getNextClassDate(slot), [slot]);
  const { days, hours, minutes, seconds } = useCountdown(target);

  const WEEK = 7 * 24 * 60 * 60;
  const remaining = days * 86400 + hours * 3600 + minutes * 60 + seconds;
  // Fraction of time still remaining (1 at start of week, 0 when class begins).
  const remainingFrac = Math.min(1, Math.max(0, remaining / WEEK));

  const size = 72;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - remainingFrac);

  const dateLabel = useMemo(() => {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(target);
  }, [target]);

  return (
    <div className="mt-4 flex items-center gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">Next group class:</p>
        <p className="text-sm text-foreground/90">{dateLabel}</p>
      </div>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="hsl(var(--muted))"
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="hsl(var(--primary))"
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-xs font-semibold tabular-nums text-foreground whitespace-nowrap">
            {days}d {hours}h
          </span>
        </div>
      </div>
    </div>
  );
};

const GroupClassOverviewPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCheckout, setShowCheckout] = useState(false);
  const [slotCounts, setSlotCounts] = useState<Record<string, number>>({});

  // Fetch live (paid) subscriber counts per slot to enforce capacity caps.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        CLASS_SLOTS.map(async (s) => {
          const { data } = await supabase.rpc("count_active_class_subscribers", {
            slot_id: s.id,
            env: "live",
          });
          return [s.id, (data as number) ?? 0] as const;
        }),
      );
      if (!cancelled) setSlotCounts(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const slotsWithCapacity = useMemo<ClassSlot[]>(
    () =>
      CLASS_SLOTS.map((s) => {
        const cap = SLOT_CAPACITY[s.id];
        const full = cap !== undefined && (slotCounts[s.id] ?? 0) >= cap;
        if (full && !s.disabled) {
          return { ...s, disabled: true, disabledLabel: SLOT_FULL_LABEL };
        }
        return s;
      }),
    [slotCounts],
  );

  const [slotId, setSlotId] = useState<string>(CLASS_SLOTS[0].id);
  const selectedSlot = useMemo(
    () => slotsWithCapacity.find((s) => s.id === slotId) ?? slotsWithCapacity[0],
    [slotId, slotsWithCapacity],
  );
  const selectedFull = !!selectedSlot.disabled;
  const { time, tz } = useMemo(() => getViewerLocalTime(selectedSlot), [selectedSlot]);

  // Auto-open checkout if returning from /auth?checkout=1 once logged in.
  useEffect(() => {
    if (user && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("checkout") === "1") {
        setShowCheckout(true);
        params.delete("checkout");
        const qs = params.toString();
        window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
      }
    }
  }, [user]);

  const handleSubscribeClick = () => {
    if (selectedFull) return;
    if (!user) {
      navigate("/auth?redirect=/courses/group-class/overview&checkout=1");
      return;
    }
    setShowCheckout(true);
  };

  const returnUrl = `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`;

  return (
    <main className="min-h-screen bg-background">
      <Seo
        title="Group English Classes — $30/month live with Hans"
        description="Live weekly group English class on Zoom with Hans. Small intermediate groups, British English pronunciation, vocab and conversation. $30/month, cancel anytime."
        path="/courses/group-class/overview"
      />
      <PaymentTestModeBanner />
      <Navbar />

      <div className="pt-28 pb-20">
        <div className="container max-w-5xl">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to classes
          </Link>

          <div className="flex flex-col items-center text-center mb-10">
            <img
              src={avatarAsset.url}
              alt="Hans, English coach"
              className="w-44 h-44 md:w-56 md:h-56 rounded-full object-cover shadow-elevated mb-6 border-4 border-background"
              loading="eager"
            />
            <span className="text-sm font-medium text-primary uppercase tracking-wider">
              Group English Classes
            </span>
            <h1 className="font-display text-3xl md:text-5xl font-semibold mt-3 mb-4">
              Live Classes with Hans
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto whitespace-pre-line">
              Join a small group of intermediate learners online every week{"\n"}and build natural, confident English.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-8 lg:gap-12">
            {/* LEFT: details */}
            <div className="md:col-span-3 space-y-8">
              <div className="rounded-3xl border border-border/60 bg-gradient-card p-6 md:p-8 shadow-soft">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display text-xl font-semibold mb-1">Class time</h2>
                    <p className="text-sm text-muted-foreground mb-2">
                      Choose your weekly slot:
                    </p>
                    <Select value={slotId} onValueChange={setSlotId}>
                      <SelectTrigger className="w-full sm:w-72 bg-background">
                        <SelectValue placeholder="Select a class time" />
                      </SelectTrigger>
                      <SelectContent>
                        {slotsWithCapacity.map((s) => (
                          <SelectItem key={s.id} value={s.id} disabled={s.disabled}>
                            {s.label}
                            {s.disabled && s.disabledLabel ? ` – ${s.disabledLabel}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                      <Globe className="h-3.5 w-3.5" />
                      <span className="text-foreground/80">In your timezone: {time}</span>
                      <span>({tz})</span>
                    </p>
                    <CountdownBlock slot={selectedSlot} />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="font-display text-2xl font-semibold mb-4">What's included</h2>
                <ul className="space-y-3">
                  {includes.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-start gap-3 text-foreground/85">
                      <Icon className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* RIGHT: pricing / checkout */}
            <div className="md:col-span-2">
              <div className="sticky top-24 rounded-3xl border border-border/60 bg-card shadow-elevated p-6 md:p-8">
                {!showCheckout ? (
                  <>
                    <div className="text-center">
                      <div className="font-display text-5xl font-semibold text-foreground">
                        $30
                        <span className="text-lg font-normal text-muted-foreground">/month</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Monthly subscription · cancel anytime
                      </p>
                    </div>

                    <Button
                      variant="hero"
                      size="lg"
                      className="w-full mt-6"
                      onClick={handleSubscribeClick}
                      disabled={selectedFull}
                    >
                      {selectedFull ? "Currently unavailable" : "Subscribe now"}
                    </Button>

                    <p className="mt-4 text-xs text-center text-muted-foreground">
                      Secure checkout. You can cancel from your account at any time.
                    </p>
                  </>
                ) : (
                  <div>
                    <h3 className="font-display text-lg font-semibold mb-4 text-center">
                      Complete your subscription
                    </h3>
                    <StripeEmbeddedCheckoutComponent
                      priceId={PRICE_ID}
                      customerEmail={user?.email ?? undefined}
                      userId={user?.id}
                      returnUrl={returnUrl}
                      classSlotId={selectedSlot.id}
                      classDayLabel={selectedSlot.label}
                    />
                    <button
                      onClick={() => setShowCheckout(false)}
                      className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default GroupClassOverviewPage;
