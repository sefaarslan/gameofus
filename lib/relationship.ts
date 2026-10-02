export const RELATIONSHIP_TYPES = ["friend", "dating", "partner"] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export function isRelationshipType(value: unknown): value is RelationshipType {
  return typeof value === "string" && (RELATIONSHIP_TYPES as readonly string[]).includes(value);
}
