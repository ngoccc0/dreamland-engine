/**
 * Core Domain Layer - Single Source of Truth for game entities
 *
 * This layer defines the minimal, immutable domain types using Zod.
 * All game logic builds on top of these types.
 *
 * @see [ARCHITECTURE_CLEAN_SLATE.md](../../docs/ARCHITECTURE_CLEAN_SLATE.md) for architecture decisions
 * @see [MIGRATION_PHASES.md](../../docs/MIGRATION_PHASES.md) for implementation timeline
 */

export * from './entity';
export * from './creature';
export * from './item';
export * from './gamestate';

// Definitions and schemas (moved from lib/game/)
// Note: game-definitions and narrative-schema are not re-exported here to avoid conflicts.
// Import them directly from @/core/domain/game-definitions and @/core/domain/narrative-schema
