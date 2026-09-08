import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Avatares sempre vêm do Firebase Storage; fotos de produto usam URLs externas arbitrárias
    // (por isso continuam com `unoptimized` em vez de remotePatterns).
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    ],
  },
};

export default nextConfig;
