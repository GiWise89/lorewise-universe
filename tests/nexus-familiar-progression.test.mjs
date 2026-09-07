import assert from "node:assert/strict";
import test from "node:test";
import { familiarLevelForExperience, grantFamiliarProgress, createNexusFamiliar } from "../lib/nexusFamiliar.ts";
import { familiarDailyMissionCount, familiarExperienceForLevel, familiarGrowthScale, familiarUnlockedMilestones, FAMILIAR_MILESTONES, MAX_FAMILIAR_LEVEL } from "../lib/nexusFamiliarProgression.ts";

test("Famiglio progression stops exactly at level 50", () => {
  assert.equal(MAX_FAMILIAR_LEVEL, 50);
  assert.equal(familiarLevelForExperience(familiarExperienceForLevel(50)), 50);
  assert.equal(familiarLevelForExperience(Number.MAX_SAFE_INTEGER), 50);
  const maxed = grantFamiliarProgress(createNexusFamiliar(), { experience: Number.MAX_SAFE_INTEGER });
  assert.equal(maxed.level, 50);
  assert.equal(maxed.experience, familiarExperienceForLevel(50));
});

test("growth preserves the same pet and only scales progressively", () => {
  assert.equal(familiarGrowthScale(1), 1);
  assert.equal(familiarGrowthScale(50), 1.32);
  assert.ok(familiarGrowthScale(20) > familiarGrowthScale(10));
});

test("the eight site milestones unlock at their exact levels", () => {
  assert.deepEqual(FAMILIAR_MILESTONES.map((entry) => entry.level), [5, 10, 20, 23, 30, 35, 40, 50]);
  assert.equal(familiarUnlockedMilestones(4).length, 0);
  assert.equal(familiarUnlockedMilestones(23).length, 4);
  assert.equal(familiarUnlockedMilestones(50).length, 8);
  assert.equal(familiarDailyMissionCount(9), 3);
  assert.equal(familiarDailyMissionCount(10), 4);
});

test("milestone rewards are granted once and remain part of the saved familiar", () => {
  const first = grantFamiliarProgress(createNexusFamiliar(), { experience: familiarExperienceForLevel(23) });
  assert.deepEqual(first.claimedMilestoneLevels, [5, 10, 20, 23]);
  assert.equal(first.nexusCoins, 135);
  assert.ok(first.den.unlockedGadgets.includes("berretto-stellare"));
  const second = grantFamiliarProgress(first, { experience: 1 });
  assert.equal(second.nexusCoins, first.nexusCoins);
  assert.deepEqual(second.claimedMilestoneLevels, first.claimedMilestoneLevels);
});
