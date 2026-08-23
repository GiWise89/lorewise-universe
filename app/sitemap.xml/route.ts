import { catalogArtworks } from "@/lib/artCatalog";
import { codexEntries } from "@/lib/codex";
import { gameProjects } from "@/lib/gameCatalog";
import { creativeJournalEntries, gameJournalEntries } from "@/lib/creativeJournal";
import { shopProductDetails } from "@/lib/shop-product-details";

const siteOrigin = "https://lorewisenexus.it";

const staticPaths = [
  "", "/arte", "/abbonamento", "/commissioni", "/commissioni/condizioni",
  "/giochi", "/giochi/guide", "/download-app", "/assistenza-giochi", "/condizioni-vendita-giochi", "/enciclopedia",
  "/enciclopedia/originali-giwise", "/shop", "/shop/catalogo", "/licenza-arte", "/licenza-gioco",
  "/privacy", "/contatti", "/dove-nascono-i-mondi", "/cronache-del-nexus",
];

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function GET() {
  const paths = new Set([
    ...staticPaths,
    ...catalogArtworks.map((item) => `/arte/${item.slug}`),
    ...codexEntries.map((item) => `/enciclopedia/${item.slug}`),
    ...gameProjects.map((item) => `/giochi/${item.slug}`),
    ...creativeJournalEntries.map((item) => `/dove-nascono-i-mondi/${item.id}`),
    ...gameJournalEntries.map((item) => `/dove-nascono-i-mondi/giochi/${item.id}`),
    ...shopProductDetails.map((item) => `/shop/catalogo/${item.slug}`),
  ]);
  const urls = [...paths].map((path) => `<url><loc>${escapeXml(`${siteOrigin}${path}`)}</loc></url>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
