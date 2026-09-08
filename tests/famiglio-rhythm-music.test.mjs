import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createMiniGame,advanceMiniGame,inputMiniGame,RHYTHM_FIRST_HIT_MS,RHYTHM_BEAT_MS,rhythmSpeed } from '../lib/famiglioMiniGameEngine.ts';
test('rhythm has no traps even above 20 points',()=>{let s=createMiniGame('rhythm');s.score=40;s=advanceMiniGame(s,4000);assert.equal(s.trapsUnlocked,false);assert.deepEqual(s.traps,[]);});
test('chart follows source track beats independently of score and random',()=>{for(const score of [0,50]){let s=createMiniGame('rhythm');s.score=score;s=advanceMiniGame(s,RHYTHM_FIRST_HIT_MS,()=>.9);assert.equal(s.notes[0].lane,0);assert.equal(s.notes[0].born+s.notes[0].travel,RHYTHM_FIRST_HIT_MS);s=inputMiniGame(s,0);assert.equal(s.score,score+1);assert.equal(inputMiniGame(s,0).score,s.score);s=advanceMiniGame(s,RHYTHM_BEAT_MS);s=inputMiniGame(s,0);assert.equal(s.score,score+2);}});
test('audio speed ramps smoothly and remains bounded',()=>{assert.equal(rhythmSpeed(0),1);assert.equal(rhythmSpeed(20000),1.1);assert.equal(rhythmSpeed(90000),1.2);});
test('real music excerpt contains 40 seconds of PCM sound',()=>{const b=fs.readFileSync('public/famiglio/rebuild/audio/minigames/fields-of-hope-rhythm-v1.wav');assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal((b.length-44)/88200,40);assert.ok(b.subarray(44).some(v=>v!==0));});
