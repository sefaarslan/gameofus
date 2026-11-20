// GET /api/users/overview + ETag entegrasyon testi (gerçek Supabase + çalışan sunucu):
//   OVERVIEW_ALLOW_TEST_OVERRIDE=1 npx next dev -p 3001     sonra:   BASE=http://localhost:3001 node --no-warnings scripts/test-overview-api.mjs
// (Kısmi hata testi için sunucu geliştirme kipinde ve OVERVIEW_ALLOW_TEST_OVERRIDE=1 ile açılmalıdır; üretimde bu anahtar hiçbir şey yapmaz.)
// Geçici kullanıcı/oda/oturum açar, sonunda siler.
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(readFileSync(".env", "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const BASE = process.env.BASE ?? "http://localhost:3001";
const stamp = Date.now();
let fails = 0;
const ok = (c, m) => { console.log((c ? "✔ " : "✗ ") + m); if (!c) fails++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ipKey = (ip) => crypto.createHash("sha256").update(ip).digest("hex").substring(0, 32);
const usedKeys = new Set();
let ipSeq = 0;
const newIp = () => `198.57.${stamp % 250}.${(++ipSeq % 250) + 1}`;
const users = [];
const roomIds = [];
const TZ = "Europe/Istanbul";
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

async function call(method, path, { jwt, token, body, headers: extra = {} } = {}) {
  const ip = newIp();
  const headers = { "Content-Type": "application/json", "x-forwarded-for": ip, ...extra };
  if (jwt) headers.Authorization = `Bearer ${jwt}`; else if (token) headers.Authorization = `Bearer ${token}`;
  usedKeys.add(ipKey(ip));
  const r = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  let json = null; try { json = text ? JSON.parse(text) : null; } catch { /* gövde JSON değil */ }
  return { status: r.status, json, text, etag: r.headers.get("etag"), cc: r.headers.get("cache-control"), res: r };
}
const mkUser = async (tag) => {
  const email = `test-ov-${tag}-${stamp}@example.com`, password = `Pw-${stamp}-${tag}!`;
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true }); if (error) throw error;
  const cl = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const { data: s } = await cl.auth.signInWithPassword({ email, password });
  usedKeys.add(`u:${data.user.id}`);
  const u = { id: data.user.id, jwt: s.session.access_token };
  users.push(u); return u;
};
const rnd = () => crypto.randomBytes(3).toString("hex").toUpperCase().replace(/[01OIL]/g, "7");
const hash = () => crypto.randomBytes(32).toString("hex");
async function mkRoom(owner, guest) {
  const code = rnd();
  const { data: room, error } = await db.from("rooms").insert({ room_code: code, question_count: 5, expires_at: new Date(Date.now() + 86400e3).toISOString(), locale: "tr", user_id: owner.id }).select("id").single();
  if (error) throw error;
  roomIds.push(room.id);
  const rows = [{ room_id: room.id, role: "owner", token_hash: hash(), display_name: `TEST-${owner.tag}`, user_id: owner.id }];
  if (guest) rows.push({ room_id: room.id, role: "guest", token_hash: hash(), display_name: `TEST-${guest.tag}`, user_id: guest.id });
  await db.from("participants").insert(rows);
  return { id: room.id, code };
}
const FLAG = { G: "green", Y: "yellow", R: "red" };
async function playDaily(u, category) {
  const st = await call("POST", "/api/solo/red-flag/start", { jwt: u.jwt, body: { platform: "mobile", category, timezone: TZ, locale: "tr" } });
  const done = await call("POST", `/api/solo/${st.json.sessionId}/complete`, { body: { participantToken: st.json.token, answers: Object.fromEntries(st.json.scenarios.map((s, i) => [s.id, FLAG["GRGYGYRYR"[i]]])) } });
  if (st.status !== 201 || done.status !== 200) throw new Error(`solo kurulamadı (${st.status}/${done.status})`);
  return st.json.sessionId;
}
const aiRoom = (roomId, u, headline) => db.from("ai_commentaries").insert({ room_id: roomId, purchased_by: u.id, locale: "tr", status: "ready", attempt: 1, content: { headline }, consent_version: "test-v1" });
const aiSolo = (sessionId, u, headline) => db.from("ai_solo_analyses").insert({ session_id: sessionId, purchased_by: u.id, game: "red_flag", locale: "tr", status: "ready", attempt: 1, content: { headline }, consent_version: "test-v1" });
const ov = (u, qs = "", opts = {}) => call("GET", `/api/users/overview${qs}`, { jwt: u.jwt, ...opts });
const ALL_QS = `?timezone=${encodeURIComponent(TZ)}`;
const SECTION_PATHS = {
  me: "/api/users/me",
  history: "/api/users/history",
  soloHistory: "/api/users/solo-history",
  aiReports: "/api/users/ai-reports",
  soloToday: `/api/solo/red-flag/today?timezone=${encodeURIComponent(TZ)}`,
};

try {
  const A = await mkUser("a"), B = await mkUser("b"), C = await mkUser("c");
  A.tag = "A"; B.tag = "B"; C.tag = "C";

  // ── Veri: A'nın (paylaşılan oda + kendi odası), B'ye özel veri ──────────────────
  const shared = await mkRoom(A, B);
  const aOnly = await mkRoom(A);
  const bOnly = await mkRoom(B);
  const aSolo = await playDaily(A, "friend");
  const bSolo = await playDaily(B, "romantic");
  await aiRoom(shared.id, A, "TEST-A-ODA-YORUMU");
  await aiRoom(bOnly.id, B, "TEST-B-SADECE-ODA-YORUMU");
  await aiSolo(aSolo, A, "TEST-A-SOLO-ANALIZ");
  await aiSolo(bSolo, B, "TEST-B-SADECE-SOLO-ANALIZ");

  // ── 7) Kimlik ──────────────────────────────────────────────────────────────────
  let r = await call("GET", `/api/users/overview${ALL_QS}`);
  ok(r.status === 401 && r.json?.error?.code === "UNAUTHORIZED", "kimliksiz → 401 UNAUTHORIZED");
  r = await call("GET", `/api/users/overview${ALL_QS}`, { token: "aaa.bbb.ccc" });
  ok(r.status === 401 && r.json?.error?.code === "UNAUTHORIZED", "geçersiz JWT (3 parça) → 401");
  r = await call("GET", `/api/users/overview${ALL_QS}`, { token: crypto.randomBytes(32).toString("hex") });
  ok(r.status === 401, "katılımcı token'ı (JWT değil) → 401");

  // ── 1) include yok: hepsi ──────────────────────────────────────────────────────
  r = await ov(A, ALL_QS);
  const all = r.json;
  ok(r.status === 200 && same(Object.keys(all ?? {}), ["generatedAt", "me", "history", "soloHistory", "aiReports", "soloToday"]), `include yok → tüm bölümler, errors yok (${Object.keys(all ?? {}).join(",")})`);
  ok(!!all?.generatedAt && !Number.isNaN(Date.parse(all.generatedAt)), "generatedAt ISO zaman damgası");
  ok(all?.me?.id === A.id && Array.isArray(all.history) && all.history.length === 2 && Array.isArray(all.aiReports) && all.aiReports.length === 2, "içerik dolu: me.id, 2 oda geçmişte, 2 AI analiz");
  ok(Array.isArray(all?.soloHistory?.items) && all.soloHistory.items.length === 1 && all.soloToday?.categories?.length === 2, "soloHistory { items } biçiminde, soloToday 2 kategori");

  // ── 2) tek bölüm / seçili bölümler ─────────────────────────────────────────────
  r = await ov(A, "?include=me");
  ok(r.status === 200 && same(Object.keys(r.json), ["generatedAt", "me"]), "include=me → yalnızca me (timezone gerekmez)");
  r = await ov(A, "?include=aiReports,history");
  ok(r.status === 200 && same(Object.keys(r.json), ["generatedAt", "history", "aiReports"]), "include=aiReports,history → yalnızca bu ikisi (kanonik sırada), istenmeyenler yok");
  r = await ov(A, `?include=soloToday&timezone=${encodeURIComponent(TZ)}`);
  ok(r.status === 200 && same(Object.keys(r.json), ["generatedAt", "soloToday"]), "include=soloToday + timezone → yalnızca soloToday");

  // ── 3) Parametre doğrulama ─────────────────────────────────────────────────────
  r = await ov(A, "");
  ok(r.status === 400 && r.json?.error?.code === "INVALID_PAYLOAD", "include yok + timezone yok (soloToday dahil) → 400 INVALID_PAYLOAD");
  r = await ov(A, "?include=soloToday");
  ok(r.status === 400 && r.json?.error?.code === "INVALID_PAYLOAD", "soloToday + timezone eksik → 400 INVALID_PAYLOAD");
  r = await ov(A, "?include=soloToday&timezone=");
  ok(r.status === 400 && r.json?.error?.code === "INVALID_PAYLOAD", "soloToday + boş timezone → 400");
  r = await ov(A, "?include=history");
  ok(r.status === 200, "soloToday istenmediyse timezone gerekmez");
  r = await ov(A, "?include=me,bilinmeyen&timezone=Europe/Istanbul");
  ok(r.status === 400 && r.json?.error?.code === "INVALID_PAYLOAD", "bilinmeyen bölüm → 400");
  r = await ov(A, "?include=");
  ok(r.status === 400, "boş include → 400");
  r = await ov(A, "?include=soloToday&timezone=Mars/Olympus");
  const todayBad = await call("GET", "/api/solo/red-flag/today?timezone=Mars/Olympus", { jwt: A.jwt });
  ok(r.status === 200 && same(r.json.soloToday, todayBad.json), "geçersiz timezone → today ucuyla aynı kural (varsayılana düşer), aynı yanıt");

  // ── 5) Bölümler mevcut uçlarla birebir aynı ────────────────────────────────────
  for (const [name, path] of Object.entries(SECTION_PATHS)) {
    const single = await call("GET", path, { jwt: A.jwt });
    ok(single.status === 200 && same(all[name], single.json), `${name}: overview bölümü ${path.split("?")[0]} yanıtıyla birebir aynı`);
  }

  // ── 4) Kısmi hata (sunucu OVERVIEW_ALLOW_TEST_OVERRIDE=1 ile dev kipinde) ──────
  r = await ov(A, ALL_QS, { headers: { "x-overview-test-fail": "soloHistory" } });
  const hookOn = r.json?.errors?.soloHistory === "INTERNAL_ERROR";
  ok(hookOn, "test kancası açık (sunucu OVERVIEW_ALLOW_TEST_OVERRIDE=1 ile dev kipinde başlatılmış olmalı)");
  if (hookOn) {
    ok(r.status === 200 && !("soloHistory" in r.json) && same(r.json.errors, { soloHistory: "INTERNAL_ERROR" }), "bir bölüm hatalı: 200, o bölüm yok, errors'ta kodu var");
    ok(same(r.json.me, all.me) && same(r.json.history, all.history) && same(r.json.aiReports, all.aiReports) && same(r.json.soloToday, all.soloToday), "kalan bölümler yine eksiksiz ve aynı");
    r = await ov(A, ALL_QS, { headers: { "x-overview-test-fail": "me,aiReports" } });
    ok(r.status === 200 && same(r.json.errors, { me: "INTERNAL_ERROR", aiReports: "INTERNAL_ERROR" }) && !("me" in r.json) && "history" in r.json, "iki bölüm hatalı: ikisi errors'ta, diğerleri döner");
    const okOnly = await ov(A, ALL_QS);
    ok(!("errors" in okOnly.json), "hata yoksa errors alanı hiç gelmez");
    r = await ov(A, "?include=me", { headers: { "x-overview-test-fail": "me" } });
    ok(r.status === 500 && r.json?.error?.code === "INTERNAL_ERROR", "tüm istenen bölümler başarısız → 500 INTERNAL_ERROR");
  }

  // ── 6) ETag / koşullu istek ────────────────────────────────────────────────────
  const first = await ov(A, ALL_QS);
  ok(/^W\/"[A-Za-z0-9_-]{22}"$/.test(first.etag ?? "") && first.cc === "private, no-cache", `200: zayıf ETag + Cache-Control: private, no-cache (${first.etag}; ${first.cc})`);
  await sleep(20);
  const second = await ov(A, ALL_QS);
  ok(second.etag === first.etag && second.json.generatedAt !== first.json.generatedAt, "generatedAt farklı ama ETag aynı (generatedAt hesaba katılmıyor)");
  r = await ov(A, ALL_QS, { headers: { "If-None-Match": first.etag } });
  ok(r.status === 304 && r.text === "" && r.etag === first.etag && r.cc === "private, no-cache", "If-None-Match eşleşti → 304, gövdesiz, ETag ve Cache-Control döner");
  r = await ov(A, ALL_QS, { headers: { "If-None-Match": `"baska", ${first.etag}` } });
  ok(r.status === 304, "If-None-Match listesinde eşleşme → 304");
  r = await ov(A, ALL_QS, { headers: { "If-None-Match": first.etag.replace(/^W\//, "") } });
  ok(r.status === 304, "güçlü biçimdeki etiket de eşleşir (zayıf karşılaştırma)");
  r = await ov(A, ALL_QS, { headers: { "If-None-Match": 'W/"eski-etiket"' } });
  ok(r.status === 200 && r.etag === first.etag, "farklı etiket → 200 tam gövde");
  r = await ov(A, ALL_QS, { headers: { "If-None-Match": "*" } });
  ok(r.status === 304, "If-None-Match: * → 304");
  // Veri değişince ETag değişir: bir odayı listeden kaldır
  const hide = await call("DELETE", `/api/users/history/${aOnly.code}`, { jwt: A.jwt });
  r = await ov(A, ALL_QS, { headers: { "If-None-Match": first.etag } });
  ok(hide.status === 200 && r.status === 200 && r.etag !== first.etag && r.json.history.length === 1, "veri değişti (oda kaldırıldı) → eski etiketle 200, yeni ETag, history 1 satır");
  r = await ov(A, ALL_QS, { headers: { "If-None-Match": r.etag } });
  ok(r.status === 304, "yeni etiketle tekrar → 304");
  // Kullanıcıya özel: B aynı etiketle A'nın 304'ünü alamaz
  r = await ov(B, ALL_QS, { headers: { "If-None-Match": first.etag } });
  ok(r.status === 200, "başka kullanıcı A'nın etiketiyle 304 alamaz (veri farklı)");

  // Mevcut GET uçlarında ETag
  for (const [name, path] of Object.entries(SECTION_PATHS)) {
    const a = await call("GET", path, { jwt: A.jwt });
    const b = await call("GET", path, { jwt: A.jwt, headers: { "If-None-Match": a.etag ?? "yok" } });
    ok(/^W\//.test(a.etag ?? "") && a.cc === "private, no-cache" && b.status === 304 && b.text === "", `${path.split("?")[0]}: ETag + Cache-Control, If-None-Match → 304`);
  }
  const cors = await fetch(BASE + "/api/users/overview", { method: "OPTIONS" });
  ok(cors.status === 204 && /If-None-Match/i.test(cors.headers.get("access-control-allow-headers") ?? "") && /ETag/i.test(cors.headers.get("access-control-expose-headers") ?? ""), "CORS: If-None-Match izinli, ETag açık");

  // ── 8) Başka kullanıcının verisi sızmıyor ──────────────────────────────────────
  const aText = JSON.stringify((await ov(A, ALL_QS)).json);
  const bRes = await ov(B, ALL_QS);
  const bText = JSON.stringify(bRes.json);
  const bLeaks = [bOnly.code, bSolo, "TEST-B-SADECE-ODA-YORUMU", "TEST-B-SADECE-SOLO-ANALIZ", B.id].filter((x) => aText.includes(x));
  ok(bLeaks.length === 0, `A'nın yanıtında B'ye özel hiçbir veri yok (sızan: ${bLeaks.length})`);
  const aLeaks = [aOnly.code, aSolo, "TEST-A-ODA-YORUMU", "TEST-A-SOLO-ANALIZ", A.id].filter((x) => bText.includes(x));
  ok(aLeaks.length === 0, `B'nin yanıtında A'ya özel hiçbir veri yok (sızan: ${aLeaks.length})`);
  ok(bRes.json.me.id === B.id && bRes.json.history.some((h) => h.roomCode === bOnly.code) && bRes.json.history.some((h) => h.roomCode === shared.code), "B kendi verisini ve paylaşılan odayı görür");
  ok(bRes.json.aiReports.length === 2 && bRes.json.aiReports.every((x) => x.headline.startsWith("TEST-B-SADECE-")), "B yalnızca KENDİ satın aldığı 2 analizi görür");
  ok(!bText.includes("TEST-A-ODA-YORUMU"), "A'nın satın aldığı oda yorumu, aynı odadaki B'nin yanıtında çıkmaz");

  // ── Hız sınırı: kullanıcı başına dakikada 30 ───────────────────────────────────
  let firstLimited = -1;
  for (let i = 1; i <= 45; i++) {
    const x = await ov(C, "?include=me");
    if (x.status === 429) { firstLimited = i; ok(x.json?.error?.code === "RATE_LIMITED", "429 RATE_LIMITED gövdesi"); break; }
    await sleep(70);
  }
  ok(firstLimited >= 31 && firstLimited <= 36, `dakikada ~30 istekten sonra 429 (ilk 429: ${firstLimited}. istek)`);
  const stillA = await ov(A, "?include=me");
  ok(stillA.status === 200, "sınır kullanıcıya özel: başka kullanıcı etkilenmez");
} catch (err) {
  // finally içindeki process.exit istisnayı yutmasın: kurulum/akış hatası testi BAŞARISIZ sayar
  console.error("✗ test akışı hata verdi:", err);
  fails++;
} finally {
  for (const id of roomIds) await db.from("rooms").delete().eq("id", id);
  for (const u of users) {
    try { await db.rpc("delete_user_account", { p_user: u.id }); } catch { /* yok say */ }
    try { await db.auth.admin.deleteUser(u.id); } catch { /* yok say */ }
  }
  await db.from("rate_limits").delete().in("key", [...usedKeys]);
  console.log(fails ? `\n${fails} test BAŞARISIZ` : "\nTüm testler geçti");
  process.exit(fails ? 1 : 0);
}
