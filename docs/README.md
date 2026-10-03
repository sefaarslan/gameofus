# Game of Us — Docs

## Güncel kaynaklar (bunlara güven)

| Dosya | Ne için |
|---|---|
| `../CLAUDE.md` | Çalışma kuralları, mimari kararlar, konvansiyonlar (AI ajanları için ilk okunacak dosya) |
| `PRD.md` | Ürün gereksinimleri, akışlar, monetizasyon (coin + tier), fazlar, açık kararlar |
| `API_SPEC.md` | Gerçek API sözleşmeleri (`app/api/**`) |
| `DATABASE_SCHEMA.md` | Gerçek şema özeti (kaynak: `supabase/migrations/*.sql`) |
| `SEED_QUESTIONS.md` | Soru bankası v2: yapı, kurallar, iş akışı |
| `solo-red-flag-{tr,en,es}.md` | Red Flag Mayın Tarlası senaryolarının okunabilir dökümü (`scripts/export-solo-md.mjs`) |
| `questions-v2-{tr,en,es}.md` | Tüm soruların okunabilir dökümü (`scripts/export-questions-md.mjs` ile üretilir) |

Çelişkide sıra: **PRD → CLAUDE.md → bu klasördeki diğer güncel dosyalar → kod.**

## Tarihsel (MVP v1; güncel değil — başında uyarı notu var)

`ARCHITECTURE.md`, `GAME_LOGIC.md`, `UX_FLOW.md`, `I18N_COPY.md`, `SECURITY_AND_RLS.md`, `MVP_SCOPE.md`,
`TASK_LIST.md`, `PRD-Ek-Mobile-Premium.md` (premium bölümü coin + tier ile değişti), `design/`.

Bunlar yeniden yazılana ya da kaldırılana kadar yalnızca bağlam için okunmalıdır.
