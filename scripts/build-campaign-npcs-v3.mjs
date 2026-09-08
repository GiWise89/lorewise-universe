import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
const roster = [
 ['grin','Goblin'],['murka','Lizardfolk'],['skarn','Skeleton'],['vorga','Orc'],
 ['kaien','Ronin'],['rei','Samurai'],['jinra','Tengu'],['shirok','Oni'],
 ['elyra','Dryad'],['maled','Wizard'],['sivra','Medusa'],['orun','Paladin'],
 ['draeven','AnubisWarrior'],['khar','Ogre'],['vael','Efreet'],['mordrek','DeathKnight'],
 ['nhal','Vampire'],['sevrath','Lich'],['azrakar','Demon'],['morvane','Planetar']
];
const out='public/famiglio/rebuild/combat/campaign/npcs/distinct-v3';
await fs.mkdir(out,{recursive:true});
const manifest=[];
for(const [index,[name,species]] of roster.entries()) {
 const root=`source-assets/campaign-npcs-v3/${species}`;
 const files=await fs.readdir(root);
 const find=(...actions)=>actions.map(a=>`${species}_${a}.png`).find(f=>files.includes(f));
 const sources={idle:find('idle'),command:find('attack_NOhitbox','attack'),walk:find('walk','fly','move'),hit:find('hit'),defeat:find('death','die')};
 const frames={};
 const idleMeta=await sharp(path.join(root,sources.idle)).metadata();
 const sourceCellWidth=idleMeta.width/4;
 for(const [action,file] of Object.entries(sources)) {
  if(!file)throw Error(`${species}: missing ${action}`);
  const input=path.join(root,file),m=await sharp(input).metadata();
  const cell=m.height/4;
  if(!Number.isInteger(cell)||m.width%sourceCellWidth)throw Error(`Invalid source grid: ${input}`);
  frames[action]=[];
  // The four source rows are DIRECTIONS, not actions. Keep the front direction.
  for(let i=0;i<m.width/sourceCellWidth;i++) frames[action].push(await sharp(input).extract({left:i*sourceCellWidth,top:0,width:sourceCellWidth,height:cell}).png().toBuffer());
 }
 const interpolate=(seq,n=8)=>Array.from({length:n},(_,i)=>seq[Math.min(seq.length-1,Math.floor(i*seq.length/n))]);
 let bounds={left:64,top:64,right:0,bottom:0};
 for(const [action,sequence] of Object.entries(frames))for(let i=0;i<sequence.length;i++) {
  const m=await sharp(sequence[i]).metadata();
  const padded=await sharp({create:{width:64,height:64,channels:4,background:'#00000000'}}).composite([{input:sequence[i],left:(64-m.width)/2,top:64-m.height}]).png().toBuffer();
  frames[action][i]=padded;
  const pixels=await sharp(padded).ensureAlpha().raw().toBuffer();
  for(let y=0;y<64;y++)for(let x=0;x<64;x++)if(pixels[(y*64+x)*4+3]) {bounds.left=Math.min(bounds.left,x);bounds.top=Math.min(bounds.top,y);bounds.right=Math.max(bounds.right,x);bounds.bottom=Math.max(bounds.bottom,y);}
 }
 const box={left:bounds.left,top:bounds.top,width:bounds.right-bounds.left+1,height:bounds.bottom-bounds.top+1};
 const factor=Math.max(1,Math.floor(112/Math.max(box.width,box.height)));
 const rows=[frames.idle,frames.command,[...frames.walk,...frames.idle],[...frames.hit,...frames.command],[...frames.command,...frames.idle],[...frames.hit,...frames.defeat]];
 const composites=[];
 for(let row=0;row<6;row++)for(const [col,input] of interpolate(rows[row]).entries()) {
  // Shared source grid and integer enlargement preserve pixel density, anchor and whole art.
  const width=box.width*factor,height=box.height*factor;
  const resized=await sharp(input).extract(box).resize(width,height,{kernel:'nearest'}).png().toBuffer();
  if(width>128||height>128)throw Error(`Oversized ${species}`);
  composites.push({input:resized,left:col*128+Math.floor((128-width)/2),top:row*128+120-height});
 }
 const id=`${String(index+1).padStart(2,'0')}-${name}`;
 const image=await sharp({create:{width:1024,height:768,channels:4,background:'#00000000'}}).composite(composites).png({palette:true}).toBuffer();
 await fs.writeFile(`${out}/${id}.png`,image);
 const alpha=await sharp(image).ensureAlpha().extractChannel(3).raw().toBuffer();
 manifest.push({level:index+1,name,species,id,sources,alphaHash:createHash('sha256').update(alpha).digest('hex'),sourceFrameCounts:Object.fromEntries(Object.entries(frames).map(([k,v])=>[k,v.length])),poses:['idle','command','cheer','anger','victory','defeat']});
}
if(new Set(manifest.map(n=>n.alphaHash)).size!==20)throw Error('NPC silhouettes are not distinct');
await fs.writeFile(`${out}/manifest.json`,JSON.stringify({source:'Fantasy RPG monster pack (by Franuka)',method:'Original articulated source frames; no hue variants. Reactions compose existing source actions, not newly drawn gestures.',roster:manifest},null,2));
console.log('Built 20 distinct NPCs; 6 sequences each; 20 unique alpha silhouettes.');
const contacts=[];
for(const [i,npc] of manifest.entries())contacts.push({input:await sharp(`${out}/${npc.id}.png`).extract({left:0,top:0,width:128,height:128}).png().toBuffer(),left:(i%4)*128,top:Math.floor(i/4)*128});
await fs.mkdir('artifacts/campaign-npcs-v3',{recursive:true});
await sharp({create:{width:512,height:640,channels:4,background:'#283447'}}).composite(contacts).png().toFile('artifacts/campaign-npcs-v3/roster.png');
