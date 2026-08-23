import type { Metadata } from "next";
import { GlobalSearchExplorer, type GlobalSearchItem } from "@/components/GlobalSearchExplorer";
import { catalogArtworks } from "@/lib/artCatalog";
import { codexEntries } from "@/lib/codex";
import { codexThumbnailSrc, createCodexIndexEntries } from "@/lib/codexIndex";
import { gameProjects } from "@/lib/gameCatalog";
import { shopStorefrontProducts } from "@/lib/shop-storefront";

export const metadata: Metadata = {
  title: "Cerca",
  description: "Ricerca unificata tra Arte, LoreWise Codex, giochi, shop e servizi GiWise Studio.",
  robots: { index: false, follow: false, noarchive: true },
};

export default function SearchPage() {
  const codex = createCodexIndexEntries(codexEntries);
  const items: GlobalSearchItem[] = [
    ...catalogArtworks.filter((item) => item.title).map((item) => ({ type: "Arte" as const, title: item.title!, description: `${item.kindLabel} · ${item.category ?? "Archivio Arte"}`, href: `/arte/${item.slug}`, image: item.image, terms: `${item.code} ${item.description ?? ""} ${item.technique ?? ""} ${item.genre}` })),
    ...codex.map((item) => ({ type: "Codex" as const, title: item.displayTitle, description: `${item.universe} · ${item.descriptor}`, href: `/enciclopedia/${item.slug}`, image: codexThumbnailSrc(item.imageSrc), terms: item.searchTerms.join(" ") })),
    ...gameProjects.map((item) => ({ type: "Giochi" as const, title: item.title, description: `${item.kind} · ${item.status}`, href: `/giochi/${item.slug}`, image: item.catalogCoverImage ?? item.heroImage, terms: `${item.subtitle} ${item.summary} ${item.features.join(" ")} ${item.platforms.join(" ")}` })),
    { type: "Diario", title: "Dove nascono i mondi", description: "Bozze, passioni e dietro le quinte di disegni e videogiochi.", href: "/dove-nascono-i-mondi", image: "/brand/icons/dove-nascono-i-mondi-concept-v1.webp", terms: "GiWise biografia hobby collezioni disegno tavoletta grafica codice sviluppo creativo" },
    ...shopStorefrontProducts.map((item) => ({ type: "Shop" as const, title: item.name, description: `${item.category} · ${item.price}`, href: `/shop/catalogo/${item.id}`, image: item.image, terms: `${item.category} ${item.id}` })),
    { type: "Servizi", title: "Commissioni artistiche", description: "Ritratti, figure complete e opere narrative su richiesta.", href: "/commissioni", image: "/brand/icons/commissioni-concept-v1.webp", terms: "preventivo disegno ritratto opera personalizzata" },
    { type: "Servizi", title: "Universe Pass", description: "Crediti Arte, sconti automatici, accessi anticipati e partecipazione.", href: "/abbonamento", image: "/brand/lorewise-wax-seal-v1.webp", terms: "abbonamento supporter collector vantaggi crediti sconti" },
    { type: "Servizi", title: "Assistenza", description: "Supporto per account, ordini, giochi, download e commissioni.", href: "/assistenza-giochi", image: "/brand/icons/social-assistenza-concept-v1.webp", terms: "aiuto ticket rimborso download account ordine" },
  ];
  return <main className="global-search-page"><div className="shell"><GlobalSearchExplorer items={items} /></div></main>;
}
