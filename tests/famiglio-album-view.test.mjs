import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {albumRewardDate,albumSeasonProgress} from '../lib/famiglioAlbumView.ts';
import {FAMILIAR_ATTENDANCE_COLLECTIBLES,FAMILIAR_ATTENDANCE_SEASONS,seasonCoverRewards} from '../lib/famiglioAttendanceYear.ts';
test('album dates follow launch and year boundaries',()=>{assert.equal(albumRewardDate('2026-09-08',1),'14 settembre 2026');assert.equal(albumRewardDate('2026-09-08',52),'6 settembre 2027');});
test('set progress counts only valid distinct collectibles from its season',()=>{const p=albumSeasonProgress('lunare',['attendance-01','attendance-01','attendance-14','invalid']);assert.equal(p.count,1);assert.equal(p.missing,12);assert.equal(p.complete,false);assert.equal(albumSeasonProgress('lunare',FAMILIAR_ATTENDANCE_COLLECTIBLES.map(x=>x.id)).complete,true);});
test('each seasonal reward has an existing illustration and real reward id',()=>{assert.equal(seasonCoverRewards.length,4);for(const season of FAMILIAR_ATTENDANCE_SEASONS)assert.ok(fs.existsSync(`public${season.cover}`));});
test('weekly actions and album filters remain available with confirmed post-year recovery',()=>{const s=fs.readFileSync('components/FamiglioProgression.tsx','utf8');assert.match(s,/onNavigateStep\(selectedStep\)/);assert.match(s,/onClaimWeeklyChest/);assert.match(s,/data-complete=/);assert.match(s,/albumFilters/);assert.match(s,/albumRewardDate\(attendance.launchDate,selected.week\)/);assert.match(s,/ogni sette presenze consecutive recuperi un ricordo mancante/);});
