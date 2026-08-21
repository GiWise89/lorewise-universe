import path from "node:path";
import sharp from "sharp";

const dir = path.resolve("vip media/giochi/the-wound-remembers/il-rogo-delle-dieci-porte/dossier");
const files = [
  ["vharokh-sagoma-trasparente-v2.png", "vharokh-sagoma-trasparente-v3.png"],
  ["velisara-sagoma-trasparente-v2.png", "velisara-sagoma-trasparente-v3.png"],
];

function cleanEdges(data, width, height) {
  const output = Buffer.from(data);
  const alpha = new Uint8Array(width * height);
  for (let index = 0; index < alpha.length; index += 1) alpha[index] = data[index * 4 + 3];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixel = y * width + x;
      const sourceAlpha = alpha[pixel];
      if (sourceAlpha === 0 || sourceAlpha === 255) continue;

      let minimumAlpha = sourceAlpha;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const sx = x + dx;
          const sy = y + dy;
          if (sx < 0 || sy < 0 || sx >= width || sy >= height) minimumAlpha = 0;
          else minimumAlpha = Math.min(minimumAlpha, alpha[sy * width + sx]);
        }
      }

      let red = 0;
      let green = 0;
      let blue = 0;
      let samples = 0;
      for (let radius = 1; radius <= 4 && samples === 0; radius += 1) {
        for (let dy = -radius; dy <= radius; dy += 1) {
          for (let dx = -radius; dx <= radius; dx += 1) {
            const sx = x + dx;
            const sy = y + dy;
            if (sx < 0 || sy < 0 || sx >= width || sy >= height) continue;
            const sample = sy * width + sx;
            if (alpha[sample] < 245) continue;
            const channel = sample * 4;
            red += data[channel];
            green += data[channel + 1];
            blue += data[channel + 2];
            samples += 1;
          }
        }
      }

      const channel = pixel * 4;
      if (samples > 0) {
        output[channel] = Math.round(red / samples);
        output[channel + 1] = Math.round(green / samples);
        output[channel + 2] = Math.round(blue / samples);
      }
      output[channel + 3] = Math.round(minimumAlpha * 0.72 + sourceAlpha * 0.28);
    }
  }
  return output;
}

for (const [source, target] of files) {
  const { data, info } = await sharp(path.join(dir, source)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  await sharp(cleanEdges(data, info.width, info.height), { raw: info })
    .png({ compressionLevel: 9 })
    .toFile(path.join(dir, target));
  console.log(`${source} -> ${target} (${info.width}x${info.height})`);
}
