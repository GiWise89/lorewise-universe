const SITE_URL = "https://lorewisenexus.it";

type JsonLdValue = Record<string, unknown> | Array<Record<string, unknown>>;

function serializeJsonLd(value: JsonLdValue) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: { data: JsonLdValue }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}

export function SiteJsonLd() {
  return <JsonLd data={[
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "GiWise Studio",
      url: SITE_URL,
      logo: `${SITE_URL}/brand/admin-control-favicon-v1.webp`,
      brand: { "@type": "Brand", name: "LoreWise Universe" },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "LoreWise Universe",
      alternateName: "LoreWise Nexus",
      inLanguage: "it-IT",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ]} />;
}

export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; path: string }> }) {
  return <JsonLd data={{
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  }} />;
}

export { SITE_URL };
