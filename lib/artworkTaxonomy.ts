export const artworkGenreLabels = [
  "Horror e dark art",
  "Anime e manga",
  "Cinema e serie",
  "Cartoon e cultura pop",
  "Fantasy e surreale",
  "Religioso oscuro",
  "Contenuti per adulti",
] as const;

export type ArtworkGenre = (typeof artworkGenreLabels)[number];

const genreGroups: Array<{ genre: ArtworkGenre; numbers: number[] }> = [
  { genre: "Contenuti per adulti", numbers: [6, 32, 37, 38, 54, 55] },
  { genre: "Religioso oscuro", numbers: [13, 28, 30, 35, 36, 50, 56, 57, 65, 67] },
  { genre: "Anime e manga", numbers: [14, 15, 21, 22, 27, 29, 34, 42, 43, 44, 76, 81] },
  { genre: "Cinema e serie", numbers: [1, 9, 12, 18, 19, 23, 26, 45, 47, 66, 74, 75, 77, 78, 80] },
  { genre: "Cartoon e cultura pop", numbers: [7, 8, 10, 11, 25, 40, 69] },
  { genre: "Fantasy e surreale", numbers: [16, 31, 33, 46, 48, 52, 53, 63, 64, 70, 72] },
  { genre: "Horror e dark art", numbers: [2, 3, 4, 5, 17, 20, 24, 39, 41, 49, 51, 58, 59, 60, 61, 62, 68, 71, 73, 79] },
];

const genreByArtworkNumber = new Map<number, ArtworkGenre>(
  genreGroups.flatMap(({ genre, numbers }) => numbers.map((number) => [number, genre] as const)),
);

export const artworkCategories: Record<number, string> = {
  1: "Cinema horror · Slasher",
  2: "Fiaba oscura · Horror narrativo",
  3: "Dark fantasy · Horror romantico",
  6: "Pop art adulta · Umorismo provocatorio",
  7: "Crossover cartoon · Horror pop",
  8: "Cartoon horror · Macabro pop",
  9: "Supereroi · Serie TV",
  10: "Cartoon vintage · Pin-up pop",
  11: "Cartoon gotico · Commedia macabra",
  12: "Cinema comico · Ritratto pop",
  13: "Horror spirituale · Body horror",
  14: "Anime · Fantascienza",
  15: "Anime · Ritratto pop",
  16: "Horror surreale · Dark fantasy",
  17: "Fiaba oscura · Horror narrativo",
  18: "Cinema muto · Fantascienza pop",
  19: "Cinema horror · Bambole maledette",
  20: "Horror psicologico · Incubo botanico",
  21: "Anime · Dramma interiore",
  22: "Anime · Reinterpretazione pop",
  23: "Cinema horror · Slasher",
  25: "Cartoon grottesco · Satira pop",
  26: "Cinema horror · Clown mostruoso",
  27: "Anime · Dramma ninja",
  28: "Horror occulto · Iconografia religiosa",
  29: "Anime · Arti marziali",
  30: "Horror rituale · Espressionismo",
  31: "Fantasy videoludico · Ritratto",
  32: "Pin-up adulta · Fan art cartoon",
  33: "Dark fantasy · Simbolismo",
  34: "Anime horror · Body horror",
  35: "Horror spirituale · Visione spettrale",
  36: "Horror occulto · Rituale di sangue",
  37: "Body horror adulto · Dark fantasy",
  38: "Pin-up adulta · Fan art videoludica",
  39: "Body horror · Horror romantico",
  40: "Crossover anime-cartoon · Commedia pop",
  41: "Horror psicologico · Body horror",
  42: "Anime · Ritratto atmosferico",
  43: "Anime · Ritratto narrativo",
  44: "Anime · Dark fantasy",
  45: "Cinema horror · Slasher",
  46: "Dark fantasy · Ritratto regale",
  47: "Cinema comico · Ritratto classico",
  48: "Surrealismo pop · Grottesco",
  50: "Horror spirituale · Iconografia mariana",
  51: "Horror emotivo · Lutto",
  52: "Surrealismo tossico · Body horror",
  53: "Fantascienza oscura · Occulto",
  54: "Horror erotico · Arte adulta",
  55: "Horror religioso adulto · Body horror",
  56: "Horror occulto · Cosmic horror",
  57: "Horror religioso · Ritratto grottesco",
  59: "Horror psicologico · Costrizione",
  60: "Horror infantile · Non morto",
  61: "Horror kawaii · Slasher pop",
  62: "Horror emotivo · Lutto",
  63: "Fantasy pop · Simbolismo",
  64: "Fantasy surreale · Doppia identità",
  65: "Horror religioso · Non morto",
  66: "Cinema horror · Clown mostruoso",
  67: "Horror religioso · Lutto",
  68: "Supereroi horror · Fan art",
  69: "Supereroi · Crossover comico",
  70: "Fantasy videoludico · Ritratto di gruppo",
  71: "Horror anatomico · Maternità oscura",
  72: "Fantasy videoludico · Romance",
  73: "Cinema horror · Incubo slasher",
  74: "Videogiochi horror · Survival horror",
  75: "Cinema · Ritratto iconico",
  76: "Anime · Dramma sportivo",
  77: "Cinema romantico · Memoria",
  78: "Serie TV · Commedia scientifica",
  79: "Horror fantascientifico · Distopia",
  80: "Cinema horror indipendente · Fan art",
  81: "Anime · Fan art pop",
};

const monochromeTechniqueNumbers = new Set([20, 44, 45, 47, 50, 51, 71]);
const popTechniqueNumbers = new Set([6, 7, 8, 10, 11, 12, 15, 16, 25, 32, 38, 40, 48, 52, 60, 61, 63, 64, 66, 69, 73, 75, 76, 78, 81]);
const narrativeTechniqueNumbers = new Set([2, 3, 5, 13, 17, 19, 24, 28, 30, 33, 41, 49, 58, 62, 65, 67, 68, 70, 72, 74, 77, 79]);

export const additionalArtworkWarnings: Partial<Record<number, string>> = {
  1: "Sangue, arma da taglio e figura horror.",
  7: "Ustioni, deformazione del volto e arma artigliata.",
  8: "Scheletro e decomposizione in chiave cartoon.",
  11: "Iconografia della morte in chiave cartoon.",
  19: "Bambole horror e atmosfera inquietante.",
  23: "Arma da taglio, sangue e figura minacciosa.",
  24: "Decomposizione, anatomia scheletrica e sangue.",
  25: "Deformazione mostruosa del volto.",
  26: "Clown horror, dentatura mostruosa e atmosfera minacciosa.",
  28: "Teschio, crocifissione e simboli occulti.",
  32: "Immagine sessualizzata, abbigliamento intimo e arma da fuoco, riservata a un pubblico adulto.",
  33: "Teschio, fiamme e iconografia della morte.",
  34: "Sangue, ferite e violenza grafica.",
  35: "Teschi, fumo e reinterpretazione oscura dell’iconografia religiosa.",
  36: "Sangue, simboli occulti e reinterpretazione oscura dell’iconografia religiosa.",
  37: "Contenuto sessuale e body horror, riservato a un pubblico adulto.",
  38: "Posa sessualizzata e abbigliamento intimo, riservati a un pubblico adulto.",
  39: "Sangue e decomposizione del volto.",
  41: "Sangue, mutilazione simbolica e body horror.",
  42: "Rappresentazione del fumo.",
  45: "Sangue e maschera horror fratturata.",
  46: "Teschio, sangue e perforazioni.",
  48: "Deformazione e scioglimento grottesco in chiave pop.",
  49: "Disagio infantile, sofferenza emotiva e immaginario demoniaco.",
  50: "Iconografia religiosa reinterpretata e atmosfera rituale.",
  51: "Lutto, assenza e presenze spettrali.",
  52: "Rappresentazione del fumo e decomposizione surreale.",
  53: "Teschio non umano e simboli occulti.",
  54: "Contenuto sessuale e horror, riservato a un pubblico adulto.",
  55: "Nudità parziale, figura religiosa mostruosa e atmosfera demoniaca, riservate a un pubblico adulto.",
  56: "Sangue, simboli occulti e creatura tentacolare.",
  57: "Figura religiosa mostruosa e rappresentazione del fumo.",
  58: "Figure infantili deformate, sangue e presenza mostruosa.",
  59: "Sofferenza emotiva, deformazione del volto e immagini di costrizione.",
  60: "Sangue, bendaggi e figura infantile mostruosa.",
  61: "Sangue, armi da taglio e immaginario da bambola horror.",
  62: "Teschi, lutto e cuore spezzato.",
  64: "Sangue sulle labbra e atmosfera inquietante.",
  65: "Decomposizione, sangue e reinterpretazione horror dell’iconografia religiosa.",
  66: "Clown horror, sangue, dentatura mostruosa e volto deformato.",
  67: "Decomposizione, lutto infantile e reinterpretazione horror dell’iconografia religiosa.",
  68: "Figura horror, sangue e violenza suggerita.",
  71: "Anatomia scheletrica, figura fetale e iconografia della morte.",
  73: "Cicatrici del volto e guanto con lame.",
  77: "Temi di separazione, memoria e sofferenza emotiva.",
  79: "Teschio, maschera scheletrica e atmosfera distopica.",
};

export function getArtworkGenre(artworkNumber: number): ArtworkGenre {
  const genre = genreByArtworkNumber.get(artworkNumber);
  if (!genre) throw new Error(`Genere mancante per LW-ART-${String(artworkNumber).padStart(3, "0")}`);
  return genre;
}

export function getArtworkCategory(artworkNumber: number): string {
  const category = artworkCategories[artworkNumber];
  if (!category) throw new Error(`Categoria mancante per LW-ART-${String(artworkNumber).padStart(3, "0")}`);
  return category;
}

export function getArtworkTechnique(artworkNumber: number): string {
  if (monochromeTechniqueNumbers.has(artworkNumber)) {
    return "Illustrazione digitale monocromatica ad alto contrasto, costruita con line art, masse nere e interventi cromatici selettivi.";
  }
  if (popTechniqueNumbers.has(artworkNumber)) {
    return "Illustrazione digitale pop, line art marcata, campiture piatte e palette ad alto contrasto.";
  }
  if (narrativeTechniqueNumbers.has(artworkNumber)) {
    return "Illustrazione narrativa digitale, line art marcata, campiture cromatiche e fondale atmosferico.";
  }
  return "Ritratto digitale, line art definita, campiture cromatiche e ombreggiatura illustrativa.";
}
