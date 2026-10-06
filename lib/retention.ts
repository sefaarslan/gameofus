/** Saklama süreleri (gün). Gizlilik Politikası ile uyumlu tutulur; değiştirirsen politikayı da güncelle. */
export const RETENTION = {
  /** Anonim web odaları: erişime kapandıktan (expires_at) sonra */
  roomDays: 14,
  /** Anonim (kullanıcıya bağlı olmayan) solo oturumlar */
  soloDays: 90,
  /** IP özetleri (hız sınırı kayıtları) */
  rateLimitDays: 7,
  /** Kullanıcıya bağlı (mobil) oda ve solo oyun geçmişi: gizlilik gereği 90 gün (credit_transactions ve purchases bundan bağımsız) */
  userHistoryDays: 90,
} as const;
