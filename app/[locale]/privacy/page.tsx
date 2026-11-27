import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { privacyDocs } from "@/content/legal/privacy";
import type { LegalLocale } from "@/content/legal/types";

type Props = { params: Promise<{ locale: string }> };

const docFor = (locale: string) => privacyDocs[locale as LegalLocale] ?? privacyDocs.en;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { title: `${docFor(locale).title} · Game of Us` };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  return <LegalPage doc={docFor(locale)} locale={locale} />;
}
