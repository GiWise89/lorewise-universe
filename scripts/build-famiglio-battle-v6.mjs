import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.join("public", "famiglio", "rebuild");
const ATLAS_ROOT = path.join(ROOT, "combat", "imagegen-atlases");
const COLLECTION_ROOT = path.join(ROOT, "collection");
const STAGES = ["cucciolo", "giovane", "adulto"];
const GRID = 8;
const FRAME_SIZE = 160;
const CONTENT_SIZE = 150;
const ROW_POSES = [
  ["idle"],
  ["run", "entrance"],
  ["attack", "physical"],
  ["magic", "technique"],
  ["heal"],
  ["guard"],
  ["hit", "exhausted"],
  ["jump", "victory"],
];

function parseAtlasName(filename) {
  const stem = filename.replace(/-v6\.png$/i, "");
  if (stem.endsWith("-base")) return { id: stem.slice(0, -5), variant: null };
  for (const id of ["cat", "rabbit", "parrot"]) {
    if (stem.startsWith(`${id}-`)) return { id, variant: stem.slice(id.length + 1) };
  }
  throw new Error(`Nome atlante non riconosciuto: ${filename}`);
}

function isRemovableBackground(r, g, b) {
  const light = Math.max(r, g, b);
  const dark = Math.min(r, g, b);
  const neutral = light - dark <= 34;
  // Gli atlanti opachi di ImageGen usano una scacchiera chiara. Il nero,
  // invece, appartiene ai contorni dei Famigli: rimuoverlo apriva il bordo e
  // faceva entrare il flood-fill nelle zampe e nei corpi bianchi.
  return neutral && light >= 145;
}

async function transparentAtlas(input) {
  const metadata = await sharp(input).metadata();
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const width = info.width;
  const height = info.height;
  if (!metadata.hasAlpha) {
    const seen = new Uint8Array(width * height);
    const queue = new Int32Array(width * height);
    let head = 0;
    let tail = 0;
    const enqueue = (x, y) => {
      if (x < 0 || y < 0 || x >= width || y >= height) return;
      const index = y * width + x;
      if (seen[index]) return;
      const offset = index * 4;
      if (!isRemovableBackground(data[offset], data[offset + 1], data[offset + 2])) return;
      seen[index] = 1;
      queue[tail++] = index;
    };
    for (let x = 0; x < width; x += 1) { enqueue(x, 0); enqueue(x, height - 1); }
    for (let y = 0; y < height; y += 1) { enqueue(0, y); enqueue(width - 1, y); }
    while (head < tail) {
      const index = queue[head++];
      data[index * 4 + 3] = 0;
      const x = index % width;
      const y = Math.floor(index / width);
      enqueue(x - 1, y); enqueue(x + 1, y); enqueue(x, y - 1); enqueue(x, y + 1);
    }
  } else {
    // ImageGen puo consegnare PNG con un alone semitrasparente del fondale.
    // Per la pixel art usiamo un bordo netto: niente matte, quadretti o pixel
    // colorati che diventano visibili sopra le arene.
    for (let offset = 0; offset < data.length; offset += 4) {
      data[offset + 3] = data[offset + 3] >= 176 ? 255 : 0;
    }

    // Alcuni atlanti trasparenti hanno un sottile contorno rosso di lavorazione.
    // Lo eliminiamo solo quando tocca il vuoto, iterando verso l'interno; i rossi
    // reali racchiusi nel Famiglio (piume, lingua, scaglie) restano intatti.
    for (let pass = 0; pass < 5; pass += 1) {
      const remove = [];
      for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
          const index = y * width + x;
          const offset = index * 4;
          if (data[offset + 3] === 0) continue;
          const saturatedRed = data[offset] > 165 && data[offset + 1] < 92 && data[offset + 2] < 92;
          if (!saturatedRed) continue;
          const touchesVoid = data[(index - 1) * 4 + 3] === 0 || data[(index + 1) * 4 + 3] === 0
            || data[(index - width) * 4 + 3] === 0 || data[(index + width) * 4 + 3] === 0;
          if (touchesVoid) remove.push(offset + 3);
        }
      }
      if (!remove.length) break;
      for (const alphaOffset of remove) data[alphaOffset] = 0;
    }
  }
  return { data, info };
}

function connectedComponents(data, width, height) {
  const seen = new Uint8Array(width * height);
  const components = [];
  const queue = new Int32Array(width * height);
  for (let start = 0; start < width * height; start += 1) {
    if (seen[start] || data[start * 4 + 3] < 128) continue;
    let head = 0;
    let tail = 0;
    let count = 0;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    const pixels = [];
    seen[start] = 1;
    queue[tail++] = start;
    while (head < tail) {
      const index = queue[head++];
      const x = index % width;
      const y = Math.floor(index / width);
      pixels.push(index);
      count += 1;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      for (const next of [index - 1, index + 1, index - width, index + width]) {
        if (next < 0 || next >= width * height || seen[next]) continue;
        const nx = next % width;
        if (Math.abs(nx - x) > 1 || data[next * 4 + 3] < 128) continue;
        seen[next] = 1;
        queue[tail++] = next;
      }
    }
    components.push({ count, minX, minY, maxX, maxY, pixels });
  }
  return components.sort((a, b) => b.count - a.count);
}

async function buildFrame(rawAtlas, column, row) {
  // Assign complete silhouettes before slicing: generated poses cross grid lines.
  const owned = rawAtlas.poseComponents[row * GRID + column];
  if (!owned.length) throw new Error(`Missing complete subject at ${column},${row}`);
  const left = Math.min(...owned.map(c => c.minX));
  const top = Math.min(...owned.map(c => c.minY));
  const cellInfo = { width: Math.max(...owned.map(c => c.maxX)) - left + 1, height: Math.max(...owned.map(c => c.maxY)) - top + 1, channels: 4 };
  const cellData = Buffer.alloc(cellInfo.width * cellInfo.height * 4);
  for (const component of owned) for (const index of component.pixels) {
    const target = ((Math.floor(index / rawAtlas.info.width) - top) * cellInfo.width + index % rawAtlas.info.width - left) * 4;
    rawAtlas.data.copy(cellData, target, index * 4, index * 4 + 4);
  }
  let components = connectedComponents(cellData, cellInfo.width, cellInfo.height);
  // Elimina i singoli pixel e i frammenti microscopici rimasti dal fondale di
  // generazione. Le particelle intenzionali delle mosse sono piu grandi e non
  // vengono toccate.
  for (const component of components) {
    if (component.count >= 10) continue;
    for (const index of component.pixels) cellData[index * 4 + 3] = 0;
  }
  components = connectedComponents(cellData, cellInfo.width, cellInfo.height);
  const main = components[0];
  if (!main) return sharp({ create: { width: FRAME_SIZE, height: FRAME_SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer();

  const visible = components.reduce((box, component) => ({
    minX: Math.min(box.minX, component.minX), minY: Math.min(box.minY, component.minY),
    maxX: Math.max(box.maxX, component.maxX), maxY: Math.max(box.maxY, component.maxY),
  }), { minX: cellInfo.width, minY: cellInfo.height, maxX: -1, maxY: -1 });
  const visibleWidth = visible.maxX - visible.minX + 1;
  const visibleHeight = visible.maxY - visible.minY + 1;
  const mainWidth = main.maxX - main.minX + 1;
  const mainHeight = main.maxY - main.minY + 1;
  const desiredBodyHeight = 124;
  const scale = Math.min(
    desiredBodyHeight / Math.max(1, mainHeight),
    CONTENT_SIZE / Math.max(1, visibleWidth),
    CONTENT_SIZE / Math.max(1, visibleHeight),
  );
  const width = Math.max(1, Math.round(visibleWidth * scale));
  const height = Math.max(1, Math.round(visibleHeight * scale));
  const subject = await sharp(cellData, { raw: cellInfo })
    .extract({ left: visible.minX, top: visible.minY, width: visibleWidth, height: visibleHeight })
    .resize({ width, height, fit: "fill", kernel: sharp.kernel.nearest })
    .png()
    .toBuffer();
  const mainCenterX = ((main.minX + main.maxX) / 2 - visible.minX) * scale;
  const mainBottom = (main.maxY - visible.minY + 1) * scale;
  const targetFloor = 154;
  const compositeLeft = Math.max(0, Math.min(FRAME_SIZE - width, Math.round(FRAME_SIZE / 2 - mainCenterX)));
  const compositeTop = Math.max(0, Math.min(FRAME_SIZE - height, Math.round(targetFloor - mainBottom)));
  const rendered = await sharp({ create: { width: FRAME_SIZE, height: FRAME_SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: subject, left: compositeLeft, top: compositeTop }])
    .png()
    .toBuffer();
  const { data: renderedData, info: renderedInfo } = await sharp(rendered).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (const component of connectedComponents(renderedData, renderedInfo.width, renderedInfo.height)) {
    if (component.count >= 24) continue;
    const backgroundWhite = component.pixels.every((index) => {
      const offset = index * 4;
      const light = Math.max(renderedData[offset], renderedData[offset + 1], renderedData[offset + 2]);
      const dark = Math.min(renderedData[offset], renderedData[offset + 1], renderedData[offset + 2]);
      return light >= 178 && light - dark <= 32;
    });
    if (!backgroundWhite) continue;
    for (const index of component.pixels) renderedData[index * 4 + 3] = 0;
  }
  return sharp(renderedData, { raw: renderedInfo }).png().toBuffer();
}

async function frameQuality(frame) {
  const { data, info } = await sharp(frame).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const found = connectedComponents(data, info.width, info.height);
  const main = found[0];
  if (!main) return { area: 0, height: 0, cut: true };
  return {
    area: main.count,
    height: main.maxY - main.minY + 1,
    cut: main.minX <= 1 || main.maxX >= info.width - 2 || main.minY <= 1,
  };
}

async function buildRow(rawAtlas, row, identity) {
  const frames = [];
  for (let column = 0; column < GRID; column += 1) frames.push(await buildFrame(rawAtlas, column, row));
  const quality = await Promise.all(frames.map(frameQuality));
  const sortedAreas = quality.map((entry) => entry.area).filter(Boolean).sort((a, b) => a - b);
  const referenceArea = sortedAreas[Math.floor(sortedAreas.length * .75)] || 1;
  const forcedRepairs = identity === "akita/base" && row === 2 ? new Set([2, 3, 4, 5]) : new Set();
  const valid = quality.map((entry, index) => ({ entry, index })).filter(({ entry, index }) => (
    !forcedRepairs.has(index) && !entry.cut && entry.height >= 52 && entry.area >= referenceArea * .6
  ));
  if (valid.length) {
    for (let index = 0; index < frames.length; index += 1) {
      const entry = quality[index];
      if (!forcedRepairs.has(index) && !entry.cut && entry.height >= 52 && entry.area >= referenceArea * .6) continue;
      const replacement = valid.reduce((best, candidate) => (
        Math.abs(candidate.index - index) < Math.abs(best.index - index) ? candidate : best
      ), valid[0]);
      frames[index] = frames[replacement.index];
    }
  }
  return sharp({ create: { width: FRAME_SIZE * GRID, height: FRAME_SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(frames.map((input, index) => ({ input, left: index * FRAME_SIZE, top: 0 })))
    .png({ palette: true, effort: 5 })
    .toBuffer();
}

const files = fs.readdirSync(ATLAS_ROOT).filter((name) => name.endsWith("-v6.png") && (!process.argv[2] || name.startsWith(process.argv[2]))).sort();
let strips = 0;
for (const filename of files) {
  const { id, variant } = parseAtlasName(filename);
  const rawAtlas = await transparentAtlas(path.join(ATLAS_ROOT, filename));
  const allComponents = connectedComponents(rawAtlas.data, rawAtlas.info.width, rawAtlas.info.height);
  const poseComponents = Array.from({ length: 64 }, () => []);
  const mainSubjects = [];
  for (const component of allComponents) {
    if (component.count < 180) continue;
    const column = Math.min(7, Math.floor((component.minX + component.maxX) / 2 / (rawAtlas.info.width / GRID)));
    const row = Math.min(7, Math.floor((component.minY + component.maxY) / 2 / (rawAtlas.info.height / GRID)));
    const slot = row * GRID + column;
    if (!mainSubjects[slot] || component.count > mainSubjects[slot].count) mainSubjects[slot] = component;
  }
  for (let slot = 0; slot < 64; slot++) {
    if (mainSubjects[slot]) poseComponents[slot].push(mainSubjects[slot]);
  }
  const primarySet = new Set(mainSubjects);
  for (const component of allComponents) {
    if (component.count < 10 || primarySet.has(component)) continue;
    const cx = (component.minX + component.maxX) / 2, cy = (component.minY + component.maxY) / 2;
    let nearest = 0, distance = Infinity;
    mainSubjects.forEach((body, slot) => {
      const dx = Math.max(body.minX - cx, 0, cx - body.maxX), dy = Math.max(body.minY - cy, 0, cy - body.maxY);
      const candidate = dx * dx + dy * dy;
      if (candidate < distance) { distance = candidate; nearest = slot; }
    });
    poseComponents[nearest].push(component);
  }
  for (let slot = 0; slot < 64; slot++) {
    if (poseComponents[slot].length) continue;
    const rowStart = Math.floor(slot / GRID) * GRID;
    const candidates = poseComponents.slice(rowStart, rowStart + GRID).map((items, index) => ({ items, index: rowStart + index })).filter(({items}) => items.length);
    if (!candidates.length) throw new Error(`${filename}: no complete pose in row ${rowStart / GRID}`);
    const replacement = candidates.sort((a,b) => Math.abs(a.index-slot)-Math.abs(b.index-slot))[0];
    console.log(`${filename}: empty atlas cell ${slot}, holding complete same-action pose ${replacement.index}`);
    poseComponents[slot] = replacement.items;
  }
  rawAtlas.poseComponents = poseComponents;
  const rows = [];
  for (let row = 0; row < GRID; row += 1) rows.push(await buildRow(rawAtlas, row, `${id}/${variant ?? "base"}`));
  if (id === 'bird') {
    const replacement = await transparentAtlas(path.join(ATLAS_ROOT, 'bird-magic-v7.png'));
    const components = connectedComponents(replacement.data, replacement.info.width, replacement.info.height);
    const bodies = Array(8);
    for (const c of components) {
      const column = Math.min(3, Math.floor((c.minX+c.maxX)/2/(replacement.info.width/4)));
      const row = Math.min(1, Math.floor((c.minY+c.maxY)/2/(replacement.info.height/2)));
      const slot = row*4+column;
      if (!bodies[slot] || c.count > bodies[slot].count) bodies[slot] = c;
    }
    replacement.poseComponents = Array.from({length:8},()=>[]);
    for (const c of components) {
      if (c.count < 10) continue;
      const cx=(c.minX+c.maxX)/2, cy=(c.minY+c.maxY)/2;
      let nearest=0, distance=Infinity;
      bodies.forEach((body,slot)=>{
        const dx=Math.max(body.minX-cx,0,cx-body.maxX), dy=Math.max(body.minY-cy,0,cy-body.maxY);
        if (dx*dx+dy*dy<distance) { distance=dx*dx+dy*dy; nearest=slot; }
      });
      replacement.poseComponents[nearest].push(c);
    }
    rows[3] = await buildRow(replacement, 0, 'bird/magic-v7');
  }
  for (const stage of STAGES) {
    const outputRoot = path.join(COLLECTION_ROOT, id, "growth", stage, "battle-v6", ...(variant ? ["variants", variant] : []));
    await fs.promises.mkdir(outputRoot, { recursive: true });
    for (let row = 0; row < ROW_POSES.length; row += 1) {
      for (const pose of ROW_POSES[row]) {
        await fs.promises.writeFile(path.join(outputRoot, `${pose}.png`), rows[row]);
        strips += 1;
      }
    }
  }
  console.log(`${id}${variant ? `/${variant}` : ""}: pronto`);
}

const manifest = {
  version: 6,
  generatedAt: new Date().toISOString(),
  source: "63 atlanti ImageGen originali: 54 Famigli base e 9 varianti selezionabili",
  atlasCount: fs.readdirSync(ATLAS_ROOT).filter(name => name.endsWith('-v6.png')).length,
  extraction: 'whole-connected-silhouettes-before-cell-assignment',
  generatedOverrides: ['bird-magic-v7.png'],
  frameCount: GRID,
  frameSize: FRAME_SIZE,
  poses: ROW_POSES.flat(),
  strips: fs.readdirSync(ATLAS_ROOT).filter(name => name.endsWith('-v6.png')).length * STAGES.length * ROW_POSES.flat().length,
};
await fs.promises.writeFile(path.join(ATLAS_ROOT, "battle-v6-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`${files.length} atlanti ImageGen convertiti in ${strips} sequenze battle-v6.`);
