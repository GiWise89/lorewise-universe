import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourceRoot = path.join(root, "public", "famiglio", "rebuild", "dinosaur-atlases");
const outputRoot = path.join(root, "public", "famiglio", "rebuild", "collection");
const dinosaurs = ["tyrannosaurus", "triceratops", "velociraptor", "stegosaurus", "brachiosaurus", "ankylosaurus", "spinosaurus", "parasaurolophus", "pteranodon", "dilophosaurus", "carnotaurus", "pachycephalosaurus"];
const actionFrames = { idle: 0, walk: 1, feed: 2, play: 3, clean: 4, care: 5, sit: 6, groom: 7, sleep: 8, "sleep-calm": 9 };

for (const id of dinosaurs) {
  const source = path.join(sourceRoot, `${id}.png`);
  const metadata = await sharp(source).metadata();
  const cellWidth = Math.floor(metadata.width / 10);
  const destination = path.join(outputRoot, id);
  await mkdir(destination, { recursive: true });
  for (const [action, index] of Object.entries(actionFrames)) {
    const left = Math.min(index * cellWidth, metadata.width - cellWidth);
    const cropTop = Math.floor(metadata.height * .16);
    const cropHeight = Math.floor(metadata.height * .56);
    const frame = await sharp(source)
      .extract({ left, top: cropTop, width: cellWidth, height: cropHeight })
      .resize(112, 112, { fit: "contain", kernel: "nearest", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({ top: 8, bottom: 8, left: 8, right: 8, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    await sharp({ create: { width: 512, height: 128, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([0, 1, 2, 3].map((slot) => ({ input: frame, left: slot * 128, top: 0 })))
      .png()
      .toFile(path.join(destination, `${action}.png`));
  }
}

console.log(`Preparati ${dinosaurs.length} dinosauri con dieci sequenze complete ciascuno.`);
