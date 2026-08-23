import type { Metadata } from "next";

const description = "Il diario creativo di GiWise Studio: bozze, processi, arte digitale, passioni e videogiochi in costruzione.";

export const metadata: Metadata = {
  alternates: { canonical: "/dove-nascono-i-mondi" },
  openGraph: {
    title: "Dove nascono i mondi",
    description,
    url: "/dove-nascono-i-mondi",
    siteName: "LoreWise Universe",
    locale: "it_IT",
    type: "website",
    images: [{ url: "/brand/icons/dove-nascono-i-mondi-concept-v1.webp", alt: "Dove nascono i mondi, diario creativo GiWise Studio" }],
  },
  twitter: { card: "summary_large_image", title: "Dove nascono i mondi", description, images: ["/brand/icons/dove-nascono-i-mondi-concept-v1.webp"] },
};

export default function CreativeJournalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
