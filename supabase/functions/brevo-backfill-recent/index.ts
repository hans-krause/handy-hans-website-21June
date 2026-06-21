// Admin-only: push every profile created in the last 4 days into
// Brevo List 12 (Account Created). One-time migration helper.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { BREVO_LIST, syncBrevoContact } from "../_shared/brevo-lists.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const auth = createClient(SUPABASE_URL, ANON_KEY);
    const { data: { user }, error: authErr } = await auth.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Verify admin role server-side.
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let emailsFilter: string[] | null = null;
    try {
      const body = await req.json();
      if (Array.isArray(body?.emails) && body.emails.length) {
        emailsFilter = body.emails.map((e: string) => e.toLowerCase());
      }
    } catch { /* no body */ }

    let query = admin
      .from("profiles")
      .select("email, display_name, opt_in_marketing, created_at");
    if (emailsFilter) {
      query = query.in("email", emailsFilter);
    } else {
      const cutoff = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte("created_at", cutoff);
    }
    const { data: profiles, error: pErr } = await query;
    if (pErr) throw pErr;

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];
    for (const p of (profiles ?? []) as any[]) {
      if (!p.email) continue;
      try {
        await syncBrevoContact({
          email: p.email,
          name: p.display_name ?? null,
          marketingOptIn: !!p.opt_in_marketing,
          addToLists: [BREVO_LIST.ACCOUNT_CREATED],
        });
        synced++;
      } catch (e) {
        failed++;
        errors.push(`${p.email}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, synced, failed, total: profiles?.length ?? 0, errors: errors.slice(0, 5) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("brevo-backfill-recent error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
