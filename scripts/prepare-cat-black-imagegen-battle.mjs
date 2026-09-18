import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const root = process.cwd();
const sourcePath = path.join(root, "famigli-del-nexus", "source-assets", "generated-actions", "cat-black-battle-imagegen-v3.png");
const columns = 4;
const rows = 4;
const frameSize = 320;
const frameCount = 12;
const floorY = 292;
const stageBodySize = { cucciolo: 184, giovane: 216, adulto: 248 };
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

const metadata = await sharp(sourcePath).metadata();
if (!metadata.width || !metadata.height || !metadata.hasAlpha) {
  throw new Error("L'atlante ImageGen del gatto nero deve essere un PNG trasparente.");
}

const cellWidth = Math.floor(metadata.width / columns);
const cellHeight = Math.floor(metadata.height / rows);
const frames = [];
for (let row = 0; row < rows; row += 1) {
  for (let column = 0; column < columns; column += 1) {
    const width = column === columns - 1 ? metadata.width - column * cellWidth : cellWidth;
    const height = row === rows - 1 ? metadata.height - row * cellHeight : cellHeight;
    const cell = await sharp(sourcePath)
      .extract({ left: column * cellWidth, top: row * cellHeight, width, height })
      .png()
      .toBuffer();
    const frame = await sharp(cell).trim({ background: transparent, threshold: 8 }).png().toBuffer();
    const stats = await sharp(frame).stats();
    if (stats.channels[3]?.max === 0) throw new Error(`Posa vuota nella cella ${row + 1},${column + 1}.`);
    frames.push(frame);
  }
}

const actionFrames = {
  entrance: [4, 5, 6, 7], idle: [0, 1, 2, 3], run: [4, 5, 6, 7],
  physical: [8, 9, 8, 9], magic: [10, 11, 10, 11], attack: [8, 9, 8, 9],
  technique: [10, 11, 10, 11], guard: [12, 12, 12, 12], hit: [13, 13, 13, 13],
  win: [14, 14, 14, 14], lose: [15, 15, 15, 15], victory: [14, 14, 14, 14], exhausted: [15, 15, 15, 15],
};

const motionOffsets = [0, 2, 4, 2, 0, -2, -4, -2, 0, 2, 0, -2];
for (const [stage, bodySize] of Object.entries(stageBodySize)) {
  const outputRoot = path.join(root, "public", "famiglio", "rebuild", "collection", "cat", "growth", stage, "battle-v3", "variants", "black");
  await mkdir(outputRoot, { recursive: true });
  for (const [action, indexes] of Object.entries(actionFrames)) {
    const timeline = Array.from({ length: frameCount }, (_, index) => indexes[index % indexes.length]);
    const rendered = await Promise.all(timeline.map(async (sourceIndex, index) => {
      const input = await sharp(frames[sourceIndex])
        .resize(bodySize, bodySize, { fit: "inside", kernel: "nearest", withoutEnlargement: true })
        .png()
        .toBuffer();
      const size = await sharp(input).metadata();
      return {
        input,
        left: index * frameSize + Math.round((frameSize - (size.width ?? bodySize)) / 2) + motionOffsets[index],
        top: floorY - (size.height ?? bodySize),
      };
    }));
    const strip = await sharp({ create: { width: frameSize * frameCount, height: frameSize, channels: 4, background: transparent } })
      .composite(rendered)
      .png({ compressionLevel: 9 })
      .toBuffer();
    await writeFile(path.join(outputRoot, `${action}.png`), strip);
  }
}

console.log("Gatto nero ImageGen v3: 16 pose ridisegnate, 13 animazioni e 3 crescite preparate.");
