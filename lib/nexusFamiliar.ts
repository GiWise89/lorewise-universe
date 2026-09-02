import { familiarExperienceForLevel, FAMILIAR_MILESTONES, MAX_FAMILIAR_LEVEL } from "./nexusFamiliarProgression.ts";
import { createFamiliarLegacy, normalizeFamiliarLegacy, recordFamiliarCareLegacy, recordFamiliarMilestoneMemories, type FamiliarLegacyState } from "./nexusFamiliarLegacy.ts";
import { createFamiliarRituals, fulfillFamiliarDailyWish, normalizeFamiliarRituals, type FamiliarRitualState } from "./nexusFamiliarRituals.ts";

export const FAMILIAR_NEED_KEYS = ["hunger", "hygiene", "energy", "happiness", "health"] as const;
export type FamiliarNeedKey = (typeof FAMILIAR_NEED_KEYS)[number];

export const FAMILIAR_ITEM_KEYS = ["food", "soap", "medicine", "toy"] as const;
export type FamiliarItemKey = (typeof FAMILIAR_ITEM_KEYS)[number];

export type FamiliarGrowthStage = "cucciolo" | "giovane" | "adulto";
export type FamiliarCondition = "sereno" | "bisognoso" | "fragile" | "dormiente";
export type FamiliarDenSlot = "bed" | "wall" | "floor" | "companion";
export const FAMILIAR_DEN_ANCHOR_IDS = ["floor-left", "floor-center", "floor-right", "wall-left", "wall-right"] as const;
export type FamiliarDenAnchorId = (typeof FAMILIAR_DEN_ANCHOR_IDS)[number];
export type FamiliarSex = "female" | "male" | "unspecified";

export type FamiliarNeeds = Record<FamiliarNeedKey, number>;
export type FamiliarInventory = Record<FamiliarItemKey, number> & {
  decorations: string[];
};

export type FamiliarDen = {
  theme: string;
  unlockedThemes: string[];
  equippedGadget: string | null;
  unlockedGadgets: string[];
  equipped: Partial<Record<FamiliarDenSlot, string>>;
  placements: Partial<Record<FamiliarDenAnchorId, string>>;
  wallCoordinates: Record<string, { left: number; top: number }>;
  unlockedDecorations: string[];
};

export type FamiliarOuting = {
  destinationId: string;
  startedAt: string;
  endsAt: string;
};

export type NexusFamiliarState = {
  schemaVersion: 1;
  familiarId: string;
  name: string;
  sex: FamiliarSex;
  species: "famiglio-del-nexus";
  appearanceId: string;
  bornAt: string;
  updatedAt: string;
  lastCareDate: string;
  needs: FamiliarNeeds;
  experience: number;
  level: number;
  growthStage: FamiliarGrowthStage;
  claimedMilestoneLevels: number[];
  caredDays: string[];
  inventory: FamiliarInventory;
  den: FamiliarDen;
  nexusCoins: number;
  dailyProgress: {
    date: string;
    careExperience: number;
    outingsStarted: number;
  };
  outing: FamiliarOuting | null;
  legacy: FamiliarLegacyState;
  rituals: FamiliarRitualState;
};

export type FamiliarActionResult =
  | { ok: true; state: NexusFamiliarState; message: string }
  | { ok: false; state: NexusFamiliarState; error: string };

const HOUR_MS = 60 * 60 * 1000;
const MAX_OFFLINE_HOURS = 72;
export const MAX_DAILY_CARE_EXPERIENCE = 80;
const NEED_DECAY_PER_HOUR: Omit<FamiliarNeeds, "health"> = {
  hunger: 1.25,
  hygiene: 0.75,
  energy: 0.9,
  happiness: 0.55,
};

const ITEM_EFFECTS: Record<FamiliarItemKey, { needs: Partial<FamiliarNeeds>; experience: number; label: string }> = {
  food: { needs: { hunger: 30, health: 2 }, experience: 20, label: "Razione del Nexus" },
  soap: { needs: { hygiene: 38, health: 1 }, experience: 20, label: "Sapone rituale" },
  medicine: { needs: { health: 48 }, experience: 15, label: "Medicina del Custode" },
  toy: { needs: { happiness: 34, energy: -5 }, experience: 25, label: "Giocattolo del Nexus" },
};

const STARTER_DECORATIONS: string[] = [];

function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum));
}

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function familiarLevelForExperience(experience: number) {
  return Math.min(MAX_FAMILIAR_LEVEL, Math.max(1, Math.floor(Math.sqrt(Math.max(0, experience) / 25)) + 1));
}

export function familiarGrowthStage(level: number, caredDays: number): FamiliarGrowthStage {
  if (level >= 35 && caredDays >= 35) return "adulto";
  if (level >= 15 && caredDays >= 14) return "giovane";
  return "cucciolo";
}

export function familiarCondition(needs: FamiliarNeeds): FamiliarCondition {
  if (needs.health <= 0) return "dormiente";
  if (needs.health < 30 || FAMILIAR_NEED_KEYS.filter((key) => key !== "health").some((key) => needs[key] < 10)) return "fragile";
  if (FAMILIAR_NEED_KEYS.filter((key) => key !== "health").some((key) => needs[key] < 35)) return "bisognoso";
  return "sereno";
}

export function createNexusFamiliar(
  now = new Date(),
  familiarId = crypto.randomUUID(),
  appearanceId = "cat-1",
  identity: { name?: string; sex?: FamiliarSex } = {},
): NexusFamiliarState {
  const timestamp = now.toISOString();
  const chosenName = String(identity.name ?? "Famiglio").trim().replace(/\s+/g, " ").slice(0, 24);
  return {
    schemaVersion: 1,
    familiarId,
    name: chosenName.length >= 2 ? chosenName : "Famiglio",
    sex: identity.sex === "female" || identity.sex === "male" ? identity.sex : "unspecified",
    species: "famiglio-del-nexus",
    appearanceId,
    bornAt: timestamp,
    updatedAt: timestamp,
    lastCareDate: dateKey(now),
    needs: { hunger: 82, hygiene: 86, energy: 78, happiness: 80, health: 100 },
    experience: 0,
    level: 1,
    growthStage: "cucciolo",
    claimedMilestoneLevels: [],
    caredDays: [dateKey(now)],
    inventory: { food: 5, soap: 3, medicine: 1, toy: 1, decorations: [] },
    den: {
      theme: "rifugio-iniziale",
      unlockedThemes: ["rifugio-iniziale"],
      equippedGadget: null,
      unlockedGadgets: [],
      equipped: {},
      placements: {},
      wallCoordinates: {},
      unlockedDecorations: [],
    },
    nexusCoins: 35,
    dailyProgress: { date: dateKey(now), careExperience: 0, outingsStarted: 0 },
    outing: null,
    legacy: createFamiliarLegacy(now),
    rituals: createFamiliarRituals(familiarId, now),
  };
}

export function normalizeNexusFamiliar(input: NexusFamiliarState, now = new Date()): NexusFamiliarState {
  const caredDays = [...new Set(Array.isArray(input.caredDays) ? input.caredDays.filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value)) : [])].sort();
  const experience = Math.min(familiarExperienceForLevel(MAX_FAMILIAR_LEVEL), Math.max(0, Math.floor(Number(input.experience) || 0)));
  const level = familiarLevelForExperience(experience);
  const claimedMilestoneLevels = [...new Set((Array.isArray(input.claimedMilestoneLevels) ? input.claimedMilestoneLevels : [])
    .map((entry) => Math.floor(Number(entry)))
    .filter((entry) => FAMILIAR_MILESTONES.some((milestone) => milestone.level === entry)))].sort((left, right) => left - right);
  const unlockedDecorations: string[] = [];
  const inventoryDecorations: string[] = [];
  const legacyPlacements: Partial<Record<FamiliarDenAnchorId, string>> = {
    ...(input.den?.equipped?.bed ? { "floor-left": input.den.equipped.bed } : {}),
    ...(input.den?.equipped?.companion ? { "floor-center": input.den.equipped.companion } : {}),
    ...(input.den?.equipped?.floor ? { "floor-right": input.den.equipped.floor } : {}),
    ...(input.den?.equipped?.wall ? { "wall-left": input.den.equipped.wall } : {}),
  };
  void legacyPlacements;
  const placements: Partial<Record<FamiliarDenAnchorId, string>> = {};
  const wallCoordinates: Record<string, { left: number; top: number }> = {};
  const dailyProgressDate = /^\d{4}-\d{2}-\d{2}$/.test(input.dailyProgress?.date ?? "")
    ? input.dailyProgress.date
    : dateKey(now);
  const dailyProgress = dailyProgressDate === dateKey(now)
    ? {
      date: dailyProgressDate,
      careExperience: Math.min(MAX_DAILY_CARE_EXPERIENCE, Math.max(0, Math.floor(Number(input.dailyProgress?.careExperience) || 0))),
      outingsStarted: Math.min(3, Math.max(0, Math.floor(Number(input.dailyProgress?.outingsStarted) || 0))),
    }
    : { date: dateKey(now), careExperience: 0, outingsStarted: 0 };
  return {
    schemaVersion: 1,
    familiarId: String(input.familiarId || crypto.randomUUID()),
    name: String(input.name || "Famiglio").trim().slice(0, 24) || "Famiglio",
    sex: input.sex === "female" || input.sex === "male" ? input.sex : "unspecified",
    species: "famiglio-del-nexus",
    appearanceId: String(input.appearanceId || "cat-1"),
    bornAt: Number.isFinite(Date.parse(input.bornAt)) ? input.bornAt : now.toISOString(),
    updatedAt: Number.isFinite(Date.parse(input.updatedAt)) ? input.updatedAt : now.toISOString(),
    lastCareDate: /^\d{4}-\d{2}-\d{2}$/.test(input.lastCareDate) ? input.lastCareDate : dateKey(now),
    needs: Object.fromEntries(FAMILIAR_NEED_KEYS.map((key) => [key, clamp(Number(input.needs?.[key]))])) as FamiliarNeeds,
    experience,
    level,
    growthStage: familiarGrowthStage(level, caredDays.length),
    claimedMilestoneLevels,
    caredDays,
    inventory: {
      food: Math.max(0, Math.floor(Number(input.inventory?.food) || 0)),
      soap: Math.max(0, Math.floor(Number(input.inventory?.soap) || 0)),
      medicine: Math.max(0, Math.floor(Number(input.inventory?.medicine) || 0)),
      toy: Math.max(0, Math.floor(Number(input.inventory?.toy) || 0)),
      decorations: inventoryDecorations,
    },
    den: {
      theme: input.den?.unlockedThemes?.includes(input.den.theme) ? input.den.theme : "rifugio-iniziale",
      unlockedThemes: [...new Set(["rifugio-iniziale", ...(input.den?.unlockedThemes ?? [])])],
      equippedGadget: typeof input.den?.equippedGadget === "string" && input.den?.unlockedGadgets?.includes(input.den.equippedGadget) ? input.den.equippedGadget : null,
      unlockedGadgets: [...new Set((input.den?.unlockedGadgets ?? []).filter((entry): entry is string => typeof entry === "string"))],
      equipped: {},
      placements,
      wallCoordinates,
      unlockedDecorations: [...new Set([...STARTER_DECORATIONS, ...unlockedDecorations, ...inventoryDecorations])],
    },
    nexusCoins: typeof input.nexusCoins === "number" && Number.isFinite(input.nexusCoins)
      ? Math.max(0, Math.floor(input.nexusCoins))
      : 35,
    dailyProgress,
    outing: input.outing && typeof input.outing.destinationId === "string" && Number.isFinite(Date.parse(input.outing.startedAt)) && Number.isFinite(Date.parse(input.outing.endsAt))
      ? { destinationId: input.outing.destinationId.slice(0, 48), startedAt: input.outing.startedAt, endsAt: input.outing.endsAt }
      : null,
    legacy: normalizeFamiliarLegacy(input.legacy, now),
    rituals: normalizeFamiliarRituals(input.rituals, String(input.familiarId || "famiglio"), now),
  };
}

export function applyFamiliarTimePassage(state: NexusFamiliarState, now = new Date()): NexusFamiliarState {
  const current = normalizeNexusFamiliar(state, now);
  const previousTime = Date.parse(current.updatedAt);
  const elapsedHours = Math.min(MAX_OFFLINE_HOURS, Math.max(0, (now.getTime() - previousTime) / HOUR_MS));
  if (elapsedHours === 0) return { ...current, updatedAt: now.toISOString() };

  const needs: FamiliarNeeds = {
    hunger: clamp(current.needs.hunger - NEED_DECAY_PER_HOUR.hunger * elapsedHours),
    hygiene: clamp(current.needs.hygiene - NEED_DECAY_PER_HOUR.hygiene * elapsedHours),
    energy: clamp(current.needs.energy - NEED_DECAY_PER_HOUR.energy * elapsedHours),
    happiness: clamp(current.needs.happiness - NEED_DECAY_PER_HOUR.happiness * elapsedHours),
    health: current.needs.health,
  };
  const criticalNeeds = [needs.hunger, needs.hygiene, needs.energy, needs.happiness].filter((value) => value < 20).length;
  const healthyNeeds = [needs.hunger, needs.hygiene, needs.energy, needs.happiness].every((value) => value >= 65);
  needs.health = clamp(needs.health - criticalNeeds * 0.65 * elapsedHours + (healthyNeeds ? 0.12 * elapsedHours : 0));
  return { ...current, needs, updatedAt: now.toISOString() };
}

function withExperience(state: NexusFamiliarState, amount: number, now: Date) {
  const experience = Math.min(familiarExperienceForLevel(MAX_FAMILIAR_LEVEL), Math.max(0, state.experience + amount));
  const caredDays = [...new Set([...state.caredDays, dateKey(now)])].sort();
  const level = familiarLevelForExperience(experience);
  const newlyUnlocked = FAMILIAR_MILESTONES.filter((milestone) => level >= milestone.level && !state.claimedMilestoneLevels.includes(milestone.level));
  const unlockedThemes = new Set(state.den.unlockedThemes);
  const unlockedGadgets = new Set(state.den.unlockedGadgets);
  let nexusCoins = state.nexusCoins;
  for (const milestone of newlyUnlocked) {
    nexusCoins += milestone.reward.coins ?? 0;
    if (milestone.reward.themeId) unlockedThemes.add(milestone.reward.themeId);
    if (milestone.reward.gadgetId) unlockedGadgets.add(milestone.reward.gadgetId);
  }
  const progressed = {
    ...state,
    experience,
    level,
    growthStage: familiarGrowthStage(level, caredDays.length),
    claimedMilestoneLevels: [...new Set([...state.claimedMilestoneLevels, ...newlyUnlocked.map((milestone) => milestone.level)])].sort((left, right) => left - right),
    nexusCoins,
    den: {
      ...state.den,
      unlockedThemes: [...unlockedThemes],
      unlockedGadgets: [...unlockedGadgets],
    },
    caredDays,
    lastCareDate: dateKey(now),
    updatedAt: now.toISOString(),
  };
  return recordFamiliarMilestoneMemories(progressed, newlyUnlocked.map((milestone) => milestone.level), now);
}

function withCareExperience(state: NexusFamiliarState, amount: number, now: Date) {
  const remaining = Math.max(0, MAX_DAILY_CARE_EXPERIENCE - state.dailyProgress.careExperience);
  const earned = Math.min(Math.max(0, Math.floor(amount)), remaining);
  const progressed = withExperience(state, earned, now);
  return {
    state: {
      ...progressed,
      dailyProgress: {
        ...progressed.dailyProgress,
        careExperience: progressed.dailyProgress.careExperience + earned,
      },
    },
    earned,
  };
}

export function useFamiliarItem(state: NexusFamiliarState, item: FamiliarItemKey, now = new Date()): FamiliarActionResult {
  const current = applyFamiliarTimePassage(state, now);
  const requestedWish = !current.rituals.dailyWish.fulfilledAt && current.rituals.dailyWish.kind === item;
  if (!FAMILIAR_ITEM_KEYS.includes(item)) return { ok: false, state: current, error: "Oggetto non riconosciuto." };
  if (!requestedWish && item === "food" && current.needs.hunger >= 90) return { ok: false, state: current, error: "Il Famiglio non ha ancora fame." };
  if (!requestedWish && item === "soap" && current.needs.hygiene >= 90) return { ok: false, state: current, error: "Il Famiglio è già pulito." };
  if (!requestedWish && item === "toy" && current.needs.happiness >= 90) return { ok: false, state: current, error: "Il Famiglio è già felice e appagato." };
  if (current.inventory[item] <= 0) return { ok: false, state: current, error: `${ITEM_EFFECTS[item].label} non disponibile nell’inventario.` };
  if (item === "medicine" && current.needs.health >= 100) return { ok: false, state: current, error: "Il Famiglio è già in piena salute." };

  const effect = ITEM_EFFECTS[item];
  const needs = { ...current.needs };
  for (const [key, amount] of Object.entries(effect.needs) as Array<[FamiliarNeedKey, number]>) needs[key] = clamp(needs[key] + amount);
  const progress = withCareExperience({
    ...current,
    needs,
    inventory: { ...current.inventory, [item]: current.inventory[item] - 1 },
  }, effect.experience, now);
  const recorded = recordFamiliarCareLegacy(progress.state, item, now);
  return { ok: true, state: item === "medicine" ? recorded : fulfillFamiliarDailyWish(recorded, item, now), message: progress.earned
    ? `${effect.label} utilizzato: +${progress.earned} PE.`
    : `${effect.label} utilizzato. Cura completata; i PE giornalieri sono già al massimo.` };
}

export function restFamiliar(state: NexusFamiliarState, now = new Date()): FamiliarActionResult {
  const current = applyFamiliarTimePassage(state, now);
  const requestedWish = !current.rituals.dailyWish.fulfilledAt && current.rituals.dailyWish.kind === "rest";
  if (!requestedWish && current.needs.energy >= 90) return { ok: false, state: current, error: "Il Famiglio è già riposato." };
  const progress = withCareExperience({
    ...current,
    needs: { ...current.needs, energy: clamp(current.needs.energy + 42), happiness: clamp(current.needs.happiness + 3) },
  }, 15, now);
  return { ok: true, state: fulfillFamiliarDailyWish(recordFamiliarCareLegacy(progress.state, "rest", now), "rest", now), message: progress.earned
    ? `Il Famiglio ha riposato nella sua tana: +${progress.earned} PE.`
    : "Il Famiglio ha riposato. I PE giornalieri delle cure sono già al massimo." };
}

export function renameFamiliar(state: NexusFamiliarState, name: string, now = new Date()): FamiliarActionResult {
  const current = applyFamiliarTimePassage(state, now);
  const safeName = name.trim().replace(/\s+/g, " ").slice(0, 24);
  if (safeName.length < 2) return { ok: false, state: current, error: "Il nome deve contenere almeno due caratteri." };
  return { ok: true, state: { ...current, name: safeName, updatedAt: now.toISOString() }, message: `Il Famiglio ora si chiama ${safeName}.` };
}

export function decorateFamiliarDen(state: NexusFamiliarState, slot: FamiliarDenSlot, decorationId: string, now = new Date()): FamiliarActionResult {
  const current = applyFamiliarTimePassage(state, now);
  if (!current.den.unlockedDecorations.includes(decorationId)) return { ok: false, state: current, error: "Questa decorazione non è stata ancora sbloccata." };
  return {
    ok: true,
    state: { ...current, den: { ...current.den, equipped: { ...current.den.equipped, [slot]: decorationId } }, updatedAt: now.toISOString() },
    message: "La tana è stata aggiornata.",
  };
}

export function grantFamiliarItems(state: NexusFamiliarState, rewards: Partial<Record<FamiliarItemKey, number>>, now = new Date()): NexusFamiliarState {
  const current = applyFamiliarTimePassage(state, now);
  const inventory = { ...current.inventory };
  for (const item of FAMILIAR_ITEM_KEYS) inventory[item] = Math.max(0, inventory[item] + Math.floor(Number(rewards[item]) || 0));
  return { ...current, inventory, updatedAt: now.toISOString() };
}

export function grantFamiliarProgress(state: NexusFamiliarState, rewards: { coins?: number; experience?: number; items?: Partial<Record<FamiliarItemKey, number>> }, now = new Date()): NexusFamiliarState {
  const withItems = grantFamiliarItems(state, rewards.items ?? {}, now);
  return withExperience({
    ...withItems,
    nexusCoins: Math.max(0, withItems.nexusCoins + Math.floor(Number(rewards.coins) || 0)),
  }, Math.max(0, Math.floor(Number(rewards.experience) || 0)), now);
}
