import assert from "node:assert/strict";
import test from "node:test";
import { createNexusFamiliar, normalizeNexusFamiliar, useFamiliarItem } from "../lib/nexusFamiliar.ts";
import {
  activeFamiliarSeasonalEvent,
  claimFamiliarAttendance,
  completeFamiliarSeasonalActivity,
  familiarAttendanceWeek,
  normalizeFamiliarRituals,
  recordFamiliarSeasonalMission,
  recordFamiliarSeasonalOuting,
} from "../lib/nexusFamiliarRituals.ts";

const monday = new Date("2026-08-24T10:00:00.000Z");
const wednesday = new Date("2026-08-26T10:00:00.000Z");

test("keeps the daily wish stable for the whole date", () => {
  const first = normalizeFamiliarRituals(undefined, "stable-familiar", monday);
  const second = normalizeFamiliarRituals(first, "stable-familiar", new Date("2026-08-24T22:00:00.000Z"));
  assert.equal(second.dailyWish.kind, first.dailyWish.kind);
  assert.equal(second.dailyWish.date, "2026-08-24");
});

test("registers attendance only once and does not punish a skipped day", () => {
  const state = createNexusFamiliar(monday, "attendance-familiar", "cat-1", { name: "Nox", sex: "male" });
  const first = claimFamiliarAttendance(state, monday);
  assert.equal(first.ok, true);
  if (!first.ok) return;
  assert.equal(first.state.nexusCoins, state.nexusCoins + 5);
  assert.equal(claimFamiliarAttendance(first.state, monday).ok, false);
  const afterGap = claimFamiliarAttendance(first.state, wednesday);
  assert.equal(afterGap.ok, true);
  if (!afterGap.ok) return;
  assert.equal(familiarAttendanceWeek(afterGap.state, wednesday).claimed.length, 2);
  assert.equal(afterGap.state.inventory.food, state.inventory.food + 1);
});

test("fulfills the daily wish only with the matching real action", () => {
  const state = createNexusFamiliar(monday, "wish-familiar", "cat-1", { name: "Nox", sex: "male" });
  state.rituals.dailyWish = { date: "2026-08-24", kind: "food", fulfilledAt: null };
  const result = useFamiliarItem(state, "food", monday);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.ok(result.state.rituals.dailyWish.fulfilledAt);
  assert.equal(result.state.nexusCoins, state.nexusCoins + 5);
});

test("a requested daily wish remains a real action even when that need is already high", () => {
  const state = createNexusFamiliar(monday, "satisfied-wish-familiar", "fox", { name: "Luce", sex: "female" });
  state.needs.hunger = 100;
  state.rituals.dailyWish = { date: "2026-08-24", kind: "food", fulfilledAt: null };
  const result = useFamiliarItem(state, "food", monday);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.state.inventory.food, state.inventory.food - 1);
  assert.ok(result.state.rituals.dailyWish.fulfilledAt);
});

test("advances the seasonal event only through a real outing, a claimed mission and the finale", () => {
  const state = createNexusFamiliar(new Date("2026-08-30T10:00:00.000Z"), "event-familiar", "fox-1", { name: "Luce", sex: "female" });
  const now = new Date("2026-08-30T10:00:00.000Z");
  assert.equal(activeFamiliarSeasonalEvent(now)?.id, "anniversario-nexus");
  assert.equal(completeFamiliarSeasonalActivity(state, "lanterna", now).ok, false);
  assert.equal(completeFamiliarSeasonalActivity(state, "sala-ricordi", now).ok, false);
  const afterOuting = recordFamiliarSeasonalOuting(state, now);
  assert.equal(afterOuting.rituals.seasonalClaims.some((entry) => entry.endsWith(":lanterna")), true);
  const afterMission = recordFamiliarSeasonalMission(afterOuting, now);
  assert.equal(afterMission.rituals.seasonalClaims.some((entry) => entry.endsWith(":sala-ricordi")), true);
  const finale = completeFamiliarSeasonalActivity(afterMission, "sigillo", now);
  assert.equal(finale.ok, true);
  if (!finale.ok) return;
  assert.equal(finale.state.nexusCoins, state.nexusCoins + 40);
  assert.equal(completeFamiliarSeasonalActivity(finale.state, "sigillo", now).ok, false);
});

test("migrates older saves by creating the three ritual archives", () => {
  const state = createNexusFamiliar(monday, "old-familiar", "cat-1", { name: "Nox", sex: "male" });
  const old = { ...state };
  delete old.rituals;
  const normalized = normalizeNexusFamiliar(old, monday);
  assert.deepEqual(normalized.rituals.attendanceDates, []);
  assert.equal(normalized.rituals.dailyWish.date, "2026-08-24");
});
