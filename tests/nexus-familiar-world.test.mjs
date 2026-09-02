import assert from "node:assert/strict";
import test from "node:test";
import { createNexusFamiliar } from "../lib/nexusFamiliar.ts";
import { FAMILIAR_HABITAT_THEMES } from "../lib/nexusDayCycle.ts";
import { PREMIUM_FAMILIAR_LOOKS } from "../lib/nexusFamiliarGadgets.ts";
import {
  claimFamiliarOuting,
  equipFamiliarTheme,
  FAMILIAR_DESTINATIONS,
  FAMILIAR_SHOP_OFFERS,
  familiarOutingRewardForLevel,
  purchaseFamiliarGadgetWithCoins,
  purchaseFamiliarThemeWithCoins,
  startFamiliarOuting,
} from "../lib/nexusFamiliarWorld.ts";

const now = new Date("2026-08-27T10:00:00.000Z");

test("starts a timed outing, spends energy and grants its reward only after return", () => {
  const initial = createNexusFamiliar(now, "world-outing");
  const started = startFamiliarOuting(initial, "sentiero-luminoso", now);
  assert.equal(started.ok, true);
  assert.equal(started.state.needs.energy, initial.needs.energy - 8);
  assert.equal(Date.parse(started.state.outing.endsAt) - now.getTime(), 5 * 60_000);
  assert.equal(claimFamiliarOuting(started.state, new Date(now.getTime() + 5 * 60_000 - 1)).ok, false);
  const claimed = claimFamiliarOuting(started.state, new Date(now.getTime() + 5 * 60_000));
  assert.equal(claimed.ok, true);
  assert.equal(claimed.state.outing, null);
  assert.equal(claimed.state.nexusCoins, initial.nexusCoins + 6);
  assert.equal(claimed.state.inventory.food, initial.inventory.food);
  assert.equal(claimed.state.experience, 30);
});

test("outside offers exactly three real 5, 10 and 15 minute outings", () => {
  const base = createNexusFamiliar(now, "familiar-route-lock", "cat-1", { name: "Nox", sex: "male" });
  assert.deepEqual(FAMILIAR_DESTINATIONS.map((destination) => destination.minutes), [5, 10, 15]);
  assert.deepEqual(FAMILIAR_DESTINATIONS.map((destination) => destination.energyCost), [8, 16, 24]);
  assert.deepEqual(FAMILIAR_DESTINATIONS.map((destination) => destination.reward.coins), [6, 13, 22]);
  assert.ok(FAMILIAR_DESTINATIONS.every((destination) => Object.keys(destination.reward.items).length === 0));
  for (const destination of FAMILIAR_DESTINATIONS) {
    const started = startFamiliarOuting(base, destination.id, now);
    assert.equal(started.ok, true);
    assert.equal(Date.parse(started.state.outing.endsAt) - now.getTime(), destination.minutes * 60_000);
  }
});

test("level 23 increases outside coins and experience by twenty-five percent", () => {
  const destination = FAMILIAR_DESTINATIONS[1];
  assert.deepEqual(familiarOutingRewardForLevel(destination, 22), destination.reward);
  const boosted = familiarOutingRewardForLevel(destination, 23);
  assert.equal(boosted.coins, 17);
  assert.equal(boosted.experience, 75);
  assert.deepEqual(boosted.items, destination.reward.items);
});

test("the shop stays cosmetic and never sells fundamental care supplies", () => {
  const themes = FAMILIAR_SHOP_OFFERS.filter((offer) => offer.kind === "theme");
  assert.equal(themes.length, 4);
  assert.equal(FAMILIAR_HABITAT_THEMES.length, 5);
  assert.ok(themes.every((offer) => offer.themeId && offer.priceCoins && !offer.priceCents));
  assert.ok(FAMILIAR_SHOP_OFFERS.every((offer) => !Object.hasOwn(offer, "items")));
  assert.ok(FAMILIAR_SHOP_OFFERS.every((offer) => offer.kind !== "decoration"));
  assert.ok(FAMILIAR_SHOP_OFFERS.every((offer) => ["theme", "gadget", "familiar", "bundle"].includes(offer.kind)));
  assert.ok(themes.every((offer) => FAMILIAR_HABITAT_THEMES.some((theme) => theme.id === offer.themeId)));
});

test("every real-money Famiglio offer is explicitly active", () => {
  const paidOffers = FAMILIAR_SHOP_OFFERS.filter((offer) => offer.priceCents);
  assert.equal(PREMIUM_FAMILIAR_LOOKS.length, 7);
  assert.equal(paidOffers.length, 14);
  assert.ok(paidOffers.every((offer) => offer.status === "active"));
  assert.ok(PREMIUM_FAMILIAR_LOOKS.every((look) => paidOffers.some((offer) => offer.id === look.id && offer.kind === "gadget")));
});

test("a new Famiglio receives enough free resources for every fundamental care action", () => {
  const initial = createNexusFamiliar(now, "free-care-resources");
  assert.ok(initial.inventory.food > 0);
  assert.ok(initial.inventory.soap > 0);
  assert.ok(initial.inventory.toy > 0);
  assert.ok(initial.inventory.medicine > 0);
});

test("habitat and premium-look bundles keep their declared payment models", () => {
  const bundle = FAMILIAR_SHOP_OFFERS.find((offer) => offer.id === "bundle-dimore");
  assert.equal(bundle?.kind, "bundle");
  assert.equal(bundle?.bundleCategory, "themes");
  assert.equal(bundle?.priceCents, 399);
  assert.equal(bundle?.priceCoins, undefined);
  const gadgetBundle = FAMILIAR_SHOP_OFFERS.find((offer) => offer.id === "bundle-gadget");
  assert.equal(gadgetBundle?.bundleCategory, "premium-gadgets");
  assert.equal(gadgetBundle?.priceCents, 499);
});

test("buys, unlocks and equips a habitat without charging it twice", () => {
  const initial = { ...createNexusFamiliar(now, "world-shop"), nexusCoins: 140 };
  const bought = purchaseFamiliarThemeWithCoins(initial, "tema-giardino-lucciole", now);
  assert.equal(bought.ok, true);
  assert.equal(bought.state.nexusCoins, 40);
  assert.equal(bought.state.den.theme, "giardino-lucciole");
  assert.ok(bought.state.den.unlockedThemes.includes("giardino-lucciole"));

  const equippedAgain = purchaseFamiliarThemeWithCoins(bought.state, "tema-giardino-lucciole", now);
  assert.equal(equippedAgain.ok, true);
  assert.equal(equippedAgain.state.nexusCoins, 40);
});

test("refuses unaffordable or locked habitat changes", () => {
  const initial = { ...createNexusFamiliar(now, "world-poor"), nexusCoins: 0 };
  assert.equal(purchaseFamiliarThemeWithCoins(initial, "tema-serra-celeste", now).ok, false);
  assert.equal(equipFamiliarTheme(initial, "serra-celeste", now).ok, false);
});

test("gadget purchases unlock and equip complete Famiglio looks", () => {
  const initial = { ...createNexusFamiliar(now, "world-gadget"), nexusCoins: 100 };
  const bought = purchaseFamiliarGadgetWithCoins(initial, "berretto-stellare", now);
  assert.equal(bought.ok, true);
  assert.equal(bought.state.nexusCoins, 20);
  assert.equal(bought.state.den.equippedGadget, "berretto-stellare");
  assert.deepEqual(bought.state.den.unlockedGadgets, ["berretto-stellare"]);
  const equippedAgain = purchaseFamiliarGadgetWithCoins(bought.state, "berretto-stellare", now);
  assert.equal(equippedAgain.ok, true);
  assert.equal(equippedAgain.state.nexusCoins, 20);
});

test("allows at most three real outings per day", () => {
  let state = { ...createNexusFamiliar(now, "world-daily-limit"), needs: { hunger: 100, hygiene: 100, energy: 100, happiness: 100, health: 100 } };
  for (let index = 0; index < 3; index += 1) {
    const started = startFamiliarOuting(state, "sentiero-luminoso", new Date(now.getTime() + index * 6 * 60_000));
    assert.equal(started.ok, true);
    const claimed = claimFamiliarOuting(started.state, new Date(now.getTime() + (index * 6 + 5) * 60_000));
    assert.equal(claimed.ok, true);
    state = claimed.state;
  }
  assert.equal(state.dailyProgress.outingsStarted, 3);
  assert.equal(startFamiliarOuting(state, "sentiero-luminoso", new Date(now.getTime() + 20 * 60_000)).ok, false);
});
