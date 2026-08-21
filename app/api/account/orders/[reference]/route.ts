import { env } from "@/lib/netlifyRuntime";

import { ensureCommerceTables } from "@/lib/commerceServer";
import { expireStripeCheckoutSession, getStripeConfiguration, type StripeRuntimeEnv } from "@/lib/stripe";
import { getLoreWiseUser } from "@/lib/supabase/server";

type RuntimeEnv = StripeRuntimeEnv & { DB?: D1Database };
type Context = { params: Promise<{ reference: string }> };

async function authenticatedOrder(reference: string) {
  const user = await getLoreWiseUser();
  if (!user?.email) return { error: Response.json({ error: "Sessione non valida." }, { status: 401 }) };
  const runtime = env as unknown as RuntimeEnv;
  if (!runtime.DB) return { error: Response.json({ error: "Archivio ordini non disponibile." }, { status: 503 }) };
  await ensureCommerceTables(runtime.DB);
  const order = await runtime.DB.prepare(`SELECT id, reference_code, customer_id, order_type, status, currency, subtotal_cents,
    discount_cents, total_cents, benefit_plan_code, benefit_discount_percent,
    stripe_checkout_session_id, paid_at, created_at, updated_at
    FROM orders WHERE reference_code = ? AND customer_id = ? LIMIT 1`)
    .bind(reference, user.id).first<{
      id: string; reference_code: string; customer_id: string; order_type: string; status: string; currency: string;
      subtotal_cents: number; discount_cents: number; total_cents: number; benefit_plan_code: string | null;
      benefit_discount_percent: number; stripe_checkout_session_id: string | null;
      paid_at: string | null; created_at: string; updated_at: string;
    }>();
  if (!order) return { error: Response.json({ error: "Ordine non trovato." }, { status: 404 }) };
  return { runtime, order };
}

export async function GET(_: Request, context: Context) {
  const { reference } = await context.params;
  const result = await authenticatedOrder(reference);
  if (result.error) return result.error;
  const items = await result.runtime.DB!.prepare(`SELECT product_code, product_type, title, quantity,
    unit_amount_cents, license_type FROM order_items WHERE order_id = ? ORDER BY created_at`)
    .bind(result.order.id).all<{ product_code: string; product_type: string; title: string; quantity: number; unit_amount_cents: number; license_type: string | null }>();
  const support = await result.runtime.DB!.prepare(`SELECT reference_code, request_type, reason, details, status,
    admin_notes, resolved_at, created_at, updated_at FROM order_support_requests WHERE order_id = ? ORDER BY created_at DESC`)
    .bind(result.order.id).all<{
      reference_code: string; request_type: string; reason: string; details: string; status: string;
      admin_notes: string | null; resolved_at: string | null; created_at: string; updated_at: string;
    }>();
  const stripe = getStripeConfiguration(result.runtime);
  return Response.json({
    order: {
      referenceCode: result.order.reference_code, type: result.order.order_type, status: result.order.status,
      currency: result.order.currency, subtotalCents: Number(result.order.subtotal_cents), totalCents: Number(result.order.total_cents),
      discountCents: Number(result.order.discount_cents), benefitPlanCode: result.order.benefit_plan_code,
      benefitDiscountPercent: Number(result.order.benefit_discount_percent),
      paidAt: result.order.paid_at, createdAt: result.order.created_at, updatedAt: result.order.updated_at,
      canCancel: result.order.status === "pending" && Boolean(result.order.stripe_checkout_session_id),
      testMode: stripe.testMode,
      items: items.results.map((item) => ({
        productCode: item.product_code, productType: item.product_type, title: item.title,
        quantity: Number(item.quantity), unitAmountCents: Number(item.unit_amount_cents), licenseType: item.license_type,
      })),
      supportRequests: support.results.map((item) => ({
        referenceCode: item.reference_code, requestType: item.request_type, reason: item.reason, details: item.details,
        status: item.status, adminNotes: item.admin_notes, resolvedAt: item.resolved_at,
        createdAt: item.created_at, updatedAt: item.updated_at,
      })),
    },
  }, { headers: { "Cache-Control": "private, no-store" } });
}

function supportReference() {
  return `LW-AST-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().replaceAll("-", "").slice(0, 5).toUpperCase()}`;
}

export async function POST(request: Request, context: Context) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && origin !== requestUrl.origin) return Response.json({ error: "Origine della richiesta non valida." }, { status: 403 });
  const body = await request.json().catch(() => null) as { requestType?: unknown; reason?: unknown; details?: unknown } | null;
  const requestType = typeof body?.requestType === "string" ? body.requestType.trim() : "";
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 120) : "";
  const details = typeof body?.details === "string" ? body.details.trim().slice(0, 3000) : "";
  if (!new Set(["support", "refund"]).has(requestType) || reason.length < 3 || details.length < 20) {
    return Response.json({ error: "Indica il tipo di richiesta, un motivo e almeno 20 caratteri di dettaglio." }, { status: 400 });
  }
  const { reference } = await context.params;
  const result = await authenticatedOrder(reference);
  if (result.error) return result.error;
  if (requestType === "refund" && result.order.status !== "paid") {
    return Response.json({ error: "Una richiesta di rimborso può essere aperta soltanto per un ordine pagato." }, { status: 409 });
  }
  const existing = await result.runtime.DB!.prepare(`SELECT reference_code FROM order_support_requests
    WHERE order_id = ? AND status IN ('open', 'reviewing', 'approved') LIMIT 1`).bind(result.order.id).first<{ reference_code: string }>();
  if (existing) return Response.json({ error: `Esiste già una richiesta attiva: ${existing.reference_code}.` }, { status: 409 });
  const referenceCode = supportReference();
  await result.runtime.DB!.prepare(`INSERT INTO order_support_requests
    (id, reference_code, order_id, customer_id, request_type, reason, details, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'open', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`)
    .bind(crypto.randomUUID(), referenceCode, result.order.id, result.order.customer_id, requestType, reason, details).run();
  return Response.json({
    message: requestType === "refund"
      ? "Richiesta di rimborso registrata per la valutazione. Nessun rimborso è stato eseguito automaticamente."
      : "Richiesta di assistenza registrata.",
    referenceCode,
  }, { status: 201 });
}

export async function PATCH(request: Request, context: Context) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && origin !== requestUrl.origin) return Response.json({ error: "Origine della richiesta non valida." }, { status: 403 });
  const body = await request.json().catch(() => null) as { action?: unknown } | null;
  if (body?.action !== "cancel") return Response.json({ error: "Azione non valida." }, { status: 400 });
  const { reference } = await context.params;
  const result = await authenticatedOrder(reference);
  if (result.error) return result.error;
  if (result.order.status !== "pending") return Response.json({ error: "Solo un ordine in attesa può essere annullato." }, { status: 409 });
  if (!result.order.stripe_checkout_session_id) return Response.json({ error: "La sessione di pagamento non è disponibile." }, { status: 409 });
  const stripe = getStripeConfiguration(result.runtime);
  if (!stripe.configured) return Response.json({ error: stripe.blockers[0] || "Annullamento Stripe non disponibile." }, { status: 503 });
  try {
    await expireStripeCheckoutSession(stripe.secretKey, result.order.stripe_checkout_session_id);
    await result.runtime.DB!.prepare("UPDATE orders SET status = 'canceled', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'")
      .bind(result.order.id).run();
    return Response.json({ message: stripe.testMode ? "Ordine di prova annullato. Nessun addebito è stato effettuato." : "Ordine annullato prima del pagamento.", status: "canceled" });
  } catch {
    return Response.json({ error: "Stripe non ha confermato l’annullamento. L’ordine è rimasto invariato." }, { status: 502 });
  }
}
