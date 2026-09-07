import type { StarterEgg } from "@/lib/famiglioRebuild";

export type FamiliarSpriteAction =
  | "idle"
  | "walk"
  | "feed"
  | "play"
  | "clean"
  | "care"
  | "sit"
  | "groom"
  | "sleep"
  | "sleep-calm";

export type FamiliarSpriteSequence = {
  src: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  fps: number;
  loop: boolean;
  holdLastFrame: boolean;
  origin: "purchased" | "generated";
};

export type FamiliarSpriteSet = {
  previewScale: number;
  actions: Record<FamiliarSpriteAction, FamiliarSpriteSequence>;
};

const LOOPING_ACTIONS = new Set<FamiliarSpriteAction>(["idle", "walk", "feed", "play", "clean", "care"]);

const sequence = (
  species: StarterEgg["id"],
  action: FamiliarSpriteAction,
  size: number,
  frames: number,
  fps: number,
  origin: FamiliarSpriteSequence["origin"] = "purchased",
): FamiliarSpriteSequence => ({
  src: `/famiglio/rebuild/starters/${species}/${action}.png`,
  frameWidth: size,
  frameHeight: size,
  frames,
  fps,
  loop: LOOPING_ACTIONS.has(action),
  holdLastFrame: !LOOPING_ACTIONS.has(action),
  origin,
});

const actionSet = (
  species: StarterEgg["id"],
  size: number,
  frames: Record<FamiliarSpriteAction, number>,
  generated: FamiliarSpriteAction[] = [],
  sizeOverrides: Partial<Record<FamiliarSpriteAction, number>> = {},
): Record<FamiliarSpriteAction, FamiliarSpriteSequence> => Object.fromEntries(
  (Object.keys(frames) as FamiliarSpriteAction[]).map((action) => [
    action,
    sequence(
      species,
      action,
      sizeOverrides[action] ?? size,
      frames[action],
      action === "walk" || action === "play" ? 8 : action === "sleep" || action === "sleep-calm" || action === "sit" ? 4 : 6,
      generated.includes(action) ? "generated" : "purchased",
    ),
  ]),
) as Record<FamiliarSpriteAction, FamiliarSpriteSequence>;

export const FAMILIAR_SPRITE_ROSTER: Record<StarterEgg["id"], FamiliarSpriteSet> = {
  cat: {
    previewScale: 1,
    actions: actionSet("cat", 32, {
      idle: 7, walk: 7, feed: 8, play: 13, clean: 3,
      care: 14, sit: 3, groom: 18, sleep: 3, "sleep-calm": 3,
    }),
  },
  golden: {
    previewScale: 1.08,
    actions: actionSet("golden", 64, {
      idle: 10, walk: 6, feed: 29, play: 11, clean: 29,
      care: 12, sit: 8, groom: 29, sleep: 8, "sleep-calm": 8,
    }),
  },
  rabbit: {
    previewScale: .95,
    actions: actionSet("rabbit", 32, {
      idle: 12, walk: 8, feed: 5, play: 11, clean: 5,
      care: 6, sit: 6, groom: 5, sleep: 6, "sleep-calm": 6,
    }),
  },
  fox: {
    previewScale: 1,
    actions: actionSet("fox", 32, {
      idle: 4, walk: 8, feed: 8, play: 4, clean: 11,
      care: 11, sit: 11, groom: 8, sleep: 6, "sleep-calm": 6,
    }),
  },
  turtle: {
    previewScale: .92,
    actions: actionSet("turtle", 32, {
      idle: 8, walk: 8, feed: 10, play: 14, clean: 13,
      care: 7, sit: 7, groom: 13, sleep: 12, "sleep-calm": 12,
    }),
  },
  parrot: {
    previewScale: .72,
    actions: actionSet("parrot", 16, {
      idle: 6, walk: 6, feed: 6, play: 8, clean: 6,
      care: 6, sit: 6, groom: 6, sleep: 8, "sleep-calm": 8,
    }),
  },
  panda: {
    previewScale: 1.08,
    actions: actionSet("panda", 64, {
      idle: 4, walk: 8, feed: 12, play: 4, clean: 3,
      care: 12, sit: 4, groom: 7, sleep: 4, "sleep-calm": 4,
    }, ["walk"]),
  },
  horse: {
    previewScale: 1.12,
    actions: actionSet("horse", 32, {
      idle: 8, walk: 8, feed: 22, play: 8, clean: 8,
      care: 8, sit: 8, groom: 8, sleep: 6, "sleep-calm": 6,
    }, ["walk"], { walk: 64 }),
  },
};

export const REQUIRED_FAMILIAR_ACTIONS: readonly FamiliarSpriteAction[] = [
  "idle", "walk", "feed", "play", "clean", "care", "sit", "groom", "sleep", "sleep-calm",
];
