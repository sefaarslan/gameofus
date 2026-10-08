"use client";

import { useTranslations } from "next-intl";
import type { RelationshipType } from "@/lib/relationship";
import { SCENE_CHAPTER_PREVIEWS } from "@/lib/scene-chapters";
import { StickFigureIcon } from "@/components/create/StickFigureIcon";

/** Sahne modunda kategori/soru sayısı yerine gösterilen bölüm seçimi. İçerik hazır olana kadar kartlar "Yakında" ve pasiftir. */
export function ChapterPicker({
  relationshipType,
  selectedId,
  onSelect,
}: {
  relationshipType: RelationshipType | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations("create.mode.scene");
  const chapters = SCENE_CHAPTER_PREVIEWS.filter(
    (c) => !relationshipType || c.relationshipTypes.includes(relationshipType),
  );

  return (
    <div className="flex flex-col gap-3">
      <div>
        <span className="text-label-md text-on-surface-variant">{t("chapterLabel")}</span>
        <p className="text-xs text-on-surface-variant/70 mt-0.5">{t("chapterHint")}</p>
      </div>

      {chapters.length === 0 ? (
        <p className="rounded-[20px] border-2 border-dashed border-outline-variant/40 px-4 py-5 text-center text-body-md text-on-surface-variant">
          {t("emptyForBond")}
        </p>
      ) : (
        <div className="flex flex-col gap-3" role="radiogroup" aria-label={t("chapterLabel")}>
          {chapters.map((chapter) => {
            const selected = selectedId === chapter.id;
            return (
              <button
                key={chapter.id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={!chapter.available}
                onClick={() => onSelect(chapter.id)}
                className={`relative flex items-center gap-3 p-4 rounded-[20px] border-2 text-left transition-all ${
                  chapter.available
                    ? selected
                      ? "border-primary bg-primary-container/10 shadow-soft-card"
                      : "border-outline-variant/30 bg-surface-container-lowest hover:border-outline"
                    : "border-outline-variant/30 bg-surface-container-lowest opacity-70 cursor-not-allowed"
                }`}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-surface-container text-on-surface-variant">
                  <StickFigureIcon className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-label-md text-on-surface">{t(`chapters.${chapter.id}.title`)}</span>
                  <span className="block text-xs text-on-surface-variant mt-0.5">{t(`chapters.${chapter.id}.desc`)}</span>
                  <span className="block text-[11px] text-on-surface-variant/70 mt-1">{t("sceneCount", { count: chapter.sceneCount })}</span>
                </div>
                {!chapter.available && (
                  <span className="shrink-0 rounded-full bg-tertiary-container px-2.5 py-1 text-[11px] font-semibold text-on-tertiary-container">
                    {t("soon")}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
