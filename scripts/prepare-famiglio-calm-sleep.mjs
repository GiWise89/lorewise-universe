import path from "node:path";
import sharp from "sharp";

const starterRoot = "public/famiglio/rebuild/starters";
const spriteSets = {
  cat: { size: 32, frames: 3 },
  golden: { size: 64, frames: 8 },
  rabbit: { size: 32, frames: 6 },
  fox: { size: 32, frames: 6 },
  turtle: { size: 32, frames: 12 },
  parrot: { size: 16, frames: 8 },
  panda: { size: 64, frames: 4 },
  horse: { size: 32, frames: 6 },
};

async function removeSleepSymbols(source, destination, size, frames) {
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const output = Buffer.from(data);
  const pixelIndex = (frame, x, y) => (y * info.width + frame * size + x) * 4;

  for (let frame = 0; frame < frames; frame += 1) {
    const visited = new Set();
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const startKey = y * size + x;
        if (visited.has(startKey) || data[pixelIndex(frame, x, y) + 3] === 0) continue;
        const queue = [[x, y]];
        const component = [];
        visited.add(startKey);
        while (queue.length) {
          const [currentX, currentY] = queue.pop();
          component.push([currentX, currentY]);
          for (const [offsetX, offsetY] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nextX = currentX + offsetX;
            const nextY = currentY + offsetY;
            const key = nextY * size + nextX;
            if (nextX < 0 || nextX >= size || nextY < 0 || nextY >= size || visited.has(key)) continue;
            if (data[pixelIndex(frame, nextX, nextY) + 3] === 0) continue;
            visited.add(key);
            queue.push([nextX, nextY]);
          }
        }
        if (component.length > 24) continue;
        for (const [componentX, componentY] of component) {
          output.fill(0, pixelIndex(frame, componentX, componentY), pixelIndex(frame, componentX, componentY) + 4);
        }
      }
    }
  }

  await sharp(output, { raw: info }).png().toFile(destination);
}

for (const [species, config] of Object.entries(spriteSets)) {
  await removeSleepSymbols(
    path.join(starterRoot, species, "sleep.png"),
    path.join(starterRoot, species, "sleep-calm.png"),
    config.size,
    config.frames,
  );
}

for (const variant of ["grey", "black", "brown", "siamese"]) {
  await removeSleepSymbols(
    path.join(starterRoot, "cat", `sleep-${variant}.png`),
    path.join(starterRoot, "cat", `sleep-calm-${variant}.png`),
    32,
    3,
  );
}

for (const variant of ["white", "brown", "black"]) {
  await removeSleepSymbols(
    path.join(starterRoot, "rabbit", `sleep-${variant}.png`),
    path.join(starterRoot, "rabbit", `sleep-calm-${variant}.png`),
    32,
    6,
  );
}

for (const variant of ["blue", "red", "green", "silver", "violet"]) {
  await removeSleepSymbols(
    path.join(starterRoot, "parrot", `sleep-${variant}.png`),
    path.join(starterRoot, "parrot", `sleep-calm-${variant}.png`),
    16,
    8,
  );
}

console.log("Preparate le pose di riposo autonomo senza Z per tutti gli 8 Famigli e ogni variante cromatica.");
