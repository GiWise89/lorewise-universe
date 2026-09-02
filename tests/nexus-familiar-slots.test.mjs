import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { familiarSlotEntitlement, MAX_FAMILIAR_SLOT_COUNT, UNIVERSE_PASS_EXTRA_FAMILIAR_SLOTS } from "../lib/nexusFamiliarSlots.ts";

test("Universe Pass adds exactly two server-managed Famiglio slots", () => {
  assert.equal(UNIVERSE_PASS_EXTRA_FAMILIAR_SLOTS, 2);
  assert.equal(MAX_FAMILIAR_SLOT_COUNT, 3);
  assert.deepEqual(familiarSlotEntitlement(true, 1), {
    passActive: true,
    slotLimit: 3,
    preservedSlotCount: 1,
    canStartPremiumSlot: true,
    status: "active",
  });
});

test("expiration preserves raised Famigli while blocking only new premium slots", () => {
  const expired = familiarSlotEntitlement(false, 3);
  assert.equal(expired.status, "expired-preserved");
  assert.equal(expired.preservedSlotCount, 3);
  assert.equal(expired.canStartPremiumSlot, false);
  assert.equal(expired.slotLimit, 1);
});

test("reactivation restores creation until all three slots are occupied", () => {
  assert.equal(familiarSlotEntitlement(true, 2).canStartPremiumSlot, true);
  assert.equal(familiarSlotEntitlement(true, 3).canStartPremiumSlot, false);
});

test("slot API verifies Universe Pass on the server and permits preserved switching", async () => {
  const source = await readFile(new URL("../app/api/famiglio/slots/route.ts", import.meta.url), "utf8");
  assert.match(source, /getActiveUniversePass\(database, user\.id\)/);
  assert.match(source, /if \(action === "start"\)/);
  assert.match(source, /familiarSlotEntitlement\(pass\.active/);
  assert.match(source, /purchasedPremiumFamiliarIds\(database, user\.id\)/);
  assert.match(source, /purchasedFamiliarOfferIds\(database, user\.id\)/);
  assert.match(source, /isPremiumFamiliarAppearance\(candidate\.appearanceId\)/);
  assert.match(source, /else \{\s*const familiarId/);
  assert.doesNotMatch(source, /body\.(?:passActive|subscriptionActive)/);
});

test("paid Famigli become adoptable only through active LoreWise entitlements", async () => {
  const commerce = await readFile(new URL("../lib/nexusFamiliarCommerce.ts", import.meta.url), "utf8");
  const familiarApi = await readFile(new URL("../app/api/famiglio/route.ts", import.meta.url), "utf8");
  const experience = await readFile(new URL("../components/NexusFamiliarExperience.tsx", import.meta.url), "utf8");
  assert.match(commerce, /resource_type = 'merchandise' AND status = 'active'/);
  assert.match(commerce, /bundleCategory === "familiars"/);
  assert.match(familiarApi, /canAdoptFamiliarAppearance/);
  assert.match(experience, /purchasedPremiumFamiliars/);
  assert.match(experience, /slotAdoptionCandidates/);
  assert.match(experience, /paidOwned \? "Disponibile" : "Acquista"/);
});

test("slot storage is isolated per LoreWise ID and Familiar", async () => {
  const migration = await readFile(new URL("../drizzle/0031_nexus_familiar_slots.sql", import.meta.url), "utf8");
  assert.match(migration, /PRIMARY KEY \(customer_id, familiar_id\)/);
  assert.match(migration, /REFERENCES customers\(id\)/);
});
