import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  FAMILIAR_ATTENDANCE_COLLECTIBLES,
  FAMILIAR_ATTENDANCE_DAYS,
  FAMILIAR_ATTENDANCE_SEASONS,
  FAMILIAR_ATTENDANCE_WEEKS,
  claimFamiliarAttendanceReward,
  familiarAttendancePosition,
  familiarAttendanceReward,
} from "../lib/famiglioAttendanceYear.ts";
import { createFamiliarHomeState } from "../lib/famiglioHome.ts";

const at = (date) => new Date(`${date}T12:00:00+02:00`);

test("annual attendance spans four seasons, 52 unique weeks and anniversary day", () => {
  assert.equal(FAMILIAR_ATTENDANCE_DAYS, 365);
  assert.equal(FAMILIAR_ATTENDANCE_WEEKS, 52);
  assert.equal(FAMILIAR_ATTENDANCE_SEASONS.length, 4);
  assert.equal(FAMILIAR_ATTENDANCE_COLLECTIBLES.length, 52);
  assert.equal(new Set(FAMILIAR_ATTENDANCE_COLLECTIBLES.map((item) => item.id)).size, 52);
  assert.equal(new Set(FAMILIAR_ATTENDANCE_COLLECTIBLES.map((item) => item.name)).size, 52);
  assert.ok(familiarAttendanceReward(365).label.includes("Anno"));
});

test("calendar position is launch-relative", () => {
  assert.deepEqual(familiarAttendancePosition(at("2026-09-08"), "2026-09-08"), { date: "2026-09-08", dayIndex: 1, week: 1, weekday: 1, active: true, anniversary: false });
  assert.equal(familiarAttendancePosition(at("2026-09-14"), "2026-09-08").weekday, 7);
  assert.equal(familiarAttendancePosition(at("2027-09-07"), "2026-09-08").dayIndex, 365);
});

test("daily claim is idempotent and resets a broken consecutive streak", () => {
  const initial = createFamiliarHomeState(at("2026-09-08").getTime());
  const first = claimFamiliarAttendanceReward(initial, at("2026-09-08"));
  assert.ok(first.reward);
  assert.equal(first.state.attendance.streak, 1);
  const duplicate = claimFamiliarAttendanceReward(first.state, at("2026-09-08"));
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.reward, null);
  const next = claimFamiliarAttendanceReward(first.state, at("2026-09-09"));
  assert.equal(next.state.attendance.streak, 2);
  const gap = claimFamiliarAttendanceReward(next.state, at("2026-09-11"));
  assert.equal(gap.state.attendance.streak, 1);
});

test("all weekly reward sprites are native indexed 32px PNG assets", async () => {
  const hashes = new Set();
  for (const item of FAMILIAR_ATTENDANCE_COLLECTIBLES) {
    const file = new URL(`../public${item.icon}`, import.meta.url);
    await access(file);
    const metadata = await sharp(fileURLToPath(file)).metadata();
    assert.equal(metadata.width, 32, item.id);
    assert.equal(metadata.height, 32, item.id);
    assert.equal(metadata.isPalette, true, item.id);
    assert.equal(metadata.hasAlpha, true, item.id);
    hashes.add(createHash("sha256").update(await readFile(file)).digest("hex"));
  }
  assert.equal(hashes.size, 52, "every weekly collectible needs distinct pixels");
});

test("attendance UI is a modal and play opens the real mini-game", async () => {
  const component = await readFile(new URL("../components/FamiglioNexusRebuild.tsx", import.meta.url), "utf8");
  assert.match(component, /attendanceBackdrop/);
  assert.match(component, /\/api\/famiglio\/rebuild\/attendance/);
  assert.match(component, /if \(item\.id === "play"\)[\s\S]*setMiniGameOpen\(true\)/);
  assert.match(component, /FamiglioDailyMiniGame/);
});
