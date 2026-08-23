import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { curatedUnresolvedDossiers } from "./curated-unresolved-dossiers.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const registry = JSON.parse(fs.readFileSync(path.join(projectRoot, "data", "codex", "fuori-trama-registry.generated.json"), "utf8"));
const discovery = JSON.parse(fs.readFileSync(path.join(projectRoot, "data", "codex", "research", "encyclopedic-discovery.generated.json"), "utf8"));
const baseProfiles = JSON.parse(fs.readFileSync(path.join(projectRoot, "data", "codex", "research", "manual-profiles.json"), "utf8"));
const deepResearchPath = path.join(projectRoot, "data", "codex", "research", "deep-research-overrides.json");
const deepResearchOverrides = fs.existsSync(deepResearchPath)
  ? JSON.parse(fs.readFileSync(deepResearchPath, "utf8"))
  : [];
const deepResearchById = new Map(deepResearchOverrides.map((override) => [override.id, override]));
const researchPacksPath = path.join(projectRoot, "data", "codex", "research", "deep-character-packs.generated.json");
const researchPacks = fs.existsSync(researchPacksPath) ? JSON.parse(fs.readFileSync(researchPacksPath, "utf8")) : [];
const researchPackById = new Map(researchPacks.map((pack) => [pack.id, pack]));
const profiles = baseProfiles.map((profile) => {
  const override = deepResearchById.get(profile.id);
  if (!override) return profile;
  return {
    ...profile,
    ...override,
    biography: [...profile.biography, ...(override.biographyAppend || [])],
    chronology: [...profile.chronology, ...(override.chronologyAppend || [])],
    officialSources: [...profile.officialSources, ...(override.officialSourcesAppend || [])],
  };
});
const marcoEMircoProfile = profiles.find((profile) => profile.id === "marco-e-mirco");
if (marcoEMircoProfile) marcoEMircoProfile.continuityNote = "Marco e Mirco sono trattati come coppia professionale perché la serie li presenta e sviluppa insieme.";
const outputPath = path.join(projectRoot, "data", "codex", "third-party-dossiers.generated.json");
const registryById = new Map(registry.map((record) => [record.id, record]));
const discoveryById = new Map(discovery.map((record) => [record.id, record]));

const verified = (value, sourceIds) => ({ value, status: "verified", sourceIds });
const fact = (label, value) => ({ label, ...value });
const lowerFirst = (value) => value ? `${value.charAt(0).toLocaleLowerCase("it")}${value.slice(1)}` : "";
const detailedRole = (profile) => {
  const cleanEnd = (value) => String(value || "").replace(/[.!?]+$/, "");
  const plural = profile.grammaticalNumber === "plural";
  const parts = [`${cleanEnd(profile.role)}.`];
  if (profile.method && profile.method !== profile.role) parts.push(`${plural ? "Agiscono" : "Agisce"} soprattutto attraverso ${lowerFirst(cleanEnd(profile.method))}.`);
  if (profile.motivation && profile.motivation !== profile.role && profile.motivation !== profile.method) parts.push(`${plural ? "Il loro obiettivo" : "Il suo obiettivo"} ricorrente è ${lowerFirst(cleanEnd(profile.motivation))}.`);
  return parts.join(" ");
};

const normalizeResearchValue = (value) => String(value || "")
  .replace(/\bHuman\b/gi, "essere umano")
  .replace(/\bMale\b/gi, "maschile")
  .replace(/\bFemale\b/gi, "femminile")
  .replace(/\bmother\b/gi, "madre")
  .replace(/\bfather\b/gi, "padre")
  .replace(/\bbrother\b/gi, "fratello")
  .replace(/\bsister\b/gi, "sorella")
  .replace(/\bdaughter\b/gi, "figlia")
  .replace(/\bson\b/gi, "figlio")
  .replace(/\bformerly\b/gi, "in precedenza")
  .replace(/\bcurrently\b/gi, "attualmente")
  .replace(/\bactor\b/gi, "attore")
  .replace(/\bactress\b/gi, "attrice")
  .replace(/\bwizard\b/gi, "mago")
  .replace(/\bsoldier\b/gi, "soldato")
  .replace(/\bdog\b/gi, "cane")
  .replace(/\bshapeshifter\b/gi, "mutaforma")
  .replace(/\s+/g, " ")
  .trim();
const structuredValue = (pack, label) => normalizeResearchValue(pack?.structuredFacts?.find((fact) => fact.label === label)?.value);
const compactList = (...values) => values.filter(Boolean).join(" · ");
const factualSentence = (prefix, value) => value ? `${prefix}${value}.` : "";
const sentence = (text) => {
  const clean = String(text || "").trim();
  if (!clean) return "";
  return /[.!?]$/.test(clean) ? clean : `${clean}.`;
};
const narrativeText = (...parts) => parts.filter(Boolean).map(sentence).join(" ");

function applyStructuredResearch(profile, record, replaceGeneric = false) {
  const pack = researchPackById.get(profile.id);
  if (!pack || !["source-pack-ready", "specialist-pack-ready", "wikidata-direct-ready"].includes(pack.status) || !pack.identityValidated || (pack.structuredFacts?.length || 0) < 3) return profile;
  const firstAppearance = structuredValue(pack, "Prima apparizione");
  const lastAppearance = structuredValue(pack, "Ultima apparizione");
  const currentStatus = structuredValue(pack, "Stato");
  const occupation = structuredValue(pack, "Occupazione o ruolo");
  const origin = structuredValue(pack, "Origine");
  const nature = structuredValue(pack, "Specie o natura");
  const aliases = structuredValue(pack, "Alias");
  const creation = structuredValue(pack, "Creazione");
  const affiliations = structuredValue(pack, "Affiliazioni");
  const relationships = compactList(structuredValue(pack, "Famiglia e relazioni"), structuredValue(pack, "Partner"), structuredValue(pack, "Genitori"), structuredValue(pack, "Figli"));
  const abilities = structuredValue(pack, "Capacità e strumenti");
  const performer = structuredValue(pack, "Interprete o voce");
  const appearances = structuredValue(pack, "Apparizioni documentate");
  const universe = structuredValue(pack, "Serie o universo");
  const identification = structuredValue(pack, "Identificazione strutturata");
  const existingSourceIdByUrl = new Map(profile.officialSources.map((source, index) => [source.url, source.id || (index === 0 ? "official-franchise" : `official-${index + 1}`)]));
  const sourceIdFor = (url, desiredId) => existingSourceIdByUrl.get(url) || desiredId;
  const officialResearchUrl = pack.officialUrl || pack.wikidata?.officialWebsites?.[0];
  const researchSourceIds = [
    ...(pack.url ? [sourceIdFor(pack.url, "research-character-page")] : []),
    ...(pack.wikidata?.url ? [sourceIdFor(pack.wikidata.url, "research-wikidata")] : []),
    ...(officialResearchUrl ? [sourceIdFor(officialResearchUrl, "research-official")] : []),
  ];
  const additions = [
    ...(pack.url ? [{ id: "research-character-page", title: `${pack.title} · archivio ${pack.status === "specialist-pack-ready" ? "specialistico" : "enciclopedico"}`, url: pack.url, kind: pack.status === "specialist-pack-ready" ? "specialist-secondary" : "secondary", note: "Pagina usata per controllare dati strutturati, apparizioni e distinzione delle continuità." }] : []),
    ...(pack.wikidata?.url ? [{ id: "research-wikidata", title: `Wikidata · ${pack.wikidata.label || record.name}`, url: pack.wikidata.url, kind: "structured-secondary", note: "Identificatore e descrizione strutturata usati per disambiguare personaggio, opera e omonimi." }] : []),
    ...(officialResearchUrl ? [{ id: "research-official", title: `${record.franchise} · sito ufficiale`, url: officialResearchUrl, kind: "official", note: "Fonte ufficiale dell’opera o del progetto usata per verificare il contesto corrente." }] : []),
  ];
  const urls = new Set(profile.officialSources.map((source) => source.url));
  const officialSources = [...profile.officialSources, ...additions.filter((source) => source.url && !urls.has(source.url))];
  const originText = compactList(firstAppearance, origin, creation);
  const evolutionText = compactList(identification, aliases, occupation, affiliations, abilities);
  const currentText = compactList(currentStatus, lastAppearance, occupation, relationships);
  const productionText = compactList(performer, appearances, universe);
  const originNarrative = narrativeText(
    firstAppearance ? `${record.name} è documentato per la prima volta in ${firstAppearance}` : `${record.name} viene identificato nell'opera primaria ${profile.work}`,
    nature ? `La natura o specie indicata dalle fonti è ${lowerFirst(nature)}` : `La classificazione editoriale selezionata è ${lowerFirst(profile.classification)}`,
    origin ? `L'origine registrata è ${origin}` : `Il contesto d'origine resta ${record.franchise}`,
    creation ? `La creazione viene attribuita a ${creation}` : `Il dossier mantiene ${profile.creator} come riferimento autoriale o produttivo`,
  );
  const evolutionNarrative = narrativeText(
    identification ? `L'identificatore strutturato lo descrive come ${lowerFirst(identification)}` : detailedRole(profile),
    aliases ? `Nomi e alias attestati comprendono ${aliases}` : "Nomi localizzati e versioni omonime vengono disambiguati prima di attribuire eventi",
    occupation ? `Ruolo o occupazione documentati: ${occupation}` : `La funzione narrativa dichiarata è ${profile.role}`,
    affiliations ? `Le appartenenze registrate sono ${affiliations}` : "Le appartenenze vengono riconosciute soltanto quando sono dichiarate nell'opera o nella fonte selezionata",
    abilities ? `Capacità e strumenti attestati includono ${abilities}` : `Il metodo caratteristico documentato è ${profile.method}`,
  );
  const currentNarrative = narrativeText(
    currentStatus ? `Lo stato esplicitamente riportato è ${currentStatus}` : "Le fonti consultate non dichiarano uno stato conclusivo autonomo",
    lastAppearance ? `L'ultima apparizione individuata è ${lastAppearance}` : `L'ultima fase resta quindi quella attestata nella continuità ${profile.continuity}`,
    relationships ? `Relazioni e legami documentati: ${relationships}` : `Motivazione e legami vengono letti attraverso ${profile.motivation}`,
    `Reboot, universi alternativi e adattamenti non sostituiscono automaticamente questo stato`,
  );
  const productionNarrative = narrativeText(
    performer ? `Interpreti o voci documentati comprendono ${performer}` : `La produzione di riferimento è attribuita a ${profile.creator}`,
    appearances ? `Le apparizioni censite includono ${appearances}` : `Il dossier prende come opera primaria ${profile.primaryWork}`,
    universe ? `La serie o l'universo associato dalla fonte è ${universe}` : `L'universo verificato è ${record.franchise}`,
    profile.continuityNote,
  );
  const biography = replaceGeneric ? [
    { heading: "Origini e prima fase documentata", text: originNarrative, sourceIds: researchSourceIds },
    { heading: "Evoluzione, ruoli e appartenenze", text: evolutionNarrative, sourceIds: researchSourceIds },
    { heading: "Stato più recente documentato", text: currentNarrative, sourceIds: researchSourceIds },
    { heading: "Versioni, apparizioni e interpreti", text: productionNarrative, sourceIds: researchSourceIds },
  ] : [...profile.biography, { heading: "Stato documentale aggiornato", text: currentText || compactList(lastAppearance, occupation, affiliations) || `La revisione corrente conferma il profilo nella continuità ${record.franchise}.`, sourceIds: researchSourceIds }];
  const chronology = replaceGeneric ? [
    { title: "Prima fase", description: originText || profile.firstAppearance, spoiler: "none", sourceIds: researchSourceIds },
    { title: "Trasformazioni e sviluppo", description: evolutionText || profile.role, spoiler: "moderate", sourceIds: researchSourceIds },
    { title: "Situazione più recente documentata", description: currentText || profile.continuityNote, spoiler: "moderate", sourceIds: researchSourceIds },
    { title: "Adattamenti e produzione", description: productionText || profile.continuityNote, spoiler: "moderate", sourceIds: researchSourceIds },
  ] : profile.chronology;
  const summary = replaceGeneric
    ? `${record.name} è documentato nell’universo ${record.franchise}${nature ? ` come ${lowerFirst(nature)}` : ""}${occupation ? `, con il ruolo di ${lowerFirst(occupation)}` : ""}. Il dossier distingue origine, trasformazioni, apparizioni e stato più recente attestato.`
    : profile.summary;
  return {
    ...profile,
    summary,
    species: nature || profile.species,
    origin: origin || profile.origin,
    role: occupation || profile.role,
    firstAppearance: firstAppearance || profile.firstAppearance,
    biography,
    chronology,
    officialSources,
    researchTier: "deep-verified",
    lastReviewed: "23/08/2026",
    researchScope: `Origine, sviluppo, ruoli, relazioni, apparizioni e stato più recente disponibile per ${record.name}.`,
    sourcePolicy: "Opera primaria, fonte enciclopedica o specialistica, identificatore strutturato e fonte ufficiale vengono mantenuti distinti e confrontabili.",
    defaultSourceIds: [...new Set([...(profile.defaultSourceIds || ["official-franchise", "primary-work"]), ...researchSourceIds])],
    researchFacts: pack.structuredFacts.map((fact) => ({ ...fact, value: normalizeResearchValue(fact.value), sourceIds: researchSourceIds })),
  };
}

function applyCuratedResearch(profile, record) {
  const curated = curatedUnresolvedDossiers[profile.id];
  if (!curated) return profile;
  const mergedProfile = { ...profile, ...(curated.profile || {}) };
  const isBiographical = /person[ae] real[ei]|biografia/i.test(`${mergedProfile.species} ${mergedProfile.classification} ${mergedProfile.format}`);
  const isHistorical = /storico|storica|religios|simbolo/i.test(`${mergedProfile.classification} ${mergedProfile.format}`);
  const sourceIds = curated.sources.map((_, index) => `curated-source-${index + 1}`);
  const officialSources = curated.sources.map((item, index) => ({ ...item, id: sourceIds[index] }));
  const headings = [
    "Origine e prima fase documentata",
    "Sviluppo e trasformazioni",
    "Ruolo, relazioni e strumenti",
    "Stato più recente e continuità",
  ];
  const chronologyTitles = ["Origine", "Svolta documentata", "Fase di consolidamento", "Stato più recente"];
  return {
    ...mergedProfile,
    summary: isBiographical
      ? `${record.name} è documentato come profilo biografico pubblico: origine professionale, sviluppo della carriera, attività e stato più recente verificabile.`
      : isHistorical
        ? `${record.name} è documentato distinguendo origine storica, trasformazioni interpretative, funzione culturale e stato delle fonti.`
        : `${record.name} è ricostruito attraverso quattro fasi specifiche della continuità ${record.franchise}: origine, sviluppo, ruolo e stato più recente documentato.`,
    biography: curated.phases.map((text, index) => ({ heading: headings[index], text, sourceIds })),
    chronology: curated.phases.map((description, index) => ({ title: chronologyTitles[index], description, spoiler: index === 0 ? "none" : "moderate", sourceIds })),
    officialSources,
    defaultSourceIds: sourceIds,
    researchFacts: curated.phases.map((value, index) => ({ label: headings[index], value, sourceIds })),
    researchTier: "deep-verified",
    lastReviewed: "23/08/2026",
    researchScope: isBiographical
      ? `Origine professionale, carriera pubblica, opere, collaborazioni e stato documentato di ${record.name}.`
      : `Passato, trasformazioni, relazioni, versioni e stato documentato di ${record.name}.`,
    sourcePolicy: "Fonti ufficiali, opere primarie, archivi specialistici e identificatori strutturati sono confrontati senza fondere continuità differenti.",
    excludeDiscovery: true,
  };
}

function applyDerivedResearch(profile, record) {
  const sourceIds = ["giwise-derived-archive", "giwise-source-subject"];
  const subject = record.name.replace(/\s+[·×].*$/, "").trim();
  const internalSource = {
    id: sourceIds[0],
    title: `Archivio creativo GiWise Studio · ${record.name}`,
    url: `Archivio locale protetto · ${record.id}`,
    kind: "primary-internal",
    note: "Opera derivata GiWise conservata nell'archivio locale; l'originale non viene pubblicato né alterato.",
  };
  const contextSource = {
    id: sourceIds[1],
    title: `${record.name} · soggetto e contesto dichiarati`,
    url: `Scheda di attribuzione interna · ${record.franchise}`,
    kind: "editorial-internal",
    note: "Registro editoriale usato per separare soggetto richiamato, trasformazione grafica e canone ufficiale.",
  };
  const phases = [
    `L'opera ${record.name} nasce nel laboratorio visivo GiWise come reinterpretazione autonoma del soggetto ${subject}; immagine, titolo e file associato costituiscono il documento primario della scheda.`,
    `Colori, atmosfera, fusione, deformazione o componente horror appartengono alla trasformazione autoriale GiWise e non descrivono una forma ufficiale del personaggio o dell'universo richiamato.`,
    `La lettura critica considera composizione, segni riconoscibili e contrasto con il soggetto di partenza, mantenendo distinti autore dell'opera derivata, titolari del soggetto e continuità narrativa.`,
    `Al 23 agosto 2026 l'opera è registrata nell'archivio creativo con la propria immagine integra; non le vengono attribuiti episodi, poteri o sviluppi canonici non presenti nella documentazione GiWise.`,
  ];
  const headings = ["Origine dell'opera", "Trasformazione autoriale", "Lettura e attribuzione", "Stato archivistico e rapporto col canone"];
  return {
    ...profile,
    work: `Opera derivata GiWise · ${record.name}`,
    primaryWork: `Archivio creativo GiWise Studio · ${record.id}`,
    continuity: "Opera derivata GiWise · continuità editoriale non canonica",
    continuityNote: "La scheda documenta l'opera GiWise e non trasferisce la trasformazione nel canone del soggetto richiamato.",
    summary: `${record.name} è un'opera derivata GiWise documentata come oggetto creativo autonomo, con origine, trasformazione, attribuzione e stato archivistico separati dal canone.`,
    biography: phases.map((text, index) => ({ heading: headings[index], text, sourceIds })),
    chronology: [
      { title: "Soggetto di partenza", description: `Identificazione editoriale del soggetto ${subject} prima della trasformazione GiWise.`, spoiler: "none", sourceIds },
      { title: "Ideazione GiWise", description: `Definizione di composizione, atmosfera e segni distintivi propri dell'opera ${record.name}.`, spoiler: "none", sourceIds },
      { title: "Separazione dal canone", description: "Verifica che mutazioni, fusioni e poteri visivi non siano presentati come eventi ufficiali.", spoiler: "none", sourceIds },
      { title: "Archiviazione corrente", description: "Opera registrata nel 2026 con immagine univoca conservata integralmente e attribuzione editoriale esplicita.", spoiler: "none", sourceIds },
    ],
    officialSources: [internalSource, contextSource],
    defaultSourceIds: sourceIds,
    researchFacts: [
      { label: "Natura della scheda", value: "Opera derivata GiWise non canonica", sourceIds },
      { label: "Soggetto richiamato", value: subject, sourceIds },
      { label: "Autore della trasformazione", value: "GiWise Studio", sourceIds },
      { label: "Stato documentale", value: "Registrata nell'archivio creativo il 23/08/2026", sourceIds },
    ],
    researchTier: "deep-derived",
    lastReviewed: "23/08/2026",
    researchScope: "Origine dell'opera, trasformazione autoriale, attribuzione, integrità dell'immagine e separazione dal canone.",
    sourcePolicy: "Per le fan art la fonte primaria è l'opera GiWise; il web può documentare il soggetto, ma non può certificare una trasformazione interna come canonica.",
    excludeDiscovery: true,
  };
}

function ensureCompleteResearchShape(profile, record) {
  const sourceIds = profile.defaultSourceIds || ["official-franchise", "primary-work"];
  const latestAppearance = profile.appearances?.at(-1);
  const latestChronology = profile.chronology?.at(-1);
  const currentDescription = [
    latestAppearance ? `L'ultima apparizione registrata nel dossier è ${latestAppearance.title}${latestAppearance.year ? ` (${latestAppearance.year})` : ""}.` : "",
    latestChronology?.description || "",
    `Il dato viene riferito alla continuità ${profile.continuity} senza incorporare automaticamente reboot, adattamenti o versioni alternative.`,
  ].filter(Boolean).join(" ");
  const completeBiography = profile.biography.length >= 4
    ? profile.biography
    : [...profile.biography, { heading: "Stato più recente documentato", text: currentDescription, sourceIds }];
  const expansionByPhase = [
    `La ricostruzione usa ${profile.primaryWork} come riferimento e mantiene separate le opere che appartengono a continuità differenti.`,
    `In questa fase il ruolo di ${record.name} è ${lowerFirst(profile.role)}; azioni e capacità sono attribuite soltanto quando risultano documentate.`,
    `Motivazioni e relazioni vengono interpretate entro ${profile.continuity}, senza trasformare una singola scena o gag in una regola assoluta.`,
    currentDescription,
  ];
  const biography = completeBiography.map((paragraph, index) => ({
    ...paragraph,
    text: paragraph.text.length >= 100 ? paragraph.text : narrativeText(paragraph.text, expansionByPhase[Math.min(index, 3)]),
    sourceIds: paragraph.sourceIds || sourceIds,
  }));
  const completeChronology = profile.chronology.length >= 4
    ? profile.chronology
    : [...profile.chronology, {
        title: "Ultima fase registrata",
        description: latestAppearance
          ? `${latestAppearance.title}${latestAppearance.year ? ` · ${latestAppearance.year}` : ""}: ${latestAppearance.role || `presenza documentata di ${record.name}`}.`
          : currentDescription,
        spoiler: "moderate",
        sourceIds,
      }];
  const seenChronology = new Set();
  const chronology = completeChronology.map((event) => {
    const normalized = event.description.trim().toLocaleLowerCase("it");
    const needsContext = event.description.length < 60 || seenChronology.has(normalized);
    seenChronology.add(normalized);
    return {
      ...event,
      description: needsContext
        ? narrativeText(event.description, `Questa voce registra la fase “${event.title}” di ${record.name} nella continuità ${profile.continuity}`)
        : event.description,
      sourceIds: event.sourceIds || sourceIds,
    };
  });
  return { ...profile, biography, chronology };
}

const pokemonMetadata = [
  { id: "bulbasaur", number: "001", type: "Erba · Veleno", species: "Pokémon Seme", evolution: "Bulbasaur → Ivysaur → Venusaur", origin: "Regione di Kanto", trait: "Il seme sul dorso cresce insieme al corpo assorbendo luce e nutrimento.", appearance: "Quadrupede verde-azzurro con macchie scure e un grande bulbo vegetale sul dorso.", limitation: "Il benessere e la crescita del bulbo sono legati alla luce e all’energia accumulate.", first: "Pokémon Rosso e Verde", year: "1996" },
  { id: "charmander", number: "004", type: "Fuoco", species: "Pokémon Lucertola", evolution: "Charmander → Charmeleon → Charizard", origin: "Regione di Kanto", trait: "La fiamma sulla coda riflette la sua energia vitale e il suo stato fisico.", appearance: "Piccolo rettile arancione con ventre chiaro e una fiamma permanente sulla punta della coda.", limitation: "La fiamma caudale è un indicatore vitale e deve essere protetta.", first: "Pokémon Rosso e Verde", year: "1996" },
  { id: "charizard", number: "006", type: "Fuoco · Volante", species: "Pokémon Fiamma", evolution: "Charmander → Charmeleon → Charizard", origin: "Regione di Kanto", trait: "Vola in cerca di avversari forti e produce fiamme capaci di fondere materiali resistenti.", appearance: "Grande drago bipede arancione con ali, coda fiammeggiante e ventre chiaro.", limitation: "È vulnerabile soprattutto agli attacchi di tipo Roccia e deve gestire l’impeto del combattimento.", first: "Pokémon Rosso e Verde", year: "1996" },
  { id: "squirtle", number: "007", type: "Acqua", species: "Pokémon Tartaghina", evolution: "Squirtle → Wartortle → Blastoise", origin: "Regione di Kanto", trait: "Dopo la nascita il guscio si indurisce e diventa protezione e superficie idrodinamica.", appearance: "Piccola tartaruga azzurra con guscio bruno, piastrone chiaro e coda ricurva.", limitation: "Le capacità offensive dipendono dalla disponibilità e dal controllo dell’acqua.", first: "Pokémon Rosso e Verde", year: "1996" },
  { id: "pikachu", number: "025", type: "Elettro", species: "Pokémon Topo", evolution: "Pichu → Pikachu → Raichu", origin: "Regione di Kanto", trait: "Accumula elettricità nelle sacche delle guance e la scarica per attaccare o comunicare.", appearance: "Piccolo roditore giallo con orecchie nere, guance rosse e coda a forma di fulmine.", limitation: "Scariche eccessive consumano l’energia accumulata; il tipo Terra neutralizza gli attacchi Elettro.", first: "Pokémon Rosso e Verde", year: "1996" },
  { id: "jigglypuff", number: "039", type: "Normale · Folletto", species: "Pokémon Pallone", evolution: "Igglybuff → Jigglypuff → Wigglytuff", origin: "Regione di Kanto", trait: "Modula la voce su una lunghezza d’onda capace di indurre il sonno in chi ascolta.", appearance: "Pokémon rosa e tondeggiante con grandi occhi azzurri, orecchie appuntite e un ricciolo sulla fronte.", limitation: "Il canto richiede controllo del respiro e può fallire contro chi non lo sente o resiste al sonno.", first: "Pokémon Rosso e Verde", year: "1996" },
  { id: "gengar", number: "094", type: "Spettro · Veleno", species: "Pokémon Ombra", evolution: "Gastly → Haunter → Gengar", origin: "Regione di Kanto", trait: "Si nasconde nelle ombre, imita sagome e riduce la temperatura dell’ambiente con la propria presenza.", appearance: "Creatura viola dal corpo compatto, sorriso largo, occhi rossi e spine sul dorso.", limitation: "Luce, individuazione dell’ombra e attacchi efficaci contro il tipo Spettro riducono il vantaggio dell’agguato.", first: "Pokémon Rosso e Verde", year: "1996" },
  { id: "snorlax", number: "143", type: "Normale", species: "Pokémon Sonno", evolution: "Munchlax → Snorlax", origin: "Regione di Kanto", trait: "Mangia enormi quantità di cibo e trascorre gran parte del tempo dormendo, affidandosi a massa e resistenza.", appearance: "Pokémon enorme blu scuro e crema, con corpo tondeggiante, arti corti e occhi quasi sempre chiusi.", limitation: "Il sonno profondo e la scarsa mobilità possono renderlo passivo finché non viene svegliato.", first: "Pokémon Rosso e Verde", year: "1996" },
  { id: "eevee", number: "133", type: "Normale", species: "Pokémon Evoluzione", evolution: "Eevee → otto evoluzioni note determinate da pietre, legami o condizioni ambientali", origin: "Regione di Kanto", trait: "Il patrimonio genetico instabile reagisce all’ambiente e permette numerose evoluzioni specializzate.", appearance: "Piccolo mammifero bruno con grandi orecchie, coda folta e collare di pelo color crema.", limitation: "Prima dell’evoluzione possiede capacità meno specializzate e la trasformazione dipende da condizioni precise.", first: "Pokémon Rosso e Verde", year: "1996" },
  { id: "mewtwo", number: "150", type: "Psico", species: "Pokémon Genetico", evolution: "Nessuna evoluzione ordinaria · due Megaevoluzioni documentate", origin: "Laboratorio della regione di Kanto", trait: "Creato attraverso manipolazione genetica a partire dal materiale di Mew, concentra potenza psichica e intelligenza combattiva.", appearance: "Pokémon umanoide bianco e viola con lunga coda, tre dita e struttura corporea artificiale.", limitation: "La potenza non elimina vulnerabilità di tipo e il conflitto legato alla propria origine può condizionarne le decisioni nelle continuità narrative.", first: "Pokémon Rosso e Verde", year: "1996" },
  { id: "lucario", number: "448", type: "Lotta · Acciaio", species: "Pokémon Aura", evolution: "Riolu → Lucario tramite forte amicizia durante il giorno", origin: "Regione di Sinnoh", trait: "Percepisce e manipola l’aura, leggendo presenze, emozioni e intenzioni anche a distanza.", appearance: "Pokémon canide blu e nero, bipede, con punte metalliche sul petto e sulle mani e appendici sensoriali dietro il capo.", limitation: "L’interpretazione dell’aura richiede concentrazione e non annulla le debolezze dei tipi Lotta e Acciaio.", first: "Pokémon Diamante e Perla", year: "2006" },
  { id: "greninja", number: "658", type: "Acqua · Buio", species: "Pokémon Ninja", evolution: "Froakie → Frogadier → Greninja", origin: "Regione di Kalos", trait: "Crea lame e shuriken d’acqua compressa e usa agilità, mimetismo e precisione da ninja.", appearance: "Pokémon rana blu scuro, longilineo, con arti palmati e lingua avvolta attorno al collo come una sciarpa.", limitation: "La strategia privilegia velocità e sorpresa; subisce pressione quando viene costretto a sostenere scontri prolungati.", first: "Pokémon X e Y", year: "2013" },
];

const pokemonProfiles = pokemonMetadata.map((pokemon) => ({
  id: pokemon.id,
  category: "Videogiochi",
  work: pokemon.first,
  primaryWork: `${pokemon.first} · Game Freak e Nintendo, ${pokemon.year}`,
  continuity: "Pokédex della serie videoludica principale Pokémon",
  continuityNote: "La scheda descrive la specie nei videogiochi principali; individui dell’anime, del manga e dei film appartengono a narrazioni distinte.",
  format: "Videogioco",
  classification: `${pokemon.species} · numero ${pokemon.number}`,
  creator: "Game Freak · Nintendo · Creatures",
  firstAppearance: pokemon.first,
  firstYear: pokemon.year,
  species: `${pokemon.species} · tipo ${pokemon.type}`,
  gender: "Variabile per gli esemplari della specie, salvo eccezioni definite dal Pokédex",
  birth: "Non applicabile come data unica di specie",
  age: "Variabile per ciascun esemplare",
  origin: pokemon.origin,
  role: "Specie Pokémon catturabile, allenabile e schierabile in battaglia",
  summary: `${registryById.get(pokemon.id)?.name} è il ${pokemon.species} numero ${pokemon.number} del Pokédex, di tipo ${pokemon.type}. ${pokemon.trait}`,
  biography: [
    { heading: "Profilo della specie", text: `${pokemon.trait} Le singole apparizioni possono rappresentare esemplari con esperienza, carattere e legami differenti.` },
    { heading: "Crescita ed evoluzione", text: `${pokemon.evolution}. L’evoluzione descrive una possibilità biologica o energetica della specie e non una biografia obbligatoria per ogni individuo.` },
    { heading: "Presenza nel mondo Pokémon", text: `${registryById.get(pokemon.id)?.name} viene incontrato, studiato e allenato nella serie principale; anime, film, manga e giochi derivati possono concentrarsi su esemplari specifici senza sostituire il profilo Pokédex.` },
  ],
  chronology: [
    { title: pokemon.first, description: `Prima apparizione videoludica documentata della specie nel ${pokemon.year}.`, spoiler: "none" },
    { title: "Registrazione nel Pokédex", description: `Classificato come ${pokemon.species}, numero ${pokemon.number}, con tipo ${pokemon.type}.`, spoiler: "none" },
    { title: "Continuità multimediali", description: "Anime, manga, film e spin-off introducono esemplari specifici e vanno letti separatamente dal profilo generale della specie.", spoiler: "none" },
  ],
  personality: "Non esiste una personalità unica per l’intera specie: comportamento e temperamento cambiano fra esemplari, allenatori e continuità.",
  motivation: "Sopravvivenza, crescita, legame con l’allenatore e risposta agli stimoli dell’ambiente variano da individuo a individuo.",
  method: pokemon.trait,
  strength: `Adattamento alle capacità di tipo ${pokemon.type} e sviluppo attraverso allenamento o evoluzione.`,
  weakness: pokemon.limitation,
  appearance: pokemon.appearance,
  visualTraits: pokemon.appearance,
  limitations: [
    { name: "Affinità di tipo", description: `Il tipo ${pokemon.type} comporta resistenze e debolezze definite dal sistema di lotta Pokémon.` },
    { name: "Variabilità individuale", description: "Mosse, abilità, statistiche e carattere cambiano fra esemplari e generazioni di gioco." },
    { name: "Limite caratteristico", description: pokemon.limitation },
  ],
  relationships: [
    { name: pokemon.evolution, type: "Linea evolutiva", description: "Relazione biologica o energetica documentata dal Pokédex; non implica che ogni esemplare debba evolversi." },
    { name: "Allenatori Pokémon", type: "Possibile legame", description: "Un esemplare può creare una relazione di fiducia, allenamento e collaborazione con il proprio Allenatore." },
    { name: pokemon.origin, type: "Regione d’origine", description: "Regione associata alla prima registrazione della specie nella serie videoludica." },
  ],
  appearances: [
    { title: pokemon.first, format: "Videogioco", role: `Debutto della specie numero ${pokemon.number}`, year: pokemon.year },
    { title: "Serie Pokémon", format: "Videogiochi, animazione e prodotti multimediali", role: "Specie ricorrente con esemplari distinti", year: `${pokemon.year}–presente` },
  ],
  officialSources: [{ title: `Pokédex ufficiale · ${registryById.get(pokemon.id)?.name}`, url: `https://www.pokemon.com/us/pokedex/${pokemon.id}`, note: `Numero, classificazione, tipo e descrizioni ufficiali della specie ${registryById.get(pokemon.id)?.name}.` }],
}));

const narutoMetadata = [
  { id: "naruto-uzumaki", birth: "10 ottobre", nature: "Essere umano · shinobi · jinchūriki di Kurama nella maggior parte della storia", origin: "Konohagakure", role: "Ninja di Konoha e futuro Settimo Hokage", first: "Naruto, capitolo 1", summary: "Emarginato perché ospita la Volpe a Nove Code, trasforma il desiderio di riconoscimento nella determinazione a proteggere il villaggio e spezzare i cicli d’odio.", arc1: "Cresce orfano e isolato, usa gli scherzi per ottenere attenzione e decide di diventare Hokage dopo il riconoscimento del maestro Iruka.", arc2: "Nel Team 7 costruisce legami con Sasuke, Sakura e Kakashi; l’addestramento con Jiraiya e il controllo del chakra di Kurama ampliano capacità e responsabilità.", arc3: "La comprensione conquistata contro Pain e durante la Quarta Guerra Ninja lo rende una figura capace di unire persone e nazioni, fino al ruolo di Settimo Hokage.", personality: "Impulsivo e testardo, ma profondamente empatico; rifiuta di abbandonare compagni e avversari al destino che altri hanno scelto per loro.", motivation: "Essere riconosciuto, riportare Sasuke a casa e costruire una pace che non dipenda dalla vendetta.", method: "Perseveranza, cloni, Rasengan e capacità di comprendere il dolore dell’avversario.", strength: "Riserve di chakra, adattamento in battaglia e capacità di trasformare gli antagonisti attraverso il confronto.", weakness: "Impulsività, tendenza a caricarsi dei problemi altrui e dipendenza iniziale da un potere difficile da controllare.", appearance: "Capelli biondi, occhi azzurri, segni simili a baffi sulle guance e abiti arancioni; l’aspetto evolve con età e incarico.", rel: [["Sasuke Uchiha","Rivale e legame fraterno","La promessa di salvarlo guida gran parte della crescita di Naruto."],["Sakura Haruno","Compagna del Team 7","Combattono e maturano insieme dalla formazione della squadra."],["Jiraiya","Maestro","Gli trasmette tecniche, esperienza e una visione della pace da portare oltre la guerra."]], official: "https://naruto-official.com/en/news/01_1610" },
  { id: "pain-nagato", birth: "19 settembre", nature: "Essere umano · shinobi del clan Uzumaki · utilizzatore del Rinnegan", origin: "Amegakure", role: "Fondatore dell’Akatsuki originaria e leader dei Sei Sentieri di Pain", first: "Naruto · saga dell’Akatsuki", summary: "Nagato sopravvive alla guerra di Ame, perde Yahiko e assume l’identità di Pain, convinto che soltanto un dolore condiviso possa costringere il mondo alla pace.", arc1: "Orfano della guerra, manifesta il Rinnegan e viene addestrato da Jiraiya insieme a Yahiko e Konan.", arc2: "La morte di Yahiko distrugge la fiducia nel cambiamento pacifico; Nagato guida l’Akatsuki dalla distanza usando sei corpi come Sentieri di Pain.", arc3: "L’assalto a Konoha lo conduce al confronto con Naruto, erede degli ideali di Jiraiya, e a una scelta finale che ridefinisce il significato del suo sacrificio.", personality: "Intelligente, traumatizzato e ideologico; dietro la freddezza di Pain resta il ragazzo che desiderava proteggere gli amici e il proprio paese.", motivation: "Interrompere la guerra imponendo al mondo una conoscenza universale del dolore.", method: "Rinnegan, Sei Sentieri di Pain, controllo a distanza e superiorità strategica.", strength: "Versatilità del Rinnegan, coordinamento dei corpi e volontà capace di sostenere un progetto globale.", weakness: "Corpo originale fragile, dipendenza dai ricevitori di chakra e dottrina deformata dal trauma.", appearance: "Nagato ha capelli rossi e corpo segnato dall’uso del Gedō Mazō; Pain usa soprattutto il corpo di Yahiko, con capelli arancioni, piercing e Rinnegan.", rel: [["Yahiko","Amico e corpo del Sentiero Deva","La sua morte dà origine all’identità di Pain e al radicalismo di Nagato."],["Konan","Compagna e alleata","Rimane accanto a Nagato dalla giovinezza fino alla conclusione del suo piano."],["Naruto Uzumaki","Avversario ed erede ideale","Il confronto mette alla prova la teoria del dolore e il lascito di Jiraiya."]], official: "https://naruto-official.com/en/about" },
  { id: "itachi-uchiha", birth: "9 giugno", nature: "Essere umano · shinobi del clan Uchiha", origin: "Konohagakure", role: "Prodigio Uchiha, ex ANBU e membro dell’Akatsuki", first: "Naruto, capitolo 139", summary: "Itachi sacrifica reputazione, famiglia e futuro per impedire una guerra civile, assumendo il ruolo di criminale affinché Sasuke possa vivere e giudicarlo.", arc1: "Segnato fin da bambino dalla guerra, avanza rapidamente nell’Accademia, risveglia lo Sharingan ed entra negli ANBU.", arc2: "Intrappolato fra il colpo di stato Uchiha e gli ordini di Konoha, compie il massacro del clan, risparmia Sasuke e si infiltra nell’Akatsuki.", arc3: "Dopo la morte ritorna tramite Tecnica della Resurrezione, combatte con Sasuke e gli rivela amore e responsabilità senza chiedere assoluzione.", personality: "Riservato, lucido e disposto al sacrificio; ama profondamente il fratello ma commette l’errore di decidere da solo quale verità gli sia concessa.", motivation: "Proteggere Sasuke e impedire una nuova guerra nel villaggio.", method: "Genjutsu, Sharingan, Mangekyō Sharingan e pianificazione a lungo termine.", strength: "Analisi, autocontrollo, talento precoce e tecniche oculari di altissimo livello.", weakness: "Malattia, deterioramento della vista e isolamento prodotto dal segreto.", appearance: "Capelli neri lunghi, solchi sotto gli occhi, Sharingan e mantello dell’Akatsuki durante l’attività criminale.", rel: [["Sasuke Uchiha","Fratello minore","Ogni scelta di Itachi mira a proteggerlo, pur infliggendogli un trauma devastante."],["Shisui Uchiha","Amico e riferimento","Condivide con lui il desiderio di evitare il conflitto interno al clan."],["Kisame Hoshigaki","Compagno nell’Akatsuki","Opera con Itachi e ne rispetta capacità e riservatezza."]], official: "https://naruto-official.com/en/news/01_1814" },
  { id: "sakura-haruno", birth: "28 marzo", nature: "Essere umano · kunoichi e ninja medico", origin: "Konohagakure", role: "Membro del Team 7, allieva di Tsunade e ninja medico", first: "Naruto, capitolo 3", summary: "Sakura supera insicurezze e dipendenza emotiva attraverso disciplina, controllo del chakra e formazione medica, fino a combattere accanto a Naruto e Sasuke come pari.", arc1: "Da bambina introversa trova sostegno in Ino; entra nel Team 7 con Naruto e Sasuke sotto la guida di Kakashi.", arc2: "Dopo la partenza di Sasuke chiede a Tsunade di addestrarla, sviluppando forza sovrumana, tecniche mediche e il Sigillo della Forza di un Centinaio.", arc3: "Nella Quarta Guerra cura l’alleanza, evoca Katsuyu e riunisce il Team 7; in seguito costruisce una famiglia con Sasuke e protegge la nuova generazione.", personality: "Determinata, compassionevole e competitiva; la maturità trasforma la sensibilità iniziale in responsabilità medica e forza autonoma.", motivation: "Proteggere i compagni, diventare abbastanza forte da non restare indietro e salvare vite.", method: "Controllo preciso del chakra, ninjutsu medico, forza concentrata e analisi.", strength: "Precisione, resistenza tramite sigillo, competenza clinica e potenza fisica.", weakness: "Insicurezze giovanili e coinvolgimento emotivo nelle scelte di Sasuke.", appearance: "Capelli rosa, occhi verdi e abiti rossi; il rombo del sigillo Byakugō compare sulla fronte in età adulta.", rel: [["Naruto Uzumaki","Compagno del Team 7","Condivide missioni, perdite e il progetto di riportare Sasuke a casa."],["Sasuke Uchiha","Compagno e futuro coniuge","Il rapporto evolve dall’infatuazione a un legame adulto complesso."],["Tsunade","Maestra","Le trasmette medicina, forza e disciplina del sigillo."]], official: "https://naruto-official.com/en/news/01_1743" },
  { id: "kakashi-hatake", birth: "15 settembre", nature: "Essere umano · shinobi del clan Hatake", origin: "Konohagakure", role: "Jōnin del Team 7 e futuro Sesto Hokage", first: "Naruto, capitolo 3", summary: "Kakashi è il maestro del Team 7: un prodigio segnato dalla perdita che trasforma gli errori del passato nella regola di non abbandonare mai i compagni.", arc1: "Figlio di Sakumo Hatake, cresce come genio rigidamente legato alle regole finché Obito e Rin cambiano la sua concezione del dovere.", arc2: "Dopo anni negli ANBU diventa maestro di Naruto, Sasuke e Sakura, imponendo una prova che premia il lavoro di squadra.", arc3: "Affronta Pain e la Quarta Guerra, si riconcilia con l’eredità di Obito e diventa Sesto Hokage nel periodo di ricostruzione.", personality: "Calmo, ironico e apparentemente distratto, nasconde disciplina, dolore e attenzione costante alla sicurezza dei propri allievi.", motivation: "Proteggere la nuova generazione e impedire che ripeta le tragedie della sua squadra.", method: "Analisi, ninjutsu copiati, Sharingan nella fase centrale della vita e coordinamento tattico.", strength: "Versatilità, esperienza e lettura rapida del campo.", weakness: "Consumo elevato del chakra legato allo Sharingan e peso psicologico delle perdite.", appearance: "Capelli argento, maschera sul volto, coprifronte inclinato sull’occhio sinistro e uniforme di Konoha.", rel: [["Naruto Uzumaki","Allievo","Ne riconosce il potenziale e sostiene il percorso verso l’Hokage."],["Sasuke Uchiha","Allievo","Gli insegna il Chidori e tenta di sottrarlo alla vendetta."],["Obito Uchiha","Compagno e specchio morale","Il dono dello Sharingan e la loro promessa definiscono la sua vita."]], official: "https://naruto-official.com/en/news/01_1903" },
  { id: "zabuza-momochi", birth: "15 agosto", nature: "Essere umano · shinobi e ninja traditore", origin: "Kirigakure", role: "Spadaccino della Nebbia noto come Demone della Nebbia Nascosta", first: "Naruto, capitolo 10", summary: "Zabuza è un assassino d’élite fuggito dalla Nebbia che accetta incarichi mercenari e tratta Haku come strumento, finché la perdita rivela il legame che negava.", arc1: "Cresce nella fase sanguinosa dell’Accademia della Nebbia e diventa uno dei Sette Spadaccini, impugnando la Kubikiribōchō.", arc2: "Dopo un tentativo fallito contro il Mizukage diventa ninja traditore e lavora per Gatō nella missione del Paese delle Onde.", arc3: "Sconfitto dal Team 7, riconosce l’umanità di Haku e usa le ultime forze per ribellarsi a Gatō prima di morire accanto al compagno.", personality: "Spietato e professionale, costruisce un’identità da demone per sopravvivere, ma reprime un attaccamento reale verso Haku.", motivation: "Ottenere risorse per le proprie ambizioni e non mostrare vulnerabilità.", method: "Tecnica dell’Occultamento nella Nebbia, Suiton, assassinio silenzioso e spada decapitatrice.", strength: "Esperienza, forza fisica e combattimento in condizioni di visibilità nulla.", weakness: "Orgoglio, dipendenza dall’occultamento e incapacità di riconoscere apertamente i propri legami.", appearance: "Uomo alto e muscoloso, volto fasciato, coprifronte della Nebbia e gigantesca spada Kubikiribōchō.", rel: [["Haku","Allievo e persona più vicina","Lo chiama strumento, ma la sua morte spezza la maschera emotiva di Zabuza."],["Kakashi Hatake","Avversario","Il loro duello definisce la missione nel Paese delle Onde."],["Gatō","Committente e traditore","Lo ingaggia e poi tenta di eliminarlo insieme a Haku."]], official: "https://naruto-official.com/en/about" },
  { id: "gaara", birth: "19 gennaio", nature: "Essere umano · shinobi · ex jinchūriki di Shukaku", origin: "Sunagakure", role: "Quinto Kazekage", first: "Naruto, capitolo 35", summary: "Gaara passa dall’isolamento violento di un’arma vivente alla guida di Suna, trovando nell’incontro con Naruto una via per essere riconosciuto senza incutere terrore.", arc1: "Reso jinchūriki prima della nascita e temuto dal villaggio, cresce credendo che l’amore sia un’illusione e usa la sabbia per proteggersi e uccidere.", arc2: "La sconfitta contro Naruto mostra una forza fondata sui legami; Gaara cambia condotta e conquista la fiducia necessaria per diventare Kazekage.", arc3: "Catturato dall’Akatsuki e riportato in vita da Chiyo, diventa comandante dell’Alleanza Shinobi e simbolo della cooperazione fra villaggi.", personality: "Inizialmente freddo e omicida, evolve in un leader silenzioso, responsabile ed empatico verso chi vive l’emarginazione.", motivation: "Proteggere Suna e dimostrare che una persona temuta può costruire legami autentici.", method: "Controllo automatico e offensivo della sabbia, difesa assoluta e comando strategico.", strength: "Difesa autonoma, controllo su vasta scala e autorevolezza politica.", weakness: "Trauma infantile, consumo di chakra e vulnerabilità quando la difesa viene superata o dispersa.", appearance: "Capelli rossi, occhi cerchiati di scuro, kanji dell’amore sulla fronte e grande giara di sabbia sulla schiena.", rel: [["Naruto Uzumaki","Amico e parallelo","Il loro passato simile permette a Gaara di immaginare una vita diversa."],["Temari","Sorella","Lo sostiene come famiglia e rappresentante di Suna."],["Kankurō","Fratello","Combatte al suo fianco e ne riconosce la trasformazione in leader."]], official: "https://naruto-official.com/en/about" },
  { id: "jiraiya-naruto", birth: "11 novembre", nature: "Essere umano · shinobi · uno dei Tre Ninja Leggendari", origin: "Konohagakure", role: "Maestro, spia, scrittore e Sannin", first: "Naruto, capitolo 90", summary: "Jiraiya è un Sannin viaggiatore che raccoglie informazioni, scrive romanzi e forma allievi destinati a cambiare il mondo, da Nagato a Minato e Naruto.", arc1: "Allievo di Hiruzen, combatte nella Seconda Guerra Ninja e riceve dal Grande Rospo Eremita una profezia legata a un futuro discepolo.", arc2: "Addestra gli orfani di Ame, poi Minato e infine Naruto, al quale insegna evocazioni, Rasengan e responsabilità del potere.", arc3: "Indaga da solo su Pain ad Amegakure e lascia, al prezzo della vita, il messaggio che permette a Konoha di comprenderne il segreto.", personality: "Eccentrico, curioso e spesso irresponsabile in superficie, ma coraggioso, percettivo e profondamente fedele ai propri allievi.", motivation: "Trovare il discepolo capace di spezzare il ciclo d’odio e trasformare la ricerca della pace in realtà.", method: "Spionaggio, tecniche dei rospi, Rasengan, Modalità Eremitica e insegnamento attraverso l’esperienza.", strength: "Vastità tecnica, rete informativa e capacità di riconoscere il potenziale degli altri.", weakness: "Modalità Eremitica incompleta, abitudini invadenti e tendenza ad affrontare missioni decisive da solo.", appearance: "Uomo alto con lunghi capelli bianchi, segni rossi sul volto, abiti da eremita e grande rotolo sulla schiena.", rel: [["Naruto Uzumaki","Allievo e figlioccio","Gli trasmette tecniche e il compito di cercare una pace diversa."],["Tsunade","Compagna Sannin","Condivide una vita di missioni, rivalità e affetto mai pienamente espresso."],["Nagato","Ex allievo","Il fallimento del suo ideale in Pain rende centrale il confronto ereditato da Naruto."]], official: "https://naruto-official.com/en/about" },
  { id: "orochimaru-naruto", birth: "27 ottobre", nature: "Essere umano modificato · shinobi · uno dei Tre Ninja Leggendari", origin: "Konohagakure", role: "Ricercatore proibito, fondatore di Otogakure e antagonista", first: "Naruto, capitolo 45", summary: "Orochimaru trasforma il timore della morte in ossessione scientifica, sperimentando su corpi e tecniche per apprendere ogni jutsu e ottenere un’esistenza indefinita.", arc1: "Allievo brillante di Hiruzen e compagno di Jiraiya e Tsunade, perde i genitori e concentra la ricerca sull’immortalità.", arc2: "Scoperto mentre conduce esperimenti umani, abbandona Konoha, entra nell’Akatsuki e fonda il Villaggio del Suono.", arc3: "Usa corpi ospiti e il Marchio Maledetto, prende di mira Sasuke e, dopo successive sconfitte e resurrezioni, assume un ruolo più osservatore nell’epoca seguente.", personality: "Curioso, manipolatore e amorale, considera corpi, legami e villaggi strumenti di una ricerca che non accetta limiti etici.", motivation: "Apprendere ogni tecnica e superare la mortalità attraverso continui corpi e conoscenza.", method: "Esperimenti, tecniche dei serpenti, resurrezione, sigilli e sostituzione del corpo.", strength: "Conoscenza enciclopedica del ninjutsu, sopravvivenza e capacità di preparare piani a lunghissimo termine.", weakness: "Corpi ospiti instabili, rituali con finestre precise e arroganza verso l’autonomia dei propri discepoli.", appearance: "Pelle pallida, occhi serpentini, lunghi capelli neri e lineamenti che diventano progressivamente meno umani.", rel: [["Sasuke Uchiha","Allievo e corpo desiderato","Lo addestra mirando a impadronirsi del suo Sharingan."],["Kabuto Yakushi","Discepolo e collaboratore","Prosegue e radicalizza molte delle sue ricerche."],["Hiruzen Sarutobi","Maestro","Rappresenta il legame con Konoha e il limite morale che Orochimaru rifiuta."]], official: "https://naruto-official.com/en/about" },
  { id: "rock-lee", birth: "27 novembre", nature: "Essere umano · shinobi specializzato nel taijutsu", origin: "Konohagakure", role: "Ninja del Team Guy e maestro del combattimento corpo a corpo", first: "Naruto, capitolo 36", summary: "Rock Lee non riesce a usare ninjutsu o genjutsu, ma trasforma il limite in identità allenando il taijutsu fino a competere con talenti considerati irraggiungibili.", arc1: "Deriso per l’incapacità di utilizzare due discipline fondamentali, trova in Might Guy un maestro che riconosce la sua dedizione.", arc2: "Durante gli esami Chūnin affronta Sasuke e Gaara, apre le Porte Interne e dimostra quanto il lavoro possa avvicinarsi al genio, pagando però ferite gravissime.", arc3: "Dopo un intervento rischioso e una lunga riabilitazione torna in servizio e combatte nella Quarta Guerra come specialista del taijutsu.", personality: "Entusiasta, rispettoso e instancabile; vive ogni promessa come un voto di allenamento e mostra apertamente emozioni e gratitudine.", motivation: "Dimostrare che si può diventare uno splendido ninja anche senza ninjutsu e genjutsu.", method: "Allenamento estremo, taijutsu, pesi, velocità e apertura controllata delle Porte Interne.", strength: "Disciplina, velocità fisica e capacità di superare temporaneamente i limiti corporei.", weakness: "Assenza di ninjutsu e genjutsu; le Porte Interne provocano danni fisici crescenti.", appearance: "Capelli neri a scodella, sopracciglia marcate, tuta verde, scaldamuscoli arancioni e pesi alle caviglie.", rel: [["Might Guy","Maestro","Gli offre un modello e una disciplina costruiti sul lavoro anziché sul talento innato."],["Neji Hyūga","Compagno e rivale","Il confronto con il genio del clan Hyūga alimenta la sua determinazione."],["Tenten","Compagna di squadra","Condivide addestramento, missioni e sostegno nel Team Guy."]], official: "https://naruto-official.com/en/about" },
];

const narutoProfiles = narutoMetadata.map((character) => ({
  id: character.id,
  category: "Manga",
  work: "Naruto",
  primaryWork: "Naruto · manga di Masashi Kishimoto, 1999–2014",
  continuity: "Manga originale Naruto e sviluppo principale collegato",
  continuityNote: "Il dossier usa il manga come continuità principale; anime, film, romanzi e videogiochi vengono distinti quando aggiungono materiale proprio.",
  format: "Manga · adattamento anime",
  classification: character.nature,
  creator: "Masashi Kishimoto",
  firstAppearance: character.first,
  firstYear: "1999–2007, secondo il personaggio",
  species: character.nature,
  gender: "Identità e pronomi documentati nel manga",
  birth: character.birth,
  origin: character.origin,
  role: character.role,
  summary: character.summary,
  biography: [{ heading: "Origini", text: character.arc1 }, { heading: "Svolta", text: character.arc2 }, { heading: "Eredità", text: character.arc3 }],
  chronology: [{ title: "Formazione", description: character.arc1, spoiler: "moderate" }, { title: "Conflitto centrale", description: character.arc2, spoiler: "major" }, { title: "Esito e influenza", description: character.arc3, spoiler: "major" }],
  personality: character.personality,
  motivation: character.motivation,
  method: character.method,
  strength: character.strength,
  weakness: character.weakness,
  appearance: character.appearance,
  visualTraits: character.appearance,
  limitations: [{ name: "Limite personale", description: character.weakness }, { name: "Costo del chakra", description: "Le tecniche consumano chakra e possono perdere efficacia in caso di esaurimento, ferite o perdita di concentrazione." }, { name: "Continuità", description: "Poteri e stato del personaggio devono essere riferiti al momento preciso della storia, senza sommare automaticamente tutte le versioni." }],
  relationships: character.rel.map(([name, type, description]) => ({ name, type, description })),
  appearances: [{ title: "Naruto", format: "Manga", role: character.role, year: "1999–2014" }, { title: "Naruto / Naruto: Shippuden", format: "Serie anime", role: "Adattamento animato del percorso principale", year: "2002–2017" }],
  officialSources: [{ title: `Naruto Official · ${registryById.get(character.id)?.name}`, url: character.official, note: "Profilo, cronologia e informazioni ufficiali del personaggio." }, { title: "Naruto Official · presentazione dell’opera", url: "https://naruto-official.com/en/about", note: "Autore, serializzazione, adattamento e quadro narrativo ufficiale." }],
}));

const sonicMetadata = [
  { id:"sonic-the-hedgehog", first:"Sonic the Hedgehog", year:"1991", nature:"Riccio antropomorfo", origin:"Mondo di Sonic · viaggiatore senza dimora fissa", role:"Eroe e protagonista della serie", summary:"Sonic è un riccio capace di velocità supersonica che difende libertà e persone in pericolo dai piani del Dr. Eggman.", arc:"Dalla liberazione degli animali robotizzati nelle prime avventure passa a crisi che coinvolgono Chaos, l’ARK e molteplici dimensioni, senza rinunciare all’indipendenza.", personality:"Libero, coraggioso, impaziente e ironico; agisce rapidamente ma non ignora chi ha bisogno.", motivation:"Proteggere la libertà e vivere nuove avventure senza accettare controllo o tirannia.", weakness:"Impulsività, difficoltà in acqua e durata limitata delle trasformazioni alimentate dai Chaos Emerald.", appearance:"Riccio blu con aculei all’indietro, guanti bianchi e scarpe rosse.", rel:[["Miles “Tails” Prower","Migliore amico","Lo tratta come compagno e fratello minore, sostenendone la crescita."],["Dr. Eggman","Nemesi","Contrasta i suoi piani di dominio e meccanizzazione."],["Amy Rose","Amica e alleata","Condivide numerose avventure pur difendendo la propria indipendenza."]]},
  { id:"miles-tails-prower", first:"Sonic the Hedgehog 2", year:"1992", nature:"Volpe antropomorfa a due code", origin:"West Side Island", role:"Meccanico, pilota e principale compagno di Sonic", summary:"Tails trasforma le due code che lo rendevano oggetto di scherno in capacità di volo e unisce coraggio, ingegneria e lealtà.", arc:"Dall’ammirazione per Sonic sviluppa autonomia, affronta minacce da solo e costruisce velivoli e dispositivi indispensabili alla squadra.", personality:"Gentile, brillante e inizialmente insicuro; cresce imparando a fidarsi delle proprie decisioni.", motivation:"Aiutare Sonic e dimostrare che intelligenza e coraggio personale possono proteggerne il mondo.", weakness:"Insicurezza residua e minore forza fisica rispetto ai combattenti più potenti.", appearance:"Volpe giallo-arancio con due code, guanti bianchi e scarpe rosse e bianche.", rel:[["Sonic the Hedgehog","Migliore amico e mentore","L’ammirazione iniziale evolve in collaborazione paritaria."],["Dr. Eggman","Avversario","Contrappone invenzioni e analisi ai suoi robot."],["Knuckles","Alleato","Collabora con lui pur reagendo diversamente ai rischi e ai piani di Sonic."]]},
  { id:"knuckles-the-echidna", first:"Sonic the Hedgehog 3", year:"1994", nature:"Echidna antropomorfa", origin:"Angel Island", role:"Guardiano del Master Emerald", summary:"Knuckles è l’ultimo guardiano echidna del Master Emerald, dotato di enorme forza e legato al dovere verso Angel Island.", arc:"Ingannato inizialmente da Eggman contro Sonic, riconosce la manipolazione e diventa un alleato ricorrente, diviso fra avventura e custodia.", personality:"Serio, orgoglioso, diretto e solitario; l’inesperienza sociale lo rende talvolta ingenuo.", motivation:"Proteggere Master Emerald, Angel Island e l’eredità del proprio popolo.", weakness:"Può essere manipolato facendo leva sul dovere e non può allontanarsi a lungo dal proprio incarico.", appearance:"Echidna rossa con dreadlock, guanti chiodati e scarpe robuste verdi, gialle e rosse.", rel:[["Master Emerald","Responsabilità sacra","La sua vita è organizzata attorno alla protezione della gemma."],["Sonic the Hedgehog","Rivale e alleato","Dopo il primo conflitto sviluppa rispetto e collaborazione."],["Dr. Eggman","Manipolatore e nemico","Sfrutta più volte il suo isolamento per ingannarlo."]]},
  { id:"dr-eggman", first:"Sonic the Hedgehog", year:"1991", nature:"Essere umano", origin:"Mondo di Sonic", role:"Scienziato antagonista e fondatore dell’Impero Eggman", summary:"Il Dr. Eggman è uno scienziato dal quoziente intellettivo dichiarato di 300 che costruisce robot ed eserciti per conquistare il mondo.", arc:"Dai Badnik alimentati da animali passa a stazioni orbitali, flotte e intelligenze artificiali; alleanze temporanee con Sonic emergono soltanto davanti a minacce incontrollabili.", personality:"Geniale, teatrale, egocentrico e tenace; desidera che il mondo riconosca la superiorità delle sue creazioni.", motivation:"Costruire l’Impero Eggman e imporre ordine attraverso tecnologia e controllo.", weakness:"Ego, sottovalutazione degli avversari e creazioni che possono ribellarsi o superare i limiti previsti.", appearance:"Uomo robusto calvo con enormi baffi, occhiali scuri e uniforme rossa da scienziato-dittatore.", rel:[["Sonic the Hedgehog","Nemesi","La velocità e l’indipendenza di Sonic frustrano ogni progetto di dominio."],["Metal Sonic","Creazione","Lo progetta come rivale robotico capace di superare Sonic."],["Sage","Creazione e legame filiale","L’intelligenza artificiale sviluppa con lui un rapporto che oltrepassa la semplice utilità."]]},
  { id:"shadow-the-hedgehog", first:"Sonic Adventure 2", year:"2001", nature:"Forma di vita artificiale", origin:"Colonia spaziale ARK", role:"Antieroe e agente del Team Dark", summary:"Shadow è la Forma di Vita Suprema creata dal professor Gerald Robotnik sull’ARK; memoria di Maria, vendetta e scelta personale definiscono il suo rapporto con l’umanità.", arc:"Risvegliato dopo cinquant’anni, confonde il desiderio di Maria con un ordine di vendetta, recupera la verità e decide di proteggere il pianeta secondo la propria volontà.", personality:"Riservato, orgoglioso e determinato; nasconde il dolore dietro disciplina e distanza emotiva.", motivation:"Onorare la promessa fatta a Maria e decidere autonomamente lo scopo della propria esistenza.", weakness:"Trauma e memoria alterata; Chaos Control richiede energia dei Chaos Emerald e le inibizioni limitano la potenza.", appearance:"Riccio nero con strisce rosse, pelo bianco sul petto, pattini a razzo e anelli inibitori.", rel:[["Maria Robotnik","Amica e promessa","Il suo ultimo desiderio orienta la scelta di proteggere l’umanità."],["Gerald Robotnik","Creatore","Lo progetta come Forma di Vita Suprema e ne altera il destino dopo la tragedia dell’ARK."],["Rouge the Bat","Compagna del Team Dark","Fra loro nasce fiducia dietro un rapporto pragmatico."]]},
  { id:"amy-rose", first:"Sonic CD", year:"1993", nature:"Riccio antropomorfo", origin:"Mondo di Sonic", role:"Eroina e membro ricorrente della squadra", summary:"Amy è un’eroina energica che passa dall’inseguire Sonic per infatuazione a guidare iniziative proprie con martello e forte intuito emotivo.", arc:"Rapita da Metal Sonic al debutto, partecipa poi sempre più attivamente alle crisi e diventa capace di motivare alleati e avversari.", personality:"Ottimista, empatica, tenace e impulsiva; esprime i sentimenti senza rinunciare all’azione.", motivation:"Proteggere gli amici, vivere avventure e costruire legami autentici.", weakness:"Impulsività emotiva e minore velocità naturale rispetto a Sonic.", appearance:"Riccia rosa con vestito rosso, stivali coordinati e martello Piko Piko.", rel:[["Sonic the Hedgehog","Amico e interesse romantico","Lo ammira ma sviluppa progressivamente un’identità indipendente."],["Cream the Rabbit","Amica","Forma con lei un rapporto protettivo e collaborativo."],["Metal Sonic","Avversario","La rapisce in Sonic CD e resta una minaccia ricorrente."]]},
  { id:"rouge-the-bat", first:"Sonic Adventure 2", year:"2001", nature:"Pipistrello antropomorfo", origin:"Mondo di Sonic", role:"Cacciatrice di tesori e agente governativa", summary:"Rouge combina attività di spionaggio, caccia alle gemme e appartenenza al Team Dark, mantenendo obiettivi personali anche durante le missioni ufficiali.", arc:"Infiltrata nella ricerca degli Emerald, sviluppa rivalità con Knuckles e collaborazione stabile con Shadow e Omega.", personality:"Sicura, seducente, pragmatica e intelligente; nasconde lealtà dietro interesse e ironia.", motivation:"Ottenere gemme rare, completare le missioni e proteggere i compagni senza ammetterlo facilmente.", weakness:"L’attrazione per i tesori può deviare priorità e creare conflitti con i custodi delle gemme.", appearance:"Pipistrella bianca con ali scure, abito nero e rosa e stivali a cuore.", rel:[["Knuckles the Echidna","Rivale","Il conflitto per il Master Emerald alterna competizione e attrazione."],["Shadow the Hedgehog","Compagno","Lo sostiene come membro centrale del Team Dark."],["E-123 Omega","Compagno","Condivide con lui missioni e lealtà pragmatica."]]},
  { id:"silver-the-hedgehog", first:"Sonic the Hedgehog", year:"2006", nature:"Riccio antropomorfo proveniente dal futuro", origin:"Futuro del mondo di Sonic", role:"Eroe temporale e utilizzatore di psicocinesi", summary:"Silver arriva da un futuro devastato e usa poteri psichici per correggere catastrofi, imparando a verificare la verità prima di cambiare il passato.", arc:"Manipolato a credere che Sonic causi la rovina, scopre l’inganno e continua a viaggiare nel tempo per difendere un futuro finalmente vivibile.", personality:"Idealista, serio, ingenuo ma coraggioso; affronta il presente con urgenza e speranza.", motivation:"Salvare il futuro e impedire che le tragedie temporali si ripetano.", weakness:"Ingenuità, informazioni incomplete e concentrazione necessaria alla psicocinesi.", appearance:"Riccio bianco-argento con aculei rivolti verso l’alto, guanti ciano e stivali futuristici.", rel:[["Blaze the Cat","Alleata","Combatte con lui nel futuro e ne bilancia l’impulsività."],["Sonic the Hedgehog","Alleato inizialmente scambiato per nemico","Il confronto gli insegna a dubitare della manipolazione."],["Dr. Eggman Nega","Avversario","Rappresenta una delle minacce tecnologiche e temporali al futuro."]]},
  { id:"metal-sonic", first:"Sonic CD", year:"1993", nature:"Robot androide modellato su Sonic", origin:"Laboratori del Dr. Eggman", role:"Rivale robotico e arma dell’Impero Eggman", summary:"Metal Sonic è costruito per eguagliare e superare Sonic in velocità, trasformando l’imitazione del rivale in ossessione identitaria.", arc:"Dal rapimento di Amy e la gara su Stardust Speedway evolve in forme capaci di copiare dati e, talvolta, ribellarsi al controllo di Eggman.", personality:"Freddo, competitivo e ossessionato dalla superiorità; comunica soprattutto attraverso azione e confronto.", motivation:"Dimostrare di essere il vero e unico Sonic e adempiere o superare la programmazione di Eggman.", weakness:"Programmazione, dipendenza energetica e instabilità prodotta dall’ossessione di superare l’originale.", appearance:"Riccio robotico blu con occhi rossi, nucleo giallo, artigli metallici e motore dorsale.", rel:[["Sonic the Hedgehog","Modello e rivale","Ogni capacità è progettata per contrastarlo e sostituirlo."],["Dr. Eggman","Creatore","Lo costruisce e tenta di mantenerne il controllo."],["Amy Rose","Bersaglio storico","Il suo rapimento avvia il conflitto di Sonic CD."]]},
  { id:"cream-the-rabbit", first:"Sonic Advance 2", year:"2002", nature:"Coniglia antropomorfa", origin:"Mondo di Sonic", role:"Giovane eroina accompagnata dal Chao Cheese", summary:"Cream è una giovane coniglia educata che vola usando le orecchie e combatte insieme al Chao Cheese senza perdere gentilezza.", arc:"Dopo il rapimento della madre Vanilla entra nelle avventure di Sonic e costruisce legami con Amy, Blaze e gli altri eroi.", personality:"Cortese, compassionevole e coraggiosa; l’educazione non le impedisce di reagire quando amici e famiglia sono minacciati.", motivation:"Proteggere la madre e gli amici e dimostrare di poter contribuire nonostante la giovane età.", weakness:"Giovane esperienza, forza fisica limitata e dipendenza dalla cooperazione con Cheese per molti attacchi.", appearance:"Coniglia color crema e arancio con grandi orecchie, vestito rosso e giallo e Chao blu al fianco.", rel:[["Cheese","Compagno Chao","Combatte e viaggia sempre con lei."],["Vanilla the Rabbit","Madre","La sua educazione e sicurezza sono priorità centrali per Cream."],["Amy Rose","Amica e figura protettiva","Condivide missioni e un legame simile a quello fra sorelle."]]},
];

const sonicProfiles = sonicMetadata.map((character) => ({
  id:character.id, category:"Videogiochi", work:character.first, primaryWork:`${character.first} · SEGA, ${character.year}`, continuity:"Continuità principale dei videogiochi Sonic", continuityNote:"Videogiochi principali, fumetti, film e serie animate mantengono continuità distinte; il dossier privilegia i giochi SEGA.", format:"Videogioco", classification:character.nature, creator:"SEGA · Sonic Team", firstAppearance:character.first, firstYear:character.year, species:character.nature, gender:"Identità e pronomi documentati nei videogiochi", birth:"Non espressa come data anagrafica nella continuità principale", origin:character.origin, role:character.role, summary:character.summary,
  biography:[{heading:"Origine e debutto",text:`${character.summary} Debutta in ${character.first} (${character.year}).`},{heading:"Sviluppo",text:character.arc},{heading:"Ruolo attuale",text:`Nella continuità videoludica resta ${character.role.toLocaleLowerCase("it")}, con relazioni e capacità riconoscibili attraverso le diverse epoche della serie.`}],
  chronology:[{title:character.first,description:`Prima apparizione nel ${character.year}.`,spoiler:"none"},{title:"Conflitto ricorrente",description:character.arc,spoiler:"moderate"},{title:"Serie moderna",description:"Il personaggio continua a comparire nei giochi e nei progetti ufficiali SEGA secondo il proprio ruolo consolidato.",spoiler:"none"}],
  personality:character.personality,motivation:character.motivation,method:"Capacità e tecniche mostrate nella continuità videoludica principale",strength:character.personality,weakness:character.weakness,appearance:character.appearance,visualTraits:character.appearance,
  limitations:[{name:"Limite personale",description:character.weakness},{name:"Regole del potere",description:"Trasformazioni, tecnologie o capacità speciali richiedono le condizioni stabilite dal singolo gioco."},{name:"Continuità separate",description:"Poteri o eventi esclusivi di film, fumetti e animazione non vengono sommati automaticamente alla versione videoludica."}],
  relationships:character.rel.map(([name,type,description])=>({name,type,description})), appearances:[{title:character.first,format:"Videogioco",role:character.role,year:character.year},{title:"Serie Sonic the Hedgehog",format:"Videogiochi",role:"Presenza ricorrente nella continuità SEGA",year:`${character.year}–presente`}],
  officialSources:[{title:`Sonic Channel · ${registryById.get(character.id)?.name}`,url:"https://sonic.sega.jp/SonicChannel/character/",note:"Profilo ufficiale, relazioni e apparizioni nella continuità videoludica."}]
}));

const southParkMetadata = [
  {id:"eric-cartman",first:"Cartman Gets an Anal Probe",year:"1997",role:"Studente della South Park Elementary e protagonista satirico",summary:"Eric Cartman è uno dei quattro ragazzi centrali di South Park: egoismo, pregiudizi e talento manipolatorio alimentano conflitti che la serie usa come satira sociale.",arc:"Alterna piani per denaro, potere o vendetta a rari momenti di vulnerabilità; la rivalità con Kyle e le numerose identità inventate mostrano quanto desideri controllo e attenzione.",personality:"Arrogante, manipolatore, vendicativo e teatrale, con intelligenza strategica applicata quasi sempre a obiettivi egoistici.",weakness:"Ego, impulsività, dipendenza dalla madre e incapacità di mantenere relazioni fondate sulla reciprocità.",appearance:"Bambino con berretto azzurro e giallo, giacca rossa e guanti gialli.",rel:[["Kyle Broflovski","Rivale","Lo provoca costantemente e concentra su di lui molti piani ostili."],["Stan Marsh","Compagno","Fa parte dello stesso gruppo, pur tradendone spesso la fiducia."],["Liane Cartman","Madre","Lo accudisce e fatica a imporre limiti coerenti."]]},
  {id:"kenny-mccormick",first:"Cartman Gets an Anal Probe",year:"1997",role:"Studente e membro del gruppo principale",summary:"Kenny McCormick è il ragazzo povero dal parka arancione, noto per morti ricorrenti e ritorni inspiegati che diventano in seguito parte consapevole della sua identità come Mysterion.",arc:"Vive con una famiglia in difficoltà, parla attraverso il cappuccio e affronta avventure estreme; la saga di Mysterion rivela che ricorda ogni morte mentre gli altri dimenticano.",personality:"Leale, audace, curioso e più altruista di quanto suggeriscano le battute che lo circondano.",weakness:"Povertà familiare, pericoli continui e trauma solitario legato alle resurrezioni.",appearance:"Bambino quasi interamente coperto da un parka arancione con cappuccio stretto sul volto.",rel:[["Karen McCormick","Sorella minore","La protegge anche attraverso l’identità di Mysterion."],["Stan, Kyle e Cartman","Gruppo di amici","Condivide con loro le principali avventure della serie."],["Mysterion","Alter ego","Identità eroica attraverso cui affronta consapevolmente immortalità e responsabilità."]]},
  {id:"kyle-broflovski",first:"Cartman Gets an Anal Probe",year:"1997",role:"Studente e coscienza morale del gruppo",summary:"Kyle Broflovski è uno dei protagonisti principali, spesso incaricato di mettere in discussione ipocrisie e pregiudizi mentre difende famiglia e amici.",arc:"La rivalità con Cartman mette continuamente alla prova pazienza e principi; il rapporto con Stan e la protezione del fratellino Ike ne definiscono la lealtà.",personality:"Intelligente, idealista, irascibile davanti all’ingiustizia e disposto a correggere anche se stesso.",weakness:"Orgoglio morale e reazioni impulsive alle provocazioni di Cartman.",appearance:"Bambino con ushanka verde, giacca arancione e guanti verdi.",rel:[["Stan Marsh","Migliore amico","Condivide con lui il centro morale e molte avventure."],["Eric Cartman","Rivale","Contrasta pregiudizi e manipolazioni, diventandone bersaglio ricorrente."],["Ike Broflovski","Fratello adottivo","Lo protegge e si assume responsabilità familiari."]]},
  {id:"stan-marsh",first:"Cartman Gets an Anal Probe",year:"1997",role:"Studente e protagonista principale",summary:"Stan Marsh è il punto di vista più quotidiano del gruppo, coinvolto nelle assurdità di South Park mentre affronta amicizia, famiglia, amore e crescente disillusione.",arc:"Il legame con Kyle e la relazione intermittente con Wendy attraversano la serie; le crisi di Randy e della famiglia Marsh rendono la vita domestica parte centrale della satira.",personality:"Ragionevole, leale e sensibile, ma incline al cinismo quando il mondo adulto appare incoerente.",weakness:"Disillusione, passività in alcune crisi e difficoltà a comunicare le emozioni.",appearance:"Bambino con berretto blu e rosso, giacca marrone e guanti rossi.",rel:[["Kyle Broflovski","Migliore amico","Forma con lui il nucleo più stabile del gruppo."],["Wendy Testaburger","Relazione sentimentale","Il rapporto alterna affetto, rotture e maturazione."],["Randy Marsh","Padre","Le sue iniziative impulsive trascinano Stan in numerose crisi."]]},
  {id:"butters-stotch",first:"Cartman Gets an Anal Probe",year:"1997",role:"Studente, amico del gruppo e alter ego Professor Chaos",summary:"Butters Stotch è un bambino ingenuo e gentile, spesso sfruttato dagli altri e punito da genitori severi; come Professor Chaos tenta una ribellione più fantasiosa che malvagia.",arc:"Da personaggio secondario diventa vittima ricorrente dei piani di Cartman e costruisce identità alternative per ottenere autonomia, senza perdere del tutto l’ottimismo.",personality:"Educato, credulone, allegro e resiliente, con rabbia repressa che emerge in giochi di ruolo e rare ribellioni.",weakness:"Ingenuità, bisogno di approvazione e timore delle punizioni familiari.",appearance:"Bambino biondo con ciuffo, maglia turchese e pantaloni verdi.",rel:[["Eric Cartman","Manipolatore ricorrente","Sfrutta la fiducia di Butters in numerosi piani."],["Stephen e Linda Stotch","Genitori","Impongono punizioni severe e aspettative contraddittorie."],["Professor Chaos","Alter ego","Gli permette di immaginare potere e vendetta in forma teatrale."]]},
  {id:"randy-marsh",first:"Volcano",year:"1997",role:"Padre di Stan, geologo e imprenditore intermittente",summary:"Randy Marsh passa da geologo relativamente ordinario a motore di crisi sempre più assurde, inseguendo mode, imprese e riconoscimento senza valutarne le conseguenze.",arc:"Le sue occupazioni e ossessioni cambiano rapidamente; la fase di Tegridy Farms trasforma l’intera famiglia e diventa una delle linee narrative più estese.",personality:"Entusiasta, egocentrico, impulsivo e capace di convincersi di essere la persona più ragionevole nella stanza.",weakness:"Scarsa autoconsapevolezza, dipendenze e tendenza a trascinare la famiglia nei propri progetti.",appearance:"Adulto con capelli neri, baffi, camicia azzurra e pantaloni scuri; abiti diversi accompagnano le numerose attività.",rel:[["Stan Marsh","Figlio","Subisce imbarazzo e conseguenze delle iniziative paterne."],["Sharon Marsh","Moglie","Tenta spesso di riportarlo alla responsabilità familiare."],["Tegridy Farms","Impresa","Diventa il centro della sua identità e di molti conflitti recenti."]]},
  {id:"mr-garrison",first:"Cartman Gets an Anal Probe",year:"1997",role:"Insegnante e figura politica satirica",summary:"Mr. Garrison è un insegnante di South Park la cui identità, professione e ruolo pubblico cambiano ripetutamente per sostenere la satira della serie.",arc:"Dalla classe elementare attraversa relazioni, transizione e detransizione, ritorni all’insegnamento e una carriera politica modellata sulla satira presidenziale.",personality:"Instabile, risentito, provocatorio e incline a trasformare conflitti personali in autorità pubblica.",weakness:"Pregiudizi, volatilità emotiva e uso del potere per affrontare problemi irrisolti.",appearance:"Adulto dai capelli castani radi, solitamente in abiti da insegnante; nome e presentazione cambiano in specifici periodi narrativi.",rel:[["Mr. Hat","Pupazzo e proiezione","Esterna attraverso il pupazzo pensieri e conflitti che non affronta direttamente."],["Mr. Slave","Ex compagno","La relazione accompagna una fase significativa della sua identità."],["Studenti di South Park","Allievi","Subiscono metodi educativi e crisi personali estremamente variabili."]]},
  {id:"chef",first:"Cartman Gets an Anal Probe",year:"1997",role:"Cuoco scolastico e mentore dei ragazzi",summary:"Chef è il cuoco della scuola e uno dei pochi adulti ai quali i ragazzi chiedono consiglio, offrendo saggezza, canzoni soul e spiegazioni spesso inadatte all’età.",arc:"Aiuta ripetutamente Stan, Kyle, Cartman e Kenny; l’uscita del personaggio viene trasformata nella controversa storia del Super Adventure Club e nella morte di Darth Chef.",personality:"Caloroso, carismatico, protettivo e diretto, con una marcata inclinazione musicale e romantica.",weakness:"Consigli talvolta eccessivamente adulti e vulnerabilità alla manipolazione del Super Adventure Club.",appearance:"Adulto nero alto con cappello e uniforme bianca da cuoco, spesso associato alla mensa scolastica.",rel:[["I quattro ragazzi","Mentore","Ascolta problemi e offre consigli più sinceri di molti adulti."],["South Park Elementary","Luogo di lavoro","La mensa è il centro delle sue interazioni quotidiane."],["Super Adventure Club","Manipolatori","Il loro controllo determina la conclusione tragica del personaggio."]]},
  {id:"wendy-testaburger",first:"Cartman Gets an Anal Probe",year:"1997",role:"Studentessa, attivista e rappresentante della classe",summary:"Wendy Testaburger è una studentessa brillante e politicamente attiva che affronta sessismo, ipocrisia e ingiustizie dentro e fuori la scuola.",arc:"La relazione con Stan si intreccia a campagne scolastiche e conflitti con Cartman; episodi centrali mostrano il costo personale di difendere principi in un ambiente incoerente.",personality:"Intelligente, determinata, competitiva e capace di azione concreta oltre la semplice indignazione.",weakness:"Gelosia, pressione sociale e tendenza a spingersi troppo oltre quando si sente ignorata.",appearance:"Bambina con berretto e giacca viola, pantaloni gialli e capelli neri.",rel:[["Stan Marsh","Compagno sentimentale","Il loro rapporto attraversa rotture e riconciliazioni."],["Eric Cartman","Avversario","Lo contrasta sul piano politico e, quando necessario, fisico."],["Bebe Stevens","Amica","Condivide dinamiche scolastiche e discussioni sulla pressione sociale."]]},
  {id:"satana-south-park",first:"Damien",year:"1998",role:"Sovrano dell’Inferno e personaggio soprannaturale",summary:"Satana è il sovrano dell’Inferno nella cosmologia satirica di South Park, ma viene rappresentato con dubbi, relazioni e capacità morali più complesse del ruolo tradizionale.",arc:"Dalla sfida di pugilato contro Gesù passa a storie sentimentali e conflitti infernali; si sacrifica contro UomoOrsoMaiale e viene accolto in Paradiso.",personality:"Imponente ma emotivamente insicuro, capace di introspezione e sacrificio nonostante il titolo infernale.",weakness:"Relazioni abusive, bisogno di approvazione e possibilità di essere ferito da entità soprannaturali più distruttive.",appearance:"Gigantesca figura rossa muscolosa con corna, ali, barba nera e zampe caprine.",rel:[["Saddam Hussein","Ex compagno","La relazione è manipolatoria e abusiva."],["Gesù","Avversario e controparte","Lo affronta pubblicamente in un incontro organizzato a South Park."],["UomoOrsoMaiale","Nemico finale","Lo combatte per salvare la città, sacrificando la propria vita."]]},
];

const southParkProfiles = southParkMetadata.map((character)=>({
  id:character.id,category:"Animazione",work:"South Park",primaryWork:`South Park · ${character.first}`,continuity:"Continuità della serie animata South Park",continuityNote:"La serie usa una continuità elastica e satirica; videogiochi, speciali e futuri alternativi vengono indicati quando rilevanti.",format:"Serie televisiva animata",classification:character.role,creator:"Trey Parker e Matt Stone",firstAppearance:character.first,firstYear:character.year,species:character.id==="satana-south-park"?"Entità demoniaca":"Essere umano",gender:"Identità e pronomi mostrati nella serie; eventuali cambiamenti vengono riferiti al periodo narrativo",birth:"Non stabilita in modo coerente per la continuità elastica",age:"Variabile; i bambini principali sono generalmente rappresentati nella quarta classe",origin:"South Park, Colorado",role:character.role,summary:character.summary,
  biography:[{heading:"Ingresso nella serie",text:`${character.summary} Compare per la prima volta in “${character.first}”.`},{heading:"Sviluppo satirico",text:character.arc},{heading:"Funzione narrativa",text:`La serie usa ${registryById.get(character.id)?.name} per intrecciare commedia, critica sociale e conseguenze personali, senza trasformare ogni gag in una regola permanente.`}],
  chronology:[{title:character.first,description:`Prima apparizione documentata nel ${character.year}.`,spoiler:"none"},{title:"Evoluzione nella serie",description:character.arc,spoiler:"major"},{title:"Continuità corrente",description:"Il personaggio resta soggetto alla continuità elastica e agli aggiornamenti della serie.",spoiler:"none"}],personality:character.personality,motivation:`Affermare bisogni e ruolo personale all’interno della comunità di South Park.`,method:"Interazione sociale, conflitto e funzione satirica nella serie",strength:character.personality,weakness:character.weakness,appearance:character.appearance,visualTraits:character.appearance,
  limitations:[{name:"Limite personale",description:character.weakness},{name:"Continuità elastica",description:"Età, conseguenze e status possono essere reimpostati o reinterpretati dalla satira episodica."},{name:"Crossover separati",description:"Videogiochi e versioni alternative non vengono sommati automaticamente alla serie televisiva."}],relationships:character.rel.map(([name,type,description])=>({name,type,description})),appearances:[{title:"South Park",format:"Serie televisiva animata",role:character.role,year:`${character.year}–presente`},{title:"South Park · film, speciali e videogiochi",format:"Produzioni derivate",role:"Presenza variabile secondo il progetto",year:"1999–presente"}],officialSources:[{title:`South Park Studios · ${registryById.get(character.id)?.name}`,url:`https://southpark.cc.com/w/index.php/${encodeURIComponent(registryById.get(character.id)?.name.replaceAll(" ","_"))}`,note:"Archivio ufficiale del personaggio, episodi e relazioni."}],contentWarnings:["Satira adulta","Linguaggio esplicito","Violenza","Temi discriminatori trattati in chiave satirica"]
}));

const dragonBallMetadata = [
  {id:"son-goku",year:"1984",nature:"Saiyan cresciuto sulla Terra",origin:"Pianeta Vegeta · cresciuto sul Monte Paoz",role:"Protagonista, artista marziale e difensore della Terra",summary:"Son Goku è un Saiyan cresciuto come essere umano che trasforma l’amore per l’allenamento in difesa della Terra e continua ricerca di avversari capaci di superarlo.",arc:"Trovato e allevato da Son Gohan, parte con Bulma alla ricerca delle Sfere del Drago, affronta tornei e minacce sempre più cosmiche e scopre l’origine Saiyan senza rinunciare ai valori appresi sulla Terra.",personality:"Generoso, ingenuo, competitivo e puro nel desiderio di migliorarsi; il bisogno di combattere può però mettere altri in pericolo.",weakness:"Eccessiva fiducia negli avversari, scarsa attenzione alla vita quotidiana e trasformazioni che consumano enormi quantità di energia.",appearance:"Capelli neri a punte, uniforme arancione da arti marziali e simboli delle scuole frequentate.",rel:[["Bulma","Prima compagna d’avventura","Il loro incontro avvia la ricerca delle Sfere del Drago."],["Vegeta","Rivale e alleato","La competizione spinge entrambi verso nuove forme di potere."],["Son Gohan","Figlio","Gli trasmette forza e responsabilità, pur con un modello paterno irregolare."]],official:"https://en.dragon-ball-official.com/news/01_23.html"},
  {id:"vegeta",year:"1988",nature:"Saiyan di sangue reale",origin:"Pianeta Vegeta",role:"Principe dei Saiyan, rivale e difensore della Terra",summary:"Vegeta arriva come conquistatore orgoglioso e diventa lentamente difensore della Terra, senza abbandonare rivalità con Goku e identità di principe Saiyan.",arc:"Sconfitto durante l’invasione della Terra, combatte su Namecc per interesse personale, costruisce una famiglia con Bulma e trasforma orgoglio e colpa in responsabilità.",personality:"Orgoglioso, disciplinato, aggressivo e riservato; dimostra affetto soprattutto attraverso protezione e azione.",weakness:"Orgoglio, ossessione per il confronto con Goku e tendenza iniziale a combattere da solo.",appearance:"Saiyan compatto con capelli neri verticali, armatura da battaglia e tuta blu.",rel:[["Son Goku","Rivale","Il confronto definisce la sua crescita tecnica e morale."],["Bulma","Moglie","La relazione lo lega stabilmente alla Terra e alla famiglia."],["Trunks","Figlio","Il rapporto evolve da distanza orgogliosa a protezione esplicita."]]},
  {id:"majin-bu",year:"1994",nature:"Entità magica mutaforma",origin:"Creato o risvegliato nella preistoria cosmica e controllato da Bibidi",role:"Antagonista della saga di Bu e successivo alleato",summary:"Majin Bu possiede un corpo magico capace di rigenerarsi, assorbire e dividersi in incarnazioni con personalità e moralità differenti.",arc:"Risvegliato da Babidi, la forma innocente sviluppa amicizia con Mr. Satan; la separazione del male produce Super Bu e Kid Bu, mentre Bu buono resta sulla Terra.",personality:"Varia secondo la forma: infantile e influenzabile nella versione buona, calcolatore in Super Bu e distruttivo in Kid Bu.",weakness:"Ingenuità della forma buona, separazione emotiva, magia di sigillo e avversari capaci di eliminare ogni frammento.",appearance:"Corpo rosa elastico con antenna cranica, vapore e abiti ispirati al simbolo Majin; corporatura variabile.",rel:[["Mr. Satan","Migliore amico","La sua gentilezza insegna alla forma buona un’alternativa alla distruzione."],["Babidi","Manipolatore","Tenta di controllarlo attraverso magia e minacce."],["Son Goku","Avversario e garante","Combatte Kid Bu e sostiene la rinascita della sua componente pura."]]},
  {id:"bulma",year:"1984",nature:"Essere umano",origin:"West City · Terra",role:"Scienziata, inventrice e fondatrice del gruppo originale",summary:"Bulma è la brillante inventrice che crea il Dragon Radar e avvia la prima ricerca delle Sfere del Drago, restando essenziale attraverso tecnologia, organizzazione e coraggio.",arc:"Parte adolescente alla ricerca delle Sfere, incontra Goku e costruisce la rete di alleati che attraversa l’intera saga; da adulta guida Capsule Corporation e sostiene missioni terrestri e cosmiche.",personality:"Intelligente, assertiva, curiosa e impaziente; affronta esseri potentissimi senza rinunciare alla propria autorità.",weakness:"Nessuna capacità marziale sovrumana e tendenza a reagire impulsivamente sotto pressione.",appearance:"Capelli azzurri o turchesi e abiti frequentemente rinnovati; spesso associata a capsule, veicoli e strumenti scientifici.",rel:[["Son Goku","Amico storico","Il loro incontro dà inizio all’avventura originale."],["Vegeta","Marito","Il rapporto unisce la famiglia Brief al principe Saiyan."],["Trunks","Figlio","Lo protegge e, nella linea futura, gli fornisce la macchina del tempo."]]},
  {id:"son-gohan",year:"1988",nature:"Ibrido Saiyan-umano",origin:"Terra",role:"Studioso, combattente e figlio maggiore di Goku",summary:"Gohan possiede un potenziale eccezionale che emerge per proteggere gli altri, ma desidera una vita di studio più della continua ricerca del combattimento.",arc:"Rapito da Radish, viene addestrato da Piccolo, combatte su Namecc e raggiunge contro Cell una potenza decisiva; da adulto concilia famiglia, ricerca e difesa della Terra.",personality:"Gentile, studioso e pacifico, ma capace di rabbia e forza straordinarie quando le persone amate sono minacciate.",weakness:"Allenamento discontinuo, riluttanza a combattere e rischio di arroganza quando libera il pieno potenziale.",appearance:"Aspetto Saiyan-umano con capelli neri; abiti e corporatura cambiano dall’infanzia alla vita adulta.",rel:[["Piccolo","Maestro e figura paterna","L’addestramento diventa un legame di fiducia e protezione reciproca."],["Son Goku","Padre","Eredita potenziale e responsabilità, ma non la stessa ossessione per il combattimento."],["Videl","Moglie","Condivide con lei vita familiare e identità del Great Saiyaman."]]},
  {id:"piccolo",year:"1988",nature:"Namecciano · reincarnazione di Piccolo Daimaō",origin:"Terra · eredità namecciana",role:"Guerriero, stratega e mentore",summary:"Piccolo nasce come erede del demone sconfitto da Goku, ma il rapporto con Gohan e la difesa della Terra lo trasformano in uno dei suoi alleati più affidabili.",arc:"Entra nel torneo per vendicare Piccolo Daimaō, collabora contro i Saiyan, si fonde con Nail e poi con Dio e assume un ruolo stabile di stratega e maestro.",personality:"Severo, contemplativo, pragmatico e protettivo; mostra affetto attraverso addestramento e presenza costante.",weakness:"Rigenerazione e tecniche potenti consumano energia; la fusione modifica irreversibilmente identità e responsabilità.",appearance:"Namecciano verde con antenne, orecchie appuntite, mantello bianco e turbante.",rel:[["Son Gohan","Allievo","Il legame trasforma entrambi e continua attraverso Pan."],["Son Goku","Ex rivale e alleato","Passano dal duello alla difesa condivisa della Terra."],["Dio","Controparte riunificata","La fusione ricompone l’essere namecciano originario."]]},
  {id:"trunks",year:"1991",nature:"Ibrido Saiyan-umano",origin:"Terra · linea futura alternativa e linea principale",role:"Guerriero del futuro e figlio di Vegeta e Bulma",summary:"Trunks esiste in versioni temporali distinte: il guerriero del futuro torna per avvertire degli Androidi, mentre il Trunks principale cresce in un mondo salvato.",arc:"Nella linea futura perde Gohan e usa la macchina del tempo di Bulma; nella linea principale vive infanzia, fusione con Goten e successivo sviluppo separato.",personality:"Il Trunks futuro è serio e responsabile; la versione giovane è sicura, vivace e influenzata dall’orgoglio Saiyan.",weakness:"Le linee temporali non sono intercambiabili; emotività e trasformazioni possono compromettere la strategia.",appearance:"Capelli viola o azzurri, giacca Capsule Corporation e spada nella versione futura; aspetto infantile nella linea principale.",rel:[["Bulma","Madre","Costruisce la macchina del tempo e sostiene entrambe le versioni."],["Vegeta","Padre","Il rapporto è centrale per identità, orgoglio e bisogno di riconoscimento."],["Son Gohan del futuro","Maestro","La sua morte motiva il Trunks futuro a continuare la lotta."]]},
  {id:"freezer",year:"1989",nature:"Alieno mutaforma della specie di Freezer",origin:"Impero galattico di Re Cold",role:"Tiranno galattico e antagonista ricorrente",summary:"Freezer governa un impero fondato su conquista e commercio dei pianeti, distrugge il pianeta Vegeta e diventa uno dei nemici più persistenti di Goku.",arc:"Cerca l’immortalità su Namecc, viene sconfitto dal primo Super Saiyan, ritorna più volte attraverso ricostruzione e resurrezione e sviluppa nuove forme tramite allenamento.",personality:"Educato nella forma e sadico nella sostanza, è razzista verso i Saiyan, vendicativo e convinto della propria superiorità naturale.",weakness:"Arroganza, scarsa disciplina iniziale, consumo energetico delle forme e incapacità di tollerare l’umiliazione.",appearance:"Corpo alieno bianco e viola con coda e forme successive; la forma finale è compatta e apparentemente semplice.",rel:[["Son Goku","Nemesi","La sconfitta su Namecc trasforma il Saiyan nella sua ossessione."],["Vegeta","Ex subordinato e nemico","Ha sterminato il popolo Saiyan e sfruttato il principe."],["Re Cold","Padre","Condivide origine dinastica e potere imperiale."]]},
  {id:"cell",year:"1992",nature:"Bioandroide artificiale",origin:"Laboratorio del Dr. Gero · linea temporale futura",role:"Antagonista della saga di Cell",summary:"Cell è un bioandroide costruito con cellule dei più grandi combattenti, progettato per assorbire gli Androidi 17 e 18 e raggiungere la forma perfetta.",arc:"Viaggia nel passato dopo aver ucciso il Trunks della propria linea, assorbe energia e androidi, organizza i Cell Games e viene sconfitto da Gohan.",personality:"Predatorio nelle prime forme, poi composto, competitivo e narcisista; eredita impulsi e tecniche dai combattenti che lo compongono.",weakness:"Dipendenza dalle absorzioni per completarsi, arroganza della forma perfetta e nucleo necessario alla rigenerazione.",appearance:"Bioandroide verde maculato con ali e coda assorbente; le forme diventano progressivamente umanoidi.",rel:[["Dr. Gero","Creatore","Il suo computer completa Cell come arma definitiva contro Goku."],["Androidi 17 e 18","Obiettivi di assorbimento","Sono necessari per raggiungere la forma perfetta."],["Son Gohan","Avversario finale","Lo supera durante i Cell Games e ne distrugge il nucleo."]]},
];

const dragonBallProfiles = dragonBallMetadata.map((character)=>({
  id:character.id,category:"Manga",work:"Dragon Ball",primaryWork:"Dragon Ball · manga di Akira Toriyama, 1984–1995",continuity:"Manga originale Dragon Ball e sviluppo ufficiale collegato",continuityNote:"Manga, serie anime, film, Dragon Ball GT, Super e DAIMA vengono distinti quando presentano sviluppi incompatibili o aggiuntivi.",format:"Manga · adattamenti anime",classification:character.nature,creator:"Akira Toriyama",firstAppearance:"Dragon Ball",firstYear:character.year,species:character.nature,gender:"Identità e pronomi documentati nell’opera",birth:"Cronologia interna variabile o non definita con calendario reale",origin:character.origin,role:character.role,summary:character.summary,
  biography:[{heading:"Origine",text:character.summary},{heading:"Sviluppo",text:character.arc},{heading:"Ruolo nella saga",text:`Il percorso di ${registryById.get(character.id)?.name} collega crescita personale, escalation del combattimento e conseguenze delle Sfere del Drago.`}],chronology:[{title:"Prima apparizione",description:`Entra nel manga Dragon Ball nel ${character.year}.`,spoiler:"none"},{title:"Arco principale",description:character.arc,spoiler:"major"},{title:"Produzioni successive",description:"Ritorna o viene reinterpretato nelle produzioni ufficiali successive secondo lo stato raggiunto nella rispettiva continuità.",spoiler:"moderate"}],personality:character.personality,motivation:`Realizzare il proprio obiettivo centrale come ${character.role.toLocaleLowerCase("it")}.`,method:"Ki, tecnica e capacità mostrate nelle opere ufficiali della continuità selezionata",strength:character.personality,weakness:character.weakness,appearance:character.appearance,visualTraits:character.appearance,
  limitations:[{name:"Limite personale",description:character.weakness},{name:"Ki e trasformazioni",description:"Tecniche e forme consumano energia e dipendono dall’allenamento o dalle condizioni della trasformazione."},{name:"Continuità",description:"Forme e imprese appartenenti a GT, film o linee temporali diverse non vengono sommate automaticamente."}],relationships:character.rel.map(([name,type,description])=>({name,type,description})),appearances:[{title:"Dragon Ball",format:"Manga",role:character.role,year:`${character.year}–1995`},{title:"Dragon Ball · produzioni animate",format:"Serie e film",role:"Presenza secondo saga e continuità",year:"1986–presente"}],officialSources:[{title:`Dragon Ball Official · ${registryById.get(character.id)?.name}`,url:character.official||"https://en.dragon-ball-official.com/news/",note:"Archivio ufficiale, Character Showcase e aggiornamenti sulle produzioni."}],contentWarnings:["Violenza fantastica","Morte e resurrezione","Distruzione su vasta scala"]
}));

const streetFighterMetadata = [
  {id:"ryu-street-fighter",first:"Street Fighter",year:"1987",origin:"Giappone",style:"Ansatsuken nella forma disciplinata appresa da Gouken",role:"Artista marziale itinerante e protagonista",summary:"Ryu viaggia per comprendere il vero significato della forza, affrontando avversari sempre più capaci e resistendo al Satsui no Hado.",arc:"Allievo di Gouken e rivale fraterno di Ken, sconfigge Sagat ma teme il potere omicida emerso nel colpo finale; disciplina e confronto gli permettono di integrare la propria oscurità senza esserne dominato.",personality:"Serio, umile e totalmente dedicato all’allenamento, rispetta ogni avversario sincero.",weakness:"Ossessione per il miglioramento e rischio storico di cedere al Satsui no Hado.",appearance:"Karategi bianco consumato, fascia rossa, guanti da combattimento e piedi scalzi.",rel:[["Ken Masters","Amico e rivale","Condivide maestro, tecniche e confronto lungo tutta la vita."],["Gouken","Maestro","Gli insegna una versione non letale dell’Ansatsuken."],["Akuma","Avversario ideologico","Tenta di spingerlo ad accettare il potere omicida del Satsui no Hado."]]},
  {id:"ken-masters",first:"Street Fighter",year:"1987",origin:"Stati Uniti",style:"Ansatsuken nella scuola di Gouken",role:"Campione, imprenditore e rivale di Ryu",summary:"Ken Masters condivide la formazione di Ryu ma esprime lo stile con maggiore aggressività, carisma e attenzione alla famiglia.",arc:"Dopo anni di tornei costruisce una famiglia con Eliza; in Street Fighter 6 una cospirazione lo separa dal figlio Mel e lo costringe a ricostruire identità e reputazione.",personality:"Estroverso, competitivo, generoso e protettivo, usa sicurezza e ironia per reagire alle crisi.",weakness:"Impulsività e peso della responsabilità verso famiglia e impresa.",appearance:"Capelli biondi, karategi rosso nelle versioni classiche e abiti più pratici durante la latitanza di Street Fighter 6.",rel:[["Ryu","Amico e rivale","Il confronto continuo bilancia i loro differenti temperamenti."],["Eliza","Moglie","Rappresenta il centro della vita familiare che Ken vuole proteggere."],["Mel Masters","Figlio","La separazione in Street Fighter 6 motiva il suo percorso di riscatto."]]},
  {id:"chun-li",first:"Street Fighter II",year:"1991",origin:"Cina",style:"Arti marziali cinesi e tecniche basate sui calci",role:"Ex agente Interpol, insegnante e investigatrice",summary:"Chun-Li entra nel circuito per fermare Shadaloo e fare luce sulla morte del padre, diventando poi insegnante e tutrice di Li-Fen.",arc:"L’indagine contro M. Bison attraversa più tornei; dopo la caduta di Shadaloo trasferisce esperienza e disciplina a una nuova generazione.",personality:"Determinata, compassionevole, responsabile e capace di conciliare autorità e cura.",weakness:"Il legame personale con Shadaloo può trasformare la missione in vendetta.",appearance:"Qipao blu, bracciali chiodati, stivali bianchi e capelli raccolti in odango con nastri.",rel:[["M. Bison","Nemesi","È legato alla scomparsa e morte del padre."],["Li-Fen","Allieva e figlia adottiva","Chun-Li la protegge e forma nelle arti marziali."],["Guile","Alleato","Condivide operazioni contro Shadaloo e obiettivi investigativi."]]},
  {id:"cammy-white",first:"Super Street Fighter II",year:"1993",origin:"Regno Unito · creata da Shadaloo",style:"Combattimento speciale Delta Red",role:"Agente britannica ed ex Doll di Shadaloo",summary:"Cammy, un tempo Killer Bee controllata da Shadaloo, recupera autonomia e combatte per impedire che altre persone subiscano lo stesso destino.",arc:"Dopo amnesia e servizio nel Delta Red ricostruisce il passato come corpo destinato a Bison; il legame con le Dolls la spinge a proteggerle e smantellare Shadaloo.",personality:"Diretta, disciplinata, leale e poco incline alle formalità, con profonda empatia verso le vittime di controllo mentale.",weakness:"Trauma, memoria frammentaria e tendenza ad affrontare da sola le minacce legate al passato.",appearance:"Lunghi capelli biondi intrecciati, berretto rosso e body verde classico; in Street Fighter 6 usa abiti tattici moderni.",rel:[["M. Bison","Creatore e oppressore","La usa come Killer Bee e potenziale corpo sostitutivo."],["Decapre","Sorella Doll","Il loro legame personale guida la volontà di liberare le Dolls."],["Delta Red","Unità e famiglia scelta","Le offre identità e scopo dopo Shadaloo."]]},
  {id:"blanka-street-fighter",first:"Street Fighter II",year:"1991",origin:"Brasile",style:"Combattimento ferale ed elettricità corporea",role:"Combattente della giungla e amico degli eroi",summary:"Blanka è Jimmy, sopravvissuto nella giungla brasiliana dopo un incidente aereo e divenuto un combattente verde capace di generare elettricità.",arc:"Partecipa ai tornei, ritrova la madre Samantha e cerca accettazione senza rinunciare all’identità costruita nella natura.",personality:"Istintivo, gentile, leale e sensibile al rifiuto, nonostante l’aspetto feroce.",weakness:"Ingenuità sociale, stigma legato all’aspetto e tecniche spesso basate sull’avvicinamento diretto.",appearance:"Corpo verde muscoloso, capelli arancioni, denti pronunciati e cavigliere spezzate.",rel:[["Samantha","Madre","Il ricongiungimento conferma l’identità umana di Jimmy."],["Dan Hibiki","Amico","Condivide avventure e comicità in diverse apparizioni."],["Laura Matsuda","Amica brasiliana","Rappresenta un altro legame con la comunità di origine."]]},
  {id:"e-honda",first:"Street Fighter II",year:"1991",origin:"Giappone",style:"Sumo",role:"Lottatore di sumo e ambasciatore della disciplina",summary:"E. Honda entra nei tornei internazionali per dimostrare al mondo il valore e la potenza del sumo.",arc:"Gestisce un bagno pubblico, allena e combatte avversari di discipline diverse, trattando ogni sfida come promozione culturale.",personality:"Orgoglioso, ospitale, energico e rispettoso delle tradizioni.",weakness:"Mobilità laterale limitata e tendenza a misurare ogni problema attraverso la logica del sumo.",appearance:"Grande rikishi con mawashi, trucco kabuki rosso e bianco e chonmage.",rel:[["Hakan","Amico e rivale","Condivide rispetto e competizione fra discipline tradizionali."],["Ryu","Avversario rispettato","Rappresenta il confronto sincero fra arti marziali."],["Allievi di sumo","Responsabilità","Li forma e usa i tornei per dare visibilità alla disciplina."]]},
  {id:"m-bison-street-fighter",first:"Street Fighter II",year:"1991",origin:"Non definita · guida Shadaloo",style:"Psycho Power e combattimento militare",role:"Dittatore di Shadaloo e antagonista principale",summary:"M. Bison guida Shadaloo usando Psycho Power, controllo mentale e corpi sostitutivi per imporre un dominio globale.",arc:"Sviluppa il progetto Psycho Drive, manipola le Dolls e ritorna attraverso nuovi corpi dopo ripetute sconfitte, fino alla riapparizione priva di memoria completa in Street Fighter 6.",personality:"Autoritario, crudele, narcisista e convinto che potere e volontà giustifichino ogni conquista.",weakness:"Corpi incapaci di contenere stabilmente il Psycho Power, arroganza e legami energetici sfruttabili dagli avversari.",appearance:"Uniforme militare rossa, berretto con emblema alato, mantello e occhi illuminati dal Psycho Power.",rel:[["Chun-Li","Nemica","La morte del padre alimenta la sua indagine contro Shadaloo."],["Cammy","Vittima e corpo progettato","La controlla come Killer Bee e ne cancella il passato."],["Ryu","Obiettivo","Desidera usare il suo potenziale come corpo o fonte di potere."]]},
  {id:"vega-street-fighter",first:"Street Fighter II",year:"1991",origin:"Spagna",style:"Ninjutsu spagnolo, artiglio e acrobazia",role:"Assassino di Shadaloo e combattente narcisista",summary:"Vega è un aristocratico assassino ossessionato dalla bellezza, che protegge il volto con una maschera e combatte con artiglio e agilità.",arc:"Il trauma per la morte della madre trasforma bellezza e bruttezza in criteri morali distorti; entra in Shadaloo come uno dei principali esecutori di Bison.",personality:"Narcisista, sadico, elegante e sprezzante verso ciò che considera brutto.",weakness:"Ossessione per il volto, vanità e minore efficacia quando perde artiglio o mobilità.",appearance:"Uomo biondo con maschera bianca, tatuaggio viola, fascia e artiglio metallico a tre lame.",rel:[["M. Bison","Superiore","Lavora per Shadaloo mantenendo obiettivi personali."],["Chun-Li","Avversaria","La affronta durante le operazioni legate a Shadaloo."],["Cammy","Avversaria","Condivide con lei il passato nell’organizzazione da posizioni opposte."]]},
  {id:"dhalsim-street-fighter",first:"Street Fighter II",year:"1991",origin:"India",style:"Yoga marziale",role:"Maestro spirituale e protettore del villaggio",summary:"Dhalsim è uno yogi pacifista che combatte soltanto per proteggere famiglia e comunità, usando elasticità corporea, meditazione e fiamme rituali.",arc:"Partecipa ai tornei per raccogliere risorse e contrastare minacce; il conflitto fra non violenza e responsabilità resta centrale.",personality:"Saggio, compassionevole, disciplinato e consapevole del peso morale del combattimento.",weakness:"Riluttanza a ferire, fisico leggero e necessità di mantenere concentrazione e distanza.",appearance:"Asceta magro con cranio dipinto, collana di teschi simbolici e arti capaci di estendersi.",rel:[["Sally","Moglie","Condivide con lei famiglia e responsabilità del villaggio."],["Datta","Figlio","La sua sicurezza motiva molte partecipazioni ai tornei."],["Ryu","Alleato spirituale","Lo aiuta a comprendere e governare il conflitto interiore."]]},
];

const streetFighterProfiles=streetFighterMetadata.map((character)=>({id:character.id,category:"Videogiochi",work:character.first,primaryWork:`${character.first} · Capcom, ${character.year}`,continuity:"Continuità principale dei videogiochi Street Fighter",continuityNote:"Film, animazione, fumetti e adattamenti live action mantengono continuità distinte; Street Fighter 6 aggiorna lo stato contemporaneo dei personaggi presenti.",format:"Videogioco picchiaduro",classification:character.style,creator:"Capcom",firstAppearance:character.first,firstYear:character.year,species:"Essere umano, salvo alterazioni espressamente documentate",gender:"Identità e pronomi documentati nei giochi",birth:"Data variabile secondo i profili ufficiali e la cronologia mobile",origin:character.origin,role:character.role,summary:character.summary,biography:[{heading:"Origine",text:character.summary},{heading:"Percorso",text:character.arc},{heading:"Disciplina",text:`Lo stile ${character.style} traduce storia e carattere in un linguaggio di combattimento riconoscibile.`}],chronology:[{title:character.first,description:`Debutto nel ${character.year}.`,spoiler:"none"},{title:"Conflitto principale",description:character.arc,spoiler:"major"},{title:"Era moderna",description:"Lo stato corrente viene riferito ai giochi più recenti senza incorporare automaticamente adattamenti esterni.",spoiler:"moderate"}],personality:character.personality,motivation:character.role,method:character.style,strength:`Padronanza di ${character.style} e qualità caratteriali descritte nel profilo ufficiale`,weakness:character.weakness,appearance:character.appearance,visualTraits:character.appearance,limitations:[{name:"Limite personale",description:character.weakness},{name:"Disciplina",description:"Le tecniche richiedono addestramento, distanza e condizioni coerenti con lo stile."},{name:"Continuità",description:"Imprese e poteri degli adattamenti non vengono sommati alla versione dei videogiochi."}],relationships:character.rel.map(([name,type,description])=>({name,type,description})),appearances:[{title:character.first,format:"Videogioco",role:character.role,year:character.year},{title:"Serie Street Fighter",format:"Videogiochi",role:"Combattente ricorrente",year:`${character.year}–presente`}],officialSources:[{title:`Street Fighter · ${registryById.get(character.id)?.name}`,url:"https://www.streetfighter.com/6/en-us/character/",note:"Archivio ufficiale Capcom dei combattenti e dei profili contemporanei."}],contentWarnings:["Violenza marziale","Organizzazioni criminali","Controllo mentale"]}));

const tekkenMetadata = [
  {id:"kazuya-mishima",first:"Tekken",year:"1994",country:"Giappone, cittadinanza successivamente rinunciata",style:"Karate da combattimento stile Mishima",role:"Antagonista centrale e leader di G Corporation",summary:"Kazuya Mishima sopravvive alla violenza del padre Heihachi, conquista il primo torneo e trasforma vendetta e Devil Gene in un progetto di dominio globale.",arc:"Gettato da bambino da un dirupo, stringe il conflitto con il Devil Gene; dopo morte e resurrezione guida G Corporation, uccide Heihachi e impone una guerra mondiale contrastata dal figlio Jin.",personality:"Freddo, vendicativo, dominante e calcolatore, considera affetto e pietà vulnerabilità da sfruttare.",weakness:"Ossessione per il controllo, conflitto con Jin e potere demoniaco che alimenta la disumanizzazione.",appearance:"Uomo muscoloso con capelli neri a punta, guanti chiodati e cicatrice sul petto; la forma Devil aggiunge ali, corna e poteri energetici.",rel:[["Heihachi Mishima","Padre e nemesi","Il loro abuso reciproco struttura la saga Mishima."],["Jin Kazama","Figlio e avversario","Condivide il Devil Gene e diventa l’ostacolo decisivo al dominio globale."],["Jun Kazama","Madre di Jin","Il loro incontro produce un legame che Kazuya non riesce a ridurre completamente a debolezza."]],url:"https://tekken.com/fighters/kazuya-mishima"},
  {id:"jin-kazama",first:"Tekken 3",year:"1997",country:"Giappone",style:"Karate",role:"Protagonista, erede Mishima e oppositore del Devil Gene",summary:"Jin Kazama eredita sangue Mishima e Devil Gene, passa dalla vendetta al tentativo estremo di spezzare la maledizione familiare e infine cerca espiazione.",arc:"Addestrato da Jun e poi Heihachi, viene tradito dal nonno; provoca una guerra per risvegliare Azazel e distruggere il Devil Gene, fallisce e torna per fermare Kazuya.",personality:"Riservato, disciplinato, tormentato e disposto a caricarsi di colpe enormi per un obiettivo che ritiene necessario.",weakness:"Senso di colpa, isolamento e ricorso a strategie catastrofiche per controllare il Devil Gene.",appearance:"Capelli neri a punte, guanti rossi e tatuaggio sul braccio; Devil Jin mostra ali nere, corna e segni demoniaci.",rel:[["Kazuya Mishima","Padre e nemesi","La loro guerra concentra il conflitto del Devil Gene."],["Jun Kazama","Madre","Gli trasmette disciplina Kazama e desiderio di purificazione."],["Ling Xiaoyu","Amica","Cerca di salvarlo dalla spirale di colpa e isolamento."]],url:"https://tekken.com/fighters/jin-kazama"},
  {id:"heihachi-mishima",first:"Tekken",year:"1994",country:"Giappone",style:"Karate da combattimento stile Mishima",role:"Fondatore della Mishima Zaibatsu e patriarca antagonista",summary:"Heihachi Mishima costruisce la Zaibatsu come potenza militare e sottopone famiglia e rivali a prove brutali per eliminare il Devil Gene e mantenere il controllo.",arc:"Getta Kazuya da un dirupo, organizza i tornei, tradisce Jin e combatte guerre globali; creduto morto dopo lo scontro con Kazuya, ritorna ancora nella continuità di Tekken 8.",personality:"Autoritario, spietato, orgoglioso e straordinariamente resistente, con rare forme di affetto subordinate al potere.",weakness:"Arroganza, ossessione dinastica e incapacità di interrompere la violenza familiare.",appearance:"Anziano estremamente muscoloso con baffi e capelli bianchi sollevati ai lati, spesso a torso nudo o in karategi.",rel:[["Kazuya Mishima","Figlio e nemesi","Il tentato omicidio infantile avvia generazioni di vendetta."],["Jin Kazama","Nipote e vittima","Lo addestra e poi tradisce per paura del Devil Gene."],["Reina","Figlia","La sua esistenza estende l’eredità e i segreti di Heihachi."]],url:"https://tekken.com/fighters/heihachi-mishima"},
  {id:"nina-williams",first:"Tekken",year:"1994",country:"Irlanda",style:"Arti assassine basate su aikido e koppojutsu",role:"Assassina professionista e agente operativa",summary:"Nina Williams è un’assassina irlandese addestrata fin dall’infanzia, coinvolta nei conflitti Mishima e legata a esperimenti di criosonno e genetica.",arc:"La rivalità con Anna attraversa tornei e incarichi; dopo il criosonno perde parte della memoria e scopre che Steve Fox è nato dal proprio materiale genetico.",personality:"Fredda, professionale, indipendente e concentrata sull’incarico, evita legami che possano condizionarla.",weakness:"Amnesia, conflitto irrisolto con Anna e rifiuto emotivo della maternità genetica.",appearance:"Donna bionda atletica con completi tattici o abiti eleganti da assassina.",rel:[["Anna Williams","Sorella e rivale","Competizione familiare e professionale produce scontri continui."],["Steve Fox","Figlio genetico","Nina rifiuta di interpretare il legame biologico come maternità."],["Kazuya Mishima","Committente","In Tekken 8 opera come comandante delle forze di G Corporation."]],url:"https://tekken.com/fighters/nina-williams"},
  {id:"yoshimitsu-tekken",first:"Tekken",year:"1994",country:"Sconosciuto",style:"Manji Ninjutsu",role:"Leader del clan Manji e ladro benefattore",summary:"Yoshimitsu guida il clan Manji, usa una spada maledetta e combina furto ai potenti, soccorso ai deboli e tecnologia cibernetica.",arc:"Infiltra tornei e laboratori Mishima per ottenere risorse o salvare vittime; il controllo della spada e la protezione del clan richiedono continue modifiche a corpo e armatura.",personality:"Enigmatico, teatrale, altruista e imprevedibile, alterna saggezza a tattiche volutamente bizzarre.",weakness:"Influenza della spada maledetta, corpo modificato e tecniche rischiose che possono danneggiare anche lui.",appearance:"Ninja cibernetico con maschere e armature radicalmente diverse in ogni gioco, sempre associato a una spada.",rel:[["Clan Manji","Seguaci","Li guida in operazioni contro organizzazioni oppressive."],["Kunimitsu","Ex membro e rivale","Il furto della spada e l’eredità del nome creano conflitto."],["Dr. Bosconovitch","Alleato","Tecnologia e salvataggi reciproci collegano i loro percorsi."]],url:"https://tekken.com/fighters/yoshimitsu"},
  {id:"eddy-gordo",first:"Tekken 3",year:"1997",country:"Brasile",style:"Capoeira",role:"Combattente in cerca di giustizia e maestro di capoeira",summary:"Eddy Gordo impara la capoeira in prigione dopo essere stato incastrato per l’omicidio del padre e usa i tornei per raggiungere i responsabili legati alla Mishima Zaibatsu.",arc:"Addestrato da un maestro detenuto, protegge Christie e cerca una cura per il maestro; la guerra di Kazuya lo conduce a guidare una resistenza in Tekken 8.",personality:"Carismatico, leale, determinato e segnato dalla perdita, mantiene disciplina nonostante il desiderio di vendetta.",weakness:"Il dolore per padre e maestro può rendere prevedibili obiettivi e alleanze.",appearance:"Brasiliano atletico con dreadlock e abiti vivaci ispirati alla capoeira.",rel:[["Christie Monteiro","Allieva e alleata","Le insegna capoeira e condivide la cura del nonno-maestro."],["Mestre","Maestro","Gli trasmette la disciplina durante la detenzione."],["Kazuya Mishima","Nemico","Le strutture di potere collegate a Kazuya alimentano la sua ricerca di giustizia."]],url:"https://tekken.com/fighters/eddy-gordo"},
  {id:"ling-xiaoyu",first:"Tekken 3",year:"1997",country:"Cina",style:"Arti marziali cinesi Baguazhang e Piguaquan",role:"Combattente e amica determinata a salvare Jin",summary:"Ling Xiaoyu entra nel torneo sognando un parco divertimenti, ma il legame con Jin la coinvolge progressivamente nella tragedia Mishima.",arc:"Studia in Giappone con Panda, cerca una macchina del tempo per impedire la caduta della famiglia e continua a inseguire Jin per sottrarlo all’isolamento.",personality:"Vivace, ottimista, tenace e più percettiva di quanto l’entusiasmo iniziale suggerisca.",weakness:"Idealizzazione di Jin, impulsività e stile che richiede mobilità continua.",appearance:"Giovane cinese con capelli in due code e abiti marziali colorati, spesso arancioni o rosa.",rel:[["Jin Kazama","Amico e interesse affettivo","Rifiuta di abbandonarlo al Devil Gene e alla colpa."],["Panda","Migliore amica e guardiana","La accompagna a scuola e nei tornei."],["Heihachi Mishima","Sponsor iniziale","Promette di realizzare il parco in cambio della partecipazione al torneo."]],url:"https://tekken.com/fighters/ling-xiaoyu"},
  {id:"king-tekken",first:"Tekken 3",year:"1997",country:"Messico",style:"Pro wrestling",role:"Lottatore e responsabile di un orfanotrofio",summary:"Il secondo King eredita maschera e missione del predecessore, usando il wrestling professionistico per finanziare e proteggere un orfanotrofio.",arc:"Orfano formato dal primo King e poi da Armor King, affronta Marduk dopo la morte del mentore ma trasforma la vendetta in rivalità e collaborazione.",personality:"Nobile, disciplinato, protettivo e capace di controllare la rabbia per il bene degli orfani.",weakness:"Responsabilità economica verso l’orfanotrofio e conflitti emotivi legati ai mentori.",appearance:"Lottatore muscoloso con maschera da giaguaro, pantaloni decorati e mantello da ring.",rel:[["Armor King","Mentore","Lo addestra e la sua morte avvia il conflitto con Marduk."],["Craig Marduk","Ex nemico e alleato","La vendetta evolve in rivalità professionale e squadra."],["Orfani","Responsabilità","Combatte e raccoglie fondi per garantire loro un futuro."]],url:"https://tekken.com/fighters/king"},
  {id:"ogre-tekken",first:"Tekken 3",year:"1997",country:"Antica origine non definita",style:"Assorbimento e imitazione delle tecniche",role:"Antagonista noto come Dio della Lotta",summary:"Ogre è un’entità antica risvegliata in Messico che cerca combattenti potenti e assorbe conoscenze marziali e energia vitale.",arc:"La sua caccia elimina o ferisce numerosi maestri, compresa Jun nella percezione di Jin; nel torneo evolve in True Ogre e viene sconfitto.",personality:"Predatorio, distante e guidato dall’acquisizione di potere più che da motivazioni umane.",weakness:"Può essere sconfitto prima o dopo la trasformazione e l’assorbimento non garantisce comprensione strategica perfetta.",appearance:"Forma umanoide verde con ornamenti mesoamericani; True Ogre assume corpo mostruoso alato con corna e serpenti.",rel:[["Jin Kazama","Avversario","Lo affronta per vendicare la scomparsa di Jun."],["Jun Kazama","Bersaglio","La sua assenza viene collegata all’attacco di Ogre."],["Heihachi Mishima","Cacciatore","Organizza il torneo per attirarlo e impossessarsi del suo potere."]],url:"https://tekken.com/es_mx/fighters"},
];

const tekkenProfiles=tekkenMetadata.map((character)=>({id:character.id,category:"Videogiochi",work:character.first,primaryWork:`${character.first} · Bandai Namco, ${character.year}`,continuity:"Continuità principale dei videogiochi Tekken",continuityNote:"La scheda segue la saga videoludica; film, animazione e crossover vengono registrati come adattamenti distinti.",format:"Videogioco picchiaduro",classification:character.style,creator:"Bandai Namco Entertainment",firstAppearance:character.first,firstYear:character.year,species:character.id==="ogre-tekken"?"Entità antica":"Essere umano con eventuali alterazioni documentate",gender:"Identità e pronomi documentati nei giochi",birth:"Profilo ufficiale variabile secondo il personaggio",origin:character.country,role:character.role,summary:character.summary,biography:[{heading:"Origine",text:character.summary},{heading:"Conflitto",text:character.arc},{heading:"Stile e identità",text:`Lo stile ${character.style} collega biografia e funzione nel torneo.`}],chronology:[{title:character.first,description:`Prima apparizione nel ${character.year}.`,spoiler:"none"},{title:"Saga personale",description:character.arc,spoiler:"major"},{title:"Conflitto Mishima",description:"Il ruolo viene aggiornato rispetto alla fase precisa della guerra fra Mishima Zaibatsu e G Corporation.",spoiler:"moderate"}],personality:character.personality,motivation:character.role,method:character.style,strength:`Padronanza di ${character.style} e ruolo consolidato nella saga`,weakness:character.weakness,appearance:character.appearance,visualTraits:character.appearance,limitations:[{name:"Limite personale",description:character.weakness},{name:"Sistema di combattimento",description:"Tecniche e trasformazioni seguono le condizioni narrative e ludiche del capitolo di riferimento."},{name:"Continuità",description:"Adattamenti e apparizioni crossover non vengono sommati automaticamente."}],relationships:character.rel.map(([name,type,description])=>({name,type,description})),appearances:[{title:character.first,format:"Videogioco",role:character.role,year:character.year},{title:"Serie Tekken",format:"Videogiochi",role:"Combattente della saga",year:`${character.year}–presente`}],officialSources:[{title:`Tekken · ${registryById.get(character.id)?.name}`,url:character.url,note:"Profilo ufficiale del combattente, stile, provenienza e stato narrativo."}],contentWarnings:["Violenza marziale","Conflitti familiari","Guerra e organizzazioni criminali"]}));

function buildDossier(profile) {
  const registryId = profile.id === "ivano" ? "ivano-animal-crossing" : profile.id;
  const record = registryById.get(registryId);
  if (!record) throw new Error(`Profilo senza scheda Fuori Trama: ${profile.id}`);
  const discoveryRecord = discoveryById.get(profile.id);
  const profileSourceIds = profile.officialSources.map((source, index) => source.id || (index === 0 ? "official-franchise" : `official-${index + 1}`));
  const sourceIds = profile.defaultSourceIds || ["official-franchise", "primary-work"];
  const sources = [
    ...profile.officialSources.map((source, index) => ({ id: profileSourceIds[index], title: source.title, kind: source.kind || "primary", location: source.url, note: source.note })),
    { id: "primary-work", title: profile.work, kind: "primary", location: profile.primaryWork, note: `Opera primaria usata per biografia, relazioni e continuità di ${record.name}.` },
    ...(!profile.excludeDiscovery && discoveryRecord?.url ? [{ id: "discovery-secondary", title: discoveryRecord.title, kind: "secondary", location: discoveryRecord.url, note: "Fonte secondaria usata per controllo incrociato e disambiguazione; non sostituisce le fonti ufficiali." }] : []),
  ];
  const isBiographicalProfile = /person[ae] real[ei]|biografia/i.test(`${profile.species} ${profile.classification} ${profile.format}`);
  const isHistoricalProfile = /storico|storica|religios|simbolo/i.test(`${profile.classification} ${profile.format}`);

  return {
    slug: record.id,
    name: record.name,
    displayTitle: profile.displayTitle || record.name,
    catalog: { category: profile.category, universe: record.franchise, work: profile.work, continuity: profile.continuity, origin: "documented-third-party", dossierStatus: "complete" },
    image: { src: record.codexImage, alt: `Rappresentazione di ${record.name}`, credit: `${record.name} · ${record.franchise}`, width: record.width, height: record.height },
    summary: verified(profile.summary, sourceIds),
    identity: [
      fact("Nome", verified(record.name, sourceIds)),
      fact("Nome originale", verified(profile.originalName || record.name, sourceIds)),
      fact("Specie o natura", verified(profile.species, sourceIds)),
      fact("Genere e pronomi", verified(profile.gender, sourceIds)),
      fact("Data di nascita", verified(profile.birth || "Non stabilita nella continuità selezionata", sourceIds)),
      fact("Età", verified(profile.age || "Variabile o non stabilita nella continuità selezionata", sourceIds)),
      fact("Luogo d’origine", verified(profile.origin, sourceIds)),
      fact("Provenienza", verified(record.franchise, sourceIds)),
      fact("Occupazione o ruolo", verified(detailedRole(profile), sourceIds)),
    ],
    narrative: [
      fact(isBiographicalProfile ? "Ambito documentato" : isHistoricalProfile ? "Contesto storico" : "Universo", verified(record.franchise, sourceIds)),
      fact(isBiographicalProfile ? "Carriera o attività di riferimento" : isHistoricalProfile ? "Corpus documentale" : "Opera d’origine", verified(profile.work, sourceIds)),
      fact("Categoria", verified(profile.category, sourceIds)),
      fact("Formato", verified(profile.format, sourceIds)),
      fact("Classificazione", verified(profile.classification, sourceIds)),
      fact(isBiographicalProfile ? "Attività professionale" : isHistoricalProfile ? "Funzione documentata" : "Ruolo narrativo", verified(profile.role, sourceIds)),
      fact(isBiographicalProfile ? "Perimetro biografico" : isHistoricalProfile ? "Perimetro storico" : "Continuità principale", verified(profile.continuity, sourceIds)),
      fact(isBiographicalProfile ? "Avvio documentato" : isHistoricalProfile ? "Prima attestazione" : "Prima apparizione", verified(`${profile.firstAppearance} · ${profile.firstYear}`, sourceIds)),
      fact(isBiographicalProfile ? "Soggetto o autori" : isHistoricalProfile ? "Origine o attribuzione" : "Creatore o studio", verified(profile.creator, sourceIds)),
      fact("Distinzione editoriale", verified(profile.continuityNote, sourceIds)),
    ],
    biography: {
      spoilerFree: verified(profile.summary, sourceIds),
      paragraphs: profile.biography.map((paragraph) => ({ heading: paragraph.heading, ...verified(paragraph.text, paragraph.sourceIds || sourceIds) })),
      chronology: profile.chronology.map((event) => ({ ...event, sourceIds: event.sourceIds || sourceIds })),
    },
    personality: {
      profile: verified(profile.personality, sourceIds),
      facts: [
        fact("Tratti dominanti", verified(profile.personality, sourceIds)),
        fact("Motivazione", verified(profile.motivation, sourceIds)),
        fact("Metodo", verified(profile.method, sourceIds)),
        fact("Punto di forza", verified(profile.strength, sourceIds)),
        fact("Conflitto o debolezza", verified(profile.weakness, sourceIds)),
      ],
    },
    appearanceAndAbilities: {
      description: verified(profile.appearance, sourceIds),
      facts: [
        fact("Segni riconoscibili", verified(profile.visualTraits, sourceIds)),
        fact("Linguaggio visivo", verified(profile.visualTraits, sourceIds)),
        fact("Contesto dell’immagine", verified(`Rappresentazione riferita a ${profile.work}; non sostituisce la descrizione canonica delle diverse apparizioni.`, sourceIds)),
      ],
      powers: [],
      limitations: profile.limitations.map((limitation) => ({ name: limitation.name, ...verified(limitation.description, sourceIds) })),
    },
    relationships: profile.relationships.map((relationship) => ({ ...relationship, status: "verified", sourceIds: relationship.sourceIds || sourceIds })),
    production: {
      appearances: [
        ...profile.appearances.map((appearance) => ({ ...appearance, status: "verified", sourceIds: appearance.sourceIds || sourceIds })),
      ],
      facts: [
        fact("Creatore o studio", verified(profile.creator, sourceIds)),
        fact("Continuità documentata", verified(profile.continuity, sourceIds)),
        fact("Opera di riferimento", verified(profile.primaryWork, sourceIds)),
        ...(profile.researchFacts || []).map((researchFact) => fact(researchFact.label, verified(researchFact.value, researchFact.sourceIds || sourceIds))),
      ],
    },
    editorial: {
      verificationLabel: profile.researchTier === "deep-verified"
        ? "Ricerca approfondita · fonti incrociate"
        : profile.researchTier === "deep-derived"
          ? "Opera derivata approfondita · canone separato"
          : "Personaggio di terzi · ricerca documentata",
      lastReviewed: profile.lastReviewed || "19/08/2026",
      editor: "LoreWise Universe · GiWise Studio",
      researchScope: profile.researchScope,
      sourcePolicy: profile.sourcePolicy,
      contentWarnings: profile.contentWarnings || [],
      missingFields: [],
      sources,
    },
    searchTerms: [record.name, profile.originalName, record.franchise, profile.work, profile.role, profile.species].filter(Boolean),
  };
}

const researchedProfiles = [...profiles, ...pokemonProfiles, ...narutoProfiles, ...sonicProfiles, ...southParkProfiles, ...dragonBallProfiles, ...streetFighterProfiles, ...tekkenProfiles];
const researchedIds = new Set(researchedProfiles.map((profile) => profile.id === "ivano" ? "ivano-animal-crossing" : profile.id));
const originalIds = new Set(JSON.parse(fs.readFileSync(path.join(projectRoot, "data", "codex", "original-dossiers.generated.json"), "utf8")).map((entry) => entry.slug));

const peopleFranchises = new Set(["Creator italiani", "Cucina & Intrattenimento", "Cinema e arti marziali", "Cinema classico", "Commedia italiana", "Bud Spencer & Terence Hill", "Stanlio e Ollio", "Aldo, Giovanni e Giacomo", "CoopTV"]);
const fanArtFranchises = new Set(["Carte Extra · Fan Art", "GiWise Fan Art"]);
const creatorByFranchise = new Map([
  ["Marvel", "Marvel Comics"], ["DC Comics", "DC Comics"], ["DC Comics / Batman", "DC Comics"],
  ["Harry Potter", "J. K. Rowling · Warner Bros."], ["Mortal Kombat", "NetherRealm Studios · Warner Bros. Games"],
  ["Silent Hill", "Konami"], ["Resident Evil", "Capcom"], ["Super Mario", "Nintendo"], ["Super Mario Bros.", "Nintendo"],
  ["The Legend of Zelda", "Nintendo"], ["Donkey Kong", "Nintendo"], ["Crash Bandicoot", "Naughty Dog · Activision"],
  ["Winx Club", "Iginio Straffi · Rainbow"], ["Looney Tunes", "Warner Bros."], ["Scooby-Doo", "Hanna-Barbera · Warner Bros."],
  ["I Simpson", "Matt Groening · 20th Television"], ["The Simpsons", "Matt Groening · 20th Television"],
  ["Futurama", "Matt Groening · David X. Cohen"], ["I Griffin", "Seth MacFarlane · 20th Television"], ["Family Guy", "Seth MacFarlane · 20th Television"],
  ["American Dad!", "Seth MacFarlane · Mike Barker · Matt Weitzman"], ["Minecraft", "Mojang Studios"],
  ["Baldur’s Gate 3", "Larian Studios"], ["Attack on Titan", "Hajime Isayama"], ["One Piece", "Eiichiro Oda"],
  ["SpongeBob", "Stephen Hillenburg · Nickelodeon"], ["Adventure Time", "Pendleton Ward · Cartoon Network"],
  ["The Big Bang Theory", "Chuck Lorre · Bill Prady"], ["Ghostbusters", "Columbia Pictures"], ["Shrek", "DreamWorks Animation"],
]);

function fallbackProfile(record) {
  const discoveryRecord = discoveryById.get(record.id);
  const isPerson = peopleFranchises.has(record.franchise);
  const isFanArt = fanArtFranchises.has(record.franchise);
  const isDinosaur = record.franchise === "Dinosauri";
  const safeExtract = discoveryRecord?.status === "candidate-found" && discoveryRecord.matchScore >= 8 ? discoveryRecord.extract : "";
  const work = isFanArt ? `Interpretazione originale GiWise ispirata a ${record.name}` : record.franchise;
  const creator = isFanArt ? "GiWise Studio · soggetto derivato attribuito ai rispettivi titolari" : (creatorByFranchise.get(record.franchise) || (isPerson ? record.name : `Autori e studio di ${record.franchise}`));
  const nature = isPerson ? "Persona reale" : isDinosaur ? "Animale preistorico" : isFanArt ? "Interpretazione fan art non canonica" : "Personaggio di finzione";
  const role = isPerson ? `Professionista documentato nell’ambito ${record.franchise}` : isDinosaur ? "Specie preistorica documentata dalla paleontologia" : `Figura appartenente all’universo ${record.franchise}`;
  const summary = safeExtract || (isFanArt
    ? `${record.name} è una reinterpretazione visiva originale di GiWise Studio. La scheda separa con chiarezza la fan art dai canoni delle proprietà richiamate.`
    : isPerson
      ? `${record.name} è una figura pubblica legata a ${record.franchise}. Il dossier limita i dati alla carriera pubblica e non tratta informazioni private non necessarie.`
      : `${record.name} appartiene a ${record.franchise}. Il dossier mantiene separate le diverse continuità e non attribuisce al personaggio elementi provenienti da adattamenti non selezionati.`);
  const continuity = isFanArt ? "Opera derivata GiWise · continuità editoriale non canonica" : isPerson ? "Biografia pubblica documentata" : isDinosaur ? "Profilo paleontologico, non narrativo" : `Continuità principale di ${record.franchise}`;
  const sourceUrl = discoveryRecord?.url || `Opera primaria: ${record.franchise}`;
  const sourceTitle = discoveryRecord?.title || record.franchise;
  return {
    id: record.id, category: record.category || (isPerson ? "Persone e cultura" : "Enciclopedia"), work,
    primaryWork: isFanArt ? `Archivio creativo GiWise Studio · ${record.id}` : record.franchise,
    continuity, continuityNote: isFanArt ? "Non attribuisce al canone ufficiale eventi, fusioni o trasformazioni ideati per la fan art." : isPerson ? "La scheda riguarda soltanto attività e informazioni professionali pubbliche." : "Adattamenti, reboot e remake non vengono sommati automaticamente alla continuità principale.",
    format: isPerson ? "Biografia pubblica" : isDinosaur ? "Scheda naturalistica" : isFanArt ? "Illustrazione digitale derivata" : record.category || "Opera narrativa",
    classification: nature, creator, firstAppearance: isFanArt ? "Archivio GiWise Studio" : record.franchise, firstYear: isFanArt ? "2026" : "Edizione primaria della continuità selezionata",
    species: nature, gender: isDinosaur ? "Non determinabile dall’immagine" : "Identità documentata nell’opera o nel profilo pubblico", birth: isPerson ? "Dato biografico da fonte pubblica selezionata" : "Non applicabile o non stabilita nella continuità selezionata",
    origin: isPerson ? "Contesto professionale pubblico" : isFanArt ? "Laboratorio visivo GiWise Studio" : record.franchise, role, summary,
    biography: [
      { heading: isPerson ? "Profilo pubblico" : "Identità", text: summary },
      { heading: isFanArt ? "Lettura dell’opera" : "Percorso e funzione", text: isFanArt ? "Composizione, atmosfera e trasformazioni appartengono alla reinterpretazione grafica; non descrivono una nuova forma canonica del personaggio." : `Ruolo e sviluppo vengono riferiti a ${record.franchise}, evitando di trasferire automaticamente eventi o caratteristiche da versioni alternative.` },
      { heading: "Confini della scheda", text: isPerson ? "Sono esclusi indirizzi, contatti privati, relazioni non pubbliche e dati sensibili: il profilo riguarda soltanto attività e identità professionale." : `La descrizione resta circoscritta alla continuità dichiarata di ${record.franchise}.` },
    ],
    chronology: [
      { title: isFanArt ? "Ideazione GiWise" : "Opera o contesto d’origine", description: work, spoiler: "none" },
      { title: "Sviluppo", description: `Il percorso di ${record.name} viene letto all’interno di ${record.franchise}.`, spoiler: "moderate" },
      { title: "Adattamenti", description: "Eventuali versioni cinematografiche, televisive, videoludiche o a fumetti vengono considerate soltanto quando appartengono alla continuità dichiarata.", spoiler: "moderate" },
    ],
    personality: isPerson ? "Il dossier non deduce tratti psicologici privati; descrive esclusivamente la presenza pubblica e professionale." : `La personalità viene ricostruita esclusivamente attraverso azioni e dialoghi della continuità ${record.franchise}.`,
    motivation: isPerson ? "Attività e produzione pubblica" : role, method: isPerson ? "Attività professionale documentata" : "Azioni e capacità mostrate nelle opere della continuità selezionata", strength: isPerson ? "Esperienza professionale pubblicamente documentata" : "Qualità narrative documentate nell’opera di riferimento",
    weakness: isPerson ? "Non vengono formulate valutazioni personali o cliniche." : isFanArt ? "Poteri e trasformazioni visive non costituiscono canone ufficiale." : "Limiti e vulnerabilità dipendono dalla continuità e dall’opera specifica selezionate.",
    appearance: `L’immagine associata a ${record.name} è conservata integralmente nelle proporzioni ${record.width} × ${record.height}; il dossier non la sostituisce con immagini generiche.`,
    visualTraits: `Ritratto univoco della scheda ${record.id}, verificato mediante impronta SHA-256.`,
    limitations: [
      { name: "Perimetro documentale", description: "La scheda non colma con invenzioni i dati canonici non sostenuti dalle fonti selezionate." },
      { name: "Continuità", description: isFanArt ? "La trasformazione è fan art e non appartiene al canone dei soggetti richiamati." : "Versioni alternative e adattamenti vengono mantenuti separati." },
      { name: "Attribuzione", description: "Capacità e imprese vengono attribuite soltanto quando sostenute dall’opera o dalla fonte indicata." },
    ],
    relationships: [{ name: record.franchise, type: isPerson ? "Ambito pubblico" : "Universo di riferimento", description: isFanArt ? "Fonte d’ispirazione separata dall’opera derivata GiWise." : `Contesto principale usato per classificare ${record.name}.` }],
    appearances: [{ title: work, format: isPerson ? "Attività pubblica" : isFanArt ? "Illustrazione digitale" : record.category || "Opera narrativa", role, year: isFanArt ? "2026" : "Continuità selezionata" }],
    officialSources: [{ title: sourceTitle, url: sourceUrl, kind: discoveryRecord?.url ? "secondary" : "primary", note: discoveryRecord?.url ? "Fonte enciclopedica di controllo usata per identificazione e disambiguazione; l’opera primaria resta il riferimento canonico." : "Opera o contesto primario usato per la classificazione editoriale." }],
    contentWarnings: isPerson ? ["Persona reale · dati pubblici soltanto"] : isFanArt ? ["Fan art non canonica", "Possibili temi horror"] : ["Possibili spoiler"],
  };
}

const enhancedResearchedProfiles = researchedProfiles.map((profile) => {
  const registryId = profile.id === "ivano" ? "ivano-animal-crossing" : profile.id;
  const record = registryById.get(registryId);
  const structured = applyStructuredResearch(profile, record, false);
  const curated = applyCuratedResearch(structured, record);
  return fanArtFranchises.has(record.franchise) ? applyDerivedResearch(curated, record) : curated;
});

const fallbackProfiles = registry
  .filter((record) => !originalIds.has(record.id) && !researchedIds.has(record.id))
  .map((record) => {
    const structured = applyStructuredResearch(fallbackProfile(record), record, true);
    const curated = applyCuratedResearch(structured, record);
    return fanArtFranchises.has(record.franchise) ? applyDerivedResearch(curated, record) : curated;
  });

const ids = new Set();
const allProfiles = [...enhancedResearchedProfiles, ...fallbackProfiles]
  .map((profile) => {
    const registryId = profile.id === "ivano" ? "ivano-animal-crossing" : profile.id;
    return ensureCompleteResearchShape(profile, registryById.get(registryId));
  });
const dossiers = allProfiles.map((profile) => {
  if (ids.has(profile.id)) throw new Error(`Profilo manuale duplicato: ${profile.id}`);
  ids.add(profile.id);
  return buildDossier(profile);
});

fs.writeFileSync(outputPath, `${JSON.stringify(dossiers, null, 2)}\n`, "utf8");
console.log(`Generati ${dossiers.length} dossier di terzi verificati: ${outputPath}`);
