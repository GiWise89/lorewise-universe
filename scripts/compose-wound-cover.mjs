import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const documentsRoot = path.resolve(projectRoot, "..");
const woundRoot = path.join(documentsRoot, "Rpg Card Gaming", "dark-card-game");
const outputRoot = path.join(projectRoot, "public", "games", "the-wound-remembers");
const sourceArchiveRoot = path.join(projectRoot, "assets", "public-source-archive");

const sceneSource = path.join(sourceArchiveRoot, "games", "the-wound-remembers", "key-art-scene-v2.png");
const logoSource = path.join(woundRoot, "public", "assets", "brand", "the-wound-remembers-logo-v2.png");
const logoOutput = path.join(outputRoot, "logo-white-v2.webp");
const sceneOutput = path.join(outputRoot, "key-art-scene-4k-v3.webp");
const coverOutput = path.join(outputRoot, "key-art-cover-v2.webp");

const cards = [
  { title: "FERITA DEL MONDO", file: "ferita-del-mondo.webp", angle: -7, left: 165, top: 655 },
  { title: "ARCONTE DELLA FERITA", file: "arconte-ferita.webp", angle: 0, left: 830, top: 635 },
  { title: "TRONO D’OSSA", file: "trono-ossa.webp", angle: 7, left: 1495, top: 655 },
];

const escapeXml = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

async function extractLogo() {
  const { data, info } = await sharp(logoSource).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  for (let offset = 0; offset < data.length; offset += 4) {
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const greenDominance = green - Math.max(red, blue);

    if (green > 105 && greenDominance > 42) {
      data[offset + 3] = Math.max(0, 255 - Math.min(255, (greenDominance - 35) * 7));
    }
  }

  await sharp(data, { raw: info })
    .trim({ background: { r: 0, g: 255, b: 0, alpha: 0 } })
    .webp({ quality: 96, alphaQuality: 100, effort: 6 })
    .toFile(logoOutput);
}

async function createCard({ title, file, angle }) {
  const width = 340;
  const height = 470;
  const art = await sharp(path.join(woundRoot, "public", "assets", "cards", file))
    .resize(308, 382, { fit: "cover", position: "attention" })
    .webp({ quality: 92 })
    .toBuffer();
  const titleMarkup = escapeXml(title);
  const frame = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#f3dfae"/><stop offset=".38" stop-color="#7d261f"/>
          <stop offset=".7" stop-color="#e8b85f"/><stop offset="1" stop-color="#35100f"/>
        </linearGradient>
        <linearGradient id="plate" x1="0" y1="0" x2="0" y2="1">
          <stop stop-color="#251316"/><stop offset="1" stop-color="#090708"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="336" height="466" rx="20" fill="none" stroke="#2b0d0d" stroke-width="4"/>
      <rect x="8" y="8" width="324" height="454" rx="15" fill="none" stroke="url(#edge)" stroke-width="7"/>
      <rect x="16" y="16" width="308" height="382" rx="8" fill="none" stroke="#d9ae61" stroke-width="3"/>
      <path d="M24 405 H316 L326 447 Q326 456 316 456 H24 Q14 456 14 447 Z" fill="url(#plate)" stroke="#b77938" stroke-width="2"/>
      <text x="170" y="425" text-anchor="middle" fill="#f8e9c5" font-family="Georgia,serif" font-size="17" font-weight="700" letter-spacing=".7">${titleMarkup}</text>
      <text x="170" y="447" text-anchor="middle" fill="#d25c49" font-family="Arial,sans-serif" font-size="10" font-weight="700" letter-spacing="2.2">CARTA UFFICIALE</text>
    </svg>`);

  return sharp({ create: { width, height, channels: 4, background: { r: 9, g: 7, b: 8, alpha: 1 } } })
    .composite([{ input: art, left: 16, top: 16 }, { input: frame, left: 0, top: 0 }])
    .png()
    .rotate(angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
}

await mkdir(outputRoot, { recursive: true });
await extractLogo();

await sharp(sceneSource)
  .resize(3840, 2160, { fit: "cover", kernel: sharp.kernel.lanczos3 })
  .sharpen({ sigma: 0.8, m1: 1, m2: 2 })
  .webp({ quality: 96, effort: 6 })
  .toFile(sceneOutput);

const logo = await sharp(logoOutput).resize({ width: 760, withoutEnlargement: true }).png().toBuffer();
const cardLayers = await Promise.all(cards.map(async (card) => ({ input: await createCard(card), left: card.left, top: card.top })));

const vignette = Buffer.from(`
  <svg width="2000" height="1125" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="top" x1="0" y1="0" x2="0" y2="1">
        <stop stop-color="#020204" stop-opacity=".72"/><stop offset=".34" stop-color="#020204" stop-opacity="0"/>
      </linearGradient>
      <radialGradient id="edge">
        <stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".52"/>
      </radialGradient>
    </defs>
    <rect width="2000" height="1125" fill="url(#top)"/>
    <rect width="2000" height="1125" fill="url(#edge)"/>
  </svg>`);

await sharp(sceneSource)
  .resize(2000, 1125, { fit: "cover", kernel: sharp.kernel.lanczos3 })
  .composite([
    { input: vignette, left: 0, top: 0 },
    { input: logo, left: 620, top: 22 },
    ...cardLayers,
  ])
  .webp({ quality: 94, effort: 6 })
  .toFile(coverOutput);

console.log(path.relative(projectRoot, logoOutput));
console.log(path.relative(projectRoot, sceneOutput));
console.log(path.relative(projectRoot, coverOutput));
