import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient, verifyWebhook } from "../_shared/stripe.ts";
import { BREVO_LIST, CURRENT_STUDENT_LIST_IDS, currentStudentsListForSlot, syncBrevoContact } from "../_shared/brevo-lists.ts";

async function syncBrevoForUser(
  userId: string | null | undefined,
  args: { addToLists?: number[]; removeFromLists?: number[] },
) {
  if (!userId) return;
  try {
    const { data: profile } = await getSupabase()
      .from("profiles")
      .select("email, display_name, opt_in_marketing")
      .eq("user_id", userId)
      .maybeSingle();
    const email = profile?.email as string | null | undefined;
    if (!email) return;
    await syncBrevoContact({
      email,
      name: (profile?.display_name as string | null) ?? null,
      marketingOptIn: !!profile?.opt_in_marketing,
      addToLists: args.addToLists,
      removeFromLists: args.removeFromLists,
    });
  } catch (e) {
    console.error("Brevo list sync failed for user", userId, e);
  }
}



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

async function sendWelcomeEmail(email: string | null | undefined, name?: string | null, classDay?: string | null) {
  if (!email) return;
  try {
    const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-transactional-email`;
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        templateName: "group-class-welcome",
        recipientEmail: email,
        templateData: { name: name ?? undefined, classDay: classDay ?? undefined },
      }),
    });
  } catch (e) {
    console.error("Failed to send welcome email", e);
  }
}

async function sendOwnerSignupNotification(args: {
  name?: string | null;
  email?: string | null;
  courseName?: string;
  amountCents?: number | null;
  currency?: string | null;
  environment: string;
  idempotencyKey: string;
  classDay?: string | null;
}) {
  try {
    const amount = args.amountCents != null
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: (args.currency || "usd").toUpperCase() }).format(args.amountCents / 100)
      : undefined;
    const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-transactional-email`;
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        templateName: "group-class-signup-notification",
        idempotencyKey: args.idempotencyKey,
        templateData: {
          name: args.name ?? undefined,
          email: args.email ?? undefined,
          courseName: args.courseName,
          amount,
          environment: args.environment,
          classDay: args.classDay ?? undefined,
        },
      }),
    });
  } catch (e) {
    console.error("Failed to send owner signup notification", e);
  }
}

function priceIdOf(item: any): string | null {
  return item?.price?.lookup_key
    || item?.price?.metadata?.lovable_external_id
    || item?.price?.id
    || null;
}

async function handleSubscriptionCreated(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata", { id: subscription.id });
    return;
  }
  const item = subscription.items?.data?.[0];
  const priceId = priceIdOf(item);
  const productId = typeof item?.price?.product === "string" ? item.price.product : item?.price?.product?.id;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  const classSlotId = subscription.metadata?.classSlotId || null;
  const classDayLabel = subscription.metadata?.classDayLabel || null;

  const { data: existing } = await getSupabase()
    .from("subscriptions")
    .select("id, class_slot_id, class_day_label")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  // Preserve previously-stored class info if Stripe metadata is missing on renewal events.
  const finalClassSlotId = classSlotId ?? (existing?.class_slot_id ?? null);
  const finalClassDayLabel = classDayLabel ?? (existing?.class_day_label ?? null);

  await getSupabase().from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      product_id: productId,
      price_id: priceId,
      status: subscription.status,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      environment: env,
      class_slot_id: finalClassSlotId,
      class_day_label: finalClassDayLabel,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );

  // Send welcome email + owner notification only on first creation, for active/trialing subs.
  if (!existing && (subscription.status === "active" || subscription.status === "trialing")) {
    let email: string | null = null;
    let name: string | null = null;
    const { data: profile } = await getSupabase()
      .from("profiles")
      .select("email, display_name")
      .eq("user_id", userId)
      .maybeSingle();
    email = profile?.email ?? null;
    name = profile?.display_name ?? null;
    await sendWelcomeEmail(email, name, finalClassDayLabel);
    await sendOwnerSignupNotification({
      name,
      email,
      courseName: "Group English Classes — Monthly",
      amountCents: item?.price?.unit_amount ?? null,
      currency: item?.price?.currency ?? "usd",
      environment: env,
      idempotencyKey: `owner-signup-${subscription.id}`,
      classDay: finalClassDayLabel,
    });
  }

  // Add to the slot-specific "Current Group Class Students" list (THUR or SAT)
  // whenever the subscription is active/trialing. Remove from "Account Created"
  // and from the OTHER slot's list (in case they switched days).
  if (subscription.status === "active" || subscription.status === "trialing") {
    const targetList = currentStudentsListForSlot(finalClassSlotId);
    const otherCurrentLists = CURRENT_STUDENT_LIST_IDS.filter((id) => id !== targetList);
    await syncBrevoForUser(userId, {
      addToLists: [targetList],
      removeFromLists: [BREVO_LIST.ACCOUNT_CREATED, ...otherCurrentLists],
    });
  }
}

async function handleSubscriptionUpdated(subscription: any, env: StripeEnv) {
  const item = subscription.items?.data?.[0];
  const priceId = priceIdOf(item);
  const productId = typeof item?.price?.product === "string" ? item.price.product : item?.price?.product?.id;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  // Read previous state so we can detect a fresh cancellation
  const { data: prev } = await getSupabase()
    .from("subscriptions")
    .select("cancel_at_period_end, status, user_id, class_day_label")
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env)
    .maybeSingle();

  await getSupabase()
    .from("subscriptions")
    .update({
      status: subscription.status,
      product_id: productId,
      price_id: priceId,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);

  const wasCanceling = !!prev?.cancel_at_period_end || prev?.status === "canceled";
  const isCanceling = subscription.cancel_at_period_end === true || subscription.status === "canceled";
  if (!wasCanceling && isCanceling) {
    const cancelUserId = (prev?.user_id as string | undefined) ?? subscription.metadata?.userId;
    await sendCancellationEmails({
      userId: cancelUserId,
      subscriptionId: subscription.id,
      periodEnd,
      env,
      classDay: (prev?.class_day_label as string | undefined) ?? subscription.metadata?.classDayLabel ?? null,
    });
    // NOTE: do NOT move Brevo lists here. Cancellation only schedules the end
    // of the subscription — the student keeps access (and their place in the
    // group's Brevo list) until the period actually expires. The move to
    // List 14 (Alumni) happens in handleSubscriptionDeleted.
  }
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  const { data: prev } = await getSupabase()
    .from("subscriptions")
    .select("cancel_at_period_end, status, user_id, class_day_label")
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env)
    .maybeSingle();

  await getSupabase()
    .from("subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);

  const wasCanceling = !!prev?.cancel_at_period_end || prev?.status === "canceled";
  const cancelUserId = (prev?.user_id as string | undefined) ?? subscription.metadata?.userId;
  if (!wasCanceling) {
    // Sudden cancellation (no prior cancel_at_period_end signal) — send emails too.
    await sendCancellationEmails({
      userId: cancelUserId,
      subscriptionId: subscription.id,
      periodEnd: subscription.items?.data?.[0]?.current_period_end ?? subscription.current_period_end ?? null,
      env,
      classDay: (prev?.class_day_label as string | undefined) ?? subscription.metadata?.classDayLabel ?? null,
    });
  }
  // Subscription is now actually over — move them out of BOTH current-student
  // lists (THUR + SAT) and into the Alumni list.
  await syncBrevoForUser(cancelUserId, {
    addToLists: [BREVO_LIST.ALUMNI],
    removeFromLists: CURRENT_STUDENT_LIST_IDS,
  });
}

async function sendCancellationEmails(args: {
  userId?: string | null;
  subscriptionId: string;
  periodEnd: number | null | undefined;
  env: StripeEnv;
  classDay?: string | null;
}) {
  let email: string | null = null;
  let name: string | null = null;
  if (args.userId) {
    const { data: profile } = await getSupabase()
      .from("profiles")
      .select("email, display_name")
      .eq("user_id", args.userId)
      .maybeSingle();
    email = profile?.email ?? null;
    name = profile?.display_name ?? null;
  }
  const accessEndDate = args.periodEnd
    ? new Date(args.periodEnd * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : undefined;

  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-transactional-email`;
  const auth = `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`;

  try {
    if (email) {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: auth },
        body: JSON.stringify({
          templateName: "subscription-canceled",
          recipientEmail: email,
          idempotencyKey: `sub-cancel-user-${args.subscriptionId}`,
          templateData: { name: name ?? undefined, accessEndDate, classDay: args.classDay ?? undefined },
        }),
      });
    }
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: auth },
      body: JSON.stringify({
        templateName: "subscription-canceled-notification",
        idempotencyKey: `sub-cancel-owner-${args.subscriptionId}`,
        templateData: { name, email, accessEndDate, environment: args.env, classDay: args.classDay ?? undefined },
      }),
    });
  } catch (e) {
    console.error("Failed to send cancellation emails", e);
  }
}


export async function upsertRegistrationFromSession(session: any, env: StripeEnv) {
  if (session.payment_status && session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    return;
  }

  const stripe = createStripeClient(env);

  // Hydrate line items + customer to derive course + buyer info
  const full = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["line_items.data.price.product", "customer"],
  });

  const item = (full as any).line_items?.data?.[0];
  const price = item?.price;
  const product = price?.product && typeof price.product !== "string" ? price.product : null;

  const courseId =
    price?.lookup_key ||
    price?.metadata?.lovable_external_id ||
    product?.metadata?.lovable_external_id ||
    price?.id ||
    "unknown";
  const courseName = product?.name || item?.description || "Course";
  const amountCents = full.amount_total ?? item?.amount_total ?? 0;

  const customer = (full as any).customer;
  const userId =
    full.metadata?.userId ||
    (customer && typeof customer !== "string" ? customer.metadata?.userId : null) ||
    null;

  const guestEmail =
    full.customer_details?.email ||
    full.customer_email ||
    (customer && typeof customer !== "string" ? customer.email : null) ||
    null;
  const guestName =
    full.customer_details?.name ||
    (customer && typeof customer !== "string" ? customer.name : null) ||
    null;

  const classSlotId = (full.metadata?.classSlotId as string | undefined) || null;
  const classDayLabel = (full.metadata?.classDayLabel as string | undefined) || null;

  await getSupabase().from("registrations").upsert(
    {
      user_id: userId,
      course_id: courseId,
      course_name: courseName,
      amount_cents: amountCents,
      status: "paid",
      stripe_session_id: full.id,
      guest_name: userId ? null : guestName,
      guest_email: userId ? null : guestEmail,
      class_slot_id: classSlotId,
      class_day_label: classDayLabel,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_session_id" },
  );
}

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  try {
    await upsertRegistrationFromSession(session, env);
  } catch (e) {
    console.error("Failed to upsert registration from session", session?.id, e);
    throw e;
  }
}



Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    console.error("Invalid env query param:", rawEnv);
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  const env: StripeEnv = rawEnv;
  try {
    const event = await verifyWebhook(req, env);
    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object, env);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object, env);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object, env);
        break;
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await handleCheckoutCompleted(event.data.object, env);
        break;
      default:
        console.log("Unhandled event:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
