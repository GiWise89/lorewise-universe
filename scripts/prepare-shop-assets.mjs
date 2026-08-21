import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, "GiWise Shop Merce");
const outputRoot = path.join(projectRoot, "public", "shop", "products");

const assets = [
  ["nerd life tshirt.png", "nerd-life-tshirt.webp"],
  ["Leone cane fifone tshirt.png", "leone-cane-fifone-tshirt.webp"],
  ["Leone cane fifone tshirt oversize.png", "leone-cane-fifone-oversize.webp"],
  ["itachi red.png", "itachi-red-tshirt.webp"],
  ["unicorno t-shirt.png", "unicorno-tshirt.webp"],
  ["Coco Creepy.png", "horror-crossing-stitched-bunny.webp"],
  ["Nook Mafia t-shirt.png", "nook-mafia-tshirt.webp"],
  ["Tazza Cartoon Retro.png", "tazza-cartoon-retro.webp"],
  ["MousePad GiWise Gaming.png", "mousepad-giwise-gaming.webp"],
  ["cuscino cuore personalizzato.png", "cuscino-personalizzabile.webp"],
  ["Quadro Echoes of Childhood.png", "quadro-echoes-of-childhood.webp"],
  ["quadro Gaze of madness.png", "quadro-gaze-of-madness.webp"],
  ["trittico canvas.png", "trittico-gothic-dark-art.webp"],
];

await mkdir(outputRoot, { recursive: true });

for (const [sourceName, outputName] of assets) {
  const input = path.join(sourceRoot, sourceName);
  const output = path.join(outputRoot, outputName);

  await sharp(input)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 84, effort: 5 })
    .toFile(output);

  console.log(`${sourceName} -> ${path.relative(projectRoot, output)}`);
}
