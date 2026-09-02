import test from "node:test";
import assert from "node:assert/strict";
import { createNexusFamiliar } from "../lib/nexusFamiliar.ts";
import { familiarPipModeForViewport, familiarReactionForChange, familiarReactionForPath, familiarSmartAlerts } from "../lib/nexusFamiliarEngagement.ts";

test("PIP reactions are contextual, limited and use real Famiglio poses", () => {
  assert.equal(familiarReactionForPath("/arte/opera-luce", "Micio")?.kind, "artwork");
  assert.equal(familiarReactionForPath("/cronache-del-nexus", "Micio")?.behavior, "sit");
  assert.equal(familiarReactionForPath("/account", "Micio"), null);
});

test("mobile pages start with a compact Famiglio companion that does not cover content", () => {
  assert.equal(familiarPipModeForViewport(null, true), "minimized");
  assert.equal(familiarPipModeForViewport("open", true), "minimized");
  assert.equal(familiarPipModeForViewport("closed", true), "closed");
  assert.equal(familiarPipModeForViewport("open", false), "open");
});

test("state changes react only to meaningful level, outing and unlock events", () => {
  const now = new Date("2026-08-31T10:00:00.000Z");
  const state = createNexusFamiliar(now, "reaction-test");
  assert.equal(familiarReactionForChange(state, { ...state, updatedAt: new Date(now.getTime() + 1000).toISOString() }), null);
  assert.equal(familiarReactionForChange(state, { ...state, level: 2 })?.kind, "level");
  assert.equal(familiarReactionForChange({ ...state, outing: { destinationId: "sentiero-luminoso", startedAt: now.toISOString(), endsAt: now.toISOString() } }, state)?.kind, "outing");
});

test("smart notifications are optional inputs and cover only real low needs, returns and daily missions", () => {
  const now = new Date("2026-08-31T10:00:00.000Z");
  const state = createNexusFamiliar(now, "alert-test");
  const calm = familiarSmartAlerts(state, now);
  assert.deepEqual(calm.map((entry) => entry.reaction.kind), ["mission"]);
  const urgent = familiarSmartAlerts({ ...state, needs: { ...state.needs, hunger: 12 }, outing: { destinationId: "sentiero-luminoso", startedAt: new Date(now.getTime() - 600_000).toISOString(), endsAt: new Date(now.getTime() - 1).toISOString() } }, now);
  assert.deepEqual(urgent.map((entry) => entry.reaction.kind), ["outing", "reward", "mission"]);
});
