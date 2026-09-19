import { createFamiliarAttendanceState } from "./famiglioAttendanceYear.ts";
import { MEDUSA_FAMILIAR_CATALOG } from "./famiglioMarketExpansion.ts";
import { PREMIUM_FAMILIARS } from "./nexusFamiliarCatalog.ts";

export const FAMIGLIO_REBUILD_CLOUD_SCHEMA_VERSION = 1;
export const FAMIGLIO_REBUILD_CLOUD_MAX_BYTES = 512 * 1024;

type JsonRecord = Record<string, unknown>;

export type FamiglioRebuildCloudSave = JsonRecord & {
  schemaVersion: 1;
  activeHouseIndex: number;
  houses: Array<JsonRecord | null>;
  updatedAt: string;
};

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function serializedSize(value: unknown) {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).byteLength;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

function finiteBetween(value: unknown, minimum: number, maximum: number) {
  const number = Number(value);
  return Number.isFinite(number) && number >= minimum && number <= maximum;
}

function validNeeds(value: unknown) {
  if (!isRecord(value)) return false;
  const keys = ["hunger", "energy", "happiness", "hygiene", "affection"];
  if (!keys.some((key) => value[key] !== undefined)) return true;
  return keys.every((key) => finiteBetween(value[key], 0, 100));
}

function validHouse(value: unknown) {
  if (value === null) return true;
  if (!isRecord(value) || !isRecord(value.rebuild) || !isRecord(value.home)
    || !isRecord(value.adventure) || !isRecord(value.combat)) return false;
  const rebuild = value.rebuild;
  const home = value.home;
  const adventure = value.adventure;
  const combat = value.combat;
  const allowedStages = ["choosing", "confirming", "hatching", "hatched", "home"];
  return allowedStages.includes(String(rebuild.stage ?? ""))
    && Array.isArray(rebuild.unlockedIds)
    && rebuild.unlockedIds.length <= 53
    && rebuild.unlockedIds.every((entry) => typeof entry === "string" && entry.length <= 80)
    && validNeeds(home.needs)
    && (home.toilet === undefined || home.toilet === null || (isRecord(home.toilet) && finiteBetween(home.toilet.urgency, 0, 100) && finiteBetween(home.toilet.wasteCount, 0, 3)))
    && (!Array.isArray(home.diary) || home.diary.length <= 30)
    && (!Array.isArray(adventure.history) || adventure.history.length <= 120)
    && (!isRecord(combat.profiles) || Object.keys(combat.profiles).length <= 53)
    && (!isRecord(combat.activeBattle) || (finiteBetween(combat.activeBattle.turn, 1, 9999)
      && (combat.activeBattle.maxTurns === null || combat.activeBattle.maxTurns === undefined || finiteBetween(combat.activeBattle.maxTurns, 1, 9999))))
    && (value.activeFamiliarId === null || value.activeFamiliarId === undefined
      || (typeof value.activeFamiliarId === "string" && value.activeFamiliarId.length <= 80));
}

export function sanitizeFamiglioRebuildCloudSave(value: unknown):
  | { ok: true; save: FamiglioRebuildCloudSave }
  | { ok: false; error: string } {
  if (!isRecord(value) || serializedSize(value) > FAMIGLIO_REBUILD_CLOUD_MAX_BYTES) {
    return { ok: false, error: "Salvataggio Nexus Pet non valido o troppo grande." };
  }
  if (value.schemaVersion !== FAMIGLIO_REBUILD_CLOUD_SCHEMA_VERSION
    || !Array.isArray(value.houses) || value.houses.length !== 3
    || !value.houses.every(validHouse)) {
    return { ok: false, error: "Formato del salvataggio Nexus Pet non riconosciuto." };
  }
  const activeHouseIndex = Number(value.activeHouseIndex);
  if (!Number.isInteger(activeHouseIndex) || activeHouseIndex < 0 || activeHouseIndex > 2) {
    return { ok: false, error: "Casa attiva non valida." };
  }
  const updatedAt = typeof value.updatedAt === "string" && Number.isFinite(Date.parse(value.updatedAt))
    ? value.updatedAt
    : new Date().toISOString();
  return {
    ok: true,
    save: { ...value, schemaVersion: 1, activeHouseIndex, houses: value.houses as Array<JsonRecord | null>, updatedAt },
  };
}

/**
 * Il Registro presenze (date, serie, ricordi e traguardi della serie) viene
 * scritto soltanto dalle rotte server di riscatto, con l'orologio del server.
 * Un salvataggio inviato dal client non può riscrivere date o traguardi: per
 * ogni Casa già presente sul server si conserva il registro autorevole.
 */
export function preserveServerOwnedAttendance(
  incoming: FamiglioRebuildCloudSave,
  current: FamiglioRebuildCloudSave | null,
): FamiglioRebuildCloudSave {
  // Primo salvataggio dell'account: il registro dell'ospite viene accettato una sola volta.
  if (!current) return incoming;
  const houses = incoming.houses.map((house, index) => {
    if (!house || !isRecord(house.home)) return house;
    const stored = current.houses[index];
    if (stored && isRecord(stored.home) && isRecord(stored.home.attendance)) {
      return { ...house, home: { ...house.home, attendance: stored.home.attendance } };
    }
    // Casa nuova (o svuotata e ricreata) su un account che ha già un salvataggio: il registro
    // riparte da zero. Prima il client poteva azzerare una Casa con un PUT e ricrearla con date
    // e traguardi inventati, che la rotta /streak avrebbe poi pagato come autentici.
    return { ...house, home: { ...house.home, attendance: createFamiliarAttendanceState() } };
  });
  return { ...incoming, houses };
}

/** Case a pagamento: indice 1 → "slot-famiglio-2", indice 2 → "slot-famiglio-3". */
const PAID_HOUSE_OFFER_IDS: ReadonlyArray<readonly [number, string]> = [[1, "slot-famiglio-2"], [2, "slot-famiglio-3"]];
const GATED_FAMILIAR_IDS = new Set<string>([
  ...MEDUSA_FAMILIAR_CATALOG.map((entry) => entry.id),
  ...PREMIUM_FAMILIARS.map((entry) => entry.id),
]);

/** Id di Famiglio che il client usa per decidere quali Famigli "possiede" in una Casa. */
function familiarIdsInHouse(house: unknown, ids: Set<string>) {
  if (!isRecord(house)) return;
  const add = (value: unknown) => { if (typeof value === "string" && value) ids.add(value); };
  add(house.activeFamiliarId);
  if (isRecord(house.rebuild)) {
    add(house.rebuild.selectedId);
    if (Array.isArray(house.rebuild.unlockedIds)) house.rebuild.unlockedIds.forEach(add);
  }
  if (isRecord(house.combat) && isRecord(house.combat.activeBattle) && isRecord(house.combat.activeBattle.player)) {
    add(house.combat.activeBattle.player.familiarId);
  }
}

function familiarIdsInSave(save: FamiglioRebuildCloudSave | null) {
  const ids = new Set<string>();
  if (!save) return ids;
  // Il client salva anche una copia della Casa attiva al primo livello del salvataggio.
  for (const house of [save, ...save.houses]) familiarIdsInHouse(house, ids);
  return ids;
}

/**
 * Contenuti a pagamento nel salvataggio inviato dal client. Il client considera disponibile
 * ogni Casa presente nel salvataggio e "posseduto" ogni Famiglio indicato come attivo: senza
 * questo controllo un PUT costruito a mano sbloccava Case e Famigli premium senza acquisto.
 * Ciò che era già sul server resta valido, così un salvataggio esistente non si blocca mai.
 * Restituisce il messaggio d'errore, oppure null se il salvataggio è ammesso.
 */
export function rebuildSaveEntitlementViolation(
  incoming: FamiglioRebuildCloudSave,
  current: FamiglioRebuildCloudSave | null,
  entitlements: { offerIds: readonly string[]; appearanceIds: readonly string[] },
): string | null {
  for (const [index, offerId] of PAID_HOUSE_OFFER_IDS) {
    if (incoming.houses[index] && !current?.houses[index] && !entitlements.offerIds.includes(offerId)) {
      return "Questa Casa del Famiglio non è ancora stata acquistata nel tuo LoreWise ID.";
    }
  }
  const alreadyStored = familiarIdsInSave(current);
  for (const id of familiarIdsInSave(incoming)) {
    if (GATED_FAMILIAR_IDS.has(id) && !alreadyStored.has(id) && !entitlements.appearanceIds.includes(id)) {
      return "Questo Famiglio premium non è presente nel tuo LoreWise ID.";
    }
  }
  return null;
}
