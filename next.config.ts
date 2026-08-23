import type { NextConfig } from "next";

const noIndexHeaders = [
  "/cerca",
  "/account/:path*",
  "/profilo/:path*",
  "/notifiche/:path*",
  "/auth/:path*",
  "/admin/:path*",
  "/gestione-:path*",
  "/commissioni/stato",
].map((source) => ({
  source,
  headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
}));

const nextConfig: NextConfig = {
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
};

export default nextConfig;
