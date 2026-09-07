import {
  COMBAT_MOVES_BY_ID,
  FAMILIAR_COMBAT_CATALOG,
  FAMILIAR_COMBAT_CIRCUITS,
  FAMILIAR_COMBAT_DIFFICULTIES,
  affinityMultiplier,
  createSeededMoveSchedule,
  type CombatMove,
} from "./famiglioCombatCatalog.ts";

export const FAMILIAR_COMBAT_STATE_VERSION = 2;
export const FAMILIAR_COMBAT_MAX_LEVEL = 50;
export const FAMILIAR_COMBAT_MOVE_SLOTS = 4;
export const FAMILIAR_COMBAT_MAX_ENERGY = 100;
export const FAMILIAR_COMBAT_ENERGY_REGEN = 18;

export type FamiliarCombatDifficulty = "normal" | "expert" | "nexus";
export type FamiliarCombatOutcome = "active" | "victory" | "defeat";
export type FamiliarCombatActionKind = "physical" | "magic" | "guard" | "status" | "heal";
export type FamiliarCombatEventPhase =
  | "windup"
  | "advance"
  | "projectile"
  | "impact"
  | "guard"
  | "status"
  | "reaction"
  | "return"
  | "result";

export type FamiliarCombatStats = {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
};

export type FamiliarCombatMoveScheduleEntry = {
  moveId: string;
  level: number;
};

export type FamiliarCombatStatus = {
  id: string;
  name: string;
  remainingTurns: number;
  potency: number;
  sourceMoveId: string;
};

export type FamiliarCombatProgress = {
  familiarId: string;
  combatLevel: number;
  combatXp: number;
  wins: number;
  losses: number;
  battlesCompleted: number;
  learnedSchedule: FamiliarCombatMoveScheduleEntry[];
  learnedMoveIds: string[];
  equippedMoveIds: string[];
  archivedMoveIds: string[];
  completedEncounters: string[];
  unlockedDifficulties: FamiliarCombatDifficulty[];
  claimedRewardKeys: string[];
  rngState: number;
};

export type FamiliarCombatActor = {
  familiarId: string;
  role: string;
  evolutionPath: StartFamiliarCombatBattleOptions["playerEvolutionPath"];
  level: number;
  hp: number;
  maxHp: number;
  stats: FamiliarCombatStats;
  statuses: FamiliarCombatStatus[];
  guarding: boolean;
  energy: number;
  maxEnergy: number;
  moveUses: Record<string, number>;
};

export type FamiliarCombatTimelineEvent = {
  id: string;
  order: number;
  actorId: string;
  targetId: string;
  moveId: string;
  phase: FamiliarCombatEventPhase;
  durationMs: number;
  actionKind: FamiliarCombatActionKind;
  vfxCue: string;
  audioCue: string;
  amount?: number;
  statusId?: string;
  missed?: boolean;
  message: string;
};

export type FamiliarCombatReward = {
  key: string;
  battleId: string;
  familiarId: string;
  circuitId: string;
  difficulty: FamiliarCombatDifficulty;
  combatXp: number;
  nexusCoins: number;
  nightSigils: number;
  relicFragments: number;
  firstClear: boolean;
};

export type FamiliarCombatInitiative = {
  playerDice: readonly [number, number];
  opponentDice: readonly [number, number];
  playerTotal: number;
  opponentTotal: number;
  first: "player" | "opponent";
  playerCritical: boolean;
  opponentCritical: boolean;
};

export type FamiliarCombatBattle = {
  id: string;
  circuitId: string;
  encounterId: string;
  difficulty: FamiliarCombatDifficulty;
  player: FamiliarCombatActor;
  opponent: FamiliarCombatActor;
  turn: number;
  maxTurns: number | null;
  bossPhasesTotal: number;
  bossPhasesRemaining: number;
  outcome: FamiliarCombatOutcome;
  rngState: number;
  lastPlayerMoveId: string | null;
  lastOpponentMoveId: string | null;
  playerMoveStreak: number;
  opponentMoveStreak: number;
  opponentStrategy: "balanced" | "tactical" | "adaptive";
  initiative?: FamiliarCombatInitiative;
  resultApplied: boolean;
  timeline: FamiliarCombatTimelineEvent[];
  log: string[];
};

export type FamiliarCombatState = {
  version: number;
  seed: number;
  profiles: Record<string, FamiliarCombatProgress>;
  activeBattle: FamiliarCombatBattle | null;
  pendingReward: FamiliarCombatReward | null;
  lastTimeline: FamiliarCombatTimelineEvent[];
  lastMessage: string;
};

export type StartFamiliarCombatBattleOptions = {
  playerId: string;
  opponentId: string;
  circuitId: string;
  difficulty?: FamiliarCombatDifficulty;
  opponentLevel?: number;
  encounterId?: string;
  ignoreUnlocks?: boolean;
  playerStatBonus?: Partial<FamiliarCombatStats>;
  playerEvolutionPath?: "impeto" | "baluardo" | "risonanza" | null;
  maxTurns?: number | null;
  bossPhases?: number;
};

export type FamiliarCombatOpponentPreviewOptions = {
  playerId: string;
  opponentId: string;
  circuitId: string;
  difficulty?: FamiliarCombatDifficulty;
  opponentLevel?: number;
};

export type FamiliarCombatOpponentPreview = {
  familiarId: string;
  circuitId: string;
  difficulty: FamiliarCombatDifficulty;
  level: number;
  stats: FamiliarCombatStats;
  maxHp: number;
  moves: readonly CombatMove[];
  moveIds: readonly string[];
  learnedMoves: readonly CombatMove[];
  learnedMoveIds: readonly string[];
  archivedMoveIds: readonly string[];
  strategy: FamiliarCombatBattle["opponentStrategy"];
  actor: FamiliarCombatActor;
};

type CatalogMoveLike = {
  id: string;
  name?: string;
  source?: string;
  affinity?: string;
  kind?: string;
  actionKind?: string;
  damageClass?: string;
  power?: number;
  accuracy?: number;
  priority?: number;
  healing?: number;
  status?: string | {
    id?: string;
    name?: string;
    chance?: number;
    turns?: number;
    potency?: number;
  };
  statusChance?: number;
  healingRatio?: number;
  animation?: string;
  vfx?: string;
  audio?: string;
};

type CatalogFamiliarLike = {
  id: string;
  name: string;
  rarity?: string;
  affinity?: string;
  role?: string;
  baseStats: FamiliarCombatStats;
  growth: FamiliarCombatStats;
  moves: readonly CatalogMoveLike[];
  initialMoveIds: readonly string[];
  initialEquippedMoveIds?: readonly string[];
};

type CatalogCircuitLike = {
  id: string;
  name?: string;
  minLevel?: number;
  maxLevel?: number;
  levelRange?: readonly [number, number];
  unlockWins?: number;
  opponentIds?: readonly string[];
  bossId?: string;
  rewards?: {
    combatXp?: number;
    coins?: number;
    sigils?: number;
    fragments?: number;
    nexusCoins?: number;
    nightSigils?: number;
    relicFragments?: number;
  };
  reward?: {
    nexusCoins?: number;
    nightSigils?: number;
    relicFragments?: number;
  };
};

const catalog = FAMILIAR_COMBAT_CATALOG as readonly CatalogFamiliarLike[];
const circuits = FAMILIAR_COMBAT_CIRCUITS as readonly CatalogCircuitLike[];
const catalogById = new Map(catalog.map((entry) => [entry.id, entry]));
const movesById = COMBAT_MOVES_BY_ID as Readonly<Record<string, CatalogMoveLike>>;
const difficultyOrder: readonly FamiliarCombatDifficulty[] = ["normal", "expert", "nexus"];

type DifficultyRule = {
  statMultiplier: number;
  xpMultiplier: number;
  rewardMultiplier: number;
  strategy: FamiliarCombatBattle["opponentStrategy"];
  unlockWins: number;
  guardThreshold: number;
  statusPreference: number;
  finisherAwareness: boolean;
};

const difficultyCatalog = FAMILIAR_COMBAT_DIFFICULTIES as ReadonlyArray<{
  id: FamiliarCombatDifficulty;
  unlockWins: number;
  statMultiplier: number;
  xpMultiplier: number;
  rewardMultiplier: number;
  ai: { guardThreshold: number; statusPreference: number; finisherAwareness: boolean };
}>;

const DIFFICULTY_RULES: Readonly<Record<FamiliarCombatDifficulty, DifficultyRule>> = Object.fromEntries(difficultyOrder.map((id, index) => {
  const source = difficultyCatalog.find((entry) => entry.id === id);
  return [id, {
    statMultiplier: source?.statMultiplier ?? [1, 1.08, 1.16][index],
    xpMultiplier: source?.xpMultiplier ?? [1, 1.3, 1.7][index],
    rewardMultiplier: source?.rewardMultiplier ?? [1, 1.35, 1.8][index],
    strategy: index === 0 ? "balanced" : index === 1 ? "tactical" : "adaptive",
    unlockWins: source?.unlockWins ?? [0, 8, 24][index],
    guardThreshold: source?.ai.guardThreshold ?? [.22, .34, .46][index],
    statusPreference: source?.ai.statusPreference ?? [.08, .2, .34][index],
    finisherAwareness: source?.ai.finisherAwareness ?? index > 0,
  }];
})) as Record<FamiliarCombatDifficulty, DifficultyRule>;

const STATUS_NAMES: Readonly<Record<string, string>> = {
  burn: "Bruciatura",
  frost: "Gelo",
  freeze: "Gelo",
  poison: "Veleno",
  paralysis: "Paralisi",
  sleep: "Sonno",
  slow: "Rallentamento",
  weaken: "Indebolimento",
  stagger: "Sbilanciamento",
  focus: "Concentrazione",
  regen: "Rigenerazione",
  ward: "Protezione",
};

const RARITY_RANK: Readonly<Record<string, number>> = {
  comune: 0,
  common: 0,
  raro: 1,
  rare: 1,
  epico: 2,
  epic: 2,
  leggendario: 3,
  legendary: 3,
};

function integer(value: unknown, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : fallback;
}

function unique<T>(items: readonly T[]) {
  return [...new Set(items)];
}

function hashText(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0 || 0x9e3779b9;
}

function normalizedSeed(seed: number | string) {
  const value = typeof seed === "string" ? hashText(seed) : integer(seed, 0x9e3779b9, 1, 0xffffffff);
  return value >>> 0 || 0x9e3779b9;
}

function nextRandom(seed: number): readonly [number, number] {
  let next = seed >>> 0 || 0x9e3779b9;
  next ^= next << 13;
  next ^= next >>> 17;
  next ^= next << 5;
  next >>>= 0;
  return [next / 0x100000000, next || 0x9e3779b9] as const;
}

function rollInitiative(seed: number, playerSpeed: number, opponentSpeed: number) {
  let nextSeed = seed;
  const die = () => {
    const [roll, advanced] = nextRandom(nextSeed);
    nextSeed = advanced;
    return Math.floor(roll * 6) + 1;
  };
  let playerDice: [number, number] = [1, 1];
  let opponentDice: [number, number] = [1, 1];
  let playerTotal = 2;
  let opponentTotal = 2;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    playerDice = [die(), die()];
    opponentDice = [die(), die()];
    playerTotal = playerDice[0] + playerDice[1];
    opponentTotal = opponentDice[0] + opponentDice[1];
    if (playerTotal !== opponentTotal) break;
  }
  const first = playerTotal !== opponentTotal
    ? (playerTotal > opponentTotal ? "player" : "opponent")
    : (playerSpeed >= opponentSpeed ? "player" : "opponent");
  return {
    initiative: {
      playerDice,
      opponentDice,
      playerTotal,
      opponentTotal,
      first,
      playerCritical: playerDice[0] === playerDice[1],
      opponentCritical: opponentDice[0] === opponentDice[1],
    } satisfies FamiliarCombatInitiative,
    rngState: nextSeed,
  };
}

function familiarEntry(familiarId: string) {
  return catalogById.get(familiarId) ?? null;
}

function circuitEntry(circuitId: string) {
  return circuits.find((entry) => entry.id === circuitId) ?? null;
}

function circuitRange(circuit: CatalogCircuitLike | null): readonly [number, number] {
  if (!circuit) return [1, FAMILIAR_COMBAT_MAX_LEVEL];
  if (Array.isArray(circuit.levelRange) && circuit.levelRange.length === 2) {
    return [integer(circuit.levelRange[0], 1, 1, 50), integer(circuit.levelRange[1], 50, 1, 50)];
  }
  return [integer(circuit.minLevel, 1, 1, 50), integer(circuit.maxLevel, 50, 1, 50)];
}

function normalizedMove(moveId: string): CatalogMoveLike | null {
  const direct = movesById[moveId];
  if (direct) return direct;
  for (const entry of catalog) {
    const move = entry.moves.find((candidate) => candidate.id === moveId);
    if (move) return move;
  }
  return null;
}

function actionKind(move: CatalogMoveLike): FamiliarCombatActionKind {
  const raw = String(move.damageClass ?? move.kind ?? move.actionKind ?? "physical").toLowerCase();
  if (raw === "magical" || raw === "ranged" || raw === "special") return "magic";
  if (raw === "defense" || raw === "defensive") return "guard";
  if (raw === "restore") return "heal";
  if (raw === "status" && (move.status === "guard" || move.animation === "guard")) return "guard";
  if (raw === "support") return move.healing ? "heal" : "status";
  return (["physical", "magic", "guard", "status", "heal"] as const).includes(raw as FamiliarCombatActionKind)
    ? raw as FamiliarCombatActionKind
    : "physical";
}

function affinityFor(familiarId: string) {
  return familiarEntry(familiarId)?.affinity ?? "natura";
}

function moveAffinity(move: CatalogMoveLike, familiarId: string) {
  return move.affinity ?? affinityFor(familiarId);
}

function cueForAffinity(affinity: string, kind: "vfx" | "audio") {
  const normalized = String(affinity).toLowerCase();
  if (kind === "vfx") return `${normalized}-${normalized === "ardore" ? "flame" : normalized === "marea" ? "wave" : normalized === "antico" ? "rune" : "burst"}`;
  return `${normalized}-${normalized === "vento" ? "whoosh" : normalized === "ardore" ? "flare" : "impact"}`;
}

export function combatXpToNextLevel(level: number) {
  const current = integer(level, 1, 1, FAMILIAR_COMBAT_MAX_LEVEL);
  if (current >= FAMILIAR_COMBAT_MAX_LEVEL) return 0;
  return Math.round(45 + current * 20 + Math.pow(current, 1.55) * 5);
}

export function totalCombatXpForLevel(level: number) {
  const target = integer(level, 1, 1, FAMILIAR_COMBAT_MAX_LEVEL);
  let total = 0;
  for (let current = 1; current < target; current += 1) total += combatXpToNextLevel(current);
  return total;
}

export function combatLevelForXp(combatXp: number) {
  const xp = integer(combatXp, 0);
  let level = 1;
  while (level < FAMILIAR_COMBAT_MAX_LEVEL && xp >= totalCombatXpForLevel(level + 1)) level += 1;
  return level;
}

export function familiarCombatStats(familiarId: string, level: number): FamiliarCombatStats {
  const entry = familiarEntry(familiarId);
  if (!entry) throw new Error(`Famiglio sconosciuto: ${familiarId}`);
  const boundedLevel = integer(level, 1, 1, FAMILIAR_COMBAT_MAX_LEVEL);
  const steps = boundedLevel - 1;
  return {
    hp: Math.max(1, Math.round(entry.baseStats.hp + entry.growth.hp * steps)),
    attack: Math.max(1, Math.round(entry.baseStats.attack + entry.growth.attack * steps)),
    defense: Math.max(1, Math.round(entry.baseStats.defense + entry.growth.defense * steps)),
    speed: Math.max(1, Math.round(entry.baseStats.speed + entry.growth.speed * steps)),
  };
}

export function familiarCombatMove(moveId: string) {
  return normalizedMove(moveId);
}

export function familiarCombatMoveMaxUses(moveId: string) {
  const move = normalizedMove(moveId);
  if (!move) return 0;
  const kind = actionKind(move);
  if (move.source === "ultimate") return 2;
  if (kind === "heal") return 2;
  if (kind === "guard" || kind === "status") return 3;
  return 0;
}

export function familiarCombatMoveEnergyCost(familiarId: string, moveId: string) {
  const move = normalizedMove(moveId);
  const entry = familiarEntry(familiarId);
  if (!move || !entry) return FAMILIAR_COMBAT_MAX_ENERGY;
  if (entry.initialMoveIds[0] === moveId) return 0;
  const kind = actionKind(move);
  if (move.source === "ultimate") return 50;
  if (kind === "heal") return 38;
  if (kind === "guard" || kind === "status") return 30;
  const power = integer(move.power, 24, 0, 200);
  return power >= 70 ? 42 : power >= 55 ? 32 : 22;
}

export function familiarCombatMoveIsBase(familiarId: string, moveId: string) {
  return familiarEntry(familiarId)?.initialMoveIds[0] === moveId;
}

export function familiarCombatMoveHasCooldown(moveId: string) {
  const move = normalizedMove(moveId);
  return Boolean(move && (move.source === "ultimate" || integer(move.power, 0, 0, 200) >= 55));
}

function actorCanUseMove(actor: FamiliarCombatActor, move: CatalogMoveLike, lastMoveId: string | null, moveStreak: number) {
  const maxUses = familiarCombatMoveMaxUses(move.id);
  const hasUses = maxUses === 0 || (actor.moveUses[move.id] ?? maxUses) > 0;
  const hasEnergy = actor.energy >= familiarCombatMoveEnergyCost(actor.familiarId, move.id);
  const baseMove = familiarCombatMoveIsBase(actor.familiarId, move.id);
  const coolingDown = !baseMove && lastMoveId === move.id && familiarCombatMoveHasCooldown(move.id);
  const repeatedTwice = !baseMove && lastMoveId === move.id && moveStreak >= 2;
  return hasUses && hasEnergy && !coolingDown && !repeatedTwice;
}

export function familiarCombatMovesAtLevel(familiarId: string, level: number, seed: number | string = familiarId) {
  const entry = familiarEntry(familiarId);
  if (!entry) return [];
  const schedule = scheduleForFamiliar(familiarId, normalizedSeed(`${seed}:${familiarId}`));
  return learnedAtLevel(entry, schedule, integer(level, 1, 1, 50))
    .map(normalizedMove)
    .filter((move): move is CatalogMoveLike => Boolean(move));
}

export function familiarCombatLevelProgress(progress: FamiliarCombatProgress) {
  if (progress.combatLevel >= FAMILIAR_COMBAT_MAX_LEVEL) return { current: 0, required: 0, percent: 100 };
  const floor = totalCombatXpForLevel(progress.combatLevel);
  const required = combatXpToNextLevel(progress.combatLevel);
  const current = Math.max(0, progress.combatXp - floor);
  return { current, required, percent: Math.min(100, Math.round(current / Math.max(1, required) * 100)) };
}

function scheduleForFamiliar(familiarId: string, seed: number) {
  const raw = createSeededMoveSchedule(familiarId, String(seed)) as readonly FamiliarCombatMoveScheduleEntry[];
  return raw
    .filter((entry) => normalizedMove(entry.moveId) && Number.isFinite(entry.level))
    .map((entry) => ({ moveId: entry.moveId, level: integer(entry.level, 1, 1, 50) }))
    .sort((left, right) => left.level - right.level || left.moveId.localeCompare(right.moveId));
}

function learnedAtLevel(entry: CatalogFamiliarLike, schedule: readonly FamiliarCombatMoveScheduleEntry[], level: number) {
  return unique([
    ...entry.initialMoveIds,
    ...schedule.filter((candidate) => candidate.level <= level).map((candidate) => candidate.moveId),
  ]).filter((moveId) => normalizedMove(moveId));
}

function reconcileMoveLoadout(
  entry: CatalogFamiliarLike,
  schedule: readonly FamiliarCombatMoveScheduleEntry[],
  level: number,
  requestedEquipped: readonly string[] = [],
) {
  const learnedMoveIds = learnedAtLevel(entry, schedule, level);
  const preferred = unique([
    ...requestedEquipped,
    ...(entry.initialEquippedMoveIds ?? entry.initialMoveIds),
    ...learnedMoveIds,
  ]).filter((moveId) => learnedMoveIds.includes(moveId));
  const equippedMoveIds = preferred.slice(0, FAMILIAR_COMBAT_MOVE_SLOTS);
  return {
    learnedMoveIds,
    equippedMoveIds,
    archivedMoveIds: learnedMoveIds.filter((moveId) => !equippedMoveIds.includes(moveId)),
  };
}

export function createFamiliarCombatProgress(familiarId: string, seed: number | string = familiarId): FamiliarCombatProgress {
  const entry = familiarEntry(familiarId);
  if (!entry) throw new Error(`Famiglio sconosciuto: ${familiarId}`);
  const rngState = normalizedSeed(`${seed}:${familiarId}`);
  const learnedSchedule = scheduleForFamiliar(familiarId, rngState);
  const loadout = reconcileMoveLoadout(entry, learnedSchedule, 1);
  return {
    familiarId,
    combatLevel: 1,
    combatXp: 0,
    wins: 0,
    losses: 0,
    battlesCompleted: 0,
    learnedSchedule,
    ...loadout,
    completedEncounters: [],
    unlockedDifficulties: ["normal"],
    claimedRewardKeys: [],
    rngState,
  };
}

export function createFamiliarCombatState(seed: number | string = "nexus-combat") : FamiliarCombatState {
  return {
    version: FAMILIAR_COMBAT_STATE_VERSION,
    seed: normalizedSeed(seed),
    profiles: {},
    activeBattle: null,
    pendingReward: null,
    lastTimeline: [],
    lastMessage: "L'Arena dei Famigli attende il primo incontro.",
  };
}

export function familiarCombatProgress(state: FamiliarCombatState, familiarId: string) {
  return state.profiles[familiarId] ?? createFamiliarCombatProgress(familiarId, state.seed);
}

export function ensureFamiliarCombatProgress(state: FamiliarCombatState, familiarId: string) {
  if (state.profiles[familiarId]) return state;
  const progress = createFamiliarCombatProgress(familiarId, state.seed);
  return { ...state, profiles: { ...state.profiles, [familiarId]: progress } };
}

export function equipFamiliarCombatMove(
  state: FamiliarCombatState,
  familiarId: string,
  moveId: string,
  slot = -1,
) {
  const progress = familiarCombatProgress(state, familiarId);
  if (!progress.learnedMoveIds.includes(moveId)) {
    return { ok: false as const, state, error: "Questa mossa non è ancora stata appresa." };
  }
  const requestedSlot = integer(slot, -1, -1, FAMILIAR_COMBAT_MOVE_SLOTS - 1);
  let equippedMoveIds: string[];
  if (requestedSlot < 0) {
    const withoutMove = progress.equippedMoveIds.filter((candidate) => candidate !== moveId);
    equippedMoveIds = withoutMove.length < FAMILIAR_COMBAT_MOVE_SLOTS ? [...withoutMove, moveId] : withoutMove;
  } else {
    equippedMoveIds = [...progress.equippedMoveIds];
    const existingSlot = equippedMoveIds.indexOf(moveId);
    const displacedMove = equippedMoveIds[requestedSlot];
    if (existingSlot === requestedSlot) return { ok: true as const, state };
    if (existingSlot >= 0 && displacedMove) {
      equippedMoveIds[requestedSlot] = moveId;
      equippedMoveIds[existingSlot] = displacedMove;
    } else if (existingSlot < 0) {
      equippedMoveIds.splice(requestedSlot, 1, moveId);
    }
    equippedMoveIds = [...new Set(equippedMoveIds.filter(Boolean))].slice(0, FAMILIAR_COMBAT_MOVE_SLOTS);
  }
  const next = {
    ...progress,
    equippedMoveIds,
    archivedMoveIds: progress.learnedMoveIds.filter((candidate) => !equippedMoveIds.includes(candidate)),
  };
  return { ok: true as const, state: { ...state, profiles: { ...state.profiles, [familiarId]: next } } };
}

function combatPower(entry: CatalogFamiliarLike) {
  const rarity = RARITY_RANK[String(entry.rarity ?? "comune").toLowerCase()] ?? 0;
  return entry.baseStats.hp * .18 + entry.baseStats.attack * .34 + entry.baseStats.defense * .28 + entry.baseStats.speed * .2 + rarity * 8;
}

export function familiarCombatOpponents(playerId: string, circuitId?: string) {
  const opponents = catalog
    .filter((entry) => entry.id !== playerId)
    .sort((left, right) => combatPower(left) - combatPower(right) || left.id.localeCompare(right.id));
  if (!circuitId) return opponents.map((entry) => entry.id);
  const circuit = circuitEntry(circuitId);
  if (!circuit) return [];
  const allowed = new Set(circuit.opponentIds ?? []);
  const listed = opponents.filter((entry) => allowed.has(entry.id)).map((entry) => entry.id);
  if (circuit.bossId && circuit.bossId !== playerId && listed.includes(circuit.bossId)) {
    return [...listed.filter((id) => id !== circuit.bossId), circuit.bossId];
  }
  return listed;
}

function encounterKey(circuitId: string, difficulty: FamiliarCombatDifficulty, opponentId: string) {
  return `${circuitId}:${difficulty}:${opponentId}`;
}

function completedEncounterKey(battle: FamiliarCombatBattle) {
  return battle.encounterId.startsWith("campaign-")
    ? battle.encounterId
    : encounterKey(battle.circuitId, battle.difficulty, battle.opponent.familiarId);
}

export function combatDifficultyIsUnlocked(
  progress: FamiliarCombatProgress,
  difficulty: FamiliarCombatDifficulty,
) {
  return progress.wins >= DIFFICULTY_RULES[difficulty].unlockWins;
}

function battleActor(
  familiarId: string,
  level: number,
  multiplier = 1,
  statBonus: Partial<FamiliarCombatStats> = {},
  evolutionPath: StartFamiliarCombatBattleOptions["playerEvolutionPath"] = null,
): FamiliarCombatActor {
  const base = familiarCombatStats(familiarId, level);
  const entry = familiarEntry(familiarId);
  const role = String(entry?.role ?? "");
  const stats = {
    hp: Math.max(1, Math.round(base.hp * multiplier * (role === "colosso" ? 1.06 : 1) + integer(statBonus.hp, 0, -50, 100))),
    attack: Math.max(1, Math.round(base.attack * multiplier + integer(statBonus.attack, 0, -20, 40))),
    defense: Math.max(1, Math.round(base.defense * multiplier + integer(statBonus.defense, 0, -20, 40))),
    speed: Math.max(1, Math.round(base.speed * multiplier + integer(statBonus.speed, 0, -20, 40))),
  };
  const statuses: FamiliarCombatStatus[] = [];
  if (role === "guardiano" || evolutionPath === "baluardo") statuses.push({ id: "ward", name: STATUS_NAMES.ward, remainingTurns: 1, potency: role === "guardiano" && evolutionPath === "baluardo" ? 65 : 45, sourceMoveId: "passive-baluardo" });
  if (role === "sostegno") statuses.push({ id: "regen", name: STATUS_NAMES.regen, remainingTurns: 2, potency: 4, sourceMoveId: "passive-premura" });
  if (role === "assaltatore" || evolutionPath === "impeto") statuses.push({ id: "focus", name: STATUS_NAMES.focus, remainingTurns: 1, potency: 8, sourceMoveId: "passive-impeto" });
  const actor: FamiliarCombatActor = {
    familiarId,
    role,
    evolutionPath,
    level,
    hp: stats.hp,
    maxHp: stats.hp,
    stats,
    statuses,
    guarding: false,
    energy: FAMILIAR_COMBAT_MAX_ENERGY,
    maxEnergy: FAMILIAR_COMBAT_MAX_ENERGY,
    moveUses: {},
  };
  const moves = learnedMovesForActor(actor);
  actor.moveUses = Object.fromEntries(moves.map((move) => [move.id, familiarCombatMoveMaxUses(move.id)]));
  return actor;
}

function opponentLevelFor(circuit: CatalogCircuitLike, playerId: string, opponentId: string, difficulty: FamiliarCombatDifficulty) {
  const [minimum, maximum] = circuitRange(circuit);
  const ids = familiarCombatOpponents(playerId, circuit.id);
  const index = Math.max(0, ids.indexOf(opponentId));
  const spread = Math.max(0, maximum - minimum);
  const normal = minimum + Math.round(spread * (ids.length <= 1 ? 0 : index / (ids.length - 1)));
  return Math.min(50, normal + (difficulty === "expert" ? 2 : difficulty === "nexus" ? 4 : 0));
}

export function startFamiliarCombatBattle(state: FamiliarCombatState, options: StartFamiliarCombatBattleOptions) {
  if (state.activeBattle?.outcome === "active") return { ok: false as const, state, error: "Un combattimento è già in corso." };
  if (state.pendingReward) return { ok: false as const, state, error: "Riscatta prima la ricompensa pronta." };
  const playerEntry = familiarEntry(options.playerId);
  const opponentEntry = familiarEntry(options.opponentId);
  const circuit = circuitEntry(options.circuitId);
  const difficulty = options.difficulty ?? "normal";
  if (!playerEntry || !opponentEntry) return { ok: false as const, state, error: "Famiglio non disponibile." };
  if (playerEntry.id === opponentEntry.id) return { ok: false as const, state, error: "Scegli un avversario diverso." };
  if (!circuit) return { ok: false as const, state, error: "Circuito non disponibile." };
  if (!difficultyOrder.includes(difficulty)) return { ok: false as const, state, error: "Difficoltà non disponibile." };
  const withPlayer = ensureFamiliarCombatProgress(state, playerEntry.id);
  const progress = familiarCombatProgress(withPlayer, playerEntry.id);
  const [minimum] = circuitRange(circuit);
  if (!options.ignoreUnlocks && progress.combatLevel < minimum) {
    return { ok: false as const, state, error: `Il circuito richiede almeno il livello ${minimum}.` };
  }
  if (!options.ignoreUnlocks && progress.wins < integer(circuit.unlockWins, 0)) {
    return { ok: false as const, state, error: `Servono ${integer(circuit.unlockWins, 0)} vittorie per questo circuito.` };
  }
  if (!options.ignoreUnlocks && !combatDifficultyIsUnlocked(progress, difficulty)) {
    return { ok: false as const, state, error: "Completa la difficoltà precedente per sbloccarla." };
  }
  const opponents = familiarCombatOpponents(playerEntry.id, circuit.id);
  if (!options.ignoreUnlocks && !opponents.includes(opponentEntry.id)) {
    return { ok: false as const, state, error: "Questo avversario appartiene a un altro circuito." };
  }
  const opponentPreview = familiarCombatOpponentPreview({
    playerId: playerEntry.id,
    opponentId: opponentEntry.id,
    circuitId: circuit.id,
    difficulty,
    opponentLevel: options.opponentLevel,
  });
  if (!opponentPreview) return { ok: false as const, state, error: "Anteprima dell'avversario non disponibile." };
  const encounterId = options.encounterId ?? encounterKey(circuit.id, difficulty, opponentEntry.id);
  const battleSeed = normalizedSeed(`${withPlayer.seed}:${playerEntry.id}:${opponentEntry.id}:${encounterId}:${progress.battlesCompleted}`);
  const playerActor = battleActor(playerEntry.id, progress.combatLevel, 1, options.playerStatBonus, options.playerEvolutionPath);
  const initiativeRoll = rollInitiative(battleSeed, playerActor.stats.speed, opponentPreview.actor.stats.speed);
  const bossPhasesTotal = integer(options.bossPhases, 1, 1, 3);
  const battle: FamiliarCombatBattle = {
    id: `battle-${battleSeed.toString(16)}-${progress.battlesCompleted + 1}`,
    circuitId: circuit.id,
    encounterId,
    difficulty,
    player: playerActor,
    opponent: opponentPreview.actor,
    turn: 1,
    maxTurns: Number.isFinite(options.maxTurns) ? Math.max(1, Math.round(Number(options.maxTurns))) : null,
    bossPhasesTotal,
    bossPhasesRemaining: bossPhasesTotal,
    outcome: "active",
    rngState: initiativeRoll.rngState,
    lastPlayerMoveId: null,
    lastOpponentMoveId: null,
    playerMoveStreak: 0,
    opponentMoveStreak: 0,
    opponentStrategy: opponentPreview.strategy,
    initiative: initiativeRoll.initiative,
    resultApplied: false,
    timeline: [],
    log: [
      `${playerEntry.name} entra nell'Arena.`,
      `${opponentEntry.name} accetta la sfida.`,
      `Iniziativa ${initiativeRoll.initiative.playerTotal} a ${initiativeRoll.initiative.opponentTotal}: ${initiativeRoll.initiative.first === "player" ? playerEntry.name : opponentEntry.name} agirà per primo.`,
    ],
  };
  return {
    ok: true as const,
    state: {
      ...withPlayer,
      activeBattle: battle,
      pendingReward: null,
      lastTimeline: [],
      lastMessage: `Inizia l'incontro contro ${opponentEntry.name}.`,
    },
  };
}

function learnedMovesForActor(actor: FamiliarCombatActor) {
  const entry = familiarEntry(actor.familiarId)!;
  const schedule = scheduleForFamiliar(actor.familiarId, normalizedSeed(actor.familiarId));
  const ids = learnedAtLevel(entry, schedule, actor.level);
  return ids.map(normalizedMove).filter((move): move is CatalogMoveLike => Boolean(move));
}

function opponentLoadoutForActor(actor: FamiliarCombatActor) {
  const learned = learnedMovesForActor(actor);
  return learned.slice(-FAMILIAR_COMBAT_MOVE_SLOTS);
}

export function familiarCombatOpponentPreview(
  options: FamiliarCombatOpponentPreviewOptions,
): FamiliarCombatOpponentPreview | null {
  const player = familiarEntry(options.playerId);
  const opponent = familiarEntry(options.opponentId);
  const circuit = circuitEntry(options.circuitId);
  const difficulty = options.difficulty ?? "normal";
  if (!player || !opponent || player.id === opponent.id || !circuit || !difficultyOrder.includes(difficulty)) return null;
  const level = integer(
    options.opponentLevel,
    opponentLevelFor(circuit, player.id, opponent.id, difficulty),
    1,
    FAMILIAR_COMBAT_MAX_LEVEL,
  );
  const actor = battleActor(opponent.id, level, DIFFICULTY_RULES[difficulty].statMultiplier);
  const learnedMoves = learnedMovesForActor(actor)
    .map((move) => COMBAT_MOVES_BY_ID[move.id])
    .filter((move): move is CombatMove => Boolean(move));
  const moves = learnedMoves.slice(-FAMILIAR_COMBAT_MOVE_SLOTS);
  const moveIds = moves.map((move) => move.id);
  return {
    familiarId: opponent.id,
    circuitId: circuit.id,
    difficulty,
    level,
    stats: actor.stats,
    maxHp: actor.maxHp,
    moves,
    moveIds,
    learnedMoves,
    learnedMoveIds: learnedMoves.map((move) => move.id),
    archivedMoveIds: learnedMoves.filter((move) => !moveIds.includes(move.id)).map((move) => move.id),
    strategy: DIFFICULTY_RULES[difficulty].strategy,
    actor,
  };
}

function effectiveSpeed(actor: FamiliarCombatActor) {
  const slow = actor.statuses.find((status) => status.id === "frost" || status.id === "slow");
  const paralysis = actor.statuses.find((status) => status.id === "paralysis");
  const slowMultiplier = slow ? Math.max(.45, 1 - slow.potency / 100) : 1;
  const paralysisMultiplier = paralysis ? Math.max(.5, 1 - paralysis.potency / 100) : 1;
  return Math.max(1, actor.stats.speed * slowMultiplier * paralysisMultiplier);
}

function effectiveAttack(actor: FamiliarCombatActor) {
  const weaken = actor.statuses.find((status) => status.id === "weaken");
  const focus = actor.statuses.find((status) => status.id === "focus");
  return Math.max(1, actor.stats.attack * (weaken ? Math.max(.5, 1 - weaken.potency / 100) : 1) * (focus ? 1 + focus.potency / 100 : 1));
}

function moveStatus(move: CatalogMoveLike) {
  if (!move.status) return null;
  if (typeof move.status === "object") {
    if (!move.status.id) return null;
    return {
      id: move.status.id,
      name: move.status.name ?? STATUS_NAMES[move.status.id] ?? move.status.id,
      chance: Number(move.status.chance ?? move.statusChance ?? 1),
      turns: integer(move.status.turns, 2, 1, 5),
      potency: integer(move.status.potency, 8, 1, 80),
    };
  }
  const potencyByStatus: Readonly<Record<string, number>> = {
    burn: 6, freeze: 100, poison: 4, paralysis: 40, sleep: 100, slow: 24, weaken: 22, guard: 55, regen: 7, focus: 18,
  };
  const turnsByStatus: Readonly<Record<string, number>> = {
    freeze: 1, poison: 3, paralysis: 2, sleep: 2, guard: 1, focus: 1,
  };
  return {
    id: move.status,
    name: STATUS_NAMES[move.status] ?? move.status,
    chance: Number(move.statusChance ?? 100),
    turns: turnsByStatus[move.status] ?? 2,
    potency: potencyByStatus[move.status] ?? 8,
  };
}

function estimatedDamage(move: CatalogMoveLike, attacker: FamiliarCombatActor, defender: FamiliarCombatActor) {
  const kind = actionKind(move);
  if (["guard", "status", "heal"].includes(kind)) return kind === "heal" && attacker.hp < attacker.maxHp * .45 ? 32 : kind === "guard" && attacker.hp < attacker.maxHp * .4 ? 24 : 2;
  const affinity = affinityMultiplier(moveAffinity(move, attacker.familiarId) as never, affinityFor(defender.familiarId) as never);
  return (integer(move.power, 24, 0, 200) + effectiveAttack(attacker) * .4) * Number(affinity || 1) - defender.stats.defense * .22;
}

export function familiarCombatDamagePreview(attacker: FamiliarCombatActor, defender: FamiliarCombatActor, moveId: string) {
  const move = normalizedMove(moveId);
  if (!move || !["physical", "magic"].includes(actionKind(move))) return 0;
  return Math.max(1, Math.round(estimatedDamage(move, attacker, defender)));
}

function chooseOpponentMove(battle: FamiliarCombatBattle) {
  const learned = opponentLoadoutForActor(battle.opponent);
  const available = learned.filter((move) => actorCanUseMove(
    battle.opponent,
    move,
    battle.lastOpponentMoveId,
    battle.opponentMoveStreak,
  ));
  const baseMove = familiarEntry(battle.opponent.familiarId)?.initialMoveIds
    .map(normalizedMove)
    .find((move): move is CatalogMoveLike => Boolean(move));
  const moves = available.length ? available : baseMove ? [baseMove] : learned;
  const fallback = moves[0];
  if (!fallback) throw new Error(`Nessuna mossa per ${battle.opponent.familiarId}`);
  let seed = battle.rngState;
  const [roll, nextSeed] = nextRandom(seed);
  seed = nextSeed;
  if (battle.opponentStrategy === "balanced") {
    const damaging = moves.filter((move) => ["physical", "magic"].includes(actionKind(move)));
    const pool = damaging.length ? damaging : moves;
    return { move: pool[Math.floor(roll * pool.length)] ?? fallback, rngState: seed, reason: "balanced" as const };
  }
  const scored = moves.map((move) => {
    const rules = DIFFICULTY_RULES[battle.difficulty];
    let score = estimatedDamage(move, battle.opponent, battle.player);
    const kind = actionKind(move);
    if (kind === "guard" && battle.player.hp / battle.player.maxHp > .5) score -= 8;
    if (kind === "guard" && battle.opponent.hp / battle.opponent.maxHp < rules.guardThreshold) score += 24;
    if (kind === "heal") {
      const healthRatio = battle.opponent.hp / battle.opponent.maxHp;
      score += healthRatio < .4 ? 28 : -80;
    }
    if (kind === "status" || moveStatus(move)) score += rules.statusPreference * 40;
    if (rules.finisherAwareness && estimatedDamage(move, battle.opponent, battle.player) >= battle.player.hp) score += 36;
    if (battle.opponentStrategy === "adaptive") {
      if (battle.lastPlayerMoveId && actionKind(normalizedMove(battle.lastPlayerMoveId) ?? fallback) === "physical" && kind === "guard") score += 32;
      if (battle.player.statuses.length === 0 && move.status) score += 18;
      if (battle.player.guarding && kind === "status") score += 14;
    }
    return { move, score: score + roll * 2 };
  }).sort((left, right) => right.score - left.score || left.move.id.localeCompare(right.move.id));
  return { move: scored[0]?.move ?? fallback, rngState: seed, reason: battle.opponentStrategy };
}

function phaseEvent(
  battle: FamiliarCombatBattle,
  events: FamiliarCombatTimelineEvent[],
  actor: FamiliarCombatActor,
  target: FamiliarCombatActor,
  move: CatalogMoveLike,
  phase: FamiliarCombatEventPhase,
  durationMs: number,
  message: string,
  extra: Partial<Pick<FamiliarCombatTimelineEvent, "amount" | "statusId" | "missed">> = {},
) {
  const kind = actionKind(move);
  events.push({
    id: `${battle.id}-${battle.turn}-${events.length + 1}`,
    order: events.length,
    actorId: actor.familiarId,
    targetId: target.familiarId,
    moveId: move.id,
    phase,
    durationMs,
    actionKind: kind,
    vfxCue: move.vfx ?? cueForAffinity(moveAffinity(move, actor.familiarId), "vfx"),
    audioCue: move.audio ?? cueForAffinity(moveAffinity(move, actor.familiarId), "audio"),
    message,
    ...extra,
  });
}

function tickStatuses(actor: FamiliarCombatActor, battle: FamiliarCombatBattle, events: FamiliarCombatTimelineEvent[]) {
  let hp = actor.hp;
  const statuses: FamiliarCombatStatus[] = [];
  for (const status of actor.statuses) {
    if (status.id === "burn" || status.id === "poison") {
      const amount = Math.max(1, Math.round(actor.maxHp * status.potency / 100));
      hp = Math.max(0, hp - amount);
      events.push({
        id: `${battle.id}-${battle.turn}-${events.length + 1}`,
        order: events.length,
        actorId: actor.familiarId,
        targetId: actor.familiarId,
        moveId: status.sourceMoveId,
        phase: "status",
        durationMs: 360,
        actionKind: "status",
        vfxCue: status.id === "poison" ? "veleno-bubbles" : "ardore-embers",
        audioCue: status.id === "poison" ? "status-poison" : "status-burn",
        amount,
        statusId: status.id,
        message: `${STATUS_NAMES[status.id] ?? status.name}: ${amount} danni.`,
      });
    } else if (status.id === "regen") {
      const amount = Math.max(1, Math.round(actor.maxHp * status.potency / 100));
      hp = Math.min(actor.maxHp, hp + amount);
      events.push({
        id: `${battle.id}-${battle.turn}-${events.length + 1}`,
        order: events.length,
        actorId: actor.familiarId,
        targetId: actor.familiarId,
        moveId: status.sourceMoveId,
        phase: "status",
        durationMs: 360,
        actionKind: "heal",
        vfxCue: "natura-regen",
        audioCue: "status-heal",
        amount,
        statusId: status.id,
        message: `${STATUS_NAMES[status.id] ?? status.name}: ${amount} HP recuperati.`,
      });
    }
    if (status.remainingTurns > 1) statuses.push({ ...status, remainingTurns: status.remainingTurns - 1 });
  }
  return { ...actor, hp, statuses };
}

function applyAction(
  battle: FamiliarCombatBattle,
  source: FamiliarCombatActor,
  target: FamiliarCombatActor,
  move: CatalogMoveLike,
  rngState: number,
  events: FamiliarCombatTimelineEvent[],
  initiativeCritical = false,
) {
  const kind = actionKind(move);
  const moveName = move.name ?? move.id;
  phaseEvent(battle, events, source, target, move, "windup", 420, `${source.familiarId} prepara ${moveName}.`);
  const energyCost = familiarCombatMoveEnergyCost(source.familiarId, move.id);
  const maxUses = familiarCombatMoveMaxUses(move.id);
  const attacker = {
    ...source,
    statuses: [...source.statuses],
    guarding: false,
    energy: Math.max(0, source.energy - energyCost),
  };
  attacker.moveUses = maxUses > 0
    ? { ...source.moveUses, [move.id]: Math.max(0, (source.moveUses[move.id] ?? maxUses) - 1) }
    : { ...source.moveUses };
  const defender = { ...target, statuses: [...target.statuses] };
  if (kind === "guard") {
    attacker.guarding = true;
    attacker.statuses = [...attacker.statuses.filter((status) => status.id !== "ward"), {
      id: "ward", name: STATUS_NAMES.ward, remainingTurns: 1, potency: 55, sourceMoveId: move.id,
    }];
    phaseEvent(battle, events, attacker, defender, move, "guard", 620, `${moveName} protegge ${attacker.familiarId}.`, { statusId: "ward" });
    return { attacker, defender, rngState, damage: 0 };
  }
  if (kind === "heal") {
    const rawAmount = move.healingRatio
      ? Math.max(1, Math.round(attacker.maxHp * Math.min(.75, Math.max(.05, move.healingRatio))))
      : Math.max(1, Math.round(integer(move.healing, integer(move.power, 24), 1, 200) + effectiveAttack(attacker) * .2));
    const amount = Math.max(1, Math.min(
      Math.round(attacker.maxHp * .25),
      Math.round(rawAmount * (attacker.evolutionPath === "risonanza" || attacker.role === "sostegno" ? 1.12 : 1)),
    ));
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + amount);
    const status = moveStatus(move);
    if (status && status.id !== "guard") {
      attacker.statuses = [...attacker.statuses.filter((candidate) => candidate.id !== status.id), {
        id: status.id,
        name: status.name,
        remainingTurns: status.turns + (attacker.evolutionPath === "risonanza" ? 1 : 0),
        potency: status.potency,
        sourceMoveId: move.id,
      }];
    }
    phaseEvent(battle, events, attacker, attacker, move, "status", 660, `${attacker.familiarId} recupera ${amount} HP.`, { amount, statusId: status?.id ?? "heal" });
    return { attacker, defender, rngState, damage: 0 };
  }
  if (kind === "physical") phaseEvent(battle, events, attacker, defender, move, "advance", 520, `${attacker.familiarId} corre verso l'avversario.`);
  else if (kind === "magic") phaseEvent(battle, events, attacker, defender, move, "projectile", 680, `${moveName} attraversa l'Arena.`);

  let seed = rngState;
  const [accuracyRoll, afterAccuracy] = nextRandom(seed);
  seed = afterAccuracy;
  const rawAccuracy = Number(move.accuracy ?? 1);
  const focus = attacker.statuses.find((status) => status.id === "focus");
  const accuracy = Math.min(1, Math.max(.35, (rawAccuracy > 1 ? rawAccuracy / 100 : rawAccuracy) + (focus ? focus.potency / 100 : 0)));
  const speedAdvantage = Math.max(-35, Math.min(70, effectiveSpeed(defender) - effectiveSpeed(attacker)));
  const dodgeChance = Math.min(.11, Math.max(.04, .055 + speedAdvantage / 1_000 + (defender.role === "agile" ? .015 : 0)));
  const hitThreshold = Math.max(.35, accuracy - dodgeChance);
  if (accuracyRoll > hitThreshold) {
    const dodged = accuracyRoll <= accuracy;
    phaseEvent(battle, events, attacker, defender, move, "impact", 1_460, dodged ? `${defender.familiarId} schiva ${moveName}.` : `${moveName} manca il bersaglio.`, { amount: 0, missed: true });
    if (kind === "physical") phaseEvent(battle, events, attacker, defender, move, "return", 420, `${attacker.familiarId} torna al proprio posto.`);
    return { attacker, defender, rngState: seed, damage: 0 };
  }

  const [varianceRoll, afterVariance] = nextRandom(seed);
  seed = afterVariance;
  const [criticalRoll, afterCritical] = nextRandom(seed);
  seed = afterCritical;
  const basePower = integer(move.power, kind === "status" ? 0 : 24, 0, 200);
  let damage = 0;
  if (basePower > 0) {
    const levelTerm = 2 * attacker.level / 5 + 2;
    const baseDamage = (levelTerm * basePower * effectiveAttack(attacker) / Math.max(1, defender.stats.defense)) / 32 + 4;
    const affinity = Number(affinityMultiplier(moveAffinity(move, attacker.familiarId) as never, affinityFor(defender.familiarId) as never) || 1);
    const critical = initiativeCritical || criticalRoll < Math.min(.24, .045 + (attacker.role === "agile" ? .025 : 0) + Math.max(0, effectiveSpeed(attacker) - effectiveSpeed(defender)) / 420) ? 1.5 : 1;
    damage = Math.max(Math.round(defender.maxHp * .045), Math.round(baseDamage * affinity * (.92 + varianceRoll * .08) * critical));
    const ward = defender.statuses.find((status) => status.id === "ward");
    if (defender.guarding || ward) damage = Math.max(1, Math.round(damage * (1 - (ward?.potency ?? 55) / 100)));
    defender.hp = Math.max(0, defender.hp - damage);
    defender.guarding = false;
    defender.statuses = defender.statuses.filter((status) => status.id !== "ward");
    phaseEvent(battle, events, attacker, defender, move, "impact", 260, `${initiativeCritical ? "Critico d'iniziativa! " : ""}${moveName} infligge ${damage} danni.`, { amount: damage });
    phaseEvent(battle, events, attacker, defender, move, "reaction", 420, `${defender.familiarId} reagisce al colpo.`, { amount: damage });
  } else {
    phaseEvent(battle, events, attacker, defender, move, "impact", 260, `${moveName} raggiunge il bersaglio.`, { amount: 0 });
  }

  const status = moveStatus(move);
  if (status && defender.hp > 0) {
    const [statusRoll, afterStatus] = nextRandom(seed);
    seed = afterStatus;
    const rawStatusChance = status.chance;
    const statusChance = Math.min(1, Math.max(0, (rawStatusChance > 1 ? rawStatusChance / 100 : rawStatusChance) + (attacker.role === "mistico" ? .08 : 0)));
    if (statusRoll <= statusChance) {
      const applied: FamiliarCombatStatus = {
        id: status.id,
        name: status.name,
        remainingTurns: status.turns + (attacker.evolutionPath === "risonanza" && ["focus", "regen", "guard"].includes(status.id) ? 1 : 0),
        potency: status.potency,
        sourceMoveId: move.id,
      };
      const selfTargeted = ["focus", "regen", "guard"].includes(applied.id);
      if (selfTargeted) attacker.statuses = [...attacker.statuses.filter((candidate) => candidate.id !== applied.id), applied];
      else {
        const mutuallyExclusiveControl = ["freeze", "paralysis", "sleep"];
        defender.statuses = [...defender.statuses.filter((candidate) => candidate.id !== applied.id
          && !(mutuallyExclusiveControl.includes(applied.id) && mutuallyExclusiveControl.includes(candidate.id))), applied];
      }
      phaseEvent(battle, events, attacker, selfTargeted ? attacker : defender, move, "status", 420,
        selfTargeted ? `${applied.name} rafforza ${attacker.familiarId}.` : `${applied.name} colpisce ${defender.familiarId}.`, { statusId: applied.id });
    }
  }
  if (kind === "physical") phaseEvent(battle, events, attacker, defender, move, "return", 500, `${attacker.familiarId} torna al proprio posto.`);
  return { attacker, defender, rngState: seed, damage };
}

function combatRewardFor(battle: FamiliarCombatBattle, firstClear: boolean): FamiliarCombatReward {
  const circuit = circuitEntry(battle.circuitId);
  const source = circuit?.rewards ?? circuit?.reward ?? {};
  const difficulty = DIFFICULTY_RULES[battle.difficulty];
  const levelGap = Math.max(0, battle.opponent.level - battle.player.level);
  const configuredXp = "combatXp" in source ? integer(source.combatXp, 0) : 0;
  const xpBase = configuredXp || 34 + battle.opponent.level * 9 + levelGap * 5;
  const firstClearMultiplier = firstClear ? 1 : .35;
  return {
    key: completedEncounterKey(battle),
    battleId: battle.id,
    familiarId: battle.player.familiarId,
    circuitId: battle.circuitId,
    difficulty: battle.difficulty,
    combatXp: Math.max(1, Math.round(xpBase * difficulty.xpMultiplier)),
    nexusCoins: Math.max(0, Math.round(integer("coins" in source ? source.coins : source.nexusCoins, 12 + battle.opponent.level, 0) * difficulty.rewardMultiplier * firstClearMultiplier)),
    nightSigils: Math.max(0, Math.round(integer("sigils" in source ? source.sigils : source.nightSigils, battle.difficulty === "normal" ? 0 : 1, 0) * difficulty.rewardMultiplier * firstClearMultiplier)),
    relicFragments: Math.max(0, Math.round(integer("fragments" in source ? source.fragments : source.relicFragments, battle.difficulty === "nexus" ? 1 : 0, 0) * difficulty.rewardMultiplier * firstClearMultiplier)),
    firstClear,
  };
}

function concludeBattle(
  state: FamiliarCombatState,
  battle: FamiliarCombatBattle,
  outcome: Exclude<FamiliarCombatOutcome, "active">,
  events: FamiliarCombatTimelineEvent[],
  awardXp = true,
) {
  if (battle.resultApplied) return { state, battle };
  const old = familiarCombatProgress(state, battle.player.familiarId);
  const key = completedEncounterKey(battle);
  const firstClear = outcome === "victory" && !old.completedEncounters.includes(key);
  const fullReward = combatRewardFor(battle, firstClear);
  const earnedXp = awardXp ? (outcome === "victory" ? fullReward.combatXp : Math.max(1, Math.round(fullReward.combatXp * .2))) : 0;
  const combatXp = Math.max(0, old.combatXp + earnedXp);
  const combatLevel = combatLevelForXp(combatXp);
  const entry = familiarEntry(old.familiarId)!;
  const loadout = reconcileMoveLoadout(entry, old.learnedSchedule, combatLevel, old.equippedMoveIds);
  const completedEncounters = firstClear ? [...old.completedEncounters, key] : old.completedEncounters;
  const updatedWins = old.wins + (outcome === "victory" ? 1 : 0);
  const unlockedDifficulties = difficultyOrder.filter((difficulty) => updatedWins >= DIFFICULTY_RULES[difficulty].unlockWins);
  const nextProgress: FamiliarCombatProgress = {
    ...old,
    combatXp,
    combatLevel,
    wins: updatedWins,
    losses: old.losses + (outcome === "defeat" ? 1 : 0),
    battlesCompleted: old.battlesCompleted + 1,
    ...loadout,
    completedEncounters,
    unlockedDifficulties,
    rngState: battle.rngState,
  };
  const resultMove: CatalogMoveLike = { id: "battle-result", name: outcome === "victory" ? "Vittoria" : "Rientro al sicuro", kind: "status", vfx: outcome, audio: outcome };
  phaseEvent(battle, events, battle.player, battle.opponent, resultMove, "result", 900,
    outcome === "victory" ? `Vittoria. ${earnedXp} XP combattimento.` : `Sconfitta senza perdita di oggetti. ${earnedXp} XP combattimento.`);
  const resolvedBattle = { ...battle, outcome, resultApplied: true, timeline: events };
  return {
    battle: resolvedBattle,
    state: {
      ...state,
      profiles: { ...state.profiles, [old.familiarId]: nextProgress },
      activeBattle: resolvedBattle,
      pendingReward: awardXp && outcome === "victory" && firstClear ? { ...fullReward, combatXp: earnedXp } : null,
      lastTimeline: events,
      lastMessage: outcome === "victory" ? "Vittoria nell'Arena dei Famigli." : "Il Famiglio è tornato al sicuro senza perdere oggetti.",
    },
  };
}

export function performFamiliarCombatTurn(state: FamiliarCombatState, playerMoveId: string) {
  const original = state.activeBattle;
  if (!original || original.outcome !== "active") return { ok: false as const, state, error: "Nessun combattimento attivo." };
  const progress = familiarCombatProgress(state, original.player.familiarId);
  if (!progress.equippedMoveIds.includes(playerMoveId)) {
    return { ok: false as const, state, error: "La mossa non è equipaggiata." };
  }
  const playerMove = normalizedMove(playerMoveId);
  if (!playerMove) return { ok: false as const, state, error: "Mossa non disponibile." };
  const maxUses = familiarCombatMoveMaxUses(playerMoveId);
  if (maxUses > 0 && (original.player.moveUses[playerMoveId] ?? maxUses) <= 0) {
    return { ok: false as const, state, error: "Gli utilizzi di questa mossa sono terminati." };
  }
  const energyCost = familiarCombatMoveEnergyCost(original.player.familiarId, playerMoveId);
  if (original.player.energy < energyCost) {
    return { ok: false as const, state, error: `Energia insufficiente: servono ${energyCost} punti.` };
  }
  const baseMove = familiarCombatMoveIsBase(original.player.familiarId, playerMoveId);
  if (!baseMove && original.lastPlayerMoveId === playerMoveId && familiarCombatMoveHasCooldown(playerMoveId)) {
    return { ok: false as const, state, error: "Questa mossa potente deve ricaricarsi per un turno." };
  }
  if (!baseMove && original.lastPlayerMoveId === playerMoveId && original.playerMoveStreak >= 2) {
    return { ok: false as const, state, error: "Dopo due utilizzi consecutivi devi scegliere un'altra mossa." };
  }
  const opponentChoice = chooseOpponentMove(original);
  const opponentMove = opponentChoice.move;
  const events: FamiliarCombatTimelineEvent[] = [];
  let battle: FamiliarCombatBattle = { ...original, rngState: opponentChoice.rngState, timeline: [] };
  const playerPriority = integer(playerMove.priority, 0, -10, 10);
  const opponentPriority = integer(opponentMove.priority, 0, -10, 10);
  const playerFirst = battle.turn === 1 && battle.initiative
    ? battle.initiative.first === "player"
    : playerPriority !== opponentPriority
      ? playerPriority > opponentPriority
      : effectiveSpeed(battle.player) >= effectiveSpeed(battle.opponent);

  const execute = (playerActs: boolean) => {
    const source = playerActs ? battle.player : battle.opponent;
    const target = playerActs ? battle.opponent : battle.player;
    if (source.hp <= 0 || target.hp <= 0) return;
    const move = playerActs ? playerMove : opponentMove;
    const blockingStatus = source.statuses.find((status) => status.id === "freeze" || status.id === "sleep");
    if (blockingStatus) {
      events.push({
        id: `${battle.id}-${battle.turn}-${events.length + 1}`,
        order: events.length,
        actorId: source.familiarId,
        targetId: source.familiarId,
        moveId: blockingStatus.sourceMoveId,
        phase: "status",
        durationMs: 580,
        actionKind: "status",
        vfxCue: blockingStatus.id === "sleep" ? "arcano-sleep" : "marea-frost",
        audioCue: blockingStatus.id === "sleep" ? "status-sleep" : "status-freeze",
        statusId: blockingStatus.id,
        message: blockingStatus.id === "sleep"
          ? `${source.familiarId} dorme e non può agire.`
          : `${source.familiarId} è bloccato dal gelo.`,
      });
      return;
    }
    const paralysis = source.statuses.find((status) => status.id === "paralysis");
    if (paralysis) {
      const [paralysisRoll, afterParalysis] = nextRandom(battle.rngState);
      battle = { ...battle, rngState: afterParalysis };
      if (paralysisRoll < .35) {
        events.push({
          id: `${battle.id}-${battle.turn}-${events.length + 1}`,
          order: events.length,
          actorId: source.familiarId,
          targetId: source.familiarId,
          moveId: paralysis.sourceMoveId,
          phase: "status",
          durationMs: 520,
          actionKind: "status",
          vfxCue: "fulmine-shock",
          audioCue: "status-paralysis",
          statusId: "paralysis",
          message: `${source.familiarId} è paralizzato e perde l'azione.`,
        });
        return;
      }
    }
    const initiativeCritical = battle.turn === 1 && Boolean(playerActs
      ? battle.initiative?.playerCritical
      : battle.initiative?.opponentCritical);
    const result = applyAction(battle, source, target, move, battle.rngState, events, initiativeCritical);
    battle = {
      ...battle,
      rngState: result.rngState,
      player: playerActs ? result.attacker : result.defender,
      opponent: playerActs ? result.defender : result.attacker,
      lastPlayerMoveId: playerActs ? move.id : battle.lastPlayerMoveId,
      lastOpponentMoveId: playerActs ? battle.lastOpponentMoveId : move.id,
      playerMoveStreak: playerActs ? (battle.lastPlayerMoveId === move.id ? Math.min(2, battle.playerMoveStreak + 1) : 1) : battle.playerMoveStreak,
      opponentMoveStreak: playerActs ? battle.opponentMoveStreak : (battle.lastOpponentMoveId === move.id ? Math.min(2, battle.opponentMoveStreak + 1) : 1),
    };
  };

  execute(playerFirst);
  execute(!playerFirst);
  battle = {
    ...battle,
    player: {
      ...tickStatuses(battle.player, battle, events),
      energy: Math.min(battle.player.maxEnergy, battle.player.energy + FAMILIAR_COMBAT_ENERGY_REGEN),
    },
    opponent: {
      ...tickStatuses(battle.opponent, battle, events),
      energy: Math.min(battle.opponent.maxEnergy, battle.opponent.energy + FAMILIAR_COMBAT_ENERGY_REGEN),
    },
    log: [...battle.log, ...events.filter((event) => ["impact", "guard", "status", "result"].includes(event.phase)).map((event) => event.message)].slice(-20),
  };
  if (battle.opponent.hp <= 0) {
    if (battle.bossPhasesRemaining > 1) {
      const nextRemaining = battle.bossPhasesRemaining - 1;
      const nextPhase = battle.bossPhasesTotal - nextRemaining + 1;
      events.push({
        id: `${battle.id}-${battle.turn}-${events.length + 1}`,
        order: events.length,
        actorId: battle.opponent.familiarId,
        targetId: battle.opponent.familiarId,
        moveId: "boss-phase",
        phase: "status",
        durationMs: 900,
        actionKind: "status",
        vfxCue: "ombra-void",
        audioCue: "status-boss-phase",
        statusId: "boss-phase",
        message: `Il comandante libera la fase ${nextPhase} di ${battle.bossPhasesTotal}.`,
      });
      battle = {
        ...battle,
        opponent: {
          ...battle.opponent,
          hp: battle.opponent.maxHp,
          statuses: [],
          stats: {
            ...battle.opponent.stats,
            attack: Math.max(1, Math.round(battle.opponent.stats.attack * 1.06)),
            defense: Math.max(1, Math.round(battle.opponent.stats.defense * 1.04)),
            speed: Math.max(1, Math.round(battle.opponent.stats.speed * 1.02)),
          },
        },
        bossPhasesRemaining: nextRemaining,
        turn: battle.turn + 1,
        timeline: events,
      };
      return { ok: true as const, state: { ...state, activeBattle: battle, lastTimeline: events, lastMessage: `Fase ${nextPhase}/${battle.bossPhasesTotal}: la corruzione si intensifica.` }, timeline: events, opponentMoveId: opponentMove.id };
    }
    const concluded = concludeBattle(state, { ...battle, rngState: battle.rngState }, "victory", events);
    return { ok: true as const, state: concluded.state, timeline: events, opponentMoveId: opponentMove.id };
  }
  if (battle.player.hp <= 0) {
    const concluded = concludeBattle(state, { ...battle, rngState: battle.rngState }, "defeat", events);
    return { ok: true as const, state: concluded.state, timeline: events, opponentMoveId: opponentMove.id };
  }
  if (battle.maxTurns && battle.turn >= battle.maxTurns) {
    const concluded = concludeBattle(state, { ...battle, rngState: battle.rngState }, "defeat", events);
    return { ok: true as const, state: { ...concluded.state, lastMessage: "Il limite di turni e terminato. Il Famiglio e rientrato al sicuro." }, timeline: events, opponentMoveId: opponentMove.id };
  }
  battle = { ...battle, turn: battle.turn + 1, timeline: events };
  return {
    ok: true as const,
    state: {
      ...state,
      activeBattle: battle,
      lastTimeline: events,
      lastMessage: `Turno ${battle.turn - 1} completato.`,
    },
    timeline: events,
    opponentMoveId: opponentMove.id,
  };
}

export function claimFamiliarCombatReward(state: FamiliarCombatState) {
  const reward = state.pendingReward;
  if (!reward) return { ok: false as const, state, error: "Nessuna ricompensa pronta." };
  const progress = familiarCombatProgress(state, reward.familiarId);
  if (progress.claimedRewardKeys.includes(reward.key)) {
    return { ok: false as const, state: { ...state, pendingReward: null }, error: "Ricompensa già riscattata." };
  }
  const next = { ...progress, claimedRewardKeys: [...progress.claimedRewardKeys, reward.key] };
  return {
    ok: true as const,
    reward,
    state: {
      ...state,
      profiles: { ...state.profiles, [reward.familiarId]: next },
      pendingReward: null,
      lastMessage: "Ricompensa dell'Arena custodita.",
    },
  };
}

export function closeFamiliarCombatBattle(state: FamiliarCombatState) {
  if (!state.activeBattle || state.activeBattle.outcome === "active") return state;
  return { ...state, activeBattle: null, lastTimeline: [] };
}

export function retreatFromFamiliarCombat(state: FamiliarCombatState) {
  const battle = state.activeBattle;
  if (!battle || battle.outcome !== "active") return state;
  const events: FamiliarCombatTimelineEvent[] = [];
  const concluded = concludeBattle(state, battle, "defeat", events, false);
  return { ...concluded.state, pendingReward: null, lastMessage: "Rientro sicuro: nessun oggetto è stato perso." };
}

function restoreSchedule(familiarId: string, raw: unknown, seed: number) {
  if (!Array.isArray(raw)) return scheduleForFamiliar(familiarId, seed);
  const restored = raw
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
    .map((entry) => ({ moveId: String(entry.moveId ?? ""), level: integer(entry.level, 1, 1, 50) }))
    .filter((entry) => normalizedMove(entry.moveId));
  return restored.length ? restored : scheduleForFamiliar(familiarId, seed);
}

function restoreProgress(familiarId: string, raw: unknown, seed: number): FamiliarCombatProgress {
  const base = createFamiliarCombatProgress(familiarId, seed);
  if (!raw || typeof raw !== "object") return base;
  const candidate = raw as Partial<FamiliarCombatProgress>;
  const combatXp = integer(candidate.combatXp, 0);
  const combatLevel = Math.max(integer(candidate.combatLevel, 1, 1, 50), combatLevelForXp(combatXp));
  const learnedSchedule = restoreSchedule(familiarId, candidate.learnedSchedule, base.rngState);
  const entry = familiarEntry(familiarId)!;
  const requested = Array.isArray(candidate.equippedMoveIds) ? candidate.equippedMoveIds.map(String) : base.equippedMoveIds;
  const loadout = reconcileMoveLoadout(entry, learnedSchedule, combatLevel, requested);
  const restoredWins = integer(candidate.wins, 0);
  const difficulties = difficultyOrder.filter((difficulty) => restoredWins >= DIFFICULTY_RULES[difficulty].unlockWins);
  return {
    ...base,
    combatLevel,
    combatXp,
    wins: restoredWins,
    losses: integer(candidate.losses, 0),
    battlesCompleted: integer(candidate.battlesCompleted, integer(candidate.wins, 0) + integer(candidate.losses, 0)),
    learnedSchedule,
    ...loadout,
    completedEncounters: Array.isArray(candidate.completedEncounters) ? unique(candidate.completedEncounters.map(String)).slice(0, 500) : [],
    unlockedDifficulties: difficulties,
    claimedRewardKeys: Array.isArray(candidate.claimedRewardKeys) ? unique(candidate.claimedRewardKeys.map(String)).slice(0, 500) : [],
    rngState: normalizedSeed(candidate.rngState ?? base.rngState),
  };
}

function restoreActor(raw: unknown): FamiliarCombatActor | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Partial<FamiliarCombatActor>;
  if (!candidate.familiarId || !familiarEntry(candidate.familiarId)) return null;
  const level = integer(candidate.level, 1, 1, 50);
  const calculated = familiarCombatStats(candidate.familiarId, level);
  const stats = candidate.stats && typeof candidate.stats === "object"
    ? {
        hp: integer(candidate.stats.hp, calculated.hp, 1, 99999),
        attack: integer(candidate.stats.attack, calculated.attack, 1, 9999),
        defense: integer(candidate.stats.defense, calculated.defense, 1, 9999),
        speed: integer(candidate.stats.speed, calculated.speed, 1, 9999),
      }
    : calculated;
  const maxHp = integer(candidate.maxHp, stats.hp, 1, 99999);
  return {
    familiarId: candidate.familiarId,
    role: typeof candidate.role === "string" ? candidate.role : String(familiarEntry(candidate.familiarId)?.role ?? ""),
    evolutionPath: ["impeto", "baluardo", "risonanza"].includes(String(candidate.evolutionPath))
      ? candidate.evolutionPath as FamiliarCombatActor["evolutionPath"]
      : null,
    level,
    hp: integer(candidate.hp, maxHp, 0, maxHp),
    maxHp,
    stats,
    statuses: Array.isArray(candidate.statuses) ? candidate.statuses.filter((status): status is FamiliarCombatStatus => Boolean(status && typeof status.id === "string")).map((status) => ({
      id: String(status.id), name: String(status.name ?? status.id), remainingTurns: integer(status.remainingTurns, 1, 1, 5),
      potency: integer(status.potency, 1, 1, 80), sourceMoveId: String(status.sourceMoveId ?? "restore"),
    })).slice(0, 6) : [],
    guarding: Boolean(candidate.guarding),
    energy: integer(candidate.energy, FAMILIAR_COMBAT_MAX_ENERGY, 0, FAMILIAR_COMBAT_MAX_ENERGY),
    maxEnergy: FAMILIAR_COMBAT_MAX_ENERGY,
    moveUses: Object.fromEntries(Object.entries(candidate.moveUses && typeof candidate.moveUses === "object" ? candidate.moveUses : {})
      .filter(([moveId]) => Boolean(normalizedMove(moveId)))
      .map(([moveId, uses]) => [moveId, integer(uses, familiarCombatMoveMaxUses(moveId), 0, 12)])),
  };
}

export function restoreFamiliarCombatState(value: unknown): FamiliarCombatState {
  const base = createFamiliarCombatState();
  if (!value || typeof value !== "object") return base;
  const candidate = value as Partial<FamiliarCombatState>;
  const seed = normalizedSeed(candidate.seed ?? base.seed);
  const profiles = Object.fromEntries(Object.entries(candidate.profiles && typeof candidate.profiles === "object" ? candidate.profiles : {})
    .filter(([familiarId]) => familiarEntry(familiarId))
    .map(([familiarId, raw]) => [familiarId, restoreProgress(familiarId, raw, seed)]));
  let activeBattle: FamiliarCombatBattle | null = null;
  if (candidate.activeBattle && typeof candidate.activeBattle === "object") {
    const player = restoreActor(candidate.activeBattle.player);
    const opponent = restoreActor(candidate.activeBattle.opponent);
    const circuit = circuitEntry(String(candidate.activeBattle.circuitId ?? ""));
    const difficulty = difficultyOrder.includes(candidate.activeBattle.difficulty as FamiliarCombatDifficulty)
      ? candidate.activeBattle.difficulty as FamiliarCombatDifficulty : "normal";
    if (player && opponent && player.familiarId !== opponent.familiarId && circuit) {
      const storedInitiative = candidate.activeBattle.initiative;
      const restoredInitiative = storedInitiative
        && Array.isArray(storedInitiative.playerDice)
        && Array.isArray(storedInitiative.opponentDice)
        ? {
            playerDice: [integer(storedInitiative.playerDice[0], 1, 1, 6), integer(storedInitiative.playerDice[1], 1, 1, 6)] as const,
            opponentDice: [integer(storedInitiative.opponentDice[0], 1, 1, 6), integer(storedInitiative.opponentDice[1], 1, 1, 6)] as const,
            playerTotal: integer(storedInitiative.playerTotal, 2, 2, 12),
            opponentTotal: integer(storedInitiative.opponentTotal, 2, 2, 12),
            first: storedInitiative.first === "opponent" ? "opponent" as const : "player" as const,
            playerCritical: Boolean(storedInitiative.playerCritical),
            opponentCritical: Boolean(storedInitiative.opponentCritical),
          }
        : rollInitiative(seed, player.stats.speed, opponent.stats.speed).initiative;
      activeBattle = {
        id: String(candidate.activeBattle.id ?? `restored-${seed}`),
        circuitId: circuit.id,
        encounterId: String(candidate.activeBattle.encounterId ?? encounterKey(circuit.id, difficulty, opponent.familiarId)),
        difficulty,
        player,
        opponent,
        turn: integer(candidate.activeBattle.turn, 1, 1, 9999),
        maxTurns: Number.isFinite(candidate.activeBattle.maxTurns) ? integer(candidate.activeBattle.maxTurns, 1, 1, 9999) : null,
        bossPhasesTotal: integer(candidate.activeBattle.bossPhasesTotal, 1, 1, 3),
        bossPhasesRemaining: integer(candidate.activeBattle.bossPhasesRemaining, 1, 1, 3),
        outcome: (["active", "victory", "defeat"] as const).includes(candidate.activeBattle.outcome as FamiliarCombatOutcome)
          ? candidate.activeBattle.outcome as FamiliarCombatOutcome : "active",
        rngState: normalizedSeed(candidate.activeBattle.rngState ?? seed),
        lastPlayerMoveId: typeof candidate.activeBattle.lastPlayerMoveId === "string" ? candidate.activeBattle.lastPlayerMoveId : null,
        lastOpponentMoveId: typeof candidate.activeBattle.lastOpponentMoveId === "string" ? candidate.activeBattle.lastOpponentMoveId : null,
        playerMoveStreak: integer(candidate.activeBattle.playerMoveStreak, 0, 0, 2),
        opponentMoveStreak: integer(candidate.activeBattle.opponentMoveStreak, 0, 0, 2),
        opponentStrategy: DIFFICULTY_RULES[difficulty].strategy,
        initiative: restoredInitiative,
        resultApplied: Boolean(candidate.activeBattle.resultApplied),
        timeline: [],
        log: Array.isArray(candidate.activeBattle.log) ? candidate.activeBattle.log.map(String).slice(-20) : [],
      };
    }
  }
  const pending = candidate.pendingReward;
  const pendingReward = pending && typeof pending === "object" && familiarEntry(String(pending.familiarId ?? ""))
    ? {
        key: String(pending.key ?? ""), battleId: String(pending.battleId ?? ""), familiarId: String(pending.familiarId),
        circuitId: String(pending.circuitId ?? ""), difficulty: difficultyOrder.includes(pending.difficulty as FamiliarCombatDifficulty) ? pending.difficulty as FamiliarCombatDifficulty : "normal",
        combatXp: integer(pending.combatXp, 0), nexusCoins: integer(pending.nexusCoins, 0), nightSigils: integer(pending.nightSigils, 0),
        relicFragments: integer(pending.relicFragments, 0), firstClear: Boolean(pending.firstClear),
      } satisfies FamiliarCombatReward
    : null;
  return {
    version: FAMILIAR_COMBAT_STATE_VERSION,
    seed,
    profiles,
    activeBattle,
    pendingReward,
    lastTimeline: [],
    lastMessage: typeof candidate.lastMessage === "string" ? candidate.lastMessage : base.lastMessage,
  };
}
