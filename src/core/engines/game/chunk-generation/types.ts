/**
 * Chunk Generation Type Definitions
 *
 * @remarks
 * Shared types and interfaces used throughout the chunk generation pipeline.
 * These types define the structure of spawn candidates, chunk data, and
 * generated chunk results.
 */

import type { TranslationKey } from "@/lib/core/i18n";
import type { Npc, ChunkItem, Structure, Action, Enemy, Terrain, SoilType } from "@/core/types/game";

/**
 * Defines the conditions under which an entity can spawn.
 *
 * @remarks
 * Used to filter spawn candidates based on chunk environmental properties.
 * The `chance` property is a base probability (0-1) before world modifiers.
 *
 * @property chance - Base spawn probability (0-1), before multipliers
 * @property [key: string] - Additional custom condition keys and values
 */
export interface SpawnConditions {
    chance?: number;
    [key: string]: any;
}

/**
 * Represents a potential entity that can be spawned in a chunk.
 *
 * @remarks
 * Used as input to entity selection algorithms. Can represent items,
 * NPCs, enemies, or other spawnable content. The optional `data` field
 * carries entity-specific properties (hp, behavior, etc. for creatures).
 *
 * @property name - Entity name or translation key
 * @property conditions - Conditions determining if/when entity can spawn
 * @property data - Optional metadata (NPC/Enemy-specific properties)
 */
export interface SpawnCandidate {
    name: string | TranslationKey;
    conditions?: SpawnConditions;
    data?: any;
}

/**
 * Represents the complete generated content for a single game chunk.
 *
 * @remarks
 * This is the final output of the chunk generation pipeline. Contains all
 * entities, items, NPCs, structures, and interactive actions that are
 * ready to be rendered and used in the game world.
 *
 * @property description - Textual description of the chunk's environment
 * @property NPCs - Non-Player Characters spawned in the chunk
 * @property items - Items available for the player to pickup
 * @property structures - Structures (buildings, loot containers) in the chunk
 * @property enemy - Primary enemy spawned in the chunk, if any
 * @property actions - Interactive actions available to the player
 * @property plants - Plant instances spawned in the chunk
 */
export interface ChunkGenerationResult {
    description: string;
    NPCs: Npc[];
    items: ChunkItem[];
    structures: Structure[];
    enemy: Enemy | null;
    actions: Action[];
    plants: any[];
}

/**
 * Base environmental data for a chunk.
 *
 * @remarks
 * Used as input to chunk generation. These environmental properties
 * determine spawn probabilities, resource density, and other aspects
 * of chunk content. All numeric properties are on 0-100 scale unless
 * otherwise noted (e.g., temperature in °C).
 *
 * @property vegetationDensity - Vegetation density (0-100)
 * @property moisture - Moisture level (0-100)
 * @property elevation - Average elevation of chunk (numeric)
 * @property dangerLevel - Inherent danger level (0-100)
 * @property magicAffinity - Concentration of magical energy (0-100)
 * @property humanPresence - Level of human activity (0-100)
 * @property predatorPresence - Density of predators (0-100)
 * @property temperature - Average temperature (°C)
 * @property terrain - Type of terrain (forest, desert, etc.)
 * @property explorability - How easy to explore (0-100)
 * @property soilType - Type of soil present
 * @property travelCost - Cost to traverse this chunk
 * @property lightLevel - Ambient light level
 * @property windLevel - Intensity of wind
 */
export interface ChunkBaseData {
    vegetationDensity: number;
    moisture: number;
    elevation: number;
    dangerLevel: number;
    magicAffinity: number;
    humanPresence: number;
    predatorPresence: number;
    temperature: number;
    terrain: Terrain;
    explorability: number;
    soilType: SoilType;
    travelCost: number;
    lightLevel: number;
    windLevel: number;
}
