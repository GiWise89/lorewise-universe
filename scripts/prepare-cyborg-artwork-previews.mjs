import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "bozze progetti", "cyborg");
const journalRoot = path.join(root, "public", "creative-journal", "previews");
const artworkRoot = path.join(root, "public", "artworks", "previews");

function watermark(width, height) {
  const diagonalSize = Math.max(18, Math.round(Math.min(width, height) * 0.027));
  const footerSize = Math.max(14, Math.round(Math.min(width, height) * 0.018));
  const lines = Array.from({ length: 5 }, (_, index) => `<text x="50%" y="${17 + index * 18}%">LOREWISE UNIVERSE | GIWISE STUDIO | ANTEPRIMA PROTETTA</text>`).join("");
  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><g fill="white" fill-opacity="0.34" font-family="Arial, sans-serif" font-size="${diagonalSize}" font-weight="700" text-anchor="middle" transform="rotate(-24 ${width / 2} ${height / 2})">${lines}</g><rect x="0" y="${height - footerSize * 2.8}" width="${width}" height="${footerSize * 2.8}" fill="#09112a" fill-opacity="0.82"/><text x="50%" y="${height - footerSize}" fill="white" font-family="Arial, sans-serif" font-size="${footerSize}" font-weight="700" text-anchor="middle">(C) GIWISE STUDIO | LOREWISE UNIVERSE</text></svg>`);
}
async function protectedCopy(sourceName, outputPath, format) {
  const sourceBytes = await readFile(path.join(sourceRoot, sourceName));
  const resized = await sharp(sourceBytes).rotate().resize({ width: 1400, height: 1800, fit: "inside", withoutEnlargement: true }).withMetadata().toBuffer({ resolveWithObject: true });
  const pipeline = sharp(resized.data).composite([{ input: watermark(resized.info.width, resized.info.height), blend: "over" }]);
  if (format === "jpg") await pipeline.jpeg({ quality: 88, chromaSubsampling: "4:4:4", mozjpeg: true }).toFile(outputPath);
  else await pipeline.webp({ quality: 84, effort: 5 }).toFile(outputPath);
}
await mkdir(journalRoot, { recursive: true });
await mkdir(artworkRoot, { recursive: true });
for (let index = 1; index <= 6; index += 1) await protectedCopy(`${index}.jpeg`, path.join(journalRoot, `lw-wip-079-${index}-preview.webp`), "webp");
await protectedCopy("cyborg1.png", path.join(artworkRoot, "lw-art-079-preview.jpg"), "jpg");
console.log("Anteprime Cyborg create: sei fasi WebP e un finale JPG, proporzioni integre e originali invariati.");
