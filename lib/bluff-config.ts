// Blöf modu ayarları (Yalan Kartı sayısı, unvan eşikleri). Değer değiştirmek için yalnızca bu dosya yeter; kurallar `lib/bluff.ts` içindedir.

export const BLUFF_CONFIG = {
  /** Sette zorunlu en az yalan sayısı. */
  minLies: 1,
  /** Yalan Kartı: soru sayısına göre bir oyuncunun sette söyleyebileceği en çok yalan. Blöf avındaki "Blöf!" hakkı da aynı sayıdadır. */
  lieCards: { 5: 2, 10: 3 } as Record<number, number>,
  titles: {
    /** "Yalan Dedektörü": karşı tarafın yalanlarının tamamı yakalandı (en az bu kadar yalan olmalı). */
    lieDetectorMinLies: 1,
    /** "Poker Face": kendi yalanlarının hiçbiri yakalanmadı (en az bu kadar yalan söylenmiş olmalı). */
    pokerFaceMinLies: 1,
    /** "Fazla Şüpheci": en az bu kadar DOĞRU cevaba "blöf" dendi. */
    skepticalMinDoubtedTruths: 2,
    /** "Saf Kalp": karşı tarafın hiçbir yalanı yakalanamadı (en az bu kadar yalan olmalı); "Fazla Şüpheci" ile birlikte verilmez. */
    pureHeartMinLies: 1,
  },
} as const;
