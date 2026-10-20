// Groq ile tek bir çağrının HAM istek/yanıtını gösterir (öğrenme amaçlı; Authorization başlığı gizlenir).
//   node --no-warnings --env-file=.env scripts/ai-show-exchange.mjs [--lang tr] [--seed 1] > çıktı.json
import { buildDigest } from "../lib/ai/digest.ts";
import { buildMessages } from "../lib/ai/prompt.ts";
import { COMMENTARY_JSON_SCHEMA } from "../lib/ai/schema.ts";
import { buildFakeRoom } from "./ai/fake-room.mjs";

const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => (a.startsWith("--") ? [a.slice(2), all[i + 1]] : null)).filter(Boolean));
const digest = buildDigest(await buildFakeRoom({ lang: args.lang ?? "tr", relationshipType: "friend", seed: Number(args.seed ?? 1) }));

const url = "https://api.groq.com/openai/v1/chat/completions";
const body = {
  model: "openai/gpt-oss-120b",
  messages: buildMessages(digest),
  max_completion_tokens: 1800,
  temperature: 0.7,
  reasoning_effort: "low",
  response_format: { type: "json_schema", json_schema: { name: COMMENTARY_JSON_SCHEMA.name, strict: true, schema: COMMENTARY_JSON_SCHEMA.schema } },
};

const res = await fetch(url, {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const responseJson = await res.json();
const headers = Object.fromEntries([...res.headers].filter(([k]) => k.startsWith("x-ratelimit") || k === "content-type"));

console.log(JSON.stringify({
  request: { method: "POST", url, headers: { Authorization: "Bearer gsk_••••••••", "Content-Type": "application/json" }, body },
  response: { status: res.status, headers, body: responseJson },
}, null, 2));
