import type { Metadata } from "next";
import { BreadcrumbJsonLd, JsonLd, SITE_URL } from "@/components/SeoJsonLd";
import { getGameProject } from "@/lib/gameCatalog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getGameProject(slug);
  if (!project) return { robots: { index: false, follow: false } };
  return { alternates: { canonical: `/giochi/${project.slug}` } };
}

export default async function GameLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const project = getGameProject(slug);
  return <>
    {project ? <>
      <BreadcrumbJsonLd items={[
        { name: "LoreWise Universe", path: "/" },
        { name: "Giochi", path: "/giochi" },
        { name: project.title, path: `/giochi/${project.slug}` },
      ]} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "VideoGame",
        "@id": `${SITE_URL}/giochi/${project.slug}#game`,
        url: `${SITE_URL}/giochi/${project.slug}`,
        name: project.title,
        description: project.summary,
        image: `${SITE_URL}${project.coverImage ?? project.heroImage}`,
        gamePlatform: project.platforms,
        inLanguage: project.languages,
        version: project.version,
        genre: project.kind,
        author: { "@id": `${SITE_URL}/#organization`, "@type": "Organization", name: "GiWise Studio" },
        publisher: { "@id": `${SITE_URL}/#organization` },
      }} />
    </> : null}
    {children}
  </>;
}
