import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Paylaşım önizlemeleri (WhatsApp vb.) mutlak URL ister. VERCEL_URL her deployment'a özel
// *.vercel.app adresidir; kalıcı alan adımızı kullanıyoruz.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gameofus.app";

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

// Material Symbols alt kümesi — `npm run icons` ile üretilir (scripts/build-icon-font.mjs).
// display: "block" → font gelene kadar ikon adı (ör. "favorite") ham yazı olarak görünmez.
const materialSymbols = localFont({
  src: "./fonts/material-symbols.woff2",
  variable: "--font-material-symbols",
  display: "block",
  weight: "400",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body className={`${quicksand.variable} ${materialSymbols.variable} font-sans antialiased bg-background text-on-surface`}>
        {children}
      </body>
    </html>
  );
}
