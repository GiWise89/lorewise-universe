import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "bozze progetti", "obsession");
const journalRoot = path.join(root, "public", "creative-journal", "previews");
const artworkRoot = path.join(root, "public", "artworks", "previews");

function watermark(width, height) {
  const diagonalSize = Math.max(15, Math.round(Math.min(width, height) * 0.027));
  const footerSize = Math.max(12, Math.round(Math.min(width, height) * 0.018));
  const lines = Array.from(
    { length: 5 },
    (_, index) => `<text x="50%" y="${16 + index * 18}%">LOREWISE UNIVERSE | GIWISE STUDIO | ANTEPRIMA PROTETTA</text>`,
  ).join("");

  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><g fill="white" fill-opacity="0.34" font-family="Arial, sans-serif" font-size="${diagonalSize}" font-weight="700" text-anchor="middle" transform="rotate(-24 ${width / 2} ${height / 2})">${lines}</g><rect x="0" y="${height - footerSize * 2.8}" width="${width}" height="${footerSize * 2.8}" fill="#09112a" fill-opacity="0.82"/><text x="50%" y="${height - footerSize}" fill="white" font-family="Arial, sans-serif" font-size="${footerSize}" font-weight="700" text-anchor="middle">(C) GIWISE STUDIO | LOREWISE UNIVERSE</text></svg>`);
}

async function protectedWebp(sourceName, outputName) {
  const sourceBytes = await readFile(path.join(sourceRoot, sourceName));
  const resized = await sharp(sourceBytes)
    .rotate()
    .resize({ width: 1400, height: 1800, fit: "inside", withoutEnlargement: true })
    .toBuffer({ resolveWithObject: true });

  await sharp(resized.data)
    .composite([{ input: watermark(resized.info.width, resized.info.height), blend: "over" }])
    .webp({ quality: 84, effort: 5 })
    .toFile(path.join(journalRoot, outputName));
}

async function protectedJpeg(sourceName, outputName) {
  const sourceBytes = await readFile(path.join(sourceRoot, sourceName));
  const resized = await sharp(sourceBytes)
    .rotate()
    .resize({ width: 1400, height: 1800, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#111318" })
    .toBuffer({ resolveWithObject: true });

  await sharp(resized.data)
    .composite([{ input: watermark(resized.info.width, resized.info.height), blend: "over" }])
    .jpeg({ quality: 88, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toFile(path.join(artworkRoot, outputName));
}

await mkdir(journalRoot, { recursive: true });
await mkdir(artworkRoot, { recursive: true });
for (let index = 0; index <= 7; index += 1) {
  await protectedWebp(`${index}.png`, `lw-wip-013-${index + 1}-preview.webp`);
}
await protectedWebp("obsession1.png", "lw-wip-013-complete-preview.webp");
await protectedJpeg("obsession1.png", "lw-art-080-preview.jpg");

console.log("Anteprime Obsession create: otto fasi e un finale WebP per il diario, una copia JPG per la vetrina, proporzioni integre, metadati rimossi e originali invariati.");
