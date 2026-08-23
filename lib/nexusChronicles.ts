import { commissionOpeningPromotion } from "@/lib/commissionPromotion";
import { editorialReleaseInstant, getReleasedEditorialEntries } from "@/lib/editorialCalendar";
import { getGuideEditorialNews, type GameGuide } from "@/lib/gameGuides";

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
    description: "Una nuova guida entra nell’Area VIP prima del passaggio pubblico. La Cronaca mostra sempre gioco corrente, data di pubblicazione e prossimo titolo approvato.",
    href: "/vip-zone?area=guides#guides",
    action: "Apri la guida VIP",
  },
  {
    code: "ATLAS-PUBLIC-ROTATION",
    area: "Atlante dei Giochi",
    title: "Passaggio nell’archivio pubblico",
    status: "Automatico",
    timing: "Sette giorni dopo",
    description: "La guida della settimana precedente lascia l’anteprima VIP e rimane consultabile nell’Atlante pubblico, senza sparire dal calendario editoriale.",
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
    description: "Archivio dei Custodi e LoreWise Match riuniscono tre sfondi ciascuno. Le anteprime sono protette; i file completi vengono consegnati dopo la verifica del Pass.",
    href: "/vip-zone?area=downloads#downloads",
    action: "Apri i Download",
  },
  {
    code: "TWR-ROGO",
    area: "The Wound Remembers",
    title: "Il Rogo delle Dieci Porte",
    status: "In progettazione",
    timing: "Aggiornamenti progressivi",
    description: "Il dossier VIP segue fazione, personaggi e direzione creativa dell’espansione senza anticipare il finale e senza promettere contenuti prima della loro approvazione.",
    href: "/vip-zone?area=games&game=the-wound-remembers#dossier-rogo",
    action: "Segui il dossier",
  },
  {
    code: "FUORI-TRAMA-PARTICIPATION",
    area: "Fuori Trama",
    title: "Proposte e partecipazione",
    status: "In sviluppo",
    timing: "Consultazioni verificate",
    description: "Gli abbonati possono seguire le direzioni del roster e proporre candidature. Fattibilità, diritti e inserimento definitivo restano soggetti a verifica editoriale.",
    href: "/vip-zone?area=games&game=fuori-trama#vip-panel-fuori-trama",
    action: "Apri Fuori Trama",
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
        text: "Il roster esplora un filone ispirato alla musica. Gli abbonati potranno proporre e votare candidature, mentre diritti, fattibilità e inserimento finale verranno verificati prima di ogni annuncio.",
        image: "/games/lorewise-fuori-trama-next/catalog-cover-generated-v1.webp",
        imageAlt: "Copertina pubblica di Fuori Trama",
        note: "Il gioco resta gratuito · i VIP partecipano prima",
        href: "/vip-zone?area=games&game=fuori-trama#vip-panel-fuori-trama",
        action: "Apri l’anteprima VIP",
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
  benefits: NexusChronicleBenefit[];
};

function makeWeeklyChronicle(weekly: WeeklyChronicle): NexusChronicle {
  return {
    ...openingChronicle,
    ...weekly,
    promotion: { ...openingChronicle.promotion, ...weekly.promotion },
    upcoming: openingChronicle.upcoming,
    featured: true,
  };
}

export const nexusChronicles: NexusChronicle[] = [
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
        text: "Tre sfondi originali dedicati a The Wound Remembers entrano nella raccolta digitale riservata. Le anteprime restano leggere e protette; i file completi vengono consegnati soltanto dopo la verifica del Pass.",
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
      { title: "Il calendario è trasparente", text: "La Cronaca indica la guida disponibile, la data del passaggio pubblico e il gioco previsto per la settimana successiva." },
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
    detail: "Questa edizione distingue ciò che appartiene già al canone, ciò che viene raccontato editorialmente e ciò che resta ancora in sviluppo. Nessuna data di uscita viene promessa prima della verifica finale.",
    image: "/codex/seals/lorewise-codex-emblem-v1.webp",
    imageAlt: "Emblema del LoreWise Codex",
    signals: [
      {
        label: "LoreWise Codex",
        title: "Due custodi, due memorie.",
        text: "I dossier di Nhevara e Kharvoss raccolgono identità, ruolo, relazioni, continuità e fonti di The Wound Remembers, separando con chiarezza informazioni verificate e letture editoriali.",
        image: "/codex/display/nhevara.webp",
        imageAlt: "Ritratto di Nhevara nel LoreWise Codex",
        note: "Nhevara e Kharvoss · dossier con fonti e stato editoriale",
        href: "/enciclopedia#indice-codex",
        action: "Apri i dossier del Codex",
      },
      {
        label: "Fuori Trama",
        title: "Dal gruppo al tavolo tattico.",
        text: "Il diario di sviluppo collega scelta della campagna, compagnia, inventario, prove d20 e battaglia. La build pubblica resta in preparazione e non viene indicata una data finché controllo dei contenuti e distribuzione non saranno completati.",
        image: "/games/lorewise-fuori-trama-next/gameplay-current-tactical-battle.webp",
        imageAlt: "Schermata reale del combattimento tattico di Fuori Trama",
        note: "Sviluppo reale · uscita pubblica non ancora datata",
        href: "/dove-nascono-i-mondi/giochi/lorewise-fuori-trama-next",
        action: "Apri il diario di sviluppo",
      },
    ],
    promotion: {
      label: "Promozione attiva · Dall’idea alla consegna",
      title: "Ogni commissione ha un percorso chiaro.",
      description: "Prima di iniziare vengono definiti soggetto, formato, atmosfera e destinazione. Preventivo e approvazione precedono la lavorazione; la consegna completa resta privata e protetta.",
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
      { title: "Partecipazione verificata", text: "Proposte e votazioni possono orientare gli approfondimenti, senza sostituire controlli editoriali, fattibilità e diritti." },
      { title: "Una sola identità", text: "Vantaggi, crediti, download e contenuti riscattati restano collegati allo stesso LoreWise ID." },
    ],
    href: "/enciclopedia",
    action: "Apri il LoreWise Codex",
  }),
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
    description: `${guide.title}. ${guide.subtitle}${guide.livingGuide ? ` ${guide.livingGuide.announcement}: controllo mensile delle fonti ufficiali e aggiornamenti soltanto dopo approvazione.` : ""}`,
    cover: guide.cover.src,
    coverAlt: guide.cover.alt,
    storeUrl: guide.storeUrl,
    storeAction: guide.storeLabel,
    vipCta: {
      label: `Disponibile da ${guideDate(guide.vipFrom)}`,
      title: `${guide.title} è ora nell’area LoreWise VIP.`,
      text: next
        ? `La prossima guida sarà ${next.game}${nextLivingLabel}: arrivo previsto ${guideDate(next.vipFrom)}.`
        : "La prossima guida verrà annunciata qui appena entrerà nel calendario editoriale.",
      href: "/vip-zone?area=guides#guides",
      action: "Apri la guida VIP",
      note: `Passaggio automatico nell’Atlante pubblico: ${guideDate(guide.publicAt)}.`,
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
    : "La guida successiva verrà anticipata qui non appena sarà completa e approvata.";
  const publicAnnouncement = latestPublic
    ? `${latestPublic.game} è disponibile nell’Atlante pubblico.`
    : `${current.game} passerà nell’Atlante pubblico ${guideDate(current.publicAt)}.`;

  return {
    ...chronicle,
    upcoming: {
      ...chronicle.upcoming,
      label: "Aggiornamento automatico del lunedì",
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
