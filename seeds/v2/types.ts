export type Lang = "tr" | "en" | "es";
export type RelationshipType = "friend" | "dating" | "partner";
export type QuestionMode = "secret_choice" | "prediction" | "orderline";

/** Bir sorunun tek bir dildeki hali. prediction/orderline için options zorunlu (4 adet). */
export interface L10n {
  text: string;
  options?: string[];
}

export interface SeedQuestion {
  mode: QuestionMode;
  /** AI yorumu için tema etiketi (kullanıcıya görünmez), ör. "planning_style" */
  tag: string;
  tr: L10n;
  en: L10n;
  es: L10n;
}

export interface SeedCategory {
  slug: string;
  names: Record<Lang, string>;
  relationshipTypes: RelationshipType[];
  isPremium: boolean;
  sortOrder: number;
  questions: SeedQuestion[];
}
