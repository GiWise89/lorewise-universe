// Regressioni dell'audit lato server del Famiglio: ogni test simula l'exploit o il guasto
// e verifica che venga respinto.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { preserveServerOwnedAttendance, rebuildSaveEntitlementViolation } from "../lib/famiglioRebuildCloud.ts";
import { createFamiliarHomeState, restoreFamiliarHome } from "../lib/famiglioHome.ts";
import { claimFamiliarStreakMilestone, shiftFamiliarDateKey } from "../lib/famiglioStreak.ts";
import { slotPromotionStatements, slotSwapPrimaryStatement, slotSwapSlotStatement } from "../lib/nexusFamiliarCloud.ts";
import { applyMatchAction, createMatchEngine, LIGHT_MIN_REACTION_MS, verifyMatch } from "../lib/famiglioMiniGameCompetition.ts";
import { CompetitionRateLimitError, ensureCompetition, startCompetition } from "../lib/famiglioLeaderboardStore.ts";
import { readBoundedJson } from "../lib/famiglioRequestOrigin.ts";

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const house = (extra = {}) => ({
  rebuild: { stage: "home", selectedId: "cat", unlockedIds: ["cat"] },
  home: { needs: {}, wallet: { nexusCoins: 5, totalEarned: 5 } },
  adventure: {},
  combat: {},
  activeFamiliarId: "cat",
  ...extra,
});
const save = (houses, extra = {}) => ({ schemaVersion: 1, activeHouseIndex: 0, updatedAt: "2026-09-18T10:00:00Z", houses, ...extra });

test("a House emptied and recreated cannot smuggle in a forged attendance streak", () => {
  const today = "2026-09-19";
  const forgedDates = Array.from({ length: 30 }, (_, index) => shiftFamiliarDateKey(today, index - 29));
  const server = save([house({ home: { ...house().home, attendance: { claimedDates: [today], streakMilestones: [] } } }), null, null]);
  // PUT 1: il client svuota la Casa. PUT 2: la ricrea con 30 giorni di presenze inventate.
  const emptied = preserveServerOwnedAttendance(save([null, null, null]), server);
  const forged = save([house({ home: { ...house().home, attendance: { launchDate: "2026-09-08", claimedDates: forgedDates, streak: 30, streakMilestones: [] } } }), null, null]);
  const stored = preserveServerOwnedAttendance(forged, emptied);
  assert.deepEqual(stored.houses[0].home.attendance.claimedDates, []);
  // La rotta /streak ricalcola dal registro salvato: il traguardo dei 30 giorni resta bloccato.
  const home = restoreFamiliarHome(stored.houses[0].home);
  assert.equal(claimFamiliarStreakMilestone(home, 30, new Date(`${today}T10:00:00Z`)).status, "locked");
  assert.equal(claimFamiliarStreakMilestone(home, 3, new Date(`${today}T10:00:00Z`)).status, "locked");
  // Sanity: lo stesso registro, se fosse stato accettato, avrebbe pagato il traguardo.
  const trusted = createFamiliarHomeState();
  trusted.attendance = { ...trusted.attendance, launchDate: "2026-09-08", claimedDates: forgedDates };
  assert.equal(claimFamiliarStreakMilestone(trusted, 30, new Date(`${today}T10:00:00Z`)).status, "claimed");
});

test("a hand-built save cannot open paid Houses 2 and 3 without the Medusa purchase", () => {
  const none = { offerIds: [], appearanceIds: [] };
  const current = save([house(), null, null]);
  assert.match(rebuildSaveEntitlementViolation(save([house(), house(), null]), current, none), /Casa/);
  assert.match(rebuildSaveEntitlementViolation(save([house(), null, house()]), current, { offerIds: ["slot-famiglio-2"], appearanceIds: [] }), /Casa/);
  assert.match(rebuildSaveEntitlementViolation(save([house(), house(), null]), null, none), /Casa/);
  assert.equal(rebuildSaveEntitlementViolation(save([house(), house(), null]), current, { offerIds: ["slot-famiglio-2"], appearanceIds: [] }), null);
  // Una Casa già presente sul server resta valida: un salvataggio esistente non si blocca.
  assert.equal(rebuildSaveEntitlementViolation(save([house(), house(), null]), save([house(), house(), null]), none), null);
  assert.equal(rebuildSaveEntitlementViolation(save([house(), null, null]), null, none), null);
});

test("a hand-built save cannot make an unpurchased premium Famiglio active or fight with it", () => {
  const none = { offerIds: [], appearanceIds: [] };
  const current = save([house(), null, null]);
  const premium = "griffin";
  assert.match(rebuildSaveEntitlementViolation(save([house({ activeFamiliarId: premium }), null, null]), current, none), /premium/);
  assert.match(rebuildSaveEntitlementViolation(save([house({ combat: { activeBattle: { turn: 1, player: { familiarId: premium } } } }), null, null]), current, none), /premium/);
  assert.match(rebuildSaveEntitlementViolation(save([house({ rebuild: { stage: "home", selectedId: "cat", unlockedIds: ["cat", "pocket-dragon"] } }), null, null]), current, none), /premium/);
  // La copia della Casa attiva al primo livello del salvataggio è controllata allo stesso modo.
  assert.match(rebuildSaveEntitlementViolation(save([house(), null, null], { activeFamiliarId: premium }), current, none), /premium/);
  assert.equal(rebuildSaveEntitlementViolation(save([house({ activeFamiliarId: premium }), null, null]), current, { offerIds: [], appearanceIds: [premium] }), null);
  assert.equal(rebuildSaveEntitlementViolation(save([house({ activeFamiliarId: premium }), null, null]), save([house({ activeFamiliarId: premium }), null, null]), none), null);
  assert.equal(rebuildSaveEntitlementViolation(save([house({ activeFamiliarId: "fox" }), null, null]), current, none), null);
});

test("the rebuild PUT enforces entitlements and a failing weekly payout never blocks loading", async () => {
  const route = await source("app/api/famiglio/rebuild/route.ts");
  assert.match(route, /rebuildSaveEntitlementViolation\(checked\.save, current\.save, \{ offerIds, appearanceIds \}\)/);
  assert.match(route, /syncCompetitionRewards\(user\.id\)\.catch\(/);
  assert.match(route, /readBoundedJson\(request, FAMIGLIO_REBUILD_CLOUD_MAX_BYTES \* 2\)/);
});

// D1 minimale sopra SQLite: batch transazionale come database.batch in produzione.
function fakeD1() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(`CREATE TABLE nexus_familiars (customer_id TEXT PRIMARY KEY, state_json TEXT NOT NULL, state_version INTEGER, revision INTEGER NOT NULL, created_at TEXT, updated_at TEXT);
    CREATE TABLE nexus_familiar_slots (customer_id TEXT NOT NULL, familiar_id TEXT NOT NULL, state_json TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (customer_id, familiar_id));`);
  const statement = (sql, values = []) => ({
    sql, values,
    bind: (...next) => statement(sql, next),
    run: async () => ({ success: true, meta: { changes: Number(sqlite.prepare(sql).run(...values).changes) } }),
  });
  return {
    sqlite,
    prepare: (sql) => statement(sql),
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        const results = [];
        for (const entry of statements) results.push(await entry.run());
        sqlite.exec("COMMIT");
        return results;
      } catch (error) { sqlite.exec("ROLLBACK"); throw error; }
    },
  };
}
const state = (id, name) => JSON.stringify({ familiarId: id, name });

test("a stale slot switch racing a reset no longer overwrites the chosen Famiglio", async () => {
  const database = fakeD1();
  database.sqlite.prepare("INSERT INTO nexus_familiars VALUES ('u', ?, 1, 5, '', '')").run(state("x", "Xeno"));
  database.sqlite.prepare("INSERT INTO nexus_familiar_slots (customer_id, familiar_id, state_json, revision) VALUES ('u', 'y', ?, 3)").run(state("y", "Ylva"));
  // Scheda A: riavvio già confermato (revisione 5 → 6).
  database.sqlite.prepare("UPDATE nexus_familiars SET state_json = ?, revision = 6").run(state("z", "Nuovo"));
  // Scheda B: aveva letto la revisione 5 e ora prova a passare a "y".
  const results = await database.batch([
    slotSwapPrimaryStatement(database, "switch", { customerId: "u", nextJson: state("y", "Ylva"), revision: 6, baseRevision: 5, selectedId: "y" }),
    slotSwapSlotStatement(database, "switch", { customerId: "u", nextJson: state("y", "Ylva"), revision: 6, selectedId: "y", displacedId: "x", displacedJson: state("x", "Xeno"), displacedRevision: 4 }),
  ]);
  assert.deepEqual(results.map((result) => result.meta.changes), [0, 0]);
  const slot = database.sqlite.prepare("SELECT familiar_id, state_json FROM nexus_familiar_slots").get();
  assert.equal(slot.familiar_id, "y");
  assert.equal(slot.state_json, state("y", "Ylva"));
  assert.equal(database.sqlite.prepare("SELECT state_json FROM nexus_familiars").get().state_json, state("z", "Nuovo"));
});

test("slot switch, start and promotion still work, and a double start cannot duplicate a Famiglio", async () => {
  const database = fakeD1();
  database.sqlite.prepare("INSERT INTO nexus_familiars VALUES ('u', ?, 1, 1, '', '')").run(state("x", "Xeno"));
  const start = (baseRevision) => database.batch([
    slotSwapPrimaryStatement(database, "start", { customerId: "u", nextJson: state("n", "Nuovo"), revision: baseRevision + 1, baseRevision, selectedId: "x" }),
    slotSwapSlotStatement(database, "start", { customerId: "u", nextJson: state("n", "Nuovo"), revision: baseRevision + 1, selectedId: "x", displacedId: "x", displacedJson: state("x", "Xeno"), displacedRevision: baseRevision }),
  ]);
  assert.deepEqual((await start(1)).map((result) => result.meta.changes), [1, 1]);
  // Doppio invio identico: il secondo va in conflitto e l'intera transazione viene annullata.
  await assert.rejects(() => start(1));
  assert.equal(database.sqlite.prepare("SELECT COUNT(*) AS n FROM nexus_familiar_slots").get().n, 1);

  const switched = await database.batch([
    slotSwapPrimaryStatement(database, "switch", { customerId: "u", nextJson: state("x", "Xeno"), revision: 3, baseRevision: 2, selectedId: "x" }),
    slotSwapSlotStatement(database, "switch", { customerId: "u", nextJson: state("x", "Xeno"), revision: 3, selectedId: "x", displacedId: "n", displacedJson: state("n", "Nuovo"), displacedRevision: 2 }),
  ]);
  assert.deepEqual(switched.map((result) => result.meta.changes), [1, 1]);
  assert.equal(database.sqlite.prepare("SELECT familiar_id FROM nexus_familiar_slots").get().familiar_id, "n");

  // Promozione con revisione vecchia: nulla viene cancellato.
  const stale = await database.batch(slotPromotionStatements(database, { customerId: "u", promotedId: "n", promotedJson: state("n", "Nuovo"), revision: 3, baseRevision: 2 }));
  assert.deepEqual(stale.map((result) => result.meta.changes), [0, 0]);
  assert.equal(database.sqlite.prepare("SELECT COUNT(*) AS n FROM nexus_familiar_slots").get().n, 1);
  const promoted = await database.batch(slotPromotionStatements(database, { customerId: "u", promotedId: "n", promotedJson: state("n", "Nuovo"), revision: 4, baseRevision: 3 }));
  assert.deepEqual(promoted.map((result) => result.meta.changes), [1, 1]);
  assert.equal(database.sqlite.prepare("SELECT COUNT(*) AS n FROM nexus_familiar_slots").get().n, 0);
});

test("slot and delete routes check the rows changed, not the always-true batch success flag", async () => {
  const slots = await source("app/api/famiglio/slots/route.ts");
  assert.match(slots, /slotSwapPrimaryStatement\(/);
  assert.match(slots, /result\.meta\?\.changes/);
  assert.doesNotMatch(slots, /results\.every\(\(result\) => result\.success\)/);
  const primary = await source("app/api/famiglio/route.ts");
  assert.match(primary, /slotPromotionStatements\(database/);
});

test("a bot spamming Light hits every 35 ms is capped to a human reaction time", () => {
  const seed = 99;
  const engine = createMatchEngine("light", seed);
  const actions = [];
  const push = (action) => { actions.push(action); applyMatchAction(engine, action); };
  // 20 secondi di partita: un colpo ogni 35 ms (il minimo tra due comandi).
  while (engine.run.elapsed < 20_000 && !engine.run.finished) { push({ type: "input", value: 0 }); push({ type: "step", value: 35 }); }
  // Poi smette di colpire finché la Luce non esaurisce le vite (la partita deve concludersi).
  while (!engine.run.finished) push({ type: "step", value: 100 });
  const score = verifyMatch("light", seed, actions, engine.run.elapsed);
  assert.equal(score, engine.run.score);
  // Prima: circa 570 punti. Ora al massimo un colpo per ogni finestra di reazione.
  assert.ok(score <= Math.ceil(20_000 / LIGHT_MIN_REACTION_MS) + 1, `punteggio ${score}`);
  assert.ok(score > 20_000 / (LIGHT_MIN_REACTION_MS + 70) - 5, "un ritmo lecito resta possibile");
});

test("abandoned ranked matches expire per user and the start rate limit is a 429", async () => {
  const sqlite = new DatabaseSync(":memory:");
  const db = { async query(sql, values = []) {
    const ordered = [];
    const prepared = sqlite.prepare(sql.replace(/\$(\d+)/g, (_, n) => { ordered.push(values[Number(n) - 1]); return "?"; }));
    if (prepared.columns().length) return { rows: prepared.all(...ordered) };
    return { rows: [], rowCount: Number(prepared.run(...ordered).changes) };
  } };
  await ensureCompetition(db);
  const now = Date.parse("2026-09-19T12:00:00Z");
  sqlite.prepare("INSERT INTO famiglio_matches VALUES ('old', 'u', 'light', 1, ?, NULL)").run(now - 3 * 3600000);
  sqlite.prepare("INSERT INTO famiglio_matches VALUES ('done', 'u', 'light', 1, ?, 9)").run(now - 3 * 3600000);
  sqlite.prepare("INSERT INTO famiglio_matches VALUES ('other', 'v', 'light', 1, ?, NULL)").run(now - 3 * 3600000);
  await startCompetition(db, "u", "light", now);
  const ids = sqlite.prepare("SELECT id FROM famiglio_matches WHERE id IN ('old','done','other') ORDER BY id").all().map((row) => row.id);
  assert.deepEqual(ids, ["done", "other"]);
  for (let index = 0; index < 9; index += 1) await startCompetition(db, "u", "light", now);
  await assert.rejects(() => startCompetition(db, "u", "light", now), CompetitionRateLimitError);
  const route = await source("app/api/famiglio/leaderboard/route.ts");
  assert.match(route, /CompetitionRateLimitError\)return json\(\{error:error\.message\},429\)/);
  // Autenticazione prima di leggere il corpo della partita.
  assert.ok(route.indexOf("getLoreWiseUser()") < route.indexOf("readBoundedJson(request"));
  sqlite.close();
});

test("bounded JSON bodies reject oversized chunked uploads and malformed JSON", async () => {
  const chunked = (text) => new Request("https://lorewisenexus.it/api/famiglio", {
    method: "PUT",
    body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode(text)); controller.close(); } }),
    duplex: "half",
  });
  assert.deepEqual(await readBoundedJson(chunked(JSON.stringify({ padding: "x".repeat(2000) })), 1000), { ok: false, status: 413 });
  assert.deepEqual(await readBoundedJson(chunked("{not json"), 1000), { ok: false, status: 400 });
  assert.deepEqual(await readBoundedJson(chunked('{"a":1}'), 1000), { ok: true, value: { a: 1 } });
  const declared = new Request("https://lorewisenexus.it/api/famiglio", { method: "PUT", body: "{}", headers: { "content-length": "5000" } });
  assert.deepEqual(await readBoundedJson(declared, 1000), { ok: false, status: 413 });
});

test("activity events are capped per day and every activity response is private", async () => {
  const server = await source("lib/nexusFamiliarMissionServer.ts");
  assert.match(server, /FAMILIAR_DAILY_ACTIVITY_EVENT_LIMIT\) return false/);
  const route = await source("app/api/famiglio/activity/route.ts");
  assert.doesNotMatch(route, /Response\.json\([^)]*\{ status: \d+ \}\)/);
  assert.match(route, /private, no-store/);
});
