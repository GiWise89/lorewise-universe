import { ensureCommerceTables } from "@/lib/commerceServer";
import type { CommercialProduct } from "@/lib/commercialCatalog";
import { createStripeCheckoutSession, getStripeConfiguration, type StripeRuntimeEnv } from "@/lib/stripe";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { getLoreWiseUser } from "@/lib/supabase/server";
import { ensureCommissionBenefitColumns } from "@/lib/universePass";

type RuntimeEnv = StripeRuntimeEnv & { DB?: D1Database };
const referencePattern = /^LW-REQ-\d{8}-[A-F0-9]{6}$/;

function makeOrderReference() {
  return `LW-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase()}`;
}

export async function POST(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const origin = request.headers.get("origin");
    if (origin && origin !== requestUrl.origin) return Response.json({ error: "Origine della richiesta non valida." }, { status: 403 });
    const user = await getLoreWiseUser();
    if (!user?.email) return Response.json({ error: "Accedi con il LoreWise ID collegato alla richiesta." }, { status: 401 });
    const body = await request.json().catch(() => null) as { referenceCode?: unknown } | null;
    const referenceCode = typeof body?.referenceCode === "string" ? body.referenceCode.trim().toUpperCase() : "";
    if (!referencePattern.test(referenceCode)) return Response.json({ error: "Codice richiesta non valido." }, { status: 400 });

    const { env } = await import("cloudflare:workers");
    const runtime = env as unknown as RuntimeEnv;
    const stripe = getStripeConfiguration(runtime);
    if (!runtime.DB || !stripe.configured) return Response.json({ error: stripe.blockers[0] || "Pagamento protetto non configurato." }, { status: 503 });
    await syncLoreWiseCustomer(user);
    await ensureCommerceTables(runtime.DB);
    await ensureCommissionBenefitColumns(runtime.DB);
    const customer = await runtime.DB.prepare("SELECT id, email, display_name, status FROM customers WHERE id = ?")
      .bind(user.id).first<{ id: string; email: string; display_name: string | null; status: string }>();
    if (!customer || customer.status !== "active") return Response.json({ error: "Questo account non può effettuare pagamenti." }, { status: 403 });
    const commission = await runtime.DB.prepare(`SELECT id, reference_code, customer_id, email, package_name, status,
      quote_base_cents, quote_discount_cents, quote_cents, deposit_cents, membership_plan_code,
      membership_discount_percent, quote_terms_accepted_at
      FROM commission_requests WHERE reference_code = ? LIMIT 1`).bind(referenceCode).first<{
        id: string; reference_code: string; customer_id: string | null; email: string; package_name: string; status: string;
        quote_base_cents: number | null; quote_discount_cents: number | null; quote_cents: number | null;
        deposit_cents: number | null; membership_plan_code: string | null; membership_discount_percent: number;
        quote_terms_accepted_at: string | null;
      }>();
    if (!commission || (commission.customer_id ? commission.customer_id !== customer.id : commission.email.trim().toLowerCase() !== customer.email.trim().toLowerCase())) {
      return Response.json({ error: "La richiesta non appartiene a questo LoreWise ID." }, { status: 403 });
    }
    if (!commission.quote_terms_accepted_at || commission.quote_cents == null || commission.deposit_cents == null) {
      return Response.json({ error: "Preventivo o acconto non ancora confermati." }, { status: 409 });
    }
    const phase = commission.status === "accepted" ? "deposit" : commission.status === "awaiting_balance" ? "balance" : null;
    if (!phase) return Response.json({ error: "Nessun pagamento è richiesto nello stato attuale." }, { status: 409 });
    const amountCents = phase === "deposit" ? commission.deposit_cents : commission.quote_cents - commission.deposit_cents;
    if (!Number.isInteger(amountCents) || amountCents <= 0) return Response.json({ error: "Importo del pagamento non valido." }, { status: 409 });
    if (phase === "balance") {
      const depositPaid = await runtime.DB.prepare("SELECT id FROM commission_payments WHERE request_id = ? AND phase = 'deposit' AND status = 'paid' LIMIT 1")
        .bind(commission.id).first();
      if (!depositPaid) return Response.json({ error: "Il saldo non può precedere l’acconto." }, { status: 409 });
    }
    const existing = await runtime.DB.prepare(`SELECT id FROM commission_payments WHERE request_id = ? AND phase = ? AND status IN ('pending', 'paid') LIMIT 1`)
      .bind(commission.id, phase).first();
    if (existing) return Response.json({ error: "Questo pagamento risulta già aperto o completato." }, { status: 409 });

    const orderId = crypto.randomUUID();
    const orderItemId = crypto.randomUUID();
    const paymentId = crypto.randomUUID();
    const orderReference = makeOrderReference();
    const productCode = `LW-COM-${phase.toUpperCase()}-${commission.reference_code}`;
    const product: CommercialProduct = {
      code: productCode,
      slug: commission.reference_code.toLowerCase(),
      title: `${phase === "deposit" ? "Acconto" : "Saldo"} · ${commission.package_name}`,
      description: `Pagamento ${phase === "deposit" ? "dell’acconto" : "del saldo"} per ${commission.reference_code}`,
      productType: "commission",
      resourceType: "commission",
      amountCents,
      currency: "eur",
      licenseType: "personal-digital",
      downloadLimit: 0,
    };
    await runtime.DB.batch([
      runtime.DB.prepare(`INSERT INTO orders (id, reference_code, customer_id, order_type, status, currency, subtotal_cents, total_cents, created_at, updated_at)
        VALUES (?, ?, ?, 'commission', 'pending', 'EUR', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`)
        .bind(orderId, orderReference, customer.id, amountCents, amountCents),
      runtime.DB.prepare(`INSERT INTO order_items (id, order_id, product_code, product_type, title, quantity, unit_amount_cents, license_type, metadata_json, created_at)
        VALUES (?, ?, ?, 'commission', ?, 1, ?, NULL, ?, CURRENT_TIMESTAMP)`)
        .bind(orderItemId, orderId, productCode, product.title, amountCents, JSON.stringify({
          requestId: commission.id,
          phase,
          referenceCode: commission.reference_code,
          quoteBaseCents: commission.quote_base_cents,
          quoteDiscountCents: commission.quote_discount_cents,
          quoteFinalCents: commission.quote_cents,
          membershipPlanCode: commission.membership_plan_code,
          membershipDiscountPercent: commission.membership_discount_percent,
        })),
      runtime.DB.prepare(`INSERT INTO commission_payments (id, request_id, order_id, phase, amount_cents, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`).bind(paymentId, commission.id, orderId, phase, amountCents),
    ]);
    try {
      const session = await createStripeCheckoutSession({ secretKey: stripe.secretKey, origin: requestUrl.origin, customerEmail: customer.email, orderId, orderReference, product });
      await runtime.DB.prepare("UPDATE orders SET stripe_checkout_session_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(session.id, orderId).run();
      return Response.json({ checkoutUrl: session.url, mode: stripe.mode, testMode: stripe.testMode }, { headers: { "Cache-Control": "private, no-store" } });
    } catch (error) {
      await runtime.DB.batch([
        runtime.DB.prepare("UPDATE orders SET status = 'checkout_failed', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(orderId),
        runtime.DB.prepare("UPDATE commission_payments SET status = 'failed' WHERE id = ?").bind(paymentId),
      ]);
      const detail = error instanceof Error ? error.message : "Stripe non ha restituito una risposta valida.";
      return Response.json({ error: `Non è stato possibile aprire il pagamento protetto. ${detail}` }, { status: 502 });
    }
  } catch {
    return Response.json({ error: "Non è stato possibile preparare il pagamento della commissione." }, { status: 500 });
  }
}
