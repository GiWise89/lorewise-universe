import type { Metadata, Viewport } from "next";
import { Cinzel_Decorative, Fraunces, Manrope } from "next/font/google";
import { headers } from "next/headers";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const display = Fraunces({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700"] });
const body = Manrope({ variable: "--font-body", subsets: ["latin"] });
const loreDisplay = Cinzel_Decorative({ variable: "--font-lore-display", subsets: ["latin"], weight: ["400", "700", "900"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b1026",
};

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3001";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = new URL(`${protocol}://${host}`);
  const title = "LoreWise Universe | Arte, giochi e mondi da esplorare";
  const description = "L’universo creativo di GiWise Studio: arte originale, commissioni, giochi, enciclopedia e GiWise Shop.";
  return {
    metadataBase: baseUrl,
    title: { default: title, template: "%s | LoreWise Universe" },
    description,
    applicationName: "LoreWise Universe",
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [{ url: "/brand/admin-control-favicon-v1.webp", type: "image/webp", sizes: "1254x1254" }],
      shortcut: "/brand/admin-control-favicon-v1.webp",
      apple: "/brand/admin-control-favicon-v1.webp",
    },
    robots: { index: true, follow: true },
    openGraph: { title, description, type: "website", images: [{ url: new URL("/og.webp", baseUrl).toString(), width: 1736, height: 909, alt: "LoreWise Universe, l’universo creativo di GiWise Studio" }] },
    twitter: { card: "summary_large_image", title, description, images: [new URL("/og.webp", baseUrl).toString()] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body className={`${display.variable} ${body.variable} ${loreDisplay.variable}`}>
        <a className="skip-link" href="#contenuto">Vai al contenuto</a>
        <SiteHeader />
        <div id="contenuto">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
