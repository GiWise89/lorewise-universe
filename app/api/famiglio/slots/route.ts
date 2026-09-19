import { env } from "@/lib/netlifyRuntime";
import { netlifyDatabaseIsConfigured } from "@/lib/localAccountFallback";
import { familiarStarterStateIsTrusted } from "@/lib/nexusFamiliarAuthority";
import { FAMILIAR_CLOUD_MAX_BYTES, sanitizeFamiliarCloudState, slotSwapPrimaryStatement, slotSwapSlotStatement } from "@/lib/nexusFamiliarCloud";
import { readBoundedJson } from "@/lib/famiglioRequestOrigin";
import { FAMILIAR_SLOT_OFFER_IDS, familiarSlotEntitlement, familiarSlotSummary, MAX_FAMILIAR_SLOT_COUNT } from "@/lib/nexusFamiliarSlots";
import { isPremiumFamiliarAppearance, purchasedFamiliarOfferIds, purchasedPremiumFamiliarIds } from "@/lib/nexusFamiliarCommerce";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { createLoreWiseServerClient, getLoreWiseUser, isLocalLoreWiseRequest } from "@/lib/supabase/server";
import { getActiveUniversePass } from "@/lib/universePass";
import { getFamiglioUser, saveLocalGameData } from "@/lib/localPreviewGameStore";
import { isSameSiteOrigin } from "@/lib/requestOrigin";

export const dynamic = "force-dynamic";

type RuntimeEnv = { DB?: D1Database };
type FamiliarRow = { state_json: string; revision: number };
type StoredSlot = { state: unknown; revision: number };

const privateHeaders = { "Cache-Control": "private, no-store" };

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: privateHeaders });
}

function checkedState(value: unknown) {
  const checked = sanitizeFamiliarCloudState(value);
  return checked.ok ? checked.state : null;
}

function metadataCurrent(user: Awaited<ReturnType<typeof getLoreWiseUser>>) {
  if (!user) return { state: null, revision: 0 };
  return {
    state: checkedState(user.user_metadata?.nexus_familiar_state),
    revision: Math.max(0, Math.floor(Number(user.user_metadata?.nexus_familiar_revision) || 0)),
  };
}

function metadataSlots(user: Awaited<ReturnType<typeof getLoreWiseUser>>) {
  if (!user || !Array.isArray(user.user_metadata?.nexus_familiar_slots)) return [];
  return user.user_metadata.nexus_familiar_slots.slice(0, MAX_FAMILIAR_SLOT_COUNT - 1).flatMap((entry: unknown) => {
    if (!entry || typeof entry !== "object") return [];
    const stored = entry as StoredSlot;
    const state = checkedState(stored.state);
    return state ? [{ state, revision: Math.max(1, Math.floor(Number(stored.revision) || 1)) }] : [];
  });
}

async function databaseCurrent(database: D1Database, customerId: string) {
  const row = await database.prepare("SELECT state_json, revision FROM nexus_familiars WHERE customer_id = ? LIMIT 1")
    .bind(customerId).first<FamiliarRow>();
  if (!row) return { state: null, revision: 0 };
  try {
    return { state: checkedState(JSON.parse(row.state_json)), revision: Math.max(0, Number(row.revision) || 0) };
  } catch {
    return { state: null, revision: Math.max(0, Number(row.revision) || 0) };
  }
}

async function databaseSlots(database: D1Database, customerId: string) {
  const rows = await database.prepare(`SELECT state_json, revision FROM nexus_familiar_slots
    WHERE customer_id = ? ORDER BY created_at ASC LIMIT 2`).bind(customerId).all<FamiliarRow>();
  return rows.results.flatMap((row) => {
    try {
      const state = checkedState(JSON.parse(row.state_json));
      return state ? [{ state, revision: Math.max(1, Number(row.revision) || 1) }] : [];
    } catch {
      return [];
    }
  });
}

function purchasedSlotCount(purchasedOfferIds: string[]) {
  return FAMILIAR_SLOT_OFFER_IDS.filter((id) => purchasedOfferIds.includes(id)).length;
}

function rosterResponse(current: Awaited<ReturnType<typeof databaseCurrent>>, stored: Awaited<ReturnType<typeof databaseSlots>>, purchasedAppearanceIds: string[] = [], purchasedOfferIds: string[] = []) {
  const states = [current.state ? familiarSlotSummary(current.state, true) : null, ...stored.map((entry) => familiarSlotSummary(entry.state, false))].filter(Boolean);
  return {
    ...familiarSlotEntitlement(purchasedSlotCount(purchasedOfferIds), states.length),
    slots: states,
    revision: current.revision,
    purchasedAppearanceIds,
    purchasedOfferIds,
  };
}

export async function GET() {
  try {
    const user = await getFamiglioUser();
    if (!user) return json({ authenticated: false, ...familiarSlotEntitlement(0, 0), slots: [] }, 401);
    if (await isLocalLoreWiseRequest() && !netlifyDatabaseIsConfigured()) {
      return json({ authenticated: true, ...rosterResponse(metadataCurrent(user), metadataSlots(user)), localPreview: true });
    }
    const database = (env as unknown as RuntimeEnv).DB;
    if (!database) return json({ error: "Archivio degli slot Famiglio temporaneamente non disponibile." }, 503);
    await syncLoreWiseCustomer(user);
    const [current, stored, pass, purchasedAppearanceIds, purchasedOfferIds] = await Promise.all([
      databaseCurrent(database, user.id),
      databaseSlots(database, user.id),
      getActiveUniversePass(database, user.id),
      purchasedPremiumFamiliarIds(database, user.id),
      purchasedFamiliarOfferIds(database, user.id),
    ]);
    return json({ authenticated: true, ...rosterResponse(current, stored, purchasedAppearanceIds, purchasedOfferIds), passName: pass.name, passEndsAt: pass.currentPeriodEnd });
  } catch {
    return json({ error: "Non è stato possibile controllare gli slot Famiglio." }, 503);
  }
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (!isSameSiteOrigin(request, origin)) return json({ error: "Origine non valida." }, 403);
    const user = await getFamiglioUser();
    if (!user) return json({ error: "Accedi al LoreWise ID per gestire più Famigli." }, 401);
    const parsed = await readBoundedJson(request, FAMILIAR_CLOUD_MAX_BYTES * 2);
    if (!parsed.ok) return json({ error: parsed.status === 413 ? "Richiesta troppo grande." : "Richiesta non valida." }, parsed.status);
    const body = (parsed.value && typeof parsed.value === "object" ? parsed.value : {}) as { action?: unknown; familiarId?: unknown; state?: unknown };
    const action = body.action === "start" || body.action === "switch" || body.action === "reset" ? body.action : null;
    if (!action) return json({ error: "Operazione slot non riconosciuta." }, 400);

    if (await isLocalLoreWiseRequest() && !netlifyDatabaseIsConfigured()) {
      const current = metadataCurrent(user);
      const stored = metadataSlots(user);
      if (!current.state) return json({ error: "Accogli prima il tuo Famiglio principale." }, 409);
      let nextCurrent = current.state;
      let nextStored = stored;
      if (action === "reset") {
        const candidate = checkedState(body.state);
        if (!candidate || !familiarStarterStateIsTrusted(candidate)) return json({ error: "Il riavvio deve usare un Famiglio nuovo e senza progressi." }, 400);
        if (isPremiumFamiliarAppearance(candidate.appearanceId)) return json({ error: "Gli acquisti Famiglio richiedono l’archivio commerciale attivo." }, 403);
        nextCurrent = candidate;
      } else if (action === "start") {
        const candidate = checkedState(body.state);
        const entitlement = familiarSlotEntitlement(0, 1 + stored.length);
        if (!entitlement.canStartPremiumSlot) return json({ error: "Acquista da Medusa una nuova Casa del Famiglio prima di usarla." }, 403);
        if (!candidate || !familiarStarterStateIsTrusted(candidate)) return json({ error: "Il nuovo Famiglio deve partire da un'adozione pulita." }, 400);
        if (isPremiumFamiliarAppearance(candidate.appearanceId)) return json({ error: "Gli acquisti Famiglio richiedono l’archivio commerciale attivo." }, 403);
        nextCurrent = candidate;
        nextStored = [...stored, { state: current.state, revision: current.revision }];
      } else {
        const familiarId = typeof body.familiarId === "string" ? body.familiarId : "";
        const chosenIndex = stored.findIndex((entry) => entry.state.familiarId === familiarId);
        if (chosenIndex < 0) return json({ error: "Slot Famiglio non trovato." }, 404);
        const chosen = stored[chosenIndex];
        nextCurrent = chosen.state;
        nextStored = stored.map((entry, index) => index === chosenIndex ? { state: current.state!, revision: current.revision } : entry);
      }
      const client = await createLoreWiseServerClient();
      if (!client) return json({ error: "Servizio LoreWise ID non disponibile." }, 503);
      const revision = Math.max(current.revision, 0) + 1;
      const { error } = await saveLocalGameData(user, {
        ...user.user_metadata,
        nexus_familiar_state: nextCurrent,
        nexus_familiar_revision: revision,
        nexus_familiar_slots: nextStored,
      });
      if (error) return json({ error: "Non è stato possibile aggiornare gli slot Famiglio." }, 503);
      return json({ ...rosterResponse({ state: nextCurrent, revision }, nextStored), familiar: nextCurrent, revision, localPreview: true });
    }

    const database = (env as unknown as RuntimeEnv).DB;
    if (!database) return json({ error: "Archivio degli slot Famiglio temporaneamente non disponibile." }, 503);
    await syncLoreWiseCustomer(user);
    const [current, stored, pass, purchasedAppearanceIds, purchasedOfferIds] = await Promise.all([
      databaseCurrent(database, user.id),
      databaseSlots(database, user.id),
      getActiveUniversePass(database, user.id),
      purchasedPremiumFamiliarIds(database, user.id),
      purchasedFamiliarOfferIds(database, user.id),
    ]);
    if (!current.state) return json({ error: "Accogli prima il tuo Famiglio principale." }, 409);

    let nextCurrent = current.state;
    let displacedRevision = current.revision;
    let selectedId = "";
    if (action === "reset") {
      const candidate = checkedState(body.state);
      if (!candidate || !familiarStarterStateIsTrusted(candidate)) return json({ error: "Il riavvio deve usare un Famiglio nuovo e senza progressi." }, 400);
      if (isPremiumFamiliarAppearance(candidate.appearanceId) && !purchasedAppearanceIds.includes(candidate.appearanceId)) return json({ error: "Questo Famiglio non è presente nel tuo LoreWise ID." }, 403);
      const revision = current.revision + 1;
      const updated = await database.prepare(`UPDATE nexus_familiars SET state_json = ?, revision = ?, updated_at = CURRENT_TIMESTAMP
        WHERE customer_id = ? AND revision = ?`).bind(JSON.stringify(candidate), revision, user.id, current.revision).run();
      if (!updated.meta.changes) return json({ error: "Il Famiglio è stato aggiornato altrove. Riprova." }, 409);
      return json({ ...rosterResponse({ state: candidate, revision }, stored, purchasedAppearanceIds, purchasedOfferIds), familiar: candidate, revision, passName: pass.name, passEndsAt: pass.currentPeriodEnd });
    } else if (action === "start") {
      const entitlement = familiarSlotEntitlement(purchasedSlotCount(purchasedOfferIds), 1 + stored.length);
      if (!entitlement.canStartPremiumSlot) return json({ error: "Acquista da Medusa la Casa successiva oppure libera uno slot." }, 403);
      const candidate = checkedState(body.state);
      if (!candidate || !familiarStarterStateIsTrusted(candidate)) return json({ error: "Il nuovo Famiglio deve partire da un'adozione pulita." }, 400);
      if (isPremiumFamiliarAppearance(candidate.appearanceId) && !purchasedAppearanceIds.includes(candidate.appearanceId)) {
        return json({ error: "Questo Famiglio premium non è disponibile nel tuo LoreWise ID." }, 403);
      }
      nextCurrent = candidate;
      selectedId = current.state.familiarId;
    } else {
      const familiarId = typeof body.familiarId === "string" ? body.familiarId : "";
      const chosen = stored.find((entry) => entry.state.familiarId === familiarId);
      if (!chosen) return json({ error: "Slot Famiglio non trovato." }, 404);
      nextCurrent = chosen.state;
      displacedRevision = chosen.revision;
      selectedId = familiarId;
    }

    const revision = current.revision + 1;
    const nextJson = JSON.stringify(nextCurrent);
    const statements = [
      slotSwapPrimaryStatement(database, action, { customerId: user.id, nextJson, revision, baseRevision: current.revision, selectedId }),
      slotSwapSlotStatement(database, action, {
        customerId: user.id, nextJson, revision, selectedId,
        displacedId: current.state.familiarId, displacedJson: JSON.stringify(current.state),
        displacedRevision: action === "start" ? current.revision : displacedRevision + 1,
      }),
    ];
    const results = await database.batch(statements);
    // "success" è sempre vero: contano le righe toccate. Le due istruzioni sono protette a
    // vicenda (lib/nexusFamiliarCloud.ts), quindi o cambiano entrambe o nessuna delle due.
    if (!results.every((result) => Number(result.meta?.changes || 0) === 1)) {
      return json({ error: "Cambio Famiglio non completato; nessun progresso è stato eliminato." }, 409);
    }
    const refreshed = await databaseSlots(database, user.id);
    return json({ ...rosterResponse({ state: nextCurrent, revision }, refreshed, purchasedAppearanceIds, purchasedOfferIds), familiar: nextCurrent, revision, passName: pass.name, passEndsAt: pass.currentPeriodEnd });
  } catch {
    return json({ error: "Non è stato possibile aggiornare gli slot Famiglio." }, 503);
  }
}
