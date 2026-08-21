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
  { genre: "Anime e manga", numbers: [14, 15, 21, 22, 27, 29, 34, 42, 43, 44] },
  { genre: "Cinema e serie", numbers: [1, 9, 12, 18, 19, 23, 26, 45, 47, 66] },
  { genre: "Cartoon e cultura pop", numbers: [7, 8, 10, 11, 25, 40] },
  { genre: "Fantasy e surreale", numbers: [16, 31, 33, 46, 48, 52, 53, 63, 64] },
  { genre: "Horror e dark art", numbers: [2, 3, 4, 5, 17, 20, 24, 39, 41, 49, 51, 58, 59, 60, 61, 62] },
];

const genreByArtworkNumber = new Map<number, ArtworkGenre>(
  genreGroups.flatMap(({ genre, numbers }) => numbers.map((number) => [number, genre] as const)),
);

const monochromeTechniqueNumbers = new Set([20, 44, 45, 47, 50, 51]);
const popTechniqueNumbers = new Set([6, 7, 8, 10, 11, 12, 15, 16, 25, 32, 38, 40, 48, 52, 60, 61, 63, 64, 66]);
const narrativeTechniqueNumbers = new Set([2, 3, 5, 13, 17, 19, 24, 28, 30, 33, 41, 49, 58, 62, 65, 67]);

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
};

export function getArtworkGenre(artworkNumber: number): ArtworkGenre {
  const genre = genreByArtworkNumber.get(artworkNumber);
  if (!genre) throw new Error(`Genere mancante per LW-ART-${String(artworkNumber).padStart(3, "0")}`);
  return genre;
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
