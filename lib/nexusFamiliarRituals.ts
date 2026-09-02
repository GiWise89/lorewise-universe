import type { FamiliarActionResult, FamiliarInventory, FamiliarItemKey, NexusFamiliarState } from "./nexusFamiliar.ts";

export const FAMILIAR_WISH_KINDS = ["food", "soap", "toy", "rest", "outing"] as const;
export type FamiliarWishKind = (typeof FAMILIAR_WISH_KINDS)[number];

export type FamiliarRitualState = {
  attendanceDates: string[];
  dailyWish: { date: string; kind: FamiliarWishKind; fulfilledAt: string | null };
  seasonalClaims: string[];
};

export type FamiliarAttendanceReward = {
  day: number;
  label: string;
  icon: string;
  coins: number;
  items: Partial<Record<FamiliarItemKey, number>>;
};

export type FamiliarSeasonalActivity = {
  id: string;
  title: string;
  description: string;
  icon: string;
  energyCost: number;
  reward: { coins: number; items: Partial<Record<FamiliarItemKey, number>> };
  requirement: "outing" | "mission" | "finale";
  requires?: string[];
};

export type FamiliarSeasonalEvent = {
  id: string;
  title: string;
  subtitle: string;
  dateLabel: string;
  startMonthDay: string;
  endMonthDay: string;
  accent: string;
  activities: FamiliarSeasonalActivity[];
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RITUAL_HISTORY = 120;

export const FAMILIAR_ATTENDANCE_REWARDS: FamiliarAttendanceReward[] = [
  { day: 1, label: "5 monete Nexus", icon: "/famiglio/navigation/shop-v1.webp", coins: 5, items: {} },
  { day: 2, label: "1 razione", icon: "/famiglio/needs/fame-v2.png", coins: 0, items: { food: 1 } },
  { day: 3, label: "1 giocattolo", icon: "/famiglio/needs/felicita-v2.png", coins: 0, items: { toy: 1 } },
  { day: 4, label: "8 monete Nexus", icon: "/famiglio/navigation/shop-v1.webp", coins: 8, items: {} },
  { day: 5, label: "1 sapone", icon: "/famiglio/needs/igiene-v2.png", coins: 0, items: { soap: 1 } },
  { day: 6, label: "12 monete Nexus", icon: "/famiglio/navigation/shop-v1.webp", coins: 12, items: {} },
  { day: 7, label: "Scrigno del legame", icon: "/famiglio/legacy/navigation/legame-v1.png", coins: 20, items: { food: 1, toy: 1 } },
];

export const FAMILIAR_WISH_CATALOG: Record<FamiliarWishKind, { title: string; description: string; icon: string; actionLabel: string }> = {
  food: { title: "Una piccola merenda", description: "Oggi desidera condividere con te una razione del Nexus.", icon: "/famiglio/needs/fame-v2.png", actionLabel: "Dagli da mangiare" },
  soap: { title: "Una cura splendente", description: "Oggi vorrebbe sentirsi pulito e leggero.", icon: "/famiglio/needs/igiene-v2.png", actionLabel: "Lavalo" },
  toy: { title: "Un momento di gioco", description: "Oggi cerca un momento allegro soltanto con te.", icon: "/famiglio/needs/felicita-v2.png", actionLabel: "Gioca insieme" },
  rest: { title: "Un sonno tranquillo", description: "Oggi desidera accucciarsi e recuperare le energie.", icon: "/famiglio/needs/energia-v2.png", actionLabel: "Fallo riposare" },
  outing: { title: "Aria di avventura", description: "Oggi vorrebbe uscire dalla tana e scoprire il Nexus.", icon: "/famiglio/navigation/fuori-casa-v1.webp", actionLabel: "Scegli un'uscita" },
};

export const FAMILIAR_SEASONAL_EVENTS: FamiliarSeasonalEvent[] = [
  {
    id: "anniversario-nexus", title: "Anniversario del Nexus", subtitle: "Le stanze ricordano ogni legame nato fra i mondi.", dateLabel: "24 agosto - 7 settembre", startMonthDay: "08-24", endMonthDay: "09-07", accent: "#f4c968",
    activities: [
      { id: "lanterna", title: "Accendi la lanterna", description: "Completa un'uscita reale e riporta la fiamma del varco.", icon: "/famiglio/time-icons/tramonto-v1.png", energyCost: 0, reward: { coins: 0, items: {} }, requirement: "outing" },
      { id: "sala-ricordi", title: "Attraversa la sala dei ricordi", description: "Completa e riscuoti una missione per custodire un ricordo.", icon: "/famiglio/legacy/navigation/legame-v1.png", energyCost: 0, reward: { coins: 0, items: {} }, requirement: "mission", requires: ["lanterna"] },
      { id: "sigillo", title: "Risveglia il sigillo", description: "Concludi il percorso dopo aver superato le due prove reali.", icon: "/famiglio/navigation/tana-v1.webp", energyCost: 12, reward: { coins: 40, items: { food: 1, toy: 1 } }, requirement: "finale", requires: ["lanterna", "sala-ricordi"] },
    ],
  },
  {
    id: "halloween-nexus", title: "Ombre di Halloween", subtitle: "Lanterne, nebbia viola e sentieri che compaiono soltanto di notte.", dateLabel: "24 ottobre - 1 novembre", startMonthDay: "10-24", endMonthDay: "11-01", accent: "#f08a42",
    activities: [
      { id: "zucca", title: "Segui la lanterna", description: "Completa un'uscita reale e trova il varco fra le zucche.", icon: "/famiglio/time-icons/tramonto-v1.png", energyCost: 0, reward: { coins: 0, items: {} }, requirement: "outing" },
      { id: "nebbia", title: "Attraversa la nebbia", description: "Completa e riscuoti una missione per raccogliere una traccia.", icon: "/famiglio/navigation/fuori-casa-v1.webp", energyCost: 0, reward: { coins: 0, items: {} }, requirement: "mission", requires: ["zucca"] },
      { id: "maschera", title: "Custodisci la maschera", description: "Concludi il percorso dopo aver superato le due prove reali.", icon: "/famiglio/legacy/navigation/legame-v1.png", energyCost: 12, reward: { coins: 46, items: { soap: 1, toy: 1 } }, requirement: "finale", requires: ["zucca", "nebbia"] },
    ],
  },
  {
    id: "feste-nexus", title: "Luci delle Feste", subtitle: "La neve accende i portali e ogni ritorno scalda la tana.", dateLabel: "1 dicembre - 6 gennaio", startMonthDay: "12-01", endMonthDay: "01-06", accent: "#8dd7e8",
    activities: [
      { id: "stella", title: "Accendi la stella", description: "Completa un'uscita reale e porta la prima luce nell'atrio.", icon: "/famiglio/time-icons/alba-v1.png", energyCost: 0, reward: { coins: 0, items: {} }, requirement: "outing" },
      { id: "fiocchi", title: "Segui i fiocchi", description: "Completa e riscuoti una missione lungo il cammino innevato.", icon: "/famiglio/navigation/fuori-casa-v1.webp", energyCost: 0, reward: { coins: 0, items: {} }, requirement: "mission", requires: ["stella"] },
      { id: "dono", title: "Apri il dono del Nexus", description: "Concludi il viaggio dopo aver superato le due prove reali.", icon: "/famiglio/navigation/shop-v1.webp", energyCost: 12, reward: { coins: 49, items: { food: 1, toy: 1 } }, requirement: "finale", requires: ["stella", "fiocchi"] },
    ],
  },
  {
    id: "primavera-nexus", title: "Risveglio di Primavera", subtitle: "I portali fioriscono e piccole luci tornano nei giardini.", dateLabel: "20 marzo - 7 aprile", startMonthDay: "03-20", endMonthDay: "04-07", accent: "#80dda7",
    activities: [
      { id: "seme", title: "Risveglia il seme", description: "Completa un'uscita reale e riporta una luce alla terra.", icon: "/famiglio/needs/felicita-v2.png", energyCost: 0, reward: { coins: 0, items: {} }, requirement: "outing" },
      { id: "lucciole", title: "Cerca le lucciole", description: "Completa e riscuoti una missione lungo il sentiero fiorito.", icon: "/famiglio/navigation/fuori-casa-v1.webp", energyCost: 0, reward: { coins: 0, items: {} }, requirement: "mission", requires: ["seme"] },
      { id: "fioritura", title: "Celebra la fioritura", description: "Concludi il nuovo ciclo dopo aver superato le prove reali.", icon: "/famiglio/navigation/tana-v1.webp", energyCost: 12, reward: { coins: 45, items: { soap: 1, food: 1, toy: 1 } }, requirement: "finale", requires: ["seme", "lucciole"] },
    ],
  },
];

function dateKey(now: Date) {
  return now.toISOString().slice(0, 10);
}

function stableIndex(seed: string, length: number) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) hash = Math.imul(hash ^ seed.charCodeAt(index), 16777619);
  return Math.abs(hash) % Math.max(1, length);
}

function wishFor(familiarId: string, date: string): FamiliarWishKind {
  return FAMILIAR_WISH_KINDS[stableIndex(`${familiarId}:${date}`, FAMILIAR_WISH_KINDS.length)];
}

function startOfWeekKey(now: Date) {
  const copy = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() - day + 1);
  return dateKey(copy);
}

export function createFamiliarRituals(familiarId: string, now = new Date()): FamiliarRitualState {
  const today = dateKey(now);
  return { attendanceDates: [], dailyWish: { date: today, kind: wishFor(familiarId, today), fulfilledAt: null }, seasonalClaims: [] };
}

export function normalizeFamiliarRituals(input: Partial<FamiliarRitualState> | null | undefined, familiarId: string, now = new Date()): FamiliarRitualState {
  const today = dateKey(now);
  const attendanceDates = [...new Set((Array.isArray(input?.attendanceDates) ? input.attendanceDates : []).filter((entry) => DATE_PATTERN.test(entry)))].sort().slice(-MAX_RITUAL_HISTORY);
  const seasonalClaims = [...new Set((Array.isArray(input?.seasonalClaims) ? input.seasonalClaims : []).filter((entry) => typeof entry === "string" && entry.length <= 100))].slice(-MAX_RITUAL_HISTORY);
  const savedWish = input?.dailyWish;
  const kind = savedWish?.date === today && FAMILIAR_WISH_KINDS.includes(savedWish.kind as FamiliarWishKind)
    ? savedWish.kind as FamiliarWishKind
    : wishFor(familiarId, today);
  return {
    attendanceDates,
    dailyWish: {
      date: today,
      kind,
      fulfilledAt: savedWish?.date === today && typeof savedWish.fulfilledAt === "string" && Number.isFinite(Date.parse(savedWish.fulfilledAt)) ? savedWish.fulfilledAt : null,
    },
    seasonalClaims,
  };
}

export function familiarAttendanceWeek(state: NexusFamiliarState, now = new Date()) {
  const rituals = normalizeFamiliarRituals(state.rituals, state.familiarId, now);
  const weekStart = startOfWeekKey(now);
  const claimed = rituals.attendanceDates.filter((entry) => entry >= weekStart && entry <= dateKey(now));
  return { claimed, claimedToday: claimed.includes(dateKey(now)), nextReward: FAMILIAR_ATTENDANCE_REWARDS[Math.min(6, claimed.length)] };
}

function addItems(inventory: FamiliarInventory, items: Partial<Record<FamiliarItemKey, number>>) {
  const next = { ...inventory };
  for (const [key, amount] of Object.entries(items) as Array<[FamiliarItemKey, number]>) next[key] = Math.max(0, next[key] + Math.floor(amount));
  return next;
}

export function claimFamiliarAttendance(state: NexusFamiliarState, now = new Date()): FamiliarActionResult {
  const rituals = normalizeFamiliarRituals(state.rituals, state.familiarId, now);
  const week = familiarAttendanceWeek({ ...state, rituals }, now);
  if (week.claimedToday) return { ok: false, state: { ...state, rituals }, error: "La ricompensa di oggi è già stata ritirata." };
  const reward = week.nextReward;
  return {
    ok: true,
    state: {
      ...state,
      nexusCoins: state.nexusCoins + reward.coins,
      inventory: addItems(state.inventory, reward.items),
      rituals: { ...rituals, attendanceDates: [...rituals.attendanceDates, dateKey(now)].slice(-MAX_RITUAL_HISTORY) },
      updatedAt: now.toISOString(),
    },
    message: `Presenza registrata: ${reward.label}. Nessun giorno saltato cancella il vostro legame.`,
  };
}

export function fulfillFamiliarDailyWish(state: NexusFamiliarState, action: FamiliarWishKind, now = new Date()): NexusFamiliarState {
  const rituals = normalizeFamiliarRituals(state.rituals, state.familiarId, now);
  if (rituals.dailyWish.fulfilledAt || rituals.dailyWish.kind !== action) return { ...state, rituals };
  return {
    ...state,
    nexusCoins: state.nexusCoins + 5,
    rituals: { ...rituals, dailyWish: { ...rituals.dailyWish, fulfilledAt: now.toISOString() } },
    updatedAt: now.toISOString(),
  };
}

function monthDay(now: Date) {
  return now.toISOString().slice(5, 10);
}

export function activeFamiliarSeasonalEvent(now = new Date()) {
  const current = monthDay(now);
  return FAMILIAR_SEASONAL_EVENTS.find((event) => event.startMonthDay <= event.endMonthDay
    ? current >= event.startMonthDay && current <= event.endMonthDay
    : current >= event.startMonthDay || current <= event.endMonthDay) ?? null;
}

export function familiarSeasonalClaimKey(event: FamiliarSeasonalEvent, activityId: string, now = new Date()) {
  const current = monthDay(now);
  const occurrenceYear = event.startMonthDay > event.endMonthDay && current <= event.endMonthDay
    ? now.getUTCFullYear() - 1
    : now.getUTCFullYear();
  return `${event.id}:${occurrenceYear}:${activityId}`;
}

function recordFamiliarSeasonalRequirement(state: NexusFamiliarState, requirement: "outing" | "mission", now = new Date()) {
  const event = activeFamiliarSeasonalEvent(now);
  const rituals = normalizeFamiliarRituals(state.rituals, state.familiarId, now);
  if (!event) return { ...state, rituals };
  const activity = event.activities.find((entry) => entry.requirement === requirement);
  if (!activity) return { ...state, rituals };
  const missingRequirement = activity.requires?.some((required) => !rituals.seasonalClaims.includes(familiarSeasonalClaimKey(event, required, now)));
  if (missingRequirement) return { ...state, rituals };
  const claimKey = familiarSeasonalClaimKey(event, activity.id, now);
  if (rituals.seasonalClaims.includes(claimKey)) return { ...state, rituals };
  return {
    ...state,
    rituals: { ...rituals, seasonalClaims: [...rituals.seasonalClaims, claimKey].slice(-MAX_RITUAL_HISTORY) },
    updatedAt: now.toISOString(),
  };
}

export function recordFamiliarSeasonalOuting(state: NexusFamiliarState, now = new Date()) {
  return recordFamiliarSeasonalRequirement(state, "outing", now);
}

export function recordFamiliarSeasonalMission(state: NexusFamiliarState, now = new Date()) {
  return recordFamiliarSeasonalRequirement(state, "mission", now);
}

export function completeFamiliarSeasonalActivity(state: NexusFamiliarState, activityId: string, now = new Date()): FamiliarActionResult {
  const event = activeFamiliarSeasonalEvent(now);
  const rituals = normalizeFamiliarRituals(state.rituals, state.familiarId, now);
  if (!event) return { ok: false, state: { ...state, rituals }, error: "Il prossimo varco stagionale non è ancora aperto." };
  const activity = event.activities.find((entry) => entry.id === activityId);
  if (!activity) return { ok: false, state: { ...state, rituals }, error: "Attività stagionale non disponibile." };
  if (activity.requirement !== "finale") return { ok: false, state: { ...state, rituals }, error: activity.requirement === "outing" ? "Completa prima una vera uscita." : "Completa e riscuoti prima una missione." };
  const claimKey = familiarSeasonalClaimKey(event, activity.id, now);
  if (rituals.seasonalClaims.includes(claimKey)) return { ok: false, state: { ...state, rituals }, error: "Questa esperienza è già stata completata." };
  const missingRequirement = activity.requires?.find((required) => !rituals.seasonalClaims.includes(familiarSeasonalClaimKey(event, required, now)));
  if (missingRequirement) return { ok: false, state: { ...state, rituals }, error: "Completa prima il passaggio precedente." };
  if (state.needs.energy < activity.energyCost) return { ok: false, state: { ...state, rituals }, error: "Il Famiglio deve recuperare energia prima di entrare nel varco." };
  return {
    ok: true,
    state: {
      ...state,
      needs: { ...state.needs, energy: Math.max(0, state.needs.energy - activity.energyCost) },
      nexusCoins: state.nexusCoins + activity.reward.coins,
      inventory: addItems(state.inventory, activity.reward.items),
      rituals: { ...rituals, seasonalClaims: [...rituals.seasonalClaims, claimKey].slice(-MAX_RITUAL_HISTORY) },
      updatedAt: now.toISOString(),
    },
    message: `${activity.title} completato: +${activity.reward.coins} monete Nexus.`,
  };
}
