import type { FamiliarAppearance } from "./nexusFamiliarCatalog.ts";
import generatedGrounding from "./nexusFamiliarGeneratedGrounding.json" with { type: "json" };

export type FamiliarGadget = {
  id: string;
  name: string;
  description: string;
  priceCoins?: number;
  priceCents?: number;
  icon: string;
};

export const PREMIUM_FAMILIAR_LOOKS: FamiliarGadget[] = [
  { id: "corona-del-nexus", name: "Corona del Nexus", description: "Una piccola corona regale precomposta in ogni posa e movimento.", priceCents: 99, icon: "/famiglio/gadgets/corona-del-nexus/cat-1/preview.png" },
  { id: "cappuccio-lunare", name: "Cappuccio lunare", description: "Un cappuccio viola notte che segue con precisione la silhouette del Famiglio.", priceCents: 99, icon: "/famiglio/gadgets/cappuccio-lunare/cat-1/preview.png" },
  { id: "gilet-aurora", name: "Gilet dell'aurora", description: "Un gilet turchese e oro disegnato direttamente su ogni fotogramma.", priceCents: 99, icon: "/famiglio/gadgets/gilet-aurora/cat-1/preview.png" },
  { id: "armatura-astrale", name: "Armatura astrale", description: "Una protezione cerimoniale blu e argento, adattata a tutte le azioni.", priceCents: 99, icon: "/famiglio/gadgets/armatura-astrale/cat-1/preview.png" },
  { id: "mantello-nobile", name: "Mantello nobile", description: "Un mantello cremisi con bordo dorato per un aspetto da Custode.", priceCents: 99, icon: "/famiglio/gadgets/mantello-nobile/cat-1/preview.png" },
  { id: "fiocco-celeste", name: "Fiocco celeste", description: "Un elegante fiocco azzurro con gemma, visibile senza coprire il muso.", priceCents: 99, icon: "/famiglio/gadgets/fiocco-celeste/cat-1/preview.png" },
  { id: "ghirlanda-incantata", name: "Ghirlanda incantata", description: "Foglie e piccoli fiori del Nexus integrati nella pixel art del Famiglio.", priceCents: 99, icon: "/famiglio/gadgets/ghirlanda-incantata/cat-1/preview.png" },
];

export const FAMILIAR_GADGETS: FamiliarGadget[] = [
  { id: "berretto-stellare", name: "Berretto stellare", description: "Un copricapo viola e oro adattato alla testa e a ogni posa del Famiglio.", priceCoins: 80, icon: "/famiglio/gadgets/berretto-stellare/cat-1/preview.png" },
  { id: "sciarpa-crepuscolo", name: "Sciarpa del crepuscolo", description: "Una sciarpa magenta che segue collo, corsa, riposo e azioni di cura.", priceCoins: 120, icon: "/famiglio/gadgets/sciarpa-crepuscolo/cat-1/preview.png" },
  { id: "mantellina-custode", name: "Mantellina del Custode", description: "Un abito blu notte rifinito in oro, sagomato per ogni specie.", priceCoins: 170, icon: "/famiglio/gadgets/mantellina-custode/cat-1/preview.png" },
  ...PREMIUM_FAMILIAR_LOOKS,
];

function fileName(path: string) {
  return path.slice(path.lastIndexOf("/") + 1);
}

const LEGACY_MOON_RABBIT_GADGET_GROUNDING: Record<string, readonly (readonly number[])[]> = {
  "berretto-stellare": [
    [.060606, .060606, .060606, .060606, .060606, .060606, .060606, .060606],
    [.141414, .141414, .141414, .141414, .141414, .141414, .141414, .141414],
    [.176768, .176768, .176768, .176768, .176768, .176768, .176768, .176768],
    [.176768, .176768, 0, .176768, .176768, .176768, .176768, .176768],
    [.227273, .227273, .363636, .227273, .227273, .227273, .227273, .227273],
  ],
  "sciarpa-crepuscolo": [
    [.045455, .045455, .035354, .035354, .045455, .040404, .035354, .040404],
    [.131313, .126263, .131313, .126263, .126263, .126263, .126263, .131313],
    [.161616, .156566, .166667, .161616, .161616, .156566, .166667, .161616],
    [.156566, .151515, 0, .146465, .156566, .146465, .156566, .156566],
    [.207071, .19697, .333333, .20202, .19697, .186869, .191919, .191919],
  ],
  "mantellina-custode": [
    [.121951, .121951, .121951, .121951, .121951, .121951, .121951, .121951],
    [.258537, .258537, .258537, .258537, .258537, .258537, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, .42439, .419512],
    [.526829, .526829, .658537, .526829, .526829, .526829, .526829, .526829],
  ],
};

const GADGET_GROUNDING_SUFFIX: Record<string, string> = {
  "berretto-stellare": "cap",
  "sciarpa-crepuscolo": "scarf",
  "mantellina-custode": "mantle",
  "corona-del-nexus": "crown",
  "cappuccio-lunare": "hood",
  "gilet-aurora": "vest",
  "armatura-astrale": "armor",
  "mantello-nobile": "cape",
  "fiocco-celeste": "bow",
  "ghirlanda-incantata": "garland",
};

export function familiarAppearanceWithGadget(appearance: FamiliarAppearance, gadgetId: string | null | undefined): FamiliarAppearance {
  if (!gadgetId || !FAMILIAR_GADGETS.some((entry) => entry.id === gadgetId)) return appearance;
  const root = `/famiglio/gadgets/${gadgetId}/${appearance.id}`;
  const generatedKey = `${appearance.id}-${GADGET_GROUNDING_SUFFIX[gadgetId]}`;
  const grounding = appearance.spritePath.includes("/professional/animal-mega-pack/") ? undefined : (generatedGrounding as Record<string, number[][]>)[generatedKey]
    ?? (appearance.id === "moon-rabbit" ? LEGACY_MOON_RABBIT_GADGET_GROUNDING[gadgetId] : undefined);
  const behaviors = Object.fromEntries(Object.entries(appearance.behaviors).map(([behavior, sequence]) => {
    const row = behavior === "idle" || behavior === "sit" ? 0 : behavior === "walk" ? 1 : behavior === "groom" ? 3 : 4;
    return [behavior, {
      ...sequence,
      spritePath: `${root}/${fileName(sequence.spritePath)}`,
      groundRatios: grounding?.[row] ?? sequence.groundRatios,
    }];
  })) as unknown as FamiliarAppearance["behaviors"];
  return {
    ...appearance,
    spritePath: `${root}/actions.png`,
    behaviors,
    actionGroundRatios: grounding ? { 0: grounding[0], 1: grounding[1], 2: grounding[2], 3: grounding[3], 4: grounding[4] } : appearance.actionGroundRatios,
  };
}
