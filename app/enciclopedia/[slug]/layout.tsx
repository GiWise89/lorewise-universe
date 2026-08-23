import type { Metadata } from "next";
import { BreadcrumbJsonLd, JsonLd, SITE_URL } from "@/components/SeoJsonLd";
import { codexCanonicalSlug, codexEntryBySlug } from "@/lib/codex";

function excerpt(value: string, max = 180) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  const cut = normalized.slice(0, max + 1).lastIndexOf(" ");
  return `${normalized.slice(0, cut > 100 ? cut : max).trim()}…`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const canonicalSlug = codexCanonicalSlug(slug);
  const entry = codexEntryBySlug(canonicalSlug);
  if (!entry) return { robots: { index: false, follow: false } };

  const description = excerpt(entry.summary.value);
  const canonicalPath = `/enciclopedia/${entry.slug}`;
  const title = `${entry.displayTitle} · ${entry.catalog.universe} · LoreWise Codex`;
  const image = entry.image.src;

  return {
    description,
    keywords: entry.searchTerms,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonicalPath,
      siteName: "LoreWise Universe",
      locale: "it_IT",
      images: [{ url: image, alt: entry.image.alt }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function CodexEntryLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const canonicalSlug = codexCanonicalSlug(slug);
  const entry = codexEntryBySlug(canonicalSlug);

  return <>
    {entry ? <>
      <BreadcrumbJsonLd items={[
        { name: "LoreWise Universe", path: "/" },
        { name: "LoreWise Codex", path: "/enciclopedia" },
        { name: entry.displayTitle, path: `/enciclopedia/${entry.slug}` },
      ]} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Article",
        "@id": `${SITE_URL}/enciclopedia/${entry.slug}#dossier`,
        mainEntityOfPage: `${SITE_URL}/enciclopedia/${entry.slug}`,
        headline: entry.displayTitle,
        description: excerpt(entry.summary.value, 240),
        image: `${SITE_URL}${entry.image.src}`,
        inLanguage: "it-IT",
        author: { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "GiWise Studio" },
        publisher: { "@id": `${SITE_URL}/#organization` },
        about: {
          "@type": "Thing",
          name: entry.displayTitle,
          isPartOf: { "@type": "CreativeWork", name: entry.catalog.universe },
        },
      }} />
    </> : null}
    {children}
  </>;
}
