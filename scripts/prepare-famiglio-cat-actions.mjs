import { mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const catRoot = "public/famiglio/rebuild/starters/cat";
const sourceRoot = path.join(catRoot, "source-blue-collar");
const variants = ["grey", "black", "brown", "siamese"];
const actions = {
  walk: "RunCat.png",
  feed: "EatCat.png",
  play: "JumpCat.png",
  clean: "Sitting.png",
  care: "Idle2Cat.png",
  sleep: "SleepCat.png",
  sit: "Sitting.png",
  groom: "Liking.png",
};

mkdirSync(sourceRoot, { recursive: true });

const rgbaKey = (data, index) => `${data[index]},${data[index + 1]},${data[index + 2]},${data[index + 3]}`;

async function pixels(file) {
  return sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

async function prepareEatingSource() {
  const sitting = await pixels(path.join(sourceRoot, "Sitting.png"));
  const frameWidth = 32;
  const frameHeight = 32;
  const headShifts = [0, 1, 3, 5, 5, 3, 1, 0];
  const output = Buffer.alloc(frameWidth * headShifts.length * frameHeight * 4);
  const sourceIndex = (x, y) => (y * sitting.info.width + x) * 4;
  const outputIndex = (frame, x, y) => (y * frameWidth * headShifts.length + frame * frameWidth + x) * 4;

  for (const [frame, shift] of headShifts.entries()) {
    for (let y = 0; y < frameHeight; y += 1) {
      for (let x = 0; x < frameWidth; x += 1) {
        const from = sourceIndex(x, y);
        const to = outputIndex(frame, x, y);
        sitting.data.copy(output, to, from, from + 4);
      }
    }
    for (let y = 7; y <= 20; y += 1) {
      for (let x = 14; x <= 30; x += 1) output.fill(0, outputIndex(frame, x, y), outputIndex(frame, x, y) + 4);
    }
    for (let y = 7; y <= 20; y += 1) {
      for (let x = 14; x <= 30; x += 1) {
        const from = sourceIndex(x, y);
        if (sitting.data[from + 3] === 0) continue;
        const targetX = Math.min(31, x + Math.floor(shift / 3));
        const targetY = Math.min(31, y + shift);
        const to = outputIndex(frame, targetX, targetY);
        sitting.data.copy(output, to, from, from + 4);
      }
    }
  }

  await sharp(output, {
    raw: { width: frameWidth * headShifts.length, height: frameHeight, channels: 4 },
  }).png().toFile(path.join(sourceRoot, "EatCat.png"));
}

function paletteMap(source, target) {
  const votes = new Map();
  for (let index = 0; index < source.data.length; index += 4) {
    if (source.data[index + 3] === 0 || target.data[index + 3] === 0) continue;
    const from = rgbaKey(source.data, index);
    const to = rgbaKey(target.data, index);
    const candidates = votes.get(from) ?? new Map();
    candidates.set(to, (candidates.get(to) ?? 0) + 1);
    votes.set(from, candidates);
  }
  return new Map([...votes].map(([from, candidates]) => [
    from,
    [...candidates].sort((a, b) => b[1] - a[1])[0][0].split(",").map(Number),
  ]));
}

function recolor(image, map) {
  const output = Buffer.from(image.data);
  const mappedPalette = [...map.entries()].map(([source, target]) => ({
    source: source.split(",").map(Number),
    target,
  }));
  for (let index = 0; index < output.length; index += 4) {
    if (output[index + 3] === 0) continue;
    let replacement = map.get(rgbaKey(output, index));
    if (!replacement) {
      let nearestDistance = Number.POSITIVE_INFINITY;
      for (const candidate of mappedPalette) {
        if (candidate.source[3] !== output[index + 3]) continue;
        const distance = Math.hypot(
          candidate.source[0] - output[index],
          candidate.source[1] - output[index + 1],
          candidate.source[2] - output[index + 2],
        );
        if (distance < nearestDistance) {
          nearestDistance = distance;
          replacement = candidate.target;
        }
      }
      if (nearestDistance > 24) replacement = undefined;
    }
    if (!replacement) continue;
    output[index] = replacement[0];
    output[index + 1] = replacement[1];
    output[index + 2] = replacement[2];
    output[index + 3] = replacement[3];
  }
  return output;
}

const greyIdle = await pixels(path.join(catRoot, "idle-grey.png"));
await prepareEatingSource();
for (const variant of variants) {
  const variantIdle = await pixels(path.join(catRoot, `idle-${variant}.png`));
  const map = paletteMap(greyIdle, variantIdle);
  for (const [action, filename] of Object.entries(actions)) {
    const source = await pixels(path.join(sourceRoot, filename));
    const output = variant === "grey" ? source.data : recolor(source, map);
    await sharp(output, { raw: source.info }).png().toFile(path.join(catRoot, `${action}-${variant}.png`));
  }
}

console.log("Preparate 32 sequenze del medesimo gatto: 8 azioni per 4 colori.");
