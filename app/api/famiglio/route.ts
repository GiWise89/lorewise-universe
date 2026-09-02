import { env } from "@/lib/netlifyRuntime";
import { netlifyDatabaseIsConfigured } from "@/lib/localAccountFallback";
import { FAMILIAR_CLOUD_MAX_BYTES, sanitizeFamiliarCloudState } from "@/lib/nexusFamiliarCloud";
import { familiarStarterStateIsTrusted, preserveAuthoritativeFamiliarState } from "@/lib/nexusFamiliarAuthority";
import { recordFamiliarEconomyEvent, recordFamiliarSyncEvent } from "@/lib/nexusFamiliarEconomyServer";
import { MAX_FAMILIAR_SLOT_COUNT } from "@/lib/nexusFamiliarSlots";
import { canAdoptFamiliarAppearance, isPremiumFamiliarAppearance } from "@/lib/nexusFamiliarCommerce";
import { ensureCommerceTables } from "@/lib/commerceServer";
import { syncLoreWiseCustomer } from "@/lib/supabase/customer";
import { createLoreWiseServerClient, getLoreWiseUser, isLocalLoreWiseRequest } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RuntimeEnv = { DB?: D1Database };
type FamiliarRow = { state_json: string; revision: number };
type StoredMetadataSlot = { state?: unknown; revision?: unknown };

const privateHeaders = { "Cache-Control": "private, no-store" };

function response(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: privateHeaders });
}

function metadataFamiliar(user: Awaited<ReturnType<typeof getLoreWiseUser>>) {
  if (!user) return { state: null, revision: 0 };
  const checked = sanitizeFamiliarCloudState(user.user_metadata?.nexus_familiar_state);
  const revision = Math.max(0, Math.floor(Number(user.user_metadata?.nexus_familiar_revision) || 0));
  return { state: checked.ok ? checked.state : null, revision };
}

function metadataFamiliarSlots(user: Awaited<ReturnType<typeof getLoreWiseUser>>) {
  if (!user || !Array.isArray(user.user_metadata?.nexus_familiar_slots)) return [];
  return user.user_metadata.nexus_familiar_slots.slice(0, MAX_FAMILIAR_SLOT_COUNT - 1).flatMap((entry: unknown) => {
    if (!entry || typeof entry !== "object") return [];
    const stored = entry as StoredMetadataSlot;
    const checked = sanitizeFamiliarCloudState(stored.state);
    return checked.ok ? [{ state: checked.state, revision: Math.max(1, Math.floor(Number(stored.revision) || 1)) }] : [];
  });
}

async function readDatabaseFamiliar(database: D1Database, customerId: string) {
  const row = await database.prepare("SELECT state_json, revision FROM nexus_familiars WHERE customer_id = ?")
    .bind(customerId).first<FamiliarRow>();
  if (!row) return { state: null, revision: 0 };
  try {
    const checked = sanitizeFamiliarCloudState(JSON.parse(row.state_json));
    return { state: checked.ok ? checked.state : null, revision: Math.max(0, Number(row.revision) || 0) };
  } catch {
    return { state: null, revision: Math.max(0, Number(row.revision) || 0) };
  }
}

export async function GET() {
  try {
    const user = await getLoreWiseUser();
    if (!user) return response({ error: "Accedi al LoreWise ID per sincronizzare il Famiglio." }, 401);
    if (await isLocalLoreWiseRequest() && !netlifyDatabaseIsConfigured()) {
      const saved = metadataFamiliar(user);
      return response({ familiar: saved.state, revision: saved.revision, localPreview: true });
    }
    const database = (env as unknown as RuntimeEnv).DB;
    if (!database) return response({ error: "Archivio del Famiglio non disponibile." }, 503);
    await syncLoreWiseCustomer(user);
    const saved = await readDatabaseFamiliar(database, user.id);
    return response({ familiar: saved.state, revision: saved.revision });
  } catch {
    return response({ error: "Non è stato possibile recuperare il Famiglio." }, 503);
  }
}

export async function PUT(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return response({ error: "Origine non valida." }, 403);
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > FAMILIAR_CLOUD_MAX_BYTES * 2) return response({ error: "Salvataggio troppo grande." }, 413);

    const user = await getLoreWiseUser();
    if (!user) return response({ error: "Accedi al LoreWise ID per sincronizzare il Famiglio." }, 401);
    const body = await request.json() as { state?: unknown; baseRevision?: unknown };
    const checked = sanitizeFamiliarCloudState(body.state);
    if (!checked.ok) return response({ error: checked.error }, 400);
    const baseRevision = Math.max(0, Math.floor(Number(body.baseRevision) || 0));

    if (await isLocalLoreWiseRequest() && !netlifyDatabaseIsConfigured()) {
      const current = metadataFamiliar(user);
      if (current.revision !== baseRevision) {
        return response({ error: "Il Famiglio è stato aggiornato altrove.", familiar: current.state, revision: current.revision }, 409);
      }
      if (!current.state && !familiarStarterStateIsTrusted(checked.state)) return response({ error: "Il primo salvataggio deve partire da un nuovo Famiglio." }, 400);
      if (!current.state && isPremiumFamiliarAppearance(checked.state.appearanceId)) {
        return response({ error: "Gli acquisti Famiglio richiedono l’archivio commerciale attivo." }, 403);
      }
      const trustedState = current.state ? preserveAuthoritativeFamiliarState(current.state, checked.state) : checked.state;
      const client = await createLoreWiseServerClient();
      if (!client) return response({ error: "Servizio account non disponibile." }, 503);
      const revision = current.revision + 1;
      const { data, error } = await client.auth.updateUser({
        data: {
          ...user.user_metadata,
          nexus_familiar_state: trustedState,
          nexus_familiar_revision: revision,
        },
      });
      if (error || !data.user) return response({ error: "Non è stato possibile sincronizzare il Famiglio." }, 503);
      return response({ familiar: trustedState, revision, localPreview: true });
    }

    const database = (env as unknown as RuntimeEnv).DB;
    if (!database) return response({ error: "Archivio del Famiglio non disponibile." }, 503);
    await syncLoreWiseCustomer(user);
    await ensureCommerceTables(database);
    const current = await readDatabaseFamiliar(database, user.id);
    if (current.revision !== baseRevision) {
      return response({ error: "Il Famiglio è stato aggiornato altrove.", familiar: current.state, revision: current.revision }, 409);
    }
    if (!current.state && !familiarStarterStateIsTrusted(checked.state)) return response({ error: "Il primo salvataggio deve partire da un nuovo Famiglio." }, 400);
    if (!current.state && !await canAdoptFamiliarAppearance(database, user.id, checked.state.appearanceId)) {
      return response({ error: "Questo Famiglio premium non è disponibile nel tuo LoreWise ID." }, 403);
    }
    const trustedState = current.state ? preserveAuthoritativeFamiliarState(current.state, checked.state) : checked.state;

    const stateJson = JSON.stringify(trustedState);
    const nextRevision = current.revision + 1;
    if (current.revision === 0) {
      const inserted = await database.prepare(`INSERT INTO nexus_familiars
        (customer_id, state_json, state_version, revision, created_at, updated_at)
        VALUES (?, ?, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(customer_id) DO NOTHING`)
        .bind(user.id, stateJson, nextRevision).run();
      if (!inserted.meta.changes) {
        const latest = await readDatabaseFamiliar(database, user.id);
        return response({ error: "Il Famiglio è stato aggiornato altrove.", familiar: latest.state, revision: latest.revision }, 409);
      }
    } else {
      const updated = await database.prepare(`UPDATE nexus_familiars
        SET state_json = ?, state_version = 1, revision = ?, updated_at = CURRENT_TIMESTAMP
        WHERE customer_id = ? AND revision = ?`)
        .bind(stateJson, nextRevision, user.id, current.revision).run();
      if (!updated.meta.changes) {
        const latest = await readDatabaseFamiliar(database, user.id);
        return response({ error: "Il Famiglio è stato aggiornato altrove.", familiar: latest.state, revision: latest.revision }, 409);
      }
    }
    await Promise.all([
      recordFamiliarSyncEvent(database, {
        customerId: user.id,
        familiarId: trustedState.familiarId,
        action: current.state ? "sync" : "adopt",
        revisionBefore: current.revision,
        revisionAfter: nextRevision,
        deviceHint: request.headers.get("user-agent"),
      }),
      ...(!current.state ? [recordFamiliarEconomyEvent(database, {
        customerId: user.id,
        eventType: "adoption" as const,
        sourceKey: `adoption:${trustedState.familiarId}`,
        before: null,
        after: trustedState,
      })] : []),
    ]).catch(() => undefined);
    return response({ familiar: trustedState, revision: nextRevision });
  } catch {
    return response({ error: "Non è stato possibile sincronizzare il Famiglio." }, 503);
  }
}

export async function DELETE(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return response({ error: "Origine non valida." }, 403);
    const user = await getLoreWiseUser();
    if (!user) return response({ error: "Accedi al LoreWise ID per eliminare il Famiglio sincronizzato." }, 401);
    if (await isLocalLoreWiseRequest() && !netlifyDatabaseIsConfigured()) {
      const client = await createLoreWiseServerClient();
      if (!client) return response({ error: "Servizio account non disponibile." }, 503);
      const revision = Math.max(0, Math.floor(Number(user.user_metadata?.nexus_familiar_revision) || 0)) + 1;
      const stored = metadataFamiliarSlots(user);
      const promoted = stored.at(0);
      const { error } = await client.auth.updateUser({ data: {
        ...user.user_metadata,
        nexus_familiar_state: promoted?.state ?? null,
        nexus_familiar_revision: revision,
        nexus_familiar_slots: promoted ? stored.slice(1) : [],
      } });
      if (error) return response({ error: "Non è stato possibile eliminare il Famiglio sincronizzato." }, 503);
      return response({ deleted: true, promoted: Boolean(promoted), familiar: promoted?.state ?? null, revision, localPreview: true });
    }
    const database = (env as unknown as RuntimeEnv).DB;
    if (!database) return response({ error: "Archivio del Famiglio non disponibile." }, 503);
    await syncLoreWiseCustomer(user);
    const current = await readDatabaseFamiliar(database, user.id);
    await recordFamiliarEconomyEvent(database, {
      customerId: user.id,
      eventType: "reset",
      sourceKey: `reset:${current.state?.familiarId ?? crypto.randomUUID()}`,
      before: current.state,
      after: null,
    }).catch(() => undefined);
    await recordFamiliarSyncEvent(database, {
      customerId: user.id,
      familiarId: current.state?.familiarId,
      action: "delete",
      revisionBefore: current.revision,
      revisionAfter: current.revision + 1,
      deviceHint: request.headers.get("user-agent"),
    }).catch(() => undefined);
    const nextSlot = await database.prepare(`SELECT familiar_id, state_json, revision FROM nexus_familiar_slots
      WHERE customer_id = ? ORDER BY created_at ASC LIMIT 1`).bind(user.id).first<FamiliarRow & { familiar_id: string }>();
    let promotedState = null;
    if (nextSlot) {
      try {
        const checked = sanitizeFamiliarCloudState(JSON.parse(nextSlot.state_json));
        if (checked.ok) promotedState = checked.state;
      } catch {
        promotedState = null;
      }
    }
    if (promotedState && nextSlot) {
      const revision = current.revision + 1;
      const results = await database.batch([
        database.prepare(`UPDATE nexus_familiars SET state_json = ?, revision = ?, updated_at = CURRENT_TIMESTAMP
          WHERE customer_id = ? AND revision = ?`).bind(JSON.stringify(promotedState), revision, user.id, current.revision),
        database.prepare("DELETE FROM nexus_familiar_slots WHERE customer_id = ? AND familiar_id = ?")
          .bind(user.id, nextSlot.familiar_id),
      ]);
      const primaryChanged = Number(results[0]?.meta?.changes || 0) === 1;
      const slotRemoved = Number(results[1]?.meta?.changes || 0) === 1;
      if (!primaryChanged || !slotRemoved) return response({ error: "Il cambio di Famiglio non è stato completato. Riprova." }, 409);
      return response({ deleted: true, promoted: true, familiar: promotedState, revision });
    }
    await database.prepare("DELETE FROM nexus_familiars WHERE customer_id = ?").bind(user.id).run();
    return response({ deleted: true, promoted: false, familiar: null, revision: 0 });
  } catch {
    return response({ error: "Non è stato possibile eliminare il Famiglio sincronizzato." }, 503);
  }
}
