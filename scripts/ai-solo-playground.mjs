// Solo AI analiz oyun alanı: UYDURMA bir Red Flag oturumunu modele gönderir, çıktıyı ve kullanımı gösterir.
//   node --no-warnings --env-file=.env scripts/ai-solo-playground.mjs [--profile all_green|all_red|all_yellow|mixed|single_red]
//        [--pack friend-101|romantic-101…] [--lang tr|en|es] [--provider groq|openrouter] [--model <ad>] [--effort low|medium|high]
//        [--show-prompt] [--flags GRYGGRYGR]
// Gerçek kullanıcı verisi KULLANMAZ; veritabanına bağlanmaz.
import { AiProviderError } from "../lib/ai/provider.ts";
import { InvalidCommentaryError } from "../lib/ai/structured.ts";
import { generateSoloAnalysis } from "../lib/ai/solo/generate.ts";
import { buildSoloMessages } from "../lib/ai/solo/prompt.ts";
import { getSoloAdapter } from "../lib/ai/solo/registry.ts";
import { buildFakeSolo } from "./ai/fake-solo.mjs";

const args = Object.fromEntries(
  process.argv.slice(2).map((a, i, all) => (a.startsWith("--") ? [a.slice(2), all[i + 1]?.startsWith("--") || all[i + 1] === undefined ? true : all[i + 1]] : null)).filter(Boolean),
);
const provider = args.provider ?? "groq";
const model = args.model ?? (provider === "groq" ? "openai/gpt-oss-120b" : "google/gemma-4-31b-it:free");
const locale = args.lang ?? "tr";

const adapter = getSoloAdapter("red_flag");
const { session, input } = buildFakeSolo({ pack: args.pack ?? "friend-101", locale, profile: args.profile ?? "mixed", flags: typeof args.flags === "string" ? args.flags : undefined });
const digest = adapter.buildDigest(session, input);

if (args["show-prompt"]) {
  const m = buildSoloMessages(adapter, digest, locale);
  console.log("── SİSTEM ──\n" + m[0].content + "\n\n── KULLANICI (veri) ──\n" + JSON.stringify(adapter.payload(digest), null, 2) + "\n");
}
console.log(`Model: ${provider}:${model} | Dil: ${locale} | Set: ${session.pack_key} | Profil: ${digest.profile} | G/Y/R: ${digest.counts.green}/${digest.counts.yellow}/${digest.counts.red}\n`);

try {
  const res = await generateSoloAnalysis(adapter, digest, locale, {
    provider,
    model,
    maxTokens: Number(args["max-tokens"] ?? 2000),
    reasoningEffort: args.effort ?? (model.includes("gpt-oss") ? "low" : undefined),
    strictSchema: provider === "groq" && model.includes("gpt-oss"),
    dataCollection: provider === "openrouter" ? "allow" : undefined,
    timeoutMs: 60_000,
  });
  const c = res.content;
  console.log(`${c.headline}\n\n${c.summary}\n`);
  for (const s of c.sections) console.log(`${s.title}:\n${(s.items ?? [s.text]).map((x) => `  • ${x}`).join("\n")}\n`);
  const m = res.meta;
  console.log("── ÖLÇÜLER ──");
  console.log(`süre: ${(m.latencyMs / 1000).toFixed(1)} sn | deneme: ${m.attempts} | model: ${m.model} | prompt: ${m.promptVersion}`);
  console.log(`token → girdi: ${m.promptTokens} | çıktı: ${m.completionTokens} | toplam: ${m.totalTokens}`);
} catch (err) {
  if (err instanceof AiProviderError) {
    console.error(`✗ ${err.kind}${err.status ? ` (${err.status})` : ""}: ${err.message}`);
    process.exit(1);
  }
  if (err instanceof InvalidCommentaryError) {
    console.error(`✗ geçersiz çıktı: ${err.issues.join(" | ")}`);
    process.exit(2);
  }
  throw err;
}
