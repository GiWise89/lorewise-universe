// Regressioni trovate dall'audit del motore di combattimento (fuzz in
// scripts/fuzz-famiglio-combat.mjs). Ogni test fallisce sul motore precedente.
import assert from "node:assert/strict";
import test from "node:test";
import {
  createFamiliarCombatProgress,
  createFamiliarCombatState,
  equipFamiliarCombatMove,
  familiarCombatDamagePreview,
  familiarCombatOpponentPreview,
  familiarCombatProgress,
  performFamiliarCombatTurn,
  restoreFamiliarCombatState,
  startFamiliarCombatBattle,
  switchFamiliarCombatant,
  totalCombatXpForLevel,
} from "../lib/famiglioCombat.ts";
import { FAMILIAR_COMBAT_CATALOG } from "../lib/famiglioCombatCatalog.ts";
import { familiarCombatTravelProgress } from "../lib/famiglioCombatMotion.ts";
import { createFamiliarTowerRun } from "../lib/famiglioCombatTower.ts";

const entryOf = (id) => FAMILIAR_COMBAT_CATALOG.find((entry) => entry.id === id);
const baseMoveOf = (id) => entryOf(id).initialMoveIds[0];
const moveOf = (id, index) => entryOf(id).moves[index].id;

function stateWith(members, seed = "regressions") {
  const state = createFamiliarCombatState(seed);
  const profiles = Object.fromEntries(members.map(({ id, level, equippedMoveIds }) => {
    const base = createFamiliarCombatProgress(id, state.seed);
    return [id, { ...base, combatLevel: level, combatXp: totalCombatXpForLevel(level), wins: 30, equippedMoveIds: equippedMoveIds ?? base.equippedMoveIds }];
  }));
  return restoreFamiliarCombatState({ ...state, profiles });
}

function start(state, options) {
  const started = startFamiliarCombatBattle(state, { circuitId: "prime-orme", ignoreUnlocks: true, opponentLevel: 8, ...options });
  assert.equal(started.ok, true, started.error);
  return started.state;
}

function withBattle(state, patch) {
  return { ...state, activeBattle: { ...state.activeBattle, ...patch(state.activeBattle) } };
}

const poison = (potency) => ({ id: "poison", name: "Veleno", remainingTurns: 3, potency, sourceMoveId: "test-poison" });
const TEAM = { playerId: "cat", playerTeamIds: ["cat", "rabbit", "bird"], opponentId: "golden", opponentTeamIds: ["golden", "fox", "wolf"], teamBattle: true };

test("KO contemporanei: entrambi i lati vengono sostituiti nello stesso turno", () => {
  let state = start(stateWith([{ id: "cat", level: 20 }, { id: "rabbit", level: 20 }, { id: "bird", level: 20 }]), TEAM);
  state = withBattle(state, (battle) => ({
    player: { ...battle.player, hp: 1, statuses: [poison(50)] },
    opponent: { ...battle.opponent, hp: 0, statuses: [] },
  }));
  const result = performFamiliarCombatTurn(state, baseMoveOf("cat"));
  assert.equal(result.ok, true, result.error);
  const battle = result.state.activeBattle;
  assert.equal(battle.outcome, "active");
  assert.equal(battle.opponent.familiarId, "fox");
  assert.equal(battle.player.familiarId, "rabbit", "il Famiglio KO per veleno deve uscire subito, non restare in campo a 0 HP");
  assert.ok(battle.player.hp > 0);
  assert.equal(battle.playerBench.find((actor) => actor.familiarId === "cat").hp, 0);
  assert.equal(result.timeline.filter((event) => event.moveId === "team-relay").length, 2);
});

test("KO del giocatore durante il cambio di fase del boss: sconfitta immediata", () => {
  let state = start(stateWith([{ id: "cat", level: 20 }]), { playerId: "cat", opponentId: "golden", bossPhases: 2 });
  state = withBattle(state, (battle) => ({
    player: { ...battle.player, hp: 1, statuses: [poison(50)] },
    opponent: { ...battle.opponent, hp: 0, statuses: [] },
  }));
  const result = performFamiliarCombatTurn(state, baseMoveOf("cat"));
  assert.equal(result.ok, true, result.error);
  assert.equal(result.state.activeBattle.outcome, "defeat", "prima la battaglia restava attiva con il giocatore a 0 HP");
});

test("il salvataggio conserva capofila e ordine delle squadre dopo rotazioni e staffette", () => {
  let state = start(stateWith([{ id: "cat", level: 20 }, { id: "rabbit", level: 20 }, { id: "bird", level: 20 }]), TEAM);
  const rotated = switchFamiliarCombatant(state, "rabbit");
  assert.equal(rotated.ok, true, rotated.error);
  state = withBattle(rotated.state, (battle) => ({ opponent: { ...battle.opponent, hp: 0, statuses: [] } }));
  const relayed = performFamiliarCombatTurn(state, baseMoveOf("rabbit"));
  assert.equal(relayed.ok, true, relayed.error);
  const restored = restoreFamiliarCombatState(JSON.parse(JSON.stringify(relayed.state)));
  assert.deepEqual(restored.activeBattle.teamFamiliarIds, ["cat", "rabbit", "bird"]);
  assert.deepEqual(restored.activeBattle.opponentTeamFamiliarIds, ["golden", "fox", "wolf"]);
  const finished = withBattle(restored, (battle) => ({
    opponent: { ...battle.opponent, hp: 0 },
    opponentBench: battle.opponentBench.map((actor) => ({ ...actor, hp: 0 })),
  }));
  const won = performFamiliarCombatTurn(finished, baseMoveOf(finished.activeBattle.player.familiarId));
  assert.equal(won.ok, true, won.error);
  assert.equal(won.state.activeBattle.outcome, "victory");
  assert.equal(won.state.pendingReward.familiarId, "cat", "premio e vittoria spettano al capofila, non al Famiglio in campo");
  assert.equal(familiarCombatProgress(won.state, "cat").wins, 31);
  assert.ok(familiarCombatProgress(won.state, "cat").completedEncounters.includes("prime-orme:normal:golden"), "la chiave dell'incontro 3 contro 3 è quella del titolare rivale");
});

test("un gelo inflitto da chi agisce per secondo blocca comunque la prossima azione", () => {
  const freezeMove = moveOf("husky", 6);
  const base = stateWith([{ id: "husky", level: 50, equippedMoveIds: [baseMoveOf("husky"), freezeMove] }]);
  let found = null;
  for (let rngState = 1; rngState <= 3_000 && !found; rngState += 1) {
    const state = withBattle(start(base, { playerId: "husky", opponentId: "turtle", opponentLevel: 5 }), (battle) => ({
      turn: 2,
      rngState,
      opponent: { ...battle.opponent, hp: 9_999, maxHp: 9_999, stats: { ...battle.opponent.stats, speed: 999 } },
    }));
    const result = performFamiliarCombatTurn(state, freezeMove);
    assert.equal(result.ok, true, result.error);
    const opponentActedFirst = result.timeline.findIndex((event) => event.actorId === "turtle" && event.phase === "windup")
      < result.timeline.findIndex((event) => event.actorId === "husky" && event.phase === "windup");
    if (opponentActedFirst && result.timeline.some((event) => event.statusId === "freeze" && event.targetId === "turtle")) found = result;
  }
  assert.ok(found, "serve un turno deterministico con gelo inflitto per secondo");
  const frozen = found.state.activeBattle.opponent.statuses.find((status) => status.id === "freeze");
  assert.ok(frozen, "prima il gelo scadeva a fine turno senza aver bloccato nulla");
  const next = performFamiliarCombatTurn(found.state, baseMoveOf("husky"));
  assert.equal(next.ok, true, next.error);
  assert.ok(next.timeline.some((event) => event.actorId === "turtle" && event.statusId === "freeze" && /gelo/.test(event.message)));
  assert.equal(next.timeline.some((event) => event.actorId === "turtle" && event.phase === "windup"), false);
  assert.equal(next.state.activeBattle.opponent.statuses.some((status) => status.id === "freeze"), false);
});

test("Sigillo stellare non può essere schivato e la Concentrazione arriva alla mossa successiva", () => {
  const sigil = "affinity-arcano-sigillo";
  const base = stateWith([{ id: "wolf", level: 50, equippedMoveIds: [baseMoveOf("wolf"), sigil] }]);
  for (let rngState = 1; rngState <= 120; rngState += 1) {
    const state = withBattle(start(base, { playerId: "wolf", opponentId: "cat", opponentLevel: 50 }), (battle) => ({
      turn: 2,
      rngState,
      opponent: { ...battle.opponent, hp: 9_999, maxHp: 9_999 },
    }));
    const result = performFamiliarCombatTurn(state, sigil);
    assert.equal(result.ok, true, result.error);
    const ownEvents = result.timeline.filter((event) => event.moveId === sigil);
    assert.equal(ownEvents.some((event) => event.missed), false, `seed ${rngState}: potenziamento schivato`);
    assert.equal(ownEvents.some((event) => event.phase === "impact"), false, "un potenziamento su se stessi non colpisce il rivale");
    if (result.state.activeBattle?.outcome !== "active" || !result.timeline.some((event) => event.actorId === "wolf" && event.phase === "windup")) continue;
    const focus = result.state.activeBattle.player.statuses.find((status) => status.id === "focus");
    assert.ok(focus, `seed ${rngState}: la Concentrazione scadeva nello stesso turno in cui veniva lanciata`);
    const next = performFamiliarCombatTurn(result.state, baseMoveOf("wolf"));
    assert.equal(next.ok, true, next.error);
    if (next.state.activeBattle.outcome === "active") assert.equal(next.state.activeBattle.player.statuses.some((status) => status.id === "focus"), false);
  }
});

test("la mossa base gratuita resta sempre equipaggiata: niente soft-lock senza energia", () => {
  const cat = entryOf("cat");
  const expensive = [cat.ultimateMoveId, moveOf("cat", 6), moveOf("cat", 5), moveOf("cat", 4)];
  const state = stateWith([{ id: "cat", level: 50, equippedMoveIds: expensive }]);
  const equipped = familiarCombatProgress(state, "cat").equippedMoveIds;
  assert.equal(equipped.length, 4);
  assert.ok(equipped.includes(baseMoveOf("cat")), "un salvataggio senza mossa base viene riparato");
  const slot = equipped.indexOf(baseMoveOf("cat"));
  const replaced = equipFamiliarCombatMove(state, "cat", moveOf("cat", 3), slot);
  assert.equal(replaced.ok, false);
  assert.match(replaced.error, /mossa base/i);
  let battle = start(state, { playerId: "cat", opponentId: "golden" });
  battle = withBattle(battle, (active) => ({ player: { ...active.player, energy: 0 } }));
  const turn = performFamiliarCombatTurn(battle, baseMoveOf("cat"));
  assert.equal(turn.ok, true, turn.error);
});

test("il loadout dell'IA include la mossa base e l'IA non usa mosse fuori dall'anteprima", () => {
  for (const opponent of FAMILIAR_COMBAT_CATALOG) {
    const playerId = opponent.id === "cat" ? "bird" : "cat";
    const preview = familiarCombatOpponentPreview({ playerId, opponentId: opponent.id, circuitId: "soglia-leggendaria", difficulty: "nexus", opponentLevel: 50 });
    assert.equal(preview.moveIds.length, 4);
    assert.equal(preview.moveIds[0], opponent.initialMoveIds[0], `${opponent.id}: mossa base assente dalle mosse osservabili`);
  }
  let state = start(stateWith([{ id: "cat", level: 50 }]), { playerId: "cat", opponentId: "ice-golem", opponentLevel: 50, difficulty: "nexus" });
  const preview = familiarCombatOpponentPreview({ playerId: "cat", opponentId: "ice-golem", circuitId: "prime-orme", difficulty: "nexus", opponentLevel: 50 });
  state = withBattle(state, (battle) => ({ player: { ...battle.player, hp: 99_999, maxHp: 99_999 }, opponent: { ...battle.opponent, hp: 99_999, maxHp: 99_999 } }));
  for (let turn = 0; turn < 30 && state.activeBattle.outcome === "active"; turn += 1) {
    const result = performFamiliarCombatTurn(state, baseMoveOf("cat"));
    assert.equal(result.ok, true, result.error);
    assert.ok(preview.moveIds.includes(result.opponentMoveId), `turno ${turn}: ${result.opponentMoveId} fuori anteprima`);
    state = result.state;
  }
});

test("la Risonanza di squadra non duplica la Concentrazione passiva di chi entra", () => {
  const state = start(stateWith([{ id: "cat", level: 20 }, { id: "akita", level: 20 }, { id: "bird", level: 20 }]), { ...TEAM, playerTeamIds: ["cat", "akita", "bird"] });
  assert.ok(state.activeBattle.playerBench.find((actor) => actor.familiarId === "akita").statuses.some((status) => status.id === "focus"));
  const rotated = switchFamiliarCombatant(state, "akita");
  assert.equal(rotated.ok, true, rotated.error);
  assert.equal(rotated.state.activeBattle.player.statuses.filter((status) => status.id === "focus").length, 1);
});

test("un rivale già presente nella squadra del giocatore non compare su entrambi i lati", () => {
  const state = start(stateWith([{ id: "cat", level: 20 }, { id: "fox", level: 20 }, { id: "bird", level: 20 }]), {
    playerId: "cat", playerTeamIds: ["cat", "fox", "bird"], opponentId: "fox", opponentTeamIds: ["fox", "wolf", "golden"], teamBattle: true,
  });
  const battle = state.activeBattle;
  const ids = [battle.player, ...battle.playerBench, battle.opponent, ...battle.opponentBench].map((actor) => actor.familiarId);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(battle.opponent.familiarId, "wolf");
  assert.deepEqual(battle.opponentTeamFamiliarIds, ["wolf", "golden"]);
});

test("l'anteprima del danno usa la stessa formula della risoluzione", () => {
  const base = stateWith([{ id: "cat", level: 30 }]);
  const damages = [];
  let preview = 0;
  for (let rngState = 1; rngState <= 80; rngState += 1) {
    const state = withBattle(start(base, { playerId: "cat", opponentId: "golden", opponentLevel: 30 }), (battle) => ({
      turn: 2,
      rngState,
      player: { ...battle.player, statuses: [] },
      opponent: { ...battle.opponent, hp: 9_999, maxHp: battle.opponent.maxHp, statuses: [] },
    }));
    preview = familiarCombatDamagePreview(state.activeBattle.player, state.activeBattle.opponent, baseMoveOf("cat"));
    const result = performFamiliarCombatTurn(state, baseMoveOf("cat"));
    const impact = result.timeline.find((event) => event.actorId === "cat" && event.phase === "impact" && !event.missed);
    if (impact) damages.push(impact.amount);
  }
  const regular = damages.filter((amount) => amount < preview * 1.3);
  assert.ok(regular.length > 20);
  for (const amount of regular) assert.ok(amount >= Math.floor(preview * .95) - 1 && amount <= Math.ceil(preview * 1.05) + 1, `danno ${amount} lontano dall'anteprima ${preview}`);
});

test("il salvataggio non perde gli incontri più recenti oltre le 500 chiavi", () => {
  const base = createFamiliarCombatProgress("cat", "keys");
  const keys = ["campaign-01", ...Array.from({ length: 700 }, (_, index) => `prime-orme:normal:x${index}`), "campaign-02"];
  const restored = restoreFamiliarCombatState({ ...createFamiliarCombatState("keys"), profiles: { cat: { ...base, completedEncounters: keys, claimedRewardKeys: keys } } });
  const progress = familiarCombatProgress(restored, "cat");
  assert.equal(progress.completedEncounters.length, keys.length);
  assert.ok(progress.completedEncounters.includes("campaign-02"), "prima il capitolo più recente spariva al ricaricamento");
  assert.ok(progress.claimedRewardKeys.includes("prime-orme:normal:x699"));
  const huge = ["campaign-01", ...Array.from({ length: 1_500 }, (_, index) => `prime-orme:normal:y${index}`)];
  const bounded = familiarCombatProgress(restoreFamiliarCombatState({ ...createFamiliarCombatState("keys"), profiles: { cat: { ...base, completedEncounters: huge } } }), "cat");
  assert.equal(bounded.completedEncounters.length, 1_000);
  assert.ok(bounded.completedEncounters.includes("campaign-01"));
  assert.ok(bounded.completedEncounters.includes("prime-orme:normal:y1499"));
});

test("le riserve rivali della Torre hanno forza paragonabile al titolare del piano", () => {
  for (const seed of ["a", "b", "c", "d", "e"]) {
    const run = createFamiliarTowerRun("cat", 30, `support-${seed}`);
    const boss = run.floors[9];
    assert.equal(boss.opponentTeamIds.length, 3);
    for (const id of boss.opponentTeamIds) assert.ok(["epico", "leggendario"].includes(entryOf(id).rarity), `${seed}: riserva ${id} troppo debole per il boss`);
  }
});

test("le curve di movimento restano finite anche con un progresso non numerico", () => {
  for (const entry of FAMILIAR_COMBAT_CATALOG) assert.equal(familiarCombatTravelProgress(entry.id, Number.NaN), 0);
});

test("chi entra dopo un KO non eredita la ricarica della mossa del compagno", () => {
  const cyclone = "affinity-vento-ciclone";
  const members = ["cat", "akita", "bird"].map((id) => ({ id, level: 50, equippedMoveIds: [baseMoveOf(id), cyclone] }));
  let state = start(stateWith(members), { ...TEAM, playerTeamIds: ["cat", "akita", "bird"], opponentLevel: 50 });
  state = withBattle(state, (battle) => ({
    turn: 2,
    player: { ...battle.player, hp: 1, statuses: [poison(80)] },
    opponent: { ...battle.opponent, hp: 99_999, maxHp: 99_999, stats: { ...battle.opponent.stats, speed: 1 } },
  }));
  const result = performFamiliarCombatTurn(state, cyclone);
  assert.equal(result.ok, true, result.error);
  assert.equal(result.state.activeBattle.player.familiarId, "akita");
  assert.equal(result.state.activeBattle.lastPlayerMoveId, null);
  const next = performFamiliarCombatTurn(result.state, cyclone);
  assert.equal(next.ok, true, next.error);
});

test("il limite di turni conclude con un messaggio in italiano corretto", () => {
  let state = start(stateWith([{ id: "cat", level: 20 }]), { playerId: "cat", opponentId: "golden", maxTurns: 1 });
  state = withBattle(state, (battle) => ({ player: { ...battle.player, hp: 9_999, maxHp: 9_999 }, opponent: { ...battle.opponent, hp: 9_999, maxHp: 9_999 } }));
  const result = performFamiliarCombatTurn(state, baseMoveOf("cat"));
  assert.equal(result.state.activeBattle.outcome, "defeat");
  assert.equal(result.state.lastMessage, "Il limite di turni è terminato. Il Famiglio è rientrato al sicuro.");
});
