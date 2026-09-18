import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const COLLECTION_ROOT = path.join("public", "famiglio", "rebuild", "collection");
const MASTER_ROOT = path.join("public", "famiglio", "rebuild", "combat", "generated-masters");
const STAGES = ["cucciolo", "giovane", "adulto"];
const POSES = ["idle", "entrance", "run", "attack", "physical", "magic", "technique", "heal", "guard", "hit", "jump", "victory", "exhausted"];
const SOURCE_POSE = { heal: "technique", jump: "victory" };
const FRAME_COUNT = 16;
const FRAME_SIZE = 160;
const force = process.argv.includes("--force");
const requestedId = process.argv.find((entry) => entry.startsWith("--id="))?.slice(5);

function motion(pose, frame) {
  const cycle = (Math.PI * 2 * frame) / FRAME_COUNT;
  const pulse = Math.sin(cycle);
  const beat = Math.sin(cycle * 2);
  if (pose === "idle") return { x: 0, y: Math.round(-2 * pulse), sx: 1 + .012 * pulse, sy: 1 - .018 * pulse, r: .5 * pulse };
  if (pose === "entrance") return { x: Math.round(-18 * (1 - frame / (FRAME_COUNT - 1))), y: Math.round(-4 * Math.sin(Math.PI * frame / (FRAME_COUNT - 1))), sx: 1, sy: 1, r: -2 * (1 - frame / (FRAME_COUNT - 1)) };
  if (pose === "run") return { x: Math.round(3 * beat), y: Math.round(-7 * Math.abs(pulse)), sx: 1 + .035 * Math.abs(pulse), sy: 1 - .045 * Math.abs(pulse), r: 2.4 * pulse };
  if (pose === "attack" || pose === "physical") {
    const strike = Math.sin(Math.PI * frame / (FRAME_COUNT - 1));
    return { x: Math.round(18 * strike), y: Math.round(-5 * strike), sx: 1 + .09 * strike, sy: 1 - .055 * strike, r: -7 * strike };
  }
  if (pose === "magic" || pose === "technique") return { x: Math.round(2 * pulse), y: Math.round(-8 * Math.abs(pulse)), sx: 1 + .035 * beat, sy: 1 + .05 * Math.abs(pulse), r: 2 * pulse };
  if (pose === "heal") return { x: Math.round(2 * pulse), y: Math.round(-10 * Math.abs(pulse)), sx: 1 + .055 * Math.abs(pulse), sy: 1 + .075 * Math.abs(pulse), r: 1.5 * pulse };
  if (pose === "guard") return { x: Math.round(-5 * Math.abs(pulse)), y: 2, sx: 1.08 - .025 * pulse, sy: .94 + .02 * pulse, r: -2 * pulse };
  if (pose === "hit") {
    const recoil = Math.sin(Math.PI * frame / (FRAME_COUNT - 1));
    return { x: Math.round(-15 * recoil), y: Math.round(3 * recoil), sx: 1 - .08 * recoil, sy: 1 + .06 * recoil, r: 9 * recoil };
  }
  if (pose === "jump" || pose === "victory") return { x: Math.round(2 * pulse), y: Math.round(-18 * Math.abs(pulse)), sx: 1 + .06 * Math.abs(pulse), sy: 1 - .045 * Math.abs(pulse), r: 3 * pulse };
  return { x: 0, y: Math.round(2 * Math.abs(pulse)), sx: 1 + .025 * pulse, sy: 1 - .04 * pulse, r: .8 * pulse };
}

async function readFrame(source, frame) {
  const metadata = await sharp(source).metadata();
  const height = metadata.height || FRAME_SIZE;
  const columns = Math.max(1, Math.round((metadata.width || height) / height));
  const sourceIndex = Math.min(columns - 1, Math.floor((frame / FRAME_COUNT) * columns));
  return sharp(source).extract({ left: sourceIndex * height, top: 0, width: height, height }).ensureAlpha().png().toBuffer();
}

async function animate(source, output, pose) {
  const frames = [];
  for (let frame = 0; frame < FRAME_COUNT; frame += 1) {
    const base = await readFrame(source, frame);
    const { x, y, sx, sy, r } = motion(pose, frame);
    const width = Math.max(1, Math.round(FRAME_SIZE * sx));
    const height = Math.max(1, Math.round(FRAME_SIZE * sy));
    const transformedRaw = await sharp(base)
      .resize({ width, height, fit: "fill" })
      .rotate(r, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    const transformed = await sharp(transformedRaw)
      .resize({ width: FRAME_SIZE, height: FRAME_SIZE, fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
    const transformedMeta = await sharp(transformed).metadata();
    const left = Math.round((FRAME_SIZE - (transformedMeta.width || width)) / 2 + x);
    const top = Math.round(FRAME_SIZE - (transformedMeta.height || height) + y);
    frames.push(await sharp({ create: { width: FRAME_SIZE, height: FRAME_SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: transformed, left: Math.max(-FRAME_SIZE, left), top: Math.max(-FRAME_SIZE, top) }])
      .png()
      .toBuffer());
  }
  await fs.promises.mkdir(path.dirname(output), { recursive: true });
  await sharp({ create: { width: FRAME_SIZE * FRAME_COUNT, height: FRAME_SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(frames.map((input, index) => ({ input, left: index * FRAME_SIZE, top: 0 })))
    .png({ palette: true, effort: 4 })
    .toFile(output);
}

function availableVariants(id, stage) {
  const root = path.join(COLLECTION_ROOT, id, "growth", stage, "battle-v2", "variants");
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

const ids = fs.readdirSync(MASTER_ROOT, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".png"))
  .map((entry) => entry.name.slice(0, -4))
  .filter((id) => !requestedId || id === requestedId)
  .sort();

let written = 0;
const jobs = [];
for (const id of ids) {
  for (const stage of STAGES) {
    const baseSourceRoot = path.join(COLLECTION_ROOT, id, "growth", stage, "battle-v4");
    const targets = [{ variant: null, sourceRoot: baseSourceRoot }, ...availableVariants(id, stage).map((variant) => ({
      variant,
      sourceRoot: path.join(COLLECTION_ROOT, id, "growth", stage, "battle-v2", "variants", variant),
    }))];
    for (const { variant, sourceRoot } of targets) {
      const outputRoot = path.join(COLLECTION_ROOT, id, "growth", stage, "battle-v5", ...(variant ? ["variants", variant] : []));
      for (const pose of POSES) {
        const output = path.join(outputRoot, `${pose}.png`);
        if (!force && fs.existsSync(output)) continue;
        const preferred = path.join(sourceRoot, `${SOURCE_POSE[pose] || pose}.png`);
        const fallback = path.join(baseSourceRoot, `${SOURCE_POSE[pose] || pose}.png`);
        const source = fs.existsSync(preferred) ? preferred : fallback;
        if (!fs.existsSync(source)) throw new Error(`Sorgente mancante: ${source}`);
        jobs.push(async () => {
          await animate(source, output, pose);
          written += 1;
        });
      }
    }
  }
}

let cursor = 0;
const workers = Array.from({ length: Math.min(8, jobs.length) }, async () => {
  while (cursor < jobs.length) {
    const job = jobs[cursor];
    cursor += 1;
    await job();
    if (written % 100 === 0) console.log(`${written}/${jobs.length} sequenze`);
  }
});
await Promise.all(workers);

const manifest = {
  version: 5,
  generatedAt: new Date().toISOString(),
  source: "ImageGen character masters plus existing approved color-variant sprites",
  frameCount: FRAME_COUNT,
  frameSize: FRAME_SIZE,
  poses: POSES,
  familiarCount: ids.length,
  written,
};
await fs.promises.writeFile(path.join(MASTER_ROOT, "battle-v5-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`${ids.length} Famigli elaborati; ${written} sequenze battle-v5 scritte, ${FRAME_COUNT} frame ciascuna.`);
