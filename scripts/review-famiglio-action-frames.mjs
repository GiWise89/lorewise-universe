import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = 'public/famiglio/rebuild/collection';
const entries = [];
for (const id of await fs.readdir(root)) {
  const directory = path.join(root,id,'growth/adulto/battle-v6');
  try { await fs.access(path.join(directory,'hit.png')); } catch { continue; }
  entries.push({label:id,directory});
  try { for (const variant of await fs.readdir(path.join(directory,'variants'))) entries.push({label:`${id}/${variant}`,directory:path.join(directory,'variants',variant)}); } catch {}
}
await fs.mkdir('artifacts/action-review',{recursive:true});
for (let page = 0; page * 8 < entries.length; page++) {
  const layers=[];
  for (const [row,entry] of entries.slice(page*8,page*8+8).entries()) {
    layers.push({input:Buffer.from(`<svg width="800" height="28"><text x="8" y="20" fill="white" font-size="17">${entry.label}: hit 3 / hit 4 / jump 4 / magic 4 / physical 4</text></svg>`),left:0,top:row*188});
    for (const [column,[pose,frame]] of [['hit',2],['hit',3],['jump',3],['magic',3],['physical',3]].entries()) {
      layers.push({input:await sharp(path.join(entry.directory,`${pose}.png`)).extract({left:frame*160,top:0,width:160,height:160}).png().toBuffer(),left:column*160,top:row*188+28});
    }
  }
  await sharp({create:{width:800,height:188*8,channels:4,background:'#29404b'}}).composite(layers).png().toFile(`artifacts/action-review/page-${page+1}.png`);
}
console.log(`Review: ${entries.length} identities, ${entries.length*5} action frames, ${Math.ceil(entries.length/8)} pages`);
