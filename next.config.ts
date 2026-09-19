import type { NextConfig } from "next";

const noIndexHeaders = [
  "/cerca",
  "/account/:path*",
  "/profilo/:path*",
  "/notifiche/:path*",
  "/auth/:path*",
  "/admin/:path*",
  "/gestione-:section/:path*",
  "/commissioni/stato",
].map((source) => ({
  source,
  headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
}));

const nextConfig: NextConfig = {
  // La prova di fumo (scripts/smoke-next.mjs) compila in una cartella separata.
  distDir: process.env.LOREWISE_NEXT_DIST_DIR || ".next",
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.1.7"],
  experimental: {
    serverActions: {
      // Le consegne Arte sono ZIP privati, verificati dall'API e limitati a 50 MB.
      // Il margine aggiuntivo copre i metadati multipart del modulo.
      bodySizeLimit: "52mb",
    },
  },
  async headers() {
    return noIndexHeaders;
  },
  // /vip è stato unificato in /abbonamento: un vero 308 anche per le pagine prerenderizzate,
  // che altrimenti risponderebbero 200 con un reindirizzamento nel contenuto.
  async redirects() {
    return [{ source: "/vip", destination: "/abbonamento", permanent: true }];
  },
};

export default nextConfig;
