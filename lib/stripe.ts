import type { CommercialProduct } from "@/lib/commercialCatalog";

export type StripeMode = "test" | "live";
export type StripeRuntimeEnv = {
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  LOREWISE_STRIPE_MODE?: string;
  LOREWISE_LIVE_PAYMENTS_APPROVED?: string;
  LOREWISE_COMMERCIAL_LEGAL_APPROVED?: string;
  LOREWISE_PUBLICATION_APPROVED?: string;
  NEXT_PUBLIC_SITE_URL?: string;
};

type CheckoutSession = { id: string; url: string | null };

function enabled(value: string | undefined) {
  return value?.trim().toLowerCase() === "true";
}

function keyMode(secretKey: string): StripeMode | null {
  if (/^sk_test_[A-Za-z0-9]{16,}$/.test(secretKey)) return "test";
  if (/^sk_live_[A-Za-z0-9]{16,}$/.test(secretKey)) return "live";
  return null;
}

function securePublicOrigin(value: string | undefined) {
  try {
    const url = new URL(value?.trim() ?? "");
    return url.protocol === "https:" && !["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

export function getStripeConfiguration(env: StripeRuntimeEnv) {
  const secretKey = env.STRIPE_SECRET_KEY?.trim() ?? "";
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  const mode: StripeMode = env.LOREWISE_STRIPE_MODE?.trim().toLowerCase() === "live" ? "live" : "test";
  const detectedMode = keyMode(secretKey);
  const webhookConfigured = /^whsec_[A-Za-z0-9]{16,}$/.test(webhookSecret);
  const liveApprovals = enabled(env.LOREWISE_LIVE_PAYMENTS_APPROVED)
    && enabled(env.LOREWISE_COMMERCIAL_LEGAL_APPROVED)
    && enabled(env.LOREWISE_PUBLICATION_APPROVED);
  const publicOriginApproved = securePublicOrigin(env.NEXT_PUBLIC_SITE_URL);
  const modeKeyMatches = detectedMode === mode;
  const liveGateReady = mode === "test" || (liveApprovals && publicOriginApproved);
  const checkoutConfigured = modeKeyMatches && liveGateReady;
  const blockers: string[] = [];

  if (!detectedMode) blockers.push("Inserire una chiave segreta Stripe valida.");
  else if (!modeKeyMatches) blockers.push(`La chiave Stripe non corrisponde alla modalità ${mode}.`);
  if (!webhookConfigured) blockers.push("Configurare il segreto webhook Stripe dell'ambiente selezionato.");
  if (mode === "live" && !enabled(env.LOREWISE_COMMERCIAL_LEGAL_APPROVED)) blockers.push("Confermare l'inquadramento commerciale prima del primo incasso.");
  if (mode === "live" && !enabled(env.LOREWISE_PUBLICATION_APPROVED)) blockers.push("Registrare l'autorizzazione finale alla pubblicazione.");
  if (mode === "live" && !enabled(env.LOREWISE_LIVE_PAYMENTS_APPROVED)) blockers.push("Registrare l'autorizzazione finale ai pagamenti reali.");
  if (mode === "live" && !publicOriginApproved) blockers.push("Configurare un dominio pubblico HTTPS valido.");

  return {
    secretKey,
    webhookSecret,
    mode,
    testMode: mode === "test",
    liveMode: mode === "live",
    detectedMode,
    checkoutConfigured,
    webhookConfigured,
    configured: checkoutConfigured && webhookConfigured,
    liveKeyRejected: detectedMode === "live" && mode !== "live",
    liveApprovals,
    publicOriginApproved,
    blockers,
  };
}

/** Compatibilità temporanea con gli strumenti di collaudo già esistenti. */
export const getStripeTestConfiguration = getStripeConfiguration;

function requireStripeSecret(secretKey: string) {
  const mode = keyMode(secretKey);
  if (!mode) throw new Error("È necessaria una chiave segreta Stripe valida.");
  return mode;
}

function addMetadata(form: URLSearchParams, scope: string, metadata: Record<string, string>) {
  const prefix = scope ? `${scope}[metadata]` : "metadata";
  Object.entries(metadata).forEach(([key, value]) => form.set(`${prefix}[${key}]`, value));
}

export async function createStripeCheckoutSession(input: {
  secretKey: string; origin: string; customerEmail: string; orderId: string; orderReference: string; product: CommercialProduct;
}) {
  const mode = requireStripeSecret(input.secretKey);
  const origin = new URL(input.origin);
  if (mode === "live" && (origin.protocol !== "https:" || ["localhost", "127.0.0.1", "::1"].includes(origin.hostname))) {
    throw new Error("Stripe live richiede il dominio pubblico HTTPS.");
  }
  const metadata = { order_id: input.orderId, product_code: input.product.code, product_type: input.product.productType };
  const form = new URLSearchParams({
    mode: input.product.productType === "subscription" ? "subscription" : "payment",
    success_url: `${origin.origin}/account?pagamento=riuscito&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin.origin}/account/ordini/${encodeURIComponent(input.orderReference)}?pagamento=annullato`,
    customer_email: input.customerEmail,
    client_reference_id: input.orderId,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": input.product.currency,
    "line_items[0][price_data][unit_amount]": String(input.product.amountCents),
    "line_items[0][price_data][product_data][name]": input.product.title,
    "line_items[0][price_data][product_data][description]": input.product.description,
  });
  addMetadata(form, "", metadata);
  if (input.product.productType === "subscription") {
    form.set("line_items[0][price_data][recurring][interval]", "month");
    addMetadata(form, "subscription_data", metadata);
  } else {
    addMetadata(form, "payment_intent_data", metadata);
  }
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": `lorewise-order-${input.orderId}`,
    },
    body: form,
    signal: AbortSignal.timeout(12_000),
  });
  const payload = await response.json() as CheckoutSession & { error?: { message?: string } };
  if (!response.ok || !payload.id || !payload.url) throw new Error(payload.error?.message || "Stripe non ha creato la sessione di pagamento.");
  return payload;
}

export async function setStripeSubscriptionCancellation(input: {
  secretKey: string; subscriptionId: string; cancelAtPeriodEnd: boolean;
}) {
  requireStripeSecret(input.secretKey);
  if (!/^sub_[A-Za-z0-9_]+$/.test(input.subscriptionId)) throw new Error("Abbonamento Stripe non valido.");
  const form = new URLSearchParams({ cancel_at_period_end: input.cancelAtPeriodEnd ? "true" : "false" });
  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(input.subscriptionId)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${input.secretKey}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
    signal: AbortSignal.timeout(12_000),
  });
  const payload = await response.json() as { id?: string; status?: string; cancel_at_period_end?: boolean; current_period_end?: number; error?: { message?: string } };
  if (!response.ok || payload.id !== input.subscriptionId) throw new Error(payload.error?.message || "Stripe non ha aggiornato l'abbonamento.");
  return payload;
}

export async function cancelStripeSubscription(input: { secretKey: string; subscriptionId: string }) {
  requireStripeSecret(input.secretKey);
  if (!/^sub_[A-Za-z0-9_]+$/.test(input.subscriptionId)) throw new Error("Abbonamento Stripe non valido.");
  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(input.subscriptionId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${input.secretKey}` },
    signal: AbortSignal.timeout(12_000),
  });
  const payload = await response.json() as { id?: string; status?: string; error?: { message?: string } };
  if (!response.ok || payload.id !== input.subscriptionId || payload.status !== "canceled") {
    throw new Error(payload.error?.message || "Stripe non ha annullato l'abbonamento.");
  }
  return payload as { id: string; status: "canceled" };
}

type StripeInvoicePayment = { payment?: { type?: string; payment_intent?: string | { id?: string } | null } | null };

export async function retrieveStripeInvoicePaymentIntent(input: { secretKey: string; invoiceId: string }) {
  requireStripeSecret(input.secretKey);
  if (!/^in_[A-Za-z0-9_]+$/.test(input.invoiceId)) throw new Error("Fattura Stripe non valida.");
  const query = new URLSearchParams();
  query.append("expand[]", "payments.data.payment");
  const response = await fetch(`https://api.stripe.com/v1/invoices/${encodeURIComponent(input.invoiceId)}?${query}`, {
    headers: { Authorization: `Bearer ${input.secretKey}` },
    signal: AbortSignal.timeout(12_000),
  });
  const payload = await response.json() as { id?: string; payments?: { data?: StripeInvoicePayment[] }; error?: { message?: string } };
  if (!response.ok || payload.id !== input.invoiceId) throw new Error(payload.error?.message || "Stripe non ha restituito la fattura.");
  const value = payload.payments?.data?.find((entry) => entry.payment?.type === "payment_intent")?.payment?.payment_intent;
  const paymentIntentId = typeof value === "string" ? value : value?.id;
  return typeof paymentIntentId === "string" && /^pi_[A-Za-z0-9_]+$/.test(paymentIntentId) ? paymentIntentId : null;
}

export async function expireStripeCheckoutSession(secretKey: string, sessionId: string) {
  const mode = requireStripeSecret(secretKey);
  if (!new RegExp(`^cs_${mode}_[A-Za-z0-9_]+$`).test(sessionId)) throw new Error("Sessione Stripe non valida per l'ambiente selezionato.");
  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}/expire`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secretKey}` },
    signal: AbortSignal.timeout(12_000),
  });
  const payload = await response.json() as { id?: string; status?: string; error?: { message?: string } };
  if (!response.ok || payload.status !== "expired") throw new Error(payload.error?.message || "Stripe non ha chiuso la sessione di pagamento.");
  return payload;
}

export async function createStripeRefund(input: {
  secretKey: string; paymentIntentId: string; orderId: string; supportRequestId: string;
}) {
  requireStripeSecret(input.secretKey);
  if (!/^pi_[A-Za-z0-9_]+$/.test(input.paymentIntentId)) throw new Error("Pagamento Stripe non valido.");
  const form = new URLSearchParams({
    payment_intent: input.paymentIntentId,
    reason: "requested_by_customer",
    "metadata[order_id]": input.orderId,
    "metadata[support_request_id]": input.supportRequestId,
  });
  const response = await fetch("https://api.stripe.com/v1/refunds", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": `lorewise-refund-${input.supportRequestId}`,
    },
    body: form,
    signal: AbortSignal.timeout(12_000),
  });
  const payload = await response.json() as { id?: string; status?: string; payment_intent?: string; error?: { message?: string } };
  if (!response.ok || !payload.id || !["pending", "succeeded"].includes(payload.status ?? "")) {
    throw new Error(payload.error?.message || "Stripe non ha creato il rimborso.");
  }
  return payload as { id: string; status: "pending" | "succeeded"; payment_intent: string };
}

export const setStripeTestSubscriptionCancellation = setStripeSubscriptionCancellation;
export const cancelStripeTestSubscription = cancelStripeSubscription;
export const retrieveStripeTestInvoicePaymentIntent = retrieveStripeInvoicePaymentIntent;
export const createStripeTestRefund = createStripeRefund;

function hexFromBytes(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function safeEqual(first: string, second: string) {
  if (first.length !== second.length) return false;
  let difference = 0;
  for (let index = 0; index < first.length; index += 1) difference |= first.charCodeAt(index) ^ second.charCodeAt(index);
  return difference === 0;
}

export async function verifyStripeWebhook(rawBody: string, signatureHeader: string, secret: string, now = Date.now()) {
  if (!/^whsec_[A-Za-z0-9]{16,}$/.test(secret)) return false;
  const parts = signatureHeader.split(",").map((part) => part.trim().split("=", 2));
  const timestamp = parts.find(([key]) => key === "t")?.[1];
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || signatures.length === 0 || !/^\d+$/.test(timestamp)) return false;
  if (Math.abs(Math.floor(now / 1000) - Number(timestamp)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${rawBody}`));
  const expected = hexFromBytes(new Uint8Array(digest));
  return signatures.some((signature) => safeEqual(signature, expected));
}

export async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return hexFromBytes(new Uint8Array(digest));
}
