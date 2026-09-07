import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { FAMILIAR_COLLECTION } from "../lib/famiglioMarketExpansion.ts";

const root = process.cwd();
const publicRoot = path.join(root, "public");
const auditRoot = path.join(root, "artifacts", "famiglio-rebuild-qa");
const frameSize = 160;
const sourceFramesPerStrip = 4;
const framesPerStrip = 12;
const floorLine = 146;
const contactCellWidth = 132;
const contactHeaderHeight = 48;
const contactRowHeight = 178;
const stages = ["cucciolo", "giovane", "adulto"];
const stageSpan = { cucciolo: 92, giovane: 108, adulto: 124 };
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

// Ogni sequenza usa la tavola di battaglia specifica del Famiglio e
// dell'azione. Non si ricavano piu attacchi, colpi o magie dalle pose
// domestiche: la regola vale per tutti i 53 Famigli e per ogni crescita.
const actionSources = {
  entrance: "entrance",
  idle: "idle",
  run: "run",
  physical: "physical",
  magic: "magic",
  attack: "attack",
  technique: "technique",
  guard: "guard",
  hit: "hit",
  win: "win",
  lose: "lose",
  victory: "victory",
  exhausted: "exhausted",
};

const frameOrder = {
  entrance: [0, 0, 1, 1, 2, 2, 3, 3, 2, 2, 3, 3],
  idle: [0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0],
  run: [0, 0, 1, 1, 2, 2, 3, 3, 0, 1, 2, 3],
  physical: [0, 0, 1, 1, 2, 2, 3, 3, 2, 1, 0, 0],
  magic: [0, 0, 1, 1, 2, 2, 3, 3, 2, 1, 0, 0],
  attack: [0, 0, 2, 2, 3, 3, 3, 2, 1, 1, 0, 0],
  technique: [3, 3, 1, 1, 2, 2, 3, 2, 1, 0, 0, 0],
  guard: [0, 0, 1, 1, 2, 2, 2, 2, 1, 1, 0, 0],
  hit: [0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0],
  win: [0, 0, 1, 1, 2, 2, 3, 3, 2, 3, 2, 3],
  lose: [0, 0, 1, 1, 2, 2, 3, 3, 3, 3, 3, 3],
  victory: [1, 1, 3, 3, 2, 2, 3, 3, 2, 3, 2, 3],
  exhausted: [3, 3, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0],
};

const horizontalMotion = {
  entrance: [-10, -8, -6, -4, -2, 0, 2, 4, 5, 6, 7, 7],
  idle: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  run: [-7, -5, -3, -1, 1, 3, 5, 7, -5, -1, 3, 7],
  physical: [-5, -4, -2, 1, 5, 9, 12, 10, 7, 4, 1, 0],
  magic: [0, 0, 1, 1, 2, 3, 3, 2, 2, 1, 0, 0],
  attack: [-7, -6, -3, 1, 6, 11, 13, 10, 6, 3, 1, 0],
  technique: [-2, -1, 0, 2, 4, 5, 4, 3, 2, 1, 0, 0],
  guard: [0, 0, -1, -1, -2, -2, -2, -2, -1, -1, 0, 0],
  hit: [0, -2, -5, -8, -11, -9, -6, -4, -2, -1, 0, 0],
  win: [0, 0, 0, 1, 1, 1, 0, -1, 0, 1, 0, 0],
  lose: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  victory: [-1, 0, 1, 1, 0, -1, 0, 1, 0, 1, 0, 0],
  exhausted: [1, 1, 0, 0, -1, -1, -1, 0, 0, 0, 0, 0],
};

const squash = [1, .99, .98, .99, 1, 1.01, 1.02, 1.01, 1, .99, 1, 1];

const actionLabels = {
  entrance: "ENTRATA",
  idle: "FERMO",
  run: "CORSA",
  physical: "COLPO",
  magic: "MAGIA",
  attack: "CARICA",
  technique: "TECNICA",
  guard: "DIFESA",
  hit: "REAZIONE",
  win: "ESULTA",
  lose: "SCONFITTO",
  victory: "VITTORIA",
  exhausted: "ESAUSTO",
};

function collectionPath(familiar, ...parts) {
  return path.join(publicRoot, familiar.spriteBase.replace(/^\//, ""), ...parts);
}

async function hardAlpha(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let index = 0; index < info.width * info.height; index += 1) {
    const offset = index * 4;
    if (data[offset + 3] >= 96) data[offset + 3] = 255;
    else {
      data[offset] = 0;
      data[offset + 1] = 0;
      data[offset + 2] = 0;
      data[offset + 3] = 0;
    }
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

async function extractFrames(sourcePath) {
  const metadata = await sharp(sourcePath).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (!width || !height) throw new Error(`Sprite senza dimensioni: ${sourcePath}`);
  const cellWidth = Math.floor(width / sourceFramesPerStrip);
  return Promise.all(Array.from({ length: sourceFramesPerStrip }, (_, index) => sharp(sourcePath)
    .extract({ left: index * cellWidth, top: 0, width: cellWidth, height })
    .png()
    .toBuffer()));
}

async function prepareBody(input) {
  const body = await hardAlpha(input);
  return sharp(body)
    .trim({ background: transparent, threshold: 1 })
    .png()
    .toBuffer();
}

async function resizeBody(body, scale, stretch = 1) {
  const metadata = await sharp(body).metadata();
  const width = metadata.width ?? 1;
  const height = metadata.height ?? 1;
  const outputWidth = Math.max(1, Math.round(width * scale * stretch));
  const outputHeight = Math.max(1, Math.round(height * scale / stretch));
  return {
    bytes: await sharp(body).resize(outputWidth, outputHeight, { fit: "fill", kernel: "nearest" }).png().toBuffer(),
    width: outputWidth,
    height: outputHeight,
  };
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

async function canonicalScaleForStage(preparedByAction, stage) {
  const idleMetadata = await Promise.all(preparedByAction.idle.map((body) => sharp(body).metadata()));
  const idleSpans = idleMetadata.map((metadata) => Math.max(metadata.width ?? 1, metadata.height ?? 1));
  const allMetadata = await Promise.all(Object.values(preparedByAction).flat().map((body) => sharp(body).metadata()));
  const largestWidth = Math.max(...allMetadata.map((metadata) => metadata.width ?? 1));
  const largestHeight = Math.max(...allMetadata.map((metadata) => metadata.height ?? 1));
  const desiredScale = stageSpan[stage] / Math.max(1, median(idleSpans));
  const fitScale = Math.min((frameSize - 8) / largestWidth, (floorLine - 4) / largestHeight);
  return Math.min(desiredScale, fitScale);
}

async function buildStrip(sources, action, canonicalScale) {
  const indexes = frameOrder[action];
  const normalized = await Promise.all(indexes.map((sourceIndex, index) => resizeBody(sources[sourceIndex], canonicalScale, squash[index])));
  const placements = normalized.map((frame, index) => {
    const left = Math.max(3, Math.min(frameSize - frame.width - 3, Math.round((frameSize - frame.width) / 2 + horizontalMotion[action][index])));
    const top = Math.max(3, floorLine - frame.height);
    return { input: frame.bytes, left: left + index * frameSize, top };
  });
  return sharp({ create: { width: frameSize * framesPerStrip, height: frameSize, channels: 4, background: transparent } })
    .composite(placements)
    .png({ palette: true, colours: 256 })
    .toBuffer();
}

async function frameMetrics(strip) {
  const frames = [];
  for (let index = 0; index < framesPerStrip; index += 1) {
    const bytes = await sharp(strip).extract({ left: index * frameSize, top: 0, width: frameSize, height: frameSize }).png().toBuffer();
    const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let minX = info.width; let minY = info.height; let maxX = -1; let maxY = -1; let edgeAlpha = 0; let softAlpha = 0; let opaquePixels = 0;
    for (let y = 0; y < info.height; y += 1) for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * 4 + 3];
      if (alpha > 0 && alpha < 255) softAlpha += 1;
      if (!alpha) continue;
      opaquePixels += 1;
      minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      if (x === 0 || y === 0 || x === info.width - 1 || y === info.height - 1) edgeAlpha += 1;
    }
    const width = maxX >= minX ? maxX - minX + 1 : 0;
    const height = maxY >= minY ? maxY - minY + 1 : 0;
    frames.push({ width, height, span: Math.max(width, height), bottom: maxY, opaquePixels, edgeAlpha, softAlpha, hash: createHash("sha256").update(data).digest("hex") });
  }
  return frames;
}

await mkdir(auditRoot, { recursive: true });
const manifest = [];
const contactRows = new Map();
const onlyFamiliar = process.argv.find((argument) => argument.startsWith("--only="))?.slice("--only=".length) ?? null;
for (const familiar of FAMILIAR_COLLECTION.filter((entry) => !onlyFamiliar || entry.id === onlyFamiliar)) {
  const familiarEntry = { id: familiar.id, stages: [] };
  for (const stage of stages) {
    const outputRoot = collectionPath(familiar, "growth", stage, "battle-v2");
    await mkdir(outputRoot, { recursive: true });
    const preparedByAction = {};
    for (const [action, sourceAction] of Object.entries(actionSources)) {
      const sourceFolder = familiar.id === "fiddle-dog" ? "battle-imagegen" : "battle";
      const source = collectionPath(familiar, "growth", stage, sourceFolder, `${sourceAction}.png`);
      const extracted = await extractFrames(source);
      preparedByAction[action] = await Promise.all(extracted.map(prepareBody));
    }
    const canonicalScale = await canonicalScaleForStage(preparedByAction, stage);
    const stageEntry = { stage, canonicalScale, actions: [] };
    const contactPreviews = [];
    for (const action of Object.keys(actionSources)) {
      const bytes = await buildStrip(preparedByAction[action], action, canonicalScale);
      const output = path.join(outputRoot, `${action}.png`);
      await writeFile(output, bytes);
      const frames = await frameMetrics(bytes);
      stageEntry.actions.push({
        action,
        path: path.relative(root, output).replaceAll("\\", "/"),
        frames,
        uniqueFrames: new Set(frames.map((frame) => frame.hash)).size,
        hash: createHash("sha256").update(bytes).digest("hex"),
      });
      if (stage === "adulto") {
        const preview = await sharp(bytes)
          .extract({ left: frameSize, top: 0, width: frameSize, height: frameSize })
          .resize(contactCellWidth - 10, contactRowHeight - contactHeaderHeight - 8, { fit: "contain", kernel: "nearest", background: transparent })
          .png()
          .toBuffer();
        contactPreviews.push({
          input: preview,
          left: stageEntry.actions.length * contactCellWidth - contactCellWidth + 5,
          top: contactHeaderHeight + 4,
        });
      }
    }
    familiarEntry.stages.push(stageEntry);
    if (stage === "adulto") {
      const labels = Object.keys(actionSources).map((action, index) => `<text x="${index * contactCellWidth + contactCellWidth / 2}" y="42" text-anchor="middle" font-family="monospace" font-size="10" font-weight="700" fill="#d9c8e8">${actionLabels[action]}</text>`).join("");
      const width = Object.keys(actionSources).length * contactCellWidth;
      const header = Buffer.from(`<svg width="${width}" height="${contactHeaderHeight}" xmlns="http://www.w3.org/2000/svg"><text x="12" y="20" font-family="monospace" font-size="15" font-weight="700" fill="#ffe06d">${familiar.name.replaceAll("&", "&amp;")}</text><text x="${width - 12}" y="20" text-anchor="end" font-family="monospace" font-size="11" fill="#d9c8e8">scala canonica ${canonicalScale.toFixed(4)}</text>${labels}</svg>`);
      const row = await sharp({ create: { width, height: contactRowHeight, channels: 4, background: { r: 22, g: 13, b: 37, alpha: 1 } } })
        .composite([{ input: header, left: 0, top: 0 }, ...contactPreviews])
        .png()
        .toBuffer();
      const rows = contactRows.get(familiar.category) ?? [];
      rows.push(row);
      contactRows.set(familiar.category, rows);
    }
  }
  manifest.push(familiarEntry);
}

const invalid = [];
for (const familiar of manifest) for (const stage of familiar.stages) {
  const hashes = new Map();
  for (const action of stage.actions) {
    const linearMasses = action.frames.map((frame) => Math.sqrt(frame.opaquePixels));
    action.linearMassRatio = Math.max(...linearMasses) / Math.max(1, Math.min(...linearMasses));
    if (action.uniqueFrames < 4 || action.linearMassRatio > 1.22 || action.frames.some((frame) => frame.bottom < floorLine - 5 || frame.bottom > floorLine + 4 || frame.edgeAlpha || frame.softAlpha || !frame.span)) {
      invalid.push(`${familiar.id}:${stage.stage}:${action.action}`);
    }
    const duplicates = hashes.get(action.hash) ?? [];
    duplicates.push(action.action);
    hashes.set(action.hash, duplicates);
  }
  stage.duplicateActionGroups = [...hashes.values()].filter((actions) => actions.length > 1);
  for (const group of stage.duplicateActionGroups) invalid.push(`${familiar.id}:${stage.stage}:duplicate:${group.join("+")}`);
}

const outputManifest = {
  generatedAt: new Date().toISOString(),
  version: 2,
  frameSize,
  framesPerStrip,
  floorLine,
  totals: {
    familiars: manifest.length,
    stages: stages.length,
    actions: Object.keys(actionSources).length,
    sheets: manifest.length * stages.length * Object.keys(actionSources).length,
    frames: manifest.length * stages.length * Object.keys(actionSources).length * framesPerStrip,
    invalid,
  },
  familiars: manifest,
};
await writeFile(path.join(auditRoot, "familiar-battle-v2-manifest.json"), JSON.stringify(outputManifest, null, 2));
for (const [category, rows] of contactRows) {
  const width = Object.keys(actionSources).length * contactCellWidth;
  await sharp({ create: { width, height: rows.length * contactRowHeight, channels: 4, background: { r: 14, g: 9, b: 25, alpha: 1 } } })
    .composite(rows.map((input, index) => ({ input, left: 0, top: index * contactRowHeight })))
    .png()
    .toFile(path.join(auditRoot, `familiar-battle-v2-${category}-contact-sheet.png`));
}
console.log(JSON.stringify(outputManifest.totals));
