import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { calculateBestCommissionDiscount, claimWelcomeCommissionOffer, getWelcomeCommissionOfferForRequest, isWelcomeCommissionOfferActive, syncWelcomeCommissionOfferEntitlement, welcomeCommissionEligibilityStartsAt, welcomeCommissionOfferExpiresAt, welcomeCommissionRegistrationIsEligible, WELCOME_COMMISSION_OFFER } from "../lib/welcomeCommissionOffer.ts";
import { DatabaseSync } from "node:sqlite";

function d1Adapter(database) {
  return {
    prepare(sql) {
      const statement = database.prepare(sql);
      let values = [];
      return {
        bind(...nextValues) { values = nextValues; return this; },
        run() { const result = statement.run(...values); return Promise.resolve({ meta: { changes: Number(result.changes) } }); },
        first() { return Promise.resolve(statement.get(...values)); },
      };
    },
  };
}

test("limits the welcome commission offer to the agreed registration period", () => {
  assert.equal(WELCOME_COMMISSION_OFFER.discountCents, 500);
  assert.equal(WELCOME_COMMISSION_OFFER.validityDaysAfterConfirmation, 30);
  assert.equal(isWelcomeCommissionOfferActive("2026-08-24T23:59:59+02:00"), false);
  assert.equal(isWelcomeCommissionOfferActive("2026-08-25T00:00:00+02:00"), true);
  assert.equal(isWelcomeCommissionOfferActive("2026-09-30T23:59:59+02:00"), true);
  assert.equal(isWelcomeCommissionOfferActive("2026-10-01T00:00:00+02:00"), false);
});

test("grants the offer to an existing confirmed account with no earlier commission", async () => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(`PRAGMA foreign_keys = ON;
    CREATE TABLE customers (id TEXT PRIMARY KEY, email TEXT NOT NULL);
    CREATE TABLE commission_requests (id TEXT PRIMARY KEY, customer_id TEXT, created_at TEXT NOT NULL);
    INSERT INTO customers (id, email) VALUES ('customer-old', 'old@example.com');
    INSERT INTO commission_requests (id, customer_id, created_at) VALUES ('request-old', 'customer-old', '2026-08-28 12:00:00');`);
  const database = d1Adapter(sqlite);
  await syncWelcomeCommissionOfferEntitlement(database, {
    id: "customer-old",
    created_at: "2025-04-10T08:00:00.000Z",
    email_confirmed_at: "2025-04-10T08:05:00.000Z",
  });
  assert.equal((await getWelcomeCommissionOfferForRequest(database, "request-old"))?.discount_cents, 500);
  sqlite.close();
});

test("includes existing confirmed accounts and excludes confirmations after the campaign", () => {
  assert.equal(welcomeCommissionRegistrationIsEligible("2026-08-25T09:00:00+02:00", "2026-08-25T09:05:00+02:00"), true);
  assert.equal(welcomeCommissionRegistrationIsEligible("2026-09-30T23:30:00+02:00", "2026-09-30T23:59:00+02:00"), true);
  assert.equal(welcomeCommissionRegistrationIsEligible("2025-04-10T09:00:00+02:00", "2025-04-10T09:05:00+02:00"), true);
  assert.equal(welcomeCommissionRegistrationIsEligible("2026-09-30T23:30:00+02:00", "2026-10-01T00:01:00+02:00"), false);
  assert.equal(welcomeCommissionEligibilityStartsAt("2025-04-10T09:05:00+02:00"), "2026-08-24T22:00:00.000Z");
  assert.equal(welcomeCommissionOfferExpiresAt("2025-04-10T09:05:00+02:00"), "2026-10-30T21:59:59.999Z");
  assert.equal(welcomeCommissionOfferExpiresAt("2026-09-01T10:00:00+02:00"), "2026-10-01T08:00:00.000Z");
});

test("applies one non-stackable discount and always chooses the most convenient", () => {
  assert.deepEqual(calculateBestCommissionDiscount({
    baseCents: 4_000, percentage: 10, percentageCode: "opening", percentageLabel: "Promozione di apertura", welcomeOfferEligible: true,
  }), {
    baseCents: 4_000, discountPercent: 0, discountCents: 500, finalCents: 3_500,
    code: WELCOME_COMMISSION_OFFER.code, label: "Bonus LoreWise ID", kind: "fixed", value: 500,
  });
  assert.deepEqual(calculateBestCommissionDiscount({
    baseCents: 10_000, percentage: 20, percentageCode: "opening", percentageLabel: "Promozione di apertura", welcomeOfferEligible: true,
  }), {
    baseCents: 10_000, discountPercent: 20, discountCents: 2_000, finalCents: 8_000,
    code: "opening", label: "Promozione di apertura", kind: "percentage", value: 20,
  });
  assert.equal(calculateBestCommissionDiscount({
    baseCents: 300, percentage: 0, percentageCode: null, percentageLabel: "Visitatore", welcomeOfferEligible: true,
  }).finalCents, 0);
});

test("persists one entitlement and reserves it only for the customer's first request", async () => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(`PRAGMA foreign_keys = ON;
    CREATE TABLE customers (id TEXT PRIMARY KEY, email TEXT NOT NULL);
    CREATE TABLE commission_requests (id TEXT PRIMARY KEY, customer_id TEXT, created_at TEXT NOT NULL);`);
  sqlite.prepare("INSERT INTO customers (id, email) VALUES (?, ?)").run("customer-1", "member@example.com");
  const database = d1Adapter(sqlite);
  const issued = await syncWelcomeCommissionOfferEntitlement(database, {
    id: "customer-1",
    created_at: "2026-08-25T08:00:00.000Z",
    email_confirmed_at: "2026-08-25T08:05:00.000Z",
  });
  assert.equal(issued, true);
  sqlite.prepare("INSERT INTO commission_requests (id, customer_id, created_at) VALUES (?, ?, ?)")
    .run("request-1", "customer-1", "2026-08-26 10:00:00");
  assert.equal(await claimWelcomeCommissionOffer(database, "customer-1", "request-1", "2026-08-26 10:00:00"), true);
  assert.equal((await getWelcomeCommissionOfferForRequest(database, "request-1"))?.discount_cents, 500);
  sqlite.prepare("INSERT INTO commission_requests (id, customer_id, created_at) VALUES (?, ?, ?)")
    .run("request-2", "customer-1", "2026-08-27 10:00:00");
  assert.equal(await claimWelcomeCommissionOffer(database, "customer-1", "request-2", "2026-08-27 10:00:00"), false);
  sqlite.close();
});

test("uses concise copy and opens LoreWise ID access for new and existing members", () => {
  assert.equal(WELCOME_COMMISSION_OFFER.title, "5 € sulla tua prima commissione");
  assert.match(WELCOME_COMMISSION_OFFER.description, /account già confermati/);
  assert.equal(WELCOME_COMMISSION_OFFER.action, "Accedi o crea il LoreWise ID");
  assert.equal(WELCOME_COMMISSION_OFFER.href, "/account#account-signin-title");
});

test("renders a dismissible accessible popup with a real brand asset", async () => {
  const [popup, home, account, accessPanel, styles] = await Promise.all([
    readFile(new URL("../components/WelcomeCommissionPopup.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/account/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/AccountAccessPanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(popup, /role="dialog"/);
  assert.match(popup, /aria-label="Chiudi l’offerta di benvenuto"/);
  assert.match(popup, /lorewise-wax-seal-v1\.webp/);
  assert.match(popup, /localStorage\.setItem/);
  assert.match(home, /<WelcomeCommissionPopup/);
  assert.match(account, /initialAuthMode/);
  assert.match(accessPanel, /initialMode = "login"/);
  assert.match(styles, /\.welcome-commission-emblem \{[^}]*object-fit:contain;/s);
});

test("presents the active 5 euro bonus as a premium path inside Promotions", async () => {
  const [feed, styles] = await Promise.all([
    readFile(new URL("../components/NexusChroniclesFeed.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(feed, /promotion-panel[\s\S]*nexus-welcome-offer/);
  assert.match(feed, /Bonus LoreWise ID · In vigore/);
  assert.match(feed, /Account già confermati[\s\S]*30 ottobre/);
  assert.match(feed, /WELCOME_COMMISSION_OFFER\.href/);
  assert.match(feed, /lorewise-wax-seal-v1\.webp/);
  assert.match(styles, /\.nexus-welcome-offer-seal img \{[^}]*object-fit:contain;/s);
  assert.match(styles, /\.nexus-welcome-offer-copy > a/);
});

test("connects the confirmed LoreWise ID entitlement to first-request and quote persistence", async () => {
  const [customer, requestRoute, adminRoute, migration] = await Promise.all([
    readFile(new URL("../lib/supabase/customer.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/commission-requests/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/commission-admin/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0027_welcome_commission_offer.sql", import.meta.url), "utf8"),
  ]);
  assert.match(customer, /syncWelcomeCommissionOfferEntitlement/);
  assert.match(requestRoute, /claimWelcomeCommissionOffer/);
  assert.match(adminRoute, /calculateBestCommissionDiscount/);
  assert.match(adminRoute, /pricing_discount_code/);
  assert.match(migration, /commission_offer_entitlements/);
  assert.match(migration, /claimed_request_id TEXT UNIQUE/);
});
