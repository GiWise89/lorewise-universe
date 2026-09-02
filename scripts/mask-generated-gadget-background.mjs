import sharp from "sharp";
import { dirname, join } from "node:path";
import { copyFile, mkdir, rename } from "node:fs/promises";

const appearances = ["moon-rabbit", "pocket-dragon", "ember-red-panda", "astral-fawn", "nexus-axolotl"];
const gadgets = ["berretto-stellare", "sciarpa-crepuscolo", "mantellina-custode"];

for (const appearanceId of appearances) {
  const base = join(process.cwd(), "public", "famiglio", "sprites", "premium", `${appearanceId}-master.png`);
  for (const gadgetId of gadgets) {
    const target = join(process.cwd(), "public", "famiglio", "gadgets", gadgetId, appearanceId, "actions.png");
    const output = `${target}.masked.png`;
    const metadata = await sharp(target).metadata();
    const width = metadata.width ?? 1;
    const height = metadata.height ?? 1;
    const { data: generated, info } = await sharp(target).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { data: basePixels, info: baseInfo } = await sharp(base)
      .resize(width, height, { fit: "fill", kernel: "nearest" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const baseAlpha = Buffer.alloc(width * height);
    for (let pixel = 0; pixel < width * height; pixel += 1) {
      baseAlpha[pixel] = basePixels[pixel * baseInfo.channels + 3] > 8 ? 255 : 0;
    }
    const mask = await sharp(baseAlpha, { raw: { width, height, channels: 1 } })
      .greyscale()
      // Sharp's morphology treats the dark exterior as foreground: erode
      // expands the white sprite silhouette and leaves room for the garment.
      .erode(Math.max(8, Math.round(width / 132)))
      .raw()
      .toBuffer();
    for (let pixel = 0; pixel < width * height; pixel += 1) {
      // Image generation preserves the dressed sprite in RGB, but a previous
      // cleanup pass can leave the alpha channel almost transparent.  The
      // silhouette comes from the matching complete base animation and is
      // deliberately dilated to include the garment, so it must replace the
      // generated alpha rather than be intersected with it.
      generated[pixel * info.channels + 3] = mask[pixel];
    }
    await mkdir(dirname(output), { recursive: true });
    await sharp(generated, { raw: info }).png().toFile(output);
    await rename(output, target);
    const master = join(dirname(target), `${appearanceId}-master.png`);
    await copyFile(target, master);
    console.log(target);
  }
}
