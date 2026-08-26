import { env } from "@/lib/netlifyRuntime";
import { ensureMarketingTables, recordMarketingConsent } from "@/lib/marketingEmail";

type RuntimeEnv = { DB?: D1Database };

function validToken(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value);
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!validToken(token)) return Response.json({ valid: false }, { headers: { "Cache-Control": "private, no-store" } });
  const database = (env as unknown as RuntimeEnv).DB;
  if (!database) return Response.json({ valid: true, localPreview: true }, { headers: { "Cache-Control": "private, no-store" } });
  await ensureMarketingTables(database);
  const row = await database.prepare("SELECT id FROM marketing_deliveries WHERE unsubscribe_token = ? LIMIT 1").bind(token).first();
  return Response.json({ valid: Boolean(row) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Origine non valida." }, { status: 403 });
  const body = await request.json().catch(() => null) as { token?: unknown } | null;
  if (!validToken(body?.token)) return Response.json({ error: "Link di disattivazione non valido." }, { status: 400 });
  const database = (env as unknown as RuntimeEnv).DB;
  if (!database) return Response.json({ message: "Anteprima locale: la procedura è pronta, ma non modifica dati reali.", localPreview: true });
  await ensureMarketingTables(database);
  const delivery = await database.prepare("SELECT customer_id FROM marketing_deliveries WHERE unsubscribe_token = ? LIMIT 1").bind(body.token).first<{ customer_id: string | null }>();
  if (!delivery?.customer_id) return Response.json({ error: "Link di disattivazione non valido o non più disponibile." }, { status: 404 });
  await database.prepare("UPDATE customers SET studio_updates_emails = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(delivery.customer_id).run();
  await database.prepare("UPDATE marketing_deliveries SET status = 'revoked', last_error = NULL, updated_at = CURRENT_TIMESTAMP WHERE customer_id = ? AND status IN ('queued', 'failed')").bind(delivery.customer_id).run();
  await recordMarketingConsent(database, { customerId: delivery.customer_id, channel: "studio_updates", granted: false, source: "unsubscribe" });
  return Response.json({ message: "Le email “Novità di GiWise Studio” sono state disattivate. Le comunicazioni necessarie per account, ordini e sicurezza restano attive." });
}
