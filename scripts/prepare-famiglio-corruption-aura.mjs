import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const root = process.cwd();
const sourcePath = path.join(root, "famigli-del-nexus", "source-assets", "generated-combat", "corruption-aura-purple-v1-source.png");
const cleanedSourcePath = path.join(root, "famigli-del-nexus", "source-assets", "generated-combat", "corruption-aura-purple-v1.png");
const publicPath = path.join(root, "public", "famiglio", "rebuild", "combat", "vfx", "corruption-aura-purple-v1.png");
const { data, info } = await sharp(sourcePath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const rgba = Buffer.alloc(info.width * info.height * 4);

for (let pixel = 0; pixel < info.width * info.height; pixel += 1) {
  const input = pixel * 3;
  const output = pixel * 4;
  let red = data[input];
  let green = data[input + 1];
  let blue = data[input + 2];
  const light = Math.max(red, green, blue);
  if (blue > red * 1.22 && red < 92) {
    red = Math.round(blue * .58);
    green = Math.round(green * .3);
  }
  rgba[output] = red;
  rgba[output + 1] = green;
  rgba[output + 2] = blue;
  rgba[output + 3] = light <= 7 ? 0 : Math.min(255, Math.round(light * 1.35));
}

const transparent = await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
  .resize(1024, 1024, { fit: "fill", kernel: "nearest" })
  .png()
  .toBuffer();
await mkdir(path.dirname(cleanedSourcePath), { recursive: true });
await mkdir(path.dirname(publicPath), { recursive: true });
await writeFile(cleanedSourcePath, transparent);
await writeFile(publicPath, transparent);
console.log("Aura corrotta viola pronta: 16 frame, centro trasparente, 1024x1024.");
