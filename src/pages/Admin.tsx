import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";

type AdminReg = {
  id: string;
  user_id: string;
  course_name: string;
  amount_cents: number;
  status: string;
  created_at: string;
  stripe_session_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
};

type ProfileInfo = { email: string; display_name: string | null };

const Admin = () => {
  const { signOut, user } = useAuth();
  const [regs, setRegs] = useState<AdminReg[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileInfo>>({});
  const [loading, setLoading] = useState(true);
  const [serverAdmin, setServerAdmin] = useState<boolean | null>(null);


  useEffect(() => {
    if (!user) return;
    (async () => {
      // Server-verified admin check via RLS-protected user_roles query.
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error || !data) {
        setServerAdmin(false);
        return;
      }
      setServerAdmin(true);
    })();
  }, [user]);

  useEffect(() => {
    if (serverAdmin !== true) return;
    (async () => {
      const { data: regData } = await supabase
        .from("registrations")
        .select("id, user_id, course_name, amount_cents, status, created_at, stripe_session_id, guest_name, guest_email")
        .order("created_at", { ascending: false });
      setRegs((regData as AdminReg[]) ?? []);

      const userIds = Array.from(new Set((regData ?? []).map((r) => r.user_id).filter((id): id is string => !!id)));
      if (userIds.length) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, email, display_name")
          .in("user_id", userIds);
        const map: Record<string, ProfileInfo> = {};
        profilesData?.forEach((p: any) => { map[p.user_id] = { email: p.email ?? "", display_name: p.display_name }; });
        setProfiles(map);
      }
      setLoading(false);
    })();
  }, [serverAdmin]);

  if (serverAdmin === false) return <Navigate to="/dashboard" replace />;
  if (serverAdmin === null) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const totalRevenue = regs.filter(r => r.status === "paid").reduce((s, r) => s + r.amount_cents, 0) / 100;
  const paidCount = regs.filter(r => r.status === "paid").length;
  const pendingCount = regs.filter(r => r.status === "pending").length;


  return (
    <main className="min-h-screen bg-gradient-soft">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-display font-semibold">Admin</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
        </div>
      </header>

      <div className="container py-12">
        <h1 className="font-display text-3xl md:text-4xl font-semibold mb-8">Registrations</h1>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="p-6 rounded-2xl bg-card border border-border/60">
            <div className="text-sm text-muted-foreground">Total revenue</div>
            <div className="font-display text-3xl font-semibold mt-1">${totalRevenue.toFixed(2)}</div>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border/60">
            <div className="text-sm text-muted-foreground">Paid registrations</div>
            <div className="font-display text-3xl font-semibold mt-1">{paidCount}</div>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border/60">
            <div className="text-sm text-muted-foreground">Pending</div>
            <div className="font-display text-3xl font-semibold mt-1">{pendingCount}</div>
          </div>
        </div>

        <div className="bg-card rounded-3xl border border-border/60 shadow-soft overflow-hidden">
          {loading ? (
            <div className="p-12 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : regs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No registrations yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Email</th>
                    <th className="px-6 py-4 font-medium">Course</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Mode</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {regs.map((r) => {
                    const p = r.user_id ? profiles[r.user_id] : undefined;
                    const name = p?.display_name || r.guest_name || "—";
                    const email = p?.email || r.guest_email || "—";
                    const mode = !r.stripe_session_id ? "—" :
                      r.stripe_session_id.startsWith("cs_test_") ? "Test" :
                      r.stripe_session_id.startsWith("cs_live_") ? "Live" : "—";
                    return (
                      <tr key={r.id}>
                        <td className="px-6 py-4 font-medium">{name}</td>
                        <td className="px-6 py-4 text-muted-foreground">{email}</td>
                        <td className="px-6 py-4">{r.course_name}</td>
                        <td className="px-6 py-4">${(r.amount_cents / 100).toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                            r.status === "paid" ? "bg-primary-soft text-primary-deep" :
                            r.status === "pending" ? "bg-muted text-muted-foreground" :
                            "bg-destructive/10 text-destructive"
                          }`}>{r.status}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            mode === "Live" ? "bg-primary/10 text-primary" :
                            mode === "Test" ? "bg-orange-100 text-orange-800" :
                            "bg-muted text-muted-foreground"
                          }`}>{mode}</span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Admin;
