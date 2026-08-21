import { ensureCommerceTables } from "@/lib/commerceServer";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { getLoreWiseUser } from "@/lib/supabase/server";
import { getActiveUniversePass, isPermanentCollectorEmail, universePassBenefitFromCode } from "@/lib/universePass";

export type VipRuntimeEnv = { DB?: D1Database; COMMISSION_UPLOADS?: R2Bucket };

export async function requireVipAccess() {
  const user = await getLoreWiseUser();
  if (!user?.email) {
    return { error: Response.json({ error: "Accedi al tuo LoreWise ID per entrare nella VIP Zone.", reason: "signed-out" }, { status: 401, headers: { "Cache-Control": "private, no-store" } }) } as const;
  }

  const { env } = await import("cloudflare:workers");
  const runtime = env as unknown as VipRuntimeEnv;
  if (!runtime.DB) {
    return { error: Response.json({ error: "La verifica del Pass non è disponibile in questo momento.", reason: "unavailable" }, { status: 503, headers: { "Cache-Control": "private, no-store" } }) } as const;
  }

  await syncLoreWiseCustomer(user);
  await ensureCommerceTables(runtime.DB);
  const customer = await runtime.DB.prepare("SELECT status FROM customers WHERE id = ? LIMIT 1")
    .bind(user.id).first<{ status: string }>();
  if (customer?.status !== "active") {
    return { error: Response.json({ error: "Questo profilo LoreWise non è abilitato.", reason: "disabled" }, { status: 403, headers: { "Cache-Control": "private, no-store" } }) } as const;
  }

  const pass = isPermanentCollectorEmail(user.email)
    ? universePassBenefitFromCode("LW-PASS-COLLECTOR")
    : await getActiveUniversePass(runtime.DB, user.id);
  if (!pass.active) {
    return { error: Response.json({ error: "Questa sezione è riservata a un Universe Pass attivo.", reason: "pass-required" }, { status: 403, headers: { "Cache-Control": "private, no-store" } }) } as const;
  }

  return { user, pass, runtime } as const;
}
