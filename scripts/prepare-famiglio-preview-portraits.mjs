import { access, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const collectionRoot = path.join(root, "public", "famiglio", "rebuild", "collection");

async function findHouseIdleSheets() {
  const entries = await readdir(collectionRoot, { withFileTypes: true });
  const sheets = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const destinationDirectory = path.join(collectionRoot, entry.name);
    const sourcePath = path.join(destinationDirectory, "house", "idle.png");
    try {
      await access(sourcePath);
      sheets.push({ sourcePath, destinationDirectory });
    } catch {}
  }
  return sheets;
}

async function createPortrait(sourcePath, destinationDirectory) {
  const image = sharp(sourcePath, { animated: false });
  const metadata = await image.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (!width || !height) throw new Error(`Dimensioni non valide: ${sourcePath}`);

  const isAtlas = width <= height * 1.5;
  const frameWidth = isAtlas ? Math.floor(width / 4) : Math.min(height, width);
  const frameHeight = isAtlas ? Math.floor(height / 4) : height;
  const portraitPath = path.join(destinationDirectory, "preview.png");
  const animatedPortraitPath = path.join(destinationDirectory, "preview.webp");

  const frame = await image
    .extract({ left: 0, top: 0, width: frameWidth, height: frameHeight })
    .png()
    .toBuffer();

  await sharp(frame)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize(168, 168, {
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
    .png({ palette: true, colours: 256 })
    .toFile(portraitPath);

  const availableFrames = isAtlas ? 4 : Math.max(1, Math.floor(width / frameWidth));
  const animationFrames = Math.min(6, availableFrames);
  const preparedFrames = [];
  for (let index = 0; index < animationFrames; index += 1) {
    const left = index * frameWidth;
    const extracted = await sharp(sourcePath)
      .extract({ left, top: 0, width: frameWidth, height: frameHeight })
      .png()
      .toBuffer();
    const prepared = await sharp(extracted)
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .resize(84, 84, {
        fit: "contain",
        kernel: sharp.kernel.nearest,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .extend({ top: 6, bottom: 6, left: 6, right: 6, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    preparedFrames.push(prepared);
  }

  await sharp({
    create: { width: 96, height: 96 * animationFrames, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 }, pageHeight: 96 },
  })
    .composite(preparedFrames.map((input, index) => ({ input, left: 0, top: index * 96 })))
    .webp({ loop: 0, delay: Array.from({ length: animationFrames }, () => 360), effort: 4, quality: 88 })
    .toFile(animatedPortraitPath);
}

const idleSheets = await findHouseIdleSheets();
for (const { sourcePath, destinationDirectory } of idleSheets) {
  try {
    await createPortrait(sourcePath, destinationDirectory);
  } catch (error) {
    throw new Error(`Impossibile creare il ritratto da ${sourcePath}: ${error instanceof Error ? error.message : error}`);
  }
}
console.log(`${idleSheets.length} ritratti statici e animati creati dagli sprite rifiniti della Casa.`);
