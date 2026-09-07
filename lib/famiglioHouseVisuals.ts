export type FamiliarHouseVisual = {
  scale: number;
  groundOffset: number;
};

const visual = (scale: number, groundOffset = 0): FamiliarHouseVisual => ({
  scale,
  groundOffset,
});

export const FAMILIAR_HOUSE_VISUALS: Readonly<Record<string, FamiliarHouseVisual>> = {
  cat: visual(.78),
  golden: visual(1.02),
  akita: visual(.98),
  "great-dane": visual(1.2),
  schnauzer: visual(.82),
  "saint-bernard": visual(1.15),
  husky: visual(1.02),
  rabbit: visual(.65),
  fox: visual(.76),
  turtle: visual(.6),
  panda: visual(1.1),
  horse: visual(1.25),
  "polar-bear": visual(1.3),
  "brown-bear": visual(1.24),
  parrot: visual(.55),
  bird: visual(.48),
  chicken: visual(.58),
  wolf: visual(.96),
  "fairy-rabbit": visual(.7),
  "demon-rabbit": visual(.72),
  "faerie-dragon": visual(.82),
  "blue-wyrmling": visual(.86),
  "young-green-dragon": visual(1.02),
  owlbear: visual(1.05),
  griffin: visual(1.02),
  "elder-snail": visual(.72),
  "fiddle-dog": visual(.82),
  "guardian-rabbit": visual(.76),
  slime: visual(.62),
  kappa: visual(.78),
  "nexus-bat": visual(.58),
  "frost-salamander": visual(.76),
  "adult-red-dragon": visual(1.24),
  "ancient-black-dragon": visual(1.28),
  "displacer-beast": visual(1.12),
  "ice-golem": visual(1.18),
  hellhound: visual(1.02),
  imp: visual(.68),
  beholder: visual(.72),
  bulette: visual(1.08),
  "purple-worm": visual(1.12),
  tyrannosaurus: visual(1.26),
  triceratops: visual(1.22),
  velociraptor: visual(1.0),
  stegosaurus: visual(1.2),
  brachiosaurus: visual(1.34),
  ankylosaurus: visual(1.12),
  spinosaurus: visual(1.28),
  parasaurolophus: visual(1.16),
  pteranodon: visual(1.02),
  dilophosaurus: visual(1.08),
  carnotaurus: visual(1.2),
  pachycephalosaurus: visual(1.08),
};

export function familiarHouseVisual(id: string): FamiliarHouseVisual {
  return FAMILIAR_HOUSE_VISUALS[id] ?? visual(.85);
}
