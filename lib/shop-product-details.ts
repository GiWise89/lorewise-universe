import { shopStorefrontProducts, type ShopStorefrontProduct } from "@/lib/shop-storefront";

export type ShopProductDetail = {
  id: string;
  slug: string;
  name: string;
  category: string;
  identity: string;
  price: string;
  externalHref: string;
  verifiedOn: string;
  introduction: string;
  description: string;
  images: Array<{ src: string; alt: string; label: string }>;
  variants: Array<{ name: string; price: string; note: string }>;
  facts: Array<{ label: string; value: string }>;
};

function formatVerifiedDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Rome",
  }).format(new Date(`${value}T12:00:00Z`));
}

function getIdentity(product: ShopStorefrontProduct) {
  if (/original art|giwise art|holy smoke|thorned redeemer/i.test(product.name)) return "Creazione artistica GiWise";
  if (product.category === "Collezioni Art") return "Edizione artistica da collezione";
  if (product.category === "Setup e gadget") return "Accessorio illustrato GiWise";
  if (product.category === "Oversize") return "Streetwear illustrato oversize";
  return "Collezione grafica indipendente";
}

function getIntroduction(product: ShopStorefrontProduct) {
  const subjects: Record<ShopStorefrontProduct["category"], string> = {
    Abbigliamento: "Una composizione illustrata pensata per essere indossata e riconoscibile, presentata qui senza ritagliare l’immagine originale del prodotto.",
    Oversize: "Una proposta streetwear dalla vestibilità ampia, raccontata attraverso l’immagine completa e i dati verificati del catalogo.",
    "Setup e gadget": "Un oggetto illustrato destinato al setup, alla scrivania o all’uso quotidiano, presentato nella sua composizione integrale.",
    "Collezioni Art": "Un’edizione dedicata all’esposizione dell’opera, organizzata come una scheda editoriale prima dell’accesso al negozio.",
  };
  return subjects[product.category];
}

function getDescription(product: ShopStorefrontProduct) {
  if (/personalizz/i.test(product.name)) {
    return "Il prodotto viene configurato su richiesta. LoreWise ne presenta l’identità visiva; formato, materiali, disponibilità, prezzo finale e istruzioni per la personalizzazione devono essere confermati nella pagina GiWiseShop.it.";
  }
  return `La scheda LoreWise raccoglie l’anteprima completa e i dati pubblici verificati di ${product.name}. Il prezzo indicato è quello di ingresso rilevato nel catalogo; eventuali formati, taglie, colori e costi di spedizione vengono confermati su GiWiseShop.it prima del pagamento.`;
}

function getOptionName(product: ShopStorefrontProduct) {
  if (product.category === "Collezioni Art") return "Edizione esposta";
  if (product.category === "Setup e gadget") return "Configurazione mostrata";
  if (product.category === "Oversize") return "Versione oversize";
  return "Configurazione iniziale";
}

function createCatalogDetail(product: ShopStorefrontProduct): ShopProductDetail {
  const verifiedOn = formatVerifiedDate(product.verifiedOn);
  return {
    id: product.id,
    slug: product.id.toLowerCase(),
    name: product.name,
    category: product.category,
    identity: getIdentity(product),
    price: product.price,
    externalHref: product.href,
    verifiedOn,
    introduction: getIntroduction(product),
    description: getDescription(product),
    images: [
      {
        src: product.image,
        alt: `${product.name} — anteprima completa del prodotto`,
        label: "Anteprima integrale verificata",
      },
    ],
    variants: [
      {
        name: getOptionName(product),
        price: product.price,
        note: "Prezzo di ingresso verificato. Selettori, disponibilità e costo finale restano quelli mostrati nella scheda GiWiseShop.it.",
      },
    ],
    facts: [
      { label: "Categoria", value: product.category },
      { label: "Dati verificati", value: verifiedOn },
      { label: "Gestione ordine", value: "GiWiseShop.it · Hoplix" },
      { label: "Codice LoreWise", value: product.id },
    ],
  };
}

const customProductDetails: Record<string, ShopProductDetail> = {
  "GS-004": {
    id: "GS-004",
    slug: "gs-004",
    name: "T-Shirt & Felpa Itachi Uchiha",
    category: "Abbigliamento",
    identity: "Fan collection indipendente",
    price: "€ 22.00",
    externalHref: "https://giwiseshop.it/t-shirt---felpa-itachi-uchiha-59872/",
    verifiedOn: "19 agosto 2026",
    introduction: "Un’interpretazione grafica in rosso e nero pensata per una presenza netta, leggibile e immediatamente riconoscibile.",
    description: "La composizione viene proposta su T-shirt e felpa attraverso GiWiseShop.it. È una fan collection indipendente: non è merchandising ufficiale e non implica affiliazione con i titolari del personaggio o dell’opera originale.",
    images: [
      { src: "/shop/details/gs-004-itachi-tshirt.webp", alt: "T-Shirt nera con grafica rossa ispirata a Itachi Uchiha", label: "T-Shirt · anteprima completa" },
      { src: "/shop/details/gs-004-itachi-felpa.webp", alt: "Felpa nera con grafica rossa ispirata a Itachi Uchiha", label: "Felpa · anteprima completa" },
    ],
    variants: [
      { name: "T-Shirt Unisex", price: "€ 22.00", note: "Prezzo base rilevato nella scheda pubblica." },
      { name: "Felpa", price: "€ 42.00", note: "Variante verificata nel selettore del prodotto." },
    ],
    facts: [
      { label: "Colore mostrato", value: "Nero" },
      { label: "Produzione", value: "Su ordinazione" },
      { label: "Gestione ordine", value: "GiWiseShop.it · Hoplix" },
      { label: "Codice LoreWise", value: "GS-004" },
    ],
  },
};

export const shopProductDetails = shopStorefrontProducts.map(
  (product) => customProductDetails[product.id] ?? createCatalogDetail(product),
);

const productDetailsBySlug = new Map(shopProductDetails.map((product) => [product.slug, product]));
const productDetailsById = new Map(shopProductDetails.map((product) => [product.id, product]));

export function getShopProductDetail(slug: string) {
  return productDetailsBySlug.get(slug);
}

export function getShopProductDetailHref(id: string) {
  const product = productDetailsById.get(id);
  return product ? `/shop/catalogo/${product.slug}` : null;
}
