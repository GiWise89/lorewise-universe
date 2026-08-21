import catalog from "../data/automatic-artwork-deliveries.json" with { type: "json" };

export type AutomaticArtworkDelivery = (typeof catalog.deliveries)[number];

const deliveries = new Map(catalog.deliveries.map((delivery) => [delivery.code, delivery]));

export function getAutomaticArtworkDelivery(code: string | null | undefined): AutomaticArtworkDelivery | null {
  return code ? deliveries.get(code.trim().toUpperCase()) ?? null : null;
}

export function automaticArtworkDeliveryCount() {
  return deliveries.size;
}

export async function automaticArtworkDeliveryReady(
  bucket: R2Bucket | undefined,
  code: string | null | undefined,
  trustVerifiedLocalCatalog = false,
) {
  const delivery = getAutomaticArtworkDelivery(code);
  if (!delivery) return false;
  if (trustVerifiedLocalCatalog) return true;
  if (!bucket) return false;
  const object = await bucket.head(delivery.objectKey);
  return Boolean(
    object
    && object.size === delivery.size
    && object.customMetadata?.sha256?.toLowerCase() === delivery.sha256,
  );
}
