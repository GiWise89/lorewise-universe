export type CreativeJournalKind = "originale" | "ritratto" | "reinterpretazione";

export type CreativeJournalImage = { src: string; alt: string; width: number; height: number };
export type CreativeJournalFact = { label: string; value: string };

export type CreativeJournalEntry = {
  id: string;
  title: string;
  shortTitle?: string;
  kind: CreativeJournalKind;
  label: string;
  summary: string;
  story: string[];
  process: string[];
  facts: CreativeJournalFact[];
  tags: string[];
  image?: CreativeJournalImage;
  processImages: CreativeJournalImage[];
  artworkHref?: string;
  shopHref?: string;
  status: "completo" | "in-lavorazione" | "da-documentare";
};

export type CreativeGameJournalEntry = {
  id: string;
  title: string;
  label: string;
  summary: string;
  currentWork: string[];
  creativeFocus: string[];
  gallery: CreativeJournalImage[];
  code: { title: string; file: string; language: string; snippet: string };
  href: string;
  status: string;
};

const wip = (src: string, alt: string, width = 1205, height = 1600): CreativeJournalImage => ({
  src: `/creative-journal/previews/${src}`,
  alt,
  width,
  height,
});

export const originalStories: CreativeJournalEntry[] = [
  {
    id: "custode-delle-due-lune",
    title: "La Custode delle Due Lune",
    kind: "originale",
    label: "Creazione originale · LW-ART-064",
    summary: "Una figura nata senza una storia già scritta, costruita attraverso silenzio, ornamenti e una presenza sospesa tra eleganza e inquietudine.",
    story: [
      "Questa donna è una mia creazione. Le due fotografie mostrano lo stesso disegno in momenti diversi: nella prima sto ancora definendo la parte bassa, nella seconda le linee e i neri sono più presenti.",
      "Gli elementi che guidano il personaggio sono gli ornamenti, il volume dei capelli, i segni sul volto e la posizione delle mani. Non le ho dato una storia chiusa: preferisco che resti una presenza da interpretare, quieta ma non del tutto rassicurante.",
      "L’archivio conserva anche l’opera completa. Il confronto mostra come le linee iniziali siano diventate campiture, colore e atmosfera senza perdere l’espressione raccolta della prima bozza.",
    ],
    process: ["Costruzione del volto e delle grandi masse dei capelli.", "Inserimento degli ornamenti e dei segni decorativi.", "Definizione delle mani, dell’abito e dei neri più profondi."],
    facts: [
      { label: "Tipo", value: "Personaggio originale" },
      { label: "Strumento", value: "Tavoletta grafica" },
      { label: "Tecnica", value: "Disegno digitale in bianco e nero" },
      { label: "Stato", value: "Opera completa in archivio" },
    ],
    tags: ["originale", "fantasy", "ritratto", "bianco e nero"],
    processImages: [
      wip("lw-wip-001-a-preview.jpg", "Prima fotografia protetta della lavorazione della Custode delle Due Lune", 1200),
      wip("lw-wip-001-b-preview.jpg", "Seconda fotografia protetta della lavorazione della Custode delle Due Lune", 1200),
    ],
    image: { src: "/artworks/previews/lw-art-064-preview.jpg", alt: "Anteprima protetta dell’opera originale completa La Dama dei Due Sguardi", width: 1128, height: 1600 },
    artworkHref: "/arte/lw-art-064",
    status: "completo",
  },
  {
    id: "scappa-finche-puoi",
    title: "Scappa finché puoi",
    kind: "originale",
    label: "Creazione originale · LW-ART-041",
    summary: "Una donna apre i capelli e lascia apparire il volto della creatura nascosta sotto quello umano.",
    story: [
      "La figura che apre i capelli è una mia creazione. Il disegno è costruito come una rivelazione: prima si riconoscono il volto e le mani, poi lo sguardo arriva all’occhio e alle bocche nascoste.",
      "Il bianco e nero tiene insieme la figura, mentre il rosso concentra l’attenzione sulla trasformazione. Qui è possibile confrontare direttamente la fotografia durante la lavorazione con l’anteprima protetta dell’opera completa.",
    ],
    process: ["Le mani incorniciano il volto e aprono la composizione.", "I capelli separano l’aspetto umano dalla creatura.", "Occhio, bocche e rosso completano la trasformazione."],
    facts: [
      { label: "Tipo", value: "Creazione originale" },
      { label: "Strumento", value: "Tavoletta grafica" },
      { label: "Tecnica", value: "Bianco, nero e rosso" },
      { label: "Stato", value: "Opera completa" },
    ],
    tags: ["originale", "soft horror", "trasformazione", "ritratto"],
    processImages: [wip("lw-wip-007-preview.jpg", "Fotografia protetta di Scappa finché puoi durante la lavorazione")],
    image: { src: "/artworks/previews/lw-art-041-preview.jpg", alt: "Anteprima protetta dell’opera originale Scappa finché puoi", width: 1128, height: 1600 },
    artworkHref: "/arte/lw-art-041",
    status: "completo",
  },
  {
    id: "ritratto-vampiresco",
    title: "Ritratto vampiresco",
    kind: "ritratto",
    label: "Ritratto reinterpretato · soft horror",
    summary: "Un ritratto reinterpretato con zanne e piccoli elementi vampireschi, senza perdere la riconoscibilità del volto.",
    story: [
      "Il punto di partenza è un ritratto, non un personaggio già esistente. La reinterpretazione aggiunge una presenza vampiresca mantenendo il volto al centro del lavoro.",
      "Il risultato resta volutamente soft horror: pochi elementi mirati cambiano l’atmosfera senza trasformare completamente il soggetto.",
    ],
    process: ["Studio dei tratti principali del ritratto.", "Aggiunta delle zanne e dello sguardo vampiresco.", "Ricerca dell’equilibrio tra ritratto e horror."],
    facts: [
      { label: "Tipo", value: "Ritratto reinterpretato" },
      { label: "Strumento", value: "Tavoletta grafica" },
      { label: "Atmosfera", value: "Soft horror" },
      { label: "Tempo", value: "Non segnato all’epoca" },
    ],
    tags: ["ritratto", "vampiro", "soft horror", "bianco e nero"],
    processImages: [wip("lw-wip-005-preview.jpg", "Fotografia protetta del ritratto vampiresco durante la lavorazione")],
    status: "da-documentare",
  },
];

export const reinterpretationStories: CreativeJournalEntry[] = [
  {
    id: "michael-jackson-thriller",
    title: "Michael Jackson · Thriller",
    shortTitle: "Thriller",
    kind: "reinterpretazione",
    label: "Thriller · reinterpretazione personale non ufficiale",
    summary: "Quattro passaggi di lavorazione raccontano la trasformazione del volto, dal primo tratto alla versione horror completa a colori.",
    story: [
      "Il set conserva una sequenza reale della lavorazione. Il volto nasce da poche linee, poi acquista espressione attraverso gli occhi, il sorriso e la massa dei capelli.",
      "Nella versione completa il ritratto si divide in due identità: da una parte il volto riconoscibile e la giacca rossa, dall'altra la trasformazione mostruosa ispirata all'immaginario di Thriller.",
    ],
    process: [
      "Costruzione del profilo e dei primi tratti del volto.",
      "Definizione di occhi, sorriso e capelli.",
      "Completamento delle linee e della trasformazione horror.",
      "Colorazione finale e separazione tra lato umano e lato mostruoso.",
    ],
    facts: [
      { label: "Soggetto", value: "Michael Jackson" },
      { label: "Opera di riferimento", value: "Thriller" },
      { label: "Tecnica", value: "Disegno digitale, linea e colore" },
      { label: "Stato", value: "Opera completa in archivio" },
    ],
    tags: ["Michael Jackson", "Thriller", "horror", "fan art", "colore"],
    processImages: [
      wip("lw-wip-011-a-preview.webp", "Prima fase protetta della reinterpretazione di Michael Jackson ispirata a Thriller", 816, 1305),
      wip("lw-wip-011-b-preview.webp", "Seconda fase protetta della reinterpretazione di Michael Jackson ispirata a Thriller", 816, 1305),
      wip("lw-wip-011-c-preview.webp", "Terza fase protetta della reinterpretazione di Michael Jackson ispirata a Thriller", 816, 1305),
      wip("lw-wip-011-d-preview.webp", "Inchiostrazione protetta della reinterpretazione di Michael Jackson ispirata a Thriller", 816, 1305),
    ],
    image: {
      src: "/creative-journal/previews/lw-wip-011-complete-preview.webp",
      alt: "Risultato completo protetto della reinterpretazione di Michael Jackson ispirata a Thriller",
      width: 1057,
      height: 1500,
    },
    status: "completo",
  },
  {
    id: "laezel-guerriera-astrale",
    title: "Lae’zel · Guerriera Astrale",
    shortTitle: "Lae’zel",
    kind: "reinterpretazione",
    label: "Baldur’s Gate 3 · reinterpretazione personale non ufficiale",
    summary: "Uno studio dedicato al profilo, alle trecce e ai tratti della guerriera githyanki.",
    story: ["Lae’zel è un personaggio di Baldur’s Gate 3. In questa reinterpretazione il lavoro si concentra soprattutto sul profilo, sulle orecchie, sulle trecce e sui segni del volto.", "La fotografia conserva anche il riferimento visibile sul monitor: fa parte del processo di osservazione usato per ricostruire il personaggio con il mio tratto."],
    process: ["Studio del profilo.", "Costruzione delle trecce.", "Sintesi finale in bianco e nero."],
    facts: [
      { label: "Soggetto", value: "Lae’zel" }, { label: "Opera di riferimento", value: "Baldur’s Gate 3" }, { label: "Strumento", value: "Tavoletta grafica" }, { label: "Stato", value: "Opera completa in archivio" },
    ],
    tags: ["Baldur’s Gate 3", "fantasy", "ritratto", "fan art"],
    image: { src: "/artworks/previews/lw-art-031-preview.jpg", alt: "Anteprima protetta della reinterpretazione personale di Lae’zel", width: 1128, height: 1600 },
    processImages: [wip("lw-wip-010-preview.jpg", "Fotografia protetta della reinterpretazione di Lae’zel durante la lavorazione")],
    artworkHref: "/arte/lw-art-031",
    status: "completo",
  },
  {
    id: "bulma-energia-denim",
    title: "Bulma · Energia in denim",
    shortTitle: "Bulma",
    kind: "reinterpretazione",
    label: "Dragon Ball · reinterpretazione personale non ufficiale",
    summary: "Una reinterpretazione di Bulma costruita attraverso posa, abbigliamento e forti campiture nere.",
    story: ["Il personaggio resta riconoscibile attraverso il volto, il fiocco e la scritta Bulma. La posa dal basso e l’abbigliamento danno al disegno un’impostazione più decisa.", "La fotografia mostra la fase in bianco e nero sulla tavoletta grafica; la scheda dell’archivio conserva l’anteprima protetta del risultato completo."],
    process: ["Scelta della posa.", "Costruzione dell’abbigliamento.", "Inchiostrazione ad alto contrasto."],
    facts: [
      { label: "Soggetto", value: "Bulma" }, { label: "Opera di riferimento", value: "Dragon Ball" }, { label: "Strumento", value: "Tavoletta grafica" }, { label: "Stato", value: "Opera completa in archivio" },
    ],
    tags: ["Dragon Ball", "anime", "fan art", "bianco e nero"],
    image: { src: "/artworks/previews/lw-art-015-preview.jpg", alt: "Anteprima protetta della reinterpretazione personale di Bulma", width: 1000, height: 1600 },
    processImages: [wip("lw-wip-004-preview.jpg", "Fotografia protetta della reinterpretazione di Bulma durante la lavorazione", 1200)],
    artworkHref: "/arte/lw-art-015",
    status: "completo",
  },
  {
    id: "pennywise-welcome-to-derry",
    title: "Pennywise: Welcome to Derry",
    shortTitle: "Pennywise",
    kind: "reinterpretazione",
    label: "IT: Welcome to Derry · reinterpretazione personale non ufficiale",
    summary: "Una reinterpretazione del Pennywise della serie Welcome to Derry, con crepe, trucco e capelli arancioni liberi intorno al volto.",
    story: ["Questo Pennywise è ispirato alla serie IT: Welcome to Derry. Non è la stessa versione presente in altre opere dell’archivio: cambiano il volto, il trucco e il modo in cui sono costruiti i capelli.", "La lavorazione parte dal disegno in bianco e nero e arriva a una palette molto netta: rosso, nero, bianco, arancione e giallo. Il risultato completo è mostrato attraverso l’immagine del quadro già presente nel catalogo GiWise Shop."],
    process: ["Linee del volto e del costume.", "Crepe, trucco e neri profondi.", "Colorazione di capelli, occhi e parti rosse."],
    facts: [
      { label: "Soggetto", value: "Pennywise" }, { label: "Opera di riferimento", value: "IT: Welcome to Derry" }, { label: "Strumento", value: "Tavoletta grafica" }, { label: "Stato", value: "Opera completa e applicata al quadro" },
    ],
    tags: ["Welcome to Derry", "horror", "fan art", "colore"],
    image: { src: "/artworks/previews/lw-art-066-preview.jpg", alt: "Anteprima protetta della reinterpretazione completa di Pennywise ispirata a Welcome to Derry", width: 1128, height: 1600 },
    processImages: [wip("lw-wip-006-preview.jpg", "Fotografia protetta della reinterpretazione di Pennywise durante la lavorazione")],
    artworkHref: "/arte/lw-art-066",
    shopHref: "https://giwiseshop.it/quadro-pennywise-nightmare-grin---giwise-art-editi/",
    status: "completo",
  },
  {
    id: "batwoman-panico",
    title: "Batwoman",
    kind: "reinterpretazione",
    label: "DC · reinterpretazione personale non ufficiale",
    summary: "Un primo piano ravvicinato che porta l’espressione di Batwoman al centro della composizione.",
    story: ["La reinterpretazione usa un taglio molto vicino: maschera, mani, bocca e occhi riempiono quasi tutto lo spazio disponibile.", "Il simbolo sul petto mantiene immediato il riconoscimento del personaggio, mentre l’espressione sposta il disegno verso un momento meno controllato e più estremo."],
    process: ["Taglio ravvicinato.", "Costruzione dell’espressione.", "Contrasto tra maschera, mani e volto."],
    facts: [
      { label: "Soggetto", value: "Batwoman" }, { label: "Opera di riferimento", value: "DC" }, { label: "Strumento", value: "Tavoletta grafica" }, { label: "Stato", value: "Opera completa in archivio" },
    ],
    tags: ["DC", "fumetto", "fan art", "espressione"],
    image: { src: "/artworks/previews/lw-art-009-preview.jpg", alt: "Anteprima protetta della reinterpretazione personale di Batwoman", width: 1128, height: 1600 },
    processImages: [wip("lw-wip-003-preview.jpg", "Fotografia protetta della reinterpretazione di Batwoman durante la lavorazione", 900)],
    artworkHref: "/arte/lw-art-009",
    status: "completo",
  },
];

export const studioSketches: CreativeJournalEntry[] = [
  {
    id: "studio-dragon-ball-trono",
    title: "Potere sul trono",
    kind: "reinterpretazione",
    label: "Dragon Ball · reinterpretazione personale non ufficiale",
    summary: "Una figura immobile e dominante, costruita attraverso il trono, la coda e grandi masse nere.",
    story: ["Una reinterpretazione legata a Dragon Ball. Non ricordo con certezza quale personaggio avessi scelto: preferisco lasciare aperto questo dettaglio finché non ritroverò l’appunto originale."],
    process: ["Costruzione della posa.", "Equilibrio tra figura e trono.", "Definizione della coda e dei neri."],
    facts: [{ label: "Universo", value: "Dragon Ball" }, { label: "Strumento", value: "Tavoletta grafica" }, { label: "Identificazione", value: "Da confermare" }],
    tags: ["Dragon Ball", "anime", "fan art"],
    processImages: [wip("lw-wip-002-preview.jpg", "Fotografia protetta di una reinterpretazione Dragon Ball durante la lavorazione", 1200)],
    status: "da-documentare",
  },
  {
    id: "mucca-e-pollo",
    title: "Mucca e Pollo",
    kind: "reinterpretazione",
    label: "Cartoon · reinterpretazione personale non ufficiale",
    summary: "Una pagina più leggera, fatta di colori netti, espressioni esagerate e personaggi riuniti nella stessa scena.",
    story: ["Questa reinterpretazione riprende l’energia assurda di Mucca e Pollo. La fotografia mostra una fase già colorata, con il rosso al centro e le figure secondarie costruite intorno."],
    process: ["Posa di gruppo.", "Campiture rosse e gialle.", "Rifinitura dei contorni."],
    facts: [{ label: "Opera di riferimento", value: "Mucca e Pollo" }, { label: "Strumento", value: "Tavoletta grafica" }, { label: "Atmosfera", value: "Cartoon e ironica" }],
    tags: ["cartoon", "colore", "fan art", "umorismo"],
    processImages: [wip("lw-wip-008-preview.jpg", "Fotografia protetta della reinterpretazione di Mucca e Pollo durante la lavorazione")],
    status: "da-documentare",
  },
  {
    id: "ed-edd-eddy",
    title: "Ed, Edd & Eddy",
    kind: "reinterpretazione",
    label: "Cartoon · reinterpretazione personale non ufficiale",
    summary: "Tre personaggi riconoscibili attraverso silhouette, sorrisi e un tratto che conserva l’energia del cartoon.",
    story: ["La bozza riunisce il trio nello stesso spazio. Sono ancora visibili aree non completate e linee in pulizia: proprio per questo la fotografia racconta bene una fase intermedia del lavoro."],
    process: ["Blocco delle silhouette.", "Espressioni e mani.", "Pulizia progressiva del tratto."],
    facts: [{ label: "Opera di riferimento", value: "Ed, Edd & Eddy" }, { label: "Strumento", value: "Tavoletta grafica" }, { label: "Stato fotografato", value: "Lavorazione intermedia" }],
    tags: ["cartoon", "fan art", "bianco e nero"],
    processImages: [wip("lw-wip-009-preview.jpg", "Fotografia protetta della reinterpretazione di Ed, Edd e Eddy durante la lavorazione")],
    status: "da-documentare",
  },
];

export const creativeJournalEntries = [...originalStories, ...reinterpretationStories, ...studioSketches];
export const featuredCreativeStory = originalStories.find((entry) => entry.id === "scappa-finche-puoi")!;
export function getCreativeJournalEntry(id: string) { return creativeJournalEntries.find((entry) => entry.id === id); }

export const gameJournalEntries: CreativeGameJournalEntry[] = [
  {
    id: "the-wound-remembers",
    title: "The Wound Remembers",
    label: "Card RPG dark fantasy",
    summary: "Mesi passati a scrivere codice, provare battaglie e collegare carte, campagne, spedizioni e progressione in un solo mondo.",
    currentWork: ["Bilanciamento e manutenzione del gioco vivo.", "Edizione Windows verificata e distribuzione privata in preparazione.", "Versione Android ancora in lavorazione."],
    creativeFocus: ["Un dark fantasy leggibile anche durante le battaglie più dense.", "Kharvoss, i draghi e le carte devono appartenere allo stesso mondo visivo.", "Ogni carta unisce illustrazione, ruolo tattico, costo e risultato nel motore di gioco."],
    gallery: [
      { src: "/games/the-wound-remembers/gameplay-battle.webp", alt: "Battaglia reale di The Wound Remembers su tre corsie", width: 2000, height: 1250 },
      { src: "/games/the-wound-remembers/gameplay-decks.webp", alt: "Costruzione di un mazzo in The Wound Remembers", width: 2000, height: 1250 },
      { src: "/games/the-wound-remembers/gameplay-campaign.webp", alt: "Mappa della campagna di The Wound Remembers", width: 2000, height: 1250 },
      { src: "/games/the-wound-remembers/gameplay-expedition.webp", alt: "Percorso della spedizione di The Wound Remembers", width: 2000, height: 1250 },
    ],
    code: {
      title: "Ricompense dopo una battaglia",
      file: "src/game/profile.ts",
      language: "TypeScript",
      snippet: "export function resolveBattleResult(\n  profile: PlayerProfile,\n  winner: 'player' | 'boss',\n  encounterId: EncounterId = 'vakun',\n  countsForCampaign = true,\n) {\n  const encounter = encounters[encounterId]\n  const gainedExperience = winner === 'player'\n    ? encounter.victoryExperience\n    : 10\n  const firstVictory = countsForCampaign\n    && winner === 'player'\n    && !profile.completedCampaignNodeIds.includes(encounterId)\n}",
    },
    href: "/giochi/the-wound-remembers",
    status: "Disponibile e in aggiornamento",
  },
  {
    id: "lorewise-fuori-trama-next",
    title: "Fuori Trama",
    label: "RPG narrativo e tattico",
    summary: "Mesi di codice per far convivere campagne, prove d20, compagnia, inventario e combattimenti nello stesso percorso persistente.",
    currentWork: ["Duello e combattimento a carte in collaudo.", "Build gratuita pubblica in preparazione.", "Responsive, accessibilità e audit dei contenuti ancora da completare."],
    creativeFocus: ["L’aspetto da tavolo deve restare leggibile mentre cambiano personaggi e ambientazioni.", "Ogni personaggio richiede ritratto, statistiche, ruolo, abilità e carte coerenti.", "Il blu e il viola del Nexus tengono insieme mondi visivamente molto diversi."],
    gallery: [
      { src: "/games/lorewise-fuori-trama-next/gameplay-current-campaigns.webp", alt: "Scelta delle campagne di Fuori Trama", width: 2000, height: 1250 },
      { src: "/games/lorewise-fuori-trama-next/gameplay-current-expedition-party.webp", alt: "Formazione della compagnia in Fuori Trama", width: 2000, height: 1250 },
      { src: "/games/lorewise-fuori-trama-next/gameplay-current-tactical-battle.webp", alt: "Battaglia tattica reale di Fuori Trama", width: 2000, height: 1250 },
      { src: "/games/lorewise-fuori-trama-next/gameplay-current-card-duel.webp", alt: "Duello a carte di Fuori Trama", width: 2000, height: 1250 },
    ],
    code: {
      title: "Probabilità di colpire con il d20",
      file: "src/engine/combatExchange.ts",
      language: "TypeScript",
      snippet: "export const hitProbability = (state, attackerId, targetId) => {\n  const attacker = state.units.find(unit => unit.id === attackerId)\n  const target = state.units.find(unit => unit.id === targetId)\n  if (!attacker || !target) return 0\n\n  const targetAc = target.armorClass + coverBonus(state, target)\n  return Math.max(5, Math.min(95,\n    (21 - (targetAc - attacker.attackBonus)) * 5\n  ))\n}",
    },
    href: "/giochi/lorewise-fuori-trama-next",
    status: "In sviluppo",
  },
  {
    id: "demon-match-three",
    title: "Demon Match Three",
    label: "Match-3 horror RPG",
    summary: "Mesi di sviluppo per trasformare una griglia match-3 in un RPG horror con mappa, battaglie, creature, ricompense e progressione.",
    currentWork: ["Controlli sulla progressione e sulle battaglie.", "Preparazione delle edizioni Windows e Android.", "Distribuzione ancora non attiva."],
    creativeFocus: ["La griglia deve essere leggibile senza perdere l’atmosfera horror.", "Custodi, nemici, reliquie e ambienti hanno funzioni visive e di gioco differenti.", "Colori, simboli ed effetti devono far capire immediatamente cosa accade dopo ogni combinazione."],
    gallery: [
      { src: "/games/demon-match-three/gameplay-current-menu.webp", alt: "Menu principale di Demon Match Three", width: 2000, height: 1250 },
      { src: "/games/demon-match-three/gameplay-current-map.webp", alt: "Mappa di progressione di Demon Match Three", width: 2000, height: 1250 },
      { src: "/games/demon-match-three/gameplay-current-battle.webp", alt: "Schermata reale di una battaglia di Demon Match Three", width: 2000, height: 1250 },
      { src: "/games/demon-match-three/gameplay-current-reliquary.webp", alt: "Reliquiario di Demon Match Three", width: 2000, height: 1250 },
      { src: "/games/demon-match-three/gameplay-current-reward.webp", alt: "Ricompensa dopo una battaglia di Demon Match Three", width: 2000, height: 1250 },
    ],
    code: {
      title: "Risoluzione della griglia",
      file: "src/game/board.ts",
      language: "TypeScript",
      snippet: "export function resolveBoard(board, groups, options = {}) {\n  const size = board.length\n  const next = cloneBoard(board)\n  const resolvedGroups = options.fusionTrigger ? [] : groups\n  const clear = new Map()\n  const powerHits = new Set()\n\n  resolvedGroups.flatMap(group => group.cells)\n    .forEach(position =>\n      clear.set(positionKey(position), position)\n    )\n\n  const activated = new Set()\n  const fusionName = options.fusionTrigger\n    ? applyFusion(board, options.fusionTrigger, clear, activated)\n    : undefined\n}",
    },
    href: "/giochi/demon-match-three",
    status: "In sviluppo",
  },
];

export function getGameJournalEntry(id: string) { return gameJournalEntries.find((entry) => entry.id === id); }
