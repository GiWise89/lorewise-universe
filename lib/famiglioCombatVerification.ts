// Replay verificabile delle battaglie del Famiglio.
//
// Il motore (famiglioCombat.ts) è deterministico: stesso stato di partenza, stesse
// opzioni e stesse azioni producono lo stesso esito. Il client registra quindi
// soltanto la *richiesta* dell'incontro (modalità, squadra, rivale, capitolo o
// piano della Torre) e la sequenza ordinata delle azioni del giocatore. Le opzioni
// del motore (livelli, statistiche del rivale, limiti di turno, fasi del boss)
// vengono sempre ricavate qui, dallo stato di combattimento: sul server da quello
// salvato nell'account, mai da valori inviati dal client.
import {
  claimFamiliarCombatReward,
  closeFamiliarCombatBattle,
  combatDifficultyIsUnlocked,
  ensureFamiliarCombatProgress,
  familiarCombatMoveIsBase,
  familiarCombatOpponents,
  familiarCombatProgress,
  FAMILIAR_COMBAT_MOVE_SLOTS,
  performFamiliarCombatTurn,
  restoreFamiliarCombatState,
  retreatFromFamiliarCombat,
  startFamiliarCombatBattle,
  switchFamiliarCombatant,
  type FamiliarCombatBattle,
  type FamiliarCombatDifficulty,
  type FamiliarCombatProgress,
  type FamiliarCombatReward,
  type FamiliarCombatState,
  type StartFamiliarCombatBattleOptions,
} from "./famiglioCombat.ts";
import { FAMILIAR_COMBAT_CATALOG, FAMILIAR_COMBAT_CIRCUITS, familiarCombatEntry } from "./famiglioCombatCatalog.ts";
import { familiarCampaignIsUnlocked, familiarCampaignLevelById, familiarCampaignOpponent } from "./famiglioCombatCampaign.ts";
import { createFamiliarTowerRun } from "./famiglioCombatTower.ts";
import { familiarCombatNeedBonus } from "./famiglioWellbeing.ts";

export const FAMILIAR_COMBAT_REPLAY_VERSION = 1;
/** Nessun incontro reale si avvicina a questo numero di azioni (il fuzz resta sotto le 200). */
export const FAMILIAR_COMBAT_REPLAY_MAX_ACTIONS = 600;
export const FAMILIAR_COMBAT_REPLAY_MAX_BYTES = 64 * 1024;

export type FamiliarCombatBattleMode = "duel" | "team" | "tower" | "campaign";
/** Fascia di benessere al via: decide il piccolo bonus/malus di statistiche (vedi famiglioWellbeing). */
export type FamiliarCombatNeedTier = "splendido" | "stabile" | "inquieto";

export type FamiliarCombatTowerRequest = {
  /** Seme testuale con cui il client ha generato la Torre (createFamiliarTowerRun). */
  seed: string;
  /** Livello del Famiglio quando la Torre è stata generata. */
  level: number;
  floor: number;
};

export type FamiliarCombatBattleRequest = {
  mode: FamiliarCombatBattleMode;
  playerId: string;
  teamIds: string[];
  circuitId: string;
  difficulty: FamiliarCombatDifficulty;
  opponentId: string;
  campaignId: string | null;
  tower: FamiliarCombatTowerRequest | null;
  needTier: FamiliarCombatNeedTier;
};

export type FamiliarCombatReplayAction =
  | { type: "move"; moveId: string }
  | { type: "switch"; familiarId: string }
  | { type: "retreat" };

export type FamiliarCombatReplay = {
  version: typeof FAMILIAR_COMBAT_REPLAY_VERSION;
  battleId: string;
  request: FamiliarCombatBattleRequest;
  /** Mosse equipaggiate da ciascun membro della squadra all'inizio dell'incontro. */
  loadouts: Record<string, string[]>;
  actions: FamiliarCombatReplayAction[];
};

export type FamiliarCombatResolvedOutcome = "victory" | "defeat" | "retreat";

export type FamiliarCombatStartPlan = {
  options: StartFamiliarCombatBattleOptions;
  towerRunId: string | null;
  towerFloor: number | null;
};

export type FamiliarCombatReplayRejection = {
  ok: false;
  code: "invalid" | "locked" | "loadout" | "start" | "desync" | "illegal-action" | "incomplete";
  error: string;
};

export type FamiliarCombatReplayResult =
  | {
      ok: true;
      battleId: string;
      outcome: FamiliarCombatResolvedOutcome;
      reward: FamiliarCombatReward | null;
      state: FamiliarCombatState;
      plan: FamiliarCombatStartPlan;
      leadFamiliarId: string;
      encounterId: string;
    }
  | FamiliarCombatReplayRejection;

const MODES: readonly FamiliarCombatBattleMode[] = ["duel", "team", "tower", "campaign"];
const DIFFICULTIES: readonly FamiliarCombatDifficulty[] = ["normal", "expert", "nexus"];
const NEED_TIERS: readonly FamiliarCombatNeedTier[] = ["splendido", "stabile", "inquieto"];
const NEED_TIER_MULTIPLIER: Readonly<Record<FamiliarCombatNeedTier, number>> = { splendido: 1.04, stabile: 1, inquieto: .92 };
const RARITY_POWER: Readonly<Record<string, number>> = { comune: 0, raro: 1, epico: 2, leggendario: 3 };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function shortString(value: unknown, max = 80) {
  return typeof value === "string" && value.length > 0 && value.length <= max ? value : null;
}

function unique<T>(items: readonly T[]) {
  return [...new Set(items)];
}

function reject(code: FamiliarCombatReplayRejection["code"], error: string): FamiliarCombatReplayRejection {
  return { ok: false, code, error };
}

/** Fascia di benessere dal moltiplicatore di familiarActivityGate. */
export function familiarCombatNeedTier(multiplier: number): FamiliarCombatNeedTier {
  return multiplier >= 1.04 ? "splendido" : multiplier < 1 ? "inquieto" : "stabile";
}

export function familiarCombatNeedTierBonus(tier: FamiliarCombatNeedTier) {
  return familiarCombatNeedBonus({ allowed: true, tier: "stabile", multiplier: NEED_TIER_MULTIPLIER[tier], reason: null, warnings: [] });
}

/** Stessa stima di forza di lib/famiglioCombatTower.ts, usata per le riserve rivali. */
export function familiarCombatRosterPower(entry: (typeof FAMILIAR_COMBAT_CATALOG)[number]) {
  return entry.baseStats.hp * .18 + entry.baseStats.attack * .34 + entry.baseStats.defense * .28 + entry.baseStats.speed * .2 + (RARITY_POWER[entry.rarity] ?? 0) * 8;
}

/**
 * Squadra rivale di un incontro. I rivali indicati esplicitamente (piano della Torre,
 * capitolo della Campagna) vengono per primi, mai già schierati dal giocatore; le
 * riserve mancanti hanno forza vicina a quella del titolare. Condivisa da anteprima,
 * avvio della battaglia e verifica sul server, così i tre calcoli non divergono.
 */
export function familiarCombatRivalTeamIds(input: {
  playerId: string;
  teamIds: readonly string[];
  circuitOpponentIds: readonly string[];
  leadOpponentId: string;
  extraRivalIds?: readonly string[];
  teamBattle: boolean;
}) {
  const explicit = unique([input.leadOpponentId, ...(input.extraRivalIds ?? [])])
    .filter((id) => id && id !== input.playerId && !input.teamIds.includes(id));
  const leadEntry = familiarCombatEntry(explicit[0] ?? input.leadOpponentId);
  const leadPower = leadEntry ? familiarCombatRosterPower(leadEntry) : 0;
  const reserves = unique([...input.circuitOpponentIds, ...FAMILIAR_COMBAT_CATALOG.map((entry) => entry.id)])
    .filter((id) => id !== input.playerId && !input.teamIds.includes(id) && !explicit.includes(id))
    .flatMap((id) => { const entry = familiarCombatEntry(id); return entry ? [entry] : []; })
    .sort((left, right) => Math.abs(familiarCombatRosterPower(left) - leadPower) - Math.abs(familiarCombatRosterPower(right) - leadPower) || left.id.localeCompare(right.id))
    .map((entry) => entry.id);
  return [...explicit, ...reserves].slice(0, input.teamBattle ? 3 : 1);
}

function normalizedTeam(playerId: string, teamIds: readonly string[]) {
  return unique([playerId, ...teamIds]).filter((id) => Boolean(familiarCombatEntry(id))).slice(0, 3);
}

/**
 * Opzioni del motore per una richiesta d'incontro. `testMode` esiste solo per la
 * prova locale (?test=all): il server non lo usa mai.
 */
export function familiarCombatStartPlan(
  state: FamiliarCombatState,
  request: FamiliarCombatBattleRequest,
  { testMode = false }: { testMode?: boolean } = {},
): { ok: true; plan: FamiliarCombatStartPlan } | FamiliarCombatReplayRejection {
  const player = familiarCombatEntry(request.playerId);
  if (!player) return reject("invalid", "Famiglio non disponibile.");
  if (!DIFFICULTIES.includes(request.difficulty)) return reject("invalid", "Difficoltà non disponibile.");
  const progress = familiarCombatProgress(state, player.id);
  const playerStatBonus = familiarCombatNeedTierBonus(request.needTier);
  const circuitOpponents = (circuitId: string) => familiarCombatOpponents(player.id, testMode ? undefined : circuitId);
  const circuitUnlocked = (circuitId: string, difficulty: FamiliarCombatDifficulty) => {
    const circuit = FAMILIAR_COMBAT_CIRCUITS.find((entry) => entry.id === circuitId);
    if (!circuit) return false;
    return testMode || (progress.combatLevel >= circuit.minLevel && progress.wins >= circuit.unlockWins && combatDifficultyIsUnlocked(progress, difficulty));
  };

  if (request.mode === "campaign") {
    const level = familiarCampaignLevelById(request.campaignId);
    if (!level) return reject("invalid", "Capitolo della Campagna non riconosciuto.");
    if (!familiarCampaignIsUnlocked(progress, level, testMode)) return reject("locked", "Completa prima il capitolo precedente della Campagna.");
    const opponentId = familiarCampaignOpponent(level, player.id);
    const team = level.teamBattle ? normalizedTeam(player.id, request.teamIds) : [player.id];
    return {
      ok: true,
      plan: {
        towerRunId: null,
        towerFloor: null,
        options: {
          playerId: player.id,
          playerTeamIds: team,
          opponentId,
          opponentTeamIds: familiarCombatRivalTeamIds({ playerId: player.id, teamIds: team, circuitOpponentIds: circuitOpponents(level.circuitId), leadOpponentId: opponentId, extraRivalIds: level.opponentIds, teamBattle: level.teamBattle }),
          circuitId: level.circuitId,
          difficulty: level.difficulty,
          opponentLevel: level.opponentLevel,
          encounterId: level.id,
          ignoreUnlocks: true,
          playerStatBonus,
          playerEvolutionPath: null,
          maxTurns: level.turnLimit ?? null,
          bossPhases: level.teamBattle ? 1 : level.bossPhases,
          teamBattle: level.teamBattle,
        },
      },
    };
  }

  if (request.mode === "tower") {
    const tower = request.tower;
    if (!tower) return reject("invalid", "Piano della Torre non indicato.");
    if (tower.level > progress.combatLevel) return reject("invalid", "La Torre non può essere generata sopra il livello del Famiglio.");
    const run = createFamiliarTowerRun(player.id, tower.level, tower.seed);
    const floor = run.floors[tower.floor - 1];
    if (!floor) return reject("invalid", "Piano della Torre non disponibile.");
    if (!circuitUnlocked(floor.circuitId, request.difficulty)) return reject("locked", "Questo piano della Torre non è ancora accessibile.");
    const team = floor.teamBattle ? normalizedTeam(player.id, request.teamIds) : [player.id];
    return {
      ok: true,
      plan: {
        towerRunId: run.id,
        towerFloor: floor.floor,
        options: {
          playerId: player.id,
          playerTeamIds: team,
          opponentId: floor.opponentId,
          opponentTeamIds: familiarCombatRivalTeamIds({ playerId: player.id, teamIds: team, circuitOpponentIds: circuitOpponents(floor.circuitId), leadOpponentId: floor.opponentId, extraRivalIds: floor.opponentTeamIds, teamBattle: floor.teamBattle }),
          circuitId: floor.circuitId,
          difficulty: request.difficulty,
          opponentLevel: floor.opponentLevel,
          encounterId: `${run.id}:floor-${floor.floor}`,
          ignoreUnlocks: true,
          playerStatBonus,
          playerEvolutionPath: null,
          maxTurns: null,
          bossPhases: 1,
          teamBattle: floor.teamBattle,
        },
      },
    };
  }

  const teamBattle = request.mode === "team";
  const team = teamBattle ? normalizedTeam(player.id, request.teamIds) : [player.id];
  return {
    ok: true,
    plan: {
      towerRunId: null,
      towerFloor: null,
      options: {
        playerId: player.id,
        playerTeamIds: team,
        opponentId: request.opponentId,
        opponentTeamIds: familiarCombatRivalTeamIds({ playerId: player.id, teamIds: team, circuitOpponentIds: circuitOpponents(request.circuitId), leadOpponentId: request.opponentId, teamBattle }),
        circuitId: request.circuitId,
        difficulty: request.difficulty,
        opponentLevel: testMode ? progress.combatLevel : undefined,
        ignoreUnlocks: testMode,
        playerStatBonus,
        playerEvolutionPath: null,
        maxTurns: null,
        bossPhases: 1,
        teamBattle,
      },
    },
  };
}

function sanitizeRequest(value: unknown): FamiliarCombatBattleRequest | null {
  if (!isRecord(value)) return null;
  const mode = MODES.find((entry) => entry === value.mode);
  const playerId = shortString(value.playerId);
  const circuitId = shortString(value.circuitId) ?? "";
  const difficulty = DIFFICULTIES.find((entry) => entry === value.difficulty);
  const needTier = NEED_TIERS.find((entry) => entry === value.needTier);
  if (!mode || !playerId || !difficulty || !needTier) return null;
  if (!Array.isArray(value.teamIds) || value.teamIds.length > 3 || !value.teamIds.every((id) => shortString(id))) return null;
  const opponentId = value.opponentId === undefined || value.opponentId === null || value.opponentId === "" ? "" : shortString(value.opponentId);
  if (opponentId === null) return null;
  const campaignId = value.campaignId === undefined || value.campaignId === null ? null : shortString(value.campaignId, 40);
  if (mode === "campaign" && !campaignId) return null;
  let tower: FamiliarCombatTowerRequest | null = null;
  if (mode === "tower") {
    if (!isRecord(value.tower)) return null;
    const seed = shortString(value.tower.seed, 160);
    const level = Number(value.tower.level);
    const floor = Number(value.tower.floor);
    if (!seed || !Number.isInteger(level) || level < 1 || level > 50 || !Number.isInteger(floor) || floor < 1 || floor > 10) return null;
    tower = { seed, level, floor };
  }
  if ((mode === "duel" || mode === "team") && (!circuitId || !opponentId)) return null;
  return { mode, playerId, teamIds: value.teamIds as string[], circuitId, difficulty, opponentId, campaignId, tower, needTier };
}

/** Controlla la forma del replay inviato dal client, senza fidarsi di nessun campo. */
export function sanitizeFamiliarCombatReplay(value: unknown): FamiliarCombatReplay | null {
  if (!isRecord(value) || value.version !== FAMILIAR_COMBAT_REPLAY_VERSION) return null;
  const battleId = shortString(value.battleId, 120);
  const request = sanitizeRequest(value.request);
  if (!battleId || !request) return null;
  if (!isRecord(value.loadouts) || Object.keys(value.loadouts).length > 3) return null;
  const loadouts: Record<string, string[]> = {};
  for (const [familiarId, moves] of Object.entries(value.loadouts)) {
    if (!shortString(familiarId) || !Array.isArray(moves) || moves.length > FAMILIAR_COMBAT_MOVE_SLOTS || !moves.every((move) => shortString(move))) return null;
    loadouts[familiarId] = moves as string[];
  }
  if (!Array.isArray(value.actions) || value.actions.length > FAMILIAR_COMBAT_REPLAY_MAX_ACTIONS) return null;
  const actions: FamiliarCombatReplayAction[] = [];
  for (const [index, raw] of value.actions.entries()) {
    if (!isRecord(raw)) return null;
    if (raw.type === "move" && shortString(raw.moveId)) actions.push({ type: "move", moveId: raw.moveId as string });
    else if (raw.type === "switch" && shortString(raw.familiarId)) actions.push({ type: "switch", familiarId: raw.familiarId as string });
    else if (raw.type === "retreat" && index === value.actions.length - 1) actions.push({ type: "retreat" });
    else return null;
  }
  return { version: FAMILIAR_COMBAT_REPLAY_VERSION, battleId, request, loadouts, actions };
}

/**
 * Mosse equipaggiate richieste dal client: valide solo se tutte già apprese al
 * livello registrato, al massimo quattro e con la mossa base sempre presente.
 */
export function familiarCombatLoadoutIsValid(progress: FamiliarCombatProgress, moveIds: readonly string[]) {
  const ids = unique(moveIds);
  if (ids.length !== moveIds.length || ids.length < 1 || ids.length > FAMILIAR_COMBAT_MOVE_SLOTS) return false;
  if (!ids.every((id) => progress.learnedMoveIds.includes(id))) return false;
  const baseMoveId = progress.learnedMoveIds.find((id) => familiarCombatMoveIsBase(progress.familiarId, id));
  return !baseMoveId || ids.includes(baseMoveId);
}

function applyLoadouts(state: FamiliarCombatState, teamIds: readonly string[], loadouts: Record<string, string[]>) {
  let next = state;
  for (const [familiarId, moveIds] of Object.entries(loadouts)) {
    if (!teamIds.includes(familiarId) || !familiarCombatEntry(familiarId)) return null;
    next = ensureFamiliarCombatProgress(next, familiarId);
    const progress = familiarCombatProgress(next, familiarId);
    if (!familiarCombatLoadoutIsValid(progress, moveIds)) return null;
    next = {
      ...next,
      profiles: {
        ...next.profiles,
        [familiarId]: { ...progress, equippedMoveIds: [...moveIds], archivedMoveIds: progress.learnedMoveIds.filter((id) => !moveIds.includes(id)) },
      },
    };
  }
  return next;
}

/**
 * Rigioca un incontro dal suo stato di partenza. Restituisce l'esito calcolato dal
 * motore, il premio del primo completamento (già riscattato nello stato) e lo stato
 * finale con la battaglia chiusa. Qualunque azione non ammessa, un id di battaglia
 * che non corrisponde al seme salvato o un incontro non concluso invalidano il replay.
 */
export function replayFamiliarCombatBattle(stored: unknown, rawReplay: unknown): FamiliarCombatReplayResult {
  const replay = sanitizeFamiliarCombatReplay(rawReplay);
  if (!replay) return reject("invalid", "Resoconto della battaglia non valido.");
  const base: FamiliarCombatState = { ...restoreFamiliarCombatState(stored), activeBattle: null, pendingReward: null, lastTimeline: [] };
  const planned = familiarCombatStartPlan(base, replay.request);
  if (!planned.ok) return planned;
  const teamIds = planned.plan.options.playerTeamIds ?? [replay.request.playerId];
  const withLoadouts = applyLoadouts(base, teamIds, replay.loadouts);
  if (!withLoadouts) return reject("loadout", "Le mosse equipaggiate non corrispondono ai progressi registrati.");
  const started = startFamiliarCombatBattle(withLoadouts, planned.plan.options);
  if (!started.ok || !started.state.activeBattle) return reject("start", started.ok ? "Incontro non avviato." : started.error);
  if (started.state.activeBattle.id !== replay.battleId) {
    return reject("desync", "La battaglia non corrisponde ai progressi registrati sul server.");
  }
  let state: FamiliarCombatState = started.state;
  for (const [index, action] of replay.actions.entries()) {
    const battle = state.activeBattle;
    if (!battle || battle.outcome !== "active") return reject("illegal-action", `Azione ${index + 1} dopo la fine della battaglia.`);
    if (action.type === "retreat") {
      state = retreatFromFamiliarCombat(state);
      continue;
    }
    const result = action.type === "move" ? performFamiliarCombatTurn(state, action.moveId) : switchFamiliarCombatant(state, action.familiarId);
    if (!result.ok) return reject("illegal-action", `Azione ${index + 1} non ammessa: ${result.error}`);
    state = result.state;
  }
  const finalBattle = state.activeBattle as FamiliarCombatBattle | null;
  if (!finalBattle || finalBattle.outcome === "active") return reject("incomplete", "La battaglia non risulta conclusa.");
  const outcome = finalBattle.outcome as FamiliarCombatResolvedOutcome;
  let reward: FamiliarCombatReward | null = null;
  if (outcome === "victory" && state.pendingReward) {
    const claimed = claimFamiliarCombatReward(state);
    if (claimed.ok) reward = claimed.reward;
    state = claimed.state;
  }
  return {
    ok: true,
    battleId: replay.battleId,
    outcome,
    reward,
    state: { ...closeFamiliarCombatBattle(state), pendingReward: null },
    plan: planned.plan,
    leadFamiliarId: finalBattle.teamFamiliarIds[0] ?? replay.request.playerId,
    encounterId: finalBattle.encounterId,
  };
}

/**
 * Allinea lo stato locale ai progressi autorevoli del server (livelli, XP, record,
 * incontri completati e premi riscattati), conservando la battaglia in corso e le
 * mosse equipaggiate scelte sul dispositivo quando restano valide.
 */
export function adoptServerCombatProgress(local: FamiliarCombatState, serverRaw: unknown): FamiliarCombatState {
  const server = restoreFamiliarCombatState(serverRaw);
  const profiles: FamiliarCombatState["profiles"] = {};
  for (const [familiarId, progress] of Object.entries(server.profiles)) {
    const localEquipped = local.profiles[familiarId]?.equippedMoveIds;
    profiles[familiarId] = localEquipped && familiarCombatLoadoutIsValid(progress, localEquipped)
      ? { ...progress, equippedMoveIds: [...localEquipped], archivedMoveIds: progress.learnedMoveIds.filter((id) => !localEquipped.includes(id)) }
      : progress;
  }
  return { ...local, seed: server.seed, profiles };
}

/** Impronta dello stato della battaglia prima/dopo ogni azione registrata. */
export function familiarCombatBattleFingerprint(battle: FamiliarCombatBattle) {
  return [battle.id, battle.turn, battle.rngState, battle.player.familiarId, battle.player.hp, battle.player.energy, battle.opponent.familiarId, battle.opponent.hp, battle.switchCooldown, battle.outcome].join("|");
}

export type FamiliarCombatJournal = {
  battleId: string;
  request: FamiliarCombatBattleRequest;
  loadouts: Record<string, string[]>;
  actions: FamiliarCombatReplayAction[];
  /** marks[i] = impronta dello stato prima dell'azione i; marks[actions.length] = stato attuale. */
  marks: string[];
  broken: boolean;
};

export function createFamiliarCombatJournal(state: FamiliarCombatState, request: FamiliarCombatBattleRequest): FamiliarCombatJournal | null {
  const battle = state.activeBattle;
  if (!battle) return null;
  const loadouts = Object.fromEntries(battle.teamFamiliarIds.map((id) => [id, [...familiarCombatProgress(state, id).equippedMoveIds]]));
  return { battleId: battle.id, request, loadouts, actions: [], marks: [familiarCombatBattleFingerprint(battle)], broken: false };
}

/**
 * Aggiunge un'azione al diario. Se lo stato locale è stato riportato indietro (per
 * esempio da un salvataggio cloud più vecchio) il diario viene troncato al punto
 * corrispondente; se il punto non esiste il replay non è più ricostruibile.
 */
export function recordFamiliarCombatAction(
  journal: FamiliarCombatJournal,
  before: FamiliarCombatBattle,
  action: FamiliarCombatReplayAction,
  after: FamiliarCombatBattle,
): FamiliarCombatJournal {
  if (journal.broken || journal.battleId !== before.id) return { ...journal, broken: true };
  const index = journal.marks.lastIndexOf(familiarCombatBattleFingerprint(before));
  if (index < 0 || index > journal.actions.length) return { ...journal, broken: true };
  return {
    ...journal,
    actions: [...journal.actions.slice(0, index), action].slice(0, FAMILIAR_COMBAT_REPLAY_MAX_ACTIONS),
    marks: [...journal.marks.slice(0, index + 1), familiarCombatBattleFingerprint(after)],
  };
}

export function familiarCombatReplayFromJournal(journal: FamiliarCombatJournal | null | undefined): FamiliarCombatReplay | null {
  if (!journal || journal.broken) return null;
  return { version: FAMILIAR_COMBAT_REPLAY_VERSION, battleId: journal.battleId, request: journal.request, loadouts: journal.loadouts, actions: journal.actions };
}
