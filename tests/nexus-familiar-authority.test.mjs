import assert from "node:assert/strict";
import test from "node:test";
import { createNexusFamiliar } from "../lib/nexusFamiliar.ts";
import { familiarStarterStateIsTrusted, preserveAuthoritativeFamiliarState } from "../lib/nexusFamiliarAuthority.ts";

const now = new Date("2026-08-29T12:00:00.000Z");

test("accepts only a clean starter or bounded first-day guest state as the first authoritative save", () => {
  const starter = createNexusFamiliar(now, "trusted-starter", "cat-1", { name: "Nox", sex: "male" });
  assert.equal(familiarStarterStateIsTrusted(starter, now), true);
  const earlyGuest = {
    ...starter,
    experience: 45,
    inventory: { ...starter.inventory, food: 4, toy: 0 },
    dailyProgress: { ...starter.dailyProgress, careExperience: 45 },
  };
  assert.equal(familiarStarterStateIsTrusted(earlyGuest, now), true);
  assert.equal(familiarStarterStateIsTrusted({ ...earlyGuest, experience: 81, dailyProgress: { ...earlyGuest.dailyProgress, careExperience: 81 } }, now), false);
  assert.equal(familiarStarterStateIsTrusted({ ...starter, experience: 60_025, level: 50 }, now), false);
  assert.equal(familiarStarterStateIsTrusted({ ...starter, nexusCoins: 999_999 }, now), false);
});

test("ordinary cloud saves cannot overwrite authoritative economy fields", () => {
  const current = createNexusFamiliar(now, "trusted-existing", "dog-1", { name: "Sole", sex: "female" });
  const tampered = {
    ...current,
    experience: 60_025,
    level: 50,
    nexusCoins: 999_999,
    inventory: { ...current.inventory, food: 9999 },
    den: { ...current.den, unlockedThemes: ["rifugio-iniziale", "tutto"] },
  };
  const preserved = preserveAuthoritativeFamiliarState(current, tampered, new Date(now.getTime() + 1000));
  assert.equal(preserved.experience, 0);
  assert.equal(preserved.level, 1);
  assert.equal(preserved.nexusCoins, 35);
  assert.equal(preserved.inventory.food, 5);
  assert.deepEqual(preserved.den.unlockedThemes, ["rifugio-iniziale"]);
});

test("API routes keep economy changes behind revision-checked server operations", async () => {
  const fs = await import("node:fs/promises");
  const saveRoute = await fs.readFile(new URL("../app/api/famiglio/route.ts", import.meta.url), "utf8");
  const commandRoute = await fs.readFile(new URL("../app/api/famiglio/command/route.ts", import.meta.url), "utf8");
  const missionRoute = await fs.readFile(new URL("../app/api/famiglio/missions/route.ts", import.meta.url), "utf8");
  assert.match(saveRoute, /familiarStarterStateIsTrusted/);
  assert.match(saveRoute, /preserveAuthoritativeFamiliarState/);
  assert.match(commandRoute, /WHERE customer_id = \? AND revision = \?/);
  assert.match(commandRoute, /"care", "outing-start", "outing-claim", "theme", "gadget"/);
  assert.match(missionRoute, /grantMissionRewardToFamiliar/);
  assert.match(missionRoute, /claimed_at = NULL/);
});
