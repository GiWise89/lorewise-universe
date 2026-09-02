import assert from "node:assert/strict";
import test from "node:test";
import { familiarFrameBottomRatio, familiarFrameGroundShift, familiarOpticalBottomRatio, FAMILIAR_MOTION_PROFILES, planFamiliarWalk } from "../lib/nexusFamiliarMotion.ts";
import { ALL_FAMILIARS } from "../lib/nexusFamiliarCatalog.ts";

test("every species has a distinct locomotion cadence", () => {
  assert.deepEqual(Object.keys(FAMILIAR_MOTION_PROFILES), ["Gatto", "Cane", "Lupo", "Coniglio", "Volpe", "Tartaruga", "Gallina", "Pappagallo", "Orso"]);
  assert.equal(new Set(Object.values(FAMILIAR_MOTION_PROFILES).map((profile) => profile.walkFrameMs)).size, 9);
  assert.ok(FAMILIAR_MOTION_PROFILES.Lupo.pixelsPerSecond < FAMILIAR_MOTION_PROFILES.Cane.pixelsPerSecond);
});

test("every species uses its real transparent-bottom compensation", () => {
  assert.equal(familiarOpticalBottomRatio("Volpe", "rest", null), 0);
  assert.equal(familiarOpticalBottomRatio("Gatto", "rest", null), .36);
  assert.equal(familiarOpticalBottomRatio("Cane", "idle", null), .39);
  assert.equal(familiarOpticalBottomRatio("Lupo", "rest", null), .375);
  assert.equal(familiarOpticalBottomRatio("Coniglio", "rest", null), 0);
  assert.equal(familiarOpticalBottomRatio("Tartaruga", "idle", 2), 0);
  assert.equal(familiarOpticalBottomRatio("Pappagallo", "idle", 4), .25);
  assert.equal(familiarOpticalBottomRatio("Orso", "walk", null), .03125);
});

test("the stronger fox walk keeps every footfall on one ground line", () => {
  const expected = [0, .03125, .0625, .03125, 0, .03125, .0625, .03125];
  for (let frame = 0; frame < expected.length; frame += 1) {
    assert.equal(familiarFrameBottomRatio("Volpe", "walk", null, frame), expected[frame]);
    assert.equal(familiarFrameGroundShift("Volpe", "walk", null, frame), expected[frame]);
  }
});

test("a walk always covers real distance and remains inside the room corridor", () => {
  for (const family of Object.keys(FAMILIAR_MOTION_PROFILES)) {
    for (const random of [0, .2, .5, .8, .999]) {
      const plan = planFamiliarWalk(family, 50, 1200, 220, [12, 88], random);
      assert.ok(plan);
      assert.ok(plan.targetPercent >= 12 && plan.targetPercent <= 88);
      assert.ok(Math.abs(plan.targetPercent - 50) >= 4);
      assert.ok(plan.durationMs >= 850 && plan.durationMs <= 7200);
    }
  }
});

test("professional replacement Famigli use complete grounded pixel-art cycles", () => {
  const professionalIds = new Set(["moon-rabbit", "pocket-dragon", "ember-red-panda", "astral-fawn", "nexus-axolotl"]);
  for (const appearance of ALL_FAMILIARS.filter((entry) => professionalIds.has(entry.id))) {
    assert.match(appearance.spritePath, /\/professional\/animal-mega-pack\//);
    assert.ok(appearance.behaviors.walk.frames > 1);
    assert.ok(appearance.behaviors.walk.frameDurationMs >= 140);
    assert.ok(appearance.behaviors.rest.eyesClosed);
    assert.deepEqual(appearance.actionProps, ["food", "soap", "toy", "medicine"]);
  }
});
