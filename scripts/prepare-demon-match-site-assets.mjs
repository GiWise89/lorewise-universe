import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const sourceRoot = "C:/Users/Luigi/Documents/proggetti GiWise Studio/Demon Match 3 Android/app/src/main/assets/media/generated";
const desktopGameplayRoot = "C:/Users/Luigi/Desktop/gamplay";
const generatedBackdrop = "C:/Users/Luigi/.codex/generated_images/01a03b61-c0db-78c1-bb3c-675d84390cde/exec-e0862d21-7dc7-4cf3-89d4-be480fa69152.png";
const outputRoot = path.join(process.cwd(), "public", "games", "demon-match-three");
const privateOutputRoot = path.join(process.cwd(), "tmp", "demon-match-vip-previews");

const assets = [
  { source: generatedBackdrop, output: "gameplay-portal-backdrop-v1.webp" },
  { source: path.join(desktopGameplayRoot, "01-mappa-atto-1.png"), output: "gameplay-map-act-1-v1.webp" },
  { source: path.join(desktopGameplayRoot, "02-missione-4-altare-cremisi.png"), output: "gameplay-mission-4-brief-v1.webp" },
  { source: path.join(desktopGameplayRoot, "03-gameplay-power-up-pronti.png"), output: "gameplay-powerup-ready-v1.webp" },
  { source: path.join(desktopGameplayRoot, "04-fusione-onda-cremisi.png"), output: "gameplay-crimson-wave-v1.webp" },
  { source: path.join(desktopGameplayRoot, "05-gameplay-dopo-cascata.png"), output: "gameplay-after-cascade-v1.webp" },
];

const privateAssets = [
  { source: path.join(sourceRoot, "factions/faction-choice-neutral-v1.png"), output: "nora-varek-duality-v1.webp" },
  { source: path.join(sourceRoot, "characters/nora-order-of-dawn-v1.png"), output: "nora-order-of-dawn-v1.webp" },
  { source: path.join(sourceRoot, "characters/varek-shadow-lineage-concept-v1.png"), output: "varek-shadow-lineage-v1.webp" },
];

await mkdir(outputRoot, { recursive: true });
await mkdir(privateOutputRoot, { recursive: true });

async function prepare(assetList, destinationRoot) {
  for (const { source, output } of assetList) {
  await sharp(source)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true, fit: "inside" })
    .webp({ quality: 88, alphaQuality: 92, effort: 5 })
      .toFile(path.join(destinationRoot, output));
  console.log(`${path.basename(source)} -> ${output}`);
  }
}

await prepare(assets, outputRoot);
await prepare(privateAssets, privateOutputRoot);
