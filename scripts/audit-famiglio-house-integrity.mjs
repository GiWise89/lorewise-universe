import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { FAMILIAR_HOUSE_VISUALS } from "../lib/famiglioHouseVisuals.ts";
import { FAMILIAR_COLLECTION, REQUIRED_COLLECTION_ACTIONS } from "../lib/famiglioMarketExpansion.ts";

const root = process.cwd();
const frameSize = 128;
const framesPerStrip = 4;
const groundPixel = 115;
const sleepCenter = 71.5;
const stages = ["base", "cucciolo", "giovane", "adulto"];
const growthTargets = { cucciolo: .76, giovane: .88, adulto: 1 };
const reportPath = path.join(root, "artifacts", "famiglio-rebuild-qa", "familiar-house-integrity.json");

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

function alphaComponents(data) {
  const seen = new Uint8Array(frameSize * frameSize);
  const areas = [];
  for (let y = 0; y < frameSize; y += 1) for (let x = 0; x < frameSize; x += 1) {
    const seed = y * frameSize + x;
    if (seen[seed] || data[seed * 4 + 3] < 16) continue;
    const queue = [seed];
    seen[seed] = 1;
    let cursor = 0;
    let area = 0;
    while (cursor < queue.length) {
      const current = queue[cursor++];
      const currentX = current % frameSize;
      const currentY = Math.floor(current / frameSize);
      area += 1;
      for (let shiftY = -1; shiftY <= 1; shiftY += 1) for (let shiftX = -1; shiftX <= 1; shiftX += 1) {
        if (!shiftX && !shiftY) continue;
        const nextX = currentX + shiftX;
        const nextY = currentY + shiftY;
        if (nextX < 0 || nextX >= frameSize || nextY < 0 || nextY >= frameSize) continue;
        const next = nextY * frameSize + nextX;
        if (seen[next] || data[next * 4 + 3] < 16) continue;
        seen[next] = 1;
        queue.push(next);
      }
    }
    areas.push(area);
  }
  return areas.sort((left, right) => right - left);
}

function analyzeRawFrame(data) {
  let minX = frameSize; let minY = frameSize; let maxX = -1; let maxY = -1;
  let opaquePixels = 0;
  let edgePixels = 0;
  let softPixels = 0;
  for (let y = 0; y < frameSize; y += 1) for (let x = 0; x < frameSize; x += 1) {
    const alpha = data[(y * frameSize + x) * 4 + 3];
    if (alpha > 0 && alpha < 255) softPixels += 1;
    if (alpha < 16) continue;
    opaquePixels += 1;
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    if (x === 0 || y === 0 || x === frameSize - 1 || y === frameSize - 1) edgePixels += 1;
  }
  const componentAreas = alphaComponents(data);
  const significantThreshold = Math.max(24, Math.round(opaquePixels * .03));
  return {
    opaquePixels,
    edgePixels,
    softPixels,
    significantComponents: componentAreas.filter((area) => area >= significantThreshold).length,
    bounds: maxX < minX ? null : {
      left: minX,
      top: minY,
      right: maxX,
      bottom: maxY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      centerY: (minY + maxY) / 2,
    },
  };
}

async function analyzeStrip(filePath, action) {
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== frameSize * framesPerStrip || info.height !== frameSize) {
    return { action, path: path.relative(root, filePath).replaceAll("\\", "/"), invalidDimensions: `${info.width}x${info.height}`, frames: [] };
  }
  const frames = [];
  for (let frameIndex = 0; frameIndex < framesPerStrip; frameIndex += 1) {
    const frame = Buffer.alloc(frameSize * frameSize * 4);
    for (let y = 0; y < frameSize; y += 1) {
      const sourceStart = (y * info.width + frameIndex * frameSize) * 4;
      data.copy(frame, y * frameSize * 4, sourceStart, sourceStart + frameSize * 4);
    }
    frames.push(analyzeRawFrame(frame));
  }
  const visible = frames.filter((frame) => frame.bounds);
  const masses = visible.map((frame) => Math.sqrt(frame.opaquePixels));
  const sleeping = action === "sleep" || action === "sleep-calm";
  const interaction = action === "feed" || action === "play";
  return {
    action,
    path: path.relative(root, filePath).replaceAll("\\", "/"),
    invalidDimensions: null,
    blankFrames: frames.length - visible.length,
    edgePixels: frames.reduce((sum, frame) => sum + frame.edgePixels, 0),
    softPixels: frames.reduce((sum, frame) => sum + frame.softPixels, 0),
    groundSpread: sleeping || !visible.length ? 0 : Math.max(...visible.map((frame) => frame.bounds.bottom)) - Math.min(...visible.map((frame) => frame.bounds.bottom)),
    maxGroundDeviation: sleeping || !visible.length ? 0 : Math.max(...visible.map((frame) => Math.abs(frame.bounds.bottom - groundPixel))),
    sleepCenterSpread: sleeping && visible.length ? Math.max(...visible.map((frame) => frame.bounds.centerY)) - Math.min(...visible.map((frame) => frame.bounds.centerY)) : 0,
    maxSleepCenterDeviation: sleeping && visible.length ? Math.max(...visible.map((frame) => Math.abs(frame.bounds.centerY - sleepCenter))) : 0,
    visualMassRatio: masses.length ? Math.max(...masses) / Math.min(...masses) : Infinity,
    embeddedObjectCandidates: interaction ? frames.reduce((sum, frame) => sum + Math.max(0, frame.significantComponents - 1), 0) : 0,
    frames,
  };
}

const familiars = [];
const residuals = [];
for (const familiar of FAMILIAR_COLLECTION) {
  const familiarReport = { id: familiar.id, visual: FAMILIAR_HOUSE_VISUALS[familiar.id], stages: {} };
  for (const stage of stages) {
    const assets = [];
    for (const action of REQUIRED_COLLECTION_ACTIONS) {
      const stageParts = stage === "base" ? ["house"] : ["growth", stage, "house"];
      const filePath = path.join(root, "public", familiar.spriteBase.replace(/^\//, ""), ...stageParts, `${action}.png`);
      let asset;
      try {
        asset = await analyzeStrip(filePath, action);
      } catch (error) {
        asset = { action, path: path.relative(root, filePath).replaceAll("\\", "/"), readError: error instanceof Error ? error.message : String(error), frames: [] };
      }
      assets.push(asset);
      if (asset.readError || asset.invalidDimensions || asset.blankFrames || asset.edgePixels || asset.softPixels
        || asset.groundSpread > 0 || asset.maxGroundDeviation > 0 || asset.sleepCenterSpread > 1
        || asset.maxSleepCenterDeviation > 1 || asset.visualMassRatio > 1.12 || asset.embeddedObjectCandidates > 0) {
        residuals.push(`${familiar.id}:${stage}:${action}`);
      }
    }
    const idle = assets.find((asset) => asset.action === "idle");
    const idleMass = idle?.frames?.length ? median(idle.frames.map((frame) => Math.sqrt(frame.opaquePixels))) : 0;
    for (const asset of assets) {
      if (!asset.frames?.length || !idleMass) continue;
      asset.massRatioToIdle = median(asset.frames.map((frame) => Math.sqrt(frame.opaquePixels))) / idleMass;
      if (asset.massRatioToIdle < .72 || asset.massRatioToIdle > 1.28) residuals.push(`${familiar.id}:${stage}:${asset.action}:cross-mass`);
    }
    familiarReport.stages[stage] = { idleMass, assets };
  }
  const adultMass = familiarReport.stages.adulto.idleMass || 1;
  familiarReport.stageMassRatios = Object.fromEntries(Object.entries(growthTargets).map(([stage, target]) => [stage, { target, actual: familiarReport.stages[stage].idleMass / adultMass }]));
  for (const [stage, target] of Object.entries(growthTargets)) {
    if (Math.abs(familiarReport.stageMassRatios[stage].actual - target) > .08) residuals.push(`${familiar.id}:${stage}:growth-ratio`);
  }
  if (!familiarReport.visual || familiarReport.visual.scale < .45 || familiarReport.visual.scale > 1.4 || Math.abs(familiarReport.visual.groundOffset) > .02) {
    residuals.push(`${familiar.id}:visual-config`);
  }
  familiars.push(familiarReport);
}

const scaleOrderChecks = [
  ["great-dane", "cat"], ["saint-bernard", "schnauzer"], ["horse", "golden"],
  ["panda", "rabbit"], ["polar-bear", "panda"], ["brown-bear", "fox"],
  ["adult-red-dragon", "faerie-dragon"], ["brachiosaurus", "velociraptor"],
];
for (const [larger, smaller] of scaleOrderChecks) {
  if ((FAMILIAR_HOUSE_VISUALS[larger]?.scale ?? 0) <= (FAMILIAR_HOUSE_VISUALS[smaller]?.scale ?? 0)) residuals.push(`scale-order:${larger}:${smaller}`);
}

const uniqueResiduals = [...new Set(residuals)];
const report = {
  auditedAt: new Date().toISOString(),
  contract: {
    frameSize,
    framesPerStrip,
    groundPixel,
    sleepCenter,
    stages,
    actions: REQUIRED_COLLECTION_ACTIONS,
    interactionObjectPolicy: "feed/play devono contenere solo il corpo: una sola ciotola o palla viene disegnata separatamente dalla Casa.",
  },
  totals: {
    familiars: familiars.length,
    stageSets: familiars.length * stages.length,
    sheets: familiars.length * stages.length * REQUIRED_COLLECTION_ACTIONS.length,
    frames: familiars.length * stages.length * REQUIRED_COLLECTION_ACTIONS.length * framesPerStrip,
    residuals: uniqueResiduals,
  },
  familiars,
};
await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report.totals, report: path.relative(root, reportPath).replaceAll("\\", "/") }));
if (uniqueResiduals.length) process.exitCode = 1;
