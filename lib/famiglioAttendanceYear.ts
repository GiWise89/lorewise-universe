import type { FamiliarHomeState, FamiliarInventoryItemId } from "./famiglioHome.ts";

export const FAMILIAR_ATTENDANCE_DAYS = 365;
export const FAMILIAR_ATTENDANCE_WEEKS = 52;
export const FAMILIAR_ATTENDANCE_LAUNCH_DATE = process.env.NEXT_PUBLIC_FAMILIAR_ATTENDANCE_LAUNCH_DATE || "2026-09-08";

export const FAMILIAR_ATTENDANCE_SEASONS = [
  { id: "lunare", name: "Lunare", weeks: [1, 13], accent: "#77e6ff", cover: "/famiglio/rebuild/attendance/covers/lunare.png" },
  { id: "bosco", name: "Bosco", weeks: [14, 26], accent: "#8ee071", cover: "/famiglio/rebuild/attendance/covers/bosco.png" },
  { id: "arcano", name: "Arcano Fossile", weeks: [27, 39], accent: "#ffc85a", cover: "/famiglio/rebuild/attendance/covers/arcano.png" },
  { id: "crepuscolo", name: "Crepuscolo", weeks: [40, 52], accent: "#c68cff", cover: "/famiglio/rebuild/attendance/covers/crepuscolo.png" },
] as const;

const WEEKLY_NAMES = [
  "Campanella lunare", "Astrolabio tascabile", "Stella in bottiglia", "Tamburello celeste", "Lanterna di Selene", "Trottola orbitale", "Fischietto astrale", "Carillon delle maree", "Cometa di stoffa", "Specchio lunare", "Corona delle stelle", "Mappa del cielo", "Scrigno dell'eclissi",
  "Ghianda risonante", "Flauto di corteccia", "Fungo luminoso", "Pigna musicale", "Foglia danzante", "Bacchetta di felce", "Tamburo del bosco", "Nido portafortuna", "Lucciola in lanterna", "Ciondolo di muschio", "Campana dei cervi", "Seme del guardiano", "Scrigno delle radici",
  "Ammonite dorata", "Bussola runica", "Uovo fossile", "Cristallo inciso", "Clessidra d'ambra", "Maschera dello studioso", "Pergamena antica", "Totem del trilobite", "Chiave di ossidiana", "Occhio minerale", "Dado delle ere", "Martello del cercatore", "Scrigno dell'origine",
  "Falena viola", "Prisma del vespro", "Candela del varco", "Piuma d'ombra", "Luna spezzata", "Sfera crepuscolare", "Sigillo del Nulla", "Fiore notturno", "Gatto di pezza astrale", "Portale in miniatura", "Corona del tramonto", "Costellazione errante", "Scrigno del Crepuscolo",
] as const;

export type FamiliarAttendanceState = {
  launchDate: string;
  claimedDates: string[];
  streak: number;
  lastClaimDate: string | null;
  collectibles: string[];
  echoShards: number;
};

export type FamiliarAttendanceReward = {
  dayIndex: number;
  week: number;
  weekday: number;
  seasonId: typeof FAMILIAR_ATTENDANCE_SEASONS[number]["id"];
  label: string;
  coins: number;
  items: Partial<Record<FamiliarInventoryItemId, number>>;
  collectibleId: string | null;
  collectibleName: string | null;
  icon: string;
  rare: boolean;
};

const DAY_MS = 86_400_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const itemCycles: FamiliarInventoryItemId[][] = [
  ["moon-meal", "cleansing-tonic", "mission-ball", "comfort-balm"],
  ["mission-ball", "moon-meal", "comfort-balm", "cleansing-tonic"],
  ["cleansing-tonic", "comfort-balm", "moon-meal", "mission-ball"],
  ["comfort-balm", "mission-ball", "cleansing-tonic", "moon-meal"],
];
export const seasonCoverRewards = ["midnight-blue", "forest-moss", "copper-bronze", "ultraviolet-flare"] as const;

function utcDay(date: string) {
  return Date.parse(`${date}T00:00:00Z`);
}

export function familiarLocalDateKey(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function createFamiliarAttendanceState(launchDate = FAMILIAR_ATTENDANCE_LAUNCH_DATE): FamiliarAttendanceState {
  return { launchDate, claimedDates: [], streak: 0, lastClaimDate: null, collectibles: [], echoShards: 0 };
}

export function restoreFamiliarAttendanceState(value: unknown): FamiliarAttendanceState {
  const base = createFamiliarAttendanceState();
  if (!value || typeof value !== "object") return base;
  const candidate = value as Partial<FamiliarAttendanceState>;
  const launchDate = typeof candidate.launchDate === "string" && DATE_RE.test(candidate.launchDate) ? candidate.launchDate : base.launchDate;
  const claimedDates = Array.isArray(candidate.claimedDates)
    ? [...new Set(candidate.claimedDates.filter((date): date is string => typeof date === "string" && DATE_RE.test(date)))].sort().slice(-366)
    : [];
  const collectibles = Array.isArray(candidate.collectibles)
    ? [...new Set(candidate.collectibles.filter((id): id is string => typeof id === "string" && /^attendance-\d{2}$/.test(id)))].slice(0, 52)
    : [];
  return {
    launchDate,
    claimedDates,
    streak: Math.max(0, Math.min(365, Math.round(Number(candidate.streak) || 0))),
    lastClaimDate: typeof candidate.lastClaimDate === "string" && DATE_RE.test(candidate.lastClaimDate) ? candidate.lastClaimDate : null,
    collectibles,
    echoShards: Math.max(0, Math.round(Number(candidate.echoShards) || 0)),
  };
}

export function familiarAttendancePosition(now = new Date(), launchDate = FAMILIAR_ATTENDANCE_LAUNCH_DATE) {
  const date = familiarLocalDateKey(now);
  const raw = Math.floor((utcDay(date) - utcDay(launchDate)) / DAY_MS) + 1;
  const dayIndex = Math.max(1, Math.min(FAMILIAR_ATTENDANCE_DAYS, raw));
  return { date, dayIndex, week: Math.min(52, Math.floor((dayIndex - 1) / 7) + 1), weekday: dayIndex === 365 ? 1 : ((dayIndex - 1) % 7) + 1, active: raw >= 1 && raw <= 365, anniversary: raw === 365 };
}

export function familiarAttendanceRecovery(attendance: FamiliarAttendanceState, now = new Date()) {
  const date = familiarLocalDateKey(now);
  const start = utcDay(attendance.launchDate) + FAMILIAR_ATTENDANCE_DAYS * DAY_MS;
  const active = utcDay(date) >= start;
  const claimedToday = attendance.claimedDates.includes(date);
  let cursor = claimedToday ? date : previousDate(date);
  let consecutive = 0;
  const dates = new Set(attendance.claimedDates);
  while (utcDay(cursor) >= start && dates.has(cursor)) {
    consecutive += 1;
    cursor = previousDate(cursor);
  }
  const next = FAMILIAR_ATTENDANCE_COLLECTIBLES.find((item) => !attendance.collectibles.includes(item.id)) ?? null;
  return { active, claimedToday, progress: consecutive % 7, next };
}

export function familiarAttendanceReward(dayIndex: number): FamiliarAttendanceReward {
  const safeDay = Math.max(1, Math.min(365, Math.round(dayIndex)));
  const week = Math.min(52, Math.floor((safeDay - 1) / 7) + 1);
  const weekday = safeDay === 365 ? 1 : ((safeDay - 1) % 7) + 1;
  const seasonIndex = Math.min(3, Math.floor((week - 1) / 13));
  const season = FAMILIAR_ATTENDANCE_SEASONS[seasonIndex];
  if (safeDay === 365) return { dayIndex: safeDay, week: 52, weekday: 8, seasonId: "crepuscolo", label: "Forziere dell'Anno del Legame", coins: 120, items: { "moon-meal": 3, "comfort-balm": 2, "mission-ball": 2 }, collectibleId: "attendance-52", collectibleName: WEEKLY_NAMES[51], icon: "/famiglio/rebuild/attendance/rewards/52.png", rare: true };
  if (weekday === 7) {
    const id = `attendance-${String(week).padStart(2, "0")}`;
    return { dayIndex: safeDay, week, weekday, seasonId: season.id, label: WEEKLY_NAMES[week - 1], coins: 24 + seasonIndex * 4 + (week % 4) * 3, items: { [itemCycles[seasonIndex][week % 4]]: 1 }, collectibleId: id, collectibleName: WEEKLY_NAMES[week - 1], icon: `/famiglio/rebuild/attendance/rewards/${String(week).padStart(2, "0")}.png`, rare: true };
  }
  const item = itemCycles[seasonIndex][(week + weekday) % 4];
  const itemLabels: Record<string, string> = { "moon-meal": "Razione lunare", "cleansing-tonic": "Tonico detergente", "mission-ball": "Giocattolo del Nexus", "comfort-balm": "Medicina di Nora" };
  const itemDay = weekday === 2 || weekday === 4 || weekday === 6;
  const amount = weekday === 6 && week % 3 === 0 ? 2 : 1;
  const coins = itemDay ? (week % 5) + 2 : 5 + weekday + seasonIndex * 2 + (week % 4);
  return { dayIndex: safeDay, week, weekday, seasonId: season.id, label: itemDay ? `${amount} ${itemLabels[item]}` : `${coins} monete Nexus`, coins, items: itemDay ? { [item]: amount } : {}, collectibleId: null, collectibleName: null, icon: itemDay ? "/famiglio/rebuild/attendance/daily/supplies.png" : "/famiglio/rebuild/attendance/daily/coins.png", rare: false };
}

function previousDate(date: string) {
  return new Date(utcDay(date) - DAY_MS).toISOString().slice(0, 10);
}

export function claimFamiliarAttendanceReward(state: FamiliarHomeState, now = new Date()): { state: FamiliarHomeState; reward: FamiliarAttendanceReward | null; duplicate: boolean } {
  const attendance = restoreFamiliarAttendanceState(state.attendance);
  const position = familiarAttendancePosition(now, attendance.launchDate);
  const recovery = familiarAttendanceRecovery(attendance, now);
  if ((!position.active && !recovery.active) || (recovery.active && !recovery.next) || attendance.claimedDates.includes(position.date)) return { state: { ...state, attendance }, reward: null, duplicate: attendance.claimedDates.includes(position.date) };
  const recovered = recovery.active && recovery.progress === 6;
  const reward = recovery.active && recovery.next ? {
    ...familiarAttendanceReward(recovery.next.week * 7),
    coins: 0, items: {}, rare: recovered,
    label: recovered ? recovery.next.name : `Presenza ${recovery.progress + 1}/7 registrata`,
    collectibleId: recovered ? recovery.next.id : null,
    collectibleName: recovered ? recovery.next.name : null,
  } : familiarAttendanceReward(position.dayIndex);
  const consecutive = attendance.lastClaimDate === previousDate(position.date);
  const nextStreak = Math.min(365, consecutive ? attendance.streak + 1 : 1);
  const earnedRare = recovery.active || position.anniversary || !reward.rare || nextStreak >= 7;
  const grantedReward = earnedRare ? reward : { ...reward, label: "12 monete Nexus · serie da ricostruire", coins: 12, items: {}, collectibleId: null, collectibleName: null, rare: false };
  const alreadyOwned = Boolean(grantedReward.collectibleId && attendance.collectibles.includes(grantedReward.collectibleId));
  const quantities = { ...state.inventory.quantities };
  for (const [itemId, amount] of Object.entries(grantedReward.items) as Array<[FamiliarInventoryItemId, number]>) quantities[itemId] = Math.max(0, (quantities[itemId] ?? 0) + amount);
  const collectibles = grantedReward.collectibleId && !alreadyOwned ? [...attendance.collectibles, grantedReward.collectibleId] : attendance.collectibles;
  const seasonIndex = FAMILIAR_ATTENDANCE_SEASONS.findIndex((season) => season.id === grantedReward.seasonId);
  const seasonStart = seasonIndex * 13 + 1;
  const completedSeason = seasonIndex >= 0 && Array.from({ length: 13 }, (_, index) => `attendance-${String(seasonStart + index).padStart(2, "0")}`).every((id) => collectibles.includes(id));
  const coverReward = seasonCoverRewards[Math.max(0, seasonIndex)];
  const ownedCoverIds = completedSeason && !state.deviceCover.ownedIds.includes(coverReward)
    ? [...state.deviceCover.ownedIds, coverReward]
    : state.deviceCover.ownedIds;
  return {
    reward: grantedReward,
    duplicate: false,
    state: {
      ...state,
      wallet: { ...state.wallet, nexusCoins: state.wallet.nexusCoins + grantedReward.coins, totalEarned: state.wallet.totalEarned + grantedReward.coins },
      inventory: { ...state.inventory, quantities },
      deviceCover: { ...state.deviceCover, ownedIds: ownedCoverIds },
      attendance: {
        ...attendance,
        claimedDates: [...attendance.claimedDates, position.date].slice(-366),
        streak: nextStreak,
        lastClaimDate: position.date,
        collectibles,
        echoShards: attendance.echoShards + (alreadyOwned ? 8 : 0),
      },
      lastOutcome: completedSeason ? `Collezione ${FAMILIAR_ATTENDANCE_SEASONS[seasonIndex].name} completa: cover esclusiva sbloccata.` : alreadyOwned ? `${grantedReward.label} era gi\u00e0 nell'Album: convertito in 8 Frammenti Eco.` : `Presenza registrata: ${grantedReward.label}.`,
    },
  };
}

export const FAMILIAR_ATTENDANCE_COLLECTIBLES = WEEKLY_NAMES.map((name, index) => ({
  id: `attendance-${String(index + 1).padStart(2, "0")}`,
  name,
  week: index + 1,
  seasonId: FAMILIAR_ATTENDANCE_SEASONS[Math.min(3, Math.floor(index / 13))].id,
  icon: `/famiglio/rebuild/attendance/rewards/${String(index + 1).padStart(2, "0")}.png`,
}));
