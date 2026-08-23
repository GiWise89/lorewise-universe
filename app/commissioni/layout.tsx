import type { Metadata } from "next";

const description = "Commissioni artistiche GiWise Studio: ritratti, coppie, animali, trasformazioni fantasy e opere narrative su richiesta.";

export const metadata: Metadata = {
  alternates: { canonical: "/commissioni" },
  openGraph: {
    title: "Commissioni artistiche · GiWise Studio",
    description,
    url: "/commissioni",
    siteName: "LoreWise Universe",
    locale: "it_IT",
    type: "website",
    images: [{ url: "/brand/icons/commissioni-concept-v1.webp", alt: "Commissioni artistiche GiWise Studio" }],
  },
  twitter: { card: "summary_large_image", title: "Commissioni artistiche · GiWise Studio", description, images: ["/brand/icons/commissioni-concept-v1.webp"] },
};

export default function CommissionsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
