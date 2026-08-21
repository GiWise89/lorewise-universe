import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const registryPath = path.join(projectRoot, "data", "codex", "fuori-trama-registry.generated.json");
const outputPath = path.join(projectRoot, "data", "codex", "original-dossiers.generated.json");
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));

const primary = (value, sourceIds) => ({ value, status: "verified", sourceIds });
const editorial = (value) => ({ value, status: "editorial", sourceIds: ["codex-authorial"] });
const fact = (label, value) => ({ label, ...value });

const factionProfiles = {
  "Sangue Cavo": {
    leader: "Nhevara",
    identity: "Custodi rituali che trasformano memoria, sangue ed Essenza in sacrificio e fuoco.",
    method: "Offerta, Bruciatura e conversione volontaria della perdita in pressione immediata.",
    strengths: "Esplosività, danno diretto e conversione dei sacrifici.",
    weaknesses: "Esaurimento delle risorse, costo personale dei riti e difficoltà contro difese persistenti.",
    chronology: "Il Patto Cavo",
  },
  "Tomba Affamata": {
    leader: "Kharvoss",
    identity: "Morti, bestie e guardiani che preservano la memoria attraverso ossa, ritorno e fame rituale.",
    method: "Guardia, recupero, resti e dominio progressivo delle corsie.",
    strengths: "Resistenza, recupero e controllo delle corsie.",
    weaknesses: "Avvio lento, esilio, silenzio e pressione ad area.",
    chronology: "Il Risveglio Ossafame",
  },
  "Coro Inverso": {
    leader: "Elyra, Voce Negata",
    identity: "Occultisti e apparizioni che cantano al contrario per attraversare le Porte senza essere riconosciuti.",
    method: "Eco, Silenzio, ritorno delle carte e controllo della sequenza degli eventi.",
    strengths: "Flessibilità, conoscenza, pesca e controllo del tempo.",
    weaknesses: "Pressione rapida, fragilità iniziale e dipendenza dalla corretta sequenza delle risposte.",
    chronology: "La Restituzione dei Nomi",
  },
  "Ferro Impuro": {
    leader: "Mordek, Primo Chiodo",
    identity: "Forgiatori e creature nate dall’unione di metallo, ossa e volontà residue.",
    method: "Scoria, equipaggiamento, riforgiatura e pressione fisica durevole.",
    strengths: "Forza strutturale, equipaggiamenti e tenuta delle corsie.",
    weaknesses: "Mobilità limitata, silenzio e vulnerabilità quando il portatore viene rimosso prima della riforgiatura.",
    chronology: "Il Primo Taglio",
  },
  "Senza Patto": {
    leader: "Nessun leader riconosciuto",
    identity: "Creature e presenze non vincolate stabilmente a uno dei quattro patti.",
    method: "Comportamenti autonomi determinati dalla Ferita, dall’ambiente o dalla propria memoria residua.",
    strengths: "Imprevedibilità e adattamento fuori dalle dottrine delle fazioni.",
    weaknesses: "Assenza di una rete rituale stabile e alleanze difficili da mantenere.",
    chronology: "Il Primo Taglio",
  },
};

const splitName = (name) => {
  const [base, ...titleParts] = name.split(",");
  return { base: base.trim(), title: titleParts.join(",").trim() || null };
};

const list = (values, fallback) => values?.length ? values.join(" · ") : fallback;
const lowerFirst = (value) => value ? value.charAt(0).toLocaleLowerCase("it") + value.slice(1) : value;

function twrDossier(record) {
  const sourceCard = record.sourceCard ?? {};
  const faction = sourceCard.faction || "Senza Patto";
  const factionProfile = factionProfiles[faction] ?? factionProfiles["Senza Patto"];
  const { base, title } = splitName(record.name);
  const subtype = sourceCard.subtype || record.traits?.[0] || (sourceCard.kind === "leader" ? "Viandante" : "Creatura della Ferita");
  const cardLore = sourceCard.lore || record.description;
  const rules = sourceCard.rules || record.abilities?.find((ability) => ability.length > 25) || "Funzione registrata nei dati di progetto.";
  const namedAbilities = (record.abilities ?? []).filter((ability) => ability.length <= 70);
  const role = sourceCard.kind === "leader" ? `Leader di ${faction}` : `${subtype} affiliato a ${faction}`;
  const statLine = record.stats
    ? `Forza ${record.stats.strength}, Destrezza ${record.stats.dexterity}, Intelligenza ${record.stats.intelligence}, Carisma ${record.stats.charisma}`
    : "Profilo numerico non previsto";
  const chronology = [
    { title: "Il Primo Taglio", description: `La ferita del mondo rende possibile l’esistenza e il potere di ${base}, direttamente o attraverso la memoria che ne plasma la fazione.`, spoiler: "moderate", sourceIds: ["twr-lore", "codex-authorial"] },
    { title: factionProfile.chronology, description: `${base} viene collocato nella tradizione di ${faction}, che interpreta la Ferita secondo i propri riti e la propria memoria.`, spoiler: "moderate", sourceIds: ["twr-lore", "twr-factions", "codex-authorial"] },
    { title: "Archivio della Ferita", description: `La forma documentata di ${base} entra nel catalogo giocabile con identità, regole e illustrazione univoche.`, spoiler: "none", sourceIds: ["twr-card", "fuori-trama-character"] },
  ];

  return {
    slug: record.id,
    name: base,
    displayTitle: record.name,
    catalog: {
      category: "Universi originali GiWise Studio",
      universe: "The Wound Remembers",
      work: "The Wound Remembers",
      continuity: "Canone principale del videogioco",
      origin: "giwise-original",
      dossierStatus: "complete",
    },
    image: {
      src: record.codexImage,
      alt: `Rappresentazione ufficiale di ${record.name}`,
      credit: "Asset del progetto The Wound Remembers · GiWise Studio",
      width: record.width,
      height: record.height,
    },
    summary: primary(cardLore, ["twr-card"]),
    identity: [
      fact("Nome", primary(base, ["twr-card", "fuori-trama-character"])),
      fact("Titolo o designazione", title ? primary(title, ["twr-card"]) : editorial(`Designazione d’archivio: ${subtype}`)),
      fact("Nome originale", primary(record.name, ["twr-card"])),
      fact("Natura", primary(subtype, ["twr-card"])),
      fact("Genere e pronomi", editorial("Non prescritti: la voce enciclopedica usa il nome proprio o la designazione documentata.")),
      fact("Nascita o manifestazione", editorial(`Collocata dopo il Primo Taglio, nella memoria rituale di ${faction}.`)),
      fact("Provenienza", primary(faction, ["twr-card", "twr-factions"])),
      fact("Occupazione o ruolo", primary(role, ["twr-card", "fuori-trama-character"])),
      fact("Profilo registrato", primary(statLine, ["fuori-trama-character"])),
    ],
    narrative: [
      fact("Universo", primary("The Wound Remembers", ["twr-manifesto"])),
      fact("Opera d’origine", primary("The Wound Remembers", ["twr-manifesto"])),
      fact("Categoria", primary("Dark fantasy · card RPG PvE", ["twr-manifesto"])),
      fact("Formato", primary("Videogioco e archivio di carte narrative", ["twr-design-bible"])),
      fact("Classificazione", primary(role, ["twr-card"])),
      fact("Affiliazione", primary(faction, ["twr-card"])),
      fact("Funzione narrativa", editorial(`${base} rende personale il modo in cui ${faction} interpreta la memoria conservata dalla Ferita.`)),
      fact("Funzione ludica", primary(rules, ["twr-card"])),
      fact("Continuità", primary("Canone principale del videogioco", ["twr-manifesto", "twr-lore"])),
      fact("Creatore", primary("GiWise Studio", ["twr-manifesto"])),
    ],
    biography: {
      spoilerFree: editorial(`${cardLore} La sua storia è legata a ${faction}, ma conserva un’identità distinta all’interno dell’Archivio della Ferita.`),
      paragraphs: [
        { heading: "Memoria conservata", ...editorial(`${base} nasce narrativamente dalla legge centrale del mondo: ogni ferita conserva una memoria e ogni memoria può diventare potere. ${cardLore}`) },
        { heading: `Legame con ${faction}`, ...primary(`${factionProfile.identity} ${base} ne esprime il principio attraverso ${lowerFirst(factionProfile.method)}`, ["twr-lore", "twr-factions", "twr-card"]) },
        { heading: "Presenza sul campo", ...editorial(`La funzione di ${base} non è separata dalla sua storia: “${rules}” traduce in battaglia il prezzo, il rito o l’istinto che ne definisce l’esistenza.`) },
      ],
      chronology,
    },
    personality: {
      profile: editorial(`${base} viene interpretato attraverso i tratti ${list(record.traits, "custode della memoria")}. Il comportamento nasce dal rapporto fra istinto personale e disciplina di ${faction}.`),
      facts: [
        fact("Tratti dominanti", primary(list(record.traits, "Memoria · Ferita · Resistenza"), ["fuori-trama-character"])),
        fact("Motivazione", editorial(`Preservare o trasformare la memoria secondo la legge di ${faction}.`)),
        fact("Metodo", primary(factionProfile.method, ["twr-factions"])),
        fact("Punto di forza", primary(factionProfile.strengths, ["twr-factions"])),
        fact("Conflitto interiore", editorial(`Mantenere la propria identità mentre la Ferita tenta di ridurla a funzione, fame o comando.`)),
      ],
    },
    appearanceAndAbilities: {
      description: editorial(`Il ritratto ufficiale associato a ${record.name} costituisce il riferimento visivo del dossier. La lettura iconografica resta subordinata all’immagine originale e alla sua affiliazione a ${faction}.`),
      facts: [
        fact("Tipologia", primary(subtype, ["twr-card"])),
        fact("Affiliazione visiva", primary(faction, ["twr-card"])),
        fact("Ritratto registrato", primary(`${record.width} × ${record.height} pixel · copia integra verificata`, ["fuori-trama-visual"])),
        fact("Rarità", primary(sourceCard.rarity || "Non applicabile", ["twr-card"])),
      ],
      powers: namedAbilities.length
        ? namedAbilities.map((ability) => ({ name: ability, ...editorial(`${ability} è una manifestazione coerente con il profilo di ${base} e con la dottrina di ${faction}.`) }))
        : [{ name: "Memoria della Ferita", ...editorial(`${base} converte la propria memoria residua in presenza attiva sul campo.`) }],
      limitations: [
        { name: "Contrasto di fazione", ...primary(factionProfile.weaknesses, ["twr-factions"]) },
        { name: "Costo della manifestazione", ...editorial(`Il potere di ${base} richiede Essenza, condizioni o una posizione coerente con la regola documentata della carta.`) },
        { name: "Memoria vulnerabile", ...editorial("Silenzio, oblio e cancellazione dell’identità possono interrompere il legame con la Ferita.") },
      ],
    },
    relationships: [
      { name: factionProfile.leader, type: faction === "Senza Patto" ? "Autorità non riconosciuta" : "Leader di fazione", description: faction === "Senza Patto" ? `${base} non riconosce un comando stabile e tratta con i leader soltanto per necessità.` : `${base} appartiene alla sfera rituale e strategica guidata da ${factionProfile.leader}.`, status: sourceCard.kind === "leader" ? "editorial" : "verified", sourceIds: sourceCard.kind === "leader" ? ["codex-authorial"] : ["twr-factions", "twr-card"] },
      { name: faction, type: "Patto o appartenenza", description: factionProfile.identity, status: "verified", sourceIds: ["twr-lore", "twr-factions"] },
      { name: "La Ferita", type: "Origine del potere", description: `La memoria vivente del mondo determina il contesto in cui ${base} esiste e combatte.`, status: "editorial", sourceIds: ["twr-lore", "codex-authorial"] },
    ],
    production: {
      appearances: [
        { title: "The Wound Remembers", format: "Card RPG PvE", role, year: "2026", status: "verified", sourceIds: ["twr-card", "twr-design-bible"] },
        { title: "LoreWise Fuori Trama", format: "Videogioco · crossover", role: "Personaggio registrato nel Codice del Nexus", year: "2026", status: "verified", sourceIds: ["fuori-trama-character"] },
      ],
      facts: [
        fact("Autore e studio", primary("GiWise Studio", ["twr-manifesto"])),
        fact("Identificatore sorgente", primary(record.id, ["fuori-trama-character"])),
        fact("Immagine sorgente", primary(record.sourceImage, ["fuori-trama-visual"])),
        fact("Integrità dell’immagine", primary(record.sha256, ["fuori-trama-visual"])),
      ],
    },
    giwiseModule: {
      canonStatus: primary("Personaggio originale GiWise Studio; integrazione nel Nexus collegata al progetto d’origine", ["twr-manifesto", "fuori-trama-character"]),
      concept: editorial(`${base} entra nel Nexus conservando affiliazione, memoria e capacità documentate, senza sostituire la sua versione canonica in The Wound Remembers.`),
      gameplayProfile: [
        fact("Identificatore", primary(record.id, ["fuori-trama-character"])),
        fact("Tratti", primary(list(record.traits, "Non classificati"), ["fuori-trama-character"])),
        fact("Capacità", primary(list(record.abilities, rules), ["fuori-trama-character"])),
        fact("Statistiche", primary(statLine, ["fuori-trama-character"])),
      ],
    },
    editorial: {
      verificationLabel: "Originale GiWise · fonti di progetto ed espansione autoriale dichiarata",
      lastReviewed: "19/08/2026",
      editor: "LoreWise Universe · GiWise Studio",
      contentWarnings: ["Dark fantasy", "Violenza fantastica", "Temi horror"],
      missingFields: [],
      sources: [
        { id: "twr-card", title: `Scheda primaria · ${record.name}`, kind: "project", location: "The Wound Remembers · dataset carte e leader", note: "Nome, tipo, fazione, regole, rarità e lore della scheda." },
        { id: "twr-lore", title: "Archivio narrativo di The Wound Remembers", kind: "project", location: "dark-card-game/src/game/lore.ts", note: "Fondamento del mondo, fazioni, figure, luoghi e cronologia." },
        { id: "twr-factions", title: "Identità delle fazioni", kind: "project", location: "dark-card-game/src/game/factions.ts", note: "Leader, riti, punti di forza, debolezze e linguaggio delle quattro fazioni." },
        { id: "twr-design-bible", title: "Game Design Bible", kind: "project", location: "dark-card-game/docs/GAME_DESIGN_BIBLE.md", note: "Struttura del card RPG, dataset e funzione delle carte." },
        { id: "twr-manifesto", title: "Manifesto di progetto", kind: "project", location: "dark-card-game/docs/PROJECT_MANIFESTO.md", note: "Canone creativo, tono e principi di The Wound Remembers." },
        { id: "fuori-trama-character", title: "Scheda personaggio Fuori Trama", kind: "project", location: `characters.json · ${record.id}`, note: "Identificatore, tratti, capacità, statistiche e immagine associata." },
        { id: "fuori-trama-visual", title: "Ritratto associato alla scheda", kind: "visual", location: record.sourceImage, note: `Copia senza ricompressione verificata con SHA-256 ${record.sha256}.` },
        { id: "codex-authorial", title: "Espansione autoriale LoreWise Codex", kind: "authorial", location: `Dossier ${record.id}`, note: "Raccordi biografici e interpretativi sviluppati per l’enciclopedia senza contraddire i dati primari." },
      ],
    },
    searchTerms: [record.name, base, title, "The Wound Remembers", faction, subtype, ...(record.traits ?? []), ...(record.abilities ?? [])].filter(Boolean),
  };
}

function lorewiseOriginalDossier(record) {
  const { base, title } = splitName(record.name);
  const traits = record.traits ?? [];
  const abilities = record.abilities ?? [];
  const statLine = record.stats
    ? `Forza ${record.stats.strength}, Destrezza ${record.stats.dexterity}, Intelligenza ${record.stats.intelligence}, Carisma ${record.stats.charisma}`
    : "Profilo numerico non previsto";
  const definingTrait = traits[0] || "enigmatico";
  const secondaryTrait = traits[1] || "determinato";
  const signatureAbility = abilities[0] || "Risonanza del Nexus";
  const role = title || "Avventuriero del Nexus";

  return {
    slug: record.id,
    name: base,
    displayTitle: title ? `${base}, ${title}` : `${base} · ${role}`,
    catalog: { category: "Universi originali GiWise Studio", universe: "LoreWise Originals", work: "LoreWise Fuori Trama", continuity: "Canone originale del Nexus", origin: "giwise-original", dossierStatus: "complete" },
    image: { src: record.codexImage, alt: `Rappresentazione ufficiale di ${record.name}`, credit: "Personaggio originale LoreWise · GiWise Studio", width: record.width, height: record.height },
    summary: editorial(`${base} è ${lowerFirst(role)}, una presenza ${lowerFirst(definingTrait)} che attraversa il Nexus trasformando memoria, paura e scelta in strumenti di sopravvivenza.`),
    identity: [
      fact("Nome", primary(base, ["fuori-trama-character"])),
      fact("Titolo", editorial(role)),
      fact("Nome originale", primary(record.name, ["fuori-trama-character"])),
      fact("Natura", editorial("Entità o viandante originale del Nexus")),
      fact("Genere e pronomi", editorial("Non prescritti dai dati originari; il Codex usa il nome proprio.")),
      fact("Prima manifestazione", editorial("Durante una Convergenza del Nexus non ancora numerata")),
      fact("Provenienza", editorial("Una linea narrativa originale intercettata dall’Archivio delle Convergenze")),
      fact("Occupazione o ruolo", editorial(role)),
      fact("Profilo registrato", primary(statLine, ["fuori-trama-character"])),
    ],
    narrative: [
      fact("Universo", primary("LoreWise Originals", ["fuori-trama-character"])),
      fact("Opera d’origine", primary("LoreWise Fuori Trama", ["fuori-trama-character"])),
      fact("Categoria", editorial("Dark fantasy · horror fantastico · crossover")),
      fact("Formato", primary("Videogioco narrativo", ["fuori-trama-character"])),
      fact("Classificazione", editorial(role)),
      fact("Affiliazione", editorial("Archivio delle Convergenze")),
      fact("Ruolo narrativo", editorial(`${base} agisce come variabile autonoma nelle fratture del Nexus, scegliendo quali memorie proteggere e quali lasciare dissolvere.`)),
      fact("Segno distintivo", editorial(signatureAbility)),
      fact("Continuità", primary("Canone originale del Nexus", ["fuori-trama-character"])),
      fact("Creatore", primary("GiWise Studio", ["fuori-trama-character"])),
    ],
    biography: {
      spoilerFree: editorial(`${base} compare nel Nexus senza un passato completamente leggibile. I tratti ${list(traits, "enigmatico · determinato")} e le capacità registrate suggeriscono una storia costruita attorno alla memoria e al prezzo dell’identità.`),
      paragraphs: [
        { heading: "Prima della Convergenza", ...editorial(`Prima di essere registrato, ${base} apparteneva a una linea narrativa ormai frammentata. Ne rimangono il carattere ${lowerFirst(definingTrait)}, l’indole ${lowerFirst(secondaryTrait)} e il ricordo di ${signatureAbility}.`) },
        { heading: "Ingresso nel Nexus", ...editorial(`La Convergenza non cancella ${base}: ne rende visibili le contraddizioni. Ogni capacità diventa una chiave capace di aprire un percorso, ma anche un vincolo che attira l’attenzione dell’Archivio.`) },
        { heading: "Scelta personale", ...editorial(`${base} rifiuta di essere soltanto una scheda collezionabile. Il suo arco ruota attorno alla possibilità di scegliere cosa fare della propria memoria quando mondi incompatibili chiedono una versione definitiva.`) },
      ],
      chronology: [
        { title: "Linea originaria", description: `La vita precedente di ${base} sopravvive in frammenti, abilità e reazioni emotive.`, spoiler: "moderate", sourceIds: ["codex-authorial"] },
        { title: "La Convergenza", description: `${base} viene intercettato dal Nexus e registrato come viandante autonomo.`, spoiler: "moderate", sourceIds: ["codex-authorial", "fuori-trama-character"] },
        { title: "Archivio LoreWise", description: `Il dossier stabilizza nome, immagine, tratti e capacità senza chiudere le future evoluzioni narrative.`, spoiler: "none", sourceIds: ["fuori-trama-character", "fuori-trama-visual"] },
      ],
    },
    personality: {
      profile: editorial(`${base} combina ${list(traits, "curiosità · perseveranza")}. Questi aspetti non sono etichette decorative: guidano le decisioni, le alleanze e la risposta alle manipolazioni del Nexus.`),
      facts: [
        fact("Tratti dominanti", primary(list(traits, "Non classificati"), ["fuori-trama-character"])),
        fact("Motivazione", editorial("Conservare una memoria autentica senza diventare prigioniero della versione imposta dagli altri.")),
        fact("Metodo", editorial(`${signatureAbility} rappresenta il modo più diretto con cui ${base} interviene nelle Convergenze.`)),
        fact("Conflitto interiore", editorial(`La tensione fra un’indole ${lowerFirst(definingTrait)} e una risposta ${lowerFirst(secondaryTrait)} alle perdite.`)),
        fact("Valore decisivo", editorial("La possibilità di scegliere chi diventare anche quando l’Archivio conosce già il passato.")),
      ],
    },
    appearanceAndAbilities: {
      description: editorial(`Il ritratto ufficiale associato a ${record.name} è il riferimento visivo del dossier e viene presentato senza ritagli forzati. L’iconografia resta legata alle capacità e ai tratti registrati.`),
      facts: [
        fact("Riferimento visivo", primary(record.sourceImage, ["fuori-trama-visual"])),
        fact("Proporzioni originali", primary(`${record.width} × ${record.height} pixel`, ["fuori-trama-visual"])),
        fact("Integrità", primary("Copia binaria senza ricompressione", ["fuori-trama-visual"])),
        fact("Motivo narrativo", editorial(signatureAbility)),
      ],
      powers: abilities.length ? abilities.map((ability) => ({ name: ability, ...editorial(`${ability} manifesta un frammento specifico dell’identità e della memoria di ${base}.`) })) : [{ name: "Risonanza del Nexus", ...editorial(`${base} percepisce le fratture fra linee narrative incompatibili.`) }],
      limitations: [
        { name: "Memoria incompleta", ...editorial("I ricordi precedenti alla Convergenza possono emergere in modo frammentario o contraddittorio.") },
        { name: "Costo identitario", ...editorial(`Usare ripetutamente ${signatureAbility} rende più difficile distinguere desiderio personale e funzione assegnata dal Nexus.`) },
        { name: "Ancoraggio", ...editorial("La distanza prolungata da un luogo, oggetto o alleato significativo indebolisce la stabilità narrativa.") },
      ],
    },
    relationships: [
      { name: "Il Nexus", type: "Forza di convergenza", description: `Ha registrato ${base} senza riuscire a ridurne completamente l’identità a una singola versione.`, status: "editorial", sourceIds: ["codex-authorial"] },
      { name: "Archivio LoreWise", type: "Custode della memoria", description: `Conserva i dati verificati di ${base} e distingue le future espansioni autoriali.`, status: "editorial", sourceIds: ["codex-authorial", "fuori-trama-character"] },
      { name: "Viandanti delle Convergenze", type: "Alleati potenziali", description: `${base} valuta ogni alleanza in base alla capacità dell’altro di rispettare memorie e identità differenti.`, status: "editorial", sourceIds: ["codex-authorial"] },
    ],
    production: {
      appearances: [{ title: "LoreWise Fuori Trama", format: "Videogioco narrativo", role, year: "2026", status: "verified", sourceIds: ["fuori-trama-character"] }],
      facts: [
        fact("Creatore", primary("GiWise Studio", ["fuori-trama-character"])),
        fact("Identificatore", primary(record.id, ["fuori-trama-character"])),
        fact("Immagine sorgente", primary(record.sourceImage, ["fuori-trama-visual"])),
        fact("Integrità dell’immagine", primary(record.sha256, ["fuori-trama-visual"])),
      ],
    },
    giwiseModule: {
      canonStatus: primary("Personaggio originale GiWise Studio · canone LoreWise", ["fuori-trama-character"]),
      concept: editorial(`${base} è progettato per espandersi nel Nexus senza dipendere da continuità di terzi.`),
      gameplayProfile: [
        fact("Identificatore", primary(record.id, ["fuori-trama-character"])),
        fact("Tratti", primary(list(traits, "Non classificati"), ["fuori-trama-character"])),
        fact("Capacità", primary(list(abilities, "Risonanza del Nexus"), ["fuori-trama-character"])),
        fact("Statistiche", primary(statLine, ["fuori-trama-character"])),
      ],
    },
    editorial: {
      verificationLabel: "Originale GiWise · sviluppo autoriale dichiarato",
      lastReviewed: "19/08/2026",
      editor: "LoreWise Universe · GiWise Studio",
      contentWarnings: ["Horror fantastico", "Temi psicologici", "Violenza fantastica"],
      missingFields: [],
      sources: [
        { id: "fuori-trama-character", title: "Registro personaggi LoreWise", kind: "project", location: `characters.json · ${record.id}`, note: "Nome, universo, tratti, capacità, statistiche e immagine associata." },
        { id: "fuori-trama-visual", title: "Ritratto associato alla scheda", kind: "visual", location: record.sourceImage, note: `Copia senza ricompressione verificata con SHA-256 ${record.sha256}.` },
        { id: "codex-authorial", title: "Sviluppo autoriale LoreWise Codex", kind: "authorial", location: `Dossier ${record.id}`, note: "Biografia, cronologia, limiti e relazioni sviluppati per il canone originale GiWise." },
      ],
    },
    searchTerms: [record.name, base, title, "LoreWise Originals", "Nexus", role, ...traits, ...abilities].filter(Boolean),
  };
}

const originals = registry
  .filter((record) => record.franchise === "The Wound Remembers" || record.franchise === "LoreWise Originals")
  .map((record) => record.franchise === "The Wound Remembers" ? twrDossier(record) : lorewiseOriginalDossier(record));

fs.writeFileSync(outputPath, `${JSON.stringify(originals, null, 2)}\n`, "utf8");
console.log(`Generati ${originals.length} dossier originali completi: ${outputPath}`);
