import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { calculateArtworkCreditGrant, calculateCommissionBenefit, calculatePurchaseBenefit, discountPercentForProduct, isPermanentCollectorEmail, pollIsOpen, universePassBenefitFromCode } from "../lib/universePass.ts";
import { CORRUPTED_PORTRAIT_PACKAGE, commissionDiscountForSubmission, getCommissionPromotionForSubmission, isCommissionOpeningPromotionActive, isCorruptedPortraitPromotionActive, isHolidayNexusPromotionActive } from "../lib/commissionPromotion.ts";

test("recognizes the automatic commission discount for every Universe Pass", () => {
  assert.equal(universePassBenefitFromCode(null).commissionDiscountPercent, 0);
  assert.equal(universePassBenefitFromCode("LW-PASS-SUPPORTER").commissionDiscountPercent, 5);
  assert.equal(universePassBenefitFromCode("LW-PASS-COLLECTOR").commissionDiscountPercent, 10);
});

test("applies the opening promotion only to requests submitted during its declared period", () => {
  assert.equal(isCommissionOpeningPromotionActive("2026-08-21T21:59:59Z"), false);
  assert.equal(isCommissionOpeningPromotionActive("2026-08-21T22:00:00Z"), true);
  assert.equal(isCommissionOpeningPromotionActive("2026-09-30T21:59:59Z"), true);
  assert.equal(isCommissionOpeningPromotionActive("2026-09-30T22:00:00Z"), false);
  assert.equal(commissionDiscountForSubmission({ planCode: null, ordinaryDiscountPercent: 0, submittedAt: "2026-08-22T12:00:00Z" }), 10);
  assert.equal(commissionDiscountForSubmission({ planCode: "LW-PASS-SUPPORTER", ordinaryDiscountPercent: 5, submittedAt: "2026-08-22T12:00:00Z" }), 15);
  assert.equal(commissionDiscountForSubmission({ planCode: "LW-PASS-COLLECTOR", ordinaryDiscountPercent: 10, submittedAt: "2026-08-22T12:00:00Z" }), 20);
  assert.equal(commissionDiscountForSubmission({ planCode: "LW-PASS-COLLECTOR", ordinaryDiscountPercent: 10, submittedAt: "2026-10-01T12:00:00Z" }), 10);
});

test("applies the Halloween 15/20/25 rates only to La mia versione corrotta during Halloween week", () => {
  assert.equal(isCorruptedPortraitPromotionActive("2026-10-25T22:59:59Z"), false);
  assert.equal(isCorruptedPortraitPromotionActive("2026-10-25T23:00:00Z"), true);
  assert.equal(isCorruptedPortraitPromotionActive("2026-11-01T22:59:59Z"), true);
  assert.equal(isCorruptedPortraitPromotionActive("2026-11-01T23:00:00Z"), false);
  assert.equal(getCommissionPromotionForSubmission(CORRUPTED_PORTRAIT_PACKAGE, "2026-10-31T12:00:00Z")?.label, "La mia versione corrotta");
  assert.equal(getCommissionPromotionForSubmission("Ritratto Completo", "2026-10-31T12:00:00Z"), null);
  assert.equal(commissionDiscountForSubmission({ planCode: null, ordinaryDiscountPercent: 0, packageName: CORRUPTED_PORTRAIT_PACKAGE, submittedAt: "2026-10-31T12:00:00Z" }), 15);
  assert.equal(commissionDiscountForSubmission({ planCode: "LW-PASS-SUPPORTER", ordinaryDiscountPercent: 5, packageName: CORRUPTED_PORTRAIT_PACKAGE, submittedAt: "2026-10-31T12:00:00Z" }), 20);
  assert.equal(commissionDiscountForSubmission({ planCode: "LW-PASS-COLLECTOR", ordinaryDiscountPercent: 10, packageName: CORRUPTED_PORTRAIT_PACKAGE, submittedAt: "2026-10-31T12:00:00Z" }), 25);
  assert.equal(commissionDiscountForSubmission({ planCode: "LW-PASS-COLLECTOR", ordinaryDiscountPercent: 10, packageName: "Ritratto Completo", submittedAt: "2026-10-31T12:00:00Z" }), 10);
});

test("applies the Feste nel Nexus rates from 1 December through 1 January", () => {
  assert.equal(isHolidayNexusPromotionActive("2026-11-30T22:59:59Z"), false);
  assert.equal(isHolidayNexusPromotionActive("2026-11-30T23:00:00Z"), true);
  assert.equal(isHolidayNexusPromotionActive("2027-01-01T22:59:59Z"), true);
  assert.equal(isHolidayNexusPromotionActive("2027-01-01T23:00:00Z"), false);
  assert.equal(getCommissionPromotionForSubmission("Ritratto Completo", "2026-12-20T12:00:00Z")?.label, "Feste nel Nexus");
  assert.equal(commissionDiscountForSubmission({ planCode: null, ordinaryDiscountPercent: 0, packageName: "Ritratto Completo", submittedAt: "2026-12-20T12:00:00Z" }), 10);
  assert.equal(commissionDiscountForSubmission({ planCode: "LW-PASS-SUPPORTER", ordinaryDiscountPercent: 5, packageName: "Ritratto Completo", submittedAt: "2026-12-20T12:00:00Z" }), 15);
  assert.equal(commissionDiscountForSubmission({ planCode: "LW-PASS-COLLECTOR", ordinaryDiscountPercent: 10, packageName: "Opera Narrativa", submittedAt: "2027-01-01T12:00:00Z" }), 20);
  assert.equal(commissionDiscountForSubmission({ planCode: "LW-PASS-COLLECTOR", ordinaryDiscountPercent: 10, packageName: "Opera Narrativa", submittedAt: "2027-01-02T12:00:00Z" }), 10);
});

test("offers a local-only commission preview for the Feste nel Nexus campaign", () => {
  const source = readFileSync(new URL("../app/commissioni/page.tsx", import.meta.url), "utf8");
  const chroniclePage = readFileSync(new URL("../app/cronache-del-nexus/page.tsx", import.meta.url), "utf8");
  assert.match(source, /query\?\.anteprima === "feste"/);
  assert.match(source, /holidayNexusPromotion/);
  assert.match(source, /LOREWISE_LOCAL_CALENDAR_PREVIEW/);
  assert.match(source, /previewQuery=\{previewQuery\}/);
  assert.match(source, /&anteprima=\$\{encodeURIComponent\(previewQuery\)\}/);
  assert.match(source, /commission-request-promotion-summary/);
  assert.match(chroniclePage, /holidayNexusPromotion/);
  assert.match(chroniclePage, /promotion\.startsAt\.slice\(0, 10\)/);
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

test("presenta il Pass con piani, vantaggi e percorso breve", () => {
  const page = readFileSync(new URL("../app/abbonamento/page.tsx", import.meta.url), "utf8");
  assert.match(page, /Gratuito, Supporter o Collector/);
  assert.match(page, /Cinque vantaggi per vivere LoreWise più da vicino/);
  assert.doesNotMatch(page, /labirint|confus/i);
  assert.match(page, /Tre passaggi\. Poi trovi tutto nel tuo spazio/);
  assert.match(page, /The Wound Remembers resta giocabile per tutti/);
  assert.doesNotMatch(page, /il server legge|applicato dal server|Stripe opera/);
});

test("collega i pulsanti iniziali alle sezioni della pagina con ancore native", () => {
  const page = readFileSync(new URL("../app/abbonamento/page.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../app/abbonamento/pass-focus.module.css", import.meta.url), "utf8");
  assert.match(page, /<a className=\{styles\.primaryButton\} href="#piani">Confronta i piani<\/a>/);
  assert.match(page, /<a className=\{styles\.secondaryButton\} href="#vantaggi">Vedi cosa include<\/a>/);
  assert.match(page, /id="piani"/);
  assert.match(page, /id="vantaggi"/);
  assert.match(styles, /\.benefits\{scroll-margin-top:88px/);
});
