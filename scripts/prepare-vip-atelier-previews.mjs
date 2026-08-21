import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Miniflare } from "miniflare";
import sharp from "sharp";
import { VIP_ATELIER_MEDIA_PRIVATE } from "../data/vip-atelier.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectory = path.join(root, "bozze progetti", "bozze e compl");
const outputDirectory = path.join(root, "tmp", "vip-atelier-previews");
const execute = process.argv.includes("--execute-local");

function watermark(width, height) {
  const diagonalSize = Math.max(22, Math.round(Math.min(width, height) * 0.027));
  const footerSize = Math.max(14, Math.round(Math.min(width, height) * 0.015));
  const repeat = Array.from({ length: 4 }, (_, index) => `<text x="50%" y="${24 + index * 20}%">LOREWISE UNIVERSE | ATELIER VIP | ANTEPRIMA PROTETTA</text>`).join("");
  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <g transform="rotate(-22 ${width / 2} ${height / 2})" fill="rgba(255,255,255,.17)" stroke="rgba(0,0,0,.18)" stroke-width="1" text-anchor="middle" font-family="Arial, sans-serif" font-size="${diagonalSize}" font-weight="700">${repeat}</g>
    <rect x="0" y="${height - footerSize * 2.5}" width="${width}" height="${footerSize * 2.5}" fill="rgba(0,0,0,.7)"/>
    <text x="50%" y="${height - footerSize * .75}" fill="rgba(255,255,255,.94)" text-anchor="middle" font-family="Arial, sans-serif" font-size="${footerSize}" font-weight="700">(C) GIWISE STUDIO | LOREWISE UNIVERSE</text>
  </svg>`);
}

fs.mkdirSync(outputDirectory, { recursive: true });
const originalState = new Map();
const prepared = [];

for (const media of VIP_ATELIER_MEDIA_PRIVATE) {
  const sourcePath = path.join(sourceDirectory, ...media.sourceFile.split("/"));
  if (!fs.existsSync(sourcePath)) throw new Error(`Originale non trovato: ${media.sourceFile}`);
  originalState.set(sourcePath, `${fs.statSync(sourcePath).size}:${fs.statSync(sourcePath).mtimeMs}`);
  const resized = await sharp(sourcePath).rotate().resize({ width: 1500, height: 1500, fit: "inside", withoutEnlargement: true }).toBuffer({ resolveWithObject: true });
  const outputPath = path.join(outputDirectory, `${media.id}.webp`);
  await sharp(resized.data).composite([{ input: watermark(resized.info.width, resized.info.height), blend: "over" }]).webp({ quality: 84, effort: 5 }).toFile(outputPath);
  prepared.push({ media, outputPath, size: fs.statSync(outputPath).size });
}

const originalsChanged = [...originalState].some(([sourcePath, state]) => {
  const current = fs.statSync(sourcePath);
  return `${current.size}:${current.mtimeMs}` !== state;
});
if (originalsChanged) throw new Error("Verifica fallita: almeno un originale risulta modificato.");

if (!execute) {
  console.log(JSON.stringify({ mode: "dry-run", prepared: prepared.length, originalsChanged, outputDirectory }, null, 2));
  console.log("Ripeti con --execute-local per depositare le anteprime nell'R2 locale.");
  process.exit(0);
}

const miniflare = new Miniflare({
  resourcePersistencePath: path.join(root, ".wrangler", "state", "v3"),
  workers: [{
    config: {
      name: "lorewise-vip-atelier-local",
      type: "worker",
      compatibilityDate: "2026-08-21",
      manifest: {
        mainModule: "index.js",
        modules: { "index.js": { type: "esm", contents: "export default { async fetch() { return new Response('LoreWise VIP Atelier'); } }" } },
      },
      env: { COMMISSION_UPLOADS: { type: "r2", name: "site-creator-r2" } },
    },
  }],
});

try {
  const bucket = await miniflare.getR2Bucket("COMMISSION_UPLOADS");
  for (const { media, outputPath } of prepared) {
    await bucket.put(media.objectKey, fs.readFileSync(outputPath), {
      httpMetadata: { contentType: "image/webp" },
      customMetadata: { visibility: "private", source: "protected-vip-atelier-preview", atelierMediaId: media.id },
    });
    const stored = await bucket.head(media.objectKey);
    if (!stored?.size) throw new Error(`Deposito locale non verificato: ${media.id}`);
  }
  console.log(JSON.stringify({ mode: "local-r2", stored: prepared.length, originalsChanged }, null, 2));
} finally {
  await miniflare.dispose();
}
