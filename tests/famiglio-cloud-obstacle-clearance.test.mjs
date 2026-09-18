import test from 'node:test';
import assert from 'node:assert/strict';
import {createCloudRun,advanceCloud,jumpCloud,cloudRunSpeed,cloudRuneCanActivate} from '../lib/famiglioCloudJump.ts';

function scene(width, elapsed) {
  const s=createCloudRun();
  s.elapsed=elapsed;
  s.platforms=[{id:0,x:0,width,y:300,gem:false,landed:true,kind:'stable'}];
  s.enemies=[{id:1,platformId:0,x:width/2+8,anchorX:width/2+8,y:300,warnedAt:elapsed-2000,passed:false,npcIndex:2,hitAt:null,behavior:'caster'}];
  return s;
}

test('every permitted rune has a real single-jump clearance window and solid landing',()=>{
  let permitted=0,skipped=0;
  for(const width of [223,303]) for(let stage=0;stage<=30;stage++) for(const boundary of [5000,9600]) {
    const start=scene(width,stage*10000+boundary);
    if(!cloudRuneCanActivate(start.enemies[0],start)){skipped++;continue;}
    permitted++;
    const speed=cloudRunSpeed(start.elapsed);
    let safeTimings=0;
    // Vary takeoff time in 8ms increments around the center of the jump.
    for(let offset=-160;offset<=160;offset+=8){
      let s=structuredClone(start);
      const takeoff=width/2-speed*(.42+offset/1000);
      if(takeoff<0)continue;
      s.camera=takeoff-160;
      s=jumpCloud(s);
      for(let frame=0;frame<140&&!s.grounded&&s.lives===3;frame++)s=advanceCloud(s,8,()=>.5);
      const x=s.camera+160;
      if(s.lives===3&&s.grounded&&x>start.enemies[0].x+27&&x<width-6)safeTimings++;
    }
    assert.ok(safeTimings>=8,`width ${width}, time ${start.elapsed}: ${safeTimings} safe inputs`);
  }
  assert.ok(permitted>20);assert.ok(skipped>20);
});

test('unsafe runes do not damage the pet even after warning',()=>{
  let s=scene(223,180000);
  assert.equal(cloudRuneCanActivate(s.enemies[0],s),false);
  // Rune-only collision region: outside the guardian body.
  s.camera=s.enemies[0].x-34-160;
  s=advanceCloud(s,1,()=>.5);
  assert.equal(s.lives,3);
});
