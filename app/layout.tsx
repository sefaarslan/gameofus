import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
// Material Symbols alt kümesi, CSS içine gömülü — `npm run icons` ile üretilir (scripts/build-icon-font.mjs).
import "./fonts/material-symbols.css";

// Paylaşım önizlemeleri (WhatsApp vb.) mutlak URL ister. VERCEL_URL her deployment'a özel
// *.vercel.app adresidir; kalıcı alan adımızı kullanıyoruz.
// `||`: Docker derlemesi değişkeni boş metin olarak tanımlayabilir (build arg verilmediğinde); `??` boş metni geçerli sayıp `new URL("")` ile çöker.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gameofus.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Game of Us",
  description: "How well do you really know each other?",
};

const quicksand = Quicksand({
  variable: "--font-quicksand",
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body className={`${quicksand.variable} font-sans antialiased bg-background text-on-surface`}>
        {children}
      </body>
    </html>
  );
}
