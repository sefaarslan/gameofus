export const RELATIONSHIP_TYPES = ["friend", "dating", "partner"] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export type RelKey = RelationshipType | "other";

/** Metinlerdeki ICU select için anahtar: bilinmeyen/eski odalar "other" (genel "partner" dili) olur. */
export function relKey(value: unknown): RelKey {
  return isRelationshipType(value) ? value : "other";
}

export function isRelationshipType(value: unknown): value is RelationshipType {
  return typeof value === "string" && (RELATIONSHIP_TYPES as readonly string[]).includes(value);
}
