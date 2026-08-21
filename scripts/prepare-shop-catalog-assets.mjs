import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, "GiWise Shop Merce");
const outputRoot = path.join(projectRoot, "public", "shop", "catalog");
const catalogPath = path.join(projectRoot, "data", "shop-storefront-catalog.json");
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));

await mkdir(outputRoot, { recursive: true });

for (const product of catalog.products) {
  const input = path.join(sourceRoot, product.sourceFile);
  const output = path.join(projectRoot, "public", product.image.replace(/^\//, ""));

  await sharp(input)
    .rotate()
    .resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 84, effort: 5 })
    .toFile(output);
}

console.log(`${catalog.products.length} immagini catalogo preparate in ${path.relative(projectRoot, outputRoot)}`);
