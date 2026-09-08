export type MiniGameMode = "light" | "rhythm" | "catch" | "memory";
export type GameNote = { id: number; lane: number; born: number; travel: number; hazard: boolean };
export type GameTrap = { id: number; x: number; y: number; expires: number };
export type MiniGameRun = {
  mode: MiniGameMode; elapsed: number; duration: number; score: number; combo: number; bestCombo: number;
  hits: number; misses: number; lane: number; notes: GameNote[]; nextSpawn: number; serial: number;
  target: { x: number; y: number; expires: number }; sequence: number[]; memoryStart: number; memoryIndex: number;
  feedback: string; feedbackUntil: number; finished: boolean; lives: number;
  trapsUnlocked: boolean; traps: GameTrap[]; nextTrap: number;
};
const lane = (random: () => number) => Math.min(3, Math.floor(random() * 4));
export const RHYTHM_BEAT_MS = 60000 / 110;
export const RHYTHM_FIRST_HIT_MS = 150 + RHYTHM_BEAT_MS * 4;
export const RHYTHM_WINDOW_MS = 150;
export function rhythmSpeed(elapsed: number) { return 1 + .2 * Math.min(1, Math.max(0, elapsed) / 40000); }
export function createMiniGame(mode: MiniGameMode, duration = 40, random = Math.random): MiniGameRun {
  return { mode, elapsed: 0, duration: duration * 1000, score: 0, combo: 0, bestCombo: 0, hits: 0, misses: 0,
    lane: 1, notes: [], nextSpawn: mode === "rhythm" ? RHYTHM_FIRST_HIT_MS - RHYTHM_BEAT_MS : 300, serial: 0, target: { x: 50, y: 40, expires: 2000 },
    sequence: [lane(random), lane(random)], memoryStart: 500, memoryIndex: 0, feedback: "", feedbackUntil: 0, finished: false, lives: 3,
    trapsUnlocked: false, traps: [], nextTrap: 0 };
}
export function memoryCue(s: MiniGameRun) {
  const time = s.elapsed - s.memoryStart;
  if (time < 0) return { showing: true, pad: -1 };
  const index = Math.floor(time / 750);
  return { showing: index < s.sequence.length, pad: index < s.sequence.length && time % 750 < 500 ? s.sequence[index] : -1 };
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
  const available = candidates.filter(point => separate(s.target, point));
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
  s.target = { x: 14 + random() * 72, y: 20 + random() * 48, expires: s.elapsed + Math.max(850, 2000 - s.hits * 45) };
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
    if (s.elapsed >= s.nextSpawn) {
      const id = ++s.serial;
      // Guarantee regular obstacles even when a random run would contain only stars.
      s.notes.push({ id, lane: lane(random), born: s.elapsed, travel: Math.max(1500, 2400 - s.hits * 18), hazard: id % 4 === 0 || random() < .22 });
      s.nextSpawn = s.elapsed + Math.max(550, 1000 - s.hits * 12);
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
    if (s.sequence[s.memoryIndex] !== input) {
      result(s, false, "Riguarda la sequenza"); s.memoryIndex = 0; s.memoryStart = s.elapsed + 1000;
    } else {
      result(s, true); s.memoryIndex++;
      if (s.memoryIndex === s.sequence.length) {
        s.feedback = "Sequenza completata!";
        s.sequence = [...s.sequence, lane(random)].slice(-7); s.memoryIndex = 0; s.memoryStart = s.elapsed + 1000;
      }
    }
  }
  return s;
}
