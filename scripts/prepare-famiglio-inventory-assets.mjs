import { mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const purchasedRoot = "public/famiglio/rebuild/purchased";
const outputRoot = "public/famiglio/rebuild/inventory";
mkdirSync(outputRoot, { recursive: true });

const jobs = [
  { source: "animalpack-cat-bowls.png", output: "moon-meal.png", crop: { left: 0, top: 0, width: 16, height: 16 } },
  { source: "animalpack-dog-food-bowls.png", output: "moon-meal-dog.png", crop: { left: 0, top: 0, width: 16, height: 16 } },
  { source: "animalpack-herbivore-bowl.png", output: "moon-meal-herbivore.png", crop: { left: 0, top: 0, width: 16, height: 16 } },
  { source: "animalpack-herbivore-bowl.png", output: "moon-meal-seeds.png", crop: { left: 32, top: 0, width: 16, height: 16 } },
  { source: "animalpack-bamboo.png", output: "moon-meal-bamboo.png", crop: { left: 128, top: 0, width: 64, height: 96 } },
  { source: "animalpack-blue-ball.png", output: "blue-ball.png", crop: { left: 0, top: 0, width: 20, height: 16 } },
  { source: "animalpack-cat-bed-purple.png", output: "purple-bed.png", crop: { left: 8, top: 19, width: 50, height: 28 } },
  { source: "franuka-interior-32.png", output: "young-pantry.png", crop: { left: 0, top: 384, width: 64, height: 96 } },
  { source: "franuka-magic-lantern-purple.png", output: "bond-lantern.png", crop: { left: 0, top: 0, width: 32, height: 32 } },
  { source: "franuka-interior-32.png", output: "cleansing-tonic.png", crop: { left: 832, top: 512, width: 32, height: 32 } },
  { source: "franuka-gramophone.png", output: "arcane-gramophone.png", crop: { left: 0, top: 0, width: 64, height: 64 } },
  { source: "franuka-magic-lantern-blue.png", output: "prism-lantern.png", crop: { left: 0, top: 0, width: 32, height: 32 } },
];

for (const job of jobs) {
  await sharp(path.join(purchasedRoot, job.source))
    .extract(job.crop)
    .png({ palette: true, colours: 64, dither: 0 })
    .toFile(path.join(outputRoot, job.output));
}

console.log(`Preparati ${jobs.length} oggetti inventario dagli asset acquistati.`);
