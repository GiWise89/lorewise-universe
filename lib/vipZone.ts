import { VIP_ARTWORKS_PRIVATE } from "../data/vip-artworks.ts";
import { VIP_ATELIER_MEDIA_PRIVATE } from "../data/vip-atelier.ts";
import { VIP_WALLPAPERS_PRIVATE } from "../data/vip-downloads.ts";

export const VIP_AREAS = [
  {
    id: "games",
    label: "Giochi",
    description: "Anteprime, dossier e diari di sviluppo",
    status: "2 progetti",
    available: true,
  },
  {
    id: "art",
    label: "Opere d'arte",
    description: "Opere, processi creativi ed edizioni riservate",
    status: "48 opere",
    available: true,
  },
  {
    id: "atelier",
    label: "Atelier",
    description: "Processi, taccuini e studi riservati",
    status: "14 tavole",
    available: true,
  },
  {
    id: "downloads",
    label: "Download VIP",
    description: "File digitali inclusi nel Pass",
    status: "6 sfondi",
    available: true,
  },
] as const;

export const VIP_FUORI_TRAMA_DROP = {
  code: "FT-ROSTER-CANTANTI-01",
  game: "Fuori Trama",
  eyebrow: "Anteprima roster · Novità 01",
  title: "Cantanti fuori trama",
  subtitle: "Le voci entrano nel Nexus.",
  status: "In sviluppo",
  date: "21 agosto 2026",
  introduction: "Una nuova sezione del roster porterà nel Nexus personaggi ispirati al mondo della musica. Cantanti italiani e internazionali potranno entrare nella compagnia e combattere al fianco dei personaggi preferiti nelle avventure di Fuori Trama.",
  roster: [
    { name: "Salmo", image: "fuori-trama-salmo", origin: "Italia" },
    { name: "Noyz Narcos", image: "fuori-trama-noyz-narcos", origin: "Italia" },
    { name: "Kid Yugi", image: "fuori-trama-kid-yugi", origin: "Italia" },
    { name: "Biggie", image: "fuori-trama-biggie", origin: "Internazionale" },
    { name: "2Pac", image: "fuori-trama-2pac", origin: "Internazionale" },
  ],
  promise: "Questi sono soltanto i primi nomi: arriveranno tantissimi altri cantanti italiani e internazionali. Ruoli, abilità e modalità di reclutamento saranno presentati progressivamente, senza anticipare caratteristiche non ancora confermate.",
  communityVote: {
    code: "FT-CANTANTI-COMMUNITY-01",
    title: "Chi vuoi nel Nexus?",
    description: "Scrivi il nome del cantante che vorresti vedere in Fuori Trama. La candidatura vale anche come tuo voto e puoi sostituirla finché la consultazione resta aperta.",
    rule: "I due cantanti più votati saranno selezionati per la fase d'inserimento nel gioco, previa verifica dei diritti e approvazione definitiva.",
  },
  closing: "Fuori Trama resterà gratuito per tutti. Gli abbonati ricevono l'anteprima del roster e dei dossier di sviluppo, non un accesso esclusivo al gioco.",
  rightsNote: "Anteprima creativa locale. Nomi, immagini e riferimenti a persone reali richiedono un audit dei diritti prima di qualsiasi pubblicazione o distribuzione.",
} as const;

export const VIP_EXPANSION = {
  code: "TWR-EXP-ROGO-01",
  game: "The Wound Remembers",
  title: "Il Rogo delle Dieci Porte",
  status: "In progettazione",
  release: "Dicembre 2026",
  keyArt: "rogo-key-art",
  teaser: "Qualcosa si sta muovendo oltre le Dieci Porte.",
  introduction: "Una futura espansione dark fantasy dedicata a una nuova minaccia infernale. Il progetto amplia il mondo di The Wound Remembers con demoni spietati, nuove carte e nuove possibilità tattiche, senza anticipare gli eventi conclusivi del gioco principale.",
  faction: {
    name: "La Corte del Rogo Profondo",
    description: "Una gerarchia infernale governata dalla forza, dalla corruzione e dalla fame. I suoi membri non cercano alleanze: trasformano ogni patto in dominio e ogni debolezza in condanna.",
  },
  privileges: [
    { label: "Anteprima riservata", value: "Prima dell'annuncio pubblico", detail: "Fazione, personaggi e direzione creativa vengono presentati qui in anticipo." },
    { label: "Dossier completi", value: "Dettagli non presenti nel sito pubblico", detail: "Identità, ruolo, minaccia e segni distintivi dei personaggi annunciati." },
    { label: "Archivio digitale", value: "Download in un'area separata", detail: "Gli sfondi inclusi nel Pass sono raccolti nella sezione Download VIP." },
    { label: "Registro di sviluppo", value: "Stato verificabile", detail: "Ogni contenuto distingue ciò che è disponibile da ciò che è ancora in preparazione." },
  ],
  characters: [
    {
      code: "TWR-ROGO-VHAROKH",
      name: "Vharokh",
      title: "Imperatore del Rogo Profondo",
      image: "vharokh-dossier",
      role: "Mega boss · Sovrano della Corte",
      description: "Un abominio enorme, obeso e asimmetrico. Il suo corpo viscido è segnato da piaghe, escrescenze e ferite che sembrano alimentare il fuoco infernale invece di consumarlo.",
      threat: "Brutale, paziente e privo di scrupoli: Vharokh non combatte per conquistare un regno, ma per ridurre ogni resistenza a materia da divorare.",
      traits: ["Massa colossale e irregolare", "Piaghe alimentate dal Rogo", "Presenza da sovrano infernale"],
    },
    {
      code: "TWR-ROGO-VELISARA",
      name: "Velisara",
      title: "La Grazia Marcia",
      image: "velisara-dossier",
      role: "Emissaria infernale · Voce della Corte",
      description: "Una presenza seducente e innaturale: quattro braccia, pelle chiara come lacca incrinata, una corona-maschera e un mantello nero che sembra muoversi come una creatura viva.",
      threat: "Velisara usa fascino, promessa e paura come armi. Il sigillo sul petto custodisce un potere che la presentazione completa dell'espansione rivelerà soltanto più avanti.",
      traits: ["Quattro braccia cerimoniali", "Corona composta da volti", "Mantello nero apparentemente vivo"],
    },
  ],
  rewards: [
    {
      code: "TWR-VIP-WALL-01",
      title: "Desktop VIP 01",
      subject: "The Wound Remembers · Artwork originale",
      description: "Sfondo desktop originale selezionato per il primo archivio digitale riservato agli abbonati.",
      image: "desktop-vip-01",
      packageId: "twr-desktop-vip-01",
      resolution: "1672 × 941",
      format: "PNG",
      edition: "VIP Drop 01",
      credit: "Opera originale GiWise Studio",
    },
    {
      code: "TWR-VIP-WALL-02",
      title: "Desktop VIP 02",
      subject: "The Wound Remembers · Artwork originale",
      description: "Secondo sfondo desktop originale incluso nel Pass e custodito nell’archivio privato.",
      image: "desktop-vip-02",
      packageId: "twr-desktop-vip-02",
      resolution: "1672 × 941",
      format: "PNG",
      edition: "VIP Drop 01",
      credit: "Opera originale GiWise Studio",
    },
    {
      code: "TWR-VIP-WALL-03",
      title: "Desktop VIP 03",
      subject: "The Wound Remembers · Artwork originale",
      description: "Terzo sfondo desktop originale disponibile esclusivamente come ricompensa digitale VIP.",
      image: "desktop-vip-03",
      packageId: "twr-desktop-vip-03",
      resolution: "1536 × 1024",
      format: "PNG",
      edition: "VIP Drop 01",
      credit: "Opera originale GiWise Studio",
    },
  ],
  downloadBundle: {
    packageId: "twr-vip-drop-01-completo",
    title: "VIP Drop 01 completo",
    description: "Un solo ZIP con tutti e tre gli sfondi, LEGGIMI, condizioni d'uso e manifesto SHA-256.",
  },
  archiveUpdates: [
    { state: "Disponibile ora", title: "Rivelazione della Corte", detail: "Fazione, Vharokh, Velisara e tre sfondi desktop originali in alta definizione." },
    { state: "In preparazione", title: "Direzione delle nuove carte", detail: "Prime linee creative delle carte della Corte, senza quantità definitive o promesse di uscita." },
    { state: "In valutazione", title: "Scelta della community", detail: "Un futuro sondaggio VIP potrà orientare quale aspetto della fazione approfondire per primo." },
  ],
  features: [
    "Una nuova fazione infernale legata alle Dieci Porte.",
    "Nuovi demoni, dai seduttori ai carnefici più brutali.",
    "Nuove carte e nuove sinergie per affrontare la Corte.",
    "Meccaniche inedite ancora in fase di progettazione e bilanciamento.",
  ],
} as const;

const VIP_ART_MEDIA = Object.fromEntries(VIP_ARTWORKS_PRIVATE.map((artwork) => [artwork.mediaId, {
  objectKey: `vip-zone/art/previews/${artwork.id}.webp`,
  contentType: "image/webp",
}]));

const VIP_ATELIER_MEDIA = Object.fromEntries(VIP_ATELIER_MEDIA_PRIVATE.map((media) => [media.mediaId, {
  objectKey: media.objectKey,
  contentType: "image/webp",
}]));

const VIP_WALLPAPER_MEDIA = Object.fromEntries(VIP_WALLPAPERS_PRIVATE.flatMap((wallpaper) => [
  [wallpaper.mediaId, { objectKey: wallpaper.originalKey, contentType: "image/png", downloadName: wallpaper.downloadName }],
  [wallpaper.previewId, { objectKey: wallpaper.previewKey, contentType: "image/webp" }],
]));

export const VIP_MEDIA = {
  ...VIP_WALLPAPER_MEDIA,
  "rogo-key-art": {
    objectKey: "vip-zone/games/the-wound-remembers/il-rogo-delle-dieci-porte/key-art-coming-soon-v1.png",
    contentType: "image/png",
  },
  "vharokh-dossier": {
    objectKey: "vip-zone/games/the-wound-remembers/il-rogo-delle-dieci-porte/vharokh-sagoma-v3.png",
    contentType: "image/png",
  },
  "velisara-dossier": {
    objectKey: "vip-zone/games/the-wound-remembers/il-rogo-delle-dieci-porte/velisara-sagoma-v3.png",
    contentType: "image/png",
  },
  "fuori-trama-salmo": {
    objectKey: "vip-zone/games/fuori-trama/cantanti/salmo-v1.jpg",
    contentType: "image/jpeg",
  },
  "fuori-trama-noyz-narcos": {
    objectKey: "vip-zone/games/fuori-trama/cantanti/noyz-narcos-v1.jpeg",
    contentType: "image/jpeg",
  },
  "fuori-trama-kid-yugi": {
    objectKey: "vip-zone/games/fuori-trama/cantanti/kid-yugi-v1.jpg",
    contentType: "image/jpeg",
  },
  "fuori-trama-biggie": {
    objectKey: "vip-zone/games/fuori-trama/cantanti/biggie-v1.jpg",
    contentType: "image/jpeg",
  },
  "fuori-trama-2pac": {
    objectKey: "vip-zone/games/fuori-trama/cantanti/2pac-v1.jpg",
    contentType: "image/jpeg",
  },
  ...VIP_ART_MEDIA,
  ...VIP_ATELIER_MEDIA,
} as const;

export type VipMediaId = keyof typeof VIP_MEDIA;

export function getVipMedia(id: string | null | undefined) {
  return id && id in VIP_MEDIA ? VIP_MEDIA[id as VipMediaId] : null;
}

export function getVipDownload(id: string | null | undefined) {
  const media = getVipMedia(id);
  return media && "downloadName" in media ? media : null;
}
