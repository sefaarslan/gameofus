// Solo oyunlar için AI analizi: "oyun adaptörü" sözleşmesi. Yeni bir solo oyun eklemek = yalnızca bir adaptör yazıp registry.ts'e
// eklemek; endpoint, tablo, coin/iade akışı, rıza, hata kodları ve mobil bileşenler DEĞİŞMEZ.

import type { createAdminClient } from "@/lib/supabase/server";
import type { Locale } from "../digest.ts";

/** Bölüm türleri (mobil bunlara göre genel bir bileşenle çizer; bilinmeyen kind'i yok sayar). */
export type SectionKind = "text" | "bullets" | "questions";

export interface SectionSpec {
  /** Oyun başına sabit sözlük (mobil bazı id'lere özel ikon/renk verebilir; zorunlu değil) */
  id: string;
  kind: SectionKind;
  /** `bullets`/`questions` için eleman sayısı sınırları (JSON şemasında + Zod'da zorlanır). min 0 = bölüm boş olabilir (envelope'a girmez). */
  min: number;
  max: number;
  /** Bölüm başlığı: sunucuda oturumun diline göre verilir, model yazmaz, mobil yazı eklemez */
  titles: Record<Locale, string>;
  /** Modele İngilizce talimat: bu bölüme ne yazılacak */
  instruction: string;
}

/** `solo_sessions` satırının AI için gereken alanları */
export interface SoloSessionRow {
  id: string;
  game: string;
  locale: string;
  pack_key: string | null;
  status: string;
  user_id: string | null;
  scenario_ids: string[];
  answers: unknown;
}

/** Modelin ürettiği düz çıktı: { headline, summary, <bölüm id>: string[] | string } */
export type ModelOutput = Record<string, unknown> & { headline: string; summary: string };

export interface SoloAdapter<Input = unknown, Digest = unknown> {
  gameType: string;
  sections: SectionSpec[];
  /** Analiz satın alınabilir mi (tamamlandı mı, cevaplar geçerli mi…) */
  isEligible(session: SoloSessionRow): boolean;
  /** Adaptörün ihtiyaç duyduğu ham girdiyi DB'den yükler (senaryo metinleri vb.); yoksa null */
  loadInput(session: SoloSessionRow, db: ReturnType<typeof createAdminClient>): Promise<Input | null>;
  /** SAF fonksiyon: ham girdiden modele gidecek digest. Kişisel veri (ad, cinsiyet, doğum tarihi, e-posta, kimlik) İÇERMEZ. */
  buildDigest(session: SoloSessionRow, input: Input): Digest | null;
  /** Modele giden JSON yükü */
  payload(digest: Digest): unknown;
  /** Oyuna özel yönergeler (İngilizce); ton oyunun kendi sonuç dağılımına bağlıdır */
  promptNotes(digest: Digest): string;
  /** Tırnak içinde BİREBİR alıntılanabilecek metinler (ör. senaryo metinleri) */
  quotable(digest: Digest): string[];
  /** Modelin çıktısını oyun verisiyle tutarlı hâle getirir (ör. kırmızı kart yoksa "red_lines" boşaltılır) */
  normalize?(output: ModelOutput, digest: Digest): ModelOutput;
}

/** Mobile giden / saklanan içerik zarfı: oyundan bağımsız */
export interface SoloEnvelopeSection {
  id: string;
  kind: SectionKind;
  title: string;
  /** kind = "text" */
  text?: string;
  /** kind = "bullets" | "questions" */
  items?: string[];
}

export interface SoloEnvelope {
  gameType: string;
  headline: string;
  summary: string;
  sections: SoloEnvelopeSection[];
}
