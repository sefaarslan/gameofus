// Oda kodu birim testleri (sunucu/DB gerekmez):  node scripts/test-room-code.mjs
import assert from "node:assert/strict";
import {
  ROOM_CODE_CHARSET, ROOM_CODE_LENGTH, decodeRoomCodeParam, formatRoomCode, isPlausibleRoomCode, normalizeRoomCode,
} from "../lib/room-code-utils.ts";
import { generateRoomCode, generateUniqueRoomCode } from "../lib/room-code.ts";

let n = 0;
const t = (name, fn) => Promise.resolve().then(fn).then(() => { n++; console.log("✔ " + name); }, (e) => { console.error("✗ " + name + "\n  " + e.message); process.exitCode = 1; });

await t("normalizeRoomCode: harf boyutu, tire ve boşluk fark etmez", () => {
  for (const v of ["k7m-2pq", "K7M 2PQ", "K7M2PQ", " k7m_2pq ", "K7M–2PQ", "k7m 2pq", "K7M.2PQ"]) assert.equal(normalizeRoomCode(v), "K7M2PQ", JSON.stringify(v));
});
await t("normalizeRoomCode: eski 8 karakterli kod", () => assert.equal(normalizeRoomCode("abcd-2345"), "ABCD2345"));
await t("normalizeRoomCode: string olmayan/boş girdi güvenli", () => {
  for (const v of [undefined, null, 123, {}, [], ""]) assert.equal(normalizeRoomCode(v), "");
});
await t("normalizeRoomCode: yinelenen çağrı değişmez (idempotent)", () => assert.equal(normalizeRoomCode(normalizeRoomCode("k7m-2pq")), "K7M2PQ"));
await t("decodeRoomCodeParam: kodlu tire çözülür, bozuk girdi patlamaz", () => {
  assert.equal(normalizeRoomCode(decodeRoomCodeParam("K7M%2D2PQ")), "K7M2PQ");
  assert.equal(decodeRoomCodeParam("%E0%A4%A"), "%E0%A4%A");
});
await t("formatRoomCode: 6 → 3+3, 8 → 4+4, diğerleri olduğu gibi", () => {
  assert.equal(formatRoomCode("K7M2PQ"), "K7M-2PQ");
  assert.equal(formatRoomCode("abcd2345"), "ABCD-2345");
  assert.equal(formatRoomCode("ABC"), "ABC");
  assert.equal(formatRoomCode("k7m-2pq"), "K7M-2PQ");
});
await t("isPlausibleRoomCode: 6-10 harf/rakam", () => {
  assert.ok(isPlausibleRoomCode("K7M2PQ") && isPlausibleRoomCode("ABCD2345"));
  assert.ok(!isPlausibleRoomCode("K7M2P") && !isPlausibleRoomCode("K7M2PQXYZ23") && !isPlausibleRoomCode(""));
});
await t("generateRoomCode: uzunluk 6, yalnızca izinli karakterler (5000 örnek)", () => {
  assert.equal(ROOM_CODE_LENGTH, 6);
  for (let i = 0; i < 5000; i++) {
    const c = generateRoomCode();
    assert.equal(c.length, 6);
    for (const ch of c) assert.ok(ROOM_CODE_CHARSET.includes(ch), `izinsiz karakter ${ch}`);
  }
  assert.ok(!/[01ILO]/.test(ROOM_CODE_CHARSET), "karışan karakterler charset'te olmamalı");
});
await t("generateRoomCode: karakter dağılımı yaklaşık düzgün (modulo yanlılığı yok)", () => {
  const counts = Object.fromEntries([...ROOM_CODE_CHARSET].map((c) => [c, 0]));
  const N = 60000;
  for (let i = 0; i < N; i++) for (const ch of generateRoomCode()) counts[ch]++;
  const expected = (N * 6) / ROOM_CODE_CHARSET.length;
  for (const [ch, c] of Object.entries(counts)) assert.ok(Math.abs(c - expected) / expected < 0.06, `${ch}: ${c} (beklenen ~${Math.round(expected)})`);
});
await t("generateRoomCode: normalize edilmiş hali kendisine eşit", () => {
  for (let i = 0; i < 500; i++) { const c = generateRoomCode(); assert.equal(normalizeRoomCode(c), c); }
});
await t("generateUniqueRoomCode: çakışmada yeniden dener", async () => {
  let calls = 0;
  const code = await generateUniqueRoomCode(async () => ++calls <= 2);
  assert.equal(calls, 3); assert.equal(code.length, 6);
});
await t("generateUniqueRoomCode: 5 çakışmadan sonra hata verir", async () => {
  await assert.rejects(() => generateUniqueRoomCode(async () => true), /Benzersiz oda kodu/);
});

console.log(`\n${n} test geçti${process.exitCode ? " (başarısız olanlar var)" : ""}`);
