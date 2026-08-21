import { resolveCommercialProduct, type CommercialProductType } from "@/lib/commercialCatalog";
import { automaticArtworkDeliveryReady } from "@/lib/automaticArtworkDelivery";
import { ensureCommerceTables } from "@/lib/commerceServer";
import { createStripeCheckoutSession, getStripeConfiguration, type StripeRuntimeEnv } from "@/lib/stripe";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { getLoreWiseUser } from "@/lib/supabase/server";
import { calculatePurchaseBenefit, discountPercentForProduct, getActiveUniversePass, type DiscountableProductType } from "@/lib/universePass";

type RuntimeEnv = StripeRuntimeEnv & { DB?: D1Database; COMMISSION_UPLOADS?: R2Bucket; LOREWISE_MANUAL_DELIVERY_APPROVED?: string };

function enabled(value: string | undefined) {
  return value?.trim().toLowerCase() === "true";
}

async function runtimeEnv() {
  const { env } = await import("cloudflare:workers");
  return env as unknown as RuntimeEnv;
}

export async function GET(request: Request) {
  try {
    const runtime = await runtimeEnv();
    const stripe = getStripeConfiguration(runtime);
    const user = await getLoreWiseUser();
    const url = new URL(request.url);
    const requestedType = url.searchParams.get("productType") as CommercialProductType | null;
    const requestedCode = url.searchParams.get("productCode") ?? "";
    const product = requestedType && requestedCode ? resolveCommercialProduct(requestedType, requestedCode) : null;
    let deliveryReady: boolean | null = null;
    let deliveryMode: "automatic" | "manual" | null = null;
    if (product && runtime.DB) {
      try {
        await ensureCommerceTables(runtime.DB);
        if (product.productType === "artwork") {
          const automaticCatalog = await automaticArtworkDeliveryReady(runtime.COMMISSION_UPLOADS, product.code, stripe.testMode);
          const approved = automaticCatalog || Boolean(await runtime.DB.prepare("SELECT id FROM artwork_delivery_files WHERE artwork_code = ? AND status = 'approved' LIMIT 1").bind(product.code).first());
          const automatic = approved && (stripe.testMode || Boolean(runtime.COMMISSION_UPLOADS));
          deliveryReady = automatic || enabled(runtime.LOREWISE_MANUAL_DELIVERY_APPROVED);
          deliveryMode = automatic ? "automatic" : deliveryReady ? "manual" : null;
        } else if (product.productType === "game") {
          const approved = Boolean(await runtime.DB.prepare(`SELECT id FROM game_delivery_files
            WHERE product_code = ? AND status = 'approved'
              AND signature_status IN ('valid', 'unsigned_disclosed') AND scan_status = 'passed'
              AND install_test_status = 'passed' AND update_test_status IN ('passed', 'deferred_first_release')
            LIMIT 1`).bind(product.code).first());
          const automatic = approved && (stripe.testMode || Boolean(runtime.COMMISSION_UPLOADS));
          deliveryReady = automatic || enabled(runtime.LOREWISE_MANUAL_DELIVERY_APPROVED);
          deliveryMode = automatic ? "automatic" : deliveryReady ? "manual" : null;
        }
      } catch {
        deliveryReady = false;
      }
    }
    return Response.json({
      configured: stripe.configured,
      checkoutConfigured: stripe.checkoutConfigured,
      webhookConfigured: stripe.webhookConfigured,
      liveKeyRejected: stripe.liveKeyRejected,
      mode: stripe.mode,
      testMode: stripe.testMode,
      blockers: stripe.blockers,
      authenticated: Boolean(user?.email),
      productAvailable: Boolean(product),
      deliveryReady,
      deliveryMode,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ configured: false, mode: "test", testMode: true, authenticated: false }, { headers: { "Cache-Control": "private, no-store" } });
  }
}

function makeReference() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `LW-${date}-${crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase()}`;
}

export async function POST(request: Request) {
  try {
    const user = await getLoreWiseUser();
    if (!user?.email) return Response.json({ error: "Accedi al tuo LoreWise ID per acquistare." }, { status: 401 });
    const runtime = await runtimeEnv();
    const requestUrl = new URL(request.url);
    const browserOrigin = request.headers.get("origin");
    if (browserOrigin && browserOrigin !== requestUrl.origin) return Response.json({ error: "Origine della richiesta non valida." }, { status: 403 });

    const body = await request.json().catch(() => null) as { productCode?: unknown; productType?: unknown } | null;
    if (typeof body?.productType !== "string" || typeof body.productCode !== "string") {
      return Response.json({ error: "Prodotto non valido." }, { status: 400 });
    }
    const supportedTypes = new Set<CommercialProductType>(["artwork", "game", "subscription", "commission", "merchandise"]);
    if (!supportedTypes.has(body.productType as CommercialProductType)) return Response.json({ error: "Tipo di prodotto non valido." }, { status: 400 });
    const product = resolveCommercialProduct(body.productType as CommercialProductType, body.productCode);
    if (!product) return Response.json({ error: "Questo prodotto non è ancora disponibile per l’acquisto." }, { status: 404 });

    const stripe = getStripeConfiguration(runtime);
    if (!stripe.configured || !runtime.DB) {
      return Response.json({ error: stripe.blockers[0] || "Il pagamento protetto non è ancora configurato." }, { status: 503 });
    }

    await syncLoreWiseCustomer(user);
    await ensureCommerceTables(runtime.DB);
    const customer = await runtime.DB.prepare("SELECT id, email, display_name, status FROM customers WHERE id = ?")
      .bind(user.id).first<{ id: string; email: string; display_name: string | null; status: string }>();
    if (!customer || customer.status !== "active") return Response.json({ error: "Questo account non può effettuare acquisti." }, { status: 403 });
    const activePass = await getActiveUniversePass(runtime.DB, customer.id);
    const discountPercent = product.productType === "subscription"
      ? 0
      : discountPercentForProduct(activePass, product.productType as DiscountableProductType);
    const pricing = calculatePurchaseBenefit(product.amountCents, discountPercent);
    const checkoutProduct = { ...product, amountCents: pricing.finalCents };
    const approvedDelivery = product.productType === "artwork"
      ? await automaticArtworkDeliveryReady(runtime.COMMISSION_UPLOADS, product.code, stripe.testMode)
        || Boolean(await runtime.DB.prepare("SELECT id FROM artwork_delivery_files WHERE artwork_code = ? AND status = 'approved' LIMIT 1").bind(product.code).first<{ id: string }>())
      : product.productType === "game"
        ? await runtime.DB.prepare(`SELECT id FROM game_delivery_files
          WHERE product_code = ? AND status = 'approved'
            AND signature_status IN ('valid', 'unsigned_disclosed') AND scan_status = 'passed'
            AND install_test_status = 'passed' AND update_test_status IN ('passed', 'deferred_first_release')
          LIMIT 1`).bind(product.code).first<{ id: string }>()
        : null;
    const automaticDelivery = Boolean(approvedDelivery) && (stripe.testMode || Boolean(runtime.COMMISSION_UPLOADS));
    const manualDelivery = enabled(runtime.LOREWISE_MANUAL_DELIVERY_APPROVED);
    if (["artwork", "game"].includes(product.productType) && !automaticDelivery && !manualDelivery) {
      return Response.json({ error: "La consegna privata di questo prodotto non è ancora configurata." }, { status: 409 });
    }
    if (product.productType === "subscription") {
      const activeSubscription = await runtime.DB.prepare(`SELECT id FROM subscriptions
        WHERE customer_id = ? AND status IN ('active', 'trialing', 'past_due', 'incomplete') LIMIT 1`)
        .bind(customer.id).first<{ id: string }>();
      if (activeSubscription) return Response.json({ error: "Hai già un abbonamento attivo o in attesa di conferma." }, { status: 409 });
    }
    const entitlement = await runtime.DB.prepare(`SELECT id FROM entitlements
      WHERE customer_id = ? AND resource_type = ? AND resource_code = ? AND status = 'active'`)
      .bind(customer.id, product.resourceType, product.code).first<{ id: string }>();
    if (product.productType !== "subscription" && entitlement) return Response.json({ error: "Questo contenuto è già presente nella tua libreria." }, { status: 409 });

    const orderId = crypto.randomUUID();
    const orderItemId = crypto.randomUUID();
    const orderReference = makeReference();
    await runtime.DB.batch([
      runtime.DB.prepare(`INSERT INTO orders (id, reference_code, customer_id, order_type, status, currency,
        subtotal_cents, discount_cents, total_cents, benefit_plan_code, benefit_discount_percent, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'pending', 'EUR', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`)
        .bind(orderId, orderReference, customer.id, product.productType, pricing.baseCents, pricing.discountCents,
          pricing.finalCents, activePass.code, pricing.discountPercent),
      runtime.DB.prepare(`INSERT INTO order_items (id, order_id, product_code, product_type, title, quantity,
        unit_amount_cents, license_type, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, CURRENT_TIMESTAMP)`)
        .bind(orderItemId, orderId, product.code, product.productType, product.title, pricing.finalCents,
          product.licenseType, JSON.stringify({
            resourceType: product.resourceType,
            downloadLimit: product.downloadLimit,
            baseAmountCents: pricing.baseCents,
            discountCents: pricing.discountCents,
            benefitPlanCode: activePass.code,
            benefitDiscountPercent: pricing.discountPercent,
            licenseHolderName: customer.display_name?.trim() || customer.email,
            licenseHolderEmail: customer.email,
            deliveryMode: automaticDelivery ? "automatic" : manualDelivery ? "manual" : "none",
          })),
    ]);

    try {
      const origin = requestUrl.origin;
      const session = await createStripeCheckoutSession({ secretKey: stripe.secretKey, origin, customerEmail: customer.email, orderId, orderReference, product: checkoutProduct });
      await runtime.DB.prepare("UPDATE orders SET stripe_checkout_session_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(session.id, orderId).run();
      return Response.json({ checkoutUrl: session.url, mode: stripe.mode, testMode: stripe.testMode,
        deliveryMode: automaticDelivery ? "automatic" : manualDelivery ? "manual" : null }, { headers: { "Cache-Control": "private, no-store" } });
    } catch {
      await runtime.DB.prepare("UPDATE orders SET status = 'checkout_failed', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(orderId).run();
      return Response.json({ error: "Non è stato possibile aprire il pagamento protetto. Riprova più tardi." }, { status: 502 });
    }
  } catch {
    return Response.json({ error: "Non è stato possibile preparare l'ordine." }, { status: 500 });
  }
}
