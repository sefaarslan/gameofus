// Oyundan bağımsız içerik zarfı: bölüm şemalarından Zod + JSON şeması üretir, modelin düz çıktısını zarfa çevirir.
//
// Modelin ürettiği düz çıktı: { headline, summary, <bölüm id'si>: string[] | string }. Başlıklar (title) ve bölüm sırası/türü
// ADAPTÖRDEN gelir (sunucuda yerelleştirilir); model yalnızca içeriği yazar. Boş bölümler zarfa girmez.

import { z } from "zod";
import type { Locale } from "../digest.ts";
import type { ModelOutput, SectionSpec, SoloAdapter, SoloEnvelope, SoloEnvelopeSection } from "./types.ts";

const text = (max: number) => z.string().trim().min(1).max(max);

/** Bölümden Zod doğrulayıcısı. Eleman sayısı üst sınırı (`max`) ve alt sınırı (`min`) burada zorlanır. */
function sectionSchema(s: SectionSpec) {
  if (s.kind === "text") return text(700);
  return z.array(text(s.kind === "questions" ? 220 : 300)).min(s.min).max(s.max);
}

export function outputSchema(sections: SectionSpec[]) {
  const shape: Record<string, z.ZodTypeAny> = { headline: text(140), summary: text(900) };
  for (const s of sections) shape[s.id] = sectionSchema(s);
  return z.object(shape).strict();
}

/** Sağlayıcıya verilen JSON şeması (strict mod: tüm alanlar zorunlu, ek alan yok). Eleman sayısı sınırları Zod'dadır. */
export function outputJsonSchema(sections: SectionSpec[]) {
  const properties: Record<string, unknown> = { headline: { type: "string" }, summary: { type: "string" } };
  for (const s of sections) properties[s.id] = s.kind === "text" ? { type: "string" } : { type: "array", items: { type: "string" } };
  return {
    name: "solo_analysis",
    schema: { type: "object", properties, required: ["headline", "summary", ...sections.map((s) => s.id)], additionalProperties: false },
  };
}

/** Modelin düz çıktısındaki TÜM metinler (kalite denetimi için) */
export function allTexts(out: ModelOutput, sections: SectionSpec[]): string[] {
  const t = [out.headline, out.summary];
  for (const s of sections) {
    const v = out[s.id];
    if (typeof v === "string") t.push(v);
    else if (Array.isArray(v)) t.push(...(v as string[]));
  }
  return t;
}

/** Düz çıktı → mobil sözleşmesi olan zarf. Başlıklar oturum dilinde ADAPTÖRDEN gelir; boş bölümler atılır. */
export function assembleEnvelope(adapter: Pick<SoloAdapter, "gameType" | "sections">, locale: Locale, out: ModelOutput): SoloEnvelope {
  const sections: SoloEnvelopeSection[] = [];
  for (const s of adapter.sections) {
    const v = out[s.id];
    const title = s.titles[locale] ?? s.titles.en;
    if (s.kind === "text") {
      if (typeof v === "string" && v.trim()) sections.push({ id: s.id, kind: s.kind, title, text: v.trim() });
    } else if (Array.isArray(v) && v.length > 0) {
      sections.push({ id: s.id, kind: s.kind, title, items: (v as string[]).map((x) => x.trim()) });
    }
  }
  return { gameType: adapter.gameType, headline: out.headline.trim(), summary: out.summary.trim(), sections };
}

/** Bu adaptör için test sağlayıcısının döndüreceği GEÇERLİ örnek çıktı (ağ/model olmadan test için) */
export function fakeValidOutput(sections: SectionSpec[]): ModelOutput {
  const out: ModelOutput = { headline: "Kendi çizgini çizen biri.", summary: "Kartlardaki tercihlerin net bir profil çiziyor." };
  for (const s of sections) {
    if (s.kind === "text") out[s.id] = "Kısa bir paragraf.";
    else out[s.id] = Array.from({ length: Math.max(1, s.min, Math.min(2, s.max)) }, (_, i) => `${s.id} maddesi ${["bir", "iki", "üç", "dört"][i]}.`);
  }
  return out;
}
