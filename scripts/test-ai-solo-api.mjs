// Solo AI analiz entegrasyon testi (gerçek Supabase + çalışan sunucu). Sunucu şöyle başlatılmalı (test sağlayıcısına izin verir):
//   AI_ALLOW_TEST_OVERRIDE=1 npx next dev -p 3001        sonra:   BASE=http://localhost:3001 node --no-warnings scripts/test-ai-solo-api.mjs
// Gerçek modele GİTMEZ: her istek `x-ai-test-specs: fake:...` ile test sağlayıcısını seçer. Geçici kullanıcı/oturum açar, sonunda siler.
// Önkoşul: supabase/migrations/20260617000000_ai_solo_analysis.sql uygulanmış olmalı.
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(readFileSync(".env", "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const BASE = process.env.BASE ?? "http://localhost:3001";
const stamp = Date.now();
let fails = 0;
const ok = (c, m) => { console.log((c ? "✔ " : "✗ ") + m); if (!c) fails++; };
const ipKey = (ip) => crypto.createHash("sha256").update(ip).digest("hex").substring(0, 32);
const usedKeys = new Set();
let ipSeq = 0;
const newIp = () => `198.53.${stamp % 250}.${(++ipSeq % 250) + 1}`;
const users = [];
const webSessions = [];

async function call(method, path, { jwt, token, body, specs } = {}) {
  const ip = newIp();
  const headers = { "Content-Type": "application/json", "x-forwarded-for": ip };
  if (jwt) headers.Authorization = `Bearer ${jwt}`; else if (token) headers.Authorization = `Bearer ${token}`;
  if (specs) headers["x-ai-test-specs"] = specs;
  usedKeys.add(ipKey(ip));
  const r = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, json: await r.json().catch(() => null) };
}
const mkUser = async (tag) => {
  const email = `test-aisolo-${tag}-${stamp}@example.com`, password = `Pw-${stamp}-${tag}!`;
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true }); if (error) throw error;
  const cl = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const { data: s } = await cl.auth.signInWithPassword({ email, password });
  usedKeys.add(`u:${data.user.id}`);
  const u = { id: data.user.id, jwt: s.session.access_token };
  users.push(u); return u;
};
const coins = async (u) => (await db.from("users").select("room_credits").eq("id", u.id).single()).data.room_credits;
const setCoins = (u, n) => db.from("users").update({ room_credits: n }).eq("id", u.id);
const consent = (u) => call("POST", "/api/users/ai-consent", { jwt: u.jwt, body: { version: "test-v1" } });
const rowsOf = async (sid) => (await db.from("ai_solo_analyses").select("*").eq("session_id", sid).order("attempt")).data;
const txOf = async (u, sid) => (await db.from("credit_transactions").select("reason, delta, ref_id").eq("user_id", u.id).like("ref_id", `${sid}:%`)).data;

// Red Flag oturumu aç; completeWith = bayrak dizisi (9) → tamamla. mobile=false → anonim web oturumu
const FLAG = { G: "green", Y: "yellow", R: "red" };
async function soloSession(user, { complete = "GRGYGYRYR", mobile = true } = {}) {
  const st = await call("POST", "/api/solo/red-flag/start", { jwt: mobile ? user.jwt : undefined, body: { platform: mobile ? "mobile" : "web", pack: "friend-101", locale: "tr" } });
  if (st.status !== 201) throw new Error("start failed " + JSON.stringify(st.json));
  const { sessionId, token, scenarios } = st.json;
  if (!mobile) webSessions.push(sessionId);
  if (complete) {
    const answers = Object.fromEntries(scenarios.map((s, i) => [s.id, FLAG[complete[i]]]));
    const done = await call("POST", `/api/solo/${sessionId}/complete`, { body: { participantToken: token, answers } });
    if (done.status !== 200) throw new Error("complete failed " + JSON.stringify(done.json));
  }
  return { id: sessionId, token };
}

try {
  const A = await mkUser("a"), B = await mkUser("b"), C = await mkUser("c"), D = await mkUser("d");
  const P = async (sid, u, specs, { keepLimits = false } = {}) => {
    if (!keepLimits) await db.from("rate_limits").delete().eq("key", `u:${u.id}`);
    return call("POST", `/api/solo/${sid}/ai-analysis`, { jwt: u.jwt, specs });
  };
  const G = (sid, u) => call("GET", `/api/solo/${sid}/ai-analysis`, { jwt: u.jwt });
  await setCoins(A, 5000); await setCoins(B, 5000);

  const s1 = await soloSession(A);
  // ── Kimlik ve sahiplik ──────────────────────────────────────────────────────
  let r = await call("GET", `/api/solo/${s1.id}/ai-analysis`, { token: s1.token });
  ok(r.status === 403 && r.json?.error?.code === "AI_MOBILE_ONLY", "oturum token'ı ile GET → 403 AI_MOBILE_ONLY");
  r = await call("POST", `/api/solo/${s1.id}/ai-analysis`);
  ok(r.status === 403 && r.json?.error?.code === "AI_MOBILE_ONLY", "kimliksiz POST → 403 AI_MOBILE_ONLY");
  r = await call("GET", `/api/solo/${s1.id}/ai-analysis`, { jwt: "a.b.c" });
  ok(r.status === 401 && r.json?.error?.code === "UNAUTHORIZED", "geçersiz JWT → 401");
  r = await G(s1.id, C);
  ok(r.status === 404 && r.json?.error?.code === "SESSION_NOT_FOUND", "başkasının oturumu → 404 SESSION_NOT_FOUND");
  r = await G("00000000-0000-4000-8000-0000000000aa", A);
  ok(r.status === 404, "olmayan oturum → 404");
  r = await G("not-a-uuid", A);
  ok(r.status === 404, "geçersiz kimlik → 404");
  const web = await soloSession(null, { mobile: false });
  r = await G(web.id, A);
  ok(r.status === 404 && r.json?.error?.code === "SESSION_NOT_FOUND", "anonim web solo oturumu (user_id boş) → 404, JWT'li kullanıcı da göremez");
  r = await P(web.id, A, "fake:ok");
  ok(r.status === 404, "anonim web oturumu için POST da reddedilir");

  // ── Rıza, tamamlanma, durum okuma ───────────────────────────────────────────
  r = await P(s1.id, A, "fake:ok");
  ok(r.status === 403 && r.json?.error?.code === "AI_CONSENT_REQUIRED", "rıza yok → 403 AI_CONSENT_REQUIRED");
  await consent(A); await consent(B);
  const open = await soloSession(A, { complete: null });
  r = await P(open.id, A, "fake:ok");
  ok(r.status === 409 && r.json?.error?.code === "RESULT_NOT_READY", "tamamlanmamış oturum → 409 RESULT_NOT_READY");
  r = await G(s1.id, A);
  ok(r.status === 200 && r.json?.status === "none" && r.json.purchasedByMe === false && r.json.gameType === "red_flag", "satın alınmamış: GET → 200 { status: none, gameType: red_flag }");

  // ── Yetersiz coin, başarılı satın alma, çift POST ───────────────────────────
  await setCoins(A, 50);
  r = await P(s1.id, A, "fake:ok");
  ok(r.status === 402 && r.json?.error?.code === "INSUFFICIENT_COINS", "yetersiz coin → 402");
  ok((await rowsOf(s1.id)).length === 0 && (await coins(A)) === 50, "yetersiz coin: kayıt kalmadı, bakiye değişmedi");
  await setCoins(A, 1000);
  r = await P(s1.id, A, "fake:ok");
  const content = r.json?.content;
  ok(r.status === 200 && r.json?.status === "ready" && r.json.applied === true && r.json.balance === 900 && r.json.gameType === "red_flag" && r.json.purchasedByMe === true, "başarılı satın alma: 200 ready, applied:true, bakiye 900, gameType");
  ok(content?.gameType === "red_flag" && !!content.headline && !!content.summary && Array.isArray(content.sections) && content.sections.length === 4, "içerik zarfı: gameType, headline, summary, 4 bölüm");
  ok(content?.sections.every((s) => ["bullets", "questions", "text"].includes(s.kind) && !!s.title && (s.items?.length ?? 0) > 0) && content.sections[0].title === "Rahat bölgen" && content.sections[3].id === "self_questions", "bölümler: kind + sunucuda yerelleştirilmiş başlık (tr) + items");
  ok((await coins(A)) === 900, "coin −100 (solo_ai) düşüldü");
  const rows1 = await rowsOf(s1.id);
  ok(rows1.length === 1 && rows1[0].status === "ready" && rows1[0].game === "red_flag" && rows1[0].prompt_version === "solo-v1.0" && rows1[0].consent_version === "test-v1", "kayıt: ready, game, prompt_version solo-v1.0, rıza sürümü");
  r = await P(s1.id, A, "fake:ok");
  ok(r.status === 200 && r.json?.applied === false && r.json.status === "ready" && JSON.stringify(r.json.content) === JSON.stringify(content) && (await coins(A)) === 900, "ikinci POST: coin düşmez, aynı içerik (applied:false)");
  r = await G(s1.id, A);
  ok(r.status === 200 && r.json?.status === "ready" && r.json.purchasedByMe === true && !!r.json.content && !!r.json.createdAt, "GET: ready + içerik + createdAt");

  // ── Liste ve geçmiş ─────────────────────────────────────────────────────────
  r = await call("GET", "/api/users/solo-history", { jwt: A.jwt });
  const item = r.json?.items?.find((x) => x.sessionId === s1.id);
  const openItem = r.json?.items?.find((x) => x.sessionId === open.id);
  ok(item?.aiStatus === "ready" && item?.gameType === "red_flag", "solo-history öğesi: gameType + aiStatus ready");
  ok(!openItem, "tamamlanmamış oturum solo-history'de yok");
  r = await call("GET", `/api/users/solo-history/${s1.id}`, { jwt: A.jwt });
  ok(r.status === 200 && r.json?.aiStatus === "ready" && r.json?.gameType === "red_flag", "solo-history detayı: gameType + aiStatus");
  const noAi = await soloSession(A);
  r = await call("GET", "/api/users/solo-history", { jwt: A.jwt });
  ok(r.json?.items?.find((x) => x.sessionId === noAi.id)?.aiStatus === "none", "analizi olmayan oturum: aiStatus none");
  r = await call("GET", "/api/users/ai-reports", { jwt: A.jwt });
  const rep = Array.isArray(r.json) ? r.json.find((x) => x.type === "solo" && x.sessionId === s1.id) : null;
  ok(Array.isArray(r.json) && !!rep && rep.gameType === "red_flag" && rep.pack === "friend-101" && !!rep.headline && !!rep.createdAt, "ai-reports: type:'solo' satırı (sessionId, gameType, pack, headline, createdAt)");
  ok(Array.isArray(r.json) && r.json.every((x) => x.type === "room" || x.type === "solo"), "ai-reports: tüm satırlarda type var (room | solo)");
  r = await call("GET", "/api/users/ai-reports", { jwt: C.jwt });
  ok(Array.isArray(r.json) && !r.json.some((x) => x.sessionId === s1.id), "ai-reports: başkasının solo analizi çıkmaz");

  // ── Hata → iade → yeniden deneme (yedek model) ──────────────────────────────
  const s2 = await soloSession(A);
  await setCoins(A, 1000);
  r = await P(s2.id, A, "fake:down");
  ok(r.status === 503 && r.json?.error?.code === "AI_UNAVAILABLE" && r.json.refunded === true && r.json.gameType === "red_flag", "model hatası → 503 AI_UNAVAILABLE, refunded:true");
  ok((await coins(A)) === 1000, "iade sonrası bakiye aynı");
  let rows = await rowsOf(s2.id);
  ok(rows.length === 1 && rows[0].status === "failed" && rows[0].attempt === 1, "başarısız deneme: failed, attempt 1");
  let tx = await txOf(A, s2.id);
  ok(tx.some((t) => t.reason === "solo_ai" && t.delta === -100) && tx.some((t) => t.reason === "solo_ai_refund" && t.delta === 100), "coin hareketleri: solo_ai −100 ve solo_ai_refund +100");
  r = await G(s2.id, A);
  ok(r.json?.status === "failed" && r.json.purchasedByMe === true, "GET: failed");
  r = await P(s2.id, A, "fake:rate_limit,fake:ok");
  ok(r.status === 200 && r.json?.applied === true && r.json.balance === 900, "ana model 429 → yedek model, yeniden deneme başarılı (−100)");
  rows = await rowsOf(s2.id);
  tx = await txOf(A, s2.id);
  ok(rows.length === 2 && rows[1].attempt === 2 && rows[1].status === "ready", "yeniden deneme: attempt 2, ready");
  ok(tx.some((t) => t.ref_id === `${s2.id}:2` && t.reason === "solo_ai"), "ikinci deneme yeni coin referansı kullandı (oturum:2), bedava deneme yok");

  // ── Eşzamanlı iki istek ─────────────────────────────────────────────────────
  const s3 = await soloSession(A);
  await setCoins(A, 1000);
  await db.from("rate_limits").delete().eq("key", `u:${A.id}`);
  const [x, y] = await Promise.all([P(s3.id, A, "fake:slow", { keepLimits: true }), P(s3.id, A, "fake:slow", { keepLimits: true })]);
  const st = [x.status, y.status].sort();
  ok((st[0] === 200 && st[1] === 200) || (st[0] === 200 && st[1] === 202), `eşzamanlı POST yanıtları: ${st.join(",")}`);
  rows = await rowsOf(s3.id);
  ok(rows.filter((q) => q.status === "ready" || q.status === "generating").length === 1 && 1000 - (await coins(A)) === 100, "tek aktif kayıt ve tek coin düşümü (−100)");

  // ── Takılmış (stale) kayıt ──────────────────────────────────────────────────
  const s4 = await soloSession(A);
  await setCoins(A, 1000);
  await db.rpc("apply_coins", { p_user: A.id, p_delta: -100, p_reason: "solo_ai", p_ref: `${s4.id}:1` });
  await db.from("ai_solo_analyses").insert({ session_id: s4.id, purchased_by: A.id, game: "red_flag", locale: "tr", status: "generating", attempt: 1, consent_version: "test-v1", updated_at: new Date(Date.now() - 10 * 60_000).toISOString() });
  r = await G(s4.id, A);
  rows = await rowsOf(s4.id);
  ok(r.json?.status === "failed" && rows[0].error_kind === "stale" && (await coins(A)) === 1000, "takılmış kayıt: GET → failed (stale), düşülen coin iade edildi");
  await db.from("ai_solo_analyses").insert({ session_id: s4.id, purchased_by: A.id, game: "red_flag", locale: "tr", status: "generating", attempt: 2, consent_version: "test-v1", updated_at: new Date(Date.now() - 10 * 60_000).toISOString() });
  await G(s4.id, A);
  ok((await coins(A)) === 1000, "coin düşülmemiş takılmış kayıt: iade YOK");

  // ── Desteklenmeyen oyun türü ────────────────────────────────────────────────
  const s5 = await soloSession(A);
  await db.from("solo_sessions").update({ game: "bilinmeyen_oyun" }).eq("id", s5.id);
  r = await G(s5.id, A);
  ok(r.status === 400 && r.json?.error?.code === "INVALID_PAYLOAD", "kayıtlı olmayan oyun türü: GET → temiz 400 (500 değil)");
  r = await P(s5.id, A, "fake:ok");
  ok(r.status === 400 && (await coins(A)) === 1000, "kayıtlı olmayan oyun türü: POST → 400, coin düşmez");

  // ── Hız sınırı ──────────────────────────────────────────────────────────────
  let last;
  for (let i = 0; i < 6; i++) last = await call("POST", `/api/solo/${s1.id}/ai-analysis`, { jwt: D.jwt, specs: "fake:ok" });
  ok(last.status === 429 && last.json?.error?.code === "RATE_LIMITED", "6. POST (1 dakikada) → 429 RATE_LIMITED");

  // ── Partner hesabı: başkasının satın aldığı analiz görünmez ve silme ─────────
  const sB = await soloSession(B);
  r = await P(sB.id, B, "fake:ok");
  ok(r.status === 200, "B kendi oturumu için satın aldı");
  r = await G(sB.id, A);
  ok(r.status === 404, "A, B'nin oturumunu (ve analizini) okuyamaz");
  await db.rpc("delete_user_account", { p_user: B.id });
  await db.auth.admin.deleteUser(B.id);
  ok((await rowsOf(sB.id)).length === 0, "hesap silinince solo oturumu ve analizi silindi (cascade)");
  const sessionIds = [s1.id, s2.id, s3.id, s4.id, s5.id];
  await db.rpc("delete_user_account", { p_user: A.id });
  let left = 0; for (const id of sessionIds) left += (await rowsOf(id)).length;
  ok(left === 0, "A hesabı silinince tüm solo analizleri silindi");
} catch (e) {
  console.error("TEST HATASI:", e);
  fails++;
} finally {
  for (const u of users) {
    try { await db.rpc("delete_user_account", { p_user: u.id }); } catch { /* zaten silinmiş olabilir */ }
    try { await db.auth.admin.deleteUser(u.id); } catch { /* zaten silinmiş olabilir */ }
  }
  for (const id of webSessions) await db.from("solo_sessions").delete().eq("id", id);
  await db.from("rate_limits").delete().in("key", [...usedKeys]);
  console.log(fails ? `\n${fails} test BAŞARISIZ` : "\nTüm testler geçti");
  process.exit(fails ? 1 : 0);
}
