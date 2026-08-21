import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Miniflare } from "miniflare";
import sharp from "sharp";
import { VIP_ARTWORKS_PRIVATE } from "../data/vip-artworks.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectory = path.join(root, "vip media", "opere");
const outputDirectory = path.join(root, "tmp", "vip-art-previews");
const execute = process.argv.includes("--execute-local");

function watermark(width, height) {
  const diagonalSize = Math.max(24, Math.round(Math.min(width, height) * 0.032));
  const footerSize = Math.max(15, Math.round(Math.min(width, height) * 0.017));
  const repeat = Array.from({ length: 5 }, (_, index) => `<text x="50%" y="${18 + index * 19}%">LOREWISE UNIVERSE | GIWISE STUDIO | ANTEPRIMA PROTETTA</text>`).join("");
  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <g transform="rotate(-24 ${width / 2} ${height / 2})" fill="rgba(255,255,255,.22)" stroke="rgba(0,0,0,.2)" stroke-width="1" text-anchor="middle" font-family="Arial, sans-serif" font-size="${diagonalSize}" font-weight="700">${repeat}</g>
    <rect x="0" y="${height - footerSize * 2.4}" width="${width}" height="${footerSize * 2.4}" fill="rgba(0,0,0,.62)"/>
    <text x="50%" y="${height - footerSize * .75}" fill="rgba(255,255,255,.92)" text-anchor="middle" font-family="Arial, sans-serif" font-size="${footerSize}" font-weight="700">(C) GIWISE STUDIO | LOREWISE UNIVERSE</text>
  </svg>`);
}

fs.mkdirSync(outputDirectory, { recursive: true });
const prepared = [];
for (const artwork of VIP_ARTWORKS_PRIVATE) {
  const sourcePath = path.join(sourceDirectory, artwork.sourceFile);
  if (!fs.existsSync(sourcePath)) throw new Error(`Originale non trovato: ${artwork.sourceFile}`);
  const resized = await sharp(sourcePath).rotate().resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true }).toBuffer({ resolveWithObject: true });
  const outputPath = path.join(outputDirectory, `${artwork.id}.webp`);
  await sharp(resized.data).composite([{ input: watermark(resized.info.width, resized.info.height), blend: "over" }]).webp({ quality: 82, effort: 5 }).toFile(outputPath);
  prepared.push({ artwork, outputPath, size: fs.statSync(outputPath).size });
}

if (!execute) {
  console.log(JSON.stringify({ mode: "dry-run", prepared: prepared.length, outputDirectory }, null, 2));
  console.log("Gli originali non sono stati modificati. Ripeti con --execute-local per depositare le anteprime nell'R2 locale.");
  process.exit(0);
}

const miniflare = new Miniflare({
  resourcePersistencePath: path.join(root, ".wrangler", "state", "v3"),
  workers: [{
    config: {
      name: "lorewise-vip-art-local",
      type: "worker",
      compatibilityDate: "2026-08-21",
      manifest: {
        mainModule: "index.js",
        modules: { "index.js": { type: "esm", contents: "export default { async fetch() { return new Response('LoreWise VIP art'); } }" } },
      },
      env: { COMMISSION_UPLOADS: { type: "r2", name: "site-creator-r2" } },
    },
  }],
});

try {
  const bucket = await miniflare.getR2Bucket("COMMISSION_UPLOADS");
  for (const { artwork, outputPath } of prepared) {
    const objectKey = `vip-zone/art/previews/${artwork.id}.webp`;
    await bucket.put(objectKey, fs.readFileSync(outputPath), {
      httpMetadata: { contentType: "image/webp" },
      customMetadata: { visibility: "private", source: "protected-vip-preview", artworkCode: artwork.code },
    });
    const stored = await bucket.head(objectKey);
    if (!stored?.size) throw new Error(`Deposito locale non verificato: ${artwork.code}`);
  }
  console.log(JSON.stringify({ mode: "local-r2", stored: prepared.length, originalsChanged: false }, null, 2));
} finally {
  await miniflare.dispose();
}
