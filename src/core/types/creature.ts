// Re-export creature definition type from the canonical Zod schema.
// Keep this as a type-only adapter so core code can import domain types from
// `src/core/types` without reaching directly into `src/lib` implementation details.
export type { CreatureDefinition } from '@/lib/game/definitions/creature';
