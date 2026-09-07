import test from "node:test";
import assert from "node:assert/strict";

import { advanceFamiliarTower, createFamiliarTowerRun, familiarTowerFloor, familiarTowerFloorBackground, FAMILIAR_TOWER_FLOOR_BACKGROUNDS } from "../lib/famiglioCombatTower.ts";

test("la Torre crea dieci piani ordinati con mini-boss e boss finale", () => {
  const run = createFamiliarTowerRun("cat", 1, "tower-test");
  assert.equal(run.floors.length, 10);
  assert.deepEqual(run.floors.map((floor) => floor.floor), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(run.floors[3].rank, "mini-boss");
  assert.equal(run.floors[7].rank, "mini-boss");
  assert.equal(run.floors[8].rank, "elite");
  assert.equal(run.floors[9].rank, "boss");
  assert.ok(new Set(run.floors.map((floor) => floor.opponentId)).size >= 9);
  assert.ok(run.floors.every((floor) => floor.opponentId !== "cat"));
  assert.equal(FAMILIAR_TOWER_FLOOR_BACKGROUNDS.length, 10);
  assert.equal(new Set(run.floors.map((floor) => floor.backgroundSrc)).size, 10);
  assert.deepEqual(run.floors.map((floor) => floor.backgroundSrc), FAMILIAR_TOWER_FLOOR_BACKGROUNDS);
  assert.ok(run.floors.some((floor) => floor.backgroundSrc.includes("/campaign/arenas/")));
  assert.equal(familiarTowerFloorBackground(10), "/famiglio/rebuild/combat/campaign/arenas/05-trono-nulla-v1.webp");
});

test("la stessa seed mantiene la gerarchia mentre una nuova corsa cambia avversari", () => {
  const first = createFamiliarTowerRun("cat", 8, "same-seed");
  const restored = createFamiliarTowerRun("cat", 8, "same-seed");
  const another = createFamiliarTowerRun("cat", 8, "another-seed");
  assert.deepEqual(restored.floors, first.floors);
  assert.notDeepEqual(another.floors.map((floor) => floor.opponentId), first.floors.map((floor) => floor.opponentId));
});

test("l'avanzamento arriva al decimo piano e poi conclude la Torre", () => {
  let run = createFamiliarTowerRun("cat", 12, "advance-test");
  for (let floor = 1; floor <= 10; floor += 1) {
    assert.equal(familiarTowerFloor(run)?.floor, floor);
    const next = advanceFamiliarTower(run);
    if (floor === 10) assert.equal(next, null);
    else {
      assert.ok(next);
      run = next;
    }
  }
});
