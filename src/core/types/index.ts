// Centralized domain type re-exports for core code.
// Prefer `import type { X } from '@/core/types'` in core modules to avoid
// reaching into `src/lib` implementation files directly.

// Re-export higher-level game types implemented in `src/lib/game/types`.
export type {
  Enemy,
  Chunk,
  PlayerStatusDefinition,
  WorldDefinition,
} from '@/lib/game/types';

// Re-export Zod-backed definition types for moddable content.
export type { CreatureDefinition } from './creature';
export * from './effects';
export * from './i18n';
export * from './items';
export * from './weather';
