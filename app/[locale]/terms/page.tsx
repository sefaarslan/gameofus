import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { termsDocs } from "@/content/legal/terms";
import type { LegalLocale } from "@/content/legal/types";

type Props = { params: Promise<{ locale: string }> };

const docFor = (locale: string) => termsDocs[locale as LegalLocale] ?? termsDocs.en;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { title: `${docFor(locale).title} · Game of Us` };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  return <LegalPage doc={docFor(locale)} locale={locale} />;
}
