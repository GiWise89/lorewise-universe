import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "bozze progetti", "ritratto miriana");
const journalRoot = path.join(root, "public", "creative-journal", "previews");
const commissionRoot = path.join(root, "public", "commissions", "previews-webp");

function watermark(width, height) {
  const diagonalSize = Math.max(16, Math.round(Math.min(width, height) * 0.027));
  const footerSize = Math.max(13, Math.round(Math.min(width, height) * 0.018));
  const lines = Array.from(
    { length: 4 },
    (_, index) => `<text x="50%" y="${20 + index * 22}%">LOREWISE UNIVERSE | GIWISE STUDIO | ANTEPRIMA PROTETTA</text>`,
  ).join("");
  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><g fill="white" fill-opacity="0.34" font-family="Arial, sans-serif" font-size="${diagonalSize}" font-weight="700" text-anchor="middle" transform="rotate(-24 ${width / 2} ${height / 2})">${lines}</g><rect x="0" y="${height - footerSize * 2.8}" width="${width}" height="${footerSize * 2.8}" fill="#09112a" fill-opacity="0.82"/><text x="50%" y="${height - footerSize}" fill="white" font-family="Arial, sans-serif" font-size="${footerSize}" font-weight="700" text-anchor="middle">(C) GIWISE STUDIO | LOREWISE UNIVERSE</text></svg>`);
}

async function protectedWebp(sourceName, outputPath) {
  const sourceBytes = await readFile(path.join(sourceRoot, sourceName));
  const resized = await sharp(sourceBytes)
    .rotate()
    .resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true })
    .toBuffer({ resolveWithObject: true });
  await sharp(resized.data)
    .composite([{ input: watermark(resized.info.width, resized.info.height), blend: "over" }])
    .webp({ quality: 84, effort: 5 })
    .toFile(outputPath);
}

await mkdir(journalRoot, { recursive: true });
await mkdir(commissionRoot, { recursive: true });
for (let index = 1; index <= 8; index += 1) {
  await protectedWebp(`${index}.png`, path.join(journalRoot, `lw-wip-012-${index}-preview.webp`));
}
await protectedWebp("miriana1.png", path.join(commissionRoot, "lw-com-038-preview.webp"));

console.log("Anteprime LW-COM-038 create: otto fasi e un finale WebP, proporzioni integre, metadati rimossi e originali invariati.");
