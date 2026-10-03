import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import tr from "@/messages/tr.json";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import { RED_FLAG_CARD_COUNT, computeProfile, decodeGrid, getPack, type Flag } from "@/lib/solo";
import { createAdminClient } from "@/lib/supabase/server";

const MESSAGES = { tr: tr.solo, en: en.solo, es: es.solo } as const;
type Lang = keyof typeof MESSAGES;

const COLORS: Record<Flag, string> = { green: "#3f9d6b", yellow: "#d9a21b", red: "#e0524a" };
// Tolerans rengi: düşük kırmızı, orta sarı, yüksek yeşil (karne sayfasıyla aynı eşikler)
const toleranceColor = (n: number) => (n < 34 ? COLORS.red : n < 67 ? COLORS.yellow : COLORS.green);
const W = 1080;
const H = 1920;

// Basit, font bağımsız glifler (Satori için inline SVG)
function Glyph({ flag, size = 104 }: { flag: Flag; size?: number }) {
  const common = { stroke: "#ffffff", strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FLAG_BY_LETTER: Record<string, Flag> = { G: "green", Y: "yellow", R: "red" };

/** `q` = virgülle ayrılmış `<G|Y|R><senaryo uuid>` (en fazla 3, bayrak başına bir senaryo). Metin DB'den okunur. */
async function loadPicks(raw: string | null): Promise<{ flag: Flag; text: string }[]> {
  if (!raw) return [];
  const parsed = raw
    .split(",")
    .slice(0, 3)
    .flatMap((part) => {
      const flag = FLAG_BY_LETTER[part.charAt(0)];
      const id = part.slice(1);
      return flag && UUID_RE.test(id) ? [{ flag, id }] : [];
    });
  if (parsed.length === 0) return [];
  const { data } = await createAdminClient()
    .from("solo_scenarios")
    .select("id, scenario_text")
    .in("id", parsed.map((p) => p.id));
  const textById = new Map((data ?? []).map((r) => [r.id as string, r.scenario_text as string]));
  return parsed.flatMap((p) => {
    const text = textById.get(p.id);
    return text ? [{ flag: p.flag, text }] : [];
  });
}

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const flags = decodeGrid(searchParams.get("g"));
  if (!flags) return new Response("Invalid grid", { status: 400 });
  const lang = (["tr", "en", "es"].includes(searchParams.get("l") ?? "") ? searchParams.get("l") : "en") as Lang;
  const t = MESSAGES[lang];

  const { counts, tolerance } = computeProfile(flags);
  // Set etiketi ("Arkadaşlık · 101"): yüzdeler yalnızca aynı setle karşılaştırılabilir
  const pack = getPack(searchParams.get("p"));
  const packLabel = pack ? t.packs.label.replace("{category}", t.packs.categories[pack.category]).replace("{n}", String(pack.number)) : null;
  const verdict = (t.verdicts as Record<string, { title: string; line: string }>)[String(Math.min(counts.red, RED_FLAG_CARD_COUNT))];
  const [fonts, picks] = await Promise.all([loadFonts(origin), searchParams.get("fmt") === "og" ? [] : loadPicks(searchParams.get("q"))]);

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
            {packLabel && <div style={{ display: "flex", marginTop: 8, fontSize: 26, fontWeight: 500, color: "#584140" }}>{packLabel}</div>}
            <div style={{ display: "flex", marginTop: 18, fontSize: 66, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1 }}>{verdict.title}</div>
            <div style={{ display: "flex", marginTop: 24, fontSize: 26, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#584140" }}>{t.result.tolerance}</div>
            <div style={{ display: "flex", fontSize: 96, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2, color: toleranceColor(tolerance) }}>{`%${tolerance}`}</div>
            <div style={{ display: "flex", marginTop: 10, height: 22, width: 440, borderRadius: 11, background: "#f1ddd9" }}>
              <div style={{ display: "flex", width: `${Math.max(tolerance, 4)}%`, height: 22, borderRadius: 11, background: "linear-gradient(90deg, #e0524a, #d9a21b, #3f9d6b)" }} />
            </div>
            <div style={{ display: "flex", marginTop: 40, fontSize: 36, fontWeight: 700, color: "#ae2f34" }}>@gameofus.app</div>
          </div>
        </div>
      ),
      { width: 1200, height: 630, fonts, headers: { "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable" } },
    );
  }

  const cell = 124;
  const gap = 14;

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
        {packLabel && (
          <div style={{ display: "flex", flexShrink: 0, marginTop: 10, fontSize: 30, fontWeight: 500, color: "#584140" }}>{packLabel}</div>
        )}

        <div style={{ display: "flex", flexShrink: 0, marginTop: 28, fontSize: 76, fontWeight: 700, lineHeight: 1.1, textAlign: "center", letterSpacing: -2, justifyContent: "center" }}>
          {verdict.title}
        </div>
        <div style={{ display: "flex", flexShrink: 0, marginTop: 22, fontSize: 34, fontWeight: 500, lineHeight: 1.3, textAlign: "center", justifyContent: "center", color: "#584140", maxWidth: 880 }}>
          {verdict.line}
        </div>

        {/* Küçük ızgara + sayılar + tolerans yan yana */}
        <div style={{ display: "flex", flexShrink: 0, alignItems: "center", marginTop: 44, gap: 56 }}>
          <div style={{ display: "flex", flexWrap: "wrap", width: cell * 3 + gap * 2, gap, flexShrink: 0 }}>
            {flags.map((f, i) => (
              <div
                key={i}
                style={{
                  width: cell,
                  height: cell,
                  borderRadius: 30,
                  background: COLORS[f],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 10px 22px rgba(43,21,20,0.14)",
                }}
              >
                <Glyph flag={f} size={62} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", flexShrink: 0, width: 440 }}>
            <div style={{ display: "flex", gap: 34 }}>
              {(["green", "yellow", "red"] as Flag[]).map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ display: "flex", width: 28, height: 28, borderRadius: 14, background: COLORS[f] }} />
                  <div style={{ display: "flex", fontSize: 56, fontWeight: 700 }}>{counts[f]}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", marginTop: 26, fontSize: 28, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#584140" }}>
              {t.result.tolerance}
            </div>
            <div style={{ display: "flex", marginTop: 2, fontSize: 124, fontWeight: 700, lineHeight: 1.05, letterSpacing: -3, color: toleranceColor(tolerance) }}>
              {`%${tolerance}`}
            </div>
            <div style={{ display: "flex", position: "relative", marginTop: 14, width: 440, height: 40 }}>
              <div style={{ display: "flex", position: "absolute", top: 8, left: 0, width: 440, height: 24, borderRadius: 12, background: "#f1ddd9" }} />
              <div style={{ display: "flex", position: "absolute", top: 8, left: 0, width: Math.max(Math.round(4.4 * tolerance), 18), height: 24, borderRadius: 12, background: "linear-gradient(90deg, #e0524a, #d9a21b, #3f9d6b)" }} />
              <div
                style={{
                  display: "flex",
                  position: "absolute",
                  top: 0,
                  left: Math.min(Math.max(Math.round(4.4 * tolerance), 20), 420) - 20,
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  background: "#ffffff",
                  border: `7px solid ${toleranceColor(tolerance)}`,
                  boxShadow: "0 4px 10px rgba(43,21,20,0.25)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Her bayraktan bir soru + cevap */}
        {picks.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", flexShrink: 0, width: 900, marginTop: 44, gap: 18 }}>
            {picks.map((p, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexShrink: 0,
                  alignItems: "stretch",
                  borderRadius: 28,
                  background: "#ffffff",
                  boxShadow: "0 8px 22px rgba(43,21,20,0.10)",
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", flexShrink: 0, width: 16, background: COLORS[p.flag] }} />
                <div style={{ display: "flex", flexDirection: "column", flexShrink: 0, flexGrow: 1, width: 0, padding: "22px 30px", gap: 10 }}>
                  <div style={{ display: "flex", flexShrink: 0, fontSize: 30, fontWeight: 500, lineHeight: 1.3, color: "#2b1514" }}>{p.text}</div>
                  <div style={{ display: "flex", flexShrink: 0, alignItems: "center", gap: 12 }}>
                    <div style={{ display: "flex", width: 20, height: 20, borderRadius: 10, background: COLORS[p.flag] }} />
                    <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: COLORS[p.flag] }}>{t.flags[p.flag].label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

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
