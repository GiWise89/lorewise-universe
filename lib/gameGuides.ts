import animalCrossingGuideJson from "@/data/animal-crossing-guide.json";

export type GameGuideImage = { src: string; alt: string; caption: string };
export type GameGuideTable = { columns: string[]; rows: string[][] };
export type GameGuideScenario = { problem: string; answer: string };
export type GameGuideBlock = {
  label?: string;
  title: string;
  text: string;
  steps?: string[];
  tips?: string[];
  mistakes?: string[];
  table?: GameGuideTable;
  scenarios?: GameGuideScenario[];
  warning?: string;
  spoilerDetails?: { summary: string; text: string };
};
export type GameGuideChapter = {
  id: string; number: string; label: string; title: string; introduction: string;
  spoiler: "No spoiler" | "Spoiler leggeri" | "Spoiler protetti";
  estimatedRead: string; images: GameGuideImage[]; blocks: GameGuideBlock[];
  artworkGallery?: GameGuideImage[];
};
export type GameGuideSection = {
  id: string;
  label: string;
  summary: string;
  icon: GameGuideImage;
  chapterIds: string[];
};
export type GameGuide = {
  id: string; slug: string; code: string; game: string; title: string; subtitle: string;
  description: string; versionLabel: string; updatedAt: string; vipFrom: string; publicAt: string;
  theme?: "baldurs-gate" | "animal-crossing";
  cover: GameGuideImage; storeUrl: string; storeLabel: string; chapters: GameGuideChapter[];
  sections?: GameGuideSection[];
  sources: Array<{ label: string; href: string }>;
};

const animalCrossingGuide = animalCrossingGuideJson as GameGuide;

export const GAME_GUIDES: GameGuide[] = [animalCrossingGuide, {
  id: "bg3-complete-guide-01",
  slug: "baldurs-gate-3",
  code: "LW-ATLAS-BG3-001",
  game: "Baldur’s Gate 3",
  title: "Il quaderno dell’avventuriero",
  subtitle: "Una guida pratica di Baldur’s Gate 3 da consultare mentre giochi.",
  description: "Quattro quaderni e molti appunti concreti: creazione, squadra, combattimento, esplorazione, crescita e decisioni narrative. Ogni pagina parte da una situazione reale e indica cosa controllare, cosa fare e quali errori evitare.",
  versionLabel: "Edizione Patch 8",
  updatedAt: "22 agosto 2026",
  vipFrom: "2026-08-22T00:00:00+02:00",
  publicAt: "2026-08-24T00:00:00+02:00",
  cover: { src: "/atlas/baldurs-gate-3/copertina.jpg", alt: "Copertina ufficiale di Baldur’s Gate 3 con il gruppo", caption: "Baldur’s Gate 3 · quaderno LoreWise" },
  theme: "baldurs-gate",
  storeUrl: "https://store.steampowered.com/app/1086940/Baldurs_Gate_3/",
  storeLabel: "Acquista il gioco su Steam",
  chapters: [
    {
      id: "character", number: "01", label: "Protagonista", estimatedRead: "12–15 min", spoiler: "No spoiler",
      title: "Partire con un personaggio che sai usare",
      introduction: "Non serve conoscere Dungeons & Dragons. Serve capire quale azione vuoi compiere più spesso, quale caratteristica la sostiene e chi parlerà per il gruppo.",
      images: [
        { src: "/atlas/baldurs-gate-3/creazione-personaggio-1.jpg", alt: "Creazione del personaggio", caption: "Prima domanda: vuoi una storia tua o viverne una già scritta?" },
        { src: "/atlas/baldurs-gate-3/creazione-personaggio-2.jpg", alt: "Personalizzazione del protagonista", caption: "Questo sarà il volto di tutta la campagna." },
        { src: "/atlas/baldurs-gate-3/scelta-classe.jpg", alt: "Scelta della classe", caption: "La classe stabilisce il mestiere; il resto lo rifinisce." },
      ],
      blocks: [
        {
          label: "Scelta iniziale", title: "Personalizzato, Origine o Oscura Pulsione?",
          text: "La scelta cambia il rapporto tra libertà e trama personale. Scegli in base a quanta storia già scritta vuoi portare sulle spalle.",
          table: { columns: ["Scelta", "Quando sceglierla", "Cosa aspettarti"], rows: [
            ["Personalizzato", "Prima partita e massima libertà", "Identità completamente tua; i compagni conservano il centro delle loro storie"],
            ["Origine", "Vuoi vivere dall’interno una storia definita", "Motivazioni, legami e prospettiva personale già presenti"],
            ["Oscura Pulsione", "Vuoi libertà estetica e una trama intensa", "Eventi personali più presenti e temi oscuri"],
          ]},
          warning: "Per una prima campagna tranquilla, il personaggio personalizzato è la scelta più leggibile. L’Oscura Pulsione modifica davvero il tono della partita.",
        },
        {
          label: "Metodo in cinque minuti", title: "Crea un/a protagonista che funzioni",
          text: "Parti dal comportamento, non dalla scheda. Se sai cosa vuoi fare nel tuo turno, statistiche e classe diventano più facili da leggere.",
          steps: [
            "Completa la frase: «Nel mio turno voglio soprattutto…» attaccare in mischia, colpire da lontano, lanciare magie, proteggere o parlare.",
            "Scegli una classe che svolga quel compito senza dipendere da combinazioni avanzate.",
            "Tieni alta la caratteristica principale indicata dalla classe e non sacrificare troppo Costituzione e difesa.",
            "Scegli competenze sociali se vuoi che il protagonista guidi spesso le conversazioni.",
            "Controlla prima di confermare: arma, armatura e incantesimi devono usare davvero i valori privilegiati.",
          ],
          mistakes: ["Distribuire i punti in modo uniforme.", "Scegliere magie soltanto per il danno.", "Costruire quattro personaggi solitari invece di una squadra."],
        },
        {
          label: "Mappa delle classi", title: "Trova il tuo stile senza leggere dodici manuali",
          text: "Questa matrice non prescrive una build: orienta verso il tipo di turno che vuoi giocare.",
          table: { columns: ["Se vuoi…", "Prova", "Prima attenzione"], rows: [
            ["Stare davanti e resistere", "Guerriero, Paladino, Barbaro", "Forza o Destrezza, armatura e posizione"],
            ["Colpire con precisione e muoverti", "Ladro, Ranger, Monaco", "Destrezza, mobilità e scelta del bersaglio"],
            ["Controllare il campo con la magia", "Mago, Stregone, Warlock", "Caratteristica da incantatore e concentrazione"],
            ["Curare e sostenere senza restare passivo", "Chierico, Druido, Bardo", "Saggezza o Carisma e magie preparate"],
            ["Guidare dialoghi e adattarti", "Bardo, Paladino, Stregone, Warlock", "Carisma e competenze sociali"],
          ]},
          tips: ["Guerriero e Barbaro sono leggibili fin dal primo turno.", "Bardo e Druido sono versatili ma richiedono più lettura.", "Il Mago può preparare strumenti diversi quando cambia il problema."],
        },
        {
          label: "Diagnosi", title: "Se il personaggio non rende, controlla questo",
          text: "Non ricominciare subito. Individua se il problema è precisione, concentrazione, dialogo o sopravvivenza.",
          scenarios: [
            { problem: "Fallisco spesso gli attacchi", answer: "Verifica la caratteristica usata da arma o incantesimo, poi competenza, altezza, luce e svantaggio." },
            { problem: "Perdo subito la concentrazione", answer: "Proteggi l’incantatore con Costituzione, Classe Armatura, distanza e copertura." },
            { problem: "Nei dialoghi ho poche opzioni", answer: "Fai parlare chi possiede Carisma e competenze adatte oppure usa effetti di supporto prima della prova." },
            { problem: "Muoio sempre per primo", answer: "Migliora difesa e posizione iniziale: più punti ferita non correggono un personaggio esposto." },
          ],
        },
        {
          label: "Prima di confermare", title: "Checklist della nuova partita", text: "Un minuto di verifica evita errori che scoprirai dopo ore.",
          steps: ["La caratteristica principale è tra le più alte.", "Hai competenza con arma e armatura.", "Possiedi un’opzione affidabile senza risorse limitate.", "Sai chi scassina, chi percepisce e chi parla.", "La difficoltà corrisponde all’esperienza che vuoi."],
        },
      ],
    },
    {
      id: "party-combat", number: "02", label: "Squadra e battaglie", estimatedRead: "18–22 min", spoiler: "Spoiler leggeri",
      title: "Quattro persone, un solo piano",
      introduction: "La forza nasce dalla somma dei turni. Qui impari a comporre il gruppo, leggere l’iniziativa, proteggere la concentrazione e recuperare uno scontro difficile.",
      images: [
        { src: "/atlas/baldurs-gate-3/party.jpg", alt: "Gruppo di avventurieri", caption: "Ogni membro deve risolvere un problema diverso." },
        { src: "/atlas/baldurs-gate-3/shadowheart.jpg", alt: "Shadowheart", caption: "Supporto, controllo e magia divina." },
        { src: "/atlas/baldurs-gate-3/astarion.jpg", alt: "Astarion", caption: "Destrezza, furtività e precisione." },
        { src: "/atlas/baldurs-gate-3/laezel.jpg", alt: "Lae’zel", caption: "Pressione fisica in prima linea." },
        { src: "/atlas/baldurs-gate-3/gale.jpg", alt: "Gale", caption: "Magie e controllo dell’area." },
        { src: "/atlas/baldurs-gate-3/wyll.jpg", alt: "Wyll", caption: "Distanza, Carisma e versatilità." },
        { src: "/atlas/baldurs-gate-3/karlach.jpg", alt: "Karlach", caption: "Mobilità, resistenza e danno." },
      ],
      blocks: [
        {
          label: "Composizione", title: "Copri quattro bisogni, non quattro classi", text: "Non serve il gruppo classico, ma servono risposte a pressione, danno, controllo e utilità.",
          table: { columns: ["Bisogno", "Domanda", "Esempi"], rows: [
            ["Prima linea", "Chi ferma chi corre verso i fragili?", "Guerriero, Barbaro, Paladino, Druido"],
            ["Danno affidabile", "Chi elimina un bersaglio ferito senza spendere tutto?", "Ladro, Ranger, Guerriero, Warlock"],
            ["Controllo e supporto", "Chi riduce azioni nemiche o salva un alleato?", "Mago, Chierico, Bardo, Druido"],
            ["Utilità", "Chi parla, scassina, percepisce e raggiunge?", "Protagonista carismatico, Ladro, Bardo, magie di utilità"],
          ]},
        },
        {
          label: "Ordine del turno", title: "La sequenza sicura di una battaglia", text: "Prima di attaccare il bersaglio più vicino, leggi il campo.",
          steps: ["Esamina resistenze, altezza, baratri, superfici e accessi.", "Leggi l’iniziativa e scegli l’ordine degli alleati consecutivi.", "Crea vantaggio o controllo prima dell’attacco importante.", "Concentra il danno: un nemico eliminato perde il turno.", "Usa movimento e azione bonus; conserva una reazione utile.", "A fine round controlla esposizione, concentrazione e bersagli quasi sconfitti."],
        },
        {
          label: "Azioni", title: "Ogni turno ha più di un pulsante", text: "Azione, azione bonus, movimento e reazione sono risorse separate.",
          tips: ["Salta, spingi o bevi soltanto se migliora davvero il turno.", "Prima di curare, impedisci che il nemico abbatta subito lo stesso alleato.", "Una seconda magia di concentrazione interrompe la prima.", "Pergamene, frecce e pozioni sono strumenti, non souvenir."],
          mistakes: ["Entrare tutti dalla stessa porta.", "Spendere ogni risorsa nel primo scontro.", "Curare pochi danni lasciando libero il nemico più pericoloso."],
        },
        {
          label: "Emergenze", title: "Lo scontro sta andando male: cosa faccio?", text: "Individua la causa prima di ricaricare.",
          scenarios: [
            { problem: "Manco quasi ogni colpo", answer: "Esamina il bersaglio, rimuovi lo svantaggio, cerca vantaggio e usa bonus alla precisione." },
            { problem: "I nemici raggiungono il mago", answer: "Blocca il passaggio, crea terreno difficile e sposta l’incantatore prima della magia." },
            { problem: "Siamo circondati", answer: "Apri un varco eliminando il bersaglio più fragile e riposiziona tutti da quel lato." },
            { problem: "Un alleato è a terra", answer: "Controlla o allontana chi può abbatterlo di nuovo, poi rialzalo." },
            { problem: "Ho finito le risorse", answer: "Usa cantrip, attacchi base, pergamene e oggetti; se possibile ritirati e riposa." },
            { problem: "Il boss resiste a tutto", answer: "Esamina difese e tiri salvezza; cambia tipo di danno o caratteristica bersagliata." },
          ],
        },
        {
          label: "Compagni", title: "Cambiare gruppo senza perdere il filo", text: "Portare sempre gli stessi tre è comodo ma limita strumenti e prospettive.",
          steps: ["Parla all’accampamento dopo eventi importanti.", "Riequipaggia chi torna nel gruppo.", "Porta il compagno quando una missione richiama il suo passato.", "Correggi posizione e strumenti prima di scartare una composizione divertente."],
        },
      ],
    },
    {
      id: "exploration-growth", number: "03", label: "Mondo e crescita", estimatedRead: "15–18 min", spoiler: "No spoiler",
      title: "Esplorare senza perdere missioni, risorse e tempo",
      introduction: "Verticalità, riposi, inventario, dialoghi e progressione sono collegati. Questa pagina impedisce che l’esplorazione diventi una raccolta confusa di icone.",
      images: [
        { src: "/atlas/baldurs-gate-3/copertina.jpg", alt: "Mondo di Baldur’s Gate 3", caption: "Guarda sopra, sotto e dietro il percorso principale." },
        { src: "/atlas/baldurs-gate-3/creazione-personaggio-1.jpg", alt: "Origini del protagonista", caption: "Identità e competenze aprono risposte differenti." },
      ],
      blocks: [
        {
          label: "Routine", title: "Come leggere una nuova area", text: "Tratta ogni zona come un problema tridimensionale.",
          steps: ["Ruota la telecamera e cerca tetti, botole e accessi secondari.", "Slega un esploratore nelle zone pericolose.", "Prova salto, furtività, oggetti spostabili e magie di mobilità.", "Parla prima di combattere quando è possibile.", "Controlla il diario dopo ogni scoperta importante."],
        },
        {
          label: "Dialoghi", title: "Chi parla cambia il problema", text: "La conversazione usa caratteristiche, competenze, effetti e identità di chi la conduce.",
          scenarios: [
            { problem: "Voglio persuadere o ingannare", answer: "Avvicina per primo chi ha Carisma e competenza; applica bonus prima della prova." },
            { problem: "Temo di fallire", answer: "Salva se vuoi proteggere il tentativo, ma molti fallimenti aprono una strada diversa." },
            { problem: "Ha iniziato la persona sbagliata", answer: "Controlla comunque risposte di classe, incantesimi e competenze prima di ricaricare." },
            { problem: "Manca una risposta speciale", answer: "Cambia chi parla o torna dopo aver raccolto nuove informazioni." },
          ],
        },
        {
          label: "Riposi", title: "Recuperare e far vivere l’accampamento", text: "Il riposo non recupera soltanto salute: molte conversazioni avanzano all’accampamento.",
          table: { columns: ["Situazione", "Scelta", "Perché"], rows: [
            ["Danni moderati, risorse disponibili", "Riposo breve", "Recupera senza chiudere la giornata"],
            ["Slot e abilità importanti esauriti", "Riposo lungo", "Ripristina il piano completo"],
            ["Eventi narrativi recenti", "Visita l’accampamento", "Controlla nuove conversazioni"],
            ["Pericolo dichiarato immediato", "Verifica prima", "Alcune situazioni reagiscono al tempo"],
          ]},
          warning: "Se personaggi e diario descrivono un pericolo immediato, trattalo come tale prima di dormire.",
        },
        {
          label: "Inventario", title: "Non portare il magazzino sulla schiena", text: "Dividi per funzione e manda al campo ciò che non serve sul momento.",
          tips: ["Tieni cure, mobilità e una risposta d’emergenza su più personaggi.", "Invia al campo provviste e oggetti pesanti.", "Confronta gli oggetti con il ruolo, non con il prezzo.", "Distribuisci pergamene e frecce a chi può usarle bene."],
          mistakes: ["Vendere oggetti di missione senza capirli.", "Tenere tutte le pozioni su una persona.", "Indossare armature senza competenza."],
        },
        {
          label: "Livelli", title: "Crescere con un piano semplice", text: "Il livello massimo è 12: distribuire livelli senza uno scopo può ritardare capacità decisive.",
          steps: ["Conferma la caratteristica principale.", "Scegli talenti usati spesso.", "Prepara una risposta a distanza, una ravvicinata e una difensiva.", "Prova le nuove capacità prima di scartarle.", "Multiclasse solo se conosci vantaggio e costo della combinazione."],
        },
      ],
    },
    {
      id: "quests", number: "04", label: "Missioni e scelte", estimatedRead: "14–17 min", spoiler: "Spoiler protetti",
      title: "Chiedere aiuto senza rovinarsi la storia",
      introduction: "Soluzioni e conseguenze restano dietro avvisi volontari. Prima trovi il contesto sicuro, poi decidi se leggere oltre.",
      images: [
        { src: "/atlas/baldurs-gate-3/party.jpg", alt: "Compagni di Baldur’s Gate 3", caption: "Le missioni personali cambiano con presenza, dialoghi e decisioni." },
        { src: "/atlas/baldurs-gate-3/copertina.jpg", alt: "Avventura di Baldur’s Gate 3", caption: "Prima di avanzare: diario, campo, equipaggiamento e salvataggio separato." },
      ],
      blocks: [
        {
          label: "Anti-spoiler", title: "Tre livelli di aiuto", text: "Usa il livello minimo che ti rimette in movimento.",
          table: { columns: ["Livello", "Cosa mostra", "Quando usarlo"], rows: [
            ["Indizio", "Area, oggetto o persona da osservare", "Vuoi conservare la scoperta"],
            ["Procedura", "Passaggi senza anticipare l’esito", "Sai cosa vuoi ma non come attivarlo"],
            ["Conseguenza", "Esito e alternative", "Vuoi scegliere conoscendo gli effetti"],
          ]},
        },
        {
          label: "Punti delicati", title: "Prima di cambiare una grande area", text: "Quando il gioco avverte che stai avanzando, fermati e scegli cosa lasciare indietro.",
          steps: ["Crea un salvataggio manuale con il nome dell’area.", "Controlla missioni legate alla zona.", "Parla con i compagni e portali nelle missioni personali.", "Visita mercanti e sistema inventario.", "Completa ciò che vuoi davvero, non una lista per obbligo."],
        },
        {
          label: "Diagnosi", title: "La missione sembra bloccata", text: "Molti blocchi dipendono da contesto, persona o percorso, non da un bug.",
          scenarios: [
            { problem: "Il segnalino non porta a un ingresso", answer: "Cerca livelli verticali, sotterranei e accessi da zone adiacenti." },
            { problem: "Nessuna nuova opzione", answer: "Rileggi il diario, cambia chi parla e verifica oggetti o informazioni richieste." },
            { problem: "La missione sembra sparita", answer: "Controlla completate e stato dei personaggi: alcune scelte chiudono davvero percorsi." },
            { problem: "La battaglia è troppo difficile", answer: "Esplora altro, sali di livello, prepara terreno e cambia squadra." },
            { problem: "Non so quale scelta sia giusta", answer: "Segui i valori del protagonista; non esiste sempre un esito perfetto." },
          ],
        },
        {
          label: "Compagni", title: "Chi portare nelle missioni personali", text: "Se una missione richiama il passato o la fazione di un compagno, portarlo rende la scena più completa.",
          tips: ["Salva prima di confronti personali importanti.", "Leggi approvazione e disapprovazione come caratterizzazione.", "Non devi imitare i valori del compagno in ogni dialogo."],
        },
        {
          label: "Apri solo se vuoi", title: "Formato delle soluzioni complete", text: "Ogni futura soluzione conterrà prerequisiti, passaggi, alternative, ricompense e conseguenze.",
          spoilerDetails: { summary: "Mostra il formato delle future soluzioni protette", text: "Atto e area → requisiti → indizio minimo → procedura → bivio → conseguenze immediate → conseguenze successive. Nessuna risposta sarà presentata come moralmente obbligatoria." },
          warning: "Questa edizione costruisce il manuale dei sistemi. Le singole missioni verranno ampliate come schede consultabili, senza ridurre ogni scelta a due righe.",
        },
      ],
    },
  ],
  sources: [
    { label: "Pagina ufficiale su Steam", href: "https://store.steampowered.com/app/1086940/Baldurs_Gate_3/" },
    { label: "Larian · creazione del personaggio", href: "https://baldursgate3.game/news/community-update-8-character-creation_9" },
    { label: "Larian · combattimento e furtività", href: "https://baldursgate3.game/news/a-little-about-combat-stealth_3" },
    { label: "Larian · multiclasse", href: "https://baldursgate3.game/news/community-update-21-forging-your-legacy_77" },
    { label: "Larian · Patch 8", href: "https://baldursgate3.game/news/the-final-patch-new-subclasses-photo-mode-and-cross-play_138" },
  ],
}];

export function isGuideVipNow(guide: GameGuide, now = new Date()) {
  const instant = now.getTime();
  return instant >= Date.parse(guide.vipFrom) && instant < Date.parse(guide.publicAt);
}
export function isGuidePublicNow(guide: GameGuide, now = new Date()) { return now.getTime() >= Date.parse(guide.publicAt); }
export function getVipWeeklyGuide(now = new Date()) { return GAME_GUIDES.find((guide) => isGuideVipNow(guide, now)) ?? null; }
export function getPublicGameGuides(now = new Date()) { return GAME_GUIDES.filter((guide) => isGuidePublicNow(guide, now)); }
export function getGameGuideBySlug(slug: string) { return GAME_GUIDES.find((guide) => guide.slug === slug) ?? null; }
