import type { FamiliarDeviceCoverId, FamiliarHomeState, FamiliarInventoryItemId } from "./famiglioHome.ts";

/*
 * Serie di presenze consecutive del Famiglio.
 *
 * Non esiste un secondo sistema di tracciamento: la serie deriva soltanto dalle
 * date già registrate dal Registro presenze (`attendance.claimedDates`), che il
 * server scrive con il proprio orologio nel fuso Europe/Rome. I traguardi
 * pagano esclusivamente ricompense già presenti nell'economia della Casa:
 * Monete Nexus, provviste dell'inventario e una cover cosmetica del Nexus Pet.
 */

export const FAMILIAR_STREAK_TIME_ZONE = "Europe/Rome";
const DAY_MS = 86_400_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_CLAIM_RECORDS = 60;

export type FamiliarStreakMilestone = {
  days: number;
  title: string;
  label: string;
  coins: number;
  items: Partial<Record<FamiliarInventoryItemId, number>>;
  coverId: FamiliarDeviceCoverId | null;
  /** Monete che sostituiscono la cover se è già nella collezione. */
  coverFallbackCoins: number;
};

export const FAMILIAR_STREAK_MILESTONES: ReadonlyArray<FamiliarStreakMilestone> = [
  { days: 3, title: "Scintilla", label: "15 Monete Nexus e 1 Biscotto del viaggio", coins: 15, items: { "energy-biscuit": 1 }, coverId: null, coverFallbackCoins: 0 },
  { days: 7, title: "Fiamma", label: "30 Monete Nexus, 1 Pasto lunare e 1 Medicina di Nora", coins: 30, items: { "moon-meal": 1, "comfort-balm": 1 }, coverId: null, coverFallbackCoins: 0 },
  { days: 14, title: "Brace viva", label: "50 Monete Nexus, 2 Pasti lunari e 1 Tonico detergente", coins: 50, items: { "moon-meal": 2, "cleansing-tonic": 1 }, coverId: null, coverFallbackCoins: 0 },
  { days: 30, title: "Fuoco del legame", label: "80 Monete Nexus e la cover Arancio fiamma", coins: 80, items: {}, coverId: "orange-blaze", coverFallbackCoins: 40 },
];

export type FamiliarStreakClaim = { days: number; runStart: string; claimedOn: string };

export type FamiliarStreakSummary = {
  today: string;
  claimedToday: boolean;
  /** Giorni consecutivi fino a oggi (o fino a ieri, se oggi manca ancora la presenza). */
  current: number;
  best: number;
  /** Primo giorno della serie in corso, `null` se la serie è spenta. */
  runStart: string | null;
  /** La serie è viva ma oggi la presenza non è ancora registrata. */
  atRisk: boolean;
  nextMilestone: FamiliarStreakMilestone | null;
  previousMilestoneDays: number;
  claimable: FamiliarStreakMilestone[];
  claimedDays: number[];
};

type StreakAttendance = { claimedDates?: unknown; streak?: unknown; streakMilestones?: unknown };

function utcDay(date: string) {
  return Date.parse(`${date}T00:00:00Z`);
}

function validDate(value: unknown): value is string {
  return typeof value === "string" && DATE_RE.test(value) && Number.isFinite(utcDay(value));
}

/** Data civile a Roma: la mezzanotte italiana (ora legale o solare) separa i giorni. */
export function familiarStreakDateKey(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FAMILIAR_STREAK_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function shiftFamiliarDateKey(date: string, days: number) {
  return new Date(utcDay(date) + days * DAY_MS).toISOString().slice(0, 10);
}

export function restoreFamiliarStreakClaims(value: unknown): FamiliarStreakClaim[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const claims: FamiliarStreakClaim[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const candidate = entry as Partial<FamiliarStreakClaim>;
    if (!FAMILIAR_STREAK_MILESTONES.some((milestone) => milestone.days === candidate.days)) continue;
    if (!validDate(candidate.runStart) || !validDate(candidate.claimedOn)) continue;
    const key = `${candidate.days}:${candidate.runStart}`;
    if (seen.has(key)) continue;
    seen.add(key);
    claims.push({ days: candidate.days as number, runStart: candidate.runStart, claimedOn: candidate.claimedOn });
  }
  return claims.slice(-MAX_CLAIM_RECORDS);
}

function uniqueSortedDates(value: unknown, today: string) {
  if (!Array.isArray(value)) return [];
  // Le date future (orologio del client alterato o sfasato) non allungano mai la serie.
  return [...new Set(value.filter((date): date is string => validDate(date) && date <= today))].sort();
}

function longestRun(dates: string[]) {
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const date of dates) {
    run = previous && shiftFamiliarDateKey(previous, 1) === date ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }
  return best;
}

export function familiarStreakSummary(attendance: StreakAttendance | null | undefined, now = new Date()): FamiliarStreakSummary {
  const today = familiarStreakDateKey(now);
  const dates = uniqueSortedDates(attendance?.claimedDates, today);
  const set = new Set(dates);
  const claimedToday = set.has(today);
  const yesterday = shiftFamiliarDateKey(today, -1);
  let current = 0;
  let runStart: string | null = null;
  if (claimedToday || set.has(yesterday)) {
    let cursor = claimedToday ? today : yesterday;
    while (set.has(cursor)) {
      current += 1;
      runStart = cursor;
      cursor = shiftFamiliarDateKey(cursor, -1);
    }
  }
  const claims = restoreFamiliarStreakClaims(attendance?.streakMilestones);
  // Il Registro conserva al massimo 366 date: se la serie tocca l'inizio della
  // finestra, la vera partenza è quella registrata dall'ultimo traguardo riscosso.
  if (runStart && dates.length >= 366 && runStart === dates[0]) {
    const latest = [...claims].sort((a, b) => a.claimedOn.localeCompare(b.claimedOn)).at(-1);
    if (latest && latest.runStart < runStart) runStart = latest.runStart;
  }
  const storedStreak = Math.max(0, Math.min(365, Math.round(Number(attendance?.streak) || 0)));
  const best = Math.max(current, longestRun(dates), storedStreak);
  const claimedDays = runStart ? claims.filter((claim) => claim.runStart === runStart).map((claim) => claim.days).sort((a, b) => a - b) : [];
  const claimable = FAMILIAR_STREAK_MILESTONES.filter((milestone) => current >= milestone.days && !claimedDays.includes(milestone.days));
  const nextMilestone = FAMILIAR_STREAK_MILESTONES.find((milestone) => milestone.days > current) ?? null;
  const previousMilestoneDays = [...FAMILIAR_STREAK_MILESTONES].reverse().find((milestone) => milestone.days <= current)?.days ?? 0;
  return { today, claimedToday, current, best, runStart, atRisk: current > 0 && !claimedToday, nextMilestone, previousMilestoneDays, claimable, claimedDays };
}

export type FamiliarStreakClaimResult = {
  state: FamiliarHomeState;
  milestone: FamiliarStreakMilestone | null;
  status: "claimed" | "duplicate" | "locked" | "unknown";
  coins: number;
  coverGranted: boolean;
};

/**
 * Riscatta un traguardo una sola volta per ogni serie. La chiave di idempotenza
 * è `giorni + inizio della serie`: dopo un'interruzione la nuova serie può
 * guadagnare di nuovo i traguardi, ma solo ripetendo davvero le presenze.
 */
export function claimFamiliarStreakMilestone(state: FamiliarHomeState, days: number, now = new Date()): FamiliarStreakClaimResult {
  const milestone = FAMILIAR_STREAK_MILESTONES.find((entry) => entry.days === days) ?? null;
  if (!milestone) return { state, milestone: null, status: "unknown", coins: 0, coverGranted: false };
  const attendance = state.attendance;
  const summary = familiarStreakSummary(attendance, now);
  if (summary.claimedDays.includes(days)) return { state, milestone, status: "duplicate", coins: 0, coverGranted: false };
  if (!summary.runStart || summary.current < days) return { state, milestone, status: "locked", coins: 0, coverGranted: false };

  const ownedCoverIds = state.deviceCover.ownedIds;
  const coverGranted = Boolean(milestone.coverId && !ownedCoverIds.includes(milestone.coverId));
  const coins = milestone.coins + (milestone.coverId && !coverGranted ? milestone.coverFallbackCoins : 0);
  const quantities = { ...state.inventory.quantities };
  for (const [itemId, amount] of Object.entries(milestone.items) as Array<[FamiliarInventoryItemId, number]>) {
    quantities[itemId] = Math.max(0, (quantities[itemId] ?? 0) + amount);
  }
  const claims = [...restoreFamiliarStreakClaims(attendance.streakMilestones), { days, runStart: summary.runStart, claimedOn: summary.today }].slice(-MAX_CLAIM_RECORDS);
  const coverNote = milestone.coverId && !coverGranted ? ` (cover già posseduta: +${milestone.coverFallbackCoins} monete)` : "";
  return {
    milestone,
    status: "claimed",
    coins,
    coverGranted,
    state: {
      ...state,
      wallet: { ...state.wallet, nexusCoins: state.wallet.nexusCoins + coins, totalEarned: state.wallet.totalEarned + coins },
      inventory: { ...state.inventory, quantities },
      deviceCover: coverGranted && milestone.coverId ? { ...state.deviceCover, ownedIds: [...ownedCoverIds, milestone.coverId] } : state.deviceCover,
      attendance: { ...state.attendance, streakMilestones: claims },
      lastOutcome: `Serie di ${days} giorni: ${milestone.title}! ${milestone.label}${coverNote}.`,
    },
  };
}
