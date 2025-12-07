// Compatibility types for `src/lib/game/*` modules that expect local type exports.
// Re-export the canonical types from `@/core/types` and `@/core/types/definitions`.
// Re-export concrete types used by src/lib/game; prefer explicit re-exports
// to avoid ambiguous duplicate-symbols when merging modules.
// Compatibility barrel for `src/lib/game/*` modules.
// Re-export commonly used domain types from the canonical core modules so that
// older imports like `@/lib/game/types` continue to work during the migration.

// Core game runtime types
export type {
	Language,
	Terrain,
	WorldProfile,
	Chunk,
	Enemy,
	World,
	PlayerStatus,
	NarrativeTemplate,
	NarrativeLength,
	GameState,
	PlayerItem,
	Action,
	Structure,
	Skill,
	DiceType,
	AiModel,
	FontFamily,
	FontSize,
	Theme,
	GameSettings,
	PlayerAttributes,
	TranslatableString,
	GeneratedItem,
	WorldConcept,
} from '@/core/types/game';

// Additional convenience exports used by UI and core modules
export type { NarrativeEntry, EquipmentSlot, ModBundle, PlayerStatusDefinition } from '@/core/types/game';

// Definition-level types (items, recipes, biomes, etc.)
export type { ItemDefinition, ItemCategory, ItemEffect, BiomeDefinition, Recipe } from '@/core/types/definitions';

// Re-export structure/terrain helpers used by src/lib/game
export type { StructureDefinition } from '@/core/types/definitions';
export type { Season, SeasonModifiers } from '@/core/types/game';

// Re-export compact engine-type used by UI components (crafting outcome)
export type { CraftingOutcome } from '@/core/engines/game/crafting';
