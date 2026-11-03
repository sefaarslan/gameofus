import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Self-host (Docker) derlemesi için BUILD_STANDALONE=1; Vercel'de ayarlanmaz, davranış değişmez.
  ...(process.env.BUILD_STANDALONE === "1" ? { output: "standalone" as const } : {}),
  // Kart rotası yazı tiplerini diskten okur: sunucusuz pakete dahil et
  outputFileTracingIncludes: { "/api/solo/red-flag/card": ["./public/fonts/*.ttf"] },
  // Yerel (native) ikili içeren paketler paketlenmez, Node'dan doğrudan yüklenir
  serverExternalPackages: ["@resvg/resvg-js", "satori"],
  turbopack: {
    root: __dirname,
  },
};

export default withNextIntl(nextConfig);
