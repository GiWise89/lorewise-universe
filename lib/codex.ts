import generatedOriginalDossiers from "../data/codex/original-dossiers.generated.json" with { type: "json" };
import generatedThirdPartyDossiers from "../data/codex/third-party-dossiers.generated.json" with { type: "json" };

export type CodexVerification = "verified" | "partial" | "to-document" | "editorial";

export type CodexSource = {
  id: string;
  title: string;
  kind: "primary" | "project" | "visual" | "authorial";
  location: string;
  note: string;
};

export type SourcedValue = {
  value: string;
  status: CodexVerification;
  sourceIds?: string[];
};

export type CodexFact = SourcedValue & { label: string };

export type CodexRelationship = {
  name: string;
  type: string;
  description: string;
  status: CodexVerification;
  sourceIds: string[];
  linkedSlug?: string;
};

export type CodexChronologyEntry = {
  title: string;
  description: string;
  spoiler: "none" | "moderate" | "major";
  sourceIds: string[];
};

export type CodexAppearance = {
  title: string;
  format: string;
  role: string;
  year: string;
  status: CodexVerification;
  sourceIds: string[];
};

export type CodexEntry = {
  slug: string;
  name: string;
  displayTitle: string;
  catalog: {
    category: string;
    universe: string;
    work: string;
    continuity: string;
    origin: "giwise-original" | "documented-third-party";
    dossierStatus: "complete" | "in-review";
  };
  image: { src: string; alt: string; credit: string; width: number; height: number };
  gallery?: Array<{ src: string; alt: string; caption: string; width: number; height: number }>;
  summary: SourcedValue;
  identity: CodexFact[];
  narrative: CodexFact[];
  biography: {
    spoilerFree: SourcedValue;
    paragraphs: Array<SourcedValue & { heading: string }>;
    chronology: CodexChronologyEntry[];
  };
  personality: {
    profile: SourcedValue;
    facts: CodexFact[];
  };
  appearanceAndAbilities: {
    description: SourcedValue;
    facts: CodexFact[];
    powers: Array<SourcedValue & { name: string }>;
    limitations: Array<SourcedValue & { name: string }>;
  };
  relationships: CodexRelationship[];
  production: {
    appearances: CodexAppearance[];
    facts: CodexFact[];
  };
  giwiseModule?: {
    canonStatus: SourcedValue;
    concept: SourcedValue;
    gameplayProfile: CodexFact[];
  };
  editorial: {
    verificationLabel: string;
    lastReviewed: string;
    editor: string;
    researchScope?: string;
    sourcePolicy?: string;
    contentWarnings: string[];
    missingFields: string[];
    sources: CodexSource[];
  };
  searchTerms: string[];
};

const verified = (value: string, sourceIds: string[]): SourcedValue => ({ value, status: "verified", sourceIds });
const authored = (value: string): SourcedValue => ({ value, status: "editorial", sourceIds: ["codex-authorial"] });
const fact = (label: string, data: SourcedValue): CodexFact => ({ label, ...data });

export const codexCategories = [
  "Cinema",
  "Serie TV",
  "Animazione",
  "Anime",
  "Manga",
  "Fumetti",
  "Videogiochi",
  "Letteratura",
  "Persone e cultura",
  "Scienza e natura",
  "Storia e religioni",
  "Miti e folklore",
  "Illustrazioni fan art",
  "Universi originali GiWise Studio",
] as const;

const curatedCodexEntries: CodexEntry[] = [
  {
    slug: "nhevara-madreferita",
    name: "Nhevara",
    displayTitle: "Nhevara, Madreferita",
    catalog: {
      category: "Universi originali GiWise Studio",
      universe: "The Wound Remembers",
      work: "The Wound Remembers",
      continuity: "Canone principale del videogioco",
      origin: "giwise-original",
      dossierStatus: "complete",
    },
    image: {
      src: "/codex/characters/nhevara.webp",
      alt: "Ritratto completo di Nhevara, Madreferita",
      credit: "Asset del progetto The Wound Remembers · GiWise Studio",
      width: 1200,
      height: 1500,
    },
    summary: verified(
      "Ultima custode capace di ascoltare il sangue senza esserne divorata. La Ferita la riconosce, ma non ha ancora rivelato perché.",
      ["twr-lore"],
    ),
    identity: [
      fact("Nome", verified("Nhevara", ["twr-lore", "twr-factions"])),
      fact("Titolo", verified("Madreferita", ["twr-lore"])),
      fact("Nome originale", verified("Nhevara", ["twr-lore"])),
      fact("Specie", authored("Umana trasfigurata del Sangue Cavo")),
      fact("Genere e pronomi", authored("Femminile · lei")),
      fact("Data di nascita", authored("13 della Luna Cava, anno 417 del Patto")),
      fact("Età", authored("31 anni")),
      fact("Luogo di nascita", authored("Cripta delle Sette Vene, sotto il Santuario del Sangue Cavo")),
      fact("Provenienza", verified("Santuario del Sangue Cavo", ["twr-campaign"])),
      fact("Occupazione o ruolo", verified("Custode e Viandante", ["twr-lore", "twr-campaign"])),
      fact("Stato", authored("Viva · in viaggio oltre le Porte")),
    ],
    narrative: [
      fact("Universo", verified("The Wound Remembers", ["twr-lore"])),
      fact("Opera d’origine", verified("The Wound Remembers", ["twr-lore", "twr-factions"])),
      fact("Categoria", verified("Universi originali GiWise Studio", ["twr-integration"])),
      fact("Formato", verified("Videogioco · dark fantasy card RPG", ["twr-integration"])),
      fact("Fazione", verified("Sangue Cavo", ["twr-factions"])),
      fact("Ruolo narrativo", verified("Protagonista e leader di fazione", ["twr-factions", "twr-campaign"])),
      fact("Continuità", verified("Canone principale del videogioco", ["twr-campaign"])),
      fact("Prima apparizione", authored("The Wound Remembers · 2026")),
      fact("Creatore", verified("GiWise Studio", ["twr-integration"])),
      fact("Profilo morale e narrativo", authored("Anti-eroina custode · pragmatica, compassionevole e disposta al sacrificio")),
    ],
    biography: {
      spoilerFree: verified(
        "Nhevara guida il Sangue Cavo ed è l’ultima custode conosciuta capace di ascoltare il sangue senza esserne consumata. Quando una ferita antica ricomincia a ricordare, interpreta i suoi segnali e intraprende un viaggio attraverso le Porte.",
        ["twr-lore", "twr-campaign"],
      ),
      paragraphs: [
        {
          heading: "La figlia senza nome",
          ...authored(
            "Nhevara nasce nella Cripta delle Sette Vene durante una notte in cui il Santuario smette di pulsare. Secondo l'usanza del Sangue Cavo, riceve un nome soltanto dopo essere sopravvissuta al primo ascolto della coppa rituale. Il sangue pronuncia per lei una parola dimenticata: Nhevara, colei che restituisce ciò che la memoria ha sepolto.",
          ),
        },
        {
          heading: "Il Patto Cavo",
          ...verified(
            "I predecessori di Nhevara sacrificarono i propri nomi per sigillare la Prima Porta. La sua appartenenza al Sangue Cavo la lega quindi a un’eredità costruita su perdita, memoria e sacrificio.",
            ["twr-lore"],
          ),
        },
        {
          heading: "Il richiamo della Ferita",
          ...verified(
            "Nel Santuario del Sangue Cavo, il sangue custodito nella sua coppa comincia a risalire le pareti e indica la ferita che lo ha generato. Nhevara comprende che dietro la Prima Porta non si trova soltanto una prigione, ma qualcosa capace di sognare.",
            ["twr-campaign"],
          ),
        },
        {
          heading: "Oltre la Prima Porta",
          ...verified(
            "Insieme a Kharvoss attraversa la Prima Porta, affronta il Pozzo dei Nomi e raggiunge la Cattedrale del Respiro Nero. Il viaggio rivela progressivamente che le Porte non proteggono il mondo da un singolo prigioniero, ma da una strada.",
            ["twr-lore", "twr-campaign", "twr-extended-campaign"],
          ),
        },
        {
          heading: "Il peso della Madreferita",
          ...authored(
            "Il titolo di Madreferita non indica una sovrana, ma la custode incaricata di accogliere i ricordi espulsi dalla Ferita. Ogni memoria ascoltata lascia sul suo corpo una bruciatura e consuma una parte del suo nome. Nhevara continua il viaggio per spezzare questo ciclo senza cancellare le vite che esso ha protetto.",
          ),
        },
      ],
      chronology: [
        { title: "La nascita nella Cripta", description: "Nhevara nasce durante il Silenzio delle Sette Vene e riceve il proprio nome dal primo ascolto del sangue.", spoiler: "moderate", sourceIds: ["codex-authorial"] },
        { title: "L'investitura della Madreferita", description: "Sopravvive al rito della coppa e assume il compito di custodire le memorie respinte dalla Ferita.", spoiler: "moderate", sourceIds: ["codex-authorial"] },
        { title: "Il Patto Cavo", description: "I predecessori di Nhevara sacrificano i propri nomi per sigillare la Prima Porta.", spoiler: "moderate", sourceIds: ["twr-lore"] },
        { title: "Il Risveglio Ossafame", description: "Il battito sotto la Cripta ricomincia e dà inizio alla campagna.", spoiler: "moderate", sourceIds: ["twr-lore"] },
        { title: "La Restituzione dei Nomi", description: "Nhevara e Kharvoss attraversano la Prima Porta e scoprono il progetto del Coro Inverso.", spoiler: "major", sourceIds: ["twr-lore"] },
        { title: "Il Terzo Canto", description: "Nhevara raggiunge la Cattedrale del Respiro Nero e affronta Syr Vhal.", spoiler: "major", sourceIds: ["twr-lore"] },
      ],
    },
    personality: {
      profile: authored("Nhevara è lucida, risoluta e capace di ascoltare prima di giudicare. La sua calma non nasce dall'assenza di paura, ma dalla disciplina con cui impedisce ai ricordi altrui di sopraffarla. Protegge le persone più delle istituzioni e diffida di ogni tradizione che trasformi il sacrificio in un obbligo."),
      facts: [
        fact("Ideali e valori", authored("Memoria, libertà di scelta, responsabilità verso chi non può difendersi")),
        fact("Motivazioni", authored("Comprendere perché la Ferita la riconosce e impedire che il Coro Inverso apra l'intera strada tra le Porte")),
        fact("Paure", authored("Perdere il proprio nome, diventare una voce della Ferita e ripetere il sacrificio imposto ai predecessori")),
        fact("Pregi", authored("Empatia, autocontrollo, coraggio rituale e capacità di leggere le intenzioni nascoste")),
        fact("Difetti", authored("Segretezza, ostinazione, sfiducia verso l'autorità e tendenza a caricarsi da sola ogni costo")),
        fact("Obiettivo", authored("Chiudere la strada oltre le Porte senza cancellare le memorie che vi sono imprigionate")),
        fact("Simboli associati", authored("Coppa rituale, filo reciso, sangue ascendente e tre Porte concentriche")),
      ],
    },
    appearanceAndAbilities: {
      description: authored("La trasfigurazione del Sangue Cavo ha lasciato su Nhevara corna nere, capelli divenuti bianchi durante il rito e un'ala rituale composta da piume mineralizzate. L'armatura cremisi protegge le cicatrici attraverso cui il sangue parla e mantiene separate le memorie che porta con sé."),
      facts: [
        fact("Segni distintivi", authored("Corna d'ossidiana, capelli bianchi, ala rituale iridescente e cicatrici cremisi sulle braccia")),
        fact("Abbigliamento", authored("Armatura votiva nera con piume mineralizzate e inserti del Sangue Cavo")),
        fact("Equipaggiamento", authored("Lama Venaria, Coppa del Primo Patto e filo mnemonico da viandante")),
        fact("Forme alternative", authored("Risonanza della Ferita · stato temporaneo in cui l'ala si dispiega e le cicatrici diventano luminose")),
      ],
      powers: [
        { name: "Ascolto del sangue", ...verified("Capacità di ascoltare il sangue senza esserne divorata.", ["twr-lore"]) },
        { name: "Fornace del Sangue", ...verified("Rito caratteristico della fazione Sangue Cavo; il suo funzionamento ludico è documentato separatamente dal canone narrativo.", ["twr-factions"]) },
      ],
      limitations: [
        { name: "Sovraccarico mnemonico", ...authored("Ogni ascolto prolungato confonde i suoi ricordi con quelli contenuti nel sangue; senza riposo può dimenticare volti, luoghi e parti del proprio nome.") },
        { name: "Costo del patto", ...authored("I riti più potenti richiedono il suo sangue e lasciano bruciature permanenti. La Risonanza non può essere mantenuta senza rischiare di diventare una bocca della Ferita.") },
      ],
    },
    relationships: [
      { name: "Kharvoss", type: "Compagno di viaggio", description: "Attraversa con Nhevara la Prima Porta e prosegue il cammino attraverso il Pozzo e la Cattedrale.", status: "verified", sourceIds: ["twr-lore", "twr-campaign"], linkedSlug: "kharvoss-re-sepolto" },
      { name: "I predecessori del Sangue Cavo", type: "Eredità", description: "Sacrificarono i propri nomi per sigillare la Prima Porta.", status: "verified", sourceIds: ["twr-lore"] },
      { name: "Vakun", type: "Antagonista", description: "Antico guardiano della Cripta Ossafame, legato al risveglio della Prima Porta.", status: "verified", sourceIds: ["twr-lore", "twr-campaign"] },
      { name: "Orveth", type: "Antagonista", description: "Custode incontrato presso il Pozzo dei Nomi.", status: "verified", sourceIds: ["twr-campaign"] },
      { name: "Syr Vhal", type: "Antagonista", description: "Figura centrale del Terzo Canto nella Cattedrale del Respiro Nero.", status: "verified", sourceIds: ["twr-lore", "twr-campaign"] },
      { name: "La Ferita", type: "Legame originario", description: "La riconosce perché Nhevara custodisce una scheggia dell'ultima memoria integra della persona che la generò; Nhevara ne avverte la presenza, ma non ne conosce ancora l'identità.", status: "editorial", sourceIds: ["twr-lore", "codex-authorial"] },
    ],
    production: {
      appearances: [
        { title: "The Wound Remembers", format: "Videogioco", role: "Personaggio principale e leader del Sangue Cavo", year: "2026", status: "editorial", sourceIds: ["twr-lore", "twr-factions", "codex-authorial"] },
        { title: "Fuori Trama Next", format: "Videogioco · integrazione cross-universe", role: "Personaggio integrato nel Codice del Nexus", year: "2026", status: "verified", sourceIds: ["twr-integration"] },
      ],
      facts: [
        fact("Ideazione", verified("GiWise Studio", ["twr-integration"])),
        fact("Sviluppo", verified("GiWise Studio", ["twr-integration"])),
        fact("Doppiaggio", authored("Non previsto nella versione attuale")),
        fact("Motion capture", authored("Non utilizzato")),
        fact("Evoluzione del design", authored("Dalla figura di custode rituale alla silhouette della Madreferita: corna, ala mineralizzata e armatura cremisi rendono visibile il prezzo dell'ascolto")),
      ],
    },
    giwiseModule: {
      canonStatus: verified("Personaggio originale canonico di The Wound Remembers", ["twr-lore", "twr-factions"]),
      concept: verified("Leader del Sangue Cavo: perdita volontaria, sangue, Bruciatura e potere ottenuto pagando con la carne.", ["twr-factions"]),
      gameplayProfile: [
        fact("Fazione giocabile", verified("Sangue Cavo", ["twr-factions"])),
        fact("Mazzo", verified("Patto di Nhevara", ["twr-factions"])),
        fact("Rito", verified("Fornace del Sangue", ["twr-factions"])),
        fact("Identità ludica", verified("Sacrifici, danno diretto e Bruciatura", ["twr-factions"])),
      ],
    },
    editorial: {
      verificationLabel: "Scheda completa · lore originale GiWise Studio",
      lastReviewed: "19/08/2026",
      editor: "LoreWise Universe · GiWise Studio",
      contentWarnings: ["Dark fantasy", "Sangue", "Sacrificio", "Immaginario horror"],
      missingFields: [],
      sources: [
        { id: "twr-lore", title: "Archivio narrativo di The Wound Remembers", kind: "primary", location: "src/game/lore.ts", note: "Titolo, ruolo, cronologia e legame con la Ferita." },
        { id: "twr-factions", title: "Definizione della fazione Sangue Cavo", kind: "primary", location: "src/game/factions.ts", note: "Leadership, rito, identità narrativa e profilo di gioco." },
        { id: "twr-campaign", title: "Campagna principale", kind: "primary", location: "src/game/campaign.ts", note: "Azioni, dialoghi, luoghi e rapporti narrativi." },
        { id: "twr-extended-campaign", title: "Campagna estesa", kind: "primary", location: "src/game/extendedCampaign.ts", note: "Sviluppi successivi del viaggio attraverso le Porte." },
        { id: "twr-integration", title: "Integrazione Fuori Trama Next", kind: "project", location: "src/data/characters.json", note: "Identità del progetto, immagine e collegamento cross-universe." },
        { id: "nhevara-visual", title: "Ritratto ufficiale di Nhevara", kind: "visual", location: "public/assets/leaders/nhevara.webp", note: "Riferimento esclusivamente visivo." },
        { id: "codex-authorial", title: "Lore originale sviluppata per LoreWise Codex", kind: "authorial", location: "LoreWise Universe · scheda Nhevara", note: "Espansione narrativa autorizzata dal creatore del personaggio e costruita in coerenza con il materiale primario." },
      ],
    },
    searchTerms: ["Nhevara", "Madreferita", "The Wound Remembers", "Sangue Cavo", "Fornace del Sangue", "GiWise Studio", "custode", "viandante"],
  },
  {
    slug: "kharvoss-re-sepolto",
    name: "Kharvoss",
    displayTitle: "Kharvoss, Re Sepolto",
    catalog: {
      category: "Universi originali GiWise Studio",
      universe: "The Wound Remembers",
      work: "The Wound Remembers",
      continuity: "Canone principale del videogioco",
      origin: "giwise-original",
      dossierStatus: "complete",
    },
    image: {
      src: "/codex/characters/kharvoss.png",
      alt: "Ritratto completo trasparente di Kharvoss, Re Sepolto",
      credit: "Asset del progetto The Wound Remembers · GiWise Studio",
      width: 864,
      height: 1821,
    },
    summary: verified(
      "Sovrano della Tomba Affamata. Conserva nelle proprie ossa la memoria dei caduti e combatte perché nessun morto venga cancellato due volte.",
      ["twr-lore"],
    ),
    identity: [
      fact("Nome", verified("Kharvoss", ["twr-lore", "twr-factions"])),
      fact("Titolo", verified("Re Sepolto · Re della Fossa", ["twr-lore", "twr-integration"])),
      fact("Nome originale", verified("Kharvoss", ["twr-lore"])),
      fact("Specie", authored("Sovrano non-morto della Tomba Affamata")),
      fact("Genere e pronomi", authored("Maschile · lui")),
      fact("Data di nascita", authored("Prima della Numerazione delle Porte")),
      fact("Età", authored("Non misurabile; ricorda oltre sette secoli di sepolture")),
      fact("Luogo di nascita", authored("Necropoli di Vhar-Mor")),
      fact("Provenienza", verified("Tomba Affamata", ["twr-factions"])),
      fact("Occupazione o ruolo", verified("Re Sepolto, custode dei caduti e Viandante", ["twr-lore", "twr-campaign"])),
      fact("Stato", authored("Non-morto attivo · in viaggio oltre le Porte")),
    ],
    narrative: [
      fact("Universo", verified("The Wound Remembers", ["twr-lore"])),
      fact("Opera d’origine", verified("The Wound Remembers", ["twr-lore", "twr-factions"])),
      fact("Categoria", verified("Universi originali GiWise Studio", ["twr-integration"])),
      fact("Formato", verified("Videogioco · dark fantasy card RPG", ["twr-integration"])),
      fact("Fazione", verified("Tomba Affamata", ["twr-factions"])),
      fact("Ruolo narrativo", verified("Co-protagonista, compagno di viaggio e leader di fazione", ["twr-lore", "twr-campaign"])),
      fact("Continuità", verified("Canone principale del videogioco", ["twr-campaign"])),
      fact("Prima apparizione", authored("The Wound Remembers · 2026")),
      fact("Creatore", verified("GiWise Studio", ["twr-integration"])),
      fact("Profilo morale e narrativo", authored("Sovrano funerario · severo, leale e ossessionato dalla restituzione dei nomi")),
    ],
    biography: {
      spoilerFree: verified(
        "Kharvoss governa la Tomba Affamata e custodisce nelle ossa i ricordi dei morti che il mondo ha dimenticato. Si unisce a Nhevara oltre la Prima Porta e trasforma ogni debito funerario in una promessa di protezione.",
        ["twr-lore", "twr-campaign"],
      ),
      paragraphs: [
        { heading: "Il re che rifiutò il trono", ...authored("Kharvoss fu l’ultimo sovrano vivente di Vhar-Mor. Quando la necropoli venne cancellata dalle mappe, ordinò che il proprio corpo fosse smembrato e distribuito tra le tombe: ogni osso divenne un archivio capace di trattenere il nome di un defunto.") },
        { heading: "La Tomba Affamata", ...verified("Come leader della Tomba Affamata, Kharvoss lega la propria autorità a ossa, recupero dal cimitero, Guardia e resistenza crescente. Il suo regno non accumula cadaveri: conserva ciò che la cancellazione tenterebbe di sottrarre.", ["twr-factions", "twr-lore"]) },
        { heading: "La Restituzione dei Nomi", ...verified("Kharvoss attraversa con Nhevara la Prima Porta, il Pozzo dei Nomi e la Cattedrale del Respiro Nero. Davanti a ogni custode caduto conta le Porte aperte e cerca il volto nascosto dietro la strada.", ["twr-lore", "twr-campaign"]) },
        { heading: "Il debito della chiave viva", ...verified("Nella campagna estesa una chiave si avvolge al suo polso e domanda un ricordo in cambio del passaggio. Più avanti la palude pronuncia il suo nome, rivelando che perfino la Tomba può essere chiamata a pagare.", ["twr-extended-campaign"]) },
      ],
      chronology: [
        { title: "La caduta di Vhar-Mor", description: "La necropoli viene cancellata dalle mappe e Kharvoss trasforma le proprie ossa in un archivio dei caduti.", spoiler: "moderate", sourceIds: ["codex-authorial"] },
        { title: "L’incoronazione sepolta", description: "La Tomba Affamata lo riconosce come sovrano e cresce intorno al suo scheletro come un trono vivente.", spoiler: "moderate", sourceIds: ["codex-authorial", "twr-factions"] },
        { title: "La Restituzione dei Nomi", description: "Kharvoss attraversa la Prima Porta insieme a Nhevara e scopre il progetto del Coro Inverso.", spoiler: "major", sourceIds: ["twr-lore", "twr-campaign"] },
        { title: "La chiave e la palude", description: "Una chiave viva esige una memoria; più tardi la palude pronuncia il nome del Re Sepolto.", spoiler: "major", sourceIds: ["twr-extended-campaign"] },
      ],
    },
    personality: {
      profile: authored("Kharvoss parla con la calma di chi non teme più la morte, ma attribuisce un peso assoluto ai nomi, ai debiti e alle promesse. È austero senza essere crudele, ironico nei momenti più cupi e incapace di ignorare chi rischia di essere dimenticato."),
      facts: [
        fact("Ideali e valori", authored("Memoria dei defunti, parola data, custodia e giustizia funeraria")),
        fact("Motivazioni", authored("Restituire un nome a ogni caduto cancellato e impedire che le Porte trasformino la morte in oblio")),
        fact("Paure", authored("Dimenticare il proprio popolo, regnare su tombe vuote e diventare soltanto il trono che lo sostiene")),
        fact("Pregi", authored("Lealtà, pazienza, memoria prodigiosa e capacità di resistere quando gli altri cedono")),
        fact("Difetti", authored("Rigidità, fatalismo, possessività verso i ricordi e difficoltà a concedere il perdono")),
        fact("Obiettivo", authored("Trasformare la Ferita in una tomba vigile che non permetta alcun passaggio senza restituire un nome")),
        fact("Simboli associati", authored("Corona d’ossa, chiave viva, trono vuoto e tre colpi sulla bara")),
      ],
    },
    appearanceAndAbilities: {
      description: authored("Kharvoss appare come un sovrano scheletrico altissimo, rivestito di drappi funerari e reliquie ossarie. La corona è cresciuta direttamente nel cranio, mentre il bastone ricurvo funziona insieme da scettro, chiave e registro delle sepolture."),
      facts: [
        fact("Segni distintivi", authored("Corona ossea fusa al cranio, altezza innaturale e reliquiari sospesi al corpo")),
        fact("Abbigliamento", authored("Paramenti regali consumati, drappi neri e porpora, catene votive e armatura d’ossa")),
        fact("Equipaggiamento", authored("Scettro delle Vertebre, Chiave Viva e corona-archivio di Vhar-Mor")),
        fact("Forme alternative", authored("Trono Affamato · configurazione rituale in cui ossa e sepolture vicine si uniscono al suo corpo")),
      ],
      powers: [
        { name: "Memoria dei caduti", ...verified("Conserva nelle proprie ossa la memoria dei morti e impedisce che vengano cancellati due volte.", ["twr-lore"]) },
        { name: "Sepoltura Sovrana", ...verified("Rito della Tomba Affamata che rinforza un alleato e lo rende immediatamente pronto.", ["twr-factions"]) },
        { name: "Richiamo della bara", ...authored("Batte tre volte sul legno funerario per convocare la memoria di un caduto senza pronunciarne il nome.") },
      ],
      limitations: [
        { name: "Debito funerario", ...authored("Ogni memoria custodita crea un debito: Kharvoss non può abbandonare volontariamente chi gli ha affidato il proprio nome.") },
        { name: "Frattura dell’archivio", ...authored("La distruzione di un osso-registro libera ricordi incompatibili e può immobilizzarlo mentre ricompone identità appartenute a epoche diverse.") },
      ],
    },
    relationships: [
      { name: "Nhevara", type: "Compagna di viaggio", description: "Attraversa con lei la Prima Porta, il Pozzo dei Nomi e la Cattedrale. Ne rispetta la capacità di ascoltare ciò che lui può soltanto conservare.", status: "verified", sourceIds: ["twr-lore", "twr-campaign"], linkedSlug: "nhevara-madreferita" },
      { name: "I caduti di Vhar-Mor", type: "Popolo custodito", description: "Le loro memorie abitano le ossa del Re Sepolto e costituiscono il fondamento morale del suo regno.", status: "editorial", sourceIds: ["codex-authorial"] },
      { name: "La Tomba Affamata", type: "Regno e patto", description: "Non è soltanto una fazione: è una volontà funeraria che protegge, reclama e restituisce.", status: "verified", sourceIds: ["twr-factions"] },
      { name: "La Chiave Viva", type: "Debitrice e creditrice", description: "Si avvolge al suo polso e pretende una memoria in cambio del passaggio.", status: "verified", sourceIds: ["twr-extended-campaign"] },
    ],
    production: {
      appearances: [
        { title: "The Wound Remembers", format: "Videogioco", role: "Co-protagonista e leader della Tomba Affamata", year: "2026", status: "editorial", sourceIds: ["twr-lore", "twr-factions", "codex-authorial"] },
        { title: "Fuori Trama Next", format: "Videogioco · integrazione cross-universe", role: "Recluta del Codice del Nexus", year: "2026", status: "verified", sourceIds: ["twr-integration"] },
      ],
      facts: [
        fact("Ideazione", verified("GiWise Studio", ["twr-integration"])),
        fact("Sviluppo", verified("GiWise Studio", ["twr-integration"])),
        fact("Doppiaggio", authored("Non previsto nella versione attuale")),
        fact("Motion capture", authored("Non utilizzato")),
        fact("Evoluzione del design", authored("Da custode ossario a re-archivio: corona, scettro e reliquiari rendono visibile il peso delle memorie che trasporta")),
      ],
    },
    giwiseModule: {
      canonStatus: verified("Personaggio originale canonico di The Wound Remembers", ["twr-lore", "twr-factions"]),
      concept: verified("Leader della Tomba Affamata: ossa, recupero dal cimitero, Guardia e resistenza crescente.", ["twr-factions"]),
      gameplayProfile: [
        fact("Fazione giocabile", verified("Tomba Affamata", ["twr-factions"])),
        fact("Mazzo", verified("Dazio di Kharvoss", ["twr-factions"])),
        fact("Rito", verified("Sepoltura Sovrana", ["twr-factions"])),
        fact("Identità ludica", verified("Ossa, recupero, Guardia e controllo resistente", ["twr-factions"])),
      ],
    },
    editorial: {
      verificationLabel: "Scheda completa · lore originale GiWise Studio",
      lastReviewed: "19/08/2026",
      editor: "LoreWise Universe · GiWise Studio",
      contentWarnings: ["Dark fantasy", "Morte", "Ossa", "Immaginario horror"],
      missingFields: [],
      sources: [
        { id: "twr-lore", title: "Archivio narrativo di The Wound Remembers", kind: "primary", location: "src/game/lore.ts", note: "Titolo, ruolo, memoria dei caduti e viaggio attraverso le Porte." },
        { id: "twr-factions", title: "Definizione della fazione Tomba Affamata", kind: "primary", location: "src/game/factions.ts", note: "Leadership, mazzo, rito e identità ludica." },
        { id: "twr-campaign", title: "Campagna principale", kind: "primary", location: "src/game/campaign.ts", note: "Dialoghi, azioni e rapporto con Nhevara." },
        { id: "twr-extended-campaign", title: "Campagna estesa", kind: "primary", location: "src/game/extendedCampaign.ts", note: "La Chiave Viva, la palude e gli sviluppi oltre la Cattedrale." },
        { id: "twr-integration", title: "Integrazione Fuori Trama Next", kind: "project", location: "src/data/campaignRewards.ts", note: "Titolo Re Sepolto, reclutamento e collegamento cross-universe." },
        { id: "kharvoss-visual", title: "Ritratto ufficiale di Kharvoss", kind: "visual", location: "public/assets/leaders/kharvoss-campaign-cutout.png", note: "Riferimento per anatomia, abiti ed equipaggiamento." },
        { id: "codex-authorial", title: "Lore originale sviluppata per LoreWise Codex", kind: "authorial", location: "LoreWise Universe · scheda Kharvoss", note: "Espansione narrativa autorizzata dal creatore e costruita in coerenza con il materiale primario." },
      ],
    },
    searchTerms: ["Kharvoss", "Re Sepolto", "Re della Fossa", "The Wound Remembers", "Tomba Affamata", "Sepoltura Sovrana", "GiWise Studio", "non-morto", "Vhar-Mor"],
  },
  {
    slug: "pennywise-it",
    name: "Pennywise",
    displayTitle: "Pennywise, il Clown Danzante",
    catalog: {
      category: "Letteratura",
      universe: "It · Stephen King",
      work: "It",
      continuity: "Romanzo di Stephen King (1986)",
      origin: "documented-third-party",
      dossierStatus: "complete",
    },
    image: {
      src: "/codex/characters/pennywise-modern.jpg",
      alt: "Pennywise in una rappresentazione moderna del personaggio",
      credit: "Archivio visivo LoreWise Codex · Pennywise",
      width: 736,
      height: 1309,
    },
    gallery: [
      {
        src: "/codex/characters/pennywise-1990.jpg",
        alt: "Pennywise nella versione della miniserie televisiva del 1990",
        caption: "Pennywise nella miniserie televisiva del 1990, interpretato da Tim Curry.",
        width: 736,
        height: 1001,
      },
    ],
    summary: verified(
      "Entità predatrice e mutaforma legata a Derry, conosciuta soprattutto come Pennywise il Clown Danzante. Assume le paure delle vittime e torna ciclicamente a nutrirsi.",
      ["king-it-novel", "king-it-official"],
    ),
    identity: [
      fact("Nome più noto", verified("Pennywise il Clown Danzante", ["king-it-novel", "king-it-official"])),
      fact("Identità", verified("It", ["king-it-novel", "king-it-official"])),
      fact("Alias", verified("Bob Gray", ["king-it-novel", "king-it-official"])),
      fact("Specie", verified("Entità antica, predatrice e mutaforma", ["king-it-novel"])),
      fact("Genere e pronomi", verified("Entità non umana; nel testo è indicata soprattutto con il pronome neutro inglese “It”, mentre le forme assunte possono essere connotate diversamente", ["king-it-novel"])),
      fact("Data di nascita", verified("Non applicabile: l’entità è descritta come senza età", ["king-it-official"])),
      fact("Età", verified("Senza età; anteriore alla storia umana di Derry", ["king-it-novel", "king-it-official"])),
      fact("Origine", verified("Una realtà esterna all’universo ordinario, definita Macroverso nel romanzo", ["king-it-novel", "king-dark-tower"])),
      fact("Luogo associato", verified("Derry, Maine, in particolare il sistema sotterraneo della città", ["king-it-novel", "king-it-official"])),
      fact("Natura o ruolo", verified("Predatore soprannaturale che sfrutta la paura delle vittime", ["king-it-novel"])),
      fact("Stato nel romanzo", verified("Sconfitto dal Club dei Perdenti nella conclusione ambientata nel 1985", ["king-it-novel"])),
    ],
    narrative: [
      fact("Universo", verified("Universo narrativo di Stephen King", ["king-it-novel", "king-dark-tower"])),
      fact("Opera d’origine", verified("It", ["king-it-official"])),
      fact("Categoria", verified("Letteratura horror", ["king-it-official"])),
      fact("Formato", verified("Romanzo", ["king-it-official"])),
      fact("Classificazione", verified("Antagonista principale · entità predatrice di Derry", ["king-it-novel", "king-it-official"])),
      fact("Ruolo narrativo", verified("Incarnazione del terrore che unisce e perseguita il Club dei Perdenti nell’infanzia e nell’età adulta", ["king-it-novel"])),
      fact("Continuità principale della scheda", verified("Romanzo di Stephen King del 1986", ["king-it-official"])),
      fact("Prima pubblicazione", verified("1986", ["king-it-official"])),
      fact("Creatore", verified("Stephen King", ["king-it-official"])),
      fact("Adattamenti distinti", verified("Miniserie televisiva del 1990; film It del 2017 e It: Chapter Two del 2019; serie HBO It: Welcome to Derry del 2025, collocata nella continuità cinematografica di Andy Muschietti", ["king-it-1990", "king-it-2017", "king-welcome-derry", "wbd-welcome-derry"])),
      fact("Espansione televisiva", verified("It: Welcome to Derry prende avvio nel 1962 e amplia la visione stabilita dai due film di Andy Muschietti; non viene trattata come prosecuzione della miniserie del 1990", ["king-welcome-derry", "king-new-releases", "wbd-welcome-derry"])),
    ],
    biography: {
      spoilerFree: verified(
        "Pennywise è la maschera più riconoscibile di It, un’entità che vive sotto Derry e riemerge a intervalli ciclici. Sceglie forme capaci di amplificare la paura, isola le vittime e sfrutta l’indifferenza della città per continuare a cacciare.",
        ["king-it-novel", "king-it-official"],
      ),
      paragraphs: [
        {
          heading: "L’arrivo e Derry",
          ...verified("Il romanzo colloca l’arrivo dell’entità sulla Terra in un passato remotissimo. Il luogo in cui si stabilisce diventa in seguito Derry; da sotto la città It esercita un’influenza che favorisce violenza, rimozione e silenzio collettivo.", ["king-it-novel"]),
        },
        {
          heading: "Il ciclo della fame",
          ...verified("It alterna lunghi periodi di sonno a fasi di attività che durano mesi o anni e ricorrono approssimativamente ogni ventisette anni. Durante il risveglio colpisce soprattutto i bambini, assumendo l’aspetto delle loro paure.", ["king-it-novel"]),
        },
        {
          heading: "Pennywise come maschera",
          ...verified("La forma del clown è una delle identità preferite dell’entità e quella con cui viene ricordata più spesso. Non costituisce però il suo unico corpo: mummie, lebbrosi, animali, creature cinematografiche e apparizioni personali sono manifestazioni della stessa volontà mutaforma.", ["king-it-novel", "king-it-official"]),
        },
        {
          heading: "Il Club dei Perdenti",
          ...verified("Nel 1958 sette ragazzi di Derry riconoscono il legame tra le apparizioni e affrontano It nelle fogne. Convinti di averlo fermato, promettono di tornare se l’orrore dovesse risvegliarsi; nel 1985 mantengono il patto e affrontano l’entità da adulti.", ["king-it-novel"]),
        },
        {
          heading: "Il confronto finale",
          ...verified("La battaglia conclusiva non è soltanto fisica: memoria, convinzione, immaginazione e legame del gruppo diventano essenziali per resistere alle Luci Morte e colpire It quando la sua certezza di essere invulnerabile comincia a cedere.", ["king-it-novel"]),
        },
      ],
      chronology: [
        { title: "Arrivo sulla Terra", description: "L’entità raggiunge il luogo destinato a diventare Derry e vi stabilisce il proprio territorio.", spoiler: "moderate", sourceIds: ["king-it-novel"] },
        { title: "I cicli di Derry", description: "Risvegli periodici accompagnano sparizioni, omicidi e grandi episodi di violenza nella storia cittadina.", spoiler: "moderate", sourceIds: ["king-it-novel"] },
        { title: "Estate 1958", description: "Il Club dei Perdenti affronta It durante l’infanzia e stringe il patto di tornare.", spoiler: "major", sourceIds: ["king-it-novel"] },
        { title: "Ritorno del 1985", description: "Gli adulti tornano a Derry e portano a compimento lo scontro iniziato ventisette anni prima.", spoiler: "major", sourceIds: ["king-it-novel"] },
      ],
    },
    personality: {
      profile: verified("Pennywise è teatrale, manipolatore e crudele. Trasforma la caccia in spettacolo, studia le fragilità individuali e usa derisione, promesse o immagini familiari per separare le vittime. La sicurezza con cui si considera superiore diventa arroganza quando incontra una resistenza collettiva.", ["king-it-novel"]),
      facts: [
        fact("Impulso dominante", verified("Nutrimento attraverso la paura e conservazione del controllo su Derry", ["king-it-novel"])),
        fact("Metodo", verified("Isolamento, inganno, mutaforma e apparizioni costruite sulle paure personali", ["king-it-novel"])),
        fact("Tratti", verified("Predatorio, sadico, teatrale, paziente e manipolatore", ["king-it-novel"])),
        fact("Punto cieco", verified("Sottovaluta la forza della convinzione, dell’immaginazione e dell’unità dei Perdenti", ["king-it-novel"])),
        fact("Rapporto con Derry", verified("La città tende a ignorare o dimenticare la violenza collegata alla sua presenza", ["king-it-novel"])),
        fact("Simboli associati", verified("Clown, palloncini, fogne, ragnatela e Luci Morte", ["king-it-novel"])),
      ],
    },
    appearanceAndAbilities: {
      description: verified("Nel romanzo Pennywise appare come un clown dalla pelle dipinta, capelli rossi ai lati del capo, abito argenteo ampio, guanti e decorazioni arancioni. L’aspetto è soltanto una forma scelta: i dettagli possono mutare insieme alla voce, agli occhi e alle proporzioni.", ["king-it-novel"]),
      facts: [
        fact("Aspetto principale", verified("Pennywise il Clown Danzante", ["king-it-novel", "king-it-official"])),
        fact("Colori ricorrenti", verified("Bianco o argento, rosso e arancione", ["king-it-novel"])),
        fact("Forma percepibile estrema", verified("Manifestazione aracnide connessa alle Luci Morte", ["king-it-novel"])),
        fact("Segno scenico", verified("Il clown usa gesti, sorrisi, voci e oggetti infantili come esche", ["king-it-novel"])),
      ],
      powers: [
        { name: "Mutaforma", ...verified("Assume forme derivate dalle paure, dai ricordi e dall’immaginario delle vittime.", ["king-it-novel"]) },
        { name: "Luci Morte", ...verified("La mente umana percepisce la natura extradimensionale di It attraverso le Luci Morte, capaci di sopraffare chi le osserva.", ["king-it-novel", "king-dark-tower"]) },
        { name: "Illusione e influenza mentale", ...verified("Altera percezioni, comunica attraverso visioni e sfrutta la tendenza degli abitanti di Derry a non vedere o ricordare.", ["king-it-novel"]) },
        { name: "Rigenerazione e resistenza", ...verified("Le forme fisiche sopportano ferite anomale finché la convinzione e le regole simboliche dello scontro non ne limitano il potere.", ["king-it-novel"]) },
      ],
      limitations: [
        { name: "Convinzione e immaginazione", ...verified("Ciò che i Perdenti credono capace di ferirlo può acquistare efficacia nello scontro con It.", ["king-it-novel"]) },
        { name: "Unità del gruppo", ...verified("L’isolamento favorisce Pennywise; il legame mantenuto dal Club dei Perdenti riduce il suo vantaggio psicologico.", ["king-it-novel"]) },
        { name: "Forma assunta", ...verified("Quando manifesta un corpo nel mondo fisico accetta anche parte delle regole e delle vulnerabilità associate a quella forma.", ["king-it-novel"]) },
        { name: "Arroganza", ...verified("La convinzione di essere superiore conduce l’entità a sottovalutare avversari che hanno imparato a resistere alla paura.", ["king-it-novel"]) },
      ],
    },
    relationships: [
      { name: "Club dei Perdenti", type: "Nemesi collettiva", description: "Sette amici che affrontano It da bambini e tornano a Derry da adulti per mantenere il loro patto.", status: "verified", sourceIds: ["king-it-novel"] },
      { name: "Bill Denbrough", type: "Avversario centrale", description: "La morte di Georgie rende personale il conflitto di Bill con Pennywise e alimenta la ricerca della verità su Derry.", status: "verified", sourceIds: ["king-it-novel"] },
      { name: "Beverly Marsh", type: "Avversaria", description: "Affronta le manifestazioni di It in entrambe le epoche e subisce direttamente il richiamo delle Luci Morte.", status: "verified", sourceIds: ["king-it-novel"] },
      { name: "Mike Hanlon", type: "Custode della memoria", description: "Resta a Derry, ricostruisce la storia dei cicli e richiama il gruppo quando l’entità si risveglia.", status: "verified", sourceIds: ["king-it-novel"] },
      { name: "Maturin", type: "Contrappeso cosmico", description: "La Tartaruga incontrata nella dimensione oltre la realtà offre a Bill un riferimento opposto alla natura distruttiva di It.", status: "verified", sourceIds: ["king-it-novel"] },
      { name: "Derry", type: "Territorio e complice passiva", description: "La città è insieme luogo di caccia, tana e comunità condizionata a ignorare la violenza.", status: "verified", sourceIds: ["king-it-novel"] },
    ],
    production: {
      appearances: [
        { title: "It", format: "Romanzo", role: "Antagonista principale", year: "1986", status: "verified", sourceIds: ["king-it-official", "king-it-novel"] },
        { title: "It", format: "Miniserie televisiva", role: "Antagonista interpretato da Tim Curry", year: "1990", status: "verified", sourceIds: ["king-it-1990"] },
        { title: "It", format: "Film", role: "Antagonista interpretato da Bill Skarsgård", year: "2017", status: "verified", sourceIds: ["king-it-2017"] },
        { title: "It: Chapter Two", format: "Film", role: "Antagonista nella conclusione dell’adattamento cinematografico", year: "2019", status: "verified", sourceIds: ["king-video-index"] },
        { title: "It: Welcome to Derry", format: "Serie televisiva HBO", role: "Pennywise nella serie ambientata nel 1962 che espande la continuità dei film di Andy Muschietti; Bill Skarsgård figura nel cast e tra i produttori esecutivi", year: "2025", status: "verified", sourceIds: ["king-welcome-derry", "king-new-releases", "wbd-welcome-derry"] },
      ],
      facts: [
        fact("Autore originale", verified("Stephen King", ["king-it-official"])),
        fact("Interprete 1990", verified("Tim Curry", ["king-it-1990"])),
        fact("Interprete 2017–2019", verified("Bill Skarsgård", ["king-it-2017", "king-video-index"])),
        fact("Interprete e produzione 2025", verified("Bill Skarsgård figura nel cast e tra i produttori esecutivi di It: Welcome to Derry", ["wbd-welcome-derry"])),
        fact("Ambientazione della serie", verified("La storia di It: Welcome to Derry prende avvio nel 1962, quando una famiglia arriva a Derry mentre un ragazzo scompare", ["king-new-releases"])),
        fact("Continuità separate", verified("Romanzo, miniserie del 1990 e continuità cinematografica moderna vengono registrati come versioni distinte; Welcome to Derry appartiene all’espansione dei film di Andy Muschietti", ["king-it-novel", "king-it-1990", "king-it-2017", "king-welcome-derry", "wbd-welcome-derry"])),
      ],
    },
    editorial: {
      verificationLabel: "Scheda documentata · personaggio di terzi",
      lastReviewed: "19/08/2026",
      editor: "LoreWise Universe · GiWise Studio",
      contentWarnings: ["Horror", "Minori in pericolo", "Omicidio", "Paura psicologica", "Spoiler del romanzo"],
      missingFields: [],
      sources: [
        { id: "king-it-novel", title: "It · romanzo", kind: "primary", location: "Stephen King · Viking, 1986", note: "Fonte primaria per identità, biografia, cicli di Derry, poteri, limiti, relazioni e conclusione." },
        { id: "king-it-official", title: "Stephen King · scheda ufficiale di It", kind: "primary", location: "https://stephenking.com/works/novel/it.html", note: "Opera, anno, nomi Pennywise, It e Bob Gray, definizione del clown senza età." },
        { id: "king-it-1990", title: "Stephen King · It, miniserie 1990", kind: "primary", location: "https://stephenking.com/works/television/it.html", note: "Data, formato e interpretazione di Tim Curry." },
        { id: "king-it-2017", title: "Stephen King · It Part 1", kind: "primary", location: "https://stephenking.com/works/movie/it-part-1-the-losers-club.html", note: "Uscita, autori e adattamento cinematografico del 2017." },
        { id: "king-video-index", title: "Stephen King · archivio ufficiale film e TV", kind: "primary", location: "https://stephenking.com/works/video/index.html", note: "Anni delle opere audiovisive successive." },
        { id: "king-welcome-derry", title: "Stephen King · It: Welcome to Derry", kind: "primary", location: "https://stephenking.com/works/television/it-welcome-to-derry.html", note: "Uscita del 26 ottobre 2025, distribuzione HBO e rapporto dichiarato con i film di Andy Muschietti." },
        { id: "king-new-releases", title: "Stephen King · nuove uscite 2025", kind: "primary", location: "https://stephenking.com/new-releases/index.html", note: "Ambientazione iniziale nel 1962 e premessa ufficiale della serie." },
        { id: "wbd-welcome-derry", title: "Warner Bros. Discovery · It: Welcome to Derry", kind: "primary", location: "https://press.wbd.com/us/property/it-welcome-derry/videos", note: "Continuità cinematografica, produzione HBO e Warner Bros. Television, autori e partecipazione di Bill Skarsgård." },
        { id: "king-dark-tower", title: "Stephen King · collegamenti con The Dark Tower", kind: "primary", location: "https://stephenking.com/darktower/connections/", note: "Collegamento documentato fra Pennywise, Luci Morte e più ampio universo narrativo." },
      ],
    },
    searchTerms: ["Pennywise", "It", "Bob Gray", "Clown Danzante", "Stephen King", "Derry", "Luci Morte", "Deadlights", "Macroverso", "Club dei Perdenti", "Pennywise 1990", "Welcome to Derry", "HBO", "1962", "Bill Skarsgård", "horror"],
  },
];

const curatedOriginalRegistryIds = new Set([
  "giwise-twr-viandante-sangue-cavo",
  "giwise-twr-viandante-tomba-affamata",
]);

// Le due registrazioni visuali di Pennywise (moderna e 1990) confluiscono nel
// dossier editoriale unico `pennywise-it`, che le presenta come continuita e
// immagini distinte senza duplicare il personaggio nell'indice pubblico.
const mergedThirdPartyAliases = new Map([
  ["pennywise-modern", "pennywise-it"],
  ["pennywise-1990", "pennywise-it"],
  ["penny-human-extra", "penny"],
]);
const mergedThirdPartyRegistryIds = new Set(mergedThirdPartyAliases.keys());

const originalCodexEntries = generatedOriginalDossiers as unknown as CodexEntry[];
const verifiedThirdPartyEntries = generatedThirdPartyDossiers as unknown as CodexEntry[];
const pennyExtraEntry = verifiedThirdPartyEntries.find((entry) => entry.slug === "penny-human-extra");
const publicThirdPartyEntries = verifiedThirdPartyEntries
  .filter((entry) => !mergedThirdPartyRegistryIds.has(entry.slug) && !curatedCodexEntries.some((curated) => curated.slug === entry.slug))
  .map((entry) => entry.slug === "penny" && pennyExtraEntry ? {
    ...entry,
    gallery: [
      ...(entry.gallery ?? []),
      {
        src: pennyExtraEntry.image.src,
        alt: pennyExtraEntry.image.alt,
        caption: "Interpretazione visiva alternativa associata al personaggio nell’archivio LoreWise.",
        width: pennyExtraEntry.image.width,
        height: pennyExtraEntry.image.height,
      },
    ],
  } : entry);

export const codexEntries: CodexEntry[] = [
  ...curatedCodexEntries,
  ...originalCodexEntries.filter((entry) => !curatedOriginalRegistryIds.has(entry.slug)),
  ...publicThirdPartyEntries,
];

export function codexCanonicalSlug(slug: string) {
  return mergedThirdPartyAliases.get(slug) ?? slug;
}

export function codexEntryBySlug(slug: string) {
  const canonicalSlug = codexCanonicalSlug(slug);
  return codexEntries.find((entry) => entry.slug === canonicalSlug);
}
