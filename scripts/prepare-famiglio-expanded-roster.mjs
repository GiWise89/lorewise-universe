import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourceRoot = path.join(root, "tamagochi asset", "lavorazione");
const outputRoot = path.join(root, "public", "famiglio", "rebuild", "collection");
await mkdir(outputRoot, { recursive: true });

const cropRow = async (source, destination, cell, row, frames) => {
  await sharp(source)
    .extract({ left: 0, top: row * cell, width: frames * cell, height: cell })
    .png()
    .toFile(destination);
};

const repeatFrame = async (source, destination, cell, left, top, frames = 4) => {
  const frame = await sharp(source).extract({ left, top, width: cell, height: cell }).png().toBuffer();
  await sharp({ create: { width: cell * frames, height: cell, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(Array.from({ length: frames }, (_, index) => ({ input: frame, left: index * cell, top: 0 })))
    .png()
    .toFile(destination);
};

const dogs = [
  ["akita", "Dog-2-Akita", "Akita"],
  ["great-dane", "Dog-3-Great-Dane", "Great-Dane"],
  ["schnauzer", "Dog-4-Schnauzer", "Schnauzer"],
  ["saint-bernard", "Dog-5-Saint-Bernard", "Saint-Bernard"],
  ["husky", "Dog-6-Siberian-Husky", "Siberian-Husky"],
];

for (const [slug, folder, prefix] of dogs) {
  const destination = path.join(outputRoot, slug);
  const source = path.join(sourceRoot, "sorgenti", "Pet Dogs Pack", folder);
  const composite = path.join(sourceRoot, "sprite-generati", `dog-${slug === "husky" ? "siberian-husky" : slug}-azioni-composte-100px-final.png`);
  await mkdir(destination, { recursive: true });
  await copyFile(path.join(source, `${prefix}-${prefix === "Akita" ? "Idle" : "idle"}.png`), path.join(destination, "idle.png"));
  await copyFile(path.join(source, `${prefix}-walk.png`), path.join(destination, "walk.png"));
  await cropRow(composite, path.join(destination, "feed.png"), 100, 0, 8);
  await cropRow(composite, path.join(destination, "clean.png"), 100, 1, 8);
  await cropRow(composite, path.join(destination, "play.png"), 100, 2, 8);
  await cropRow(composite, path.join(destination, "care.png"), 100, 3, 8);
  await repeatFrame(path.join(source, `${prefix}-sitting.png`), path.join(destination, "sit.png"), 100, 0, 0);
  await copyFile(path.join(source, `${prefix}-licking1.png`), path.join(destination, "groom.png"));
  await repeatFrame(path.join(source, `${prefix}-sleeping.png`), path.join(destination, "sleep.png"), 100, 0, 0);
  await repeatFrame(path.join(source, `${prefix}-sleeping.png`), path.join(destination, "sleep-calm.png"), 100, 0, 0);
}

const crowSource = path.join(sourceRoot, "sorgenti", "Crow.png");
const crowComposite = path.join(sourceRoot, "sprite-generati", "crow-azioni-composte-48px-final.png");
const crowDestination = path.join(outputRoot, "crow");
await mkdir(crowDestination, { recursive: true });
await cropRow(crowSource, path.join(crowDestination, "idle.png"), 48, 0, 7);
await cropRow(crowSource, path.join(crowDestination, "walk.png"), 48, 5, 7);
await cropRow(crowComposite, path.join(crowDestination, "feed.png"), 48, 0, 7);
await cropRow(crowComposite, path.join(crowDestination, "clean.png"), 48, 1, 7);
await cropRow(crowComposite, path.join(crowDestination, "play.png"), 48, 2, 7);
await cropRow(crowComposite, path.join(crowDestination, "care.png"), 48, 3, 7);
await repeatFrame(crowSource, path.join(crowDestination, "sit.png"), 48, 0, 48);
await cropRow(crowSource, path.join(crowDestination, "groom.png"), 48, 3, 7);
await repeatFrame(crowSource, path.join(crowDestination, "sleep.png"), 48, 4 * 48, 48);
await repeatFrame(crowSource, path.join(crowDestination, "sleep-calm.png"), 48, 4 * 48, 48);

const wolfDestination = path.join(outputRoot, "wolf");
const wolfVariants = ["abyssal", "blackshuck", "blight", "bloodmoon", "bracken", "frostbite", "greymane", "hellhound", "lupa", "moorhound", "spectral", "sunlit", "timber", "void", "wildwood", "winterborn"];
for (const variant of wolfVariants) {
  const wolfSource = path.join(sourceRoot, "sorgenti", "Wolves", "wolf-colorways", `wolf-${variant}.png`);
  const wolfComposite = path.join(sourceRoot, "sprite-generati", `wolf-${variant}-azioni-composte-48px-final.png`);
  const destination = variant === "greymane" ? wolfDestination : path.join(wolfDestination, "variants", variant);
  await mkdir(destination, { recursive: true });
  await repeatFrame(wolfSource, path.join(destination, "idle.png"), 48, 48, 0);
  await cropRow(wolfSource, path.join(destination, "walk.png"), 48, 6, 4);
  await cropRow(wolfComposite, path.join(destination, "feed.png"), 48, 0, 5);
  await cropRow(wolfComposite, path.join(destination, "clean.png"), 48, 1, 5);
  await cropRow(wolfComposite, path.join(destination, "play.png"), 48, 2, 5);
  await cropRow(wolfComposite, path.join(destination, "care.png"), 48, 3, 5);
  await repeatFrame(wolfSource, path.join(destination, "sit.png"), 48, 0, 16 * 48);
  await cropRow(wolfSource, path.join(destination, "groom.png"), 48, 8, 5);
  await cropRow(wolfSource, path.join(destination, "sleep.png"), 48, 18, 4);
  await cropRow(wolfSource, path.join(destination, "sleep-calm.png"), 48, 18, 4);
}

console.log(`Preparati ${dogs.length + 2} Famigli aggiuntivi e ${wolfVariants.length} varianti del lupo con 10 sequenze ciascuno.`);
