import assert from "node:assert/strict";
import test from "node:test";
import { createNexusFamiliar, grantFamiliarProgress, useFamiliarItem } from "../lib/nexusFamiliar.ts";
import { familiarLevelDiscount } from "../lib/nexusFamiliarBenefits.ts";
import { familiarExperienceForLevel } from "../lib/nexusFamiliarProgression.ts";
import { resolveFamiliarProduct } from "../lib/commercialCatalog.ts";
import { DEFAULT_FAMILIAR_IDS, FAMILIAR_BUNDLES, MEDUSA_FAMILIAR_CATALOG, PREMIUM_COVERS } from "../lib/famiglioMarketExpansion.ts";
import { claimFamiliarOuting, FAMILIAR_SHOP_OFFERS, purchaseFamiliarThemeWithCoins, startFamiliarOuting } from "../lib/nexusFamiliarWorld.ts";

const start = new Date("2026-08-29T08:00:00.000Z");

test("completes the real care, mission, outing, shop and commercial-benefit loop", () => {
  let state = createNexusFamiliar(start, "economy-loop", "dog-1", { name: "Sole", sex: "female" });
  state = { ...state, needs: { hunger: 30, hygiene: 40, energy: 90, happiness: 80, health: 100 } };

  const cared = useFamiliarItem(state, "food", start);
  assert.equal(cared.ok, true);
  assert.equal(cared.state.experience, 7);
  assert.equal(cared.state.inventory.food, 4);

  const missionRewarded = grantFamiliarProgress(cared.state, { items: { soap: 2 }, coins: 6, experience: 25 }, start);
  assert.equal(missionRewarded.nexusCoins, 41);
  assert.equal(missionRewarded.inventory.soap, 5);

  const departed = startFamiliarOuting(missionRewarded, "giardino-delle-stelle", start);
  assert.equal(departed.ok, true);
  const returned = claimFamiliarOuting(departed.state, new Date(start.getTime() + 10 * 60_000));
  assert.equal(returned.ok, true);
  assert.equal(returned.state.nexusCoins, 54);
  assert.equal(returned.state.experience, 92);

  const preparedForShop = { ...returned.state, nexusCoins: 100 };
  const purchased = purchaseFamiliarThemeWithCoins(preparedForShop, "tema-giardino-lucciole", new Date(start.getTime() + 11 * 60_000));
  assert.equal(purchased.ok, true);
  assert.equal(purchased.state.nexusCoins, 0);
  assert.equal(purchased.state.den.theme, "giardino-lucciole");

  const levelTen = grantFamiliarProgress(purchased.state, { experience: familiarExperienceForLevel(10) }, start);
  assert.ok(levelTen.level >= 10);
  assert.equal(familiarLevelDiscount(levelTen.level, "giwise-shop"), 1);
  assert.equal(familiarLevelDiscount(levelTen.level, "commissioni"), 1);
});

test("legacy client-side economic mutations have been removed", async () => {
  const source = await import("node:fs/promises").then((fs) => fs.readFile(new URL("../components/NexusFamiliarExperience.tsx", import.meta.url), "utf8"));
  assert.doesNotMatch(source, /const synchronized = await commitEconomyState\(next\)/);
  assert.match(source, /if \(cloudReadyRef\.current\)/);
  assert.match(source, /runAuthoritativeCommand/);
});

test("account economy mutations use authoritative server commands", async () => {
  const source = await import("node:fs/promises").then((fs) => fs.readFile(new URL("../components/NexusFamiliarExperience.tsx", import.meta.url), "utf8"));
  assert.match(source, /runAuthoritativeCommand\("care", command\)/);
  assert.match(source, /runAuthoritativeCommand\("outing-start", destinationId\)/);
  assert.match(source, /runAuthoritativeCommand\("theme", offerId\)/);
  assert.match(source, /payload\.familiar \? sanitizeFamiliarCloudState/);
  assert.match(source, /payload\.conflict === true/);
  assert.match(source, /runAuthoritativeCommand\(command, value, false\)/);
  assert.match(source, /payload\.missingFamiliar === true/);
  assert.match(source, /persistFamiliarRef\.current\(stateRef\.current, revision\)/);
});

test("revision conflicts are explicitly retryable for care and outings", async () => {
  const source = await import("node:fs/promises").then((fs) => fs.readFile(new URL("../app/api/famiglio/command/route.ts", import.meta.url), "utf8"));
  assert.equal((source.match(/conflict: true/g) ?? []).length, 2);
  assert.match(source, /current\.revision !== baseRevision/);
  assert.match(source, /latest\.revision/);
  assert.match(source, /missingFamiliar: true/);
});

test("local preview can complete a confirmed Famiglio reset while account sync is offline", async () => {
  const source = await import("node:fs/promises").then((fs) => fs.readFile(new URL("../components/NexusFamiliarExperience.tsx", import.meta.url), "utf8"));
  assert.match(source, /FAMILIAR_PENDING_DELETE_STORAGE_KEY/);
  assert.match(source, /if \(!isLocalPreviewHost\(\)\)/);
  assert.match(source, /setCloudStatus\("local"\)/);
  assert.match(source, /pendingDeleteId && remote\?\.familiarId === pendingDeleteId/);
});

test("paid Famiglio offers use protected checkout and idempotent fulfillment", async () => {
  const fs = await import("node:fs/promises");
  const [checkout, webhook, migration, benefits] = await Promise.all([
    fs.readFile(new URL("../app/api/checkout/route.ts", import.meta.url), "utf8"),
    fs.readFile(new URL("../app/api/stripe/webhook/route.ts", import.meta.url), "utf8"),
    fs.readFile(new URL("../drizzle/0030_nexus_familiar_economy.sql", import.meta.url), "utf8"),
    fs.readFile(new URL("../app/api/account/benefits/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(checkout, /"merchandise"/);
  assert.match(checkout, /familiarOfferId/);
  assert.match(checkout, /product\.productType === "merchandise"/);
  assert.match(checkout, /purchasedPremiumFamiliarIds/);
  assert.match(webhook, /alreadyFulfilled/);
  assert.match(webhook, /nexus_familiar_economy_events/);
  assert.match(webhook, /paid_fulfillment/);
  assert.match(webhook, /paid_refund/);
  assert.match(webhook, /revokeFamiliarOffer/);
  assert.match(webhook, /grantedThemeIds/);
  assert.match(webhook, /paid_refund/);
  assert.match(migration, /UNIQUE\s*\(customer_id, source_key\)/);
  assert.match(benefits, /familiarEconomyHistory/);
});

test("every active Famiglio payment maps to one coherent commercial product", () => {
  const paidOffers = FAMILIAR_SHOP_OFFERS.filter((offer) => offer.status === "active" && offer.priceCents);
  const paidCodes = paidOffers.map((offer) => `LW-FAM-${offer.id.toUpperCase()}`);
  assert.equal(new Set(paidCodes).size, paidCodes.length);

  for (const offer of paidOffers) {
    const product = resolveFamiliarProduct(`LW-FAM-${offer.id.toUpperCase()}`);
    assert.ok(product, `Prodotto mancante per ${offer.id}`);
    assert.equal(product.amountCents, offer.priceCents);
    assert.equal(product.familiarOfferId, offer.id);
    assert.equal(product.productType, "merchandise");
  }

  const paidFamiliarIds = new Set(paidOffers.flatMap((offer) => offer.kind === "familiar" && offer.appearanceId ? [offer.appearanceId] : []));
  for (const starterId of DEFAULT_FAMILIAR_IDS) assert.equal(paidFamiliarIds.has(starterId), false);
  for (const legendary of MEDUSA_FAMILIAR_CATALOG.filter((entry) => entry.rarity === "leggendario")) {
    assert.equal(paidFamiliarIds.has(legendary.id), false);
  }

  for (const cover of PREMIUM_COVERS) {
    assert.equal(paidOffers.filter((offer) => offer.kind === "cover" && offer.coverId === cover.id).length, 1);
  }
  for (const bundle of FAMILIAR_BUNDLES) {
    const matchingOffers = paidOffers.filter((offer) => offer.bundleCategory === "familiars" && offer.appearanceIds?.includes(bundle.familiars[0]?.id));
    assert.equal(matchingOffers.length, bundle.id === "legendary" ? 0 : 1);
  }
});

test("Famiglio recognition reaches public community profiles without replacing subscription badges", async () => {
  const fs = await import("node:fs/promises");
  const [artCommunity, gameCommunity] = await Promise.all([
    fs.readFile(new URL("../app/api/art-community/route.ts", import.meta.url), "utf8"),
    fs.readFile(new URL("../app/api/game-community/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(artCommunity, /familiarCommunityTitle/);
  assert.match(artCommunity, /familiarBadge/);
  assert.match(gameCommunity, /familiarCommunityTitle/);
  assert.match(gameCommunity, /familiarBadge/);
});
