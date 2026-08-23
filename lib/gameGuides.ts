import animalCrossingGuideJson from "@/data/animal-crossing-guide.json";
import minecraftGuideJson from "@/data/minecraft-guide.json";
import skyrimGuideJson from "@/data/skyrim-guide.json";
import worldOfWarcraftGuideJson from "@/data/world-of-warcraft-guide.json";
import { getScheduledGuideEditorialNews } from "@/lib/guideEditorial";

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
  iconSprite?: { src: string; position: string };
  chapterIds: string[];
};
export type GameGuide = {
  id: string; slug: string; code: string; game: string; title: string; subtitle: string;
  description: string; versionLabel: string; updatedAt: string; vipFrom: string; publicAt: string;
  theme?: "baldurs-gate" | "animal-crossing" | "minecraft" | "skyrim" | "world-of-warcraft";
  cover: GameGuideImage; storeUrl: string; storeLabel: string; chapters: GameGuideChapter[];
  sections?: GameGuideSection[];
  sources: Array<{ label: string; href: string }>;
  livingGuide?: {
    enabled: true;
    announcement: string;
    cadence: "monthly";
    lastCheckedAt: string;
    nextCheckAt: string;
    notificationTarget: string;
    approvalRequired: true;
    monitoredSourceUrls: string[];
  };
};

const animalCrossingGuide = animalCrossingGuideJson as GameGuide;
const minecraftGuide = minecraftGuideJson as GameGuide;
const skyrimGuide = skyrimGuideJson as GameGuide;
const worldOfWarcraftGuide = worldOfWarcraftGuideJson as GameGuide;

export const GAME_GUIDES: GameGuide[] = [animalCrossingGuide, {
  id: "bg3-complete-guide-01",
  slug: "baldurs-gate-3",
  code: "LW-ATLAS-BG3-001",
  game: "Baldur’s Gate 3",
  title: "Il quaderno dell’avventuriero",
  subtitle: "Una guida pratica di Baldur’s Gate 3 da consultare mentre giochi.",
  description: "Sedici capitoli da consultare durante la campagna: creazione, regole, classi, squadra, combattimento, magia, equipaggiamento, esplorazione, dialoghi, progressione, difficoltà, multiplayer e decisioni narrative. Ogni pagina parte da una situazione reale e indica cosa controllare, cosa fare e quali errori evitare.",
  versionLabel: "Patch 8 · verificata fino all’Hotfix 36",
  updatedAt: "23 agosto 2026",
  vipFrom: "2026-08-24T00:00:00+02:00",
  publicAt: "2026-08-31T00:00:00+02:00",
  cover: { src: "/atlas/baldurs-gate-3/copertina.webp", alt: "Copertina ufficiale di Baldur’s Gate 3 con il gruppo", caption: "Baldur’s Gate 3 · quaderno LoreWise" },
  theme: "baldurs-gate",
  storeUrl: "https://store.steampowered.com/app/1086940/Baldurs_Gate_3/",
  storeLabel: "Acquista il gioco su Steam",
  chapters: [
    {
      id: "character", number: "01", label: "Protagonista", estimatedRead: "12–15 min", spoiler: "No spoiler",
      title: "Partire con un personaggio che sai usare",
      introduction: "Non serve conoscere Dungeons & Dragons. Serve capire quale azione vuoi compiere più spesso, quale caratteristica la sostiene e chi parlerà per il gruppo.",
      images: [
        { src: "/atlas/baldurs-gate-3/official/official-02.webp", alt: "Protagonista Dragonide personalizzato", caption: "Il protagonista nasce dall’incontro tra identità, ruolo e modo di affrontare il mondo." },
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
        { src: "/atlas/baldurs-gate-3/official/official-03.webp", alt: "Quattro avventurieri osservano una valle", caption: "Una squadra funziona quando quattro capacità diverse guardano nella stessa direzione." },
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
        { src: "/atlas/baldurs-gate-3/official/official-01.webp", alt: "Esplorazione dall’alto della città di Baldur’s Gate", caption: "Guarda sopra, sotto e dietro il percorso principale: il mondo è costruito anche in verticale." },
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
        { src: "/atlas/baldurs-gate-3/official/official-04.webp", alt: "Shadowheart osserva un misterioso artefatto", caption: "Oggetti, presenze e decisioni possono trasformare una missione personale." },
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
    {
      id: "rules", number: "05", label: "Regole essenziali", estimatedRead: "13–16 min", spoiler: "No spoiler",
      title: "Capire dadi, prove e vantaggio senza studiare un manuale",
      introduction: "Quasi ogni risultato nasce da un tiro, un modificatore e una Classe Difficoltà. Leggere questi tre elementi permette di correggere un piano prima di attribuire tutto alla fortuna.",
      images: [{ src: "/atlas/baldurs-gate-3/official/official-11.webp", alt: "Interfaccia di combattimento contro uno Spettatore", caption: "Percentuali, iniziativa, condizioni e risorse spiegano perché un’azione può riuscire o fallire." }],
      blocks: [
        { label: "Formula pratica", title: "Che cosa decide davvero un tiro", text: "Il gioco somma al d20 il modificatore della caratteristica, l’eventuale bonus di competenza e altri effetti. Il totale deve raggiungere la Classe Difficoltà o la Classe Armatura del bersaglio.", table: { columns: ["Situazione", "Valore principale", "Prima verifica"], rows: [["Attacco con arma", "Forza o Destrezza, secondo l’arma", "Competenza e probabilità mostrata"], ["Incantesimo offensivo", "Caratteristica da incantatore", "Tiro per colpire oppure salvezza nemica"], ["Dialogo", "Caratteristica e competenza indicate", "Bonus disponibili prima di confermare"], ["Resistere a un effetto", "Tiro salvezza richiesto", "Caratteristica debole e vantaggio/svantaggio"]] }, tips: ["Passa il cursore sul risultato nel registro per vedere ogni bonus.", "Una probabilità bassa è un’informazione tattica, non un ordine di attaccare comunque."] },
        { label: "Vantaggio", title: "Due dadi, un risultato", text: "Con vantaggio si usa il migliore di due d20; con svantaggio il peggiore. Se vantaggio e svantaggio sono entrambi presenti si annullano.", steps: ["Cerca altezza, furtività, condizioni o abilità che concedono vantaggio.", "Rimuovi minacce, oscurità o gittata sfavorevole che impongono svantaggio.", "Controlla la concentrazione prima di lanciare un secondo effetto di supporto.", "Usa Ispirazione nei dialoghi decisivi, non nelle prove che puoi ripetere facilmente."], mistakes: ["Confondere il bonus numerico con il vantaggio.", "Spendere più risorse per accumulare effetti che non si sommano.", "Ignorare il registro di combattimento dopo un fallimento inatteso."] },
        { label: "Diagnosi", title: "Perché quella percentuale è così bassa?", text: "La scheda del bersaglio e il registro spiegano quasi sempre il problema.", scenarios: [{ problem: "L’arma usa la caratteristica sbagliata", answer: "Cambia arma o personaggio; un’arma Finesse può usare Destrezza se è migliore." }, { problem: "Il nemico ha una difesa molto alta", answer: "Cerca vantaggio, effetti che aumentano precisione o magie basate su un tiro salvezza debole." }, { problem: "La magia non produce l’effetto atteso", answer: "Controlla immunità, resistenza, concentrazione e caratteristica del tiro salvezza." }, { problem: "Il dialogo sembra impossibile", answer: "Cambia interlocutore, applica supporti e cerca una risposta legata a classe, razza o background." }] },
      ],
    },
    {
      id: "classes", number: "06", label: "Classi e sottoclassi", estimatedRead: "20–24 min", spoiler: "No spoiler",
      title: "Scegliere una classe per il turno che vuoi giocare",
      introduction: "Il livello massimo è 12. Patch 8 aggiunge una nuova sottoclasse a ciascuna delle dodici classi: la scelta migliore resta quella che rende chiaro il tuo compito nel gruppo.",
      images: [{ src: "/atlas/baldurs-gate-3/official/official-10.webp", alt: "Schermata ufficiale di selezione della sottoclasse", caption: "Classe e sottoclasse definiscono risorse, competenze e ritmo del turno." }],
      blocks: [
        { label: "Mappa rapida", title: "Le dodici classi in una domanda", text: "Usa il ruolo come punto di partenza, poi leggi le capacità ottenute ai prossimi due livelli prima di decidere.", table: { columns: ["Stile", "Classi da provare", "Risorsa da capire"], rows: [["Mischia resistente", "Barbaro, Guerriero, Paladino", "Ira, Azione Impetuosa, slot e Giuramento"], ["Mobilità e precisione", "Ladro, Ranger, Monaco", "Attacco furtivo, Marchio, Ki"], ["Magia offensiva", "Mago, Stregone, Warlock", "Preparazione, Metamagia, slot del Patto"], ["Supporto e controllo", "Chierico, Druido, Bardo", "Canalizzare Divinità, Forma Selvatica, Ispirazione"]] } },
        { label: "Patch 8", title: "Le dodici nuove sottoclassi", text: "L’aggiornamento finale introduce un’opzione nuova per ogni classe.", table: { columns: ["Classe", "Nuova sottoclasse", "Identità pratica"], rows: [["Barbaro", "Cammino del Gigante", "Taglia, lanci e pressione fisica"], ["Bardo", "Collegio del Fascino", "Controllo e comando sociale"], ["Chierico", "Dominio della Morte", "Necrosi e aggressione divina"], ["Druido", "Circolo delle Stelle", "Forme astrali e versatilità"], ["Guerriero", "Arciere Arcano", "Tiri speciali a distanza"], ["Monaco", "Via del Maestro Ubriaco", "Mobilità e colpi imprevedibili"], ["Paladino", "Giuramento della Corona", "Protezione e controllo del fronte"], ["Ranger", "Custode dello Sciame", "Movimento e sciame magico"], ["Ladro", "Spadaccino", "Duello mobile e iniziativa"], ["Stregone", "Magia dell’Ombra", "Oscurità e sopravvivenza"], ["Warlock", "Lama del Sortilegio", "Armi, maledizioni e Carisma"], ["Mago", "Cantore della Lama", "Magia e combattimento ravvicinato"]] } },
        { label: "Multiclasse", title: "Quando un secondo mestiere aiuta davvero", text: "Multiclassare scambia capacità di livello alto con sinergie anticipate. Prima di farlo, scrivi quale capacità vuoi ottenere e quale stai ritardando.", steps: ["Definisci il ruolo principale.", "Controlla le caratteristiche richieste dalle due classi.", "Confronta il prossimo livello della classe attuale con il primo della nuova.", "Verifica slot, competenze e caratteristica da incantatore.", "Conserva un salvataggio e prova il turno completo dopo il cambio."], warning: "Non multiclassare soltanto perché una combinazione è famosa: al livello massimo 12 ogni deviazione rinuncia a qualcosa." },
      ],
    },
    {
      id: "magic", number: "07", label: "Magia e concentrazione", estimatedRead: "16–20 min", spoiler: "No spoiler",
      title: "Lanciare meno magie inutili e mantenere quelle decisive",
      introduction: "Gli incantesimi differiscono per tiro per colpire, tiro salvezza, concentrazione, area e durata. La scelta corretta parte dalla difesa del bersaglio e dalla posizione del gruppo.",
      images: [{ src: "/atlas/baldurs-gate-3/official/official-14.webp", alt: "Un incantatore affronta un drago con la magia del fuoco", caption: "Bersaglio, posizione, elemento e risorse trasformano un incantesimo in una decisione." }],
      blocks: [
        { label: "Lettura", title: "Cinque righe da controllare prima del lancio", text: "Prima di spendere uno slot, verifica bersaglio, gittata, area, tiro richiesto e concentrazione.", steps: ["Esamina il nemico e individua difese o resistenze.", "Controlla se la magia colpisce alleati.", "Verifica se interromperà un’altra concentrazione.", "Confronta il risultato con un cantrip o un oggetto.", "Posiziona l’incantatore prima del lancio, non dopo."] },
        { label: "Concentrazione", title: "Proteggi l’effetto che sta vincendo lo scontro", text: "Un personaggio mantiene un solo incantesimo di concentrazione; subire danni può richiedere un tiro per non perderlo.", tips: ["Aumenta difesa e Costituzione di chi mantiene effetti importanti.", "Nasconditi, cerca copertura o allontanati dopo il lancio.", "Non sostituire automaticamente un buon controllo con pochi danni aggiuntivi.", "Termina volontariamente effetti pericolosi quando gli alleati devono attraversarli."] },
        { label: "Risorse", title: "Riposo breve, lungo e recuperi di classe", text: "La squadra funziona meglio quando le risorse vengono distribuite tra gli incontri.", table: { columns: ["Risorsa", "Recupero tipico", "Uso consigliato"], rows: [["Cantrip e attacchi base", "Sempre disponibili", "Turni a basso rischio"], ["Capacità da riposo breve", "Riposo breve", "Scontri intermedi"], ["Slot e capacità maggiori", "Riposo lungo", "Controllo, emergenze e battaglie importanti"], ["Pergamene e consumabili", "Oggetti finiti", "Colmare ciò che il gruppo non sa fare"]] } },
      ],
    },
    {
      id: "equipment", number: "08", label: "Equipaggiamento", estimatedRead: "14–18 min", spoiler: "No spoiler",
      title: "Valutare un oggetto dal ruolo, non dal colore",
      introduction: "Classe Armatura, competenza, caratteristica usata e condizioni attivate contano più della rarità isolata.",
      images: [{ src: "/atlas/baldurs-gate-3/official/official-05.webp", alt: "Avventuriero armato durante uno scontro", caption: "Armi, protezioni ed effetti funzionano soltanto quando sostengono il ruolo del personaggio." }],
      blocks: [
        { label: "Armi", title: "Chi può usarla e con quale valore", text: "Controlla competenza, proprietà, dado, gittata e azioni concesse dall’arma.", table: { columns: ["Domanda", "Se la risposta è no", "Correzione"], rows: [["Il personaggio è competente?", "Perde affidabilità", "Cambia arma o ottieni competenza"], ["Usa la caratteristica migliore?", "Precisione e danno calano", "Scegli proprietà e stile coerenti"], ["L’effetto si attiva davvero?", "Il bonus resta teorico", "Leggi condizione e frequenza"], ["Serve un’altra mano?", "Può bloccare scudo o seconda arma", "Confronta l’intero assetto"]] } },
        { label: "Difesa", title: "Classe Armatura non significa invulnerabilità", text: "Armatura, scudo, Destrezza e competenza determinano la difesa contro gli attacchi; molti effetti richiedono invece tiri salvezza.", tips: ["Non indossare armature senza competenza.", "Bilancia Classe Armatura, tiri salvezza, resistenze e posizione.", "Dai priorità alla concentrazione se il personaggio sostiene il gruppo.", "Confronta sempre l’oggetto nuovo con l’effetto che perderai."] },
        { label: "Set", title: "Costruire una catena di effetti leggibile", text: "Due oggetti coerenti sono spesso migliori di quattro bonus che si attivano in situazioni incompatibili.", steps: ["Scegli una condizione che il personaggio applica spesso.", "Aggiungi un oggetto che la crea in modo affidabile.", "Aggiungi un effetto che la sfrutta.", "Verifica il risultato in uno scontro normale.", "Rimuovi i pezzi che richiedono troppi turni di preparazione."] },
      ],
    },
    {
      id: "battlefield", number: "09", label: "Campo di battaglia", estimatedRead: "15–18 min", spoiler: "No spoiler",
      title: "Usare altezza, superfici e ambiente come una quinta persona",
      introduction: "Verticalità, linee di vista, strozzature, baratri e superfici trasformano lo stesso gruppo. Prima dell’iniziativa, leggi la stanza.",
      images: [{ src: "/atlas/baldurs-gate-3/official/official-12.webp", alt: "Esplosione ambientale durante un combattimento", caption: "Fuoco, ostacoli e posizione possono cambiare il campo prima ancora del prossimo turno." }],
      blocks: [
        { label: "Preparazione", title: "La scansione dei dieci secondi", text: "Una breve lettura evita di iniziare accerchiati.", steps: ["Individua altezza, porte, scale e vie di fuga.", "Conta i nemici visibili e cerca rinforzi.", "Separa chi deve raggiungere una posizione diversa.", "Sposta oggetti o chiudi accessi quando il gioco lo consente.", "Attiva la modalità a turni per sincronizzare azioni precise."] },
        { label: "Superfici", title: "Crea una conseguenza, non soltanto un’esplosione", text: "Acqua, fuoco, ghiaccio, elettricità e altri elementi modificano movimento, danni e sicurezza della zona.", tips: ["Controlla sempre se gli alleati attraverseranno l’area.", "Combina elementi soltanto se il secondo effetto migliora il piano.", "Usa strozzature per far valere più a lungo una superficie.", "Ricorda che contenitori, torce e oggetti possono cambiare il terreno."] },
        { label: "Posizione", title: "Quando spingere, saltare o ritirarsi", text: "Le azioni di movimento hanno valore quando negano un turno nemico o proteggono una risorsa importante.", scenarios: [{ problem: "Un nemico domina dall’alto", answer: "Rimuovilo, raggiungilo o spezza la linea di vista invece di accettare lo svantaggio." }, { problem: "Il gruppo entra da una sola porta", answer: "Crea una strozzatura controllata o trova un secondo accesso prima di avanzare." }, { problem: "Un alleato è isolato", answer: "Apri una via con salto, spinta, teletrasporto o controllo; non curarlo soltanto." }, { problem: "Un baratro è vicino", answer: "Valuta bottino e conseguenze prima di spingere: vincere può significare perdere oggetti." }] },
      ],
    },
    {
      id: "companions", number: "10", label: "Compagni e accampamento", estimatedRead: "17–21 min", spoiler: "Spoiler leggeri",
      title: "Far crescere il gruppo senza trasformarlo in una lista di approvazione",
      introduction: "I compagni portano ruoli, storie e reazioni differenti. L’accampamento è un luogo narrativo e gestionale, non soltanto il pulsante del riposo.",
      images: [{ src: "/atlas/baldurs-gate-3/official/official-07.webp", alt: "Karlach durante un momento della sua storia", caption: "Ogni compagno porta nel gruppo un ruolo, un passato e un modo diverso di reagire." }],
      blocks: [
        { label: "Rotazione", title: "Chi portare e quando cambiarlo", text: "Mantieni una base funzionale ma ruota chi possiede legami con la missione.", table: { columns: ["Esigenza", "Esempi di risposta", "Controllo"], rows: [["Prima linea", "Lae’zel, Karlach, Minthara", "Difesa e accesso al bersaglio"], ["Supporto e percezione", "Shadowheart, Halsin, Jaheira", "Magie preparate e Saggezza"], ["Furtività e serrature", "Astarion o protagonista competente", "Destrezza e strumenti"], ["Magia e dialoghi", "Gale, Wyll o protagonista carismatico", "Risorse e caratteristica sociale"]] } },
        { label: "Accampamento", title: "La routine dopo un evento importante", text: "Molte conversazioni compaiono dopo scoperte, conflitti o riposi.", steps: ["Parla con tutti dopo eventi di fazione o personali.", "Controlla simboli e nuove battute prima di dormire.", "Gestisci inventari anche dei compagni non attivi.", "Prepara il gruppo e gli incantesimi per il giorno seguente.", "Conserva un salvataggio prima di una serata chiaramente decisiva."] },
        { label: "Relazioni", title: "Approvazione non significa obbedienza", text: "Le reazioni descrivono i valori del compagno; non devi massimizzarle tutte né scegliere sempre ciò che vuole.", tips: ["Rispondi secondo il tuo personaggio e accetta qualche dissenso.", "Porta il compagno nelle scene che riguardano il suo passato.", "Non confondere amicizia, fiducia e romance.", "Rifiutare un’avance non impedisce di costruire un rapporto significativo."] },
      ],
    },
    {
      id: "inventory", number: "11", label: "Inventario ed economia", estimatedRead: "13–16 min", spoiler: "No spoiler",
      title: "Trovare ciò che serve prima che inizi il turno",
      introduction: "Peso, distribuzione, commercio, alchimia e consumabili diventano gestibili con poche categorie stabili.",
      images: [{ src: "/atlas/baldurs-gate-3/official/official-19.webp", alt: "Inventari affiancati di quattro membri del gruppo", caption: "Distribuisci equipaggiamento, consumabili e peso tra chi dovrà usarli davvero." }],
      blocks: [
        { label: "Ordine", title: "Quattro contenitori mentali", text: "Dividi ciò che raccogli per uso immediato, combattimento, vendita e campo.", steps: ["Tieni cure e mobilità su più personaggi.", "Assegna frecce, pergamene e granate a chi ha l’azione adatta.", "Invia provviste e oggetti pesanti al campo.", "Segna la merce soltanto dopo aver escluso missioni e sinergie.", "Controlla il peso prima di entrare in una zona ostile."] },
        { label: "Mercanti", title: "Comprare una soluzione, non svuotare il negozio", text: "Confronta ogni acquisto con un problema reale del gruppo.", tips: ["Usa il personaggio con condizioni commerciali migliori.", "Conserva oro per strumenti unici e consumabili difficili da sostituire.", "Non vendere equipaggiamento alternativo prima di provare una nuova composizione.", "Rivisita i mercanti dopo avanzamenti importanti."] },
        { label: "Alchimia", title: "Trasforma ingredienti in turni risparmiati", text: "Pozioni, elisir e rivestimenti sono più utili quando assegnati prima dello scontro.", table: { columns: ["Tipo", "Quando prepararlo", "Errore comune"], rows: [["Pozione", "Recupero o effetto immediato", "Tenerle tutte su un solo personaggio"], ["Elisir", "Prima di una giornata o battaglia importante", "Sovrascriverlo senza controllare"], ["Rivestimento", "Prima di una sequenza di attacchi con arma", "Applicarlo a chi lancerà magie"], ["Granata", "Gruppi, superfici o emergenze", "Colpire alleati o rompere concentrazione"]] } },
      ],
    },
    {
      id: "campaign", number: "12", label: "Percorso della campagna", estimatedRead: "12–15 min", spoiler: "Spoiler protetti",
      title: "Avanzare tra gli atti senza chiudere ciò che volevi vivere",
      introduction: "La campagna segnala alcuni passaggi importanti, ma non ogni conseguenza. Usa una verifica narrativa prima di cambiare regione.",
      images: [{ src: "/atlas/baldurs-gate-3/official/official-06.webp", alt: "Panorama della città di Baldur’s Gate", caption: "La campagna allarga progressivamente luoghi, relazioni e conseguenze delle scelte precedenti." }],
      blocks: [
        { label: "Senza spoiler", title: "La checklist prima di proseguire", text: "Quando compare un avviso di avanzamento, fermati e chiudi soltanto ciò che ti interessa davvero.", steps: ["Leggi missioni attive e completate.", "Esplora i bordi della mappa e i livelli verticali.", "Parla ai compagni e visita l’accampamento.", "Sistema mercanti, equipaggiamento e provviste.", "Crea un salvataggio manuale con area e data."] },
        { label: "Ritmo", title: "Non completare tutto per obbligo", text: "Il gioco è costruito per accettare percorsi diversi. Una campagna coerente vale più di una lista svuotata.", tips: ["Segui due o tre priorità del protagonista.", "Accetta che alcune strade si escludano.", "Usa una seconda campagna per scelte opposte.", "Non leggere conseguenze complete se ti basta un indizio."], spoilerDetails: { summary: "Mostra come proteggere i grandi bivi", text: "Crea un salvataggio prima degli avvisi di cambio regione e prima di decisioni che coinvolgono intere fazioni. Nominalo con luogo e intenzione, senza anticiparti l’esito." } },
      ],
    },
    {
      id: "dialogue", number: "13", label: "Dialoghi e conseguenze", estimatedRead: "15–19 min", spoiler: "Spoiler leggeri",
      title: "Entrare in una conversazione con più di una risposta possibile",
      introduction: "Identità, classe, razza, background, magie e informazioni raccolte possono cambiare le opzioni. Il miglior risultato non coincide sempre con il tiro più alto.",
      images: [{ src: "/atlas/baldurs-gate-3/official/official-08.webp", alt: "Personaggio durante una prova di dialogo", caption: "Carisma aiuta, ma identità, informazioni e competenze possono aprire risposte differenti." }],
      blocks: [
        { label: "Preparazione", title: "Prima di iniziare il dialogo", text: "Chi entra per primo spesso diventa l’interlocutore.", steps: ["Scegli chi deve parlare.", "Applica in anticipo gli effetti di supporto disponibili.", "Controlla Ispirazione e competenze.", "Raccogli documenti o testimonianze nelle vicinanze.", "Decidi se vuoi interpretare il fallimento oppure proteggere il tentativo."] },
        { label: "Scelte", title: "Persuasione non è sempre la via migliore", text: "Intimidazione, inganno, risposte di classe, silenzio o combattimento possono produrre conseguenze diverse.", scenarios: [{ problem: "Voglio evitare lo scontro", answer: "Cerca contesto, autorità, inganno o una via di uscita; non fissarti su una singola prova." }, { problem: "Ha parlato il compagno sbagliato", answer: "Prima di ricaricare, controlla risposte uniche e bonus disponibili." }, { problem: "Ho fallito una prova", answer: "Osserva la nuova situazione: molti fallimenti continuano la storia invece di bloccarla." }, { problem: "Non compare l’opzione attesa", answer: "Potrebbe dipendere da identità, informazioni, compagno presente o scelta precedente." }] },
        { label: "Spoiler", title: "Chiedere aiuto al livello giusto", text: "Cerca prima un’indicazione di luogo o requisito, poi una procedura e soltanto infine la conseguenza.", table: { columns: ["Livello", "Domanda utile", "Cosa preserva"], rows: [["Indizio", "Dove devo guardare?", "Scoperta"], ["Requisito", "Che cosa mi manca?", "Soluzione"], ["Procedura", "In quale ordine agisco?", "Esito"], ["Conseguenza", "Che cosa cambia dopo?", "Nulla: leggila consapevolmente"]] } },
      ],
    },
    {
      id: "difficulty", number: "14", label: "Difficoltà e salvataggi", estimatedRead: "14–18 min", spoiler: "No spoiler",
      title: "Scegliere la pressione giusta senza perdere il piacere della campagna",
      introduction: "Esploratore, Bilanciata, Tattica, Onore e Personalizzata rispondono a obiettivi diversi. Onore aggiunge azioni leggendarie ai boss e limita il ritorno ai salvataggi precedenti.",
      images: [{ src: "/atlas/baldurs-gate-3/official/official-17.webp", alt: "Primo piano di un drago durante uno scontro", caption: "La difficoltà migliore rende preparazione e decisioni importanti senza spezzare il piacere della campagna." }],
      blocks: [
        { label: "Scelta", title: "Quale modalità usare", text: "Scegli in base a conoscenza delle regole, tolleranza alla ripetizione e desiderio di sperimentare.", table: { columns: ["Obiettivo", "Modalità indicativa", "Aspettativa"], rows: [["Storia e apprendimento", "Esploratore", "Più spazio per capire sistemi e personaggi"], ["Prima esperienza completa", "Bilanciata", "Pressione regolare senza costruzioni specialistiche"], ["Tattica approfondita", "Tattica", "Nemici e risorse richiedono preparazione"], ["Campagna irreversibile", "Onore", "Boss modificati, azioni leggendarie e salvataggio limitato"], ["Regole su misura", "Personalizzata", "Parametri adattati al tipo di esperienza"]] } },
        { label: "Onore", title: "Prepararsi prima di premere Nuova partita", text: "La modalità Onore aumenta la difficoltà dentro e fuori dal combattimento e modifica oltre trenta battaglie con boss.", steps: ["Completa prima una campagna o una parte sostanziale in Tattica.", "Porta vie di fuga, invisibilità e mobilità.", "Esamina ogni boss prima di agire.", "Non affidare un intero piano a un unico tiro.", "Accetta la conseguenza come parte della storia."], warning: "Onore disabilita il normale caricamento dei salvataggi precedenti: non è la modalità adatta per provare liberamente ogni diramazione." },
        { label: "Salvataggi", title: "Una cronologia che racconta dove eri", text: "Fuori da Onore, usa salvataggi manuali leggibili invece di sovrascrivere sempre lo stesso.", tips: ["Nome: area · decisione · livello.", "Mantieni un salvataggio prima di ogni cambio regione.", "Conserva una copia prima di installare o rimuovere mod.", "Distingui il salvataggio di prova da quello della campagna principale."] },
      ],
    },
    {
      id: "multiplayer", number: "15", label: "Multiplayer, cross-play e mod", estimatedRead: "13–17 min", spoiler: "No spoiler",
      title: "Condividere una campagna senza rompere gruppo o salvataggio",
      introduction: "Patch 8 abilita cross-play e progressione multipiattaforma tra PC, Mac, Xbox e PlayStation 5 tramite Larian Network. Le mod devono coincidere tra i partecipanti.",
      images: [{ src: "/atlas/baldurs-gate-3/official/official-15.webp", alt: "Quattro avventurieri esplorano insieme una grande forgia", caption: "Una campagna condivisa funziona quando il gruppo concorda ruoli, ritmo e responsabilità." }],
      blocks: [
        { label: "Sessione", title: "Il patto prima della prima partita", text: "Le scelte condivise funzionano meglio quando il gruppo chiarisce aspettative e responsabilità.", steps: ["Scegliete host e frequenza delle sessioni.", "Concordate tono, spoiler e libertà nei dialoghi.", "Assegnate personaggi, inventari e ruoli fuori dal combattimento.", "Decidete chi avvia conversazioni e cambi regione.", "Create un salvataggio manuale alla fine di ogni sessione."] },
        { label: "Cross-play", title: "Creare e raggiungere una lobby", text: "Abilita cross-play, usa gli amici del Larian Network e verifica che il salvataggio esistente consenta la funzione.", steps: ["Dal menu Multiplayer seleziona Cross-Play.", "Crea la lobby e imposta le opzioni.", "Aggiungi o invita gli amici Larian.", "Per un salvataggio esistente, abilita cross-play dalla schermata Carica partita.", "Se compare la verifica mod, allinea versioni e stato prima di entrare."] },
        { label: "Mod", title: "Proteggere compatibilità e obiettivi", text: "Il gestore integrato aiuta a sincronizzare download, attivazione e versioni; le mod disabilitano gli obiettivi della piattaforma.", tips: ["Usate tutti lo stesso elenco e le stesse versioni.", "Non rimuovete mod da una campagna senza leggere le conseguenze.", "Conservate una copia non modificata del salvataggio.", "Su console e Mac usate soltanto mod approvate e disponibili per la piattaforma."], warning: "Un disallineamento di mod può impedire l’accesso alla lobby o rendere incompatibile il salvataggio multipiattaforma." },
      ],
    },
    {
      id: "final-checklist", number: "16", label: "Checklist e assistenza", estimatedRead: "10–13 min", spoiler: "No spoiler",
      title: "La pagina da aprire quando non sai più che cosa controllare",
      introduction: "Questa diagnosi finale riunisce i controlli che risolvono la maggior parte dei problemi di gioco, progressione e compatibilità senza anticipare la trama.",
      images: [{ src: "/atlas/baldurs-gate-3/official/official-13.webp", alt: "Corruzione illithid invade il campo di battaglia", caption: "Quando tutto sembra fuori controllo: osserva il sistema, individua la causa e correggi una variabile alla volta." }],
      blocks: [
        { label: "Combattimento", title: "Checklist del turno bloccato", text: "Fermati prima di ricaricare.", steps: ["Esamina bersaglio e registro.", "Controlla azione, bonus, movimento e reazione.", "Verifica vantaggio, svantaggio e concentrazione.", "Cerca altezza, copertura, superfici e vie di fuga.", "Distribuisci il danno per eliminare almeno un turno nemico."] },
        { label: "Esplorazione", title: "Checklist della missione ferma", text: "La soluzione può trovarsi sopra, sotto o in una conversazione già aperta.", steps: ["Rileggi diario e obiettivi completati.", "Ruota la telecamera e cambia livello verticale.", "Cambia il personaggio che percepisce o parla.", "Controlla oggetti di missione e documenti.", "Visita l’accampamento e parla ai compagni."] },
        { label: "Tecnica", title: "Checklist dell’edizione corrente", text: "La guida considera Patch 8 e le correzioni ufficiali fino all’Hotfix 36.", scenarios: [{ problem: "Una funzione descritta non compare", answer: "Controlla versione nel menu principale, piattaforma e stato degli aggiornamenti." }, { problem: "Un salvataggio moddato non parte", answer: "Apri la finestra di verifica e ripristina elenco, ordine e versioni richieste." }, { problem: "Il cross-play non collega il gruppo", answer: "Verifica Larian Network, cross-play sul salvataggio e corrispondenza delle mod." }, { problem: "Steam Deck usa vecchi percorsi o impostazioni", answer: "Dall’Hotfix 34 esiste una build nativa: controlla sincronizzazione cloud e cartelle della versione scelta." }] },
        { label: "Prima di avanzare", title: "La checklist completa in dodici righe", text: "Usala prima di un cambio regione o di una lunga sessione.", steps: ["Versione aggiornata e mod allineate.", "Salvataggio manuale riconoscibile.", "Missioni attive rilette.", "Compagni ascoltati al campo.", "Gruppo con prima linea, danno, controllo e utilità.", "Armi e armature con competenza.", "Incantesimi preparati e concentrazione compresa.", "Cure e mobilità distribuite.", "Inventario sotto il limite di peso.", "Provviste sufficienti.", "Vie alternative esplorate.", "Spoiler aperti soltanto al livello necessario."] },
      ],
    },
  ],
  sections: [
    { id: "begin", label: "Inizia bene", summary: "Personaggio, regole e classi per costruire una base leggibile.", icon: { src: "/atlas/baldurs-gate-3/creazione-personaggio-1.webp", alt: "Creazione del personaggio", caption: "Dalla prima scelta al primo tiro." }, iconSprite: { src: "/atlas/baldurs-gate-3/guide-section-icons-v1.webp", position: "0% 0%" }, chapterIds: ["character", "rules", "classes"] },
    { id: "combat", label: "Combatti con un piano", summary: "Squadra, magia, equipaggiamento e ambiente nello stesso turno.", icon: { src: "/atlas/baldurs-gate-3/party.webp", alt: "Gruppo in battaglia", caption: "Quattro persone, un solo piano." }, iconSprite: { src: "/atlas/baldurs-gate-3/guide-section-icons-v1.webp", position: "50% 0%" }, chapterIds: ["party-combat", "magic", "equipment", "battlefield"] },
    { id: "world", label: "Vivi il mondo", summary: "Esplorazione, compagni, inventario e ritmo della campagna.", icon: { src: "/atlas/baldurs-gate-3/shadowheart.webp", alt: "Compagna di viaggio", caption: "Il mondo reagisce a chi porti con te." }, iconSprite: { src: "/atlas/baldurs-gate-3/guide-section-icons-v1.webp", position: "100% 0%" }, chapterIds: ["exploration-growth", "companions", "inventory", "campaign"] },
    { id: "choices", label: "Proteggi le scelte", summary: "Dialoghi, missioni e aiuti graduati senza rovinare la storia.", icon: { src: "/atlas/baldurs-gate-3/wyll.webp", alt: "Eroe in dialogo", caption: "Contesto prima della conseguenza." }, iconSprite: { src: "/atlas/baldurs-gate-3/guide-section-icons-v1.webp", position: "0% 100%" }, chapterIds: ["quests", "dialogue"] },
    { id: "modes", label: "Configura l’esperienza", summary: "Difficoltà, salvataggi, multiplayer, cross-play e mod.", icon: { src: "/atlas/baldurs-gate-3/karlach.webp", alt: "Avventuriera pronta allo scontro", caption: "La pressione giusta per la tua campagna." }, iconSprite: { src: "/atlas/baldurs-gate-3/guide-section-icons-v1.webp", position: "50% 100%" }, chapterIds: ["difficulty", "multiplayer"] },
    { id: "check", label: "Risolvi un blocco", summary: "Una checklist finale per capire che cosa controllare prima di cercare spoiler.", icon: { src: "/atlas/baldurs-gate-3/copertina.webp", alt: "Copertina di Baldur’s Gate 3", caption: "Diagnosi rapida della campagna." }, iconSprite: { src: "/atlas/baldurs-gate-3/guide-section-icons-v1.webp", position: "100% 100%" }, chapterIds: ["final-checklist"] },
  ],
  sources: [
    { label: "Pagina ufficiale su Steam", href: "https://store.steampowered.com/app/1086940/Baldurs_Gate_3/" },
    { label: "Larian · creazione del personaggio", href: "https://baldursgate3.game/news/community-update-8-character-creation_9" },
    { label: "Larian · combattimento e furtività", href: "https://baldursgate3.game/news/a-little-about-combat-stealth_3" },
    { label: "Larian · multiclasse", href: "https://baldursgate3.game/news/community-update-21-forging-your-legacy_77" },
    { label: "Larian · Patch 8", href: "https://baldursgate3.game/news/the-final-patch-new-subclasses-photo-mode-and-cross-play_138" },
    { label: "Larian · livello 12, razze e lancio", href: "https://baldursgate3.game/news/community-update-20-a-dragonborn-a-half-orc-a-monk-walk-into-a-tavern_76" },
    { label: "Larian · modalità Onore e Personalizzata", href: "https://baldursgate3.game/news/community-update-25-ain-t-no-party-like-a-withers-party_100" },
    { label: "Larian · gestore mod e compatibilità", href: "https://baldursgate3.game/news/community-update-29-playing-with-mods_124" },
    { label: "Larian · Steam Deck nativo e Hotfix 34", href: "https://baldursgate3.game/news/hotfix-34-now-live_144" },
    { label: "Larian · archivio aggiornamenti fino all’Hotfix 36", href: "https://baldursgate3.game/news" },
  ],
}, minecraftGuide, skyrimGuide, worldOfWarcraftGuide];

export function isGuideVipNow(guide: GameGuide, now = new Date()) {
  const instant = now.getTime();
  return instant >= Date.parse(guide.vipFrom) && instant < Date.parse(guide.publicAt);
}
export function isGuidePublicNow(guide: GameGuide, now = new Date()) { return now.getTime() >= Date.parse(guide.publicAt); }
export function getVipWeeklyGuide(now = new Date()) { return GAME_GUIDES.find((guide) => isGuideVipNow(guide, now)) ?? null; }
export function getPublicGameGuides(now = new Date()) { return GAME_GUIDES.filter((guide) => isGuidePublicNow(guide, now)); }
export function getGameGuideBySlug(slug: string) { return GAME_GUIDES.find((guide) => guide.slug === slug) ?? null; }

export type GuideEditorialNews = {
  current: GameGuide | null;
  next: GameGuide | null;
  latestPublic: GameGuide | null;
};

/**
 * Editorial rule: every guide is announced from its VIP Monday and the next
 * scheduled guide is previewed from the same calendar. Adding a guide to
 * GAME_GUIDES is therefore enough to update the Nexus news automatically.
 */
export function getGuideEditorialNews(now = new Date()): GuideEditorialNews {
  return getScheduledGuideEditorialNews(GAME_GUIDES, now);
}
