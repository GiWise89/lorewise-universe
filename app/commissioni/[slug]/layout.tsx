import type { Metadata } from "next";
import { BreadcrumbJsonLd, JsonLd, SITE_URL } from "@/components/SeoJsonLd";
import { commissionWorks } from "@/lib/commissionCatalog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const work = commissionWorks.find((item) => item.slug === slug);
  if (!work) return { robots: { index: false, follow: false } };
  return {
    alternates: { canonical: `/commissioni/${work.slug}` },
    twitter: { card: "summary_large_image", title: work.title, description: work.description, images: [work.image] },
  };
}

export default async function CommissionWorkLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const work = commissionWorks.find((item) => item.slug === slug);
  return <>
    {work ? <>
      <BreadcrumbJsonLd items={[
        { name: "LoreWise Universe", path: "/" },
        { name: "Commissioni", path: "/commissioni" },
        { name: work.title, path: `/commissioni/${work.slug}` },
      ]} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "VisualArtwork",
        "@id": `${SITE_URL}/commissioni/${work.slug}#portfolio-work`,
        url: `${SITE_URL}/commissioni/${work.slug}`,
        name: work.title,
        description: work.description,
        image: `${SITE_URL}${work.image}`,
        artMedium: work.technique,
        dateCreated: work.year,
        creator: { "@id": `${SITE_URL}/#organization`, "@type": "Organization", name: "GiWise Studio" },
      }} />
    </> : null}
    {children}
  </>;
}
