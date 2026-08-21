import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();
const assetsDir = path.join(projectRoot, "assets");
const markPath = path.join(projectRoot, "public", "brand", "admin-control-favicon-v1.webp");
const logoPath = path.join(projectRoot, "public", "brand", "lorewise-universe-logo-concept-c.png");

await mkdir(assetsDir, { recursive: true });

const gradient = (size, dark = true) => Buffer.from(`
  <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="g" cx="50%" cy="42%" r="72%">
        <stop offset="0" stop-color="${dark ? "#293d7d" : "#fffdf7"}"/>
        <stop offset="0.58" stop-color="${dark ? "#141b45" : "#efe9ff"}"/>
        <stop offset="1" stop-color="${dark ? "#080b20" : "#dce8ff"}"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
  </svg>
`);

async function contained(file, size) {
  return sharp(file).resize(size, size, { fit: "contain" }).png().toBuffer();
}

const foreground = await contained(markPath, 650);
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: foreground, gravity: "center" }])
  .png()
  .toFile(path.join(assetsDir, "icon-foreground.png"));

await sharp(gradient(1024, true)).png().toFile(path.join(assetsDir, "icon-background.png"));
await sharp(gradient(1024, true))
  .composite([{ input: await contained(markPath, 710), gravity: "center" }])
  .png()
  .toFile(path.join(assetsDir, "icon-only.png"));

for (const [name, dark] of [["splash.png", false], ["splash-dark.png", true]]) {
  await sharp(gradient(2732, dark))
    .composite([{ input: await contained(logoPath, 1540), gravity: "center" }])
    .png()
    .toFile(path.join(assetsDir, name));
}

console.log("Risorse Android LoreWise generate in assets/.");
