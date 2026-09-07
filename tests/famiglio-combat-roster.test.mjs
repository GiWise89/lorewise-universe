import assert from "node:assert/strict";
import test from "node:test";
import { runFamiliarCombatRosterAudit } from "../scripts/audit-famiglio-combat.mjs";

test("complete 53 by 52 Famiglio combat matrix stays deterministic and bounded", () => {
  const first = runFamiliarCombatRosterAudit();
  assert.equal(first.familiars, 53);
  assert.equal(first.directionalMatchups, 2756);
  assert.equal(first.turns, 2756);
  assert.equal(first.opponentPreviews, 2756);
  assert.equal(first.maxOpponentLoadout, 4);
  assert.equal(first.opponentLoadoutsChecked, 2809);
  assert.equal(first.selfMatchesRejected, 53);
  assert.deepEqual([...first.actionClasses].sort(), ["guard", "heal", "magic", "physical", "status"]);
  assert.equal(first.restoreStable, true);
  assert.equal(first.rewardClaimedOnce, true);
  assert.equal(first.difficultyThresholdStable, true);
  assert.ok(first.timelineEvents > first.turns * 4);
  assert.equal(Object.values(first.circuits).reduce((total, value) => total + value, 0), 2756);
  assert.equal(Object.values(first.difficulties).reduce((total, value) => total + value, 0), 2756);

  const second = runFamiliarCombatRosterAudit();
  assert.deepEqual(second, first, "l'audit ripetuto deve produrre lo stesso risultato");
  console.log("Riepilogo audit combattimento Famigli:", JSON.stringify(first));
});
