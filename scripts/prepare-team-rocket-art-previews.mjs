import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "bozze progetti", "team rocket");
const newsRoot = path.join(root, "public", "novita", "art", "team-rocket");
const artworkRoot = path.join(root, "public", "artworks", "previews");

function watermark(width, height) {
  const diagonalSize = Math.max(15, Math.round(Math.min(width, height) * .027));
  const footerSize = Math.max(12, Math.round(Math.min(width, height) * .018));
  const lines = Array.from({ length: 5 }, (_, index) => `<text x="50%" y="${16 + index * 18}%">LOREWISE UNIVERSE | GIWISE STUDIO | ANTEPRIMA PROTETTA</text>`).join("");
  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><g fill="white" fill-opacity="0.34" font-family="Arial, sans-serif" font-size="${diagonalSize}" font-weight="700" text-anchor="middle" transform="rotate(-24 ${width / 2} ${height / 2})">${lines}</g><rect x="0" y="${height - footerSize * 2.8}" width="${width}" height="${footerSize * 2.8}" fill="#09112a" fill-opacity="0.82"/><text x="50%" y="${height - footerSize}" fill="white" font-family="Arial, sans-serif" font-size="${footerSize}" font-weight="700" text-anchor="middle">(C) GIWISE STUDIO | LOREWISE UNIVERSE</text></svg>`);
}

async function protectedPreview(sourceName, destination, format = "webp") {
  const source = await readFile(path.join(sourceRoot, sourceName));
  const resized = await sharp(source).rotate().resize({ width: 1400, height: 1800, fit: "inside", withoutEnlargement: true }).flatten({ background: "#fff" }).toBuffer({ resolveWithObject: true });
  const pipeline = sharp(resized.data).composite([{ input: watermark(resized.info.width, resized.info.height), blend: "over" }]);
  if (format === "jpeg") await pipeline.jpeg({ quality: 88, chromaSubsampling: "4:4:4", mozjpeg: true }).toFile(destination);
  else await pipeline.webp({ quality: 84, effort: 5 }).toFile(destination);
}

await mkdir(newsRoot, { recursive: true });
await mkdir(artworkRoot, { recursive: true });
await protectedPreview("Screenshot 2026-09-04 231735.png", path.join(newsRoot, "fase-01-preview.webp"));
await protectedPreview("Screenshot 2026-09-04 234654.png", path.join(newsRoot, "fase-02-preview.webp"));
await protectedPreview("team rock1.png", path.join(newsRoot, "opera-completa-preview.webp"));
await protectedPreview("team rock1.png", path.join(artworkRoot, "lw-art-081-preview.jpg"), "jpeg");

console.log("Team Rocket: tre anteprime protette per Novita e una copia JPG protetta per Arte; originali invariati e proporzioni integre.");
