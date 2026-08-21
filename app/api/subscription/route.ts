import { ensureCommerceTables } from "@/lib/commerceServer";
import { getStripeConfiguration, setStripeSubscriptionCancellation, type StripeRuntimeEnv } from "@/lib/stripe";
import { getLoreWiseUser } from "@/lib/supabase/server";

type RuntimeEnv = StripeRuntimeEnv & { DB?: D1Database };

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const origin = request.headers.get("origin");
    if (origin && origin !== url.origin) return Response.json({ error: "Origine della richiesta non valida." }, { status: 403 });
    const user = await getLoreWiseUser();
    if (!user) return Response.json({ error: "Accedi al tuo LoreWise ID." }, { status: 401 });
    const body = await request.json().catch(() => null) as { cancelAtPeriodEnd?: unknown } | null;
    if (typeof body?.cancelAtPeriodEnd !== "boolean") return Response.json({ error: "Scelta non valida." }, { status: 400 });

    const { env } = await import("cloudflare:workers");
    const runtime = env as unknown as RuntimeEnv;
    const stripe = getStripeConfiguration(runtime);
    if (!runtime.DB || !stripe.configured) {
      return Response.json({ error: stripe.blockers[0] || "Gestione abbonamento non configurata." }, { status: 503 });
    }
    await ensureCommerceTables(runtime.DB);
    const subscription = await runtime.DB.prepare(`SELECT id, stripe_subscription_id FROM subscriptions
      WHERE customer_id = ? AND status IN ('active', 'trialing', 'past_due') ORDER BY created_at DESC LIMIT 1`)
      .bind(user.id).first<{ id: string; stripe_subscription_id: string | null }>();
    if (!subscription?.stripe_subscription_id) return Response.json({ error: "Nessun abbonamento Stripe attivo trovato." }, { status: 404 });

    const updated = await setStripeSubscriptionCancellation({
      secretKey: stripe.secretKey,
      subscriptionId: subscription.stripe_subscription_id,
      cancelAtPeriodEnd: body.cancelAtPeriodEnd,
    });
    const periodEnd = Number.isFinite(updated.current_period_end)
      ? new Date(Number(updated.current_period_end) * 1000).toISOString()
      : null;
    await runtime.DB.prepare(`UPDATE subscriptions SET status = ?, cancel_at_period_end = ?,
      current_period_end = COALESCE(?, current_period_end), updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(updated.status ?? "active", updated.cancel_at_period_end ? 1 : 0, periodEnd, subscription.id).run();
    return Response.json({ success: true, cancelAtPeriodEnd: Boolean(updated.cancel_at_period_end), currentPeriodEnd: periodEnd }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return Response.json({ error: "Non è stato possibile aggiornare l’abbonamento." }, { status: 502 });
  }
}
