import sharp from "sharp";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { FAMILIAR_COLLECTION } from "../lib/famiglioMarketExpansion.ts";

const sourceRoot = "famigli-del-nexus/source-assets/generated-actions/feeding-v3";
const outputRoot = "artifacts/famiglio-meal-review/v3";
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const ids = new Set((process.env.FAMIGLIO_IDS ?? "").split(",").filter(Boolean));
const sources = new Set(await readdir(sourceRoot));
const roster = FAMILIAR_COLLECTION.filter(pet => sources.has(`${pet.id}.png`) && (!ids.size || ids.has(pet.id)));
await mkdir(outputRoot, { recursive: true });
const median = a => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];

async function pixels(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let area = 0;
  let left = info.width, right = -1, top = info.height, bottom = -1;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * 4 + 3] < 128) continue;
    area++; left = Math.min(left, x); right = Math.max(right, x);
    top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  return { area, left, right, top, bottom, width: right - left + 1, height: bottom - top + 1 };
}

async function hardAlpha(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let p = 0; p < info.width * info.height; p++) data[p * 4 + 3] = data[p * 4 + 3] < 128 ? 0 : 255;
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

// Same edge-connected matte cleanup as the existing house asset normalizer.
// This never globally removes white: enclosed white fur/eyes/paws are retained.
async function prepareSource(source, metadata) {
  if (metadata.hasAlpha) return sharp(source).png().toBuffer();
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const seen = new Uint8Array(info.width * info.height);
  const queue = [];
  const visit = (x, y) => {
    if (x < 0 || y < 0 || x >= info.width || y >= info.height) return;
    const p = y * info.width + x, o = p * 4;
    if (seen[p]) return;
    const min = Math.min(data[o], data[o + 1], data[o + 2]);
    const max = Math.max(data[o], data[o + 1], data[o + 2]);
    if (min < 180 || max - min > 30) return;
    seen[p] = 1; queue.push(p);
  };
  for (let x = 0; x < info.width; x++) { visit(x, 0); visit(x, info.height - 1); }
  for (let y = 0; y < info.height; y++) { visit(0, y); visit(info.width - 1, y); }
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i], x = p % info.width, y = Math.floor(p / info.width);
    visit(x - 1, y); visit(x + 1, y); visit(x, y - 1); visit(x, y + 1);
  }
  for (const p of queue) data[p * 4 + 3] = 0;
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

const report = [];
const motionMode = process.argv.includes("--fiddle-motion");
const jobs = motionMode
  ? ["idle", "walk"].map((action, row) => ({ pet: FAMILIAR_COLLECTION.find(p => p.id === "fiddle-dog"), action, row }))
  : roster.map(pet => ({ pet, action: "feed", row: null }));
for (const { pet, action, row } of jobs) {
  const source = motionMode ? "famigli-del-nexus/source-assets/generated-actions/fiddle-dog-motion-v3.png" : `${sourceRoot}/${pet.id}.png`;
  let metadata = await sharp(source).metadata();
  let preparedSource = await prepareSource(source, metadata);
  if (row !== null) {
    const rowHeight = Math.floor(metadata.height / 2);
    preparedSource = await sharp(preparedSource).extract({ left: 0, top: row * rowHeight, width: metadata.width, height: rowHeight }).png().toBuffer();
    metadata = { ...metadata, height: rowHeight };
  }
  const frames = [];
  const sourceBounds = [];
  const raw = await sharp(preparedSource).ensureAlpha().raw().toBuffer();
  const cuts = [0];
  for (let boundary = 1; boundary < 4; boundary++) {
    const nominal = Math.round(metadata.width * boundary / 4);
    const candidates = [];
    for (let x = nominal - Math.floor(metadata.width * .09); x <= nominal + Math.floor(metadata.width * .09); x++) {
      let occupied = false;
      for (let y = 0; y < metadata.height; y++) if (raw[(y * metadata.width + x) * 4 + 3] >= 128) { occupied = true; break; }
      if (!occupied) candidates.push(x);
    }
    if (!candidates.length) throw new Error(`${pet.id}: no transparent separation at cell ${boundary}`);
    // Generated strips can have unequal padding: split only through genuine empty space.
    const empty = new Set(candidates);
    const padded = candidates.filter(x => empty.has(x - 2) && empty.has(x + 2));
    if (!padded.length) throw new Error(`${pet.id}: insufficient cell padding`);
    cuts.push(padded.sort((a, b) => Math.abs(a - nominal) - Math.abs(b - nominal))[0]);
  }
  cuts.push(metadata.width);
  for (let f = 0; f < 4; f++) {
    const left = cuts[f];
    const right = cuts[f + 1];
    const cell = await hardAlpha(await sharp(preparedSource).extract({ left, top: 0, width: right - left, height: metadata.height }).png().toBuffer());
    const bounds = await pixels(cell);
    if (!bounds.area || bounds.left === 0 || bounds.right === right - left - 1 || bounds.top === 0 || bounds.bottom === metadata.height - 1) {
      throw new Error(`${pet.id}/${f}: empty or cut source cell`);
    }
    frames.push(await sharp(cell).extract({ left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height }).png().toBuffer());
    sourceBounds.push(bounds);
  }
  const idle = `public${pet.spriteBase}/growth/adulto/house/idle.png`;
  const idleAreas = [];
  for (let f = 0; f < 4; f++) idleAreas.push((await pixels(await sharp(idle).extract({ left: f * 128, top: 0, width: 128, height: 128 }).png().toBuffer())).area);
  // One scale for the entire action: changing jaw/neck pose never triggers a per-frame resize.
  const scale = Math.min(Math.sqrt(median(idleAreas) / median(sourceBounds.map(b => b.area))),
    ...sourceBounds.map(b => Math.min(108 / b.width, 104 / b.height)));
  const maxWidth = Math.max(...sourceBounds.map(b => b.width));
  const stageReport = [];
  for (const [stage, growth] of Object.entries({ cucciolo: .76, giovane: .88, adulto: 1 })) {
    const layers = [];
    const geometry = [];
    for (let f = 0; f < 4; f++) {
      const b = sourceBounds[f];
      const width = Math.max(1, Math.round(b.width * scale * growth));
      const height = Math.max(1, Math.round(b.height * scale * growth));
      const resized = await hardAlpha(await sharp(frames[f]).resize(width, height, { kernel: "nearest", fit: "fill" }).png().toBuffer());
      // Fixed left-body anchor rather than re-centering the silhouette when the head extends.
      const left = Math.round((128 - maxWidth * scale * growth) / 2);
      const top = 116 - height;
      layers.push({ input: resized, left: f * 128 + left, top });
      geometry.push({ ...await pixels(resized), left, top, width, height, floor: top + height - 1, scale: scale * growth,
        hash: createHash("sha256").update(resized).digest("hex") });
    }
    const output = `public${pet.spriteBase}/growth/${stage}/house/${action}-v3.png`;
    await sharp({ create: { width: 512, height: 128, channels: 4, background: transparent } }).composite(layers).png().toFile(output);
    stageReport.push({ stage, output, frames: geometry });
  }
  const strip = `public${pet.spriteBase}/growth/adulto/house/${action}-v3.png`;
  await sharp({ create: { width: 640, height: 152, channels: 4, background: "#382745" } }).composite([
    { input: Buffer.from(`<svg width="640" height="24"><text x="8" y="18" fill="white" font-size="15">${pet.id}: idle | reach / bite / chew / swallow</text></svg>`), left: 0, top: 0 },
    { input: await sharp(idle).extract({ left: 0, top: 0, width: 128, height: 128 }).png().toBuffer(), left: 0, top: 24 },
    { input: strip, left: 128, top: 24 },
  ]).png().toFile(`${outputRoot}/${pet.id}${motionMode ? "-" + action : ""}.png`);
  report.push({ id: pet.id, action, source, sourceBounds, uniformScale: scale, stages: stageReport });
}
await writeFile(`${outputRoot}/geometry${motionMode ? "-motion" : ids.size ? "-" + [...ids].join("-") : ""}.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ prepared: report.length, ids: report.map(p => p.id) }));
