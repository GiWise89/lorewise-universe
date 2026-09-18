import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.join("public", "famiglio", "rebuild", "collection");
const FRAME_SIZE = 160;
const FRAME_COUNT = 8;
const POSES = ["idle", "run", "physical", "magic", "heal", "guard", "hit", "jump"];

function components(data, width, height) {
  const seen = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  const result = [];
  for (let start = 0; start < width * height; start += 1) {
    if (seen[start] || data[start * 4 + 3] < 128) continue;
    let head = 0;
    let tail = 0;
    let count = 0;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    const pixels = [];
    seen[start] = 1;
    queue[tail++] = start;
    while (head < tail) {
      const index = queue[head++];
      const x = index % width;
      const y = Math.floor(index / width);
      pixels.push(index);
      count += 1;
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      for (const next of [index - 1, index + 1, index - width, index + width]) {
        if (next < 0 || next >= width * height || seen[next]) continue;
        const nx = next % width;
        if (Math.abs(nx - x) > 1 || data[next * 4 + 3] < 128) continue;
        seen[next] = 1;
        queue[tail++] = next;
      }
    }
    result.push({ count, minX, minY, maxX, maxY, pixels });
  }
  return result.sort((a, b) => b.count - a.count);
}

function spriteDirectories() {
  const directories = [];
  for (const id of fs.readdirSync(ROOT)) {
    const adult = path.join(ROOT, id, "growth", "adulto", "battle-v6");
    if (!fs.existsSync(adult)) continue;
    directories.push({ id, variant: "base", directory: adult });
    const variants = path.join(adult, "variants");
    if (!fs.existsSync(variants)) continue;
    for (const variant of fs.readdirSync(variants)) directories.push({ id, variant, directory: path.join(variants, variant) });
  }
  return directories;
}

const failures = [];
let checkedFrames = 0;
for (const sprite of spriteDirectories()) {
  for (const pose of POSES) {
    const file = path.join(sprite.directory, `${pose}.png`);
    if (!fs.existsSync(file)) {
      failures.push({ ...sprite, pose, frame: null, reason: "missing-strip" });
      continue;
    }
    const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    if (info.width !== FRAME_SIZE * FRAME_COUNT || info.height !== FRAME_SIZE) {
      failures.push({ ...sprite, pose, frame: null, reason: `invalid-size-${info.width}x${info.height}` });
      continue;
    }
    const stripMetrics = [];
    for (let frame = 0; frame < FRAME_COUNT; frame += 1) {
      checkedFrames += 1;
      const frameData = await sharp(data, { raw: info })
        .extract({ left: frame * FRAME_SIZE, top: 0, width: FRAME_SIZE, height: FRAME_SIZE })
        .raw()
        .toBuffer();
      const found = components(frameData, FRAME_SIZE, FRAME_SIZE);
      let partialAlpha = 0;
      for (let offset = 3; offset < frameData.length; offset += 4) {
        if (frameData[offset] > 0 && frameData[offset] < 255) partialAlpha += 1;
      }
      if (partialAlpha) failures.push({ ...sprite, pose, frame, reason: `semi-transparent-matte-${partialAlpha}px` });
      const whiteIslands = found.filter((component) => component.count < 24 && component.pixels.every((index) => {
        const offset = index * 4;
        const light = Math.max(frameData[offset], frameData[offset + 1], frameData[offset + 2]);
        const dark = Math.min(frameData[offset], frameData[offset + 1], frameData[offset + 2]);
        return light >= 178 && light - dark <= 32;
      })).reduce((total, component) => total + component.count, 0);
      if (whiteIslands) failures.push({ ...sprite, pose, frame, reason: `white-background-islands-${whiteIslands}px` });
      const main = found[0];
      if (!main || main.count < 180) {
        failures.push({ ...sprite, pose, frame, reason: "empty-or-tiny-main-subject" });
        continue;
      }
      stripMetrics.push({ frame, count: main.count, width: main.maxX - main.minX + 1, height: main.maxY - main.minY + 1 });
      const touchesSide = main.minX <= 1 || main.maxX >= FRAME_SIZE - 2 || main.minY <= 1;
      if (touchesSide) failures.push({ ...sprite, pose, frame, reason: "main-subject-cut-at-frame-edge" });
      const bodyHeight = main.maxY - main.minY + 1;
      if (bodyHeight < 52) failures.push({ ...sprite, pose, frame, reason: `main-subject-too-short-${bodyHeight}px` });
    }
    if (stripMetrics.length >= 6) {
      const sortedAreas = stripMetrics.map((metric) => metric.count).sort((a, b) => a - b);
      const medianArea = sortedAreas[Math.floor(sortedAreas.length / 2)];
      for (const metric of stripMetrics) {
        if (metric.count < medianArea * .55) {
          failures.push({ ...sprite, pose, frame: metric.frame, reason: `main-subject-collapsed-${metric.count}-vs-${medianArea}px` });
        }
      }
    }
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  checkedFrames,
  failures,
  passed: failures.length === 0,
};
const reportPath = path.join("artifacts", "famiglio-battle-v6-audit.json");
await fs.promises.mkdir(path.dirname(reportPath), { recursive: true });
await fs.promises.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Frame controllati: ${checkedFrames}. Anomalie: ${failures.length}. Report: ${reportPath}`);
for (const failure of failures.slice(0, 80)) console.log(`${failure.id}/${failure.variant} ${failure.pose} #${failure.frame ?? "-"}: ${failure.reason}`);
if (failures.length) process.exitCode = 1;
