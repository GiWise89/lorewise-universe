import assert from "node:assert/strict";
import test from "node:test";
import { runFamiliarCombatFuzz } from "../scripts/fuzz-famiglio-combat.mjs";

// Versione ridotta del fuzz completo (node scripts/fuzz-famiglio-combat.mjs,
// 3000+ battaglie): duelli, 3 contro 3, campagna e Torre con scelte casuali,
// avide e tentativi illegali, verificando invarianti, determinismo e salvataggio.
test("fuzz del combattimento: centinaia di battaglie senza violare gli invarianti", () => {
  const summary = runFamiliarCombatFuzz({ battles: 500, seed: "node-test" });
  assert.equal(summary.battles, 500);
  assert.equal(summary.closedCleanly, true);
  assert.equal(summary.opponentOutsideLoadout, 0, "l'IA ha usato mosse assenti dalle mosse osservabili");
  for (const kind of ["duel", "team", "campaign", "tower"]) assert.ok(summary.byKind[kind] > 0, `scenario ${kind} non esercitato`);
  assert.ok(summary.roundTrips > 0 && summary.replays > 0 && summary.illegalRejected > 0 && summary.switches > 0);
  assert.ok(summary.maxTurns < 400);
});
