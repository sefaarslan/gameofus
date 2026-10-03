import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RedFlagGame } from "@/components/solo/RedFlagGame";
import { RED_FLAG_CARD_COUNT, computeProfile, decodeGrid, getPack } from "@/lib/solo";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ s?: string; p?: string }>;
};

/**
 * Paylaşılan karne linki (`?s=GYRGGYRYG&p=friend-101`): link önizlemesi (WhatsApp/sosyal) gönderenin karnesini gösterir.
 * Sayfa kendisi her ziyaretçi için aynı oyundur; kod yalnızca önizleme içindir (kişisel veri yok).
 */
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  const { s, p } = await searchParams;
  const t = await getTranslations({ locale, namespace: "solo" });
  const title = `${t("gameName")} · Game of Us`;

  const flags = decodeGrid(s);
  if (!flags) return { title, description: t("tagline"), openGraph: { title, description: t("tagline") } };

  const { counts } = computeProfile(flags);
  const name = t(`verdicts.${Math.min(counts.red, RED_FLAG_CARD_COUNT)}.title`);
  const pack = getPack(p);
  const image = `/api/solo/red-flag/card?g=${s}&l=${locale}${pack ? `&p=${pack.key}` : ""}&fmt=og`;
  const description = t("share.text", { title: name });
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
