import { env } from "@/lib/netlifyRuntime";

import { ensureCommerceTables } from "@/lib/commerceServer";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { getLoreWiseUser } from "@/lib/supabase/server";

type RuntimeEnv = { DB?: D1Database };

export async function requireOrderAdmin() {
  const user = await getLoreWiseUser();
  if (!user?.email) return { response: Response.json({ error: "Sessione amministratore non valida." }, { status: 401 }) };
  const runtime = env as unknown as RuntimeEnv;
  if (!runtime.DB) return { response: Response.json({ error: "Archivio ordini non disponibile." }, { status: 503 }) };
  await syncLoreWiseCustomer(user);
  await ensureCommerceTables(runtime.DB);
  const customer = await runtime.DB.prepare("SELECT role, status FROM customers WHERE id = ?").bind(user.id)
    .first<{ role: string; status: string }>();
  if (!customer || customer.role !== "admin" || customer.status !== "active") {
    return { response: Response.json({ error: "Accesso riservato all’amministratore LoreWise." }, { status: 403 }) };
  }
  return { database: runtime.DB, adminId: user.id, adminEmail: user.email };
}
