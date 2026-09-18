import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {createCloudRun,advanceCloud,cloudRunSpeed,cloudSpeedStage} from '../lib/famiglioCloudJump.ts';
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
test('cloud route offers flat walkable platforms of multiple widths and recurring obstacles',()=>{
 let s=createCloudRun();const widths=new Set();let enemies=0;
 for(let i=0;i<100;i++){
  s={...s,camera:i*250,y:300,vy:0,lives:3,finished:false};s=advanceCloud(s,16,()=>.4);
  for(const p of s.platforms){assert.equal(p.kind,'stable');assert.equal(p.y,300);widths.add(p.width);}
  enemies+=s.enemies.length;
 }
 assert.ok(widths.size>=3);
 assert.ok(enemies>0);
});
test('enemy gives warning, then removes one life on contact without repeat damage',()=>{
 let s=createCloudRun();s.enemies=[{id:6,platformId:0,x:165,y:300,warnedAt:null,passed:false}];
 s=advanceCloud(s,16);assert.equal(s.lives,3);assert.ok(s.enemies[0].warnedAt!==null);
 s={...s,elapsed:2000,enemies:[{...s.enemies[0],x:s.camera+160}]};
 s=advanceCloud(s,16);assert.equal(s.lives,2);
 s=advanceCloud(s,16);assert.equal(s.lives,2);
});
test('generated cloud sprites have transparent breathing room and every actor uses the same walk line',async()=>{
 for(const file of ['public/famiglio/rebuild/effects/minigame-jump-platform-short-v5.png','public/famiglio/rebuild/effects/minigame-jump-platform-medium-v5.png','public/famiglio/rebuild/effects/minigame-jump-platform-long-v5.png']){
  const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let sideAlpha=0,bottomAlpha=0,bestRailAlpha=0;
  for(let y=0;y<info.height;y++)sideAlpha+=Number(data[(y*info.width)*4+3]>0)+Number(data[(y*info.width+info.width-1)*4+3]>0);
  for(let y=0;y<Math.ceil(info.height*.25);y++){let rowAlpha=0;for(let x=0;x<info.width;x++)rowAlpha+=Number(data[(y*info.width+x)*4+3]>0);bestRailAlpha=Math.max(bestRailAlpha,rowAlpha);}
  for(let x=0;x<info.width;x++)bottomAlpha+=Number(data[((info.height-1)*info.width+x)*4+3]>0);
  assert.equal(sideAlpha,0,`${file} must not touch a side edge`);
  assert.equal(bottomAlpha,0,`${file} must not touch the bottom edge`);
  assert.ok(bestRailAlpha>info.width*.7,`${file} must expose a continuous walkable top line`);
 }
 const component=fs.readFileSync('components/FamiglioCloudGame.tsx','utf8');
 const css=fs.readFileSync('components/FamiglioCloudGame.module.css','utf8');
 assert.match(component,/top:percentY\(platform\.y-CLOUD_PLATFORM_SURFACE_OFFSET\)/);
 assert.match(component,/top:percentY\(run\.y\)/);
 assert.match(component,/x\+platform\.width>0&&x<CLOUD_VIEW_WIDTH/);
 assert.match(component,/grounded\/>/);
 assert.match(component,/SALTA ORA/);
 const home=fs.readFileSync('components/FamiglioNexusRebuild.tsx','utf8');
 const npc=fs.readFileSync('components/FamiglioCampaignNpcCanvas.tsx','utf8');
 assert.match(home,/<FamiliarPreview egg=\{homeFamiliar\} colorVariant=\{state\.colorVariant\} grounded/);
 assert.match(npc,/const sourceCanvas = grounded/);
 assert.match(css,/\.pet,\.enemy\s*\{[^}]*translate\(-50%,-100%\)/);
});
test('cloud rhythm rises every ten seconds and keeps increasing beyond the former cap',()=>{
 assert.equal(cloudSpeedStage(9999),0);assert.equal(cloudSpeedStage(10000),1);assert.equal(cloudSpeedStage(30000),3);
 assert.ok(cloudRunSpeed(10000)>cloudRunSpeed(9999));assert.ok(cloudRunSpeed(180000)>cloudRunSpeed(120000));
});
