/** Yasal sayfaların (gizlilik, kullanım koşulları) içerik yapısı. Metinde `**kalın**` ve e-posta adresi desteklenir. */
export type LegalBlock = string | { list: string[] } | { table: { head: [string, string]; rows: [string, string][] } };

export interface LegalSection {
  /** Bağlantı hedefi (ör. `account-deletion`): üç dilde aynı kalır */
  id?: string;
  title: string;
  blocks: LegalBlock[];
}

export interface LegalDoc {
  title: string;
  /** "Son güncelleme: …" satırı */
  updated: string;
  intro: LegalBlock[];
  sections: LegalSection[];
}

export type LegalLocale = "tr" | "en" | "es";
