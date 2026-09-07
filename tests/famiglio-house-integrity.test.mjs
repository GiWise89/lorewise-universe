import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { FAMILIAR_HOUSE_VISUALS } from "../lib/famiglioHouseVisuals.ts";
import { FAMILIAR_COLLECTION, REQUIRED_COLLECTION_ACTIONS } from "../lib/famiglioMarketExpansion.ts";

const root = process.cwd();
const generatedAudit = JSON.parse(await readFile(path.join(root, "artifacts", "famiglio-rebuild-qa", "familiar-house-action-audit.json"), "utf8"));
const integrityAudit = JSON.parse(await readFile(path.join(root, "artifacts", "famiglio-rebuild-qa", "familiar-house-integrity.json"), "utf8"));

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

test("all 53 familiars have complete grounded house strips in every growth stage", async () => {
  assert.equal(FAMILIAR_COLLECTION.length, 53);
  assert.equal(generatedAudit.familiars.length, 53);
  assert.deepEqual(generatedAudit.growthStageScales, { cucciolo: .76, giovane: .88, adulto: 1 });
  for (const familiar of generatedAudit.familiars) {
    assert.equal(familiar.validated, true, `${familiar.id} failed the generator integrity contract`);
    assert.equal(familiar.actions.length, REQUIRED_COLLECTION_ACTIONS.length);
    for (const stage of Object.keys(generatedAudit.growthStageScales)) {
      assert.equal(familiar.growthActions[stage].length, REQUIRED_COLLECTION_ACTIONS.length);
      for (const action of REQUIRED_COLLECTION_ACTIONS) {
        const filePath = path.join(root, "public", "famiglio", "rebuild", "collection", familiar.id, "growth", stage, "house", `${action}.png`);
        const metadata = await sharp(filePath).metadata();
        assert.equal(metadata.width, 512, `${familiar.id}/${stage}/${action} width`);
        assert.equal(metadata.height, 128, `${familiar.id}/${stage}/${action} height`);
        assert.equal(metadata.hasAlpha, true, `${familiar.id}/${stage}/${action} alpha`);
      }
    }
  }
});

test("body scale, floor and sleep center stay coherent through every action", () => {
  assert.equal(integrityAudit.totals.familiars, 53);
  assert.equal(integrityAudit.totals.sheets, 2120);
  assert.equal(integrityAudit.totals.frames, 8480);
  assert.deepEqual(integrityAudit.totals.residuals, []);
  for (const familiar of integrityAudit.familiars) {
    for (const stage of Object.values(familiar.stages)) {
      for (const action of stage.assets) {
        assert.equal(action.blankFrames, 0);
        assert.equal(action.edgePixels, 0);
        assert.equal(action.softPixels, 0);
        assert.ok(action.visualMassRatio <= 1.12, `${familiar.id}/${action.action} changes body mass`);
        if (action.action === "sleep" || action.action === "sleep-calm") {
          assert.ok(action.sleepCenterSpread <= 1, `${familiar.id}/${action.action} moves off the bed center`);
          assert.ok(action.maxSleepCenterDeviation <= 1, `${familiar.id}/${action.action} is not centered on the bed`);
        } else {
          assert.equal(action.groundSpread, 0, `${familiar.id}/${action.action} changes ground line`);
          assert.equal(action.maxGroundDeviation, 0, `${familiar.id}/${action.action} sinks or floats`);
        }
      }
    }
  }
});

test("feed and play contain one familiar body and no second bowl or ball", () => {
  for (const familiar of integrityAudit.familiars) {
    for (const [stageName, stage] of Object.entries(familiar.stages)) {
      for (const actionName of ["feed", "play"]) {
        const action = stage.assets.find((entry) => entry.action === actionName);
        assert.equal(action.embeddedObjectCandidates, 0, `${familiar.id}/${stageName}/${actionName} has a detached prop`);
        assert.ok(action.frames.every((frame) => frame.significantComponents === 1), `${familiar.id}/${stageName}/${actionName} has more than one visible subject`);
      }
    }
  }
});

test("growth uses one fixed scale per stage for every action", () => {
  for (const familiar of generatedAudit.familiars) {
    for (const action of REQUIRED_COLLECTION_ACTIONS) {
      const adult = familiar.growthActions.adulto.find((entry) => entry.action === action);
      const adultMass = median(adult.opaquePixels.map((pixels) => Math.sqrt(pixels)));
      for (const [stage, expected] of Object.entries(generatedAudit.growthStageScales)) {
        const entry = familiar.growthActions[stage].find((candidate) => candidate.action === action);
        const actual = median(entry.opaquePixels.map((pixels) => Math.sqrt(pixels))) / adultMass;
        assert.ok(Math.abs(actual - expected) <= .06, `${familiar.id}/${action}/${stage} scale ${actual.toFixed(3)}`);
      }
    }
  }
});

test("natural-size configuration covers the roster and keeps large species larger", () => {
  assert.equal(Object.keys(FAMILIAR_HOUSE_VISUALS).length, FAMILIAR_COLLECTION.length);
  for (const familiar of FAMILIAR_COLLECTION) {
    const visual = FAMILIAR_HOUSE_VISUALS[familiar.id];
    assert.ok(visual, `${familiar.id} has no house visual configuration`);
    assert.ok(visual.scale >= .45 && visual.scale <= 1.4, `${familiar.id} has an unsafe scale`);
    assert.ok(Math.abs(visual.groundOffset) <= .02, `${familiar.id} uses a sinking workaround`);
  }
  assert.ok(FAMILIAR_HOUSE_VISUALS["polar-bear"].scale > FAMILIAR_HOUSE_VISUALS.panda.scale);
  assert.ok(FAMILIAR_HOUSE_VISUALS.panda.scale > FAMILIAR_HOUSE_VISUALS.rabbit.scale);
  assert.ok(FAMILIAR_HOUSE_VISUALS["great-dane"].scale > FAMILIAR_HOUSE_VISUALS.cat.scale);
  assert.ok(FAMILIAR_HOUSE_VISUALS.brachiosaurus.scale > FAMILIAR_HOUSE_VISUALS.velociraptor.scale);
});

test("normalization reads Panda v2 and never writes combat assets", async () => {
  const source = await readFile(path.join(root, "scripts", "normalize-famiglio-house-sprites.mjs"), "utf8");
  assert.match(source, /panda-actions-v2\.png/);
  assert.doesNotMatch(source, /panda-actions-v1\.png/);
  assert.doesNotMatch(source, /growth["'],\s*stage,\s*["']battle/);
});
