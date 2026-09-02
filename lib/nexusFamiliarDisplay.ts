export const FAMILIAR_STAGE_SIZES = {
  Gatto: { desktop: 260, mobile: 168 },
  Cane: { desktop: 500, mobile: 360 },
  Lupo: { desktop: 330, mobile: 220 },
  Coniglio: { desktop: 185, mobile: 122 },
  Volpe: { desktop: 190, mobile: 123 },
  Tartaruga: { desktop: 145, mobile: 96 },
  Gallina: { desktop: 72, mobile: 48 },
  Pappagallo: { desktop: 76, mobile: 50 },
  Orso: { desktop: 270, mobile: 190 },
} as const;

export const FAMILIAR_PEDESTAL_SIZES = {
  Gatto: { desktop: 350, mobile: 88 },
  Cane: { desktop: 600, mobile: 220 },
  Lupo: { desktop: 470, mobile: 124 },
  Coniglio: { desktop: 300, mobile: 82 },
  Volpe: { desktop: 360, mobile: 96 },
  Tartaruga: { desktop: 250, mobile: 74 },
  Gallina: { desktop: 78, mobile: 32 },
  Pappagallo: { desktop: 84, mobile: 34 },
  Orso: { desktop: 320, mobile: 150 },
} as const;

export const FAMILIAR_MOBILE_SPOTLIGHT_SIZES = {
  Gatto: 220,
  Cane: 340,
  Lupo: 220,
  Coniglio: 128,
  Volpe: 130,
  Tartaruga: 110,
  Gallina: 62,
  Pappagallo: 68,
  Orso: 216,
} as const;

// Compact cards have limited room, but must still preserve a readable species hierarchy.
// The factor is applied to the card's base canvas size; full game scenes use the maps above.
export const FAMILIAR_COMPACT_SCALE = {
  Gatto: 0.85,
  Cane: 1,
  Lupo: 0.9,
  Coniglio: 0.55,
  Volpe: 0.55,
  Tartaruga: 0.5,
  Gallina: 0.28,
  Pappagallo: 0.3,
  Orso: 1,
} as const;

export type FamiliarDisplayFamily = keyof typeof FAMILIAR_STAGE_SIZES;

export function familiarDisplayFamily(family: string): FamiliarDisplayFamily {
  return family in FAMILIAR_STAGE_SIZES ? family as FamiliarDisplayFamily : "Gatto";
}
