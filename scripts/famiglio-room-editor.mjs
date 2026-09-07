import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { unzipSync } from "fflate";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const archivePath = path.join(projectRoot, "tamagochi asset", "AnimalPack.zip");
const platformerArchivePath = "C:\\Users\\Luigi\\Documents\\asset game\\GandalfHardcore FREE Platformer Assets.zip";
const workRoot = path.join(projectRoot, ".tmp", "famiglio-room-editor");
const assetRoot = path.join(workRoot, "library");
const manifestPath = path.join(workRoot, "manifest.json");
const reviewRoot = path.join(projectRoot, ".tmp", "famiglio-asset-review");
const reviewLibraryRoot = path.join(reviewRoot, "library");
const reviewManifestPath = path.join(reviewRoot, "manifest.json");
const portArgument = process.argv.indexOf("--port");
const port = portArgument >= 0 ? Number(process.argv[portArgument + 1]) : 3022;

const safeName = (value) => value
  .normalize("NFKD")
  .replace(/[^a-zA-Z0-9]+/g, "-")
  .replace(/^-|-$/g, "")
  .toLowerCase();

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
      let minX = x;
      let minY = y;
      let maxX = x;
      let maxY = y;
      let pixels = 0;
      while (stack.length) {
        const index = stack.pop();
        const px = index % width;
        const py = Math.floor(index / width);
        pixels += 1;
        minX = Math.min(minX, px);
        minY = Math.min(minY, py);
        maxX = Math.max(maxX, px);
        maxY = Math.max(maxY, py);
        for (let oy = -1; oy <= 1; oy += 1) {
          for (let ox = -1; ox <= 1; ox += 1) {
            if (!ox && !oy) continue;
            const nx = px + ox;
            const ny = py + oy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            const next = ny * width + nx;
            if (!visited[next] && data[next * 4 + 3] >= 8) {
              visited[next] = 1;
              stack.push(next);
            }
          }
        }
      }
      const boxWidth = maxX - minX + 1;
      const boxHeight = maxY - minY + 1;
      if (pixels >= 10 && boxWidth >= 3 && boxHeight >= 3) {
        bounds.push({ left: minX, top: minY, width: boxWidth, height: boxHeight, pixels });
      }
    }
  }
  return bounds.sort((a, b) => a.top - b.top || a.left - b.left);
}

async function prepareLibrary() {
  if (existsSync(manifestPath)) {
    const existing = JSON.parse(readFileSync(manifestPath, "utf8"));
    if (existing.version === 5) return existing;
  }
  if (!existsSync(archivePath)) throw new Error(`Archivio non trovato: ${archivePath}`);
  mkdirSync(assetRoot, { recursive: true });
  const archive = unzipSync(new Uint8Array(readFileSync(archivePath)));
  const items = [];
  const backgrounds = [];
  const surfaces = [];

  for (const [entryName, bytes] of Object.entries(archive)) {
    if (!entryName.endsWith(".png") || entryName.includes("/__MACOSX/") || entryName.includes("/._")) continue;
    const isRoom = /AnimalPack\/Cats\/Mochi\/CatItems\/Rooms\/Room\d+\.png$/i.test(entryName);
    const isCatItem = entryName.includes("AnimalPack/Cats/Mochi/CatItems/");
    const isBunnyItem = entryName.includes("AnimalPack/Bunny/BunnyStuffs/");
    if (!isRoom && !isCatItem && !isBunnyItem) continue;
    const sourceName = path.basename(entryName, ".png");
    if (isRoom) {
      const outputName = `iso-${safeName(sourceName)}.png`;
      writeFileSync(path.join(assetRoot, outputName), bytes);
      backgrounds.push({
        id: outputName,
        label: sourceName.replace(/Room/i, "Stanza "),
        perspective: "isometrica",
        src: `/assets/${outputName}`,
      });
      continue;
    }

    const image = sharp(bytes).ensureAlpha();
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    const components = connectedBounds(data, info.width, info.height);
    let sequence = 0;
    for (const box of components) {
      sequence += 1;
      const padding = 2;
      const left = Math.max(0, box.left - padding);
      const top = Math.max(0, box.top - padding);
      const width = Math.min(info.width - left, box.width + padding * 2);
      const height = Math.min(info.height - top, box.height + padding * 2);
      const outputName = `${safeName(sourceName)}-${String(sequence).padStart(3, "0")}.png`;
      await sharp(bytes).extract({ left, top, width, height }).png().toFile(path.join(assetRoot, outputName));
      items.push({
        id: outputName,
        label: `${sourceName} ${sequence}`,
        family: isBunnyItem ? "Coniglio" : "Gatto",
        perspective: "isometrica",
        src: `/assets/${outputName}`,
        width,
        height,
      });
    }
  }

  const sceneFamilies = [
    ["Casa del Famiglio", "scenes", "tana"],
    ["Giardino delle lucciole", "themes/giardino-lucciole", "giardino"],
    ["Biblioteca astrale", "themes/biblioteca-astrale", "biblioteca"],
    ["Serra celeste", "themes/serra-celeste", "serra"],
    ["Cucina alchemica", "themes/cucina-alchemica", "cucina"],
  ];
  const phases = ["alba", "giorno", "pomeriggio", "tramonto", "notte"];
  for (const [familyLabel, folder, prefix] of sceneFamilies) {
    for (const phase of phases) {
      const fileName = folder === "scenes" ? `tana-${phase}-room-v2.png` : `${phase}-v1.png`;
      const absolute = path.join(projectRoot, "public", "famiglio", folder, fileName);
      if (!existsSync(absolute)) continue;
      backgrounds.push({
        id: `side-${prefix}-${phase}`,
        label: `${familyLabel} - ${phase}`,
        family: familyLabel,
        phase,
        perspective: "laterale 2D",
        src: `/project/famiglio/${folder}/${fileName}`,
      });
    }
  }

  if (existsSync(reviewManifestPath)) {
    const review = JSON.parse(readFileSync(reviewManifestPath, "utf8"));
    for (const object of review.objects ?? []) {
      const [width, height] = String(object.size ?? "32x32").split("x").map(Number);
      items.push({
        id: `review-${object.id}`,
        label: object.label,
        family: "Asset game",
        perspective: "laterale 2D",
        src: object.original.replace(/^\/library\//, "/review/"),
        width: width || 32,
        height: height || 32,
      });
    }
  }

  if (existsSync(platformerArchivePath)) {
    const platformer = unzipSync(new Uint8Array(readFileSync(platformerArchivePath)));
    const variants = [
      ["Normal", "Normale"],
      ["Autumn", "Autunno"],
      ["Winter", "Inverno"],
    ];
    for (const [folderName, label] of variants) {
      const prefix = new RegExp(`Background layers/${folderName} BG/`, "i");
      const layers = Object.entries(platformer)
        .filter(([entryName]) => prefix.test(entryName) && /\.png$/i.test(entryName))
        .sort(([nameA], [nameB]) => {
          const rank = (name) => /Background Castle/i.test(name) ? 1 : 6 - Number(name.match(/layer (\d+)/i)?.[1] ?? 0);
          return rank(nameA) - rank(nameB);
        });
      if (layers.length < 6) continue;
      const base = await sharp(layers[0][1]).png().toBuffer();
      const composed = await sharp(base).composite(layers.slice(1).map(([, input]) => ({ input }))).png().toBuffer();
      const outputName = `castello-pixel-${folderName.toLowerCase()}.png`;
      await sharp(composed).resize({ width: 1600, height: 540, fit: "inside", withoutEnlargement: false }).png().toFile(path.join(assetRoot, outputName));
      backgrounds.push({ id: `side-castello-${folderName.toLowerCase()}`, label: `Castello pixel - ${label}`, family: `Castello pixel - ${label}`, phase: "scenario", perspective: "laterale 2D", src: `/assets/${outputName}` });
    }

    for (const [entryName, bytes] of Object.entries(platformer)) {
      const basename = path.basename(entryName);
      if (!/^(Floor Tiles[12]|BG Dirt[12]|House Tiles|Other Tiles[12])\.png$/i.test(basename)) continue;
      const baseId = safeName(basename.replace(/\.png$/i, ""));
      if (/^Floor Tiles/i.test(basename)) {
        const metadata = await sharp(bytes).metadata();
        let sequence = 0;
        for (let top = 0; top + 96 <= metadata.height; top += 96) {
          for (let left = 0; left + 96 <= metadata.width; left += 96) {
            const frame = sharp(bytes).extract({ left, top, width: 96, height: 96 }).ensureAlpha();
            const stats = await frame.stats();
            if ((stats.channels[3]?.max ?? 0) === 0) continue;
            const outputName = `surface-${baseId}-${String(++sequence).padStart(2, "0")}.png`;
            await frame.png().toFile(path.join(assetRoot, outputName));
            surfaces.push({ id: outputName, label: `Pavimento ${basename.match(/\d/)?.[0] ?? ""}.${sequence}`, group: "Pavimenti", perspective: "laterale 2D", src: `/assets/${outputName}`, width: 96, height: 96 });
          }
        }
        continue;
      }
      if (/^House Tiles/i.test(basename)) {
        for (let sequence = 0; sequence < 2; sequence += 1) {
          const outputName = `surface-${baseId}-${sequence + 1}.png`;
          await sharp(bytes).extract({ left: sequence * 224, top: 0, width: 224, height: 224 }).png().toFile(path.join(assetRoot, outputName));
          surfaces.push({ id: outputName, label: `Parete prefabbricata ${sequence + 1}`, group: "Pareti", perspective: "laterale 2D", src: `/assets/${outputName}`, width: 224, height: 224 });
        }
        continue;
      }
      if (/^BG Dirt/i.test(basename)) {
        const metadata = await sharp(bytes).metadata();
        const outputName = `surface-${baseId}.png`;
        writeFileSync(path.join(assetRoot, outputName), bytes);
        surfaces.push({ id: outputName, label: `Terreno ${basename.match(/\d/)?.[0] ?? ""}`, group: "Pavimenti", perspective: "laterale 2D", src: `/assets/${outputName}`, width: metadata.width, height: metadata.height });
        continue;
      }
      const image = sharp(bytes).ensureAlpha();
      const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
      let sequence = 0;
      for (const box of connectedBounds(data, info.width, info.height).filter((entry) => entry.pixels >= 20)) {
        const outputName = `surface-${baseId}-${String(++sequence).padStart(2, "0")}.png`;
        await sharp(bytes).extract(box).png().toFile(path.join(assetRoot, outputName));
        surfaces.push({ id: outputName, label: `Bordo e terreno ${basename.match(/\d/)?.[0] ?? ""}.${sequence}`, group: "Bordi", perspective: "laterale 2D", src: `/assets/${outputName}`, width: box.width, height: box.height });
      }
    }
  }

  const manifest = { version: 5, generatedAt: new Date().toISOString(), backgrounds, items, surfaces };
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  return manifest;
}

const html = String.raw`<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Officina stanze Famiglio</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#090813;color:#f7f0ff;font:14px system-ui,sans-serif}button,select,input{font:inherit}.app{display:grid;grid-template-columns:330px 1fr;min-height:100vh}.library{padding:18px;background:#171126;border-right:1px solid #58447a;overflow:auto;height:100vh}.library h1{font-size:19px;margin:0 0 6px;color:#ffe071}.library p{color:#c9badb;line-height:1.45}.filters{display:grid;gap:8px;margin:18px 0}.filters select,.filters input{width:100%;padding:9px;border:1px solid #6a548d;border-radius:8px;background:#24183b;color:white}.tabs{display:flex;gap:6px;margin-bottom:10px}.tabs button,.actions button{border:1px solid #8062a6;background:#382458;color:#fff;padding:8px 10px;border-radius:8px;cursor:pointer}.tabs button.active,.actions button.primary{background:#ffd35e;color:#24152d;border-color:#fff0a8}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.asset{border:1px solid #493765;background:#221832;border-radius:8px;padding:5px;min-height:86px;color:#fff;cursor:pointer}.asset img{display:block;width:100%;height:58px;object-fit:contain;image-rendering:pixelated}.asset span{display:block;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.workspace{display:flex;flex-direction:column;min-width:0}.toolbar{display:flex;gap:8px;flex-wrap:wrap;padding:12px 16px;background:#120d1d;border-bottom:1px solid #493765}.toolbar button{border:1px solid #8062a6;background:#2b1b45;color:#fff;padding:8px 11px;border-radius:8px;cursor:pointer}.stageWrap{flex:1;display:grid;place-items:center;padding:22px;overflow:auto}.stageFrame{border:2px solid #9174bf;border-radius:14px;background:#05040a;padding:10px;box-shadow:0 16px 45px #0008}.stage{display:block;max-width:min(100%,960px);height:auto;image-rendering:pixelated;touch-action:none;background:#151020}.status{padding:9px 16px;color:#bdaed0;background:#120d1d;border-top:1px solid #493765}.selected{color:#ffe071}.range{display:flex;align-items:center;gap:7px;padding:0 5px}.range input{width:110px}@media(max-width:850px){.app{grid-template-columns:1fr}.library{height:auto;max-height:42vh;border-right:0;border-bottom:1px solid #58447a}.grid{grid-template-columns:repeat(5,1fr)}.stageWrap{padding:10px}}
</style></head><body><div class="app">
<aside class="library"><h1>OFFICINA STANZE</h1><p>Seleziona una base, poi aggiungi e sposta gli oggetti. Gli asset acquistati restano solo in locale.</p>
<div class="tabs"><button id="backgroundTab" class="active">Stanze</button><button id="itemTab">Oggetti</button></div>
<div class="filters"><select id="perspective"><option value="laterale 2D">Laterale 2D</option><option value="isometrica">Isometrica</option></select><select id="phase"><option value="giorno">Orario: giorno</option><option value="alba">Orario: alba</option><option value="pomeriggio">Orario: pomeriggio</option><option value="tramonto">Orario: tramonto</option><option value="notte">Orario: notte</option></select><input id="search" placeholder="Cerca stanza o oggetto"></div><div id="assets" class="grid"></div></aside>
<main class="workspace"><div class="toolbar actions"><button id="undo">Annulla</button><button id="front">Porta avanti</button><button id="back">Porta indietro</button><button id="flip">Ribalta</button><button id="remove">Elimina</button><label class="range">Scala <input id="scale" type="range" min="25" max="400" value="100"></label><button id="save">Salva progetto</button><button id="load">Carica progetto</button><button id="export" class="primary">Esporta PNG</button></div>
<div class="stageWrap"><div class="stageFrame"><canvas id="stage" class="stage" width="960" height="540"></canvas></div></div><div id="status" class="status">Scegli una stanza 2D oppure passa alla libreria isometrica.</div></main>
</div><script>
const canvas=document.querySelector('#stage'),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
let manifest,tab='backgrounds',perspective='laterale 2D',phase='giorno',background=null,objects=[],selected=-1,drag=null,history=[],renderToken=0;const cache=new Map();
const loadImage=src=>cache.get(src)||cache.set(src,new Promise((ok,no)=>{const i=new Image;i.onload=()=>ok(i);i.onerror=no;i.src=src})).get(src);
function snapshot(){history.push(JSON.stringify({background,objects}));if(history.length>40)history.shift()}
async function draw(){const token=++renderToken;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#151020';ctx.fillRect(0,0,canvas.width,canvas.height);const activeBackground=background;if(activeBackground){const img=await loadImage(activeBackground.src);if(token!==renderToken)return;const r=Math.min(canvas.width/img.width,canvas.height/img.height),w=img.width*r,h=img.height*r;ctx.drawImage(img,(canvas.width-w)/2,(canvas.height-h)/2,w,h)}const activeObjects=objects.slice();for(let n=0;n<activeObjects.length;n++){const o=activeObjects[n],img=await loadImage(o.src);if(token!==renderToken)return;const w=img.width*o.scale,h=img.height*o.scale;ctx.save();ctx.translate(o.x,o.y);ctx.scale(o.flip?-1:1,1);ctx.drawImage(img,-w/2,-h/2,w,h);ctx.restore();if(n===selected){ctx.strokeStyle='#ffe071';ctx.lineWidth=2;ctx.strokeRect(o.x-w/2-4,o.y-h/2-4,w+8,h+8)}}}
function renderLibrary(){const query=document.querySelector('#search').value.toLowerCase();let list=(tab==='backgrounds'?manifest.backgrounds:manifest.items).filter(a=>a.perspective===perspective);if(tab==='backgrounds'&&perspective==='laterale 2D'){const families=new Map();for(const asset of list){const key=asset.family||asset.label;if(!families.has(key)||asset.phase===phase)families.set(key,asset)}list=[...families.values()]}list=list.filter(a=>(a.family+' '+a.label).toLowerCase().includes(query));const root=document.querySelector('#assets');root.innerHTML='';for(const asset of list){const b=document.createElement('button');b.className='asset';const display=tab==='backgrounds'?(asset.family||asset.label):asset.label;b.innerHTML='<img src="'+asset.src+'" alt=""><span>'+display+'</span>';b.onclick=()=>{snapshot();if(tab==='backgrounds')background=asset;else{const scale=Math.max(1,96/Math.max(asset.width||32,asset.height||32));objects.push({src:asset.src,label:asset.label,x:480,y:330,scale,flip:false,width:asset.width,height:asset.height});selected=objects.length-1;document.querySelector('#scale').value=Math.round(scale*100)}draw();};root.appendChild(b)}document.querySelector('#phase').style.display=tab==='backgrounds'&&perspective==='laterale 2D'?'block':'none';document.querySelector('#status').textContent=list.length+' elementi disponibili - '+perspective+(tab==='items'?' - clicca un oggetto per inserirlo':'')}
function selectTab(next){tab=next;document.querySelector('#backgroundTab').classList.toggle('active',tab==='backgrounds');document.querySelector('#itemTab').classList.toggle('active',tab==='items');renderLibrary()}
document.querySelector('#backgroundTab').onclick=()=>selectTab('backgrounds');document.querySelector('#itemTab').onclick=()=>selectTab('items');document.querySelector('#perspective').onchange=e=>{snapshot();perspective=e.target.value;background=null;objects=[];selected=-1;selectTab('backgrounds');draw();document.querySelector('#status').textContent='Prospettiva cambiata: scegli una base '+perspective+'.'};document.querySelector('#search').oninput=renderLibrary;
document.querySelector('#phase').onchange=e=>{phase=e.target.value;if(background?.family){const replacement=manifest.backgrounds.find(a=>a.family===background.family&&a.phase===phase);if(replacement)background=replacement}renderLibrary();draw()};
canvas.onpointerdown=e=>{const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*canvas.width/r.width,y=(e.clientY-r.top)*canvas.height/r.height;selected=-1;for(let n=objects.length-1;n>=0;n--){const o=objects[n],img=cache.get(o.src);if(!img)continue;img.then(i=>{});const w=(o.width||100)*o.scale,h=(o.height||100)*o.scale;if(x>=o.x-w/2&&x<=o.x+w/2&&y>=o.y-h/2&&y<=o.y+h/2){selected=n;break}}if(selected>=0){snapshot();drag={dx:x-objects[selected].x,dy:y-objects[selected].y};canvas.setPointerCapture(e.pointerId);document.querySelector('#scale').value=Math.round(objects[selected].scale*100)}draw()};
canvas.onpointermove=e=>{if(!drag||selected<0)return;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*canvas.width/r.width,y=(e.clientY-r.top)*canvas.height/r.height;objects[selected].x=x-drag.dx;objects[selected].y=y-drag.dy;draw()};canvas.onpointerup=()=>drag=null;
document.querySelector('#scale').oninput=e=>{if(selected<0)return;objects[selected].scale=Number(e.target.value)/100;draw()};document.querySelector('#remove').onclick=()=>{if(selected<0)return;snapshot();objects.splice(selected,1);selected=-1;draw()};document.querySelector('#flip').onclick=()=>{if(selected<0)return;snapshot();objects[selected].flip=!objects[selected].flip;draw()};document.querySelector('#front').onclick=()=>{if(selected<0||selected===objects.length-1)return;snapshot();const [o]=objects.splice(selected,1);objects.push(o);selected=objects.length-1;draw()};document.querySelector('#back').onclick=()=>{if(selected<=0)return;snapshot();const [o]=objects.splice(selected,1);objects.unshift(o);selected=0;draw()};document.querySelector('#undo').onclick=()=>{const state=history.pop();if(!state)return;({background,objects}=JSON.parse(state));selected=-1;draw()};
document.querySelector('#save').onclick=()=>{localStorage.setItem('famiglio-room-project',JSON.stringify({background,objects}));document.querySelector('#status').textContent='Progetto salvato nel browser.'};document.querySelector('#load').onclick=()=>{const s=localStorage.getItem('famiglio-room-project');if(!s)return;snapshot();({background,objects}=JSON.parse(s));selected=-1;draw()};document.querySelector('#export').onclick=()=>{selected=-1;draw().then(()=>canvas.toBlob(blob=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='stanza-famiglio.png';a.click();URL.revokeObjectURL(a.href)},'image/png'))};
fetch('/manifest.json').then(r=>r.json()).then(data=>{manifest=data;renderLibrary();draw()});
</script></body></html>`;

const manifest = await prepareLibrary();
const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
  let filePath;
  if (url.pathname === "/") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(html);
    return;
  }
  if (url.pathname === "/manifest.json") {
    response.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    response.end(JSON.stringify(manifest));
    return;
  }
  if (url.pathname.startsWith("/assets/")) filePath = path.join(assetRoot, path.basename(url.pathname));
  if (url.pathname.startsWith("/project/famiglio/")) filePath = path.join(projectRoot, "public", url.pathname.replace(/^\/project\//, ""));
  if (url.pathname.startsWith("/review/")) {
    const parts = url.pathname.slice("/review/".length).split("/").map(decodeURIComponent);
    filePath = path.resolve(reviewLibraryRoot, ...parts);
  }
  const allowed = filePath && (filePath.startsWith(projectRoot) || filePath.startsWith(reviewLibraryRoot));
  if (!allowed || !existsSync(filePath)) {
    response.writeHead(404).end("Not found");
    return;
  }
  response.writeHead(200, { "content-type": "image/png", "cache-control": "no-store" });
  response.end(readFileSync(filePath));
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Officina stanze pronta: http://127.0.0.1:${port}`);
  console.log(`${manifest.backgrounds.length} basi e ${manifest.items.length} oggetti catalogati.`);
});
