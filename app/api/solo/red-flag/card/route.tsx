import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import tr from "@/messages/tr.json";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import { RED_FLAG_CARD_COUNT, computeProfile, decodeGrid, type Flag } from "@/lib/solo";

const MESSAGES = { tr: tr.solo, en: en.solo, es: es.solo } as const;
type Lang = keyof typeof MESSAGES;

const COLORS: Record<Flag, string> = { green: "#3f9d6b", yellow: "#d9a21b", red: "#e0524a" };
const W = 1080;
const H = 1920;

// Basit, font bağımsız glifler (Satori için inline SVG)
function Glyph({ flag }: { flag: Flag }) {
  const common = { stroke: "#ffffff", strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  return (
    <svg width="104" height="104" viewBox="0 0 24 24">
      {flag === "green" && <path d="M5 12.5l4.5 4.5L19 7.5" {...common} />}
      {flag === "yellow" && (
        <g>
          <path d="M12 5.5v8" {...common} />
          <circle cx="12" cy="18.2" r="0.6" stroke="#ffffff" strokeWidth="2.2" fill="#ffffff" />
        </g>
      )}
      {flag === "red" && <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" {...common} />}
    </svg>
  );
}

async function loadFonts(origin: string) {
  const files = [
    ["Quicksand-500-latin.woff", 500],
    ["Quicksand-500-latin-ext.woff", 500],
    ["Quicksand-700-latin.woff", 700],
    ["Quicksand-700-latin-ext.woff", 700],
  ] as const;
  return Promise.all(
    files.map(async ([file, weight]) => ({
      name: "Quicksand",
      data: await (await fetch(`${origin}/fonts/${file}`)).arrayBuffer(),
      weight: weight as 500 | 700,
      style: "normal" as const,
    })),
  );
}

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const flags = decodeGrid(searchParams.get("g"));
  if (!flags) return new Response("Invalid grid", { status: 400 });
  const lang = (["tr", "en", "es"].includes(searchParams.get("l") ?? "") ? searchParams.get("l") : "en") as Lang;
  const t = MESSAGES[lang];

  const { counts, tolerance } = computeProfile(flags);
  const verdict = (t.verdicts as Record<string, { title: string; line: string }>)[String(Math.min(counts.red, RED_FLAG_CARD_COUNT))];
  const fonts = await loadFonts(origin);

  // Link önizlemesi (WhatsApp/sosyal): yatay 1200×630 varyant
  if (searchParams.get("fmt") === "og") {
    const c = 150;
    const g = 16;
    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 630,
            display: "flex",
            alignItems: "center",
            padding: "0 80px",
            gap: 70,
            background: "linear-gradient(120deg, #ffe9e6 0%, #fff8f6 55%, #ffeccf 100%)",
            fontFamily: "Quicksand",
            color: "#2b1514",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", width: c * 3 + g * 2, gap: g }}>
            {flags.map((f, i) => (
              <div
                key={i}
                style={{ width: c, height: c, borderRadius: 30, background: COLORS[f], display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <svg width="70" height="70" viewBox="0 0 24 24" fill="none">
                  {f === "green" && <path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
                  {f === "yellow" && <path d="M12 5.5v8" stroke="#fff" strokeWidth="3" strokeLinecap="round" />}
                  {f === "yellow" && <circle cx="12" cy="18.2" r="0.6" stroke="#fff" strokeWidth="2.2" fill="#fff" />}
                  {f === "red" && <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" stroke="#fff" strokeWidth="3" strokeLinecap="round" />}
                </svg>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", width: 490 }}>
            <div style={{ display: "flex", fontSize: 28, fontWeight: 700, letterSpacing: 4, color: "#ae2f34", textTransform: "uppercase" }}>{t.gameName}</div>
            <div style={{ display: "flex", marginTop: 18, fontSize: 66, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1 }}>{verdict.title}</div>
            <div style={{ display: "flex", marginTop: 28, fontSize: 32, fontWeight: 500, color: "#584140" }}>{`${t.result.tolerance}  %${tolerance}`}</div>
            <div style={{ display: "flex", marginTop: 14, height: 18, width: 400, borderRadius: 9, background: "#f1ddd9" }}>
              <div style={{ display: "flex", width: `${Math.max(tolerance, 3)}%`, height: 18, borderRadius: 9, background: "linear-gradient(90deg, #e0524a, #d9a21b, #3f9d6b)" }} />
            </div>
            <div style={{ display: "flex", marginTop: 40, fontSize: 36, fontWeight: 700, color: "#ae2f34" }}>@gameofus.app</div>
          </div>
        </div>
      ),
      { width: 1200, height: 630, fonts, headers: { "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable" } },
    );
  }

  const cell = 208;
  const gap = 24;

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "84px 90px 76px",
          background: "linear-gradient(180deg, #ffe9e6 0%, #fff8f6 38%, #fff8f6 70%, #ffeccf 100%)",
          fontFamily: "Quicksand",
          color: "#2b1514",
        }}
      >
        {/* Marka */}
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <svg width="84" height="84" viewBox="0 0 36 36" fill="none">
            <path d="M36 6C36 3.79 34.21 2 32 2H18C15.79 2 14 3.79 14 6V16C14 18.21 15.79 20 18 20H26L24 24L30 20H32C34.21 20 36 18.21 36 16V6Z" fill="#ae2f34" fillOpacity="0.22" />
            <path d="M22 14C22 11.79 20.21 10 18 10H4C1.79 10 0 11.79 0 14V24C0 26.21 1.79 28 4 28H12L10 32L16 28H18C20.21 28 22 26.21 22 24V14Z" fill="#ae2f34" />
            <circle cx="7" cy="19" r="1.5" fill="#fff" />
            <circle cx="11" cy="19" r="1.5" fill="#fff" />
            <circle cx="15" cy="19" r="1.5" fill="#fff" />
          </svg>
          <div style={{ display: "flex", fontSize: 64, letterSpacing: -2 }}>
            <span style={{ fontWeight: 500 }}>game of&nbsp;</span>
            <span style={{ fontWeight: 700, color: "#ae2f34" }}>us</span>
          </div>
        </div>

        <div style={{ display: "flex", flexShrink: 0, marginTop: 64, fontSize: 36, fontWeight: 700, letterSpacing: 6, color: "#ae2f34", textTransform: "uppercase" }}>
          {t.gameName}
        </div>

        <div style={{ display: "flex", flexShrink: 0, marginTop: 28, fontSize: 76, fontWeight: 700, lineHeight: 1.1, textAlign: "center", letterSpacing: -2, justifyContent: "center" }}>
          {verdict.title}
        </div>
        <div style={{ display: "flex", flexShrink: 0, marginTop: 22, fontSize: 34, fontWeight: 500, lineHeight: 1.3, textAlign: "center", justifyContent: "center", color: "#584140", maxWidth: 880 }}>
          {verdict.line}
        </div>

        {/* 3x3 ızgara */}
        <div style={{ display: "flex", flexWrap: "wrap", width: cell * 3 + gap * 2, marginTop: 48, gap, flexShrink: 0 }}>
          {flags.map((f, i) => (
            <div
              key={i}
              style={{
                width: cell,
                height: cell,
                borderRadius: 44,
                background: COLORS[f],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 14px 30px rgba(43,21,20,0.14)",
              }}
            >
              <Glyph flag={f} />
            </div>
          ))}
        </div>

        {/* Sayılar */}
        <div style={{ display: "flex", flexShrink: 0, marginTop: 50, gap: 56 }}>
          {(["green", "yellow", "red"] as Flag[]).map((f) => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ display: "flex", width: 44, height: 44, borderRadius: 22, background: COLORS[f] }} />
              <div style={{ display: "flex", fontSize: 72, fontWeight: 700 }}>{counts[f]}</div>
            </div>
          ))}
        </div>

        {/* Tolerans */}
        <div style={{ display: "flex", flexDirection: "column", flexShrink: 0, width: 780, marginTop: 48 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 40, fontWeight: 500, color: "#584140" }}>
            <span>{t.result.tolerance}</span>
            <span style={{ fontWeight: 700, color: "#2b1514" }}>{`%${tolerance}`}</span>
          </div>
          <div style={{ display: "flex", marginTop: 20, height: 28, borderRadius: 14, background: "#f1ddd9" }}>
            <div style={{ display: "flex", width: `${Math.max(tolerance, 3)}%`, height: 28, borderRadius: 14, background: "linear-gradient(90deg, #e0524a, #d9a21b, #3f9d6b)" }} />
          </div>
        </div>

        <div style={{ display: "flex", flexGrow: 1 }} />

        <div style={{ display: "flex", flexShrink: 0, flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ display: "flex", fontSize: 48, fontWeight: 700, color: "#ae2f34" }}>@gameofus.app</div>
          <div style={{ display: "flex", fontSize: 32, fontWeight: 500, color: "#584140" }}>gameofus.app</div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable" },
    },
  );
}
