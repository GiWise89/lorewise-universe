import type { FamiliarHomeState, FamiliarNeeds } from "./famiglioHome.ts";

export type FamiliarActivity = "expedition" | "combat";
export type FamiliarWellbeingTier = "splendido" | "stabile" | "inquieto" | "indisposto";

export type FamiliarActivityGate = {
  allowed: boolean;
  tier: FamiliarWellbeingTier;
  multiplier: number;
  reason: string | null;
  warnings: string[];
};

const NEED_LABELS: Record<keyof FamiliarNeeds, string> = {
  hunger: "fame",
  energy: "energia",
  happiness: "gioia",
  hygiene: "igiene",
  affection: "affetto",
};

export function familiarWellbeingTier(home: Pick<FamiliarHomeState, "needs" | "toilet">): FamiliarWellbeingTier {
  const values = Object.values(home.needs);
  const minimum = Math.min(...values);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (home.toilet.wasteCount >= 2 || home.needs.hunger < 15 || home.needs.energy < 18 || home.needs.hygiene < 14) return "indisposto";
  if (minimum < 35 || average < 48 || home.toilet.wasteCount > 0) return "inquieto";
  if (minimum >= 72 && average >= 84) return "splendido";
  return "stabile";
}

export function familiarActivityGate(home: Pick<FamiliarHomeState, "needs" | "toilet" | "activeAction">, activity: FamiliarActivity): FamiliarActivityGate {
  const tier = familiarWellbeingTier(home);
  const warnings = (Object.entries(home.needs) as Array<[keyof FamiliarNeeds, number]>)
    .filter(([, value]) => value < 35)
    .map(([need]) => `Livello di ${NEED_LABELS[need]} basso`);
  if (home.toilet.wasteCount > 0) warnings.push("La Casa deve essere pulita");
  if (home.activeAction) return { allowed: false, tier, multiplier: 1, warnings, reason: "Attendi che l'azione nella Casa sia terminata." };
  if (home.toilet.wasteCount >= 2) return { allowed: false, tier, multiplier: .82, warnings, reason: "Prima pulisci il bagno del Famiglio." };
  if (home.needs.hunger < 15) return { allowed: false, tier, multiplier: .82, warnings, reason: "Il Famiglio ha troppa fame per partire." };
  if (home.needs.energy < (activity === "combat" ? 22 : 18)) return { allowed: false, tier, multiplier: .82, warnings, reason: `Il Famiglio non ha abbastanza energia per ${activity === "combat" ? "lottare" : "partire"}.` };
  if (home.needs.hygiene < 14) return { allowed: false, tier, multiplier: .82, warnings, reason: "Il Famiglio deve essere pulito prima di uscire." };
  if (tier === "inquieto") return { allowed: true, tier, multiplier: .92, warnings, reason: null };
  if (tier === "splendido") return { allowed: true, tier, multiplier: 1.04, warnings, reason: null };
  return { allowed: true, tier, multiplier: 1, warnings, reason: null };
}

export function familiarCombatNeedBonus(gate: FamiliarActivityGate) {
  if (gate.multiplier >= 1.04) return { hp: 3, attack: 2, defense: 2, speed: 1 };
  if (gate.multiplier < 1) return { hp: -5, attack: -2, defense: -2, speed: -2 };
  return {};
}
