import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const sourceDir = path.resolve("passioni e hobby");
const outputDir = path.resolve("public", "creative-journal", "passions");

const photos = [
  ["sono GiWise.heic", "giwise-ritratto.webp"],
  ["20260820_211920.heic", "postazione-creativa.webp"],
  ["20260820_215202.heic", "collezione-cultura-pop.webp"],
  ["20260820_215214.heic", "collezione-naruto.webp"],
  ["20260820_215219.heic", "anime-videogiochi.webp"],
  ["20260820_215246.heic", "collezione-pennywise.webp"],
  ["20260820_215310.heic", "pennywise-dettaglio.webp"],
  ["20260820_215330.heic", "musica-retrogaming.webp"],
];

await mkdir(outputDir, { recursive: true });

for (const [sourceName, outputName] of photos) {
  const source = path.join(sourceDir, sourceName);
  const output = path.join(outputDir, outputName);

  await sharp(source)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 78, effort: 4 })
    .toFile(output);

  console.log(`Creata ${path.relative(process.cwd(), output)}`);
}
