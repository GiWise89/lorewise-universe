export type FamiliarMealKind = "fish" | "protein" | "greens" | "seeds" | "bamboo";

export const MEAL_EATING_MS = 4_000;
export const MEAL_SETTLE_MS = 800;

// elapsedMs is measured from arrival, never from the initial care-button click.
export function familiarMealProgress(elapsedMs: number) {
  const elapsed = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  return {
    bites: Math.min(3, Math.floor(elapsed / (MEAL_EATING_MS / 3))),
    settling: elapsed >= MEAL_EATING_MS,
    finished: elapsed >= MEAL_EATING_MS + MEAL_SETTLE_MS,
  };
}

export type FamiliarFoodProfile = {
  kind: FamiliarMealKind;
  label: string;
  assetSrc: string;
};

export const FAMILIAR_MEAL_PROFILES: Readonly<Record<string, FamiliarFoodProfile>> = Object.freeze({
  cat: { kind: "fish", label: "Pesce", assetSrc: "/famiglio/rebuild/inventory/moon-meal.png" },
  golden: { kind: "protein", label: "Bocconi proteici", assetSrc: "/famiglio/rebuild/inventory/moon-meal-dog.png" },
  akita: { kind: "protein", label: "Bocconi proteici", assetSrc: "/famiglio/rebuild/inventory/moon-meal-dog.png" },
  "great-dane": { kind: "protein", label: "Bocconi proteici", assetSrc: "/famiglio/rebuild/inventory/moon-meal-dog.png" },
  schnauzer: { kind: "protein", label: "Bocconi proteici", assetSrc: "/famiglio/rebuild/inventory/moon-meal-dog.png" },
  "saint-bernard": { kind: "protein", label: "Bocconi proteici", assetSrc: "/famiglio/rebuild/inventory/moon-meal-dog.png" },
  husky: { kind: "protein", label: "Bocconi proteici", assetSrc: "/famiglio/rebuild/inventory/moon-meal-dog.png" },
  rabbit: { kind: "greens", label: "Erbe e ortaggi", assetSrc: "/famiglio/rebuild/inventory/moon-meal-herbivore.png" },
  fox: { kind: "protein", label: "Bocconi proteici", assetSrc: "/famiglio/rebuild/inventory/moon-meal-dog.png" },
  turtle: { kind: "greens", label: "Erbe e ortaggi", assetSrc: "/famiglio/rebuild/inventory/moon-meal-herbivore.png" },
  panda: { kind: "bamboo", label: "Bambù fresco", assetSrc: "/famiglio/rebuild/inventory/moon-meal-bamboo.png" },
  horse: { kind: "greens", label: "Erbe e ortaggi", assetSrc: "/famiglio/rebuild/inventory/moon-meal-herbivore.png" },
  "polar-bear": { kind: "fish", label: "Pesce", assetSrc: "/famiglio/rebuild/inventory/moon-meal.png" },
  "brown-bear": { kind: "protein", label: "Bocconi proteici", assetSrc: "/famiglio/rebuild/inventory/moon-meal-dog.png" },
  parrot: { kind: "seeds", label: "Semi e frutta", assetSrc: "/famiglio/rebuild/inventory/moon-meal-seeds.png" },
  bird: { kind: "seeds", label: "Semi e frutta", assetSrc: "/famiglio/rebuild/inventory/moon-meal-seeds.png" },
  chicken: { kind: "seeds", label: "Semi e granaglie", assetSrc: "/famiglio/rebuild/inventory/moon-meal-seeds.png" },
  wolf: { kind: "protein", label: "Bocconi proteici", assetSrc: "/famiglio/rebuild/inventory/moon-meal-dog.png" },
  "fairy-rabbit": { kind: "greens", label: "Erbe del Nexus", assetSrc: "/famiglio/rebuild/inventory/moon-meal-herbivore.png" },
  "demon-rabbit": { kind: "greens", label: "Radici del Nexus", assetSrc: "/famiglio/rebuild/inventory/moon-meal-herbivore.png" },
  "faerie-dragon": { kind: "seeds", label: "Nutrimento del Nexus", assetSrc: "/famiglio/rebuild/inventory/moon-meal-seeds.png" },
  "blue-wyrmling": { kind: "protein", label: "Bocconi proteici", assetSrc: "/famiglio/rebuild/inventory/moon-meal-dog.png" },
  "young-green-dragon": { kind: "protein", label: "Bocconi proteici", assetSrc: "/famiglio/rebuild/inventory/moon-meal-dog.png" },
  owlbear: { kind: "protein", label: "Bocconi proteici", assetSrc: "/famiglio/rebuild/inventory/moon-meal-dog.png" },
  griffin: { kind: "protein", label: "Bocconi proteici", assetSrc: "/famiglio/rebuild/inventory/moon-meal-dog.png" },
  "elder-snail": { kind: "greens", label: "Foglie tenere", assetSrc: "/famiglio/rebuild/inventory/moon-meal-herbivore.png" },
  "fiddle-dog": { kind: "protein", label: "Bocconi proteici", assetSrc: "/famiglio/rebuild/inventory/moon-meal-dog.png" },
  "guardian-rabbit": { kind: "greens", label: "Erbe del Nexus", assetSrc: "/famiglio/rebuild/inventory/moon-meal-herbivore.png" },
  slime: { kind: "seeds", label: "Nutrimento del Nexus", assetSrc: "/famiglio/rebuild/inventory/moon-meal-seeds.png" },
  kappa: { kind: "fish", label: "Pesce", assetSrc: "/famiglio/rebuild/inventory/moon-meal.png" },
  "nexus-bat": { kind: "seeds", label: "Frutta e semi", assetSrc: "/famiglio/rebuild/inventory/moon-meal-seeds.png" },
  "frost-salamander": { kind: "fish", label: "Pesce", assetSrc: "/famiglio/rebuild/inventory/moon-meal.png" },
  "adult-red-dragon": { kind: "protein", label: "Bocconi proteici", assetSrc: "/famiglio/rebuild/inventory/moon-meal-dog.png" },
  "ancient-black-dragon": { kind: "protein", label: "Bocconi proteici", assetSrc: "/famiglio/rebuild/inventory/moon-meal-dog.png" },
  "displacer-beast": { kind: "protein", label: "Bocconi proteici", assetSrc: "/famiglio/rebuild/inventory/moon-meal-dog.png" },
  "ice-golem": { kind: "seeds", label: "Nutrimento del Nexus", assetSrc: "/famiglio/rebuild/inventory/moon-meal-seeds.png" },
  hellhound: { kind: "protein", label: "Bocconi proteici", assetSrc: "/famiglio/rebuild/inventory/moon-meal-dog.png" },
  imp: { kind: "seeds", label: "Nutrimento del Nexus", assetSrc: "/famiglio/rebuild/inventory/moon-meal-seeds.png" },
  beholder: { kind: "seeds", label: "Nutrimento del Nexus", assetSrc: "/famiglio/rebuild/inventory/moon-meal-seeds.png" },
  bulette: { kind: "protein", label: "Bocconi proteici", assetSrc: "/famiglio/rebuild/inventory/moon-meal-dog.png" },
  "purple-worm": { kind: "protein", label: "Bocconi proteici", assetSrc: "/famiglio/rebuild/inventory/moon-meal-dog.png" },
  tyrannosaurus: { kind: "protein", label: "Bocconi proteici", assetSrc: "/famiglio/rebuild/inventory/moon-meal-dog.png" },
  triceratops: { kind: "greens", label: "Felci e foglie", assetSrc: "/famiglio/rebuild/inventory/moon-meal-herbivore.png" },
  velociraptor: { kind: "protein", label: "Bocconi proteici", assetSrc: "/famiglio/rebuild/inventory/moon-meal-dog.png" },
  stegosaurus: { kind: "greens", label: "Felci e foglie", assetSrc: "/famiglio/rebuild/inventory/moon-meal-herbivore.png" },
  brachiosaurus: { kind: "greens", label: "Felci e foglie", assetSrc: "/famiglio/rebuild/inventory/moon-meal-herbivore.png" },
  ankylosaurus: { kind: "greens", label: "Felci e foglie", assetSrc: "/famiglio/rebuild/inventory/moon-meal-herbivore.png" },
  spinosaurus: { kind: "fish", label: "Pesce", assetSrc: "/famiglio/rebuild/inventory/moon-meal.png" },
  parasaurolophus: { kind: "greens", label: "Felci e foglie", assetSrc: "/famiglio/rebuild/inventory/moon-meal-herbivore.png" },
  pteranodon: { kind: "fish", label: "Pesce", assetSrc: "/famiglio/rebuild/inventory/moon-meal.png" },
  dilophosaurus: { kind: "protein", label: "Bocconi proteici", assetSrc: "/famiglio/rebuild/inventory/moon-meal-dog.png" },
  carnotaurus: { kind: "protein", label: "Bocconi proteici", assetSrc: "/famiglio/rebuild/inventory/moon-meal-dog.png" },
  pachycephalosaurus: { kind: "greens", label: "Felci e foglie", assetSrc: "/famiglio/rebuild/inventory/moon-meal-herbivore.png" },
});

export function familiarMealProfile(familiarId: string) {
  return FAMILIAR_MEAL_PROFILES[familiarId] ?? FAMILIAR_MEAL_PROFILES.cat;
}

export function familiarMealAsset(familiarId: string) {
  return familiarMealProfile(familiarId).assetSrc;
}
