import type { Metadata } from "next";
import { BreadcrumbJsonLd, JsonLd, SITE_URL } from "@/components/SeoJsonLd";
import { catalogArtworks } from "@/lib/artCatalog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const artwork = catalogArtworks.find((item) => item.slug === slug);
  if (!artwork) return { robots: { index: false, follow: false } };
  return { alternates: { canonical: `/arte/${artwork.slug}` } };
}

export default async function ArtworkLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const artwork = catalogArtworks.find((item) => item.slug === slug);
  if (!artwork) return children;

  const title = artwork.title ?? artwork.code;
  const description = artwork.description ?? `${artwork.kindLabel} dell’archivio GiWise Studio.`;

  return <>
    <BreadcrumbJsonLd items={[
      { name: "LoreWise Universe", path: "/" },
      { name: "Arte", path: "/arte" },
      { name: title, path: `/arte/${artwork.slug}` },
    ]} />
    <JsonLd data={{
      "@context": "https://schema.org",
      "@type": "VisualArtwork",
      "@id": `${SITE_URL}/arte/${artwork.slug}#artwork`,
      url: `${SITE_URL}/arte/${artwork.slug}`,
      name: title,
      description,
      image: `${SITE_URL}${artwork.image}`,
      artform: "Digital Art",
      ...(artwork.technique ? { artMedium: artwork.technique } : {}),
      ...(artwork.year ? { dateCreated: artwork.year } : {}),
      creator: { "@id": `${SITE_URL}/#organization`, "@type": "Organization", name: "GiWise Studio" },
    }} />
    {children}
  </>;
}
