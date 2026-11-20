import { createHash } from "node:crypto";

/**
 * Yanıt gövdesinden zayıf ETag: `W/"<sha256 ilk 16 bayt, base64url>"`. Aynı veri → aynı etiket (anahtar sırası kodda sabittir).
 * Zayıf (`W/`) kullanılır: CDN/sıkıştırma gövdeyi bayt bayt değiştirse de anlamsal eşitlik korunur.
 * Her istekte değişen alanları (ör. `generatedAt`) hesaba KATMA: gövdeyi onlar olmadan ver.
 */
export function weakEtag(body: unknown): string {
  const digest = createHash("sha256").update(JSON.stringify(body)).digest().subarray(0, 16);
  return `W/"${digest.toString("base64url")}"`;
}

const ETAG_TOKEN = /\*|(?:W\/)?"[^"]*"/g;

/** `If-None-Match` değeri verilen etiketle eşleşiyor mu? Zayıf karşılaştırma (RFC 9110 §13.1.2): `W/` öneki yok sayılır, `*` her şeyle eşleşir. */
export function ifNoneMatchHit(header: string | null | undefined, etag: string): boolean {
  if (!header) return false;
  const opaque = (t: string) => t.replace(/^W\//, "");
  const want = opaque(etag);
  for (const token of header.match(ETAG_TOKEN) ?? []) {
    if (token === "*" || opaque(token) === want) return true;
  }
  return false;
}
