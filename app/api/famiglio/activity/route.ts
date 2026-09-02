import { env } from "@/lib/netlifyRuntime";
import { familiarVisitActivity, type FamiliarMissionActivity } from "@/lib/nexusFamiliarMissionCatalog";
import { recordFamiliarMissionActivity } from "@/lib/nexusFamiliarMissionServer";
import { netlifyDatabaseIsConfigured } from "@/lib/localAccountFallback";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { getLoreWiseUser, isLocalLoreWiseRequest } from "@/lib/supabase/server";

type RuntimeEnv = { DB?: D1Database };
const visitActivities = new Set<FamiliarMissionActivity>(["artwork_visit", "guide_visit", "chronicle_visit", "project_visit"]);
const careSources = new Set(["food", "soap", "medicine", "toy", "rest"]);

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Origine non valida." }, { status: 403 });
  const user = await getLoreWiseUser();
  if (!user) return Response.json({ recorded: false }, { status: 401 });
  const body = await request.json().catch(() => null) as { activity?: unknown; sourceKey?: unknown } | null;
  const activity = typeof body?.activity === "string" ? body.activity as FamiliarMissionActivity : null;
  const sourceKey = typeof body?.sourceKey === "string" ? body.sourceKey.trim().slice(0, 180) : "";
  if (!activity || !sourceKey) return Response.json({ error: "Attivita non valida." }, { status: 400 });

  if (visitActivities.has(activity)) {
    const mapped = familiarVisitActivity(sourceKey);
    if (!mapped || mapped.activity !== activity || mapped.sourceKey !== sourceKey.toLocaleLowerCase("it")) {
      return Response.json({ error: "Percorso non valido." }, { status: 400 });
    }
  } else if (activity !== "familiar_care" || !careSources.has(sourceKey)) {
    return Response.json({ error: "Attivita non ammessa." }, { status: 400 });
  }

  if (await isLocalLoreWiseRequest() && !netlifyDatabaseIsConfigured()) {
    return Response.json({ recorded: false, localPreview: true }, { status: 202 });
  }
  const database = (env as unknown as RuntimeEnv).DB;
  if (!database) return Response.json({ error: "Missioni non disponibili." }, { status: 503 });
  try {
    await syncLoreWiseCustomer(user);
    const recorded = await recordFamiliarMissionActivity(database, { customerId: user.id, activity, sourceKey });
    return Response.json({ recorded }, { status: 202, headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Attivita non registrata." }, { status: 503 });
  }
}
