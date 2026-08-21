import storefront from "@/data/shop-storefront-catalog.json";

export type ShopStorefrontProduct = {
  id: string;
  name: string;
  price: string;
  category: "Abbigliamento" | "Oversize" | "Setup e gadget" | "Collezioni Art";
  href: string;
  sourceFile: string;
  image: string;
  verifiedOn: string;
};

export const shopStorefrontProducts = storefront.products as ShopStorefrontProduct[];
export const shopStorefrontVerifiedOn = "19 agosto 2026";

export const shopStorefrontCategories = [
  { value: "Tutti", label: "Tutto il catalogo" },
  { value: "Abbigliamento", label: "Abbigliamento" },
  { value: "Oversize", label: "Oversize" },
  { value: "Setup e gadget", label: "Setup e gadget" },
  { value: "Collezioni Art", label: "Collezioni Art" },
] as const;
