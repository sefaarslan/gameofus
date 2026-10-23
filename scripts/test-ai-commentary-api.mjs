// AI yorum entegrasyon testi (gerçek Supabase + çalışan sunucu). Sunucu şöyle başlatılmalı (test sağlayıcısına izin verir):
//   AI_ALLOW_TEST_OVERRIDE=1 npx next dev -p 3001        sonra:   BASE=http://localhost:3001 node --no-warnings scripts/test-ai-commentary-api.mjs
// Gerçek modele GİTMEZ: her istek `x-ai-test-specs: fake:...` ile test sağlayıcısını seçer. Geçici kullanıcı/oda açar, sonunda siler.
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
const newIp = () => `198.52.${stamp % 250}.${(++ipSeq % 250) + 1}`;
const users = [];
const rooms = [];

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
  const email = `test-ai-${tag}-${stamp}@example.com`, password = `Pw-${stamp}-${tag}!`;
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true }); if (error) throw error;
  const cl = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const { data: s } = await cl.auth.signInWithPassword({ email, password });
  usedKeys.add(`u:${data.user.id}`);
  const u = { id: data.user.id, jwt: s.session.access_token };
  users.push(u); return u;
};
const coins = async (u) => (await db.from("users").select("room_credits").eq("id", u.id).single()).data.room_credits;
const setCoins = (u, n) => db.from("users").update({ room_credits: n }).eq("id", u.id);
const rowsOf = async (code) => {
  const { data: room } = await db.from("rooms").select("id").eq("room_code", code).single();
  return (await db.from("ai_commentaries").select("*").eq("room_id", room.id).order("attempt")).data;
};
const txOf = async (u, code) => (await db.from("credit_transactions").select("reason, delta, ref_id").eq("user_id", u.id).like("ref_id", `${code}:%`)).data;
const consent = (u) => call("POST", "/api/users/ai-consent", { jwt: u.jwt, body: { version: "test-v1" } });

// Bir odayı sonuna kadar oynatır (secret_choice, 5 soru). guest: { jwt } (mobil) ya da { web: true } (anonim web misafiri)
async function playRoom(owner, guest) {
  await setCoins(owner, 5000);
  const c = await call("POST", "/api/rooms/create", { jwt: owner.jwt, body: { platform: "mobile", displayName: "TEST-A", locale: "tr", relationshipType: "dating", gameMode: "secret_choice", questionCount: 5 } });
  if (c.status !== 201) throw new Error("create failed " + JSON.stringify(c.json));
  const code = c.json.roomCode; rooms.push(code);
  const j = await call("POST", `/api/rooms/${code}/join`, guest.web ? { body: { displayName: "TEST-B" } } : { jwt: guest.jwt, body: { platform: "mobile", displayName: "TEST-B" } });
  if (j.status !== 200) throw new Error("join failed " + JSON.stringify(j.json));
  const guestAuth = guest.web ? { token: j.json.participant.token } : { jwt: guest.jwt };
  const st = await call("GET", `/api/rooms/${code}/state`, { jwt: owner.jwt });
  for (const [auth, who] of [[{ jwt: owner.jwt }, "owner"], [guestAuth, "guest"]]) {
    for (const q of st.json.questions) {
      const s = await call("POST", `/api/rooms/${code}/submit-turn`, { ...auth, body: { questionId: q.questionId, answerValue: { value: "yes" }, predictedValue: { value: who === "owner" ? "no" : "yes" }, confidenceLevel: "sure" } });
      if (s.status !== 200) throw new Error("submit failed " + JSON.stringify(s.json));
    }
    const done = await call("POST", `/api/rooms/${code}/complete`, { ...auth, body: {} });
    if (done.status !== 200) throw new Error("complete failed " + JSON.stringify(done.json));
  }
  return { code, guestAuth };
}

try {
  const A = await mkUser("a"), B = await mkUser("b"), C = await mkUser("c"), D = await mkUser("d");
  // Hız sınırı testi dışında, kullanıcının sayaçlarını her çağrıdan önce sıfırla (yoksa dakikada 5 POST sınırına takılırız)
  const P = async (code, u, specs, { keepLimits = false } = {}) => {
    if (!keepLimits) await db.from("rate_limits").delete().eq("key", `u:${u.id}`);
    return call("POST", `/api/rooms/${code}/ai-commentary`, { jwt: u.jwt, specs });
  };
  const G = (code, u) => call("GET", `/api/rooms/${code}/ai-commentary`, { jwt: u.jwt });

  // ── Kimlik: yalnızca JWT ───────────────────────────────────────────────────
  const tokenOnly = await call("GET", "/api/rooms/ABCDEF/ai-commentary", { token: "a".repeat(64) });
  ok(tokenOnly.status === 403 && tokenOnly.json?.error?.code === "AI_MOBILE_ONLY", "katılımcı token'ı ile GET → 403 AI_MOBILE_ONLY");
  const noAuth = await call("POST", "/api/rooms/ABCDEF/ai-commentary");
  ok(noAuth.status === 403 && noAuth.json?.error?.code === "AI_MOBILE_ONLY", "kimliksiz POST → 403 AI_MOBILE_ONLY");
  const badJwt = await call("GET", "/api/rooms/ABCDEF/ai-commentary", { jwt: "a.b.c" });
  ok(badJwt.status === 401 && badJwt.json?.error?.code === "UNAUTHORIZED", "geçersiz JWT → 401 UNAUTHORIZED");
  const unknown = await G("ZZZZZ2", A);
  ok(unknown.status === 403 && unknown.json?.error?.code === "INVALID_TOKEN", "olmayan oda (geçerli JWT) → 403 INVALID_TOKEN");

  // ── Oda 1: rıza, hazır değil, yetersiz coin, başarılı satın alma ─────────────
  await setCoins(A, 5000);
  const c1 = await call("POST", "/api/rooms/create", { jwt: A.jwt, body: { platform: "mobile", displayName: "TEST-A", locale: "tr", relationshipType: "dating", gameMode: "secret_choice", questionCount: 5 } });
  const code1 = c1.json.roomCode; rooms.push(code1);
  let r = await P(code1, A, "fake:ok");
  ok(r.status === 403 && r.json?.error?.code === "AI_CONSENT_REQUIRED", "rıza yok → 403 AI_CONSENT_REQUIRED");
  r = await call("POST", "/api/users/ai-consent", { jwt: A.jwt, body: { version: "kötü sürüm!" } });
  ok(r.status === 400, "geçersiz rıza sürümü → 400");
  r = await consent(A); ok(r.status === 200 && r.json?.ok === true, "rıza kaydedildi");
  r = await call("GET", "/api/users/me", { jwt: A.jwt });
  ok(r.json?.aiConsent?.version === "test-v1" && !!r.json.aiConsent.at, "GET /users/me → aiConsent { version, at }");
  r = await P(code1, A, "fake:ok");
  ok(r.status === 409 && r.json?.error?.code === "RESULT_NOT_READY", "sonuç hazır değil → 409 RESULT_NOT_READY");
  await consent(C);
  r = await P(code1, C, "fake:ok");
  ok(r.status === 403 && r.json?.error?.code === "INVALID_TOKEN", "odanın katılımcısı olmayan (geçerli JWT) → 403 INVALID_TOKEN");
  r = await G(code1, A);
  ok(r.status === 200 && r.json?.status === "none" && r.json?.purchasedByMe === false, "satın alınmamış oda: GET → 200 { status: none }");

  const g1 = await playRoom(A, B); // yeni oda (oda 1 oyun tamamlanmadan kullanıldı); aşağıda oda 2 olarak kullanılır
  const code2 = g1.code;
  await consent(B);
  await setCoins(A, 50);
  r = await P(code2, A, "fake:ok");
  ok(r.status === 402 && r.json?.error?.code === "INSUFFICIENT_COINS", "yetersiz coin → 402 INSUFFICIENT_COINS");
  ok((await rowsOf(code2)).length === 0 && (await coins(A)) === 50, "yetersiz coin: kayıt kalmadı, bakiye değişmedi");

  await setCoins(A, 1000);
  r = await P(code2, A, "fake:ok");
  ok(r.status === 200 && r.json?.status === "ready" && r.json.applied === true && r.json.balance === 900, "başarılı satın alma: 200 ready, applied:true, bakiye 900");
  ok(r.json?.content?.strengths?.length === 3 && !!r.json.content.headline, "içerik şemaya uygun (headline + 3 strengths…)");
  ok((await coins(A)) === 900, "coin −100 düşüldü");
  const bBefore = await coins(B);
  r = await G(code2, B);
  ok(r.status === 200 && r.json?.status === "ready" && r.json.purchasedByMe === false && !!r.json.content, "partner GET: ücretsiz okur, purchasedByMe:false");
  r = await P(code2, B, "fake:ok");
  ok(r.status === 200 && r.json?.applied === false && (await coins(B)) === bBefore, "partner POST: applied:false, coin düşmez");
  r = await call("GET", "/api/users/ai-reports", { jwt: A.jwt });
  ok(Array.isArray(r.json) && r.json.length === 1 && r.json[0].roomCode === code2 && !!r.json[0].headline && r.json[0].partnerName === "TEST-B", "ai-reports: satın alanın listesinde 1 kayıt (düz dizi)");
  r = await call("GET", "/api/users/ai-reports", { jwt: B.jwt });
  ok(Array.isArray(r.json) && r.json.length === 0, "ai-reports: partnerin listesinde yok");
  r = await call("GET", "/api/users/ai-reports");
  ok(r.status === 401, "ai-reports JWT'siz → 401");

  // ── Oda 3: hata → iade → yeniden deneme (yedek model) ───────────────────────
  const g3 = await playRoom(A, B); const code3 = g3.code;
  await setCoins(A, 1000);
  r = await P(code3, A, "fake:down");
  ok(r.status === 503 && r.json?.error?.code === "AI_UNAVAILABLE" && r.json.refunded === true, "model hatası → 503 AI_UNAVAILABLE, refunded:true");
  ok((await coins(A)) === 1000, "iade sonrası bakiye aynı (1000)");
  let rows = await rowsOf(code3);
  ok(rows.length === 1 && rows[0].status === "failed" && rows[0].attempt === 1, "başarısız deneme kaydı: failed, attempt 1");
  let tx = await txOf(A, code3);
  ok(tx.some((t) => t.reason === "ai_commentary" && t.delta === -100) && tx.some((t) => t.reason === "ai_commentary_refund" && t.delta === 100), "coin hareketleri: −100 ve +100 (iade)");
  r = await P(code3, A, "fake:rate_limit,fake:ok");
  ok(r.status === 200 && r.json?.applied === true && r.json.balance === 900, "ana model 429 → yedek model devreye girdi, başarılı");
  rows = await rowsOf(code3);
  ok(rows.length === 2 && rows[1].attempt === 2 && rows[1].status === "ready" && String(rows[1].model).includes("ok"), "yeniden deneme: attempt 2, ready, yedek modelin adı kayıtlı");
  tx = await txOf(A, code3);
  ok(tx.some((t) => t.ref_id === `${code3}:2` && t.reason === "ai_commentary"), "ikinci deneme farklı coin referansı kullandı (oda:2)");

  // ── Oda 4: eşzamanlı iki POST → tek üretim, tek coin düşümü ────────────────
  const g4 = await playRoom(A, B); const code4 = g4.code;
  await setCoins(A, 1000); await setCoins(B, 1000);
  await db.from("rate_limits").delete().in("key", [`u:${A.id}`, `u:${B.id}`]);
  const [x, y] = await Promise.all([P(code4, A, "fake:slow", { keepLimits: true }), P(code4, B, "fake:slow", { keepLimits: true })]);
  const statuses = [x.status, y.status].sort();
  ok((statuses[0] === 200 && statuses[1] === 200) || (statuses[0] === 200 && statuses[1] === 202), `eşzamanlı POST yanıtları: ${statuses.join(",")}`);
  rows = await rowsOf(code4);
  ok(rows.filter((q) => q.status === "ready" || q.status === "generating").length === 1, "tek aktif kayıt");
  const spent = (1000 - (await coins(A))) + (1000 - (await coins(B)));
  ok(spent === 100, `toplam coin düşümü tam 100 (${spent})`);

  // ── Takılmış (stale) kayıt: GET temizler ve iade eder ──────────────────────
  const g5 = await playRoom(A, B); const code5 = g5.code;
  await setCoins(A, 1000);
  const { data: room5 } = await db.from("rooms").select("id").eq("room_code", code5).single();
  await db.rpc("apply_coins", { p_user: A.id, p_delta: -100, p_reason: "ai_commentary", p_ref: `${code5}:1` });
  await db.from("ai_commentaries").insert({ room_id: room5.id, purchased_by: A.id, locale: "tr", status: "generating", attempt: 1, consent_version: "test-v1", updated_at: new Date(Date.now() - 10 * 60_000).toISOString() });
  r = await G(code5, B);
  rows = await rowsOf(code5);
  ok(r.status === 200 && r.json?.status === "failed" && rows[0].status === "failed" && rows[0].error_kind === "stale", "takılmış kayıt: GET → failed (stale)");
  ok((await coins(A)) === 1000, "takılmış kaydın coin'i iade edildi");
  // Düşüm yoksa iade yok (bedava coin vermeyiz)
  await db.from("ai_commentaries").insert({ room_id: room5.id, purchased_by: A.id, locale: "tr", status: "generating", attempt: 2, consent_version: "test-v1", updated_at: new Date(Date.now() - 10 * 60_000).toISOString() });
  await G(code5, B);
  ok((await coins(A)) === 1000, "coin düşülmemiş takılmış kayıt: iade YOK");

  // ── Süresi dolmuş (ama saklanan) odada satın alma serbest ───────────────────
  const g8 = await playRoom(A, B); const code8 = g8.code;
  await setCoins(A, 1000);
  await db.from("rooms").update({ expires_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }).eq("room_code", code8);
  r = await P(code8, A, "fake:ok");
  ok(r.status === 200 && r.json?.applied === true && r.json.balance === 900, "süresi dolmuş odada satın alma: 200 (ROOM_EXPIRED yok)");
  r = await G(code8, B);
  ok(r.status === 200 && r.json?.status === "ready", "süresi dolmuş odada partner GET ile okur");
  r = await P("ZZZZZ3", A, "fake:ok");
  ok(r.status === 403 && r.json?.error?.code === "INVALID_TOKEN", "silinmiş/olmayan oda: POST hâlâ 403 INVALID_TOKEN");

  // ── Web partner yorumu hiçbir yoldan göremez ────────────────────────────────
  const g6 = await playRoom(A, { web: true }); const code6 = g6.code;
  await setCoins(A, 1000);
  r = await P(code6, A, "fake:ok");
  ok(r.status === 200, "mobil kurucu yorumu aldı (web partnerli oda)");
  r = await call("GET", `/api/rooms/${code6}/ai-commentary`, { token: g6.guestAuth.token });
  ok(r.status === 403 && r.json?.error?.code === "AI_MOBILE_ONLY", "web partner GET → 403 AI_MOBILE_ONLY");
  r = await call("POST", `/api/rooms/${code6}/ai-commentary`, { token: g6.guestAuth.token });
  ok(r.status === 403 && r.json?.error?.code === "AI_MOBILE_ONLY", "web partner POST → 403 AI_MOBILE_ONLY");
  const res = await call("GET", `/api/rooms/${code6}/results`, { token: g6.guestAuth.token });
  const st = await call("GET", `/api/rooms/${code6}/state`, { token: g6.guestAuth.token });
  ok(res.status === 200 && !/"(?:aiCommentary|ai_commentary|aiConsent|commentary|headline|awards)"/.test(JSON.stringify(res.json)), "web results yanıtında AI alanı yok");
  ok(st.status === 200 && !/"(?:aiCommentary|ai_commentary|aiConsent|commentary|headline|awards)"/.test(JSON.stringify(st.json)), "web state yanıtında AI alanı yok");
  const hist = await call("GET", "/api/users/history", { jwt: A.jwt });
  ok(Array.isArray(hist.json) && !/commentary|headline/i.test(JSON.stringify(hist.json)), "geçmiş yanıtında AI alanı yok");

  // ── Hız sınırı: kullanıcı başına dakikada 5 POST ───────────────────────────
  let last;
  for (let i = 0; i < 6; i++) last = await call("POST", `/api/rooms/${code6}/ai-commentary`, { jwt: D.jwt, specs: "fake:ok" });
  ok(last.status === 429 && last.json?.error?.code === "RATE_LIMITED", "6. POST (1 dakikada) → 429 RATE_LIMITED");

  // ── Silme: satın alan silinince yorum da gider ─────────────────────────────
  const g7 = await playRoom(A, B); const code7 = g7.code;
  await setCoins(B, 1000);
  r = await P(code7, B, "fake:ok");
  ok(r.status === 200 && (await rowsOf(code7)).length === 1, "partner (B) yorumu satın aldı");
  const { data: delB } = await db.rpc("delete_user_account", { p_user: B.id });
  void delB;
  await db.auth.admin.deleteUser(B.id);
  ok((await rowsOf(code7)).length === 0, "B hesabı silinince onun satın aldığı yorum silindi (cascade)");
  const before = rooms.length;
  await db.rpc("delete_user_account", { p_user: A.id });
  let left = 0; for (const code of rooms) left += (await db.from("rooms").select("id").eq("room_code", code)).data.length;
  ok(left === 0 && before > 0, "A hesabı silinince kurduğu odalar (ve yorumları) silindi");
} catch (e) {
  console.error("TEST HATASI:", e);
  fails++;
} finally {
  for (const u of users) {
    try { await db.rpc("delete_user_account", { p_user: u.id }); } catch { /* zaten silinmiş olabilir */ }
    try { await db.auth.admin.deleteUser(u.id); } catch { /* zaten silinmiş olabilir */ }
  }
  for (const code of rooms) await db.from("rooms").delete().eq("room_code", code);
  await db.from("rate_limits").delete().in("key", [...usedKeys]);
  console.log(fails ? `\n${fails} test BAŞARISIZ` : "\nTüm testler geçti");
  process.exit(fails ? 1 : 0);
}
