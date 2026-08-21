import { env } from "@/lib/netlifyRuntime";

import { ensureCommerceTables } from "@/lib/commerceServer";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { getLoreWiseUser } from "@/lib/supabase/server";
import { getActiveUniversePass, isPermanentCollectorEmail, universePassBenefitFromCode } from "@/lib/universePass";
import { evaluateVipAccess } from "@/lib/vipMember";

export type VipRuntimeEnv = { DB?: D1Database; COMMISSION_UPLOADS?: R2Bucket };

export async function requireVipAccess(options: { prepareCommerce?: boolean } = {}) {
  const user = await getLoreWiseUser();
  if (!user?.email || !evaluateVipAccess({ authenticated: true, accountActive: true, passActive: true }).allowed) {
    return { error: Response.json({ error: "Accedi al tuo LoreWise ID per entrare nella VIP Zone.", reason: "signed-out" }, { status: 401, headers: { "Cache-Control": "private, no-store" } }) } as const;
  }

  const runtime = env as unknown as VipRuntimeEnv;
  if (!runtime.DB) {
    return { error: Response.json({ error: "La verifica del Pass non è disponibile in questo momento.", reason: "unavailable" }, { status: 503, headers: { "Cache-Control": "private, no-store" } }) } as const;
  }

  if (options.prepareCommerce !== false) {
    await syncLoreWiseCustomer(user);
    await ensureCommerceTables(runtime.DB);
  }
  const customer = await runtime.DB.prepare("SELECT status FROM customers WHERE id = ? LIMIT 1")
    .bind(user.id).first<{ status: string }>();
  if (!evaluateVipAccess({ authenticated: true, accountActive: customer?.status === "active", passActive: true }).allowed) {
    return { error: Response.json({ error: "Questo profilo LoreWise non è abilitato.", reason: "disabled" }, { status: 403, headers: { "Cache-Control": "private, no-store" } }) } as const;
  }

  const pass = isPermanentCollectorEmail(user.email)
    ? universePassBenefitFromCode("LW-PASS-COLLECTOR")
    : await getActiveUniversePass(runtime.DB, user.id);
  if (!evaluateVipAccess({ authenticated: true, accountActive: true, passActive: pass.active }).allowed) {
    return { error: Response.json({ error: "Questa sezione è riservata a un Universe Pass attivo.", reason: "pass-required" }, { status: 403, headers: { "Cache-Control": "private, no-store" } }) } as const;
  }

  return { user, pass, runtime } as const;
}
