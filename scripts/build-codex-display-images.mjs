import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourceRoot = path.join(root, "assets", "codex-character-originals");
const outputRoot = path.join(root, "public", "codex", "display");
const supported = new Set([".png", ".jpg", ".jpeg", ".webp"]);

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
  if (outputStat && outputStat.size > 0 && outputStat.mtimeMs >= sourceStat.mtimeMs) return false;
  await sharp(source, { failOn: "warning" })
    .rotate()
    .resize({ width: 1600, height: 2000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90, alphaQuality: 95, effort: 5, smartSubsample: true })
    .toFile(output);
  return true;
}

const files = await collect(sourceRoot);
let converted = 0;
const queue = [...files];
await Promise.all(Array.from({ length: Math.min(6, files.length) }, async () => {
  while (queue.length) {
    const source = queue.shift();
    if (source && await convert(source)) converted += 1;
  }
}));

const totalBytes = (await Promise.all(files.map(async (source) => {
  const relative = path.relative(sourceRoot, source).replace(/\.[^.]+$/, ".webp");
  return (await fs.stat(path.join(outputRoot, relative))).size;
}))).reduce((sum, size) => sum + size, 0);

console.log(`Immagini Codex per i dossier pronte: ${files.length} file, ${converted} rigenerati, ${(totalBytes / 1024 / 1024).toFixed(2)} MB, senza ritagli.`);
