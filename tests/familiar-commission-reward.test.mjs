import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import {
  claimFamiliarCommissionReward,
  FAMILIAR_LEVEL_50_COMMISSION_REWARD,
  getFamiliarCommissionRewardForRequest,
  markFamiliarCommissionRewardRedeemed,
  releaseFamiliarCommissionReward,
  syncFamiliarCommissionReward,
} from "../lib/familiarCommissionReward.ts";
import { calculateBestCommissionDiscount } from "../lib/welcomeCommissionOffer.ts";

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

test("the level 50 commission reward unlocks once and cannot be claimed twice", async () => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(`PRAGMA foreign_keys = ON;
    CREATE TABLE customers (id TEXT PRIMARY KEY);
    CREATE TABLE commission_requests (id TEXT PRIMARY KEY, customer_id TEXT);
    INSERT INTO customers (id) VALUES ('customer-1');
    INSERT INTO commission_requests (id, customer_id) VALUES ('request-1', 'customer-1'), ('request-2', 'customer-1');`);
  const database = d1Adapter(sqlite);

  assert.equal(await syncFamiliarCommissionReward(database, "customer-1", 49), false);
  assert.equal(await claimFamiliarCommissionReward(database, "customer-1", "request-1", 50), true);
  assert.equal((await getFamiliarCommissionRewardForRequest(database, "request-1"))?.discount_cents, 1_500);
  assert.equal(await claimFamiliarCommissionReward(database, "customer-1", "request-2", 50), false);
  await markFamiliarCommissionRewardRedeemed(database, "request-1");
  assert.equal(await getFamiliarCommissionRewardForRequest(database, "request-1"), undefined);
  sqlite.close();
});

test("the level 50 reward returns to the wallet when another discount wins", async () => {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(`PRAGMA foreign_keys = ON;
    CREATE TABLE customers (id TEXT PRIMARY KEY);
    CREATE TABLE commission_requests (id TEXT PRIMARY KEY, customer_id TEXT);
    INSERT INTO customers (id) VALUES ('customer-1');
    INSERT INTO commission_requests (id, customer_id) VALUES ('request-1', 'customer-1'), ('request-2', 'customer-1');`);
  const database = d1Adapter(sqlite);

  assert.equal(await claimFamiliarCommissionReward(database, "customer-1", "request-1", 50), true);
  await releaseFamiliarCommissionReward(database, "request-1");
  assert.equal(await getFamiliarCommissionRewardForRequest(database, "request-1"), undefined);
  assert.equal(await claimFamiliarCommissionReward(database, "customer-1", "request-2", 50), true);
  sqlite.close();
});

test("the 15 euro reward competes with percentages instead of stacking", () => {
  const fixedOffer = {
    code: FAMILIAR_LEVEL_50_COMMISSION_REWARD.code,
    label: FAMILIAR_LEVEL_50_COMMISSION_REWARD.label,
    discountCents: FAMILIAR_LEVEL_50_COMMISSION_REWARD.discountCents,
  };
  const fixedWins = calculateBestCommissionDiscount({
    baseCents: 10_000, percentage: 3, percentageCode: "LW-FAMILIAR-L50", percentageLabel: "3% Famiglio",
    welcomeOfferEligible: true, fixedOffer,
  });
  assert.equal(fixedWins.discountCents, 1_500);
  assert.equal(fixedWins.finalCents, 8_500);
  assert.equal(fixedWins.code, FAMILIAR_LEVEL_50_COMMISSION_REWARD.code);

  const percentageWins = calculateBestCommissionDiscount({
    baseCents: 100_000, percentage: 3, percentageCode: "LW-FAMILIAR-L50", percentageLabel: "3% Famiglio",
    welcomeOfferEligible: true, fixedOffer,
  });
  assert.equal(percentageWins.discountCents, 3_000);
  assert.equal(percentageWins.code, "LW-FAMILIAR-L50");
});

test("commission request, quote and account benefits use the server reward", async () => {
  const [requestRoute, adminRoute, benefitsRoute, migration] = await Promise.all([
    readFile(new URL("../app/api/commission-requests/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/commission-admin/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/account/benefits/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0032_familiar_level_50_commission_reward.sql", import.meta.url), "utf8"),
  ]);
  assert.match(requestRoute, /claimFamiliarCommissionReward/);
  assert.match(adminRoute, /getFamiliarCommissionRewardForRequest/);
  assert.match(adminRoute, /markFamiliarCommissionRewardRedeemed/);
  assert.match(adminRoute, /releaseFamiliarCommissionReward/);
  assert.match(benefitsRoute, /syncFamiliarCommissionReward/);
  assert.match(migration, /UNIQUE \(customer_id, reward_code\)/);
  assert.match(migration, /claimed_request_id TEXT UNIQUE/);
});
