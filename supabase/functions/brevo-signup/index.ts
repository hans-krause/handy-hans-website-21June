import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  consent: z.literal(true),
});

const BREVO_LIST_ID = 5;

async function pushToBrevo(apiKey: string, name: string, email: string) {
  const res = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      email,
      attributes: { FIRSTNAME: name, EMAIL: email },
      listIds: [BREVO_LIST_ID],
      updateEnabled: true,
    }),
  });

  if (res.ok || res.status === 204) return;

  const data = await res.json().catch(() => ({} as any));
  // If contact already exists, update their list/attributes explicitly.
  if (data?.code === "duplicate_parameter") {
    const upd = await fetch(
      `https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`,
      {
        method: "PUT",
        headers: { "api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          attributes: { FIRSTNAME: name },
          listIds: [BREVO_LIST_ID],
        }),
      },
    );
    if (!upd.ok && upd.status !== 204) {
      const updErr = await upd.text();
      throw new Error(`Brevo update failed [${upd.status}]: ${updErr}`);
    }
    return;
  }
  throw new Error(`Brevo create failed [${res.status}]: ${JSON.stringify(data)}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const brevoKey = Deno.env.get("BREVO_API_KEY");
    if (!supabaseUrl || !serviceKey) throw new Error("Server configuration error");
    if (!brevoKey) throw new Error("BREVO_API_KEY not configured");

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Please fill in all fields and tick the consent box." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const name = parsed.data.name;
    const email = parsed.data.email.toLowerCase();

    const supabase = createClient(supabaseUrl, serviceKey);

    // Push to Brevo first — Brevo's automation sends the PDF email.
    await pushToBrevo(brevoKey, name, email);

    // Record the signup (single opt-in: mark confirmed immediately).
    const { error: upsertError } = await supabase
      .from("pdf_signups")
      .upsert(
        {
          email,
          name,
          confirmed_at: new Date().toISOString(),
          confirmation_token: null,
        },
        { onConflict: "email" },
      );
    if (upsertError) {
      console.error("pdf_signups upsert failed", upsertError);
      // Brevo already has them — don't fail the user.
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("brevo-signup error:", err);
    return new Response(JSON.stringify({ success: false, error: "Something went wrong" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
