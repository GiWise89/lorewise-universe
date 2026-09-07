import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const root = process.cwd();
const sourcePath = path.join(root, "famigli-del-nexus", "source-assets", "generated-actions", "fiddle-dog-battle-imagegen-v3-source.png");
const cleanedSourcePath = path.join(root, "famigli-del-nexus", "source-assets", "generated-actions", "fiddle-dog-battle-imagegen-v3.png");
const { data, info } = await sharp(sourcePath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const rgba = Buffer.alloc(info.width * info.height * 4);

for (let pixel = 0; pixel < info.width * info.height; pixel += 1) {
  const sourceOffset = pixel * 3;
  const targetOffset = pixel * 4;
  const red = data[sourceOffset];
  const green = data[sourceOffset + 1];
  const blue = data[sourceOffset + 2];
  rgba[targetOffset] = red;
  rgba[targetOffset + 1] = green;
  rgba[targetOffset + 2] = blue;
  rgba[targetOffset + 3] = Math.max(red, green, blue) <= 5 ? 0 : 255;
}

const transparentAtlas = await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
await writeFile(cleanedSourcePath, transparentAtlas);

const columns = 4;
const rows = 4;
const cellWidth = Math.floor(info.width / columns);
const cellHeight = Math.floor(info.height / rows);
const seen = new Uint8Array(info.width * info.height);
const assigned = Array.from({ length: columns * rows }, () => []);
for (let start = 0; start < seen.length; start += 1) {
  if (seen[start] || rgba[start * 4 + 3] === 0) continue;
  const stack = [start];
  const pixels = [];
  let sumX = 0;
  let sumY = 0;
  seen[start] = 1;
  while (stack.length) {
    const pixel = stack.pop();
    const x = pixel % info.width;
    const y = Math.floor(pixel / info.width);
    pixels.push(pixel);
    sumX += x;
    sumY += y;
    for (let yy = Math.max(0, y - 1); yy <= Math.min(info.height - 1, y + 1); yy += 1) {
      for (let xx = Math.max(0, x - 1); xx <= Math.min(info.width - 1, x + 1); xx += 1) {
        const next = yy * info.width + xx;
        if (!seen[next] && rgba[next * 4 + 3] > 0) {
          seen[next] = 1;
          stack.push(next);
        }
      }
    }
  }
  if (pixels.length < 6) continue;
  const centerX = sumX / pixels.length;
  const centerY = sumY / pixels.length;
  const column = Math.max(0, Math.min(columns - 1, Math.floor(centerX / cellWidth)));
  const row = Math.max(0, Math.min(rows - 1, Math.floor(centerY / cellHeight)));
  assigned[row * columns + column].push({ pixels, centerX, centerY });
}

const frames = [];
for (let frameIndex = 0; frameIndex < assigned.length; frameIndex += 1) {
  const components = assigned[frameIndex];
  const expectedX = (frameIndex % columns + .5) * cellWidth;
  const expectedY = (Math.floor(frameIndex / columns) + .5) * cellHeight;
  const localComponents = components.filter((component) =>
    Math.abs(component.centerX - expectedX) <= cellWidth * .38
    && Math.abs(component.centerY - expectedY) <= cellHeight * .48,
  );
  const pixels = localComponents.flatMap((component) => component.pixels);
  if (!pixels.length) throw new Error("Cella ImageGen priva del Cane musicista.");
  let minX = info.width;
  let minY = info.height;
  let maxX = 0;
  let maxY = 0;
  for (const pixel of pixels) {
    const x = pixel % info.width;
    const y = Math.floor(pixel / info.width);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const cell = Buffer.alloc(width * height * 4);
  for (const pixel of pixels) {
    const sourceX = pixel % info.width;
    const sourceY = Math.floor(pixel / info.width);
    const sourceOffset = pixel * 4;
    const targetOffset = ((sourceY - minY) * width + sourceX - minX) * 4;
    rgba.copy(cell, targetOffset, sourceOffset, sourceOffset + 4);
  }
  frames.push(await sharp(cell, { raw: { width, height, channels: 4 } }).png().toBuffer());
}

const actionFrames = {
  entrance: [4, 5, 6, 7], idle: [0, 1, 2, 3], run: [4, 5, 6, 7],
  physical: [8, 9, 8, 9], magic: [10, 13, 10, 13], attack: [8, 9, 8, 9],
  technique: [13, 13, 13, 13], guard: [12, 12, 12, 12], hit: [14, 14, 14, 14],
  win: [10, 10, 10, 10], lose: [15, 15, 15, 15], victory: [13, 13, 13, 13], exhausted: [15, 15, 15, 15],
};

for (const stage of ["cucciolo", "giovane", "adulto"]) {
  for (const collection of ["battle-imagegen", "battle-v2"]) {
    const isRuntimeStrip = collection === "battle-v2";
    const frameSize = isRuntimeStrip ? 160 : 128;
    const frameCount = isRuntimeStrip ? 12 : 4;
    const bodySize = isRuntimeStrip ? 136 : 112;
    const floorY = isRuntimeStrip ? 146 : 124;
    const motionOffsets = [0, 1, 2, 1, 0, -1, -2, -1, 0, 1, 0, -1];
    const outputRoot = path.join(root, "public", "famiglio", "rebuild", "collection", "fiddle-dog", "growth", stage, collection);
    await mkdir(outputRoot, { recursive: true });
    for (const [action, indexes] of Object.entries(actionFrames)) {
      const timeline = Array.from({ length: frameCount }, (_, index) => indexes[index % indexes.length]);
      const rendered = await Promise.all(timeline.map(async (index, timelineIndex) => {
        let resized = await sharp(frames[index]).resize(bodySize, bodySize, { fit: "inside", kernel: "nearest", withoutEnlargement: false }).png().toBuffer();
        if (!isRuntimeStrip && (action === "entrance" || action === "run")) {
          const locomotionMetadata = await sharp(resized).metadata();
          resized = await sharp(resized).resize(
            locomotionMetadata.width ?? bodySize,
            Math.round((locomotionMetadata.height ?? bodySize) * 1.06),
            { fit: "fill", kernel: "nearest" },
          ).png().toBuffer();
        }
        const metadata = await sharp(resized).metadata();
        return {
          input: resized,
          left: Math.round((frameSize - (metadata.width ?? bodySize)) / 2) + (isRuntimeStrip ? motionOffsets[timelineIndex] : 0),
          top: floorY - (metadata.height ?? bodySize),
        };
      }));
      const sheet = await sharp({ create: { width: frameSize * frameCount, height: frameSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite(rendered.map((entry, index) => ({ ...entry, left: entry.left + index * frameSize })))
        .png({ palette: true, colours: 256 })
        .toBuffer();
      await writeFile(path.join(outputRoot, `${action}.png`), sheet);
    }
  }
}
console.log("Cane musicista ImageGen v3 normalizzato: 16 pose, 13 azioni, 3 crescite, atlante trasparente.");
