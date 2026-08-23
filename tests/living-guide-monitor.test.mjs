import test from "node:test";
import assert from "node:assert/strict";
import {
  buildLivingGuideNotification,
  extractLivingGuideSignals,
  fingerprintLivingGuideSignals,
  livingGuideChanged,
} from "../lib/livingGuideMonitor.ts";

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
