import sharp from "sharp";

const source = "public/famiglio/rebuild/effects/minigame-jump-platform-v5-master.png";
const outputRoot = "public/famiglio/rebuild/effects";
const variants = [
  ["short", 600, 240],
  ["medium", 880, 240],
  ["long", 1200, 240],
];

const trimmed = await sharp(source).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
for (const [name, width, height] of variants) {
  await sharp(trimmed)
    .resize(width, height - 10, { fit: "fill", kernel: sharp.kernel.nearest })
    .extend({ top: 0, right: 6, bottom: 10, left: 6, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ palette: true, colours: 256 })
    .toFile(`${outputRoot}/minigame-jump-platform-${name}-v5.png`);
}

console.log("Tre piattaforme v5 create con il bordo calpestabile sul primo pixel visibile.");
