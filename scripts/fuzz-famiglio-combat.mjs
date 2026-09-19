// Fuzz e simulazione del motore di combattimento dei Famigli.
//
// Gioca migliaia di battaglie deterministiche (duelli liberi, 3 contro 3,
// campagna e Torre) con scelte casuali, avide e tentativi illegali, e verifica
// a ogni turno gli invarianti del motore: nessuna eccezione, nessuna mutazione
// dello stato in ingresso, HP/energia/usi/stati entro i limiti, nessun NaN,
// terminazione, determinismo, round-trip del salvataggio, coerenza della
// timeline usata dalla UI per animare le barre HP e ricompense limitate.
//
// Uso: node scripts/fuzz-famiglio-combat.mjs [--battles 3000] [--seed fuzz] [--balance] [--campaign] [--tower] [--copies N]
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import {
  FAMILIAR_COMBAT_ENERGY_REGEN,
  FAMILIAR_COMBAT_MAX_ENERGY,
  FAMILIAR_COMBAT_MAX_LEVEL,
  FAMILIAR_COMBAT_SWITCH_ENERGY_COST,
  claimFamiliarCombatReward,
  combatLevelForXp,
  createFamiliarCombatProgress,
  createFamiliarCombatState,
  familiarCombatDamagePreview,
  familiarCombatMove,
  familiarCombatMoveEnergyCost,
  familiarCombatMoveHasCooldown,
  familiarCombatMoveIsBase,
  familiarCombatMoveMaxUses,
  familiarCombatOpponentPreview,
  familiarCombatProgress,
  performFamiliarCombatTurn,
  restoreFamiliarCombatState,
  retreatFromFamiliarCombat,
  startFamiliarCombatBattle,
  switchFamiliarCombatant,
  totalCombatXpForLevel,
} from "../lib/famiglioCombat.ts";
import { COMBAT_MOVES_BY_ID, FAMILIAR_COMBAT_CATALOG, FAMILIAR_COMBAT_CIRCUITS } from "../lib/famiglioCombatCatalog.ts";
import { FAMILIAR_COMBAT_CAMPAIGN, familiarCampaignOpponent } from "../lib/famiglioCombatCampaign.ts";
import { createFamiliarTowerRun } from "../lib/famiglioCombatTower.ts";
import { familiarCombatPresentationCue } from "../lib/famiglioCombatPresentation.ts";
import { familiarCombatPhaseDurationScale, familiarCombatTravelProgress } from "../lib/famiglioCombatMotion.ts";

export const FUZZ_TURN_CAP = 400;
const DIFFICULTIES = ["normal", "expert", "nexus"];
const PATHS = [null, "impeto", "baluardo", "risonanza"];
const ALL_IDS = FAMILIAR_COMBAT_CATALOG.map((entry) => entry.id);
const ALL_MOVE_IDS = Object.keys(COMBAT_MOVES_BY_ID);
const PLACEMENTS = new Set(["actor", "target", "travel", "arena"]);
const PHASES = new Set(["windup", "advance", "projectile", "impact", "guard", "status", "reaction", "return", "result"]);

// ---------------------------------------------------------------- utilità

export function createHarnessRandom(seed) {
  let value = 2166136261;
  for (const char of String(seed)) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  let state = value >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (items) => items[Math.floor(next() * items.length)],
    chance: (probability) => next() < probability,
    shuffle: (items) => {
      const copy = [...items];
      for (let index = copy.length - 1; index > 0; index -= 1) {
        const other = Math.floor(next() * (index + 1));
        [copy[index], copy[other]] = [copy[other], copy[index]];
      }
      return copy;
    },
  };
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) deepFreeze(value[key]);
  }
  return value;
}

function assertFiniteTree(value, path) {
  if (typeof value === "number") assert.ok(Number.isFinite(value), `${path}: numero non finito (${value})`);
  else if (Array.isArray(value)) value.forEach((item, index) => assertFiniteTree(item, `${path}[${index}]`));
  else if (value && typeof value === "object") for (const [key, item] of Object.entries(value)) assertFiniteTree(item, `${path}.${key}`);
}

function profileAt(state, familiarId, level, equippedMoveIds) {
  const base = createFamiliarCombatProgress(familiarId, state.seed);
  return {
    ...base,
    combatLevel: level,
    combatXp: totalCombatXpForLevel(level),
    wins: 30,
    equippedMoveIds: equippedMoveIds ?? base.equippedMoveIds,
  };
}

/** Crea uno stato salvato con i profili richiesti, passando dal restore reale. */
export function combatStateWithProfiles(seed, members) {
  const state = createFamiliarCombatState(seed);
  const profiles = Object.fromEntries(members.map((member) => [member.id, profileAt(state, member.id, member.level, member.equippedMoveIds)]));
  return restoreFamiliarCombatState({ ...state, profiles });
}

function learnedMoveIds(state, familiarId) {
  return familiarCombatProgress(state, familiarId).learnedMoveIds;
}

// ------------------------------------------------------------ regole legali

export function moveIsLegal(state, moveId) {
  const battle = state.activeBattle;
  if (!battle || battle.outcome !== "active") return false;
  const actor = battle.player;
  if (actor.hp <= 0) return false;
  const progress = familiarCombatProgress(state, actor.familiarId);
  if (!progress.equippedMoveIds.includes(moveId)) return false;
  const maxUses = familiarCombatMoveMaxUses(moveId);
  if (maxUses > 0 && (actor.moveUses[moveId] ?? maxUses) <= 0) return false;
  if (actor.energy < familiarCombatMoveEnergyCost(actor.familiarId, moveId)) return false;
  const base = familiarCombatMoveIsBase(actor.familiarId, moveId);
  if (!base && battle.lastPlayerMoveId === moveId && familiarCombatMoveHasCooldown(moveId)) return false;
  if (!base && battle.lastPlayerMoveId === moveId && battle.playerMoveStreak >= 2) return false;
  return true;
}

export function switchIsLegal(state, familiarId) {
  const battle = state.activeBattle;
  if (!battle || battle.outcome !== "active") return false;
  if (battle.switchCooldown > 0 || battle.player.energy < FAMILIAR_COMBAT_SWITCH_ENERGY_COST) return false;
  return battle.playerBench.some((actor) => actor.familiarId === familiarId && actor.hp > 0);
}

function legalMoves(state) {
  const battle = state.activeBattle;
  if (!battle) return [];
  return familiarCombatProgress(state, battle.player.familiarId).equippedMoveIds.filter((moveId) => moveIsLegal(state, moveId));
}

// ---------------------------------------------------------------- politiche

/** Politica avida: massimizza il danno atteso, cura sotto il 40% e usa la guardia quando è in pericolo. */
export function greedyMove(state, random) {
  const battle = state.activeBattle;
  const moves = legalMoves(state);
  if (!moves.length) return null;
  const hpRatio = battle.player.hp / battle.player.maxHp;
  let best = null;
  let bestScore = -Infinity;
  for (const moveId of moves) {
    const move = familiarCombatMove(moveId);
    const kind = move.damageClass;
    let score = familiarCombatDamagePreview(battle.player, battle.opponent, moveId) * Math.min(1, (move.accuracy ?? 100) / 100);
    if (kind === "restore") score = hpRatio < .4 ? 1_000 : -1;
    else if (kind === "status" && move.status === "guard") score = hpRatio < .3 ? 60 : 0;
    else if (kind === "status") score = 4;
    if (score >= battle.opponent.hp && ["physical", "magic"].includes(kind)) score += 500;
    score += random.next() * .01;
    if (score > bestScore) {
      bestScore = score;
      best = moveId;
    }
  }
  return best;
}

function randomAction(state, random, policy) {
  const battle = state.activeBattle;
  const switches = battle.playerBench.filter((actor) => switchIsLegal(state, actor.familiarId)).map((actor) => actor.familiarId);
  if (switches.length && random.chance(policy === "random" ? .18 : battle.player.hp / battle.player.maxHp < .25 ? .35 : .03)) {
    return { type: "switch", id: random.pick(switches) };
  }
  const moveId = policy === "greedy" ? greedyMove(state, random) : random.pick(legalMoves(state));
  return moveId ? { type: "move", id: moveId } : null;
}

// -------------------------------------------------------------- scenari

function randomEquip(random, state, familiarId) {
  const learned = learnedMoveIds(state, familiarId);
  if (random.chance(.5)) return undefined;
  return random.shuffle(learned).slice(0, random.int(1, 4));
}

function scenarioDuel(random, index) {
  const [playerId, opponentId] = random.shuffle(ALL_IDS);
  const level = random.int(1, FAMILIAR_COMBAT_MAX_LEVEL);
  const seed = `fuzz-duel-${index}`;
  let state = combatStateWithProfiles(seed, [{ id: playerId, level }]);
  const equippedMoveIds = randomEquip(random, state, playerId);
  if (equippedMoveIds) state = combatStateWithProfiles(seed, [{ id: playerId, level, equippedMoveIds }]);
  const circuit = random.pick(FAMILIAR_COMBAT_CIRCUITS);
  return {
    kind: "duel",
    state,
    options: {
      playerId,
      opponentId,
      circuitId: circuit.id,
      difficulty: random.pick(DIFFICULTIES),
      opponentLevel: random.chance(.35) ? undefined : Math.max(1, Math.min(50, level + random.int(-8, 8))),
      ignoreUnlocks: true,
      playerStatBonus: random.chance(.3) ? { hp: random.int(0, 40), attack: random.int(0, 12), defense: random.int(0, 12), speed: random.int(0, 12) } : undefined,
      playerEvolutionPath: random.pick(PATHS),
      maxTurns: random.chance(.2) ? random.int(1, 16) : null,
      bossPhases: random.chance(.2) ? random.int(1, 3) : 1,
    },
  };
}

function scenarioTeam(random, index) {
  const ids = random.shuffle(ALL_IDS);
  const team = ids.slice(0, 3);
  const opponents = ids.slice(3, 6);
  const levels = team.map(() => random.int(1, 50));
  const seed = `fuzz-team-${index}`;
  const state = combatStateWithProfiles(seed, team.map((id, slot) => ({ id, level: levels[slot] })));
  return {
    kind: "team",
    state,
    options: {
      playerId: team[0],
      playerTeamIds: team,
      opponentId: opponents[0],
      opponentTeamIds: opponents,
      teamBattle: true,
      circuitId: random.pick(FAMILIAR_COMBAT_CIRCUITS).id,
      difficulty: random.pick(DIFFICULTIES),
      opponentLevel: Math.max(1, Math.min(50, levels[0] + random.int(-6, 6))),
      ignoreUnlocks: true,
      bossPhases: 1,
    },
  };
}

/** Livello che il giocatore ha di norma quando arriva al capitolo: la vittoria precedente porta a opponentLevel + 1. */
export function campaignPlayerLevel(levelNumber) {
  if (levelNumber <= 1) return 1;
  return Math.min(50, FAMILIAR_COMBAT_CAMPAIGN[levelNumber - 2].opponentLevel + 1);
}

/** Opzioni identiche a quelle che FamiglioCombatArena passa al motore per un livello della campagna. */
export function campaignScenario(level, playerId, teamIds, seed, playerLevel = campaignPlayerLevel(level.number)) {
  const team = level.teamBattle ? [playerId, ...teamIds.filter((id) => id !== playerId)].slice(0, 3) : [playerId];
  const state = combatStateWithProfiles(seed, team.map((id) => ({ id, level: playerLevel })));
  const opponentId = familiarCampaignOpponent(level, playerId);
  const opponentTeamIds = [...new Set([opponentId, ...level.opponentIds, ...ALL_IDS])]
    .filter((id) => !team.includes(id)).slice(0, level.teamBattle ? 3 : 1);
  return {
    kind: "campaign",
    state,
    options: {
      playerId,
      playerTeamIds: team,
      opponentId,
      opponentTeamIds,
      circuitId: level.circuitId,
      difficulty: level.difficulty,
      opponentLevel: level.opponentLevel,
      encounterId: level.id,
      ignoreUnlocks: true,
      maxTurns: level.turnLimit,
      bossPhases: level.teamBattle ? 1 : level.bossPhases,
      teamBattle: level.teamBattle,
    },
  };
}

/** Opzioni identiche a quelle della UI per un piano della Torre. */
export function towerScenario(playerId, teamIds, playerLevel, floorNumber, seed) {
  const run = createFamiliarTowerRun(playerId, playerLevel, seed);
  const floor = run.floors[floorNumber - 1];
  const team = floor.teamBattle ? [playerId, ...teamIds.filter((id) => id !== playerId)].slice(0, 3) : [playerId];
  const state = combatStateWithProfiles(`${seed}:state`, team.map((id) => ({ id, level: playerLevel })));
  const opponentTeamIds = [...new Set([floor.opponentId, ...floor.opponentTeamIds, ...ALL_IDS])]
    .filter((id) => !team.includes(id)).slice(0, floor.teamBattle ? 3 : 1);
  return {
    kind: "tower",
    floor,
    state,
    options: {
      playerId,
      playerTeamIds: team,
      opponentId: floor.opponentId,
      opponentTeamIds,
      circuitId: floor.circuitId,
      difficulty: "normal",
      opponentLevel: floor.opponentLevel,
      encounterId: `${run.id}:floor-${floor.floor}`,
      ignoreUnlocks: true,
      bossPhases: 1,
      teamBattle: floor.teamBattle,
    },
  };
}

export function randomScenario(random, index) {
  const roll = random.int(0, 9);
  if (roll <= 3) return scenarioDuel(random, index);
  if (roll <= 5) return scenarioTeam(random, index);
  if (roll <= 7) {
    const level = random.pick(FAMILIAR_COMBAT_CAMPAIGN);
    const team = random.shuffle(ALL_IDS).slice(0, 3);
    return campaignScenario(level, team[0], team, `fuzz-campaign-${index}`, Math.max(1, Math.min(50, campaignPlayerLevel(level.number) + random.int(-3, 6))));
  }
  const team = random.shuffle(ALL_IDS).slice(0, 3);
  return towerScenario(team[0], team, random.int(1, 50), random.int(1, 10), `fuzz-tower-${index}`);
}

// ------------------------------------------------------------ invarianti

function assertActor(actor, label) {
  assert.ok(Number.isInteger(actor.hp) && actor.hp >= 0 && actor.hp <= actor.maxHp, `${label}: HP ${actor.hp}/${actor.maxHp}`);
  assert.ok(Number.isInteger(actor.maxHp) && actor.maxHp > 0, `${label}: HP massimi ${actor.maxHp}`);
  assert.ok(actor.energy >= 0 && actor.energy <= actor.maxEnergy && actor.maxEnergy === FAMILIAR_COMBAT_MAX_ENERGY, `${label}: energia ${actor.energy}`);
  for (const [stat, value] of Object.entries(actor.stats)) assert.ok(Number.isInteger(value) && value >= 1, `${label}: ${stat}=${value}`);
  const ids = actor.statuses.map((status) => status.id);
  assert.equal(new Set(ids).size, ids.length, `${label}: stati duplicati ${ids.join(",")}`);
  for (const status of actor.statuses) {
    assert.ok(Number.isInteger(status.remainingTurns) && status.remainingTurns >= 1 && status.remainingTurns <= 6, `${label}: ${status.id} durata ${status.remainingTurns}`);
    assert.ok(Number.isFinite(status.potency) && status.potency > 0 && status.potency <= 100, `${label}: ${status.id} potenza ${status.potency}`);
  }
  const control = ids.filter((id) => ["freeze", "sleep", "paralysis"].includes(id));
  assert.ok(control.length <= 1, `${label}: più controlli insieme ${control.join(",")}`);
  for (const [moveId, uses] of Object.entries(actor.moveUses)) {
    const max = familiarCombatMoveMaxUses(moveId);
    assert.ok(Number.isInteger(uses) && uses >= 0 && uses <= Math.max(max, 0), `${label}: usi ${moveId}=${uses}/${max}`);
  }
}

function assertBattle(battle, label) {
  assertFiniteTree(battle, label);
  assertActor(battle.player, `${label} giocatore`);
  assertActor(battle.opponent, `${label} avversario`);
  battle.playerBench.forEach((actor, index) => assertActor(actor, `${label} riserva ${index}`));
  battle.opponentBench.forEach((actor, index) => assertActor(actor, `${label} riserva rivale ${index}`));
  const participants = [battle.player, ...battle.playerBench, battle.opponent, ...battle.opponentBench].map((actor) => actor.familiarId);
  assert.equal(new Set(participants).size, participants.length, `${label}: Famiglio duplicato in campo`);
  assert.ok(battle.switchCooldown >= 0 && battle.switchCooldown <= 2, `${label}: cooldown rotazione ${battle.switchCooldown}`);
  assert.ok(battle.playerMoveStreak >= 0 && battle.playerMoveStreak <= 2 && battle.opponentMoveStreak >= 0 && battle.opponentMoveStreak <= 2, `${label}: serie mosse`);
  assert.ok(battle.bossPhasesRemaining >= 1 && battle.bossPhasesRemaining <= battle.bossPhasesTotal, `${label}: fasi boss`);
  assert.ok(Number.isInteger(battle.rngState) && battle.rngState > 0 && battle.rngState <= 0xffffffff, `${label}: rngState ${battle.rngState}`);
  assert.ok(battle.log.length <= 20, `${label}: log troppo lungo`);
  if (battle.outcome === "active") {
    // Un Famiglio KO non deve mai restare in campo in attesa di "agire".
    assert.ok(battle.player.hp > 0, `${label}: giocatore KO ancora in campo`);
    assert.ok(battle.opponent.hp > 0, `${label}: avversario KO ancora in campo`);
  }
}

function assertTimeline(timeline, before, after, label) {
  const participants = new Set([before.player, ...before.playerBench, before.opponent, ...before.opponentBench].map((actor) => actor.familiarId));
  const ids = new Set();
  timeline.forEach((event, index) => {
    assert.equal(event.order, index, `${label}: ordine evento ${index}`);
    assert.ok(!ids.has(event.id), `${label}: id evento duplicato ${event.id}`);
    ids.add(event.id);
    assert.ok(PHASES.has(event.phase), `${label}: fase ${event.phase}`);
    assert.ok(participants.has(event.actorId) && participants.has(event.targetId), `${label}: evento con attore estraneo ${event.actorId}->${event.targetId}`);
    assert.ok(Number.isFinite(event.durationMs) && event.durationMs > 0, `${label}: durata ${event.durationMs}`);
    assert.ok(event.vfxCue && event.audioCue && event.message, `${label}: evento incompleto ${event.id}`);
    if (event.amount !== undefined) assert.ok(Number.isInteger(event.amount) && event.amount >= 0, `${label}: quantità ${event.amount}`);
    const cue = familiarCombatPresentationCue(event);
    assert.ok(PLACEMENTS.has(cue.placement) && Number.isFinite(cue.durationMs) && cue.durationMs > 0, `${label}: cue non valida per ${event.id}`);
    assert.ok(Number.isFinite(familiarCombatPhaseDurationScale(event.actorId)), `${label}: ritmo non finito`);
  });
  // Un attore KO non prepara azioni: si seguono gli HP evento per evento.
  const hp = new Map([before.player, ...before.playerBench, before.opponent, ...before.opponentBench].map((actor) => [actor.familiarId, actor.hp]));
  for (const event of timeline) {
    if (event.phase === "windup") assert.ok((hp.get(event.actorId) ?? 0) > 0, `${label}: ${event.actorId} agisce con 0 HP`);
    const amount = Number(event.amount) || 0;
    if ((event.phase === "reaction" && ["physical", "magic"].includes(event.actionKind)) || (event.phase === "status" && ["burn", "poison"].includes(event.statusId ?? ""))) {
      hp.set(event.targetId, Math.max(0, (hp.get(event.targetId) ?? 0) - amount));
    }
    if (event.phase === "status" && event.actionKind === "heal") hp.set(event.targetId, (hp.get(event.targetId) ?? 0) + amount);
  }
}

/** Ricostruisce gli HP come fa la UI (FamiglioCombatArena.updateHealthForEvent) e li confronta con lo stato finale. */
function assertUiHealthReplay(timeline, before, after, label) {
  const health = { player: before.player.hp, opponent: before.opponent.hp };
  for (const event of timeline) {
    const amount = Math.max(0, Number(event.amount) || 0);
    if (!amount) continue;
    const key = event.targetId === before.player.familiarId ? "player" : event.targetId === before.opponent.familiarId ? "opponent" : null;
    if (!key) continue;
    const maximum = before[key].maxHp;
    const healing = event.actionKind === "heal";
    const damage = (event.phase === "reaction" && ["physical", "magic"].includes(event.actionKind))
      || (event.phase === "status" && ["burn", "poison"].includes(event.statusId ?? ""));
    if (healing) health[key] = Math.min(maximum, health[key] + amount);
    else if (damage) health[key] = Math.max(0, health[key] - amount);
  }
  const bossReset = timeline.some((event) => event.moveId === "boss-phase");
  for (const key of ["player", "opponent"]) {
    const finalActor = [after[key], ...(key === "player" ? after.playerBench : after.opponentBench)].find((actor) => actor.familiarId === before[key].familiarId);
    if (!finalActor || (key === "opponent" && bossReset)) continue;
    assert.equal(health[key], finalActor.hp, `${label}: la UI mostrerebbe ${health[key]} HP per ${before[key].familiarId}, il motore ${finalActor.hp}`);
  }
}

function sameActiveActor(before, after, side) {
  return after[side].familiarId === before[side].familiarId;
}

/** Controlla energia, usi e durata degli stati per ogni attore rimasto in campo durante il turno. */
function assertTurnAccounting(timeline, before, after, label) {
  const bossReset = timeline.some((event) => event.moveId === "boss-phase");
  for (const side of ["player", "opponent"]) {
    if (!sameActiveActor(before, after, side)) continue;
    if (side === "opponent" && bossReset) continue;
    const previous = before[side];
    const current = after[side];
    const windups = timeline.filter((event) => event.phase === "windup" && event.actorId === previous.familiarId);
    assert.ok(windups.length <= 1, `${label}: ${side} agisce due volte`);
    const moveId = windups[0]?.moveId;
    const cost = moveId ? familiarCombatMoveEnergyCost(previous.familiarId, moveId) : 0;
    if (after.outcome === "active") {
      assert.equal(current.energy, Math.min(FAMILIAR_COMBAT_MAX_ENERGY, previous.energy - cost + FAMILIAR_COMBAT_ENERGY_REGEN), `${label}: energia ${side}`);
    }
    for (const [id, uses] of Object.entries(current.moveUses)) {
      const expected = (previous.moveUses[id] ?? familiarCombatMoveMaxUses(id)) - (id === moveId && familiarCombatMoveMaxUses(id) > 0 ? 1 : 0);
      if (id in previous.moveUses || id === moveId) assert.equal(uses, Math.max(0, expected), `${label}: usi ${id}`);
    }
    if (after.outcome !== "active") continue;
    for (const status of current.statuses) {
      const old = previous.statuses.find((candidate) => candidate.id === status.id);
      const evidence = timeline.some((event) => event.statusId === status.id && ["status", "guard"].includes(event.phase));
      if (!old) assert.ok(evidence, `${label}: stato ${status.id} comparso senza evento`);
      else if (status.remainingTurns >= old.remainingTurns) assert.ok(evidence, `${label}: stato ${status.id} non scala (${old.remainingTurns}->${status.remainingTurns})`);
      else assert.equal(status.remainingTurns, old.remainingTurns - 1, `${label}: stato ${status.id} scala di più turni`);
    }
    for (const old of previous.statuses) {
      if (current.statuses.some((status) => status.id === old.id)) continue;
      const replaced = timeline.some((event) => event.statusId && ["status", "guard"].includes(event.phase) && event.targetId === previous.familiarId);
      assert.ok(old.remainingTurns === 1 || old.id === "ward" || replaced, `${label}: stato ${old.id} sparito con ${old.remainingTurns} turni`);
    }
  }
  if (after.outcome === "active") {
    const relay = timeline.some((event) => event.moveId === "team-relay" && after.player.familiarId !== before.player.familiarId);
    assert.equal(after.switchCooldown, relay ? 1 : Math.max(0, before.switchCooldown - 1), `${label}: cooldown rotazione`);
    assert.equal(after.turn, before.turn + 1, `${label}: turno non avanzato di uno`);
  }
}

function assertIllegalRejected(state, attempt, label) {
  const result = attempt();
  assert.equal(result.ok, false, `${label}: azione illegale accettata`);
  assert.equal(result.state, state, `${label}: il rifiuto ha modificato lo stato`);
  assert.ok(typeof result.error === "string" && result.error.length > 0, `${label}: errore mancante`);
}

function probeIllegal(state, random, stats) {
  const battle = state.activeBattle;
  const progress = familiarCombatProgress(state, battle.player.familiarId);
  const notEquipped = ALL_MOVE_IDS.filter((id) => !progress.equippedMoveIds.includes(id));
  assertIllegalRejected(state, () => performFamiliarCombatTurn(state, random.pick(notEquipped)), "mossa non equipaggiata");
  assertIllegalRejected(state, () => performFamiliarCombatTurn(state, "mossa-inesistente"), "mossa inesistente");
  for (const moveId of progress.equippedMoveIds) {
    const legal = moveIsLegal(state, moveId);
    const result = performFamiliarCombatTurn(state, moveId);
    assert.equal(result.ok, legal, `mossa ${moveId}: motore ${result.ok} ma regole ${legal} (${result.error ?? ""})`);
    if (!legal) {
      assert.equal(result.state, state);
      stats.illegalRejected += 1;
    }
  }
  for (const member of [...battle.playerBench, battle.player, battle.opponent]) {
    const legal = switchIsLegal(state, member.familiarId);
    const result = switchFamiliarCombatant(state, member.familiarId);
    assert.equal(result.ok, legal, `rotazione ${member.familiarId}: motore ${result.ok} ma regole ${legal}`);
    if (!legal) {
      assert.equal(result.state, state);
      stats.illegalRejected += 1;
    }
  }
  stats.illegalRejected += 2;
}

// ---------------------------------------------------------------- battaglia

/** Esegue una sequenza di azioni da uno stato iniziale (usata per il determinismo). */
export function replayActions(startState, options, actions) {
  let state = startFamiliarCombatBattle(startState, options).state;
  for (const action of actions) {
    const result = action.type === "switch" ? switchFamiliarCombatant(state, action.id) : performFamiliarCombatTurn(state, action.id);
    assert.equal(result.ok, true, `replay: ${result.error}`);
    state = result.state;
  }
  return state;
}

function normalizedForCompare(state) {
  return JSON.parse(JSON.stringify({ ...state, lastTimeline: [], activeBattle: state.activeBattle ? { ...state.activeBattle, timeline: [] } : null }));
}

export function playBattle(scenario, random, policy, stats, checks = {}) {
  const deep = checks.deep !== false;
  // strict=false serve solo a confrontare il bilanciamento con versioni precedenti del motore.
  const strict = checks.strict !== false;
  const started = startFamiliarCombatBattle(deepFreeze(scenario.state), scenario.options);
  assert.equal(started.ok, true, `avvio ${scenario.kind}: ${started.error}`);
  let state = started.state;
  const leadId = scenario.options.playerId;
  const leadBefore = familiarCombatProgress(scenario.state, leadId);
  if (strict) assertBattle(state.activeBattle, `${scenario.kind} inizio`);
  const actions = [];
  let turns = 0;
  let restored = 0;
  while (state.activeBattle?.outcome === "active") {
    assert.ok(turns < FUZZ_TURN_CAP, `${scenario.kind}: nessuna conclusione entro ${FUZZ_TURN_CAP} turni`);
    deepFreeze(state);
    if (deep && random.chance(.25)) probeIllegal(state, random, stats);
    const moves = legalMoves(state);
    if (strict) assert.ok(moves.length > 0, `${scenario.kind}: nessuna mossa legale per ${state.activeBattle.player.familiarId} (soft-lock) energia ${state.activeBattle.player.energy} mosse ${familiarCombatProgress(state, state.activeBattle.player.familiarId).equippedMoveIds.join(",")}`);
    if (deep && random.chance(.12)) {
      const round = restoreFamiliarCombatState(JSON.parse(JSON.stringify(state)));
      assert.deepEqual(normalizedForCompare(round), normalizedForCompare(state), `${scenario.kind}: il salvataggio non è stabile`);
      state = round;
      restored += 1;
      stats.roundTrips += 1;
    }
    if (checks.retreat && random.chance(checks.retreat)) {
      const retreated = retreatFromFamiliarCombat(deepFreeze(state));
      const after = familiarCombatProgress(retreated, leadId);
      assert.equal(after.combatXp, leadBefore.combatXp, "la ritirata non deve dare XP");
      assert.equal(after.losses, leadBefore.losses + 1);
      assert.equal(retreated.pendingReward, null);
      assert.equal(retreated.activeBattle.outcome, "defeat");
      stats.retreats += 1;
      return { state: retreated, turns, outcome: "retreat", actions };
    }
    const action = randomAction(state, random, policy) ?? (strict ? null : { type: "move", id: familiarCombatProgress(state, state.activeBattle.player.familiarId).equippedMoveIds[0] });
    assert.ok(action, "nessuna azione disponibile");
    const before = state.activeBattle;
    const result = action.type === "switch" ? switchFamiliarCombatant(state, action.id) : performFamiliarCombatTurn(state, action.id);
    assert.equal(result.ok, true, `${action.type} ${action.id}: ${result.error}`);
    actions.push(action);
    if (action.type === "switch") {
      stats.switches += 1;
      assert.equal(result.state.activeBattle.player.familiarId, action.id);
      assert.equal(result.state.activeBattle.switchCooldown, 2);
      assert.equal(result.state.activeBattle.turn, before.turn, "la rotazione non consuma il turno");
      state = result.state;
      if (strict) assertBattle(state.activeBattle, `${scenario.kind} dopo rotazione`);
      continue;
    }
    turns += 1;
    stats.turns += 1;
    stats.events += result.timeline.length;
    const after = result.state.activeBattle;
    if (strict) {
      assertBattle(after, `${scenario.kind} turno ${before.turn}`);
      assertTimeline(result.timeline, before, after, `${scenario.kind} turno ${before.turn}`);
      assertUiHealthReplay(result.timeline, before, after, `${scenario.kind} turno ${before.turn}`);
      assertTurnAccounting(result.timeline, before, after, `${scenario.kind} turno ${before.turn}`);
    }
    for (const event of result.timeline) {
      if (event.phase === "windup" && event.actorId === before.opponent.familiarId) {
        stats.opponentMoves.set(event.moveId, (stats.opponentMoves.get(event.moveId) ?? 0) + 1);
      }
    }
    if (result.opponentMoveId && before.opponent.familiarId === after.opponent.familiarId) {
      const preview = familiarCombatOpponentPreview({ playerId: leadId === before.opponent.familiarId ? "cat" : leadId, opponentId: before.opponent.familiarId, circuitId: after.circuitId, difficulty: after.difficulty, opponentLevel: before.opponent.level });
      if (preview && !preview.moveIds.includes(result.opponentMoveId)) stats.opponentOutsideLoadout += 1;
    }
    state = result.state;
  }
  const battle = state.activeBattle;
  assert.ok(battle.resultApplied, "risultato non applicato");
  assert.ok(battle.timeline.some((event) => event.phase === "result") || battle.outcome !== "active");
  const lead = familiarCombatProgress(state, leadId);
  assert.equal(lead.battlesCompleted, leadBefore.battlesCompleted + 1, "battaglie concluse");
  assert.equal(lead.wins + lead.losses, leadBefore.wins + leadBefore.losses + 1, "vittorie/sconfitte");
  assert.ok(lead.combatXp > leadBefore.combatXp, "una battaglia conclusa assegna XP");
  assert.equal(lead.combatLevel, combatLevelForXp(lead.combatXp));
  assert.ok(lead.combatLevel >= leadBefore.combatLevel && lead.combatLevel <= FAMILIAR_COMBAT_MAX_LEVEL);
  assert.ok(lead.equippedMoveIds.length >= 1 && lead.equippedMoveIds.length <= 4);
  for (const memberId of battle.teamFamiliarIds) {
    const member = familiarCombatProgress(state, memberId);
    assert.ok(member.combatXp >= familiarCombatProgress(scenario.state, memberId).combatXp);
  }
  const reward = state.pendingReward;
  if (reward) {
    assert.equal(battle.outcome, "victory");
    assert.equal(reward.familiarId, leadId, "premio assegnato al Famiglio sbagliato");
    assertFiniteTree(reward, "premio");
    for (const key of ["combatXp", "nexusCoins", "nightSigils", "relicFragments"]) assert.ok(Number.isInteger(reward[key]) && reward[key] >= 0, `premio ${key}=${reward[key]}`);
    assert.ok(reward.nexusCoins <= 65 * 1.8 + 1 && reward.nightSigils <= 11 && reward.relicFragments <= 9, `premio fuori scala ${JSON.stringify(reward)}`);
    assert.ok(reward.combatXp <= totalCombatXpForLevel(50), "XP premio fuori scala");
    const claimed = claimFamiliarCombatReward(deepFreeze(state));
    assert.equal(claimed.ok, true);
    assert.equal(claimFamiliarCombatReward(claimed.state).ok, false, "premio riscattabile due volte");
    stats.rewards += 1;
  }
  // Dopo la fine nessuna azione deve essere accettata.
  assertIllegalRejected(state, () => performFamiliarCombatTurn(state, lead.equippedMoveIds[0]), "mossa a battaglia finita");
  if (battle.playerBench[0]) assertIllegalRejected(state, () => switchFamiliarCombatant(state, battle.playerBench[0].familiarId), "rotazione a battaglia finita");
  assert.equal(retreatFromFamiliarCombat(state), state, "ritirata a battaglia finita");
  if (deep) {
    const replayed = replayActions(scenario.state, scenario.options, actions);
    if (!restored) assert.deepEqual(normalizedForCompare(replayed), normalizedForCompare(state), `${scenario.kind}: battaglia non deterministica`);
    else assert.equal(replayed.activeBattle.outcome, battle.outcome, `${scenario.kind}: esito diverso dopo il restore`);
    stats.replays += 1;
  }
  stats.maxTurns = Math.max(stats.maxTurns, turns);
  return { state, turns, outcome: battle.outcome, actions };
}

// ----------------------------------------------------------------- fuzz

export function runFamiliarCombatFuzz({ battles = 3000, seed = "fuzz" } = {}) {
  const random = createHarnessRandom(seed);
  const stats = {
    battles: 0, turns: 0, events: 0, switches: 0, retreats: 0, roundTrips: 0, replays: 0, rewards: 0,
    illegalRejected: 0, maxTurns: 0, opponentOutsideLoadout: 0, byKind: {}, outcomes: {}, opponentMoves: new Map(),
  };
  for (let index = 0; index < battles; index += 1) {
    const scenario = randomScenario(random, index);
    const policy = random.chance(.5) ? "random" : "greedy";
    let played;
    try {
      played = playBattle(scenario, random, policy, stats, { retreat: .004 });
    } catch (error) {
      error.message = `[battaglia ${index} ${scenario.kind} ${policy} ${JSON.stringify(scenario.options)}] ${error.message}`;
      throw error;
    }
    stats.battles += 1;
    stats.byKind[scenario.kind] = (stats.byKind[scenario.kind] ?? 0) + 1;
    stats.outcomes[played.outcome] = (stats.outcomes[played.outcome] ?? 0) + 1;
  }
  // Curve di movimento: sempre finite e delimitate, anche con input non numerici.
  for (const id of ALL_IDS) for (const progress of [Number.NaN, -Infinity, -1, 0, .37, 1, 5, Infinity]) {
    const value = familiarCombatTravelProgress(id, progress);
    assert.ok(Number.isFinite(value) && value >= 0 && value <= 1, `curva ${id}(${progress}) = ${value}`);
  }
  const { opponentMoves, ...summary } = stats;
  return { ...summary, distinctOpponentMoves: opponentMoves.size, closedCleanly: true };
}

// --------------------------------------------------------------- bilanciamento

function winRate(wins, total) {
  return total ? Math.round(wins / total * 1000) / 10 : 0;
}

function simulateQuick(scenario, random, strict = true) {
  const stats = { turns: 0, events: 0, switches: 0, retreats: 0, roundTrips: 0, replays: 0, rewards: 0, illegalRejected: 0, maxTurns: 0, opponentOutsideLoadout: 0, opponentMoves: new Map() };
  const played = playBattle(scenario, random, "greedy", stats, { deep: false, strict });
  return { ...played, stats };
}

export function runFamiliarCombatBalance({ seed = "balance", seeds = 1, levels = [10, 30, 50], strict = true } = {}) {
  const random = createHarnessRandom(seed);
  const species = Object.fromEntries(ALL_IDS.map((id) => [id, { asPlayerWins: 0, asPlayerGames: 0, asOpponentWins: 0, asOpponentGames: 0 }]));
  const playerMoveUse = new Map();
  let turnsTotal = 0;
  let games = 0;
  for (const level of levels) for (const playerId of ALL_IDS) for (const opponentId of ALL_IDS) {
    if (playerId === opponentId) continue;
    for (let copy = 0; copy < seeds; copy += 1) {
      const state = combatStateWithProfiles(`balance-${level}-${playerId}-${opponentId}-${copy}`, [{ id: playerId, level }]);
      const scenario = { kind: "mirror", state, options: { playerId, opponentId, circuitId: "prime-orme", difficulty: "normal", opponentLevel: level, ignoreUnlocks: true } };
      const played = simulateQuick(scenario, random, strict);
      for (const action of played.actions) if (action.type === "move") playerMoveUse.set(action.id, (playerMoveUse.get(action.id) ?? 0) + 1);
      const won = played.outcome === "victory";
      species[playerId].asPlayerGames += 1;
      species[opponentId].asOpponentGames += 1;
      if (won) species[playerId].asPlayerWins += 1;
      else species[opponentId].asOpponentWins += 1;
      turnsTotal += played.turns;
      games += 1;
    }
  }
  const speciesRows = Object.entries(species).map(([id, row]) => ({
    id,
    player: winRate(row.asPlayerWins, row.asPlayerGames),
    opponent: winRate(row.asOpponentWins, row.asOpponentGames),
    overall: winRate(row.asPlayerWins + row.asOpponentWins, row.asPlayerGames + row.asOpponentGames),
  })).sort((left, right) => right.overall - left.overall);

  const campaign = FAMILIAR_COMBAT_CAMPAIGN.map((level) => {
    let wins = 0;
    let total = 0;
    let turns = 0;
    const losers = [];
    for (const playerId of ALL_IDS) {
      const team = [playerId, ...random.shuffle(ALL_IDS.filter((id) => id !== playerId)).slice(0, 2)];
      const scenario = campaignScenario(level, playerId, team, `campaign-balance-${level.id}-${playerId}`);
      const played = simulateQuick(scenario, random, strict);
      total += 1;
      turns += played.turns;
      if (played.outcome === "victory") wins += 1;
      else losers.push(playerId);
    }
    return { level: level.number, playerLevel: campaignPlayerLevel(level.number), opponentLevel: level.opponentLevel, difficulty: level.difficulty, team: level.teamBattle, turnLimit: level.turnLimit, bossPhases: level.bossPhases, winRate: winRate(wins, total), avgTurns: Math.round(turns / total * 10) / 10, sampleLosers: losers.slice(0, 5) };
  });

  const tower = [5, 20, 35, 50].map((playerLevel) => {
    const floors = Array.from({ length: 10 }, () => ({ wins: 0, total: 0 }));
    for (const playerId of ALL_IDS) {
      const team = [playerId, ...random.shuffle(ALL_IDS.filter((id) => id !== playerId)).slice(0, 2)];
      for (let floor = 1; floor <= 10; floor += 1) {
        const scenario = towerScenario(playerId, team, playerLevel, floor, `tower-balance-${playerLevel}-${playerId}`);
        const played = simulateQuick(scenario, random, strict);
        floors[floor - 1].total += 1;
        if (played.outcome === "victory") floors[floor - 1].wins += 1;
      }
    }
    return { playerLevel, floors: floors.map((entry) => winRate(entry.wins, entry.total)) };
  });

  const moveRows = [...playerMoveUse.entries()].map(([id, uses]) => ({ id, uses })).sort((left, right) => right.uses - left.uses);
  const everyMove = ALL_MOVE_IDS.filter((id) => !playerMoveUse.has(id));
  return {
    games,
    avgTurns: Math.round(turnsTotal / games * 10) / 10,
    strongest: speciesRows.slice(0, 8),
    weakest: speciesRows.slice(-8),
    spread: Math.round((speciesRows[0].overall - speciesRows.at(-1).overall) * 10) / 10,
    mostUsedMoves: moveRows.slice(0, 6),
    neverChosenByGreedy: everyMove.length,
    campaign,
    tower,
  };
}

const RARITY_GROUPS = ["comune", "raro", "epico", "leggendario"].map((rarity) => [rarity, FAMILIAR_COMBAT_CATALOG.filter((entry) => entry.rarity === rarity).map((entry) => entry.id)]);

/**
 * Vittorie per rarità del Famiglio del giocatore in ogni capitolo della storia,
 * al livello che la storia stessa assegna (livello del rivale precedente + 1).
 */
export function runFamiliarCampaignBalance({ seed = "campaign-balance", copies = 3, levelOffset = 0 } = {}) {
  const random = createHarnessRandom(seed);
  return FAMILIAR_COMBAT_CAMPAIGN.map((level) => {
    const row = { stage: level.number, playerLevel: Math.min(50, campaignPlayerLevel(level.number) + levelOffset), rival: level.opponentLevel, difficulty: level.difficulty, objective: level.objective, turnLimit: level.turnLimit, team: level.teamBattle };
    let turns = 0;
    let games = 0;
    for (const [rarity, members] of RARITY_GROUPS) {
      let wins = 0;
      let total = 0;
      for (const playerId of members) for (let copy = 0; copy < copies; copy += 1) {
        const team = [playerId, ...random.shuffle(ALL_IDS.filter((id) => id !== playerId)).slice(0, 2)];
        const scenario = campaignScenario(level, playerId, team, `campaign-${level.id}-${playerId}-${copy}-${levelOffset}`, row.playerLevel);
        const played = simulateQuick(scenario, random);
        total += 1;
        turns += played.turns;
        games += 1;
        if (played.outcome === "victory") wins += 1;
      }
      row[rarity] = winRate(wins, total);
    }
    row.avgTurns = Math.round(turns / games * 10) / 10;
    return row;
  });
}

/** Vittorie per rarità del giocatore sui dieci piani della Torre al livello suggerito (quello del giocatore). */
export function runFamiliarTowerBalance({ seed = "tower-balance", levels = [5, 20, 35, 50], copies = 1 } = {}) {
  const random = createHarnessRandom(seed);
  const rows = [];
  for (const playerLevel of levels) for (const [rarity, members] of RARITY_GROUPS) {
    const floors = Array.from({ length: 10 }, () => [0, 0]);
    for (const playerId of members) for (let copy = 0; copy < copies; copy += 1) {
      const team = [playerId, ...random.shuffle(ALL_IDS.filter((id) => id !== playerId)).slice(0, 2)];
      for (let floor = 1; floor <= 10; floor += 1) {
        const played = simulateQuick(towerScenario(playerId, team, playerLevel, floor, `tower-${playerLevel}-${playerId}-${copy}`), random);
        floors[floor - 1][1] += 1;
        if (played.outcome === "victory") floors[floor - 1][0] += 1;
      }
    }
    rows.push({ playerLevel, rarity, floors: floors.map(([wins, total]) => winRate(wins, total)) });
  }
  return rows;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  const argument = (name, fallback) => {
    const index = process.argv.indexOf(`--${name}`);
    return index >= 0 ? process.argv[index + 1] : fallback;
  };
  const startedAt = performance.now();
  const fuzz = runFamiliarCombatFuzz({ battles: Number(argument("battles", 3000)), seed: argument("seed", "fuzz") });
  console.log(JSON.stringify({ fuzz, durationMs: Math.round(performance.now() - startedAt) }, null, 2));
  if (process.argv.includes("--campaign")) console.table(runFamiliarCampaignBalance({ copies: Number(argument("copies", 3)), levelOffset: Number(argument("offset", 0)) }));
  if (process.argv.includes("--tower")) for (const row of runFamiliarTowerBalance({ copies: Number(argument("copies", 1)) })) console.log(row.playerLevel, row.rarity.padEnd(12), row.floors.join(" "));
  if (process.argv.includes("--balance")) {
    const balanceStart = performance.now();
    const balance = runFamiliarCombatBalance({ seeds: Number(argument("seeds", 1)), strict: !process.argv.includes("--lenient") });
    console.log(JSON.stringify({ balance, durationMs: Math.round(performance.now() - balanceStart) }, null, 2));
  }
}
