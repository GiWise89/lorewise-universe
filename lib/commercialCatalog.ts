import { catalogArtworks } from "./artCatalog.ts";
import { VIP_ARTWORKS_PRIVATE } from "../data/vip-artworks.ts";

const artworkPrices = { essential: 890, detailed: 1290, premium: 1790 } as const;

const subscriptionPlans = {
  "LW-PASS-SUPPORTER": {
    slug: "supporter",
    title: "LoreWise Supporter",
    description: "Universe Pass Supporter con un credito mensile per opere originali autorizzate",
    amountCents: 790,
  },
  "LW-PASS-COLLECTOR": {
    slug: "collector",
    title: "LoreWise Collector",
    description: "Universe Pass Collector con due crediti mensili per opere originali autorizzate",
    amountCents: 1390,
  },
} as const;

export const commercialProductDrafts = [
  {
    code: "GS-GAME-001-WIN",
    slug: "the-wound-remembers",
    title: "The Wound Remembers · Edizione Windows",
    productType: "game" as const,
    resourceType: "game" as const,
    amountCents: 799,
    currency: "eur" as const,
    licenseType: "personal-software" as const,
    enabled: false,
    blockers: ["Consegna privata approvata", "Ambiente Stripe verificato", "Ordine, licenza, consegna e rimborso collaudati"],
  },
] as const;

export type CommercialProductType = "artwork" | "game" | "subscription" | "commission" | "merchandise";

export type CommercialProduct = {
  code: string;
  slug: string;
  title: string;
  description: string;
  productType: CommercialProductType;
  resourceType: "artwork" | "game" | "subscription" | "commission" | "merchandise";
  amountCents: number;
  currency: "eur";
  licenseType: "personal-digital" | "personal-software" | "subscription-access";
  downloadLimit: number;
};

export function resolveArtworkProduct(code: string): CommercialProduct | null {
  const artwork = catalogArtworks.find((item) => item.code === code);
  if (artwork?.access === "commercial-original" && artwork.priceTier && artwork.title) {
    return {
      code: artwork.code,
      slug: artwork.slug,
      title: artwork.title,
      description: `Edizione digitale personale dell'opera ${artwork.code} di GiWise Studio`,
      productType: "artwork",
      resourceType: "artwork",
      amountCents: artworkPrices[artwork.priceTier],
      currency: "eur",
      licenseType: "personal-digital",
      downloadLimit: 3,
    };
  }
  const vipArtwork = VIP_ARTWORKS_PRIVATE.find((item) => item.code === code && item.mode === "commercial");
  if (!vipArtwork?.priceCents) return null;
  return {
    code: vipArtwork.code,
    slug: `vip-zone#${vipArtwork.id}`,
    title: vipArtwork.title,
    description: `Edizione digitale personale VIP dell'opera ${vipArtwork.code} di GiWise Studio`,
    productType: "artwork",
    resourceType: "artwork",
    amountCents: vipArtwork.priceCents,
    currency: "eur",
    licenseType: "personal-digital",
    downloadLimit: 3,
  };
}

export function resolveGameProduct(code: string): CommercialProduct | null {
  const draft = commercialProductDrafts.find((product) => product.code === code);
  if (!draft) return null;
  return {
    code: draft.code,
    slug: draft.slug,
    title: draft.title,
    description: "Licenza personale dell’edizione Windows di The Wound Remembers",
    productType: "game",
    resourceType: "game",
    amountCents: draft.amountCents,
    currency: draft.currency,
    licenseType: draft.licenseType,
    downloadLimit: 5,
  };
}

export function resolveSubscriptionProduct(code: string): CommercialProduct | null {
  const plan = subscriptionPlans[code as keyof typeof subscriptionPlans];
  if (!plan) return null;
  return {
    code,
    slug: plan.slug,
    title: plan.title,
    description: plan.description,
    productType: "subscription",
    resourceType: "subscription",
    amountCents: plan.amountCents,
    currency: "eur",
    licenseType: "subscription-access",
    downloadLimit: 0,
  };
}

/**
 * Punto di ingresso unico del catalogo commerciale. Le nuove sezioni potranno
 * aggiungere il proprio resolver senza duplicare checkout, ordini e diritti.
 * Finché un resolver non esiste, il relativo prodotto resta non acquistabile.
 */
export function resolveCommercialProduct(productType: CommercialProductType, code: string) {
  if (productType === "artwork") return resolveArtworkProduct(code);
  if (productType === "game") return resolveGameProduct(code);
  if (productType === "subscription") return resolveSubscriptionProduct(code);
  return null;
}

export function getCommercialProductDraft(code: string) {
  return commercialProductDrafts.find((product) => product.code === code) ?? null;
}
