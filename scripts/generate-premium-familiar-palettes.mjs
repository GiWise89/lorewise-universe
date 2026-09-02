import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const variants = [
  ["moon-rabbit", "moon-rabbit-cocoa", 28, 1.08, .86], ["moon-rabbit", "moon-rabbit-dawn", 315, 1.16, 1.02],
  ["pocket-dragon", "pocket-dragon-coral", 55, 1.12, 1.04], ["pocket-dragon", "pocket-dragon-lagoon", 145, 1.08, 1.02],
  ["ember-red-panda", "ember-red-panda-midnight", 205, .92, .86], ["ember-red-panda", "ember-red-panda-sunrise", 32, 1.22, 1.08],
  ["astral-fawn", "astral-fawn-emerald", 95, 1.10, .98], ["astral-fawn", "astral-fawn-violet", 255, 1.08, .96],
  ["nexus-axolotl", "nexus-axolotl-snow", 180, .72, 1.28], ["nexus-axolotl", "nexus-axolotl-honey", 28, 1.12, 1.10],
];
const files = ["actions.png", "idle.png", "walk.png", "sit.png", "groom.png", "rest.png"];

for (const [sourceId, targetId, hue, saturation, brightness] of variants) {
  const sourceRoot = path.join(root, "public/famiglio/professional/animal-mega-pack", sourceId);
  const targetRoot = path.join(root, "public/famiglio/professional/animal-mega-pack", targetId);
  await fs.mkdir(targetRoot, { recursive: true });
  for (const file of files) {
    await sharp(path.join(sourceRoot, file)).modulate({ hue, saturation, brightness }).png().toFile(path.join(targetRoot, file));
  }
}
console.log(`Generate ${variants.length} palette premium complete.`);
