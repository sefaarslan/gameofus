import type { RelationshipType } from "@/lib/relationship";

/**
 * GEÇİCİ: Sahne bölümlerinin kataloğu. Bölüm içeriği (sahneler) ve `chapters` tablosu/API'si hazır olana kadar yalnızca
 * oda oluşturma sayfasında "Yakında" kartı göstermek için kullanılır; API gelince bu liste sunucudan çekilir ve dosya kalkar.
 */
/**
 * Sahne modu seçilebilir mi? Backend (bölüm içeriği, `chapters`/`scene_answers`, oda kurma) hazır olana kadar false:
 * oda oluşturma sayfasında kart "Yakında" ve pasif görünür. Hazır olunca true yapılır (bölüm seçimi/kodu hazır bekliyor).
 */
export const SCENE_MODE_ENABLED = false;

export interface SceneChapterPreview {
  id: string;
  relationshipTypes: RelationshipType[];
  sceneCount: number;
  /** false = içerik hazır değil, seçilemez */
  available: boolean;
}

export const SCENE_CHAPTER_PREVIEWS: SceneChapterPreview[] = [
  { id: "first_date", relationshipTypes: ["dating", "partner"], sceneCount: 5, available: false },
];
