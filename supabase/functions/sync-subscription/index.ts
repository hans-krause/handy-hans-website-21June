import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const SERVICE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

async function sendCancellationEmails(args: {
  userId: string;
  subscriptionId: string;
  periodEnd: number | null;
  env: StripeEnv;
}) {
  const admin = createClient(SERVICE_URL, SERVICE_KEY);
  const { data: profile } = await admin
    .from("profiles")
    .select("email, display_name")
    .eq("user_id", args.userId)
    .maybeSingle();
  const email = (profile as any)?.email ?? null;
  const name = (profile as any)?.display_name ?? null;
  const accessEndDate = args.periodEnd
    ? new Date(args.periodEnd * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : undefined;

  const url = `${SERVICE_URL}/functions/v1/send-transactional-email`;
  const auth = `Bearer ${SERVICE_KEY}`;
  if (email) {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: auth },
      body: JSON.stringify({
        templateName: "subscription-canceled",
        recipientEmail: email,
        idempotencyKey: `sub-cancel-user-${args.subscriptionId}`,
        templateData: { name: name ?? undefined, accessEndDate },
      }),
    });
  }
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: auth },
    body: JSON.stringify({
      templateName: "subscription-canceled-notification",
      idempotencyKey: `sub-cancel-owner-${args.subscriptionId}`,
      templateData: { name, email, accessEndDate, environment: args.env },
    }),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const rawEnv = body?.environment;
    if (rawEnv !== "sandbox" && rawEnv !== "live") {
      return new Response(JSON.stringify({ error: "Invalid environment" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const env: StripeEnv = rawEnv;

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const auth = createClient(SERVICE_URL, ANON_KEY);
    const { data: { user }, error: authErr } = await auth.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SERVICE_URL, SERVICE_KEY);
    const { data: subs } = await admin
      .from("subscriptions")
      .select("id, stripe_subscription_id, status, cancel_at_period_end, current_period_end")
      .eq("user_id", user.id)
      .eq("environment", env)
      .order("created_at", { ascending: false });

    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ ok: true, updated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = createStripeClient(env);
    let updated = 0;

    for (const row of subs as any[]) {
      if (!row.stripe_subscription_id) continue;
      try {
        const sub: any = await stripe.subscriptions.retrieve(row.stripe_subscription_id);
        const item = sub.items?.data?.[0];
        const periodEnd = item?.current_period_end ?? sub.current_period_end ?? null;
        const periodStart = item?.current_period_start ?? sub.current_period_start ?? null;
        const wasCanceling = !!row.cancel_at_period_end || row.status === "canceled";
        const isCanceling = sub.cancel_at_period_end === true || sub.status === "canceled";

        await admin
          .from("subscriptions")
          .update({
            status: sub.status,
            cancel_at_period_end: sub.cancel_at_period_end || false,
            current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
            current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        updated++;

        if (!wasCanceling && isCanceling) {
          await sendCancellationEmails({
            userId: user.id,
            subscriptionId: sub.id,
            periodEnd,
            env,
          });
        }
      } catch (e) {
        console.error("Failed to sync sub", row.stripe_subscription_id, e);
      }
    }

    return new Response(JSON.stringify({ ok: true, updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
