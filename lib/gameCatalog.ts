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

export type GameAndroidOffer = {
  edition: string;
  availability: string;
  description: string;
  requirements: string[];
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
  androidOffer?: GameAndroidOffer;
  latestUpdate?: GameReleaseUpdate;
  releaseArchive?: GameReleaseUpdate[];
  developmentRoadmap?: GameDevelopmentItem[];
  narrativeFeature?: GameNarrativeFeature;
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
    androidOffer: {
      edition: "APK Android",
      availability: "Prossimamente",
      description: "Una versione mobile dedicata, distribuita direttamente dalla sezione ufficiale del gioco quando i controlli su installazione, aggiornamenti e dispositivi saranno conclusi.",
      requirements: ["Pacchetto APK ufficiale GiWise Studio", "Account LoreWise obbligatorio", "Connessione internet richiesta", "Data di uscita ancora da definire"],
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
      { title: "APK Android", status: "In preparazione", description: "Adattamento mobile e controlli su dispositivi reali prima della distribuzione ufficiale." },
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
    mediaNote: "La galleria usa quattro schermate reali della versione corrente. Un video ufficiale verrà aggiunto soltanto dopo approvazione e verifica della registrazione definitiva.",
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
    subtitle: "Horror match-3 RPG rituale",
    studio: "GiWise Studio",
    status: "In sviluppo",
    statusTone: "development",
    kind: "Match-3 horror · RPG strategico",
    version: "Versione di sviluppo 2.1.0",
    languages: ["Italiano · interfaccia e contenuti"],
    platforms: ["Browser · sviluppo locale", "Windows · edizione pianificata", "Android · nuova build da verificare"],
    access: "Build privata · profilo locale disponibile",
    price: "Prezzo previsto €5,99 · futuro €7,99",
    heroImage: "/games/demon-match-three/hero-ritual-chapel-v1.jpg",
    heroAlt: "Cappella rituale oscura attraversata da luce rossa e ciano nel mondo di Demon Match Three",
    catalogCoverImage: "/games/demon-match-three/hero-ritual-chapel-v1.jpg",
    catalogCoverAlt: "Cappella gotica dell’Ospite Senza Volto, ambientazione di Demon Match Three",
    logoImage: "/games/demon-match-three/logo-official-v2.webp",
    summary: "Un match-3 horror nel quale ogni combinazione alimenta combattimento, rituali, corruzione, sanità mentale e progressione persistente attraverso venti Atti.",
    description: [
      "Demon Match Three unisce il nucleo immediato del match-3 a un combattimento RPG nel quale Vita, Energia, Barriera, Difesa e Sanità mentale cambiano a ogni turno.",
      "Row, Column, Bomb e Void possono fondersi in entrambi gli ordini, innescare reazioni a catena e alimentare obiettivi rituali. Gli avversari dichiarano il prossimo intento mentre Corruzione, Sigilli e Terrore modificano la griglia.",
      "La versione 2.1.0 amplia il percorso con Leggi degli Atti, boss in tre fasi, Cicatrici narrative, Maestria, Memorie laterali, sfida giornaliera, Discesa, Archivio, Emporio e Camera degli Incubi.",
    ],
    features: [
      "Match-3 con cascate, rimescolamento e mosse valide garantite",
      "Power-up Row, Column, Bomb e Void con matrice completa delle fusioni",
      "Combattimento con Vita, Energia, Barriera, Sanità, Terrore e intenti nemici",
      "Venti Atti con Leggi, boss, Memorie laterali e Maestria per stanza",
      "Tre rituali alternativi in un unico slot attivo",
      "Cicatrici narrative persistenti con beneficio e peso",
      "Sfida giornaliera UTC e modalità progressiva La Discesa",
      "Archivio, Emporio, equipaggiamento, missioni e progressione persistente",
      "Simboli aggiuntivi, contrasto elevato e feedback aptico configurabile",
    ],
    playFlow: [
      {
        number: "01",
        title: "Entra nella Casa",
        description: "Dal menu principale scegli il percorso: la campagna dei venti Atti, il Reliquiario, la Camera degli Incubi, l’Archivio o il profilo del Portatore. Il gioco può iniziare subito con un profilo locale, senza obbligo di email.",
        image: "/games/demon-match-three/gameplay-current-menu.webp",
        imageAlt: "Menu principale desktop di Demon Match Three con logo, ingresso nella Casa e sezioni Mappa, Reliquiario, Incubi, Archivio, Emporio e Portatore",
      },
      {
        number: "02",
        title: "Attraversa venti Atti",
        description: "La mappa della Casa organizza stanze rituali, Memorie laterali e Presenze maggiori. Ogni Atto introduce una Legge che modifica il modo di affrontare gli obiettivi.",
        image: "/games/demon-match-three/gameplay-current-map.webp",
        imageAlt: "Mappa desktop della campagna di Demon Match Three con i venti Atti della Ferita, stanze rituali e percorso verso Baphomet",
      },
      {
        number: "03",
        title: "Combatti sulla griglia rituale",
        description: "Forma combinazioni, genera cascate e usa i Boost mentre controlli Vita, Sanità, Energia, Barriera, mosse e obiettivi. La stanza e il nemico trasformano continuamente le regole della griglia.",
        image: "/games/demon-match-three/gameplay-current-battle.webp",
        imageAlt: "Battaglia match-3 desktop di Demon Match Three con griglia rituale, obiettivi, risorse del Portatore e pannello dei Boost",
      },
      {
        number: "04",
        title: "Conserva il lascito",
        description: "Alla fine della stanza il risultato diventa progressione: esperienza, Frammenti e Memorie vengono incisi nel profilo e il cammino può continuare senza perdere ciò che è stato conquistato.",
        image: "/games/demon-match-three/gameplay-current-reward.webp",
        imageAlt: "Schermata di vittoria di Demon Match Three con ricordo preservato, ricompense e pulsante per continuare la campagna",
      },
      {
        number: "05",
        title: "Incidi le Reliquie",
        description: "Nel Reliquiario i Frammenti diventano modificatori permanenti. Reliquie, rami di abilità, arsenale e consumabili costruiscono una strategia che resta oltre la singola stanza.",
        image: "/games/demon-match-three/gameplay-current-reliquary.webp",
        imageAlt: "Reliquiario desktop di Demon Match Three con reliquie permanenti, costi in Frammenti e sezioni Abilità, Arsenale e Boost",
      },
      {
        number: "06",
        title: "Affronta gli Incubi",
        description: "La Camera degli Incubi apre due percorsi distinti: una Stanza del Giorno condivisa e La Discesa persistente, dove difficoltà e Custodi aumentano con la profondità.",
        image: "/games/demon-match-three/gameplay-current-nightmare.webp",
        imageAlt: "Camera degli Incubi di Demon Match Three con scelta tra Stanza del Giorno e modalità persistente La Discesa",
      },
      {
        number: "07",
        title: "Costruisci il Portatore",
        description: "Il Portatore raccoglie il segno delle stanze attraversate: aspetto, Sigillo, esperienza e lasciti compongono un’identità persistente legata alla campagna.",
        image: "/games/demon-match-three/gameplay-current-porter.webp",
        imageAlt: "Figura completa del Portatore di Demon Match Three davanti a un trono gotico con Sigillo Corrotto, esperienza e lasciti",
      },
    ],
    narrativeFeature: {
      eyebrow: "La Casa osserva",
      title: "Ogni combinazione è un rituale. Ogni vittoria lascia una cicatrice.",
      description: [
        "La griglia non è un rompicapo separato dal combattimento: ogni tessera rimossa modifica risorse, difese, condizioni e obiettivi della stanza.",
        "Le scelte persistono oltre lo scontro. Cicatrici, rituali e Maestria costruiscono il profilo del Portatore attraverso la Casa.",
      ],
      image: "/games/demon-match-three/faceless-guest-banner-v1.jpg",
      imageAlt: "L’Ospite Senza Volto emerge in una camera rossa e ciano di Demon Match Three",
      closingLine: "La Casa ricorda ogni tessera che hai mosso.",
    },
    latestUpdate: {
      version: "2.1.0",
      languages: ["Italiano"],
      date: "17 agosto 2026",
      title: "La Casa diventa un sistema persistente",
      summary: "La versione locale corrente conserva il nucleo match-3 e introduce nuovi livelli di progressione, modalità e superfici di gioco senza sostituire le regole verificate.",
      highlights: ["60/60 scenari gameplay superati", "Copertura delle schermate 22/22", "Audit del bilanciamento su 100 livelli", "Archivio, Emporio e Camera degli Incubi ridisegnati come scene di gioco"],
    },
    releaseArchive: [],
    developmentRoadmap: [
      { title: "Verifica visiva desktop della 2.1.0", status: "Documentata", description: "Sette catture reali della versione corrente mostrano menu, campagna, combattimento, progressione, Reliquiario, Incubi e Portatore nel loro rapporto originale." },
      { title: "Build Android 2.1.0", status: "Da ricompilare", description: "La precedente APK 0.1.8 non rappresenta la versione attuale; la toolchain dovrà usare un JDK compatibile senza reinstallare Android Studio o SDK." },
      { title: "Account e servizi cloud", status: "Facoltativi · da collaudare", description: "Il profilo locale consente di giocare senza email; registrazione, recupero e sincronizzazione cloud richiedono ancora verifica nell’ambiente di distribuzione." },
      { title: "Distribuzione LoreWise", status: "Canale approvato · non attivo", description: "EXE e APK saranno pubblicati nel catalogo LoreWise soltanto dopo verifica di firma, integrità, installazione e aggiornamenti. Gli store esterni verranno valutati dopo il collaudo pubblico del gioco completo." },
    ],
    androidOffer: {
      edition: "Edizione Android",
      availability: "In preparazione",
      description: "La base Capacitor è presente, ma la versione Android 2.1.0 non è ancora stata compilata e provata su un dispositivo fisico. L’APK ufficiale sarà distribuito direttamente dal catalogo LoreWise.",
      requirements: ["APK ufficiale GiWise Studio dal catalogo LoreWise", "Android 7.0 o successivo previsto", "Profilo locale o account cloud facoltativo", "Telemetria tecnica attiva", "Dimensione e firma da verificare sulla nuova build"],
    },
    releasePlan: "Completare il collaudo account e cloud, preparare le edizioni EXE e APK, verificarle su sistemi e dispositivi reali e pubblicarle inizialmente soltanto nel catalogo LoreWise. Eventuali store esterni saranno valutati dopo l’uscita completa e una fase di gioco pubblico verificata.",
    commercialNote: "Prezzo di lancio approvato: €5,99, con prezzo ordinario futuro previsto di €7,99. Il gioco sarà incluso senza costo aggiuntivo per gli abbonati con piano attivo; i non abbonati potranno acquistare una licenza permanente. Vendita e download resteranno disattivati fino al completamento dei collaudi.",
    updateNote: "Versione 2.1.0 attiva nel progetto locale; distribuzione pubblica e nuova APK non ancora approvate.",
    knownIssues: [
      "Le nuove catture documentano la versione desktop 2.1.0; la resa mobile e il comportamento su un dispositivo fisico restano da verificare.",
      "Le APK disponibili nell’archivio arrivano alla 0.1.8 e non devono essere presentate come pacchetto della versione 2.1.0.",
      "La compilazione Android della 2.1.0 richiede un JDK compatibile con Gradle 8.14.3; JDK 25 produce un errore di versione delle classi.",
      "Credenziali Supabase, acquisti opzionali e comportamento su dispositivo fisico restano da verificare esternamente.",
    ],
    mediaNote: "Il dossier usa sette catture desktop reali della versione 2.1.0. Le immagini sono presentate nel rapporto originale, senza ritagli, deformazioni o sostituzioni con scene generate.",
  },
];

export function getGameProject(slug: string) {
  return gameProjects.find((project) => project.slug === slug);
}
