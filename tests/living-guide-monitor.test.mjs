import test from "node:test";
import assert from "node:assert/strict";
import {
  buildLivingGuideNotification,
  extractLivingGuideSignals,
  fingerprintLivingGuideSignals,
  livingGuideChanged,
  LIVING_GUIDE_MONITORS,
  WORLD_OF_WARCRAFT_MONITOR,
} from "../lib/livingGuideMonitor.ts";

test("monitors the current Midnight content notes and rolling hotfixes", () => {
  assert.ok(WORLD_OF_WARCRAFT_MONITOR.sourceUrls.some((url) => url.includes("24293281")));
  assert.ok(WORLD_OF_WARCRAFT_MONITOR.sourceUrls.some((url) => url.includes("24296142")));
});

test("registers every evolving game as an approval-only living guide", () => {
  assert.deepEqual(LIVING_GUIDE_MONITORS.map((monitor) => monitor.guideSlug), [
    "world-of-warcraft", "the-sims-4", "monster-hunter-wilds", "diablo-iv", "pokemon-pokopia", "the-witcher-3", "cyberpunk-2077", "inazuma-eleven-victory-road",
  ]);
  assert.ok(LIVING_GUIDE_MONITORS.every((monitor) => monitor.notificationTarget === "/notifiche"));
});

test("extracts only stable guide-relevant official headings", () => {
  const signals = extractLivingGuideSignals(`<html><head><title>World of Warcraft: Midnight</title></head><body>
    <h2>Midnight Season 2 Begins</h2><h3>Raid and Mythic Dungeon Updates</h3><h2>Visit the shop</h2></body></html>`);
  assert.deepEqual(signals, ["Midnight Season 2 Begins", "Raid and Mythic Dungeon Updates", "World of Warcraft: Midnight"]);
});

test("seeds silently, detects a later change, and prepares an approval notification", async () => {
  const firstSignals = ["Midnight Season 2 Begins"];
  const nextSignals = [...firstSignals, "New Raid Update"];
  const first = { guideSlug: "world-of-warcraft", checkedAt: "2026-08-23T07:00:00.000Z", fingerprint: await fingerprintLivingGuideSignals(firstSignals), signals: firstSignals };
  const next = { guideSlug: "world-of-warcraft", checkedAt: "2026-09-23T07:00:00.000Z", fingerprint: await fingerprintLivingGuideSignals(nextSignals), signals: nextSignals };
  assert.equal(livingGuideChanged(null, first), false);
  assert.equal(livingGuideChanged(first, first), false);
  assert.equal(livingGuideChanged(first, next), true);
  const notification = buildLivingGuideNotification(next);
  assert.equal(notification.targetUrl, "/notifiche");
  assert.match(notification.message, /nessun contenuto .* pubblicato automaticamente/i);
});

test("uses the monitored game name in each approval notification", async () => {
  const signals = ["New Expansion Update"];
  const snapshot = { guideSlug: "pokemon-pokopia", checkedAt: "2026-09-24T07:00:00.000Z", fingerprint: await fingerprintLivingGuideSignals(signals), signals };
  assert.match(buildLivingGuideNotification(snapshot).title, /^Pokémon Pokopia:/);
});
