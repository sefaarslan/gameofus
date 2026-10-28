// Geçmiş listelerinden "kaldır" (yumuşak silme) entegrasyon testi (gerçek Supabase + çalışan sunucu):
//   npx next dev -p 3001        sonra:   BASE=http://localhost:3001 node --no-warnings scripts/test-history-hide-api.mjs
// Geçici kullanıcı/oda/oturum açar, sonunda siler. Önkoşul: supabase/migrations/20260620000000_history_hide.sql uygulanmış olmalı.
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
const newIp = () => `198.55.${stamp % 250}.${(++ipSeq % 250) + 1}`;
const users = [];
const roomIds = [];
const TZ = "Europe/Istanbul";

async function call(method, path, { jwt, token, body } = {}) {
  const ip = newIp();
  const headers = { "Content-Type": "application/json", "x-forwarded-for": ip };
  if (jwt) headers.Authorization = `Bearer ${jwt}`; else if (token) headers.Authorization = `Bearer ${token}`;
  usedKeys.add(ipKey(ip));
  const r = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, json: await r.json().catch(() => null) };
}
const mkUser = async (tag) => {
  const email = `test-hide-${tag}-${stamp}@example.com`, password = `Pw-${stamp}-${tag}!`;
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true }); if (error) throw error;
  const cl = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const { data: s } = await cl.auth.signInWithPassword({ email, password });
  usedKeys.add(`u:${data.user.id}`);
  const u = { id: data.user.id, jwt: s.session.access_token };
  users.push(u); return u;
};
const FLAG = { G: "green", Y: "yellow", R: "red" };
const startDaily = (u, category) => call("POST", "/api/solo/red-flag/start", { jwt: u.jwt, body: { platform: "mobile", category, timezone: TZ, locale: "tr" } });
const finish = (st, grid = "GRGYGYRYR") =>
  call("POST", `/api/solo/${st.json.sessionId}/complete`, { body: { participantToken: st.json.token, answers: Object.fromEntries(st.json.scenarios.map((s, i) => [s.id, FLAG[grid[i]]])) } });
const rnd = () => crypto.randomBytes(3).toString("hex").toUpperCase().replace(/[01OIL]/g, "7");

// İki kişilik oda (doğrudan DB): A kurucu, B katılımcı; ikisi de kullanıcıya bağlı
async function mkRoom(A, B) {
  const code = rnd();
  const { data: room, error } = await db.from("rooms").insert({ room_code: code, question_count: 5, expires_at: new Date(Date.now() + 86400e3).toISOString(), locale: "tr", user_id: A.id }).select("id, room_code").single();
  if (error) throw error;
  roomIds.push(room.id);
  const hash = () => crypto.randomBytes(32).toString("hex");
  await db.from("participants").insert([
    { room_id: room.id, role: "owner", token_hash: hash(), display_name: "TEST-A", user_id: A.id },
    { room_id: room.id, role: "guest", token_hash: hash(), display_name: "TEST-B", user_id: B.id },
  ]);
  return room;
}
const aiRoom = (room, buyer) => db.from("ai_commentaries").insert({ room_id: room.id, purchased_by: buyer.id, locale: "tr", status: "ready", attempt: 1, content: { headline: "TEST yorum" }, consent_version: "test-v1" });
const hasRoom = (r, code) => (r.json ?? []).some((x) => x.roomCode === code);

try {
  const A = await mkUser("a"), B = await mkUser("b");

  // ── Oyunlarım: ikili oda ───────────────────────────────────────────────────
  const room = await mkRoom(A, B);
  let r = await call("GET", "/api/users/history", { jwt: A.jwt });
  ok(r.status === 200 && hasRoom(r, room.room_code), "history: oda kurucunun listesinde");
  r = await call("DELETE", `/api/users/history/${room.room_code}`);
  ok(r.status === 401, "history DELETE: kimliksiz → 401");
  const C = await mkUser("c");
  r = await call("DELETE", `/api/users/history/${room.room_code}`, { jwt: C.jwt });
  ok(r.status === 404 && r.json?.error?.code === "ROOM_NOT_FOUND", "history DELETE: katılımcı olmayan → 404 ROOM_NOT_FOUND");
  r = await call("DELETE", "/api/users/history/ZZZZZZ", { jwt: A.jwt });
  ok(r.status === 404 && r.json?.error?.code === "ROOM_NOT_FOUND", "history DELETE: var olmayan oda → aynı 404");
  r = await call("GET", "/api/users/history", { jwt: A.jwt });
  ok(hasRoom(r, room.room_code), "history: 404'lar listeyi değiştirmedi");
  r = await call("DELETE", `/api/users/history/${room.room_code.toLowerCase()}`, { jwt: A.jwt });
  ok(r.status === 200 && r.json?.hidden === true, "history DELETE: sahibi → 200 { hidden:true } (kod küçük harfle de olur)");
  r = await call("GET", "/api/users/history", { jwt: A.jwt });
  ok(r.status === 200 && !hasRoom(r, room.room_code), "history: kaldırılan oda kurucunun listesinden çıktı");
  r = await call("GET", "/api/users/history", { jwt: B.jwt });
  ok(hasRoom(r, room.room_code), "history: partnerin listesi etkilenmedi");
  r = await call("DELETE", `/api/users/history/${room.room_code}`, { jwt: A.jwt });
  ok(r.status === 200, "history DELETE: idempotent (ikinci çağrı 200)");
  const { data: stillThere } = await db.from("rooms").select("id").eq("id", room.id).maybeSingle();
  const { data: parts } = await db.from("participants").select("id, hidden_at, user_id").eq("room_id", room.id);
  ok(!!stillThere && parts.length === 2 && parts.find((p) => p.user_id === A.id).hidden_at && !parts.find((p) => p.user_id === B.id).hidden_at, "DB: oda ve iki katılımcı duruyor, yalnızca A'nınki işaretli");

  // ── Analizlerim: oda yorumu ────────────────────────────────────────────────
  const room2 = await mkRoom(A, B);
  await aiRoom(room2, A);
  const reportsOf = async (u) => (await call("GET", "/api/users/ai-reports", { jwt: u.jwt })).json ?? [];
  let rep = await reportsOf(A);
  ok(rep.some((x) => x.type === "room" && x.roomCode === room2.room_code), "ai-reports: satın alınan oda yorumu listede");
  r = await call("DELETE", `/api/users/ai-reports/room/${room2.room_code}`, { jwt: B.jwt });
  ok(r.status === 404, "ai-reports/room DELETE: satın almayan (partner) → 404");
  r = await call("DELETE", `/api/users/ai-reports/room/${room2.room_code}`, { jwt: A.jwt });
  ok(r.status === 200 && r.json?.hidden === true, "ai-reports/room DELETE: alıcı → 200");
  rep = await reportsOf(A);
  ok(!rep.some((x) => x.type === "room" && x.roomCode === room2.room_code), "ai-reports: kaldırılan oda yorumu listeden çıktı");
  const { data: c } = await db.from("ai_commentaries").select("status, content, hidden_at").eq("room_id", room2.id).single();
  ok(c.status === "ready" && c.content?.headline === "TEST yorum" && !!c.hidden_at, "DB: yorum silinmedi, hidden_at dolu");
  const roomAfter = await call("DELETE", `/api/users/ai-reports/room/${room2.room_code}`, { jwt: A.jwt });
  ok(roomAfter.status === 200, "ai-reports/room DELETE: idempotent");

  // ── Oyunlarım + Analizlerim: solo ──────────────────────────────────────────
  const st = await startDaily(A, "friend");
  const done = await finish(st);
  ok(done.status === 200 && done.json.reward?.earned === 50, "solo: günlük oyun tamamlandı (+50)");
  const sid = st.json.sessionId;
  const soloIds = async () => ((await call("GET", "/api/users/solo-history", { jwt: A.jwt })).json?.items ?? []).map((x) => x.sessionId);
  ok((await soloIds()).includes(sid), "solo-history: oyun listede");
  await db.from("ai_solo_analyses").insert({ session_id: sid, purchased_by: A.id, game: "red_flag", locale: "tr", status: "ready", attempt: 1, content: { headline: "TEST solo" }, consent_version: "test-v1" });
  rep = await reportsOf(A);
  ok(rep.some((x) => x.type === "solo" && x.sessionId === sid), "ai-reports: solo analiz listede");

  r = await call("DELETE", `/api/users/ai-reports/solo/${sid}`, { jwt: B.jwt });
  ok(r.status === 404 && r.json?.error?.code === "SESSION_NOT_FOUND", "ai-reports/solo DELETE: başkası → 404");
  r = await call("DELETE", "/api/users/ai-reports/solo/not-a-uuid", { jwt: A.jwt });
  ok(r.status === 404, "ai-reports/solo DELETE: geçersiz kimlik → 404");
  r = await call("DELETE", `/api/users/ai-reports/solo/${sid}`, { jwt: A.jwt });
  ok(r.status === 200 && r.json?.hidden === true, "ai-reports/solo DELETE: alıcı → 200");
  rep = await reportsOf(A);
  ok(!rep.some((x) => x.type === "solo" && x.sessionId === sid), "ai-reports: kaldırılan solo analiz çıktı");
  ok((await soloIds()).includes(sid), "solo-history: analizi kaldırmak oyunu listeden çıkarmaz (bağımsız)");

  r = await call("DELETE", `/api/users/solo-history/${sid}`, { jwt: B.jwt });
  ok(r.status === 404 && r.json?.error?.code === "SESSION_NOT_FOUND", "solo-history DELETE: başkası → 404");
  r = await call("DELETE", `/api/users/solo-history/${sid}`);
  ok(r.status === 401, "solo-history DELETE: kimliksiz → 401");
  r = await call("DELETE", `/api/users/solo-history/${sid}`, { jwt: A.jwt });
  ok(r.status === 200 && r.json?.hidden === true, "solo-history DELETE: sahibi → 200");
  ok(!(await soloIds()).includes(sid), "solo-history: kaldırılan oyun listeden çıktı");
  r = await call("DELETE", `/api/users/solo-history/${sid}`, { jwt: A.jwt });
  ok(r.status === 200, "solo-history DELETE: idempotent");
  r = await call("GET", `/api/users/solo-history/${sid}`, { jwt: A.jwt });
  ok(r.status === 200 && r.json?.cards?.length === 9, "solo-history/{id}: kaldırılmış oyunun detayı kimlikle hâlâ açılır");

  // Günlük kural bozulmaz: kaldırmak aynı günün setini yeniden oynatmaz, coin tekrar verilmez
  const again = await startDaily(A, "friend");
  ok(again.status === 409 && again.json?.error?.code === "ALREADY_PLAYED_TODAY" && again.json.error.sessionId === sid, "günlük kural: kaldırılan oyunun setini aynı gün yeniden başlatma → 409");
  const t = await call("GET", `/api/solo/red-flag/today?timezone=${TZ}`, { jwt: A.jwt });
  const fr = t.json?.categories?.find((x) => x.category === "friend");
  ok(fr?.played === true && fr.sessionId === sid, "today: kaldırılan oyun yine 'oynandı' görünür");
  const { data: tx } = await db.from("credit_transactions").select("id").eq("user_id", A.id).eq("reason", "solo_reward");
  ok(tx?.length === 1, "defter: coin kaydı silinmedi, tek solo_reward");
  const { data: srow } = await db.from("solo_sessions").select("status, hidden_at").eq("id", sid).single();
  ok(srow.status === "completed" && !!srow.hidden_at, "DB: oturum silinmedi, hidden_at dolu");
} finally {
  for (const u of users) {
    try { await db.rpc("delete_user_account", { p_user: u.id }); } catch { /* zaten silinmiş olabilir */ }
    try { await db.auth.admin.deleteUser(u.id); } catch { /* zaten silinmiş olabilir */ }
  }
  for (const id of roomIds) await db.from("rooms").delete().eq("id", id);
  await db.from("rate_limits").delete().in("key", [...usedKeys]);
  console.log(fails ? `\n${fails} test BAŞARISIZ` : "\nTüm testler geçti");
  process.exit(fails ? 1 : 0);
}
