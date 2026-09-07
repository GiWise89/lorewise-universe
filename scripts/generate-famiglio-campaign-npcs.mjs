import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const root = process.cwd();
const sourceRoot = path.join(root, "public", "famiglio", "rebuild", "combat", "campaign", "npcs");
const outputRoot = path.join(sourceRoot, "levels");
const cell = 128;
const columns = 8;
const poses = ["idle", "command", "cheer", "anger", "victory", "defeat"];
const sourceRow = [0, 1, 2, 3, 2, 3];
const frameOrder = [0, 1, 2, 3, 2, 1, 0, 1];
const bounce = {
  idle: [0, 0, -1, 0, 0, 0, -1, 0],
  command: [0, -1, -2, -1, 0, -1, -2, -1],
  cheer: [0, -5, -11, -6, 0, -4, -9, -4],
  anger: [0, 0, -1, 0, 0, 0, -1, 0],
  victory: [0, -7, -16, -8, 0, -6, -13, -5],
  defeat: [0, 2, 5, 8, 11, 13, 14, 14],
};

const npcs = [
  ["01-grin", "goblin.png", 0], ["02-murka", "goblin.png", 38], ["03-skarn", "goblin.png", 82], ["04-vorga", "goblin.png", 126],
  ["05-kaien", "ronin.png", 0], ["06-rei", "ronin.png", 42], ["07-jinra", "ronin.png", 92], ["08-shirok", "ronin.png", 142],
  ["09-elyra", "wizard.png", 0], ["10-maled", "wizard.png", 48], ["11-sivra", "wizard.png", 104], ["12-orun", "wizard.png", 158],
  ["13-draeven", "death-knight.png", 0], ["14-khar", "death-knight.png", 38], ["15-vael", "death-knight.png", 88], ["16-mordrek", "death-knight.png", 146],
  ["17-nhal", "lich.png", 0], ["18-sevrath", "lich.png", 44], ["19-azrakar", "lich.png", 102], ["20-morvane", "lich.png", 168],
];

async function opaqueTrim(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let offset = 0; offset < data.length; offset += 4) data[offset + 3] = data[offset + 3] >= 96 ? 255 : 0;
  return sharp(data, { raw: info }).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 }).png().toBuffer();
}

async function buildNpc(id, sourceName, hue) {
  const sourcePath = path.join(sourceRoot, sourceName);
  const metadata = await sharp(sourcePath).metadata();
  const sourceWidth = Math.floor((metadata.width ?? 4) / 4);
  const sourceHeight = Math.floor((metadata.height ?? 4) / 4);
  const composites = [];
  for (let row = 0; row < poses.length; row += 1) {
    const pose = poses[row];
    for (let column = 0; column < columns; column += 1) {
      const sourceColumn = frameOrder[column];
      let frame = await sharp(sourcePath).extract({ left: sourceColumn * sourceWidth, top: sourceRow[row] * sourceHeight, width: sourceWidth, height: sourceHeight }).png().toBuffer();
      frame = await opaqueTrim(frame);
      const targetSpan = sourceName === "death-knight.png" ? 108 : sourceName === "lich.png" ? 104 : 96;
      frame = await sharp(frame)
        .modulate({ hue, saturation: 1.08, brightness: row === 3 ? .94 : 1 })
        .resize(targetSpan, targetSpan, { fit: "inside", kernel: "nearest", withoutEnlargement: false })
        .png()
        .toBuffer();
      const frameMeta = await sharp(frame).metadata();
      const width = frameMeta.width ?? targetSpan;
      const height = frameMeta.height ?? targetSpan;
      const angerShift = pose === "anger" ? (column % 2 === 0 ? -3 : 3) : 0;
      const defeatShift = pose === "defeat" ? Math.min(10, column * 2) : 0;
      composites.push({
        input: frame,
        left: column * cell + Math.round((cell - width) / 2) + angerShift + defeatShift,
        top: row * cell + cell - height - 7 + bounce[pose][column],
      });
    }
  }
  const result = await sharp({ create: { width: cell * columns, height: cell * poses.length, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(composites)
    .png({ palette: true, colours: 256 })
    .toBuffer();
  await writeFile(path.join(outputRoot, `${id}.png`), result);
}

await mkdir(outputRoot, { recursive: true });
for (const npc of npcs) await buildNpc(...npc);
console.log(`Generati ${npcs.length} NPC campagna con ${poses.length} pose animate e ${columns} frame per posa.`);
