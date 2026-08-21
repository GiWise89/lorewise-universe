import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const directories = [
  path.join(root, "public", "brand"),
  path.join(root, "public", "brand", "icons"),
  path.join(root, "public", "brand", "art-portals"),
  path.join(root, "public", "codex", "seals"),
  path.join(root, "public", "codex", "ornaments"),
  path.join(root, "public", "backgrounds"),
];

const files = (await Promise.all(directories.map(async (directory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /\.(png|jpe?g)$/i.test(entry.name))
    .map((entry) => path.join(directory, entry.name));
}))).flat();

let converted = 0;
let sourceBytes = 0;
let outputBytes = 0;
for (const source of files) {
  const output = source.replace(/\.[^.]+$/, ".webp");
  const [sourceStat, outputStat] = await Promise.all([fs.stat(source), fs.stat(output).catch(() => null)]);
  sourceBytes += sourceStat.size;
  if (!outputStat || outputStat.mtimeMs < sourceStat.mtimeMs) {
    await sharp(source, { failOn: "warning" })
      .rotate()
      .resize({ width: 2560, height: 2560, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 90, alphaQuality: 95, effort: 5, smartSubsample: true })
      .toFile(output);
    converted += 1;
  }
  outputBytes += (await fs.stat(output)).size;
}

console.log(`Risorse pubbliche ottimizzate: ${files.length} file, ${converted} rigenerati, ${(sourceBytes / 1024 / 1024).toFixed(2)} MB -> ${(outputBytes / 1024 / 1024).toFixed(2)} MB, senza ritagli.`);
