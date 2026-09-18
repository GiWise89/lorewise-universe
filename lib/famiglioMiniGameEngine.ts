export type MiniGameMode = "light" | "rhythm" | "catch" | "memory";
export type GameNote = { id: number; lane: number; born: number; travel: number; hazard: boolean; rain?: boolean };
export type GameTrap = { id: number; x: number; y: number; expires: number };
export type MiniGameRun = {
  mode: MiniGameMode; elapsed: number; duration: number; score: number; combo: number; bestCombo: number;
  hits: number; misses: number; lane: number; notes: GameNote[]; nextSpawn: number; serial: number;
  target: { x: number; y: number; expires: number }; sequence: number[]; memoryStart: number; memoryIndex: number;
  feedback: string; feedbackUntil: number; finished: boolean; lives: number;
  trapsUnlocked: boolean; traps: GameTrap[]; nextTrap: number;
  golden: { x: number; y: number; expires: number } | null; nextGolden: number;
  rainRemaining: number; rainStep: number; rainTravel: number; nextRain: number;
  memoryRound: number; mirror: boolean;
};
const lane = (random: () => number) => Math.min(3, Math.floor(random() * 4));
export const RHYTHM_BEAT_MS = 60000 / 110;
export const RHYTHM_FIRST_HIT_MS = 150 + RHYTHM_BEAT_MS * 4;
export const RHYTHM_WINDOW_MS = 150;
export function rhythmSpeed(elapsed: number) { return 1 + .2 * Math.min(1, Math.max(0, elapsed) / 40000); }
export function miniGameStage(elapsed: number) {
  return Math.floor(Math.max(0, elapsed) / 10_000);
}
export function miniGamePace(elapsed: number) {
  return 1 + .18 * miniGameStage(elapsed);
}
export function createMiniGame(mode: MiniGameMode, duration = 40, random = Math.random): MiniGameRun {
  return { mode, elapsed: 0, duration: duration * 1000, score: 0, combo: 0, bestCombo: 0, hits: 0, misses: 0,
    lane: 1, notes: [], nextSpawn: mode === "rhythm" ? RHYTHM_FIRST_HIT_MS - RHYTHM_BEAT_MS : 300, serial: 0, target: { x: 50, y: 40, expires: 2000 },
    sequence: [lane(random), lane(random)], memoryStart: 500, memoryIndex: 0, feedback: "", feedbackUntil: 0, finished: false, lives: 3,
    trapsUnlocked: false, traps: [], nextTrap: 0, golden: null, nextGolden: 12000,
    rainRemaining: 0, rainStep: 0, rainTravel: 2400, nextRain: 20000, memoryRound: 1, mirror: false };
}
export function memoryCue(s: MiniGameRun) {
  const time = s.elapsed - s.memoryStart;
  // Freeze the tempo for this sequence so acceleration cannot skip a cue.
  const beat = 750 / miniGamePace(s.memoryStart);
  if (time < 0) return { showing: true, pad: -1 };
  const index = Math.floor(time / beat);
  return { showing: index < s.sequence.length, pad: index < s.sequence.length && time % beat < beat * 2 / 3 ? s.sequence[index] : -1 };
}
function result(s: MiniGameRun, hit: boolean, message?: string) {
  if (s.finished) return;
  s.combo = hit ? s.combo + 1 : 0;
  s.bestCombo = Math.max(s.bestCombo, s.combo);
  if (hit) { s.hits++; s.score++; } else {
    s.misses++;
    if (s.mode !== "rhythm") { s.lives = Math.max(0, s.lives - 1); s.finished = s.lives === 0; }
  }
  if (s.mode === "light" && s.score >= 20) s.trapsUnlocked = true;
  s.feedback = message ?? (hit ? (s.combo > 2 ? `COMBO ${s.combo}` : "+1") : "MISS");
  s.feedbackUntil = s.elapsed + 850;
}
function refreshLightTraps(s: MiniGameRun, random: () => number) {
  if (!s.trapsUnlocked) return;
  const traps: GameTrap[] = [];
  const count = s.score >= 30 ? 2 : 1;
  const candidates = Array.from({ length: 18 }, () => ({ x: 14 + random()*72, y: 20 + random()*48 }));
  // Fallback positions guarantee separation even with a constant test RNG.
  candidates.push({x:14,y:20}, {x:86,y:20}, {x:14,y:68}, {x:86,y:68});
  const separate = (a: {x:number;y:number}, b: {x:number;y:number}) => Math.abs(a.x-b.x)>=28 || Math.abs(a.y-b.y)>=28;
  const available = candidates.filter(point => separate(s.target, point) && (!s.golden || separate(s.golden, point)));
  const first = count === 2 ? available.find(point => available.some(other => separate(point,other))) : available[0];
  const chosen = first ? [first] : [];
  if (first && count === 2) {
    const second = available.find(point => separate(first, point));
    if (second) chosen.push(second);
  }
  for (const point of chosen) {
    traps.push({ ...point, id: ++s.serial, expires: s.elapsed + 950 + random()*650 });
  }
  s.traps = traps;
  s.nextTrap = s.elapsed + 650 + random()*500;
}
function relocate(s: MiniGameRun, random: () => number) {
  s.golden = null;
  s.target = { x: 14 + random() * 72, y: 20 + random() * 48, expires: s.elapsed + (2000 - Math.min(300, s.hits * 15)) / miniGamePace(s.elapsed) };
  // Shuffle the decoys together with the light, not just on a separate slow timer.
  refreshLightTraps(s, random);
}
export function advanceMiniGame(previous: MiniGameRun, delta: number, random = Math.random): MiniGameRun {
  if (previous.finished) return previous;
  const s = { ...previous, notes: [...previous.notes], elapsed: previous.elapsed + Math.max(0, delta) };
  if (s.mode === "rhythm" && s.elapsed >= s.duration) { s.finished = true; return s; }
  s.trapsUnlocked = s.mode === "light" && (s.trapsUnlocked || s.score >= 20);
  if (!s.trapsUnlocked) s.traps = [];
  s.traps = s.traps.filter(trap => trap.expires > s.elapsed);
  if (s.trapsUnlocked && s.elapsed >= s.nextTrap) {
    if (s.mode === "light") refreshLightTraps(s, random);
    else {
    const x = random() < .5 ? 16 : 84;
    s.traps = [{ id: ++s.serial, x, y: s.mode === "memory" ? 88 : 48, expires: s.elapsed + 2200 }];
    s.nextTrap = s.elapsed + 2600;
    }
  }
  if (s.mode === "light" && s.elapsed >= s.target.expires) { result(s, false); relocate(s, random); }
  if (s.golden && s.elapsed >= s.golden.expires) s.golden = null;
  if (s.mode === "light" && !s.finished && s.elapsed >= s.nextGolden) {
    const points = [{x:14,y:20},{x:86,y:20},{x:14,y:68},{x:86,y:68}];
    const spot = points.find(p => [s.target,...s.traps].every(q => Math.abs(p.x-q.x)>=28 || Math.abs(p.y-q.y)>=28));
    const expires = Math.min(s.target.expires - 100, s.elapsed + 1100 / miniGamePace(s.elapsed));
    if (spot && expires - s.elapsed >= 250) {
      s.golden = {...spot, expires}; s.nextGolden = s.elapsed + 12000;
    }
  }
  if (s.mode === "rhythm") {
    // Chart positions are in source-audio time: playbackRate never causes drift.
    while (s.elapsed >= s.nextSpawn && s.nextSpawn + RHYTHM_BEAT_MS < s.duration - 400) {
      s.notes.push({ id: ++s.serial, lane: 0, born: s.nextSpawn, travel: RHYTHM_BEAT_MS, hazard: false });
      s.nextSpawn += RHYTHM_BEAT_MS;
    }
    s.notes = s.notes.filter(note => {
      if (s.elapsed > note.born + note.travel + RHYTHM_WINDOW_MS) { result(s, false, "Nota mancata"); return false; }
      return true;
    });
  }
  if (s.mode === "catch") {
    if (s.elapsed >= s.nextRain && !s.notes.length && !s.rainRemaining) {
      s.rainRemaining = 6; s.rainStep = 0; s.rainTravel = 2400 / miniGamePace(s.elapsed);
      s.nextRain = s.elapsed + 20000;
    }
    if (s.elapsed >= s.nextSpawn && (s.elapsed < s.nextRain || s.rainRemaining > 0)) {
      const id = ++s.serial;
      // Guarantee regular obstacles even when a random run would contain only stars.
      const pace = miniGamePace(s.elapsed);
      if (s.rainRemaining) {
        const route = [0,1,2,3,2,1];
        const starLane = Math.floor(s.nextRain / 20000) % 2 ? 3-route[s.rainStep] : route[s.rainStep];
        s.notes.push({id,lane:starLane,born:s.elapsed,travel:s.rainTravel,hazard:false,rain:true});
        s.notes.push({id:++s.serial,lane:(starLane+2)%4,born:s.elapsed,travel:s.rainTravel,hazard:true,rain:true});
        s.rainStep++; s.rainRemaining--;
        s.nextSpawn = s.elapsed + (s.rainRemaining ? s.rainTravel * .32 : s.rainTravel + 300);
      } else {
        s.notes.push({ id, lane: lane(random), born: s.elapsed, travel: 2400 / pace, hazard: id % 4 === 0 || random() < .22 });
        s.nextSpawn = s.elapsed + 1000 / pace;
      }
    }
    s.notes = s.notes.filter(note => {
      const age = s.elapsed - note.born;
      if (s.finished) return false;
      if (s.mode === "catch" && age >= note.travel) {
        if (note.lane === s.lane) {
          if (note.hazard) s.score = Math.max(0, s.score - 1);
          result(s, !note.hazard, note.hazard ? "Spina! −1 punto" : "+1");
        }
        else if (!note.hazard) result(s, false);
        return false;
      }
      return true;
    });
  }
  return s;
}
export function pressMiniGameTrap(previous: MiniGameRun, id: number): MiniGameRun {
  if (previous.finished || previous.mode !== "light" || !previous.traps.some(t => t.id === id && t.expires > previous.elapsed)) return previous;
  return { ...previous, traps: previous.traps.filter(t => t.id !== id), score: Math.max(0, previous.score-1),
    combo: 0, misses: previous.misses+1, lives: Math.max(0, previous.lives-1), finished: previous.lives <= 1,
    feedback: "−1 vita · −1 punto", feedbackUntil: previous.elapsed+1000 };
}
export function catchGoldenLight(previous: MiniGameRun): MiniGameRun {
  if (previous.finished || previous.mode !== "light" || !previous.golden || previous.golden.expires <= previous.elapsed) return previous;
  const s = {...previous, golden:null};
  result(s, true, "Lucciola dorata! +3"); s.score += 2;
  return s;
}
export function inputMiniGame(previous: MiniGameRun, input: number, random = Math.random): MiniGameRun {
  if (previous.finished) return previous;
  const s = { ...previous, notes: [...previous.notes] };
  if (s.mode === "light") { result(s, true); relocate(s, random); }
  if (s.mode === "catch") s.lane = Math.max(0, Math.min(3, input));
  if (s.mode === "rhythm") {
    const note = s.notes.filter(n => n.lane === input).sort((a, b) => a.born - b.born)[0];
    if (note && Math.abs(s.elapsed - note.born - note.travel) <= RHYTHM_WINDOW_MS) {
      result(s, true, Math.abs(s.elapsed - note.born - note.travel) < 90 ? "PERFETTO" : "+1");
      s.notes = s.notes.filter(n => n.id !== note.id);
    } else result(s, false, "Fuori tempo");
  }
  if (s.mode === "memory" && !memoryCue(s).showing) {
    const expected = s.mirror ? s.sequence[s.sequence.length - 1 - s.memoryIndex] : s.sequence[s.memoryIndex];
    if (expected !== input) {
      result(s, false, "Riguarda la sequenza"); s.memoryIndex = 0; s.memoryStart = s.elapsed + 650;
    } else {
      result(s, true); s.memoryIndex++;
      if (s.memoryIndex === s.sequence.length) {
        s.feedback = "Sequenza completata!";
        s.memoryRound++;
        s.mirror = miniGameStage(s.elapsed) >= 2 && s.memoryRound % 3 === 0;
        s.sequence = [...s.sequence, lane(random)]; s.memoryIndex = 0; s.memoryStart = s.elapsed + (s.mirror ? 1600 : 650);
      }
    }
  }
  return s;
}
