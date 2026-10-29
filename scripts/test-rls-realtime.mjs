// RLS + Realtime testi (gerçek Supabase; sunucu gerekmez):
//   node --no-warnings scripts/test-rls-realtime.mjs
// Önkoşul: supabase/migrations/20260622000000_rls_rooms_members_only.sql uygulanmış olmalı.
// Doğrular: anon anahtarla oda/katılımcı listelenemez; oda üyesi (authenticated) Realtime ile kendi odasının status
// güncellemesini alır; üye olmayan ve anon almaz.
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(readFileSync(".env", "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const URL = env.NEXT_PUBLIC_SUPABASE_URL, ANON = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const db = createClient(URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const stamp = Date.now();
let fails = 0;
const ok = (c, m) => { console.log((c ? "✔ " : "✗ ") + m); if (!c) fails++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const users = [];
let roomId = null;

const mkClient = () => createClient(URL, ANON, { auth: { persistSession: false } });
async function mkUser(tag) {
  const email = `test-rls-${tag}-${stamp}@example.com`, password = `Pw-${stamp}-${tag}!`;
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true }); if (error) throw error;
  const cl = mkClient();
  const { error: e2 } = await cl.auth.signInWithPassword({ email, password }); if (e2) throw e2;
  users.push(data.user.id);
  return { id: data.user.id, cl };
}
// Kanalı abone eder, SUBSCRIBED olana kadar bekler, gelen status değerlerini listeye yazar
function listen(cl, code) {
  const got = [];
  const ch = cl.channel(`t-${crypto.randomBytes(4).toString("hex")}`).on(
    "postgres_changes",
    { event: "UPDATE", schema: "public", table: "rooms", filter: `room_code=eq.${code}` },
    (p) => got.push(p.new?.status),
  );
  const ready = new Promise((res) => ch.subscribe((s) => { if (s === "SUBSCRIBED" || s === "CHANNEL_ERROR" || s === "TIMED_OUT") res(s); }));
  return { got, ready, ch };
}

try {
  const A = await mkUser("a"), B = await mkUser("b"), C = await mkUser("c");
  const code = crypto.randomBytes(3).toString("hex").toUpperCase().replace(/[01OIL]/g, "7");
  const { data: room, error } = await db.from("rooms").insert({ room_code: code, question_count: 5, expires_at: new Date(Date.now() + 86400e3).toISOString(), locale: "tr", user_id: A.id }).select("id").single();
  if (error) throw error;
  roomId = room.id;
  const hash = () => crypto.randomBytes(32).toString("hex");
  await db.from("participants").insert([
    { room_id: roomId, role: "owner", token_hash: hash(), display_name: "TEST-A", user_id: A.id },
    { room_id: roomId, role: "guest", token_hash: hash(), display_name: "TEST-B", user_id: B.id },
  ]);

  // ── PostgREST: anon ──────────────────────────────────────────────────────────
  const anon = mkClient();
  let r = await anon.from("rooms").select("room_code", { count: "exact" }).limit(1);
  ok((r.data?.length ?? 0) === 0 && (r.count ?? 0) === 0, `anon: rooms listelenemez (satır=${r.data?.length ?? "hata"}, count=${r.count}, ${r.error?.code ?? "hata yok"})`);
  r = await anon.from("participants").select("display_name").limit(1);
  ok((r.data?.length ?? 0) === 0, `anon: participants okunamaz (${r.error?.code ?? "boş"})`);
  r = await anon.from("participants").select("token_hash").limit(1);
  ok(!!r.error, "anon: token_hash hâlâ kapalı");

  // ── PostgREST: authenticated ─────────────────────────────────────────────────
  r = await A.cl.from("rooms").select("room_code");
  ok(r.data?.length === 1 && r.data[0].room_code === code, "üye A: yalnızca kendi odasını görür (başkasının odası listelenmez)");
  r = await C.cl.from("rooms").select("room_code").eq("room_code", code);
  ok((r.data?.length ?? 0) === 0, "üye olmayan C: odayı göremez");
  r = await A.cl.from("participants").select("display_name").limit(1);
  ok((r.data?.length ?? 0) === 0, "authenticated: participants okunamaz");

  // ── Realtime ─────────────────────────────────────────────────────────────────
  const la = listen(A.cl, code), lb = listen(B.cl, code), lc = listen(C.cl, code), ln = listen(anon, code);
  const states = await Promise.all([la.ready, lb.ready, lc.ready, ln.ready]);
  ok(states[0] === "SUBSCRIBED" && states[1] === "SUBSCRIBED", `üyeler abone oldu (${states.join(", ")})`);
  await sleep(3000); // SUBSCRIBED sonrası sunucu tarafı kayıt gecikebilir
  await db.from("rooms").update({ status: "guest_joined" }).eq("id", roomId);
  for (let i = 0; i < 20 && !(la.got.length && lb.got.length); i++) await sleep(500); // üyeler için en çok 10 sn bekle
  await sleep(3000); // olmaması gerekenler için ek bekleme
  ok(la.got.includes("guest_joined"), `Realtime: üye A (kurucu) status güncellemesini aldı (${JSON.stringify(la.got)})`);
  ok(lb.got.includes("guest_joined"), `Realtime: üye B (katılımcı) status güncellemesini aldı (${JSON.stringify(lb.got)})`);
  ok(lc.got.length === 0, "Realtime: üye olmayan C olay almadı");
  ok(ln.got.length === 0, "Realtime: anon olay almadı");
  for (const l of [la, lb, lc, ln]) await l.ch.unsubscribe();
} finally {
  if (roomId) await db.from("rooms").delete().eq("id", roomId);
  for (const id of users) {
    try { await db.rpc("delete_user_account", { p_user: id }); } catch { /* yok say */ }
    try { await db.auth.admin.deleteUser(id); } catch { /* yok say */ }
  }
  console.log(fails ? `\n${fails} test BAŞARISIZ` : "\nTüm testler geçti");
  process.exit(fails ? 1 : 0);
}
