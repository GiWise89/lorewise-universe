import { env } from "@/lib/netlifyRuntime";
import { familiarVisitActivity, type FamiliarMissionActivity } from "@/lib/nexusFamiliarMissionCatalog";
import { recordFamiliarMissionActivity } from "@/lib/nexusFamiliarMissionServer";
import { netlifyDatabaseIsConfigured } from "@/lib/localAccountFallback";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { getLoreWiseUser, isLocalLoreWiseRequest } from "@/lib/supabase/server";
import { isSameSiteOrigin } from "@/lib/requestOrigin";

type RuntimeEnv = { DB?: D1Database };
const visitActivities = new Set<FamiliarMissionActivity>(["artwork_visit", "guide_visit", "chronicle_visit", "project_visit"]);
const careSources = new Set(["food", "soap", "medicine", "toy", "rest", "feed", "play", "clean", "care"]);
const gameActivities = new Set<FamiliarMissionActivity>(["familiar_battle", "familiar_expedition", "familiar_tower_floor"]);
// Risposte legate all'account: mai in cache condivise, anche per errori e 401.
const json = (body: Record<string, unknown>, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!isSameSiteOrigin(request, origin)) return json({ error: "Origine non valida." }, 403);
  try {
    const user = await getLoreWiseUser();
    if (!user) return json({ recorded: false }, 401);
    const body = await request.json().catch(() => null) as { activity?: unknown; sourceKey?: unknown } | null;
    const activity = typeof body?.activity === "string" ? body.activity as FamiliarMissionActivity : null;
    const sourceKey = typeof body?.sourceKey === "string" ? body.sourceKey.trim().slice(0, 180) : "";
    if (!activity || !sourceKey) return json({ error: "Attivita non valida." }, 400);

    if (visitActivities.has(activity)) {
      const mapped = familiarVisitActivity(sourceKey);
      if (!mapped || mapped.activity !== activity || mapped.sourceKey !== sourceKey.toLocaleLowerCase("it")) {
        return json({ error: "Percorso non valido." }, 400);
      }
    } else if (activity === "familiar_care" ? !careSources.has(sourceKey) : !gameActivities.has(activity) || !/^[a-z0-9:_-]{3,180}$/i.test(sourceKey)) {
      return json({ error: "Attivita non ammessa." }, 400);
    }

    if (await isLocalLoreWiseRequest() && !netlifyDatabaseIsConfigured()) {
      return json({ recorded: false, localPreview: true }, 202);
    }
    const database = (env as unknown as RuntimeEnv).DB;
    if (!database) return json({ error: "Missioni non disponibili." }, 503);
    await syncLoreWiseCustomer(user);
    const recorded = await recordFamiliarMissionActivity(database, { customerId: user.id, activity, sourceKey });
    return json({ recorded }, 202);
  } catch {
    return json({ error: "Attivita non registrata." }, 503);
  }
}
