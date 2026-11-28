// Blöf modu entegrasyon testi (gerçek Supabase + çalışan sunucu; önce 20260624000000_bluff_mode.sql uygulanmış olmalı):
//   npx next dev -p 3001        sonra:   BASE=http://localhost:3001 node --no-warnings scripts/test-bluff-api.mjs
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
const newIp = () => { const ip = `198.58.${stamp % 250}.${(++ipSeq % 250) + 1}`; usedKeys.add(ipKey(ip)); return ip; };
const users = [];
const roomCodes = [];

async function call(method, path, { body, token, jwt } = {}) {
  const headers = { "Content-Type": "application/json", "x-forwarded-for": newIp() };
  const auth = jwt ?? token;
  if (auth) headers.Authorization = `Bearer ${auth}`;
  const r = await fetch(BASE + path, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* gövdesiz */ }
  return { status: r.status, json, text };
}
const code = (r) => r.json?.error?.code;

const mkUser = async (tag) => {
  const email = `test-bluff-${tag}-${stamp}@example.com`, password = `Pw-${stamp}-${tag}!`;
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true }); if (error) throw error;
  const cl = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const { data: s } = await cl.auth.signInWithPassword({ email, password });
  await db.from("users").update({ room_credits: 5000 }).eq("id", data.user.id);
  const u = { id: data.user.id, jwt: s.session.access_token, client: cl };
  users.push(u); return u;
};

/** Oda kurar ve konuğu katar. `hostUser` verilirse mobil oda; `guestUser` verilirse konuk da mobil. */
async function mkRoom({ mode = "bluff", count = 5, hostUser, guestUser, guestBody = {} } = {}) {
  const r = await call("POST", "/api/rooms/create", { jwt: hostUser?.jwt, body: { displayName: "TEST-A", locale: "tr", relationshipType: "friend", gameMode: mode, questionCount: count, ...(hostUser ? { platform: "mobile" } : {}) } });
  if (r.status !== 201) throw new Error(`oda kurulamadı: ${r.status} ${r.text}`);
  roomCodes.push(r.json.roomCode);
  const j = await call("POST", `/api/rooms/${r.json.roomCode}/join`, { jwt: guestUser?.jwt, body: { displayName: "TEST-B", ...(guestUser ? { platform: "mobile" } : {}), ...guestBody } });
  if (j.status !== 200) throw new Error(`katılınamadı: ${j.status} ${j.text}`);
  const room = { code: r.json.roomCode, host: { token: r.json.participant.token, id: r.json.participant.id }, guest: { token: j.json.participant.token, id: j.json.participant.id } };
  const s = await call("GET", `/api/rooms/${room.code}/state`, { token: room.host.token });
  room.state = s.json;
  room.questions = s.json.questions;
  return room;
}

const v = (value) => ({ value });
/** Bir oyuncunun tüm turlarını gönderir. truths/guesses: "yes"|"no" dizileri; lies: Yalan Kartı oynanan soru sıraları (0 tabanlı). */
async function play(room, who, { truths, lies = [], guesses }) {
  for (const [i, q] of room.questions.entries()) {
    const r = await call("POST", `/api/rooms/${room.code}/submit-turn`, {
      token: room[who].token,
      body: { questionId: q.questionId, answerValue: v(truths[i]), predictedValue: v(guesses[i]), ...(lies.includes(i) ? { isLie: true } : {}) },
    });
    if (r.status !== 200) throw new Error(`tur kaydedilemedi: ${r.status} ${r.text}`);
  }
}
const complete = (room, who, extra = {}) => call("POST", `/api/rooms/${room.code}/complete`, { token: room[who].token, body: extra });
const results = (room, who) => call("GET", `/api/rooms/${room.code}/results`, { token: room[who].token });
/** picks: "Blöf!" denen soru sıraları (0 tabanlı) */
const sendCalls = (room, who, picks) => call("POST", `/api/rooms/${room.code}/bluff-calls`, { token: room[who].token, body: { suspects: picks.map((i) => room.questions[i]?.questionId ?? i) } });
const all = (x) => Array(5).fill(x);

try {
  // Migration kontrolü
  const probe = await db.from("answers").select("shown_value").limit(1);
  if (probe.error) throw new Error("Migration uygulanmamış: supabase/migrations/20260624000000_bluff_mode.sql");

  console.log("— Oyun akışı (web)");
  const room = await mkRoom();
  ok(room.state.room.gameMode === "bluff" && room.questions.length === 5 && room.questions.every((q) => q.mode === "secret_choice"), "bluff odası 5 Evet/Hayır sorusuyla kuruldu");
  ok(room.state.bluff?.lieCards === 2, "state: 5 soruda 2 Yalan Kartı");
  const q0 = room.questions[0].questionId;
  let r = await call("POST", `/api/rooms/${room.code}/submit-turn`, { token: room.host.token, body: { questionId: q0, answerValue: v("unsure"), predictedValue: v("yes") } });
  ok(r.status === 400 && code(r) === "INVALID_PAYLOAD", "blöf modunda 'Kararsız' cevap reddedilir");
  r = await call("POST", `/api/rooms/${room.code}/submit-turn`, { token: room.host.token, body: { questionId: q0, answerValue: v("yes"), predictedValue: v("unsure") } });
  ok(r.status === 400, "blöf modunda 'Kararsız' tahmin reddedilir");
  r = await complete(room, "host");
  ok(r.status === 400 && code(r) === "INVALID_PAYLOAD", "sorular bitmeden complete reddedilir");

  // Kurucu hiç kart oynamadan oynar
  await play(room, "host", { truths: ["yes", "no", "yes", "yes", "no"], guesses: all("yes") });
  r = await call("GET", `/api/rooms/${room.code}/state`, { token: room.host.token });
  ok(r.json.bluff?.myAnswers.length === 5 && r.json.progress.answeredCount === 5, "state: kendi cevapların döner");
  r = await call("GET", `/api/rooms/${room.code}/state`, { token: room.guest.token });
  ok(r.json.bluff?.myAnswers.length === 0, "state: karşı tarafın cevapları dönmez");
  r = await sendCalls(room, "host", [0]);
  ok(code(r) === "RESULT_NOT_READY", "iki taraf bitmeden blöf avı yapılamaz");

  r = await complete(room, "host");
  ok(r.status === 400 && code(r) === "LIE_REQUIRED", "yalansız complete → LIE_REQUIRED (sunucu)");
  const { data: me } = await db.from("participants").select("status").eq("id", room.host.id).single();
  ok(me.status !== "completed", "reddedilen oyuncu tamamlandı sayılmadı");
  r = await complete(room, "host", { lieQuestionId: crypto.randomUUID() });
  ok(r.status === 400 && code(r) === "INVALID_PAYLOAD", "complete: odaya ait olmayan soru reddedilir");
  r = await complete(room, "host", { lieQuestionId: q0 });
  ok(r.status === 200 && r.json.completed === true && r.json.resultReady === false, "complete: sondaki kartla tamamlandı");

  // Konuk: 2. ve 4. soruda kart; üçüncüsü reddedilir
  const guestTruths = ["no", "yes", "no", "no", "yes"];
  const turn = (i, extra = {}) => call("POST", `/api/rooms/${room.code}/submit-turn`, { token: room.guest.token, body: { questionId: room.questions[i].questionId, answerValue: v(guestTruths[i]), predictedValue: v(["yes", "no", "no", "yes", "yes"][i]), ...extra } });
  for (const [i, lie] of [[0, false], [1, true], [2, false], [3, true]]) await turn(i, lie ? { isLie: true } : {});
  r = await turn(4, { isLie: true });
  ok(r.status === 400 && code(r) === "LIE_LIMIT", "üçüncü Yalan Kartı → LIE_LIMIT");
  r = await turn(4);
  ok(r.status === 200, "reddedilen soru kartsız gönderilebilir (hiçbir şey yazılmamıştı)");
  r = await complete(room, "guest");
  ok(r.status === 200 && r.json.resultReady === true, "ikinci bitiren → sonuç hazır");

  // Eşzamanlı gönderimle kart sınırı aşılamaz
  const p = await mkRoom();
  await Promise.all(p.questions.map((q) => call("POST", `/api/rooms/${p.code}/submit-turn`, { token: p.host.token, body: { questionId: q.questionId, answerValue: v("yes"), predictedValue: v("yes"), isLie: true } })));
  const { count: parallelLies } = await db.from("answers").select("*", { count: "exact", head: true }).eq("participant_id", p.host.id).not("shown_value", "is", null);
  ok(parallelLies <= 2, `5 eşzamanlı kart isteği sınırı aşmadı (yazılan yalan: ${parallelLies})`);

  console.log("— Blöf avı öncesi");
  r = await results(room, "host");
  ok(r.status === 200 && r.json.bluff?.phase === "call" && r.json.bluff.items.length === 5, "results: call aşaması, 5 madde");
  ok(!/readingScore|myScore|scoreLabel|partnerAnswer|answerValue|shownValue|Lie|result"/.test(r.text) && !("questions" in r.json), "results: skor, gerçek cevap, yalan bilgisi yok");
  ok(JSON.stringify(r.json.bluff.items.map((i) => i.shownAnswer.value)) === JSON.stringify(["no", "no", "no", "yes", "yes"]), "results: yalanlı sorularda cevabın tersi döner");
  ok(Object.keys(r.json.bluff.items[0]).sort().join() === "myPrediction,questionId,questionText,roundOrder,shownAnswer", "results: madde yalnızca izinli alanları içerir");

  ok((await results(room, "host")).json.bluff.rights === 2, "results: 5 soruda 2 'Blöf!' hakkı");
  r = await sendCalls(room, "host", []);
  ok(r.status === 400 && code(r) === "INVALID_PAYLOAD", "hiç soru seçmeden gönderilemez");
  r = await sendCalls(room, "host", [0, 1, 2]);
  ok(r.status === 400 && code(r) === "INVALID_PAYLOAD", "haktan fazla soru reddedilir");
  r = await sendCalls(room, "host", [1, 1]);
  ok(r.status === 400, "aynı soru iki kez seçilemez");
  r = await sendCalls(room, "host", [crypto.randomUUID()]);
  ok(r.status === 400, "odaya ait olmayan soru reddedilir");
  r = await call("POST", `/api/rooms/${room.code}/bluff-calls`, { token: "0".repeat(64), body: { suspects: [] } });
  ok(r.status === 403 && code(r) === "INVALID_TOKEN", "yabancı token → 403");

  // Konuğun yalanları 2. ve 4. soruda. Kurucu 1. (doğru) ve 2. (yalan) soruya "Blöf!" der
  const twice = await Promise.all([sendCalls(room, "host", [0, 1]), sendCalls(room, "host", [0, 1])]);
  ok(twice.filter((x) => x.status === 200).length === 1 && twice.filter((x) => code(x) === "ALREADY_SUBMITTED").length === 1, "eşzamanlı iki gönderim: yalnızca biri kabul edilir");
  ok(!/correct|caught|isLie|shown/i.test(twice.find((x) => x.status === 200).text), "bluff-calls yanıtı doğruluk bilgisi taşımaz");
  r = await sendCalls(room, "host", [3]);
  ok(code(r) === "ALREADY_SUBMITTED", "ikinci kez gönderilemez");

  console.log("— Açılış");
  r = await results(room, "host");
  ok(r.json.bluff?.phase === "reveal" && r.json.questions.length === 5 && typeof r.json.readingScore === "number", "reveal: tam sonuç");
  const mineSum = r.json.bluff.me;
  ok(mineSum.caught === 1 && mineSum.total === 2 && mineSum.falseAlarms === 1 && mineSum.lies === 1 && mineSum.fooled === null, "reveal: 2 yalandan 1'i yakalandı, 1 boşa; kandırma bekliyor");
  ok(mineSum.titles.length === 0 && r.json.bluff.partner.callsDone === false && r.json.bluff.partner.fooled === 1, "reveal: unvan yok, karşı taraf bir kez kandırdı");
  const row2 = r.json.questions.find((q) => q.roundOrder === 2);
  ok(row2.bluff.partnerLie === true && row2.bluff.myCall === "bluff" && row2.partnerAnswer.value === "yes" && row2.bluff.partnerShownAnswer.value === "no" && row2.bluff.partnerCall === null, "reveal: soru dökümü");
  r = await results(room, "guest");
  ok(r.json.bluff?.phase === "call", "karşı taraf kendi avını yapmadan hâlâ call aşamasında");
  // Konuk, kurucunun tek yalanını (1. soru) kaçırır: 2. ve 3. soruya "Blöf!" der
  r = await sendCalls(room, "guest", [1, 2]);
  ok(r.status === 200, "konuk kararlarını gönderdi");
  r = await results(room, "host");
  ok(r.json.bluff.me.fooled === 1 && r.json.bluff.partner.callsDone && r.json.bluff.partner.caught === 0 && r.json.bluff.partner.total === 1, "reveal: kandırma ve karşı av puanı doldu");
  ok(r.json.bluff.partner.titles.join() === "too_skeptical" && r.json.bluff.me.titles.join() === "poker_face", "reveal: iki tarafın unvanları");

  console.log("— Mobil: geçmiş, AI, RLS");
  const A = await mkUser("a"), B = await mkUser("b");
  const m = await mkRoom({ hostUser: A, guestUser: B });
  await play(m, "host", { truths: all("yes"), lies: [0], guesses: all("yes") });
  await play(m, "guest", { truths: all("yes"), lies: [0], guesses: all("yes") });
  await Promise.all([complete(m, "host"), complete(m, "guest")]);
  const item = async (u) => (await call("GET", "/api/users/history", { jwt: u.jwt })).json.find((x) => x.roomCode === m.code);
  let h = await item(A);
  ok(h.resultReady === true && h.bluffPending === true && h.readingScore === null && h.gameMode === "bluff", "history: av bekliyor, skor gizli");
  const ov = await call("GET", "/api/users/overview?include=history", { jwt: A.jwt });
  const ovItem = ov.json?.history?.find((x) => x.roomCode === m.code);
  ok(!!ovItem && ovItem.readingScore === null && ovItem.bluffPending === true, "overview: av bekliyor, skor gizli");
  for (const method of ["GET", "POST"]) {
    r = await call(method, `/api/rooms/${m.code}/ai-commentary`, { jwt: A.jwt });
    ok(r.status === 403 && code(r) === "AI_MODE_UNSUPPORTED", `AI yorum ${method} → AI_MODE_UNSUPPORTED`);
  }
  for (const [name, client] of [["anon", createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } })], ["giriş yapmış oyuncu", A.client]]) {
    const a = await client.from("answers").select("shown_value, answer_value").limit(1);
    const p = await client.from("predictions").select("bluff_call").limit(1);
    ok((!!a.error || a.data.length === 0) && (!!p.error || p.data.length === 0), `RLS: ${name} answers/predictions okuyamaz`);
    const f = await client.rpc("submit_bluff_calls", { p_room: crypto.randomUUID(), p_caller: crypto.randomUUID(), p_calls: {} });
    ok(!!f.error, `RLS: ${name} submit_bluff_calls çağıramaz`);
  }
  // Süresi dolmuş odada JWT ile blöf avı tamamlanabilir, token ile değil
  await db.from("rooms").update({ expires_at: new Date(Date.now() - 1000).toISOString() }).eq("room_code", m.code);
  r = await sendCalls(m, "host", [0]);
  ok(code(r) === "ROOM_EXPIRED", "süresi dolmuş oda: token ile ROOM_EXPIRED");
  r = await call("POST", `/api/rooms/${m.code}/bluff-calls`, { jwt: A.jwt, body: { suspects: [m.questions[0].questionId] } });
  ok(r.status === 200, "süresi dolmuş oda: JWT ile av tamamlanır");
  h = await item(A);
  ok(h.bluffPending === false && typeof h.readingScore === "number", "history: av sonrası skor görünür");

  const w = await mkRoom({ hostUser: A, guestBody: { aiConsent: true, birthDate: "1995-01-01" } });
  const { data: webGuest } = await db.from("participants").select("ai_consent_at").eq("id", w.guest.id).single();
  ok(webGuest.ai_consent_at === null, "bluff odasında web misafirinin AI rızası kaydedilmez");

  console.log("— Sızıntı: gösterilenler aynı, gerçekler farklı iki oda");
  const shownByHost = ["yes", "no", "yes", "yes", "no"];
  const variants = [
    { truths: ["no", "no", "yes", "yes", "no"], lies: [0] }, // 1. soru yalan
    { truths: ["yes", "yes", "yes", "no", "no"], lies: [1, 3] }, // 2. ve 4. soru yalan
  ];
  const traces = [];
  let sharedQuestions = null;
  for (const variant of variants) {
    const x = await mkRoom({ hostUser: A, guestUser: B });
    const { data: rec } = await db.from("rooms").select("id").eq("room_code", x.code).single();
    if (!sharedQuestions) sharedQuestions = x.questions;
    else {
      await db.from("room_questions").delete().eq("room_id", rec.id);
      await db.from("room_questions").insert(sharedQuestions.map((q) => ({ room_id: rec.id, question_id: q.questionId, round_order: q.roundOrder })));
      x.questions = sharedQuestions;
    }
    const trace = [];
    // Konuğa (B) giden her yanıt, kimlik/kod/zaman alanları temizlenerek kaydedilir
    // `state.participants` veritabanından sırasız döner (yalanlardan bağımsız): karşılaştırmadan önce role göre sıralanır
    const clean = (json) => JSON.stringify(json, (k, val) => {
      if (["id", "roomCode", "createdAt", "expiresAt", "completedAt"].includes(k)) return undefined;
      return k === "participants" && Array.isArray(val) ? val.slice().sort((a, b) => a.role.localeCompare(b.role)) : val;
    });
    const see = async (label) => {
      const st = await call("GET", `/api/rooms/${x.code}/state`, { token: x.guest.token });
      const hist = (await call("GET", "/api/users/history", { jwt: B.jwt })).json.find((i) => i.roomCode === x.code);
      const res = await results(x, "guest");
      trace.push(`${label} state=${clean(st.json)} history=${clean(hist)} results=${res.status}:${clean(res.json)}`);
    };
    await see("başlangıç");
    await play(x, "host", { truths: variant.truths, lies: variant.lies, guesses: all("yes") });
    await see("kurucu cevapladı");
    await complete(x, "host");
    await see("kurucu bitirdi");
    const turns = await (async () => {
      const out = [];
      for (const q of x.questions) out.push((await call("POST", `/api/rooms/${x.code}/submit-turn`, { token: x.guest.token, body: { questionId: q.questionId, answerValue: v("yes"), predictedValue: v("no"), isLie: q.roundOrder === 1 } })).json);
      return out;
    })();
    trace.push(`turlar=${clean(turns)}`);
    trace.push(`complete=${clean((await complete(x, "guest")).json)}`);
    await see("sonuç hazır");
    const seen = (await results(x, "guest")).json.bluff.items.map((i) => i.shownAnswer.value);
    ok(JSON.stringify(seen) === JSON.stringify(shownByHost), "konuk iki odada da aynı gösterilen cevapları görür");
    traces.push(trace);
  }
  ok(traces[0].length === traces[1].length && traces[0].every((line, i) => line === traces[1][i]), "açılıştan önce konuğa giden tüm yanıtlar birebir aynı (is_lie sızmıyor, türetilmiş bilgi de yok)");
  traces[0].forEach((line, i) => {
    const other = traces[1][i] ?? "";
    if (line === other) return;
    let at = 0;
    while (line[at] === other[at]) at++;
    console.log(`   fark (${i}. adım, ${at}. karakter):\n     A: …${line.slice(Math.max(0, at - 160), at + 120)}\n     B: …${other.slice(Math.max(0, at - 160), at + 120)}`);
  });

  console.log("— Eşzamanlı bitiş (tüm modlar)");
  for (const mode of ["bluff", "secret_choice", "secret_choice"]) {
    const x = await mkRoom({ mode });
    await play(x, "host", { truths: all("yes"), lies: mode === "bluff" ? [0] : [], guesses: all("yes") });
    await play(x, "guest", { truths: all("no"), lies: mode === "bluff" ? [0] : [], guesses: all("yes") });
    const both = await Promise.all([complete(x, "host"), complete(x, "guest")]);
    const { data: rec } = await db.from("rooms").select("id, status").eq("room_code", x.code).single();
    const { count } = await db.from("results").select("*", { count: "exact", head: true }).eq("room_id", rec.id);
    ok(both.every((y) => y.status === 200) && rec.status === "result_ready" && count === 1, `${mode}: aynı anda bitiş → tek sonuç, oda result_ready`);
    if (mode === "secret_choice") {
      const res = await results(x, "host");
      ok(res.status === 200 && !("bluff" in res.json) && !("bluff" in res.json.questions[0]), "diğer modların sonucu değişmedi");
      // Takılı kalmış oda (ikisi de tamamlandı, sonuç yok) tekrar complete ile iyileşir
      await db.from("results").delete().eq("room_id", rec.id);
      await db.from("rooms").update({ status: "guest_completed" }).eq("id", rec.id);
      const again = await complete(x, "host");
      ok(again.json.resultReady === true, "takılı kalmış oda tekrar complete ile sonuçlanır");
    }
  }
} catch (e) {
  ok(false, e.message);
} finally {
  if (roomCodes.length) await db.from("rooms").delete().in("room_code", roomCodes);
  for (const u of users) { await db.from("users").delete().eq("id", u.id); await db.auth.admin.deleteUser(u.id); }
  const keys = [...usedKeys, ...users.map((u) => `u:${u.id}`)];
  for (let i = 0; i < keys.length; i += 100) await db.from("rate_limits").delete().in("key", keys.slice(i, i + 100));
}
console.log(fails ? `\n${fails} test başarısız` : "\nTüm testler geçti");
process.exit(fails ? 1 : 0);
