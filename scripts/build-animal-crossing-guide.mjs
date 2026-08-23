import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

const sourcePath = new URL("../content/guides/animal-crossing-new-horizons.md", import.meta.url);
const outputPath = new URL("../data/animal-crossing-guide.json", import.meta.url);
const source = readFileSync(sourcePath, "utf8").replace(/\r\n/g, "\n");

const artImages = Array.from({ length: 42 }, (_, index) => ({
  src: `/atlas/animal-crossing-new-horizons/artworks/artwork-${String(index + 1).padStart(2, "0")}.jpg`,
  alt: `Confronto completo tra opera autentica e falso, tavola ${index + 1}`,
  caption: `Tavola ${String(index + 1).padStart(2, "0")} · originale e falso a confronto`,
}));

const chapterVisuals = {
  "i-primi-sette-giorni": ["first-days"],
  "economia-e-progressione": ["economy"],
  "borsa-delle-rape": ["turnips"],
  "da-tre-a-cinque-stelle": ["five-stars"],
  "design-terraforming-e-spawn": ["design"],
  "personalizzazione-degli-oggetti": ["customization"],
  "strumenti-d-oro": ["tools"],
  "pattern-e-modelli-personalizzati": ["patterns"],
  "happy-home-paradise": ["happy-home"],
  "modificare-le-case-degli-abitanti": ["villager-homes"],
  "hotel-sul-molo-e-oggetti-console": ["hotel"],
  "nintendo-switch-online": ["online"],
  "creature-marine-elenco-140": ["sea-creatures"],
  "spazi-community-della-categoria": ["community"],
  "checklist-finale": ["checklist"],
};

const visualMeta = {
  "first-days": { src: "/atlas/animal-crossing-new-horizons/official/01-primi-giorni.webp", alt: "Falò e tende sulla spiaggia durante i primi giorni dell'isola", caption: "Il campo iniziale e i primi passi sull'isola · immagine ufficiale Nintendo." },
  economy: { src: "/atlas/animal-crossing-new-horizons/official/02-economia-servizi.webp", alt: "Tom Nook illustra i servizi e l'ampliamento della casa", caption: "Servizi, casa e progressione economica · immagine ufficiale Nintendo." },
  turnips: { src: "/atlas/animal-crossing-new-horizons/official/03-mercato-rape.webp", alt: "Brunella propone al giocatore l'acquisto delle rape", caption: "Il mercato delle rape comincia da Brunella · immagine ufficiale Nintendo." },
  "five-stars": { src: "/atlas/animal-crossing-new-horizons/official/04-cinque-stelle-giardinaggio.webp", alt: "Giocatore che cura un'aiuola fiorita sull'isola", caption: "Fiori, ordine e cura aiutano la valutazione dell'isola · immagine ufficiale Nintendo." },
  design: { src: "/atlas/animal-crossing-new-horizons/official/05-island-designer.webp", alt: "Percorsi, fiume e ponte modificati con gli strumenti di progettazione", caption: "Percorsi e terraformazione con l'App Designer Isola · immagine ufficiale Nintendo." },
  customization: { src: "/atlas/animal-crossing-new-horizons/official/06-decorazione-personalizzazione.webp", alt: "Modalità arredamento con mobili e ambienti personalizzati", caption: "Disporre e personalizzare gli ambienti con precisione · immagine ufficiale Nintendo." },
  tools: { src: "/atlas/animal-crossing-new-horizons/official/07-strumenti-oro.webp", alt: "Giocatore circondato dagli strumenti d'oro e da pepite d'oro", caption: "Gli strumenti d'oro di Animal Crossing: New Horizons, mostrati direttamente nel gioco." },
  patterns: { src: "/atlas/animal-crossing-new-horizons/official/08-modelli-personalizzati.webp", alt: "Abiti creati con diversi modelli personalizzati", caption: "Modelli personalizzati applicati agli abiti · immagine ufficiale Nintendo." },
  "happy-home": { src: "/atlas/animal-crossing-new-horizons/official/09-happy-home-paradise.webp", alt: "Casimira e Gilberti presentano richieste di case vacanza in Happy Home Paradise", caption: "Clienti, desideri e progettazione in Happy Home Paradise · immagine ufficiale Nintendo." },
  "villager-homes": { src: "/atlas/animal-crossing-new-horizons/official/10-case-abitanti.webp", alt: "Interno arredato della casa di un abitante", caption: "Ogni abitante merita uno spazio riconoscibile · immagine ufficiale Nintendo." },
  hotel: { src: "/atlas/animal-crossing-new-horizons/official/11-hotel.webp", alt: "Illustrazione promozionale ufficiale dell'hotel sul molo", caption: "L'hotel sul molo · immagine promozionale ufficiale Nintendo." },
  online: { src: "/atlas/animal-crossing-new-horizons/official/12-online.webp", alt: "Diversi giocatori riuniti sulla stessa isola", caption: "Visitare e giocare insieme online · immagine ufficiale Nintendo." },
  "sea-creatures": { src: "/atlas/animal-crossing-new-horizons/official/13-creature-marine.webp", alt: "Giocatore in muta che mostra una stella marina appena raccolta", caption: "Immersioni e raccolta delle creature marine · immagine ufficiale Nintendo." },
  museum: { src: "/atlas/animal-crossing-new-horizons/official/14-museo-blatero.webp", alt: "Blatero accoglie il giocatore all'interno del museo", caption: "Blatero e le collezioni del museo · immagine ufficiale Nintendo." },
  community: { src: "/atlas/animal-crossing-new-horizons/official/15-community-giocatori.webp", alt: "Un gruppo di giocatori riunito sulla costa dell'isola al tramonto", caption: "Incontrarsi, visitare altre isole e condividere l'esperienza con la community · immagine ufficiale Nintendo." },
  checklist: { src: "/atlas/animal-crossing-new-horizons/official/16-checklist-miglia.webp", alt: "App Miglia di Nook con obiettivi e progressi completati", caption: "Obiettivi e progressi da controllare prima di proseguire · immagine ufficiale Nintendo." },
};

function clean(value) {
  return value
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return clean(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function titleCase(value) {
  return clean(value).toLowerCase().replace(/(^|\s)(\S)/g, (_, space, letter) => `${space}${letter.toUpperCase()}`);
}

function paragraphsAndLists(lines) {
  const paragraphs = [];
  const list = [];
  let buffer = [];
  const flush = () => {
    const value = clean(buffer.join(" "));
    if (value) paragraphs.push(value);
    buffer = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line === "---") { flush(); continue; }
    const match = line.match(/^(?:[-*]|\d+\.)\s+(.*)$/);
    if (match) { flush(); list.push(clean(match[1])); }
    else buffer.push(line);
  }
  flush();
  return { paragraphs, list };
}

const headingMatches = [...source.matchAll(/^##\s+(.+)$/gm)];
const chapters = headingMatches.map((match, index) => {
  const rawHeading = match[1];
  const bodyStart = match.index + match[0].length;
  const bodyEnd = headingMatches[index + 1]?.index ?? source.length;
  const body = source.slice(bodyStart, bodyEnd).trim();
  const heading = rawHeading.replace(/^\d+\.\s*/, "");
  const id = slugify(heading).replace("1-40", "140");
  const sectionMatches = [...body.matchAll(/^###\s+(.+)$/gm)];
  const prefixEnd = sectionMatches[0]?.index ?? body.length;
  const prefix = paragraphsAndLists(body.slice(0, prefixEnd).split("\n"));
  const blocks = [];
  if (prefix.paragraphs.length || prefix.list.length) {
    blocks.push({
      label: "Appunti essenziali",
      title: titleCase(heading),
      text: prefix.paragraphs.join(" ") || "Indicazioni pratiche da tenere aperte mentre giochi.",
      ...(prefix.list.length ? { steps: prefix.list } : {}),
    });
  }
  sectionMatches.forEach((section, sectionIndex) => {
    const start = section.index + section[0].length;
    const end = sectionMatches[sectionIndex + 1]?.index ?? body.length;
    const parsed = paragraphsAndLists(body.slice(start, end).split("\n"));
    const paragraphs = parsed.paragraphs;
    blocks.push({
      label: "Taccuino operativo",
      title: clean(section[1]),
      text: paragraphs.shift() || "Procedura e controlli da seguire durante la partita.",
      ...(parsed.list.length ? { steps: parsed.list } : {}),
      ...(paragraphs.length ? { tips: paragraphs } : {}),
    });
  });
  const words = clean(body).split(" ").length;
  const visuals = (chapterVisuals[id] ?? ["first-days"]).map((key) => visualMeta[key]);
  return {
    id,
    number: String(index + 1).padStart(2, "0"),
    label: titleCase(heading).replace(/\s+E\s+/g, " e "),
    title: titleCase(heading),
    introduction: prefix.paragraphs[0] || `Un quaderno pratico dedicato a ${titleCase(heading).toLowerCase()}.`,
    spoiler: "No spoiler",
    estimatedRead: `${Math.max(4, Math.ceil(words / 170))}–${Math.max(6, Math.ceil(words / 140))} min`,
    images: visuals,
    blocks,
  };
});

chapters.splice(13, 0, {
  id: "opere-del-museo",
  number: "15",
  label: "Opere del museo",
  title: "Riconoscere originali e falsi",
  introduction: "Quarantadue tavole complete da consultare prima di comprare da Volpolo: ogni confronto resta intero, leggibile e separato dagli appunti.",
  spoiler: "No spoiler",
  estimatedRead: "12–18 min",
  images: [visualMeta.museum],
  blocks: [{
    label: "Metodo di controllo",
    title: "Confronta prima di spendere",
    text: "Apri la tavola dell'opera, osserva volto, mani, accessori, colori e dettagli aggiunti. Se il particolare non coincide con l'originale, non acquistare: Blatero non accetta i falsi.",
    steps: ["Apri una tavola alla volta.", "Ingrandisci senza tagliare l'immagine.", "Controlla il dettaglio indicato nel confronto.", "Compra solo quando la versione corrisponde all'originale."],
  }],
  artworkGallery: artImages,
});

chapters.forEach((chapter, index) => { chapter.number = String(index + 1).padStart(2, "0"); });

const sections = [
  {
    id: "progression",
    label: "Inizio e crescita",
    summary: "Primi giorni, Stelline, rape e valutazione dell'isola.",
    icon: { src: "/atlas/animal-crossing-new-horizons/section-icons/progression-v1.webp", alt: "Tenda e casa su una piccola isola", caption: "Inizio e crescita" },
    chapterIds: ["i-primi-sette-giorni", "economia-e-progressione", "borsa-delle-rape", "da-tre-a-cinque-stelle"],
  },
  {
    id: "creativity",
    label: "Isola e creatività",
    summary: "Design, personalizzazione, strumenti e pattern.",
    icon: { src: "/atlas/animal-crossing-new-horizons/section-icons/creativity-v1.webp", alt: "Tavolo creativo con mappa, colori e fiore", caption: "Isola e creatività" },
    chapterIds: ["design-terraforming-e-spawn", "personalizzazione-degli-oggetti", "strumenti-d-oro", "pattern-e-modelli-personalizzati"],
  },
  {
    id: "homes",
    label: "Case e servizi",
    summary: "Progettazione delle case, DLC e servizi dell'isola.",
    icon: { src: "/atlas/animal-crossing-new-horizons/section-icons/homes-v1.webp", alt: "Casa e piccola struttura per gli ospiti su un'isola", caption: "Case e servizi" },
    chapterIds: ["happy-home-paradise", "modificare-le-case-degli-abitanti", "hotel-sul-molo-e-oggetti-console"],
  },
  {
    id: "collections",
    label: "Online e collezioni",
    summary: "Visite online, creature marine e opere del museo.",
    icon: { src: "/atlas/animal-crossing-new-horizons/section-icons/collections-v1.webp", alt: "Cartoline di isole collegate e collezione marina", caption: "Online e collezioni" },
    chapterIds: ["nintendo-switch-online", "creature-marine-elenco-140", "opere-del-museo"],
  },
  {
    id: "community",
    label: "Community e verifica",
    summary: "Spazi condivisi e controllo finale dei progressi.",
    icon: { src: "/atlas/animal-crossing-new-horizons/section-icons/community-v1.webp", alt: "Bacheca dell'isola con mappa e lista completata", caption: "Community e verifica" },
    chapterIds: ["spazi-community-della-categoria", "checklist-finale"],
  },
];

const guide = {
  id: "acnh-complete-guide-01",
  slug: "animal-crossing-new-horizons",
  code: "LW-ATLAS-ACNH-001",
  theme: "animal-crossing",
  game: "Animal Crossing: New Horizons",
  title: "Il taccuino dell'isola",
  subtitle: "Una guida completa e concreta, dai primi sette giorni al museo e alle isole da cinque stelle.",
  description: "Sedici quaderni da tenere aperti mentre giochi: progressione, Stelline, rape, progettazione, personalizzazione, DLC, creature marine e 42 confronti completi per le opere del museo.",
  versionLabel: "Edizione 3.0 · guida 2026",
  updatedAt: "22 agosto 2026",
  vipFrom: "2026-08-22T00:00:00+02:00",
  publicAt: "2026-08-24T00:00:00+02:00",
  cover: visualMeta["first-days"],
  storeUrl: "https://www.nintendo.com/it-it/Giochi/Giochi-per-Nintendo-Switch/Animal-Crossing-New-Horizons-1438623.html",
  storeLabel: "Scopri il gioco su Nintendo",
  sections,
  chapters,
  sources: [
    { label: "Nintendo · Animal Crossing: New Horizons", href: "https://www.nintendo.com/it-it/Giochi/Giochi-per-Nintendo-Switch/Animal-Crossing-New-Horizons-1438623.html" },
    { label: "Nintendo · Happy Home Paradise", href: "https://www.nintendo.com/it-it/Contenuti-scaricabili/Animal-Crossing-New-Horizons-Happy-Home-Paradise-2079216.html" },
    { label: "Nintendo · aggiornamenti e supporto", href: "https://www.nintendo.com/it-it/Assistenza/Nintendo-Switch/Aggiornamenti-dei-software/Animal-Crossing-New-Horizons/Animal-Crossing-New-Horizons-aggiornamenti-dei-software-1749516.html" },
  ],
};

writeFileSync(outputPath, `${JSON.stringify(guide, null, 2)}\n`, "utf8");
console.log(`Generated ${basename(outputPath.pathname)} with ${chapters.length} chapters and ${artImages.length} museum plates.`);
