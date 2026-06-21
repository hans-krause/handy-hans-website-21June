import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";




type Registration = {
  id: string;
  user_id: string | null;
  course_id: string;
  course_name: string;
  amount_cents: number;
  status: string;
  created_at: string;
  guest_name: string | null;
  guest_email: string | null;
  stripe_session_id: string | null;
  class_day_label: string | null;
};

type SubRow = {
  id: string;
  user_id: string;
  status: string;
  cancel_at_period_end: boolean | null;
  current_period_end: string | null;
  environment: string;
  updated_at: string;
  class_day_label: string | null;
};

const AdminDashboard = () => {
  const { user, loading: authLoading, isAdmin, signOut } = useAuth();
  const [regs, setRegs] = useState<Registration[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { email: string; display_name: string | null }>>({});
  const [cancellations, setCancellations] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [brevoSyncing, setBrevoSyncing] = useState(false);

  const loadData = async () => {
    const { data: regData } = await supabase
      .from("registrations")
      .select("id, user_id, course_id, course_name, amount_cents, status, created_at, guest_name, guest_email, stripe_session_id, class_day_label")
      .order("created_at", { ascending: false });

    setRegs((regData as Registration[]) ?? []);

    const { data: subData } = await supabase
      .from("subscriptions")
      .select("id, user_id, status, cancel_at_period_end, current_period_end, environment, updated_at, class_day_label")
      .or("cancel_at_period_end.eq.true,status.eq.canceled")
      .order("updated_at", { ascending: false });
    setCancellations((subData as SubRow[]) ?? []);

    const userIds = Array.from(
      new Set([
        ...((regData ?? []) as Registration[]).map((r) => r.user_id),
        ...((subData ?? []) as SubRow[]).map((s) => s.user_id),
      ].filter((id): id is string => !!id)),
    );
    if (userIds.length) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_id, email, display_name")
        .in("user_id", userIds);
      const map: Record<string, { email: string; display_name: string | null }> = {};
      profileData?.forEach((p: any) => {
        map[p.user_id] = { email: p.email ?? "", display_name: p.display_name };
      });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user || !isAdmin) return;
    loadData();
  }, [user, isAdmin]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-stripe-history");
      if (error) throw error;
      const r = (data as any)?.results ?? {};
      const summary = Object.entries(r)
        .map(([env, v]: [string, any]) =>
          v.error ? `${env}: ${v.error}` : `${env}: +${v.imported} imported, ${v.skipped} skipped`,
        )
        .join(" · ");
      toast({ title: "Stripe sync complete", description: summary || "Done." });
      await loadData();
    } catch (e) {
      toast({
        title: "Sync failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const studentInfo = (r: Registration): { name: string; email: string } => {
    if (r.user_id && profiles[r.user_id]) {
      const p = profiles[r.user_id];
      return { name: p.display_name || "—", email: p.email || "—" };
    }
    return { name: r.guest_name || "—", email: r.guest_email || "—" };
  };

  const modeOf = (r: Registration): "Test" | "Live" | "—" => {
    if (!r.stripe_session_id) return "—";
    if (r.stripe_session_id.startsWith("cs_test_")) return "Test";
    if (r.stripe_session_id.startsWith("cs_live_")) return "Live";
    return "—";
  };

  const totalRevenue = regs.filter((r) => r.status === "paid").reduce((s, r) => s + r.amount_cents, 0) / 100;
  const paidCount = regs.filter((r) => r.status === "paid").length;
  const pendingCount = regs.filter((r) => r.status === "pending").length;

  return (
    <main className="min-h-screen bg-gradient-soft">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-display font-semibold">Owner dashboard</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
        </div>
      </header>

      <div className="container py-12 space-y-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold">Course bookings</h1>
            <p className="text-muted-foreground mt-2">Live data from your database.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSync} disabled={syncing} variant="outline">
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sync Historical Data
            </Button>
            <Button
              onClick={async () => {
                setBrevoSyncing(true);
                try {
                  const { data, error } = await supabase.functions.invoke("brevo-backfill-recent");
                  if (error) throw error;
                  const d = data as any;
                  toast({
                    title: "Brevo backfill complete",
                    description: `${d?.synced ?? 0} synced, ${d?.failed ?? 0} failed (of ${d?.total ?? 0}).`,
                  });
                } catch (e) {
                  toast({
                    title: "Brevo backfill failed",
                    description: e instanceof Error ? e.message : "Unknown error",
                    variant: "destructive",
                  });
                } finally {
                  setBrevoSyncing(false);
                }
              }}
              disabled={brevoSyncing}
              variant="outline"
            >
              {brevoSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Push last 4 days to Brevo
            </Button>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-medium">Total revenue</CardTitle></CardHeader>
            <CardContent><div className="font-display text-3xl font-semibold">${totalRevenue.toFixed(2)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-medium">Paid bookings</CardTitle></CardHeader>
            <CardContent><div className="font-display text-3xl font-semibold">{paidCount}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-medium">Pending</CardTitle></CardHeader>
            <CardContent><div className="font-display text-3xl font-semibold">{pendingCount}</div></CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Subscription cancellations</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : cancellations.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No cancellations.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Class day</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Access ends</TableHead>
                    <TableHead>Env</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cancellations.map((s) => {
                    const p = profiles[s.user_id];
                    const label = s.status === "canceled" ? "Canceled" : "Cancels at period end";
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{p?.display_name || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{p?.email || "—"}</TableCell>
                        <TableCell>{s.class_day_label || "—"}</TableCell>
                        <TableCell>
                          <span className="text-xs font-medium px-3 py-1 rounded-full bg-destructive/10 text-destructive">
                            {label}
                          </span>
                        </TableCell>
                        <TableCell>{s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : "—"}</TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            s.environment === "live" ? "bg-primary/10 text-primary" : "bg-orange-100 text-orange-800"
                          }`}>{s.environment}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{new Date(s.updated_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Class bookings</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : regs.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No bookings yet.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Class day</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regs.map((r) => {
                    const info = studentInfo(r);
                    const mode = modeOf(r);
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{info.name}</TableCell>
                        <TableCell className="text-muted-foreground">{info.email}</TableCell>
                        <TableCell>{r.course_name}</TableCell>
                        <TableCell>{r.class_day_label || "—"}</TableCell>
                        <TableCell>${(r.amount_cents / 100).toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                            r.status === "paid" ? "bg-primary-soft text-primary-deep" :
                            r.status === "pending" ? "bg-muted text-muted-foreground" :
                            "bg-destructive/10 text-destructive"
                          }`}>{r.status}</span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            mode === "Live" ? "bg-primary/10 text-primary" :
                            mode === "Test" ? "bg-orange-100 text-orange-800" :
                            "bg-muted text-muted-foreground"
                          }`}>{mode}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default AdminDashboard;
