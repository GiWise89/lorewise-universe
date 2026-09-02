import sharp from "sharp";
import { join } from "node:path";
import { writeFile } from "node:fs/promises";

const sheets = [
  ["moon-rabbit", "public/famiglio/sprites/premium/moon-rabbit-master.png"],
  ["moon-rabbit-cap", "public/famiglio/gadgets/berretto-stellare/moon-rabbit/moon-rabbit-master.png"],
  ["moon-rabbit-scarf", "public/famiglio/gadgets/sciarpa-crepuscolo/moon-rabbit/moon-rabbit-master.png"],
  ["moon-rabbit-mantle", "public/famiglio/gadgets/mantellina-custode/moon-rabbit/moon-rabbit-master.png"],
  ["pocket-dragon", "public/famiglio/sprites/premium/pocket-dragon-master.png"],
  ["ember-red-panda", "public/famiglio/sprites/premium/ember-red-panda-master.png"],
  ["astral-fawn", "assets/release-source-archive/famiglio/sprites/premium/astral-fawn-master.png"],
  ["nexus-axolotl", "assets/release-source-archive/famiglio/sprites/premium/nexus-axolotl-master.png"],
];
for (const appearanceId of ["pocket-dragon", "ember-red-panda", "astral-fawn", "nexus-axolotl"]) {
  for (const [suffix, gadgetId] of [["cap", "berretto-stellare"], ["scarf", "sciarpa-crepuscolo"], ["mantle", "mantellina-custode"]]) {
    sheets.push([`${appearanceId}-${suffix}`, `public/famiglio/gadgets/${gadgetId}/${appearanceId}/${appearanceId}-master.png`]);
  }
}

async function bottomRatio(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let bottom = -1;
  for (let y = 0; y < info.height; y += 1) for (let x = 0; x < info.width; x += 1) {
    if (data[(y * info.width + x) * 4 + 3] >= 20) bottom = Math.max(bottom, y);
  }
  return bottom < 0 ? 1 : (info.height - 1 - bottom) / info.height;
}

const result = {};
for (const [id, relative] of sheets) {
  const source = join(process.cwd(), relative);
  const metadata = await sharp(source).metadata();
  const width = Math.floor(metadata.width / 8);
  const height = Math.floor(metadata.height / 5);
  result[id] = [];
  for (let row = 0; row < 5; row += 1) {
    const ratios = [];
    for (let frame = 0; frame < 8; frame += 1) {
      const tile = await sharp(source).extract({ left: frame * width, top: row * height, width, height }).png().toBuffer();
      ratios.push(Number((await bottomRatio(tile)).toFixed(6)));
    }
    result[id].push(ratios);
  }
}
const serialized = `${JSON.stringify(result, null, 2)}\n`;
if (process.argv.includes("--write")) {
  const target = join(process.cwd(), "lib", "nexusFamiliarGeneratedGrounding.json");
  await writeFile(target, serialized);
  console.log(target);
} else console.log(serialized);
