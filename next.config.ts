import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Le consegne Arte sono ZIP privati, verificati dall'API e limitati a 50 MB.
      // Il margine aggiuntivo copre i metadati multipart del modulo.
      bodySizeLimit: "52mb",
    },
  },
};

export default nextConfig;
