import "server-only";

import { PREMIUM_FAMILIARS } from "./nexusFamiliarCatalog.ts";
import { MEDUSA_FAMILIAR_CATALOG } from "./famiglioMarketExpansion.ts";
import { FAMILIAR_SHOP_OFFERS } from "./nexusFamiliarWorld.ts";

export function familiarProductCode(offerId: string) {
  return `LW-FAM-${offerId.toUpperCase()}`;
}

export function premiumFamiliarIdsForProductCodes(productCodes: Iterable<string>) {
  const codes = new Set(Array.from(productCodes, (code) => code.toUpperCase()));
  const unlocked = new Set<string>();
  for (const offer of FAMILIAR_SHOP_OFFERS) {
    if (!offer.priceCents || !codes.has(familiarProductCode(offer.id))) continue;
    if (offer.kind === "familiar" && offer.appearanceId) unlocked.add(offer.appearanceId);
    if (offer.bundleCategory === "familiars") {
      const appearanceIds = offer.appearanceIds ?? PREMIUM_FAMILIARS.map((appearance) => appearance.id);
      appearanceIds.forEach((appearanceId) => unlocked.add(appearanceId));
    }
  }
  return [...unlocked];
}

export function familiarOfferIdsForProductCodes(productCodes: Iterable<string>) {
  const codes = new Set(Array.from(productCodes, (code) => code.toUpperCase()));
  return FAMILIAR_SHOP_OFFERS.filter((offer) => offer.priceCents && codes.has(familiarProductCode(offer.id)))
    .map((offer) => offer.id);
}

async function activeFamiliarProductCodes(database: D1Database, customerId: string) {
  const entitlements = await database.prepare(`SELECT resource_code FROM entitlements
    WHERE customer_id = ? AND resource_type = 'merchandise' AND status = 'active'`)
    .bind(customerId).all<{ resource_code: string }>();
  return entitlements.results.map((entry) => entry.resource_code);
}

export async function purchasedPremiumFamiliarIds(database: D1Database, customerId: string) {
  return premiumFamiliarIdsForProductCodes(await activeFamiliarProductCodes(database, customerId));
}

export async function purchasedFamiliarOfferIds(database: D1Database, customerId: string) {
  return familiarOfferIdsForProductCodes(await activeFamiliarProductCodes(database, customerId));
}

export function isPremiumFamiliarAppearance(appearanceId: string) {
  return PREMIUM_FAMILIARS.some((appearance) => appearance.id === appearanceId)
    || MEDUSA_FAMILIAR_CATALOG.some((appearance) => appearance.id === appearanceId);
}

export async function canAdoptFamiliarAppearance(database: D1Database, customerId: string, appearanceId: string) {
  if (!isPremiumFamiliarAppearance(appearanceId)) return true;
  return (await purchasedPremiumFamiliarIds(database, customerId)).includes(appearanceId);
}
