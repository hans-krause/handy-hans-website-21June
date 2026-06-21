import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { priceId, quantity, customerEmail, userId, returnUrl, environment, classSlotId, classDayLabel } = body as {
      priceId: string;
      quantity?: number;
      customerEmail?: string;
      userId?: string;
      returnUrl: string;
      environment: StripeEnv;
      classSlotId?: string;
      classDayLabel?: string;
    };

    if (!priceId || !/^[a-zA-Z0-9_-]+$/.test(priceId)) throw new Error("Invalid priceId");
    if (!returnUrl) throw new Error("Missing returnUrl");
    if (environment !== "sandbox" && environment !== "live") throw new Error("Invalid environment");
    if (classSlotId && !/^[a-zA-Z0-9_-]+$/.test(classSlotId)) throw new Error("Invalid classSlotId");
    const safeClassDayLabel = typeof classDayLabel === "string" ? classDayLabel.slice(0, 100) : undefined;

    const allowedOrigins = [
      "https://handyhansenglish.com",
      "https://www.handyhansenglish.com",
      "https://skyward-english.lovable.app",
    ];
    const isPreviewOrigin = (o: string) =>
      /^https:\/\/[a-z0-9-]+\.lovable\.app$/i.test(o) ||
      /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/i.test(o);
    let parsedReturnUrl: URL;
    try {
      parsedReturnUrl = new URL(returnUrl);
    } catch {
      throw new Error("Invalid returnUrl");
    }
    if (!allowedOrigins.includes(parsedReturnUrl.origin) && !isPreviewOrigin(parsedReturnUrl.origin)) {
      throw new Error("Invalid returnUrl");
    }

    // If a userId is supplied, require a matching authenticated session.
    // Guests can still check out by omitting userId (and customerEmail is captured by Stripe).
    let verifiedUserId: string | undefined;
    if (userId) {
      const authHeader = req.headers.get("Authorization") || "";
      const token = authHeader.replace(/^Bearer\s+/i, "");
      if (!token) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const supabaseAuth = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
      );
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
      if (authError || !user || user.id !== userId) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      verifiedUserId = user.id;
    }

    const stripe = createStripeClient(environment);

    let prices;
    try {
      prices = await stripe.prices.list({ lookup_keys: [priceId], active: true, limit: 1 });
    } catch (e) {
      console.error("stripe.prices.list failed", { priceId, error: e instanceof Error ? e.message : String(e) });
      throw new Error("Unable to load pricing. Please try again in a moment.");
    }
    const priceData = Array.isArray(prices?.data) ? prices.data : [];
    if (priceData.length === 0) {
      console.error("No Stripe price found for lookup_key", { priceId, environment });
      throw new Error(`Pricing for "${priceId}" is not configured. Please contact support.`);
    }
    const stripePrice = priceData[0];
    const isRecurring = stripePrice.type === "recurring";

    const customerId = (customerEmail || verifiedUserId)
      ? await resolveOrCreateCustomer(stripe, { email: customerEmail, userId: verifiedUserId })
      : undefined;

    let productDescription: string | undefined;
    if (!isRecurring) {
      const productId = typeof stripePrice.product === "string"
        ? stripePrice.product
        : stripePrice.product.id;
      const product = await stripe.products.retrieve(productId);
      productDescription = product.name;
    }

    const classMetadata: Record<string, string> = {};
    if (classSlotId) classMetadata.classSlotId = classSlotId;
    if (safeClassDayLabel) classMetadata.classDayLabel = safeClassDayLabel;

    const sessionMetadata: Record<string, string> = { ...classMetadata };
    if (verifiedUserId) sessionMetadata.userId = verifiedUserId;

    const subscriptionMetadata: Record<string, string> = { ...classMetadata };
    if (verifiedUserId) subscriptionMetadata.userId = verifiedUserId;

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity: quantity || 1 }],
      mode: isRecurring ? "subscription" : "payment",
      ui_mode: "embedded_page",
      return_url: returnUrl,
      payment_method_types: isRecurring
        ? ["card", "link"]
        : ["card", "link", "amazon_pay"],
      ...(customerId && { customer: customerId }),
      ...(!isRecurring && { payment_intent_data: { description: productDescription } }),
      ...(Object.keys(sessionMetadata).length > 0 && { metadata: sessionMetadata }),
      ...(isRecurring && Object.keys(subscriptionMetadata).length > 0 && {
        subscription_data: { metadata: subscriptionMetadata },
      }),
    });

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
