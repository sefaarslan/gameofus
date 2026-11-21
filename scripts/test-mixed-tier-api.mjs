// Karma Tur (gameMode "mixed") paket kilidi entegrasyon testi (gerçek Supabase + çalışan sunucu):
//   npx next dev -p 3001        sonra:   BASE=http://localhost:3001 node --no-warnings scripts/test-mixed-tier-api.mjs
// Geçici kullanıcı/oda açar (adlar TEST- ile başlar), sonunda siler.
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
const newIp = () => `198.57.${stamp % 250}.${(++ipSeq % 250) + 1}`;
const users = [];
const roomCodes = [];

async function create(body, jwt) {
  const ip = newIp();
  usedKeys.add(ipKey(ip));
  const headers = { "Content-Type": "application/json", "x-forwarded-for": ip };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  const r = await fetch(BASE + "/api/rooms/create", { method: "POST", headers, body: JSON.stringify({ displayName: "TEST-A", locale: "tr", relationshipType: "dating", ...body }) });
  const json = await r.json().catch(() => null);
  if (json?.roomCode) roomCodes.push(json.roomCode);
  return { status: r.status, json };
}
const mkUser = async (tag, tier) => {
  const email = `test-mixed-${tag}-${stamp}@example.com`, password = `Pw-${stamp}-${tag}!`;
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true }); if (error) throw error;
  const cl = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const { data: s } = await cl.auth.signInWithPassword({ email, password });
  await db.from("users").update({ tier, room_credits: 1000 }).eq("id", data.user.id);
  const u = { id: data.user.id, jwt: s.session.access_token };
  users.push(u); return u;
};
const coins = async (u) => (await db.from("users").select("room_credits").eq("id", u.id).single()).data.room_credits;
const mobile = (mode, extra = {}) => ({ platform: "mobile", gameMode: mode, questionCount: 5, ...extra });

try {
  const free = await mkUser("free", "free"), lite = await mkUser("lite", "lite"), prem = await mkUser("prem", "premium");

  // free + mixed → 403, coin düşmez
  let before = await coins(free);
  let r = await create(mobile("mixed"), free.jwt);
  ok(r.status === 403 && r.json?.error?.code === "TIER_REQUIRED", `free + mixed → 403 TIER_REQUIRED (status ${r.status})`);
  ok((await coins(free)) === before, "free + mixed: coin düşmedi");
  r = await create(mobile("mixed", { questionCount: 10 }), free.jwt);
  ok(r.status === 403 && r.json?.error?.code === "TIER_REQUIRED" && (await coins(free)) === before, "free + mixed + 10 soru → 403, coin düşmedi");

  // free + diğer modlar → 201, oda ücreti düşer
  for (const m of ["secret_choice", "prediction", "orderline"]) {
    before = await coins(free);
    r = await create(mobile(m), free.jwt);
    ok(r.status === 201 && (await coins(free)) < before, `free + ${m} → 201, coin düştü (status ${r.status})`);
  }
  // free + 10 soru (mixed değil) hâlâ eski kuralla 403
  r = await create(mobile("prediction", { questionCount: 10 }), free.jwt);
  ok(r.status === 403 && r.json?.error?.code === "TIER_REQUIRED", "free + prediction + 10 soru → 403 (eski kural değişmedi)");

  // lite/premium + mixed → 201
  for (const [n, u] of [["lite", lite], ["premium", prem]]) {
    before = await coins(u);
    r = await create(mobile("mixed"), u.jwt);
    ok(r.status === 201 && (await coins(u)) < before, `${n} + mixed → 201, coin düştü (status ${r.status})`);
  }
  r = await create(mobile("mixed", { questionCount: 10 }), lite.jwt);
  ok(r.status === 201, `lite + mixed + 10 soru → 201 (status ${r.status})`);

  // mobil, JWT yok → 401 (kilitten önce)
  r = await create(mobile("mixed"));
  ok(r.status === 401, "mobil + mixed + JWT yok → 401");

  // web anonim: değişmedi
  r = await create({ gameMode: "mixed", questionCount: 5 });
  ok(r.status === 201, `web anonim + mixed → 201, değişmedi (status ${r.status})`);
  r = await create({ gameMode: "mixed", questionCount: 10 });
  ok(r.status === 201, `web anonim + mixed + 10 soru → 201 (status ${r.status})`);
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
