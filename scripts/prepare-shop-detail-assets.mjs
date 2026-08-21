import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, "GiWise Shop Merce");
const outputRoot = path.join(projectRoot, "public", "shop", "details");

const assets = [
  ["itachi red.png", "gs-004-itachi-tshirt.webp"],
  ["itachi red felpa.png", "gs-004-itachi-felpa.webp"],
];

await mkdir(outputRoot, { recursive: true });

for (const [source, output] of assets) {
  await sharp(path.join(sourceRoot, source))
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90, effort: 5 })
    .toFile(path.join(outputRoot, output));
}

console.log(`${assets.length} immagini prodotto preparate senza ritaglio.`);
