import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  token: z.string().trim().min(16).max(128),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    if (!supabaseUrl || !serviceKey) throw new Error("Server configuration error");
    if (!BREVO_API_KEY) throw new Error("BREVO_API_KEY not configured");

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ success: false, error: "Invalid token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = parsed.data.token;

    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: signup, error: lookupErr } = await supabase
      .from("pdf_signups")
      .select("id, email, name, confirmed_at, confirmation_sent_at")
      .eq("confirmation_token", token)
      .maybeSingle();

    if (lookupErr) throw lookupErr;
    if (!signup) {
      return new Response(
        JSON.stringify({ success: false, error: "This confirmation link is invalid or has expired." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Token expires after 24 hours.
    const sentAt = signup.confirmation_sent_at ? new Date(signup.confirmation_sent_at).getTime() : 0;
    if (Date.now() - sentAt > 24 * 60 * 60 * 1000) {
      return new Response(
        JSON.stringify({ success: false, error: "This confirmation link has expired. Please sign up again." }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Idempotent: if already confirmed, treat as success.
    if (!signup.confirmed_at) {
      // Add to Brevo list.
      const res = await fetch("https://api.brevo.com/v3/contacts", {
        method: "POST",
        headers: {
          "api-key": BREVO_API_KEY,
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          email: signup.email,
          attributes: { FIRSTNAME: signup.name, EMAIL: signup.email },
          listIds: [5],
          updateEnabled: true,
        }),
      });

      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({} as any));
        if (data?.code === "duplicate_parameter") {
          const upd = await fetch(
            `https://api.brevo.com/v3/contacts/${encodeURIComponent(signup.email)}`,
            {
              method: "PUT",
              headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json" },
              body: JSON.stringify({ attributes: { FIRSTNAME: signup.name }, listIds: [5] }),
            },
          );
          if (!upd.ok && upd.status !== 204) {
            const updErr = await upd.text();
            throw new Error(`Brevo update failed [${upd.status}]: ${updErr}`);
          }
        } else {
          throw new Error(`Brevo create failed [${res.status}]: ${JSON.stringify(data)}`);
        }
      }

      const { error: confirmErr } = await supabase
        .from("pdf_signups")
        .update({ confirmed_at: new Date().toISOString(), confirmation_token: null })
        .eq("id", signup.id);
      if (confirmErr) throw confirmErr;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("confirm-pdf-signup error:", err);
    return new Response(JSON.stringify({ success: false, error: "Something went wrong" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
