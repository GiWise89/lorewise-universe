import assert from "node:assert/strict";
import test from "node:test";
import { bestFamiliarDiscount, familiarLevelDiscount, FAMILIAR_LEVEL_BENEFITS } from "../lib/nexusFamiliarBenefits.ts";
import { completedGuestCareActions, FAMILIAR_CONTEXT_TIP_STORAGE_PREFIX, FAMILIAR_CONTEXTUAL_TIPS, FAMILIAR_CONTEXTUAL_TUTORIALS, FAMILIAR_GUEST_ACTION_LIMIT, FAMILIAR_GUIDED_TUTORIAL_STEPS, FAMILIAR_ID_ADVANTAGES, shouldRequireLoreWiseIdForNextCare, shouldShowLoreWiseIdPrompt } from "../lib/nexusFamiliarOnboarding.ts";

test("guest LoreWise ID gate appears only after two completed real care actions", () => {
  assert.equal(FAMILIAR_GUEST_ACTION_LIMIT, 2);
  const first = completedGuestCareActions(0, "food");
  assert.equal(shouldShowLoreWiseIdPrompt(first, false), false);
  const second = completedGuestCareActions(first, "rest");
  assert.equal(shouldShowLoreWiseIdPrompt(second, false), true);
  assert.equal(shouldShowLoreWiseIdPrompt(second, true), false);
  assert.equal(shouldRequireLoreWiseIdForNextCare(second, false), true);
  assert.equal(shouldRequireLoreWiseIdForNextCare(second, true), false);
  assert.equal(FAMILIAR_ID_ADVANTAGES.length, 8);
});

test("initial tutorial stays limited to three essential, focused steps", () => {
  assert.equal(FAMILIAR_GUIDED_TUTORIAL_STEPS.length, 3);
  assert.deepEqual(FAMILIAR_GUIDED_TUTORIAL_STEPS.map((step) => step.target), ["habitat", "care", "utilities"]);
  assert.ok(FAMILIAR_GUIDED_TUTORIAL_STEPS.every((step) => step.title && step.copy && step.view === "den"));
  const playerCopy = FAMILIAR_GUIDED_TUTORIAL_STEPS.map((step) => step.copy).join(" ");
  assert.doesNotMatch(playerCopy, /pavimento sicuro|sfondo|object-fit|viewport|responsive|pixel|render|layout|tecnic/i);
  assert.match(playerCopy, /vive, esplora e riposa/);
  assert.match(playerCopy, /Ogni gesto rafforza il vostro legame/);
  assert.match(playerCopy, /due Case separate.*tre Famigli/);
});

test("secondary sections are introduced through contextual first-use tips", () => {
  assert.equal(FAMILIAR_CONTEXT_TIP_STORAGE_PREFIX, "lorewise:nexus-familiar:context-tip:v2:");
  assert.deepEqual(Object.keys(FAMILIAR_CONTEXTUAL_TIPS), ["outside", "shop", "legacy", "missions"]);
  assert.match(FAMILIAR_CONTEXTUAL_TIPS.outside, /5, 10 o 15 minuti/);
  assert.match(FAMILIAR_CONTEXTUAL_TIPS.shop, /Tane illustrate complete/);
  assert.deepEqual(Object.keys(FAMILIAR_CONTEXTUAL_TUTORIALS), ["outside", "shop", "legacy", "missions"]);
  for (const [section, steps] of Object.entries(FAMILIAR_CONTEXTUAL_TUTORIALS)) {
    assert.equal(steps.length, 3, `${section} must have a complete three-step guide`);
    assert.ok(steps.every((step) => step.title && step.copy && step.target && step.view && step.panel));
  }
  assert.match(FAMILIAR_CONTEXTUAL_TUTORIALS.outside.map((step) => step.copy).join(" "), /partenza|ritorno/i);
  assert.match(FAMILIAR_CONTEXTUAL_TUTORIALS.shop.map((step) => step.copy).join(" "), /Ambienti, Look e Famigli premium/);
  assert.match(FAMILIAR_CONTEXTUAL_TUTORIALS.legacy.map((step) => step.copy).join(" "), /Diario, Personalità, Scoperte e Centro ricompense/);
  assert.match(FAMILIAR_CONTEXTUAL_TUTORIALS.missions.map((step) => `${step.title} ${step.copy}`).join(" "), /Missioni, Presenze e Desiderio/);
});

test("level discounts rise from one to three percent and never stack", () => {
  assert.deepEqual(FAMILIAR_LEVEL_BENEFITS.map((benefit) => benefit.level), [5, 10, 20, 23, 30, 35, 40, 50]);
  assert.equal(familiarLevelDiscount(9, "commissioni"), 0);
  assert.equal(familiarLevelDiscount(10, "commissioni"), 1);
  assert.equal(familiarLevelDiscount(29, "giwise-shop"), 1.5);
  assert.equal(familiarLevelDiscount(30, "giwise-shop"), 2);
  assert.equal(familiarLevelDiscount(50, "commissioni"), 3);
  assert.equal(bestFamiliarDiscount(50, "commissioni", 20), 20);
});
