# SEED_QUESTIONS.md — Game of Us

Bu doküman MVP soru bankası için başlangıç sorularını içerir. Faz 1'de  Secret Choice aktif olduğu için tüm sorular `yes / unsure / no` formatına uygundur.

---

## 1. Seed Format Önerisi

```ts
export const questions = [
  {
    mode: "secret_choice",
    category: "communication",
    question_tr: "Her gün mesajlaşmak senin için önemli mi?",
    question_en: "Is texting every day important to you?",
    is_active: true
  }
]
```

---

## 2. Kategoriler

```txt
communication
first_date
social_life
lifestyle
values
future
```

---

## 3. MVP Secret Choice Soruları

### Communication

1. Her gün mesajlaşmak senin için önemli mi?
2. Günaydın mesajı almak hoşuna gider mi?
3. Geç cevap verilmesi seni rahatsız eder mi?
4. Telefonda konuşmak yazışmadan daha iyi midir?
5. Gün içinde haberleşmek önemli midir?
6. Partnerin yoğun olduğunda az yazması seni üzer mi?
7. Hislerini açıkça konuşmak senin için kolay mı?
8. Bir sorun olduğunda hemen konuşmak ister misin?
9. Küçük detayları hatırlamak senin için önemli mi?
10. İyi geceler mesajı almak hoşuna gider mi?

### First Date

11. İlk buluşmada el ele tutuşmak doğal mı?
12. İlk buluşmada uzun saatler geçirmek hoşuna gider mi?
13. İlk buluşmada fotoğraf çekmek ister misin?
14. İlk buluşmada ikinci buluşmayı konuşmak doğru mu?
15. İlk buluşmada eski ilişkilerden bahsetmek sorun olur mu?
16. İlk buluşmada hesabı paylaşmak normal midir?
17. İlk buluşmada çok soru sormak hoşuna gider mi?
18. İlk buluşmada sessizlik seni rahatsız eder mi?
19. İlk buluşmada spontane plan değişikliği hoşuna gider mi?
20. İlk buluşmada telefonla fazla ilgilenilmesi seni rahatsız eder mi?

### Social Life

21. Partnerin sık arkadaşlarıyla çıkması normal midir?
22. Karşı cins yakın arkadaş olabilir mi?
23. Sosyal medyada ilişki paylaşmak ister misin?
24. Partnerin yalnız tatile gitmesi normal midir?
25. Kalabalık arkadaş ortamları hoşuna gider mi?
26. Partnerinin arkadaşlarıyla yakın olmak ister misin?
27. Sosyal medyada çok aktif olmak seni rahatsız eder mi?
28. Ortak arkadaş çevresi ilişki için önemli midir?
29. Partnerinin planlarını önceden bilmek ister misin?
30. Her hafta dışarı çıkmak sana iyi gelir mi?

### Lifestyle

31. Hafta sonunu evde geçirmek hoşuna gider mi?
32. Spontane planları sever misin?
33. Erken kalkmayı sever misin?
34. Gelecekte yurt dışında yaşamak ister misin?
35. Evde birlikte yemek yapmak hoşuna gider mi?
36. Planlı yaşamak senin için önemli midir?
37. Tatilde dinlenmek gezmekten daha mı keyiflidir?
38. Ev düzeni senin için çok önemli midir?
39. Yeni yerler denemeyi sever misin?
40. Yoğun bir günün sonunda yalnız kalmak ister misin?

### Values

41. Bir ilişkide özel alan önemli midir?
42. Aile ilişkileri senin için çok önemli midir?
43. Kariyer ilişkiden önce gelebilir mi?
44. Duygusal destek ilişkide en önemli şeylerden biri midir?
45. Kıskançlık bazen sevgi göstergesi olabilir mi?
46. Para yönetimi ilişkide açıkça konuşulmalı mı?
47. Özür dilemek senin için kolay mı?
48. Partnerinle her şeyi paylaşmak ister misin?
49. Güven zamanla mı oluşur?
50. Küçük sürprizler ilişkiyi canlı tutar mı?

---

## 4. Conversation Prompt Örnekleri

Her soru için sonuç kartında kullanılabilecek genel konuşma önerileri:

```txt
Bu konuda beklentilerinizin nerede benzeştiğini konuşabilirsiniz.
Bu cevap size birbirinizin günlük alışkanlıkları hakkında güzel bir ipucu verebilir.
Burada farklı düşünmeniz kötü değil; neden böyle hissettiğinizi konuşmak eğlenceli olabilir.
Bu konu ilişkinizde küçük ama önemli bir beklentiyi gösterebilir.
```
