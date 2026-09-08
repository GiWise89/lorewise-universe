import { familiarAttendancePosition } from "./famiglioAttendanceYear.ts";

export const FAMILIAR_WEEKLY_STEPS = ["care", "play", "adventure", "combat"] as const;
export type FamiliarWeeklyStep = typeof FAMILIAR_WEEKLY_STEPS[number];
export type FamiliarMiniGameKind = "light" | "jump" | "catch" | "memory";

export type FamiliarWeeklyLoopState = {
  weekKey: string;
  steps: FamiliarWeeklyStep[];
  chestClaimed: boolean;
  miniGame: { dayKey: string; kind: FamiliarMiniGameKind; bestScore: number; rewarded: boolean; scores?: Partial<Record<FamiliarMiniGameKind, number>> };
};

const kinds: FamiliarMiniGameKind[] = ["light", "jump", "catch", "memory"];
export const FAMILIAR_MINIGAME_NAMES: Record<FamiliarMiniGameKind, string> = {
  light: "Insegui la luce",
  jump: "Salto tra le nuvole",
  catch: "Acchiappa-oggetti",
  memory: "Memoria delle rune",
};

export function familiarWeekKey(now = new Date(), launchDate?: string) {
  const position = familiarAttendancePosition(now, launchDate);
  return `${launchDate ?? "calendar"}:w${String(position.week).padStart(2, "0")}`;
}

export function familiarMiniGameKind(now = new Date(), launchDate?: string): FamiliarMiniGameKind {
  const position = familiarAttendancePosition(now, launchDate);
  return kinds[(position.dayIndex - 1) % kinds.length];
}

export function createFamiliarWeeklyLoopState(now = new Date(), launchDate?: string): FamiliarWeeklyLoopState {
  return { weekKey: familiarWeekKey(now, launchDate), steps: [], chestClaimed: false, miniGame: { dayKey: familiarAttendancePosition(now, launchDate).date, kind: familiarMiniGameKind(now, launchDate), bestScore: 0, rewarded: false } };
}

export function restoreFamiliarWeeklyLoopState(value: unknown, now = new Date(), launchDate?: string): FamiliarWeeklyLoopState {
  const base = createFamiliarWeeklyLoopState(now, launchDate);
  if (!value || typeof value !== "object") return base;
  const candidate = value as Partial<FamiliarWeeklyLoopState>;
  if (candidate.weekKey !== base.weekKey) return base;
  const steps = Array.isArray(candidate.steps) ? [...new Set(candidate.steps.filter((step): step is FamiliarWeeklyStep => FAMILIAR_WEEKLY_STEPS.includes(step as FamiliarWeeklyStep)))] : [];
  const game = candidate.miniGame;
  const currentKind = game?.dayKey === base.miniGame.dayKey && kinds.includes(game.kind as FamiliarMiniGameKind) ? game.kind as FamiliarMiniGameKind : base.miniGame.kind;
  const scores: Partial<Record<FamiliarMiniGameKind, number>> = {};
  if (game?.dayKey === base.miniGame.dayKey) {
    for (const kind of kinds) {
      const value = Number(game.scores?.[kind] ?? (kind === game.kind ? game.bestScore : 0));
      scores[kind] = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
    }
  }
  return { weekKey: base.weekKey, steps, chestClaimed: Boolean(candidate.chestClaimed), miniGame: { dayKey: base.miniGame.dayKey, kind: currentKind, bestScore: scores[currentKind] ?? 0, scores, rewarded: game?.dayKey === base.miniGame.dayKey && Boolean(game.rewarded) } };
}

export function recordFamiliarWeeklyStep(state: FamiliarWeeklyLoopState, step: FamiliarWeeklyStep, now = new Date(), launchDate?: string) {
  const current = restoreFamiliarWeeklyLoopState(state, now, launchDate);
  return current.steps.includes(step) ? current : { ...current, steps: [...current.steps, step] };
}
