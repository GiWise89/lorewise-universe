import { artworkEditorialCopy } from "./artworkEditorial.ts";
import {
  additionalArtworkWarnings,
  getArtworkGenre,
  getArtworkTechnique,
  type ArtworkGenre,
} from "./artworkTaxonomy.ts";

export type ArtworkAccess = "exhibition-only" | "commercial-original";
export type ArtworkPriceTier = "essential" | "detailed" | "premium";

export type CatalogArtwork = {
  slug: string;
  code: string;
  image: string;
  title: string | null;
  year: string | null;
  description: string | null;
  technique: string | null;
  category: string | null;
  contentWarning: string | null;
  nativeResolution: string | null;
  access: ArtworkAccess;
  accessLabel: string;
  destination: string;
  license: string;
  sensitive: boolean;
  priceTier: ArtworkPriceTier | null;
  priceTierLabel: string | null;
  priceLabel: string | null;
  membershipAccess: string | null;
  orientation: "portrait" | "landscape";
  genre: ArtworkGenre;
  kindLabel: "Arte originale" | "Fan art";
};

const commercialOriginalNumbers = new Set([
  2, 3, 4, 5, 6, 13, 16, 17, 20, 24, 28, 30, 33, 35, 36, 37, 39, 41, 46,
  48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 63, 64, 65, 67, 71,
]);
const fanArtNumbers = new Set([
  1, 7, 8, 9, 10, 11, 12, 14, 15, 18, 19, 21, 22, 23, 25, 26, 27, 29, 31, 32,
  34, 38, 40, 42, 43, 44, 45, 47, 66, 68, 69, 70, 72, 73, 74, 75, 76, 77, 78,
]);
const adultContentNumbers = new Set([6, 32, 37, 38, 54, 55]);
const essentialNumbers = new Set([6, 16, 33, 39]);
const detailedNumbers = new Set([4, 17, 20, 28, 35, 41, 48, 50, 52, 55, 59, 60, 63, 65, 67, 71]);
const largeNativeNumbers = new Set([2, 3, 4, 5, 13, 17, 20, 24, 28, 30, 33, 36, 39, 54, 55, 56, 57, 58, 59, 61, 62, 63, 64, 65, 67, 68, 72, 73, 76, 78]);
const mediumNativeNumbers = new Set([6, 16, 35, 37, 41, 46, 48, 50, 51, 52, 53, 60, 66, 69, 71]);
const nativeResolutionOverrides: Record<number, string> = {
  49: "3840 × 2160 px",
  70: "1440 × 2304 px",
  74: "1480 × 2100 px",
  75: "1127 × 1600 px",
  77: "1131 × 1599 px",
};

const approvedArtworkDetails: Record<number, {
  title: string;
  year: string;
  description: string;
  technique: string;
  category: string;
  contentWarning: string;
}> = {
  2: {
    title: "La Regina Caduta",
    year: "2025",
    description: "La protagonista della fiaba ribalta il proprio destino e affronta la sovrana che l’ha condannata. Il bosco diventa il teatro di una vendetta oscura, lontana da ogni lieto fine.",
    technique: "Illustrazione narrativa digitale, line art marcata, campiture piatte e fondale atmosferico.",
    category: "Fiaba oscura · Horror narrativo",
    contentWarning: "Sangue, arma da taglio e violenza fiabesca.",
  },
  3: {
    title: "Legami Infernali",
    year: "2026",
    description: "Due figure unite da catene incandescenti, sospese tra amore, sofferenza e possessione. Un legame che sembra impossibile spezzare.",
    technique: "Illustrazione digitale, line art marcata e campiture cromatiche ad alto contrasto.",
    category: "Horror romantico · Dark fantasy",
    contentWarning: "Temi horror, catene e presenza di sangue.",
  },
  4: {
    title: "L’Altra Metà",
    year: "2026",
    description: "Un autoritratto simbolico diviso tra identità umana e decomposizione, con un occhio luminoso che osserva oltre la superficie.",
    technique: "Ritratto digitale, line art e campiture piatte.",
    category: "Body horror · Identità",
    contentWarning: "Body horror e decomposizione del volto.",
  },
  5: {
    title: "Lasciami Uscire",
    year: "2025",
    description: "Davanti allo specchio, il riflesso smette di imitare e reclama la propria libertà. La scena trasforma un momento quotidiano in un confronto con la parte più oscura di sé.",
    technique: "Illustrazione narrativa digitale con line art, campiture scure e interferenze cromatiche.",
    category: "Horror psicologico · Doppia identità",
    contentWarning: "Immaginario demoniaco e tensione psicologica.",
  },
  6: {
    title: "Frutto Proibito",
    year: "2026",
    description: "Una provocazione pop costruita attraverso umorismo adulto, colori vivaci e un’associazione visiva volutamente esplicita.",
    technique: "Illustrazione digitale minimalista, line art e campiture piatte.",
    category: "Pop art provocatoria · Umorismo adulto",
    contentWarning: "Contenuto sessualmente esplicito, riservato a un pubblico adulto.",
  },
  13: {
    title: "Meditazione della Carne",
    year: "2025",
    description: "Una figura meditante conserva la propria immobilità mentre il corpo si trasforma e si disgrega. La quiete spirituale entra in contrasto con un’immagine fisica brutale e inquietante.",
    technique: "Illustrazione digitale, line art marcata, campiture piatte e fondale atmosferico.",
    category: "Horror spirituale · Body horror",
    contentWarning: "Sangue, decomposizione e reinterpretazione horror di un’immagine spirituale.",
  },
  16: {
    title: "Cera Viva",
    year: "2026",
    description: "Tre candele assumono sembianze umane mentre la cera scivola come una pelle consumata. Una sola fiamma rimane accesa, sospesa tra vita e dissoluzione.",
    technique: "Illustrazione digitale, line art e campiture cromatiche essenziali.",
    category: "Horror surreale · Dark fantasy",
    contentWarning: "Volti deformati e atmosfera inquietante.",
  },
  17: {
    title: "La Cacciatrice del Bosco",
    year: "2025",
    description: "La vittima della fiaba cambia ruolo e diventa cacciatrice. Con il mantello ancora macchiato, mostra il risultato dello scontro con la creatura che la inseguiva.",
    technique: "Illustrazione narrativa digitale, line art e palette dominata da rossi e ombre profonde.",
    category: "Fiaba oscura · Horror narrativo",
    contentWarning: "Sangue, arma da taglio e testa di creatura recisa.",
  },
  20: {
    title: "Il Grido tra i Rovi",
    year: "2026",
    description: "Una figura intrappolata nella vegetazione tenta di liberarsi mentre una presenza mostruosa emerge alle sue spalle. Il bianco e nero trasforma la scena in un conflitto puro tra paura e oscurità.",
    technique: "Illustrazione digitale monocromatica ad alto contrasto, costruita attraverso line art e masse nere.",
    category: "Horror psicologico · Incubo botanico",
    contentWarning: "Figura mostruosa, soffocamento simbolico e forte tensione emotiva.",
  },
};

const pricing: Record<ArtworkPriceTier, { label: string; price: string; membership: string }> = {
  essential: { label: "Fascia Essenziale", price: "8,90 €", membership: "Supporter o Collector" },
  detailed: { label: "Fascia Dettagliata", price: "12,90 €", membership: "Supporter o Collector" },
  premium: { label: "Fascia Premium", price: "17,90 €", membership: "Collector · Supporter + 5 €" },
};

export const catalogArtworks: CatalogArtwork[] = Array.from({ length: 78 }, (_, index) => {
  const artworkNumber = index + 1;
  const number = String(artworkNumber).padStart(3, "0");
  const isCommercialOriginal = commercialOriginalNumbers.has(artworkNumber);
  const priceTier: ArtworkPriceTier | null = !isCommercialOriginal
    ? null
    : essentialNumbers.has(artworkNumber)
      ? "essential"
      : detailedNumbers.has(artworkNumber)
        ? "detailed"
        : "premium";
  const price = priceTier ? pricing[priceTier] : null;
  const approvedDetails = approvedArtworkDetails[artworkNumber];
  const editorialCopy = artworkEditorialCopy[artworkNumber];
  const genre = getArtworkGenre(artworkNumber);

  return {
    slug: `lw-art-${number}`,
    code: `LW-ART-${number}`,
    image: `/artworks/previews/lw-art-${number}-preview.jpg`,
    title: editorialCopy?.title ?? approvedDetails?.title ?? null,
    year: editorialCopy?.year ?? approvedDetails?.year ?? null,
    description: editorialCopy?.description ?? approvedDetails?.description ?? null,
    technique: approvedDetails?.technique ?? getArtworkTechnique(artworkNumber),
    category: approvedDetails?.category ?? genre,
    contentWarning: approvedDetails?.contentWarning ?? additionalArtworkWarnings[artworkNumber] ?? null,
    nativeResolution: nativeResolutionOverrides[artworkNumber] ?? (largeNativeNumbers.has(artworkNumber)
      ? "2480 × 3508 px"
      : mediumNativeNumbers.has(artworkNumber)
        ? "1748 × 2480 px"
        : null),
    access: isCommercialOriginal ? "commercial-original" : "exhibition-only",
    accessLabel: isCommercialOriginal
      ? "Originale autorizzata"
      : fanArtNumbers.has(artworkNumber)
        ? "Fan art · Solo esposizione"
        : "Solo esposizione",
    destination: isCommercialOriginal
      ? "Vendita singola oppure credito mensile Supporter/Collector, secondo la fascia indicata."
      : "Anteprima protetta; download non disponibile.",
    license: isCommercialOriginal
      ? "Licenza personale GiWise inclusa prima dell’attivazione del download."
      : "Nessuna licenza di download associata.",
    sensitive: adultContentNumbers.has(artworkNumber),
    priceTier,
    priceTierLabel: price?.label ?? null,
    priceLabel: price?.price ?? null,
    membershipAccess: price?.membership ?? null,
    orientation: artworkNumber === 49 ? "landscape" : "portrait",
    genre,
    kindLabel: fanArtNumbers.has(artworkNumber) ? "Fan art" : "Arte originale",
  };
});

export const commercialOriginalArtworks = catalogArtworks.filter(
  (artwork) => artwork.access === "commercial-original",
);

export const exhibitionOnlyArtworks = catalogArtworks.filter(
  (artwork) => artwork.access === "exhibition-only",
);
