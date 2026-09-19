// Verifica sul server delle battaglie del Famiglio.
//
// Il client invia il replay di una battaglia conclusa (richiesta d'incontro e azioni).
// Il server ricostruisce lo stato di partenza dal salvataggio dell'account, rigioca
// l'incontro con lo stesso motore e soltanto allora scrive progressi, premi riscattati
// e monete del primo completamento. Ogni battaglia vale una sola volta: il registro
// `combatLedger` della Casa (nel salvataggio, aggiornato insieme ai progressi con la
// stessa revisione) rende idempotente il rinvio dello stesso replay, e la tabella
// nexus_pet_combat_battles conserva i premi pagati anche se la Casa viene svuotata.
import { restoreFamiliarCombatState, type FamiliarCombatReward, type FamiliarCombatState } from "./famiglioCombat.ts";
import {
  replayFamiliarCombatBattle,
  sanitizeFamiliarCombatReplay,
  type FamiliarCombatReplayRejection,
  type FamiliarCombatResolvedOutcome,
} from "./famiglioCombatVerification.ts";
import { DEFAULT_FAMILIAR_IDS } from "./famiglioMarketExpansion.ts";
import { familiarIdsInSave, sanitizeFamiglioRebuildCloudSave, type FamiglioRebuildCloudSave } from "./famiglioRebuildCloud.ts";

type JsonRecord = Record<string, unknown>;

export const FAMIGLIO_COMBAT_LEDGER_MAX_BATTLES = 60;
export const FAMIGLIO_COMBAT_LEDGER_MAX_TOWER_RUNS = 12;

export const FAMIGLIO_COMBAT_LEDGER_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS nexus_pet_combat_battles (
    customer_id TEXT NOT NULL,
    house_index INTEGER NOT NULL,
    battle_id TEXT NOT NULL,
    familiar_id TEXT NOT NULL,
    encounter_id TEXT NOT NULL,
    outcome TEXT NOT NULL,
    reward_key TEXT,
    combat_xp INTEGER NOT NULL DEFAULT 0,
    nexus_coins INTEGER NOT NULL DEFAULT 0,
    night_sigils INTEGER NOT NULL DEFAULT 0,
    relic_fragments INTEGER NOT NULL DEFAULT 0,
    verified_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (customer_id, house_index, battle_id)
  )`,
  "CREATE INDEX IF NOT EXISTS nexus_pet_combat_battles_reward_idx ON nexus_pet_combat_battles(customer_id, house_index, reward_key)",
  "CREATE INDEX IF NOT EXISTS nexus_pet_combat_battles_battle_idx ON nexus_pet_combat_battles(customer_id, house_index, battle_id)",
] as const;

export type FamiglioVerifiedCombatResult = {
  battleId: string;
  outcome: FamiliarCombatResolvedOutcome;
  /** Premio del primo completamento accreditato nel portamonete della Casa, se c'è. */
  reward: FamiliarCombatReward | null;
  /** Vero se il premio era già stato pagato a questa Casa in passato (nessuna nuova moneta). */
  rewardAlreadyPaid: boolean;
  familiarId: string;
  encounterId: string;
  verifiedAt: string;
};

export type FamiglioCombatLedger = {
  version: 1;
  battles: FamiglioVerifiedCombatResult[];
  towerRuns: Record<string, number>;
  totals: { battles: number; victories: number; defeats: number; retreats: number; nexusCoins: number; nightSigils: number; relicFragments: number };
};

export type FamiglioCombatVerification =
  | { status: "verified"; save: FamiglioRebuildCloudSave; result: FamiglioVerifiedCombatResult; combat: FamiliarCombatState }
  | { status: "duplicate"; result: FamiglioVerifiedCombatResult; combat: FamiliarCombatState }
  | { status: "rejected"; code: FamiliarCombatReplayRejection["code"] | "house" | "team" | "tower-order"; error: string; combat: FamiliarCombatState | null };

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function count(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

export function restoreFamiglioCombatLedger(value: unknown): FamiglioCombatLedger {
  const raw = isRecord(value) ? value : {};
  const totals = isRecord(raw.totals) ? raw.totals : {};
  const towerRuns = isRecord(raw.towerRuns)
    ? Object.fromEntries(Object.entries(raw.towerRuns).filter(([id]) => id.length <= 80).map(([id, floor]) => [id, Math.min(10, count(floor))]).slice(-FAMIGLIO_COMBAT_LEDGER_MAX_TOWER_RUNS))
    : {};
  const battles = Array.isArray(raw.battles)
    ? raw.battles.filter((entry): entry is FamiglioVerifiedCombatResult => isRecord(entry) && typeof entry.battleId === "string").slice(0, FAMIGLIO_COMBAT_LEDGER_MAX_BATTLES)
    : [];
  return {
    version: 1,
    battles,
    towerRuns,
    totals: {
      battles: count(totals.battles), victories: count(totals.victories), defeats: count(totals.defeats), retreats: count(totals.retreats),
      nexusCoins: count(totals.nexusCoins), nightSigils: count(totals.nightSigils), relicFragments: count(totals.relicFragments),
    },
  };
}

function creditWallet(home: unknown, reward: FamiliarCombatReward): JsonRecord {
  const current = isRecord(home) ? home : {};
  const wallet = isRecord(current.wallet) ? current.wallet : {};
  return {
    ...current,
    wallet: {
      ...wallet,
      nexusCoins: count(wallet.nexusCoins) + reward.nexusCoins,
      totalEarned: count(wallet.totalEarned) + reward.nexusCoins,
      nightSigils: count(wallet.nightSigils) + reward.nightSigils,
      relicFragments: count(wallet.relicFragments) + reward.relicFragments,
    },
  };
}

export type FamiglioCombatVerifyContext = {
  /** Famigli che l'account può schierare; null salta il controllo (anteprima locale). */
  ownedFamiliarIds: ReadonlySet<string> | null;
  /** Chiavi di premio già pagate a questa Casa secondo il registro permanente. */
  paidRewardKeys?: ReadonlySet<string>;
  now?: Date;
};

/** Famigli schierabili: gratuiti, già presenti nel salvataggio del server o acquistati. */
export function familiarIdsOwnedByAccount(save: FamiglioRebuildCloudSave | null, purchasedIds: readonly string[] = []) {
  return new Set<string>([...DEFAULT_FAMILIAR_IDS, ...familiarIdsInSave(save), ...purchasedIds]);
}

export function authoritativeHouseCombat(save: FamiglioRebuildCloudSave | null, houseIndex: number): FamiliarCombatState | null {
  const house = save?.houses[houseIndex];
  return isRecord(house) ? restoreFamiliarCombatState(house.combat) : null;
}

/**
 * Verifica un replay contro il salvataggio del server e, se valido, restituisce il
 * nuovo salvataggio da scrivere (con la stessa concorrenza ottimistica del PUT).
 * Funzione pura: nessun accesso a database o rete.
 */
export function verifyFamiglioCombatReport(
  save: FamiglioRebuildCloudSave,
  houseIndex: number,
  rawReplay: unknown,
  context: FamiglioCombatVerifyContext,
): FamiglioCombatVerification {
  const house = save.houses[houseIndex];
  if (!Number.isInteger(houseIndex) || houseIndex < 0 || houseIndex > 2 || !isRecord(house) || !isRecord(house.combat)) {
    return { status: "rejected", code: "house", error: "Casa del Famiglio non disponibile sul server.", combat: null };
  }
  const storedCombat = restoreFamiliarCombatState(house.combat);
  const ledger = restoreFamiglioCombatLedger(house.combatLedger);
  const replay = sanitizeFamiliarCombatReplay(rawReplay);
  if (!replay) return { status: "rejected", code: "invalid", error: "Resoconto della battaglia non valido.", combat: storedCombat };
  const already = ledger.battles.find((entry) => entry.battleId === replay.battleId);
  if (already) return { status: "duplicate", result: already, combat: storedCombat };
  if (context.ownedFamiliarIds) {
    const team = [replay.request.playerId, ...replay.request.teamIds];
    if (team.some((id) => !context.ownedFamiliarIds?.has(id))) {
      return { status: "rejected", code: "team", error: "La squadra contiene un Famiglio che non appartiene a questo LoreWise ID.", combat: storedCombat };
    }
  }
  const replayed = replayFamiliarCombatBattle(storedCombat, replay);
  if (!replayed.ok) return { status: "rejected", code: replayed.code, error: replayed.error, combat: storedCombat };
  const { towerRunId, towerFloor } = replayed.plan;
  if (towerRunId && towerFloor && towerFloor > 1 && (ledger.towerRuns[towerRunId] ?? 0) < towerFloor - 1) {
    return { status: "rejected", code: "tower-order", error: "Completa prima il piano precedente della Torre.", combat: storedCombat };
  }

  const verifiedAt = (context.now ?? new Date()).toISOString();
  const alreadyPaid = Boolean(replayed.reward && context.paidRewardKeys?.has(replayed.reward.key));
  const reward = replayed.reward && !alreadyPaid ? replayed.reward : null;
  const result: FamiglioVerifiedCombatResult = {
    battleId: replayed.battleId,
    outcome: replayed.outcome,
    reward,
    rewardAlreadyPaid: alreadyPaid,
    familiarId: replayed.leadFamiliarId,
    encounterId: replayed.encounterId,
    verifiedAt,
  };
  const towerRuns = { ...ledger.towerRuns };
  if (towerRunId && towerFloor && replayed.outcome === "victory") {
    delete towerRuns[towerRunId];
    towerRuns[towerRunId] = Math.max(ledger.towerRuns[towerRunId] ?? 0, towerFloor);
  }
  const nextLedger: FamiglioCombatLedger = {
    version: 1,
    battles: [result, ...ledger.battles].slice(0, FAMIGLIO_COMBAT_LEDGER_MAX_BATTLES),
    towerRuns: Object.fromEntries(Object.entries(towerRuns).slice(-FAMIGLIO_COMBAT_LEDGER_MAX_TOWER_RUNS)),
    totals: {
      battles: ledger.totals.battles + 1,
      victories: ledger.totals.victories + (replayed.outcome === "victory" ? 1 : 0),
      defeats: ledger.totals.defeats + (replayed.outcome === "defeat" ? 1 : 0),
      retreats: ledger.totals.retreats + (replayed.outcome === "retreat" ? 1 : 0),
      nexusCoins: ledger.totals.nexusCoins + (reward?.nexusCoins ?? 0),
      nightSigils: ledger.totals.nightSigils + (reward?.nightSigils ?? 0),
      relicFragments: ledger.totals.relicFragments + (reward?.relicFragments ?? 0),
    },
  };
  // La battaglia in corso salvata dal client è quella appena verificata: si chiude.
  const combat: FamiliarCombatState = { ...replayed.state, activeBattle: null, pendingReward: null, lastTimeline: [] };
  const home = reward ? creditWallet(house.home, reward) : house.home;
  const houses = [...save.houses];
  houses[houseIndex] = { ...house, combat, home, combatLedger: nextLedger };
  const next: FamiglioRebuildCloudSave = { ...save, houses, updatedAt: verifiedAt };
  if (houseIndex === save.activeHouseIndex) {
    if ("combat" in save) next.combat = combat;
    if ("home" in save) next.home = home;
  }
  const checked = sanitizeFamiglioRebuildCloudSave(next);
  if (!checked.ok) return { status: "rejected", code: "house", error: checked.error, combat: storedCombat };
  return { status: "verified", save: checked.save, result, combat };
}

// ------------------------------------------------------------------ database

type SaveRow = { save_json: string; revision: number };
type StoredSave = { save: FamiglioRebuildCloudSave | null; revision: number };

export async function ensureFamiglioCombatLedger(database: D1Database) {
  for (const sql of FAMIGLIO_COMBAT_LEDGER_SCHEMA) await database.prepare(sql).run();
}

export async function readFamiglioRebuildSave(database: D1Database, customerId: string): Promise<StoredSave> {
  const row = await database.prepare("SELECT save_json, revision FROM nexus_pet_rebuild_saves WHERE customer_id = ?")
    .bind(customerId).first<SaveRow>();
  if (!row) return { save: null, revision: 0 };
  try {
    const checked = sanitizeFamiglioRebuildCloudSave(JSON.parse(row.save_json));
    return { save: checked.ok ? checked.save : null, revision: Math.max(0, Number(row.revision) || 0) };
  } catch {
    return { save: null, revision: Math.max(0, Number(row.revision) || 0) };
  }
}

async function paidRewardKeys(database: D1Database, customerId: string, houseIndex: number) {
  const rows = await database.prepare(`SELECT DISTINCT reward_key FROM nexus_pet_combat_battles
    WHERE customer_id = ? AND house_index = ? AND reward_key IS NOT NULL`).bind(customerId, houseIndex).all<{ reward_key: string }>();
  return new Set((rows.results ?? []).map((row) => row.reward_key));
}

export type FamiglioCombatSubmission =
  | { status: "verified" | "duplicate"; result: FamiglioVerifiedCombatResult; combat: FamiliarCombatState; revision: number }
  | { status: "rejected"; code: string; error: string; combat: FamiliarCombatState | null; revision: number }
  | { status: "not-synced"; revision: number }
  | { status: "conflict"; revision: number };

/**
 * Verifica e registra una battaglia nel database D1. La scrittura del salvataggio è
 * condizionata alla revisione letta (come il PUT): in caso di conflitto si rilegge e
 * si riverifica. Il registro permanente viene scritto nella stessa transazione e solo
 * se il salvataggio è stato davvero aggiornato con questo contenuto.
 */
export async function submitFamiglioCombatReport(
  database: D1Database,
  customerId: string,
  houseIndex: number,
  replay: unknown,
  purchasedFamiliarIds: readonly string[],
  now = () => new Date(),
): Promise<FamiglioCombatSubmission> {
  await ensureFamiglioCombatLedger(database);
  const paid = await paidRewardKeys(database, customerId, houseIndex);
  let revision = 0;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const current = await readFamiglioRebuildSave(database, customerId);
    revision = current.revision;
    if (!current.save) return { status: "not-synced", revision };
    const verification = verifyFamiglioCombatReport(current.save, houseIndex, replay, {
      ownedFamiliarIds: familiarIdsOwnedByAccount(current.save, purchasedFamiliarIds),
      paidRewardKeys: paid,
      now: now(),
    });
    if (verification.status === "rejected") {
      if (verification.code === "house") return { status: "not-synced", revision };
      return { status: "rejected", code: verification.code, error: verification.error, combat: verification.combat, revision };
    }
    if (verification.status === "duplicate") return { status: "duplicate", result: verification.result, combat: verification.combat, revision };
    const nextRevision = current.revision + 1;
    const json = JSON.stringify(verification.save);
    const { result } = verification;
    const [updated] = await database.batch([
      database.prepare(`UPDATE nexus_pet_rebuild_saves SET save_json = ?, revision = ?, updated_at = CURRENT_TIMESTAMP
        WHERE customer_id = ? AND revision = ?`).bind(json, nextRevision, customerId, current.revision),
      database.prepare(`INSERT INTO nexus_pet_combat_battles
        (customer_id, house_index, battle_id, familiar_id, encounter_id, outcome, reward_key, combat_xp, nexus_coins, night_sigils, relic_fragments, verified_at)
        SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        WHERE EXISTS (SELECT 1 FROM nexus_pet_rebuild_saves WHERE customer_id = ? AND revision = ? AND save_json = ?)
        ON CONFLICT (customer_id, house_index, battle_id) DO NOTHING`).bind(
        customerId, houseIndex, result.battleId, result.familiarId, result.encounterId, result.outcome,
        result.reward?.key ?? null, result.reward?.combatXp ?? 0, result.reward?.nexusCoins ?? 0,
        result.reward?.nightSigils ?? 0, result.reward?.relicFragments ?? 0, result.verifiedAt,
        customerId, nextRevision, json,
      ),
    ]);
    if (updated?.meta?.changes) return { status: "verified", result, combat: verification.combat, revision: nextRevision };
  }
  return { status: "conflict", revision };
}
