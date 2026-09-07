import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { FAMILIAR_DUNGEONS } from "../lib/famiglioAdventure.ts";
import { FAMILIAR_COLLECTION, REQUIRED_COLLECTION_ACTIONS } from "../lib/famiglioMarketExpansion.ts";

const root = process.cwd();
const publicRoot = path.join(root, "public");
const artifactRoot = path.join(root, "artifacts", "famiglio-rebuild-qa");
const adventureRoot = path.join(publicRoot, "famiglio", "rebuild", "adventure");
const frameSize = 128;
const framesPerStrip = 4;
const floorLine = 116;
const sleepCenterLine = 72;
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const stages = ["cucciolo", "giovane", "adulto"];
const battleSources = {
  entrance: "walk",
  idle: "idle",
  run: "walk",
  physical: "feed",
  magic: "play",
  attack: "feed",
  technique: "play",
  guard: "sit",
  hit: "walk",
  win: "care",
  lose: "sleep-calm",
  victory: "care",
  exhausted: "sleep-calm",
};
const stageShape = {
  cucciolo: { upperX: .84, upperY: .8, lowerX: .68, lowerY: .6 },
  giovane: { upperX: .94, upperY: .93, lowerX: .86, lowerY: .82 },
  adulto: { upperX: 1, upperY: 1, lowerX: 1, lowerY: 1 },
};
const battleOffsets = {
  entrance: [[-7, 0], [-3, 0], [2, 0], [7, 0]],
  idle: [[0, 0], [0, -1], [0, 0], [0, -1]],
  run: [[-5, 0], [-1, 0], [4, 0], [8, 0]],
  physical: [[0, 0], [5, 0], [10, 0], [3, 0]],
  magic: [[0, 0], [3, -5], [7, -9], [2, -3]],
  attack: [[0, 0], [5, 0], [10, 0], [3, 0]],
  technique: [[0, 0], [3, -5], [7, -9], [2, -3]],
  guard: [[0, 0], [-2, 1], [-2, 1], [0, 0]],
  hit: [[0, 0], [-7, 0], [-11, 1], [-3, 0]],
  win: [[0, 0], [0, -4], [0, -7], [0, -3]],
  lose: [[0, 0], [0, 1], [0, 0], [0, 1]],
  victory: [[0, 0], [0, -4], [0, -7], [0, -3]],
  exhausted: [[0, 0], [0, 1], [0, 0], [0, 1]],
};

function collectionPath(familiar, ...parts) {
  return path.join(publicRoot, familiar.spriteBase.replace(/^\//, ""), ...parts);
}

async function extractStripFrames(sourcePath) {
  const metadata = await sharp(sourcePath).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (!width || !height) throw new Error(`Sprite senza dimensioni: ${sourcePath}`);
  const cellWidth = Math.floor(width / framesPerStrip);
  return Promise.all(Array.from({ length: framesPerStrip }, (_, index) => sharp(sourcePath)
    .extract({ left: index * cellWidth, top: 0, width: cellWidth, height })
    .ensureAlpha()
    .png()
    .toBuffer()));
}

async function hardAlpha(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let index = 0; index < info.width * info.height; index += 1) {
    data[index * 4 + 3] = data[index * 4 + 3] >= 96 ? 255 : 0;
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

async function visibleBounds(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width; let minY = info.height; let maxX = -1; let maxY = -1;
  for (let y = 0; y < info.height; y += 1) for (let x = 0; x < info.width; x += 1) {
    if (data[(y * info.width + x) * 4 + 3] < 16) continue;
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  if (maxX < minX || maxY < minY) return { left: 0, top: 0, width: 1, height: 1 };
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

async function morphGrowthFrame(source, stage, action, offset = [0, 0]) {
  const cleaned = await hardAlpha(source);
  const bounds = await visibleBounds(cleaned);
  const body = await sharp(cleaned).extract(bounds).png().toBuffer();
  const shape = stageShape[stage];
  const split = Math.max(1, Math.min(bounds.height - 1, Math.round(bounds.height * .52)));
  const upperSource = await sharp(body).extract({ left: 0, top: 0, width: bounds.width, height: split }).png().toBuffer();
  const lowerSource = await sharp(body).extract({ left: 0, top: split, width: bounds.width, height: bounds.height - split }).png().toBuffer();
  const upperWidth = Math.max(1, Math.round(bounds.width * shape.upperX));
  const upperHeight = Math.max(1, Math.round(split * shape.upperY));
  const lowerWidth = Math.max(1, Math.round(bounds.width * shape.lowerX));
  const lowerHeight = Math.max(1, Math.round((bounds.height - split) * shape.lowerY));
  const upper = await sharp(upperSource).resize(upperWidth, upperHeight, { fit: "fill", kernel: "nearest" }).png().toBuffer();
  const lower = await sharp(lowerSource).resize(lowerWidth, lowerHeight, { fit: "fill", kernel: "nearest" }).png().toBuffer();
  const overlap = stage === "adulto" ? 0 : 1;
  let assembledWidth = Math.max(upperWidth, lowerWidth);
  let assembledHeight = upperHeight + lowerHeight - overlap;
  let assembled = await sharp({ create: { width: assembledWidth, height: assembledHeight, channels: 4, background: transparent } })
    .composite([
      { input: upper, left: Math.round((assembledWidth - upperWidth) / 2), top: 0 },
      { input: lower, left: Math.round((assembledWidth - lowerWidth) / 2), top: upperHeight - overlap },
    ])
    .png()
    .toBuffer();
  const maxWidth = 110;
  const maxHeight = action === "sleep" || action === "sleep-calm" || action === "exhausted" ? 88 : 106;
  if (assembledWidth > maxWidth || assembledHeight > maxHeight) {
    const ratio = Math.min(maxWidth / assembledWidth, maxHeight / assembledHeight);
    assembledWidth = Math.max(1, Math.round(assembledWidth * ratio));
    assembledHeight = Math.max(1, Math.round(assembledHeight * ratio));
    assembled = await sharp(assembled).resize(assembledWidth, assembledHeight, { fit: "fill", kernel: "nearest" }).png().toBuffer();
  }
  const sleeping = action === "sleep" || action === "sleep-calm" || action === "exhausted";
  const left = Math.max(1, Math.min(frameSize - assembledWidth - 1, Math.round((frameSize - assembledWidth) / 2 + offset[0])));
  const top = sleeping
    ? Math.max(1, Math.min(frameSize - assembledHeight - 1, Math.round(sleepCenterLine - assembledHeight / 2 + offset[1])))
    : Math.max(1, Math.min(frameSize - assembledHeight - 1, floorLine - assembledHeight + offset[1]));
  return { input: assembled, left, top };
}

async function buildStageStrip(sourcePath, stage, action, offsets = battleOffsets.idle) {
  const frames = await extractStripFrames(sourcePath);
  const prepared = await Promise.all(frames.map((frame, index) => morphGrowthFrame(frame, stage, action, offsets[index] ?? [0, 0])));
  return sharp({ create: { width: frameSize * framesPerStrip, height: frameSize, channels: 4, background: transparent } })
    .composite(prepared.map((frame, index) => ({ ...frame, left: frame.left + index * frameSize })))
    .png({ palette: true, colours: 256 })
    .toBuffer();
}

async function stripAudit(bytes) {
  const hashes = [];
  let edgeAlpha = 0;
  let softAlpha = 0;
  for (let frameIndex = 0; frameIndex < framesPerStrip; frameIndex += 1) {
    const frame = await sharp(bytes).extract({ left: frameIndex * frameSize, top: 0, width: frameSize, height: frameSize }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    hashes.push(createHash("sha256").update(frame.data).digest("hex"));
    for (let y = 0; y < frameSize; y += 1) for (let x = 0; x < frameSize; x += 1) {
      const alpha = frame.data[(y * frameSize + x) * 4 + 3];
      if (alpha > 0 && alpha < 255) softAlpha += 1;
      if ((x === 0 || y === 0 || x === frameSize - 1 || y === frameSize - 1) && alpha > 0) edgeAlpha += 1;
    }
  }
  return { uniqueFrames: new Set(hashes).size, edgeAlpha, softAlpha };
}

async function buildFamiliarAssets(familiar) {
  const entries = [];
  for (const stage of stages) {
    const stageRoot = collectionPath(familiar, "growth", stage);
    const houseRoot = path.join(stageRoot, "house");
    const battleRoot = path.join(stageRoot, "battle");
    await mkdir(houseRoot, { recursive: true });
    await mkdir(battleRoot, { recursive: true });
    for (const action of REQUIRED_COLLECTION_ACTIONS) {
      const source = collectionPath(familiar, "house", `${action}.png`);
      const bytes = await buildStageStrip(source, stage, action);
      const output = path.join(houseRoot, `${action}.png`);
      await writeFile(output, bytes);
      entries.push({ stage, group: "house", action, path: path.relative(root, output).replaceAll("\\", "/"), ...(await stripAudit(bytes)) });
    }
    for (const [action, sourceAction] of Object.entries(battleSources)) {
      const source = collectionPath(familiar, "house", `${sourceAction}.png`);
      const bytes = await buildStageStrip(source, stage, action, battleOffsets[action]);
      const output = path.join(battleRoot, `${action}.png`);
      await writeFile(output, bytes);
      entries.push({ stage, group: "battle", action, path: path.relative(root, output).replaceAll("\\", "/"), ...(await stripAudit(bytes)) });
    }
    const idle = await sharp(path.join(houseRoot, "idle.png")).extract({ left: frameSize, top: 0, width: frameSize, height: frameSize }).webp({ quality: 92, lossless: true }).toBuffer();
    await writeFile(path.join(stageRoot, "preview.webp"), idle);
  }
  return entries;
}

async function prepareGeneratedAdventureArt() {
  const backgroundFiles = [
    ["bosco-crepuscolo-v1.png", "bosco-crepuscolo-v1.webp"],
    ["giardini-astrali-v1.png", "giardini-astrali-v1.webp"],
    ["cripta-memorie-v1.png", "cripta-memorie-v1.webp"],
    ["valle-fossile-v1.png", "valle-fossile-v1.webp"],
  ];
  for (const [source, output] of backgroundFiles) {
    await sharp(path.join(adventureRoot, source))
      .resize(1280, 720, { fit: "contain", position: "centre", background: { r: 14, g: 9, b: 25 } })
      .webp({ quality: 88 })
      .toFile(path.join(adventureRoot, output));
  }
  await sharp(path.join(adventureRoot, "bosco-crepuscolo-v1.png"))
    .resize(44, 44, { fit: "contain", position: "centre", background: transparent })
    .png()
    .toFile(path.join(adventureRoot, "nav-sentieri-v1.png"));
  const enemySources = {
    "twilight-woods": "rovo-errante-v1.png",
    "astral-gardens": "custode-astrale-v1.png",
    "memory-crypt": "archivista-vuoto-v1.png",
    "fossil-valley": "colosso-ambra-v1.png",
  };
  const enemyRoot = path.join(adventureRoot, "enemies");
  await mkdir(enemyRoot, { recursive: true });
  for (const dungeon of FAMILIAR_DUNGEONS) {
    const input = await hardAlpha(await readFile(path.join(adventureRoot, enemySources[dungeon.id])));
    const bounds = await visibleBounds(input);
    const trimmed = await sharp(input).extract(bounds).png().toBuffer();
    const sprite = await sharp(trimmed).resize(112, 108, { fit: "contain", position: "south", kernel: "nearest", background: transparent }).png().toBuffer();
    const frames = [0, -2, -4, -2].map((lift, index) => ({ input: sprite, left: index * frameSize + 8, top: 12 + lift }));
    const strip = await sharp({ create: { width: frameSize * framesPerStrip, height: frameSize, channels: 4, background: transparent } })
      .composite(frames)
      .png({ palette: true, colours: 256 })
      .toBuffer();
    await writeFile(path.join(enemyRoot, `${dungeon.id}-idle.png`), strip);
    await sharp(sprite).webp({ quality: 92, lossless: true }).toFile(path.join(adventureRoot, path.basename(dungeon.enemySpriteSrc)));
  }
}

await mkdir(artifactRoot, { recursive: true });
await prepareGeneratedAdventureArt();
const manifest = [];
for (const familiar of FAMILIAR_COLLECTION) {
  manifest.push({
    id: familiar.id,
    name: familiar.name,
    category: familiar.category,
    assets: await buildFamiliarAssets(familiar),
  });
}
const invalid = manifest.flatMap((familiar) => familiar.assets
  .filter((asset) => asset.edgeAlpha !== 0 || asset.softAlpha !== 0 || asset.uniqueFrames < 1)
  .map((asset) => `${familiar.id}:${asset.stage}:${asset.group}:${asset.action}`));
await writeFile(path.join(artifactRoot, "familiar-growth-combat-manifest.json"), JSON.stringify({
  generatedAt: new Date().toISOString(),
  familiars: manifest,
  totals: {
    familiars: manifest.length,
    stages: stages.length,
    houseSequences: manifest.length * stages.length * REQUIRED_COLLECTION_ACTIONS.length,
    battleSequences: manifest.length * stages.length * Object.keys(battleSources).length,
    invalid,
  },
}, null, 2));

console.log(JSON.stringify({
  familiars: manifest.length,
  stages: stages.length,
  houseSequences: manifest.length * stages.length * REQUIRED_COLLECTION_ACTIONS.length,
  battleSequences: manifest.length * stages.length * Object.keys(battleSources).length,
  invalid,
}));
