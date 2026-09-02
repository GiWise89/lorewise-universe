import { MAX_FAMILIAR_LEVEL } from "./nexusFamiliarProgression.ts";
import { sanitizeFamiliarCloudState } from "./nexusFamiliarCloud.ts";

export type FamiliarCommercialScope = "commissioni" | "giwise-shop";

export type FamiliarLevelBenefit = {
  level: 5 | 10 | 20 | 23 | 35 | 40 | 50;
  title: string;
  benefit: string;
  discountPercent: 0 | 1 | 1.5 | 2 | 2.5 | 3;
  scopes: FamiliarCommercialScope[];
};

export const FAMILIAR_LEVEL_BENEFITS: FamiliarLevelBenefit[] = [
  { level: 5, title: "Compagno riconosciuto", benefit: "Sigillo del Famiglio nel LoreWise ID.", discountPercent: 0, scopes: [] },
  { level: 10, title: "Custode quotidiano", benefit: "1% su commissioni e GiWise Shop, più una missione giornaliera.", discountPercent: 1, scopes: ["commissioni", "giwise-shop"] },
  { level: 20, title: "Legame esperto", benefit: "Titolo Community e sconto Famiglio dell'1,5%.", discountPercent: 1.5, scopes: ["commissioni", "giwise-shop"] },
  { level: 23, title: "Passo oltre la soglia", benefit: "Ricompense Fuori casa migliorate e sconto Famiglio dell'1,5%.", discountPercent: 1.5, scopes: ["commissioni", "giwise-shop"] },
  { level: 35, title: "Custode dell'Archivio", benefit: "Archivio dei ricordi e sconto Famiglio del 2%.", discountPercent: 2, scopes: ["commissioni", "giwise-shop"] },
  { level: 40, title: "Legame raro", benefit: "Emblema raro e sconto Famiglio del 2,5%.", discountPercent: 2.5, scopes: ["commissioni", "giwise-shop"] },
  { level: 50, title: "Custode leggendario", benefit: "Titolo massimo e sconto Famiglio del 3%.", discountPercent: 3, scopes: ["commissioni", "giwise-shop"] },
];

export const FAMILIAR_DISCOUNT_EXCLUSIONS = ["abbonamenti", "spedizione", "promozione-migliore"] as const;

export function familiarLevelDiscount(level: number, scope: FamiliarCommercialScope) {
  const normalized = Math.min(MAX_FAMILIAR_LEVEL, Math.max(1, Math.floor(level)));
  return [...FAMILIAR_LEVEL_BENEFITS].reverse().find((entry) => normalized >= entry.level && entry.scopes.includes(scope))?.discountPercent ?? 0;
}

export function familiarCommunityTitle(level: number) {
  const normalized = Math.min(MAX_FAMILIAR_LEVEL, Math.max(1, Math.floor(level)));
  if (normalized >= 50) return "Custode leggendario";
  if (normalized >= 40) return "Legame raro";
  if (normalized >= 35) return "Custode dell'Archivio";
  if (normalized >= 20) return "Legame esperto";
  if (normalized >= 5) return "Compagno riconosciuto";
  return null;
}

export function bestFamiliarDiscount(level: number, scope: FamiliarCommercialScope, competingDiscountPercent = 0) {
  return Math.max(Math.max(0, competingDiscountPercent), familiarLevelDiscount(level, scope));
}

export async function familiarLevelForCustomer(database: D1Database, customerId: string) {
  try {
    const row = await database.prepare("SELECT state_json FROM nexus_familiars WHERE customer_id = ? LIMIT 1")
      .bind(customerId).first<{ state_json: string }>();
    if (!row) return 1;
    const checked = sanitizeFamiliarCloudState(JSON.parse(row.state_json));
    return checked.ok ? checked.state.level : 1;
  } catch {
    return 1;
  }
}
