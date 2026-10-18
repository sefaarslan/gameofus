import type { ReactNode } from "react";

// Oda oluşturma sayfasının ortak tasarım parçaları — mobil uygulamadaki `create.tsx` ile aynı dil:
// numaralı bölüm başlıkları, dolu (kırmızı) seçili kartlar, köşe seçim işareti, kartın üst kenarına taşan rozetler.

export function NumberBadge({ n }: { n: number }) {
  return (
    <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-on-primary shrink-0">
      {n}
    </span>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "primary" | "tertiary" | "muted" }) {
  const cls =
    tone === "muted"
      ? "border border-outline-variant/60 text-on-surface-variant/70 font-medium"
      : tone === "primary"
      ? "bg-primary-container text-primary"
      : tone === "tertiary"
      ? "bg-tertiary-container/60 text-[#6b5900]"
      : "bg-surface-container text-on-surface-variant";
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${cls}`}>{children}</span>;
}

/** Kartın üst kenarına taşan küçük rozet (ör. "Popüler", "İDEAL"). Kapsayıcı `relative` olmalı. */
export function FloatBadge({ children, tone, icon }: { children: ReactNode; tone: "gold" | "green"; icon: string }) {
  return (
    <span
      className={`absolute -top-2.5 left-3 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white ${
        tone === "gold" ? "bg-[#caa800]" : "bg-[#4caf50]"
      }`}
    >
      <span className="material-symbols-outlined icon-fill text-sm">{icon}</span>
      {children}
    </span>
  );
}

/** Seçim durumu: seçiliyse dolu kartta beyaz tik, değilse nötr halka. */
export function SelectionMarker({ selected }: { selected: boolean }) {
  if (selected) {
    return (
      <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-base text-primary font-bold">check</span>
      </span>
    );
  }
  return <span className="w-5 h-5 rounded-full border-2 border-outline-variant shrink-0" />;
}

export function SectionHeader({ n, icon, title, trailing }: { n: number; icon: string; title: string; trailing?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <div className="flex items-center gap-2 min-w-0">
        <NumberBadge n={n} />
        <span className="material-symbols-outlined text-lg text-on-background">{icon}</span>
        <h2 className="text-body-lg font-bold text-on-background truncate">{title}</h2>
      </div>
      {trailing}
    </div>
  );
}

/** Seçilebilir kart: seçiliyse dolu kırmızı, değilse beyaz + ince çerçeve. İkon kutusu + köşe işareti + başlık + açıklama. */
export function ChoiceCard({
  selected,
  onClick,
  icon,
  iconTint = "bg-primary-container/50",
  iconColor = "text-primary",
  title,
  desc,
  className = "",
  disabled,
  ariaLabel,
  hideMarker,
  trailing,
  iconNode,
  wrapTitle,
  iconFill,
}: {
  selected: boolean;
  onClick: () => void;
  icon: string;
  iconTint?: string;
  iconColor?: string;
  title: string;
  desc?: string;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  /** Köşe işaretini gizle (ör. kilitli kategori) */
  hideMarker?: boolean;
  /** Köşe işareti yerine özel içerik (ör. "Yakında" rozeti) */
  trailing?: ReactNode;
  /** Material Symbols yerine özel ikon (ör. çöp adam SVG'si) */
  iconNode?: ReactNode;
  /** Başlık sığmazsa kesmek yerine alt satıra insin (ör. uzun bir bağ adı) */
  wrapTitle?: boolean;
  /** Material Symbols ikonunu dolu çiz */
  iconFill?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={ariaLabel ?? title}
      className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all min-h-[44px] ${
        selected
          ? "border-primary bg-primary text-on-primary shadow-primary-glow"
          : "border-outline-variant bg-surface-container-lowest text-on-background hover:border-outline"
      } ${className}`}
    >
      <span className="flex items-center justify-between mb-2 w-full">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${selected ? "bg-on-primary/15" : iconTint}`}>
          {iconNode ?? <span className={`material-symbols-outlined ${iconFill ? "icon-fill text-[22px]" : "text-lg"} ${selected ? "text-on-primary" : iconColor}`}>{icon}</span>}
        </span>
        {trailing ?? (hideMarker ? null : <SelectionMarker selected={selected} />)}
      </span>
      <span className={`text-label-md font-bold mb-0.5 w-full leading-tight ${wrapTitle ? "break-words" : "truncate"} ${selected ? "text-on-primary" : "text-on-background"}`}>{title}</span>
      {desc && <span className={`text-xs leading-snug ${selected ? "text-on-primary/80" : "text-on-surface-variant"}`}>{desc}</span>}
    </button>
  );
}
