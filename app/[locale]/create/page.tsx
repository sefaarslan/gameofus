"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { RELATIONSHIP_TYPES, isRelationshipType, type RelationshipType } from "@/lib/relationship";
import { isGender, type Gender } from "@/lib/gender";
import { GenderPicker } from "@/components/create/GenderPicker";
import { StickFigureIcon } from "@/components/create/StickFigureIcon";
import { ChapterPicker } from "@/components/create/ChapterPicker";
import { Carousel } from "@/components/create/Carousel";
import { ageFromIso, maskBirthDateInput, parseBirthDateInput } from "@/lib/date-input";
import { ChoiceCard, FloatBadge, NumberBadge, Pill, SectionHeader } from "@/components/create/ui";
import { SCENE_MODE_ENABLED } from "@/lib/scene-chapters";

// Tasarım mobil uygulamadaki oda oluşturma ekranıyla aynıdır (gameofus-mobile/src/app/game/create.tsx).

type GameMode = "secret_choice" | "prediction" | "orderline" | "mixed" | "scene";

interface Category {
  id: string;
  name: string;
  slug: string;
  is_premium: boolean;
  /** Bu istemci için kilitli mi (web anonim: tier gerektirenler kilitli) */
  locked?: boolean;
  sort_order: number;
  relationship_types: RelationshipType[];
}

type ClassicMode = Exclude<GameMode, "scene">;

// Her mod kendi ton ve ikonunu taşır (seçiliyken hepsi dolu kırmızıya döner)
const MODES: Array<{ value: ClassicMode; icon: string; tint: string; color: string; popular?: boolean }> = [
  { value: "secret_choice", icon: "visibility_off", tint: "bg-primary-container/60", color: "text-[#ae2f34]", popular: true },
  { value: "prediction", icon: "lightbulb", tint: "bg-tertiary-container/45", color: "text-[#6b5900]" },
  { value: "orderline", icon: "format_list_numbered", tint: "bg-secondary-container", color: "text-[#4b4642]" },
  { value: "mixed", icon: "casino", tint: "bg-error-container", color: "text-[#ae2f34]" },
];

const RELATIONSHIP_ICONS: Record<RelationshipType, string> = {
  friend: "mood",
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
  birthDate: string;
  gender: Gender | null;
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
      birthDate: maskBirthDateInput(str(d.birthDate, 10)),
      gender: isGender(d.gender) ? d.gender : null,
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

const isLocked = (c: Category) => c.locked ?? c.is_premium;

export default function CreatePage() {
  const t = useTranslations("create");
  const tErr = useTranslations("error");
  const router = useRouter();
  const locale = useLocale();

  // İki adımlı sihirbaz: 1 = kimler oynuyor, 2 = ne oynuyoruz. Durum bileşende tutulur, sunucuya yalnızca son adımda gidilir.
  // Yalnızca oda kuranın bilgisi alınır; karşı taraf kendi adını davet linkinden kendisi girer.
  const [step, setStep] = useState<1 | 2>(1);
  const [displayName, setDisplayName] = useState("");
  // Doğum tarihi isteğe bağlı (webde yalnızca oyuncu adı zorunludur); "GG.AA.YYYY" metni
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [relationshipType, setRelationshipType] = useState<RelationshipType | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>("mixed");
  const [questionCount, setQuestionCount] = useState<5 | 10>(5);
  const [chapterId, setChapterId] = useState<string | null>(null);
  const chapterRef = useRef<HTMLDivElement>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
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

  // Taslağı geri yükle (yalnızca istemcide, mount sonrası; sunucu çıktısıyla uyuşmazlık olmasın diye ilk karede gizli kalır)
  useEffect(() => {
    const d = readDraft();
    if (d) {
      if (d.displayName) setDisplayName(d.displayName);
      if (d.birthDate) setBirthDate(d.birthDate);
      setGender(d.gender ?? null);
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
        step, displayName, birthDate, gender, relationshipType,
        gameMode, questionCount, categoryId: selectedCategoryId, chapterId,
      };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* depolama kapalı/dolu: taslak tutulmaz, sihirbaz yine çalışır */
    }
  }, [draftLoaded, step, displayName, birthDate, gender, relationshipType, gameMode, questionCount, selectedCategoryId, chapterId]);

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
    setError(null);
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
    if (isLocked(cat)) {
      setPremiumCategory(cat);
      return;
    }
    setSelectedCategoryId((prev) => (prev === cat.id ? null : cat.id));
  }

  const selectedCategory = allCategories.find((c) => c.id === selectedCategoryId) ?? null;
  const isScene = gameMode === "scene";

  // Doğum tarihi boşsa sorun yok (isteğe bağlı); doluysa geçerli olmalı ve asgari yaş (13) sağlanmalı
  function birthDateError(): string | null {
    if (!birthDate.trim()) return null;
    const iso = parseBirthDateInput(birthDate);
    if (!iso) return t("errors.birthDateInvalid");
    if (ageFromIso(iso) < 13) return t("errors.birthDateTooYoung");
    return null;
  }

  function handleContinue() {
    if (!displayName.trim()) return setError(t("errors.nameRequired"));
    if (!relationshipType) return setError(t("errors.relationshipRequired"));
    const bdErr = birthDateError();
    if (bdErr) return setError(bdErr);
    setError(null);
    goToStep2();
  }

  async function handleSubmit() {
    if (!displayName.trim() || !relationshipType || birthDateError()) {
      setStep(1);
      setError(!displayName.trim() ? t("errors.nameRequired") : !relationshipType ? t("errors.relationshipRequired") : birthDateError());
      return;
    }
    // Sahne bölümleri hazır olana kadar oda kurulamaz (sunucu da bu modu henüz kabul etmez)
    if (isScene) return;

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
          relationshipType,
          gameMode,
          questionCount,
          locale,
          categoryId: selectedCategoryId,
          gender,
          ...(birthDate.trim() ? { birthDate: parseBirthDateInput(birthDate) } : {}),
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
            {/* Header: geri · adım rozeti · ilerleme çubuğu (mobildeki gibi) */}
            <div className="mb-5" role="progressbar" aria-valuemin={1} aria-valuemax={2} aria-valuenow={step}>
              <div className="flex items-center justify-between h-10 mb-3">
                {step === 2 ? (
                  <button
                    type="button"
                    onClick={goToStep1}
                    className="-ml-2 flex items-center gap-1 pl-2 pr-3 h-10 rounded-full text-label-md text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-xl">arrow_back</span>
                    {t("step2.back")}
                  </button>
                ) : (
                  <span className="w-12" />
                )}
                <span className="flex items-center gap-1.5 border border-outline-variant rounded-full px-3.5 py-1.5 text-label-md font-bold text-on-background">
                  {step === 2 && <span className="material-symbols-outlined icon-fill text-base text-[#4caf50]">check_circle</span>}
                  {t("progress", { current: step, total: 2 })}
                </span>
                <span className="w-12" />
              </div>
              <div className="flex gap-1.5">
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${step > 1 ? "bg-[#4caf50]" : "bg-primary"}`} />
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${step === 2 ? "bg-primary" : "bg-outline-variant/40"}`} />
              </div>
            </div>

            <h1 className="text-headline-sm md:text-headline-md text-on-background mb-1 flex items-center gap-1.5">
              {step === 1 ? t("step1.title") : t("step2.title")}
              <span className="material-symbols-outlined icon-fill text-lg text-[#caa800]">auto_awesome</span>
            </h1>
            <p className="text-body-md text-on-surface-variant mb-5">
              {step === 1 ? t("step1.desc") : t("step2.desc")}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (step === 1) handleContinue();
                else handleSubmit();
              }}
              className="flex flex-col"
            >
              {step === 1 && (
                <>
                  {/* 1 — İlişki türü */}
                  <div className="mb-5">
                    <SectionHeader
                      n={1}
                      icon="groups"
                      title={t("relationship.title")}
                      trailing={<span className="text-xs text-on-surface-variant text-right">{t("relationship.tone")}</span>}
                    />
                    <div className="grid grid-cols-3 gap-2 pt-1" role="group" aria-label={t("relationship.label")}>
                      {RELATIONSHIP_TYPES.map((rt) => (
                        <ChoiceCard
                          key={rt}
                          selected={relationshipType === rt}
                          onClick={() => handleRelationshipChange(rt)}
                          icon={RELATIONSHIP_ICONS[rt]}
                          title={t(`relationship.${rt}.name`)}
                          wrapTitle
                        />
                      ))}
                    </div>
                  </div>

                  {/* 2 — Sen (yalnızca oda kuranın bilgisi) */}
                  <section className="bg-surface-container-lowest rounded-[24px] border border-outline-variant p-5 mb-4 shadow-soft-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <NumberBadge n={2} />
                      <h2 className="flex-1 text-body-lg font-bold text-on-background">{t("you.title")}</h2>
                      <Pill tone="primary">{t("you.badge")}</Pill>
                    </div>
                    <p className="text-label-md font-semibold text-on-surface mb-0.5">{t("you.subtitle")}</p>
                    <p className="text-xs text-on-surface-variant mb-3">{t("you.hint")}</p>

                    <label htmlFor="create-name" className="block text-xs text-on-surface-variant mb-1.5">{t("name.label")}</label>
                    <div className="relative mb-4">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg">badge</span>
                      <input
                        id="create-name"
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder={t("name.placeholder")}
                        maxLength={30}
                        className="w-full pl-11 pr-4 py-3.5 bg-surface-container-lowest border border-outline-variant rounded-2xl text-body-md text-on-surface placeholder-on-surface-variant/50 shadow-soft-sm focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1 min-w-0">
                        <GenderPicker label={t("gender.label")} value={gender} onChange={setGender} />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                        <label htmlFor="create-birth" className="text-xs text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">calendar_month</span>
                          <span className="truncate">{t("birthDate.label")}</span>
                        </label>
                        <div className="flex items-center bg-surface-container rounded-xl px-3 min-h-[44px] focus-within:ring-2 focus-within:ring-primary/40">
                          <input
                            id="create-birth"
                            type="text"
                            inputMode="numeric"
                            autoComplete="bday"
                            value={birthDate}
                            onChange={(e) => setBirthDate(maskBirthDateInput(e.target.value))}
                            placeholder={t("birthDate.placeholder")}
                            maxLength={10}
                            aria-describedby="create-birth-opt"
                            className="w-full bg-transparent text-label-md text-on-surface placeholder-on-surface-variant/60 py-2.5 focus:outline-none"
                          />
                        </div>
                        <span id="create-birth-opt" className="text-[11px] text-on-surface-variant/70">({t("birthDate.optional")})</span>
                      </div>
                    </div>
                  </section>

                  <div className="flex items-start gap-2.5 bg-primary-container/25 rounded-2xl px-4 py-3 mb-4">
                    <span className="material-symbols-outlined text-base text-primary mt-px">auto_awesome</span>
                    <p className="flex-1 text-xs text-on-surface-variant leading-relaxed">{t("gender.hint")}</p>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  {/* 1 — Kategori (Sahne seçiliyken gizli: yerine bölüm seçimi) */}
                  {!isScene && (categoriesLoading || allCategories.length > 0) && (
                    <div className="mb-6">
                      <SectionHeader n={1} icon="apps" title={t("category.label")} trailing={<Pill tone="tertiary">{t("category.badge")}</Pill>} />
                      {categoriesLoading ? (
                        <div className="h-28 rounded-2xl bg-surface-container animate-pulse" />
                      ) : (
                        <Carousel label={t("category.label")}>
                          <ChoiceCard
                            selected={selectedCategoryId === null}
                            onClick={() => setSelectedCategoryId(null)}
                            icon="shuffle"
                            title={t("category.all")}
                            desc={t("category.surpriseDesc")}
                            className="w-[150px] shrink-0 snap-start"
                          />
                          {categories.map((cat) => {
                            const locked = isLocked(cat);
                            const hasTagline = cat.slug in CATEGORY_ICONS;
                            return (
                              <ChoiceCard
                                key={cat.id}
                                selected={selectedCategoryId === cat.id && !locked}
                                onClick={() => handleCategoryClick(cat)}
                                icon={locked ? "lock" : getCategoryIcon(cat.slug)}
                                title={cat.name}
                                desc={hasTagline ? t(`category.taglines.${cat.slug}`) : undefined}
                                hideMarker={locked}
                                className={`w-[150px] shrink-0 snap-start ${locked ? "opacity-60" : ""}`}
                              />
                            );
                          })}
                        </Carousel>
                      )}
                    </div>
                  )}

                  {/* 2 — Oyun modu: tek listede aynı kart diliyle; Sahne sonda (backend hazır olana kadar pasif) */}
                  <div className="mb-6">
                    <SectionHeader
                      n={isScene ? 1 : 2}
                      icon="sports_esports"
                      title={t("mode.label")}
                      trailing={<span className="text-xs text-on-surface-variant">{t("mode.hint")}</span>}
                    />
                    <div className="grid grid-cols-2 gap-3 pt-2.5">
                      {MODES.map(({ value, icon, tint, color, popular }) => (
                        <div key={value} className="relative flex">
                          <ChoiceCard
                            selected={gameMode === value}
                            onClick={() => setGameMode(value)}
                            icon={icon}
                            iconTint={tint}
                            iconColor={color}
                            title={t(`mode.options.${value}`)}
                            desc={t(`mode.descs.${value}`)}
                            className="flex-1 rounded-[20px] p-4"
                          />
                          {popular && (
                            <FloatBadge tone="gold" icon="local_fire_department">
                              {t("mode.popular")}
                            </FloatBadge>
                          )}
                        </div>
                      ))}
                      <div className="col-span-2 flex">
                        <ChoiceCard
                          selected={isScene}
                          onClick={selectScene}
                          disabled={!SCENE_MODE_ENABLED}
                          icon="movie"
                          iconNode={<StickFigureIcon className="w-6 h-6" />}
                          iconTint="bg-surface-container"
                          title={t("mode.scene.name")}
                          desc={t("mode.scene.desc")}
                          trailing={
                            isScene ? undefined : (
                              <Pill tone="tertiary">{SCENE_MODE_ENABLED ? t("mode.scene.new") : t("mode.scene.soon")}</Pill>
                            )
                          }
                          className={`flex-1 rounded-[20px] p-4 ${SCENE_MODE_ENABLED ? "" : "opacity-70 cursor-not-allowed"}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sahne: kategori ve soru sayısı yerine bölüm seçimi */}
                  {isScene && (
                    <div ref={chapterRef} className="scroll-mt-4 mb-6">
                      <ChapterPicker relationshipType={relationshipType} selectedId={chapterId} onSelect={setChapterId} />
                    </div>
                  )}

                  {/* 3 — Soru sayısı ve süre */}
                  {!isScene && (
                    <div className="mb-5">
                      <SectionHeader
                        n={3}
                        icon="layers"
                        title={t("questions.label")}
                        trailing={<span className="text-xs text-on-surface-variant">{t("questions.badge")}</span>}
                      />
                      <div className="grid grid-cols-2 gap-3 pt-2.5">
                        {([5, 10] as const).map((count) => {
                          const selected = questionCount === count;
                          return (
                            <div key={count} className="relative flex">
                              <button
                                type="button"
                                onClick={() => setQuestionCount(count)}
                                aria-pressed={selected}
                                className={`flex-1 flex flex-col items-center py-4 rounded-2xl border transition-all min-h-[44px] ${
                                  selected
                                    ? "border-primary bg-primary text-on-primary shadow-primary-glow"
                                    : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-outline"
                                }`}
                              >
                                <span className={`w-9 h-9 rounded-full flex items-center justify-center mb-1.5 ${selected ? "bg-on-primary/15" : "bg-primary-container/50"}`}>
                                  <span className={`material-symbols-outlined text-lg ${selected ? "text-on-primary" : "text-primary"}`}>
                                    {count === 5 ? "bolt" : "timer"}
                                  </span>
                                </span>
                                <span className="text-body-md font-bold">{count} {t("questions.word")}</span>
                                <span className={`text-xs mb-1.5 ${selected ? "text-on-primary/80" : "text-on-surface-variant"}`}>
                                  {count === 5 ? t("questions.durationFast") : t("questions.durationStandard")}
                                </span>
                                <span className={`text-[10px] font-bold tracking-wider ${selected ? "text-on-primary" : "text-on-surface-variant"}`}>
                                  {count === 5 ? t("questions.quickLabel") : t("questions.standardLabel")}
                                </span>
                              </button>
                              {count === 5 && (
                                <FloatBadge tone="green" icon="check">
                                  {t("questions.ideal")}
                                </FloatBadge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Canlı özet */}
                  {!isScene && (
                    <div className="flex items-center gap-3 bg-surface-container-lowest border border-outline-variant rounded-2xl px-4 py-3.5 mb-4 shadow-soft-sm">
                      <span className="w-10 h-10 rounded-full bg-primary-container/50 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-lg text-primary">redeem</span>
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-label-md font-bold text-on-background">{t("summary.title")}</p>
                        <p className="text-xs text-on-surface-variant truncate">
                          {selectedCategory?.name ?? t("category.all")} • {questionCount} {t("questions.word")} • {t(`mode.options.${gameMode as ClassicMode}`)}
                        </p>
                      </div>
                      <span className="material-symbols-outlined icon-fill text-[22px] text-[#4caf50]">check_circle</span>
                    </div>
                  )}
                </>
              )}

              {/* Error */}
              {error && (
                <div role="alert" className="flex items-center gap-3 bg-error-container text-error rounded-2xl px-4 py-3 mb-4">
                  <span className="material-symbols-outlined text-xl">error</span>
                  <span className="text-body-md">{error}</span>
                </div>
              )}

              {/* Action */}
              <button
                type="submit"
                disabled={loading || (step === 2 && isScene)}
                className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary text-body-lg font-semibold py-4 rounded-full hover:bg-surface-tint disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-primary-glow mb-2"
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
