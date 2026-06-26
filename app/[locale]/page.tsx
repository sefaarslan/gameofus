import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

// ── Hero Game Card Mockup ─────────────────────────────────────────
function GameCardMockup() {
  const tM = useTranslations("landing.mockup");
  const tOpt = useTranslations("option");

  return (
    <div className="relative w-full max-w-[460px] select-none">
      {/* Ambient glow behind card */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-container/30 to-tertiary-fixed/20 rounded-[2.5rem] blur-2xl scale-110 -z-10" />

      {/* Main game card */}
      <div className="relative bg-surface-container-lowest rounded-[2rem] shadow-soft-active border border-outline-variant/15 p-6 overflow-hidden">
        {/* Top gradient accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary-container to-tertiary-container rounded-t-[2rem]" />

        {/* Card header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#34D399]" />
            <span className="text-xs text-on-surface-variant font-medium">{tM("partnerOnline")}</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-on-surface-variant">{tM("questionCount")}</span>
            <div className="w-16 h-1 bg-surface-container rounded-full overflow-hidden">
              <div className="h-full w-[30%] bg-gradient-to-r from-primary to-tertiary-container rounded-full" />
            </div>
          </div>
        </div>

        {/* Mode badge + Question */}
        <div className="mb-5">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary-container/25 px-2.5 py-1 rounded-full mb-3">
            <span className="text-[14px]" style={{ fontFamily: "Material Symbols Outlined", fontVariationSettings: "'FILL' 0" }}>visibility_off</span>
            Secret Choice
          </span>
          <p className="text-base font-semibold text-on-background leading-snug">
            {tM("question")}
          </p>
        </div>

        {/* My answer section */}
        <div className="mb-4">
          <p className="text-[11px] text-on-surface-variant mb-2 flex items-center gap-1 uppercase tracking-wide font-semibold">
            <span style={{ fontFamily: "Material Symbols Outlined", fontSize: "12px" }}>lock</span>
            {tM("yourAnswer")}
          </p>
          <div className="flex gap-2">
            {[
              { key: "yes" as const, active: true },
              { key: "unsure" as const, active: false },
              { key: "no" as const, active: false },
            ].map(({ key, active }) => (
              <div
                key={key}
                className={`flex-1 py-2.5 rounded-xl text-center text-sm font-semibold border-2 transition-all ${
                  active
                    ? "border-primary bg-primary-fixed text-primary"
                    : "border-transparent bg-surface-container text-on-surface-variant"
                }`}
              >
                {tOpt(key)}
                {active && <span className="ml-1 text-primary">✓</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Dashed connector */}
        <div className="flex justify-center my-1">
          <div className="h-5 border-l-2 border-dashed border-outline-variant/60" />
        </div>

        {/* Partner prediction section */}
        <div>
          <p className="text-[11px] text-on-surface-variant mb-2 flex items-center gap-1 uppercase tracking-wide font-semibold">
            <span style={{ fontFamily: "Material Symbols Outlined", fontSize: "12px" }}>psychology</span>
            {tM("partnerAnswer")}
          </p>
          <div className="flex gap-2">
            {[
              { key: "yes" as const, active: false },
              { key: "unsure" as const, active: false },
              { key: "no" as const, active: true },
            ].map(({ key, active }) => (
              <div
                key={key}
                className={`flex-1 py-2.5 rounded-xl text-center text-sm font-semibold border-2 transition-all ${
                  active
                    ? "border-tertiary-container bg-tertiary-fixed text-on-tertiary-fixed"
                    : "border-transparent bg-surface-container text-on-surface-variant"
                }`}
              >
                {tOpt(key)}
                {active && <span className="ml-1">✓</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Lock button */}
        <div className="mt-5 bg-primary text-on-primary rounded-full py-3 flex items-center justify-center gap-2 text-sm font-semibold shadow-primary-glow">
          <span style={{ fontFamily: "Material Symbols Outlined", fontSize: "16px" }}>lock_clock</span>
          {tM("lock")}
        </div>
      </div>

      {/* Floating: score badge — bottom left */}
      <div className="absolute -bottom-5 -left-4 bg-surface p-3.5 rounded-2xl shadow-soft-active border border-outline-variant/20 flex items-center gap-3 animate-float-up z-10">
        <div className="relative w-12 h-12 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-surface-container-high"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" stroke="currentColor" strokeDasharray="100,100" strokeWidth="4"
            />
            <path
              className="text-primary"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" stroke="currentColor" strokeDasharray="82,100" strokeLinecap="round" strokeWidth="4"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary">%82</span>
        </div>
        <div>
          <p className="text-label-md text-on-background font-semibold">{tM("score")}</p>
          <p className="text-xs text-on-surface-variant">{tM("greatMatch")}</p>
        </div>
      </div>

      {/* Floating: partner avatar — top right */}
      <div className="absolute -top-4 -right-3 bg-surface px-3.5 py-2.5 rounded-2xl shadow-soft-card border border-outline-variant/20 flex items-center gap-2.5 z-10">
        <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-sm font-bold text-on-secondary-container flex-shrink-0">
          {tM("partnerName")[0]}
        </div>
        <div>
          <p className="text-xs font-semibold text-on-background leading-none mb-0.5">{tM("partnerName")}</p>
          <p className="text-[10px] text-[#34D399] flex items-center gap-0.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] inline-block" /> Online
          </p>
        </div>
      </div>

      {/* Floating: micro-reveal badge — right middle */}
      <div className="absolute top-1/2 -right-6 -translate-y-1/2 bg-tertiary-fixed border border-outline-variant/10 px-3 py-2 rounded-2xl shadow-soft-card text-center z-10 hidden md:block">
        <p className="text-[11px] font-bold text-on-tertiary-fixed">{tM("correct")}</p>
        <p className="text-[10px] text-on-tertiary-fixed/70">{tM("points")}</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function HomePage() {
  const t = useTranslations("landing");

  return (
    <main className="max-w-[1400px] mx-auto px-6 md:px-12 flex flex-col">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="min-h-[88vh] flex flex-col md:flex-row items-center justify-center gap-12 md:gap-16 py-16 md:py-24 relative" id="hero">
        {/* Ambient blobs */}
        <div className="absolute top-1/4 -left-[8%] w-72 h-72 bg-primary-container/15 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-1/4 -right-[8%] w-96 h-96 bg-tertiary-container/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* ── Text column ─────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-6 items-center md:items-start text-center md:text-left z-10 max-w-xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-container text-on-secondary-container rounded-full text-label-md">
            <span className="material-symbols-outlined text-base icon-fill">favorite</span>
            <span>{t("hero.badge")}</span>
          </div>

          <h1 className="text-headline-lg-mobile md:text-headline-xl text-on-background leading-tight">
            {t("hero.titlePre")}{" "}
            <span className="text-primary relative inline-block">
              {t("hero.titleHighlight")}
              <svg
                className="absolute w-full h-3 -bottom-1 left-0 text-primary-container/50"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
              >
                <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
              </svg>
            </span>{" "}
            {t("hero.titlePost")}
          </h1>

          <p className="text-body-lg text-on-surface-variant max-w-md">
            {t("hero.subtitle")}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 mt-2 w-full sm:w-auto">
            <Link
              href="/create"
              className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary text-body-lg font-semibold px-8 py-4 rounded-full hover:bg-surface-tint active:scale-95 transition-all shadow-primary-glow group"
            >
              <span>{t("cta.start")}</span>
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-xl">arrow_forward</span>
            </Link>
            <a
              href="#nasil-calisir"
              className="inline-flex items-center justify-center gap-2 bg-surface-container-high text-primary text-body-lg font-semibold px-8 py-4 rounded-full hover:bg-surface-container-highest active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-xl">play_circle</span>
              <span>{t("hero.howToPlay")}</span>
            </a>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-3 mt-1 opacity-70">
            <div className="flex -space-x-2">
              {["bg-primary-container", "bg-tertiary-container", "bg-secondary-container"].map((c, i) => (
                <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-surface`} />
              ))}
            </div>
            <span className="text-label-md text-on-surface-variant">{t("hero.socialProof")}</span>
          </div>
        </div>

        {/* ── Visual column ────────────────────────────────────────── */}
        <div className="flex-1 flex justify-center md:justify-end relative w-full z-10">
          <GameCardMockup />
        </div>
      </section>

      {/* ── Nasıl Çalışır ──────────────────────────────────────────── */}
      <section className="py-20" id="nasil-calisir">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-primary-container/20 text-primary rounded-full text-label-md mb-4">
            {t("how.badge")}
          </span>
          <h2 className="text-headline-lg-mobile md:text-headline-lg text-on-background">{t("how.title")}</h2>
          <p className="text-body-lg text-on-surface-variant mt-2">{t("how.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative">
          {/* Connector line on desktop */}
          <div className="hidden md:block absolute top-[52px] left-[calc(16.67%+48px)] right-[calc(16.67%+48px)] h-px bg-gradient-to-r from-outline-variant/20 via-outline-variant/60 to-outline-variant/20 z-0" />

          {[
            {
              icon: "add_link",
              label: t("how.step1"),
              desc: t("how.step1Desc"),
              color: "bg-primary-container",
              iconColor: "text-on-primary-container",
              num: "01",
            },
            {
              icon: "psychology_alt",
              label: t("how.step2"),
              desc: t("how.step2Desc"),
              color: "bg-tertiary-fixed",
              iconColor: "text-on-tertiary-fixed",
              num: "02",
            },
            {
              icon: "celebration",
              label: t("how.step3"),
              desc: t("how.step3Desc"),
              color: "bg-secondary-container",
              iconColor: "text-on-secondary-container",
              num: "03",
            },
          ].map(({ icon, label, desc, color, iconColor, num }, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-4 relative z-10">
              {/* Icon circle with step number badge */}
              <div className="relative">
                <div className={`w-24 h-24 rounded-full ${color} flex items-center justify-center shadow-soft-sm border-4 border-surface group hover:shadow-soft-card transition-shadow duration-300`}>
                  <span className={`material-symbols-outlined text-4xl ${iconColor}`}>{icon}</span>
                </div>
                <span className="absolute -top-1 -right-1 w-7 h-7 bg-surface border-2 border-outline-variant/30 rounded-full flex items-center justify-center text-[10px] font-black text-on-surface-variant shadow-soft-sm">
                  {num}
                </span>
              </div>
              <div>
                <h3 className="text-headline-md text-on-background mb-2">{label}</h3>
                <p className="text-body-md text-on-surface-variant px-2 max-w-[220px] mx-auto">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Oyun Modları ───────────────────────────────────────────── */}
      <section className="py-16" id="oyun-modlari">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <h2 className="text-headline-lg-mobile md:text-headline-lg text-on-background">{t("modes.title")}</h2>
            <p className="text-body-lg text-on-surface-variant mt-1">{t("modes.subtitle")}</p>
          </div>
          <Link
            href="/create"
            className="text-primary text-label-md flex items-center gap-1 hover:gap-2 transition-all group"
          >
            {t("modes.explore")}
            <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "visibility_off",
              iconBg: "bg-primary-container",
              iconText: "text-on-primary-container",
              title: "Secret Choice",
              desc: t("modes.sc.desc"),
              tag: t("modes.sc.tag"),
              border: "border-outline-variant/15",
              accent: "from-primary-container/15",
              popular: false,
            },
            {
              icon: "timeline",
              iconBg: "bg-tertiary-container",
              iconText: "text-on-tertiary-container",
              title: "Prediction",
              desc: t("modes.pred.desc"),
              tag: t("modes.pred.tag"),
              border: "border-primary/20",
              accent: "from-tertiary-container/15",
              popular: true,
            },
            {
              icon: "format_list_numbered",
              iconBg: "bg-secondary-container",
              iconText: "text-on-secondary-container",
              title: "Orderline",
              desc: t("modes.order.desc"),
              tag: t("modes.order.tag"),
              border: "border-outline-variant/15",
              accent: "from-secondary-container/25",
              popular: false,
            },
          ].map((mode) => (
            <div
              key={mode.title}
              className={`bg-surface rounded-[24px] p-8 shadow-soft-card border ${mode.border} hover:-translate-y-2 hover:shadow-soft-active transition-all duration-300 flex flex-col h-full relative overflow-hidden group cursor-default`}
            >
              {mode.popular && (
                <div className="absolute top-4 right-4 bg-primary text-on-primary text-[10px] font-bold px-2.5 py-1 rounded-full">
                  {t("modes.popular")}
                </div>
              )}
              {/* Corner gradient */}
              <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl ${mode.accent} to-transparent rounded-bl-full -z-10`} />

              <div className={`w-12 h-12 ${mode.iconBg} rounded-xl flex items-center justify-center ${mode.iconText} mb-6 shadow-soft-sm`}>
                <span className="material-symbols-outlined">{mode.icon}</span>
              </div>
              <h3 className="text-headline-md text-on-background mb-3">{mode.title}</h3>
              <p className="text-body-md text-on-surface-variant flex-grow mb-6">{mode.desc}</p>
              <span className="inline-block self-start px-3 py-1.5 bg-surface-container text-on-surface-variant rounded-full text-xs font-bold">
                {mode.tag}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mobile App Teaser ─────────────────────────────────────── */}
      <section className="py-12 pb-28" id="premium">
        <div className="bg-gradient-to-br from-surface to-surface-container-high rounded-[2rem] p-8 md:p-14 shadow-soft-active border border-outline-variant/20 flex flex-col md:flex-row items-center justify-center gap-10 md:gap-14 relative overflow-hidden">
          {/* Ambient blobs */}
          <div className="absolute -right-24 -top-24 w-72 h-72 bg-tertiary-container/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-24 -bottom-24 w-72 h-72 bg-primary-container/15 rounded-full blur-3xl pointer-events-none" />

          {/* Left: text */}
          <div className="flex-1 max-w-lg relative z-10 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-tertiary-container text-on-tertiary-container rounded-full text-label-md text-xs mb-5">
              <span className="material-symbols-outlined text-sm icon-fill">smartphone</span>
              <span>{t("mobileTeaser.badge")}</span>
            </div>
            <h2 className="text-headline-md md:text-[2rem] text-on-background mb-4 font-bold">
              {t("mobileTeaser.title")}
            </h2>
            <p className="text-body-lg text-on-surface-variant mb-7 max-w-md">
              {t("mobileTeaser.desc")}
            </p>
            <ul className="flex flex-col gap-3.5 text-left">
              {(["feat1", "feat2", "feat3"] as const).map((key, i) => (
                <li key={i} className="flex items-center gap-3 text-on-background text-body-md">
                  <span className="material-symbols-outlined text-primary text-base bg-primary-container/25 p-1.5 rounded-full icon-fill">
                    {["lock_open", "history", "notifications"][i]}
                  </span>
                  {t(`mobileTeaser.${key}`)}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: store badges */}
          <div className="w-full md:w-[300px] shrink-0 relative z-10">
            <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/10 shadow-soft-active flex flex-col items-center text-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary icon-fill text-3xl">smartphone</span>
              </div>

              <div>
                <p className="text-label-lg font-bold text-on-background mb-1">{t("mobileTeaser.comingSoon")}</p>
                <p className="text-xs text-on-surface-variant">{t("mobileTeaser.storeNote")}</p>
              </div>

              <div className="flex flex-col gap-3 w-full">
                {/* App Store badge */}
                <div className="flex items-center gap-3 bg-on-surface/5 rounded-xl px-4 py-3 select-none opacity-50">
                  <span className="material-symbols-outlined text-on-surface-variant text-2xl">apple</span>
                  <div className="text-left">
                    <p className="text-[10px] text-on-surface-variant leading-tight">Download on the</p>
                    <p className="text-sm font-semibold text-on-background leading-tight">App Store</p>
                  </div>
                </div>
                {/* Google Play badge */}
                <div className="flex items-center gap-3 bg-on-surface/5 rounded-xl px-4 py-3 select-none opacity-50">
                  <span className="material-symbols-outlined text-on-surface-variant text-2xl">play_circle</span>
                  <div className="text-left">
                    <p className="text-[10px] text-on-surface-variant leading-tight">Get it on</p>
                    <p className="text-sm font-semibold text-on-background leading-tight">Google Play</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
