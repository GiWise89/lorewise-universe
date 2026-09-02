export type FamiliarBehaviorName = "idle" | "walk" | "sit" | "groom" | "rest";

export type FamiliarBehavior = {
  spritePath: string;
  columns: number;
  rows: number;
  row: number;
  frames: number;
  holdFrame?: number;
  eyesClosed?: boolean;
  groundRatios?: readonly number[];
  frameDurationMs?: number;
};

export type FamiliarAppearance = {
  id: string;
  name: string;
  family: string;
  temperament: string;
  spritePath: string;
  columns: number;
  rows: 5;
  pixelSize: number;
  profile: {
    size: string;
    bond: string;
    description: string;
  };
  adoption: {
    nicheX: number;
    displaySize: number;
    baselineShift: number;
  };
  behaviors: Record<FamiliarBehaviorName, FamiliarBehavior>;
  actionRows?: Partial<Record<"food" | "soap" | "toy" | "medicine", number>>;
  actionFrameCounts?: Partial<Record<"food" | "soap" | "toy" | "medicine", number>>;
  actionProps?: readonly ("food" | "soap" | "toy" | "medicine")[];
  actionGroundRatios?: Partial<Record<number, readonly number[]>>;
  actionFrameDurationMs?: number;
};

export type FamiliarPalette = {
  id: string;
  label: string;
  swatches: [string, string, string];
  spritePath: string;
  behaviors: Record<FamiliarBehaviorName, FamiliarBehavior>;
};

const strip = (root: string, file: string, frames: number, options: Pick<FamiliarBehavior, "holdFrame" | "eyesClosed" | "frameDurationMs"> = {}): FamiliarBehavior => ({ spritePath: `${root}/${file}`, columns: frames, rows: 1, row: 0, frames, ...options });
const sheet = (spritePath: string, columns: number, rows: number, row: number, frames: number, options: Pick<FamiliarBehavior, "holdFrame" | "eyesClosed" | "frameDurationMs"> = {}): FamiliarBehavior => ({ spritePath, columns, rows, row, frames, ...options });
const professionalStrip = (id: string, behavior: FamiliarBehaviorName, frames: number, options: Pick<FamiliarBehavior, "holdFrame" | "eyesClosed" | "frameDurationMs"> = {}) => strip(`/famiglio/professional/animal-mega-pack/${id}`, `${behavior}.png`, frames, options);
const professionalActions = (id: string) => `/famiglio/professional/animal-mega-pack/${id}/actions.png`;

export const STARTER_FAMILIARS: FamiliarAppearance[] = [
  {
    id: "cat-1",
    name: "Micio astrale",
    family: "Gatto",
    temperament: "Curioso e affettuoso",
    spritePath: "/famiglio/sprites/cat-1-azioni-composte-50px-final.png",
    columns: 8,
    rows: 5,
    pixelSize: 50,
    profile: { size: "Piccola", bond: "Affettuoso", description: "Curioso e agile, cerca spesso la tua presenza ma ama esplorare la tana seguendo i propri ritmi." },
    adoption: { nicheX: 13.5, displaySize: 264, baselineShift: 36 },
    behaviors: {
      idle: strip("/famiglio/behaviors/cat-1", "idle.png", 10),
      walk: strip("/famiglio/behaviors/cat-1", "walk.png", 8),
      sit: strip("/famiglio/behaviors/cat-1", "sit.png", 1),
      groom: strip("/famiglio/behaviors/cat-1", "groom.png", 5),
      rest: strip("/famiglio/behaviors/cat-1", "sleep.png", 1, { eyesClosed: true }),
    },
  },
  {
    id: "dog-golden-retriever",
    name: "Custode solare",
    family: "Cane",
    temperament: "Leale e giocherellone",
    spritePath: "/famiglio/sprites/dog-golden-retriever-azioni-composte-100px-final.png",
    columns: 8,
    rows: 5,
    pixelSize: 100,
    profile: { size: "Grande", bond: "Leale", description: "Energico e rassicurante, risponde con entusiasmo alle cure e trasforma ogni ritorno nella tana in una festa." },
    adoption: { nicheX: 31.5, displaySize: 520, baselineShift: 39 },
    behaviors: {
      idle: strip("/famiglio/behaviors/golden", "idle.png", 10),
      walk: strip("/famiglio/behaviors/golden", "walk.png", 8),
      sit: strip("/famiglio/behaviors/golden", "sit.png", 1),
      groom: strip("/famiglio/behaviors/golden", "groom.png", 4),
      rest: strip("/famiglio/behaviors/golden", "sleep.png", 1, { eyesClosed: true }),
    },
  },
  {
    id: "wolf-timber",
    name: "Lupo del Nexus",
    family: "Lupo",
    temperament: "Fiero e protettivo",
    spritePath: "/famiglio/sprites/wolf-timber-azioni-composte-48px-final.png",
    columns: 5,
    rows: 5,
    pixelSize: 48,
    profile: { size: "Grande", bond: "Protettivo", description: "Fiero e vigile, concede fiducia con calma e costruisce un legame profondo attraverso la presenza quotidiana." },
    adoption: { nicheX: 50, displaySize: 310, baselineShift: 31 },
    behaviors: {
      idle: sheet("/famiglio/behaviors/wild/wolf-timber.png", 5, 19, 17, 5),
      walk: sheet("/famiglio/behaviors/wild/wolf-timber.png", 5, 19, 2, 4),
      sit: sheet("/famiglio/behaviors/wild/wolf-timber.png", 5, 19, 17, 5),
      groom: sheet("/famiglio/behaviors/wild/wolf-timber.png", 5, 19, 10, 5),
      rest: sheet("/famiglio/behaviors/wild/wolf-timber.png", 5, 19, 18, 4, { holdFrame: 3, eyesClosed: true }),
    },
  },
  {
    id: "moon-rabbit",
    name: "Coniglio lunare",
    family: "Coniglio",
    temperament: "Dolce e vivace",
    spritePath: professionalActions("moon-rabbit"),
    columns: 8,
    rows: 5,
    pixelSize: 64,
    profile: { size: "Piccola", bond: "Premuroso", description: "Un coniglio pixel art curioso e gentile, rapido nella tana e tranquillo quando si sente al sicuro." },
    adoption: { nicheX: 68.5, displaySize: 150, baselineShift: 0 },
    behaviors: {
      idle: professionalStrip("moon-rabbit", "idle", 12, { frameDurationMs: 220 }),
      walk: professionalStrip("moon-rabbit", "walk", 8, { frameDurationMs: 150 }),
      sit: professionalStrip("moon-rabbit", "sit", 6, { holdFrame: 5, frameDurationMs: 220 }),
      groom: professionalStrip("moon-rabbit", "groom", 5, { holdFrame: 4, frameDurationMs: 230 }),
      rest: professionalStrip("moon-rabbit", "rest", 6, { holdFrame: 5, eyesClosed: true, frameDurationMs: 280 }),
    },
    actionRows: { food: 0, soap: 1, toy: 2, medicine: 3 },
    actionFrameCounts: { food: 5, soap: 8, toy: 8, medicine: 8 },
    actionProps: ["food", "soap", "toy", "medicine"],
    actionFrameDurationMs: 220,
  },
  {
    id: "fox",
    name: "Volpe delle soglie",
    family: "Volpe",
    temperament: "Vivace e indipendente",
    spritePath: "/famiglio/sprites/fox-azioni-composte-32px-final.png",
    columns: 8,
    rows: 5,
    pixelSize: 32,
    profile: { size: "Media", bond: "Complice", description: "Vivace e ingegnosa, alterna momenti di gioco a lunghe esplorazioni prima di tornare accanto a te." },
    adoption: { nicheX: 86.5, displaySize: 170, baselineShift: 0 },
    behaviors: {
      idle: sheet("/famiglio/behaviors/wild/fox.png", 14, 7, 0, 4),
      // La riga 2 contiene il ciclo locomotorio completo: otto pose con zampe e corpo
      // realmente in passo. La riga 1 è troppo statica e in movimento sembra pattinare.
      walk: sheet("/famiglio/behaviors/wild/fox.png", 14, 7, 2, 8),
      sit: sheet("/famiglio/behaviors/wild/fox.png", 14, 7, 3, 11),
      groom: sheet("/famiglio/behaviors/wild/fox.png", 14, 7, 3, 11),
      rest: sheet("/famiglio/behaviors/wild/fox.png", 14, 7, 5, 6, { holdFrame: 5, eyesClosed: true }),
    },
  },
];

export const PREMIUM_FAMILIARS: FamiliarAppearance[] = [
  {
    id: "pocket-dragon", name: "Tartaruga delle maree", family: "Tartaruga", temperament: "Paziente e curiosa",
    spritePath: professionalActions("pocket-dragon"), columns: 8, rows: 5, pixelSize: 64,
    profile: { size: "Piccola", bond: "Costante", description: "Avanza con calma, si raccoglie nel guscio e osserva ogni cambiamento della tana senza fretta." },
    adoption: { nicheX: 68.5, displaySize: 150, baselineShift: 0 },
    behaviors: {
      idle: professionalStrip("pocket-dragon", "idle", 8, { frameDurationMs: 250 }), walk: professionalStrip("pocket-dragon", "walk", 8, { frameDurationMs: 190 }),
      sit: professionalStrip("pocket-dragon", "sit", 7, { holdFrame: 6, frameDurationMs: 220 }), groom: professionalStrip("pocket-dragon", "groom", 13, { holdFrame: 12, frameDurationMs: 190 }),
      rest: professionalStrip("pocket-dragon", "rest", 12, { holdFrame: 11, eyesClosed: true, frameDurationMs: 250 }),
    }, actionRows: { food: 0, soap: 1, toy: 2, medicine: 3 }, actionFrameCounts: { food: 8, soap: 8, toy: 8, medicine: 8 }, actionProps: ["food", "soap", "toy", "medicine"], actionFrameDurationMs: 220,
  },
  {
    id: "ember-red-panda", name: "Gallina delle stelle", family: "Gallina", temperament: "Socievole e attenta",
    spritePath: professionalActions("ember-red-panda"), columns: 8, rows: 5, pixelSize: 64,
    profile: { size: "Piccola", bond: "Socievole", description: "Becchetta con curiosità, segue i movimenti della tana e cerca volentieri la presenza del Custode." },
    adoption: { nicheX: 68.5, displaySize: 118, baselineShift: 0 },
    behaviors: {
      idle: professionalStrip("ember-red-panda", "idle", 2, { frameDurationMs: 280 }), walk: professionalStrip("ember-red-panda", "walk", 4, { frameDurationMs: 190 }),
      sit: professionalStrip("ember-red-panda", "sit", 4, { holdFrame: 3, frameDurationMs: 230 }), groom: professionalStrip("ember-red-panda", "groom", 6, { holdFrame: 5, frameDurationMs: 210 }),
      rest: professionalStrip("ember-red-panda", "rest", 1, { holdFrame: 0, eyesClosed: true, frameDurationMs: 300 }),
    }, actionRows: { food: 0, soap: 1, toy: 2, medicine: 3 }, actionFrameCounts: { food: 6, soap: 4, toy: 4, medicine: 8 }, actionProps: ["food", "soap", "toy", "medicine"], actionFrameDurationMs: 220,
  },
  {
    id: "astral-fawn", name: "Pappagallo astrale", family: "Pappagallo", temperament: "Vivace e comunicativo",
    spritePath: professionalActions("astral-fawn"), columns: 8, rows: 5, pixelSize: 64,
    profile: { size: "Piccola", bond: "Comunicativo", description: "Cammina, vola e si posa realmente, reagendo con energia ai momenti condivisi nella tana." },
    adoption: { nicheX: 68.5, displaySize: 122, baselineShift: 0 },
    behaviors: {
      idle: professionalStrip("astral-fawn", "idle", 6, { frameDurationMs: 240 }), walk: professionalStrip("astral-fawn", "walk", 6, { frameDurationMs: 170 }),
      sit: professionalStrip("astral-fawn", "sit", 6, { holdFrame: 5, frameDurationMs: 220 }), groom: professionalStrip("astral-fawn", "groom", 8, { holdFrame: 7, frameDurationMs: 170 }),
      rest: professionalStrip("astral-fawn", "rest", 8, { holdFrame: 7, eyesClosed: true, frameDurationMs: 260 }),
    }, actionRows: { food: 0, soap: 1, toy: 2, medicine: 3 }, actionFrameCounts: { food: 6, soap: 8, toy: 7, medicine: 8 }, actionProps: ["food", "soap", "toy", "medicine"], actionFrameDurationMs: 210,
  },
  {
    id: "nexus-axolotl", name: "Orsetto del Nexus", family: "Orso", temperament: "Tranquillo e giocoso",
    spritePath: professionalActions("nexus-axolotl"), columns: 8, rows: 5, pixelSize: 64,
    profile: { size: "Media", bond: "Rassicurante", description: "Un giovane orso dal passo energico, curioso durante il gioco e profondamente tranquillo nel riposo." },
    adoption: { nicheX: 68.5, displaySize: 190, baselineShift: 0 },
    behaviors: {
      idle: professionalStrip("nexus-axolotl", "idle", 6, { frameDurationMs: 260 }), walk: professionalStrip("nexus-axolotl", "walk", 5, { frameDurationMs: 150 }),
      sit: professionalStrip("nexus-axolotl", "sit", 11, { holdFrame: 10, frameDurationMs: 190 }), groom: professionalStrip("nexus-axolotl", "groom", 4, { holdFrame: 3, frameDurationMs: 230 }),
      rest: professionalStrip("nexus-axolotl", "rest", 8, { holdFrame: 7, eyesClosed: true, frameDurationMs: 280 }),
    }, actionRows: { food: 0, soap: 1, toy: 2, medicine: 3 }, actionFrameCounts: { food: 8, soap: 6, toy: 8, medicine: 8 }, actionProps: ["food", "soap", "toy", "medicine"], actionFrameDurationMs: 220,
  },
];

export const ALL_FAMILIARS: FamiliarAppearance[] = [...STARTER_FAMILIARS, ...PREMIUM_FAMILIARS];

const LEGACY_GENERATED_GROUND_RATIOS: Record<string, readonly (readonly number[])[]> = {
  "moon-rabbit": [
    [.060606, .060606, .060606, .060606, .060606, .060606, .060606, .060606],
    [.141414, .141414, .141414, .141414, .141414, .141414, .141414, .141414],
    [.171717, .171717, .171717, .171717, .171717, .171717, .171717, .171717],
    [.176768, .176768, .176768, .176768, .176768, .176768, .176768, .176768],
    [.217172, .217172, .358586, .217172, .217172, .217172, .217172, .217172],
  ],
  "pocket-dragon": [[.015, .015, .01, .015, .015, .015, .01, .01], [.085, .105, .085, .085, .085, .075, .075, .065], [.205, .21, .21, .21, .21, .21, .21, .205], [.325, .32, .32, .32, .32, .32, .32, .32], [.345, .34, .325, .32, .325, .345, .35, .345]],
  "ember-red-panda": [[.029412, .029412, .029412, .029412, .029412, .029412, .029412, .029412], [.127451, .127451, .127451, .127451, .132353, .127451, .127451, .132353], [.181373, .181373, .181373, .181373, .181373, .181373, .181373, .181373], [.210784, .210784, .210784, .210784, .210784, .205882, .205882, .220588], [.235294, .230392, .230392, .230392, .269608, .269608, .240196, .269608]],
  "astral-fawn": [[0, 0, 0, 0, 0, 0, 0, 0], [.068627, .073529, .068627, .068627, .068627, .068627, .073529, .073529], [0, 0, .20098, .20098, 0, 0, 0, 0], [.186275, 0, 0, .181373, .181373, .186275, .191176, .191176], [.230392, .313725, .235294, .230392, .230392, .230392, .230392, .230392]],
  "nexus-axolotl": [[.004902, 0, 0, 0, .004902, .004902, 0, .004902], [.098039, .098039, .098039, .098039, .098039, .098039, .098039, .098039], [.181373, .166667, .161765, .166667, .166667, .166667, .166667, .166667], [.235294, .235294, .235294, .230392, .235294, .230392, .235294, .230392], [.303922, .284314, .303922, .279412, .279412, .279412, .254902, .279412]],
};

for (const appearance of ALL_FAMILIARS) {
  const professional = (professionalGrounding as Record<string, { behaviors: Record<FamiliarBehaviorName, number[]>; actions: number[][] }>)[appearance.id];
  if (professional) {
    for (const behavior of Object.keys(appearance.behaviors) as FamiliarBehaviorName[]) appearance.behaviors[behavior].groundRatios = professional.behaviors[behavior];
    appearance.actionGroundRatios = { 0: professional.actions[0], 1: professional.actions[1], 2: professional.actions[2], 3: professional.actions[3], 4: professional.actions[4] };
    continue;
  }
  const ratios = (generatedGrounding as Record<string, number[][]>)[appearance.id] ?? LEGACY_GENERATED_GROUND_RATIOS[appearance.id];
  if (!ratios) continue;
  appearance.behaviors.idle.groundRatios = ratios[0];
  appearance.behaviors.walk.groundRatios = ratios[1];
  appearance.behaviors.sit.groundRatios = ratios[0];
  appearance.behaviors.groom.groundRatios = ratios[3];
  appearance.behaviors.rest.groundRatios = ratios[4];
  appearance.actionGroundRatios = { 0: ratios[0], 1: ratios[1], 2: ratios[2], 3: ratios[3], 4: ratios[4] };
}

const PALETTE_VARIANTS: Record<string, FamiliarPalette[]> = {
  "moon-rabbit": [
    { id: "moon-rabbit-cocoa", label: "Cacao", swatches: ["#513229", "#9a6650", "#d7b59b"], spritePath: professionalActions("moon-rabbit-cocoa"), behaviors: { idle: professionalStrip("moon-rabbit-cocoa", "idle", 12), walk: professionalStrip("moon-rabbit-cocoa", "walk", 8), sit: professionalStrip("moon-rabbit-cocoa", "sit", 6), groom: professionalStrip("moon-rabbit-cocoa", "groom", 5), rest: professionalStrip("moon-rabbit-cocoa", "rest", 6, { eyesClosed: true }) } },
    { id: "moon-rabbit-dawn", label: "Aurora", swatches: ["#7b416b", "#cf7fa7", "#f5d1dc"], spritePath: professionalActions("moon-rabbit-dawn"), behaviors: { idle: professionalStrip("moon-rabbit-dawn", "idle", 12), walk: professionalStrip("moon-rabbit-dawn", "walk", 8), sit: professionalStrip("moon-rabbit-dawn", "sit", 6), groom: professionalStrip("moon-rabbit-dawn", "groom", 5), rest: professionalStrip("moon-rabbit-dawn", "rest", 6, { eyesClosed: true }) } },
  ],
  "pocket-dragon": [
    { id: "pocket-dragon-coral", label: "Corallo", swatches: ["#4b2431", "#b85662", "#f2ad8b"], spritePath: professionalActions("pocket-dragon-coral"), behaviors: { idle: professionalStrip("pocket-dragon-coral", "idle", 8), walk: professionalStrip("pocket-dragon-coral", "walk", 8), sit: professionalStrip("pocket-dragon-coral", "sit", 7), groom: professionalStrip("pocket-dragon-coral", "groom", 13), rest: professionalStrip("pocket-dragon-coral", "rest", 12, { eyesClosed: true }) } },
    { id: "pocket-dragon-lagoon", label: "Laguna", swatches: ["#153c42", "#3d8f84", "#9cdec5"], spritePath: professionalActions("pocket-dragon-lagoon"), behaviors: { idle: professionalStrip("pocket-dragon-lagoon", "idle", 8), walk: professionalStrip("pocket-dragon-lagoon", "walk", 8), sit: professionalStrip("pocket-dragon-lagoon", "sit", 7), groom: professionalStrip("pocket-dragon-lagoon", "groom", 13), rest: professionalStrip("pocket-dragon-lagoon", "rest", 12, { eyesClosed: true }) } },
  ],
  "ember-red-panda": [
    { id: "ember-red-panda-midnight", label: "Mezzanotte", swatches: ["#1b2333", "#455672", "#9daeca"], spritePath: professionalActions("ember-red-panda-midnight"), behaviors: { idle: professionalStrip("ember-red-panda-midnight", "idle", 2), walk: professionalStrip("ember-red-panda-midnight", "walk", 4), sit: professionalStrip("ember-red-panda-midnight", "sit", 4), groom: professionalStrip("ember-red-panda-midnight", "groom", 6), rest: professionalStrip("ember-red-panda-midnight", "rest", 1, { eyesClosed: true }) } },
    { id: "ember-red-panda-sunrise", label: "Aurora", swatches: ["#6b2b20", "#d86f37", "#f5d173"], spritePath: professionalActions("ember-red-panda-sunrise"), behaviors: { idle: professionalStrip("ember-red-panda-sunrise", "idle", 2), walk: professionalStrip("ember-red-panda-sunrise", "walk", 4), sit: professionalStrip("ember-red-panda-sunrise", "sit", 4), groom: professionalStrip("ember-red-panda-sunrise", "groom", 6), rest: professionalStrip("ember-red-panda-sunrise", "rest", 1, { eyesClosed: true }) } },
  ],
  "astral-fawn": [
    { id: "astral-fawn-emerald", label: "Smeraldo", swatches: ["#124c3b", "#2fa878", "#b6e66c"], spritePath: professionalActions("astral-fawn-emerald"), behaviors: { idle: professionalStrip("astral-fawn-emerald", "idle", 6), walk: professionalStrip("astral-fawn-emerald", "walk", 6), sit: professionalStrip("astral-fawn-emerald", "sit", 6), groom: professionalStrip("astral-fawn-emerald", "groom", 8), rest: professionalStrip("astral-fawn-emerald", "rest", 8, { eyesClosed: true }) } },
    { id: "astral-fawn-violet", label: "Ametista", swatches: ["#34205f", "#8050b2", "#ef9dd8"], spritePath: professionalActions("astral-fawn-violet"), behaviors: { idle: professionalStrip("astral-fawn-violet", "idle", 6), walk: professionalStrip("astral-fawn-violet", "walk", 6), sit: professionalStrip("astral-fawn-violet", "sit", 6), groom: professionalStrip("astral-fawn-violet", "groom", 8), rest: professionalStrip("astral-fawn-violet", "rest", 8, { eyesClosed: true }) } },
  ],
  "nexus-axolotl": [
    { id: "nexus-axolotl-snow", label: "Neve", swatches: ["#53606b", "#a9bac5", "#eef4f2"], spritePath: professionalActions("nexus-axolotl-snow"), behaviors: { idle: professionalStrip("nexus-axolotl-snow", "idle", 6), walk: professionalStrip("nexus-axolotl-snow", "walk", 5), sit: professionalStrip("nexus-axolotl-snow", "sit", 11), groom: professionalStrip("nexus-axolotl-snow", "groom", 4), rest: professionalStrip("nexus-axolotl-snow", "rest", 8, { eyesClosed: true }) } },
    { id: "nexus-axolotl-honey", label: "Miele", swatches: ["#57381e", "#af7138", "#e8bc68"], spritePath: professionalActions("nexus-axolotl-honey"), behaviors: { idle: professionalStrip("nexus-axolotl-honey", "idle", 6), walk: professionalStrip("nexus-axolotl-honey", "walk", 5), sit: professionalStrip("nexus-axolotl-honey", "sit", 11), groom: professionalStrip("nexus-axolotl-honey", "groom", 4), rest: professionalStrip("nexus-axolotl-honey", "rest", 8, { eyesClosed: true }) } },
  ],
  "cat-1": [
    {
      id: "cat-umbra", label: "Ombra", swatches: ["#11181b", "#273236", "#829061"],
      spritePath: "/famiglio/palettes/cat-umbra/sprite.png",
      behaviors: {
        idle: strip("/famiglio/palettes/cat-umbra", "idle.png", 10), walk: strip("/famiglio/palettes/cat-umbra", "walk.png", 8),
        sit: strip("/famiglio/palettes/cat-umbra", "sit.png", 1), groom: strip("/famiglio/palettes/cat-umbra", "groom.png", 5),
        rest: strip("/famiglio/palettes/cat-umbra", "sleep.png", 1, { eyesClosed: true }),
      },
    },
    {
      id: "cat-luna", label: "Luna", swatches: ["#f0f0eb", "#aaa9ad", "#7097c8"],
      spritePath: "/famiglio/palettes/cat-luna/sprite.png",
      behaviors: {
        idle: strip("/famiglio/palettes/cat-luna", "idle.png", 10), walk: strip("/famiglio/palettes/cat-luna", "walk.png", 8),
        sit: strip("/famiglio/palettes/cat-luna", "sit.png", 1), groom: strip("/famiglio/palettes/cat-luna", "groom.png", 5),
        rest: strip("/famiglio/palettes/cat-luna", "sleep.png", 1, { eyesClosed: true }),
      },
    },
  ],
  "dog-golden-retriever": [
    {
      id: "dog-moonlit", label: "Luna blu", swatches: ["#425873", "#7087a3", "#afc5dc"],
      spritePath: "/famiglio/palettes/dog-moonlit/sprite.png",
      behaviors: {
        idle: strip("/famiglio/palettes/dog-moonlit", "idle.png", 10), walk: strip("/famiglio/palettes/dog-moonlit", "walk.png", 8),
        sit: strip("/famiglio/palettes/dog-moonlit", "sit.png", 1), groom: strip("/famiglio/palettes/dog-moonlit", "groom.png", 4),
        rest: strip("/famiglio/palettes/dog-moonlit", "sleep.png", 1, { eyesClosed: true }),
      },
    },
    {
      id: "dog-cocoa", label: "Cacao", swatches: ["#512817", "#874426", "#c07646"],
      spritePath: "/famiglio/palettes/dog-cocoa/sprite.png",
      behaviors: {
        idle: strip("/famiglio/palettes/dog-cocoa", "idle.png", 10), walk: strip("/famiglio/palettes/dog-cocoa", "walk.png", 8),
        sit: strip("/famiglio/palettes/dog-cocoa", "sit.png", 1), groom: strip("/famiglio/palettes/dog-cocoa", "groom.png", 4),
        rest: strip("/famiglio/palettes/dog-cocoa", "sleep.png", 1, { eyesClosed: true }),
      },
    },
  ],
  "wolf-timber": [
    {
      id: "wolf-winterborn", label: "Inverno", swatches: ["#dce5e8", "#8295aa", "#43566f"],
      spritePath: "/famiglio/palettes/wolf-winterborn/sprite.png",
      behaviors: {
        idle: sheet("/famiglio/palettes/wolf-winterborn/behaviors.png", 5, 19, 17, 5), walk: sheet("/famiglio/palettes/wolf-winterborn/behaviors.png", 5, 19, 2, 4),
        sit: sheet("/famiglio/palettes/wolf-winterborn/behaviors.png", 5, 19, 17, 5), groom: sheet("/famiglio/palettes/wolf-winterborn/behaviors.png", 5, 19, 10, 5),
        rest: sheet("/famiglio/palettes/wolf-winterborn/behaviors.png", 5, 19, 18, 4, { holdFrame: 3, eyesClosed: true }),
      },
    },
    {
      id: "wolf-bloodmoon", label: "Luna rossa", swatches: ["#5c171c", "#ad3339", "#ff7474"],
      spritePath: "/famiglio/palettes/wolf-bloodmoon/sprite.png",
      behaviors: {
        idle: sheet("/famiglio/palettes/wolf-bloodmoon/behaviors.png", 5, 19, 17, 5), walk: sheet("/famiglio/palettes/wolf-bloodmoon/behaviors.png", 5, 19, 2, 4),
        sit: sheet("/famiglio/palettes/wolf-bloodmoon/behaviors.png", 5, 19, 17, 5), groom: sheet("/famiglio/palettes/wolf-bloodmoon/behaviors.png", 5, 19, 10, 5),
        rest: sheet("/famiglio/palettes/wolf-bloodmoon/behaviors.png", 5, 19, 18, 4, { holdFrame: 3, eyesClosed: true }),
      },
    },
  ],
  crow: [
    {
      id: "crow-spectral", label: "Spettrale", swatches: ["#293444", "#6f849b", "#b7c9d8"],
      spritePath: "/famiglio/palettes/crow-spectral/sprite.png",
      behaviors: {
        idle: sheet("/famiglio/palettes/crow-spectral/behaviors.png", 7, 6, 0, 7), walk: sheet("/famiglio/palettes/crow-spectral/behaviors.png", 7, 6, 0, 7),
        sit: sheet("/famiglio/palettes/crow-spectral/behaviors.png", 7, 6, 1, 7), groom: sheet("/famiglio/palettes/crow-spectral/behaviors.png", 7, 6, 1, 7),
        rest: sheet("/famiglio/palettes/crow-spectral/behaviors.png", 7, 6, 2, 4, { holdFrame: 3, eyesClosed: true }),
      },
    },
    {
      id: "crow-arcane", label: "Arcano", swatches: ["#37134f", "#73228d", "#b450c5"],
      spritePath: "/famiglio/palettes/crow-arcane/sprite.png",
      behaviors: {
        idle: sheet("/famiglio/palettes/crow-arcane/behaviors.png", 7, 6, 0, 7), walk: sheet("/famiglio/palettes/crow-arcane/behaviors.png", 7, 6, 0, 7),
        sit: sheet("/famiglio/palettes/crow-arcane/behaviors.png", 7, 6, 1, 7), groom: sheet("/famiglio/palettes/crow-arcane/behaviors.png", 7, 6, 1, 7),
        rest: sheet("/famiglio/palettes/crow-arcane/behaviors.png", 7, 6, 2, 4, { holdFrame: 3, eyesClosed: true }),
      },
    },
  ],
  fox: [
    {
      id: "fox-arctic", label: "Artica", swatches: ["#dce8ef", "#91abc2", "#4d6680"],
      spritePath: "/famiglio/palettes/fox-arctic/sprite.png",
      behaviors: {
        idle: sheet("/famiglio/palettes/fox-arctic/behaviors.png", 14, 7, 0, 4), walk: sheet("/famiglio/palettes/fox-arctic/behaviors.png", 14, 7, 2, 8),
        sit: sheet("/famiglio/palettes/fox-arctic/behaviors.png", 14, 7, 3, 11), groom: sheet("/famiglio/palettes/fox-arctic/behaviors.png", 14, 7, 3, 11),
        rest: sheet("/famiglio/palettes/fox-arctic/behaviors.png", 14, 7, 5, 6, { holdFrame: 5, eyesClosed: true }),
      },
    },
    {
      id: "fox-silver", label: "Argento", swatches: ["#29323d", "#586879", "#a6b3bf"],
      spritePath: "/famiglio/palettes/fox-silver/sprite.png",
      behaviors: {
        idle: sheet("/famiglio/palettes/fox-silver/behaviors.png", 14, 7, 0, 4), walk: sheet("/famiglio/palettes/fox-silver/behaviors.png", 14, 7, 2, 8),
        sit: sheet("/famiglio/palettes/fox-silver/behaviors.png", 14, 7, 3, 11), groom: sheet("/famiglio/palettes/fox-silver/behaviors.png", 14, 7, 3, 11),
        rest: sheet("/famiglio/palettes/fox-silver/behaviors.png", 14, 7, 5, 6, { holdFrame: 5, eyesClosed: true }),
      },
    },
  ],
};

const BASE_PALETTE_LABELS: Record<string, { label: string; swatches: [string, string, string] }> = {
  "cat-1": { label: "Ambra", swatches: ["#6b4213", "#b78120", "#e1c66a"] },
  "dog-golden-retriever": { label: "Solare", swatches: ["#70410f", "#a96b20", "#d7a450"] },
  "wolf-timber": { label: "Timber", swatches: ["#342b35", "#756b78", "#b9b3bb"] },
  "moon-rabbit": { label: "Lunare", swatches: ["#f7f4ef", "#aaa8c5", "#7c6699"] },
  fox: { label: "Ramata", swatches: ["#5d2514", "#b55224", "#ed9a5a"] },
  "pocket-dragon": { label: "Bosco", swatches: ["#3b2c1c", "#6a7545", "#a48f5b"] },
  "ember-red-panda": { label: "Miele", swatches: ["#f2e6b6", "#c8a85b", "#8a6a32"] },
  "astral-fawn": { label: "Scarlatto", swatches: ["#c62e2e", "#2352a2", "#f1d14f"] },
  "nexus-axolotl": { label: "Grizzly", swatches: ["#3b2619", "#7c5b44", "#b99a7c"] },
};

export function familiarPalettes(baseId: string): FamiliarPalette[] {
  const base = ALL_FAMILIARS.find((appearance) => appearance.id === baseId) ?? STARTER_FAMILIARS[0];
  const basePalette = BASE_PALETTE_LABELS[base.id];
  return [{ id: base.id, label: basePalette.label, swatches: basePalette.swatches, spritePath: base.spritePath, behaviors: base.behaviors }, ...(PALETTE_VARIANTS[base.id] ?? [])];
}

export function familiarAppearance(id: string) {
  const legacyAliases: Record<string, string> = {
    crow: "astral-fawn", "crow-arcane": "astral-fawn", "crow-spectral": "astral-fawn",
    turtle: "pocket-dragon", chicken: "ember-red-panda", parrot: "astral-fawn", bear: "nexus-axolotl",
  };
  const migratedId = legacyAliases[id] ?? id;
  const direct = ALL_FAMILIARS.find((appearance) => appearance.id === migratedId);
  if (direct) return direct;
  for (const base of ALL_FAMILIARS) {
    const palette = (PALETTE_VARIANTS[base.id] ?? []).find((variant) => variant.id === id);
    if (palette) return {
      ...base,
      id: palette.id,
      spritePath: palette.spritePath,
      behaviors: Object.fromEntries(Object.entries(palette.behaviors).map(([behavior, sequence]) => [behavior, {
        ...sequence,
        groundRatios: sequence.groundRatios ?? base.behaviors[behavior as FamiliarBehaviorName].groundRatios,
      }])) as FamiliarAppearance["behaviors"],
    };
  }
  return STARTER_FAMILIARS[0];
}
import generatedGrounding from "./nexusFamiliarGeneratedGrounding.json" with { type: "json" };
import professionalGrounding from "./nexusFamiliarProfessionalGrounding.json" with { type: "json" };
