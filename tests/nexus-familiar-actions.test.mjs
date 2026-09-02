import assert from "node:assert/strict";
import test from "node:test";
import { planFamiliarCareRequest } from "../lib/nexusFamiliarActions.ts";

test("starts a care command only when no action is active", () => {
  assert.deepEqual(planFamiliarCareRequest(null, null, false), { outcome: "start" });
});

test("queues exactly one next command while a care action is running", () => {
  assert.deepEqual(planFamiliarCareRequest("food", null, false), { outcome: "queue" });
  assert.deepEqual(planFamiliarCareRequest("food", "rest", false), { outcome: "blocked", reason: "queue-full" });
});

test("blocks every command only during a manually requested sleep", () => {
  assert.deepEqual(planFamiliarCareRequest("rest", null, true), { outcome: "blocked", reason: "sleeping" });
  assert.deepEqual(planFamiliarCareRequest(null, null, true), { outcome: "blocked", reason: "sleeping" });
  assert.deepEqual(planFamiliarCareRequest(null, null, false), { outcome: "start" });
});
