/**
 * Seed runner — tüm soruları Supabase'e insert eder.
 *
 * Çalıştırmak için:
 *   1. .env dosyasına SUPABASE_SERVICE_ROLE_KEY ekle
 *   2. npx tsx seeds/seed.ts
 *
 * Not: anon key değil, service_role key gereklidir (RLS bypass için).
 * Supabase Dashboard → Settings → API → service_role key.
 */

import { createClient } from "@supabase/supabase-js";
import { questions } from "./questions";
import { predictionQuestions } from "./prediction-questions";
import { orderlineQuestions } from "./orderline-questions";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY .env dosyasında olmalı.",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

async function run() {
  // 1. Secret Choice — 50 soru (seçenek yok)
  console.log("→ Secret Choice sorular insert ediliyor...");
  const { error: scErr } = await supabase.from("questions").insert(
    questions.map(({ mode, category, question_text, locale, is_active }) => ({
      mode,
      category,
      question_text,
      locale,
      is_active,
    })),
  );
  if (scErr) throw new Error(`Secret Choice insert hatası: ${scErr.message}`);
  console.log(`  ✓ ${questions.length} soru eklendi`);

  // 2. Prediction — soru + seçenekler
  console.log("→ Prediction sorular insert ediliyor...");
  for (const q of predictionQuestions) {
    const { data, error: qErr } = await supabase
      .from("questions")
      .insert({
        mode: q.mode,
        category: q.category,
        question_text: q.question_text,
        locale: q.locale,
        is_active: q.is_active,
      })
      .select("id")
      .single();

    if (qErr || !data) throw new Error(`Prediction soru hatası: ${qErr?.message}`);

    const { error: optsErr } = await supabase.from("question_options").insert(
      q.options.map((o) => ({
        question_id: data.id,
        option_text: o.option_text,
        sort_order: o.sort_order,
      })),
    );
    if (optsErr) throw new Error(`Prediction seçenek hatası: ${optsErr.message}`);
    console.log(`  ✓ "${q.question_text.substring(0, 40)}..." + ${q.options.length} seçenek`);
  }

  // 3. Orderline — soru + kartlar
  console.log("→ Orderline sorular insert ediliyor...");
  for (const q of orderlineQuestions) {
    const { data, error: qErr } = await supabase
      .from("questions")
      .insert({
        mode: q.mode,
        category: q.category,
        question_text: q.question_text,
        locale: q.locale,
        is_active: q.is_active,
      })
      .select("id")
      .single();

    if (qErr || !data) throw new Error(`Orderline soru hatası: ${qErr?.message}`);

    const { error: optsErr } = await supabase.from("question_options").insert(
      q.options.map((o) => ({
        question_id: data.id,
        option_text: o.option_text,
        sort_order: o.sort_order,
      })),
    );
    if (optsErr) throw new Error(`Orderline kart hatası: ${optsErr.message}`);
    console.log(`  ✓ "${q.question_text.substring(0, 40)}..." + ${q.options.length} kart`);
  }

  console.log("\n✅ Seed tamamlandı.");
  console.log(`   Secret Choice: ${questions.length} soru`);
  console.log(`   Prediction:    ${predictionQuestions.length} soru × 4 seçenek`);
  console.log(`   Orderline:     ${orderlineQuestions.length} soru × 4 kart`);
}

run().catch((err) => {
  console.error("Seed hatası:", err.message);
  process.exit(1);
});
