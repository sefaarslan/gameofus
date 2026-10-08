"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { RELATIONSHIP_TYPES, isRelationshipType, relKey, type RelationshipType } from "@/lib/relationship";
import { isGender, type Gender } from "@/lib/gender";
import { GenderPicker } from "@/components/create/GenderPicker";
import { StickFigureIcon } from "@/components/create/StickFigureIcon";
import { ChapterPicker } from "@/components/create/ChapterPicker";
import { SCENE_MODE_ENABLED } from "@/lib/scene-chapters";

type GameMode = "secret_choice" | "prediction" | "orderline" | "mixed" | "scene";

interface Category {
  id: string;
  name: string;
  slug: string;
  is_premium: boolean;
  sort_order: number;
  relationship_types: RelationshipType[];
}

const MODE_ICONS: Record<Exclude<GameMode, "scene">, string> = {
  secret_choice: "visibility_off",
  prediction: "timeline",
  orderline: "format_list_numbered",
  mixed: "shuffle",
};

const RELATIONSHIP_ICONS: Record<RelationshipType, string> = {
  friend: "diversity_3",
  dating: "favorite",
  partner: "all_inclusive",
};

const CATEGORY_ICONS: Record<string, string> = {
  communication: "chat_bubble",
  first_date: "favorite",
  social_life: "groups",
  lifestyle: "spa",
  values: "psychology",
  bold: "local_fire_department",
  friend_test: "mood",
  wild_scenarios: "rocket_launch",
  romance: "volunteer_activism",
  future: "route",
  home_money: "home",
};

/**
 * Sihirbaz taslağı: sayfa yenilenince / başka sayfaya gidip dönünce kaldığın yerden devam etmek için tarayıcı OTURUMUNDA
 * (sessionStorage; sekme kapanınca silinir) tutulur. Oda kurulunca silinir; sunucuya hiçbir şey gitmez.
 */
const DRAFT_KEY = "gou_create_draft";
const GAME_MODES: readonly GameMode[] = ["secret_choice", "prediction", "orderline", "mixed", "scene"];

interface CreateDraft {
  step: 1 | 2;
  displayName: string;
  partnerName: string;
  gender: Gender | null;
  partnerGender: Gender | null;
  relationshipType: RelationshipType | null;
  gameMode: GameMode;
  questionCount: 5 | 10;
  categoryId: string | null;
  chapterId: string | null;
}

function readDraft(): Partial<CreateDraft> | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Record<string, unknown>;
    const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
    const idOrNull = (v: unknown) => (typeof v === "string" && v.length > 0 && v.length <= 64 ? v : null);
    return {
      step: d.step === 2 ? 2 : 1,
      displayName: str(d.displayName, 30),
      partnerName: str(d.partnerName, 30),
      gender: isGender(d.gender) ? d.gender : null,
      partnerGender: isGender(d.partnerGender) ? d.partnerGender : null,
      relationshipType: isRelationshipType(d.relationshipType) ? d.relationshipType : null,
      gameMode: GAME_MODES.includes(d.gameMode as GameMode) && (d.gameMode !== "scene" || SCENE_MODE_ENABLED) ? (d.gameMode as GameMode) : "mixed",
      questionCount: d.questionCount === 10 ? 10 : 5,
      categoryId: idOrNull(d.categoryId),
      chapterId: idOrNull(d.chapterId),
    };
  } catch {
    return null;
  }
}

function getCategoryIcon(slug: string): string {
  return CATEGORY_ICONS[slug] ?? "category";
}

export default function CreatePage() {
  const t = useTranslations("create");
  const tErr = useTranslations("error");
  const router = useRouter();
  const locale = useLocale();

  // İki adımlı sihirbaz: 1 = kimler oynuyor, 2 = ne oynuyoruz. Durum bileşende tutulur, sunucuya yalnızca son adımda gidilir.
  const [step, setStep] = useState<1 | 2>(1);
  const [displayName, setDisplayName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [partnerGender, setPartnerGender] = useState<Gender | null>(null);
  const [relationshipType, setRelationshipType] = useState<RelationshipType | null>(null);
  const rel = relKey(relationshipType);
  const [gameMode, setGameMode] = useState<GameMode>("mixed");
  const [questionCount, setQuestionCount] = useState<5 | 10>(5);
  const [chapterId, setChapterId] = useState<string | null>(null);
  const chapterRef = useRef<HTMLDivElement>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [premiumCategory, setPremiumCategory] = useState<Category | null>(null);

  // Room limit: free users can only create one room per browser
  const [existingRoom, setExistingRoom] = useState<string | null>(null);
  const [showLimit, setShowLimit] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("gou_my_room");
    if (stored) {
      setExistingRoom(stored);
      setShowLimit(true);
    }
  }, []);

  // Kategoriler sayfa açılırken bir kez çekilir; ilişki türüne göre filtreleme tarayıcıda anında yapılır
  // (sunucu yine de oda oluştururken uyumluluğu doğrular)
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/categories?locale=${locale}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setAllCategories(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  // Dropdown: dışarı tıklayınca veya Escape ile kapanır
  useEffect(() => {
    if (!categoryOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (!categoryRef.current?.contains(e.target as Node)) setCategoryOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setCategoryOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [categoryOpen]);

  // Taslağı geri yükle (yalnızca istemcide, mount sonrası; sunucu çıktısıyla uyuşmazlık olmasın diye ilk karede gizli kalır)
  useEffect(() => {
    const d = readDraft();
    if (d) {
      if (d.displayName) setDisplayName(d.displayName);
      if (d.partnerName) setPartnerName(d.partnerName);
      setGender(d.gender ?? null);
      setPartnerGender(d.partnerGender ?? null);
      setRelationshipType(d.relationshipType ?? null);
      if (d.gameMode) setGameMode(d.gameMode);
      if (d.questionCount) setQuestionCount(d.questionCount);
      setSelectedCategoryId(d.categoryId ?? null);
      setChapterId(d.chapterId ?? null);
      // 2. adımda yenilendiyse yine 2. adımdan devam et (gerekli alanlar dolu olmalı)
      if (d.step === 2 && d.displayName?.trim() && d.relationshipType) setStep(2);
    }
    setDraftLoaded(true);
  }, []);

  // Her değişiklikte taslağı güncelle (geri yükleme bitmeden yazma: boş durum taslağı ezmesin)
  useEffect(() => {
    if (!draftLoaded) return;
    try {
      const draft: CreateDraft = {
        step, displayName, partnerName, gender, partnerGender, relationshipType,
        gameMode, questionCount, categoryId: selectedCategoryId, chapterId,
      };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* depolama kapalı/dolu: taslak tutulmaz, sihirbaz yine çalışır */
    }
  }, [draftLoaded, step, displayName, partnerName, gender, partnerGender, relationshipType, gameMode, questionCount, selectedCategoryId, chapterId]);

  // Geri yüklenen kategori artık listede yoksa (kategori seti değişti / dil değişti) seçimi temizle
  useEffect(() => {
    if (categoriesLoading || selectedCategoryId === null) return;
    if (!allCategories.some((c) => c.id === selectedCategoryId)) setSelectedCategoryId(null);
  }, [categoriesLoading, allCategories, selectedCategoryId]);

  // Tarayıcı/telefon geri tuşu 2. adımdan sayfadan çıkarmak yerine 1. adıma döner
  useEffect(() => {
    function onPopState(e: PopStateEvent) {
      setStep(e.state?.createStep === 2 ? 2 : 1);
      window.scrollTo(0, 0);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function goToStep2() {
    window.history.pushState({ createStep: 2 }, "");
    setStep(2);
    window.scrollTo(0, 0);
  }

  function goToStep1() {
    // Geri tuşuyla aynı yolu izle (history girdisini tüket)
    if (window.history.state?.createStep === 2) window.history.back();
    else setStep(1);
  }

  const categories = relationshipType
    ? allCategories.filter((c) => c.relationship_types.includes(relationshipType))
    : allCategories;

  function handleRelationshipChange(value: RelationshipType) {
    setRelationshipType(value);
    setChapterId(null);
    setSelectedCategoryId((prev) => {
      const cat = allCategories.find((c) => c.id === prev);
      return cat && cat.relationship_types.includes(value) ? prev : null;
    });
  }

  function selectScene() {
    setGameMode("scene");
    // Bölüm seçimi mod listesinin altında kalabilir (özellikle mobilde): seçimden sonra yumuşakça görünür yap
    requestAnimationFrame(() => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      chapterRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
    });
  }

  function handleCategoryClick(cat: Category) {
    setCategoryOpen(false);
    if (cat.is_premium) {
      setPremiumCategory(cat);
      return;
    }
    setSelectedCategoryId(cat.id);
  }

  const selectedCategory = allCategories.find((c) => c.id === selectedCategoryId) ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim() || !relationshipType) return;
    if (step === 1) {
      goToStep2();
      return;
    }
    // Sahne bölümleri hazır olana kadar oda kurulamaz (sunucu da bu modu henüz kabul etmez)
    if (gameMode === "scene") return;

    // Double-check limit before submitting
    const stored = localStorage.getItem("gou_my_room");
    if (stored) {
      setExistingRoom(stored);
      setShowLimit(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          partnerName: partnerName.trim() || null,
          relationshipType,
          gameMode,
          questionCount,
          locale,
          categoryId: selectedCategoryId,
          gender,
          partnerGender,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        const code = data.error?.code;
        if (code === "RATE_LIMITED") setError(tErr("rateLimited"));
        else setError(data.error?.message ?? tErr("generic"));
        return;
      }

      const { roomCode, participant } = data;
      localStorage.setItem(`gou_token_${roomCode}`, participant.token);
      // Store the created room to enforce the free tier limit
      localStorage.setItem("gou_my_room", roomCode);
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        /* yoksay */
      }
      router.push(`/game/room/${roomCode}`);
    } catch {
      setError(tErr("generic"));
    } finally {
      setLoading(false);
    }
  }

  const modes: Array<{ value: Exclude<GameMode, "scene"> }> = [
    { value: "secret_choice" },
    { value: "prediction" },
    { value: "orderline" },
    { value: "mixed" },
  ];

  // ── Room limit overlay ─────────────────────────────────────────
  if (showLimit && existingRoom) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-background flex items-center justify-center px-6 py-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-tertiary-container/15 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary-container/15 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="w-full max-w-sm flex flex-col items-center text-center gap-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary icon-fill" style={{ fontSize: "40px" }}>smartphone</span>
          </div>

          <div className="bg-surface-container-lowest rounded-[28px] p-8 shadow-soft-active border border-outline-variant/20 flex flex-col items-center gap-5">
            <h1 className="text-headline-md text-on-background">{t("limitTitle")}</h1>
            <p className="text-body-md text-on-surface-variant leading-relaxed">{t("limitDesc")}</p>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => router.push(`/game/room/${existingRoom}`)}
                className="w-full flex items-center justify-center gap-2 bg-surface-container text-on-surface text-body-md font-semibold py-4 rounded-full hover:bg-surface-container-high active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-xl">arrow_back</span>
                {t("limitGoBack")}
              </button>

              <button
                onClick={() => router.push(`/#premium`)}
                className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary text-body-md font-semibold py-4 rounded-full hover:bg-surface-tint active:scale-95 transition-all shadow-primary-glow"
              >
                <span className="material-symbols-outlined icon-fill text-xl">smartphone</span>
                {t("limitUpgrade")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-[calc(100vh-73px)] bg-background flex">
        {/* ── Desktop side panel ──────────────────────────────────── */}
        <aside className="hidden md:flex flex-col w-[300px] shrink-0 border-r border-outline-variant/30 bg-surface-container-low px-12 py-12">
          <div className="mb-10">
            <h2 className="text-headline-lg text-primary mb-2">{t("sideTitle")}</h2>
            <p className="text-body-md text-on-surface-variant">{t("sideSubtitle")}</p>
          </div>
          <ul className="space-y-3">
            {[t("sideStep1"), t("sideStep2"), t("sideStep3")].map((label, i) => {
              const number = i + 1;
              const active = number === step;
              const done = number < step;
              return (
                <li
                  key={label}
                  aria-current={active ? "step" : undefined}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    active
                      ? "bg-primary-container/15 text-primary font-semibold border-l-4 border-primary"
                      : done
                      ? "text-primary"
                      : "text-on-surface-variant"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm icon-fill">
                    {done ? "check_circle" : active ? "radio_button_checked" : "radio_button_unchecked"}
                  </span>
                  <span className="text-body-md">{label}</span>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* ── Main content ────────────────────────────────────────── */}
        <main className={`flex-1 flex flex-col items-center justify-start px-6 md:px-16 pt-3 pb-10 md:py-10 overflow-y-auto ${draftLoaded ? "" : "invisible"}`}>
          <div className="w-full max-w-lg">
            {/* Progress (mobil + masaüstü) */}
            <div className="mb-5" role="progressbar" aria-valuemin={1} aria-valuemax={2} aria-valuenow={step}>
              <div className="flex items-center justify-between h-9 mb-1">
                {step === 2 ? (
                  <button
                    type="button"
                    onClick={goToStep1}
                    className="-ml-2 flex items-center gap-1 pl-2 pr-3 h-9 rounded-full text-label-md text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-xl">arrow_back</span>
                    {t("step2.back")}
                  </button>
                ) : (
                  <span />
                )}
                <p className="text-label-md text-on-surface-variant">{t("progress", { current: step, total: 2 })}</p>
              </div>
              <div className="flex gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-primary" />
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${step === 2 ? "bg-primary" : "bg-outline-variant/40"}`} />
              </div>
            </div>

            <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-background mb-1.5">
              {step === 1 ? t("step1.title") : t("step2.title")}
            </h1>
            <p className="text-body-md text-on-surface-variant mb-6">
              {step === 1 ? t("step1.subtitle") : t("step2.subtitle", { rel })}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {step === 1 && (
                <>
                  {/* You */}
                  <section className="flex flex-col gap-3 rounded-[20px] border border-outline-variant/30 bg-surface-container-low p-3.5">
                    <h2 className="text-label-md font-semibold text-on-surface">{t("step1.you")}</h2>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="create-name" className="text-xs text-on-surface-variant">{t("name.label")}</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg">person</span>
                        <input
                          id="create-name"
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder={t("name.placeholder")}
                          maxLength={30}
                          required
                          className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border-2 border-outline-variant/40 rounded-full text-body-md text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                    </div>
                    <GenderPicker label={t("gender.label")} value={gender} onChange={setGender} />
                  </section>

                  {/* Partner */}
                  <section className="flex flex-col gap-3 rounded-[20px] border border-outline-variant/30 bg-surface-container-low p-3.5">
                    <h2 className="text-label-md font-semibold text-on-surface">{t("step1.partner", { rel })}</h2>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="create-partner" className="text-xs text-on-surface-variant">
                        {t("partner.label", { rel })}
                        <span className="text-on-surface-variant/50 font-normal ml-1">({t("partner.optional")})</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg">person_add</span>
                        <input
                          id="create-partner"
                          type="text"
                          value={partnerName}
                          onChange={(e) => setPartnerName(e.target.value)}
                          placeholder={t("partner.placeholder", { rel })}
                          maxLength={30}
                          className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border-2 border-outline-variant/40 rounded-full text-body-md text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                    </div>
                    <GenderPicker label={t("gender.label")} value={partnerGender} onChange={setPartnerGender} />
                  </section>

                  <p className="text-xs text-on-surface-variant/70 -mt-2">{t("gender.hint")}</p>

              {/* Relationship type */}
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-label-md text-on-surface-variant">{t("relationship.label")}</label>
                  <p className="text-xs text-on-surface-variant/70 mt-0.5">{t("relationship.hint")}</p>
                </div>
                <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label={t("relationship.label")}>
                  {RELATIONSHIP_TYPES.map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={relationshipType === value}
                      onClick={() => handleRelationshipChange(value)}
                      className={`relative flex flex-col items-center gap-1.5 px-2 py-3 rounded-[20px] border-2 text-center transition-all ${
                        relationshipType === value
                          ? "border-primary bg-primary-container/10 shadow-soft-card"
                          : "border-outline-variant/30 bg-surface-container-lowest hover:border-outline"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        relationshipType === value ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"
                      }`}>
                        <span className="material-symbols-outlined text-lg">{RELATIONSHIP_ICONS[value]}</span>
                      </div>
                      <span className="block text-label-md text-on-surface leading-tight">{t(`relationship.${value}.name`)}</span>
                      <span className="block text-xs text-on-surface-variant leading-tight">{t(`relationship.${value}.desc`)}</span>
                    </button>
                  ))}
                </div>
              </div>

                </>
              )}

              {step === 2 && (
                <>
                  {/* Game mode: Sahne öne çıkan kart + klasik soru oyunları */}
                  <div className="flex flex-col gap-3">
                    <label className="text-label-md text-on-surface-variant">{t("mode.label")}</label>

                    <div className="grid grid-cols-2 gap-3">
                      {modes.map(({ value }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setGameMode(value)}
                          className={`relative flex items-center gap-3 p-4 rounded-[20px] border-2 text-left transition-all ${
                            gameMode === value
                              ? "border-primary bg-primary-container/10 shadow-soft-card"
                              : "border-outline-variant/30 bg-surface-container-lowest hover:border-outline"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                            gameMode === value ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"
                          }`}>
                            <span className="material-symbols-outlined text-lg">{MODE_ICONS[value]}</span>
                          </div>
                          <div>
                            <span className="block text-label-md text-on-surface">{t(`mode.options.${value}`)}</span>
                            <span className="block text-xs text-on-surface-variant mt-0.5">{t(`mode.descs.${value}`)}</span>
                          </div>
                          {gameMode === value && (
                            <span className="absolute top-3 right-3 material-symbols-outlined text-primary text-base icon-fill">check_circle</span>
                          )}
                        </button>
                      ))}
                      {/* Sahne: diğer modlarla aynı kart dili, listenin sonunda tam genişlikte; backend hazır olana kadar pasif ("Yakında") */}
                      <button
                        type="button"
                        disabled={!SCENE_MODE_ENABLED}
                        onClick={selectScene}
                        aria-pressed={gameMode === "scene"}
                        className={`col-span-2 relative flex items-center gap-3 p-4 rounded-[20px] border-2 text-left transition-all ${
                          !SCENE_MODE_ENABLED
                            ? "border-outline-variant/30 bg-surface-container-lowest opacity-70 cursor-not-allowed"
                            : gameMode === "scene"
                            ? "border-primary bg-primary-container/10 shadow-soft-card"
                            : "border-outline-variant/30 bg-surface-container-lowest hover:border-outline"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                          gameMode === "scene" ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"
                        }`}>
                          <StickFigureIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block text-label-md text-on-surface">{t("mode.scene.name")}</span>
                          <span className="block text-xs text-on-surface-variant mt-0.5">{t("mode.scene.desc")}</span>
                        </div>
                        {gameMode === "scene" ? (
                          <span className="material-symbols-outlined text-primary text-base icon-fill">check_circle</span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-tertiary-container px-2.5 py-1 text-[11px] font-semibold text-on-tertiary-container">
                            {SCENE_MODE_ENABLED ? t("mode.scene.new") : t("mode.scene.soon")}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

              {gameMode === "scene" ? (
                <div ref={chapterRef} className="scroll-mt-4">
                  <ChapterPicker relationshipType={relationshipType} selectedId={chapterId} onSelect={setChapterId} />
                </div>
              ) : (
                <>
              {/* Category selector (dropdown) */}
              {(categoriesLoading || allCategories.length > 0) && (
                <div className="flex flex-col gap-2" ref={categoryRef}>
                  <div>
                    <label id="category-label" className="text-label-md text-on-surface-variant">{t("category.label")}</label>
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      disabled={!relationshipType || categoriesLoading}
                      onClick={() => setCategoryOpen((o) => !o)}
                      aria-haspopup="listbox"
                      aria-expanded={categoryOpen}
                      aria-labelledby="category-label"
                      className={`w-full flex items-center gap-3 px-4 py-3.5 bg-surface-container-lowest border-2 rounded-xl text-body-md text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                        categoryOpen ? "border-primary" : "border-outline-variant/40"
                      } ${categoriesLoading ? "animate-pulse" : ""}`}
                    >
                      <span className="material-symbols-outlined text-xl text-outline">
                        {selectedCategory ? getCategoryIcon(selectedCategory.slug) : "auto_awesome"}
                      </span>
                      <span className="flex-1 text-on-surface">
                        {selectedCategory ? selectedCategory.name : t("category.all")}
                      </span>
                      <span className={`material-symbols-outlined text-xl text-outline transition-transform ${categoryOpen ? "rotate-180" : ""}`}>
                        expand_more
                      </span>
                    </button>

                    {categoryOpen && (
                      <ul
                        role="listbox"
                        aria-labelledby="category-label"
                        className="absolute z-20 left-0 right-0 mt-2 max-h-72 overflow-y-auto bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-soft-active py-1"
                      >
                        <li role="option" aria-selected={selectedCategoryId === null}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategoryId(null);
                              setCategoryOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left text-body-md hover:bg-surface-container transition-colors ${
                              selectedCategoryId === null ? "text-primary font-semibold" : "text-on-surface"
                            }`}
                          >
                            <span className="material-symbols-outlined text-xl">auto_awesome</span>
                            <span className="flex-1">{t("category.all")}</span>
                            {selectedCategoryId === null && (
                              <span className="material-symbols-outlined text-base icon-fill">check</span>
                            )}
                          </button>
                        </li>
                        {categories.map((cat) => (
                          <li key={cat.id} role="option" aria-selected={selectedCategoryId === cat.id}>
                            <button
                              type="button"
                              onClick={() => handleCategoryClick(cat)}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-left text-body-md hover:bg-surface-container transition-colors ${
                                cat.is_premium
                                  ? "text-on-surface-variant/60"
                                  : selectedCategoryId === cat.id
                                  ? "text-primary font-semibold"
                                  : "text-on-surface"
                              }`}
                            >
                              <span className="material-symbols-outlined text-xl">{getCategoryIcon(cat.slug)}</span>
                              <span className="flex-1">{cat.name}</span>
                              {cat.is_premium ? (
                                <span className="material-symbols-outlined text-sm text-tertiary icon-fill">lock</span>
                              ) : (
                                selectedCategoryId === cat.id && (
                                  <span className="material-symbols-outlined text-base icon-fill">check</span>
                                )
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {/* Question count */}
              <div className="flex flex-col gap-3">
                <label className="text-label-md text-on-surface-variant">{t("questions.label")}</label>
                <div className="flex gap-3">
                  {([5, 10] as const).map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setQuestionCount(count)}
                      className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3.5 px-2 rounded-xl border-2 text-center transition-all ${
                        questionCount === count
                          ? "border-primary bg-primary-container/10 text-primary"
                          : "border-outline-variant/30 bg-surface-container-lowest text-on-surface-variant hover:border-outline"
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl flex-shrink-0">
                        {count === 5 ? "bolt" : "format_list_bulleted"}
                      </span>
                      <span className="text-xs sm:text-label-md leading-tight">
                        {count === 5 ? t("questions.fast") : t("questions.classic")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

                </>
              )}
                </>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 bg-error-container text-error rounded-xl px-4 py-3">
                  <span className="material-symbols-outlined text-xl">error</span>
                  <span className="text-body-md">{error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 mt-1">
                <button
                  type="submit"
                  disabled={loading || !displayName.trim() || !relationshipType || (step === 2 && gameMode === "scene")}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-on-primary text-body-md font-semibold py-3.5 rounded-full hover:bg-surface-tint disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-primary-glow"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-xl">refresh</span>
                      {t("creating")}
                    </>
                  ) : (
                    <>
                      {step === 1 ? t("step1.next") : t("submit")}
                      <span className="material-symbols-outlined text-xl">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>

      {/* ── Premium category modal ────────────────────────────────── */}
      {premiumCategory && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-8 sm:pb-0">
          <div
            className="absolute inset-0 bg-scrim/50 backdrop-blur-sm"
            onClick={() => setPremiumCategory(null)}
          />
          <div className="relative w-full max-w-sm bg-surface-container-lowest rounded-[28px] p-8 shadow-soft-active flex flex-col items-center gap-5 text-center">
            <div className="w-16 h-16 rounded-full bg-tertiary-container flex items-center justify-center">
              <span
                className="material-symbols-outlined text-on-tertiary-container icon-fill"
                style={{ fontSize: "32px" }}
              >
                smartphone
              </span>
            </div>

            <div>
              <p className="text-label-md text-tertiary font-semibold mb-1 flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-sm icon-fill">lock</span>
                {premiumCategory.name}
              </p>
              <h3 className="text-headline-sm text-on-background mb-2">{t("premiumModal.title")}</h3>
              <p className="text-body-md text-on-surface-variant">{t("premiumModal.desc")}</p>
            </div>

            <button
              onClick={() => setPremiumCategory(null)}
              className="w-full bg-surface-container text-on-surface text-body-md font-semibold py-3.5 rounded-full hover:bg-surface-container-high active:scale-95 transition-all"
            >
              {t("premiumModal.close")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
