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
  // Kılavuz dosyaları (public/guides/*.json): herkese açık statik içerik; kısa önbellek, yayınlanan değişiklik dakikalar içinde yansır.
  async headers() {
    return [
      {
        source: "/guides/:file*.json",
        headers: [{ key: "Cache-Control", value: "public, max-age=300, s-maxage=300, stale-while-revalidate=86400" }],
      },
      // Kapak görselleri (img/<kılavuz id>.jpg): dosya adı sabit olduğu için kısa önbellek (değiştirilen görsel saatler içinde yansır)
      {
        source: "/guides/img/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400" }],
      },
    ];
  },
  turbopack: {
    root: __dirname,
  },
};

export default withNextIntl(nextConfig);
