import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { returnUrl, environment } = await req.json() as {
      returnUrl?: string;
      environment: StripeEnv;
    };
    if (environment !== "sandbox" && environment !== "live") throw new Error("Invalid environment");

    let validatedReturnUrl: string | undefined;
    if (returnUrl) {
      const allowedOrigins = [
        "https://handyhansenglish.com",
        "https://www.handyhansenglish.com",
        "https://skyward-english.lovable.app",
      ];
      const isPreviewOrigin = (o: string) =>
        /^https:\/\/[a-z0-9-]+\.lovable\.app$/i.test(o) ||
        /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/i.test(o);
      let parsed: URL;
      try {
        parsed = new URL(returnUrl);
      } catch {
        throw new Error("Invalid returnUrl");
      }
      if (!allowedOrigins.includes(parsed.origin) && !isPreviewOrigin(parsed.origin)) {
        throw new Error("Invalid returnUrl");
      }
      validatedReturnUrl = returnUrl;
    }

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) throw new Error("Unauthorized");

    const { data: { user }, error: authError } = await getSupabase().auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { data: sub } = await getSupabase()
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .eq("environment", environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.stripe_customer_id) throw new Error("No subscription found");

    const stripe = createStripeClient(environment);
    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id as string,
      ...(validatedReturnUrl && { return_url: validatedReturnUrl }),
    });

    return new Response(JSON.stringify({ url: portal.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    const status = msg === "Unauthorized" ? 401 : 400;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
