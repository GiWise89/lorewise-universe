import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { dailyFamiliarMissions, dailyFamiliarMissionsForCount, familiarVisitActivity, meaningfulMissionComment, previousRomeDateKey, romeDateKey } from "../lib/nexusFamiliarMissionCatalog.ts";

test("assigns one mission per difficulty and keeps it stable for the day", () => {
  const first = dailyFamiliarMissions("user-a", "2026-08-27");
  const second = dailyFamiliarMissions("user-a", "2026-08-27");
  assert.deepEqual(first, second);
  assert.deepEqual(first.map((mission) => mission.difficulty), ["facile", "normale", "difficile"]);
  assert.equal(new Set(first.map((mission) => mission.id)).size, 3);
});

test("includes battle, expedition and Tower missions with scaled rewards", () => {
  const seen = new Map();
  for (let day = 1; day <= 31; day += 1) {
    for (const mission of dailyFamiliarMissionsForCount("mission-roster", `2026-09-${String(day).padStart(2, "0")}`, [], 20)) seen.set(mission.id, mission);
  }
  assert.ok([...seen.values()].some((mission) => mission.activity === "familiar_battle"));
  assert.ok([...seen.values()].some((mission) => mission.activity === "familiar_expedition"));
  assert.ok([...seen.values()].some((mission) => mission.activity === "familiar_tower_floor" && mission.target === 5));
  const easy = [...seen.values()].find((mission) => mission.difficulty === "facile");
  const hard = [...seen.values()].find((mission) => mission.difficulty === "difficile");
  assert.ok(hard.reward.quantity >= easy.reward.quantity);
});

test("level 10 can add a fourth distinct daily mission", () => {
  const missions = dailyFamiliarMissionsForCount("utente-livello-10", "2026-08-28", [], 4);
  assert.equal(missions.length, 4);
  assert.equal(new Set(missions.map((mission) => mission.id)).size, 4);
});

test("varies assignments across dates and users", () => {
  const base = dailyFamiliarMissions("user-a", "2026-08-27").map((mission) => mission.id).join(",");
  const nextDay = dailyFamiliarMissions("user-a", "2026-08-28").map((mission) => mission.id).join(",");
  const otherUser = dailyFamiliarMissions("user-b", "2026-08-27").map((mission) => mission.id).join(",");
  assert.notEqual(base, nextDay);
  assert.notEqual(base, otherUser);
});

test("does not immediately repeat yesterday missions when alternatives exist", () => {
  const previous = dailyFamiliarMissions("user-a", "2026-08-26");
  const today = dailyFamiliarMissions("user-a", "2026-08-27", previous.map((mission) => mission.id));
  assert.equal(today.some((mission) => previous.some((old) => old.id === mission.id)), false);
});

test("counts only substantial comments for mission progress", () => {
  assert.equal(meaningfulMissionComment("ok"), false);
  assert.equal(meaningfulMissionComment("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"), false);
  assert.equal(meaningfulMissionComment("bello bello bello bello bello bello bello bello"), false);
  assert.equal(meaningfulMissionComment("Mi piace molto il contrasto delle luci, soprattutto nel volto del personaggio."), true);
});

test("maps only meaningful destination pages to visit activities", () => {
  assert.deepEqual(familiarVisitActivity("/arte/opera-luce"), { activity: "artwork_visit", sourceKey: "/arte/opera-luce" });
  assert.deepEqual(familiarVisitActivity("/giochi/guide?gioco=stardew-valley&capitolo=1"), { activity: "guide_visit", sourceKey: "/giochi/guide?gioco=stardew-valley" });
  assert.notEqual(familiarVisitActivity("/giochi/guide?gioco=stardew-valley")?.sourceKey, familiarVisitActivity("/giochi/guide?gioco=the-wound-remembers")?.sourceKey);
  assert.equal(familiarVisitActivity("/arte"), null);
});

test("uses the Europe Rome calendar day", () => {
  assert.equal(romeDateKey(new Date("2026-08-27T22:30:00.000Z")), "2026-08-28");
  assert.equal(previousRomeDateKey("2026-03-01"), "2026-02-28");
});

test("the activity endpoint accepts every new home care action", () => {
  const route = readFileSync(join(process.cwd(), "app", "api", "famiglio", "activity", "route.ts"), "utf8");
  for (const action of ["feed", "play", "clean", "care", "rest"]) {
    assert.match(route, new RegExp(`careSources[\\s\\S]*\\"${action}\\"`));
  }
});

test("records progress for every mission slot unlocked by the current Famiglio level", () => {
  const server = readFileSync(join(process.cwd(), "lib", "nexusFamiliarMissionServer.ts"), "utf8");
  assert.match(server, /familiarMissionCountForCustomer\(database, input\.customerId\)/);
  assert.match(server, /ensureDailyFamiliarMissions\(database, input\.customerId, date, missionCount\)/);
  assert.match(server, /missionCount\?: number/);
  assert.match(server, /familiarDailyMissionCount\(checked\.ok \? checked\.state\.level : 1\)/);
});

test("completed missions produce one persistent accessible announcement and refresh after cloud care", () => {
  const component = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.tsx"), "utf8");
  const styles = readFileSync(join(process.cwd(), "components", "NexusFamiliarExperience.module.css"), "utf8");
  assert.match(component, /function updateMissionsWithAnnouncement/);
  assert.match(component, /mission\.complete && !mission\.claimed/);
  assert.match(component, /FAMILIAR_MISSION_ANNOUNCED_STORAGE_PREFIX/);
  assert.match(component, /role="status" aria-live="assertive" aria-atomic="true"/);
  assert.match(component, /void loadMissionsRef\.current\(\)/);
  assert.match(component, /Apri missioni/);
  assert.match(styles, /\.missionAnnouncement\s*\{/);
});

test("daily missions expose exactly one refresh reservation per Rome day", () => {
  const server = readFileSync(join(process.cwd(), "lib", "nexusFamiliarMissionServer.ts"), "utf8");
  const route = readFileSync(join(process.cwd(), "app", "api", "famiglio", "missions", "route.ts"), "utf8");
  const component = readFileSync(join(process.cwd(), "components", "FamiglioNexusRebuild.tsx"), "utf8");
  assert.match(server, /nexus_familiar_mission_refreshes/);
  assert.match(server, /PRIMARY KEY \(customer_id, mission_date\)/);
  assert.match(server, /ON CONFLICT\(customer_id, mission_date\) DO NOTHING/);
  assert.match(route, /action === "refresh"/);
  assert.match(component, /Aggiorna missioni/);
  assert.match(component, /Aggiornate oggi/);
  assert.match(component, /MISSION_REFRESH_KEY_PREFIX/);
});

test("mission claims reward the rebuilt cloud save before marking the mission claimed", () => {
  const route = readFileSync(join(process.cwd(), "app", "api", "famiglio", "missions", "route.ts"), "utf8");
  assert.match(route, /grantMissionRewardToRebuildSave/);
  assert.match(route, /nexus_pet_rebuild_saves/);
  assert.match(route, /prepareFamiliarMissionClaim/);
  assert.match(route, /markFamiliarMissionClaimed/);
  assert.ok(route.indexOf("grantMissionRewardToRebuildSave(database") < route.indexOf("markFamiliarMissionClaimed(database"));
  assert.match(route, /la missione resta riscuotibile e puoi riprovare/);
});
