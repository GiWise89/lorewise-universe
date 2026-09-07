import assert from "node:assert/strict";
import test from "node:test";
import { FAMILIAR_COMBAT_CATALOG } from "../lib/famiglioCombatCatalog.ts";
import {
  FAMILIAR_COMBAT_PROFILED_IDS,
  familiarCombatMotionProfile,
  familiarCombatPhaseDurationScale,
  familiarCombatTravelProgress,
} from "../lib/famiglioCombatMotion.ts";

test("tutti i 53 Famigli hanno un profilo di movimento esplicito", () => {
  const catalogIds = FAMILIAR_COMBAT_CATALOG.map((entry) => entry.id).sort();
  const profiledIds = [...FAMILIAR_COMBAT_PROFILED_IDS].sort();
  assert.equal(catalogIds.length, 53);
  assert.deepEqual(profiledIds, catalogIds);
});

test("i profili distinguono creature rapide, pesanti, volanti e magiche", () => {
  const cat = familiarCombatMotionProfile("cat");
  const bear = familiarCombatMotionProfile("brown-bear");
  const bird = familiarCombatMotionProfile("bird");
  const dragon = familiarCombatMotionProfile("adult-red-dragon");
  const turtle = familiarCombatMotionProfile("turtle");
  const golem = familiarCombatMotionProfile("ice-golem");
  assert.equal(cat.archetype, "quadrupede-leggero");
  assert.equal(bear.archetype, "quadrupede-pesante");
  assert.equal(bird.archetype, "volatile");
  assert.equal(dragon.archetype, "creatura-volante");
  assert.equal(turtle.archetype, "rettile");
  assert.equal(golem.archetype, "creatura-magica");
  assert.ok(cat.runFrameMs < bear.runFrameMs);
  assert.ok(familiarCombatPhaseDurationScale("bird") < familiarCombatPhaseDurationScale("brown-bear"));
  assert.ok(familiarCombatPhaseDurationScale("cat") > cat.phaseDurationScale, "il ritmo globale deve rallentare ogni Famiglio");
});

test("le curve di viaggio restano delimitate e raggiungono esattamente gli estremi", () => {
  for (const familiarId of FAMILIAR_COMBAT_PROFILED_IDS) {
    assert.equal(familiarCombatTravelProgress(familiarId, -1), 0, familiarId);
    assert.equal(familiarCombatTravelProgress(familiarId, 0), 0, familiarId);
    assert.equal(familiarCombatTravelProgress(familiarId, 1), 1, familiarId);
    assert.equal(familiarCombatTravelProgress(familiarId, 2), 1, familiarId);
    for (const progress of [.1, .25, .5, .75, .9]) {
      const value = familiarCombatTravelProgress(familiarId, progress);
      assert.ok(value >= 0 && value <= 1, `${familiarId}: ${progress} -> ${value}`);
    }
  }
});
