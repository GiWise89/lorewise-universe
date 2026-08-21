import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const sourceDirectory = path.resolve("public/commissions/previews");
const outputDirectory = path.resolve("public/commissions/previews-webp");
await mkdir(outputDirectory, { recursive: true });

const sourceFiles = (await readdir(sourceDirectory)).filter((name) => name.toLowerCase().endsWith(".jpg"));
for (const name of sourceFiles) {
  const destination = path.join(outputDirectory, name.replace(/\.jpg$/i, ".webp"));
  await sharp(path.join(sourceDirectory, name))
    .rotate()
    .resize({ width: 1400, height: 1800, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 86, effort: 5 })
    .toFile(destination);
}

console.log(`Create ${sourceFiles.length} anteprime WebP protette in ${outputDirectory}`);
