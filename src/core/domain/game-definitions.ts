/**
 * Game Definitions Barrel Export
 * 
 * Consolidates all game entity definitions and types.
 * This is the primary location for game rule definitions.
 */

// Base definitions (includes schemas and types)
export * from '@/core/types/definitions/base';

// Item definitions
export { type ItemDefinition, ItemDefinitionSchema, type ItemCategory, ItemCategorySchema, type ItemEffect, ItemEffectSchema } from '@/core/types/definitions/item';

// Recipe definitions
export { type Recipe, RecipeSchema, type RecipeIngredient, RecipeIngredientSchema, RecipeResultSchema } from '@/core/types/definitions/recipe';

// Structure definitions
export { type StructureDefinition, StructureDefinitionSchema } from '@/core/types/definitions/structure';

// Biome definitions
export { type BiomeDefinition } from '@/core/types/definitions/biome';

// Creature definitions
export { type CreatureDefinition, CreatureDefinitionSchema } from '@/core/types/definitions/creature';

// Weather definitions
export { type WeatherDefinition } from '@/core/types/definitions/weather';

// Random event definitions
export { type RandomEventDefinition } from '@/core/types/definitions/event';

// Terrain definitions (not in main definitions/index.ts)
export type { TerrainType } from '@/core/types/definitions/terrain-definitions';
export { TerrainRegistry } from '@/core/types/definitions/terrain-definitions';

// SoilType from game.ts
export type { SoilType } from '@/core/types/game';
