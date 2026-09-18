import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  FAMILIAR_STREAK_MILESTONES,
  claimFamiliarStreakMilestone,
  familiarStreakDateKey,
  familiarStreakSummary,
  restoreFamiliarStreakClaims,
  shiftFamiliarDateKey,
} from "../lib/famiglioStreak.ts";
import { claimFamiliarAttendanceReward, restoreFamiliarAttendanceState } from "../lib/famiglioAttendanceYear.ts";
import { createFamiliarHomeState, restoreFamiliarHome } from "../lib/famiglioHome.ts";
import { preserveServerOwnedAttendance } from "../lib/famiglioRebuildCloud.ts";

const noonRome = (date) => new Date(`${date}T12:00:00+02:00`);
const run = (end, length) => Array.from({ length }, (_, index) => shiftFamiliarDateKey(end, index - length + 1));
const homeWith = (claimedDates, extra = {}) => {
  const state = createFamiliarHomeState();
  state.attendance = { ...state.attendance, launchDate: "2026-09-08", claimedDates, ...extra };
  return state;
};

test("the streak day is the civil day in Rome, across summer and winter midnight", () => {
  // Ora legale (UTC+2): la mezzanotte di Roma cade alle 22:00 UTC.
  assert.equal(familiarStreakDateKey(new Date("2026-09-18T21:59:59Z")), "2026-09-18");
  assert.equal(familiarStreakDateKey(new Date("2026-09-18T22:00:00Z")), "2026-09-19");
  // Ora solare (UTC+1): la mezzanotte cade alle 23:00 UTC, anche a Capodanno.
  assert.equal(familiarStreakDateKey(new Date("2026-12-31T22:59:59Z")), "2026-12-31");
  assert.equal(familiarStreakDateKey(new Date("2026-12-31T23:00:00Z")), "2027-01-01");
});

test("just after Rome midnight the streak stays alive but at risk until today is registered", () => {
  const dates = ["2026-09-16", "2026-09-17", "2026-09-18"];
  const beforeMidnight = familiarStreakSummary({ claimedDates: dates }, new Date("2026-09-18T21:30:00Z"));
  assert.equal(beforeMidnight.today, "2026-09-18");
  assert.equal(beforeMidnight.claimedToday, true);
  assert.equal(beforeMidnight.current, 3);
  assert.equal(beforeMidnight.atRisk, false);

  const afterMidnight = familiarStreakSummary({ claimedDates: dates }, new Date("2026-09-18T22:30:00Z"));
  assert.equal(afterMidnight.today, "2026-09-19");
  assert.equal(afterMidnight.claimedToday, false);
  assert.equal(afterMidnight.current, 3);
  assert.equal(afterMidnight.atRisk, true);
  assert.equal(afterMidnight.runStart, "2026-09-16");

  // Un giorno intero saltato spegne la serie.
  const nextNight = familiarStreakSummary({ claimedDates: dates }, new Date("2026-09-19T22:30:00Z"));
  assert.equal(nextNight.current, 0);
  assert.equal(nextNight.runStart, null);
  assert.equal(nextNight.best, 3);
  assert.deepEqual(nextNight.claimable, []);
});

test("gaps split runs and the best streak survives a reset", () => {
  const dates = [...run("2026-09-12", 5), "2026-09-15", "2026-09-17", "2026-09-18"];
  const summary = familiarStreakSummary({ claimedDates: dates }, noonRome("2026-09-18"));
  assert.equal(summary.current, 2);
  assert.equal(summary.runStart, "2026-09-17");
  assert.equal(summary.best, 5);
  assert.equal(summary.nextMilestone.days, 3);
  assert.equal(summary.previousMilestoneDays, 0);
});

test("same-day duplicates, unsorted, invalid and future dates never inflate the streak", () => {
  const summary = familiarStreakSummary({
    claimedDates: ["2026-09-18", "2026-09-17", "2026-09-18", "garbage", 42, "2026-09-19", "2026-09-25"],
  }, noonRome("2026-09-18"));
  assert.equal(summary.current, 2);
  assert.equal(summary.best, 2);
  assert.equal(familiarStreakSummary(null, noonRome("2026-09-18")).current, 0);
});

test("a streak crossing the October DST change counts every civil day once", () => {
  const dates = run("2026-10-27", 5); // 23 → 27 ottobre, il cambio d'ora è il 25.
  const summary = familiarStreakSummary({ claimedDates: dates }, new Date("2026-10-27T23:30:00Z"));
  assert.equal(summary.today, "2026-10-28");
  assert.equal(summary.current, 5);
  assert.equal(summary.atRisk, true);
});

test("the streak is built from the existing attendance claims, not a parallel tracker", () => {
  let state = homeWith([]);
  for (const date of ["2026-09-16", "2026-09-17", "2026-09-18"]) state = claimFamiliarAttendanceReward(state, noonRome(date)).state;
  const summary = familiarStreakSummary(state.attendance, noonRome("2026-09-18"));
  assert.equal(summary.current, 3);
  assert.deepEqual(summary.claimable.map((milestone) => milestone.days), [3]);
  // Il riscatto giornaliero conserva i traguardi già riscossi.
  const claimed = claimFamiliarStreakMilestone(state, 3, noonRome("2026-09-18")).state;
  const nextDay = claimFamiliarAttendanceReward(claimed, noonRome("2026-09-19")).state;
  assert.equal(nextDay.attendance.streakMilestones.length, 1);
});

test("milestones use existing rewards and pay exactly once per streak", () => {
  const now = noonRome("2026-09-18");
  const state = homeWith(run("2026-09-18", 7));
  const coins = state.wallet.nexusCoins;
  const biscuits = state.inventory.quantities["energy-biscuit"];

  const first = claimFamiliarStreakMilestone(state, 3, now);
  assert.equal(first.status, "claimed");
  assert.equal(first.state.wallet.nexusCoins, coins + 15);
  assert.equal(first.state.wallet.totalEarned, state.wallet.totalEarned + 15);
  assert.equal(first.state.inventory.quantities["energy-biscuit"], biscuits + 1);
  assert.deepEqual(first.state.attendance.streakMilestones, [{ days: 3, runStart: "2026-09-12", claimedOn: "2026-09-18" }]);

  const again = claimFamiliarStreakMilestone(first.state, 3, now);
  assert.equal(again.status, "duplicate");
  assert.equal(again.state, first.state);

  // Anche dopo un round-trip del salvataggio il traguardo resta riscosso.
  const restored = restoreFamiliarHome(JSON.parse(JSON.stringify(first.state)));
  assert.equal(claimFamiliarStreakMilestone(restored, 3, now).status, "duplicate");

  const seven = claimFamiliarStreakMilestone(first.state, 7, now);
  assert.equal(seven.status, "claimed");
  assert.equal(seven.state.wallet.nexusCoins, coins + 45);
  assert.equal(claimFamiliarStreakMilestone(seven.state, 14, now).status, "locked");
  assert.equal(claimFamiliarStreakMilestone(seven.state, 5, now).status, "unknown");
  assert.deepEqual(familiarStreakSummary(seven.state.attendance, now).claimable, []);
});

test("a broken streak cannot be claimed, a genuinely new streak earns the milestone again", () => {
  const first = claimFamiliarStreakMilestone(homeWith(run("2026-09-12", 3)), 3, noonRome("2026-09-12"));
  assert.equal(first.status, "claimed");
  const broken = homeWith([...first.state.attendance.claimedDates], { streakMilestones: first.state.attendance.streakMilestones });
  assert.equal(claimFamiliarStreakMilestone(broken, 3, noonRome("2026-09-15")).status, "locked");

  const renewed = homeWith([...run("2026-09-12", 3), ...run("2026-09-18", 3)], { streakMilestones: first.state.attendance.streakMilestones });
  const second = claimFamiliarStreakMilestone(renewed, 3, noonRome("2026-09-18"));
  assert.equal(second.status, "claimed");
  assert.equal(second.state.attendance.streakMilestones.length, 2);
  assert.equal(claimFamiliarStreakMilestone(second.state, 3, noonRome("2026-09-18")).status, "duplicate");
});

test("the 30-day milestone unlocks an existing cosmetic cover, or coins if already owned", () => {
  const now = noonRome("2026-10-07");
  const state = homeWith(run("2026-10-07", 30));
  const thirty = FAMILIAR_STREAK_MILESTONES.find((milestone) => milestone.days === 30);
  const unlocked = claimFamiliarStreakMilestone(state, 30, now);
  assert.equal(unlocked.coverGranted, true);
  assert.ok(unlocked.state.deviceCover.ownedIds.includes(thirty.coverId));
  assert.equal(unlocked.state.wallet.nexusCoins, state.wallet.nexusCoins + thirty.coins);

  const owned = { ...state, deviceCover: { ...state.deviceCover, ownedIds: [...state.deviceCover.ownedIds, thirty.coverId] } };
  const fallback = claimFamiliarStreakMilestone(owned, 30, now);
  assert.equal(fallback.coverGranted, false);
  assert.equal(fallback.state.wallet.nexusCoins, state.wallet.nexusCoins + thirty.coins + thirty.coverFallbackCoins);
  assert.equal(fallback.state.deviceCover.ownedIds.filter((id) => id === thirty.coverId).length, 1);
});

test("stored milestone claims are sanitized and survive the attendance restore", () => {
  const claims = restoreFamiliarStreakClaims([
    { days: 3, runStart: "2026-09-10", claimedOn: "2026-09-12" },
    { days: 3, runStart: "2026-09-10", claimedOn: "2026-09-13" },
    { days: 5, runStart: "2026-09-10", claimedOn: "2026-09-13" },
    { days: 7, runStart: "not-a-date", claimedOn: "2026-09-13" },
    null,
  ]);
  assert.deepEqual(claims, [{ days: 3, runStart: "2026-09-10", claimedOn: "2026-09-12" }]);
  const attendance = restoreFamiliarAttendanceState({ launchDate: "2026-09-08", claimedDates: [], streakMilestones: claims });
  assert.deepEqual(attendance.streakMilestones, claims);
  assert.deepEqual(restoreFamiliarAttendanceState({}).streakMilestones, []);
});

test("a streak longer than the stored window keeps its recorded start and cannot be re-claimed", () => {
  const dates = run("2027-09-20", 366);
  const claimsRecord = [{ days: 3, runStart: "2026-09-01", claimedOn: "2026-09-03" }];
  const summary = familiarStreakSummary({ claimedDates: dates, streakMilestones: claimsRecord }, noonRome("2027-09-20"));
  assert.equal(summary.current, 366);
  assert.equal(summary.runStart, "2026-09-01");
  assert.deepEqual(summary.claimedDays, [3]);
  assert.ok(!summary.claimable.some((milestone) => milestone.days === 3));
});

test("client saves cannot rewrite the server-owned attendance register", () => {
  const house = (attendance) => ({ rebuild: { stage: "home", unlockedIds: [] }, home: { needs: {}, attendance, wallet: { nexusCoins: 5 } }, adventure: {}, combat: {} });
  const server = { schemaVersion: 1, activeHouseIndex: 0, updatedAt: "2026-09-18T10:00:00Z", houses: [house({ claimedDates: ["2026-09-18"], streakMilestones: [] }), null, null] };
  const forged = { schemaVersion: 1, activeHouseIndex: 0, updatedAt: "2026-09-18T11:00:00Z", houses: [house({ claimedDates: run("2026-09-18", 30), streakMilestones: [] }), house({ claimedDates: ["2026-09-18"] }), null] };
  const merged = preserveServerOwnedAttendance(forged, server);
  assert.deepEqual(merged.houses[0].home.attendance, server.houses[0].home.attendance);
  assert.equal(merged.houses[0].home.wallet.nexusCoins, 5);
  assert.deepEqual(merged.houses[1], forged.houses[1]);
  assert.equal(preserveServerOwnedAttendance(forged, null), forged);
});

test("the streak route trusts only the server clock and revision-guarded saves", async () => {
  const source = await readFile(new URL("../app/api/famiglio/rebuild/streak/route.ts", import.meta.url), "utf8");
  assert.match(source, /getLoreWiseUser\(\)/);
  assert.match(source, /claimFamiliarStreakMilestone\(home, days\)/);
  assert.match(source, /AND revision = \?/);
  assert.match(source, /private, no-store/);
  assert.doesNotMatch(source, /claimedDates|body\.(now|date|today)/);
  const cloud = await readFile(new URL("../app/api/famiglio/rebuild/route.ts", import.meta.url), "utf8");
  assert.match(cloud, /preserveServerOwnedAttendance\(checked\.save, current\.save\)/);
});
