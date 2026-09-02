import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const workspace = process.cwd();
const sourceDirectory = path.join(workspace, "campaign", "cyber-nexus", "originals");
const deliveryDirectory = path.join(workspace, "campaign", "cyber-nexus", "delivery");
const previewDirectory = path.join(workspace, "public", "promotions", "black-friday", "cyber-nexus");

const works = [
  "01-il-cuore-del-nexus",
  "02-la-citta-oltre-il-varco",
  "03-archivio-delle-stelle",
];

const variants = {
  desktop: { deliveryWidth: 3840, deliveryHeight: 2160, previewWidth: 1280, previewHeight: 720 },
  mobile: { deliveryWidth: 2160, deliveryHeight: 3840, previewWidth: 720, previewHeight: 1280 },
};

function watermark(width, height) {
  const centerSize = Math.max(24, Math.round(width * 0.028));
  const footerSize = Math.max(16, Math.round(width * 0.016));
  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(${width / 2} ${height / 2}) rotate(-22)">
      <rect x="-${width * .62}" y="-${centerSize * 1.55}" width="${width * 1.24}" height="${centerSize * 3.1}" fill="#05070d" fill-opacity=".56" />
      <text x="0" y="${centerSize * .34}" text-anchor="middle" fill="#fff2ca" fill-opacity=".88" font-family="Arial, sans-serif" font-size="${centerSize}" font-weight="700" letter-spacing="${Math.max(2, width * .0025)}">LOREWISE UNIVERSE | GIWISE STUDIO | ANTEPRIMA PROTETTA</text>
    </g>
    <rect x="0" y="${height - footerSize * 3}" width="${width}" height="${footerSize * 3}" fill="#05070d" fill-opacity=".72" />
    <text x="${width / 2}" y="${height - footerSize}" text-anchor="middle" fill="#fff2ca" fill-opacity=".92" font-family="Arial, sans-serif" font-size="${footerSize}" font-weight="700" letter-spacing="${Math.max(1, width * .0015)}">(C) GIWISE STUDIO | LOREWISE UNIVERSE</text>
  </svg>`);
}

await Promise.all([mkdir(deliveryDirectory, { recursive: true }), mkdir(previewDirectory, { recursive: true })]);

for (const work of works) {
  for (const [variant, size] of Object.entries(variants)) {
    const source = path.join(sourceDirectory, `${work}-${variant}.png`);
    const delivery = path.join(deliveryDirectory, `${work}-${variant}-4k.png`);
    const preview = path.join(previewDirectory, `${work}-${variant}-preview.webp`);

    await sharp(source)
      .resize(size.deliveryWidth, size.deliveryHeight, { fit: "contain", background: "#05070d", kernel: sharp.kernel.lanczos3 })
      .png({ compressionLevel: 9 })
      .toFile(delivery);

    await sharp(source)
      .resize(size.previewWidth, size.previewHeight, { fit: "contain", background: "#05070d", kernel: sharp.kernel.lanczos3 })
      .composite([{ input: watermark(size.previewWidth, size.previewHeight), gravity: "center" }])
      .webp({ quality: 82, effort: 6 })
      .toFile(preview);
  }
}

console.log(`Cyber Nexus: ${works.length * 2} delivery files and ${works.length * 2} protected previews created.`);
