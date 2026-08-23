import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourceRoot = path.join(root, "assets", "codex-character-originals");
const outputRoot = path.join(root, "public", "codex", "thumbnails");
const profilePath = path.join(root, ".tmp", "codex-thumbnail-profile.txt");
const renderProfile = "340x450-webp-q78-a88-e6-v2";
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
    .resize({ width: 340, height: 450, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 78, alphaQuality: 88, effort: 6 })
    .toFile(output);
  return true;
}

const files = await collect(sourceRoot);
let converted = 0;
const queue = [...files];
const workers = Array.from({ length: Math.min(2, files.length) }, async () => {
  while (queue.length) {
    const source = queue.shift();
    if (source && await convert(source)) converted += 1;
  }
});
await Promise.all(workers);
await fs.mkdir(path.dirname(profilePath), { recursive: true });
await fs.writeFile(profilePath, renderProfile, "utf8");
console.log(`Anteprime Codex pronte: ${files.length} file, ${converted} rigenerati, senza ritagli.`);
