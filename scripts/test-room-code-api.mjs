// Oda kodu entegrasyon testi (çalışan sunucu + .env gerekir):  BASE=http://localhost:3001 node scripts/test-room-code-api.mjs
// Test hız sınırlarını etkilemesin diye her grup kendi sahte IP'sini (X-Forwarded-For) kullanır ve bittiğinde kayıtlarını siler.
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(readFileSync(".env", "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const BASE = process.env.BASE ?? "http://localhost:3001";
const stamp = Date.now();
let fails = 0, passes = 0;
const ok = (c, m) => {
  console.log((c ? "✔ " : "✗ ") + m);
  if (c) passes++;
  else fails++;
};
const ipKey = (ip) => crypto.createHash("sha256").update(ip).digest("hex").substring(0, 32);
const usedKeys = new Set();
let ipSeq = 0;
const newIp = () => `198.51.${stamp % 250}.${++ipSeq + 10}`;

async function call(method, path, { ip, jwt, token, body } = {}) {
  const headers = { "Content-Type": "application/json", "x-forwarded-for": ip ?? newIp() };
  if (jwt) headers.Authorization = `Bearer ${jwt}`; else if (token) headers.Authorization = `Bearer ${token}`;
  usedKeys.add(ipKey(headers["x-forwarded-for"]));
  const r = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, json: await r.json().catch(() => null) };
}
const mkUser = async (tag, birth = "1990-01-01") => {
  const email = `test-rc-${tag}-${stamp}@example.com`, password = `Pw-${stamp}-${tag}!`;
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true }); if (error) throw error;
  const cl = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const { data: s } = await cl.auth.signInWithPassword({ email, password });
  await db.from("users").update({ birth_date: birth }).eq("id", data.user.id);
  usedKeys.add(`u:${data.user.id}`);
  return { id: data.user.id, jwt: s.session.access_token };
};
const webRoom = async (extra = {}) => {
  const r = await call("POST", "/api/rooms/create", { body: { displayName: "TEST-W", locale: "tr", relationshipType: "friend", gameMode: "secret_choice", questionCount: 5, ...extra } });
  if (r.status !== 201) throw new Error("create failed " + JSON.stringify(r.json));
  rooms.push(r.json.roomCode); return r.json;
};
const mobileRoom = async (user) => {
  const r = await call("POST", "/api/rooms/create", { jwt: user.jwt, body: { platform: "mobile", displayName: "TEST-M", locale: "tr", relationshipType: "dating", gameMode: "secret_choice", questionCount: 5 } });
  if (r.status !== 201) throw new Error("mobile create failed " + JSON.stringify(r.json));
  rooms.push(r.json.roomCode); return r.json;
};
const rooms = []; const users = [];

try {
  // ── 1) Kod biçimi ve normalize ────────────────────────────────────────────
  const w = await webRoom();
  ok(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/.test(w.roomCode), `yeni oda kodu 6 karakter, izinli charset (${w.roomCode})`);
  const lowerDash = `${w.roomCode.slice(0, 3)}-${w.roomCode.slice(3)}`.toLowerCase();
  let r = await call("GET", `/api/rooms/${lowerDash}/state`);
  ok(r.status === 200 && r.json.room.roomCode === w.roomCode, `state "${lowerDash}" → aynı oda (${r.json?.room?.roomCode})`);
  r = await call("GET", `/api/rooms/${encodeURIComponent(w.roomCode.slice(0, 3) + " " + w.roomCode.slice(3))}/state`);
  ok(r.status === 200 && r.json.room.roomCode === w.roomCode, "boşluklu kod (K7M 2PQ) → aynı oda");
  r = await call("POST", `/api/rooms/${lowerDash}/join`, { body: { displayName: "TEST-G" } });
  ok(r.status === 200 && r.json.roomCode === w.roomCode, `join "${lowerDash}" → 200, yanıttaki roomCode kanonik (${r.json?.roomCode})`);
  const gToken = r.json?.participant?.token;
  r = await call("GET", `/api/rooms/${lowerDash}/state`, { token: gToken });
  ok(r.json?.participant?.role === "guest", "normalize edilmiş kodla token hâlâ doğru oyuncuyu bulur");

  // ── 2) Eski 8 karakterli kod geçerli kalır ───────────────────────────────
  const legacy = await webRoom();
  const legacyCode = "ABCD2345";
  await db.from("rooms").update({ room_code: legacyCode }).eq("room_code", legacy.roomCode);
  rooms[rooms.indexOf(legacy.roomCode)] = legacyCode;
  r = await call("GET", "/api/rooms/abcd-2345/state");
  ok(r.status === 200 && r.json.room.roomCode === legacyCode, "eski 8 karakterli kod (abcd-2345) hâlâ çalışır");

  // ── 3) Oda varlığı sızmaz ─────────────────────────────────────────────────
  // Herkese açık uçlar (state, join): bulunamayan kod → 404 ROOM_NOT_FOUND (link önizlemesi için oda varlığı zaten görünür).
  // Token gerektiren uçlar (results, submit-turn, complete): "oda yok" ile "token yanlış" AYNI yanıt → 403 INVALID_TOKEN.
  const missIp = newIp();
  const BAD = "0".repeat(64);
  const tokenProbes = (code) => [
    ["GET", `/api/rooms/${code}/results?participantToken=${BAD}`, undefined],
    ["POST", `/api/rooms/${code}/submit-turn`, { participantToken: BAD, questionId: "q", answerValue: { value: "yes" }, predictedValue: { value: "no" } }],
    ["POST", `/api/rooms/${code}/complete`, { participantToken: BAD }],
  ];
  for (const [m, p, b] of [["GET", "/api/rooms/ZZZZZZ/state", undefined], ["POST", "/api/rooms/ZZZZZZ/join", { displayName: "x" }]]) {
    const x = await call(m, p, { ip: missIp, body: b });
    ok(x.status === 404 && x.json?.error?.code === "ROOM_NOT_FOUND", `${m} ${p} (herkese açık) → 404 ROOM_NOT_FOUND`);
  }
  const ghost = [], real = [];
  for (const [m, p, b] of tokenProbes("ZZZZZZ")) { const x = await call(m, p, { ip: missIp, body: b }); ghost.push(x); }
  for (const [m, p, b] of tokenProbes(w.roomCode)) { const x = await call(m, p, { ip: missIp, body: b }); real.push(x); }
  ghost.forEach((x, i) => ok(x.status === 403 && x.json?.error?.code === "INVALID_TOKEN", `token ucu #${i + 1}: olmayan oda → 403 INVALID_TOKEN (${x.status})`));
  ok(real.every((x, i) => x.status === ghost[i].status && JSON.stringify(x.json) === JSON.stringify(ghost[i].json)), "gerçek oda + yanlış token yanıtı, olmayan odayla birebir aynı (durum kodu ve gövde)");

  // Oda durumları (süresi dolmuş / sonuç hazır değil) kimlik doğrulanmadan söylenmez
  const stale = await webRoom();
  const staleOwner = stale.participant.token;
  await db.from("rooms").update({ expires_at: new Date(Date.now() - 3600e3).toISOString() }).eq("room_code", stale.roomCode);
  let sx = await call("GET", `/api/rooms/${stale.roomCode}/results?participantToken=${BAD}`, { ip: missIp });
  ok(sx.status === 403 && sx.json.error.code === "INVALID_TOKEN", `süresi dolmuş oda + yanlış token → 403 INVALID_TOKEN (ROOM_EXPIRED sızmaz) (${sx.status} ${sx.json?.error?.code})`);
  sx = await call("POST", `/api/rooms/${stale.roomCode}/complete`, { ip: missIp, body: { participantToken: BAD } });
  ok(sx.status === 403, "süresi dolmuş oda + yanlış token (complete) → 403");
  sx = await call("POST", `/api/rooms/${stale.roomCode}/complete`, { ip: newIp(), body: { participantToken: staleOwner } });
  ok(sx.status === 400 && sx.json.error.code === "ROOM_EXPIRED", `süresi dolmuş oda + DOĞRU token → ROOM_EXPIRED (${sx.json?.error?.code})`);
  sx = await call("GET", `/api/rooms/${w.roomCode}/results?participantToken=${BAD}`, { ip: newIp() });
  ok(sx.status === 403, "sonuç hazır değilken yanlış token → 403 (RESULT_NOT_READY sızmaz)");
  sx = await call("GET", `/api/rooms/${w.roomCode}/results?participantToken=${w.participant.token}`, { ip: newIp() });
  ok(sx.status === 400 && sx.json.error.code === "RESULT_NOT_READY", `sonuç hazır değilken DOĞRU token → RESULT_NOT_READY (${sx.json?.error?.code})`);

  // state: katılımcı olmayan asgari önizleme, katılımcı tam veri
  const pv = await call("GET", `/api/rooms/${w.roomCode}/state`, { ip: newIp() });
  ok(pv.status === 200 && pv.json.participant === null && pv.json.questions.length === 0 && pv.json.participants.every((p) => !("displayName" in p)),
    `state (katılımcı değil): participant null, sorular boş, oyuncu adı yok (${pv.json?.questions?.length} soru)`);
  ok(pv.json.room.roomCode === w.roomCode && Array.isArray(pv.json.participants) && pv.json.participants.length >= 1, "önizleme oda durumunu ve dolu olup olmadığını (oyuncu sayısı) verir");
  const full1 = await call("GET", `/api/rooms/${w.roomCode}/state`, { ip: newIp(), token: w.participant.token });
  ok(full1.json.questions.length === 5 && full1.json.participants.some((p) => p.displayName === "TEST-W") && full1.json.participant.role === "owner", "state (token'lı katılımcı): sorular ve oyuncu adları tam");

  // Yanlış token denemeleri de sayılır (tarama yavaşlar)
  let limited = null;
  for (let i = 0; i < 12; i++) { const x = await call("GET", `/api/rooms/ZZZZZ${i}/results?participantToken=${BAD}`, { ip: missIp }); if (x.status === 429) { limited = { i, code: x.json?.error?.code }; break; } }
  ok(limited && limited.code === "RATE_LIMITED", `aynı IP'den 10+ başarısız token/kod denemesi → 429 RATE_LIMITED (${JSON.stringify(limited)})`);
  const other = await call("GET", `/api/rooms/${w.roomCode}/state`, { ip: missIp });
  ok(other.status === 200, "sınırdaki IP geçerli koda erişmeye devam eder (başarılı arama sayılmaz)");

  // ── 4) Katılma denemesi hız limiti (IP başına dakikada 10) ──────────────────
  const full = await webRoom();
  await call("POST", `/api/rooms/${full.roomCode}/join`, { body: { displayName: "TEST-2" } });
  const joinIp = newIp();
  let firstFull = null, lim = null;
  for (let i = 1; i <= 12; i++) {
    const x = await call("POST", `/api/rooms/${full.roomCode}/join`, { ip: joinIp, body: { displayName: "TEST-X" + i } });
    if (i === 1) firstFull = x;
    if (x.status === 429) { lim = { i, code: x.json.error.code }; break; }
  }
  ok(firstFull.status === 400 && firstFull.json.error.code === "ROOM_FULL", `dolu oda (join_locked) → ROOM_FULL korunur (${firstFull.status})`);
  ok(lim && lim.i === 11 && lim.code === "RATE_LIMITED", `IP başına 10 denemeden sonra 11. deneme → 429 RATE_LIMITED (${JSON.stringify(lim)})`);

  // ── 5) Kullanıcı başına limit (farklı IP'lerden bile) ─────────────────────
  const U = await mkUser("limit"); users.push(U);
  let ulim = null;
  for (let i = 1; i <= 12; i++) {
    const x = await call("POST", `/api/rooms/${full.roomCode}/join`, { jwt: U.jwt, body: { platform: "mobile", displayName: "TEST-U" } });
    if (x.status === 429) { ulim = i; break; }
  }
  ok(ulim === 11, `kullanıcı başına limit: her deneme farklı IP'den gelse de 11. deneme 429 (${ulim}. denemede)`);

  // ── 6) Webden kurulan oda yalnızca web'e açık ─────────────────────────────
  const M1 = await mkUser("mob1"); users.push(M1);
  const webOnly = await webRoom();
  r = await call("POST", `/api/rooms/${webOnly.roomCode}/join`, { jwt: M1.jwt, body: { platform: "mobile", displayName: "TEST-M1" } });
  ok(r.status === 403 && r.json.error.code === "ROOM_WEB_ONLY", `mobil kimlikle web odasına katılma → 403 ROOM_WEB_ONLY (${r.status} ${r.json?.error?.code})`);
  r = await call("POST", `/api/rooms/${webOnly.roomCode}/join`, { body: { displayName: "TEST-WebGuest" } });
  ok(r.status === 200, "aynı web odasına web'den (anonim) katılma çalışır");

  // ── 7) Mobilden kurulan odaya hem mobil hem web katılabilir ────────────────
  const OWN = await mkUser("owner"); users.push(OWN);
  const mr1 = await mobileRoom(OWN);
  const M2 = await mkUser("mob2"); users.push(M2);
  r = await call("POST", `/api/rooms/${mr1.roomCode}/join`, { jwt: M2.jwt, body: { platform: "mobile", displayName: "TEST-M2" } });
  ok(r.status === 200 && r.json.participant.role === "guest", `mobil kuruldu → mobil misafir katılır (${r.status})`);
  const mr2 = await mobileRoom(OWN);
  r = await call("POST", `/api/rooms/${mr2.roomCode}/join`, { body: { displayName: "TEST-WebToMobile" } });
  ok(r.status === 200 && r.json.participant.role === "guest", `mobil kuruldu → web (anonim) misafir katılır (${r.status})`);

  // ── 8) Süresi dolan oda ───────────────────────────────────────────────────
  const exp = await webRoom();
  await db.from("rooms").update({ expires_at: new Date(Date.now() - 3600e3).toISOString() }).eq("room_code", exp.roomCode);
  r = await call("POST", `/api/rooms/${exp.roomCode.toLowerCase()}/join`, { body: { displayName: "TEST-late" } });
  ok(r.status === 400 && r.json.error.code === "ROOM_EXPIRED", `süresi dolan oda → ROOM_EXPIRED (${r.status} ${r.json?.error?.code})`);
} finally {
  for (const c of rooms) await db.from("rooms").delete().eq("room_code", c);
  for (const u of users) { await db.rpc("delete_user_account", { p_user: u.id }); await db.auth.admin.deleteUser(u.id).catch(() => {}); }
  const { data: us } = await db.auth.admin.listUsers({ perPage: 200 });
  for (const u of us?.users ?? []) if (u.email?.startsWith(`test-rc-`) && u.email.includes(String(stamp))) { await db.rpc("delete_user_account", { p_user: u.id }); await db.auth.admin.deleteUser(u.id).catch(() => {}); }
  for (const k of usedKeys) await db.from("rate_limits").delete().eq("key", k);
}
console.log(fails ? `\n${fails} BAŞARISIZ, ${passes} geçti` : `\nTÜMÜ GEÇTİ (${passes})`);
process.exit(fails ? 1 : 0);
