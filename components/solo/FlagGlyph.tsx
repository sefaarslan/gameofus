import type { Flag } from "@/lib/solo";

/** Renk + ikon + etiket üçlüsünün ikonu: renk körlüğünde de ayırt edilebilsin diye farklı şekiller. */
export function FlagGlyph({ flag, className = "w-8 h-8" }: { flag: Flag; className?: string }) {
  const stroke = { stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {flag === "green" && <path d="M5 12.5l4.5 4.5L19 7.5" {...stroke} />}
      {flag === "yellow" && (
        <g>
          <path d="M12 5.5v8" {...stroke} />
          <circle cx="12" cy="18.2" r="0.6" stroke="currentColor" strokeWidth="2.2" fill="currentColor" />
        </g>
      )}
      {flag === "red" && <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" {...stroke} />}
    </svg>
  );
}
