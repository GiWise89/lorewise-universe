import { catalogArtworks } from "@/lib/artCatalog";
import { codexEntries } from "@/lib/codex";
import { commissionWorks } from "@/lib/commissionCatalog";
import { gameProjects } from "@/lib/gameCatalog";
import { creativeJournalEntries, gameJournalEntries } from "@/lib/creativeJournal";
import { getPublicationCalendarEntries } from "@/lib/publicationCalendar";
import { shopProductDetails } from "@/lib/shop-product-details";

const siteOrigin = "https://lorewisenexus.it";

const staticPaths = [
  "", "/arte", "/abbonamento", "/commissioni", "/commissioni/condizioni",
  "/giochi", "/giochi/guide", "/giochi/nexus-pet", "/assistenza-giochi", "/condizioni-vendita-giochi", "/enciclopedia",
  "/enciclopedia/originali-giwise", "/enciclopedia/proposte-vip", "/shop", "/shop/catalogo", "/licenza-arte", "/licenza-gioco",
  "/privacy", "/contatti", "/community", "/mondi", "/dove-nascono-i-mondi", "/cronache-del-nexus", "/famiglio", "/feste-nel-nexus",
];

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

/** Converts "DD/MM/YYYY" editorial dates to ISO "YYYY-MM-DD"; returns undefined when the value is not a reliable date. */
function isoFromItalianDate(value: string | undefined) {
  const match = value?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : undefined;
}

export function GET() {
  const today = new Date().toISOString().slice(0, 10);
  const lastmodByPath = new Map<string, string | undefined>();
  const add = (path: string, lastmod?: string) => { if (!lastmodByPath.has(path) || lastmod) lastmodByPath.set(path, lastmod); };
  staticPaths.forEach((path) => add(path));
  catalogArtworks.forEach((item) => add(`/arte/${item.slug}`));
  codexEntries.forEach((item) => add(`/enciclopedia/${item.slug}`, isoFromItalianDate(item.editorial.lastReviewed)));
  gameProjects.forEach((item) => add(`/giochi/${item.slug}`));
  creativeJournalEntries.forEach((item) => add(`/dove-nascono-i-mondi/${item.id}`));
  gameJournalEntries.forEach((item) => add(`/dove-nascono-i-mondi/giochi/${item.id}`));
  shopProductDetails.forEach((item) => add(`/shop/catalogo/${item.slug}`));
  commissionWorks.forEach((item) => add(`/commissioni/${item.slug}`));
  new Set(getPublicationCalendarEntries().map((entry) => entry.date).filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)))
    .forEach((date) => add(`/cronache-del-nexus/giorno/${date}`, date <= today ? date : undefined));
  const urls = [...lastmodByPath].map(([path, lastmod]) => `<url><loc>${escapeXml(`${siteOrigin}${path}`)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
