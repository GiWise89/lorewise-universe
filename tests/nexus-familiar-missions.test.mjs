import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { dailyFamiliarMissions, dailyFamiliarMissionsForCount, familiarVisitActivity, meaningfulMissionComment, romeDateKey } from "../lib/nexusFamiliarMissionCatalog.ts";

test("assigns one logical mission per group and keeps it stable for the day", () => {
  const first = dailyFamiliarMissions("user-a", "2026-08-27");
  const second = dailyFamiliarMissions("user-a", "2026-08-27");
  assert.deepEqual(first, second);
  assert.deepEqual(first.map((mission) => mission.group), ["explore", "connect", "care"]);
  assert.equal(new Set(first.map((mission) => mission.id)).size, 3);
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
