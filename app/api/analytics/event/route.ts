import { env } from "@/lib/netlifyRuntime";
import { isLoreWisePublicHost, normalizeRequestHost, recordSitePageView } from "@/lib/siteAnalytics";

type RuntimeEnv = { DB?: D1Database };

const allowedEvents = new Set(["landing_view", "play_cta_click"]);

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const host = normalizeRequestHost(request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
  if (!isLoreWisePublicHost(host)) return json({ tracked: false, reason: "non-production-host" });
  const origin = request.headers.get("origin");
  try {
    if (!origin || normalizeRequestHost(new URL(origin).host) !== host) return json({ error: "Origine non autorizzata." }, 403);
  } catch { return json({ error: "Origine non valida." }, 403); }

  const body = await request.json().catch(() => null) as { event?: unknown; source?: unknown; sessionId?: unknown } | null;
  const event = typeof body?.event === "string" ? body.event : "";
  const source = typeof body?.source === "string" ? body.source.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 48) : "unknown";
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
  if (!allowedEvents.has(event) || !/^[a-f0-9-]{20,80}$/i.test(sessionId)) return json({ error: "Evento funnel non valido." }, 400);

  const runtime = env as unknown as RuntimeEnv;
  if (!runtime.DB) return json({ error: "Archivio visite non disponibile." }, 503);
  await recordSitePageView(runtime.DB, { host, path: `/__funnel/${event}/${source}`, sessionId });
  return json({ tracked: true }, 202);
}
