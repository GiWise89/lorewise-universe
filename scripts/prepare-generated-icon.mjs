import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const [, , sourceArgument, outputArgument] = process.argv;

if (!sourceArgument || !outputArgument) {
  throw new Error("Uso: node scripts/prepare-generated-icon.mjs <origine> <destinazione>");
}

const source = path.resolve(sourceArgument);
const output = path.resolve(outputArgument);

await mkdir(path.dirname(output), { recursive: true });
await sharp(source)
  .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
  .webp({ quality: 88, alphaQuality: 100, effort: 4 })
  .toFile(output);

console.log(`Creata ${path.relative(process.cwd(), output)}`);
