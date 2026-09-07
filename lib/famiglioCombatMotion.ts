export type FamiliarCombatArchetype =
  | "quadrupede-leggero"
  | "quadrupede-pesante"
  | "volatile"
  | "creatura-volante"
  | "rettile"
  | "rettile-pesante"
  | "bipede"
  | "creatura-magica";

export type FamiliarCombatMotionProfile = {
  archetype: FamiliarCombatArchetype;
  idleFrameMs: number;
  runFrameMs: number;
  actionFrameMs: number;
  entranceDurationMs: number;
  phaseDurationScale: number;
  travelCurve: "elastic" | "swift" | "weighted" | "hover" | "glide" | "crawl" | "stomp" | "pulse";
};

const ARCHETYPE_PROFILES: Readonly<Record<FamiliarCombatArchetype, FamiliarCombatMotionProfile>> = {
  "quadrupede-leggero": { archetype: "quadrupede-leggero", idleFrameMs: 330, runFrameMs: 118, actionFrameMs: 132, entranceDurationMs: 690, phaseDurationScale: .9, travelCurve: "elastic" },
  "quadrupede-pesante": { archetype: "quadrupede-pesante", idleFrameMs: 430, runFrameMs: 178, actionFrameMs: 185, entranceDurationMs: 940, phaseDurationScale: 1.12, travelCurve: "weighted" },
  volatile: { archetype: "volatile", idleFrameMs: 270, runFrameMs: 105, actionFrameMs: 118, entranceDurationMs: 610, phaseDurationScale: .84, travelCurve: "swift" },
  "creatura-volante": { archetype: "creatura-volante", idleFrameMs: 235, runFrameMs: 112, actionFrameMs: 126, entranceDurationMs: 720, phaseDurationScale: .92, travelCurve: "glide" },
  rettile: { archetype: "rettile", idleFrameMs: 460, runFrameMs: 205, actionFrameMs: 194, entranceDurationMs: 1010, phaseDurationScale: 1.16, travelCurve: "crawl" },
  "rettile-pesante": { archetype: "rettile-pesante", idleFrameMs: 500, runFrameMs: 225, actionFrameMs: 215, entranceDurationMs: 1120, phaseDurationScale: 1.24, travelCurve: "stomp" },
  bipede: { archetype: "bipede", idleFrameMs: 350, runFrameMs: 138, actionFrameMs: 145, entranceDurationMs: 760, phaseDurationScale: .98, travelCurve: "swift" },
  "creatura-magica": { archetype: "creatura-magica", idleFrameMs: 285, runFrameMs: 150, actionFrameMs: 138, entranceDurationMs: 780, phaseDurationScale: 1, travelCurve: "pulse" },
};

const ARCHETYPE_BY_FAMILIAR_ID: Readonly<Record<string, FamiliarCombatArchetype>> = {
  cat: "quadrupede-leggero", golden: "quadrupede-leggero", akita: "quadrupede-leggero", schnauzer: "quadrupede-leggero", husky: "quadrupede-leggero",
  rabbit: "quadrupede-leggero", fox: "quadrupede-leggero", wolf: "quadrupede-leggero", "fairy-rabbit": "quadrupede-leggero", "demon-rabbit": "quadrupede-leggero",
  "fiddle-dog": "quadrupede-leggero", "guardian-rabbit": "quadrupede-leggero", hellhound: "quadrupede-leggero", "displacer-beast": "quadrupede-leggero",
  "great-dane": "quadrupede-pesante", "saint-bernard": "quadrupede-pesante", panda: "quadrupede-pesante", horse: "quadrupede-pesante",
  "polar-bear": "quadrupede-pesante", "brown-bear": "quadrupede-pesante", owlbear: "quadrupede-pesante",
  parrot: "volatile", bird: "volatile", chicken: "volatile",
  "faerie-dragon": "creatura-volante", "blue-wyrmling": "creatura-volante", "young-green-dragon": "creatura-volante", griffin: "creatura-volante",
  "nexus-bat": "creatura-volante", "adult-red-dragon": "creatura-volante", "ancient-black-dragon": "creatura-volante", imp: "creatura-volante",
  beholder: "creatura-volante", pteranodon: "creatura-volante",
  turtle: "rettile", "elder-snail": "rettile", kappa: "rettile", "frost-salamander": "rettile", "purple-worm": "rettile", bulette: "rettile",
  triceratops: "rettile-pesante", stegosaurus: "rettile-pesante", brachiosaurus: "rettile-pesante", ankylosaurus: "rettile-pesante",
  tyrannosaurus: "bipede", velociraptor: "bipede", spinosaurus: "bipede", parasaurolophus: "bipede", dilophosaurus: "bipede",
  carnotaurus: "bipede", pachycephalosaurus: "bipede",
  slime: "creatura-magica", "ice-golem": "creatura-magica",
};

const GLOBAL_BATTLE_PACING = 1.18;

export const FAMILIAR_COMBAT_PROFILED_IDS = Object.freeze(Object.keys(ARCHETYPE_BY_FAMILIAR_ID));

export function familiarCombatMotionProfile(familiarId: string): FamiliarCombatMotionProfile {
  const archetype = ARCHETYPE_BY_FAMILIAR_ID[familiarId] ?? "quadrupede-leggero";
  return ARCHETYPE_PROFILES[archetype];
}

function clampProgress(progress: number) {
  return Math.max(0, Math.min(1, progress));
}

export function familiarCombatTravelProgress(familiarId: string, progress: number) {
  const value = clampProgress(progress);
  const curve = familiarCombatMotionProfile(familiarId).travelCurve;
  if (curve === "elastic") return 1 - Math.pow(1 - value, 3);
  if (curve === "swift") return value < .5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
  if (curve === "weighted") return value * value * (3 - 2 * value);
  if (curve === "hover" || curve === "glide") return .5 - Math.cos(Math.PI * value) / 2;
  if (curve === "crawl") return Math.pow(value, 1.32);
  if (curve === "stomp") return Math.pow(value, 1.5);
  if (curve === "pulse") return value * value * (3 - 2 * value);
  return value;
}

export function familiarCombatPhaseDurationScale(familiarId: string) {
  return familiarCombatMotionProfile(familiarId).phaseDurationScale * GLOBAL_BATTLE_PACING;
}
