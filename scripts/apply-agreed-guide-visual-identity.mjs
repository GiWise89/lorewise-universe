import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const guidePath = (slug) => path.join(root, "data", `${slug}-guide.json`);
const chapterPath = (slug, chapter) => path.join(root, "public", "atlas", slug, "chapters", `${chapter.number}-${chapter.id}.webp`);

const identities = {
  "cyberpunk-2077": {
    theme: "cyberpunk-2077",
    icons: [
      ["01-prepare.webp", "Chip di accesso e skyline al neon", "Preparazione a Night City"],
      ["02-build.webp", "Teschio cibernetico attraversato da circuiti", "Build e cyberware"],
      ["03-infiltrate.webp", "Cyberdeck e occhio connessi a una rete", "Infiltrazione e netrunning"],
      ["04-city.webp", "Skyline urbano attraversato da un percorso luminoso", "Esplorazione di Night City"],
      ["05-story.webp", "Frammento di memoria con due sagome", "Storia e conseguenze"],
      ["06-dogtown.webp", "Varco incrinato con uccello-spia", "Dogtown e Phantom Liberty"],
    ],
  },
  "inazuma-eleven-victory-road": {
    theme: "inazuma-eleven-victory-road",
    icons: [
      ["01-kickoff.webp", "Pallone da calcio circondato da un fulmine", "Calcio d'inizio"],
      ["02-tactics.webp", "Lavagna tattica con frecce e traiettorie", "Partita e tattica"],
      ["03-special.webp", "Scarpa che colpisce un pallone elementale", "Tecniche speciali"],
      ["04-team.webp", "Formazione di squadra rappresentata da pedine", "Costruzione della squadra"],
      ["05-chronicle.webp", "Libro-archivio con una formazione di calciatori", "Chronicle Mode"],
      ["06-future.webp", "Coppa davanti a uno stadio luminoso", "Competizione e futuro"],
    ],
  },
  "the-mortuary-assistant": {
    theme: "the-mortuary-assistant",
    icons: [
      ["01-enter.webp", "Chiave della camera mortuaria sotto una lampada", "Ingresso a River Fields"],
      ["02-prepare.webp", "Cartella, targhetta e lente d'ispezione", "Preparazione del corpo"],
      ["03-work.webp", "Flacone, tubo e strumento mortuario", "Procedura di imbalsamazione"],
      ["04-identify.webp", "Sigillo immaginario illuminato da una candela", "Identificazione dell'entità"],
      ["05-survive.webp", "Corridoio buio, lampada e ombra a forma di occhio", "Sopravvivenza al turno"],
      ["06-definitive.webp", "Custodia funeraria, zucca e orologio", "Definitive Edition e Halloween"],
    ],
  },
};

async function loadGuide(slug) {
  return JSON.parse(await readFile(guidePath(slug), "utf8"));
}

async function saveGuide(guide) {
  await writeFile(guidePath(guide.slug), `${JSON.stringify(guide, null, 2)}\n`, "utf8");
}

function applyIdentity(guide) {
  const identity = identities[guide.slug];
  guide.theme = identity.theme;
  guide.sections.forEach((section, index) => {
    const [filename, alt, caption] = identity.icons[index];
    section.generatedIcon = {
      src: `/atlas/${guide.slug}/generated-icons-v1/${filename}`,
      alt,
      caption: `${caption} · icona originale generata con ImageGen`,
    };
  });
}

async function containWebp(input, output, background, brightness = 1) {
  let pipeline = sharp(input).resize(1600, 900, { fit: "contain", background, withoutEnlargement: false });
  if (brightness !== 1) pipeline = pipeline.modulate({ brightness });
  await pipeline.webp({ quality: 88, effort: 6 }).toFile(output);
}

async function updateCyberpunk() {
  const guide = await loadGuide("cyberpunk-2077");
  applyIdentity(guide);
  const replacements = [
    [3, "attributes.jpg", "https://static.cdprojektred.com/cms.cdprojektred.com/16x9_big/ddf0ae3a1c70d90888f491db5125f3a0f6d0e492-1280x720.jpg", "Albero degli attributi e dei perk nel Build Planner ufficiale", "Attributi e perk · Build Planner ufficiale mostrato integralmente"],
    [4, "cyberware-gameplay.jpg", "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1091500/ss_284ba40590de8f604ae693631c751a0aefdc452e.1920x1080.jpg", "Mercenario con un braccio cibernetico in piena luce davanti a una clinica", "Cyberware e salute · impianto cibernetico mostrato integralmente"],
    [14, "phantom.jpg", "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2138330/ss_0e506eb18c5b9c2a6adabaa763592a91114fa3d4.1920x1080.jpg", "Mercato notturno di Dogtown illuminato da lanterne", "Phantom Liberty · Dogtown riconoscibile e mostrata integralmente"],
    [15, "update-23.png", "https://common.cdn.cdpr.app/news/439d3d1d9f367237bcfddf6851f48eb3_q90_1280x720.png", "Grafica ufficiale dell'Update 2.3 di Cyberpunk 2077", "Update 2.3 · grafica ufficiale mostrata integralmente"],
  ];
  for (const [index, filename, sourceUrl, alt, caption] of replacements) {
    const chapter = guide.chapters[index];
    const input = path.join(root, "assets", "guide-official-sources", "cyberpunk-2077", filename);
    await containWebp(input, chapterPath(guide.slug, chapter), "#071015");
    Object.assign(chapter.images[0], { alt, caption, sourceUrl });
  }
  await saveGuide(guide);
}

async function updateInazuma() {
  const guide = await loadGuide("inazuma-eleven-victory-road");
  applyIdentity(guide);
  const sourceRoot = path.join(root, "assets", "guide-official-sources", guide.slug);
  const cover = [
    "steam-capsule.jpg",
    "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2799860/capsule_616x353.jpg",
    "Il cast di INAZUMA ELEVEN Victory Road riunito attorno al pallone con il logo ufficiale",
    "INAZUMA ELEVEN: Victory Road · cast e identità ufficiale del gioco",
  ];
  await containWebp(path.join(sourceRoot, cover[0]), path.join(root, "public", "atlas", guide.slug, "cover.webp"), "#eaf7ff");
  Object.assign(guide.cover, { sourceUrl: cover[1], alt: cover[2], caption: cover[3] });
  const images = [
    ["steam-header.jpg", "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2799860/header.jpg", "Logo ufficiale e protagonisti di Victory Road attorno al pallone", "Edizioni e piattaforme · identità ufficiale del gioco"],
    ["steam-03.jpg", "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2799860/ss_1279f2e22e9c3760910577060bc78189111bdec7.1920x1080.jpg", "Esplorazione della scuola con obiettivo e comandi visibili", "Configurazione iniziale · comandi, obiettivi ed esplorazione"],
    ["site-story.jpg", "https://www.inazuma.jp/victory-road/assets/img/story/synopsis/img_synopsis_01_2510.jpg", "Destin Billows nel cortile della scuola durante lo Story Mode", "Story Mode · il nuovo protagonista e la nuova scuola"],
    ["site-zone.jpg", "https://www.inazuma.jp/victory-road/assets/img/competition/stit_zone_o_2510.jpg", "Zona offensiva attiva durante una partita", "Fondamentali della partita · posizione, tensione e scelta dell'azione"],
    ["site-focus.jpg", "https://www.inazuma.jp/victory-road/assets/img/competition/stit_forcus_2510.jpg", "Interfaccia Focus durante un confronto uno contro uno", "Focus · spazio, direzione e risultato del duello"],
    ["steam-01.jpg", "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2799860/ss_9a85e64436ad96f1ceb06a9b71f433229d2834d2.1920x1080.jpg", "Fire Tornado DD eseguito da due giocatori", "Tecniche speciali · Fire Tornado DD in azione"],
    ["site-tactics.jpg", "https://www.inazuma.jp/victory-road/assets/img/competition/stit_tactics_2510.jpg", "Carta tattica dorata attivata durante la partita", "Tattiche e comando · bonus e piano di squadra"],
    ["steam-04.jpg", "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2799860/ss_a128008288c35a69d0b5511eb8633c742e17f7f7.1920x1080.jpg", "Giocatori di epoche diverse riuniti come squadra", "Costruzione della squadra · ruoli e generazioni riunite"],
    ["site-training.jpg", "https://www.inazuma.jp/victory-road/assets/img/competition/img_enhancement-system_01_2510.jpg", "Giocatore potenziato con una tecnica durante la crescita", "Abilearn e passivi · sviluppo del giocatore"],
    ["site-chronicle.jpg", "https://www.inazuma.jp/victory-road/assets/img/chronicle/img_chronicle-battle-route_01_2510.jpg", "Percorso di battaglie e squadre del Chronicle Mode", "Chronicle Mode · percorso nella storia della serie"],
    ["site-players.jpg", "https://www.inazuma.jp/victory-road/assets/img/chronicle/img_chronicle-players_01_2510.jpg", "Schermata della rosa con giocatori e parametri", "Scouting e collezione · scelta e confronto dei giocatori"],
    ["steam-02.jpg", "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2799860/ss_8c0e596b3d4e097bb24072e90e27e42ac449ae2f.1920x1080.jpg", "Partita competitiva nello stadio con punteggio e comandi visibili", "Competition Mode · partita e pressione competitiva"],
    ["site-bond-town.jpg", "https://www.inazuma.jp/victory-road/assets/img/kizuna/img_kizuna-town_02_2510.jpg", "Bond Town personalizzata attorno a un campo da calcio", "Bond Station · costruzione della propria città"],
    ["site-friends.jpg", "https://www.inazuma.jp/victory-road/assets/img/kizuna/img_friends_01_2510.jpg", "Avatar e amici riuniti nella Bond Station", "Cross-play e cross-save · squadra e amici tra piattaforme"],
    ["steam-06.jpg", "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2799860/ss_e78a4001ebb5a025a277d249bd04368d7d5f5800.1920x1080.jpg", "Nuova scena narrativa con Destin Billows durante un aggiornamento", "Aggiornamenti e DLC · nuovi percorsi narrativi"],
    ["site-chain.jpg", "https://www.inazuma.jp/victory-road/assets/img/competition/stit_chain_2510.jpg", "Tecnica speciale concatenata nella fase decisiva della partita", "Completamento · tecnica concatenata per la vittoria finale"],
  ];
  for (const [index, image] of images.entries()) {
    const chapter = guide.chapters[index];
    await containWebp(path.join(sourceRoot, image[0]), chapterPath(guide.slug, chapter), "#eaf7ff");
    Object.assign(chapter.images[0], { sourceUrl: image[1], alt: image[2], caption: image[3] });
  }
  await saveGuide(guide);
}

async function updateMortuary() {
  const guide = await loadGuide("the-mortuary-assistant");
  applyIdentity(guide);
  const replacements = new Map([
    [0, ["header.jpg", "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1295920/header.jpg", "Titolo ufficiale di The Mortuary Assistant con gli occhi nell'oscurità", "Edizioni e piattaforme · titolo ufficiale leggibile e mostrato integralmente"]],
    [13, ["definitive-trailer.jpg", "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/256695030/movie.293x165.jpg", "Ispezione completa di un corpo nella modalità Embalming Only", "Embalming Only · ispezione del corpo mostrata integralmente"]],
    [14, ["main-trailer.jpg", "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/256700661/movie.600x338.jpg", "Grafica ufficiale di The Mortuary Assistant con sala mortuaria e presenza inquietante", "Definitive Edition · identità horror e nuovi contenuti mostrati integralmente"]],
  ]);
  const originals = await Promise.all(guide.chapters.map((chapter) => readFile(chapterPath(guide.slug, chapter))));
  for (const [index, chapter] of guide.chapters.entries()) {
    const replacement = replacements.get(index);
    const input = replacement
      ? path.join(root, "assets", "guide-official-sources", "the-mortuary-assistant", replacement[0])
      : originals[index];
    const brightness = index === 5 ? 1.38 : [7, 11, 12, 14].includes(index) ? 1.2 : 1.12;
    await containWebp(input, chapterPath(guide.slug, chapter), "#171714", brightness);
    if (replacement) {
      Object.assign(chapter.images[0], { sourceUrl: replacement[1], alt: replacement[2], caption: replacement[3] });
    }
  }
  await saveGuide(guide);
}

const requestedGuide = process.argv.includes("--guide") ? process.argv[process.argv.indexOf("--guide") + 1] : "";
if (!requestedGuide || requestedGuide === "cyberpunk-2077") await updateCyberpunk();
if (!requestedGuide || requestedGuide === "inazuma-eleven-victory-road") await updateInazuma();
if (!requestedGuide || requestedGuide === "the-mortuary-assistant") await updateMortuary();
console.log(requestedGuide ? `Identità visiva di ${requestedGuide} aggiornata.` : "Identità visive, icone e immagini delle tre guide aggiornate.");
