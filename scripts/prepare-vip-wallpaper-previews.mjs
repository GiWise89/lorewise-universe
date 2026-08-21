import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Miniflare } from "miniflare";
import sharp from "sharp";
import { VIP_WALLPAPERS_PRIVATE } from "../data/vip-downloads.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectory = path.join(root, "vip media", "dekstop vip");
const outputDirectory = path.join(root, "tmp", "vip-wallpaper-previews");
const execute = process.argv.includes("--execute-local");

function watermark(width, height) {
  const diagonalSize = Math.max(18, Math.round(Math.min(width, height) * 0.026));
  const footerSize = Math.max(13, Math.round(Math.min(width, height) * 0.016));
  const lines = Array.from({ length: 4 }, (_, index) =>
    `<text x="50%" y="${24 + index * 21}%">LOREWISE UNIVERSE | VIP | ANTEPRIMA PROTETTA</text>`
  ).join("");
  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <g transform="rotate(-20 ${width / 2} ${height / 2})" fill="rgba(255,255,255,.16)" stroke="rgba(0,0,0,.2)" stroke-width="1" text-anchor="middle" font-family="Arial, sans-serif" font-size="${diagonalSize}" font-weight="700">${lines}</g>
    <rect x="0" y="${height - footerSize * 2.5}" width="${width}" height="${footerSize * 2.5}" fill="rgba(0,0,0,.72)"/>
    <text x="50%" y="${height - footerSize * .75}" fill="rgba(255,255,255,.94)" text-anchor="middle" font-family="Arial, sans-serif" font-size="${footerSize}" font-weight="700">(C) GIWISE STUDIO | LOREWISE UNIVERSE</text>
  </svg>`);
}

fs.mkdirSync(outputDirectory, { recursive: true });
const originalState = new Map();
const prepared = [];

for (const wallpaper of VIP_WALLPAPERS_PRIVATE) {
  const sourcePath = path.join(sourceDirectory, wallpaper.sourceFile);
  if (!fs.existsSync(sourcePath)) throw new Error(`Originale non trovato: ${wallpaper.sourceFile}`);
  const sourceStat = fs.statSync(sourcePath);
  originalState.set(sourcePath, `${sourceStat.size}:${sourceStat.mtimeMs}`);
  const resized = await sharp(sourcePath)
    .rotate()
    .resize({ width: 1280, height: 800, fit: "inside", withoutEnlargement: true })
    .toBuffer({ resolveWithObject: true });
  const outputPath = path.join(outputDirectory, `${wallpaper.previewId}.webp`);
  await sharp(resized.data)
    .composite([{ input: watermark(resized.info.width, resized.info.height) }])
    .webp({ quality: 80, effort: 5 })
    .toFile(outputPath);
  prepared.push({ wallpaper, sourcePath, outputPath });
}

const originalsChanged = [...originalState].some(([sourcePath, state]) => {
  const current = fs.statSync(sourcePath);
  return `${current.size}:${current.mtimeMs}` !== state;
});
if (originalsChanged) throw new Error("Verifica fallita: almeno un originale risulta modificato.");

if (!execute) {
  console.log(JSON.stringify({ mode: "dry-run", prepared: prepared.length, originalsChanged, outputDirectory }, null, 2));
  console.log("Ripeti con --execute-local per depositare originali e anteprime nell'R2 locale.");
  process.exit(0);
}

const miniflare = new Miniflare({
  resourcePersistencePath: path.join(root, ".wrangler", "state", "v3"),
  workers: [{
    config: {
      name: "lorewise-vip-wallpapers-local",
      type: "worker",
      compatibilityDate: "2026-08-21",
      manifest: {
        mainModule: "index.js",
        modules: { "index.js": { type: "esm", contents: "export default { async fetch() { return new Response('LoreWise VIP Wallpapers'); } }" } },
      },
      env: { COMMISSION_UPLOADS: { type: "r2", name: "site-creator-r2" } },
    },
  }],
});

try {
  const bucket = await miniflare.getR2Bucket("COMMISSION_UPLOADS");
  for (const { wallpaper, sourcePath, outputPath } of prepared) {
    await bucket.put(wallpaper.originalKey, fs.readFileSync(sourcePath), {
      httpMetadata: { contentType: "image/png" },
      customMetadata: { visibility: "private", source: "vip-wallpaper-original", mediaId: wallpaper.mediaId },
    });
    await bucket.put(wallpaper.previewKey, fs.readFileSync(outputPath), {
      httpMetadata: { contentType: "image/webp" },
      customMetadata: { visibility: "private", source: "protected-vip-wallpaper-preview", mediaId: wallpaper.previewId },
    });
    const originalStored = await bucket.head(wallpaper.originalKey);
    const previewStored = await bucket.head(wallpaper.previewKey);
    if (!originalStored?.size || !previewStored?.size) throw new Error(`Deposito locale non verificato: ${wallpaper.mediaId}`);
  }
  console.log(JSON.stringify({ mode: "local-r2", originals: prepared.length, previews: prepared.length, originalsChanged }, null, 2));
} finally {
  await miniflare.dispose();
}
