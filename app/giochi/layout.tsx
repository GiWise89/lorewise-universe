import type { Metadata } from "next";

const description = "Giochi indie e progetti interattivi di GiWise Studio: card RPG dark fantasy, RPG narrativi, horror e diari di sviluppo.";

export const metadata: Metadata = {
  alternates: { canonical: "/giochi" },
  openGraph: {
    title: "Giochi e app di GiWise Studio",
    description,
    url: "/giochi",
    siteName: "LoreWise Universe",
    locale: "it_IT",
    type: "website",
    images: [{ url: "/brand/icons/giochi-concept-v1.webp", alt: "Giochi e app di GiWise Studio" }],
  },
  twitter: { card: "summary_large_image", title: "Giochi e app di GiWise Studio", description, images: ["/brand/icons/giochi-concept-v1.webp"] },
};

export default function GamesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
