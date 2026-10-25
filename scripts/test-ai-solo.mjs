// Solo AI analiz birim testleri (ağ ve veritabanı yok; test sağlayıcısı "fake"):  node --no-warnings scripts/test-ai-solo.mjs
import { readFileSync } from "node:fs";
import { getSoloAdapter, hasSoloAdapter, registerSoloAdapter, UnknownGameTypeError } from "../lib/ai/solo/registry.ts";
import { redFlagAdapter, profileKindOf } from "../lib/ai/solo/red-flag.ts";
import { assembleEnvelope, fakeValidOutput, outputJsonSchema, outputSchema } from "../lib/ai/solo/envelope.ts";
import { SOLO_PROMPT_VERSION, buildSoloMessages } from "../lib/ai/solo/prompt.ts";
import { generateSoloAnalysis, isSoloSoftIssue, validateSolo } from "../lib/ai/solo/generate.ts";
import { AiProviderError } from "../lib/ai/provider.ts";
import { InvalidCommentaryError } from "../lib/ai/structured.ts";
import { buildFakeSolo, PROFILES } from "./ai/fake-solo.mjs";

let fails = 0;
const ok = (c, m) => { console.log((c ? "✔ " : "✗ ") + m); if (!c) fails++; };
const rejects = async (fn, pred) => { try { await fn(); return false; } catch (e) { return pred(e); } };

// ── Registry ve genel (oyundan bağımsız) boru hattı ───────────────────────────
ok(hasSoloAdapter("red_flag") && getSoloAdapter("red_flag").gameType === "red_flag", "red_flag adaptörü kayıtlı");
ok((() => { try { getSoloAdapter("bilinmeyen"); return false; } catch (e) { return e instanceof UnknownGameTypeError && e.gameType === "bilinmeyen"; } })(), "bilinmeyen gameType → UnknownGameTypeError (temiz hata)");

// İkinci (sahte) bir oyun: yalnızca adaptör yazılır, route/tablo/şema koduna dokunulmaz
const fakeGame = {
  gameType: "fake_game",
  sections: [
    { id: "story", kind: "text", min: 0, max: 0, titles: { tr: "Hikâye", en: "Story", es: "Historia" }, instruction: "Write a short story." },
    { id: "tags", kind: "bullets", min: 1, max: 2, titles: { tr: "Etiketler", en: "Tags", es: "Etiquetas" }, instruction: "Two tags." },
  ],
  isEligible: (s) => s.status === "completed",
  loadInput: async () => ({}),
  buildDigest: () => ({ note: "sahte oyun" }),
  payload: (d) => d,
  promptNotes: () => "GAME: a fake game used only in tests.",
  quotable: () => [],
};
registerSoloAdapter(fakeGame);
ok(getSoloAdapter("fake_game") === fakeGame, "ikinci adaptör tek satırla kaydedilir");
let r = await generateSoloAnalysis(fakeGame, { note: "x" }, "en", { provider: "fake", model: "ok", strictSchema: false });
ok(r.content.gameType === "fake_game" && r.content.sections.map((s) => s.id).join() === "story,tags" && r.content.sections[0].kind === "text" && r.content.sections[0].title === "Story", "genel boru hattı sahte oyunla çalışır: zarf + yerelleştirilmiş başlık (yeni oyun için route/şema değişmez)");
const routeSrc = readFileSync("app/api/solo/[sessionId]/ai-analysis/route.ts", "utf8");
ok(!/red_flag|redFlag|red-flag/i.test(routeSrc), "route dosyasında oyuna özel hiçbir şey yok (yalnızca registry)");
ok(SOLO_PROMPT_VERSION === "solo-v1.0", "prompt sürümü solo-v1.0");

// ── Red Flag digest: 5 profil ─────────────────────────────────────────────────
const dig = (profile, over = {}) => { const { session, input } = buildFakeSolo({ profile, ...over }); return { session, input, d: redFlagAdapter.buildDigest(session, input) }; };
const expectKinds = { all_green: "all_green", all_red: "all_red", all_yellow: "all_yellow", mixed: "mixed", single_red: "green_with_single_red" };
for (const [p, kind] of Object.entries(expectKinds)) {
  const { d } = dig(p);
  ok(d && d.profile === kind && d.cards.length === 9, `profil ${p} → ${kind}`);
}
const g = dig("all_green").d, rd = dig("all_red").d, y = dig("all_yellow").d, mx = dig("mixed").d, sr = dig("single_red").d;
ok(g.counts.green === 9 && g.tolerance === 100 && rd.counts.red === 9 && rd.tolerance === 0 && y.counts.yellow === 9 && y.tolerance === 50, "sayılar ve tolerans kodda hesaplanır (yeşil 100, kırmızı 0, sarı 50)");
ok(sr.counts.green === 8 && sr.counts.red === 1, "8 yeşil + 1 kırmızı sayıları");
ok(mx.mixedThemes.length >= 1 && mx.themes.every((t) => t.green + t.yellow + t.red >= 1), "karışık profilde hem Green hem Red içeren temalar bulunur");
ok(dig("mixed", { pack: "romantic-101" }).d.context === "romantic" && mx.context === "friends", "set kategorisi = bağlam (friends / romantic)");
ok(profileKindOf({ green: 7, yellow: 1, red: 1 }) === "mostly_green" && profileKindOf({ green: 1, yellow: 1, red: 7 }) === "mostly_red" && profileKindOf({ green: 1, yellow: 7, red: 1 }) === "mostly_yellow", "ara profiller (çoğunlukla yeşil/kırmızı/sarı)");
const payload = JSON.stringify(redFlagAdapter.payload(mx));
ok(!/"(?:name|displayName|email|gender|birth|user|userId|sessionId|id|token)"/i.test(payload) && !payload.includes("fake-"), "modele giden yükte ad/cinsiyet/doğum tarihi/e-posta/kimlik YOK");
ok(redFlagAdapter.quotable(mx).length === 9 && mx.cards.every((c) => !c.scenario.includes("[object")), "alıntılanabilir metinler 9 senaryo metni");
ok(redFlagAdapter.isEligible(dig("mixed").session) && !redFlagAdapter.isEligible({ ...dig("mixed").session, status: "started" }) && !redFlagAdapter.isEligible({ ...dig("mixed").session, answers: { x: "green" } }), "uygunluk: yalnızca tamamlanmış ve 9 geçerli cevaplı oturum");

// ── Prompt ────────────────────────────────────────────────────────────────────
const msgs = buildSoloMessages(redFlagAdapter, sr, "tr");
ok(msgs[0].content.includes("all text in Turkish") && !msgs[0].content.includes("{LANGUAGE}") && ["green_zone", "red_lines", "gray_areas", "self_questions"].every((id) => msgs[0].content.includes(`"${id}"`)), "prompt: dil ve tüm bölüm kimlikleri");
ok(/exactly ONE red card/.test(msgs[0].content) && /EVERY card red/.test(buildSoloMessages(redFlagAdapter, rd, "tr")[0].content) && /EVERY card green/.test(buildSoloMessages(redFlagAdapter, g, "tr")[0].content), "prompt: ton dağılıma bağlı (8Y+1K, hepsi kırmızı, hepsi yeşil)");
ok(/NO RIGHT ANSWERS/.test(msgs[0].content) && /Never compare the player with other people/.test(msgs[0].content) && /NO NUMBERS OR GRIDS/.test(msgs[0].content), "prompt: yargısız, kıyassız, sayısız");
ok(msgs[1].role === "user" && JSON.parse(msgs[1].content).cards.length === 9, "kullanıcı yükü: 9 kart");

// ── Zarf ve şema ──────────────────────────────────────────────────────────────
const secs = redFlagAdapter.sections;
const js = outputJsonSchema(secs);
ok(js.name === "solo_analysis" && js.schema.additionalProperties === false && js.schema.required.join() === "headline,summary,green_zone,red_lines,gray_areas,self_questions", "JSON şeması strict: tüm alanlar zorunlu, ek alan yok");
const good = { headline: "Başlık", summary: "Özet.", green_zone: ["a"], red_lines: [], gray_areas: ["b"], self_questions: ["Soru bir?", "Soru iki?"] };
ok(outputSchema(secs).safeParse(good).success, "geçerli çıktı Zod'dan geçer");
ok(!outputSchema(secs).safeParse({ ...good, self_questions: ["tek"] }).success, "self_questions en az 2");
ok(!outputSchema(secs).safeParse({ ...good, green_zone: ["1", "2", "3", "4", "5"] }).success, "üst sınır (≤ 4) şemada zorlanır");
ok(!outputSchema(secs).safeParse({ ...good, extra: 1 }).success, "fazladan alan reddedilir");
const env = assembleEnvelope(redFlagAdapter, "tr", good);
ok(env.gameType === "red_flag" && env.sections.map((s) => s.id).join() === "green_zone,gray_areas,self_questions", "zarf: boş bölüm (red_lines) dahil edilmez, sıra korunur");
ok(env.sections[0].title === "Rahat bölgen" && assembleEnvelope(redFlagAdapter, "en", good).sections[0].title === "Your comfort zone" && assembleEnvelope(redFlagAdapter, "es", good).sections[2].title === "Pregúntate", "başlıklar sunucuda oturum diline göre (tr/en/es)");
ok(env.sections[2].kind === "questions" && env.sections[0].kind === "bullets" && Array.isArray(env.sections[2].items), "bölüm türleri (kind) ve items");
const norm = redFlagAdapter.normalize({ ...good, red_lines: ["uydurma"], green_zone: ["uydurma"] }, { counts: { green: 0, yellow: 2, red: 0 } });
ok(norm.red_lines.length === 0 && norm.green_zone.length === 0 && norm.gray_areas.length === 1, "normalize: kartı olmayan bayrak bölümü boşaltılır (kırmızı yoksa red_lines yok)");

// ── Doğrulama ve korumalar ────────────────────────────────────────────────────
const V = (patch, locale = "tr") => validateSolo(redFlagAdapter, mx, locale, JSON.stringify({ ...good, ...patch }));
const quote = mx.cards[0].scenario;
ok(V({}).ok === true, "temiz çıktı geçer");
const clamped = V({ gray_areas: ["bir", "iki", "üç", "dört", "beş", "altı"] });
ok(clamped.ok === true && clamped.content.gray_areas.length === 4, "üst sınırı aşan liste düzeltme turu harcamadan ilk 4'e kırpılır");
ok(!V({ summary: "Yüzde 70 rahatsın, %70." }).ok, "yüzde reddedilir");
ok(!V({ summary: "Çoğu insan senin gibi düşünmez." }).ok && !V({ summary: "Başka insanlara göre daha esnek." }).ok && !V({ summary: "Most people would disagree." }, "en").ok, "başkalarıyla/ortalamayla kıyas reddedilir (tr/en)");
ok(!V({ summary: "Bu sağlıksız bir tolerans." }).ok && !V({ summary: "Aşırı katı bir profilin var." }).ok, "'sağlıksız / aşırı katı' etiketleri reddedilir");
const withNum = V({ summary: "Dokuz kartın 3'ünde kırmızı seçtin." });
ok(!withNum.ok && withNum.issues.every(isSoloSoftIssue), "metinde rakam yasak (uygulama çizer) ve 'yumuşak' sorun");
ok(!V({ summary: "🔴🟡🟢 ızgara." }).ok, "emoji bayrak ızgarası reddedilir");
ok(V({ summary: `“${quote}” kartında rahat kaldın.` }).ok === true, "senaryo metni BİREBİR alıntılanırsa geçer");
const part = quote.split(" ").slice(0, 6).join(" ");
ok(V({ summary: `“${part}” kartında rahat kaldın.` }).ok === true, "kısaltılmış ama bitişik ve birebir alıntı geçer");
const badQuote = V({ summary: "“Arkadaşın para borcunu hediyeyle geri veriyor, ayrıca teşekkür ediyor” kartında rahat kaldın." });
ok(!badQuote.ok && badQuote.issues.some((i) => /quoted text/.test(i)), "sözcüğü değiştirilmiş alıntı yakalanır");
ok(V({ summary: "Ortak zemin bulmak sana iyi geliyor." }).ok === false, "klişe ('ortak zemin') yakalanır");
ok(!V({ summary: "Burcunun etkisi var." }).ok, "burç/astroloji sözcüğü reddedilir");

// ── Üretim boru hattı (test sağlayıcısı) ──────────────────────────────────────
const base = { provider: "fake", strictSchema: false };
r = await generateSoloAnalysis(redFlagAdapter, mx, "tr", { ...base, model: "ok" });
ok(r.meta.attempts === 1 && r.meta.promptVersion === "solo-v1.0" && r.content.sections.length >= 2 && r.content.gameType === "red_flag", "geçerli çıktı ilk denemede kabul, prompt sürümü kayıtlı");
r = await generateSoloAnalysis(redFlagAdapter, mx, "tr", { ...base, model: "repairable" });
ok(r.meta.attempts === 2, "bozuk çıktı bir kez düzeltilir");
r = await generateSoloAnalysis(redFlagAdapter, mx, "tr", { ...base, model: "cliche" });
ok(r.meta.attempts === 2 && r.content.summary.includes("Ortak zemin"), "yalnızca yumuşak sorun kalırsa içerik kabul edilir");
ok(await rejects(() => generateSoloAnalysis(redFlagAdapter, mx, "tr", { ...base, model: "percent" }), (e) => e instanceof InvalidCommentaryError), "sert sorun (yüzde) düzeltmeden sonra da sürerse reddedilir");
ok(await rejects(() => generateSoloAnalysis(redFlagAdapter, mx, "tr", { ...base, model: "invalid" }), (e) => e instanceof InvalidCommentaryError), "hep bozuksa InvalidCommentaryError");
ok(await rejects(() => generateSoloAnalysis(redFlagAdapter, mx, "tr", { ...base, model: "rate_limit_long" }), (e) => e instanceof AiProviderError && e.kind === "rate_limited"), "sağlayıcı hataları üst katmana çıkar (yedek/iade kararı için)");
ok(Object.keys(PROFILES).length === 5, "5 test profili tanımlı");
const fv = fakeValidOutput(secs);
ok(outputSchema(secs).safeParse(fv).success && !/\d/.test(JSON.stringify(fv)), "test sağlayıcısının örnek çıktısı şemaya uyar (rakamsız)");

console.log(fails ? `\n${fails} test BAŞARISIZ` : "\nTüm testler geçti");
process.exit(fails ? 1 : 0);
