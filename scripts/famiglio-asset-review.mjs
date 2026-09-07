import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import sharp from "sharp";
import { unzipSync } from "fflate";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = "C:\\Users\\Luigi\\Documents\\asset game";
const workRoot = path.join(projectRoot, ".tmp", "famiglio-asset-review");
const libraryRoot = path.join(workRoot, "library");
const manifestPath = path.join(workRoot, "manifest.json");
const portArgument = process.argv.indexOf("--port");
const port = portArgument >= 0 ? Number(process.argv[portArgument + 1]) : 3023;

const safeName = (value) => {
  const normalized = value.normalize("NFKD").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  let hash = 2166136261;
  for (const character of value) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return normalized.length <= 88 ? normalized : `${normalized.slice(0, 79)}-${(hash >>> 0).toString(36)}`;
};
const imageEntry = (name, bytes) => /\.(png|webp|jpe?g|gif)$/i.test(name) && !name.includes("__MACOSX") && !path.basename(name).startsWith("._") && bytes?.length > 32;
const publicPath = (absolute) => `/library/${path.relative(libraryRoot, absolute).split(path.sep).map(encodeURIComponent).join("/")}`;
const ensureParent = (file) => mkdirSync(path.dirname(file), { recursive: true });

function connectedBounds(data, width, height) {
  const visited = new Uint8Array(width * height);
  const bounds = [];
  const stack = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const start = y * width + x;
      if (visited[start] || data[start * 4 + 3] < 8) continue;
      visited[start] = 1;
      stack.push(start);
      let minX = x, minY = y, maxX = x, maxY = y, pixels = 0;
      while (stack.length) {
        const index = stack.pop();
        const px = index % width;
        const py = Math.floor(index / width);
        pixels += 1;
        minX = Math.min(minX, px); minY = Math.min(minY, py);
        maxX = Math.max(maxX, px); maxY = Math.max(maxY, py);
        for (let oy = -1; oy <= 1; oy += 1) for (let ox = -1; ox <= 1; ox += 1) {
          if (!ox && !oy) continue;
          const nx = px + ox, ny = py + oy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const next = ny * width + nx;
          if (!visited[next] && data[next * 4 + 3] >= 8) { visited[next] = 1; stack.push(next); }
        }
      }
      const boxWidth = maxX - minX + 1, boxHeight = maxY - minY + 1;
      if (pixels >= 12 && boxWidth >= 3 && boxHeight >= 3) bounds.push({ left: minX, top: minY, width: boxWidth, height: boxHeight, pixels });
    }
  }
  return bounds.sort((a, b) => a.top - b.top || a.left - b.left);
}

async function makePreview(bytes, output, size = 240) {
  ensureParent(output);
  await sharp(bytes, { animated: false }).resize({ width: size, height: size, fit: "inside", withoutEnlargement: true }).webp({ quality: 84 }).toFile(output);
  return publicPath(output);
}

async function processMotionPacks(sequences) {
  const packs = [
    ["Knight.zip", "Cavaliere", "PNG laterale", "Mercante, paladino o personaggio missione", "missioni"],
    ["Paragon.zip", "Paragon", "PNG laterale", "Paladino o guardiano del mercato", "missioni"],
    ["Reaper.zip", "Mietitore", "PNG laterale", "Lich, antagonista o mercante oscuro", "missioni"],
    ["Behemoth.zip", "Behemoth", "PNG laterale", "Boss o creatura rara; troppo grande per la casa", "missioni"],
    ["Beholder.zip", "Beholder", "PNG laterale", "Famiglio raro o creatura da missione", "famigli"],
    ["Rat.zip", "Ratto", "PNG laterale", "Famiglio animale sbloccabile", "famigli"],
    ["DarkFantasyEnemies_FREE.zip", "Pipistrello", "PNG laterale", "Famiglio notturno; include sonno e risveglio", "famigli"],
  ];
  for (const [archiveName, character, perspective, use, verdict] of packs) {
    const archive = unzipSync(new Uint8Array(readFileSync(path.join(sourceRoot, archiveName))));
    for (const [entryName, bytes] of Object.entries(archive)) {
      if (!imageEntry(entryName, bytes) || !/\.png$/i.test(entryName)) continue;
      const metadata = await sharp(bytes).metadata();
      const cell = metadata.height;
      if (!cell || !metadata.width || metadata.width % cell !== 0) continue;
      const outlined = /outline/i.test(entryName) && !/nooutline|noneoutlined|without vfx/i.test(entryName);
      const action = path.basename(entryName, ".png").replace(/[-_]?outline/ig, "").replace(new RegExp(character, "ig"), "").replace(/^[-_]+/, "");
      const sequenceId = safeName(`${character}-${outlined ? "contorno" : "pulito"}-${action}`);
      const sequenceRoot = path.join(libraryRoot, "movimento", sequenceId);
      mkdirSync(sequenceRoot, { recursive: true });
      const sheetPath = path.join(sequenceRoot, "sheet.png");
      writeFileSync(sheetPath, bytes);
      const frames = [];
      const frameCount = metadata.width / cell;
      for (let index = 0; index < frameCount; index += 1) {
        const framePath = path.join(sequenceRoot, `frame-${String(index + 1).padStart(3, "0")}.png`);
        await sharp(bytes).extract({ left: index * cell, top: 0, width: cell, height: cell }).png().toFile(framePath);
        frames.push(publicPath(framePath));
      }
      sequences.push({ id: sequenceId, character, action: action || "azione", frames, frameCount, cell: `${cell}x${cell}`, outlined, perspective, source: archiveName, use, verdict });
    }
  }
}

async function processIndividualSequences(archiveName, familyLabel, sequences, environments) {
  const archive = unzipSync(new Uint8Array(readFileSync(path.join(sourceRoot, archiveName))));
  const groups = new Map();
  for (const [entryName, bytes] of Object.entries(archive)) {
    if (!imageEntry(entryName, bytes) || !/\.png$/i.test(entryName)) continue;
    const basename = path.basename(entryName);
    const isFrame = /_\d{5}\.png$/i.test(basename);
    if (isFrame) {
      const key = path.dirname(entryName);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push([entryName, bytes]);
      continue;
    }
    if (/background|forest|ground|mist|light|bush|cirrus/i.test(basename)) {
      const id = safeName(`${archiveName}-${entryName}`);
      const original = path.join(libraryRoot, "ambienti", id, basename.replace(/^\._/, ""));
      ensureParent(original); writeFileSync(original, bytes);
      const preview = await makePreview(bytes, path.join(libraryRoot, "anteprime", `${id}.webp`), 420);
      environments.push({ id, label: basename.replace(/\.png$/i, ""), preview, original: publicPath(original), source: archiveName, perspective: "laterale 2D a livelli", verdict: "ambienti", use: "Scenario missione; livelli separati e animabili via JavaScript/canvas" });
    }
  }
  for (const [groupName, entries] of groups) {
    entries.sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
    const bits = groupName.split("/").filter(Boolean);
    const character = archiveName === "3 Creatures.zip" ? bits.at(-3) || familyLabel : "Foresta";
    const action = bits.at(-2) || bits.at(-1) || "sequenza";
    const sequenceId = safeName(`${familyLabel}-${groupName}`);
    const sequenceRoot = path.join(libraryRoot, "movimento", sequenceId);
    mkdirSync(sequenceRoot, { recursive: true });
    const frames = [];
    for (let index = 0; index < entries.length; index += 1) {
      const [, bytes] = entries[index];
      const framePath = path.join(sequenceRoot, `frame-${String(index + 1).padStart(3, "0")}.png`);
      writeFileSync(framePath, bytes);
      frames.push(publicPath(framePath));
    }
    let metadata = {};
    try { metadata = await sharp(entries[0][1]).metadata(); } catch { continue; }
    sequences.push({ id: sequenceId, character, action, frames, frameCount: frames.length, cell: `${metadata.width}x${metadata.height}`, outlined: false, perspective: "laterale 2D", source: archiveName, use: archiveName === "3 Creatures.zip" ? "Famiglio fantasy o creatura da missione" : "Vegetazione animata per scenario", verdict: archiveName === "3 Creatures.zip" ? "famigli" : "ambienti" });
  }
}

async function processPlatformer(objects, environments, sequences) {
  const archiveName = "GandalfHardcore FREE Platformer Assets.zip";
  const archive = unzipSync(new Uint8Array(readFileSync(path.join(sourceRoot, archiveName))));
  for (const [entryName, bytes] of Object.entries(archive)) {
    if (!imageEntry(entryName, bytes) || !/\.png$/i.test(entryName)) continue;
    const basename = path.basename(entryName);
    const sourceId = safeName(`${archiveName}-${entryName}`);
    if (/animated sprites|snow blizzard|\/boat\.png$|\/torch\.png$/i.test(entryName)) {
      const metadata = await sharp(bytes).metadata();
      const match = basename.match(/frame size\s*(\d+)x(\d+)/i);
      const inferredCell = /portal/i.test(basename) ? 64 : /torch/i.test(basename) ? 64 : /boat/i.test(basename) ? 32 : 32;
      const frameWidth = match ? Number(match[1]) : inferredCell;
      const frameHeight = match ? Number(match[2]) : inferredCell;
      if (frameWidth && frameHeight && metadata.width % frameWidth === 0 && metadata.height % frameHeight === 0) {
        const frames = [];
        const sequenceRoot = path.join(libraryRoot, "movimento", sourceId);
        mkdirSync(sequenceRoot, { recursive: true });
        let index = 0;
        for (let y = 0; y < metadata.height; y += frameHeight) for (let x = 0; x < metadata.width; x += frameWidth) {
          const framePath = path.join(sequenceRoot, `frame-${String(++index).padStart(3, "0")}.png`);
          await sharp(bytes).extract({ left: x, top: y, width: frameWidth, height: frameHeight }).png().toFile(framePath);
          frames.push(publicPath(framePath));
        }
        sequences.push({ id: sourceId, character: "Scenario", action: basename.replace(/\.png$/i, ""), frames, frameCount: frames.length, cell: `${frameWidth}x${frameHeight}`, outlined: false, perspective: "laterale 2D", source: archiveName, use: "Effetto ambientale", verdict: "ambienti" });
      }
      continue;
    }
    if (/background|bg dirt|layer|floor tiles|house tiles/i.test(entryName)) {
      const original = path.join(libraryRoot, "ambienti", sourceId, basename);
      ensureParent(original); writeFileSync(original, bytes);
      const preview = await makePreview(bytes, path.join(libraryRoot, "anteprime", `${sourceId}.webp`), 420);
      environments.push({ id: sourceId, label: basename.replace(/\.png$/i, ""), preview, original: publicPath(original), source: archiveName, perspective: "laterale 2D", verdict: "ambienti", use: /tiles/i.test(basename) ? "Muro, pavimento o tileset da assemblare" : "Fondale o livello di profondita" });
      continue;
    }
    const image = sharp(bytes).ensureAlpha();
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    let components = connectedBounds(data, info.width, info.height).filter((box) => box.pixels >= 20);
    if (components.length === 0) components = [{ left: 0, top: 0, width: info.width, height: info.height, pixels: info.width * info.height }];
    let index = 0;
    for (const box of components) {
      const padding = 1;
      const left = Math.max(0, box.left - padding), top = Math.max(0, box.top - padding);
      const width = Math.min(info.width - left, box.width + padding * 2), height = Math.min(info.height - top, box.height + padding * 2);
      const output = path.join(libraryRoot, "oggetti", safeName(basename.replace(/\.png$/i, "")), `${String(++index).padStart(3, "0")}.png`);
      ensureParent(output);
      await sharp(bytes).extract({ left, top, width, height }).png().toFile(output);
      objects.push({ id: `${sourceId}-${index}`, label: `${basename.replace(/\.png$/i, "")} ${index}`, preview: publicPath(output), original: publicPath(output), source: archiveName, perspective: "laterale 2D", verdict: "oggetti", use: "Oggetto singolo per scenario o stanza", size: `${width}x${height}` });
    }
  }
}

async function processPortraitSamples(portraits) {
  const root = path.join(sourceRoot, "nexus-keeper-layers");
  if (!existsSync(root)) return;
  const files = [];
  const walk = (folder) => { for (const name of readdirSync(folder)) { const full = path.join(folder, name); const stat = statSync(full); if (stat.isDirectory()) walk(full); else if (/vigile\.webp$/i.test(name)) files.push(full); } };
  walk(root);
  const chosen = files.filter((file) => /\\(base|head|hair|top|weapon)\\/i.test(file)).slice(0, 18);
  for (const file of chosen) {
    const relative = path.relative(root, file);
    const id = safeName(relative);
    const preview = await makePreview(readFileSync(file), path.join(libraryRoot, "ritratti", `${id}.webp`), 260);
    portraits.push({ id, label: relative.replace(/\\vigile\.webp$/i, ""), preview, source: "nexus-keeper-layers", perspective: "ritratto modulare", verdict: "ritratti", use: "Mercanti, dialoghi e schede; non e uno sprite di movimento" });
  }
}

function classifyArchive(name) {
  if (/music|sound|mp4/i.test(name)) return ["esclusi", "Audio o video: non e materiale grafico ritagliabile"];
  if (/monster mega|wild_monster/i.test(name)) return ["missioni", "Illustrazioni statiche: bestiario, incontri o carte; non Famigli animati"];
  if (/relic|armory|item-icons|reliquary/i.test(name)) return ["icone", "Inventario, mercato e ricompense; non ambienti"];
  if (/vfx|effect|spell|motion/i.test(name)) return ["vfx", "Effetti per missioni e rituali; tenere separati dai personaggi"];
  if (/dungeon/i.test(name)) return ["ambienti", "Mappe ad alta risoluzione, prospettiva da verificare; non stanza laterale diretta"];
  if (/creature|knight|paragon|reaper|behemoth|beholder|rat|enemies|character|platformer|forest scene|darkforest/i.test(name)) return ["candidati", "Materiale candidato gia aperto nel catalogo visuale"];
  return ["da-valutare", "Archivio inventariato, nessuna integrazione automatica"];
}

function inventoryArchives() {
  return readdirSync(sourceRoot).filter((name) => /\.(zip|rar)$/i.test(name)).sort().map((name) => {
    const full = path.join(sourceRoot, name);
    const [verdict, note] = classifyArchive(name);
    let imageCount = null;
    if (/\.zip$/i.test(name)) {
      const listed = spawnSync("tar", ["-tf", full], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
      if (listed.status === 0) imageCount = listed.stdout.split(/\r?\n/).filter((entry) => /\.(png|webp|jpe?g|gif)$/i.test(entry) && !entry.includes("__MACOSX") && !path.basename(entry).startsWith("._")).length;
    }
    return { name, sizeMb: Math.round(statSync(full).size / 1024 / 1024 * 10) / 10, imageCount, verdict, note };
  });
}

async function buildManifest() {
  mkdirSync(libraryRoot, { recursive: true });
  const sequences = [], objects = [], environments = [], portraits = [];
  await processMotionPacks(sequences);
  await processIndividualSequences("3 Creatures.zip", "Tre creature", sequences, environments);
  await processIndividualSequences("Forest Scene.zip", "Foresta animata", sequences, environments);
  await processPlatformer(objects, environments, sequences);
  await processPortraitSamples(portraits);
  const archives = inventoryArchives();
  const manifest = { generatedAt: new Date().toISOString(), sourceRoot, counts: { sequences: sequences.length, frames: sequences.reduce((sum, item) => sum + item.frameCount, 0), objects: objects.length, environments: environments.length, portraits: portraits.length, archives: archives.length }, sequences, objects, environments, portraits, archives };
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  return manifest;
}

const html = String.raw`<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Catalogo asset Famiglio</title><style>
*{box-sizing:border-box}body{margin:0;background:#080711;color:#f8f2ff;font:14px system-ui,sans-serif}button,input,select{font:inherit}.shell{max-width:1500px;margin:auto;padding:24px}.hero{border:1px solid #7454a1;border-radius:18px;padding:24px;background:linear-gradient(135deg,#281946,#121020);box-shadow:0 18px 55px #0008}.hero h1{margin:0;color:#ffe06b;letter-spacing:.05em}.hero p{color:#d1c2e4;max-width:850px;line-height:1.5}.stats{display:flex;gap:9px;flex-wrap:wrap}.stat{background:#3b275b;border:1px solid #8065a6;border-radius:999px;padding:7px 11px}.controls{position:sticky;top:0;z-index:2;margin:18px 0;padding:12px;background:#120e1ddd;border:1px solid #493764;border-radius:12px;backdrop-filter:blur(12px);display:flex;gap:8px;flex-wrap:wrap}.controls button{border:1px solid #755a9a;background:#2b1b45;color:#fff;padding:9px 12px;border-radius:9px;cursor:pointer}.controls button.active{background:#ffd45e;color:#24142d}.controls input{margin-left:auto;min-width:250px;background:#201631;border:1px solid #755a9a;color:#fff;border-radius:9px;padding:8px 10px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}.card{background:#171122;border:1px solid #493762;border-radius:14px;padding:12px;min-width:0}.preview{height:180px;display:grid;place-items:center;border-radius:10px;background:#0c0a14;overflow:hidden}.preview img{width:86%;height:86%;object-fit:contain;image-rendering:pixelated}.card h2{font-size:16px;margin:11px 0 5px}.meta{font-size:12px;color:#b9a8ca;line-height:1.45}.badge{display:inline-block;margin:4px 4px 0 0;border-radius:999px;padding:4px 7px;font-size:10px;text-transform:uppercase;letter-spacing:.06em;background:#34234e;color:#e8d9fb}.badge.famigli{background:#17483c;color:#8affd3}.badge.missioni{background:#4b3216;color:#ffd786}.badge.ambienti{background:#17364d;color:#9bdcff}.badge.oggetti{background:#414617;color:#e6ff8f}.badge.ritratti{background:#44264b;color:#ffc5ff}.archive{display:grid;grid-template-columns:minmax(260px,1fr) 90px 90px minmax(240px,1fr);gap:10px;padding:10px;border-bottom:1px solid #3a2b4c;align-items:center}.archive small{color:#b9a8ca}.empty{color:#b9a8ca;padding:30px}.download{display:inline-block;margin-top:8px;color:#ffe06b;text-decoration:none;font-size:12px}@media(max-width:700px){.shell{padding:12px}.controls{position:static}.controls input{width:100%;margin:0}.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.preview{height:130px}.archive{grid-template-columns:1fr 70px}.archive span:last-child{grid-column:1/-1}}
</style></head><body><main class="shell"><section class="hero"><h1>CATALOGO ASSET FAMIGLIO</h1><p>Inventario locale degli asset acquistati. I frame sono separati su tele uniformi e gli originali non vengono modificati. Le anteprime animate usano JavaScript, non animazioni CSS.</p><div id="stats" class="stats"></div></section><nav class="controls"><button data-tab="sequences" class="active">Movimenti</button><button data-tab="objects">Oggetti</button><button data-tab="environments">Ambienti</button><button data-tab="portraits">Ritratti</button><button data-tab="archives">Tutti gli archivi</button><input id="search" placeholder="Cerca nome, uso o provenienza"></nav><section id="content"></section></main><script>
let manifest,tab='sequences';const content=document.querySelector('#content'),search=document.querySelector('#search');
const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
function card(item,image,animated=false){const frames=animated?encodeURIComponent(JSON.stringify(item.frames)):'';return '<article class="card"><div class="preview"><img '+(animated?'data-frames="'+frames+'"':'')+' src="'+esc(image)+'" alt=""></div><h2>'+esc(item.character||item.label)+'</h2><div class="meta">'+esc(item.action||item.use)+'<br>'+esc(item.source)+'<br>'+esc(item.cell||item.size||item.perspective)+'</div><span class="badge '+esc(item.verdict)+'">'+esc(item.verdict)+'</span>'+(item.original?'<a class="download" href="'+esc(item.original)+'" download>Apri PNG estratto</a>':'')+'</article>'}
function render(){const q=search.value.toLowerCase();let list=manifest[tab]||[];list=list.filter(x=>JSON.stringify(x).toLowerCase().includes(q));if(tab==='archives'){content.innerHTML='<div class="card">'+list.map(a=>'<div class="archive"><b>'+esc(a.name)+'</b><span>'+a.sizeMb+' MB</span><span>'+(a.imageCount??'RAR')+' img</span><small><span class="badge '+esc(a.verdict)+'">'+esc(a.verdict)+'</span> '+esc(a.note)+'</small></div>').join('')+'</div>';return}content.innerHTML='<div class="grid">'+list.map(item=>card(item,item.frames?.[0]||item.preview,item.frames)).join('')+'</div>';startPreviews()}
let timer;function startPreviews(){clearInterval(timer);const images=[...document.querySelectorAll('[data-frames]')].map(img=>({img,frames:JSON.parse(decodeURIComponent(img.dataset.frames)).slice(0,40),index:0}));timer=setInterval(()=>{for(const x of images){x.index=(x.index+1)%x.frames.length;x.img.src=x.frames[x.index]}},140)}
document.querySelectorAll('[data-tab]').forEach(button=>button.onclick=()=>{tab=button.dataset.tab;document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===button));render()});search.oninput=render;
fetch('/manifest.json').then(r=>r.json()).then(data=>{manifest=data;document.querySelector('#stats').innerHTML=Object.entries(data.counts).map(([k,v])=>'<span class="stat"><b>'+v+'</b> '+k+'</span>').join('');render()});
</script></body></html>`;

const manifest = await buildManifest();
const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
  if (url.pathname === "/") { response.writeHead(200, { "content-type": "text/html; charset=utf-8" }); response.end(html); return; }
  if (url.pathname === "/manifest.json") { response.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }); response.end(JSON.stringify(manifest)); return; }
  if (!url.pathname.startsWith("/library/")) { response.writeHead(404).end("Not found"); return; }
  const decoded = url.pathname.slice("/library/".length).split("/").map(decodeURIComponent);
  const file = path.resolve(libraryRoot, ...decoded);
  if (!file.startsWith(libraryRoot + path.sep) || !existsSync(file)) { response.writeHead(404).end("Not found"); return; }
  const extension = path.extname(file).toLowerCase();
  const mime = { ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif" }[extension] || "application/octet-stream";
  response.writeHead(200, { "content-type": mime, "cache-control": "no-store" }); response.end(readFileSync(file));
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Catalogo asset pronto: http://127.0.0.1:${port}`);
  console.log(`${manifest.counts.sequences} sequenze, ${manifest.counts.frames} frame, ${manifest.counts.objects} oggetti, ${manifest.counts.environments} ambienti.`);
});
