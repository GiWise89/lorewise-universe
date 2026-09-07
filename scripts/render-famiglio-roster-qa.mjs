import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { STARTER_EGGS } from "../lib/famiglioRebuild.ts";
import { FAMILIAR_SPRITE_ROSTER, REQUIRED_FAMILIAR_ACTIONS } from "../lib/famiglioSpriteRoster.ts";

const cellWidth = 150;
const cellHeight = 128;
const headerHeight = 52;
const labelWidth = 170;
const width = labelWidth + REQUIRED_FAMILIAR_ACTIONS.length * cellWidth;
const height = headerHeight + STARTER_EGGS.length * cellHeight;
const layers = [];

function label(text, width, height, size, color = "#fff3cc") {
  const safe = text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><text x="${width / 2}" y="${height / 2 + size * .34}" text-anchor="middle" font-family="monospace" font-weight="700" font-size="${size}" fill="${color}">${safe}</text></svg>`);
}

for (let column = 0; column < REQUIRED_FAMILIAR_ACTIONS.length; column += 1) {
  layers.push({
    input: label(REQUIRED_FAMILIAR_ACTIONS[column], cellWidth, headerHeight, 13, "#ffd467"),
    left: labelWidth + column * cellWidth,
    top: 0,
  });
}

for (let row = 0; row < STARTER_EGGS.length; row += 1) {
  const egg = STARTER_EGGS[row];
  const spriteSet = FAMILIAR_SPRITE_ROSTER[egg.id];
  layers.push({ input: label(egg.familiar, labelWidth, cellHeight, 15), left: 0, top: headerHeight + row * cellHeight });
  for (let column = 0; column < REQUIRED_FAMILIAR_ACTIONS.length; column += 1) {
    const action = REQUIRED_FAMILIAR_ACTIONS[column];
    const sequence = spriteSet.actions[action];
    const sourcePath = path.join("public", ...sequence.src.split("/").filter(Boolean));
    const representativeFrame = Math.min(sequence.frames - 1, Math.floor(sequence.frames * .55));
    const sprite = await sharp(sourcePath)
      .extract({ left: representativeFrame * sequence.frameWidth, top: 0, width: sequence.frameWidth, height: sequence.frameHeight })
      .resize(92, 92, { fit: "contain", kernel: "nearest", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    layers.push({
      input: sprite,
      left: labelWidth + column * cellWidth + Math.round((cellWidth - 92) / 2),
      top: headerHeight + row * cellHeight + 14,
    });
  }
}

const output = path.join("artifacts", "famiglio-rebuild-qa", "roster-actions.png");
await mkdir(path.dirname(output), { recursive: true });
await sharp({ create: { width, height, channels: 4, background: { r: 20, g: 14, b: 36, alpha: 1 } } })
  .composite(layers)
  .png()
  .toFile(output);

console.log(output);
