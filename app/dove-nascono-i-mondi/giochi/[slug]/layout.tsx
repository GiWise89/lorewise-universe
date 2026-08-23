import type { Metadata } from "next";
import { BreadcrumbJsonLd, JsonLd, SITE_URL } from "@/components/SeoJsonLd";
import { getGameJournalEntry } from "@/lib/creativeJournal";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const game = getGameJournalEntry(slug);
  if (!game) return { robots: { index: false, follow: false } };
  const image = game.gallery[0]?.src;
  return {
    alternates: { canonical: `/dove-nascono-i-mondi/giochi/${game.id}` },
    openGraph: {
      title: `${game.title} · Diario di sviluppo`,
      description: game.summary,
      type: "article",
      url: `/dove-nascono-i-mondi/giochi/${game.id}`,
      siteName: "LoreWise Universe",
      locale: "it_IT",
      ...(image ? { images: [{ url: image, alt: game.gallery[0]?.alt ?? game.title }] } : {}),
    },
    twitter: image ? { card: "summary_large_image", title: game.title, description: game.summary, images: [image] } : undefined,
  };
}

export default async function GameJournalLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const game = getGameJournalEntry(slug);
  const image = game?.gallery[0]?.src;
  return <>
    {game ? <>
      <BreadcrumbJsonLd items={[
        { name: "LoreWise Universe", path: "/" },
        { name: "Dove nascono i mondi", path: "/dove-nascono-i-mondi" },
        { name: "Diari di sviluppo", path: "/dove-nascono-i-mondi" },
        { name: game.title, path: `/dove-nascono-i-mondi/giochi/${game.id}` },
      ]} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Article",
        "@id": `${SITE_URL}/dove-nascono-i-mondi/giochi/${game.id}#article`,
        mainEntityOfPage: `${SITE_URL}/dove-nascono-i-mondi/giochi/${game.id}`,
        headline: `${game.title} · Diario di sviluppo`,
        description: game.summary,
        ...(image ? { image: `${SITE_URL}${image}` } : {}),
        inLanguage: "it-IT",
        author: { "@id": `${SITE_URL}/#organization`, "@type": "Organization", name: "GiWise Studio" },
        publisher: { "@id": `${SITE_URL}/#organization` },
      }} />
    </> : null}
    {children}
  </>;
}
