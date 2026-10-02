import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getMessages, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const OG_LOCALES: Record<string, string> = { tr: "tr_TR", en: "en_US", es: "es_ES" };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "meta" });
  const description = t("description");
  return {
    description,
    openGraph: {
      title: "Game of Us",
      description,
      siteName: "Game of Us",
      type: "website",
      url: `/${locale}`,
      locale: OG_LOCALES[locale],
    },
    twitter: { card: "summary_large_image", title: "Game of Us", description },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader locale={locale} />

        <div className="flex-1">
          {children}
        </div>
      </div>
    </NextIntlClientProvider>
  );
}
