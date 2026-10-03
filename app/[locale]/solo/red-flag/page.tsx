import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RedFlagGame } from "@/components/solo/RedFlagGame";
import { computeProfile, decodeGrid } from "@/lib/solo";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ s?: string }>;
};

/**
 * Paylaşılan karne linki (`?s=GYRGGYRYG`): link önizlemesi (WhatsApp/sosyal) gönderenin karnesini gösterir.
 * Sayfa kendisi her ziyaretçi için aynı oyundur; kod yalnızca önizleme içindir (kişisel veri yok).
 */
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  const { s } = await searchParams;
  const t = await getTranslations({ locale, namespace: "solo" });
  const title = `${t("gameName")} · Game of Us`;

  const flags = decodeGrid(s);
  if (!flags) return { title, description: t("tagline"), openGraph: { title, description: t("tagline") } };

  const { archetype } = computeProfile(flags);
  const name = t(`archetypes.${archetype}.name`);
  const image = `/api/solo/red-flag/card?g=${s}&l=${locale}&fmt=og`;
  const description = t("share.text", { archetype: name });
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: image, width: 1200, height: 630, alt: name }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default function RedFlagPage() {
  return <RedFlagGame />;
}
