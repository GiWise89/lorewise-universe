import { env } from "@/lib/netlifyRuntime";

import { getStripeConfiguration, retrieveStripeInvoicePaymentIntent, sha256Hex, verifyStripeWebhook, type StripeRuntimeEnv } from "@/lib/stripe";
import { ensureCommerceTables } from "@/lib/commerceServer";
import { grantPaidInvoiceCredits, revokeUnusedInvoiceBenefits } from "@/lib/benefitEngine";
import { queueAndAttemptTransactionalEmail, type TransactionalTemplate } from "@/lib/transactionalEmail";
import { getHorrorArtworkBundle } from "@/lib/horrorArtworkBundles";

type RuntimeEnv = StripeRuntimeEnv & { DB?: D1Database; RESEND_API_KEY?: string; LOREWISE_EMAIL_SENDER_NAME?: string; LOREWISE_EMAIL_SENDER_ADDRESS?: string; LOREWISE_EMAIL_REPLY_TO?: string };
type StripeCheckoutSession = {
  id?: string; payment_status?: string; payment_intent?: string | null; amount_total?: number | null;
  currency?: string | null; metadata?: Record<string, string>; refunded?: boolean; status?: string;
  subscription?: string | null; current_period_end?: number; cancel_at_period_end?: boolean;
  amount_paid?: number; period_start?: number; period_end?: number;
  billing_reason?: string | null;
  parent?: { type?: string; subscription_details?: { subscription?: string | null; metadata?: Record<string, string> } | null } | null;
  lines?: { data?: Array<{ period?: { start?: number; end?: number } | null }> } | null;
};
type StripeEvent = { id?: string; type?: string; data?: { object?: StripeCheckoutSession } };

async function notifyOrder(database: D1Database, runtime: RuntimeEnv, orderId: string, template: TransactionalTemplate, suffix: string, extra: Record<string, string> = {}) {
  const row = await database.prepare(`SELECT orders.id, orders.reference_code, orders.total_cents, orders.currency,
    customers.id AS customer_id, customers.email, customers.display_name,
    COALESCE(MAX(order_items.title), orders.reference_code) AS item_title,
    COALESCE(MAX(order_items.metadata_json), '{}') AS item_metadata
    FROM orders JOIN customers ON customers.id = orders.customer_id
    LEFT JOIN order_items ON order_items.order_id = orders.id WHERE orders.id = ? GROUP BY orders.id LIMIT 1`)
    .bind(orderId).first<{ id: string; reference_code: string; total_cents: number; currency: string; customer_id: string; email: string; display_name: string | null; item_title: string; item_metadata: string }>();
  if (!row) return;
  let deliveryMode = "automatic";
  let collectionSize: number | undefined;
  try {
    const metadata = JSON.parse(row.item_metadata) as { deliveryMode?: unknown; bundleMembers?: unknown };
    if (metadata.deliveryMode === "manual") deliveryMode = "manual";
    if (Array.isArray(metadata.bundleMembers) && metadata.bundleMembers.length > 1) collectionSize = metadata.bundleMembers.length;
  } catch { /* I vecchi ordini non contengono ancora la modalità di consegna. */ }
  const origin = runtime.NEXT_PUBLIC_SITE_URL?.trim() || "https://lorewisenexus.it";
  await queueAndAttemptTransactionalEmail(database, runtime, {
    eventKey: `${template}:${orderId}:${suffix}`,
    customerId: row.customer_id,
    recipientEmail: row.email,
    template,
    payload: {
      name: row.display_name || undefined,
      referenceCode: row.reference_code,
      title: row.item_title,
      amountLabel: new Intl.NumberFormat("it-IT", { style: "currency", currency: row.currency }).format(row.total_cents / 100),
      accountUrl: `${origin}/account`,
      detailUrl: `${origin}/account/ordini/${encodeURIComponent(row.reference_code)}`,
      deliveryMode,
      collectionSize,
      ...extra,
    },
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (rawBody.length > 1_000_000) return Response.json({ error: "Evento troppo grande." }, { status: 413 });
  const signature = request.headers.get("stripe-signature") ?? "";
  let runtime: RuntimeEnv;
  try {
    runtime = env as unknown as RuntimeEnv;
  } catch {
    return Response.json({ error: "Webhook Stripe non configurato." }, { status: 503 });
  }
  const stripe = getStripeConfiguration(runtime);
  if (!runtime.DB || !stripe.configured) return Response.json({ error: stripe.blockers[0] || "Webhook Stripe non configurato." }, { status: 503 });
  const database = runtime.DB;
  await ensureCommerceTables(database);
  if (!await verifyStripeWebhook(rawBody, signature, stripe.webhookSecret)) return Response.json({ error: "Firma webhook non valida." }, { status: 400 });

  let event: StripeEvent;
  try { event = JSON.parse(rawBody) as StripeEvent; } catch { return Response.json({ error: "Evento non valido." }, { status: 400 }); }
  if (!event.id || !event.type) return Response.json({ error: "Evento incompleto." }, { status: 400 });
  const prior = await runtime.DB.prepare("SELECT processing_status FROM payment_events WHERE provider_event_id = ?")
    .bind(event.id).first<{ processing_status: string }>();
  if (prior) return Response.json({ received: true, duplicate: true });

  const payloadHash = await sha256Hex(rawBody);
  if (["customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
    const subscription = event.data?.object;
    const subscriptionId = subscription?.id;
    if (!subscriptionId || !/^sub_[A-Za-z0-9_]+$/.test(subscriptionId)) return Response.json({ error: "Evento abbonamento incompleto." }, { status: 400 });
    const existing = await runtime.DB.prepare("SELECT id FROM subscriptions WHERE stripe_subscription_id = ? LIMIT 1")
      .bind(subscriptionId).first<{ id: string }>();
    if (!existing) return Response.json({ error: "Abbonamento non associato a LoreWise." }, { status: 409 });
    const nextStatus = event.type === "customer.subscription.deleted" ? "canceled" : (subscription.status ?? "incomplete");
    const periodEnd = Number.isFinite(subscription.current_period_end)
      ? new Date(Number(subscription.current_period_end) * 1000).toISOString()
      : null;
    await runtime.DB.batch([
      runtime.DB.prepare(`INSERT INTO payment_events (id, provider_event_id, event_type, processing_status, payload_hash, processed_at)
        VALUES (?, ?, ?, 'processed', ?, CURRENT_TIMESTAMP)`).bind(crypto.randomUUID(), event.id, event.type, payloadHash),
      runtime.DB.prepare(`UPDATE subscriptions SET status = ?, current_period_end = COALESCE(?, current_period_end),
        cancel_at_period_end = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .bind(nextStatus, periodEnd, subscription.cancel_at_period_end ? 1 : 0, existing.id),
    ]);
    return Response.json({ received: true, subscriptionUpdated: true });
  }
  if (["invoice.payment_succeeded", "invoice.payment_failed"].includes(event.type)) {
    const invoice = event.data?.object;
    const invoiceSubscriptionId = typeof invoice?.subscription === "string"
      ? invoice.subscription
      : invoice?.parent?.type === "subscription_details" && typeof invoice.parent.subscription_details?.subscription === "string"
        ? invoice.parent.subscription_details.subscription
        : null;
    if (!invoice?.id || !invoiceSubscriptionId || !/^sub_[A-Za-z0-9_]+$/.test(invoiceSubscriptionId)) {
      return Response.json({ error: "Fattura abbonamento incompleta." }, { status: 400 });
    }
    let subscription = await runtime.DB.prepare("SELECT id, order_id, customer_id, plan_code FROM subscriptions WHERE stripe_subscription_id = ? LIMIT 1")
      .bind(invoiceSubscriptionId).first<{ id: string; order_id: string | null; customer_id: string; plan_code: string }>();
    if (!subscription) {
      const metadata = invoice.parent?.subscription_details?.metadata;
      const orderId = metadata?.order_id;
      const planCode = metadata?.product_code;
      if (!orderId || metadata?.product_type !== "subscription" || !planCode) {
        return Response.json({ error: "Fattura non associata a un abbonamento LoreWise." }, { status: 409 });
      }
      const order = await runtime.DB.prepare(`SELECT orders.id, orders.customer_id, order_items.product_code
        FROM orders JOIN order_items ON order_items.order_id = orders.id
        WHERE orders.id = ? AND orders.order_type = 'subscription' LIMIT 1`).bind(orderId)
        .first<{ id: string; customer_id: string; product_code: string }>();
      if (!order || order.product_code !== planCode) return Response.json({ error: "Fattura e ordine LoreWise non corrispondono." }, { status: 409 });
      const subscriptionId = crypto.randomUUID();
      await runtime.DB.prepare(`INSERT INTO subscriptions (id, customer_id, order_id, plan_code, status, stripe_subscription_id,
        cancel_at_period_end, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(stripe_subscription_id) DO NOTHING`)
        .bind(subscriptionId, order.customer_id, order.id, planCode, invoiceSubscriptionId).run();
      subscription = await runtime.DB.prepare("SELECT id, order_id, customer_id, plan_code FROM subscriptions WHERE stripe_subscription_id = ? LIMIT 1")
        .bind(invoiceSubscriptionId).first<{ id: string; order_id: string | null; customer_id: string; plan_code: string }>();
      if (!subscription) return Response.json({ error: "Abbonamento LoreWise non creato." }, { status: 409 });
    }
    const succeeded = event.type === "invoice.payment_succeeded";
    const invoiceLinePeriod = invoice.lines?.data?.[0]?.period;
    const rawPeriodStart = Number.isFinite(invoiceLinePeriod?.start) ? invoiceLinePeriod?.start : invoice.period_start;
    const rawPeriodEnd = Number.isFinite(invoiceLinePeriod?.end) ? invoiceLinePeriod?.end : invoice.period_end;
    const periodStart = Number.isFinite(rawPeriodStart) ? new Date(Number(rawPeriodStart) * 1000).toISOString() : null;
    const periodEnd = Number.isFinite(rawPeriodEnd) ? new Date(Number(rawPeriodEnd) * 1000).toISOString() : null;
    let paymentIntent = typeof invoice.payment_intent === "string" ? invoice.payment_intent : null;
    if (succeeded && !paymentIntent) {
      try { paymentIntent = await retrieveStripeInvoicePaymentIntent({ secretKey: stripe.secretKey, invoiceId: invoice.id }); }
      catch { paymentIntent = null; }
    }
    if (succeeded) {
      await grantPaidInvoiceCredits(runtime.DB, {
        invoiceId: invoice.id,
        subscriptionId: subscription.id,
        customerId: subscription.customer_id,
        planCode: subscription.plan_code,
        periodEnd,
      });
    }
    await runtime.DB.batch([
      runtime.DB.prepare(`INSERT INTO payment_events (id, provider_event_id, event_type, processing_status, payload_hash, processed_at)
        VALUES (?, ?, ?, 'processed', ?, CURRENT_TIMESTAMP)`).bind(crypto.randomUUID(), event.id, event.type, payloadHash),
      runtime.DB.prepare(`INSERT INTO subscription_invoices (id, subscription_id, stripe_invoice_id, stripe_payment_intent_id,
        amount_paid_cents, currency, status, period_start, period_end, paid_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(stripe_invoice_id) DO UPDATE SET stripe_payment_intent_id = excluded.stripe_payment_intent_id,
        amount_paid_cents = excluded.amount_paid_cents, currency = excluded.currency, status = excluded.status,
        period_start = excluded.period_start, period_end = excluded.period_end, paid_at = excluded.paid_at, updated_at = CURRENT_TIMESTAMP`)
        .bind(crypto.randomUUID(), subscription.id, invoice.id, paymentIntent, Math.max(0, Number(invoice.amount_paid ?? 0)),
          (invoice.currency ?? "eur").toUpperCase(), succeeded ? "paid" : "failed", periodStart, periodEnd, succeeded ? new Date().toISOString() : null),
      runtime.DB.prepare(`UPDATE subscriptions SET status = ?, current_period_end = COALESCE(?, current_period_end),
        updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(succeeded ? "active" : "past_due", periodEnd, subscription.id),
      ...(succeeded && subscription.order_id && paymentIntent ? [runtime.DB.prepare(`UPDATE orders SET stripe_payment_intent_id = COALESCE(stripe_payment_intent_id, ?),
        updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(paymentIntent, subscription.order_id)] : []),
    ]);
    const invoiceOrderId = subscription.order_id;
    if (invoiceOrderId && (!succeeded || invoice.billing_reason !== "subscription_create")) await notifyOrder(runtime.DB, runtime, invoiceOrderId,
      succeeded ? "subscription_renewed" : "subscription_payment_failed", invoice.id, {
        planLabel: subscription.plan_code.replace("LW-PASS-", "Universe Pass "),
        periodLabel: periodStart && periodEnd ? `${periodStart.slice(0, 10)} - ${periodEnd.slice(0, 10)}` : "",
      });
    return Response.json({ received: true, subscriptionInvoiceRecorded: true, status: succeeded ? "paid" : "failed" });
  }
  const refundSucceeded = event.type === "charge.refunded" || (event.type === "refund.updated" && event.data?.object?.status === "succeeded");
  const disputeCreated = event.type === "charge.dispute.created";
  if (refundSucceeded || disputeCreated) {
    const paymentIntent = event.data?.object?.payment_intent;
    if (typeof paymentIntent !== "string" || !paymentIntent) return Response.json({ error: "Evento di revoca incompleto." }, { status: 400 });
    let order = await runtime.DB.prepare("SELECT id, order_type FROM orders WHERE stripe_payment_intent_id = ? LIMIT 1")
      .bind(paymentIntent).first<{ id: string; order_type: string }>();
    if (!order) {
      order = await runtime.DB.prepare(`SELECT orders.id, orders.order_type FROM subscription_invoices
        JOIN subscriptions ON subscriptions.id = subscription_invoices.subscription_id
        JOIN orders ON orders.id = subscriptions.order_id
        WHERE subscription_invoices.stripe_payment_intent_id = ? LIMIT 1`).bind(paymentIntent)
        .first<{ id: string; order_type: string }>();
    }
    if (!order) return Response.json({ error: "Pagamento non associato a un ordine LoreWise." }, { status: 409 });
    const nextStatus = disputeCreated ? "disputed" : "refunded";
    const refundId = event.type === "refund.updated" ? event.data?.object?.id ?? null : null;
    if (order.order_type === "subscription") {
      const invoiceSource = await runtime.DB.prepare(`SELECT subscription_invoices.stripe_invoice_id, subscriptions.customer_id
        FROM subscription_invoices JOIN subscriptions ON subscriptions.id = subscription_invoices.subscription_id
        WHERE subscription_invoices.stripe_payment_intent_id = ? LIMIT 1`).bind(paymentIntent)
        .first<{ stripe_invoice_id: string; customer_id: string }>();
      if (invoiceSource) await revokeUnusedInvoiceBenefits(runtime.DB, invoiceSource.customer_id, invoiceSource.stripe_invoice_id);
    }
    await runtime.DB.batch([
      runtime.DB.prepare(`INSERT INTO payment_events (id, provider_event_id, event_type, processing_status, payload_hash, processed_at)
        VALUES (?, ?, ?, 'processed', ?, CURRENT_TIMESTAMP)`).bind(crypto.randomUUID(), event.id, event.type, payloadHash),
      runtime.DB.prepare(`UPDATE orders SET status = ?, stripe_refund_id = COALESCE(?, stripe_refund_id),
        refunded_at = CASE WHEN ? = 'refunded' THEN CURRENT_TIMESTAMP ELSE refunded_at END,
        updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(nextStatus, refundId, nextStatus, order.id),
      runtime.DB.prepare(`UPDATE entitlements SET status = 'revoked', expires_at = CURRENT_TIMESTAMP
        WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id = ?) AND status = 'active'`).bind(order.id),
      runtime.DB.prepare(`UPDATE order_support_requests SET status = 'resolved',
        admin_notes = COALESCE(admin_notes, ?), resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE order_id = ? AND request_type = 'refund' AND status NOT IN ('rejected', 'resolved')`)
        .bind(disputeCreated ? "Diritti sospesi dopo una contestazione Stripe." : "Rimborso Stripe confermato; licenza e download revocati.", order.id),
      ...(order.order_type === "subscription" ? [runtime.DB.prepare(`UPDATE subscriptions SET status = 'canceled',
        cancel_at_period_end = 1, current_period_end = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?`).bind(order.id)] : []),
      ...(order.order_type === "commission" ? [
        runtime.DB.prepare("UPDATE commission_payments SET status = ? WHERE order_id = ?").bind(nextStatus, order.id),
        runtime.DB.prepare(`UPDATE commission_requests SET status = 'payment_issue', updated_at = CURRENT_TIMESTAMP
          WHERE id IN (SELECT request_id FROM commission_payments WHERE order_id = ?)` ).bind(order.id),
      ] : []),
    ]);
    await notifyOrder(runtime.DB, runtime, order.id, disputeCreated ? "payment_disputed" : "order_refunded", `${nextStatus}:${paymentIntent}`);
    return Response.json({ received: true, rightsRevoked: true });
  }
  if (event.type === "checkout.session.expired") {
    const session = event.data?.object;
    const orderId = session?.metadata?.order_id;
    if (!session?.id || !orderId) return Response.json({ error: "Evento di scadenza incompleto." }, { status: 400 });
    const order = await runtime.DB.prepare("SELECT id, stripe_checkout_session_id FROM orders WHERE id = ?")
      .bind(orderId).first<{ id: string; stripe_checkout_session_id: string | null }>();
    if (!order || order.stripe_checkout_session_id !== session.id) return Response.json({ error: "Ordine e sessione non corrispondono." }, { status: 409 });
    await runtime.DB.batch([
      runtime.DB.prepare(`INSERT INTO payment_events (id, provider_event_id, event_type, processing_status, payload_hash, processed_at)
        VALUES (?, ?, ?, 'processed', ?, CURRENT_TIMESTAMP)`).bind(crypto.randomUUID(), event.id, event.type, payloadHash),
      runtime.DB.prepare("UPDATE orders SET status = 'canceled', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'").bind(order.id),
    ]);
    return Response.json({ received: true });
  }
  const successfulCheckoutEvent = event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded";
  if (!successfulCheckoutEvent) {
    await runtime.DB.prepare(`INSERT INTO payment_events (id, provider_event_id, event_type, processing_status, payload_hash, processed_at)
      VALUES (?, ?, ?, 'ignored', ?, CURRENT_TIMESTAMP)`).bind(crypto.randomUUID(), event.id, event.type, payloadHash).run();
    return Response.json({ received: true });
  }

  const session = event.data?.object;
  const orderId = session?.metadata?.order_id;
  if (!session?.id || !orderId) return Response.json({ error: "Evento di pagamento incompleto." }, { status: 400 });
  if (session.payment_status !== "paid") {
    await runtime.DB.prepare(`INSERT INTO payment_events (id, provider_event_id, event_type, processing_status, payload_hash, processed_at)
      VALUES (?, ?, ?, 'awaiting_payment', ?, CURRENT_TIMESTAMP)`).bind(crypto.randomUUID(), event.id, event.type, payloadHash).run();
    return Response.json({ received: true, awaitingPayment: true });
  }
  const order = await runtime.DB.prepare(`SELECT id, customer_id, status, total_cents, currency, stripe_checkout_session_id,
      discount_cents, benefit_plan_code
    FROM orders WHERE id = ?`).bind(orderId).first<{
      id: string; customer_id: string; status: string; total_cents: number; currency: string; stripe_checkout_session_id: string | null;
      discount_cents: number; benefit_plan_code: string | null;
    }>();
  if (!order || order.stripe_checkout_session_id !== session.id || Number(session.amount_total) !== Number(order.total_cents)
    || session.currency?.toUpperCase() !== order.currency.toUpperCase()) {
    return Response.json({ error: "Ordine e pagamento non corrispondono." }, { status: 409 });
  }
  if (["refunded", "disputed", "canceled"].includes(order.status)) {
    await runtime.DB.prepare(`INSERT INTO payment_events (id, provider_event_id, event_type, processing_status, payload_hash, processed_at)
      VALUES (?, ?, ?, 'ignored_after_revocation', ?, CURRENT_TIMESTAMP)`).bind(crypto.randomUUID(), event.id, event.type, payloadHash).run();
    return Response.json({ received: true, ignoredAfterRevocation: true });
  }
  const item = await runtime.DB.prepare(`SELECT id, product_code, product_type, metadata_json FROM order_items WHERE order_id = ? LIMIT 1`)
    .bind(order.id).first<{ id: string; product_code: string; product_type: string; metadata_json: string | null }>();
  if (!item) return Response.json({ error: "Riga d'ordine non trovata." }, { status: 409 });
  if (session.metadata?.product_code !== item.product_code || session.metadata?.product_type !== item.product_type) {
    return Response.json({ error: "Il prodotto pagato non corrisponde alla riga d'ordine." }, { status: 409 });
  }
  if (item.product_type === "subscription") {
    if (typeof session.subscription !== "string" || !/^sub_[A-Za-z0-9_]+$/.test(session.subscription)) {
      return Response.json({ error: "Abbonamento Stripe non valido." }, { status: 409 });
    }
    await runtime.DB.batch([
      runtime.DB.prepare(`INSERT INTO payment_events (id, provider_event_id, event_type, processing_status, payload_hash, processed_at)
        VALUES (?, ?, ?, 'processed', ?, CURRENT_TIMESTAMP)`).bind(crypto.randomUUID(), event.id, event.type, payloadHash),
      runtime.DB.prepare(`UPDATE orders SET status = 'paid', stripe_payment_intent_id = ?, paid_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status IN ('pending', 'checkout_failed', 'paid')`).bind(session.payment_intent ?? null, order.id),
      runtime.DB.prepare(`INSERT INTO subscriptions (id, customer_id, order_id, plan_code, status, stripe_subscription_id,
        cancel_at_period_end, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(stripe_subscription_id) DO UPDATE SET status = 'active', plan_code = excluded.plan_code,
        order_id = excluded.order_id, cancel_at_period_end = 0, updated_at = CURRENT_TIMESTAMP`)
        .bind(crypto.randomUUID(), order.customer_id, order.id, item.product_code, session.subscription),
    ]);
    await notifyOrder(runtime.DB, runtime, order.id, "subscription_activated", event.id, {
      planLabel: item.product_code.replace("LW-PASS-", "Universe Pass "),
    });
    return Response.json({ received: true, subscriptionActivated: true });
  }
  if (item.product_type === "commission") {
    let commissionMetadata: { requestId?: string; phase?: string };
    try { commissionMetadata = JSON.parse(item.metadata_json || "{}") as typeof commissionMetadata; }
    catch { return Response.json({ error: "Metadati della commissione non validi." }, { status: 409 }); }
    if (!commissionMetadata.requestId || !["deposit", "balance"].includes(commissionMetadata.phase ?? "")) {
      return Response.json({ error: "Pagamento commissione non associato." }, { status: 409 });
    }
    const payment = await runtime.DB.prepare(`SELECT id, phase, amount_cents FROM commission_payments
      WHERE order_id = ? AND request_id = ? LIMIT 1`).bind(order.id, commissionMetadata.requestId)
      .first<{ id: string; phase: string; amount_cents: number }>();
    if (!payment || payment.phase !== commissionMetadata.phase || Number(payment.amount_cents) !== Number(order.total_cents)) {
      return Response.json({ error: "Fase o importo della commissione non corrispondono." }, { status: 409 });
    }
    const nextCommissionStatus = payment.phase === "deposit" ? "in_progress" : "balance_paid";
    await runtime.DB.batch([
      runtime.DB.prepare(`INSERT INTO payment_events (id, provider_event_id, event_type, processing_status, payload_hash, processed_at)
        VALUES (?, ?, ?, 'processed', ?, CURRENT_TIMESTAMP)`).bind(crypto.randomUUID(), event.id, event.type, payloadHash),
      runtime.DB.prepare(`UPDATE orders SET status = 'paid', stripe_payment_intent_id = ?, paid_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status IN ('pending', 'checkout_failed', 'paid')`).bind(session.payment_intent ?? null, order.id),
      runtime.DB.prepare("UPDATE commission_payments SET status = 'paid' WHERE id = ?").bind(payment.id),
      runtime.DB.prepare("UPDATE commission_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(nextCommissionStatus, commissionMetadata.requestId),
    ]);
    const commission = await runtime.DB.prepare("SELECT reference_code, package_name FROM commission_requests WHERE id = ? LIMIT 1")
      .bind(commissionMetadata.requestId).first<{ reference_code: string; package_name: string }>();
    await notifyOrder(runtime.DB, runtime, order.id, "commission_payment", event.id, {
      referenceCode: commission?.reference_code ?? "",
      title: commission?.package_name ?? "Commissione GiWise Studio",
      phaseLabel: payment.phase === "deposit" ? "Acconto" : "Saldo",
      detailUrl: "https://lorewisenexus.it/commissioni/stato",
    });
    return Response.json({ received: true, commissionPaymentRecorded: true, phase: payment.phase });
  }
  let metadata: { resourceType?: string; downloadLimit?: number; deliveryMode?: string; bundleMembers?: string[] } = {};
  try { metadata = JSON.parse(item.metadata_json || "{}") as typeof metadata; }
  catch { return Response.json({ error: "Metadati della licenza non validi." }, { status: 409 }); }
  const expectedResourceType = item.product_type === "artwork" ? "artwork" : item.product_type === "game" ? "game" : item.product_type;
  const resourceType = metadata.resourceType === expectedResourceType ? metadata.resourceType : expectedResourceType;
  const requestedLimit = Number(metadata.downloadLimit);
  const downloadLimit = Number.isInteger(requestedLimit) && requestedLimit > 0 && requestedLimit <= 20
    ? requestedLimit
    : item.product_type === "game" ? 5 : 3;
  const bundle = item.product_type === "artwork" ? getHorrorArtworkBundle(item.product_code) : null;
  const entitlementCodes = bundle ? [...bundle.artworkCodes] : [item.product_code];

  await runtime.DB.batch([
    runtime.DB.prepare(`INSERT INTO payment_events (id, provider_event_id, event_type, processing_status, payload_hash, processed_at)
      VALUES (?, ?, ?, 'processed', ?, CURRENT_TIMESTAMP)`).bind(crypto.randomUUID(), event.id, event.type, payloadHash),
    runtime.DB.prepare(`UPDATE orders SET status = 'paid', stripe_payment_intent_id = ?, paid_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status IN ('pending', 'checkout_failed', 'paid')`).bind(session.payment_intent ?? null, order.id),
    ...entitlementCodes.map((resourceCode) => database.prepare(`INSERT INTO entitlements (id, customer_id, order_item_id, resource_type, resource_code,
      status, download_limit, download_count, created_at) VALUES (?, ?, ?, ?, ?, 'active', ?, 0, CURRENT_TIMESTAMP)
      ON CONFLICT(customer_id, resource_type, resource_code) DO UPDATE SET
        order_item_id = excluded.order_item_id,
        status = 'active',
        download_limit = excluded.download_limit,
        download_count = 0,
        expires_at = NULL`)
      .bind(crypto.randomUUID(), order.customer_id, item.id, resourceType, resourceCode, downloadLimit)),
    ...(metadata.deliveryMode === "manual" ? [runtime.DB.prepare(`INSERT INTO manual_deliveries
      (id, order_id, customer_id, destination_email, status, created_at, updated_at)
      SELECT ?, ?, ?, customers.email, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      FROM customers WHERE customers.id = ?
      ON CONFLICT(order_id) DO UPDATE SET destination_email = excluded.destination_email,
        status = CASE WHEN manual_deliveries.status = 'sent' THEN 'sent' ELSE 'pending' END,
        updated_at = CURRENT_TIMESTAMP`)
      .bind(crypto.randomUUID(), order.id, order.customer_id, order.customer_id)] : []),
    ...(Number(order.discount_cents) > 0 ? [runtime.DB.prepare(`INSERT INTO benefit_events
      (id, customer_id, benefit_type, action, amount, reference_code, metadata_json)
      VALUES (?, ?, 'automatic_discount', 'applied', ?, ?, ?)`)
      .bind(crypto.randomUUID(), order.customer_id, Number(order.discount_cents), order.id,
        JSON.stringify({ planCode: order.benefit_plan_code, productCode: item.product_code, productType: item.product_type }))] : []),
  ]);
  await notifyOrder(runtime.DB, runtime, order.id, "order_paid", event.id);
  return Response.json({ received: true });
}
