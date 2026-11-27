// Coin ekonomisi entegrasyon testi (gerçek Supabase + çalışan sunucu):
//   npx next dev -p 3001        sonra:   BASE=http://localhost:3001 node --no-warnings scripts/test-coin-economy-api.mjs
// Kapsam: kayıt bonusu, oda ücreti (free 100; lite+ ücretsiz ve sınırsız), reklam/story kazancı ve limitleri, spend fiyatları,
// kullanıcının kendi tier/bakiyesini yazamaması. Geçici kullanıcı/oda açar (adlar TEST-), sonunda siler.
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
const newIp = () => `198.58.${stamp % 250}.${(++ipSeq % 250) + 1}`;
const users = [];
const roomCodes = [];

async function call(path, { jwt, body, ip = newIp() } = {}) {
  usedKeys.add(ipKey(ip));
  const headers = { "Content-Type": "application/json", "x-forwarded-for": ip };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  const r = await fetch(BASE + path, { method: "POST", headers, body: JSON.stringify(body) });
  const json = await r.json().catch(() => null);
  if (json?.roomCode) roomCodes.push(json.roomCode);
  return { status: r.status, json };
}
const room = (u, ip, extra = {}) => call("/api/rooms/create", { jwt: u?.jwt, ip, body: { ...(u ? { platform: "mobile" } : {}), displayName: "TEST-A", locale: "tr", relationshipType: "dating", gameMode: "secret_choice", questionCount: 5, ...extra } });
const mkUser = async (tag) => {
  const email = `test-coin-${tag}-${stamp}@example.com`, password = `Pw-${stamp}-${tag}!`;
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true }); if (error) throw error;
  const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const { data: s } = await client.auth.signInWithPassword({ email, password });
  usedKeys.add(`u:${data.user.id}`);
  const u = { id: data.user.id, jwt: s.session.access_token, client };
  users.push(u); return u;
};
const row = async (u) => (await db.from("users").select("room_credits, tier").eq("id", u.id).single()).data;
const coins = async (u) => (await row(u)).room_credits;
const set = (u, patch) => db.from("users").update(patch).eq("id", u.id);
const roomTx = async (u) => (await db.from("credit_transactions").select("reason, delta").eq("user_id", u.id).in("reason", ["room_create", "room_create_refund"])).data;

try {
  const free = await mkUser("free");
  ok((await coins(free)) === 500, "kayıt bonusu 500 (değişmedi)");

  // Kullanıcı kendi tier'ını/bakiyesini yazamaz (lite+ artık ücretsiz oda demek)
  await free.client.from("users").update({ tier: "lite", room_credits: 999999 }).eq("id", free.id);
  const after = await row(free);
  ok(after.tier === "free" && after.room_credits === 500, "kullanıcı kendi tier'ını/bakiyesini değiştiremez (RLS)");

  // free: oda 100
  let r = await room(free);
  ok(r.status === 201 && (await coins(free)) === 400, `free: oda → 201, −100 (status ${r.status})`);
  await set(free, { room_credits: 99 });
  r = await room(free);
  ok(r.status === 402 && r.json?.error?.code === "INSUFFICIENT_COINS" && (await coins(free)) === 99, "free: 99 coin → 402, bakiye aynı");
  await set(free, { room_credits: 100 });
  r = await room(free);
  ok(r.status === 201 && (await coins(free)) === 0, "free: tam 100 coin → 201, bakiye 0");

  // free: hız sınırı sürüyor (aynı IP'den saatte 10)
  await set(free, { room_credits: 5000 });
  const freeIp = newIp();
  const freeStatuses = [];
  for (let i = 0; i < 11; i++) { freeStatuses.push((await room(free, freeIp)).status); await new Promise((x) => setTimeout(x, 150)); }
  ok(freeStatuses.slice(0, 10).every((s) => s === 201) && freeStatuses[10] === 429, `free: aynı IP'den 10 oda, 11. → 429 (${freeStatuses.join(",")})`);
  ok((await coins(free)) === 4000, "free: 429 alan istekte coin düşmedi (5000 − 10×100)");

  // lite / premium: ücretsiz ve sınırsız
  for (const tier of ["lite", "premium"]) {
    const u = await mkUser(tier);
    await set(u, { tier, room_credits: 0 });
    r = await room(u);
    ok(r.status === 201 && (await coins(u)) === 0, `${tier}: 0 coin ile oda → 201, bakiye 0`);
    r = await room(u, undefined, { gameMode: "mixed", questionCount: 10 });
    ok(r.status === 201 && (await coins(u)) === 0, `${tier}: Karma + 10 soru → 201, ücretsiz`);
    ok((await roomTx(u)).length === 0, `${tier}: deftere oda hareketi yazılmadı (düşüm de iade de yok)`);
    if (tier === "lite") {
      const st = [];
      for (let i = 0; i < 12; i++) st.push((await room(u, freeIp)).status); // IP zaten sınırda
      ok(st.every((s) => s === 201), `lite: sınırdaki IP'den bile 12 oda → hepsi 201 (${st.join(",")})`);
      await set(u, { room_credits: 700 });
      r = await room(u);
      ok(r.status === 201 && (await coins(u)) === 700, "lite: bakiyesi olsa da coin düşmez");
    }
  }

  // web anonim: ücretsiz, hız sınırı aynı
  r = await room(null);
  ok(r.status === 201, "web anonim → 201 (değişmedi)");
  r = await room(null, freeIp);
  ok(r.status === 429, "web anonim: sınırdaki IP → 429 (değişmedi)");

  // Kazanımlar
  const earner = await mkUser("earn");
  for (let i = 1; i <= 3; i++) r = await call("/api/users/coins/earn", { jwt: earner.jwt, body: { reason: "ad_reward", refId: `ad-${stamp}-${i}` } });
  ok(r.status === 200 && r.json.earned === 20 && r.json.balance === 560, "reklam +20 ×3 → 560");
  r = await call("/api/users/coins/earn", { jwt: earner.jwt, body: { reason: "ad_reward", refId: `ad-${stamp}-4` } });
  ok(r.status === 429 && r.json?.error?.code === "AD_LIMIT_REACHED" && (await coins(earner)) === 560, "4. reklam → 429");
  r = await call("/api/users/coins/earn", { jwt: earner.jwt, body: { reason: "story_share", refId: `story-${stamp}-1` } });
  ok(r.status === 200 && r.json.earned === 25 && r.json.balance === 585, "story +25 (değişmedi)");
  r = await call("/api/users/coins/earn", { jwt: earner.jwt, body: { reason: "story_share", refId: `story-${stamp}-2` } });
  ok(r.status === 429 && r.json?.error?.code === "STORY_LIMIT_REACHED", "2. story → 429");

  // spend: AI fiyatları
  await set(earner, { room_credits: 600 });
  for (const reason of ["ai_commentary", "solo_ai"]) {
    r = await call("/api/users/coins/spend", { jwt: earner.jwt, body: { reason, refId: `spend-${reason}-${stamp}` } });
    ok(r.status === 200 && r.json.spent === 250, `spend ${reason} → 250`);
  }
  r = await call("/api/users/coins/spend", { jwt: earner.jwt, body: { reason: "ai_commentary", refId: `spend-low-${stamp}` } });
  ok(r.status === 402 && (await coins(earner)) === 100, "100 coin ile AI → 402");
} catch (err) {
  console.error("✗ beklenmeyen hata:", err);
  fails++;
} finally {
  for (const u of users) {
    try { await db.rpc("delete_user_account", { p_user: u.id }); } catch { /* */ }
    try { await db.auth.admin.deleteUser(u.id); } catch { /* */ }
  }
  if (roomCodes.length) await db.from("rooms").delete().in("room_code", roomCodes);
  await db.from("rate_limits").delete().in("key", [...usedKeys]);
  console.log(fails ? `\n${fails} test BAŞARISIZ` : "\nTüm testler geçti");
  process.exit(fails ? 1 : 0);
}
