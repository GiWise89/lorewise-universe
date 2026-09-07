import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const root = process.cwd();
const startersRoot = path.join(root, "public", "famiglio", "rebuild", "starters");
const collectionRoot = path.join(root, "public", "famiglio", "rebuild", "collection");
const stages = ["cucciolo", "giovane", "adulto"];
const poses = ["entrance", "idle", "run", "attack", "physical", "magic", "technique", "guard", "hit", "victory", "exhausted", "win", "lose"];
const variants = {
  cat: { base: "grey", values: ["black", "brown", "siamese"] },
  rabbit: { base: "white", values: ["brown", "black"] },
  parrot: { base: "blue", values: ["red", "green", "silver", "violet"] },
};

function key(r, g, b) { return `${r},${g},${b}`; }

async function paletteMap(species, base, variant) {
  const basePath = path.join(startersRoot, species, `idle-${base}.png`);
  const variantPath = path.join(startersRoot, species, `idle-${variant}.png`);
  const baseRaw = await sharp(basePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const variantRaw = await sharp(variantPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const buckets = new Map();
  for (let offset = 0; offset < baseRaw.data.length; offset += 4) {
    if (baseRaw.data[offset + 3] < 96 || variantRaw.data[offset + 3] < 96) continue;
    const sourceKey = key(baseRaw.data[offset], baseRaw.data[offset + 1], baseRaw.data[offset + 2]);
    const targetKey = key(variantRaw.data[offset], variantRaw.data[offset + 1], variantRaw.data[offset + 2]);
    const targets = buckets.get(sourceKey) ?? new Map();
    targets.set(targetKey, (targets.get(targetKey) ?? 0) + 1);
    buckets.set(sourceKey, targets);
  }
  return [...buckets].map(([source, targets]) => {
    const target = [...targets].sort((a, b) => b[1] - a[1])[0][0];
    return { source: source.split(",").map(Number), target: target.split(",").map(Number) };
  });
}

function distance(a, b) { return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2; }

async function recolor(input, mapping) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const exact = new Map(mapping.map(({ source, target }) => [key(...source), target]));
  for (let offset = 0; offset < data.length; offset += 4) {
    if (!data[offset + 3]) continue;
    const color = [data[offset], data[offset + 1], data[offset + 2]];
    const direct = exact.get(key(...color));
    const target = direct ?? mapping.reduce((best, entry) => distance(color, entry.source) < best.distance ? { distance: distance(color, entry.source), target: entry.target } : best, { distance: Infinity, target: color }).target;
    data[offset] = target[0]; data[offset + 1] = target[1]; data[offset + 2] = target[2];
    data[offset + 3] = data[offset + 3] >= 96 ? 255 : 0;
  }
  return sharp(data, { raw: info }).png({ palette: true, colours: 256 }).toBuffer();
}

for (const [species, config] of Object.entries(variants)) {
  for (const variant of config.values) {
    const mapping = await paletteMap(species, config.base, variant);
    for (const stage of stages) {
      const baseRoot = path.join(collectionRoot, species, "growth", stage, "battle-v2");
      const outRoot = path.join(baseRoot, "variants", variant);
      await mkdir(outRoot, { recursive: true });
      for (const pose of poses) {
        const bytes = await recolor(path.join(baseRoot, `${pose}.png`), mapping);
        await writeFile(path.join(outRoot, `${pose}.png`), bytes);
      }
    }
  }
}
console.log("Generate le varianti cromatiche da battaglia per gatto, coniglio e pappagallo.");
