import test from 'node:test';
import assert from 'node:assert/strict';
import {createFamiliarHomeState,advanceFamiliarHome,claimFamiliarWeeklyChest} from '../lib/famiglioHome.ts';
import {createFamiliarWeeklyLoopState,familiarWeekKey,familiarWeeklyResetDate} from '../lib/famiglioWeeklyLoop.ts';
const launch='2026-09-08';
const before=Date.parse('2026-09-14T21:59:59Z'),after=Date.parse('2026-09-14T22:00:00Z');
function completed(){
  const home=createFamiliarHomeState();home.attendance.launchDate=launch;home.lastUpdatedAt=before;
  home.weeklyLoop={...createFamiliarWeeklyLoopState(new Date(before),launch),steps:['care','play','adventure','combat'],chestClaimed:true};
  return home;
}
test('the regular home tick clears an expired completed path at Rome midnight',()=>{
  const home=completed();const next=advanceFamiliarHome(home,after);
  assert.deepEqual(next.weeklyLoop.steps,[]);assert.equal(next.weeklyLoop.chestClaimed,false);
  assert.equal(home.weeklyLoop.steps.length,4);assert.deepEqual(next.wallet,home.wallet);
});
test('current-week progress remains completed and the next reset is explicit',()=>{
  const home=completed();const next=advanceFamiliarHome(home,before);
  assert.deepEqual(next.weeklyLoop.steps,home.weeklyLoop.steps);assert.equal(next.weeklyLoop.chestClaimed,true);
  assert.equal(familiarWeeklyResetDate(new Date(before),launch),'2026-09-15');
});
test('a stale completed path cannot claim last week chest after rollover',()=>{
  const home=completed();home.weeklyLoop.chestClaimed=false;
  const next=claimFamiliarWeeklyChest(home,after);
  assert.deepEqual(next.wallet,home.wallet);assert.deepEqual(next.weeklyLoop.steps,[]);
});
test('current-week chest credits once and does not reopen before the reset',()=>{
  const home=completed();home.weeklyLoop.chestClaimed=false;
  const first=claimFamiliarWeeklyChest(home,before),again=claimFamiliarWeeklyChest(first,before);
  assert.equal(first.wallet.nexusCoins,home.wallet.nexusCoins+45);
  assert.equal(first.wallet.relicFragments,home.wallet.relicFragments+2);
  assert.deepEqual(again.wallet,first.wallet);
});
test('default calendar does not freeze at the end of the annual album',()=>{
  assert.notEqual(familiarWeekKey(new Date('2030-09-08T12:00:00Z')),familiarWeekKey(new Date('2030-09-15T12:00:00Z')));
});
