import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { FAMILIAR_COLLECTION } from "../lib/famiglioMarketExpansion.ts";

const output = "artifacts/famiglio-meal-review";
await mkdir(output, { recursive: true });
const audit = [];
for (const pet of FAMILIAR_COLLECTION) {
  for (const stage of ["cucciolo", "giovane", "adulto"]) {
    const source = `public${pet.spriteBase}/growth/${stage}/house/feed.png`;
    const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const frames = [];
    for (let f = 0; f < 4; f++) {
      let left = 128, top = 128, right = -1, bottom = -1, area = 0;
      for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
        if (data[(y * info.width + f * 128 + x) * 4 + 3] < 32) continue;
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y); area++;
      }
      frames.push({ left, right, top, bottom, area });
    }
    audit.push({ id: pet.id, stage, frames, complete: frames.every(f => f.area > 0 && f.left > 0 && f.right < 127 && f.top > 0 && f.bottom < 127) });
  }
}
for (let page = 0; page < Math.ceil(FAMILIAR_COLLECTION.length / 8); page++) {
  const layers = [];
  const pets = FAMILIAR_COLLECTION.slice(page * 8, page * 8 + 8);
  for (let row = 0; row < pets.length; row++) {
    const pet = pets[row];
    layers.push({ input: Buffer.from(`<svg width="260" height="128"><text x="8" y="64" fill="white" font-size="18">${pet.id}</text></svg>`), left: 0, top: row * 128 });
    layers.push({ input: `public${pet.spriteBase}/growth/adulto/house/feed.png`, left: 260, top: row * 128 });
  }
  await sharp({ create: { width: 772, height: pets.length * 128, channels: 4, background: "#483750" } }).composite(layers).png().toFile(`${output}/frames-${page + 1}.png`);
}
await writeFile(`${output}/geometry.json`, JSON.stringify(audit, null, 2));
console.log(JSON.stringify({ sequences: audit.length, failed: audit.filter(row => !row.complete) }));
