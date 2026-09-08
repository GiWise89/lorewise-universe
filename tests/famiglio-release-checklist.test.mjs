import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('in-game and public guides explain the current games and collection',()=>{for(const path of ['lib/famiglioTutorial.ts','app/giochi/nexus-pet/page.tsx']){const s=fs.readFileSync(path,'utf8');for(const name of ['Salto tra le nuvole','Acchiappa-oggetti','Memoria delle rune','13 ricordi'])assert.ok(s.includes(name),`${path}: ${name}`);assert.ok(!s.includes('Ritmo del Legame'));}});
test('cloud synchronization waits for an in-flight save and retries network failures',()=>{const s=fs.readFileSync('components/FamiglioNexusRebuild.tsx','utf8');assert.match(s,/cloudSaveInFlightRef.current\) \{ timeout = window.setTimeout\(send, 250\)/);assert.match(s,/response.status >= 500 \|\| response.status === 429/);assert.match(s,/\.catch\(retry\)/);assert.match(s,/cancelled = true; window.clearTimeout\(timeout\)/);});
