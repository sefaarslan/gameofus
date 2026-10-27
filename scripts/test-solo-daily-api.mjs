// Günlük Red Flag seti entegrasyon testi (gerçek Supabase + çalışan sunucu):
//   npx next dev -p 3001        sonra:   BASE=http://localhost:3001 node --no-warnings scripts/test-solo-daily-api.mjs
// Geçici kullanıcı/oturum açar, sonunda siler. Önkoşul: supabase/migrations/20260618000000_solo_daily.sql uygulanmış olmalı.
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { localDate, nextSetAt, setNumber } from "../lib/solo-daily.ts";

const env = Object.fromEntries(readFileSync(".env", "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const BASE = process.env.BASE ?? "http://localhost:3001";
const stamp = Date.now();
let fails = 0;
const ok = (c, m) => { console.log((c ? "✔ " : "✗ ") + m); if (!c) fails++; };
const ipKey = (ip) => crypto.createHash("sha256").update(ip).digest("hex").substring(0, 32);
const usedKeys = new Set();
let ipSeq = 0;
const newIp = () => `198.54.${stamp % 250}.${(++ipSeq % 250) + 1}`;
const users = [];
const webSessions = [];
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
  const email = `test-daily-${tag}-${stamp}@example.com`, password = `Pw-${stamp}-${tag}!`;
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true }); if (error) throw error;
  const cl = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const { data: s } = await cl.auth.signInWithPassword({ email, password });
  usedKeys.add(`u:${data.user.id}`);
  const u = { id: data.user.id, jwt: s.session.access_token };
  users.push(u); return u;
};
const coins = async (u) => (await db.from("users").select("room_credits").eq("id", u.id).single()).data.room_credits;
const FLAG = { G: "green", Y: "yellow", R: "red" };
const startDaily = (u, category, timezone = TZ) => call("POST", "/api/solo/red-flag/start", { jwt: u.jwt, body: { platform: "mobile", category, timezone, locale: "tr" } });
const finish = (st, grid = "GRGYGYRYR") =>
  call("POST", `/api/solo/${st.json.sessionId}/complete`, { body: { participantToken: st.json.token, answers: Object.fromEntries(st.json.scenarios.map((s, i) => [s.id, FLAG[grid[i]]])) } });
const today = (u, tz = TZ) => call("GET", `/api/solo/red-flag/today?timezone=${encodeURIComponent(tz)}`, { jwt: u.jwt });

try {
  const A = await mkUser("a"), B = await mkUser("b");
  const setDate = localDate(new Date(), TZ);
  const startCoins = await coins(A);

  // ── today ───────────────────────────────────────────────────────────────────
  let r = await call("GET", "/api/solo/red-flag/today");
  ok(r.status === 401 && r.json?.error?.code === "UNAUTHORIZED", "today: kimliksiz → 401");
  r = await today(A);
  const cats = r.json?.categories ?? [];
  ok(r.status === 200 && r.json.setDate === setDate && r.json.setNumber === setNumber(setDate) && !!r.json.nextSetAt, "today: 200, setDate/setNumber/nextSetAt");
  ok(cats.length === 2 && cats.every((c) => c.played === false && /^(friend|romantic)-\d+$/.test(c.pack)) && new Set(cats.map((c) => c.category)).size === 2, "today: iki kategori, oynanmamış, set anahtarı biçimli");
  ok(r.json.rewardAvailable === true, "today: ödül alınabilir");
  ok(Math.abs(new Date(r.json.nextSetAt) - new Date(nextSetAt(new Date(), TZ))) < 1000, "today: nextSetAt yerel gece yarısı");
  const again = await today(B);
  ok(JSON.stringify(again.json.categories.map((c) => c.pack)) === JSON.stringify(cats.map((c) => c.pack)), "today: başka kullanıcı aynı gün aynı setleri görür");
  const bad = await today(A, "Mars/Olympus");
  ok(bad.status === 200 && bad.json.setDate === setDate, "today: geçersiz saat dilimi → varsayılan (Europe/Istanbul)");
  const { data: stored } = await db.from("solo_daily_sets").select("category, pack_key").eq("set_date", setDate);
  ok(stored?.length === 2 && stored.every((s) => cats.some((c) => c.category === s.category && c.pack === s.pack_key)), "solo_daily_sets: günün seti kategori başına yazıldı");

  // ── start: kip kuralları ────────────────────────────────────────────────────
  r = await call("POST", "/api/solo/red-flag/start", { body: { platform: "web", category: "friend", timezone: TZ, locale: "tr" } });
  ok(r.status === 403 && r.json?.error?.code === "DAILY_MOBILE_ONLY", "start: web + günlük kip → 403 DAILY_MOBILE_ONLY");
  r = await call("POST", "/api/solo/red-flag/start", { body: { platform: "mobile", category: "friend", timezone: TZ, locale: "tr" } });
  ok(r.status === 401, "start: mobil + kimliksiz → 401");
  r = await startDaily(A, "couples");
  ok(r.status === 400 && r.json?.error?.code === "INVALID_PAYLOAD", "start: geçersiz kategori → 400");

  // ── Günlük oyun: başlat → tamamla → ödül ────────────────────────────────────
  const friend = cats.find((c) => c.category === "friend"), romantic = cats.find((c) => c.category === "romantic");
  const st1 = await startDaily(A, "friend");
  ok(st1.status === 201 && st1.json.pack === friend.pack && st1.json.category === "friend" && st1.json.setDate === setDate && st1.json.setNumber === setNumber(setDate) && st1.json.scenarios.length === 9 && !!st1.json.nextSetAt, "start: 201, günün seti, 9 kart, setDate/setNumber/nextSetAt");
  const { data: row } = await db.from("solo_sessions").select("set_date, pack_key, user_id, platform").eq("id", st1.json.sessionId).single();
  ok(row.set_date === setDate && row.pack_key === friend.pack && row.user_id === A.id && row.platform === "mobile", "oturum: set_date, pack_key, user_id kaydedildi");
  const st1b = await startDaily(A, "friend");
  ok(st1b.status === 201 && st1b.json.sessionId !== st1.json.sessionId, "tamamlamadan tekrar başlatma serbest (yarım kalan oturum)");

  r = await finish(st1);
  ok(r.status === 200 && r.json.reward?.earned === 50 && r.json.reward.balance === startCoins + 50 && r.json.grid === "GRGYGYRYR" && typeof r.json.tolerance === "number", "complete: 200, +50 coin, sonuç şekli aynı (grid, tolerance)");
  ok((await coins(A)) === startCoins + 50, "bakiye +50");
  const { data: tx } = await db.from("credit_transactions").select("delta, reason, ref_id").eq("user_id", A.id).eq("reason", "solo_reward");
  ok(tx?.length === 1 && tx[0].delta === 50 && tx[0].ref_id === `daily:${setDate}`, "defter: solo_reward +50, ref daily:<set_date>");
  r = await finish(st1);
  ok(r.status === 200 && r.json.reward?.earned === 50 && (await coins(A)) === startCoins + 50, "complete tekrarı: aynı sonuç, ikinci ödül yok");

  r = await startDaily(A, "friend");
  ok(r.status === 409 && r.json?.error?.code === "ALREADY_PLAYED_TODAY" && r.json.error.sessionId === st1.json.sessionId, "aynı kategoriyi tekrar başlat → 409 ALREADY_PLAYED_TODAY + sessionId");
  r = await finish(st1b);
  ok(r.status === 409 && r.json?.error?.code === "ALREADY_PLAYED_TODAY", "yarım kalan ikinci oturumu tamamlama → 409 (benzersiz indeks)");
  ok((await coins(A)) === startCoins + 50, "409 sonrası bakiye değişmedi");

  // ── İkinci kategori: oynanır ama coin yok ───────────────────────────────────
  const st2 = await startDaily(A, "romantic");
  ok(st2.status === 201 && st2.json.pack === romantic.pack, "ikinci kategori başlatıldı");
  r = await finish(st2, "RRRRRRRRR");
  ok(r.status === 200 && r.json.reward?.earned === 0 && r.json.reward.reason === "already_rewarded" && r.json.reward.balance === startCoins + 50, "ikinci kategori: coin yok (already_rewarded), bakiye aynı");

  // ── today / history güncellendi ─────────────────────────────────────────────
  r = await today(A);
  const pf = r.json.categories.find((c) => c.category === "friend"), pr = r.json.categories.find((c) => c.category === "romantic");
  ok(pf.played && pf.sessionId === st1.json.sessionId && pf.grid === "GRGYGYRYR" && pf.counts.red === 3 && pf.coinsEarned === 50 && pr.played && pr.counts.red === 9 && pr.coinsEarned === 0, "today: iki kategori oynandı, sessionId/grid/counts/coinsEarned");
  ok(r.json.rewardAvailable === false, "today: ödül alındı (rewardAvailable false)");
  const other = await today(B);
  ok(other.json.categories.every((c) => c.played === false) && other.json.rewardAvailable === true, "başka kullanıcının durumu etkilenmedi");
  r = await call("GET", "/api/users/solo-history", { jwt: A.jwt });
  const item = r.json?.items?.find((i) => i.sessionId === st1.json.sessionId);
  ok(item?.setDate === setDate && item.setNumber === setNumber(setDate) && item.pack === friend.pack, "solo-history: setDate + setNumber");
  r = await call("GET", `/api/users/solo-history/${st1.json.sessionId}`, { jwt: A.jwt });
  ok(r.status === 200 && r.json.setDate === setDate && r.json.setNumber === setNumber(setDate) && r.json.cards.length === 9, "solo-history/{id}: setDate + setNumber + kartlar");

  // ── Başka kullanıcı: kendi ödülü ────────────────────────────────────────────
  const bst = await startDaily(B, "romantic");
  ok(bst.status === 201 && bst.json.pack === romantic.pack, "B aynı günün aynı setini alır");
  r = await finish(bst, "GGGGGGGGG");
  ok(r.json.reward?.earned === 50, "B ilk oyununda +50 alır (ödül kullanıcı başına)");

  // ── Serbest kip (pack) ödülsüz, web kipi bozulmadı ──────────────────────────
  const before = await coins(A);
  const fr = await call("POST", "/api/solo/red-flag/start", { jwt: A.jwt, body: { platform: "mobile", pack: "friend-102", locale: "tr" } });
  ok(fr.status === 201 && fr.json.setDate === undefined, "mobil + pack (serbest): açılır, günlük alanı yok");
  r = await finish(fr);
  ok(r.status === 200 && r.json.reward === undefined && (await coins(A)) === before, "serbest kip: ödül yok");
  const web = await call("POST", "/api/solo/red-flag/start", { body: { platform: "web", pack: "friend-101", locale: "tr" } });
  ok(web.status === 201, "web + pack: eskisi gibi çalışır");
  webSessions.push(web.json.sessionId);
  r = await call("POST", "/api/solo/red-flag/start", { body: { platform: "web", pack: "friend-104", locale: "tr" } });
  ok(r.status === 403 && r.json?.error?.code === "PACK_UNAVAILABLE", "web + kapalı set → 403 PACK_UNAVAILABLE (değişmedi)");
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
