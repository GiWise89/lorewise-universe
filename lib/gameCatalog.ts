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
  status: "Disponibile e in aggiornamento" | "In sviluppo" | "In lavorazione";
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
    slug: "the-wound-remembers-il-patto-delle-ceneri",
    code: "GS-GAME-002",
    title: "The Wound Remembers – Il Patto delle Ceneri",
    subtitle: "Un nuovo Patto nasce tra le rovine. Scegli chi diventerà indispensabile.",
    studio: "GiWise Studio",
    status: "In lavorazione",
    statusTone: "development",
    kind: "GDR tattico dark fantasy",
    version: "In lavorazione",
    languages: ["Italiano"],
    platforms: ["Web", "Desktop", "Mobile"],
    access: "In arrivo",
    price: "Da definire",
    heroImage: "/games/the-wound-remembers-il-patto-delle-ceneri/key-art-v2.webp",
    heroAlt: "Sevrana, Nemor, Edria e Brannoc riuniti nel Rifugio del Patto delle Ceneri",
    catalogCoverImage: "/games/the-wound-remembers-il-patto-delle-ceneri/key-art-v2.webp",
    catalogCoverAlt: "I nuovi custodi del Rifugio illuminati dalle braci nel Patto delle Ceneri",
    summary: "Forma una compagnia senza ruoli imposti, attraversa un mondo che ricorda le tue decisioni e domina battaglie tattiche in cui posizione, tempismo e carattere contano quanto la forza.",
    description: [
      "Dopo gli eventi di The Wound Remembers, il mondo non è guarito: ha imparato a convivere con ciò che la Ferita ha lasciato aperto. Tra regni spezzati e memorie contese, un nuovo Patto raccoglie guerrieri, creature e sopravvissuti che non avrebbero mai scelto di combattere insieme.",
      "Ogni missione mette la compagnia davanti a un conflitto che può essere affrontato con acciaio, magia, astuzia o dialogo. Le alleanze cambiano, i rivali ricordano e le conseguenze tornano al Rifugio insieme a chi riesce a sopravvivere.",
    ],
    features: [
      "Un party di quattro personaggi costruito liberamente, senza classi obbligatorie",
      "Battaglie a turni su grandi aree collegate, con coperture e pericoli da sfruttare",
      "Attacchi, magie, cure, protezioni e reazioni capaci di cambiare l’ordine dello scontro",
      "Nemici che mostrano le proprie intenzioni e costringono a scegliere chi salvare, fermare o inseguire",
      "Esplorazione, furtività, dialoghi e soluzioni alternative alla forza",
      "Relazioni che aprono missioni, rivalità, amicizie e combinazioni uniche",
      "Reclutabili, Famigli e creature che trasformano davvero la composizione della compagnia",
      "Scelte che modificano alleanze, reputazione e conclusione della storia",
    ],
    playFlow: [
      { number: "01", title: "Scegli il tuo Patto", description: "Costruisci un gruppo di quattro compagni e nomina il capitano. Nessuna formazione è proibita: il gioco ti mostra rischi e punti di forza, poi lascia a te la decisione.", image: "/games/the-wound-remembers-il-patto-delle-ceneri/key-art-v2.webp", imageAlt: "I custodi del Rifugio osservano la nascita del nuovo Patto" },
      { number: "02", title: "Attraversa un mondo ferito", description: "Percorsi nascosti, clima, pericoli e incontri trasformano ogni spedizione. La forza è soltanto una possibilità: conoscenza, empatia, intimidazione e furtività possono aprire strade differenti.", image: "/games/the-wound-remembers-il-patto-delle-ceneri/edria-v1.webp", imageAlt: "Edria illumina i ricordi e le strade dimenticate" },
      { number: "03", title: "Combatti leggendo il nemico", description: "Muoviti tra aree collegate, sfrutta coperture e ostacoli, combina abilità e reagisci alle intenzioni avversarie prima che il loro piano diventi una condanna.", image: "/games/the-wound-remembers-il-patto-delle-ceneri/sevrana-cucitrice-del-respiro-v1.webp", imageAlt: "Sevrana stringe i fili rituali che mantengono in vita la compagnia" },
      { number: "04", title: "Torna diverso", description: "Ogni ritorno porta ferite, ricompense, nuovi legami e conseguenze. Nel Rifugio prepari ciò che verrà, ma sono le persone che hai salvato a cambiare davvero le tue possibilità.", image: "/games/the-wound-remembers-il-patto-delle-ceneri/brannoc-v1.webp", imageAlt: "Brannoc accoglie creature e sopravvissuti nel Rifugio" },
    ],
    narrativeFeature: {
      eyebrow: "La Ferita non ha dimenticato",
      title: "La vittoria ha salvato il mondo. Non lo ha lasciato intatto.",
      description: [
        "Le ceneri del vecchio conflitto hanno acceso nuovi culti, nuovi sovrani e fame più antiche. La Corte del Rogo avanza dove i regni sono troppo deboli per opporsi e trasforma debiti, nomi e ricordi in catene.",
        "Il Patto nasce nel Rifugio: non una fortezza invincibile, ma una casa costruita da persone che scelgono di restare. Da qui partirai per stringere alleanze, reclutare l’impossibile e decidere quale parte del passato merita di essere salvata.",
      ],
      image: "/games/the-wound-remembers-il-patto-delle-ceneri/key-art-v2.webp",
      imageAlt: "I nuovi custodi riuniti nel Rifugio mentre il mondo brucia oltre le mura",
      closingLine: "La Ferita ricorda ogni promessa. Il Patto decide quali mantenere.",
    },
    protagonistReveal: {
      eyebrow: "Nuovi volti del Rifugio",
      title: "La casa che scegli di difendere.",
      introduction: "Tra una spedizione e l’altra, il Patto vive grazie a quattro nuovi personaggi originali. Non sono semplici funzioni in un menu: custodiscono ferite, segreti, creature e memorie, e ciascuno porta con sé una storia capace di cambiare il Rifugio.",
      image: "/games/the-wound-remembers-il-patto-delle-ceneri/key-art-v2.webp",
      imageAlt: "Sevrana, Nemor, Edria e Brannoc nel cuore del Rifugio",
      characters: [
        { name: "Sevrana", faction: "Cucitrice del Respiro", calling: "Calma anche davanti all’orrore, ricuce ciò che la Corte vorrebbe lasciare spezzato. Ogni vita salvata avvicina Sevrana al segreto del Respiro Cucito.", image: "/games/the-wound-remembers-il-patto-delle-ceneri/sevrana-cucitrice-del-respiro-v1.webp", imageAlt: "Sevrana con fili rituali e strumenti da guaritrice", tone: "shadow" },
        { name: "Nemor", faction: "Speziale del Vetro Nero", calling: "Trasforma veleni, frammenti e sostanze impossibili in preparati che possono ribaltare una spedizione. È inquietante, preciso e fedele a ogni accordo.", image: "/games/the-wound-remembers-il-patto-delle-ceneri/nemor-v1.webp", imageAlt: "Nemor con ampolle e guanti di vetro nero", tone: "dawn" },
        { name: "Edria", faction: "Custode delle Memorie Perdute", calling: "La sua lampada non illumina stanze: restituisce ciò che il mondo ha dimenticato. Con lei, la Cronaca precedente diventa una scelta e non un peso.", image: "/games/the-wound-remembers-il-patto-delle-ceneri/edria-v1.webp", imageAlt: "Edria con la lampada che proietta ricordi", tone: "shadow" },
        { name: "Brannoc", faction: "Pastore degli Impossibili", calling: "Un gigante gentile che non usa gabbie né fruste. Cura i Famigli, conquista la loro fiducia e sa riconoscere una creatura che merita libertà.", image: "/games/the-wound-remembers-il-patto-delle-ceneri/brannoc-v1.webp", imageAlt: "Brannoc, custode robusto e paziente del Santuario", tone: "dawn" },
      ],
      closing: "Il Rifugio cresce con le persone che scegli di ascoltare, proteggere e riportare a casa.",
    },
    releaseArchive: [],
    developmentRoadmap: [],
    releasePlan: "Segui il dossier per scoprire nuovi personaggi, luoghi e minacce del Patto delle Ceneri.",
    commercialNote: "Il progetto è in lavorazione. Disponibilità e prezzo verranno annunciati quando saranno definitivi.",
    updateNote: "Nuovi racconti dal Rifugio arriveranno nel dossier.",
    knownIssues: [],
    mediaNote: "Un primo sguardo al Rifugio, ai suoi nuovi custodi e al mondo che il Patto dovrà attraversare.",
    rightsNote: "Un nuovo capitolo originale ambientato nell’universo di The Wound Remembers.",
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
  {
    slug: "sandbox",
    code: "GS-GAME-004",
    title: "Prima Terra",
    subtitle: "Crea il mondo. Guarda le civiltà vivere da sole.",
    studio: "GiWise Studio",
    status: "In sviluppo",
    statusTone: "development",
    kind: "Sandbox divino in pixel art",
    version: "Prototipo in sviluppo",
    languages: ["Italiano"],
    platforms: ["Browser · computer", "Browser · telefono"],
    access: "Sviluppo interno · anteprime nel dossier",
    price: "Da annunciare",
    heroImage: "/games/sandbox/pt-mondo-continente.webp",
    heroAlt: "Un continente di Prima Terra visto dall’alto, con praterie, foreste, montagne innevate, fiumi e coste in pixel art",
    catalogCoverImage: "/games/sandbox/pt-villaggio-famiglie.webp",
    logoImage: "/games/sandbox/logo-prima-terra-ufficiale.webp",
    catalogCoverAlt: "Un villaggio degli Orchi in pixel art con le tende rosse attorno al focolare",
    summary: "Un sandbox divino in pixel art: crei il mondo, posi i primi abitanti di sei popoli e guardi famiglie, villaggi, porti, ere e guerre nascere da soli. Tu intervieni con i tuoi poteri, quando e come vuoi.",
    description: [
      "Prima Terra dà al giocatore un mondo intero e lascia che siano i suoi abitanti a scriverne la storia. Scegli continente, isole o arcipelago, dipingi il terreno e posa i primi fondatori.",
      "Da quel momento nessuno recita un copione. Ogni abitante ha un nome, un aspetto e dei bisogni; si innamora, mette su famiglia, caccia, pesca, coltiva e costruisce. I villaggi crescono, si difendono con palizzate e, quando i rancori superano il limite, si dichiarano guerra.",
      "Tu resti sopra a tutto come un dio: puoi guardare, guarire e benedire, oppure scatenare fulmini, meteore, terremoti ed eruzioni. E gli abitanti se ne accorgono.",
    ],
    features: [
      "Mondi generati come continente, isole o arcipelago, con un codice per ritrovarli",
      "Terreno da dipingere e un mondo vivo con vento, onde, stagioni e neve",
      "Sei popoli: Umani, Elfi, Nani, Orchi, Halfling e Goblin, con case e armi proprie",
      "Abitanti con nome, aspetto, bisogni, famiglie, figli ed emozioni visibili",
      "Villaggi con il loro Re, la loro bandiera e il loro Eroe, che costruiscono, coltivano e traslocano da soli",
      "Sei ere, dalla Pietra all’Età Moderna, e undici biomi fra cui palude, giungla, terre corrotte e bosco fatato",
      "Dungeon esplorati dal vivo da avventurieri che salgono di livello e possono morire",
      "Animali selvatici, predatori, mostri, caccia, pesca e nuoto, e in mare delfini, squali e kraken",
      "Porti e canoe per pescare al largo, commerciare e fare la guerra per mare, e velieri abbandonati da esplorare",
      "Un mercato con prezzi che salgono e scendono, monete d’oro e baratto",
      "Territori, rancori, palizzate, battaglie sulla mappa e trattati di pace",
      "I poteri del dio: cielo, miracoli, maledizioni, meteore, terremoti ed eruzioni",
      "In arrivo: fede e preghiere, oggetti leggendari",
    ],
    releaseArchive: [],
    developmentRoadmap: [],
    releasePlan: "Il dossier crescerà insieme al mondo: nuove immagini e nuove scoperte verranno condivise man mano che Prima Terra avanza.",
    commercialNote: "Prima Terra è in sviluppo attivo. Modalità di accesso e disponibilità saranno annunciate quando il mondo sarà pronto ad accogliere i primi giocatori.",
    updateNote: "Il mondo di Prima Terra cresce ogni settimana.",
    knownIssues: [],
    mediaNote: "Le immagini provengono dal prototipo in sviluppo, disegnato con il Minifantasy Complete Bundle di Krishna Palacio.",
  },
];

export function getGameProject(slug: string) {
  return gameProjects.find((project) => project.slug === slug);
}
