export const RITUAL_PHASE_DURATION_MS = 40_000;
export const STARTER_EGGS = [
  { id: "cat", familiar: "Gatto", egg: "Uovo della Luna", sigil: "L", color: "#bba8ff", nature: "Curioso e indipendente", traits: ["Agile", "Osservatore", "Affettuoso quando si fida"] },
  { id: "golden", familiar: "Golden Retriever", egg: "Uovo del Sole", sigil: "S", color: "#ffd06b", nature: "Affettuoso e gioioso", traits: ["Leale", "Socievole", "Protettivo"] },
  { id: "rabbit", familiar: "Coniglio", egg: "Uovo del Germoglio", sigil: "G", color: "#9be2ae", nature: "Vivace e delicato", traits: ["Rapido", "Sensibile", "Curioso"] },
  { id: "fox", familiar: "Volpe", egg: "Uovo della Brace", sigil: "B", color: "#ff8b58", nature: "Ingegnosa e avventurosa", traits: ["Astuta", "Esploratrice", "Indipendente"] },
  { id: "turtle", familiar: "Tartaruga", egg: "Uovo della Runa", sigil: "R", color: "#67c7a5", nature: "Paziente e protettiva", traits: ["Tenace", "Calma", "Resistente"] },
  { id: "parrot", familiar: "Pappagallo", egg: "Uovo dell'Eco", sigil: "E", color: "#69c7ff", nature: "Socievole e brillante", traits: ["Comunicativo", "Vivace", "Intraprendente"] },
  { id: "panda", familiar: "Panda", egg: "Uovo del Bambù", sigil: "P", color: "#e9e4de", nature: "Tranquillo e giocoso", traits: ["Pacifico", "Goloso", "Affettuoso"] },
  { id: "horse", familiar: "Cavallo", egg: "Uovo del Vento", sigil: "V", color: "#c79c79", nature: "Fiero e leale", traits: ["Coraggioso", "Energico", "Fedele"] },
] as const;

export type StarterEgg = (typeof STARTER_EGGS)[number];
export type FamiliarSex = "female" | "male" | "unspecified";
export type RebuildStage = "choosing" | "confirming" | "hatching" | "hatched" | "home";
export type RitualPhase = "warmth" | "heartbeat" | "sigil";

export type StarterColorOption = { id: string; label: string; colors: readonly [string, string?] };

export const STARTER_COLOR_OPTIONS: Record<StarterEgg["id"], ReadonlyArray<StarterColorOption>> = {
  cat: [
    { id: "grey", label: "Grigio", colors: ["#777b87", "#cbc5ba"] },
    { id: "black", label: "Nero", colors: ["#26242b", "#7d7482"] },
    { id: "brown", label: "Tigrato", colors: ["#9a6842", "#493326"] },
    { id: "siamese", label: "Siamese", colors: ["#e4d4ad", "#51413c"] },
  ],
  golden: [],
  rabbit: [
    { id: "white", label: "Bianco", colors: ["#f3eee3", "#c7c0b8"] },
    { id: "brown", label: "Marrone", colors: ["#9a6a43", "#63442f"] },
    { id: "black", label: "Nero", colors: ["#29272f", "#77717d"] },
  ],
  fox: [],
  turtle: [],
  parrot: [
    { id: "blue", label: "Cobalto", colors: ["#338fc7", "#f1ca4f"] },
    { id: "red", label: "Rubino", colors: ["#cf3e49", "#f1ca4f"] },
    { id: "green", label: "Smeraldo", colors: ["#4a9a5a", "#f1ca4f"] },
    { id: "silver", label: "Argento", colors: ["#b8bec7", "#626b75"] },
    { id: "violet", label: "Viola", colors: ["#8055bd", "#f1ca4f"] },
  ],
  panda: [],
  horse: [],
};

export const RITUAL_PHASES: ReadonlyArray<{
  id: RitualPhase;
  title: string;
  instruction: string;
}> = [
  { id: "warmth", title: "Il guscio si risveglia", instruction: "Il calore del Nexus prepara la prima crepa." },
  { id: "heartbeat", title: "Il battito risponde", instruction: "La presenza dentro l’uovo riconosce il nuovo legame." },
  { id: "sigil", title: "Il sigillo si apre", instruction: "La schiusa è vicina: completa le sue informazioni." },
] as const;

export type RebuildState = {
  stage: RebuildStage;
  selectedId: StarterEgg["id"] | null;
  ritualPhaseIndex: number;
  phaseElapsedMs: number;
  totalElapsedMs: number;
  familiarName: string;
  familiarSex: FamiliarSex;
  colorVariant: string | null;
  unlockedIds: StarterEgg["id"][];
};

export function createRebuildState(): RebuildState {
  return {
    stage: "choosing",
    selectedId: null,
    ritualPhaseIndex: 0,
    phaseElapsedMs: 0,
    totalElapsedMs: 0,
    familiarName: "",
    familiarSex: "unspecified",
    colorVariant: null,
    unlockedIds: [],
  };
}

export function selectStarter(state: RebuildState, selectedId: StarterEgg["id"]): RebuildState {
  if (state.stage !== "choosing" && state.stage !== "confirming") return state;
  if (!STARTER_EGGS.some((egg) => egg.id === selectedId)) return state;
  return {
    ...createRebuildState(),
    stage: "confirming",
    selectedId,
    colorVariant: STARTER_COLOR_OPTIONS[selectedId][0]?.id ?? null,
  };
}

export function returnToEggs(state: RebuildState): RebuildState {
  return state.stage === "confirming" ? createRebuildState() : state;
}

export function beginHatching(state: RebuildState): RebuildState {
  if (state.stage !== "confirming" || !state.selectedId) return state;
  return { ...state, stage: "hatching", ritualPhaseIndex: 0, phaseElapsedMs: 0, totalElapsedMs: 0 };
}

export function cancelHatching(state: RebuildState): RebuildState {
  if (state.stage !== "hatching" || !state.selectedId) return state;
  return { ...state, stage: "confirming", ritualPhaseIndex: 0, phaseElapsedMs: 0, totalElapsedMs: 0 };
}

export function customizeFamiliar(
  state: RebuildState,
  changes: Partial<Pick<RebuildState, "familiarName" | "familiarSex" | "colorVariant">>,
): RebuildState {
  if (!state.selectedId || state.stage === "choosing") return state;
  const nextName = changes.familiarName === undefined ? state.familiarName : changes.familiarName.slice(0, 18);
  const nextSex = changes.familiarSex === undefined ? state.familiarSex : changes.familiarSex;
  const allowedSex: FamiliarSex[] = ["female", "male", "unspecified"];
  const availableColors = STARTER_COLOR_OPTIONS[state.selectedId];
  const requestedColor = changes.colorVariant === undefined ? state.colorVariant : changes.colorVariant;
  const nextColor = requestedColor && availableColors.some((option) => option.id === requestedColor)
    ? requestedColor
    : availableColors[0]?.id ?? null;
  return {
    ...state,
    familiarName: nextName,
    familiarSex: allowedSex.includes(nextSex) ? nextSex : state.familiarSex,
    colorVariant: nextColor,
  };
}

export function advanceRitual(state: RebuildState, elapsedMs: number): RebuildState {
  if (state.stage !== "hatching" || !Number.isFinite(elapsedMs) || elapsedMs <= 0) return state;
  const boundedElapsed = Math.min(elapsedMs, 1_000);
  const next = {
    ...state,
    phaseElapsedMs: state.phaseElapsedMs + boundedElapsed,
    totalElapsedMs: state.totalElapsedMs + boundedElapsed,
  };

  if (next.phaseElapsedMs < RITUAL_PHASE_DURATION_MS) return next;
  if (next.ritualPhaseIndex >= RITUAL_PHASES.length - 1) {
    const unlockedIds = next.selectedId && !next.unlockedIds.includes(next.selectedId)
      ? [...next.unlockedIds, next.selectedId]
      : next.unlockedIds;
    return { ...next, stage: "hatched", phaseElapsedMs: RITUAL_PHASE_DURATION_MS, unlockedIds };
  }
  return { ...next, ritualPhaseIndex: next.ritualPhaseIndex + 1, phaseElapsedMs: 0 };
}

export function ritualProgress(state: RebuildState): number {
  if (state.stage === "hatched") return 100;
  if (state.stage !== "hatching") return 0;
  const phaseShare = 100 / RITUAL_PHASES.length;
  const timePart = Math.min(1, state.phaseElapsedMs / RITUAL_PHASE_DURATION_MS);
  return Math.min(99, Math.floor(state.ritualPhaseIndex * phaseShare + timePart * phaseShare));
}

export function enterFamiliarHome(state: RebuildState): RebuildState {
  return state.stage === "hatched" && state.selectedId ? { ...state, stage: "home" } : state;
}
