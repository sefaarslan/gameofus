import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Self-host (Docker) derlemesi için BUILD_STANDALONE=1; Vercel'de ayarlanmaz, davranış değişmez.
  ...(process.env.BUILD_STANDALONE === "1" ? { output: "standalone" as const } : {}),
  turbopack: {
    root: __dirname,
  },
};

export default withNextIntl(nextConfig);
