import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
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
