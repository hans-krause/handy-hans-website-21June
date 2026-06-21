import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";



const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function pickCourseId(price: any, product: any): string {
  return (
    price?.lookup_key ||
    price?.metadata?.lovable_external_id ||
    product?.metadata?.lovable_external_id ||
    price?.id ||
    "unknown"
  );
}

async function syncEnv(env: StripeEnv) {
  const stripe = createStripeClient(env);
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let imported = 0;
  let skipped = 0;
  let starting_after: string | undefined;

  while (true) {
    const page: any = await stripe.checkout.sessions.list({
      limit: 100,
      ...(starting_after && { starting_after }),
    });

    for (const s of page.data) {
      if (s.status !== "complete" && s.payment_status !== "paid") {
        skipped++;
        continue;
      }

      const full: any = await stripe.checkout.sessions.retrieve(s.id, {
        expand: ["line_items.data.price.product", "customer"],
      });

      const item = full.line_items?.data?.[0];
      const price = item?.price;
      const product = price?.product && typeof price.product !== "string" ? price.product : null;
      const customer = full.customer;

      const courseId = pickCourseId(price, product);
      const courseName = product?.name || item?.description || "Course";
      const amountCents = full.amount_total ?? item?.amount_total ?? 0;
      const userId =
        full.metadata?.userId ||
        (customer && typeof customer !== "string" ? customer.metadata?.userId : null) ||
        null;
      const email =
        full.customer_details?.email ||
        full.customer_email ||
        (customer && typeof customer !== "string" ? customer.email : null) ||
        null;
      const name =
        full.customer_details?.name ||
        (customer && typeof customer !== "string" ? customer.name : null) ||
        null;

      const { error } = await admin.from("registrations").upsert(
        {
          user_id: userId,
          course_id: courseId,
          course_name: courseName,
          amount_cents: amountCents,
          status: "paid",
          stripe_session_id: full.id,
          guest_name: userId ? null : name,
          guest_email: userId ? null : email,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "stripe_session_id" },
      );
      if (error) {
        console.error("Upsert failed", full.id, error);
        skipped++;
      } else {
        imported++;
      }
    }

    if (!page.has_more) break;
    starting_after = page.data[page.data.length - 1]?.id;
    if (!starting_after) break;
  }

  return { imported, skipped };
}

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
    const auth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data: { user }, error: authErr } = await auth.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Record<string, { imported: number; skipped: number } | { error: string }> = {};
    for (const env of ["sandbox", "live"] as StripeEnv[]) {
      try {
        results[env] = await syncEnv(env);
      } catch (e) {
        results[env] = { error: e instanceof Error ? e.message : String(e) };
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
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
