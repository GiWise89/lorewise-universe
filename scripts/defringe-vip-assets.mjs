import path from "node:path";
import sharp from "sharp";

const dossierRoot = path.join(process.cwd(), "vip media", "giochi", "the-wound-remembers", "il-rogo-delle-dieci-porte", "dossier");
const assets = [
  ["vharokh-sagoma-trasparente-v1.png", "vharokh-sagoma-trasparente-v2.png"],
  ["velisara-sagoma-trasparente-v1.png", "velisara-sagoma-trasparente-v2.png"],
];

function isWhiteMatte(red, green, blue) {
  const lightness = (red + green + blue) / 3;
  const spread = Math.max(red, green, blue) - Math.min(red, green, blue);
  return lightness > 195 && spread < 38;
}

function findCleanNeighbour(data, width, height, x, y, radius = 14) {
  for (let distance = 1; distance <= radius; distance += 1) {
    for (let offsetY = -distance; offsetY <= distance; offsetY += 1) {
      for (let offsetX = -distance; offsetX <= distance; offsetX += 1) {
        if (Math.max(Math.abs(offsetX), Math.abs(offsetY)) !== distance) continue;
        const nextX = x + offsetX;
        const nextY = y + offsetY;
        if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) continue;
        const index = (nextY * width + nextX) * 4;
        if (data[index + 3] < 250) continue;
        if (isWhiteMatte(data[index], data[index + 1], data[index + 2])) continue;
        return index;
      }
    }
  }
  return -1;
}

function touchesTransparency(alpha, width, height, x, y) {
  for (let offsetY = -2; offsetY <= 2; offsetY += 1) {
    for (let offsetX = -2; offsetX <= 2; offsetX += 1) {
      const nextX = x + offsetX;
      const nextY = y + offsetY;
      if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) continue;
      if (alpha[nextY * width + nextX] < 16) return true;
    }
  }
  return false;
}

for (const [sourceName, outputName] of assets) {
  const source = path.join(dossierRoot, sourceName);
  const output = path.join(dossierRoot, outputName);
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const original = Buffer.from(data);
  const alpha = new Uint8Array(info.width * info.height);
  for (let pixel = 0; pixel < alpha.length; pixel += 1) alpha[pixel] = original[pixel * 4 + 3];

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const index = (y * info.width + x) * 4;
      const opacity = original[index + 3];
      if (opacity === 0) {
        data[index] = 0;
        data[index + 1] = 0;
        data[index + 2] = 0;
        continue;
      }
      const contaminated = opacity < 250 || (touchesTransparency(alpha, info.width, info.height, x, y) && isWhiteMatte(original[index], original[index + 1], original[index + 2]));
      if (!contaminated) continue;
      const neighbour = findCleanNeighbour(original, info.width, info.height, x, y);
      if (neighbour >= 0) {
        data[index] = original[neighbour];
        data[index + 1] = original[neighbour + 1];
        data[index + 2] = original[neighbour + 2];
      }
      if (opacity < 250) data[index + 3] = Math.max(0, Math.round(((opacity - 8) * 255) / 247));
    }
  }
  await sharp(data, { raw: info }).png({ compressionLevel: 9 }).toFile(output);
  console.log(`Created ${outputName}`);
}
