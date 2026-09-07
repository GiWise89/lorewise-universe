import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const source = resolve(process.argv[2] ?? "famigli-del-nexus/source-assets/generated-actions/cute-toilet-waste-v1.png");
const destination = resolve(process.argv[3] ?? "public/famiglio/rebuild/effects/cute-toilet-waste-v1.png");
const metadata = await sharp(source).metadata();
if (!metadata.width || !metadata.height) throw new Error("Impossibile leggere lo sprite sorgente.");

const frameCount = 4;
const sourceFrameWidth = Math.floor(metadata.width / frameCount);
const outputFrameSize = 128;
const frames = [];

for (let index = 0; index < frameCount; index += 1) {
  const left = index * sourceFrameWidth;
  const width = index === frameCount - 1 ? metadata.width - left : sourceFrameWidth;
  const extracted = await sharp(source)
    .extract({ left, top: 0, width, height: metadata.height })
    .png()
    .toBuffer();
  const frame = await sharp(extracted)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize(104, 104, {
      fit: "contain",
      kernel: sharp.kernel.nearest,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      top: 12,
      bottom: 12,
      left: 12,
      right: 12,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  frames.push({ input: frame, left: index * outputFrameSize, top: 0 });
}

await mkdir(dirname(destination), { recursive: true });
await sharp({
  create: {
    width: outputFrameSize * frameCount,
    height: outputFrameSize,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite(frames)
  .png({ compressionLevel: 9, palette: true })
  .toFile(destination);

console.log(`Sprite bisogni preparato: ${destination}`);
