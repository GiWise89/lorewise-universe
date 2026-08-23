import type { Metadata } from "next";
import { ShopBridge } from "@/components/shop/ShopBridge";

const description = "GiWise Shop su LoreWise: merch, accessori, setup, collezioni artistiche e prodotti personalizzati con schede verificate.";

export const metadata: Metadata = {
  alternates: { canonical: "/shop" },
  openGraph: {
    title: "GiWise Shop · LoreWise Universe",
    description,
    url: "/shop",
    siteName: "LoreWise Universe",
    locale: "it_IT",
    type: "website",
    images: [{ url: "/brand/icons/shop-concept-v1.webp", alt: "GiWise Shop" }],
  },
  twitter: { card: "summary_large_image", title: "GiWise Shop · LoreWise Universe", description, images: ["/brand/icons/shop-concept-v1.webp"] },
};

export default function ShopLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <ShopBridge />
      {children}
    </>
  );
}
