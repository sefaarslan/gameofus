// AI yorum oyun alanı: UYDURMA bir odayı modele gönderir, çıktıyı ve kullanımı gösterir.
//   node --no-warnings --env-file=.env scripts/ai-playground.mjs [--provider groq|openrouter] [--model <ad>]
//        [--lang tr|en|es] [--type friend|dating|partner] [--seed 1] [--effort low|medium|high]
//        [--max-tokens 1800] [--show-prompt] [--strict] [--no-signs] [--name-a <ad>]  (--no-signs: burçsuz karşılaştırma; --strict: sağlayıcıda şemaya zorla; --name-a: prompt enjeksiyonu denemesi için)
// Gerçek kullanıcı verisi KULLANMAZ; veritabanına bağlanmaz.
import { AiProviderError } from "../lib/ai/provider.ts";
import { generateCommentary, InvalidCommentaryError } from "../lib/ai/generate.ts";
import { buildDigest } from "../lib/ai/digest.ts";
import { buildMessages, promptPayload, PROMPT_VERSION } from "../lib/ai/prompt.ts";
import { buildFakeRoom } from "./ai/fake-room.mjs";

const args = Object.fromEntries(
  process.argv.slice(2).map((a, i, all) => (a.startsWith("--") ? [a.slice(2), all[i + 1]?.startsWith("--") || all[i + 1] === undefined ? true : all[i + 1]] : null)).filter(Boolean),
);

const provider = args.provider ?? "groq";
const DEFAULT_MODEL = { groq: "openai/gpt-oss-120b", openrouter: "google/gemma-4-31b-it:free" };
const model = args.model ?? DEFAULT_MODEL[provider];
const lang = args.lang ?? "tr";
const relationshipType = args.type ?? "friend";
const seed = Number(args.seed ?? 1);

const raw = await buildFakeRoom({ lang, relationshipType, seed, signs: !args["no-signs"] });
if (typeof args["name-a"] === "string") raw.nameA = args["name-a"];
const room = buildDigest(raw);
const messages = buildMessages(room);

if (args["show-prompt"]) {
  console.log("── SİSTEM PROMPT ──\n" + messages[0].content + "\n\n── KULLANICI (veri) ──\n" + JSON.stringify(promptPayload(room), null, 2) + "\n");
}

console.log(`Sağlayıcı: ${provider} | Model: ${model} | Dil: ${lang} | Tür: ${relationshipType} | Tohum: ${seed} | Prompt: ${PROMPT_VERSION}`);
const sm = room.summary;
const [pa, pb] = room.players;
if (room.profiles) console.log(`Profil (modele giden): ${JSON.stringify(room.profiles)}`);
console.log(`Özet (kodda hesaplandı): okuma skoru ${pa}: ${sm.readingScore[pa]} | ${pb}: ${sm.readingScore[pb]} | daha iyi okuyan: ${sm.betterReader} | cevaplar aynı/yakın/farklı: ${sm.sameCount}/${sm.closeCount}/${sm.differentCount}`);
console.log(`Öne çıkanlar: ortak ${JSON.stringify(room.highlights.shared)} | farklı ${JSON.stringify(room.highlights.different)} | emin-ıska ${JSON.stringify(room.highlights.confidentMisses)} | ikisi de doğru ${JSON.stringify(room.highlights.bothReadCorrectly)}\n`);

try {
  const res = await generateCommentary(room, {
    provider,
    model,
    maxTokens: Number(args["max-tokens"] ?? 1800),
    reasoningEffort: args.effort ?? (model.includes("gpt-oss") ? "low" : undefined),
    strictSchema: Boolean(args.strict) || (provider === "groq" && model.includes("gpt-oss")),
    // Ücretsiz OpenRouter uçları isteği kaydedebilir → burada YALNIZCA uydurma veri olduğu için izin veriyoruz.
    dataCollection: provider === "openrouter" ? "allow" : undefined,
    timeoutMs: 60_000,
  });
  const c = res.content;
  const bullets = (list) => list.map((x) => `  • ${x}`).join("\n");
  console.log(`\n${c.headline}\n\n${c.summary}\n\nBirlikte iyi olduğunuz yönler:\n${bullets(c.strengths)}\n\nMerak edilebilecekler:\n${bullets(c.blindSpots)}\n\nKonuşma başlatıcılar:\n${bullets(c.conversationStarters)}\n`);
  const m = res.meta;
  console.log("── ÖLÇÜLER ──");
  console.log(`süre: ${(m.latencyMs / 1000).toFixed(1)} sn | deneme: ${m.attempts} | model: ${m.model} | prompt: ${m.promptVersion}`);
  console.log(`token → girdi: ${m.promptTokens} | çıktı: ${m.completionTokens} | toplam: ${m.totalTokens}`);
} catch (err) {
  if (err instanceof AiProviderError) {
    console.error(`✗ ${err.kind}${err.status ? ` (${err.status})` : ""}: ${err.message}${err.retryAfterMs ? ` | ${err.retryAfterMs} ms sonra tekrar dene` : ""}`);
    process.exit(1);
  }
  if (err instanceof InvalidCommentaryError) {
    console.error(`✗ geçersiz çıktı (yeniden denemeler tükendi): ${err.issues.join(" | ")}`);
    process.exit(2);
  }
  throw err;
}
