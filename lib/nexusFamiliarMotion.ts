export type FamiliarMotionFamily = "Gatto" | "Cane" | "Lupo" | "Coniglio" | "Volpe" | "Tartaruga" | "Gallina" | "Pappagallo" | "Orso";

export type FamiliarMotionProfile = {
  pixelsPerSecond: number;
  minimumTravelPixels: number;
  idleDelayMs: number;
  walkFrameMs: number;
};

export const FAMILIAR_MOTION_PROFILES: Record<FamiliarMotionFamily, FamiliarMotionProfile> = {
  Gatto: { pixelsPerSecond: 92, minimumTravelPixels: 72, idleDelayMs: 3600, walkFrameMs: 145 },
  Cane: { pixelsPerSecond: 118, minimumTravelPixels: 86, idleDelayMs: 3200, walkFrameMs: 132 },
  Lupo: { pixelsPerSecond: 102, minimumTravelPixels: 96, idleDelayMs: 3900, walkFrameMs: 158 },
  Coniglio: { pixelsPerSecond: 76, minimumTravelPixels: 68, idleDelayMs: 3650, walkFrameMs: 150 },
  Volpe: { pixelsPerSecond: 108, minimumTravelPixels: 82, idleDelayMs: 3500, walkFrameMs: 142 },
  Tartaruga: { pixelsPerSecond: 48, minimumTravelPixels: 54, idleDelayMs: 4400, walkFrameMs: 190 },
  Gallina: { pixelsPerSecond: 62, minimumTravelPixels: 60, idleDelayMs: 3300, walkFrameMs: 185 },
  Pappagallo: { pixelsPerSecond: 68, minimumTravelPixels: 62, idleDelayMs: 3700, walkFrameMs: 170 },
  Orso: { pixelsPerSecond: 88, minimumTravelPixels: 82, idleDelayMs: 4000, walkFrameMs: 162 },
};

const FAMILIAR_BEHAVIOR_BOTTOM_RATIOS: Record<FamiliarMotionFamily, Record<"idle" | "walk" | "sit" | "groom" | "rest", number>> = {
  Gatto: { idle: .36, walk: .36, sit: .36, groom: .36, rest: .36 },
  Cane: { idle: .39, walk: .39, sit: .39, groom: .39, rest: .39 },
  Lupo: { idle: .3125, walk: .333, sit: .3125, groom: .333, rest: .375 },
  Coniglio: { idle: 0, walk: 0, sit: 0, groom: 0, rest: 0 },
  Volpe: { idle: 0, walk: 0, sit: 0, groom: 0, rest: 0 },
  Tartaruga: { idle: 0, walk: 0, sit: 0, groom: 0, rest: 0 },
  Gallina: { idle: 0, walk: 0, sit: 0, groom: 0, rest: .0625 },
  Pappagallo: { idle: 0, walk: 0, sit: 0, groom: .25, rest: 0 },
  Orso: { idle: 0, walk: .03125, sit: 0, groom: 0, rest: 0 },
};

const FAMILIAR_ACTION_BOTTOM_RATIOS: Record<FamiliarMotionFamily, readonly number[]> = {
  Gatto: [.36, .36, .34, .32, .34],
  Cane: [.36, .36, .34, .32, .34],
  Lupo: [.333, .333, .333, .333, .313],
  Coniglio: [0, 0, 0, 0, 0],
  Volpe: [0, 0, 0, 0, 0],
  Tartaruga: [0, 0, 0, 0, 0],
  Gallina: [0, 0, 0, 0, 0],
  Pappagallo: [0, 0, 0, 0, .25],
  Orso: [0, .03125, 0, 0, 0],
};

export function familiarOpticalBottomRatio(family: string, behavior: "idle" | "walk" | "sit" | "groom" | "rest", actionRow: number | null) {
  const normalizedFamily = family in FAMILIAR_MOTION_PROFILES ? family as FamiliarMotionFamily : "Gatto";
  if (actionRow !== null) return FAMILIAR_ACTION_BOTTOM_RATIOS[normalizedFamily][Math.max(0, Math.min(4, Math.floor(actionRow)))] ?? 0;
  return FAMILIAR_BEHAVIOR_BOTTOM_RATIOS[normalizedFamily][behavior];
}

const FAMILIAR_FRAME_BOTTOM_OVERRIDES: Partial<Record<FamiliarMotionFamily, Record<string, readonly (number | undefined)[]>>> = {
  Gatto: { "action-3": [, .36, , , , , .36] },
  Cane: { "action-2": [, , , , .38], "action-3": [, .36, , , , , .36] },
  Lupo: { "action-3": [, .375] },
  Volpe: {
    walk: [0, .03125, .0625, .03125, 0, .03125, .0625, .03125],
    sit: [, , , .03125, .1875, .0625],
    groom: [, , , .03125, .1875, .0625],
    "action-2": [, .03125, .0625, .03125, , .03125, .0625, .03125],
  },
};

export function familiarFrameBottomRatio(
  family: string,
  behavior: "idle" | "walk" | "sit" | "groom" | "rest",
  actionRow: number | null,
  frame: number,
) {
  const normalizedFamily = family in FAMILIAR_MOTION_PROFILES ? family as FamiliarMotionFamily : "Gatto";
  const key = actionRow === null ? behavior : `action-${Math.max(0, Math.min(4, Math.floor(actionRow)))}`;
  const override = FAMILIAR_FRAME_BOTTOM_OVERRIDES[normalizedFamily]?.[key]?.[Math.max(0, Math.floor(frame))];
  return override ?? familiarOpticalBottomRatio(normalizedFamily, behavior, actionRow);
}

export function familiarFrameGroundShift(
  family: string,
  behavior: "idle" | "walk" | "sit" | "groom" | "rest",
  actionRow: number | null,
  frame: number,
) {
  return familiarFrameBottomRatio(family, behavior, actionRow, frame) - familiarOpticalBottomRatio(family, behavior, actionRow);
}

export function familiarWalkFrameDuration(family: string) {
  return (FAMILIAR_MOTION_PROFILES[family as FamiliarMotionFamily] ?? FAMILIAR_MOTION_PROFILES.Gatto).walkFrameMs;
}

export type FamiliarWalkPlan = {
  targetPercent: number;
  durationMs: number;
  flipped: boolean;
};

export function planFamiliarWalk(
  family: string,
  currentPercent: number,
  habitatWidth: number,
  petWidth: number,
  bounds: readonly [number, number],
  randomValue = Math.random(),
): FamiliarWalkPlan | null {
  const profile = FAMILIAR_MOTION_PROFILES[family as FamiliarMotionFamily] ?? FAMILIAR_MOTION_PROFILES.Gatto;
  const safeWidth = Math.max(1, habitatWidth);
  const spriteEdge = Math.min(34, Math.max(4, ((Math.max(1, petWidth) / 2 + 8) / safeWidth) * 100));
  const minimum = Math.max(spriteEdge, Math.min(bounds[0], 49));
  const maximum = Math.min(100 - spriteEdge, Math.max(bounds[1], 51));
  if (maximum <= minimum) return null;

  const minimumTravelPercent = Math.min((profile.minimumTravelPixels / safeWidth) * 100, (maximum - minimum) * .42);
  const candidates: Array<[number, number]> = [];
  if (currentPercent - minimum >= minimumTravelPercent) candidates.push([minimum, currentPercent - minimumTravelPercent]);
  if (maximum - currentPercent >= minimumTravelPercent) candidates.push([currentPercent + minimumTravelPercent, maximum]);
  if (candidates.length === 0) return null;

  const normalizedRandom = Math.min(.999999, Math.max(0, randomValue));
  const interval = candidates[Math.floor(normalizedRandom * candidates.length)];
  const localRandom = (normalizedRandom * candidates.length) % 1;
  const targetPercent = interval[0] + (interval[1] - interval[0]) * localRandom;
  const distancePixels = Math.abs(targetPercent - currentPercent) / 100 * safeWidth;
  const durationMs = Math.round(Math.min(7200, Math.max(850, distancePixels / profile.pixelsPerSecond * 1000)));
  return { targetPercent, durationMs, flipped: targetPercent < currentPercent };
}
