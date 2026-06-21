// Adds a newly registered user to Brevo List 12 (Account Created),
// with MARKETING_OPT_IN attribute reflecting their consent checkbox.
//
// Called from the client immediately after supabase.auth.signUp succeeds.
// Authenticated via the user's JWT — we verify them server-side and read
// their profile (email, display_name, opt_in_marketing) from the DB so the
// values can't be spoofed.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { BREVO_LIST, syncBrevoContact } from "../_shared/brevo-lists.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const auth = createClient(SUPABASE_URL, ANON_KEY);
    const { data: { user }, error: authErr } = await auth.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: profile } = await admin
      .from("profiles")
      .select("email, display_name, opt_in_marketing")
      .eq("user_id", user.id)
      .maybeSingle();

    const email = (profile?.email as string | null) ?? user.email ?? null;
    if (!email) {
      return new Response(JSON.stringify({ error: "No email on file" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await syncBrevoContact({
      email,
      name: (profile?.display_name as string | null) ?? null,
      marketingOptIn: !!profile?.opt_in_marketing,
      addToLists: [BREVO_LIST.ACCOUNT_CREATED],
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("brevo-sync-signup error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
