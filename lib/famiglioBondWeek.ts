export type FamiliarBondTraitId = "curiosity" | "courage" | "empathy";
export type FamiliarBondNeedId = "hunger" | "energy" | "happiness" | "hygiene" | "affection";

export type FamiliarBondChoice = {
  id: string;
  label: string;
  intent: string;
  response: string;
  memoryTitle: string;
  memoryDetail: string;
  trait: FamiliarBondTraitId;
  traitPoints: number;
  bondXp: number;
  coins: number;
  needs: Partial<Record<FamiliarBondNeedId, number>>;
  keepsakeId?: string;
};

export type FamiliarBondEvent = {
  day: number;
  eyebrow: string;
  title: string;
  scene: string;
  question: string;
  symbol: string;
  tone: "violet" | "amber" | "cyan" | "rose";
  teaser: string;
  choices: readonly [FamiliarBondChoice, FamiliarBondChoice];
};

export type FamiliarBondChoiceRecord = {
  day: number;
  choiceId: string;
  trait: FamiliarBondTraitId;
  at: number;
};

export type FamiliarBondWeekState = {
  currentDay: number;
  lastVisitDayKey: string;
  pendingDay: number | null;
  completedDays: number[];
  choices: FamiliarBondChoiceRecord[];
  traits: Record<FamiliarBondTraitId, number>;
  keepsakeIds: string[];
};

export const FAMILIAR_BOND_TRAITS: Record<FamiliarBondTraitId, { label: string; icon: string; description: string }> = {
  curiosity: { label: "Curioso", icon: "✦", description: "Cerca sentieri, suoni e segreti che gli altri ignorano." },
  courage: { label: "Coraggioso", icon: "◆", description: "Protegge il Legame quando il Nexus diventa incerto." },
  empathy: { label: "Sensibile", icon: "♥", description: "Ascolta gli umori e si avvicina a chi ha bisogno." },
};

export const FAMILIAR_BOND_KEEPSAKES: Record<string, { label: string; kind: "object" | "aura" | "finale" }> = {
  "memory-song": { label: "Carillon della nostra melodia", kind: "object" },
  "memory-sigil": { label: "Sigillo musicale", kind: "object" },
  "memory-aura-cyan": { label: "Tinta Sentiero celeste", kind: "aura" },
  "memory-aura-rose": { label: "Tinta Rifugio rosata", kind: "aura" },
  "memory-compass": { label: "Bussola della promessa", kind: "finale" },
  "memory-lantern": { label: "Lanterna della promessa", kind: "finale" },
  "memory-sprout-cyan": { label: "Germoglio dei sentieri", kind: "object" },
  "memory-sprout-gold": { label: "Germoglio del rifugio", kind: "object" },
  "memory-aura-star": { label: "Aura Pioggia di gioia", kind: "aura" },
  "memory-aura-violet": { label: "Aura Pioggia di conforto", kind: "aura" },
  "memory-constellation-path": { label: "Costellazione del Cammino", kind: "finale" },
  "memory-constellation-home": { label: "Costellazione del Rifugio", kind: "finale" },
};

export const FAMILIAR_BOND_WEEK: readonly FamiliarBondEvent[] = [
  {
    day: 1,
    eyebrow: "Prima risonanza",
    title: "Qualcosa bussa nel muro",
    scene: "La stanza è quieta, ma tre piccoli colpi arrivano da dietro la parete. Il Famiglio ti guarda: non sembra spaventato, soltanto in ascolto.",
    question: "Come iniziate a cercare la risposta?",
    symbol: "◌",
    tone: "violet",
    teaser: "Domani una traccia comparirà dove oggi non c'era nulla.",
    choices: [
      { id: "listen", label: "Ascoltiamo insieme", intent: "Restate immobili e seguite il ritmo.", response: "Il Famiglio appoggia l'orecchio accanto alla tua mano. I colpi rispondono al suo respiro.", memoryTitle: "Tre colpi nel muro", memoryDetail: "Avete scelto di ascoltare senza paura. Il primo suono del Nexus è diventato un ricordo condiviso.", trait: "empathy", traitPoints: 2, bondXp: 8, coins: 2, needs: { affection: 8, happiness: 3 } },
      { id: "search", label: "Cerchiamo il passaggio", intent: "Controllate la stanza centimetro per centimetro.", response: "Dietro un mobile il Famiglio trova un filo viola, sottile come luce lunare. Prima non era lì.", memoryTitle: "Il filo viola", memoryDetail: "Avete cercato l'origine dei colpi e trovato la prima traccia del sentiero nascosto.", trait: "curiosity", traitPoints: 2, bondXp: 8, coins: 2, needs: { happiness: 7, energy: -2 } },
    ],
  },
  {
    day: 2,
    eyebrow: "Seconda risonanza",
    title: "Un'impronta che non appartiene a nessuno",
    scene: "Sul pavimento è comparsa una piccola impronta luminosa. È troppo grande per il Famiglio e troppo lieve per una persona.",
    question: "La seguite oppure la proteggete?",
    symbol: "◇",
    tone: "cyan",
    teaser: "Stanotte il proprietario dell'impronta potrebbe accorgersi di voi.",
    choices: [
      { id: "follow", label: "Seguiamo la luce", intent: "Lasciate che sia il Famiglio a guidare.", response: "La traccia attraversa la stanza e scompare sotto la porta. Il Famiglio memorizza ogni curva.", memoryTitle: "La pista luminosa", memoryDetail: "Il Famiglio ha guidato la ricerca e ha imparato che ti fidi del suo istinto.", trait: "curiosity", traitPoints: 2, bondXp: 9, coins: 2, needs: { happiness: 7, affection: 4 } },
      { id: "guard", label: "Restiamo di guardia", intent: "Vi mettete tra l'impronta e la Casa.", response: "La luce pulsa una volta e si spegne. Il Famiglio rimane davanti a te, fiero di aver protetto il rifugio.", memoryTitle: "Guardiani della Casa", memoryDetail: "Avete vegliato insieme finché la strana impronta ha smesso di brillare.", trait: "courage", traitPoints: 2, bondXp: 9, coins: 2, needs: { affection: 7, energy: -2 } },
    ],
  },
  {
    day: 3,
    eyebrow: "Terza risonanza",
    title: "La melodia dimenticata",
    scene: "Una musica lontana attraversa la Casa. Il Famiglio sembra conoscerla: muove la coda a tempo, ma i suoi occhi diventano malinconici.",
    question: "Come trasformate quel suono in un ricordo vostro?",
    symbol: "♫",
    tone: "rose",
    teaser: "La melodia ha aperto una porta nei sogni del Famiglio.",
    choices: [
      { id: "hum", label: "Cantiamo con lei", intent: "Inventate insieme una nuova parte della melodia.", response: "Il suono cambia. Non è più il ricordo di qualcun altro: ora contiene anche la vostra voce.", memoryTitle: "La nostra melodia", memoryDetail: "Avete completato una canzone del Nexus e il Famiglio la riconosce come vostra.", trait: "empathy", traitPoints: 2, bondXp: 10, coins: 3, needs: { affection: 8, happiness: 5 }, keepsakeId: "memory-song" },
      { id: "trace", label: "Troviamo la sorgente", intent: "Cercate da dove arriva la musica.", response: "Il Famiglio scopre un piccolo simbolo sotto il tappeto. Vibra seguendo la melodia.", memoryTitle: "Il sigillo musicale", memoryDetail: "Seguendo il suono avete scoperto un simbolo che reagisce alla presenza del Famiglio.", trait: "curiosity", traitPoints: 2, bondXp: 10, coins: 3, needs: { happiness: 8, energy: -3 }, keepsakeId: "memory-sigil" },
    ],
  },
  {
    day: 4,
    eyebrow: "Quarta risonanza",
    title: "L'ombra alla finestra",
    scene: "Per un istante una figura copre la luce della finestra. Quando guardi meglio non c'è nessuno, ma il Famiglio si mette davanti a te.",
    question: "Cosa gli insegni in questo momento?",
    symbol: "☾",
    tone: "violet",
    teaser: "La presenza ha lasciato qualcosa oltre il vetro.",
    choices: [
      { id: "together", label: "Non siamo soli", intent: "Ti abbassi e restate fianco a fianco.", response: "Il Famiglio smette di ringhiare. La paura rimane, ma adesso sa che la affronterete insieme.", memoryTitle: "Davanti alla finestra", memoryDetail: "Avete affrontato l'ombra senza separarvi. Il Legame ha resistito al primo vero timore.", trait: "courage", traitPoints: 2, bondXp: 12, coins: 3, needs: { affection: 9, happiness: 3 } },
      { id: "comfort", label: "Rassicuriamoci", intent: "Chiudi le tende e gli offri un posto sicuro.", response: "Il Famiglio si avvicina e resta in ascolto del tuo respiro finché l'ombra non sembra più così grande.", memoryTitle: "Un rifugio condiviso", memoryDetail: "Hai trasformato un momento inquietante in una promessa di protezione reciproca.", trait: "empathy", traitPoints: 2, bondXp: 12, coins: 3, needs: { affection: 11, energy: 4 } },
    ],
  },
  {
    day: 5,
    eyebrow: "Quinta risonanza",
    title: "Il messaggio di Mirra",
    scene: "Mirra lascia un piccolo involto davanti alla Casa. Dentro non c'è merce: soltanto una mappa strappata e la frase “scegliete ciò che vale la pena salvare”.",
    question: "Quale parte della mappa conservate?",
    symbol: "▱",
    tone: "amber",
    teaser: "Il frammento scelto condurrà a una stanza che ricorda il vostro carattere.",
    choices: [
      { id: "road", label: "Il sentiero sconosciuto", intent: "Conservate la strada senza destinazione.", response: "Il Famiglio sfiora il tratto incompleto: una nuova linea compare sotto la sua zampa.", memoryTitle: "La strada da inventare", memoryDetail: "Avete scelto la parte di mappa che nessuno aveva ancora completato.", trait: "curiosity", traitPoints: 3, bondXp: 13, coins: 4, needs: { happiness: 9 }, keepsakeId: "memory-aura-cyan" },
      { id: "shelter", label: "Il rifugio segnato", intent: "Conservate il simbolo di una Casa lontana.", response: "Il Famiglio protegge il frammento sotto di sé. Quel rifugio potrebbe appartenere a qualcuno che aspetta aiuto.", memoryTitle: "Il rifugio sulla mappa", memoryDetail: "Avete scelto di ricordare un luogo sicuro prima ancora di sapere chi lo abita.", trait: "empathy", traitPoints: 3, bondXp: 13, coins: 4, needs: { affection: 8 }, keepsakeId: "memory-aura-rose" },
    ],
  },
  {
    day: 6,
    eyebrow: "Sesta risonanza",
    title: "Lo specchio incrinato",
    scene: "Lo specchio mostra due versioni del Famiglio: una avanza verso il buio, l'altra torna indietro per cercarti. Entrambe aspettano una decisione.",
    question: "Quale riflesso toccate?",
    symbol: "◈",
    tone: "cyan",
    teaser: "Domani il Nexus rivelerà quale memoria avete costruito insieme.",
    choices: [
      { id: "advance", label: "Quello che avanza", intent: "Affrontate ciò che si nasconde oltre il riflesso.", response: "La crepa diventa una linea dorata. Il Famiglio avanza, poi si volta per assicurarsi che tu sia con lui.", memoryTitle: "Oltre lo specchio", memoryDetail: "Avete scelto di avanzare senza lasciare indietro il vostro Legame.", trait: "courage", traitPoints: 3, bondXp: 15, coins: 5, needs: { happiness: 7, energy: -3 } },
      { id: "return", label: "Quello che ritorna", intent: "Ricordate che nessuna scoperta vale una separazione.", response: "Il riflesso torna accanto a te. Le due immagini si fondono e lo specchio smette di tremare.", memoryTitle: "La strada del ritorno", memoryDetail: "Il Famiglio ha imparato che potrà esplorare perché esiste sempre una strada per tornare da te.", trait: "empathy", traitPoints: 3, bondXp: 15, coins: 5, needs: { affection: 10, energy: 3 } },
    ],
  },
  {
    day: 7,
    eyebrow: "Settima risonanza",
    title: "Il ricordo che vi appartiene",
    scene: "Le tracce, la melodia e la mappa si uniscono in una piccola costellazione. Il Nexus non stava mettendo alla prova il Famiglio: stava imparando chi siete insieme.",
    question: "Quale promessa affidate al vostro primo Ricordo del Legame?",
    symbol: "✦",
    tone: "amber",
    teaser: "La prima settimana è completa. Altri ricordi potranno nascere dalle vostre avventure.",
    choices: [
      { id: "discover", label: "Scopriremo insieme", intent: "Promettete di non smettere di cercare.", response: "La costellazione assume la forma di una bussola. Il Famiglio riconosce il vostro desiderio di scoperta.", memoryTitle: "Promessa di scoperta", memoryDetail: "La prima settimana si è conclusa con una promessa: ogni mistero sarà un viaggio condiviso.", trait: "curiosity", traitPoints: 4, bondXp: 25, coins: 12, needs: { happiness: 12, affection: 8 }, keepsakeId: "memory-compass" },
      { id: "protect", label: "Ci proteggeremo", intent: "Promettete di essere sempre il rifugio dell'altro.", response: "La costellazione diventa una piccola lanterna. La sua luce pulsa allo stesso ritmo del Famiglio.", memoryTitle: "Promessa di protezione", memoryDetail: "La prima settimana si è conclusa con una promessa: nessuno dei due affronterà il Nexus da solo.", trait: "courage", traitPoints: 4, bondXp: 25, coins: 12, needs: { affection: 14, energy: 5 }, keepsakeId: "memory-lantern" },
    ],
  },
] as const;

export function familiarBondDayKey(now: number) {
  const date = new Date(now);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function familiarBondEvent(day: number | null | undefined) {
  return FAMILIAR_BOND_WEEK.find((event) => event.day === day) ?? null;
}

export function createFamiliarBondWeek(now = Date.now()): FamiliarBondWeekState {
  return {
    currentDay: 1,
    lastVisitDayKey: familiarBondDayKey(now),
    pendingDay: 1,
    completedDays: [],
    choices: [],
    traits: { curiosity: 0, courage: 0, empathy: 0 },
    keepsakeIds: [],
  };
}

export function advanceFamiliarBondWeek(state: FamiliarBondWeekState, now = Date.now()): FamiliarBondWeekState {
  const today = familiarBondDayKey(now);
  if (state.lastVisitDayKey === today) return state;
  if (state.pendingDay !== null || state.currentDay >= FAMILIAR_BOND_WEEK.length) {
    return { ...state, lastVisitDayKey: today };
  }
  const currentDay = Math.min(FAMILIAR_BOND_WEEK.length, state.currentDay + 1);
  return { ...state, currentDay, lastVisitDayKey: today, pendingDay: currentDay };
}

export function resolveFamiliarBondWeekChoice(state: FamiliarBondWeekState, choiceId: string, now = Date.now()) {
  const event = familiarBondEvent(state.pendingDay);
  const choice = event?.choices.find((candidate) => candidate.id === choiceId) ?? null;
  if (!event || !choice || state.completedDays.includes(event.day)) return { state, event: null, choice: null };
  return {
    event,
    choice,
    state: {
      ...state,
      pendingDay: null,
      completedDays: [...state.completedDays, event.day],
      choices: [...state.choices, { day: event.day, choiceId: choice.id, trait: choice.trait, at: now }],
      traits: { ...state.traits, [choice.trait]: state.traits[choice.trait] + choice.traitPoints },
      keepsakeIds: choice.keepsakeId && !state.keepsakeIds.includes(choice.keepsakeId)
        ? [...state.keepsakeIds, choice.keepsakeId]
        : state.keepsakeIds,
    },
  };
}

export function dominantFamiliarBondTrait(state: FamiliarBondWeekState): FamiliarBondTraitId {
  return (Object.entries(state.traits) as Array<[FamiliarBondTraitId, number]>)
    .sort((left, right) => right[1] - left[1] || ["empathy", "curiosity", "courage"].indexOf(left[0]) - ["empathy", "curiosity", "courage"].indexOf(right[0]))[0][0];
}

export function restoreFamiliarBondWeek(value: unknown, now = Date.now()): FamiliarBondWeekState {
  const base = createFamiliarBondWeek(now);
  if (!value || typeof value !== "object" || Array.isArray(value)) return base;
  const candidate = value as Partial<FamiliarBondWeekState>;
  const completedDays = Array.isArray(candidate.completedDays)
    ? Array.from(new Set(candidate.completedDays.filter((day) => Number.isInteger(day) && day >= 1 && day <= FAMILIAR_BOND_WEEK.length))).sort((a, b) => a - b)
    : [];
  const currentDay = Math.max(1, Math.min(FAMILIAR_BOND_WEEK.length, Math.floor(Number(candidate.currentDay) || 1)));
  const pendingDay = Number.isInteger(candidate.pendingDay)
    && Number(candidate.pendingDay) >= 1
    && Number(candidate.pendingDay) <= currentDay
    && !completedDays.includes(Number(candidate.pendingDay))
      ? Number(candidate.pendingDay)
      : null;
  const validTraits = (Object.keys(base.traits) as FamiliarBondTraitId[]).reduce((traits, id) => ({
    ...traits,
    [id]: Math.max(0, Math.min(99, Math.floor(Number(candidate.traits?.[id]) || 0))),
  }), { ...base.traits });
  const choices = Array.isArray(candidate.choices) ? candidate.choices.filter((choice): choice is FamiliarBondChoiceRecord => Boolean(
    choice && Number.isInteger(choice.day) && typeof choice.choiceId === "string" && ["curiosity", "courage", "empathy"].includes(choice.trait) && Number.isFinite(choice.at),
  )).slice(-FAMILIAR_BOND_WEEK.length) : [];
  const restored: FamiliarBondWeekState = {
    currentDay,
    lastVisitDayKey: typeof candidate.lastVisitDayKey === "string" ? candidate.lastVisitDayKey : base.lastVisitDayKey,
    pendingDay,
    completedDays,
    choices,
    traits: validTraits,
    keepsakeIds: Array.isArray(candidate.keepsakeIds)
      ? Array.from(new Set(candidate.keepsakeIds.filter((id): id is string => typeof id === "string" && id in FAMILIAR_BOND_KEEPSAKES)))
      : [],
  };
  return advanceFamiliarBondWeek(restored, now);
}

export function previewFamiliarBondWeek(day: number, now = Date.now()): FamiliarBondWeekState {
  const currentDay = Math.max(1, Math.min(FAMILIAR_BOND_WEEK.length, Math.floor(day)));
  return {
    ...createFamiliarBondWeek(now),
    currentDay,
    pendingDay: currentDay,
    completedDays: Array.from({ length: currentDay - 1 }, (_, index) => index + 1),
    traits: { curiosity: Math.max(0, currentDay - 2), courage: Math.max(0, currentDay - 3), empathy: Math.max(0, currentDay - 1) },
  };
}
