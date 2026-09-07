import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import sharp from "sharp";
import { FAMILIAR_COMBAT_CAMPAIGN, familiarCampaignOpponent } from "../lib/famiglioCombatCampaign.ts";

test("la campagna contiene 20 livelli ordinati in cinque capitoli", () => {
  assert.equal(FAMILIAR_COMBAT_CAMPAIGN.length, 20);
  assert.deepEqual(FAMILIAR_COMBAT_CAMPAIGN.map((level) => level.number), Array.from({ length: 20 }, (_, index) => index + 1));
  assert.deepEqual([...new Set(FAMILIAR_COMBAT_CAMPAIGN.map((level) => level.chapter))], [1, 2, 3, 4, 5]);
  assert.equal(FAMILIAR_COMBAT_CAMPAIGN.at(-1)?.opponentLevel, 50);
  assert.equal(FAMILIAR_COMBAT_CAMPAIGN.at(-1)?.npc.rank, "boss");
});

test("ogni livello usa uno scenario 16:9 dedicato e un foglio NPC animato personale", async () => {
  const npcPaths = new Set();
  for (const level of FAMILIAR_COMBAT_CAMPAIGN) {
    assert.ok(existsSync(`public${level.arenaSrc}`), level.arenaSrc);
    assert.ok(existsSync(`public${level.npc.spriteSrc}`), level.npc.spriteSrc);
    assert.ok(level.introLine.length > 20);
    assert.notEqual(familiarCampaignOpponent(level, level.opponentIds[0]), level.opponentIds[0]);
    npcPaths.add(level.npc.spriteSrc);
    const metadata = await sharp(`public${level.npc.spriteSrc}`).metadata();
    assert.equal(metadata.width, 1024, level.npc.spriteSrc);
    assert.equal(metadata.height, 768, level.npc.spriteSrc);
  }
  assert.equal(npcPaths.size, 20);
});

test("l'Arena collega storia, dialoghi, aura corrotta e sfondi senza foreground HTML", () => {
  const source = readFileSync("components/FamiglioCombatArena.tsx", "utf8");
  const canvas = readFileSync("components/FamiglioCombatCanvas.tsx", "utf8");
  const npcCanvas = readFileSync("components/FamiglioCampaignNpcCanvas.tsx", "utf8");
  assert.match(source, /Campagna del Legame Corrotto/);
  assert.match(source, /FamiglioCampaignNpcCanvas/);
  assert.match(source, /opponentCorrupted/);
  assert.match(source, /campaignNpcPose/);
  for (const pose of ["command", "cheer", "anger", "victory", "defeat"]) assert.match(source, new RegExp(`"${pose}"`));
  assert.match(npcCanvas, /const NPC_ROW/);
  assert.match(npcCanvas, /anger: 3/);
  assert.match(npcCanvas, /victory: 4/);
  assert.match(npcCanvas, /defeat: 5/);
  assert.match(npcCanvas, /const columns = 8/);
  assert.doesNotMatch(npcCanvas, /context\.rotate|Math\.sin/);
  assert.doesNotMatch(source, /campaignForeground|foregroundProp|arenaProp/);
  assert.match(canvas, /corruption-aura-purple-v1\.png/);
  assert.doesNotMatch(canvas, /status-poison\.png/);
  assert.match(canvas, /globalCompositeOperation = "source-over"/);
  assert.ok(canvas.indexOf("images.corruption") < canvas.indexOf("if (images.opponent)"), "l'aura deve essere disegnata dietro l'avversario");
});
