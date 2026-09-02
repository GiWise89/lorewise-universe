import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const GADGETS = [
  { id: "berretto-stellare", colors: [0x1a1028ff, 0x8f42d8ff, 0xf4cf62ff], type: "hat" },
  { id: "sciarpa-crepuscolo", colors: [0x1b1025ff, 0xd63d83ff, 0xf0a456ff], type: "scarf" },
  { id: "mantellina-custode", colors: [0x101a2cff, 0x236d89ff, 0xf1c85fff], type: "coat" },
  { id: "corona-del-nexus", colors: [0x4b2410ff, 0xf0b838ff, 0xf8eb9aff], type: "hat" },
  { id: "cappuccio-lunare", colors: [0x160f2cff, 0x52328dff, 0xb882e8ff], type: "hat" },
  { id: "gilet-aurora", colors: [0x0d2731ff, 0x2a9aa0ff, 0xf4cc62ff], type: "coat" },
  { id: "armatura-astrale", colors: [0x111b35ff, 0x5177a7ff, 0xc9deefff], type: "coat" },
  { id: "mantello-nobile", colors: [0x32101cff, 0xa8324eff, 0xf3c55cff], type: "coat" },
  { id: "fiocco-celeste", colors: [0x102b3cff, 0x48add0ff, 0xe9f8ffff], type: "scarf" },
  { id: "ghirlanda-incantata", colors: [0x15351fff, 0x4e9b55ff, 0xf2a9d0ff], type: "scarf" },
];

const APPEARANCES = [
  { id: "cat-1", action: "public/famiglio/sprites/cat-1-azioni-composte-50px-final.png", columns: 8, rows: 5, behavior: ["public/famiglio/behaviors/cat-1/idle.png", "public/famiglio/behaviors/cat-1/walk.png", "public/famiglio/behaviors/cat-1/sit.png", "public/famiglio/behaviors/cat-1/groom.png", "public/famiglio/behaviors/cat-1/sleep.png"] },
  { id: "cat-umbra", action: "public/famiglio/palettes/cat-umbra/sprite.png", columns: 8, rows: 5, behavior: ["public/famiglio/palettes/cat-umbra/idle.png", "public/famiglio/palettes/cat-umbra/walk.png", "public/famiglio/palettes/cat-umbra/sit.png", "public/famiglio/palettes/cat-umbra/groom.png", "public/famiglio/palettes/cat-umbra/sleep.png"] },
  { id: "cat-luna", action: "public/famiglio/palettes/cat-luna/sprite.png", columns: 8, rows: 5, behavior: ["public/famiglio/palettes/cat-luna/idle.png", "public/famiglio/palettes/cat-luna/walk.png", "public/famiglio/palettes/cat-luna/sit.png", "public/famiglio/palettes/cat-luna/groom.png", "public/famiglio/palettes/cat-luna/sleep.png"] },
  { id: "dog-golden-retriever", action: "public/famiglio/sprites/dog-golden-retriever-azioni-composte-100px-final.png", columns: 8, rows: 5, behavior: ["public/famiglio/behaviors/golden/idle.png", "public/famiglio/behaviors/golden/walk.png", "public/famiglio/behaviors/golden/sit.png", "public/famiglio/behaviors/golden/groom.png", "public/famiglio/behaviors/golden/sleep.png"] },
  { id: "dog-cocoa", action: "public/famiglio/palettes/dog-cocoa/sprite.png", columns: 8, rows: 5, behavior: ["public/famiglio/palettes/dog-cocoa/idle.png", "public/famiglio/palettes/dog-cocoa/walk.png", "public/famiglio/palettes/dog-cocoa/sit.png", "public/famiglio/palettes/dog-cocoa/groom.png", "public/famiglio/palettes/dog-cocoa/sleep.png"] },
  { id: "dog-moonlit", action: "public/famiglio/palettes/dog-moonlit/sprite.png", columns: 8, rows: 5, behavior: ["public/famiglio/palettes/dog-moonlit/idle.png", "public/famiglio/palettes/dog-moonlit/walk.png", "public/famiglio/palettes/dog-moonlit/sit.png", "public/famiglio/palettes/dog-moonlit/groom.png", "public/famiglio/palettes/dog-moonlit/sleep.png"] },
  { id: "wolf-timber", action: "public/famiglio/sprites/wolf-timber-azioni-composte-48px-final.png", columns: 5, rows: 5, behavior: ["public/famiglio/behaviors/wild/wolf-timber.png"] },
  { id: "wolf-bloodmoon", action: "public/famiglio/palettes/wolf-bloodmoon/sprite.png", columns: 5, rows: 5, behavior: ["public/famiglio/palettes/wolf-bloodmoon/behaviors.png"] },
  { id: "wolf-winterborn", action: "public/famiglio/palettes/wolf-winterborn/sprite.png", columns: 5, rows: 5, behavior: ["public/famiglio/palettes/wolf-winterborn/behaviors.png"] },
  { id: "crow", action: "public/famiglio/sprites/crow-azioni-composte-48px-final.png", columns: 7, rows: 5, behavior: ["public/famiglio/behaviors/wild/crow.png"] },
  { id: "crow-arcane", action: "public/famiglio/palettes/crow-arcane/sprite.png", columns: 7, rows: 5, behavior: ["public/famiglio/palettes/crow-arcane/behaviors.png"] },
  { id: "crow-spectral", action: "public/famiglio/palettes/crow-spectral/sprite.png", columns: 7, rows: 5, behavior: ["public/famiglio/palettes/crow-spectral/behaviors.png"] },
  { id: "fox", action: "public/famiglio/sprites/fox-azioni-composte-32px-final.png", columns: 8, rows: 5, behavior: ["public/famiglio/behaviors/wild/fox.png"] },
  { id: "fox-arctic", action: "public/famiglio/palettes/fox-arctic/sprite.png", columns: 8, rows: 5, behavior: ["public/famiglio/palettes/fox-arctic/behaviors.png"] },
  { id: "fox-silver", action: "public/famiglio/palettes/fox-silver/sprite.png", columns: 8, rows: 5, behavior: ["public/famiglio/palettes/fox-silver/behaviors.png"] },
  { id: "moon-rabbit", action: "public/famiglio/professional/animal-mega-pack/moon-rabbit/actions.png", columns: 8, rows: 5, behaviorCell: 32, behavior: ["idle", "walk", "sit", "groom", "rest"].map((name) => `public/famiglio/professional/animal-mega-pack/moon-rabbit/${name}.png`) },
  { id: "pocket-dragon", action: "public/famiglio/professional/animal-mega-pack/pocket-dragon/actions.png", columns: 8, rows: 5, behaviorCell: 32, behavior: ["idle", "walk", "sit", "groom", "rest"].map((name) => `public/famiglio/professional/animal-mega-pack/pocket-dragon/${name}.png`) },
  { id: "ember-red-panda", action: "public/famiglio/professional/animal-mega-pack/ember-red-panda/actions.png", columns: 8, rows: 5, behaviorCell: 16, behavior: ["idle", "walk", "sit", "groom", "rest"].map((name) => `public/famiglio/professional/animal-mega-pack/ember-red-panda/${name}.png`) },
  { id: "astral-fawn", action: "public/famiglio/professional/animal-mega-pack/astral-fawn/actions.png", columns: 8, rows: 5, behaviorCell: 16, behavior: ["idle", "walk", "sit", "groom", "rest"].map((name) => `public/famiglio/professional/animal-mega-pack/astral-fawn/${name}.png`) },
  { id: "nexus-axolotl", action: "public/famiglio/professional/animal-mega-pack/nexus-axolotl/actions.png", columns: 8, rows: 5, behaviorCell: 32, behavior: ["idle", "walk", "sit", "groom", "rest"].map((name) => `public/famiglio/professional/animal-mega-pack/nexus-axolotl/${name}.png`) },
  ...[
    "moon-rabbit-cocoa", "moon-rabbit-dawn", "pocket-dragon-coral", "pocket-dragon-lagoon", "ember-red-panda-midnight", "ember-red-panda-sunrise",
    "astral-fawn-emerald", "astral-fawn-violet", "nexus-axolotl-snow", "nexus-axolotl-honey",
  ].map((id) => ({ id, action: `public/famiglio/professional/animal-mega-pack/${id}/actions.png`, columns: 8, rows: 5, behaviorCell: id.startsWith("ember-red-panda") || id.startsWith("astral-fawn") ? 16 : 32, behavior: ["idle", "walk", "sit", "groom", "rest"].map((name) => `public/famiglio/professional/animal-mega-pack/${id}/${name}.png`) })),
];

function rgba(value) { return [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255]; }
function pixelIndex(width, x, y) { return (y * width + x) * 4; }
function put(data, width, height, x, y, color) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const index = pixelIndex(width, x, y);
  const [r, g, b, a] = rgba(color);
  data[index] = r; data[index + 1] = g; data[index + 2] = b; data[index + 3] = a;
}
function largestComponent(data, width, cellX, cellY, cellW, cellH) {
  const seen = new Uint8Array(cellW * cellH);
  let best = null;
  for (let y = 0; y < cellH; y += 1) for (let x = 0; x < cellW; x += 1) {
    const local = y * cellW + x;
    if (seen[local] || data[pixelIndex(width, cellX + x, cellY + y) + 3] < 20) continue;
    const queue = [[x, y]]; seen[local] = 1;
    let head = 0, count = 0, minX = x, maxX = x, minY = y, maxY = y;
    while (head < queue.length) {
      const [qx, qy] = queue[head++]; count += 1;
      minX = Math.min(minX, qx); maxX = Math.max(maxX, qx); minY = Math.min(minY, qy); maxY = Math.max(maxY, qy);
      for (const [nx, ny] of [[qx - 1, qy], [qx + 1, qy], [qx, qy - 1], [qx, qy + 1]]) {
        if (nx < 0 || ny < 0 || nx >= cellW || ny >= cellH) continue;
        const next = ny * cellW + nx;
        if (seen[next] || data[pixelIndex(width, cellX + nx, cellY + ny) + 3] < 20) continue;
        seen[next] = 1; queue.push([nx, ny]);
      }
    }
    if (!best || count > best.count) best = { count, minX, maxX, minY, maxY };
  }
  return best;
}

function bodyPixel(data, width, originX, originY, x, y) {
  return data[pixelIndex(width, originX + x, originY + y) + 3] >= 20;
}

function putIntegrated(data, source, width, height, originX, originY, x, y, color, allowAdjacent = false) {
  const onBody = bodyPixel(source, width, originX, originY, x, y);
  const adjacent = allowAdjacent && [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dx, dy]) => bodyPixel(source, width, originX, originY, x + dx, y + dy));
  if (!onBody && !adjacent) return;
  put(data, width, height, originX + x, originY + y, color);
}

function fillIntegrated(data, source, width, height, originX, originY, x, y, w, h, color, allowAdjacent = false) {
  for (let py = y; py < y + h; py += 1) for (let px = x; px < x + w; px += 1) {
    putIntegrated(data, source, width, height, originX, originY, px, py, color, allowAdjacent);
  }
}

function analyzePose(data, width, originX, originY, box) {
  const bodyW = box.maxX - box.minX + 1;
  const bodyH = box.maxY - box.minY + 1;
  const upperLimit = box.minY + Math.max(2, Math.round(bodyH * .5));
  const middleX = box.minX + bodyW / 2;
  let leftUpper = 0, rightUpper = 0;
  for (let y = box.minY; y <= upperLimit; y += 1) for (let x = box.minX; x <= box.maxX; x += 1) {
    if (!bodyPixel(data, width, originX, originY, x, y)) continue;
    if (x < middleX) leftUpper += 1; else rightUpper += 1;
  }
  const horizontal = bodyW > bodyH * 1.08;
  const headOnLeft = horizontal && leftUpper > rightUpper;
  const headOnRight = horizontal && rightUpper >= leftUpper;
  const candidates = [];
  for (let y = box.minY; y <= upperLimit; y += 1) for (let x = box.minX; x <= box.maxX; x += 1) {
    if (!bodyPixel(data, width, originX, originY, x, y)) continue;
    if (headOnLeft && x > middleX) continue;
    if (headOnRight && x < middleX) continue;
    candidates.push({ x, y });
  }
  const points = candidates.length ? candidates : [{ x: Math.round(middleX), y: box.minY }];
  const headX = Math.round(points.reduce((sum, point) => sum + point.x, 0) / points.length);
  const headTop = Math.min(...points.map((point) => point.y));
  return { bodyW, bodyH, headX, headTop, horizontal, headOnLeft, headOnRight };
}

function drawGadget(data, source, width, height, originX, originY, box, gadget, scale) {
  if (!box || box.count < 3) return;
  const pose = analyzePose(source, width, originX, originY, box);
  const { bodyW, bodyH, headX, headTop } = pose;
  const [outline, main, accent] = gadget.colors;
  const unit = Math.max(1, Math.round(scale));
  if (gadget.type === "hat") {
    const brimW = Math.max(5 * unit, Math.min(Math.round(bodyW * .46), 12 * unit));
    const brimX = headX - Math.round(brimW / 2);
    const brimY = headTop + Math.max(unit, Math.round(bodyH * .12));
    fillIntegrated(data, source, width, height, originX, originY, brimX, brimY, brimW, Math.max(1, unit), outline, true);
    fillIntegrated(data, source, width, height, originX, originY, brimX + unit, brimY - unit, Math.max(unit, brimW - 2 * unit), Math.max(1, 2 * unit), main, true);
    fillIntegrated(data, source, width, height, originX, originY, headX - unit, headTop, Math.max(2, 3 * unit), Math.max(1, 2 * unit), main, true);
    putIntegrated(data, source, width, height, originX, originY, headX, headTop, accent, true);
  } else if (gadget.type === "scarf") {
    const scarfW = Math.max(3 * unit, Math.min(Math.round(bodyW * .3), 8 * unit));
    const x = headX - Math.round(scarfW / 2);
    const y = Math.min(box.maxY - 2 * unit, headTop + Math.max(2 * unit, Math.round(bodyH * .28)));
    fillIntegrated(data, source, width, height, originX, originY, x, y, scarfW, Math.max(1, 2 * unit), outline, true);
    fillIntegrated(data, source, width, height, originX, originY, x + unit, y, Math.max(unit, scarfW - 2 * unit), Math.max(1, unit), main, true);
    const tailX = pose.headOnLeft ? x + scarfW - 2 * unit : x + unit;
    fillIntegrated(data, source, width, height, originX, originY, tailX, y + unit, 2 * unit, Math.min(3 * unit, Math.max(unit, box.maxY - y)), main, true);
    putIntegrated(data, source, width, height, originX, originY, tailX, Math.min(box.maxY, y + 3 * unit), accent, true);
  } else {
    const torsoTop = box.minY + Math.round(bodyH * .34);
    const torsoBottom = box.minY + Math.round(bodyH * .76);
    const headSideCut = pose.headOnLeft ? box.minX + Math.round(bodyW * .35) : pose.headOnRight ? box.maxX - Math.round(bodyW * .35) : null;
    for (let y = torsoTop; y <= torsoBottom; y += 1) for (let x = box.minX; x <= box.maxX; x += 1) {
      if (!bodyPixel(source, width, originX, originY, x, y)) continue;
      if (pose.headOnLeft && x < headSideCut) continue;
      if (pose.headOnRight && x > headSideCut) continue;
      const edge = !bodyPixel(source, width, originX, originY, x - 1, y) || !bodyPixel(source, width, originX, originY, x + 1, y) || y === torsoBottom;
      put(data, width, height, originX + x, originY + y, edge ? outline : main);
    }
    const claspY = Math.min(box.maxY, torsoTop + unit);
    put(data, width, height, originX + headX, originY + claspY, accent);
  }
}

async function decorate(source, destination, columns, rows, gadget) {
  const inputPath = path.join(ROOT, source);
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const output = Buffer.from(data);
  const cellW = Math.floor(info.width / columns), cellH = Math.floor(info.height / rows);
  const scale = Math.max(1, cellW / 50);
  for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns; column += 1) {
    const originX = column * cellW, originY = row * cellH;
    drawGadget(output, data, info.width, info.height, originX, originY, largestComponent(data, info.width, originX, originY, cellW, cellH), gadget, scale);
  }
  const outPath = path.join(ROOT, destination);
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await sharp(output, { raw: info }).png().toFile(outPath);
}

for (const appearance of APPEARANCES) {
  for (const gadget of GADGETS) {
    const root = `public/famiglio/gadgets/${gadget.id}/${appearance.id}`;
    await decorate(appearance.action, `${root}/actions.png`, appearance.columns, appearance.rows, gadget);
    for (const source of appearance.behavior) {
      const metadata = await sharp(path.join(ROOT, source)).metadata();
      const cell = appearance.behaviorCell ?? (appearance.id.startsWith("fox") ? 32 : appearance.id.startsWith("dog") ? 100 : appearance.id.startsWith("cat") ? 50 : 48);
      const columns = Math.max(1, Math.round((metadata.width ?? cell) / cell));
      const rows = Math.max(1, Math.round((metadata.height ?? cell) / cell));
      await decorate(source, `${root}/${path.basename(source)}`, columns, rows, gadget);
    }
    const idleSource = appearance.behavior[0];
    const idleMetadata = await sharp(path.join(ROOT, idleSource)).metadata();
    const idleCell = appearance.behaviorCell ?? (appearance.id.startsWith("fox") ? 32 : appearance.id.startsWith("dog") ? 100 : appearance.id.startsWith("cat") ? 50 : 48);
    const idleColumns = Math.max(1, Math.round((idleMetadata.width ?? idleCell) / idleCell));
    const idleRows = Math.max(1, Math.round((idleMetadata.height ?? idleCell) / idleCell));
    const idleCellW = Math.floor((idleMetadata.width ?? idleCell) / idleColumns);
    const idleCellH = Math.floor((idleMetadata.height ?? idleCell) / idleRows);
    const idleFrame = await sharp(path.join(ROOT, `${root}/${path.basename(idleSource)}`))
      .extract({ left: 0, top: 0, width: idleCellW, height: idleCellH })
      .png()
      .toBuffer();
    await sharp(idleFrame)
      .trim()
      .resize(160, 160, { fit: "contain", kernel: "nearest", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(ROOT, `${root}/preview.png`));
  }
}

console.log(`Generated ${APPEARANCES.length * GADGETS.length} complete action sets plus behavior sheets.`);
