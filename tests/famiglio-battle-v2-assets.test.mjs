import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";
import { FAMILIAR_COMBAT_CATALOG } from "../lib/famiglioCombatCatalog.ts";

const root = process.cwd();
const auditPath = path.join(root, "artifacts", "famiglio-rebuild-qa", "familiar-battle-v2-manifest.json");
const manifest = JSON.parse(await readFile(auditPath, "utf8"));
const stages = ["cucciolo", "giovane", "adulto"];
const actions = [
  "entrance",
  "idle",
  "run",
  "physical",
  "magic",
  "attack",
  "technique",
  "guard",
  "hit",
  "win",
  "lose",
  "victory",
  "exhausted",
];
const frameSize = 160;
const framesPerStrip = 12;

function median(values) {
  const ordered = [...values].sort((left, right) => left - right);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
}

function ratio(values) {
  return Math.max(...values) / Math.max(1, Math.min(...values));
}

function framePixels(strip, stripWidth, frame) {
  const pixels = Buffer.alloc(frameSize * frameSize * 4);
  for (let y = 0; y < frameSize; y += 1) {
    const sourceStart = (y * stripWidth + frame * frameSize) * 4;
    strip.copy(pixels, y * frameSize * 4, sourceStart, sourceStart + frameSize * 4);
  }
  return pixels;
}

function frameGeometry(pixels) {
  let minX = frameSize;
  let minY = frameSize;
  let maxX = -1;
  let maxY = -1;
  let opaquePixels = 0;
  let softAlpha = 0;
  let edgeAlpha = 0;
  let alphaX = 0;
  for (let y = 0; y < frameSize; y += 1) for (let x = 0; x < frameSize; x += 1) {
    const alpha = pixels[(y * frameSize + x) * 4 + 3];
    if (alpha > 0 && alpha < 255) softAlpha += 1;
    if (!alpha) continue;
    opaquePixels += 1;
    alphaX += x;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    if (x === 0 || x === frameSize - 1 || y === 0 || y === frameSize - 1) edgeAlpha += 1;
  }
  const width = maxX >= minX ? maxX - minX + 1 : 0;
  const height = maxY >= minY ? maxY - minY + 1 : 0;
  return {
    width,
    height,
    span: Math.max(width, height),
    bottom: maxY,
    opaquePixels,
    softAlpha,
    edgeAlpha,
    boundsCenterX: maxX >= minX ? (minX + maxX) / 2 : Number.NaN,
    centroidX: opaquePixels ? alphaX / opaquePixels : Number.NaN,
    hash: createHash("sha256").update(pixels).digest("hex"),
  };
}

test("il roster battle-v2 copre tutti i 53 Famigli, le tre crescite e tredici azioni", () => {
  assert.equal(manifest.version, 2);
  assert.equal(manifest.frameSize, frameSize);
  assert.equal(manifest.framesPerStrip, framesPerStrip);
  assert.equal(manifest.floorLine, 146);
  assert.deepEqual(manifest.totals.invalid, []);
  assert.equal(manifest.totals.familiars, 53);
  assert.equal(manifest.totals.stages, stages.length);
  assert.equal(manifest.totals.actions, actions.length);
  assert.equal(manifest.totals.sheets, 53 * stages.length * actions.length);
  assert.equal(manifest.totals.frames, 53 * stages.length * actions.length * framesPerStrip);
  assert.deepEqual(manifest.familiars.map((entry) => entry.id), FAMILIAR_COMBAT_CATALOG.map((entry) => entry.id));
});

test("ogni stage usa una scala canonica positiva senza duplicare azioni", () => {
  for (const familiar of manifest.familiars) for (const stage of familiar.stages) {
    assert.ok(Number.isFinite(stage.canonicalScale) && stage.canonicalScale > 0, `${familiar.id}/${stage.stage}: scala canonica`);
    assert.deepEqual(stage.duplicateActionGroups, [], `${familiar.id}/${stage.stage}: azioni duplicate`);
    const hashes = stage.actions.map((action) => action.hash);
    assert.equal(hashes.length, actions.length, `${familiar.id}/${stage.stage}: hash azioni`);
    assert.equal(new Set(hashes).size, hashes.length, `${familiar.id}/${stage.stage}: strip duplicate`);
  }
});

test("ogni sprite battle-v2 mantiene pavimento, anatomia e trasparenza in tutti i frame", async () => {
  let checkedSheets = 0;
  let checkedFrames = 0;
  for (const familiar of manifest.familiars) {
    assert.deepEqual(familiar.stages.map((entry) => entry.stage), stages, familiar.id);
    for (const stage of familiar.stages) {
      assert.deepEqual(stage.actions.map((entry) => entry.action), actions, `${familiar.id}/${stage.stage}`);
      const actionSummaries = [];
      for (const action of stage.actions) {
        const filePath = path.join(root, ...action.path.split("/"));
        const fileStats = await stat(filePath);
        assert.ok(fileStats.size > 350, `${familiar.id}/${stage.stage}/${action.action}: file vuoto`);
        const bytes = await readFile(filePath);
        assert.equal(createHash("sha256").update(bytes).digest("hex"), action.hash, `${familiar.id}/${stage.stage}/${action.action}: hash strip`);
        const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        assert.equal(info.width, frameSize * framesPerStrip, `${familiar.id}/${stage.stage}/${action.action}: larghezza`);
        assert.equal(info.height, frameSize, `${familiar.id}/${stage.stage}/${action.action}: altezza`);
        assert.equal(info.channels, 4, `${familiar.id}/${stage.stage}/${action.action}: canali`);
        assert.ok(action.uniqueFrames >= 2, `${familiar.id}/${stage.stage}/${action.action}: animazione immobile`);

        const geometry = [];
        for (let frame = 0; frame < framesPerStrip; frame += 1) {
          const measured = frameGeometry(framePixels(data, info.width, frame));
          const recorded = action.frames[frame];
          assert.ok(measured.width > 0 && measured.height > 0, `${familiar.id}/${stage.stage}/${action.action}/${frame}: frame vuoto`);
          assert.ok(measured.bottom >= 145 && measured.bottom <= 146, `${familiar.id}/${stage.stage}/${action.action}/${frame}: non ancorato al pavimento`);
          assert.equal(measured.edgeAlpha, 0, `${familiar.id}/${stage.stage}/${action.action}/${frame}: corpo tagliato`);
          assert.equal(measured.softAlpha, 0, `${familiar.id}/${stage.stage}/${action.action}/${frame}: alone o alfa sporca`);
          assert.ok(Math.abs(measured.boundsCenterX - frameSize / 2) <= 16, `${familiar.id}/${stage.stage}/${action.action}/${frame}: corpo fuori centro`);
          assert.ok(measured.centroidX >= 32 && measured.centroidX <= 128, `${familiar.id}/${stage.stage}/${action.action}/${frame}: centroide fuori scena`);
          assert.deepEqual(
            { width: measured.width, height: measured.height, span: measured.span, bottom: measured.bottom, opaquePixels: measured.opaquePixels, edgeAlpha: measured.edgeAlpha, softAlpha: measured.softAlpha, hash: measured.hash },
            recorded,
            `${familiar.id}/${stage.stage}/${action.action}/${frame}: manifest non allineato`,
          );
          geometry.push(measured);
          checkedFrames += 1;
        }
        const linearMassRatio = ratio(geometry.map((frame) => Math.sqrt(frame.opaquePixels)));
        assert.ok(linearMassRatio <= 1.22, `${familiar.id}/${stage.stage}/${action.action}: area cambia (${linearMassRatio.toFixed(3)})`);
        assert.ok(Math.abs(linearMassRatio - action.linearMassRatio) < 1e-9, `${familiar.id}/${stage.stage}/${action.action}: rapporto area manifest`);
        assert.equal(new Set(geometry.map((frame) => frame.hash)).size, action.uniqueFrames, `${familiar.id}/${stage.stage}/${action.action}: frame unici`);
        actionSummaries.push({
          action: action.action,
          linearMass: median(geometry.map((frame) => Math.sqrt(frame.opaquePixels))),
          height: median(geometry.map((frame) => frame.height)),
          centroidX: median(geometry.map((frame) => frame.centroidX)),
          areas: geometry.map((frame) => frame.opaquePixels).sort((left, right) => left - right),
          heights: geometry.map((frame) => frame.height).sort((left, right) => left - right),
        });
        checkedSheets += 1;
      }

      const byAction = Object.fromEntries(actionSummaries.map((entry) => [entry.action, entry]));
      const activeActions = actionSummaries.filter((entry) => !["guard", "lose", "exhausted"].includes(entry.action));
      assert.ok(ratio(activeActions.map((entry) => entry.linearMass)) <= 1.45, `${familiar.id}/${stage.stage}: massa incoerente tra azioni`);
      assert.ok(ratio([byAction.entrance.height, byAction.idle.height, byAction.run.height]) <= 1.55, `${familiar.id}/${stage.stage}: altezza locomozione incoerente`);
      assert.ok(Math.max(...actionSummaries.map((entry) => entry.centroidX)) - Math.min(...actionSummaries.map((entry) => entry.centroidX)) <= 48, `${familiar.id}/${stage.stage}: centroide cambia tra azioni`);
    }
  }
  assert.equal(checkedSheets, 2067);
  assert.equal(checkedFrames, 2067 * framesPerStrip);
});
