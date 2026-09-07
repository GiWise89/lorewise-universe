import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourceRoot = path.join(root, ".tmp", "famiglio-market-icons", "rpg-fantasy-item-icons-pack");
const destinationRoot = path.join(root, "public", "famiglio", "rebuild", "market", "items");
await mkdir(destinationRoot, { recursive: true });

const icons = {
  "Health Potion.png": "comfort-balm.png",
  "Stamina Potion.png": "energy-biscuit.png",
  "Magic Feather.png": "magic-feather.png",
  "Crystal Ball.png": "crystal-orb.png",
  "Magic Compass.png": "moon-compass.png",
  "Coin Pouch.png": "sigil-pouch.png",
  "Phoenix Feather.png": "phoenix-feather.png",
  "Runic Tablet.png": "runic-tablet.png",
  "Soul Gem.png": "soul-gem.png",
  "Mystic Hourglass.png": "memory-hourglass.png",
  "Enchanted Crown.png": "memory-crown.png",
  "Ancient Relic.png": "ancient-relic.png",
  "Healing Scroll.png": "care-kit.png",
};

for (const [source, destination] of Object.entries(icons)) {
  await sharp(path.join(sourceRoot, source))
    .resize(96, 96, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: sharp.kernel.lanczos3 })
    .png()
    .toFile(path.join(destinationRoot, destination));
}

console.log(`Preparati ${Object.keys(icons).length} articoli con icone distinte.`);
