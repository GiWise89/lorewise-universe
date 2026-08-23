import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourceRoot = path.join(root, "assets", "codex-character-originals");
const outputRoot = path.join(root, "public", "codex", "display");
const profilePath = path.join(root, ".tmp", "codex-display-profile.txt");
const renderProfile = "1100x1375-webp-q78-a88-e6-v3";
const supported = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const previousProfile = await fs.readFile(profilePath, "utf8").catch(() => "");
const forceRebuild = previousProfile !== renderProfile;

async function collect(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collect(absolute));
    else if (supported.has(path.extname(entry.name).toLowerCase())) files.push(absolute);
  }
  return files;
}

async function convert(source) {
  const relative = path.relative(sourceRoot, source);
  const output = path.join(outputRoot, relative.replace(/\.[^.]+$/, ".webp"));
  await fs.mkdir(path.dirname(output), { recursive: true });
  const [sourceStat, outputStat] = await Promise.all([
    fs.stat(source),
    fs.stat(output).catch(() => null),
  ]);
  if (!forceRebuild && outputStat && outputStat.size > 0 && outputStat.mtimeMs >= sourceStat.mtimeMs) return false;
  await sharp(source, { failOn: "warning" })
    .rotate()
    .resize({ width: 1100, height: 1375, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 78, alphaQuality: 88, effort: 6, smartSubsample: true })
    .toFile(output);
  return true;
}

const files = await collect(sourceRoot);
let converted = 0;
const queue = [...files];
await Promise.all(Array.from({ length: Math.min(2, files.length) }, async () => {
  while (queue.length) {
    const source = queue.shift();
    if (source && await convert(source)) converted += 1;
  }
}));

await fs.mkdir(path.dirname(profilePath), { recursive: true });
await fs.writeFile(profilePath, renderProfile, "utf8");

const totalBytes = (await Promise.all(files.map(async (source) => {
  const relative = path.relative(sourceRoot, source).replace(/\.[^.]+$/, ".webp");
  return (await fs.stat(path.join(outputRoot, relative))).size;
}))).reduce((sum, size) => sum + size, 0);

console.log(`Immagini Codex per i dossier pronte: ${files.length} file, ${converted} rigenerati, ${(totalBytes / 1024 / 1024).toFixed(2)} MB, senza ritagli.`);
