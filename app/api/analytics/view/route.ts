import { env } from "@/lib/netlifyRuntime";
import { isLoreWisePublicHost, isTrackablePublicPath, normalizeRequestHost, recordSitePageView } from "@/lib/siteAnalytics";

type RuntimeEnv = { DB?: D1Database };

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
  if (/bot|crawler|spider|preview|facebookexternalhit|whatsapp/i.test(request.headers.get("user-agent") ?? "")) return json({ tracked: false, reason: "automated-client" });

  const body = await request.json().catch(() => null) as { path?: unknown; sessionId?: unknown; referrerHost?: unknown } | null;
  const path = typeof body?.path === "string" ? body.path : "";
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
  const candidateReferrer = typeof body?.referrerHost === "string" ? normalizeRequestHost(body.referrerHost).slice(0, 160) : "";
  const referrerHost = /^[a-z0-9.-]+$/i.test(candidateReferrer) ? candidateReferrer : "";
  if (!isTrackablePublicPath(path) || !/^[a-f0-9-]{20,80}$/i.test(sessionId)) return json({ error: "Evento visita non valido." }, 400);

  const runtime = env as unknown as RuntimeEnv;
  if (!runtime.DB) return json({ error: "Archivio visite non disponibile." }, 503);
  await recordSitePageView(runtime.DB, { host, path, sessionId, referrerHost });
  return json({ tracked: true }, 202);
}
