// Yedekli üretim: önce ana model, olmazsa (hız sınırı, zaman aşımı, sağlayıcı hatası, geçersiz çıktı) yedek model.
// Her çağrı günlük kullanım toplamına yazılır (capacity.ts).

import { AiProviderError } from "./provider.ts";
import { InvalidCommentaryError, generateCommentary } from "./generate.ts";
import type { GenerateResult } from "./generate.ts";
import type { CommentaryDigest } from "./digest.ts";
import type { ModelSpec } from "./config.ts";
import { hasCapacity, recordUsage } from "./capacity.ts";

export class AiUnavailableError extends Error {
  /** Denenen her model için kısa neden (kişisel veri içermez; loglanabilir) */
  reasons: string[];
  constructor(reasons: string[]) {
    super(`AI yorum üretilemedi: ${reasons.join(" | ")}`);
    this.name = "AiUnavailableError";
    this.reasons = reasons;
  }
}

export function errorKindOf(err: unknown): string {
  if (err instanceof AiProviderError) return err.kind;
  if (err instanceof InvalidCommentaryError) return "invalid_output";
  return "unknown";
}

/** Ana ya da yedek modelden en az birinde kapasite var mı? (coin düşmeden önce sorulur) */
export async function anyCapacity(specs: ModelSpec[]): Promise<boolean> {
  for (const spec of specs) if (await hasCapacity(spec)) return true;
  return false;
}

export async function generateWithFallback(digest: CommentaryDigest, specs: ModelSpec[]): Promise<GenerateResult> {
  const reasons: string[] = [];
  for (const spec of specs) {
    if (!(await hasCapacity(spec))) {
      reasons.push(`${spec.provider}: no_capacity`);
      continue;
    }
    try {
      const result = await generateCommentary(digest, spec);
      await recordUsage(spec.provider, result.meta.totalTokens, false);
      return result;
    } catch (err) {
      await recordUsage(spec.provider, 0, true);
      reasons.push(`${spec.provider}: ${errorKindOf(err)}`);
    }
  }
  throw new AiUnavailableError(reasons);
}
