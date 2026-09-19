import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  closeFamiliarCombatBattle,
  createFamiliarCombatState,
  familiarCombatProgress,
  FAMILIAR_COMBAT_RETREAT_MESSAGE,
  performFamiliarCombatTurn,
  restoreFamiliarCombatState,
  retreatFromFamiliarCombat,
  startFamiliarCombatBattle,
} from "../lib/famiglioCombat.ts";
import { FAMILIAR_COMBAT_CAMPAIGN, familiarCampaignIsComplete, familiarCampaignIsUnlocked } from "../lib/famiglioCombatCampaign.ts";

function started(state, options) {
  const result = startFamiliarCombatBattle(state, { circuitId: "prime-orme", ignoreUnlocks: true, ...options });
  assert.equal(result.ok, true, result.error);
  return result.state;
}

test("la ritirata è un esito neutro: nessuna sconfitta, nessuna XP, nessun premio", () => {
  let state = started(createFamiliarCombatState("retreat-neutral"), { playerId: "cat", opponentId: "fox" });
  const move = familiarCombatProgress(state, "cat").equippedMoveIds[0];
  state = performFamiliarCombatTurn(state, move).state;
  const before = familiarCombatProgress(state, "cat");
  const retreated = retreatFromFamiliarCombat(state);
  const after = familiarCombatProgress(retreated, "cat");
  assert.equal(retreated.activeBattle?.outcome, "retreat");
  assert.equal(retreated.activeBattle?.resultApplied, true);
  assert.equal(after.losses, before.losses, "nessuna sconfitta registrata");
  assert.equal(after.wins, before.wins);
  assert.equal(after.combatXp, before.combatXp, "nessuna esperienza");
  assert.deepEqual(after.completedEncounters, before.completedEncounters);
  assert.deepEqual(after.claimedRewardKeys, before.claimedRewardKeys);
  assert.equal(retreated.pendingReward, null, "nessun premio");
  assert.equal(retreated.lastMessage, FAMILIAR_COMBAT_RETREAT_MESSAGE);
  assert.match(FAMILIAR_COMBAT_RETREAT_MESSAGE, /Ti sei ritirato: nessuna sconfitta registrata/);
  // Il contatore delle battaglie avanza: la rivincita usa un seme nuovo.
  assert.equal(after.battlesCompleted, before.battlesCompleted + 1);
  // A battaglia chiusa nessuna azione è più accettata e una seconda ritirata non cambia nulla.
  assert.equal(performFamiliarCombatTurn(retreated, move).ok, false);
  assert.equal(retreatFromFamiliarCombat(retreated), retreated);
});

test("la rivincita dopo una ritirata è un incontro nuovo", () => {
  const options = { playerId: "cat", opponentId: "fox" };
  const first = started(createFamiliarCombatState("retreat-rematch"), options);
  const retreated = retreatFromFamiliarCombat(first);
  const rematch = started(closeFamiliarCombatBattle(retreated), options);
  assert.notEqual(rematch.activeBattle.id, first.activeBattle.id);
  assert.equal(rematch.activeBattle.outcome, "active");
});

test("in 3 contro 3 la ritirata non tocca vittorie, sconfitte o XP di nessun membro", () => {
  const state = started(createFamiliarCombatState("retreat-team"), {
    playerId: "cat", playerTeamIds: ["cat", "rabbit", "bird"], opponentId: "golden", opponentTeamIds: ["golden", "fox", "wolf"], teamBattle: true,
  });
  const retreated = retreatFromFamiliarCombat(state);
  for (const id of ["cat", "rabbit", "bird"]) {
    const before = familiarCombatProgress(state, id);
    const after = familiarCombatProgress(retreated, id);
    assert.equal(after.losses, before.losses, id);
    assert.equal(after.wins, before.wins, id);
    assert.equal(after.combatXp, before.combatXp, id);
  }
});

test("la ritirata in Campagna non completa né blocca il capitolo", () => {
  const level = FAMILIAR_COMBAT_CAMPAIGN[0];
  const state = started(createFamiliarCombatState("retreat-campaign"), {
    playerId: "cat", opponentId: level.opponentIds[0], circuitId: level.circuitId, difficulty: level.difficulty,
    opponentLevel: level.opponentLevel, encounterId: level.id, maxTurns: level.turnLimit, bossPhases: level.bossPhases,
  });
  const retreated = retreatFromFamiliarCombat(state);
  const progress = familiarCombatProgress(retreated, "cat");
  assert.equal(familiarCampaignIsComplete(progress, level), false);
  assert.equal(familiarCampaignIsUnlocked(progress, level), true, "il capitolo resta giocabile");
  assert.equal(familiarCampaignIsUnlocked(progress, FAMILIAR_COMBAT_CAMPAIGN[1]), false, "il capitolo successivo resta chiuso");
});

test("l'esito ritirata sopravvive al salvataggio", () => {
  const retreated = retreatFromFamiliarCombat(started(createFamiliarCombatState("retreat-save"), { playerId: "cat", opponentId: "fox" }));
  const restored = restoreFamiliarCombatState(JSON.parse(JSON.stringify(retreated)));
  assert.equal(restored.activeBattle?.outcome, "retreat");
});

test("la schermata della ritirata è neutra, con rivincita e uscita", async () => {
  const arena = await readFile(new URL("../components/FamiglioCombatArena.tsx", import.meta.url), "utf8");
  assert.match(arena, /Ti sei ritirato: nessuna sconfitta registrata\./);
  assert.match(arena, /battle\.outcome === "retreat" \? "Ritirata"/);
  assert.match(arena, /battle\.outcome !== "defeat" && battle\.outcome !== "retreat"/, "rivincita disponibile anche dopo la ritirata");
  assert.match(arena, /Torna alla Casa/);
});
