-- =============================================================================
-- Blöf oyun modu (`rooms.game_mode = 'bluff'`)
--
-- Evet / Kararsız / Hayır soruları kullanılır (yeni soru yok). Oyuncu her cevabında karşı tarafa GÖSTERİLECEK başka bir değer
-- seçebilir (yalan); sette en az 1 yalan zorunludur. İkisi de bitirince her oyuncu karşısındakinin gösterdiği cevaplara
-- "inanıyorum / blöf" der (blöf avı) ve ancak o zaman gerçek cevapları görür.
--
--  * answers.shown_value     : karşı tarafa gösterilen sahte cevap (`{"value": "yes"}`); NULL = dürüst cevap. `answer_value` her zaman gerçektir.
--  * predictions.bluff_call  : tahmin eden oyuncunun o cevap için blöf avı kararı. NULL = henüz karar verilmedi.
--  * submit_bluff_calls()    : bir oyuncunun tüm kararlarını TEK ifadede, yalnızca bir kez yazar (atomik; yalnızca service role).
--
-- answers / predictions istemciye kapalıdır ve Realtime'da değildir (değişmez). Yalnızca ekleme yapar; mevcut modlar etkilenmez.
-- UYGULAMA SIRASI: bu dosya, Blöf kodu yayına alınmadan ÖNCE çalıştırılmalıdır.
-- =============================================================================

alter type public.game_mode add value if not exists 'bluff';

alter table public.answers add column if not exists shown_value jsonb;

alter table public.predictions add column if not exists bluff_call text;
alter table public.predictions drop constraint if exists predictions_bluff_call_check;
alter table public.predictions
  add constraint predictions_bluff_call_check check (bluff_call is null or bluff_call in ('believe', 'bluff'));

-- p_calls: { "<question_id>": "believe" | "bluff", ... }. Yazılan satır sayısını döner (0 = kararlar daha önce verilmiş).
create or replace function public.submit_bluff_calls(p_room uuid, p_caller uuid, p_calls jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  written integer;
begin
  update public.predictions p
     set bluff_call = c.value
    from jsonb_each_text(p_calls) as c
   where p.room_id = p_room
     and p.predictor_participant_id = p_caller
     and p.question_id = c.key::uuid
     and p.bluff_call is null;
  get diagnostics written = row_count;
  return written;
end;
$$;

revoke all on function public.submit_bluff_calls(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.submit_bluff_calls(uuid, uuid, jsonb) to service_role;
