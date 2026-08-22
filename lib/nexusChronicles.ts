import { commissionOpeningPromotion } from "@/lib/commissionPromotion";

export type NexusChronicleCategory = "art" | "games" | "codex" | "worlds" | "vip";

export type NexusChronicleSignal = {
  label: string;
  title: string;
  text: string;
  image: string;
  imageAlt: string;
  note: string;
};

export type NexusChronicleBenefit = {
  title: string;
  text: string;
};

export type NexusChroniclePromotion = {
  label: string;
  title: string;
  period: string;
  description: string;
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
  transparency: string;
  href: string;
  action: string;
  featured?: boolean;
};

export const nexusChronicles: NexusChronicle[] = [
  {
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
      },
      {
        label: "Fuori Trama",
        title: "Nuove voci vogliono entrare nel Nexus.",
        text: "Il roster esplora un filone ispirato alla musica. Gli abbonati potranno proporre e votare candidature, mentre diritti, fattibilità e inserimento finale verranno verificati prima di ogni annuncio.",
        image: "/games/lorewise-fuori-trama-next/catalog-cover-generated-v1.webp",
        imageAlt: "Copertina pubblica di Fuori Trama",
        note: "Il gioco resta gratuito · i VIP partecipano prima",
      },
    ],
    promotion: {
      label: "Promozione di apertura",
      title: "Apertura del Nexus",
      period: commissionOpeningPromotion.period,
      description: "Per inaugurare il sito, le richieste di commissione inviate entro la scadenza ricevono una tariffa di apertura legata al LoreWise ID.",
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
      description: "Animal Crossing: New Horizons inaugura ufficialmente l’Atlante dei Giochi con il Taccuino dell’isola. La guida completa è già aperta in anteprima nell’area LoreWise VIP; Baldur’s Gate 3 è la prossima guida in rifinitura e verrà presentata soltanto quando sarà pronta.",
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
          note: "L’Atlante pubblico continuerà a ricevere le guide secondo il calendario editoriale del Nexus.",
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
      { title: "Puoi partecipare", text: "Proposte, votazioni verificate e candidature ai test permettono di seguire i progetti da vicino senza comprare autorevolezza." },
      { title: "Costruisci la collezione", text: "Ogni mese ricevi crediti Arte, prezzi riservati sui contenuti ammessi e download protetti collegati al tuo LoreWise ID." },
      { title: "Scegli il livello", text: "Supporter include 1 credito Arte e il 5% sui prodotti ammessi; Collector offre 2 crediti, il 10% e dossier originali estesi." },
    ],
    transparency: "Le opere pubbliche, il Codex consultabile e Fuori Trama non vengono sottratti ai visitatori. Il Pass serve ad approfondire, partecipare e sostenere lo sviluppo: non a nascondere ciò che prima era gratuito.",
    href: "/abbonamento",
    action: "Confronta Supporter e Collector",
    featured: true,
  },
];

export const nexusChronicleCategories: Array<{ value: "all" | NexusChronicleCategory; label: string }> = [
  { value: "all", label: "Tutte" },
  { value: "art", label: "Arte" },
  { value: "games", label: "Giochi" },
  { value: "codex", label: "Codex" },
  { value: "worlds", label: "Dove nascono i mondi" },
  { value: "vip", label: "LoreWise VIP" },
];
