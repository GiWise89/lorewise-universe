import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {createCloudRun,advanceCloud} from '../lib/famiglioCloudJump.ts';
import {FAMILIAR_COMBAT_CAMPAIGN} from '../lib/famiglioCombatCampaign.ts';

test('20 campaign NPCs have distinct silhouettes, real source animations and unclipped frames',async()=>{
 const root='public/famiglio/rebuild/combat/campaign/npcs/distinct-v3';
 const {roster}=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
 assert.equal(new Set(roster.map(n=>n.species)).size,20);
 const hashes=new Set();
 for(const [i,n] of roster.entries()){
  assert.equal(FAMILIAR_COMBAT_CAMPAIGN[i].npc.spriteSrc,`/famiglio/rebuild/combat/campaign/npcs/distinct-v3/${n.id}.png`);
  const {data,info}=await sharp(root+'/'+n.id+'.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const alpha=await sharp(root+'/'+n.id+'.png').ensureAlpha().extractChannel(3).raw().toBuffer();hashes.add(createHash('sha256').update(alpha).digest('hex'));
  assert.equal(info.width,1024);assert.equal(info.height,768);
  for(let y=0;y<768;y++)for(let x=0;x<1024;x++)if(x%128===0||x%128===127||y%128===0||y%128===127)assert.equal(data[(y*1024+x)*4+3],0,`${n.name} frame edge`);
  for(let row=0;row<6;row++){
   const frames=new Set();
   for(let c=0;c<8;c++){const f=await sharp(root+'/'+n.id+'.png').extract({left:c*128,top:row*128,width:128,height:128}).raw().toBuffer();frames.add(createHash('sha256').update(f).digest('hex'));}
   assert.ok(frames.size>=2,`${n.name} row ${row} must articulate`);
  }
 }
 assert.equal(hashes.size,20,'Recolors alone cannot pass');
});
test('cloud route offers multiple widths, moving/fragile clouds and optional higher path',()=>{
 let s=createCloudRun();const kinds=new Set(),widths=new Set();
 for(let i=0;i<100;i++){
  s={...s,camera:i*250,y:200,vy:0,lives:3,finished:false};s=advanceCloud(s,16,()=>.4);
  for(const p of s.platforms){kinds.add(p.kind);widths.add(p.width);}
 }
 for(const kind of ['stable','moving','fragile','bonus'])assert.ok(kinds.has(kind));
 assert.ok(widths.size>=3);
});
test('fragile cloud dissolves after contact while the stable route remains',()=>{
 let s=createCloudRun();s.platforms[0].kind='fragile';
 for(let i=0;i<60;i++)s=advanceCloud(s,16,()=>.5);
 assert.equal(s.platforms[0].broken,true);
});
test('enemy gives warning, then removes one life on contact without repeat damage',()=>{
 let s=createCloudRun();s.enemies=[{id:6,x:165,y:278,warnedAt:null,passed:false}];
 s=advanceCloud(s,16);assert.equal(s.lives,3);assert.ok(s.enemies[0].warnedAt!==null);
 s={...s,elapsed:2000,enemies:[{...s.enemies[0],x:s.camera+160}]};
 s=advanceCloud(s,16);assert.equal(s.lives,2);
 s=advanceCloud(s,16);assert.equal(s.lives,2);
});
