import type { Metadata } from "next";
import { BreadcrumbJsonLd, JsonLd, SITE_URL } from "@/components/SeoJsonLd";
import { getShopProductDetail } from "@/lib/shop-product-details";

function numericPrice(value: string) {
  const match = value.replace(/\s/g, "").match(/(\d+(?:[.,]\d+)?)/);
  return match ? match[1].replace(",", ".") : undefined;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = getShopProductDetail(id);
  if (!product) return { robots: { index: false, follow: false } };
  const image = product.images[0]?.src;
  return {
    alternates: { canonical: `/shop/catalogo/${product.slug}` },
    openGraph: {
      title: `${product.name} · GiWise Shop`,
      description: product.introduction,
      type: "website",
      url: `/shop/catalogo/${product.slug}`,
      siteName: "LoreWise Universe",
      locale: "it_IT",
      ...(image ? { images: [{ url: image, alt: product.images[0]?.alt ?? product.name }] } : {}),
    },
    twitter: image ? { card: "summary_large_image", title: product.name, description: product.introduction, images: [image] } : undefined,
  };
}

export default async function ShopProductLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const product = getShopProductDetail(id);
  const price = product ? numericPrice(product.price) : undefined;
  return <>
    {product ? <>
      <BreadcrumbJsonLd items={[
        { name: "LoreWise Universe", path: "/" },
        { name: "GiWise Shop", path: "/shop" },
        { name: "Catalogo", path: "/shop/catalogo" },
        { name: product.name, path: `/shop/catalogo/${product.slug}` },
      ]} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Product",
        "@id": `${SITE_URL}/shop/catalogo/${product.slug}#product`,
        url: `${SITE_URL}/shop/catalogo/${product.slug}`,
        name: product.name,
        description: product.description,
        image: product.images.map((image) => `${SITE_URL}${image.src}`),
        sku: product.id,
        category: product.category,
        brand: { "@type": "Brand", name: "GiWise" },
        ...(price ? { offers: {
          "@type": "Offer",
          price,
          priceCurrency: "EUR",
          url: product.externalHref,
        } } : {}),
      }} />
    </> : null}
    {children}
  </>;
}
