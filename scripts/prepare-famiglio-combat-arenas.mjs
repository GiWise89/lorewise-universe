import { access, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const arenaRoot = path.join(process.cwd(), "public", "famiglio", "rebuild", "combat", "arenas");
const arenaIds = [
  "cortile-prime-orme-v1",
  "bosco-risonanze-v1",
  "grotte-celesti-v1",
  "rovine-arcane-v1",
  "valle-titani-v1",
  "soglia-leggendaria-v1",
];

const results = [];
for (const id of arenaIds) {
  const source = path.join(arenaRoot, `${id}.png`);
  const output = path.join(arenaRoot, `${id}.webp`);
  await access(source);
  await sharp(source)
    .resize(1280, 720, { fit: "contain", position: "centre", background: { r: 15, g: 10, b: 29 } })
    .webp({ quality: 88, effort: 6 })
    .toFile(output);
  const metadata = await sharp(output).metadata();
  results.push({
    id,
    width: metadata.width,
    height: metadata.height,
    bytes: (await stat(output)).size,
  });
}

console.log(JSON.stringify({ arenas: results }, null, 2));
