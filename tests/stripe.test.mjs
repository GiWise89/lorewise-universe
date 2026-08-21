import assert from "node:assert/strict";
import test from "node:test";
import {
  cancelStripeTestSubscription,
  createStripeCheckoutSession,
  createStripeTestRefund,
  getStripeConfiguration,
  getStripeTestConfiguration,
  retrieveStripeTestInvoicePaymentIntent,
  setStripeTestSubscriptionCancellation,
  verifyStripeWebhook,
} from "../lib/stripe.ts";

const testKey = `sk_test_${"A".repeat(24)}`;
const webhookSecret = `whsec_${"B".repeat(24)}`;

async function webhookSignature(body, timestamp = Math.floor(Date.now() / 1000)) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(webhookSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${body}`));
  const signature = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `t=${timestamp},v1=${signature}`;
}

test("accepts only a complete Stripe test configuration", () => {
  const ready = getStripeTestConfiguration({ STRIPE_SECRET_KEY: testKey, STRIPE_WEBHOOK_SECRET: webhookSecret });
  assert.equal(ready.checkoutConfigured, true);
  assert.equal(ready.webhookConfigured, true);
  assert.equal(ready.liveKeyRejected, false);
  const live = getStripeTestConfiguration({ STRIPE_SECRET_KEY: `sk_live_${"C".repeat(24)}` });
  assert.equal(live.checkoutConfigured, false);
  assert.equal(live.liveKeyRejected, true);
});

test("enables Stripe live only with explicit commercial, publication and payment approvals", () => {
  const liveKey = `sk_live_${"C".repeat(24)}`;
  const blocked = getStripeConfiguration({
    STRIPE_SECRET_KEY: liveKey,
    STRIPE_WEBHOOK_SECRET: webhookSecret,
    LOREWISE_STRIPE_MODE: "live",
    NEXT_PUBLIC_SITE_URL: "https://lorewisenexus.it",
  });
  assert.equal(blocked.mode, "live");
  assert.equal(blocked.configured, false);
  assert.match(blocked.blockers.join(" "), /inquadramento commerciale/i);

  const ready = getStripeConfiguration({
    STRIPE_SECRET_KEY: liveKey,
    STRIPE_WEBHOOK_SECRET: webhookSecret,
    LOREWISE_STRIPE_MODE: "live",
    LOREWISE_COMMERCIAL_LEGAL_APPROVED: "true",
    LOREWISE_PUBLICATION_APPROVED: "true",
    LOREWISE_LIVE_PAYMENTS_APPROVED: "true",
    NEXT_PUBLIC_SITE_URL: "https://lorewisenexus.it",
  });
  assert.equal(ready.configured, true);
  assert.equal(ready.testMode, false);
  assert.equal(ready.liveKeyRejected, false);
});

test("verifies Stripe signatures and rejects stale or altered events", async () => {
  const body = JSON.stringify({ id: "evt_test", type: "checkout.session.completed" });
  const signature = await webhookSignature(body);
  assert.equal(await verifyStripeWebhook(body, signature, webhookSecret), true);
  assert.equal(await verifyStripeWebhook(`${body} `, signature, webhookSecret), false);
  const staleTimestamp = Math.floor(Date.now() / 1000) - 301;
  assert.equal(await verifyStripeWebhook(body, await webhookSignature(body, staleTimestamp), webhookSecret), false);
});

test("creates test checkout and refund requests with fixed server-side amounts and idempotency", { concurrency: false }, async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).endsWith("/checkout/sessions")) return Response.json({ id: "cs_test_checkout_001", url: "https://checkout.stripe.test/session" });
    return Response.json({ id: "re_test_refund_001", status: "succeeded", payment_intent: "pi_test_payment_001" });
  };
  try {
    const checkout = await createStripeCheckoutSession({
      secretKey: testKey,
      origin: "https://lorewise.example",
      customerEmail: "member@example.invalid",
      orderId: "order-001",
      orderReference: "LW-20260819-ABC123",
      product: {
        code: "GS-GAME-001-WIN", slug: "the-wound-remembers", title: "The Wound Remembers · Edizione Windows",
        description: "Licenza personale", productType: "game", resourceType: "game", amountCents: 599,
        currency: "eur", licenseType: "personal-software", downloadLimit: 5,
      },
    });
    assert.equal(checkout.id, "cs_test_checkout_001");
    const checkoutBody = new URLSearchParams(calls[0].init.body);
    assert.equal(checkoutBody.get("line_items[0][price_data][unit_amount]"), "599");
    assert.equal(checkoutBody.get("metadata[order_id]"), "order-001");
    assert.equal(calls[0].init.headers["Idempotency-Key"], "lorewise-order-order-001");

    const refund = await createStripeTestRefund({ secretKey: testKey, paymentIntentId: "pi_test_payment_001", orderId: "order-001", supportRequestId: "support-001" });
    assert.equal(refund.status, "succeeded");
    const refundBody = new URLSearchParams(calls[1].init.body);
    assert.equal(refundBody.get("payment_intent"), "pi_test_payment_001");
    assert.equal(refundBody.get("metadata[support_request_id]"), "support-001");
    assert.equal(calls[1].init.headers["Idempotency-Key"], "lorewise-refund-support-001");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("supports live checkout and refunds while refusing live checkout on localhost", { concurrency: false }, async () => {
  const liveKey = `sk_live_${"D".repeat(24)}`;
  await assert.rejects(() => createStripeCheckoutSession({
    secretKey: liveKey, origin: "http://localhost:3000", customerEmail: "member@example.invalid",
    orderId: "order-live", orderReference: "LW-LIVE", product: {
      code: "LW-ART-003", slug: "legami-infernali", title: "Legami Infernali", description: "Opera",
      productType: "artwork", resourceType: "artwork", amountCents: 1790, currency: "eur",
      licenseType: "personal-digital", downloadLimit: 3,
    },
  }), /dominio pubblico HTTPS/);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => String(url).endsWith("/checkout/sessions")
    ? Response.json({ id: "cs_live_checkout_001", url: "https://checkout.stripe.com/live-session" })
    : Response.json({ id: "re_live_refund_001", status: "succeeded", payment_intent: "pi_live_001" });
  try {
    const checkout = await createStripeCheckoutSession({
      secretKey: liveKey, origin: "https://lorewisenexus.it", customerEmail: "member@example.invalid",
      orderId: "order-live", orderReference: "LW-LIVE", product: {
        code: "LW-ART-003", slug: "legami-infernali", title: "Legami Infernali", description: "Opera",
        productType: "artwork", resourceType: "artwork", amountCents: 1790, currency: "eur",
        licenseType: "personal-digital", downloadLimit: 3,
      },
    });
    assert.equal(checkout.id, "cs_live_checkout_001");
    const refund = await createStripeTestRefund({ secretKey: liveKey, paymentIntentId: "pi_live_001", orderId: "order-live", supportRequestId: "support-live" });
    assert.equal(refund.id, "re_live_refund_001");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("creates recurring checkout and updates test subscription cancellation", { concurrency: false }, async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).endsWith("/checkout/sessions")) return Response.json({ id: "cs_test_subscription_001", url: "https://checkout.stripe.test/subscription" });
    return Response.json({ id: "sub_test_001", status: "active", cancel_at_period_end: true, current_period_end: 1789776000 });
  };
  try {
    await createStripeCheckoutSession({
      secretKey: testKey, origin: "https://lorewise.example", customerEmail: "member@example.invalid",
      orderId: "order-pass-001", orderReference: "LW-PASS-001", product: {
        code: "LW-PASS-SUPPORTER", slug: "supporter", title: "LoreWise Supporter", description: "Pass mensile",
        productType: "subscription", resourceType: "subscription", amountCents: 790, currency: "eur",
        licenseType: "subscription-access", downloadLimit: 0,
      },
    });
    const checkoutBody = new URLSearchParams(calls[0].init.body);
    assert.equal(checkoutBody.get("mode"), "subscription");
    assert.equal(checkoutBody.get("line_items[0][price_data][recurring][interval]"), "month");
    assert.equal(checkoutBody.get("subscription_data[metadata][order_id]"), "order-pass-001");
    assert.equal(checkoutBody.get("payment_intent_data[metadata][order_id]"), null);

    const updated = await setStripeTestSubscriptionCancellation({ secretKey: testKey, subscriptionId: "sub_test_001", cancelAtPeriodEnd: true });
    assert.equal(updated.cancel_at_period_end, true);
    const cancellationBody = new URLSearchParams(calls[1].init.body);
    assert.equal(cancellationBody.get("cancel_at_period_end"), "true");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("cancels a Stripe test subscription immediately", { concurrency: false }, async () => {
  const originalFetch = globalThis.fetch;
  let captured = null;
  globalThis.fetch = async (url, init) => {
    captured = { url: String(url), init };
    return Response.json({ id: "sub_test_cancel_001", status: "canceled" });
  };
  try {
    const result = await cancelStripeTestSubscription({ secretKey: testKey, subscriptionId: "sub_test_cancel_001" });
    assert.equal(result.status, "canceled");
    assert.match(captured.url, /subscriptions\/sub_test_cancel_001$/);
    assert.equal(captured.init.method, "DELETE");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("retrieves the payment intent from the current Stripe invoice payment collection", { concurrency: false }, async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  globalThis.fetch = async (url) => {
    capturedUrl = String(url);
    return Response.json({
      id: "in_test_001",
      payments: { data: [{ payment: { type: "payment_intent", payment_intent: "pi_test_invoice_001" } }] },
    });
  };
  try {
    const paymentIntent = await retrieveStripeTestInvoicePaymentIntent({ secretKey: testKey, invoiceId: "in_test_001" });
    assert.equal(paymentIntent, "pi_test_invoice_001");
    assert.match(capturedUrl, /expand%5B%5D=payments\.data\.payment/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
