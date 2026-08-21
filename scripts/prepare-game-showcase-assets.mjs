import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const documentsRoot = path.resolve(projectRoot, "..");
const woundRoot = path.join(documentsRoot, "Rpg Card Gaming", "dark-card-game");
const fuoriTramaRoot = path.join(documentsRoot, "proggetti GiWise Studio", "LoreWise App", "lorewise-v1-starter", "fuori-trama-next");
const outputRoot = path.join(projectRoot, "public", "games");

const assets = [
  {
    source: path.join(woundRoot, "public", "assets", "brand", "the-wound-remembers-logo-transparent.png"),
    output: path.join(outputRoot, "the-wound-remembers", "logo.webp"),
    width: 1600,
    quality: 90,
  },
  {
    source: path.join(woundRoot, "public", "assets", "arena", "cattedrale-respiro-nero.png"),
    output: path.join(outputRoot, "the-wound-remembers", "arena.webp"),
    width: 2000,
    quality: 84,
  },
  {
    source: path.join(woundRoot, "public", "assets", "brand", "sanctuary-premium.png"),
    output: path.join(outputRoot, "the-wound-remembers", "sanctuary.webp"),
    width: 1600,
    quality: 86,
  },
  {
    source: path.join(woundRoot, "artifacts", "orveth-arena-2560x1440.png"),
    output: path.join(outputRoot, "the-wound-remembers", "gameplay-battle.webp"),
    width: 2560,
    quality: 90,
  },
  {
    source: path.join(woundRoot, "artifacts", "decks-2560x1440.png"),
    output: path.join(outputRoot, "the-wound-remembers", "gameplay-decks.webp"),
    width: 2560,
    quality: 90,
  },
  {
    source: path.join(woundRoot, "artifacts", "campaign-act-10-2560x1440.png"),
    output: path.join(outputRoot, "the-wound-remembers", "gameplay-campaign.webp"),
    width: 2560,
    quality: 90,
  },
  {
    source: path.join(woundRoot, "artifacts", "expedition-2560x1440.png"),
    output: path.join(outputRoot, "the-wound-remembers", "gameplay-expedition.webp"),
    width: 2560,
    quality: 90,
  },
  {
    source: path.join(fuoriTramaRoot, "public", "media", "cyberpunk-system", "v1", "nexus-chamber-16x9-v1.png"),
    output: path.join(outputRoot, "lorewise-fuori-trama-next", "nexus-chamber.webp"),
    width: 2000,
    quality: 86,
  },
  {
    source: path.join(fuoriTramaRoot, "public", "media", "campaign-ui", "v3", "grand-atlas-chamber-v1.png"),
    output: path.join(outputRoot, "lorewise-fuori-trama-next", "atlas-chamber.webp"),
    width: 2000,
    quality: 86,
  },
  {
    source: path.join(fuoriTramaRoot, "public", "media", "battle-table", "premium-table-v1.png"),
    output: path.join(outputRoot, "lorewise-fuori-trama-next", "battle-table.webp"),
    width: 2000,
    quality: 86,
  },
];

for (const asset of assets) {
  await mkdir(path.dirname(asset.output), { recursive: true });
  await sharp(asset.source)
    .resize({ width: asset.width, withoutEnlargement: true })
    .webp({ quality: asset.quality, effort: 5 })
    .toFile(asset.output);
  console.log(path.relative(projectRoot, asset.output));
}
