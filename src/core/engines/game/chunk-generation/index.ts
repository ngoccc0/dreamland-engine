/**
 * Chunk Generation Engine - Submodule Exports
 *
 * @remarks
 * Exports types, helpers, and processing functions used by the main
 * chunk generation pipeline. Organized by concern for better maintainability
 * and testability of individual pieces.
 */

// Type definitions
export type { SpawnCandidate, SpawnConditions, ChunkGenerationResult, ChunkBaseData } from './types';

// Utility helpers
export { softcap, createTranslationHelper, clamp01, calculateResourceCapacity } from './helpers';

// Item and entity resolution
export { resolveItemByName } from './resolver';

// Processing functions
export { processStructureLoot } from './loot';
export { processSelectedItems } from './item-processor';
export { generateChunkActions } from './actions';
