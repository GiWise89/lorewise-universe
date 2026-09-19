// Campagna: obiettivo "Resistenza" e rivali bilanciati sul Famiglio del giocatore.
import assert from "node:assert/strict";
import test from "node:test";
import {
  createFamiliarCombatProgress,
  createFamiliarCombatState,
  familiarCombatOpponentPreview,
  familiarCombatProgress,
  familiarCombatTurnLimitIsVictory,
  performFamiliarCombatTurn,
  restoreFamiliarCombatState,
  startFamiliarCombatBattle,
  totalCombatXpForLevel,
} from "../lib/famiglioCombat.ts";
import { FAMILIAR_COMBAT_CATALOG } from "../lib/famiglioCombatCatalog.ts";
import { FAMILIAR_COMBAT_CAMPAIGN, familiarCampaignOpponent, familiarCampaignLevelById } from "../lib/famiglioCombatCampaign.ts";
import { createFamiliarTowerRun } from "../lib/famiglioCombatTower.ts";
import { runFamiliarCampaignBalance } from "../scripts/fuzz-famiglio-combat.mjs";

const baseMoveOf = (id) => FAMILIAR_COMBAT_CATALOG.find((entry) => entry.id === id).initialMoveIds[0];

function stateWith(id, level) {
  const state = createFamiliarCombatState("campaign-balance-tests");
  const base = createFamiliarCombatProgress(id, state.seed);
  return restoreFamiliarCombatState({ ...state, profiles: { [id]: { ...base, combatLevel: level, combatXp: totalCombatXpForLevel(level) } } });
}

function startCampaign(levelId, playerId, playerLevel, overrides = {}) {
  const level = familiarCampaignLevelById(levelId);
  const started = startFamiliarCombatBattle(stateWith(playerId, playerLevel), {
    playerId,
    opponentId: familiarCampaignOpponent(level, playerId),
    circuitId: level.circuitId,
    difficulty: level.difficulty,
    opponentLevel: level.opponentLevel,
    encounterId: level.id,
    ignoreUnlocks: true,
    maxTurns: level.turnLimit,
    bossPhases: 1,
    ...overrides,
  });
  assert.equal(started.ok, true, started.error);
  return started.state;
}

function untilLimit(state, playerId) {
  state = { ...state, activeBattle: { ...state.activeBattle, player: { ...state.activeBattle.player, hp: 99_999, maxHp: 99_999 }, opponent: { ...state.activeBattle.opponent, hp: 99_999, maxHp: 99_999 } } };
  let last = null;
  while (state.activeBattle.outcome === "active") {
    last = performFamiliarCombatTurn(state, baseMoveOf(playerId));
    assert.equal(last.ok, true, last.error);
    state = last.state;
  }
  return last;
}

test("Resistenza: arrivare in piedi al limite di turni è una vittoria con premio del primo completamento", () => {
  const resistance = FAMILIAR_COMBAT_CAMPAIGN.filter((level) => level.objective === "resistenza");
  assert.deepEqual(resistance.map((level) => level.number), [9, 14, 19]);
  for (const level of resistance) assert.equal(familiarCombatTurnLimitIsVictory(level.id), true);
  const result = untilLimit(startCampaign("campaign-09", "cat", 11, { maxTurns: 3 }), "cat");
  assert.equal(result.state.activeBattle.outcome, "victory");
  assert.equal(result.state.activeBattle.turn, 3);
  assert.equal(result.state.lastMessage, "Hai resistito fino all'ultimo turno: obiettivo Resistenza completato.");
  assert.ok(result.timeline.some((event) => event.phase === "result" && /obiettivo Resistenza completato/.test(event.message)));
  assert.equal(result.state.pendingReward?.firstClear, true);
  assert.equal(result.state.pendingReward.key, "campaign-09");
  assert.ok(familiarCombatProgress(result.state, "cat").completedEncounters.includes("campaign-09"));
});

test("Rapidità e incontri liberi a tempo restano sconfitte allo scadere dei turni", () => {
  assert.equal(familiarCombatTurnLimitIsVictory("campaign-02"), false);
  assert.equal(familiarCombatTurnLimitIsVictory("prime-orme:normal:bird"), false);
  const rapid = untilLimit(startCampaign("campaign-02", "cat", 3, { maxTurns: 2 }), "cat");
  assert.equal(rapid.state.activeBattle.outcome, "defeat");
  assert.equal(rapid.state.pendingReward, null);
  assert.match(rapid.state.lastMessage, /limite di turni è terminato/);
});

test("il rivale di campagna è bilanciato sul Famiglio del giocatore e l'anteprima coincide", () => {
  const level = familiarCampaignLevelById("campaign-13");
  const opponentId = familiarCampaignOpponent(level, "cat");
  const raw = familiarCombatOpponentPreview({ playerId: "cat", opponentId, circuitId: level.circuitId, difficulty: level.difficulty, opponentLevel: level.opponentLevel });
  const scaled = familiarCombatOpponentPreview({ playerId: "cat", opponentId, circuitId: level.circuitId, difficulty: level.difficulty, opponentLevel: level.opponentLevel, encounterId: level.id, playerLevel: 15 });
  assert.ok(scaled.stats.attack < raw.stats.attack && scaled.maxHp < raw.maxHp, "un leggendario contro un gatto viene ridimensionato");
  assert.equal(scaled.stats.speed, raw.stats.speed);
  const state = startCampaign(level.id, "cat", 15);
  assert.deepEqual(state.activeBattle.opponent, scaled.actor);
  // A parità di tutto il resto un giocatore più forte affronta un rivale più forte, ma non quanto lui.
  const vsDragon = familiarCombatOpponentPreview({ playerId: "hellhound", opponentId, circuitId: level.circuitId, difficulty: level.difficulty, opponentLevel: level.opponentLevel, encounterId: level.id, playerLevel: 15 });
  assert.ok(vsDragon.stats.attack > scaled.stats.attack);
});

test("i primi tre piani della Torre sono di riscaldamento, gli ultimi restano più alti del giocatore", () => {
  for (const level of [5, 20, 35, 50]) {
    const run = createFamiliarTowerRun("cat", level, `warmup-${level}`);
    for (const floor of run.floors.slice(0, 3)) assert.ok(floor.opponentLevel < level, `Lv${level} piano ${floor.floor}: ${floor.opponentLevel}`);
    for (const floor of run.floors.slice(7)) assert.ok(floor.opponentLevel >= Math.min(50, level + 2), `Lv${level} piano ${floor.floor}`);
  }
});

test("storia senza grinding: ogni capitolo è vincibile al livello assegnato dalla storia", () => {
  // Campione ridotto (due battaglie per specie e capitolo): soglie larghe contro il rumore.
  // Le tabelle complete: node scripts/fuzz-famiglio-combat.mjs --battles 0 --campaign --copies 6
  const rows = runFamiliarCampaignBalance({ copies: 2, seed: "node-test-campaign" });
  assert.equal(rows.length, 20);
  for (const row of rows) {
    assert.ok(row.comune >= 25, `capitolo ${row.stage}: comune ${row.comune}%`);
    assert.ok(row.leggendario >= 55, `capitolo ${row.stage}: leggendario ${row.leggendario}%`);
    assert.ok(row.leggendario <= 100);
  }
  const mean = (key) => rows.reduce((total, row) => total + row[key], 0) / rows.length;
  assert.ok(mean("comune") >= 45 && mean("comune") <= 75, `media comune ${mean("comune")}`);
  assert.ok(mean("leggendario") >= 72 && mean("leggendario") <= 95, `media leggendario ${mean("leggendario")}`);
});
