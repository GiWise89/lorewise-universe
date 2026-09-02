import { env } from "@/lib/netlifyRuntime";
import { netlifyDatabaseIsConfigured } from "@/lib/localAccountFallback";
import { applyFamiliarTimePassage, restFamiliar, useFamiliarItem as consumeFamiliarItem, type FamiliarActionResult, type FamiliarItemKey, type NexusFamiliarState } from "@/lib/nexusFamiliar";
import { sanitizeFamiliarCloudState } from "@/lib/nexusFamiliarCloud";
import { recordFamiliarMissionActivity } from "@/lib/nexusFamiliarMissionServer";
import { recordFamiliarEconomyEvent, recordFamiliarSyncEvent } from "@/lib/nexusFamiliarEconomyServer";
import { claimFamiliarOuting, purchaseFamiliarGadgetWithCoins, purchaseFamiliarThemeWithCoins, startFamiliarOuting } from "@/lib/nexusFamiliarWorld";
import { claimFamiliarAttendance } from "@/lib/nexusFamiliarRituals";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { createLoreWiseServerClient, getLoreWiseUser, isLocalLoreWiseRequest } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RuntimeEnv = { DB?: D1Database };
type FamiliarRow = { state_json: string; revision: number };
type FamiliarCommand = "care" | "outing-start" | "outing-claim" | "theme" | "gadget" | "attendance";

const headers = { "Cache-Control": "private, no-store" };
const itemKeys = new Set<FamiliarItemKey>(["food", "soap", "medicine", "toy"]);

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers });
}

function metadataFamiliar(user: Awaited<ReturnType<typeof getLoreWiseUser>>) {
  if (!user) return { state: null, revision: 0 };
  const checked = sanitizeFamiliarCloudState(user.user_metadata?.nexus_familiar_state);
  return {
    state: checked.ok ? checked.state : null,
    revision: Math.max(0, Math.floor(Number(user.user_metadata?.nexus_familiar_revision) || 0)),
  };
}

async function databaseFamiliar(database: D1Database, customerId: string) {
  const row = await database.prepare("SELECT state_json, revision FROM nexus_familiars WHERE customer_id = ?")
    .bind(customerId).first<FamiliarRow>();
  if (!row) return { state: null, revision: 0 };
  try {
    const checked = sanitizeFamiliarCloudState(JSON.parse(row.state_json));
    return { state: checked.ok ? checked.state : null, revision: Math.max(0, Math.floor(Number(row.revision) || 0)) };
  } catch {
    return { state: null, revision: Math.max(0, Math.floor(Number(row.revision) || 0)) };
  }
}

function applyCommand(state: NexusFamiliarState, command: FamiliarCommand, value: string, now: Date): FamiliarActionResult {
  if (command === "care") {
    if (value === "rest") return restFamiliar(state, now);
    if (!itemKeys.has(value as FamiliarItemKey)) return { ok: false, state, error: "Azione di cura non valida." };
    return consumeFamiliarItem(state, value as FamiliarItemKey, now);
  }
  if (command === "outing-start") return startFamiliarOuting(state, value, now);
  if (command === "outing-claim") return claimFamiliarOuting(state, now);
  if (command === "theme") return purchaseFamiliarThemeWithCoins(state, value, now);
  if (command === "gadget") return purchaseFamiliarGadgetWithCoins(state, value, now);
  if (command === "attendance") return claimFamiliarAttendance(state, now);
  return { ok: false, state, error: "Comando non riconosciuto." };
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return json({ error: "Origine non valida." }, 403);
    const user = await getLoreWiseUser();
    if (!user) return json({ error: "Accedi al LoreWise ID per proteggere i progressi." }, 401);
    const body = await request.json().catch(() => null) as { command?: unknown; value?: unknown; baseRevision?: unknown } | null;
    const command = typeof body?.command === "string" ? body.command as FamiliarCommand : null;
    const value = typeof body?.value === "string" ? body.value.slice(0, 80) : "";
    const baseRevision = Math.max(0, Math.floor(Number(body?.baseRevision) || 0));
    if (!command || !["care", "outing-start", "outing-claim", "theme", "gadget", "attendance"].includes(command)) return json({ error: "Comando non valido." }, 400);

    const localPreview = await isLocalLoreWiseRequest() && !netlifyDatabaseIsConfigured();
    const current = localPreview ? metadataFamiliar(user) : (env as unknown as RuntimeEnv).DB
      ? await databaseFamiliar((env as unknown as RuntimeEnv).DB as D1Database, user.id)
      : { state: null, revision: 0 };
    if (!current.state) return json({ missingFamiliar: true, error: "Salva prima il nuovo Famiglio nel LoreWise ID.", revision: current.revision }, 409);
    if (current.revision !== baseRevision) return json({ conflict: true, error: "Il Famiglio è stato aggiornato altrove.", familiar: current.state, revision: current.revision }, 409);

    const now = new Date();
    const result = applyCommand(applyFamiliarTimePassage(current.state, now), command, value, now);
    if (!result.ok) return json({ error: result.error, familiar: result.state, revision: current.revision }, 409);
    const revision = current.revision + 1;

    if (localPreview) {
      const client = await createLoreWiseServerClient();
      if (!client) return json({ error: "Servizio account non disponibile." }, 503);
      const { error } = await client.auth.updateUser({ data: {
        ...user.user_metadata,
        nexus_familiar_state: result.state,
        nexus_familiar_revision: revision,
      } });
      if (error) return json({ error: "Progressi non sincronizzati." }, 503);
      return json({ familiar: result.state, revision, message: result.message, localPreview: true });
    }

    const database = (env as unknown as RuntimeEnv).DB;
    if (!database) return json({ error: "Archivio del Famiglio non disponibile." }, 503);
    await syncLoreWiseCustomer(user);
    const updated = await database.prepare(`UPDATE nexus_familiars SET state_json = ?, revision = ?, updated_at = CURRENT_TIMESTAMP
      WHERE customer_id = ? AND revision = ?`)
      .bind(JSON.stringify(result.state), revision, user.id, current.revision).run();
    if (!updated.meta.changes) {
      const latest = await databaseFamiliar(database, user.id);
      return json({ conflict: true, error: "Il Famiglio è stato aggiornato altrove.", familiar: latest.state, revision: latest.revision }, 409);
    }
    const sourceKey = `command:${current.revision}:${command}:${value || "claim"}`;
    const eventType = command === "care" ? "care" as const
      : command.startsWith("outing") ? "outing" as const
        : command === "theme" ? "theme" as const
          : command === "gadget" ? "gadget" as const : "ritual" as const;
    await Promise.all([
      recordFamiliarEconomyEvent(database, {
        customerId: user.id,
        eventType,
        sourceKey,
        before: current.state,
        after: result.state,
        metadata: { command, value },
      }),
      recordFamiliarSyncEvent(database, {
        customerId: user.id,
        familiarId: result.state.familiarId,
        action: "command",
        revisionBefore: current.revision,
        revisionAfter: revision,
        deviceHint: request.headers.get("user-agent"),
      }),
    ]).catch(() => undefined);
    if (command === "care") {
      await recordFamiliarMissionActivity(database, { customerId: user.id, activity: "familiar_care", sourceKey: value }).catch(() => false);
    }
    return json({ familiar: result.state, revision, message: result.message });
  } catch {
    return json({ error: "Il comando non è stato completato." }, 503);
  }
}
