import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Game of Us",
  description: "Partnerinizi ne kadar iyi tanıyorsunuz?",
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
