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
