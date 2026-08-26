import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Black Friday + Cyber Monday 2026",
  description: "Tre percorsi diretti per GiWise Shop, Universe Pass e la collezione digitale Cyber Nexus, dal 23 al 30 novembre 2026.",
  alternates: { canonical: "/black-friday" },
  openGraph: {
    title: "Black Friday + Cyber Monday | LoreWise Universe",
    description: "Scegli il percorso promozionale tra GiWise Shop, Universe Pass e Cyber Nexus.",
    url: "/black-friday",
    images: [{ url: "/promotions/black-friday/campaign-hero-v1.webp", width: 1536, height: 1024, alt: "Tre portali della campagna Black Friday e Cyber Monday LoreWise Universe" }],
  },
};

export default function BlackFridayLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
