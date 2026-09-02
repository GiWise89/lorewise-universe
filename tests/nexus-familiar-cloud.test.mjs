import assert from "node:assert/strict";
import test from "node:test";
import { createNexusFamiliar } from "../lib/nexusFamiliar.ts";
import { FAMILIAR_CLOUD_MAX_BYTES, newerFamiliarState, sanitizeFamiliarCloudState } from "../lib/nexusFamiliarCloud.ts";
import { familiarExperienceForLevel, MAX_FAMILIAR_LEVEL } from "../lib/nexusFamiliarProgression.ts";

const early = new Date("2026-08-27T08:00:00.000Z");
const late = new Date("2026-08-27T09:00:00.000Z");

test("accepts and normalizes a valid Famiglio cloud save", () => {
  const state = createNexusFamiliar(early, "famiglio-cloud", "fox-arctic", { name: "Luce", sex: "female" });
  const checked = sanitizeFamiliarCloudState(state, early);
  assert.equal(checked.ok, true);
  assert.equal(checked.ok && checked.state.appearanceId, "fox-arctic");
  assert.equal(checked.ok && checked.state.name, "Luce");
});

test("rejects unknown palettes and oversized saves", () => {
  const state = createNexusFamiliar(early, "famiglio-cloud", "cat-1", { name: "Nox", sex: "male" });
  assert.equal(sanitizeFamiliarCloudState({ ...state, appearanceId: "not-a-palette" }).ok, false);
  assert.equal(sanitizeFamiliarCloudState({ ...state, payload: "x".repeat(FAMILIAR_CLOUD_MAX_BYTES) }).ok, false);
  assert.equal(sanitizeFamiliarCloudState({ ...state, inventory: { ...state.inventory, decorations: [{}] } }).ok, false);
  assert.equal(sanitizeFamiliarCloudState({ ...state, dailyProgress: { date: "oggi", careExperience: 10, outingsStarted: 1 } }).ok, false);
});

test("bounds counters and timestamps before they reach the account archive", () => {
  const state = createNexusFamiliar(early, "famiglio-cloud", "cat-1", { name: "Nox", sex: "male" });
  const checked = sanitizeFamiliarCloudState({ ...state, experience: 99_000_000, updatedAt: "2099-01-01T00:00:00.000Z" }, early);
  assert.equal(checked.ok, true);
  assert.equal(checked.ok && checked.state.experience, familiarExperienceForLevel(MAX_FAMILIAR_LEVEL));
  assert.equal(checked.ok && checked.state.updatedAt, early.toISOString());
});

test("chooses the most recently updated Famiglio across devices", () => {
  const local = createNexusFamiliar(early, "same-famiglio", "cat-1", { name: "Nox", sex: "male" });
  const remote = { ...local, updatedAt: late.toISOString() };
  assert.equal(newerFamiliarState(local, remote), "remote");
  assert.equal(newerFamiliarState(remote, local), "local");
  assert.equal(newerFamiliarState(local, null), "local");
});
