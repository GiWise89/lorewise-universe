import { catalogArtworks, type CatalogArtwork } from "./artCatalog.ts";

export const HORROR_BUNDLE_STARTS_AT = "2026-10-01T00:00:00+02:00";
export const HORROR_BUNDLE_ENDS_AT = "2026-11-01T23:59:59.999+01:00";
export const HORROR_BUNDLE_PRICE_CENTS = 2490;

const bundleDefinitions = [
  {
    code: "LW-HORROR-BUNDLE-001",
    slug: "fede-corrotta",
    title: "Fede Corrotta",
    theme: "Devozione, simboli sacri e presenze che hanno smarrito la luce.",
    artworkCodes: ["LW-ART-036", "LW-ART-057", "LW-ART-067"],
  },
] as const;

function priceCents(artwork: CatalogArtwork) {
  if (artwork.priceTier === "essential") return 890;
  if (artwork.priceTier === "detailed") return 1290;
  if (artwork.priceTier === "premium") return 1790;
  return 0;
}

export const horrorArtworkBundles = bundleDefinitions.map((bundle) => {
  const artworks = bundle.artworkCodes.map((code) => {
    const artwork = catalogArtworks.find((item) => item.code === code);
    if (!artwork || artwork.access !== "commercial-original" || !artwork.title) {
      throw new Error(`Opera commerciale non valida nella collezione ${bundle.code}: ${code}`);
    }
    return artwork;
  });
  return {
    ...bundle,
    artworks,
    originalTotalCents: artworks.reduce((total, artwork) => total + priceCents(artwork), 0),
    amountCents: HORROR_BUNDLE_PRICE_CENTS,
    priceLabel: "24,90 €",
    period: "Dal 1° ottobre al 1° novembre 2026",
  };
});

export type HorrorArtworkBundle = (typeof horrorArtworkBundles)[number];

export function getHorrorArtworkBundle(code: string) {
  return horrorArtworkBundles.find((bundle) => bundle.code === code) ?? null;
}

export function isHorrorArtworkBundleActive(at: Date | string = new Date()) {
  const timestamp = at instanceof Date ? at.getTime() : Date.parse(at);
  return Number.isFinite(timestamp)
    && timestamp >= Date.parse(HORROR_BUNDLE_STARTS_AT)
    && timestamp <= Date.parse(HORROR_BUNDLE_ENDS_AT);
}
