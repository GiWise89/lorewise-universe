export type ShopProduct = {
  name: string;
  price: string;
  category: "Abbigliamento" | "Setup e gadget" | "Collezioni Art" | "Personalizzabile";
  image: string;
  href: string;
  note: string;
};

export const shopCollections = [
  { label: "Nuovi arrivi", href: "https://giwiseshop.it/collections/nuovi-arrivi", image: "/shop/products/horror-crossing-stitched-bunny.webp" },
  { label: "Abbigliamento", href: "https://giwiseshop.it/collections/abbigliamento", image: "/shop/products/nerd-life-tshirt.webp" },
  { label: "Oversize", href: "https://giwiseshop.it/collections/oversize", image: "/shop/products/leone-cane-fifone-oversize.webp" },
  { label: "Setup e gadget", href: "https://giwiseshop.it/collections/setup-e-gadget", image: "/shop/products/mousepad-giwise-gaming.webp" },
  { label: "Collezioni Art", href: "https://giwiseshop.it/collections/collezioni-art", image: "/shop/products/quadro-echoes-of-childhood.webp" },
  { label: "Personalizza", href: "https://giwiseshop.it/pages/personalizza-il-tuo-prodotto", image: "/shop/products/cuscino-personalizzabile.webp" },
] as const;

export const shopProducts: ShopProduct[] = [
  { name: "T-shirt Nerd Life: Evolution Gaming", price: "€ 20.00", category: "Abbigliamento", image: "/shop/products/nerd-life-tshirt.webp", href: "https://giwiseshop.it/-t-shirt-nerd-life-59872/", note: "T-shirt gaming disponibile in più colori." },
  { name: "T-Shirt & Felpa Leone il Cane Fifone", price: "€ 20.00", category: "Abbigliamento", image: "/shop/products/leone-cane-fifone-tshirt.webp", href: "https://giwiseshop.it/t-shirt---felpa-leone-il-cane-fifone-59872/", note: "Collezione cartoon in versione T-shirt o felpa." },
  { name: "T-Shirt & Felpa Itachi Uchiha", price: "€ 22.00", category: "Abbigliamento", image: "/shop/products/itachi-red-tshirt.webp", href: "https://giwiseshop.it/t-shirt---felpa-itachi-uchiha-59872/", note: "Fan collection con grafica rossa e varianti T-shirt o felpa." },
  { name: "T-Shirt Unicorno", price: "€ 20.00", category: "Abbigliamento", image: "/shop/products/unicorno-tshirt.webp", href: "https://giwiseshop.it/t-shirt-unicorno-59872/", note: "Grafica illustrata su T-shirt unisex." },
  { name: "Horror Crossing #01 - The Stitched Bunny", price: "€ 21.00", category: "Abbigliamento", image: "/shop/products/horror-crossing-stitched-bunny.webp", href: "https://giwiseshop.it/t-shirt-coco-creepy-59872/", note: "Design horror della collezione GiWise." },
  { name: "T-Shirt Nook Mafia - Boss Edition", price: "€ 22.00", category: "Abbigliamento", image: "/shop/products/nook-mafia-tshirt.webp", href: "https://giwiseshop.it/t-shirt-nook-mafia---boss-edition-59872/", note: "Fan collection in stile urban gaming." },
  { name: "Tazza Cartoon Retro Mash-up - GiWise", price: "€ 16.00", category: "Setup e gadget", image: "/shop/products/tazza-cartoon-retro.webp", href: "https://giwiseshop.it/tazza-cartoon-retro-mash-up---giwise-59872/", note: "Tazza illustrata per setup e scrivania." },
  { name: "MousePad GiWise Gaming", price: "€ 14.00", category: "Setup e gadget", image: "/shop/products/mousepad-giwise-gaming.webp", href: "https://giwiseshop.it/mousepad-giwise-gaming-59872/", note: "Mousepad dedicato all’identità GiWise Gaming." },
  { name: "Cuscino Personalizzabile - Idea Regalo", price: "€ 40.00", category: "Personalizzabile", image: "/shop/products/cuscino-personalizzabile.webp", href: "https://giwiseshop.it/cuscino-personalizzabile---idea-regalo---leggi-des/", note: "Prodotto realizzato su richiesta a partire dal brief del cliente." },
  { name: "Quadro Echoes of Childhood - GiWise Art Edition", price: "€ 40.00", category: "Collezioni Art", image: "/shop/products/quadro-echoes-of-childhood.webp", href: "https://giwiseshop.it/quadro-echoes-of-childhood---giwise-art-edition-59/", note: "Stampa artistica con cornice, prodotta su ordinazione." },
  { name: "Quadro The Gaze of Madness - GiWise Horror Art", price: "€ 45.00", category: "Collezioni Art", image: "/shop/products/quadro-gaze-of-madness.webp", href: "https://giwiseshop.it/quadro-the-gaze-of-madness---giwise-horror-art-598/", note: "Opera horror proposta come quadro incorniciato." },
  { name: "Trittico Canvas Gothic Dark Art - 3 pezzi", price: "€ 120.90", category: "Collezioni Art", image: "/shop/products/trittico-gothic-dark-art.webp", href: "https://giwiseshop.it/trittico-canvas-gothic-dark-art---3-pezzi-59872/", note: "Composizione coordinata su tre tele canvas." },
];

export const shopSupportLinks = [
  { label: "Traccia un ordine", href: "https://giwiseshop.it/tracking" },
  { label: "Contatti", href: "https://giwiseshop.it/contacts" },
  { label: "Condizioni di vendita", href: "https://giwiseshop.it/conditions" },
  { label: "Diritto di recesso", href: "https://giwiseshop.it/returns-policy" },
] as const;

export const shopCatalogVerifiedOn = "19 agosto 2026";
