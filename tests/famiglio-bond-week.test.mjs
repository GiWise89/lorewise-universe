import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  FAMILIAR_BOND_WEEK,
  advanceFamiliarBondWeek,
  createFamiliarBondWeek,
  dominantFamiliarBondTrait,
  previewFamiliarBondWeek,
  resolveFamiliarBondWeekChoice,
  restoreFamiliarBondWeek,
} from "../lib/famiglioBondWeek.ts";
import { chooseFamiliarBondMemory, createFamiliarHomeState, restoreFamiliarHome } from "../lib/famiglioHome.ts";

const day = (offset) => new Date(2026, 8, 8 + offset, 10, 0, 0).getTime();

test("the bond story contains one authored week and two meaningful choices each", () => {
  assert.equal(FAMILIAR_BOND_WEEK.length, 7);
  assert.deepEqual(FAMILIAR_BOND_WEEK.map((event) => event.day), Array.from({ length: 7 }, (_, index) => index + 1));
  assert.ok(FAMILIAR_BOND_WEEK.every((event) => event.choices.length === 2));
  assert.equal(new Set(FAMILIAR_BOND_WEEK.flatMap((event) => event.choices.map((choice) => choice.memoryTitle))).size, 14);
});

test("one unresolved story day cannot be skipped by waiting", () => {
  const initial = createFamiliarBondWeek(day(0));
  assert.equal(initial.pendingDay, 1);
  const muchLater = advanceFamiliarBondWeek(initial, day(4));
  assert.equal(muchLater.currentDay, 1);
  assert.equal(muchLater.pendingDay, 1);
});

test("a resolved memory unlocks exactly one new chapter on the next visit day", () => {
  const initial = createFamiliarBondWeek(day(0));
  const resolved = resolveFamiliarBondWeekChoice(initial, "listen", day(0));
  assert.equal(resolved.state.pendingDay, null);
  assert.deepEqual(resolved.state.completedDays, [1]);
  assert.equal(resolved.state.traits.empathy, 2);
  const nextDay = advanceFamiliarBondWeek(resolved.state, day(1));
  assert.equal(nextDay.currentDay, 2);
  assert.equal(nextDay.pendingDay, 2);
  assert.equal(advanceFamiliarBondWeek(nextDay, day(2)).pendingDay, 2);
});

test("story choices change bond, needs, wallet, personality and diary without double rewards", () => {
  const initial = createFamiliarHomeState(day(0));
  const resolved = chooseFamiliarBondMemory(initial, "search", day(0));
  assert.equal(resolved.growth.bondXp, initial.growth.bondXp + 8);
  assert.equal(resolved.wallet.nexusCoins, initial.wallet.nexusCoins + 2);
  assert.equal(resolved.bondWeek.traits.curiosity, 2);
  assert.equal(dominantFamiliarBondTrait(resolved.bondWeek), "curiosity");
  assert.equal(resolved.diary[0].kind, "story");
  assert.equal(chooseFamiliarBondMemory(resolved, "search", day(0)).wallet.nexusCoins, resolved.wallet.nexusCoins);
});

test("legacy saves receive the story safely and a seven-day preview never alters the calendar", () => {
  const restored = restoreFamiliarHome({ needs: { hunger: 70, energy: 70, happiness: 70, hygiene: 70, affection: 70 } }, day(0));
  assert.equal(restored.bondWeek.currentDay, 1);
  assert.equal(restored.bondWeek.pendingDay, 1);
  const preview = previewFamiliarBondWeek(7, day(0));
  assert.deepEqual(preview.completedDays, Array.from({ length: 6 }, (_, index) => index + 1));
  assert.equal(preview.pendingDay, 7);
  assert.equal(restoreFamiliarBondWeek(preview, day(0)).pendingDay, 7);
});

test("story milestones unlock persistent room rewards", () => {
  let state = previewFamiliarBondWeek(3, day(0));
  state = resolveFamiliarBondWeekChoice(state, "hum", day(0)).state;
  assert.deepEqual(state.keepsakeIds, ["memory-song"]);
  const restored = restoreFamiliarBondWeek(state, day(0));
  assert.deepEqual(restored.keepsakeIds, ["memory-song"]);
});

test("Ascolta opens a concrete animated event inside the Famiglio room", async () => {
  const [component, styles] = await Promise.all([
    readFile(new URL("../components/FamiglioNexusRebuild.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/FamiglioNexusRebuild.module.css", import.meta.url), "utf8"),
  ]);
  assert.match(component, /drawBondMemoryAtmosphere\(/);
  assert.match(component, /bondStoryActive=\{bondStoryOpen\}/);
  assert.match(component, /className=\{styles\.bondStoryScene\}/);
  assert.match(styles, /\.bondStoryScene\s*\{/);
  assert.match(styles, /@media \(max-width: 620px\)[\s\S]*\.bondStoryScene/);
});
