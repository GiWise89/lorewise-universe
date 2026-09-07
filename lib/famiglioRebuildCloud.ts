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
