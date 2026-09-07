import { mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const roomRoot = "public/famiglio/rebuild/rooms";
const sourceRoot = path.join(roomRoot, "source-v2");
const previewRoot = ".tmp/famiglio-room-v2-preview";
const catPath = "public/famiglio/rebuild/starters/cat/idle-grey.png";
const rooms = ["home", "feed", "clean", "play", "rest"];
const sourceNames = {
  home: "home.png",
  feed: "feed-clear.png",
  clean: "clean.png",
  play: "play-clear.png",
  rest: "rest.png",
};
mkdirSync(previewRoot, { recursive: true });

const roomCrop = {
  home: { left: 96, top: 76, width: 1344, height: 756 },
  feed: { left: 96, top: 68, width: 1344, height: 756 },
  clean: { left: 96, top: 54, width: 1344, height: 756 },
  play: { left: 96, top: 66, width: 1344, height: 756 },
  rest: { left: 96, top: 66, width: 1344, height: 756 },
};

async function pixelRoom(id) {
  const source = path.join(sourceRoot, sourceNames[id]);
  const room = await sharp(source)
    .extract(roomCrop[id])
    .resize({ width: 512, height: 288, fit: "fill", kernel: "nearest" })
    .png({ palette: true, colours: 96, dither: 0 })
    .toBuffer();
  await sharp(room).toFile(path.join(roomRoot, `${id}.png`));
  return room;
}

const roomBuffers = [];
for (const room of rooms) roomBuffers.push(await pixelRoom(room));

const catFrame = await sharp(catPath)
  .extract({ left: 0, top: 0, width: 32, height: 32 })
  .resize(64, 64, { kernel: "nearest" })
  .png()
  .toBuffer();

for (const [index, id] of rooms.entries()) {
  await sharp(roomBuffers[index])
    .composite([{ input: catFrame, left: 224, top: 194 }])
    .png()
    .toFile(path.join(previewRoot, `${id}-with-cat.png`));
}

console.log("Preparate 5 stanze pixel art 16:9 full-bleed e 5 collaudi con il gatto.");
