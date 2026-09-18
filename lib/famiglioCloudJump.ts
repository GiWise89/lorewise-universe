export type CloudPlatform = { id: number; x: number; width: number; y: number; gem: boolean; landed: boolean; kind: "stable" };
import { FAMILIAR_COMBAT_CAMPAIGN } from "./famiglioCombatCampaign.ts";
export const CLOUD_NPCS = FAMILIAR_COMBAT_CAMPAIGN.map(level => level.npc);
export type CloudEnemy = { id: number; platformId: number; x: number; y: number; warnedAt: number | null; passed: boolean; npcIndex: number; hitAt: number | null; behavior?: "sentry" | "patrol" | "caster"; anchorX?: number };
export function cloudEnemyLabel(enemy: CloudEnemy) {
  return enemy.behavior === "patrol" ? "Pattuglia ↔" : enemy.behavior === "caster" ? "Evoca una runa: salta!" : "Sentinella";
}
// Keep rune and body inside the same jump's clearance window at the starting speed.
export function cloudRuneX(enemy: CloudEnemy) { return enemy.x - 16; }
export function cloudRuneCanActivate(enemy: CloudEnemy, state: CloudRun) {
  const platform = state.platforms.find(p => p.id === enemy.platformId);
  if (!platform) return false;
  // Reserve the full flight plus a takeoff/landing margin on solid ground.
  // Look ahead one speed stage so an acceleration during the jump is safe too.
  const reach = cloudRunSpeed(state.elapsed + 1000) * .44;
  const center = enemy.x - 8;
  return center - reach >= platform.x + 18 && center + reach <= platform.x + platform.width - 18;
}
export type CloudRun = {
  elapsed: number; duration: number; camera: number; y: number; vy: number; grounded: boolean;
  coyote: number; buffered: number; platforms: CloudPlatform[]; enemies: CloudEnemy[]; serial: number;
  score: number; hits: number; misses: number; lives: number; finished: boolean;
  feedback: string; feedbackUntil: number; invulnerableUntil: number;
  npcBag: number[]; lastNpcIndex: number;
};

export const CLOUD_VIEW_WIDTH = 600;
export const CLOUD_VIEW_HEIGHT = 400;
export const CLOUD_PLAYER_X = 160;
export const CLOUD_TRACK_Y = 300;
export const CLOUD_PLATFORM_SURFACE_OFFSET = 8;
const PLATFORM_WIDTHS = [154, 223, 303] as const;
const START_DELAY_MS = 2_200;

export function cloudSpeedStage(elapsed: number) { return Math.max(0, Math.floor(Math.max(0, elapsed) / 10_000)); }
export function cloudRunSpeed(elapsed: number) { return 124 + cloudSpeedStage(elapsed) * 16; }

export function createCloudRun(duration = 40): CloudRun {
  return { elapsed: 0, duration: duration * 1_000, camera: -24, y: CLOUD_TRACK_Y, vy: 0, grounded: true, coyote: 110, buffered: 0,
    platforms: [{ id: 0, x: -24, width: 303, y: CLOUD_TRACK_Y, gem: false, landed: true, kind: "stable" }], enemies: [], serial: 0,
    score: 0, hits: 0, misses: 0, lives: 3, finished: false, feedback: "Tocca per saltare", feedbackUntil: 2_200, invulnerableUntil: 0, npcBag: [], lastNpcIndex: -1 };
}

export function nextCloudNpc(state: CloudRun, random: () => number): number {
  if (!state.npcBag.length) {
    state.npcBag = CLOUD_NPCS.map((_, index) => index);
    for (let i = state.npcBag.length - 1; i > 0; i--) {
      const j = Math.min(i, Math.floor(Math.max(0, random()) * (i + 1)));
      [state.npcBag[i], state.npcBag[j]] = [state.npcBag[j], state.npcBag[i]];
    }
    if (state.npcBag.at(-1) === state.lastNpcIndex && state.npcBag.length > 1) {
      const last = state.npcBag.length - 1;
      [state.npcBag[0], state.npcBag[last]] = [state.npcBag[last], state.npcBag[0]];
    }
  }
  state.lastNpcIndex = state.npcBag.pop()!;
  return state.lastNpcIndex;
}

export function jumpCloud(state: CloudRun): CloudRun {
  if (state.finished) return state;
  if (state.grounded || state.coyote > 0) return { ...state, vy: -390, grounded: false, coyote: 0, buffered: 0 };
  return { ...state, buffered: 130 };
}

function spawnAhead(state: CloudRun, random: () => number) {
  let last = state.platforms.at(-1)!;
  const stage = cloudSpeedStage(state.elapsed);
  while (last.x + last.width < state.camera + CLOUD_VIEW_WIDTH + 320) {
    const id = ++state.serial;
    const width = PLATFORM_WIDTHS[id % PLATFORM_WIDTHS.length];
    const gap = Math.max(34, 44 - stage) + Math.round(random() * 8);
    const platform: CloudPlatform = { id, x: last.x + last.width + gap, width, y: CLOUD_TRACK_Y, gem: id % 2 === 1, landed: false, kind: "stable" };
    state.platforms.push(platform);
    if (width >= 220 && id % 2 === 0) {
      const npcIndex = nextCloudNpc(state, random);
      const behavior = (["sentry", "patrol", "caster"] as const)[npcIndex % 3];
      const x = behavior === "caster" ? platform.x + width / 2 + 8 : platform.x + Math.min(width - 42, Math.max(54, width * .7));
      state.enemies.push({ id, platformId: id, x, anchorX:x, y: platform.y, warnedAt: null, passed: false, npcIndex, hitAt: null, behavior });
    }
    last = platform;
  }
}

function loseLife(state: CloudRun, feedback: string) {
  state.lives = Math.max(0, state.lives - 1); state.misses += 1; state.feedback = feedback;
  state.feedbackUntil = state.elapsed + 1_200; state.invulnerableUntil = state.elapsed + 1_700;
  if (state.lives === 0) state.finished = true;
}

function respawn(state: CloudRun) {
  const worldX = state.camera + CLOUD_PLAYER_X;
  const safe = state.platforms.find((platform) => platform.x >= worldX + 18) ?? state.platforms.at(-1)!;
  state.camera = safe.x + 22 - CLOUD_PLAYER_X; state.y = safe.y; state.vy = 0; state.grounded = true;
  state.coyote = 110; state.buffered = 0; safe.landed = true;
}

export function advanceCloud(previous: CloudRun, delta: number, random = Math.random): CloudRun {
  if (previous.finished) return previous;
  const state = { ...previous, npcBag: [...previous.npcBag], platforms: previous.platforms.map((platform) => ({ ...platform })), enemies: previous.enemies.map((enemy) => ({ ...enemy })) };
  let remaining = Math.min(250, Math.max(0, delta));
  while (remaining > 0 && !state.finished) {
    const milliseconds = Math.min(16, remaining), seconds = milliseconds / 1_000; remaining -= milliseconds;
    const oldStage = cloudSpeedStage(state.elapsed); state.elapsed += milliseconds; const newStage = cloudSpeedStage(state.elapsed);
    if (newStage > oldStage) { state.feedback = `Ritmo ${newStage + 1}: il cielo accelera!`; state.feedbackUntil = state.elapsed + 1_500; }
    if (state.elapsed > START_DELAY_MS) state.camera += cloudRunSpeed(state.elapsed) * seconds;
    spawnAhead(state, random);
    const worldX = state.camera + CLOUD_PLAYER_X, oldY = state.y;
    state.coyote = Math.max(0, state.coyote - milliseconds); state.buffered = Math.max(0, state.buffered - milliseconds);
    state.vy += 920 * seconds; state.y += state.vy * seconds; state.grounded = false;
    for (const platform of state.platforms) {
      const inside = worldX + 13 >= platform.x + 6 && worldX - 13 <= platform.x + platform.width - 6;
      if (inside && oldY <= platform.y + 1 && state.y >= platform.y && state.vy >= 0) {
        state.y = platform.y; state.vy = 0; state.grounded = true; state.coyote = 110;
        if (!platform.landed) { platform.landed = true; state.score += 1; state.hits += 1; state.feedback = "Atterraggio! +1"; state.feedbackUntil = state.elapsed + 650; }
        break;
      }
    }
    if (state.grounded && state.buffered > 0) { state.vy = -390; state.grounded = false; state.coyote = 0; state.buffered = 0; }
    for (const platform of state.platforms) if (platform.gem && Math.abs(worldX - (platform.x + platform.width * .42)) < 27 && Math.abs((state.y - 27) - (platform.y - 66)) < 35) {
      platform.gem = false; state.score += 2; state.hits += 1; state.feedback = "Gemma! +2"; state.feedbackUntil = state.elapsed + 700;
    }
    for (const enemy of state.enemies) {
      if (enemy.passed) continue;
      if (enemy.warnedAt === null && enemy.x - worldX < Math.max(310, cloudRunSpeed(state.elapsed) * 1.5 + 100)) enemy.warnedAt = state.elapsed;
      const armed = enemy.warnedAt !== null && state.elapsed - enemy.warnedAt >= 1_000;
      if (enemy.behavior === "patrol" && armed) {
        enemy.x = (enemy.anchorX ?? enemy.x) + Math.sin((state.elapsed - enemy.warnedAt! - 1000) / 450) * 24;
      }
      const runeHit = enemy.behavior === "caster" && cloudRuneCanActivate(enemy, state) && Math.abs(cloudRuneX(enemy) - worldX) < 22 && Math.abs(enemy.y - state.y) < 25;
      const bodyHit = Math.abs(enemy.x - worldX) < 27 && Math.abs(enemy.y - state.y) < 34;
      if (armed && (bodyHit || runeHit) && state.elapsed >= state.invulnerableUntil) { enemy.passed = true; enemy.hitAt = state.elapsed; loseLife(state, runeHit ? "Runa del guardiano! -1 vita" : "Impatto con il guardiano! -1 vita"); }
      else if (enemy.x < worldX - 40) {
        enemy.passed = true; state.feedback = "Guardiano superato!"; state.feedbackUntil = state.elapsed + 800;
      }
    }
    if (!state.finished && state.y > CLOUD_VIEW_HEIGHT + 54) { loseLife(state, "Caduta nel vuoto!"); if (!state.finished) respawn(state); }
    state.platforms = state.platforms.filter((platform) => platform.x + platform.width > state.camera - 120);
    state.enemies = state.enemies.filter((enemy) => enemy.x > state.camera - 100);
  }
  return state;
}
