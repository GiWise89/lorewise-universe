import type { Metadata, Viewport } from "next";
import { Cinzel_Decorative, Fraunces, Manrope } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteAnalyticsTracker } from "@/components/SiteAnalyticsTracker";
import { ProfileCompletionGate } from "@/components/ProfileCompletionGate";
import { SiteJsonLd } from "@/components/SeoJsonLd";
import "./site.css";

const display = Fraunces({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700"] });
const body = Manrope({ variable: "--font-body", subsets: ["latin"] });
const loreDisplay = Cinzel_Decorative({ variable: "--font-lore-display", subsets: ["latin"], weight: ["400", "700", "900"] });

const siteUrl = new URL("https://lorewisenexus.it");
const title = "LoreWise Universe | Codex, giochi, arte e mondi da esplorare";
const description = "LoreWise Universe di GiWise Studio: esplora il LoreWise Codex, giochi indie, arte originale e il dietro le quinte dei mondi creativi.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b1026",
};

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: title, template: "%s | LoreWise Universe" },
  description,
  applicationName: "LoreWise Universe",
  creator: "GiWise Studio",
  publisher: "GiWise Studio",
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/brand/admin-control-favicon-v1.webp", type: "image/webp", sizes: "1254x1254" }],
    shortcut: "/brand/admin-control-favicon-v1.webp",
    apple: "/brand/admin-control-favicon-v1.webp",
  },
  robots: { index: true, follow: true },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/",
    siteName: "LoreWise Universe",
    locale: "it_IT",
    images: [{ url: "/og.webp", width: 1736, height: 909, alt: "LoreWise Universe, l’universo creativo di GiWise Studio" }],
  },
  twitter: { card: "summary_large_image", title, description, images: ["/og.webp"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body className={`${display.variable} ${body.variable} ${loreDisplay.variable}`}>
        <SiteJsonLd />
        <a className="skip-link" href="#contenuto">Vai al contenuto</a>
        <SiteAnalyticsTracker />
        <ProfileCompletionGate />
        <SiteHeader />
        <div id="contenuto">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
