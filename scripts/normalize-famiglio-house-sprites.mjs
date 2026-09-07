import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { FAMILIAR_COLLECTION, REQUIRED_COLLECTION_ACTIONS } from "../lib/famiglioMarketExpansion.ts";
import { FAMILIAR_HOUSE_VISUALS } from "../lib/famiglioHouseVisuals.ts";

const root = process.cwd();
const publicRoot = path.join(root, "public");
const artifactRoot = path.join(root, "artifacts", "famiglio-rebuild-qa");
const frameSize = 128;
const outputFrames = 4;
const floorLine = 116;
const sleepCenterLine = 72;
const growthStageScales = {
  cucciolo: .76,
  giovane: .88,
  adulto: 1,
};
const interactionBodyFrameOrder = {
  feed: [0, 3, 0, 3],
  play: [0, 2, 0, 2],
};
const interactionBodyFrameOrderOverrides = {
  "fiddle-dog:feed": [0, 1, 2, 3],
  "great-dane:feed": [0, 1, 0, 1],
  "beholder:feed": [0, 2, 0, 2],
  "golden:play": [0, 1, 0, 1],
  "great-dane:play": [1, 2, 1, 2],
  "schnauzer:play": [1, 2, 1, 2],
  "saint-bernard:play": [1, 2, 1, 2],
  "husky:play": [2, 3, 2, 3],
  "rabbit:play": [1, 3, 1, 3],
  "horse:play": [0, 3, 0, 3],
  "wolf:play": [0, 1, 0, 1],
  "demon-rabbit:play": [0, 1, 0, 1],
  "faerie-dragon:play": [1, 2, 1, 2],
  "blue-wyrmling:play": [1, 3, 1, 3],
  "guardian-rabbit:play": [0, 1, 0, 1],
  "nexus-bat:play": [1, 2, 1, 2],
  "adult-red-dragon:play": [1, 2, 1, 2],
  "ancient-black-dragon:play": [0, 2, 0, 2],
  "displacer-beast:play": [1, 3, 1, 3],
  "ice-golem:play": [0, 1, 0, 1],
  "hellhound:play": [0, 1, 0, 1],
  "imp:play": [0, 3, 0, 3],
  "bulette:play": [0, 1, 0, 1],
  "brachiosaurus:play": [0, 1, 0, 1],
  "pteranodon:play": [0, 1, 0, 1],
  "young-green-dragon:feed": [0, 2, 0, 2],
  "frost-salamander:feed": [0, 2, 0, 2],
  "triceratops:feed": [0, 1, 0, 1],
  "velociraptor:feed": [0, 2, 0, 2],
  "stegosaurus:feed": [0, 1, 0, 1],
};
const interactionBodyFallbackKeys = new Set([
  "great-dane:feed", "fox:feed", "fox:play", "turtle:play", "panda:feed", "polar-bear:feed", "polar-bear:play", "brown-bear:feed", "brown-bear:play", "wolf:feed",
  "fairy-rabbit:play", "faerie-dragon:feed", "blue-wyrmling:feed", "young-green-dragon:play", "owlbear:feed", "owlbear:play", "griffin:feed", "griffin:play",
  "elder-snail:play", "guardian-rabbit:feed", "slime:feed", "slime:play", "kappa:feed", "nexus-bat:feed",
  "frost-salamander:play", "adult-red-dragon:feed", "adult-red-dragon:play", "displacer-beast:feed", "ice-golem:feed", "hellhound:feed", "imp:feed",
  "beholder:feed", "beholder:play", "bulette:feed", "purple-worm:feed", "purple-worm:play", "brachiosaurus:feed",
  "triceratops:feed", "ankylosaurus:feed", "spinosaurus:feed", "dilophosaurus:feed", "carnotaurus:feed", "pachycephalosaurus:feed", "pachycephalosaurus:play",
]);
const starterDerivedMagicalIds = new Set(["fairy-rabbit", "demon-rabbit"]);
const generatedFullActionIds = new Set([
  "cat", "golden", "akita", "great-dane", "schnauzer", "saint-bernard", "husky", "rabbit", "fox", "turtle",
  "horse", "polar-bear", "brown-bear", "parrot", "bird", "chicken", "wolf", "fairy-rabbit", "demon-rabbit",
]);
const generatedAssetRoot = path.join(root, "famigli-del-nexus", "source-assets", "generated-actions");
const generatedFantasyActionRows = { walk: 0, feed: 1, play: 2, clean: 3, care: 4, sleep: 5, "sleep-calm": 5 };
const generatedDinosaurActionRows = { walk: 0, feed: 1, play: 2, clean: 3, care: 4, sit: 5, groom: 6, sleep: 7, "sleep-calm": 7 };
const actionLabels = {
  idle: "FERMO",
  walk: "CAMMINA",
  feed: "MANGIA",
  play: "GIOCA",
  clean: "PULIZIA",
  care: "COCCOLE",
  sit: "SEDUTO",
  groom: "CURA",
  sleep: "DORME",
  "sleep-calm": "RIPOSO",
};
const contactCellWidth = 136;
const contactHeaderHeight = 52;
const contactRowHeight = 180;
const contactWidth = REQUIRED_COLLECTION_ACTIONS.length * contactCellWidth;
const interactionContactWidth = 8 * contactCellWidth;

const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const requestedIds = new Set((process.env.FAMIGLIO_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean));
const selectedFamiliars = requestedIds.size
  ? FAMILIAR_COLLECTION.filter((familiar) => requestedIds.has(familiar.id))
  : FAMILIAR_COLLECTION;

async function sourceFrames(sourcePath, cellGeometry = null, rowIndex = 0, frameOrder = null) {
  const metadata = await sharp(sourcePath).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (!width || !height) throw new Error(`Dimensioni mancanti: ${sourcePath}`);
  const atlas = Boolean(cellGeometry) || width <= height * 1.5;
  const columns = cellGeometry ? Math.max(1, Math.floor(width / cellGeometry.width)) : atlas ? 4 : Math.max(1, Math.round(width / height));
  const rows = cellGeometry ? Math.max(1, Math.floor(height / cellGeometry.height)) : atlas ? 4 : 1;
  const cellWidth = cellGeometry?.width ?? Math.floor(width / columns);
  const cellHeight = cellGeometry?.height ?? Math.floor(height / rows);
  const sourceRow = Math.min(rows - 1, Math.max(0, rowIndex));
  const available = columns;
  const indexes = frameOrder ?? Array.from({ length: outputFrames }, (_, index) => Math.min(available - 1, Math.round(index * (available - 1) / (outputFrames - 1))));
  return Promise.all(indexes.map((index) => sharp(sourcePath)
    .extract({ left: index * cellWidth, top: sourceRow * cellHeight, width: cellWidth, height: cellHeight })
    .png()
    .toBuffer()));
}

async function generatedAtlasFrames(sourcePath, columns, rows, rowIndex, frameOrder = null) {
  const metadata = await sharp(sourcePath).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (!width || !height) throw new Error(`Dimensioni mancanti: ${sourcePath}`);
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  const padY = Math.round(cellHeight * .3);
  const indexes = frameOrder ?? Array.from({ length: outputFrames }, (_, index) => index);
  return Promise.all(indexes.map((columnIndex) => {
    const left = Math.max(0, Math.floor(columnIndex * cellWidth));
    const right = Math.min(width, Math.ceil((columnIndex + 1) * cellWidth));
    const top = Math.max(0, Math.floor(rowIndex * cellHeight) - padY);
    const bottom = Math.min(height, Math.ceil((rowIndex + 1) * cellHeight) + padY);
    return sharp(sourcePath)
      .extract({ left, top, width: right - left, height: bottom - top })
      .png()
      .toBuffer();
  }));
}

async function clearGeneratedBackdrop(frame) {
  const metadata = await sharp(frame).metadata();
  const { data, info } = await sharp(frame).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const backdrop = new Uint8Array(info.width * info.height);
  const queue = [];
  const isNeutralBackdrop = (pixel) => {
    const offset = pixel * 4;
    const maximum = Math.max(data[offset], data[offset + 1], data[offset + 2]);
    const minimum = Math.min(data[offset], data[offset + 1], data[offset + 2]);
    return maximum - minimum <= 40 && minimum >= 90;
  };
  const seed = (x, y) => {
    const pixel = y * info.width + x;
    if (backdrop[pixel] || !isNeutralBackdrop(pixel)) return;
    backdrop[pixel] = 1;
    queue.push(pixel);
  };
  if (!metadata.hasAlpha) {
    for (let x = 0; x < info.width; x += 1) {
      seed(x, 0);
      seed(x, info.height - 1);
    }
    for (let y = 0; y < info.height; y += 1) {
      seed(0, y);
      seed(info.width - 1, y);
    }
    let cursor = 0;
    while (cursor < queue.length) {
      const pixel = queue[cursor++];
      const x = pixel % info.width;
      const y = Math.floor(pixel / info.width);
      if (x > 0) seed(x - 1, y);
      if (x + 1 < info.width) seed(x + 1, y);
      if (y > 0) seed(x, y - 1);
      if (y + 1 < info.height) seed(x, y + 1);
      if (x > 0 && y > 0) seed(x - 1, y - 1);
      if (x + 1 < info.width && y > 0) seed(x + 1, y - 1);
      if (x > 0 && y + 1 < info.height) seed(x - 1, y + 1);
      if (x + 1 < info.width && y + 1 < info.height) seed(x + 1, y + 1);
    }
  }
  for (let index = 0; index < info.width * info.height; index += 1) {
    const offset = index * 4;
    if (metadata.hasAlpha) {
      data[offset + 3] = data[offset + 3] < 96 ? 0 : 255;
      continue;
    }
    data[offset + 3] = backdrop[index] ? 0 : 255;
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

async function alphaComponents(sourcePath, threshold = 48) {
  const { data, info } = await sharp(sourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const seen = new Uint8Array(info.width * info.height);
  const components = [];
  for (let y = 0; y < info.height; y += 1) for (let x = 0; x < info.width; x += 1) {
    const seed = y * info.width + x;
    if (seen[seed] || data[seed * 4 + 3] < threshold) continue;
    const queue = [seed];
    let cursor = 0;
    let area = 0;
    let minX = x; let maxX = x; let minY = y; let maxY = y;
    seen[seed] = 1;
    while (cursor < queue.length) {
      const current = queue[cursor++];
      const currentX = current % info.width;
      const currentY = Math.floor(current / info.width);
      area += 1;
      minX = Math.min(minX, currentX); maxX = Math.max(maxX, currentX);
      minY = Math.min(minY, currentY); maxY = Math.max(maxY, currentY);
      const neighbors = [
        current - 1,
        current + 1,
        current - info.width,
        current + info.width,
        current - info.width - 1,
        current - info.width + 1,
        current + info.width - 1,
        current + info.width + 1,
      ];
      for (const neighbor of neighbors) {
        if (neighbor < 0 || neighbor >= seen.length || seen[neighbor] || data[neighbor * 4 + 3] < threshold) continue;
        if ((neighbor === current - 1 && currentX === 0) || (neighbor === current + 1 && currentX === info.width - 1)) continue;
        if ((neighbor === current - info.width - 1 || neighbor === current + info.width - 1) && currentX === 0) continue;
        if ((neighbor === current - info.width + 1 || neighbor === current + info.width + 1) && currentX === info.width - 1) continue;
        seen[neighbor] = 1;
        queue.push(neighbor);
      }
    }
    components.push({ area, minX, maxX, minY, maxY, centerX: (minX + maxX) / 2, pixels: queue });
  }
  return { width: info.width, height: info.height, data, components };
}

async function isolatePrimaryComponent(frame, preference = "largest", threshold = 24) {
  const analysis = await alphaComponents(frame, threshold);
  const body = [...analysis.components].sort((left, right) => preference === "leftmost"
    ? left.centerX - right.centerX || right.area - left.area
    : right.area - left.area)[0];
  if (!body) return frame;
  const minX = Math.max(0, body.minX - 2);
  const maxX = Math.min(analysis.width - 1, body.maxX + 2);
  const minY = Math.max(0, body.minY - 2);
  const maxY = Math.min(analysis.height - 1, body.maxY + 2);
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const isolated = Buffer.alloc(width * height * 4);
  for (const pixel of body.pixels) {
    const sourceX = pixel % analysis.width;
    const sourceY = Math.floor(pixel / analysis.width);
    const target = ((sourceY - minY) * width + (sourceX - minX)) * 4;
    const source = pixel * 4;
    isolated[target] = analysis.data[source];
    isolated[target + 1] = analysis.data[source + 1];
    isolated[target + 2] = analysis.data[source + 2];
    isolated[target + 3] = analysis.data[source + 3];
  }
  return sharp(isolated, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

async function eraseTopArtifact(frame, ratio) {
  const { data, info } = await sharp(frame).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const limit = Math.floor(info.height * ratio);
  for (let y = 0; y < limit; y += 1) for (let x = 0; x < info.width; x += 1) {
    data[(y * info.width + x) * 4 + 3] = 0;
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

async function interactionBodyFrames(frames, action, familiarId) {
  const frameOrder = interactionBodyFrameOrderOverrides[`${familiarId}:${action}`] ?? interactionBodyFrameOrder[action];
  if (!frameOrder) return frames;
  return Promise.all(frameOrder.map((frameIndex) => isolatePrimaryComponent(frames[frameIndex], "largest", 16)));
}

async function removeTinyComponents(frame, minimumArea = 24) {
  const analysis = await alphaComponents(frame, 1);
  const output = Buffer.alloc(analysis.width * analysis.height * 4);
  for (const component of analysis.components) {
    if (component.area < minimumArea) continue;
    for (const pixel of component.pixels) {
      const offset = pixel * 4;
      output[offset] = analysis.data[offset];
      output[offset + 1] = analysis.data[offset + 1];
      output[offset + 2] = analysis.data[offset + 2];
      output[offset + 3] = 255;
    }
  }
  return sharp(output, { raw: { width: analysis.width, height: analysis.height, channels: 4 } }).png().toBuffer();
}

async function opaquePixelCount(frame) {
  const { data, info } = await sharp(frame).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let pixels = 0;
  for (let index = 0; index < info.width * info.height; index += 1) {
    if (data[index * 4 + 3] >= 16) pixels += 1;
  }
  return pixels;
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)] ?? 1;
}

async function cleanAndTrimFrames(frames) {
  const cleaned = await Promise.all(frames.map((frame) => removeTinyComponents(frame)));
  return Promise.all(cleaned.map((frame) => sharp(frame).trim({ background: transparent, threshold: 8 }).png().toBuffer()));
}

async function referenceOpaquePixels(frames) {
  const trimmed = await cleanAndTrimFrames(frames);
  const metadata = await Promise.all(trimmed.map((frame) => sharp(frame).metadata()));
  const maxWidth = Math.max(...metadata.map((entry) => entry.width ?? 1));
  const maxHeight = Math.max(...metadata.map((entry) => entry.height ?? 1));
  const scale = Math.min(108 / maxWidth, 104 / maxHeight);
  const pixels = [];
  for (let index = 0; index < trimmed.length; index += 1) {
    const width = Math.max(1, Math.round((metadata[index].width ?? 1) * scale));
    const height = Math.max(1, Math.round((metadata[index].height ?? 1) * scale));
    const resized = await sharp(trimmed[index]).resize(width, height, { fit: "fill", kernel: "nearest" }).png().toBuffer();
    pixels.push(await opaquePixelCount(resized));
  }
  return median(pixels);
}

async function buildStrip(frames, action, targetOpaquePixels) {
  const trimmed = await cleanAndTrimFrames(frames);
  const metadata = await Promise.all(trimmed.map((frame) => sharp(frame).metadata()));
  const isSleep = action === "sleep" || action === "sleep-calm";
  const maxWidth = 108;
  const maxHeight = isSleep ? 88 : 104;
  const maximumPixels = [];
  for (let index = 0; index < trimmed.length; index += 1) {
    const sourceWidth = metadata[index].width ?? 1;
    const sourceHeight = metadata[index].height ?? 1;
    const maximumScale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
    const maximum = await sharp(trimmed[index])
      .resize(Math.max(1, Math.round(sourceWidth * maximumScale)), Math.max(1, Math.round(sourceHeight * maximumScale)), { fit: "fill", kernel: "nearest" })
      .png()
      .toBuffer();
    maximumPixels.push(await opaquePixelCount(maximum));
  }
  const effectiveTargetPixels = Math.min(targetOpaquePixels, ...maximumPixels);
  const prepared = await Promise.all(trimmed.map(async (frame, index) => {
    const sourceWidth = metadata[index].width ?? 1;
    const sourceHeight = metadata[index].height ?? 1;
    const currentPixels = Math.max(1, await opaquePixelCount(frame));
    const maximumScale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
    let scale = Math.min(Math.sqrt(effectiveTargetPixels / currentPixels), maximumScale);
    let requestedWidth = 1;
    let requestedHeight = 1;
    let resized = frame;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      requestedWidth = Math.max(1, Math.round(sourceWidth * scale));
      requestedHeight = Math.max(1, Math.round(sourceHeight * scale));
      resized = await sharp(frame).resize(requestedWidth, requestedHeight, { fit: "fill", kernel: "nearest" }).png().toBuffer();
      const actualPixels = Math.max(1, await opaquePixelCount(resized));
      if (Math.abs(actualPixels - effectiveTargetPixels) / effectiveTargetPixels <= .025) break;
      scale = Math.min(maximumScale, scale * Math.sqrt(effectiveTargetPixels / actualPixels));
    }
    const cleaned = await removeTinyComponents(resized);
    const input = await sharp(cleaned).trim({ background: transparent, threshold: 8 }).png().toBuffer();
    const finalMetadata = await sharp(input).metadata();
    const width = finalMetadata.width ?? requestedWidth;
    const height = finalMetadata.height ?? requestedHeight;
    const top = isSleep
      ? Math.round(sleepCenterLine - height / 2)
      : floorLine - height;
    return { input, left: Math.round((frameSize - width) / 2), top };
  }));
  return sharp({ create: { width: frameSize * outputFrames, height: frameSize, channels: 4, background: transparent } })
    .composite(prepared.map((frame, index) => ({ ...frame, left: frame.left + index * frameSize })))
    .png({ palette: true, colours: 256 })
    .toBuffer();
}

async function buildGrowthStrip(baseStrip, action, scale) {
  if (scale === 1) return baseStrip;
  const isSleep = action === "sleep" || action === "sleep-calm";
  const prepared = [];
  for (let index = 0; index < outputFrames; index += 1) {
    const cell = await sharp(baseStrip)
      .extract({ left: index * frameSize, top: 0, width: frameSize, height: frameSize })
      .png()
      .toBuffer();
    const source = await sharp(cell).trim({ background: transparent, threshold: 8 }).png().toBuffer();
    const metadata = await sharp(source).metadata();
    const requestedWidth = Math.max(1, Math.round((metadata.width ?? 1) * scale));
    const requestedHeight = Math.max(1, Math.round((metadata.height ?? 1) * scale));
    const resized = await sharp(source).resize(requestedWidth, requestedHeight, { fit: "fill", kernel: "nearest" }).png().toBuffer();
    const cleaned = await removeTinyComponents(resized, 12);
    const input = await sharp(cleaned).trim({ background: transparent, threshold: 8 }).png().toBuffer();
    const finalMetadata = await sharp(input).metadata();
    const width = finalMetadata.width ?? requestedWidth;
    const height = finalMetadata.height ?? requestedHeight;
    prepared.push({
      input,
      left: index * frameSize + Math.round((frameSize - width) / 2),
      top: isSleep ? Math.round(sleepCenterLine - height / 2) : floorLine - height,
    });
  }
  return sharp({ create: { width: frameSize * outputFrames, height: frameSize, channels: 4, background: transparent } })
    .composite(prepared)
    .png({ palette: true, colours: 256 })
    .toBuffer();
}

async function generatedFrames(familiar, action) {
  const splitAtlasRow = action === "walk" ? ["a", 0]
    : action === "feed" ? ["a", 1]
      : action === "play" ? ["a", 2]
        : action === "clean" ? ["a", 3]
          : action === "care" ? ["b", 0]
            : action === "sit" ? ["b", 1]
              : action === "groom" ? ["b", 2]
                : ["b", 3];
  if (familiar.id === "pteranodon" || familiar.id === "brachiosaurus") {
    const [sheet, row] = splitAtlasRow;
    const sourcePath = path.join(generatedAssetRoot, `${familiar.id}-actions-${sheet}-v1.png`);
    const frames = await generatedAtlasFrames(sourcePath, 4, 4, row, action === "sleep-calm" ? [0, 2, 1, 3] : null);
    return Promise.all(frames.map(async (frame) => {
      const cleared = await clearGeneratedBackdrop(frame);
      return action === "feed" || action === "play"
        ? cleared
        : isolatePrimaryComponent(cleared, "largest", 16);
    }));
  }
  const usesFullAtlas = familiar.category === "dinosaur" || generatedFullActionIds.has(familiar.id);
  const row = usesFullAtlas ? generatedDinosaurActionRows[action] : generatedFantasyActionRows[action];
  const sourcePath = !usesFullAtlas && (action === "sit" || action === "groom")
    ? path.join(generatedAssetRoot, `${familiar.id}-sit-groom-v1.png`)
    : path.join(generatedAssetRoot, familiar.id === "panda" ? "panda-actions-v2.png" : `${familiar.id}-actions-v1.png`);
  const rows = !usesFullAtlas && (action === "sit" || action === "groom") ? 2 : usesFullAtlas ? 8 : 6;
  const frames = await generatedAtlasFrames(sourcePath, 4, rows, !usesFullAtlas && action === "sit" ? 0 : !usesFullAtlas && action === "groom" ? 1 : row, action === "sleep-calm" ? [0, 2, 1, 3] : null);
  return Promise.all(frames.map(async (frame) => {
    const cleared = await clearGeneratedBackdrop(frame);
    const isolated = action === "feed" || action === "play"
      ? cleared
      : isolatePrimaryComponent(cleared, "largest", 16);
    return familiar.id === "pachycephalosaurus" && (action === "sleep" || action === "sleep-calm")
      ? eraseTopArtifact(await isolated, .22)
      : isolated;
  }));
}

async function generatedIdleFrames(familiar) {
  const careFrames = await generatedFrames(familiar, "care");
  return [careFrames[0], careFrames[1], careFrames[0], careFrames[1]];
}

async function stripFrameAudit(bytes) {
  const bottoms = [];
  const centers = [];
  const widths = [];
  const heights = [];
  const opaquePixels = [];
  const componentCounts = [];
  const significantComponentCounts = [];
  const smallestComponents = [];
  const frameHashes = [];
  for (let index = 0; index < outputFrames; index += 1) {
    const frameBytes = await sharp(bytes).extract({ left: index * frameSize, top: 0, width: frameSize, height: frameSize }).png().toBuffer();
    const frame = await sharp(frameBytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let bottom = -1;
    let top = frame.info.height;
    let left = frame.info.width;
    let right = -1;
    let pixels = 0;
    for (let y = 0; y < frame.info.height; y += 1) for (let x = 0; x < frame.info.width; x += 1) {
      if (frame.data[(y * frame.info.width + x) * 4 + 3] > 16) {
        pixels += 1;
        bottom = Math.max(bottom, y);
        top = Math.min(top, y);
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
    }
    bottoms.push(bottom);
    centers.push((top + bottom) / 2);
    widths.push(right - left + 1);
    heights.push(bottom - top + 1);
    opaquePixels.push(pixels);
    const components = (await alphaComponents(frameBytes, 16)).components;
    componentCounts.push(components.length);
    significantComponentCounts.push(components.filter((component) => component.area >= Math.max(24, Math.round(pixels * .03))).length);
    smallestComponents.push(Math.min(...components.map((component) => component.area)));
    frameHashes.push(createHash("sha256").update(frame.data).digest("hex"));
  }
  const linearMass = opaquePixels.map((pixels) => Math.sqrt(pixels));
  const spans = widths.map((width, index) => Math.sqrt(width * heights[index]));
  return {
    bottoms,
    centers,
    widths,
    heights,
    opaquePixels,
    componentCounts,
    significantComponentCounts,
    smallestComponents,
    visualMassRatio: Math.max(...linearMass) / Math.min(...linearMass),
    visualSpanRatio: Math.max(...spans) / Math.min(...spans),
    uniqueFrames: new Set(frameHashes).size,
  };
}

async function edgeAlphaCount(bytes) {
  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let count = 0;
  for (let x = 0; x < info.width; x += 1) {
    if (data[x * 4 + 3]) count += 1;
    if (data[((info.height - 1) * info.width + x) * 4 + 3]) count += 1;
  }
  for (let y = 0; y < info.height; y += 1) {
    if (data[(y * info.width) * 4 + 3]) count += 1;
    if (data[(y * info.width + info.width - 1) * 4 + 3]) count += 1;
  }
  return count;
}

await mkdir(artifactRoot, { recursive: true });
const audit = [];
const categoryRows = new Map();
const interactionCategoryRows = new Map();
const finalInteractionCategoryRows = new Map();

for (const familiar of selectedFamiliars) {
  const outputDirectory = path.join(publicRoot, familiar.spriteBase.replace(/^\//, ""), "house");
  await mkdir(outputDirectory, { recursive: true });
  const fantasyAtlas = (familiar.category === "magical" && !starterDerivedMagicalIds.has(familiar.id)) || familiar.category === "legendary";
  const generatedAtlas = fantasyAtlas || familiar.category === "dinosaur" || generatedFullActionIds.has(familiar.id);
  const actionAudit = [];
  const growthActionAudit = Object.fromEntries(Object.keys(growthStageScales).map((stage) => [stage, []]));
  const previews = [];
  const interactionPreviews = [];
  const finalInteractionPreviews = [];
  const loadActionFrames = async (targetAction) => {
    if (familiar.id === "fiddle-dog" && (targetAction === "idle" || targetAction === "walk")) {
      const source = path.join(generatedAssetRoot, "fiddle-dog-motion-v3.png");
      const metadata = await sharp(source).metadata();
      return Promise.all((await sourceFrames(source, { width: Math.floor(metadata.width / 4), height: Math.floor(metadata.height / 2) }, targetAction === "idle" ? 0 : 1))
        .map(frame => clearGeneratedBackdrop(frame)));
    }
    if (familiar.id === "fiddle-dog" && targetAction === "feed") {
      return generatedAtlasFrames(path.join(generatedAssetRoot, "fiddle-dog-feed-v2.png"), 4, 1, 0);
    }
    const targetSourcePath = path.join(publicRoot, familiar.spriteBase.replace(/^\//, ""), `${targetAction}.png`);
    if (generatedAtlas) {
      return targetAction === "idle"
        ? generatedIdleFrames(familiar)
        : generatedFrames(familiar, targetAction);
    }
    return sourceFrames(targetSourcePath, null, 0, targetAction === "sleep-calm" ? [0, 2, 1, 3] : null);
  };
  const visualReferencePixels = await referenceOpaquePixels(await loadActionFrames("idle"));
  for (let actionIndex = 0; actionIndex < REQUIRED_COLLECTION_ACTIONS.length; actionIndex += 1) {
    const action = REQUIRED_COLLECTION_ACTIONS[actionIndex];
    const outputPath = path.join(outputDirectory, `${action}.png`);
    let bytes;
    let frames = await loadActionFrames(action);
    if (familiar.id === "pachycephalosaurus" && (action === "sleep" || action === "sleep-calm")) {
      frames = action === "sleep"
        ? [frames[0], frames[3], frames[0], frames[3]]
        : [frames[3], frames[0], frames[3], frames[0]];
    }
    if (familiar.id === "elder-snail" && action === "feed") {
      frames = [frames[2], frames[3], frames[2], frames[3]];
    }
    if (action === "feed" || action === "play") {
      const candidates = await Promise.all(frames.map((frame) => isolatePrimaryComponent(frame, "largest", 16)));
      const interactionOffset = action === "feed" ? 0 : 4;
      for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex += 1) {
        const candidate = await sharp(candidates[candidateIndex]).resize(112, 112, { fit: "contain", kernel: "nearest", background: transparent }).png().toBuffer();
        interactionPreviews.push({ input: candidate, left: (interactionOffset + candidateIndex) * contactCellWidth + 12, top: contactHeaderHeight + 10 });
      }
      if (interactionBodyFallbackKeys.has(`${familiar.id}:${action}`)) {
        const fallbackFrames = await loadActionFrames(action === "feed" ? "sit" : "care");
        frames = await interactionBodyFrames(fallbackFrames, action, familiar.id);
      } else {
        frames = await interactionBodyFrames(frames, action, familiar.id);
      }
      for (let frameIndex = 0; frameIndex < frames.length; frameIndex += 1) {
        const framePreview = await sharp(frames[frameIndex]).resize(112, 112, { fit: "contain", kernel: "nearest", background: transparent }).png().toBuffer();
        finalInteractionPreviews.push({ input: framePreview, left: (interactionOffset + frameIndex) * contactCellWidth + 12, top: contactHeaderHeight + 10 });
      }
    }
    bytes = await buildStrip(frames, action, visualReferencePixels);
    await writeFile(outputPath, bytes);
    const edgePixels = await edgeAlphaCount(bytes);
    const hash = createHash("sha256").update(bytes).digest("hex");
    const frameAudit = await stripFrameAudit(bytes);
    const floorSpread = Math.max(...frameAudit.bottoms) - Math.min(...frameAudit.bottoms);
    const centerSpread = Math.max(...frameAudit.centers) - Math.min(...frameAudit.centers);
    actionAudit.push({
      action,
      width: frameSize * outputFrames,
      height: frameSize,
      frames: outputFrames,
      edgePixels,
      floorSpread,
      centerSpread,
      widths: frameAudit.widths,
      heights: frameAudit.heights,
      opaquePixels: frameAudit.opaquePixels,
      componentCounts: frameAudit.componentCounts,
      significantComponentCounts: frameAudit.significantComponentCounts,
      smallestComponents: frameAudit.smallestComponents,
      visualMassRatio: frameAudit.visualMassRatio,
      visualSpanRatio: frameAudit.visualSpanRatio,
      uniqueFrames: frameAudit.uniqueFrames,
      hash,
    });
    for (const [stage, scale] of Object.entries(growthStageScales)) {
      const stageDirectory = path.join(publicRoot, familiar.spriteBase.replace(/^\//, ""), "growth", stage, "house");
      await mkdir(stageDirectory, { recursive: true });
      const growthBytes = await buildGrowthStrip(bytes, action, scale);
      await writeFile(path.join(stageDirectory, `${action}.png`), growthBytes);
      const growthFrames = await stripFrameAudit(growthBytes);
      const growthEdgePixels = await edgeAlphaCount(growthBytes);
      growthActionAudit[stage].push({
        action,
        scale,
        edgePixels: growthEdgePixels,
        floorSpread: Math.max(...growthFrames.bottoms) - Math.min(...growthFrames.bottoms),
        centerSpread: Math.max(...growthFrames.centers) - Math.min(...growthFrames.centers),
        widths: growthFrames.widths,
        heights: growthFrames.heights,
        opaquePixels: growthFrames.opaquePixels,
        componentCounts: growthFrames.componentCounts,
        significantComponentCounts: growthFrames.significantComponentCounts,
        smallestComponents: growthFrames.smallestComponents,
        visualMassRatio: growthFrames.visualMassRatio,
        visualSpanRatio: growthFrames.visualSpanRatio,
        uniqueFrames: growthFrames.uniqueFrames,
      });
      if (action === "idle") {
        const preview = await sharp(growthBytes)
          .extract({ left: frameSize, top: 0, width: frameSize, height: frameSize })
          .webp({ quality: 92, lossless: true })
          .toBuffer();
        await writeFile(path.join(publicRoot, familiar.spriteBase.replace(/^\//, ""), "growth", stage, "preview.webp"), preview);
      }
    }
    const sample = await sharp(bytes).extract({ left: frameSize, top: 0, width: frameSize, height: frameSize }).png().toBuffer();
    previews.push({ input: sample, left: actionIndex * contactCellWidth, top: contactHeaderHeight });
  }
  const addMassRatios = (entries) => {
    const idle = entries.find((entry) => entry.action === "idle");
    const idleMass = median(idle.opaquePixels.map((pixels) => Math.sqrt(pixels)));
    for (const entry of entries) {
      entry.massRatioToIdle = median(entry.opaquePixels.map((pixels) => Math.sqrt(pixels))) / idleMass;
    }
  };
  addMassRatios(actionAudit);
  for (const entries of Object.values(growthActionAudit)) addMassRatios(entries);
  const actionValid = (entry) => entry.edgePixels === 0
    && entry.smallestComponents.every((area) => area >= (entry.scale && entry.scale < 1 ? 12 : 24))
    && ((entry.action === "sleep" || entry.action === "sleep-calm") ? entry.centerSpread <= 1 : entry.floorSpread === 0)
    && entry.visualMassRatio <= 1.12
    && entry.visualSpanRatio <= 1.4
    && entry.massRatioToIdle >= .72
    && entry.massRatioToIdle <= 1.28
    && ((entry.action === "feed" || entry.action === "play") ? entry.significantComponentCounts.every((count) => count === 1) : true)
    && (entry.action === "idle" || entry.uniqueFrames >= 2);
  const duplicateGroups = Object.values(Object.groupBy(actionAudit, (entry) => entry.hash)).filter((entries) => entries.length > 1).map((entries) => entries.map((entry) => entry.action));
  audit.push({
    id: familiar.id,
    name: familiar.name,
    category: familiar.category,
    visual: FAMILIAR_HOUSE_VISUALS[familiar.id],
    visualReferencePixels,
    actions: actionAudit,
    growthActions: growthActionAudit,
    duplicateGroups,
    validated: actionAudit.every(actionValid) && Object.values(growthActionAudit).every((entries) => entries.every(actionValid)),
  });
  const actionLegend = REQUIRED_COLLECTION_ACTIONS.map((action, index) => `<text x="${index * contactCellWidth + contactCellWidth / 2}" y="45" text-anchor="middle" font-family="monospace" font-size="10" font-weight="700" fill="#d9c8e8">${actionLabels[action]}</text>`).join("");
  const row = await sharp({ create: { width: contactWidth, height: contactRowHeight, channels: 4, background: { r: 22, g: 13, b: 37, alpha: 1 } } })
    .composite([
      { input: Buffer.from(`<svg width="${contactWidth}" height="${contactHeaderHeight}" xmlns="http://www.w3.org/2000/svg"><text x="12" y="21" font-family="monospace" font-size="15" font-weight="700" fill="#ffe06d">${familiar.name.replaceAll("&", "&amp;")}</text><text x="${contactWidth - 12}" y="21" text-anchor="end" font-family="monospace" font-size="12" fill="#d9c8e8">scala ${FAMILIAR_HOUSE_VISUALS[familiar.id]?.scale ?? .85}</text>${actionLegend}</svg>`), left: 0, top: 0 },
      ...previews,
    ]).png().toBuffer();
  const rows = categoryRows.get(familiar.category) ?? [];
  rows.push(row);
  categoryRows.set(familiar.category, rows);
  const interactionLegend = ["MANGIA 1", "MANGIA 2", "MANGIA 3", "MANGIA 4", "GIOCA 1", "GIOCA 2", "GIOCA 3", "GIOCA 4"]
    .map((label, index) => `<text x="${index * contactCellWidth + contactCellWidth / 2}" y="45" text-anchor="middle" font-family="monospace" font-size="10" font-weight="700" fill="#d9c8e8">${label}</text>`).join("");
  const interactionRow = await sharp({ create: { width: interactionContactWidth, height: contactRowHeight, channels: 4, background: { r: 22, g: 13, b: 37, alpha: 1 } } })
    .composite([
      { input: Buffer.from(`<svg width="${interactionContactWidth}" height="${contactHeaderHeight}" xmlns="http://www.w3.org/2000/svg"><text x="12" y="21" font-family="monospace" font-size="15" font-weight="700" fill="#ffe06d">${familiar.name.replaceAll("&", "&amp;")}</text>${interactionLegend}</svg>`), left: 0, top: 0 },
      ...interactionPreviews,
    ]).png().toBuffer();
  const interactionRows = interactionCategoryRows.get(familiar.category) ?? [];
  interactionRows.push(interactionRow);
  interactionCategoryRows.set(familiar.category, interactionRows);
  const finalInteractionRow = await sharp({ create: { width: interactionContactWidth, height: contactRowHeight, channels: 4, background: { r: 22, g: 13, b: 37, alpha: 1 } } })
    .composite([
      { input: Buffer.from(`<svg width="${interactionContactWidth}" height="${contactHeaderHeight}" xmlns="http://www.w3.org/2000/svg"><text x="12" y="21" font-family="monospace" font-size="15" font-weight="700" fill="#ffe06d">${familiar.name.replaceAll("&", "&amp;")}</text>${interactionLegend}</svg>`), left: 0, top: 0 },
      ...finalInteractionPreviews,
    ]).png().toBuffer();
  const finalInteractionRows = finalInteractionCategoryRows.get(familiar.category) ?? [];
  finalInteractionRows.push(finalInteractionRow);
  finalInteractionCategoryRows.set(familiar.category, finalInteractionRows);
}

const auditSuffix = requestedIds.size ? `-${[...requestedIds].sort().join("-")}` : "";
await writeFile(path.join(artifactRoot, `familiar-house-action-audit${auditSuffix}.json`), JSON.stringify({
  generatedAt: new Date().toISOString(),
  frameSize,
  outputFrames,
  floorLine,
  sleepCenterLine,
  growthStageScales,
  interactionObjectPolicy: "Le sequenze feed/play contengono solo il corpo; Casa disegna una sola ciotola o palla separata e fissa.",
  familiars: audit,
}, null, 2));
for (const [category, rows] of categoryRows) {
  await sharp({ create: { width: contactWidth, height: rows.length * contactRowHeight, channels: 4, background: { r: 14, g: 9, b: 25, alpha: 1 } } })
    .composite(rows.map((input, index) => ({ input, left: 0, top: index * contactRowHeight })))
    .png()
    .toFile(path.join(artifactRoot, `familiar-house-${category}-contact-sheet.png`));
}
for (const [category, rows] of interactionCategoryRows) {
  await sharp({ create: { width: interactionContactWidth, height: rows.length * contactRowHeight, channels: 4, background: { r: 14, g: 9, b: 25, alpha: 1 } } })
    .composite(rows.map((input, index) => ({ input, left: 0, top: index * contactRowHeight })))
    .png()
    .toFile(path.join(artifactRoot, `familiar-interaction-candidates-${category}.png`));
}
for (const [category, rows] of finalInteractionCategoryRows) {
  await sharp({ create: { width: interactionContactWidth, height: rows.length * contactRowHeight, channels: 4, background: { r: 14, g: 9, b: 25, alpha: 1 } } })
    .composite(rows.map((input, index) => ({ input, left: 0, top: index * contactRowHeight })))
    .png()
    .toFile(path.join(artifactRoot, `familiar-interaction-final-${category}.png`));
}

console.log(JSON.stringify({ familiars: audit.length, actions: audit.reduce((total, familiar) => total + familiar.actions.length, 0), invalid: audit.filter((entry) => !entry.validated).map((entry) => entry.id) }));
