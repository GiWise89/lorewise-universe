import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();

const jobs = [
  ["public/brand/lorewise-universe-logo-concept-c.webp", "public/brand/navigation/lorewise-universe-logo.webp", 320, 84],
  ["public/brand/lorewise-wax-seal-v1.webp", "public/brand/navigation/lorewise-wax-seal.webp", 128, 84],
  ["public/brand/icons/arte-concept-v1.webp", "public/brand/navigation/arte.webp", 112, 84],
  ["public/brand/icons/giochi-concept-v1.webp", "public/brand/navigation/giochi.webp", 112, 84],
  ["public/brand/icons/dove-nascono-i-mondi-concept-v1.webp", "public/brand/navigation/mondi.webp", 112, 84],
  ["public/brand/icons/commissioni-concept-v1.webp", "public/brand/navigation/commissioni.webp", 112, 84],
  ["public/brand/icons/lorewise-vip-official-v1.webp", "public/brand/navigation/vip.webp", 112, 84],
  ["public/brand/icons/shop-concept-v1.webp", "public/brand/navigation/shop.webp", 112, 84],
  ["public/brand/icons/social-assistenza-concept-v1.webp", "public/brand/navigation/account.webp", 112, 84],
  ["public/brand/icons/arte-concept-v1.webp", "public/brand/home-portals/arte.webp", 420, 86],
  ["public/brand/icons/giochi-concept-v1.webp", "public/brand/home-portals/giochi.webp", 420, 86],
  ["public/brand/icons/dove-nascono-i-mondi-concept-v1.webp", "public/brand/home-portals/mondi.webp", 420, 86],
  ["public/brand/icons/commissioni-concept-v1.webp", "public/brand/home-portals/commissioni.webp", 420, 86],
  ["public/brand/icons/lorewise-vip-official-v1.webp", "public/brand/home-portals/vip.webp", 420, 86],
  ["public/brand/icons/shop-concept-v1.webp", "public/brand/home-portals/shop.webp", 420, 86],
  ["public/backgrounds/lorewise-luminous-universe-v1.png", "public/backgrounds/lorewise-luminous-universe-v1.webp", 2048, 88],
  ["public/atlas/baldurs-gate-3/guide-section-icons-v1.png", "public/atlas/baldurs-gate-3/guide-section-icons-v1.webp", 1536, 84],
  ["public/atlas/minecraft/guide-section-icons-v1.png", "public/atlas/minecraft/guide-section-icons-v1.webp", 1536, 84],
  ["public/atlas/skyrim/guide-section-icons-v1.png", "public/atlas/skyrim/guide-section-icons-v1.webp", 1536, 84],
  ["public/atlas/world-of-warcraft/guide-section-icons-v1.png", "public/atlas/world-of-warcraft/guide-section-icons-v1.webp", 1536, 84],
];

const wowScenes = [
  "01-returning-orientation",
  "02-silvermoon",
  "04-rotation-cooldowns",
  "05-interface-hud",
  "06-eversong",
  "08-equipment-interface",
  "09-professions-interface",
  "11-raid-voidspire",
  "13-mythic-plus-combat",
  "14-pvp-objectives",
];

for (const scene of wowScenes) {
  jobs.push([
    `public/atlas/world-of-warcraft/official/${scene}.png`,
    `public/atlas/world-of-warcraft/official/${scene}.webp`,
    1920,
    84,
  ]);
}

async function collectPngSources(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const sources = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) sources.push(...await collectPngSources(absolute));
    else if (entry.name.toLowerCase().endsWith(".png")) sources.push(absolute);
  }
  return sources;
}

async function collectAtlasJpegSources(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const sources = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) sources.push(...await collectAtlasJpegSources(absolute));
    else if (/\.jpe?g$/i.test(entry.name)) sources.push(absolute);
  }
  return sources;
}

const certificatePngs = new Set([
  "public/brand/lorewise-universe-logo-concept-c.png",
  "public/brand/lorewise-wax-seal-v1.png",
]);
const scheduledSources = new Set(jobs.map(([sourcePath]) => sourcePath.replaceAll("\\", "/")));
for (const absolute of await collectPngSources(path.join(root, "public"))) {
  const sourcePath = path.relative(root, absolute).replaceAll("\\", "/");
  if (certificatePngs.has(sourcePath) || scheduledSources.has(sourcePath)) continue;
  jobs.push([sourcePath, sourcePath.replace(/\.png$/i, ".webp"), 2400, 86]);
  scheduledSources.add(sourcePath);
}
for (const absolute of await collectAtlasJpegSources(path.join(root, "public", "atlas"))) {
  const sourcePath = path.relative(root, absolute).replaceAll("\\", "/");
  if (scheduledSources.has(sourcePath)) continue;
  jobs.push([sourcePath, sourcePath.replace(/\.jpe?g$/i, ".webp"), 2400, 82]);
  scheduledSources.add(sourcePath);
}

let before = 0;
let after = 0;

for (const [sourcePath, outputPath, width, quality] of jobs) {
  const source = path.join(root, sourcePath);
  const output = path.join(root, outputPath);
  const sourceInfo = await stat(source).catch(() => null);
  if (!sourceInfo) continue;
  await mkdir(path.dirname(output), { recursive: true });
  await sharp(source)
    .rotate()
    .resize({ width, withoutEnlargement: true, fit: "inside" })
    .webp({ quality, alphaQuality: 90, effort: 5 })
    .toFile(output);
  const outputInfo = await stat(output);
  before += sourceInfo.size;
  after += outputInfo.size;
  console.log(`${sourcePath} -> ${outputPath}: ${Math.round(sourceInfo.size / 1024)} KB -> ${Math.round(outputInfo.size / 1024)} KB`);
}

console.log(`Totale copie ottimizzate: ${(before / 1024 / 1024).toFixed(1)} MB -> ${(after / 1024 / 1024).toFixed(1)} MB`);

const referenceFiles = [
  "app/globals.css",
  "data/animal-crossing-guide.json",
  "data/minecraft-guide.json",
  "data/skyrim-guide.json",
  "data/world-of-warcraft-guide.json",
  "lib/gameGuides.ts",
  "scripts/build-animal-crossing-guide.mjs",
  "tests/game-guides.test.mjs",
];

const referenceReplacements = [
  ["/atlas/baldurs-gate-3/guide-section-icons-v1.png", "/atlas/baldurs-gate-3/guide-section-icons-v1.webp"],
  ["/atlas/minecraft/guide-section-icons-v1.png", "/atlas/minecraft/guide-section-icons-v1.webp"],
  ["/atlas/skyrim/guide-section-icons-v1.png", "/atlas/skyrim/guide-section-icons-v1.webp"],
  ["/atlas/world-of-warcraft/guide-section-icons-v1.png", "/atlas/world-of-warcraft/guide-section-icons-v1.webp"],
  ...wowScenes.map((scene) => [`/atlas/world-of-warcraft/official/${scene}.png`, `/atlas/world-of-warcraft/official/${scene}.webp`]),
  ...wowScenes.map((scene) => [`${scene}.png`, `${scene}.webp`]),
  ...jobs.map(([sourcePath, outputPath]) => [
    `/${sourcePath.replace(/^public\//, "")}`,
    `/${outputPath.replace(/^public\//, "")}`,
  ]),
];

for (const relativePath of referenceFiles) {
  const filePath = path.join(root, relativePath);
  const current = await readFile(filePath, "utf8");
  const updated = referenceReplacements.reduce((content, [from, to]) => content.replaceAll(from, to), current);
  if (updated !== current) {
    await writeFile(filePath, updated, "utf8");
    console.log(`Riferimenti aggiornati: ${relativePath}`);
  }
}
