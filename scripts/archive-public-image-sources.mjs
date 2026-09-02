import { mkdir, readFile, readdir, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const publicRoot = path.join(root, "public");
const archiveRoot = path.join(root, "assets", "release-source-archive");
const imagePaths = [
  "novita/famiglio/famiglio-del-nexus-spot-v2.png",
  "novita/obsession/nikki-linea-iniziale.png",
  "novita/obsession/nikki-presenza-emersa.png",
  "novita/obsession/nikki-ritratto-completo.png",
  "promotions/holiday/christmas-fairy-lights-edge-v1.png",
  "promotions/holiday/christmas-fairy-lights-vertical-v1.png",
  "promotions/holiday/christmas-garland-divider-v1.png",
  "promotions/holiday/christmas-nexus-background-v1.png",
  "promotions/holiday/christmas-snowman-frame-v1.png",
  "promotions/opening/promo-apertura-coupon-5-euro-vertical-v1.png",
];
const sourceRoots = ["app", "components", "lib", "data", "tests", "scripts"];
const textExtensions = new Set([".ts", ".tsx", ".css", ".mjs", ".json"]);

async function collectTextFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectTextFiles(absolute));
    else if (textExtensions.has(path.extname(entry.name))) files.push(absolute);
  }
  return files;
}

const replacements = [];
for (const relative of imagePaths) {
  const source = path.join(publicRoot, relative);
  const sourceInfo = await stat(source).catch(() => null);
  if (!sourceInfo) continue;
  const webpRelative = relative.replace(/\.png$/i, ".webp");
  const output = path.join(publicRoot, webpRelative);
  await mkdir(path.dirname(output), { recursive: true });
  await sharp(source)
    .rotate()
    .resize({ width: 2400, withoutEnlargement: true, fit: "inside" })
    .webp({ quality: 86, alphaQuality: 92, effort: 6 })
    .toFile(output);
  const archive = path.join(archiveRoot, relative);
  await mkdir(path.dirname(archive), { recursive: true });
  await rename(source, archive);
  replacements.push([`/${relative}`, `/${webpRelative}`]);
}

for (const file of (await Promise.all(sourceRoots.map((directory) => collectTextFiles(path.join(root, directory))))).flat()) {
  const current = await readFile(file, "utf8");
  const updated = replacements.reduce((text, [from, to]) => text.replaceAll(from, to), current);
  if (updated !== current) await writeFile(file, updated, "utf8");
}

console.log(`Archiviate ${replacements.length} sorgenti PNG e aggiornati i riferimenti alle copie WebP.`);
