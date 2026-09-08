export type GamePlayStep = {
  number: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
};

export type GameWindowsOffer = {
  productCode: string;
  edition: string;
  launchPrice: string;
  futurePrice: string;
  availability: string;
  delivery: string;
  requirements: string[];
  systemRequirements: string[];
  installationSteps: string[];
  licenseSummary: string[];
  signatureNotice: string;
  purchaseUrl?: string;
  readiness: Array<{ label: string; status: "ready" | "pending"; note: string }>;
};

export type GameReleaseUpdate = {
  version: string;
  languages?: string[];
  date: string;
  title: string;
  summary: string;
  highlights: string[];
};

export type GameDevelopmentItem = {
  title: string;
  status: string;
  description: string;
};

export type GameNarrativeFeature = {
  eyebrow: string;
  title: string;
  description: string[];
  image: string;
  imageAlt: string;
  closingLine?: string;
};

export type GameProtagonistReveal = {
  eyebrow: string;
  title: string;
  introduction: string;
  image: string;
  imageAlt: string;
  characters: Array<{
    name: string;
    faction: string;
    calling: string;
    image: string;
    imageAlt: string;
    tone: "dawn" | "shadow";
  }>;
  closing: string;
};

export type GameFreeAccess = {
  availability: string;
  description: string;
  inclusions: string[];
  downloadUrl?: string;
};

export type GameProjectRecord = {
  slug: string;
  code: string;
  title: string;
  subtitle: string;
  studio: string;
  status: "Disponibile e in aggiornamento" | "In sviluppo";
  statusTone: "available" | "development";
  kind: string;
  version: string;
  languages: string[];
  platforms: string[];
  access: string;
  price: string;
  heroImage: string;
  heroAlt: string;
  mobileHeroImage?: string;
  coverImage?: string;
  coverAlt?: string;
  catalogCoverImage?: string;
  catalogCoverAlt?: string;
  logoImage?: string;
  summary: string;
  description: string[];
  features: string[];
  playFlow?: GamePlayStep[];
  windowsOffer?: GameWindowsOffer;
  latestUpdate?: GameReleaseUpdate;
  releaseArchive?: GameReleaseUpdate[];
  developmentRoadmap?: GameDevelopmentItem[];
  narrativeFeature?: GameNarrativeFeature;
  protagonistReveal?: GameProtagonistReveal;
  freeAccess?: GameFreeAccess;
  passBenefits?: string[];
  publicUrl?: string;
  publicAction?: string;
  releasePlan: string;
  commercialNote: string;
  updateNote: string;
  knownIssues: string[];
  mediaNote: string;
  rightsNote?: string;
};

export const gameProjects: GameProjectRecord[] = [
  {
    slug: "the-wound-remembers",
    code: "GS-GAME-001",
    title: "The Wound Remembers",
    subtitle: "Dark fantasy PvE card RPG",
    studio: "GiWise Studio",
    status: "Disponibile e in aggiornamento",
    statusTone: "available",
    kind: "Gioco di carte strategico · PvE",
    version: "Versione web 1.0.0",
    languages: ["Italiano · interfaccia e contenuti"],
    platforms: ["Browser", "Windows x64 verificato", "Android in preparazione"],
    access: "Versione web disponibile con account",
    price: "Web disponibile · Windows €7,99 al lancio",
    heroImage: "/games/the-wound-remembers/key-art-scene-4k-v3.webp",
    heroAlt: "Kharvoss fra i due draghi nel santuario ferito di The Wound Remembers",
    mobileHeroImage: "/games/the-wound-remembers/key-art-mobile-v1.webp",
    coverImage: "/games/the-wound-remembers/key-art-cover-v2.webp",
    coverAlt: "Copertina di The Wound Remembers con Kharvoss, i due draghi e tre carte realmente presenti nel gioco",
    catalogCoverImage: "/games/the-wound-remembers/catalog-cover-generated-v1.webp",
    catalogCoverAlt: "Kharvoss tra i due draghi nel santuario ferito di The Wound Remembers",
    logoImage: "/games/the-wound-remembers/logo-white-v2.webp",
    summary: "Un card RPG dark fantasy costruito attorno a campagne, spedizioni, battaglie su tre corsie e una collezione che continua a evolversi.",
    description: [
      "The Wound Remembers è un gioco PvE completo e in continuo aggiornamento. Il giocatore costruisce il proprio mazzo, affronta una campagna in dieci atti e attraversa battaglie strategiche organizzate su tre corsie.",
      "Accanto alla campagna trovano spazio una spedizione roguelite, la Forgia, gli Eventi, il Bestiario, i Famigli con Habitat e Arena, il profilo cloud e un’economia verificata dal server.",
      "La versione web è già giocabile. L’installer Windows 1.0.2 è stato verificato come build desktop completa: integrità, Defender, installazione, avvio e rimozione sono superati; archivio privato e canale di aggiornamento restano separati prima della vendita.",
    ],
    features: [
      "Campagna narrativa articolata in dieci atti",
      "Spedizione roguelite con progressione dedicata",
      "Combattimenti PvE strategici su tre corsie",
      "Collezione, costruzione e salvataggio dei mazzi",
      "Forgia, fusioni, reliquie ed economia di gioco",
      "Famigli con Habitat e Arena",
      "Eventi, Bestiario e tutorial contestuale",
      "Profilo locale e cloud con continuità dei progressi",
    ],
    playFlow: [
      { number: "01", title: "Costruisci il Patto", description: "Scegli la fazione, filtra la collezione e prepara un mazzo da venti carte con una condizione di vittoria leggibile.", image: "/games/the-wound-remembers/gameplay-decks.webp", imageAlt: "Costruttore di mazzi con collezione e diagnosi del Patto" },
      { number: "02", title: "Scegli dove incidere", description: "Segui la Campagna o affronta i bivi della Spedizione, valutando incontri, rischi e ricompense prima di entrare in battaglia.", image: "/games/the-wound-remembers/gameplay-campaign.webp", imageAlt: "Mappa della Campagna con percorsi e incontri" },
      { number: "03", title: "Combatti su tre corsie", description: "Leggi l’intenzione della Nemesi, usa l’Essenza e posiziona creature, magie e ambienti nel momento decisivo.", image: "/games/the-wound-remembers/gameplay-battle.webp", imageAlt: "Campo di battaglia strategico disposto su tre corsie" },
      { number: "04", title: "Conserva ogni cicatrice", description: "Sblocca carte, reliquie, Famigli e nuovi percorsi: il profilo accompagna il Custode fra sessioni e aggiornamenti.", image: "/games/the-wound-remembers/gameplay-expedition.webp", imageAlt: "Percorso della Spedizione con progressione persistente" },
    ],
    publicUrl: "https://thewoundremembers.com/",
    publicAction: "Gioca alla versione web",
    windowsOffer: {
      productCode: "GS-GAME-001-WIN",
      edition: "Edizione Windows",
      launchPrice: "€7,99",
      futurePrice: "€9,99",
      availability: "Installer 1.0.2 verificato · archivio privato non ancora collegato",
      delivery: "Download personale Windows x64 · distribuzione diretta da LoreWise Universe e GiWise Studio",
      requirements: ["Account LoreWise obbligatorio", "Connessione internet richiesta", "Aggiornamenti inclusi", "Una licenza personale per acquirente"],
      systemRequirements: ["Windows x64", "Schermo consigliato da 1280 × 720", "Connessione internet per account, salvataggi cloud e servizi online", "Almeno 800 MB di spazio libero consigliato; installer verificato da 379.498.399 byte"],
      installationSteps: ["Scarica l’EXE esclusivamente dalla libreria personale LoreWise", "Confronta nome, versione e impronta SHA-256 pubblicati nella scheda", "Avvia l’installer e segui l’avviso trasparente della distribuzione indipendente", "Accedi con il LoreWise ID collegato all’acquisto e conserva la ricevuta"],
      licenseSummary: ["Licenza personale, non esclusiva e non trasferibile", "Uso consentito a un solo titolare LoreWise per volta", "Redistribuzione, rivendita e pubblicazione dell’installer vietate", "Aggiornamenti inclusi finché l’edizione resta supportata"],
      signatureNotice: "La build può essere distribuita senza certificato commerciale. In tal caso Windows potrebbe mostrare un avviso: LoreWise pubblicherà editore dichiarato, dimensione e SHA-256, senza chiedere di disattivare antivirus o protezioni di sistema.",
      readiness: [
        { label: "Prezzo e licenza", status: "ready", note: "Prezzo di lancio €7,99 e licenza personale definiti; prezzo futuro previsto €9,99." },
        { label: "Account e ordine", status: "ready", note: "LoreWise ID, ordine e libreria giochi sono predisposti." },
        { label: "Installer Windows", status: "ready", note: "EXE 1.0.2, frontend desktop integrale, SHA-256 e versione interna verificati." },
        { label: "Controlli Windows", status: "ready", note: "Defender, installazione, avvio desktop e disinstallazione superati; distribuzione non firmata dichiarata." },
        { label: "Consegna privata", status: "ready", note: "L'ordine viene collegato al LoreWise ID; GiWise Studio invia il collegamento privato all'email verificata e registra la consegna nel Centro Admin." },
        { label: "Aggiornamenti", status: "pending", note: "La prima uscita userà aggiornamenti manuali finché il canale automatico non sarà collaudato con una versione successiva valida." },
      ],
    },
    latestUpdate: {
      version: "1.0.0",
      date: "18 agosto 2026",
      title: "Prima edizione completa",
      summary: "La versione corrente riunisce il percorso principale di The Wound Remembers e consolida i sistemi costruiti durante lo sviluppo in un’unica esperienza PvE persistente.",
      highlights: ["Campagna completa in dieci atti", "276 carte verificate e 31 Evoluzioni", "Spedizione roguelite in dieci profondità", "Famigli, Habitat, Arena, Forgia ed Eventi collegati al profilo"],
    },
    releaseArchive: [],
    developmentRoadmap: [
      { title: "Edizione Windows", status: "Build 1.0.2 verificata", description: "Installer, runtime e rimozione sono superati; restano archivio privato grande file e collaudo commerciale." },
      { title: "Edizione Android", status: "In preparazione", description: "Adattamento mobile e controlli su dispositivi reali prima della distribuzione ufficiale." },
      { title: "Gioco vivo", status: "Continuativo", description: "Bilanciamento, manutenzione, nuove carte e contenuti saranno annunciati soltanto quando confermati." },
    ],
    releasePlan: "Verificare nuovamente impronta e dimensione dell’installer Windows x64 1.0.2 prima del lancio, quindi attivare Stripe live e la consegna privata tracciata soltanto con l’autorizzazione finale alla pubblicazione.",
    commercialNote: "Prezzo di lancio approvato: €7,99, con prezzo ordinario futuro previsto di €9,99. Il gioco sarà incluso per gli abbonati con piano attivo; acquisto permanente e download saranno gestiti direttamente dalla sezione Distribuzione di LoreWise Universe dopo la verifica dell’installer.",
    updateNote: "Gioco completo, mantenuto come progetto vivo con nuove versioni e contenuti.",
    knownIssues: [
      "L’edizione Windows verificata non usa ancora un certificato commerciale e può mostrare l’avviso di Windows SmartScreen.",
      "La prima edizione Windows riceverà aggiornamenti manuali finché il canale automatico non sarà collaudato con una release successiva.",
      "Profilo cloud, salvataggi e servizi online richiedono una connessione internet attiva.",
      "La versione Android non è ancora disponibile e non è stata collaudata su dispositivi pubblici.",
    ],
    mediaNote: "Guarda il trailer gameplay: fusioni delle carte, attacchi contro la Nemesi e Scontro dei Patti tra Famigli. La galleria accompagna il video con quattro schermate del gioco.",
  },
  {
    slug: "lorewise-fuori-trama-next",
    code: "GS-GAME-002",
    title: "Fuori Trama",
    subtitle: "Un RPG tattico di LoreWise Universe con regole d20",
    studio: "GiWise Studio",
    status: "In sviluppo",
    statusTone: "development",
    kind: "RPG narrativo e tattico",
    version: "Pre-release 0.1.0",
    languages: ["Italiano · sviluppo corrente"],
    platforms: ["Browser · sviluppo locale", "Download desktop · in preparazione"],
    access: "Gratuito per tutti · download pubblico in preparazione",
    price: "Gratuito",
    heroImage: "/games/lorewise-fuori-trama-next/catalog-cover-generated-v1.webp",
    heroAlt: "Quattro personaggi provenienti da mondi diversi giocano insieme al tavolo di Fuori Trama nel Nexus",
    catalogCoverImage: "/games/lorewise-fuori-trama-next/catalog-cover-generated-v1.webp",
    catalogCoverAlt: "Cartman, Pennywise, Lara Croft e Naruto giocano insieme a un tavolo fantasy nel Nexus",
    logoImage: "/games/lorewise-fuori-trama-next/logo-official-v2.webp",
    summary: "Un gioco di ruolo tattico nel quale campagne, scelte, prove d20, compagnia, inventario e battaglie conservano conseguenze persistenti.",
    description: [
      "Fuori Trama è il progetto RPG tattico di LoreWise Universe. Il percorso conduce dalla scelta della campagna alla formazione della compagnia, dallo zaino all’avventura e infine alla battaglia e al bottino.",
      "Il motore gestisce prove d20, movimento, combattimento, CPU e inventario. Il progetto comprende campagne narrative, capitoli, eventi, una spedizione in dieci soglie e un Codice del Nexus strutturato come enciclopedia del multiverso.",
      "Il gioco è ancora in sviluppo e rimane locale. La futura build sarà distribuita gratuitamente a tutti: Universe Pass sosterrà LoreWise e offrirà anticipazioni e partecipazione, senza diventare il prezzo del gioco.",
    ],
    features: [
      "Campagne narrative con scelte e conseguenze persistenti",
      "Prove d20, modificatori e classi difficoltà",
      "Formazione della compagnia e reclutamento progressivo",
      "Zaino, equipaggiamento e mazzi di abilità",
      "Tavolo tattico, movimento e combattimento a carte",
      "Spedizione composta da dieci soglie",
      "Mercante, bottino, campo e progressione dell’account",
      "Codice del Nexus con schede enciclopediche collegate",
    ],
    playFlow: [
      { number: "01", title: "Scegli la storia", description: "Esamina le cronache disponibili, confronta genere e avanzamento e apri la campagna che vuoi portare nel Nexus.", image: "/games/lorewise-fuori-trama-next/gameplay-current-campaigns.webp", imageAlt: "Catalogo desktop delle campagne narrative di Fuori Trama con la cronaca di South Park selezionata" },
      { number: "02", title: "Costruisci la compagnia", description: "Forma un gruppo di cinque personaggi provenienti da mondi differenti, assegna ruoli complementari e prepara la Spedizione attraverso dieci soglie.", image: "/games/lorewise-fuori-trama-next/gameplay-current-expedition-party.webp", imageAlt: "Formazione desktop della compagnia di Fuori Trama con Naruto, Sakura, Pennywise, Batman e Sonic" },
      { number: "03", title: "Combatti sul tavolo tattico", description: "Muovi gli eroi sulla mappa, leggi obiettivi e alterazioni, sfrutta il campo e gestisci azione, bonus, reazione, movimento e Focus.", image: "/games/lorewise-fuori-trama-next/gameplay-current-tactical-battle.webp", imageAlt: "Battaglia tattica desktop di Fuori Trama ambientata nella scuola innevata di South Park" },
      { number: "04", title: "Risolvi il duello con le carte", description: "Dichiara l’azione, scegli la carta, valuta probabilità e soglia d20 e affronta risposta, tiro e impatto in una sequenza leggibile.", image: "/games/lorewise-fuori-trama-next/gameplay-current-card-duel.webp", imageAlt: "Duello desktop con carte tra Stan Marsh e un Venditore d’Ombre in Fuori Trama" },
    ],
    narrativeFeature: {
      eyebrow: "Il cuore del Nexus",
      title: "Personaggi strappati alle proprie storie. Un Nexus che riscrive le regole.",
      description: [
        "Le campagne non sono scenari isolati: entrano nel Nexus, si contaminano e lasciano conseguenze persistenti sulla compagnia, sull’equipaggiamento e sulle scelte successive.",
        "Il tavolo trasforma la storia in sistema. Prove d20, esplorazione, combattimento a carte e progressione del LoreWise ID appartengono allo stesso viaggio.",
      ],
      image: "/games/lorewise-fuori-trama-next/nexus-chamber.webp",
      imageAlt: "Camera del Nexus blu e viola usata come ambientazione di Fuori Trama",
      closingLine: "Ogni mondo ha una trama. Qui puoi uscirne.",
    },
    latestUpdate: {
      version: "0.1.0",
      languages: ["Italiano"],
      date: "19 agosto 2026",
      title: "Flusso React e sistemi del Nexus integrati",
      summary: "La build locale corrente collega il percorso principale, la persistenza e i sistemi tattici in un’unica applicazione React e TypeScript ancora in pre-release.",
      highlights: ["667 schede normalizzate", "14 campagne, 112 capitoli e 336 eventi", "Flusso Campagna, Gruppo, Zaino, Avventura, Battaglia, Bottino e Campo", "Spedizione, Mercato, Archivio, account e Codice del Nexus collegati"],
    },
    releaseArchive: [],
    developmentRoadmap: [
      { title: "Duello e combattimento a carte", status: "Integrato · in collaudo", description: "La nuova arena collega dichiarazione, risposta, prova d20 e impatto; la schermata desktop corrente è ora documentata nel dossier." },
      { title: "Build gratuita pubblica", status: "In preparazione", description: "Pacchetto, requisiti, integrità, aggiornamenti e download diretto saranno verificati prima di attivare il pulsante per tutti." },
      { title: "Audit contenuti e diritti", status: "Necessario prima del download", description: "La build pubblica deve dichiarare con precisione provenienza e condizioni d’uso dei contenuti inclusi." },
      { title: "Responsive e accessibilità", status: "Da completare", description: "Il percorso principale sarà ricontrollato su desktop e mobile prima della prima distribuzione pubblica." },
    ],
    freeAccess: {
      availability: "Download gratuito in preparazione",
      description: "Fuori Trama sarà scaricabile gratuitamente da chiunque. Nessun abbonamento e nessun acquisto saranno richiesti per ottenere il gioco.",
      inclusions: ["Gioco completo disponibile gratuitamente quando la build sarà approvata", "Versione, piattaforma, requisiti, dimensione e integrità dichiarati prima del download", "Aggiornamenti del gioco non legati a un piano a pagamento", "Pulsante attivato soltanto quando esisterà un file pubblico verificato"],
    },
    passBenefits: [
      "Diario dello studio e approfondimenti pubblicati in anticipo",
      "Anteprime su campagne, sistemi, personaggi e tavolo tattico",
      "Votazioni verificate con un voto per LoreWise ID",
      "Candidature ai test e alle future sessioni beta",
      "Materiali dietro le quinte e dossier di sviluppo estesi",
    ],
    releasePlan: "Completare collaudo tecnico, audit dei contenuti e confezionamento della build; pubblicare poi il download gratuito per tutti con versione, requisiti e integrità dichiarati.",
    commercialNote: "Fuori Trama non sarà venduto: il gioco sarà gratuito per tutti. Universe Pass sostiene LoreWise e offre anticipazioni, materiali editoriali e partecipazione, ma non costituisce il prezzo del gioco.",
    updateNote: "Progetto attivo in sviluppo, documentato nel diario di GiWise Studio fino alla futura versione pubblica.",
    knownIssues: [
      "La build React collega il flusso principale, ma persistenza, responsive e accessibilità richiedono ancora il collaudo pubblico finale.",
      "Il download gratuito non è ancora attivo: pacchetto, requisiti, hash e aggiornamenti devono essere verificati.",
      "Il duello a carte è integrato e documentato; bilanciamento, leggibilità e varietà delle carte restano in collaudo.",
      "I materiali riferiti a universi di terzi richiedono una revisione dei diritti anche quando il gioco viene distribuito gratuitamente.",
    ],
    mediaNote: "Il dossier usa quattro catture desktop della build corrente: campagne, formazione della Spedizione, battaglia tattica e duello con carte. La selezione evita ripetizioni ed è mostrata integralmente, senza ritagli o trasformazioni.",
    rightsNote: "Universo, struttura e sistemi del Nexus sono un progetto LoreWise. La build di sviluppo include anche personaggi e riferimenti provenienti da universi di terzi: la gratuità non sostituisce la revisione delle condizioni d’uso. Prima del download pubblico verranno dichiarati contenuti inclusi, provenienza, limiti e decisioni adottate per ogni materiale.",
  },
  {
    slug: "demon-match-three",
    code: "GS-GAME-003",
    title: "Demon Match Three",
    subtitle: "Match-3 RPG fantasy per Android",
    studio: "GiWise Studio",
    status: "In sviluppo",
    statusTone: "development",
    kind: "Match-3 fantasy · RPG strategico mobile",
    version: "Android nativo 0.1.0-native",
    languages: ["Italiano · interfaccia e contenuti"],
    platforms: ["Android · smartphone e tablet"],
    access: "Sviluppo privato · demo gratuita in arrivo",
    price: "Demo gratuita Android in arrivo",
    heroImage: "/games/demon-match-three/gameplay-portal-backdrop-v1.webp",
    heroAlt: "Portale fantasy tra energia celeste e infernale sopra una griglia di gemme match-3",
    mobileHeroImage: "/games/demon-match-three/gameplay-portal-backdrop-v1.webp",
    catalogCoverImage: "/games/demon-match-three/gameplay-portal-backdrop-v1.webp",
    catalogCoverAlt: "Scenario di gameplay di Demon Match Three con portale, cristalli e griglia di gemme",
    logoImage: "/games/demon-match-three/logo-official-v2.webp",
    summary: "Un match-3 RPG mobile in cui combinazioni, fusioni e cascate alimentano combattimento, poteri e progressione attraverso una campagna fantasy per Android.",
    description: [
      "Demon Match Three viene ricostruito come esperienza Android nativa, pensata fin dall’inizio per smartphone e tablet. La griglia resta il cuore del gioco, con controlli touch, fusioni, cascate e combattimenti leggibili sullo schermo verticale.",
      "Il viaggio nasce da una frattura tra due forze opposte. Il giocatore sceglie un richiamo e attraversa un prologo dedicato, ma identità, motivazioni e svolte narrative restano protette nell’anteprima riservata dell’Area VIP.",
      "La campagna, la progressione e le modalità del progetto precedente vengono reinterpretate nella nuova applicazione mobile senza riutilizzare il vecchio runtime web. Una demo gratuita per Android è in preparazione.",
    ],
    features: [
      "Applicazione Android nativa per telefono e tablet",
      "Scelta iniziale tra due forze contrapposte",
      "Prologo distinto in base al percorso selezionato",
      "Match-3 con fusioni, cascate, hint e rimescolamento",
      "Combattimento RPG con obiettivi, poteri e ricompense",
      "Campagna progettata su cento missioni e scontri con boss",
      "Progressione e salvataggio separati per Demon Match Three",
      "Interfaccia verticale con controlli touch adatti al mobile",
    ],
    playFlow: [
      {
        number: "01",
        title: "Scegli la prossima missione",
        description: "La mappa dell’Atto I organizza il viaggio in tappe leggibili: ogni nodo apre una nuova sfida e rende chiaro l’avanzamento della campagna senza anticiparne gli eventi.",
        image: "/games/demon-match-three/gameplay-map-act-1-v1.webp",
        imageAlt: "Schermata mobile della mappa dell’Atto I con i nodi delle missioni",
      },
      {
        number: "02",
        title: "Studia obiettivo, mosse e ricompense",
        description: "Prima di entrare nella griglia, il briefing dichiara la condizione da completare, il numero di mosse disponibili e ciò che la missione può assegnare. Così ogni partita parte da una scelta consapevole.",
        image: "/games/demon-match-three/gameplay-mission-4-brief-v1.webp",
        imageAlt: "Briefing mobile della Missione 4 Altare Cremisi con obiettivo, mosse e ricompense",
      },
      {
        number: "03",
        title: "Prepara una fusione sulla griglia",
        description: "Scambia tessere adiacenti per creare combinazioni di almeno tre simboli. Allineamenti più forti generano potenziamenti riconoscibili che possono essere avvicinati e preparati per una fusione.",
        image: "/games/demon-match-three/gameplay-powerup-ready-v1.webp",
        imageAlt: "Griglia match-3 mobile con due potenziamenti pronti per essere fusi",
      },
      {
        number: "04",
        title: "Attiva l’Onda Cremisi",
        description: "La fusione combina gli effetti dei potenziamenti e attraversa la plancia con un’unica azione spettacolare. Il risultato serve a liberare spazio, colpire più bersagli e accelerare l’obiettivo.",
        image: "/games/demon-match-three/gameplay-crimson-wave-v1.webp",
        imageAlt: "Schermata di gameplay mobile durante l’attivazione della fusione Onda Cremisi",
      },
      {
        number: "05",
        title: "Leggi la cascata e continua",
        description: "Dopo l’effetto speciale, nuove tessere riempiono la griglia e possono innescare combinazioni successive. Leggere la nuova disposizione permette di pianificare la mossa seguente senza sprecare il limite disponibile.",
        image: "/games/demon-match-three/gameplay-after-cascade-v1.webp",
        imageAlt: "Griglia match-3 mobile ricomposta dopo una cascata di combinazioni",
      },
    ],
    narrativeFeature: {
      eyebrow: "Atmosfera e sistema",
      title: "Due energie dividono il mondo. La griglia decide il tuo avanzamento.",
      description: [
        "La componente narrativa e il match-3 fanno parte dello stesso viaggio mobile: il percorso selezionato modifica atmosfera e introduzione, mentre obiettivi e poteri trasformano ogni missione.",
        "Il dossier pubblico racconta regole, ritmo e sviluppo Android. Volti, nomi e motivazioni dei protagonisti restano custoditi nell’Area VIP.",
      ],
      image: "/games/demon-match-three/gameplay-map-act-1-v1.webp",
      imageAlt: "Mappa mobile della campagna di Demon Match Three mostrata senza spoiler sui protagonisti",
      closingLine: "Combina. Potenzia. Attraversa il portale.",
    },
    latestUpdate: {
      version: "0.1.0-native",
      languages: ["Italiano"],
      date: "26 agosto 2026",
      title: "La nuova esperienza Android entra nella prima fase giocabile",
      summary: "Il progetto attuale è una ricostruzione Android nativa per smartphone e tablet. Scelta iniziale, prologhi e prime missioni match-3 sono già presenti nella build privata di sviluppo.",
      highlights: ["Prime missioni match-3 integrate", "Due percorsi introduttivi selezionabili", "Interfaccia verticale ottimizzata per il touch", "Prima build Android di sviluppo generata"],
    },
    releaseArchive: [],
    developmentRoadmap: [
      { title: "Esperienza Android nativa", status: "In sviluppo attivo", description: "Interfaccia verticale, controlli touch e adattamento tra smartphone e tablet stanno costruendo la nuova identità mobile del gioco." },
      { title: "Campagna e percorsi narrativi", status: "Prime missioni presenti", description: "Scelta iniziale, prologhi e primi scontri sono giocabili nella build privata; il resto del viaggio continuerà a crescere senza anticipazioni narrative." },
      { title: "Demo gratuita Android", status: "In preparazione", description: "La demo sarà resa disponibile quando stabilità, leggibilità e installazione saranno state verificate sui dispositivi previsti." },
      { title: "Progressi LoreWise ID", status: "In collaudo", description: "Il gioco conserva progressi propri e prepara la continuità con il LoreWise ID senza mescolarli con gli altri titoli." },
    ],
    releasePlan: "Completare le prime missioni, verificare l’esperienza su dispositivi Android reali e aprire una demo gratuita quando installazione, leggibilità e stabilità saranno pronte per il pubblico.",
    commercialNote: "La demo Android sarà gratuita. Formula e prezzo dell’edizione completa non sono ancora annunciati; seguire l’Area VIP permette di ricevere le prossime novità senza trasformare l’abbonamento in un requisito per la demo.",
    updateNote: "Ricostruzione Android nativa 0.1.0-native in sviluppo; demo pubblica non ancora disponibile.",
    knownIssues: [
      "La demo gratuita non è ancora disponibile al download.",
      "Interfaccia, bilanciamento, dialoghi e contenuti possono cambiare durante lo sviluppo.",
      "La compatibilità finale sarà dichiarata dopo le prove sui dispositivi Android previsti.",
    ],
    mediaNote: "Il dossier pubblico usa uno scenario originale senza personaggi e materiali di gameplay della build Android: portale, griglia, altare missione e arene. Ogni immagine è mostrata integralmente nel proprio rapporto originale, senza ritagli.",
  },
];

export function getGameProject(slug: string) {
  return gameProjects.find((project) => project.slug === slug);
}
