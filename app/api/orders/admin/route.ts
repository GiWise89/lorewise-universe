import { requireOrderAdmin } from "@/lib/orderAdminAuth";
import { revokeUnusedInvoiceBenefits } from "@/lib/benefitEngine";
import { cancelStripeSubscription, createStripeRefund, getStripeConfiguration, type StripeRuntimeEnv } from "@/lib/stripe";

const supportStatuses = new Set(["open", "reviewing", "approved", "rejected", "resolved"]);

export async function GET(request: Request) {
  const auth = await requireOrderAdmin();
  if ("response" in auth) return auth.response;
  const { env } = await import("cloudflare:workers");
  const stripe = getStripeConfiguration(env as unknown as StripeRuntimeEnv);
  const url = new URL(request.url);
  const status = url.searchParams.get("status")?.trim() ?? "all";
  const search = url.searchParams.get("search")?.trim().slice(0, 100) ?? "";
  const filters: string[] = [];
  const values: string[] = [];
  if (status !== "all") { filters.push("orders.status = ?"); values.push(status); }
  if (search) {
    filters.push("(orders.reference_code LIKE ? OR customers.email LIKE ? OR order_items.title LIKE ?)");
    const term = `%${search}%`; values.push(term, term, term);
  }
  const where = filters.length ? ` WHERE ${filters.join(" AND ")}` : "";
  const [orders, support, totals] = await Promise.all([
    auth.database.prepare(`SELECT orders.id, orders.reference_code, orders.order_type, orders.status, orders.currency,
      orders.total_cents, orders.paid_at, orders.created_at, customers.email,
      GROUP_CONCAT(order_items.title, ' · ') AS titles,
      COALESCE(MAX(order_items.metadata_json), '{}') AS item_metadata,
      MAX(manual_deliveries.status) AS manual_delivery_status,
      MAX(manual_deliveries.sent_at) AS manual_delivery_sent_at
      FROM orders INNER JOIN customers ON customers.id = orders.customer_id
      LEFT JOIN order_items ON order_items.order_id = orders.id
      LEFT JOIN manual_deliveries ON manual_deliveries.order_id = orders.id${where}
      GROUP BY orders.id ORDER BY orders.created_at DESC LIMIT 100`).bind(...values).all<Record<string, unknown>>(),
    auth.database.prepare(`SELECT order_support_requests.id, order_support_requests.reference_code,
      order_support_requests.request_type, order_support_requests.reason, order_support_requests.details,
      order_support_requests.status, order_support_requests.admin_notes, order_support_requests.created_at,
      order_support_requests.updated_at, orders.reference_code AS order_reference, customers.email
      , orders.status AS order_status, orders.stripe_payment_intent_id
      FROM order_support_requests INNER JOIN orders ON orders.id = order_support_requests.order_id
      INNER JOIN customers ON customers.id = order_support_requests.customer_id
      ORDER BY order_support_requests.created_at DESC LIMIT 100`).all<Record<string, unknown>>(),
    auth.database.prepare(`SELECT COUNT(*) AS total,
      SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'canceled' THEN 1 ELSE 0 END) AS canceled,
      SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) AS refunded,
      SUM(CASE WHEN status = 'paid' THEN total_cents ELSE 0 END) AS paid_cents FROM orders`).first<Record<string, number>>(),
  ]);
  return Response.json({
    summary: { total: Number(totals?.total ?? 0), paid: Number(totals?.paid ?? 0), pending: Number(totals?.pending ?? 0), canceled: Number(totals?.canceled ?? 0), refunded: Number(totals?.refunded ?? 0), paidCents: Number(totals?.paid_cents ?? 0) },
    orders: orders.results.map((row) => {
      let deliveryMode = "automatic";
      try {
        const metadata = JSON.parse(String(row.item_metadata || "{}")) as { deliveryMode?: unknown };
        if (metadata.deliveryMode === "manual") deliveryMode = "manual";
      } catch { /* Ordine precedente alla registrazione della modalità di consegna. */ }
      return { id: row.id, referenceCode: row.reference_code, orderType: row.order_type, status: row.status, currency: row.currency, totalCents: Number(row.total_cents), paidAt: row.paid_at, createdAt: row.created_at, customerEmail: row.email, titles: row.titles ?? "", deliveryMode, deliveryStatus: row.manual_delivery_status ?? null, deliverySentAt: row.manual_delivery_sent_at ?? null };
    }),
    supportRequests: support.results.map((row) => ({ id: row.id, referenceCode: row.reference_code, orderReference: row.order_reference, requestType: row.request_type, reason: row.reason, details: row.details, status: row.status, adminNotes: row.admin_notes ?? "", createdAt: row.created_at, updatedAt: row.updated_at, customerEmail: row.email, orderStatus: row.order_status, canRefund: row.request_type === "refund" && row.status === "approved" && row.order_status === "paid" && Boolean(row.stripe_payment_intent_id) })),
    testMode: stripe.testMode,
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && origin !== requestUrl.origin) return Response.json({ error: "Origine della richiesta non valida." }, { status: 403 });
  const auth = await requireOrderAdmin();
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => null) as { id?: unknown; status?: unknown; adminNotes?: unknown; action?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  const action = typeof body?.action === "string" ? body.action : "update";
  const status = typeof body?.status === "string" ? body.status : "";
  const adminNotes = typeof body?.adminNotes === "string" ? body.adminNotes.trim().slice(0, 3000) : "";
  if (action === "delivery") {
    if (!id || !["pending", "sent"].includes(status)) return Response.json({ error: "Consegna manuale non valida." }, { status: 400 });
    const delivery = await auth.database.prepare(`SELECT manual_deliveries.id, orders.status AS order_status
      FROM manual_deliveries INNER JOIN orders ON orders.id = manual_deliveries.order_id
      WHERE manual_deliveries.order_id = ? LIMIT 1`).bind(id).first<{ id: string; order_status: string }>();
    if (!delivery) return Response.json({ error: "Consegna manuale non trovata." }, { status: 404 });
    if (delivery.order_status !== "paid") return Response.json({ error: "Solo un ordine pagato puo essere segnato come consegnato." }, { status: 409 });
    await auth.database.prepare(`UPDATE manual_deliveries SET status = ?, provider = CASE WHEN ? = 'sent' THEN 'private-link' ELSE provider END,
      admin_notes = ?, sent_at = CASE WHEN ? = 'sent' THEN CURRENT_TIMESTAMP ELSE NULL END,
      updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(status, status, adminNotes || null, status, delivery.id).run();
    return Response.json({ message: status === "sent" ? "Consegna privata registrata." : "Consegna riportata in attesa." });
  }
  if (action === "refund") {
    if (!id) return Response.json({ error: "Richiesta di rimborso non valida." }, { status: 400 });
    const refundRequest = await auth.database.prepare(`SELECT order_support_requests.id, order_support_requests.request_type,
      order_support_requests.status, orders.id AS order_id, orders.status AS order_status,
      orders.order_type, orders.customer_id, orders.stripe_payment_intent_id,
      subscriptions.id AS subscription_id, subscriptions.stripe_subscription_id,
      subscription_invoices.stripe_invoice_id FROM order_support_requests
      INNER JOIN orders ON orders.id = order_support_requests.order_id
      LEFT JOIN subscriptions ON subscriptions.order_id = orders.id
      LEFT JOIN subscription_invoices ON subscription_invoices.subscription_id = subscriptions.id
        AND subscription_invoices.stripe_payment_intent_id = orders.stripe_payment_intent_id
      WHERE order_support_requests.id = ? LIMIT 1`)
      .bind(id).first<{
        id: string; request_type: string; status: string; order_id: string; order_status: string;
        order_type: string; customer_id: string; stripe_payment_intent_id: string | null;
        subscription_id: string | null; stripe_subscription_id: string | null; stripe_invoice_id: string | null;
      }>();
    if (!refundRequest || refundRequest.request_type !== "refund") return Response.json({ error: "Richiesta di rimborso non trovata." }, { status: 404 });
    if (refundRequest.status !== "approved" || refundRequest.order_status !== "paid" || !refundRequest.stripe_payment_intent_id) {
      return Response.json({ error: "Il rimborso richiede una richiesta approvata e un ordine Stripe pagato." }, { status: 409 });
    }
    const { env } = await import("cloudflare:workers");
    const stripe = getStripeConfiguration(env as unknown as StripeRuntimeEnv);
    if (!stripe.configured) return Response.json({ error: stripe.blockers[0] || "Stripe non è configurato per il rimborso." }, { status: 503 });
    try {
      if (refundRequest.order_type === "subscription") {
        if (!refundRequest.stripe_subscription_id) {
          return Response.json({ error: "L’abbonamento Stripe collegato all’ordine non è stato trovato." }, { status: 409 });
        }
        await cancelStripeSubscription({ secretKey: stripe.secretKey, subscriptionId: refundRequest.stripe_subscription_id });
      }
      const refund = await createStripeRefund({ secretKey: stripe.secretKey, paymentIntentId: refundRequest.stripe_payment_intent_id, orderId: refundRequest.order_id, supportRequestId: refundRequest.id });
      if (refund.status === "pending") {
        await auth.database.batch([
          auth.database.prepare("UPDATE orders SET status = 'refund_pending', stripe_refund_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'paid'").bind(refund.id, refundRequest.order_id),
          auth.database.prepare("UPDATE order_support_requests SET status = 'reviewing', admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(adminNotes || "Rimborso Stripe avviato e in attesa di conferma.", id),
        ]);
        return Response.json({ message: "Rimborso Stripe avviato. I diritti saranno revocati alla conferma." });
      }
      await auth.database.batch([
        auth.database.prepare("UPDATE orders SET status = 'refunded', stripe_refund_id = ?, refunded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status IN ('paid', 'refund_pending')").bind(refund.id, refundRequest.order_id),
        auth.database.prepare("UPDATE entitlements SET status = 'revoked', expires_at = CURRENT_TIMESTAMP WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id = ?) AND status = 'active'").bind(refundRequest.order_id),
        auth.database.prepare("UPDATE order_support_requests SET status = 'resolved', admin_notes = ?, resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(adminNotes || "Rimborso Stripe completato; licenza e download revocati.", id),
        ...(refundRequest.subscription_id ? [auth.database.prepare(`UPDATE subscriptions SET status = 'canceled', cancel_at_period_end = 1,
          current_period_end = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(refundRequest.subscription_id)] : []),
      ]);
      if (refundRequest.order_type === "subscription" && refundRequest.stripe_invoice_id) {
        await revokeUnusedInvoiceBenefits(auth.database, refundRequest.customer_id, refundRequest.stripe_invoice_id);
      }
      return Response.json({ message: "Rimborso Stripe completato e diritti revocati." });
    } catch {
      return Response.json({ error: "Stripe non ha completato il rimborso. Nessun diritto è stato modificato." }, { status: 502 });
    }
  }
  if (!id || !supportStatuses.has(status)) return Response.json({ error: "Aggiornamento non valido." }, { status: 400 });
  const existing = await auth.database.prepare("SELECT id FROM order_support_requests WHERE id = ?").bind(id).first();
  if (!existing) return Response.json({ error: "Richiesta non trovata." }, { status: 404 });
  await auth.database.prepare(`UPDATE order_support_requests SET status = ?, admin_notes = ?,
    resolved_at = CASE WHEN ? IN ('rejected', 'resolved') THEN CURRENT_TIMESTAMP ELSE NULL END,
    updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(status, adminNotes || null, status, id).run();
  return Response.json({ message: "Richiesta aggiornata. Nessuna operazione monetaria è stata eseguita." });
}
