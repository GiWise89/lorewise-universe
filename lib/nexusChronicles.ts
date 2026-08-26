import { commissionOpeningPromotion, corruptedPortraitPromotion } from "@/lib/commissionPromotion";
import { editorialReleaseInstant, getReleasedEditorialEntries } from "@/lib/editorialCalendar";
import { GAME_GUIDES, getGuideEditorialNews, type GameGuide } from "@/lib/gameGuides";

export type NexusChronicleCategory = "art" | "games" | "codex" | "worlds" | "vip";

export type NexusChronicleSignal = {
  label: string;
  title: string;
  text: string;
  image: string;
  imageAlt: string;
  note: string;
  href: string;
  action: string;
};

export type NexusChronicleBenefit = {
  title: string;
  text: string;
};

export type NexusChronicleBenefitEvent = {
  code: string;
  area: string;
  title: string;
  status: string;
  timing: string;
  description: string;
  href: string;
  action: string;
};

export type NexusChroniclePromotion = {
  theme: "opening" | "halloween" | "ended" | "standard";
  label: string;
  title: string;
  period: string;
  description: string;
  visual: string;
  visualAlt: string;
  rates: Array<{ audience: string; discount: string }>;
  terms: string[];
  href: string;
  action: string;
};

export type NexusChronicleUpcoming = {
  label: string;
  title: string;
  status: string;
  description: string;
  features: string[];
  previews: Array<{
    label: string;
    title: string;
    text: string;
    image: string;
    imageAlt: string;
    tags: string[];
  }>;
  featuredGame?: {
    title: string;
    kicker: string;
    description: string;
    cover: string;
    coverAlt: string;
    storeUrl: string;
    storeAction: string;
    vipCta: {
      label: string;
      title: string;
      text: string;
      href: string;
      action: string;
      note: string;
    };
    sections: Array<{
      id: string;
      number: string;
      label: string;
      title: string;
      text: string;
      images: Array<{ src: string; alt: string; caption: string }>;
    }>;
  };
};

export type NexusChronicle = {
  id: string;
  issue: string;
  category: NexusChronicleCategory;
  categoryLabel: string;
  publishedAt: string;
  title: string;
  excerpt: string;
  detail: string;
  image: string;
  imageAlt: string;
  signals: NexusChronicleSignal[];
  promotion: NexusChroniclePromotion;
  upcoming: NexusChronicleUpcoming;
  benefits: NexusChronicleBenefit[];
  benefitEvents: NexusChronicleBenefitEvent[];
  transparency: string;
  href: string;
  action: string;
  featured?: boolean;
};

export const nexusBenefitEvents: NexusChronicleBenefitEvent[] = [
  {
    code: "VIP-WEEKLY-GUIDE",
    area: "Guide VIP",
    title: "Guida completa in anteprima",
    status: "Attivo",
    timing: "Ogni lunedì",
    description: "Una nuova guida entra nell’Area VIP prima dell’uscita pubblica. La Cronaca riunisce il gioco corrente, la data di pubblicazione e il prossimo titolo in arrivo.",
    href: "/vip-zone?area=guides#guides",
    action: "Apri la guida VIP",
  },
  {
    code: "ATLAS-PUBLIC-ROTATION",
    area: "Atlante dei Giochi",
    title: "Passaggio nell’archivio pubblico",
    status: "Permanente",
    timing: "Sette giorni dopo",
    description: "La guida della settimana precedente lascia l’anteprima VIP e rimane consultabile nell’Atlante pubblico.",
    href: "/giochi/guide",
    action: "Apri l’Atlante",
  },
  {
    code: "VIP-ART-CREDITS",
    area: "Arte",
    title: "Crediti Arte del Universe Pass",
    status: "Ricorrente",
    timing: "Ogni mese di Pass attivo",
    description: "Supporter riceve 1 credito fino a un massimo di 2; Collector ne riceve 2 fino a un massimo di 4. Utilizzi e opere riscattate restano collegati al LoreWise ID.",
    href: "/account#account-benefits",
    action: "Controlla i vantaggi",
  },
  {
    code: "VIP-ATELIER",
    area: "Atelier",
    title: "Processi creativi completi",
    status: "Disponibile",
    timing: "Archivio permanente",
    description: "Quattordici tavole raccontano studi, esitazioni e trasformazioni. Insieme nel bosco e Icona dopo mezzanotte conservano quattro fasi ciascuno.",
    href: "/vip-zone?area=atelier#atelier",
    action: "Entra nell’Atelier",
  },
  {
    code: "VIP-DOWNLOADS",
    area: "Download VIP",
    title: "Sei sfondi originali protetti",
    status: "Disponibile",
    timing: "Due raccolte complete",
    description: "Archivio dei Custodi e LoreWise Match riuniscono tre sfondi ciascuno. Le anteprime sono protette; i file completi sono disponibili agli abbonati con Pass attivo.",
    href: "/vip-zone?area=downloads#downloads",
    action: "Apri i Download",
  },
  {
    code: "TWR-ROGO",
    area: "The Wound Remembers",
    title: "Il Rogo delle Dieci Porte",
    status: "In progettazione",
    timing: "Aggiornamenti progressivi",
    description: "Il dossier VIP segue fazione, personaggi e direzione creativa dell’espansione senza anticipare il finale.",
    href: "/vip-zone?area=games&game=the-wound-remembers#dossier-rogo",
    action: "Segui il dossier",
  },
  {
    code: "FUORI-TRAMA-PARTICIPATION",
    area: "Fuori Trama",
    title: "Proposte e partecipazione",
    status: "In sviluppo",
    timing: "Consultazioni dedicate",
    description: "Gli abbonati possono seguire le direzioni del roster, proporre candidature e partecipare alle consultazioni dedicate.",
    href: "/vip-zone?area=games&game=fuori-trama#vip-panel-fuori-trama",
    action: "Apri Fuori Trama",
  },
  {
    code: "DEMON-MATCH-ANDROID-DEMO",
    area: "Demon Match Three",
    title: "Due percorsi arrivano su Android",
    status: "In sviluppo",
    timing: "Demo gratuita in arrivo",
    description: "Due forze contrapposte aprono i percorsi iniziali del nuovo Demon Match Three, costruito come esperienza Android nativa per smartphone e tablet.",
    href: "/vip-zone?area=games&game=demon-match-three#vip-demon-match",
    action: "Apri l’anteprima VIP",
  },
  {
    code: "COMMISSIONS-OPENING",
    area: "Commissioni",
    title: "Promozione Apertura del Nexus",
    status: "Attiva",
    timing: "Fino al 30 settembre 2026",
    description: "Le richieste inviate entro la scadenza conservano la tariffa di apertura: −10% Visitatori, −15% Supporter e −20% Collector.",
    href: "/commissioni",
    action: "Apri le commissioni",
  },
  {
    code: "HALLOWEEN-HORROR-COLLECTIONS",
    area: "Arte in Vetrina",
    title: "Tre collezioni horror",
    status: "Programmata",
    timing: "Dal 1° ottobre al 1° novembre 2026",
    description: "Fede Corrotta, Incubi Interiori e Creature del Buio: tre opere originali per collezione a 24,90 €, con licenze personali e consegna protetta.",
    href: "/arte#collezioni-horror",
    action: "Apri la vetrina",
  },
];

const openingChronicle: NexusChronicle = {
    id: "vip-archives-expand",
    issue: "Cronaca 001",
    category: "vip",
    categoryLabel: "LoreWise VIP",
    publishedAt: "2026-08-22",
    title: "Due mondi si stanno muovendo.",
    excerpt: "The Wound Remembers prepara una nuova minaccia. Fuori Trama apre una direzione ispirata alla musica. Questa è la parte che possiamo raccontare senza rovinare le sorprese.",
    detail: "Dietro le porte riservate non ci sono semplici immagini in più: ci sono scelte ancora in lavorazione, dossier di sviluppo e occasioni concrete per seguire o influenzare ciò che arriverà dopo.",
    image: "/brand/icons/lorewise-vip-official-v1.webp",
    imageAlt: "Emblema ufficiale LoreWise VIP",
    signals: [
      {
        label: "The Wound Remembers",
        title: "Qualcosa attende oltre le Dieci Porte.",
        text: "Una futura espansione dark fantasy sta prendendo forma attorno a una minaccia infernale, nuove carte e possibilità tattiche. Nomi, creature e dossier completi restano protetti per non anticipare la storia principale.",
        image: "/games/the-wound-remembers/catalog-cover-generated-v1.webp",
        imageAlt: "Copertina pubblica di The Wound Remembers",
        note: "Anteprima senza spoiler · sviluppo in corso",
        href: "/vip-zone?area=games&game=the-wound-remembers#dossier-rogo",
        action: "Apri il dossier VIP",
      },
      {
        label: "Fuori Trama",
        title: "Nuove voci vogliono entrare nel Nexus.",
        text: "Il roster esplora un filone ispirato alla musica. Gli abbonati possono proporre e votare le candidature dedicate.",
        image: "/games/lorewise-fuori-trama-next/catalog-cover-generated-v1.webp",
        imageAlt: "Copertina pubblica di Fuori Trama",
        note: "Il gioco resta gratuito · i VIP partecipano prima",
        href: "/vip-zone?area=games&game=fuori-trama#vip-panel-fuori-trama",
        action: "Apri l’anteprima VIP",
      },
    ],
    promotion: {
      theme: "opening",
      label: "Promozione di apertura",
      title: "Apertura del Nexus",
      period: commissionOpeningPromotion.period,
      description: "Per inaugurare il sito, le richieste di commissione inviate entro la scadenza ricevono una tariffa di apertura legata al LoreWise ID.",
      visual: "/brand/icons/commissioni-concept-v1.webp",
      visualAlt: "Emblema delle commissioni LoreWise",
      rates: [
        { audience: "Visitatori", discount: `−${commissionOpeningPromotion.rates.visitor}%` },
        { audience: "Supporter", discount: `−${commissionOpeningPromotion.rates.supporter}%` },
        { audience: "Collector", discount: `−${commissionOpeningPromotion.rates.collector}%` },
      ],
      terms: [
        "Valida per Ritratto Essenziale, Ritratto Completo e Opera Narrativa.",
        "La richiesta conserva la tariffa promozionale anche se il lavoro termina dopo il 30 settembre.",
        "La percentuale promozionale sostituisce lo sconto ordinario del Pass e non si somma ad altre offerte.",
        "Ogni tre commissioni pagate e completate viene assegnato un credito Arte extra al LoreWise ID.",
      ],
      href: "/commissioni",
      action: "Scopri le commissioni",
    },
    upcoming: {
      label: "Novità in arrivo",
      title: "Atlante dei Giochi",
      status: "Guida completa disponibile ora · anteprima LoreWise VIP",
      description: "Animal Crossing: New Horizons inaugura ufficialmente l’Atlante dei Giochi con il Taccuino dell’isola. La guida completa è già aperta in anteprima nell’area LoreWise VIP; Baldur’s Gate 3 sarà il viaggio successivo.",
      features: [
        "I primi sette giorni e la crescita dell’isola",
        "Stelline, rape, servizi e progressione",
        "Progettazione, personalizzazione e DLC",
        "Museo, creature e riconoscimento delle opere d’arte",
      ],
      previews: [
        {
          label: "Percorso guidato",
          title: "Dall'inizio alla prima vittoria",
          text: "Passaggi ordinati, obiettivi chiari e schermate annotate per capire dove andare e cosa preparare, senza saltare i momenti importanti.",
          image: "/games/the-wound-remembers/gameplay-campaign.webp",
          imageAlt: "Anteprima della campagna di The Wound Remembers",
          tags: ["Missioni", "Progressione", "No spoiler"],
        },
        {
          label: "Build e strategie",
          title: "Carte, sinergie e mazzi",
          text: "Esempi pratici di costruzione, alternative accessibili e spiegazioni del perché una combinazione funziona durante una battaglia.",
          image: "/games/the-wound-remembers/gameplay-decks.webp",
          imageAlt: "Anteprima della costruzione di un mazzo in The Wound Remembers",
          tags: ["Build", "Carte", "Boss"],
        },
        {
          label: "Scelte e segreti",
          title: "Bivi, finali e contenuti nascosti",
          text: "Le conseguenze vengono separate dalle informazioni sicure: ogni rivelazione importante resta chiusa dietro un avviso spoiler esplicito.",
          image: "/games/lorewise-fuori-trama-next/gameplay-current-campaigns.webp",
          imageAlt: "Anteprima delle campagne di Fuori Trama",
          tags: ["Scelte", "Finali", "Segreti"],
        },
      ],
      featuredGame: {
        title: "Animal Crossing: New Horizons",
        kicker: "Prima guida dell’Atlante",
        description: "Il Taccuino dell’isola raccoglie sedici capitoli pratici: dai primi giorni alla valutazione a cinque stelle, passando per economia, progettazione, DLC, creature marine e opere del museo.",
        cover: "/atlas/animal-crossing-new-horizons/official/01-primi-giorni.jpg",
        coverAlt: "Falò e tende sulla spiaggia durante i primi giorni dell’isola in Animal Crossing: New Horizons",
        storeUrl: "https://www.nintendo.com/it-it/Giochi/Giochi-per-Nintendo-Switch/Animal-Crossing-New-Horizons-1438623.html",
        storeAction: "Scopri il gioco su Nintendo",
        vipCta: {
          label: "Anteprima disponibile ora",
          title: "Il Taccuino completo è già aperto nell’area LoreWise VIP.",
          text: "Entra subito nei 16 capitoli dedicati a progressione, Stelline, progettazione, DLC, creature e opere del museo. Con il Pass accedi prima ai nuovi contenuti e sostieni direttamente la crescita di LoreWise Universe.",
          href: "/abbonamento",
          action: "Entra in LoreWise VIP",
          note: "Ogni nuova guida raggiunge l’Atlante pubblico dopo i sette giorni di anteprima VIP.",
        },
        sections: [
          {
            id: "first-days",
            number: "01",
            label: "Primi giorni",
            title: "Dalla tenda alla prima vera isola",
            text: "Una sequenza pratica accompagna l’arrivo, i primi strumenti, la casa, il museo e i servizi essenziali senza trasformare la scoperta in una lista meccanica di compiti.",
            images: [
              { src: "/atlas/animal-crossing-new-horizons/official/01-primi-giorni.jpg", alt: "Falò e tende nei primi giorni dell’isola", caption: "Il campo iniziale e i primi passi sull’isola" },
            ],
          },
          {
            id: "economy",
            number: "02",
            label: "Economia",
            title: "Stelline, servizi e crescita sostenibile",
            text: "Il quaderno organizza guadagni, spese, debiti, negozi e mercato delle rape per aiutare a far crescere l’isola senza ridurre ogni giornata alla ricerca di Stelline.",
            images: [
              { src: "/atlas/animal-crossing-new-horizons/official/02-economia-servizi.jpg", alt: "Servizi e attività economiche sull’isola", caption: "Economia, servizi e progressione" },
              { src: "/atlas/animal-crossing-new-horizons/official/03-mercato-rape.jpg", alt: "Il mercato settimanale delle rape", caption: "Comprare e vendere rape con metodo" },
            ],
          },
          {
            id: "island-design",
            number: "03",
            label: "Progettazione",
            title: "Da tre a cinque stelle",
            text: "Valutazione, natura, arredi e percorsi vengono collegati in un metodo leggibile per progettare un’isola personale, funzionale e capace di evolvere nel tempo.",
            images: [
              { src: "/atlas/animal-crossing-new-horizons/official/04-cinque-stelle-giardinaggio.jpg", alt: "Giardinaggio e progettazione di un’isola a cinque stelle", caption: "Natura, scenografia e valutazione dell’isola" },
            ],
          },
        ],
      },
    },
    benefits: [
      { title: "Vedi prima", text: "Diari, direzioni creative, materiali di sviluppo e demo dichiarate pronte arrivano prima della pubblicazione generale." },
      { title: "Puoi partecipare", text: "Proposte, votazioni e candidature ai test permettono di seguire i progetti da vicino." },
      { title: "Costruisci la collezione", text: "Ogni mese ricevi crediti Arte, prezzi riservati sui contenuti ammessi e download protetti collegati al tuo LoreWise ID." },
      { title: "Scegli il livello", text: "Supporter include 1 credito Arte e il 5% sui prodotti ammessi; Collector offre 2 crediti, il 10% e dossier originali estesi." },
    ],
    benefitEvents: nexusBenefitEvents,
    transparency: "Le opere pubbliche, il Codex consultabile e Fuori Trama non vengono sottratti ai visitatori. Il Pass serve ad approfondire, partecipare e sostenere lo sviluppo: non a nascondere ciò che prima era gratuito.",
    href: "/abbonamento",
    action: "Confronta Supporter e Collector",
    featured: true,
};

type WeeklyChronicle = Omit<Partial<NexusChronicle>, "promotion" | "upcoming"> & {
  id: string;
  issue: string;
  publishedAt: string;
  title: string;
  excerpt: string;
  detail: string;
  signals: NexusChronicleSignal[];
  promotion: Partial<NexusChroniclePromotion>;
  upcoming?: Omit<Partial<NexusChronicleUpcoming>, "featuredGame"> & { featuredGame?: NexusChronicleUpcoming["featuredGame"] | null };
  benefits: NexusChronicleBenefit[];
};

function makeWeeklyChronicle(weekly: WeeklyChronicle): NexusChronicle {
  const { featuredGame, ...upcomingPatch } = weekly.upcoming ?? {};
  const upcoming: NexusChronicleUpcoming = { ...openingChronicle.upcoming, ...upcomingPatch };
  if (weekly.upcoming && "featuredGame" in weekly.upcoming) {
    if (featuredGame) upcoming.featuredGame = featuredGame;
    else delete upcoming.featuredGame;
  }
  return {
    ...openingChronicle,
    ...weekly,
    promotion: { ...openingChronicle.promotion, ...weekly.promotion },
    upcoming,
    featured: true,
  };
}

const ordinaryCommissionPromotion: NexusChroniclePromotion = {
  theme: "standard",
  label: "Vantaggi permanenti",
  title: "Il Pass continua oltre le campagne stagionali.",
  period: "Disponibile tutto l’anno",
  description: "Fuori dalle promozioni a tempo restano attivi gli sconti ordinari collegati al LoreWise ID.",
  visual: "/universe-pass/benefits-sketch-constellation-v1.webp",
  visualAlt: "Costellazione illustrata dei vantaggi LoreWise Universe Pass",
  rates: [
    { audience: "Visitatori", discount: "Listino" },
    { audience: "Supporter", discount: "−5%" },
    { audience: "Collector", discount: "−10%" },
  ],
  terms: [
    "Lo sconto viene applicato direttamente al preventivo.",
    "Il livello attivo resta collegato al LoreWise ID.",
    "Prezzo e condizioni sono confermati prima dell’inizio del lavoro.",
    "Inviare una richiesta è gratuito e non comporta un acquisto.",
  ],
  href: "/abbonamento?focus=piani",
  action: "Confronta i vantaggi",
};

function halloweenChroniclePromotion(status: "preview" | "active" | "ended"): NexusChroniclePromotion {
  if (status === "ended") return {
    ...ordinaryCommissionPromotion,
    theme: "ended",
    label: "Halloween · promozione conclusa",
    title: "La mia versione corrotta lascia spazio ai vantaggi permanenti.",
    period: corruptedPortraitPromotion.period,
    description: "La settimana di Halloween è terminata. Restano disponibili le commissioni ordinarie e gli sconti permanenti del Universe Pass.",
    visual: "/decorations/halloween/moon-amber-mist-optimized-v1.webp",
    visualAlt: "Luna ambrata immersa nella nebbia di Halloween",
    terms: [
      "Le richieste valide inviate entro il 1° novembre conservano lo sconto acquisito.",
      "Supporter mantiene il 5% sulle commissioni ordinarie ammesse.",
      "Collector mantiene il 10% sulle commissioni ordinarie ammesse.",
      "Inviare una nuova richiesta è gratuito e non comporta un acquisto.",
    ],
    href: "/commissioni",
    action: "Apri le commissioni",
  };
  return {
    theme: "halloween",
    label: status === "active" ? "Halloween · promozione attiva" : "In arrivo · settimana di Halloween",
    title: status === "active" ? corruptedPortraitPromotion.title : "La tua versione corrotta sta per emergere.",
    period: corruptedPortraitPromotion.period,
    description: status === "active"
      ? "Un ritratto personale reinterpretato in stile horror, con le stesse regole delle commissioni ordinarie e uno sconto dedicato sul preventivo."
      : "Dal 26 ottobre al 1° novembre il tuo ritratto diventa una versione horror costruita sulla tua atmosfera, sui tuoi riferimenti e sul formato scelto.",
    visual: "/promotions/halloween-corrupted-portrait-premium-v1.webp",
    visualAlt: "Ritratto originale metà umano e metà corrotto creato per la promozione Halloween",
    rates: [
      { audience: "Visitatori", discount: `−${corruptedPortraitPromotion.rates.visitor}%` },
      { audience: "Supporter", discount: `−${corruptedPortraitPromotion.rates.supporter}%` },
      { audience: "Collector", discount: `−${corruptedPortraitPromotion.rates.collector}%` },
    ],
    terms: [
      "La promozione vale soltanto per La mia versione corrotta.",
      "Lo sconto è del 15% per Visitatori, 20% per Supporter e 25% per Collector.",
      "La richiesta completa deve essere inviata entro il 1° novembre 2026.",
      "Lo sconto sostituisce quello ordinario del Pass e non si somma ad altre offerte.",
    ],
    href: `/commissioni?focus=${corruptedPortraitPromotion.focusId}`,
    action: status === "active" ? "Crea la mia versione corrotta" : "Scopri la promozione",
  };
}

const demonMatchRevealChronicle = makeWeeklyChronicle({
  id: "demon-match-android-development",
  issue: "Novità Games 001",
  category: "games",
  categoryLabel: "Demon Match Three",
  publishedAt: "2026-08-26",
  title: "Le identità del nuovo conflitto sono state svelate nell’Area VIP.",
  excerpt: "Il nuovo Demon Match Three nasce attorno a due forze contrapposte. Volti, nomi e motivazioni restano protetti nell’anteprima VIP; la cronaca pubblica mostra soltanto atmosfera e gameplay.",
  detail: "Il gioco è in pieno sviluppo per smartphone e tablet Android. La griglia, le fusioni e le prime missioni sono già presenti nella build privata; una demo gratuita arriverà quando il percorso iniziale sarà pronto per il pubblico.",
  image: "/games/demon-match-three/gameplay-portal-backdrop-v1.webp",
  imageAlt: "Portale fantasy tra energia celeste e infernale sopra una griglia match-3",
  signals: [
    {
      label: "Gameplay Android",
      title: "La campagna avanza missione dopo missione.",
      text: "La mappa dell’Atto I rende visibili il percorso, le tappe disponibili e la progressione. La schermata proviene dalla build mobile corrente e non rivela i protagonisti.",
      image: "/games/demon-match-three/gameplay-map-act-1-v1.webp",
      imageAlt: "Schermata mobile della mappa dell’Atto I con i nodi delle missioni",
      note: "Cattura reale della build Android · nessuno spoiler narrativo",
      href: "/giochi/demon-match-three#come-si-gioca",
      action: "Scopri come si gioca",
    },
    {
      label: "Sistema di fusione",
      title: "Due potenziamenti preparano un effetto combinato.",
      text: "La griglia mostra quando i potenziamenti sono pronti per essere avvicinati e fusi. Combinazioni, cascate ed effetti speciali trasformano ogni mossa in avanzamento dell’obiettivo.",
      image: "/games/demon-match-three/gameplay-powerup-ready-v1.webp",
      imageAlt: "Griglia match-3 mobile con due potenziamenti pronti per la fusione",
      note: "Gameplay verticale · controlli touch · nessuno spoiler",
      href: "/giochi/demon-match-three#come-si-gioca",
      action: "Guarda il ciclo di gioco",
    },
  ],
  promotion: ordinaryCommissionPromotion,
  upcoming: {
    label: "Prossimo varco",
    title: "Demo gratuita Android",
    status: "In pieno sviluppo · data non ancora annunciata",
    description: "La nuova esperienza nasce per schermi verticali, controlli touch e sessioni mobile leggibili. La demo verrà aperta soltanto quando le prime missioni saranno pronte.",
    features: ["Due percorsi iniziali", "Prologo dedicato", "Prime missioni match-3", "Smartphone e tablet Android"],
    previews: [],
    featuredGame: null,
  },
  benefits: [
    { title: "Segui ogni rivelazione", text: "L’Area VIP raccoglie protagonisti e nuove anteprime man mano che il gioco cresce." },
    { title: "Niente spoiler in pubblico", text: "Fuori dall’Area VIP vengono mostrati soltanto atmosfera, sistemi e scene di gameplay." },
    { title: "Mobile al centro", text: "Il nuovo progetto nasce come applicazione Android nativa per smartphone e tablet." },
    { title: "Demo gratuita in arrivo", text: "L’accesso alla futura demo non richiederà l’abbonamento; il Pass serve a seguire più da vicino tutte le novità." },
  ],
  transparency: "La demo gratuita resterà accessibile a tutti quando sarà pronta. L’Area VIP offre anteprime e approfondimenti per chi vuole seguire lo sviluppo più da vicino.",
  href: "/abbonamento",
  action: "Abbonati all’Area VIP",
  featured: true,
});

const guideChronicleEditorial = [
  { issue: "Cronaca 005", publishedAt: "2026-09-14", slug: "world-of-warcraft", title: "Il mondo non resta fermo.", excerpt: "World of Warcraft entra nell’Atlante con sedici capitoli dedicati al gioco moderno.", detail: "Classi, talenti, progressione, dungeon, raid, PvP, Delve, Housing e routine sostenibili accompagnano ogni stile di gioco." },
  { issue: "Cronaca 006", publishedAt: "2026-09-21", slug: "hogwarts-legacy", title: "Il castello apre le sue porte.", excerpt: "Hogwarts Legacy entra nell’anteprima VIP con sedici capitoli dedicati a magia, esplorazione, equipaggiamento e relazioni.", detail: "La guida accompagna l’avventura senza correre verso gli spoiler: ogni sezione separa preparazione, sistemi e contenuti narrativi protetti." },
  { issue: "Cronaca 007", publishedAt: "2026-09-28", slug: "zelda-tears-of-the-kingdom", title: "Tre livelli, infinite soluzioni.", excerpt: "Tears of the Kingdom porta nell’Atlante una guida costruita attorno a Ultramano, Compositor, cielo, superficie e profondità.", detail: "Questa è anche l’ultima Cronaca prima della chiusura della promozione di apertura: le richieste complete inviate entro il 30 settembre conservano la tariffa acquisita." },
  { issue: "Cronaca 008", publishedAt: "2026-10-05", slug: "the-sims-4", title: "Ogni vita comincia da una scelta.", excerpt: "The Sims 4 entra nel calendario con una guida pratica per Creazione Sim, costruzione, relazioni, denaro, mondi e contenuti aggiuntivi.", detail: "Salvataggi, mod, pacchetti e gestione delle famiglie sono organizzati in percorsi chiari e consultabili." },
  { issue: "Cronaca 009", publishedAt: "2026-10-12", slug: "red-dead-redemption-2", title: "La frontiera richiede metodo.", excerpt: "Red Dead Redemption 2 arriva con un percorso ordinato tra accampamento, caccia, combattimento, economia e sfide.", detail: "La guida protegge le svolte narrative e lavora sul ritmo: cosa preparare, cosa controllare e quando fermarsi prima di rovinare una scoperta." },
  { issue: "Cronaca 010", publishedAt: "2026-10-19", slug: "monster-hunter-wilds", title: "Prima della caccia viene la lettura.", excerpt: "Monster Hunter Wilds entra nell’Atlante mentre il Nexus annuncia La mia versione corrotta.", detail: "Armi, carichi, ecosistemi e mostri vengono organizzati come una vera preparazione di caccia. Dal 26 ottobre inizierà la settimana dei ritratti personali reinterpretati in stile horror." },
  { issue: "Cronaca 011", publishedAt: "2026-10-26", slug: "the-mortuary-assistant", title: "Il turno di Halloween comincia a River Fields.", excerpt: "The Mortuary Assistant: Definitive Edition occupa la settimana di Halloween con sedici capitoli dedicati al lavoro notturno e all’indagine demoniaca.", detail: "Ispezione, registri, strumenti, imbalsamazione, infestazioni, sigilli, finali ed Embalming Only sono separati in un percorso horror leggibile e con spoiler protetti." },
  { issue: "Cronaca 012", publishedAt: "2026-11-02", slug: "diablo-iv", title: "Il grimorio di Sanctuarium si apre.", excerpt: "Diablo IV entra nell’Atlante con classi, build, equipaggiamento, attività e progressione stagionale.", detail: "La settimana horror termina, mentre il percorso prosegue tra reame stagionale ed eterno, boss, spedizioni e cooperativa." },
  { issue: "Cronaca 013", publishedAt: "2026-11-09", slug: "pokemon-pokopia", title: "Dopo l’ombra, si ricomincia a costruire.", excerpt: "Pokémon Pokopia arriva con una guida dedicata a raccolta, costruzione, amicizie, richieste e routine.", detail: "La guida accompagna ogni progetto con obiettivi chiari, spazio organizzato e un ritmo sostenibile." },
  { issue: "Cronaca 014", publishedAt: "2026-11-16", slug: "the-witcher-3", title: "Il Sentiero riapre l’Atlante.", excerpt: "The Witcher 3: Wild Hunt entra in anteprima VIP con venti capitoli, sessanta schede operative e spoiler narrativi protetti.", detail: "Segni, alchimia, equipaggiamento, Gwent, storia, espansioni, Photo Mode e REDkit seguono immagini specifiche per ogni capitolo." },
  { issue: "Cronaca 015", publishedAt: "2026-11-23", slug: "cyberpunk-2077", title: "Night City non concede una seconda prima impressione.", excerpt: "Cyberpunk 2077 arriva con una guida completa per Ultimate Edition, Update 2.3 e Phantom Liberty.", detail: "Creazione di V, attributi, cyberware, combattimento, hacking, veicoli, incarichi, relazioni, finali e Dogtown formano sedici capitoli operativi." },
  { issue: "Cronaca 016", publishedAt: "2026-11-30", slug: "inazuma-eleven-victory-road", title: "La strada verso la vittoria attraversa il Nexus.", excerpt: "INAZUMA ELEVEN: Victory Road porta nell’Atlante Story, Chronicle, Competition e Bond Station.", detail: "Focus, Zone, tecniche speciali, tattiche, formazione, oltre 5.400 giocatori, cross-play e cross-save accompagnano la costruzione della squadra dei sogni." },
  { issue: "Cronaca 017", publishedAt: "2026-12-07", slug: "inazuma-eleven-victory-road", finalPublic: true, title: "La squadra dei sogni entra nell’Atlante.", excerpt: "INAZUMA ELEVEN: Victory Road è ora disponibile per tutti con sedici capitoli dedicati al calcio iperdimensionale.", detail: "Story Mode, Focus, Zone, tecniche speciali, formazione, Chronicle, scouting, Competition, Bond Station, aggiornamenti e completamento restano raccolti in un solo percorso." },
] as const;

const guideCalendarChronicles = guideChronicleEditorial.map((entry) => {
  const guide = GAME_GUIDES.find((item) => item.slug === entry.slug)!;
  const publicGuide = GAME_GUIDES.find((item) => item.publicAt.startsWith(entry.publishedAt));
  const finalPublic = "finalPublic" in entry && entry.finalPublic;
  const promotion = entry.publishedAt <= "2026-09-28"
    ? openingChronicle.promotion
    : entry.publishedAt === "2026-10-19"
      ? halloweenChroniclePromotion("preview")
      : entry.publishedAt === "2026-10-26"
        ? halloweenChroniclePromotion("active")
        : entry.publishedAt === "2026-11-02"
          ? halloweenChroniclePromotion("ended")
          : ordinaryCommissionPromotion;
  const signals: NexusChronicleSignal[] = [{
    label: finalPublic ? "Atlante pubblico" : "Guida VIP della settimana",
    title: finalPublic ? `${guide.game} è ora disponibile per tutti.` : `${guide.game} entra nell’Atlante.`,
    text: finalPublic
      ? "La guida completa resta consultabile nell’archivio pubblico insieme alle uscite precedenti."
      : `${guide.title} raccoglie ${guide.chapters.length} capitoli operativi, immagini coerenti con gli argomenti e sei percorsi tematici per orientarsi senza perdere il filo.`,
    image: guide.cover.src,
    imageAlt: guide.cover.alt,
    note: finalPublic ? `Pubblica dal ${guideDate(guide.publicAt)}` : `Anteprima VIP dal ${guideDate(guide.vipFrom)} · pubblica dal ${guideDate(guide.publicAt)}`,
    href: finalPublic ? "/giochi/guide" : "/vip-zone?area=guides#guides",
    action: finalPublic ? "Apri l’Atlante pubblico" : "Apri la guida VIP",
  }];
  if (!finalPublic && publicGuide) signals.push({
    label: "Passaggio pubblico",
    title: `${publicGuide.game} resta nell’archivio pubblico.`,
    text: "La guida della settimana precedente non scompare con la rotazione: passa nell’Atlante pubblico e rimane disponibile nel calendario permanente.",
    image: publicGuide.cover.src,
    imageAlt: publicGuide.cover.alt,
    note: `Disponibile per tutti dal ${guideDate(publicGuide.publicAt)}`,
    href: "/giochi/guide",
    action: "Consulta le guide pubbliche",
  });
  if (finalPublic) signals.push({
    label: "Archivio delle uscite",
    title: "Diciassette Cronache, un percorso leggibile.",
    text: "Guide, date, passaggi pubblici e campagne stagionali restano raccolti in un archivio facile da consultare.",
    image: "/brand/icons/giochi-concept-v1.webp",
    imageAlt: "Emblema della sezione Giochi di LoreWise Universe",
    note: "Calendario completato · archivio permanente",
    href: "/cronache-del-nexus",
    action: "Sfoglia tutte le Cronache",
  });
  return makeWeeklyChronicle({
    id: `guide-calendar-${entry.publishedAt}`,
    issue: entry.issue,
    category: "games",
    categoryLabel: finalPublic ? "Atlante dei Giochi" : "Guida della settimana",
    publishedAt: entry.publishedAt,
    title: entry.title,
    excerpt: entry.excerpt,
    detail: entry.detail,
    image: guide.cover.src,
    imageAlt: guide.cover.alt,
    signals,
    promotion,
    benefits: [
      { title: "Sette giorni di anteprima", text: "Ogni guida entra prima nell’Area VIP e diventa pubblica nell’Atlante la settimana successiva." },
      { title: "Sedici capitoli completi", text: "Ogni uscita offre percorsi pratici, immagini leggibili e sezioni facili da consultare." },
      { title: "Nessun contenuto scompare", text: "La rotazione cambia l’accesso, non cancella le guide già pubblicate né le Cronache precedenti." },
      { title: "Guide che seguono il gioco", text: "I titoli in evoluzione conservano sezioni dedicate a stagioni, espansioni e nuovi contenuti." },
    ],
    upcoming: finalPublic ? {
      label: "Percorso completato",
      title: "INAZUMA ELEVEN: Victory Road è ora pubblico.",
      status: `${guide.game} · pubblico dal ${guideDate(guide.publicAt)}`,
      description: "La guida raggiunge le altre uscite nell’Atlante dei Giochi e resta disponibile per tutti.",
      features: ["17 Cronache da sfogliare", "Guide pubbliche permanenti", "Sezioni dedicate a ogni gioco", "Nuovi percorsi in arrivo"],
      featuredGame: null,
    } : undefined,
    href: "/giochi/guide",
    action: "Apri l’Atlante dei Giochi",
  });
});

export const nexusChronicles: NexusChronicle[] = [
  demonMatchRevealChronicle,
  openingChronicle,
  makeWeeklyChronicle({
    id: "worlds-laezel-and-custodians",
    issue: "Cronaca 002",
    category: "worlds",
    categoryLabel: "Dove nascono i mondi",
    publishedAt: "2026-08-24",
    title: "Dal tratto al mondo.",
    excerpt: "La settimana di Baldur’s Gate 3 comincia dal processo creativo di Lae’zel, mentre l’Archivio dei Custodi apre tre nuovi sfondi riservati agli abbonati.",
    detail: "La Cronaca mette vicini due modi di custodire un universo: osservare come nasce un personaggio e conservare sul proprio dispositivo un frammento visivo originale di LoreWise.",
    image: "/brand/icons/dove-nascono-i-mondi-concept-v1.webp",
    imageAlt: "Emblema di Dove nascono i mondi",
    signals: [
      {
        label: "Dove nascono i mondi",
        title: "Lae’zel, prima del colore.",
        text: "Una fotografia autentica della lavorazione racconta come profilo, trecce e segni del volto siano stati ricostruiti con un tratto personale. La reinterpretazione accompagna la settimana di Baldur’s Gate 3 senza confondersi con materiale ufficiale del gioco.",
        image: "/creative-journal/previews/lw-wip-010-preview.jpg",
        imageAlt: "Fase protetta della reinterpretazione personale di Lae’zel",
        note: "Processo creativo reale · reinterpretazione personale non ufficiale",
        href: "/dove-nascono-i-mondi/laezel-guerriera-astrale",
        action: "Apri il processo creativo",
      },
      {
        label: "Download VIP",
        title: "Apre l’Archivio dei Custodi.",
        text: "Tre sfondi originali dedicati a The Wound Remembers entrano nella raccolta digitale riservata. Le anteprime restano leggere e protette; i file completi sono disponibili agli abbonati con Pass attivo.",
        image: "/brand/icons/lorewise-vip-official-v1.webp",
        imageAlt: "Emblema ufficiale LoreWise VIP",
        note: "Tre sfondi originali · archivio digitale protetto",
        href: "/vip-zone?area=downloads#downloads",
        action: "Apri i Download VIP",
      },
    ],
    promotion: {
      label: "Promozione attiva · Come funziona",
      title: "La tariffa resta tua.",
      description: "La richiesta inviata entro il 30 settembre conserva la percentuale di apertura anche quando valutazione, lavorazione o consegna proseguono oltre la scadenza.",
      terms: [
        "La data che conta è quella di invio della richiesta completa.",
        "La promozione copre Ritratto Essenziale, Ritratto Completo e Opera Narrativa.",
        "La percentuale dipende dal livello collegato al LoreWise ID al momento della richiesta.",
        "Lo sconto di apertura sostituisce quello ordinario del Pass e non si somma ad altre offerte.",
      ],
      action: "Calcola la tua commissione",
    },
    benefits: [
      { title: "La guida arriva prima", text: "Ogni lunedì una guida completa entra nell’Area VIP sette giorni prima del passaggio pubblico nell’Atlante." },
      { title: "Sai sempre cosa leggere", text: "La Cronaca riunisce la guida disponibile, la data dell’uscita pubblica e il prossimo gioco." },
      { title: "L’archivio resta leggibile", text: "Quando una guida diventa pubblica non scompare: cambia area e rimane consultabile nell’Atlante dei Giochi." },
      { title: "Il Pass sostiene il lavoro", text: "L’accesso anticipato finanzia ricerca, scrittura, immagini e manutenzione senza sottrarre contenuti già pubblici." },
    ],
    href: "/dove-nascono-i-mondi/laezel-guerriera-astrale",
    action: "Apri il processo di Lae’zel",
  }),
  makeWeeklyChronicle({
    id: "atelier-two-souls",
    issue: "Cronaca 003",
    category: "art",
    categoryLabel: "Atelier LoreWise",
    publishedAt: "2026-08-31",
    title: "Due anime dello stesso Atelier.",
    excerpt: "Un ricordo nel bosco e un volto spezzato dopo mezzanotte mostrano quanto possano essere diverse le strade che conducono a un’opera.",
    detail: "LoreWise non ha un solo tono. Questa settimana l’Atelier mette a confronto un processo intimo e luminoso con una trasformazione horror, mentre l’archivio digitale accoglie la trilogia LoreWise Match.",
    image: "/brand/icons/arte-concept-v1.webp",
    imageAlt: "Emblema di Arte in Vetrina",
    signals: [
      {
        label: "Atelier VIP",
        title: "Dal legame al paesaggio.",
        text: "Insieme nel bosco segue quattro fasi reali: prima la vicinanza fra una ragazza e il suo cane, poi identità, colore e infine il luogo che li custodisce.",
        image: "/brand/icons/dove-nascono-i-mondi-concept-v1.webp",
        imageAlt: "Emblema di Dove nascono i mondi usato per il processo creativo Insieme nel bosco",
        note: "Quattro fasi protette · processo delicato e personale",
        href: "/vip-zone?area=atelier#atelier",
        action: "Apri l’Atelier VIP",
      },
      {
        label: "Atelier e Download VIP",
        title: "Dopo mezzanotte cambia tutto.",
        text: "Icona dopo mezzanotte conserva in quattro passaggi la metamorfosi horror di un volto. Accanto al processo arriva LoreWise Match: tre nuovi sfondi originali raccolti in un unico archivio digitale.",
        image: "/brand/icons/lorewise-vip-official-v1.webp",
        imageAlt: "Emblema LoreWise VIP per Atelier e Download",
        note: "Quattro fasi di studio · tre nuovi sfondi LoreWise Match",
        href: "/vip-zone?area=downloads#downloads",
        action: "Apri LoreWise Match",
      },
    ],
    promotion: {
      label: "Promozione attiva · Scegli il percorso",
      title: "Tre modi per trasformare un’idea.",
      description: "La promozione di apertura copre tre percorsi differenti: dal ritratto essenziale all’opera costruita insieme attraverso una vera direzione narrativa.",
      terms: [
        "Ritratto Essenziale: un soggetto e una composizione diretta.",
        "Ritratto Completo: maggiore definizione, atmosfera e personalizzazione.",
        "Opera Narrativa: scena, simboli e racconto sviluppati attraverso un confronto creativo.",
        "Ogni richiesta viene valutata prima del preventivo: l’invio non obbliga all’acquisto.",
      ],
      action: "Confronta i tre percorsi",
    },
    benefits: [
      { title: "Sei sfondi disponibili", text: "L’archivio riunisce tre desktop di The Wound Remembers e tre visioni originali della raccolta LoreWise Match." },
      { title: "Anteprime protette", text: "La pagina mostra copie alleggerite; gli originali ad alta definizione non vengono esposti con un indirizzo pubblico." },
      { title: "Raccolte complete", text: "Ogni collezione può essere scaricata come pacchetto con condizioni d’uso e manifesto di controllo." },
      { title: "Restano personali", text: "I download sono inclusi nel Pass per uso personale e rimangono collegati al LoreWise ID che li ha ottenuti." },
    ],
    href: "/vip-zone?area=atelier#atelier",
    action: "Entra nell’Atelier VIP",
  }),
  makeWeeklyChronicle({
    id: "codex-characters-and-rules",
    issue: "Cronaca 004",
    category: "codex",
    categoryLabel: "LoreWise Codex",
    publishedAt: "2026-09-07",
    title: "Personaggi, regole e mondi che crescono.",
    excerpt: "Nhevara e Kharvoss aprono due dossier del Codex; Fuori Trama mostra come compagnia, prove d20 e combattimento tattico convivono nello stesso percorso.",
    detail: "Questa edizione unisce due dossier del Codex e un viaggio dentro Fuori Trama, tra compagnia, inventario, prove d20 e battaglie tattiche.",
    image: "/codex/seals/lorewise-codex-emblem-v1.webp",
    imageAlt: "Emblema del LoreWise Codex",
    signals: [
      {
        label: "LoreWise Codex",
        title: "Due custodi, due memorie.",
        text: "I dossier di Nhevara e Kharvoss raccolgono identità, ruolo, relazioni, continuità e fonti di The Wound Remembers.",
        image: "/codex/display/nhevara.webp",
        imageAlt: "Ritratto di Nhevara nel LoreWise Codex",
        note: "Nhevara e Kharvoss · identità, legami e memoria",
        href: "/enciclopedia#indice-codex",
        action: "Apri i dossier del Codex",
      },
      {
        label: "Fuori Trama",
        title: "Dal gruppo al tavolo tattico.",
        text: "Il diario di Fuori Trama collega scelta della campagna, compagnia, inventario, prove d20 e battaglia tattica in un unico viaggio.",
        image: "/games/lorewise-fuori-trama-next/gameplay-current-tactical-battle.webp",
        imageAlt: "Schermata reale del combattimento tattico di Fuori Trama",
        note: "Diario disponibile · campagna e battaglie tattiche",
        href: "/dove-nascono-i-mondi/giochi/lorewise-fuori-trama-next",
        action: "Apri il diario di sviluppo",
      },
    ],
    promotion: {
      label: "Promozione attiva · Dall’idea alla consegna",
      title: "Ogni commissione ha un percorso chiaro.",
      description: "Soggetto, formato, atmosfera e destinazione vengono definiti prima della lavorazione. La consegna completa resta privata e protetta.",
      terms: [
        "01 · Invia la richiesta con riferimenti e obiettivo.",
        "02 · Ricevi valutazione e preventivo senza obbligo di acquisto.",
        "03 · Approva impostazione, prezzo e condizioni prima della lavorazione.",
        "04 · Ricevi il file autorizzato attraverso una consegna collegata al LoreWise ID.",
      ],
      action: "Inizia una richiesta",
    },
    benefits: [
      { title: "Crediti Arte mensili", text: "Supporter riceve 1 credito al mese fino a un massimo di 2; Collector ne riceve 2 fino a un massimo di 4." },
      { title: "Atelier riservato", text: "Processi, studi e trasformazioni restano consultabili come percorsi, non come una semplice galleria di risultati finali." },
      { title: "Partecipazione VIP", text: "Proposte e votazioni permettono agli abbonati di contribuire agli approfondimenti e ai percorsi futuri." },
      { title: "Una sola identità", text: "Vantaggi, crediti, download e contenuti riscattati restano collegati allo stesso LoreWise ID." },
    ],
    href: "/enciclopedia",
    action: "Apri il LoreWise Codex",
  }),
  ...guideCalendarChronicles,
];

function guideDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Rome",
  }).format(new Date(value));
}

function guideAsFeaturedGame(guide: GameGuide, next: GameGuide | null): NonNullable<NexusChronicleUpcoming["featuredGame"]> {
  const nextLivingLabel = next?.livingGuide ? ", la prima Guida Viva del progetto" : "";
  const sections = (guide.sections?.length ? guide.sections : [{
    id: "overview",
    label: "Guida completa",
    summary: guide.subtitle,
    icon: guide.cover,
    chapterIds: guide.chapters.slice(0, 3).map((chapter) => chapter.id),
  }]).slice(0, 3).map((section, index) => {
    const chapter = section.chapterIds
      .map((chapterId) => guide.chapters.find((item) => item.id === chapterId))
      .find(Boolean) ?? guide.chapters[index] ?? guide.chapters[0];
    return {
      id: section.id,
      number: String(index + 1).padStart(2, "0"),
      label: section.label,
      title: chapter?.title ?? section.label,
      text: chapter?.introduction ?? section.summary,
      images: chapter?.images?.length ? chapter.images : [section.icon],
    };
  });

  return {
    title: guide.game,
    kicker: guide.livingGuide ? "Prima Guida Viva LoreWise" : "Guida VIP della settimana",
    description: `${guide.title}. ${guide.subtitle}`,
    cover: guide.cover.src,
    coverAlt: guide.cover.alt,
    storeUrl: guide.storeUrl,
    storeAction: guide.storeLabel,
    vipCta: {
      label: `Disponibile da ${guideDate(guide.vipFrom)}`,
      title: `${guide.title} è ora nell’area LoreWise VIP.`,
      text: next
        ? `La prossima guida sarà ${next.game}${nextLivingLabel}: arrivo previsto ${guideDate(next.vipFrom)}.`
        : "Il prossimo viaggio verrà annunciato nelle Cronache del Nexus.",
      href: "/vip-zone?area=guides#guides",
      action: "Apri la guida VIP",
      note: `Disponibile nell’Atlante pubblico dal ${guideDate(guide.publicAt)}.`,
    },
    sections,
  };
}

function chronicleWithScheduledGuide(chronicle: NexusChronicle): NexusChronicle {
  const editorialInstant = new Date(editorialReleaseInstant(chronicle.publishedAt));
  const { current, next, latestPublic } = getGuideEditorialNews(editorialInstant);
  if (!current) return chronicle;

  const nextAnnouncement = next
    ? `La prossima guida sarà ${next.game}${next?.livingGuide ? ", la prima Guida Viva LoreWise" : ""} e arriverà nell’area VIP ${guideDate(next.vipFrom)}.`
    : "La prossima guida verrà annunciata qui.";
  const publicAnnouncement = latestPublic
    ? `${latestPublic.game} è disponibile nell’Atlante pubblico.`
    : `${current.game} passerà nell’Atlante pubblico ${guideDate(current.publicAt)}.`;

  return {
    ...chronicle,
    upcoming: {
      ...chronicle.upcoming,
      label: "Novità del lunedì",
      title: "La guida della settimana",
      status: `${current.game} · ora in LoreWise VIP`,
      description: `${current.game} è la guida scelta per questa settimana. ${publicAnnouncement} ${nextAnnouncement}`,
      features: current.sections?.slice(0, 4).map((section) => section.label)
        ?? current.chapters.slice(0, 4).map((chapter) => chapter.label),
      featuredGame: guideAsFeaturedGame(current, next),
    },
  };
}

export function getNexusChronicles(now = new Date()): NexusChronicle[] {
  return getReleasedEditorialEntries(nexusChronicles, now)
    .map(chronicleWithScheduledGuide);
}

export const nexusChronicleCategories: Array<{ value: "all" | NexusChronicleCategory; label: string }> = [
  { value: "all", label: "Tutte" },
  { value: "art", label: "Arte" },
  { value: "games", label: "Giochi" },
  { value: "codex", label: "Codex" },
  { value: "worlds", label: "Dove nascono i mondi" },
  { value: "vip", label: "LoreWise VIP" },
];
