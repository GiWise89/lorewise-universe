import test from "node:test";
import assert from "node:assert/strict";
import { calculateArtworkCreditGrant, calculateCommissionBenefit, calculatePurchaseBenefit, discountPercentForProduct, isPermanentCollectorEmail, pollIsOpen, universePassBenefitFromCode } from "../lib/universePass.ts";

test("recognizes the automatic commission discount for every Universe Pass", () => {
  assert.equal(universePassBenefitFromCode(null).commissionDiscountPercent, 0);
  assert.equal(universePassBenefitFromCode("LW-PASS-SUPPORTER").commissionDiscountPercent, 5);
  assert.equal(universePassBenefitFromCode("LW-PASS-COLLECTOR").commissionDiscountPercent, 10);
});

test("reserves the permanent Collector grant for the LoreWise owner email", () => {
  assert.equal(isPermanentCollectorEmail("lorewise.archive@gmail.com"), true);
  assert.equal(isPermanentCollectorEmail(" LOREWISE.ARCHIVE@GMAIL.COM "), true);
  assert.equal(isPermanentCollectorEmail("member@example.com"), false);
});

test("calculates and records the final commission price in integer cents", () => {
  assert.deepEqual(calculateCommissionBenefit(10_000, 0), { baseCents: 10_000, discountPercent: 0, discountCents: 0, finalCents: 10_000 });
  assert.deepEqual(calculateCommissionBenefit(10_000, 5), { baseCents: 10_000, discountPercent: 5, discountCents: 500, finalCents: 9_500 });
  assert.deepEqual(calculateCommissionBenefit(10_000, 10), { baseCents: 10_000, discountPercent: 10, discountCents: 1_000, finalCents: 9_000 });
  assert.deepEqual(calculateCommissionBenefit(5_999, 5), { baseCents: 5_999, discountPercent: 5, discountCents: 300, finalCents: 5_699 });
});

test("rejects invalid commission bases", () => {
  assert.throws(() => calculateCommissionBenefit(-1, 5), /non valido/i);
  assert.throws(() => calculateCommissionBenefit(10.5, 5), /non valido/i);
});

test("applies the account plan automatically with a stronger artwork discount", () => {
  const supporter = universePassBenefitFromCode("LW-PASS-SUPPORTER");
  const collector = universePassBenefitFromCode("LW-PASS-COLLECTOR");
  assert.equal(discountPercentForProduct(supporter, "game"), 5);
  assert.equal(discountPercentForProduct(supporter, "artwork"), 10);
  assert.equal(discountPercentForProduct(collector, "artwork"), 20);
  assert.equal(discountPercentForProduct(collector, "merchandise"), 10);
  assert.deepEqual(calculatePurchaseBenefit(599, 10), { baseCents: 599, discountPercent: 10, discountCents: 60, finalCents: 539 });
});

test("caps monthly artwork credits without duplicating the wallet balance", () => {
  assert.equal(calculateArtworkCreditGrant(0, 2, 4), 2);
  assert.equal(calculateArtworkCreditGrant(3, 2, 4), 1);
  assert.equal(calculateArtworkCreditGrant(4, 2, 4), 0);
  assert.throws(() => calculateArtworkCreditGrant(-1, 2, 4), /non valido/i);
});

test("opens and closes studio polls using their declared dates", () => {
  assert.equal(pollIsOpen("2026-08-20T00:00:00Z", "2026-08-31T23:59:59Z", new Date("2026-08-20T12:00:00Z")), true);
  assert.equal(pollIsOpen("2026-08-20T00:00:00Z", "2026-08-31T23:59:59Z", new Date("2026-09-01T00:00:00Z")), false);
});
