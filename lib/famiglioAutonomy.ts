import type { FamiliarNeedId, FamiliarNeeds } from "@/lib/famiglioHome";
import type { StarterEgg } from "@/lib/famiglioRebuild";

export type AutonomousFamiliarBehavior =
  | "roam"
  | "idle"
  | "sit"
  | "groom"
  | "sleep"
  | "seek-food"
  | "seek-play"
  | "seek-affection";

export type AutonomousNeedSignal = "food" | "energy" | "play" | "hygiene" | "affection" | null;

export type FamiliarPersonality = {
  title: string;
  signature: string;
  preferredBehavior: "roam" | "sit" | "groom" | "idle";
  secondaryBehavior: "roam" | "sit" | "groom" | "idle";
  roamBias: number;
  movementSpeed: number;
  patience: number;
};

export type AutonomousFamiliarDecision = {
  behavior: AutonomousFamiliarBehavior;
  target: number | null;
  durationMs: number;
  movementSpeed: number;
  signal: AutonomousNeedSignal;
  reaction: string;
};

export const FAMILIAR_PERSONALITIES: Record<StarterEgg["id"], FamiliarPersonality> = {
  cat: { title: "Esploratore lunare", signature: "Osserva a lungo, poi decide da solo dove andare.", preferredBehavior: "groom", secondaryBehavior: "sit", roamBias: .32, movementSpeed: .31, patience: 1.08 },
  golden: { title: "Compagno solare", signature: "Cerca spesso compagnia e porta energia nella Casa.", preferredBehavior: "roam", secondaryBehavior: "sit", roamBias: .44, movementSpeed: .36, patience: .9 },
  rabbit: { title: "Sentinella del germoglio", signature: "Alterna scatti curiosi a pause attente e silenziose.", preferredBehavior: "sit", secondaryBehavior: "roam", roamBias: .4, movementSpeed: .4, patience: .82 },
  fox: { title: "Esploratrice della brace", signature: "Perlustra il rifugio e cambia spesso punto d'osservazione.", preferredBehavior: "roam", secondaryBehavior: "idle", roamBias: .52, movementSpeed: .39, patience: .78 },
  turtle: { title: "Custode della runa", signature: "Si muove con calma e rimane a lungo nei luoghi scelti.", preferredBehavior: "sit", secondaryBehavior: "idle", roamBias: .2, movementSpeed: .2, patience: 1.35 },
  parrot: { title: "Voce dell'eco", signature: "È vivace, sociale e cerca punti sempre diversi della Casa.", preferredBehavior: "roam", secondaryBehavior: "sit", roamBias: .48, movementSpeed: .43, patience: .74 },
  panda: { title: "Cuore del bambù", signature: "Ama le soste tranquille, il cibo e il gioco senza fretta.", preferredBehavior: "sit", secondaryBehavior: "groom", roamBias: .24, movementSpeed: .24, patience: 1.22 },
  horse: { title: "Spirito del vento", signature: "Percorre il rifugio con passo deciso e riposa dopo l'esplorazione.", preferredBehavior: "roam", secondaryBehavior: "idle", roamBias: .56, movementSpeed: .46, patience: .84 },
};

export const AUTONOMOUS_BEHAVIOR_DURATION_MS: Record<Exclude<AutonomousFamiliarBehavior, "roam">, [number, number]> = {
  idle: [1_800, 4_200],
  sit: [2_800, 5_800],
  groom: [3_200, 6_200],
  sleep: [5_000, 9_000],
  "seek-food": [3_800, 6_200],
  "seek-play": [3_200, 5_400],
  "seek-affection": [3_500, 6_000],
};

const NEED_THRESHOLDS: Partial<Record<FamiliarNeedId, number>> = {
  energy: 30,
  hunger: 34,
  hygiene: 36,
  happiness: 38,
  affection: 36,
};

const NEED_BEHAVIORS: Partial<Record<FamiliarNeedId, AutonomousFamiliarBehavior>> = {
  energy: "sleep",
  hunger: "seek-food",
  hygiene: "groom",
  happiness: "seek-play",
  affection: "seek-affection",
};

const BEHAVIOR_TARGETS: Partial<Record<AutonomousFamiliarBehavior, number>> = {
  "seek-food": .18,
  "seek-play": .72,
  "seek-affection": .55,
  sleep: .58,
};

const CRITICAL_NEED_SIGNAL_THRESHOLD = 20;

const NEED_SIGNALS: Record<FamiliarNeedId, Exclude<AutonomousNeedSignal, null>> = {
  hunger: "food",
  energy: "energy",
  happiness: "play",
  hygiene: "hygiene",
  affection: "affection",
};

function mostUrgentNeed(needs: FamiliarNeeds): FamiliarNeedId | null {
  let urgent: FamiliarNeedId | null = null;
  let urgency = 1;
  for (const [need, threshold] of Object.entries(NEED_THRESHOLDS) as Array<[FamiliarNeedId, number]>) {
    const ratio = needs[need] / threshold;
    if (ratio <= urgency) {
      urgent = need;
      urgency = ratio;
    }
  }
  return urgent;
}

export function autonomousReactionText(species: StarterEgg["id"], behavior: AutonomousFamiliarBehavior) {
  const reactions: Record<AutonomousFamiliarBehavior, string> = {
    roam: species === "horse" ? "Percorre il rifugio con passo fiero." : species === "fox" ? "Esplora ogni angolo del rifugio." : "Esplora la sua Casa.",
    idle: species === "cat" ? "Osserva in silenzio ciò che lo circonda." : species === "parrot" ? "Ascolta i suoni del Nexus." : "Si guarda intorno con calma.",
    sit: species === "rabbit" ? "Si ferma e tende le orecchie." : species === "turtle" ? "Contempla pazientemente il rifugio." : "Si siede a osservare.",
    groom: "Si prende cura del proprio pelo.",
    sleep: "Cerca un posto tranquillo per recuperare energia.",
    "seek-food": "Raggiunge la ciotola: ha bisogno di mangiare.",
    "seek-play": "Va verso i giochi: ha bisogno di divertirsi.",
    "seek-affection": "Si avvicina: desidera la tua compagnia.",
  };
  return reactions[behavior];
}

function healthyBehavior(species: StarterEgg["id"], previous: AutonomousFamiliarBehavior, roll: number) {
  const personality = FAMILIAR_PERSONALITIES[species];
  const boundedRoll = Math.max(0, Math.min(.999, roll));
  let behavior: AutonomousFamiliarBehavior;
  if (boundedRoll < personality.roamBias) behavior = "roam";
  else if (boundedRoll < personality.roamBias + .2) behavior = personality.preferredBehavior;
  else if (boundedRoll < personality.roamBias + .4) behavior = personality.secondaryBehavior;
  else if (boundedRoll < .94) behavior = "idle";
  else behavior = "sleep";
  return behavior === previous ? "idle" : behavior;
}

export function chooseAutonomousDecision(
  species: StarterEgg["id"],
  needs: FamiliarNeeds,
  previous: AutonomousFamiliarBehavior,
  roll = Math.random(),
): AutonomousFamiliarDecision {
  const personality = FAMILIAR_PERSONALITIES[species];
  const urgentNeed = mostUrgentNeed(needs);
  const behavior = urgentNeed ? NEED_BEHAVIORS[urgentNeed]! : healthyBehavior(species, previous, roll);
  const lowEnergyFactor = needs.energy <= 30 ? .62 : needs.energy <= 48 ? .82 : 1;
  const durationRoll = (roll * 1.73) % 1;
  const baseDuration = behavior === "roam" ? 7_000 : autonomousBehaviorDuration(behavior, durationRoll);
  return {
    behavior,
    target: BEHAVIOR_TARGETS[behavior] ?? null,
    durationMs: baseDuration * personality.patience,
    movementSpeed: personality.movementSpeed * lowEnergyFactor,
    // Il fumetto non accompagna i normali comportamenti autonomi: compare
    // soltanto quando il bisogno più urgente è davvero critico.
    signal: urgentNeed && needs[urgentNeed] <= CRITICAL_NEED_SIGNAL_THRESHOLD
      ? NEED_SIGNALS[urgentNeed]
      : null,
    reaction: autonomousReactionText(species, behavior),
  };
}

// Compatibilità con il primo direttore autonomo e con eventuali salvataggi locali precedenti.
export function chooseAutonomousBehavior(
  needs: FamiliarNeeds,
  previous: AutonomousFamiliarBehavior,
  roll = Math.random(),
): AutonomousFamiliarBehavior {
  if (needs.energy <= 28 && previous !== "sleep") return "sleep";
  if (needs.hygiene <= 34 && previous !== "groom") return "groom";
  const behavior: AutonomousFamiliarBehavior = roll < .36
    ? "roam"
    : roll < .56
      ? "sit"
      : roll < .74
        ? "groom"
        : roll < .94
          ? "idle"
          : "sleep";
  return behavior === previous ? "idle" : behavior;
}

export function autonomousBehaviorDuration(behavior: Exclude<AutonomousFamiliarBehavior, "roam">, roll = Math.random()) {
  const [minimum, maximum] = AUTONOMOUS_BEHAVIOR_DURATION_MS[behavior];
  return minimum + (maximum - minimum) * Math.max(0, Math.min(1, roll));
}
