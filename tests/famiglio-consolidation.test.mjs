import assert from "node:assert/strict";
import test from "node:test";
import { FAMILIAR_COLLECTION } from "../lib/famiglioMarketExpansion.ts";
import { FAMILIAR_COMBAT_PROFILED_IDS, familiarCombatMotionProfile } from "../lib/famiglioCombatMotion.ts";
import { createFamiliarHomeState } from "../lib/famiglioHome.ts";
import { familiarActivityGate, familiarCombatNeedBonus } from "../lib/famiglioWellbeing.ts";
import { familiarDailyMoment } from "../lib/famiglioDailyMoments.ts";
import { FAMILIAR_COMBAT_CAMPAIGN } from "../lib/famiglioCombatCampaign.ts";
import { createFamiliarCombatState, performFamiliarCombatTurn, startFamiliarCombatBattle } from "../lib/famiglioCombat.ts";
import { FAMILIAR_COMBAT_CATALOG, FAMILIAR_COMBAT_CIRCUITS } from "../lib/famiglioCombatCatalog.ts";

test("tutti i 53 Famigli hanno un profilo di movimento esplicito", () => {
  assert.equal(FAMILIAR_COLLECTION.length, 53);
  assert.deepEqual(new Set(FAMILIAR_COMBAT_PROFILED_IDS), new Set(FAMILIAR_COLLECTION.map((entry) => entry.id)));
  assert.ok(new Set(FAMILIAR_COLLECTION.map((entry) => familiarCombatMotionProfile(entry.id).archetype)).size >= 7);
});

test("il benessere collega Casa, Spedizioni e Lotte senza conseguenze permanenti", () => {
  const healthy = createFamiliarHomeState(1_000);
  const strong = familiarActivityGate({ ...healthy, needs: { hunger: 95, energy: 95, happiness: 95, hygiene: 95, affection: 95 } }, "combat");
  assert.equal(strong.allowed, true);
  assert.ok(familiarCombatNeedBonus(strong).attack > 0);
  const exhausted = familiarActivityGate({ ...healthy, needs: { ...healthy.needs, energy: 10 } }, "combat");
  assert.equal(exhausted.allowed, false);
  assert.match(exhausted.reason, /energia/i);
  const dirty = familiarActivityGate({ ...healthy, toilet: { ...healthy.toilet, wasteCount: 2 } }, "expedition");
  assert.equal(dirty.allowed, false);
  assert.match(dirty.reason, /bagno/i);
});

test("il momento quotidiano e stabile nello stesso giorno e varia per specie", () => {
  const now = Date.parse("2026-09-07T12:00:00+02:00");
  assert.deepEqual(familiarDailyMoment("cat", now), familiarDailyMoment("cat", now + 3_600_000));
  assert.notDeepEqual(familiarDailyMoment("cat", now), familiarDailyMoment("adult-red-dragon", now));
});

test("la campagna usa obiettivi diversi, limiti reali e boss a fasi", () => {
  assert.equal(FAMILIAR_COMBAT_CAMPAIGN.length, 20);
  assert.ok(new Set(FAMILIAR_COMBAT_CAMPAIGN.map((level) => level.objective)).size >= 5);
  assert.ok(FAMILIAR_COMBAT_CAMPAIGN.filter((level) => level.turnLimit).length >= 6);
  assert.ok(FAMILIAR_COMBAT_CAMPAIGN.filter((level) => level.bossPhases > 1).length === 5);
});

test("un boss passa davvero alla fase successiva prima di concedere la vittoria", () => {
  const started = startFamiliarCombatBattle(createFamiliarCombatState("boss-phase-test"), {
    playerId: "cat",
    opponentId: "golden",
    circuitId: FAMILIAR_COMBAT_CIRCUITS[0].id,
    opponentLevel: 1,
    ignoreUnlocks: true,
    bossPhases: 2,
  });
  assert.equal(started.ok, true);
  const active = started.state.activeBattle;
  const baseMoveId = FAMILIAR_COMBAT_CATALOG.find((entry) => entry.id === "cat").initialMoveIds[0];
  const staged = {
    ...started.state,
    activeBattle: { ...active, player: { ...active.player, stats: { ...active.player.stats, attack: 999 } }, opponent: { ...active.opponent, hp: 0, statuses: [] } },
  };
  const result = performFamiliarCombatTurn(staged, baseMoveId);
  assert.equal(result.ok, true);
  assert.equal(result.state.activeBattle.outcome, "active");
  assert.equal(result.state.activeBattle.bossPhasesRemaining, 1);
  assert.equal(result.state.activeBattle.opponent.hp, result.state.activeBattle.opponent.maxHp);
  assert.ok(result.timeline.some((event) => event.statusId === "boss-phase"));
});
