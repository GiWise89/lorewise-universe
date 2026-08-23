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
  return <>
    {artwork ? <>
      <BreadcrumbJsonLd items={[
        { name: "LoreWise Universe", path: "/" },
        { name: "Arte", path: "/arte" },
        { name: artwork.title, path: `/arte/${artwork.slug}` },
      ]} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "VisualArtwork",
        "@id": `${SITE_URL}/arte/${artwork.slug}#artwork`,
        url: `${SITE_URL}/arte/${artwork.slug}`,
        name: artwork.title,
        description: artwork.description,
        image: `${SITE_URL}${artwork.image}`,
        artform: "Digital Art",
        artMedium: artwork.technique,
        dateCreated: artwork.year,
        creator: { "@id": `${SITE_URL}/#organization`, "@type": "Organization", name: "GiWise Studio" },
      }} />
    </> : null}
    {children}
  </>;
}
