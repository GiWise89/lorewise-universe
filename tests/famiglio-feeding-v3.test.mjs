import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { FAMILIAR_COLLECTION } from "../lib/famiglioMarketExpansion.ts";

const geometry = JSON.parse(await readFile("artifacts/famiglio-meal-review/v3/geometry.json", "utf8"));

function componentAreas(cell) {
  const seen = new Uint8Array(128 * 128), areas = [];
  for (let p = 0; p < seen.length; p++) {
    if (seen[p] || !cell[p * 4 + 3]) continue;
    const queue = [p]; seen[p] = 1;
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const current = queue[cursor], x = current % 128, y = Math.floor(current / 128);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy, next = ny * 128 + nx;
        if (nx < 0 || nx >= 128 || ny < 0 || ny >= 128 || seen[next] || !cell[next * 4 + 3]) continue;
        seen[next] = 1; queue.push(next);
      }
    }
    areas.push(queue.length);
  }
  return areas;
}

test("53 species have four complete transparent eating frames in all three growth stages", async () => {
  assert.equal(geometry.length, 53);
  for (const pet of FAMILIAR_COLLECTION) for (const stage of ["cucciolo", "giovane", "adulto"]) {
    const path = `public${pet.spriteBase}/growth/${stage}/house/feed-v3.png`;
    const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(info.width, 512, path);
    assert.equal(info.height, 128, path);
    const hashes = new Set();
    const areas = [];
    for (let f = 0; f < 4; f++) {
      let bottom = -1, area = 0;
      const cell = Buffer.alloc(128 * 128 * 4);
      for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
        const offset = (y * 512 + f * 128 + x) * 4;
        data.copy(cell, (y * 128 + x) * 4, offset, offset + 4);
        const alpha = data[offset + 3];
        assert.ok(alpha === 0 || alpha === 255, `${path}/${f}: soft matte pixel`);
        if (!alpha) continue;
        assert.ok(x > 0 && x < 127 && y > 0 && y < 127, `${path}/${f}: clipped pixel`);
        bottom = Math.max(bottom, y); area++;
      }
      assert.equal(bottom, 115, `${path}/${f}: feet not on baseline`);
      assert.ok(area > 100, `${path}/${f}: empty body`);
      areas.push(area);
      assert.ok(componentAreas(cell).every(component => component >= 3), `${path}/${f}: isolated pixel specks`);
      hashes.add(createHash("sha256").update(cell).digest("hex"));
    }
    assert.equal(hashes.size, 4, `${path}: fewer than four distinct frames`);
    assert.ok(Math.sqrt(Math.max(...areas) / Math.min(...areas)) <= 1.12, `${path}: body volume changes`);
  }
});

test("feeding normalization uses a constant whole-sequence scale for each growth stage", () => {
  for (const pet of geometry) for (const stage of pet.stages) {
    assert.equal(new Set(stage.frames.map(frame => frame.scale)).size, 1, `${pet.id}/${stage.stage}`);
    assert.equal(new Set(stage.frames.map(frame => frame.floor)).size, 1, `${pet.id}/${stage.stage}`);
  }
});

test("Casa selects only the new feeding sheet, with no sitting fallback or left-facing exception", async () => {
  const source = await readFile("components/FamiglioNexusRebuild.tsx", "utf8");
  assert.match(source, /spriteAction === "feed" \? "feed-v3" : spriteAction/);
  assert.doesNotMatch(source, /sourceFacing/);
  assert.match(source, /mealProgress.settling\s*\? sourceFrames - 1/);
  assert.match(source, /spriteImages.size !== HOME_SPRITE_ACTIONS.length/);
});
