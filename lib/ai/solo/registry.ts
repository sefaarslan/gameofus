// Oyun adaptörü kayıt defteri: `solo_sessions.game` → adaptör. Yeni solo oyun = adaptör dosyası + buraya tek satır.

import type { SoloAdapter } from "./types.ts";
import { redFlagAdapter } from "./red-flag.ts";

/** Kayıtlı olmayan oyun türü: route temiz bir hata döner (500 değil). */
export class UnknownGameTypeError extends Error {
  gameType: string;
  constructor(gameType: string) {
    super(`AI analizi bu oyun için tanımlı değil: ${gameType}`);
    this.name = "UnknownGameTypeError";
    this.gameType = gameType;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adapters = new Map<string, SoloAdapter<any, any>>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerSoloAdapter(adapter: SoloAdapter<any, any>): void {
  adapters.set(adapter.gameType, adapter);
}

export function getSoloAdapter(gameType: string): SoloAdapter {
  const a = adapters.get(gameType);
  if (!a) throw new UnknownGameTypeError(gameType);
  return a as SoloAdapter;
}

export function hasSoloAdapter(gameType: string): boolean {
  return adapters.has(gameType);
}

registerSoloAdapter(redFlagAdapter);
