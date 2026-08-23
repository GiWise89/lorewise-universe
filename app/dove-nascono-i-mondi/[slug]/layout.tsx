import type { Metadata } from "next";
import { BreadcrumbJsonLd, JsonLd, SITE_URL } from "@/components/SeoJsonLd";
import { getCreativeJournalEntry } from "@/lib/creativeJournal";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = getCreativeJournalEntry(slug);
  if (!entry) return { robots: { index: false, follow: false } };
  const image = entry.image?.src ?? entry.processImages[0]?.src;
  return {
    alternates: { canonical: `/dove-nascono-i-mondi/${entry.id}` },
    openGraph: {
      title: `${entry.title} · Dove nascono i mondi`,
      description: entry.summary,
      type: "article",
      url: `/dove-nascono-i-mondi/${entry.id}`,
      siteName: "LoreWise Universe",
      locale: "it_IT",
      ...(image ? { images: [{ url: image, alt: entry.title }] } : {}),
    },
    twitter: image ? { card: "summary_large_image", title: entry.title, description: entry.summary, images: [image] } : undefined,
  };
}

export default async function CreativeJournalEntryLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const entry = getCreativeJournalEntry(slug);
  const image = entry?.image?.src ?? entry?.processImages[0]?.src;
  return <>
    {entry ? <>
      <BreadcrumbJsonLd items={[
        { name: "LoreWise Universe", path: "/" },
        { name: "Dove nascono i mondi", path: "/dove-nascono-i-mondi" },
        { name: entry.title, path: `/dove-nascono-i-mondi/${entry.id}` },
      ]} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Article",
        "@id": `${SITE_URL}/dove-nascono-i-mondi/${entry.id}#article`,
        mainEntityOfPage: `${SITE_URL}/dove-nascono-i-mondi/${entry.id}`,
        headline: entry.title,
        description: entry.summary,
        ...(image ? { image: `${SITE_URL}${image}` } : {}),
        inLanguage: "it-IT",
        author: { "@id": `${SITE_URL}/#organization`, "@type": "Organization", name: "GiWise Studio" },
        publisher: { "@id": `${SITE_URL}/#organization` },
      }} />
    </> : null}
    {children}
  </>;
}
