import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { FAMILIAR_SLOT_OFFER_IDS, familiarSlotEntitlement, MAX_FAMILIAR_SLOT_COUNT, PURCHASABLE_EXTRA_FAMILIAR_SLOTS } from "../lib/nexusFamiliarSlots.ts";
import { DEFAULT_FAMILIAR_IDS, MEDUSA_FAMILIAR_CATALOG } from "../lib/famiglioMarketExpansion.ts";
import { FAMILIAR_SHOP_OFFERS } from "../lib/nexusFamiliarWorld.ts";

test("Medusa sells two independent 0.99 euro Houses up to three Famigli", () => {
  assert.equal(PURCHASABLE_EXTRA_FAMILIAR_SLOTS, 2);
  assert.equal(MAX_FAMILIAR_SLOT_COUNT, 3);
  assert.deepEqual(familiarSlotEntitlement(0, 1), { purchasedExtraSlots: 0, slotLimit: 1, preservedSlotCount: 1, canStartPremiumSlot: false, status: "standard" });
  assert.equal(familiarSlotEntitlement(1, 1).slotLimit, 2);
  assert.equal(familiarSlotEntitlement(2, 2).canStartPremiumSlot, true);
  assert.equal(familiarSlotEntitlement(2, 3).canStartPremiumSlot, false);
  const offers = FAMILIAR_SHOP_OFFERS.filter((offer) => FAMILIAR_SLOT_OFFER_IDS.includes(offer.id));
  assert.equal(offers.length, 2);
  assert.ok(offers.every((offer) => offer.kind === "slot" && offer.priceCents === 99));
});

test("starter Famigli are free choices and never appear in Medusa catalog or bundles", () => {
  assert.equal(DEFAULT_FAMILIAR_IDS.size, 8);
  assert.ok(MEDUSA_FAMILIAR_CATALOG.every((entry) => !DEFAULT_FAMILIAR_IDS.has(entry.id)));
});

test("slot API derives the limit from purchased Medusa entitlements", async () => {
  const source = await readFile(new URL("../app/api/famiglio/slots/route.ts", import.meta.url), "utf8");
  assert.match(source, /FAMILIAR_SLOT_OFFER_IDS/);
  assert.match(source, /purchasedSlotCount\(purchasedOfferIds\)/);
  assert.match(source, /purchasedFamiliarOfferIds\(database, user\.id\)/);
  assert.match(source, /isPremiumFamiliarAppearance\(candidate\.appearanceId\)/);
  assert.doesNotMatch(source, /body\.(?:passActive|subscriptionActive)/);
});

test("slot storage stays isolated per LoreWise ID and Familiar", async () => {
  const migration = await readFile(new URL("../drizzle/0031_nexus_familiar_slots.sql", import.meta.url), "utf8");
  assert.match(migration, /PRIMARY KEY \(customer_id, familiar_id\)/);
  assert.match(migration, /REFERENCES customers\(id\)/);
});
