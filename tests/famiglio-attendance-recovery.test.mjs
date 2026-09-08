import test from 'node:test';
import assert from 'node:assert/strict';
import { createFamiliarHomeState } from '../lib/famiglioHome.ts';
import { claimFamiliarAttendanceReward, familiarAttendanceRecovery, familiarAttendancePosition, FAMILIAR_ATTENDANCE_COLLECTIBLES } from '../lib/famiglioAttendanceYear.ts';

const date = day => new Date(Date.UTC(2027, 8, 8 + day, 12));
const initial = () => {
  const state = createFamiliarHomeState();
  state.attendance.launchDate = '2026-09-08';
  return state;
};
const run = (state, from, count) => {
  let result;
  for(let day = from; day < from + count; day++) {
    result = claimFamiliarAttendanceReward(state, date(day));
    state = result.state;
  }
  return result;
};

test('recovery needs seven NEW days and never repeats the anniversary', () => {
  let state = initial();
  state.attendance.streak = 365;
  state.attendance.lastClaimDate = '2027-09-07';
  state.attendance.claimedDates = ['2027-09-07'];
  assert.equal(familiarAttendancePosition(date(0), state.attendance.launchDate).anniversary, false);
  assert.equal(familiarAttendanceRecovery(state.attendance, new Date('2027-09-07T12:00:00Z')).active, false);
  const before = run(state, 0, 6);
  assert.equal(before.reward.collectibleId, null);
  assert.equal(before.state.wallet.nexusCoins, state.wallet.nexusCoins);
  assert.deepEqual(before.state.inventory, state.inventory);
  const seventh = run(before.state, 6, 1);
  assert.equal(seventh.reward.collectibleId, 'attendance-01');
  assert.equal(seventh.reward.coins, 0);
  const duplicate = run(seventh.state, 6, 1);
  assert.equal(duplicate.duplicate, true);
  assert.deepEqual(duplicate.state, seventh.state);
  assert.equal(run(seventh.state, 7, 7).reward.collectibleId, 'attendance-02');
});

test('a missed day resets progress without removing collected memories', () => {
  const first = run(initial(), 0, 7);
  const resumed = run(first.state, 8, 6);
  assert.deepEqual(resumed.state.attendance.collectibles, ['attendance-01']);
  assert.equal(familiarAttendanceRecovery(resumed.state.attendance, date(13)).progress, 6);
  assert.equal(run(resumed.state, 14, 1).reward.collectibleId, 'attendance-02');
});

test('skips owned memories, unlocks completed season and stops when full', () => {
  const state = initial();
  state.attendance.collectibles = FAMILIAR_ATTENDANCE_COLLECTIBLES.filter(item => item.id !== 'attendance-13').map(item => item.id);
  state.deviceCover.ownedIds = state.deviceCover.ownedIds.filter(id => id !== 'midnight-blue');
  const recovered = run(state, 0, 7);
  assert.equal(recovered.reward.collectibleId, 'attendance-13');
  assert.ok(recovered.state.deviceCover.ownedIds.includes('midnight-blue'));
  assert.equal(recovered.state.attendance.echoShards, state.attendance.echoShards);
  assert.equal(familiarAttendanceRecovery(recovered.state.attendance, date(7)).next, null);
  const after = run(recovered.state, 7, 7);
  assert.equal(after.reward, null);
  assert.deepEqual(after.state, recovered.state);
});

test('all 52 missing memories can be recovered over 364 consecutive days', () => {
  const result = run(initial(), 0, 364);
  assert.equal(result.state.attendance.collectibles.length, 52);
  assert.equal(new Set(result.state.attendance.collectibles).size, 52);
  assert.equal(result.state.wallet.nexusCoins, initial().wallet.nexusCoins);
});
