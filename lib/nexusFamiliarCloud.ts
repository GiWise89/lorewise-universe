import { FAMILIAR_DEN_ANCHOR_IDS, normalizeNexusFamiliar, type NexusFamiliarState } from "./nexusFamiliar.ts";
import { familiarAppearance } from "./nexusFamiliarCatalog.ts";

export const FAMILIAR_CLOUD_MAX_BYTES = 32 * 1024;

export type FamiliarCloudValidation =
  | { ok: true; state: NexusFamiliarState }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function serializedSize(value: unknown) {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).byteLength;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

export function sanitizeFamiliarCloudState(value: unknown, now = new Date()): FamiliarCloudValidation {
  if (!isRecord(value) || serializedSize(value) > FAMILIAR_CLOUD_MAX_BYTES) {
    return { ok: false, error: "Salvataggio del Famiglio non valido." };
  }
  if (value.schemaVersion !== 1 || value.species !== "famiglio-del-nexus") {
    return { ok: false, error: "Versione del Famiglio non riconosciuta." };
  }

  const familiarId = typeof value.familiarId === "string" ? value.familiarId.trim() : "";
  const appearanceId = typeof value.appearanceId === "string" ? value.appearanceId : "";
  const name = typeof value.name === "string" ? value.name.trim().replace(/\s+/g, " ") : "";
  if (!familiarId || familiarId.length > 80 || name.length < 2 || name.length > 24) {
    return { ok: false, error: "Identita del Famiglio non valida." };
  }
  if (!appearanceId || familiarAppearance(appearanceId).id !== appearanceId) {
    return { ok: false, error: "Aspetto del Famiglio non riconosciuto." };
  }
  if (!isRecord(value.needs) || !isRecord(value.inventory) || !isRecord(value.den)) {
    return { ok: false, error: "Dati di cura del Famiglio incompleti." };
  }

  const inventory = value.inventory;
  const den = value.den;
  if (!Array.isArray(value.caredDays) || value.caredDays.length > 3660
    || (value.claimedMilestoneLevels !== undefined && (!Array.isArray(value.claimedMilestoneLevels) || value.claimedMilestoneLevels.length > 7))
    || !Array.isArray(inventory.decorations) || inventory.decorations.length > 250
    || !Array.isArray(den.unlockedThemes) || den.unlockedThemes.length > 100
    || (den.unlockedGadgets !== undefined && (!Array.isArray(den.unlockedGadgets) || den.unlockedGadgets.length > 100))
    || !Array.isArray(den.unlockedDecorations) || den.unlockedDecorations.length > 250
    || !isRecord(den.equipped)
    || (den.placements !== undefined && !isRecord(den.placements))
    || (den.wallCoordinates !== undefined && !isRecord(den.wallCoordinates))) {
    return { ok: false, error: "Archivio del Famiglio troppo esteso o incompleto." };
  }
  if (value.dailyProgress !== undefined && (!isRecord(value.dailyProgress)
    || !/^\d{4}-\d{2}-\d{2}$/.test(String(value.dailyProgress.date ?? ""))
    || !Number.isFinite(Number(value.dailyProgress.careExperience))
    || !Number.isFinite(Number(value.dailyProgress.outingsStarted)))) {
    return { ok: false, error: "Bilancio giornaliero del Famiglio non valido." };
  }
  if (value.legacy !== undefined && (!isRecord(value.legacy)
    || !isRecord(value.legacy.personality)
    || !Array.isArray(value.legacy.memories) || value.legacy.memories.length > 24
    || !Array.isArray(value.legacy.discoveries) || value.legacy.discoveries.length > 48
    || !Array.isArray(value.legacy.postcards) || value.legacy.postcards.length > 24)) {
    return { ok: false, error: "Diario del Famiglio non valido." };
  }
  if (value.rituals !== undefined && (!isRecord(value.rituals)
    || !Array.isArray(value.rituals.attendanceDates) || value.rituals.attendanceDates.length > 120
    || !Array.isArray(value.rituals.seasonalClaims) || value.rituals.seasonalClaims.length > 120
    || !isRecord(value.rituals.dailyWish))) {
    return { ok: false, error: "Rituali del Famiglio non validi." };
  }

  const stringListIsValid = (list: unknown[]) => list.every((entry) => typeof entry === "string" && entry.length <= 80);
  if (!stringListIsValid(value.caredDays) || !stringListIsValid(inventory.decorations)
    || (Array.isArray(value.claimedMilestoneLevels) && value.claimedMilestoneLevels.some((entry) => !Number.isInteger(Number(entry))))
    || !stringListIsValid(den.unlockedThemes) || (Array.isArray(den.unlockedGadgets) && !stringListIsValid(den.unlockedGadgets)) || !stringListIsValid(den.unlockedDecorations)
    || (den.equippedGadget !== undefined && den.equippedGadget !== null && (typeof den.equippedGadget !== "string" || !Array.isArray(den.unlockedGadgets) || !den.unlockedGadgets.includes(den.equippedGadget)))
    || Object.entries(den.equipped).some(([slot, entry]) => !["bed", "wall", "floor", "companion"].includes(slot)
      || typeof entry !== "string" || entry.length > 80)
    || (isRecord(den.placements) && Object.entries(den.placements).some(([anchor, entry]) => !FAMILIAR_DEN_ANCHOR_IDS.includes(anchor as (typeof FAMILIAR_DEN_ANCHOR_IDS)[number])
      || typeof entry !== "string" || entry.length > 80))
    || (isRecord(den.wallCoordinates) && Object.entries(den.wallCoordinates).some(([decorationId, coordinates]) => decorationId.length > 80
      || !isRecord(coordinates) || !Number.isFinite(Number(coordinates.left)) || !Number.isFinite(Number(coordinates.top))))) {
    return { ok: false, error: "Oggetti della tana non validi." };
  }
  if (isRecord(value.rituals) && (
    !stringListIsValid(value.rituals.attendanceDates as unknown[])
    || !stringListIsValid(value.rituals.seasonalClaims as unknown[])
    || !["food", "soap", "toy", "rest", "outing"].includes(String((value.rituals.dailyWish as Record<string, unknown>).kind ?? ""))
  )) return { ok: false, error: "Cronologia dei rituali non valida." };

  const normalized = normalizeNexusFamiliar({
    ...value,
    experience: Math.min(Math.max(0, Math.floor(Number(value.experience) || 0)), 10_000_000),
    nexusCoins: typeof value.nexusCoins === "number" && Number.isFinite(value.nexusCoins)
      ? Math.min(Math.max(0, Math.floor(value.nexusCoins)), 1_000_000)
      : undefined,
  } as NexusFamiliarState, now);
  const updatedAt = Date.parse(normalized.updatedAt) > now.getTime() + 5 * 60 * 1000
    ? now.toISOString()
    : normalized.updatedAt;
  return {
    ok: true,
    state: {
      ...normalized,
      familiarId,
      name,
      updatedAt,
      nexusCoins: Math.min(normalized.nexusCoins, 1_000_000),
      inventory: {
        ...normalized.inventory,
        food: Math.min(normalized.inventory.food, 9999),
        soap: Math.min(normalized.inventory.soap, 9999),
        medicine: Math.min(normalized.inventory.medicine, 9999),
        toy: Math.min(normalized.inventory.toy, 9999),
      },
    },
  };
}

export function newerFamiliarState(local: NexusFamiliarState | null, remote: NexusFamiliarState | null) {
  if (!local) return remote ? "remote" : "none";
  if (!remote) return "local";
  const localTime = Date.parse(local.updatedAt);
  const remoteTime = Date.parse(remote.updatedAt);
  return remoteTime > localTime ? "remote" : "local";
}
