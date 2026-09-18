import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = "public/famiglio/rebuild";
const masterRoot = path.join(root, "combat/generated-masters");
const collectionRoot = path.join(root, "collection");
const poses = ["idle", "entrance", "attack", "physical", "magic", "technique", "guard", "hit", "exhausted", "run", "victory", "lose"];
const stages = { cucciolo: .82, giovane: .91, adulto: 1 };
const force = process.argv.includes("--force");
const motion = {
  idle: [[0,0],[0,-1],[0,-2],[0,-1],[0,0],[0,1],[0,2],[0,1],[0,0],[0,-1],[0,0],[0,1]],
  entrance: [[-10,0],[-8,0],[-6,-1],[-4,-1],[-2,0],[0,0],[2,0],[0,0],[-1,0],[0,0],[0,-1],[0,0]],
  attack: [[0,0],[1,0],[3,0],[7,0],[12,-1],[9,0],[5,0],[2,0],[-1,0],[0,0],[0,-1],[0,0]],
  physical: [[0,0],[2,-1],[5,-2],[10,-2],[13,-1],[8,0],[3,0],[0,0],[-2,0],[0,0],[1,-1],[0,0]],
  magic: [[0,1],[0,0],[0,-2],[0,-4],[0,-3],[0,-1],[0,0],[0,-2],[0,-3],[0,-1],[0,0],[0,1]],
  technique: [[0,0],[1,-1],[2,-3],[4,-5],[6,-3],[4,-1],[2,0],[0,0],[-1,0],[0,-1],[1,0],[0,0]],
  guard: [[0,0],[-1,0],[-2,0],[-3,0],[-2,0],[-1,0],[0,0],[-1,0],[-2,0],[-1,0],[0,0],[0,0]],
  hit: [[0,0],[-3,0],[-7,1],[-10,2],[-7,1],[-4,0],[-2,0],[0,0],[-1,0],[0,0],[0,0],[0,0]],
  exhausted: [[0,0],[0,1],[0,2],[0,3],[0,2],[0,1],[0,0],[0,1],[0,2],[0,1],[0,0],[0,1]],
  run: [[-3,0],[0,-2],[4,-4],[8,-2],[11,0],[8,-2],[4,-4],[0,-2],[-3,0],[0,-2],[4,-4],[0,0]],
  victory: [[0,1],[0,-2],[0,-6],[0,-3],[0,0],[0,-4],[0,-7],[0,-3],[0,0],[0,-2],[0,0],[0,1]],
  lose: [[0,0],[0,1],[0,2],[0,3],[0,3],[0,2],[0,3],[0,2],[0,3],[0,2],[0,3],[0,3]],
};

async function removeFlatLightBackdrop(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width, minY = info.height, maxX = -1, maxY = -1;
  for (let y = 0; y < info.height; y += 1) for (let x = 0; x < info.width; x += 1) {
    if (data[(y * info.width + x) * 4 + 3] > 8) {
      minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) return input;
  const isBackdrop = (x, y) => {
    const offset = (y * info.width + x) * 4;
    const r = data[offset], g = data[offset + 1], b = data[offset + 2], a = data[offset + 3];
    return a > 8 && Math.min(r, g, b) > 168 && Math.max(r, g, b) - Math.min(r, g, b) < 42;
  };
  const border = [];
  for (let x = minX; x <= maxX; x += 1) { border.push([x, minY], [x, maxY]); }
  for (let y = minY + 1; y < maxY; y += 1) { border.push([minX, y], [maxX, y]); }
  if (border.filter(([x, y]) => isBackdrop(x, y)).length < border.length * .55) return input;
  const queue = border.filter(([x, y]) => isBackdrop(x, y));
  const visited = new Uint8Array(info.width * info.height);
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const [x, y] = queue[cursor];
    const index = y * info.width + x;
    if (visited[index] || !isBackdrop(x, y)) continue;
    visited[index] = 1;
    data[index * 4 + 3] = 0;
    if (x > minX) queue.push([x - 1, y]);
    if (x < maxX) queue.push([x + 1, y]);
    if (y > minY) queue.push([x, y - 1]);
    if (y < maxY) queue.push([x, y + 1]);
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

const requestedId = process.argv.find((argument) => argument.startsWith("--id="))?.slice(5);
const ids = fs.readdirSync(masterRoot).filter((name) => name.endsWith(".png")).map((name) => name.slice(0, -4)).filter((id) => !requestedId || id === requestedId).sort();
for (const id of ids) {
  if (!force && Object.keys(stages).every((stage) => poses.every((pose) => fs.existsSync(path.join(collectionRoot, id, "growth", stage, "battle-v4", `${pose}.png`))))) {
    continue;
  }
  const source = path.join(masterRoot, `${id}.png`);
  const metadata = await sharp(source).metadata();
  const cellWidth = Math.floor(metadata.width / 4);
  const cellHeight = Math.floor(metadata.height / 3);
  for (const [stage, scale] of Object.entries(stages)) {
    const output = path.join(collectionRoot, id, "growth", stage, "battle-v4");
    fs.mkdirSync(output, { recursive: true });
    for (let index = 0; index < poses.length; index += 1) {
      const pose = poses[index];
      const extracted = await sharp(source).extract({ left: (index % 4) * cellWidth, top: Math.floor(index / 4) * cellHeight, width: cellWidth, height: cellHeight }).png().toBuffer();
      const cleaned = await removeFlatLightBackdrop(extracted);
      const cell = await sharp(cleaned).resize({ width: Math.round(160 * scale), height: Math.round(160 * scale), fit: "fill" }).png().toBuffer();
      const frameSize = Math.round(160 * scale);
      const frames = await Promise.all(motion[pose].map(async ([dx, dy]) => sharp({ create: { width: 160, height: 160, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: cell, left: Math.round((160 - frameSize) / 2 + dx), top: Math.round(160 - frameSize + dy) }]).png().toBuffer()));
      await sharp({ create: { width: 1920, height: 160, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(frames.map((input, frame) => ({ input, left: frame * 160, top: 0 }))).png({ palette: true }).toFile(path.join(output, `${pose}.png`));
    }
  }
  console.log(`battle-v4 ${id}`);
}
console.log(`${ids.length} Famigli generati, ${ids.length * poses.length * 3} animazioni.`);
