import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { nexusDayPhaseForHour, nexusRomeCycle } from "../lib/nexusDayCycle.ts";

test("maps the five Italian day periods at their boundaries", () => {
  assert.equal(nexusDayPhaseForHour(4), "notte");
  assert.equal(nexusDayPhaseForHour(5), "alba");
  assert.equal(nexusDayPhaseForHour(8), "giorno");
  assert.equal(nexusDayPhaseForHour(12), "pomeriggio");
  assert.equal(nexusDayPhaseForHour(17), "tramonto");
  assert.equal(nexusDayPhaseForHour(20), "notte");
});

test("uses Europe/Rome time including seasonal time changes", () => {
  const winter = nexusRomeCycle(new Date("2026-01-15T07:30:00.000Z"));
  assert.equal(winter.time, "08:30");
  assert.equal(winter.phase, "giorno");
  const summer = nexusRomeCycle(new Date("2026-08-27T16:30:00.000Z"));
  assert.equal(summer.time, "18:30");
  assert.equal(summer.phase, "tramonto");
});

test("every time phase uses a room-only background without embedded black bands", () => {
  for (const hour of [5, 8, 12, 17, 20]) {
    const cycle = nexusRomeCycle(new Date(`2026-01-15T${String(hour).padStart(2, "0")}:00:00.000Z`));
    assert.match(cycle.background, /-room-v2\.png$/);
    assert.ok(existsSync(join(process.cwd(), "public", cycle.background)));
  }
});
