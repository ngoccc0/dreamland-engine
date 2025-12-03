export type { TerrainType, SoilType };
/**
 * OVERVIEW: Terrain system entities
 *
 * Represents terrain types in the world system (grassland, forest, desert, mountain, water, etc).
 * Each terrain has attributes (moisture, elevation, danger), contains entities (plants, creatures),
 * and affects gameplay (movement speed, visibility, resource availability).
 * Implements IEntityContainer for modding support and extensibility.
 *
 * ## Terrain Types (TerrainType)
 *
 * Seven base terrain categories with gameplay impacts:
 *
 * | Type | Moisture | Elevation | Danger | Movement | Visibility | Plant Density | Notes |
 * |------|----------|-----------|--------|----------|-----------|-------------|-------|
 * | GRASSLAND | 0.5 | 0 m | Low | Normal (1.0×) | 100% | 0.3 | Starter zone |
 * | FOREST | 0.7 | +20 m | Medium | Slow (0.7×) | 40% | 0.8 | Dense trees |
 * | DESERT | 0.1 | +50 m | Medium | Slow (0.6×) | 100% | 0.1 | Extreme heat |
 * | MOUNTAIN | 0.4 | +200 m | High | Very Slow (0.5×) | 80% | 0.2 | Dangerous climb |
 * | WATER | 1.0 | -10 m | High | Swim (0.4×) | 60% | 0.9 | Deep water |
 * | SNOW | 0.8 | +100 m | Very High | Very Slow (0.4×) | 70% | 0.05 | Extreme cold |
 * | SWAMP | 0.9 | -5 m | High | Very Slow (0.5×) | 30% | 0.95 | Toxic fog |
 *
 * ### Terrain Modifiers
 *
 * Each terrain modifies player behavior:
 *
 * **Movement Speed** (affects action speed in combat)
 * ```
 * actual_speed = base_speed × terrain.speedModifier
 * Example: 10 DEX in forest = 10 × 0.7 = 7 effective speed
 * ```
 *
 * **Visibility** (affects detection range)
 * ```
 * visible_range = base_range × terrain.visibility
 * Example: 20 tile range in forest = 20 × 0.4 = 8 tiles
 * ```
 *
 * **Danger Level** (affects creature spawn rate and boss chance)
 * ```
 * spawn_chance = base_chance × terrain.dangerLevel
 * boss_chance = 2% × terrain.dangerLevel
 * ```
 *
 * ## TerrainAttributes Interface
 *
 * Physical and environmental properties:
 *
 * ```typescript
 * interface TerrainAttributes {
 *   moisture: number,          // 0-1 (affects plant growth)
 *   elevation: number,         // meters above sea level
 *   temperature: number,       // °C (-30 to 50)
 *   dangerLevel: number,       // 0-1 (creature spawn intensity)
 *   vegetationDensity: number, // 0-1 (plant concentration)
 *   lightLevel: number,        // 0-1 (visibility/light)
 *   resourceAffinity: Map<string, number>, // Resource availability
 * }
 * ```
 *
 * Example attributes for FOREST:
 * ```typescript
 * {
 *   moisture: 0.7,
 *   elevation: 20,
 *   temperature: 15,
 *   dangerLevel: 0.5,
 *   vegetationDensity: 0.8,
 *   lightLevel: 0.4,
 *   resourceAffinity: {
 *     'wood': 0.9,
 *     'herb': 0.6,
 *     'ore': 0.1,
 *   }
 * }
 * ```
 *
 * ## Soil Types (SoilType)
 *
 * Determines what plants thrive:
 *
 * | Soil | Plant Examples | Nutrients | Drainage | Preferred Terrain |
 * |------|---|---|---|---|
 * | FERTILE | Wheat, Fruit trees | 0.9 | 0.5 | Grassland, Swamp |
 * | SANDY | Cacti, Desert flowers | 0.3 | 1.0 | Desert |
 * | ROCKY | Hardy shrubs, Herbs | 0.4 | 1.0 | Mountain |
 * | CLAY | Wetland plants | 0.7 | 0.2 | Swamp, Water edge |
 * | PEAT | Moss, Wetland species | 0.8 | 0.3 | Swamp, Snow |
 * | LOAMY | Most plants | 0.8 | 0.5 | Forest (ideal) |
 *
 * ## Terrain Class (Terrain)
 *
 * Game object representing single terrain type:
 *
 * ```typescript
 * class Terrain implements IEntityContainer {
 *   type: TerrainType,            // GRASSLAND, FOREST, etc.
 *   attributes: TerrainAttributes, // Physical properties
 *   entities: Entity[],            // Plants, creatures present
 *   name: TranslatableString,      // Localized name
 *   description: TranslatableString, // Lore/description
 *
 *   // Entity management (modding support)
 *   addEntity(entity): void
 *   removeEntity(entity): void
 *   getEntities(): Entity[]
 *
 *   // Attribute queries
 *   canWalk(): boolean              // Passable?
 *   getMovementSpeed(): number     // Movement modifier
 *   getTemperature(): number       // Current temp
 *   getResourceAffinity(type): number
 * }
 * ```
 *
 * ## Gameplay Mechanics
 *
 * ### Plant Growth in Terrains
 *
 * Different plants prefer different terrains:
 *
 * ```typescript
 * // Example: Apple Tree
 * preferredTerrains: ['GRASSLAND', 'FOREST']
 * growthBonusInTerrain: {
 *   'GRASSLAND': 1.2,   // +20% growth in grassland
 *   'FOREST': 1.1,      // +10% growth in forest
 *   'DESERT': 0.3,      // -70% growth in desert
 * }
 * ```
 *
 * ### Creature Spawning
 *
 * Creatures spawn by terrain preference:
 *
 * ```typescript
 * // Example: Goblin
 * preferredTerrains: ['FOREST', 'MOUNTAIN']
 * spawnChance: {
 *   'FOREST': 0.05,     // 5% per chunk
 *   'MOUNTAIN': 0.04,   // 4% per chunk
 *   'GRASSLAND': 0.01,  // 1% per chunk (rare)
 * }
 * ```
 *
 * ### Weather Effects
 *
 * Weather modifies terrain attributes temporarily:
 *
 * ```
 * CLEAR: visibility +20%, temperature normal
 * RAIN: moisture +30%, visibility -20%, movement -10%
 * STORM: visibility -50%, danger +50%, crops damaged
 * SNOW: temperature -20, visibility -30%, movement -30%
 * DROUGHT: moisture -50%, temperature +10, fire risk
 * ```
 *
 * ## Terrain Progression (Biome Chains)
 *
 * Recommended order for player exploration:
 *
 * ```
 * Level 1-10: GRASSLAND (starter zone)
 * Level 5-15: FOREST (moderate challenge)
 * Level 10-20: DESERT (navigation puzzle)
 * Level 15-25: MOUNTAIN (difficult travel)
 * Level 20-30: SWAMP (resource rich, dangerous)
 * Level 25-35: SNOW (extreme environment)
 * Level 30+: WATER (end-game bosses)
 * ```
 *
 * ## Terrain-Based Resources
 *
 * Each terrain yields different materials:
 *
 * | Terrain | Primary Resources | Secondary | Rare |
 * |---------|---|---|---|
 * | GRASSLAND | Wheat, Herbs | Fiber, Seeds | Gemstone |
 * | FOREST | Wood, Mushroom | Bark, Berries | Moonstone |
 * | DESERT | Sand, Salt | Cactus, Bones | Opal |
 * | MOUNTAIN | Ore, Stone | Iron, Coal | Gold |
 * | SWAMP | Peat, Slime | Herbs, Mushrooms | Jade |
 * | SNOW | Ice, Snow | Fur (rare) | Diamond |
 * | WATER | Shells, Scales | Seaweed, Pearls | Sapphire |
 *
 * ## Design Philosophy
 *
 * - **Environmental Gameplay**: Terrain meaningfully affects strategy
 * - **Biome Exploration**: Each terrain feels unique and valuable
 * - **Progression Gating**: Dangerous terrains reward high-level players
 * - **Modding Support**: IEntityContainer allows custom terrain entities
 * - **Realism Within Fantasy**: Soil/weather create believable world
 * - **Resource Economy**: Terrain variety drives trading and crafting
 *
 * ## Terrain-Specific Hazards
 *
 * ### Forest
 * - Dense fog in storms (visibility -80%)
 * - Root traps (slow movement)
 * - Predator nests (wolves, bears)
 *
 * ### Desert
 * - Heat damage (5 HP/turn without shade)
 * - Sandstorms (visibility 0%, navigation impossible)
 * - Dehydration (stamina drain 2×)
 *
 * ### Mountain
 * - Falling rocks (random damage)
 * - Altitude sickness (reduced stats at high elevation)
 * - Avalanche (triggered by noise)
 *
 * ### Swamp
 * - Toxic fog (poison damage)
 * - Quicksand (trapped, speed -90%)
 * - Disease (random ailments)
 *
 * ### Snow
 * - Frostbite (health drain + stat freeze)
 * - Whiteout (visibility -100%)
 * - Hypothermia (cumulative damage)
 *
 */

import { TranslatableString } from '../types/i18n';
import { GridPosition } from '../values/grid-position';
import type { TerrainType, SoilType } from '../../lib/game/definitions/terrain-definitions';
import { Entity, IEntityContainer } from './entity';
import { TerrainAttributes } from '../types/attributes';

/**
 * Represents a terrain type in the world, with its base attributes and support for containing entities.
 * This class is designed to be extensible for modding.
 */
export class Terrain implements IEntityContainer {
    private _entities: Entity[] = [];

    /**
     * Creates an instance of Terrain.
     * @param _type - The specific type of terrain (e.g., 'forest', 'desert').
     * @param _attributes - The base {@link TerrainAttributes} for this terrain.
     * @param _name - The {@link TranslatableString} name of the terrain, displayed to the player.
     * @param _description - The {@link TranslatableString} description of the terrain, providing lore and details.
     */
    constructor(
        private readonly _type: TerrainType,
        private readonly _attributes: TerrainAttributes,
        private readonly _name: TranslatableString,
        private readonly _description: TranslatableString
    ) {}

    /** Gets the specific type of terrain (e.g., 'forest', 'desert'). */
    get type(): TerrainType { return this._type; }
    /** Gets the base {@link TerrainAttributes} for this terrain. */
    get attributes(): Readonly<TerrainAttributes> { return this._attributes; }
    /** Gets an array of {@link Entity} objects currently present in this terrain. */
    get entities(): Entity[] { return [...this._entities]; }
    /** Gets the {@link TranslatableString} name of the terrain. */
    get name(): TranslatableString { return this._name; }
    /** Gets the {@link TranslatableString} description of the terrain. */
    get description(): TranslatableString { return this._description; }

    /**
     * Adds an entity to this terrain.
     * @param entity - The {@link Entity} to add.
     */
    addEntity(entity: Entity): void {
        this._entities.push(entity);
    }

    /**
     * Removes an entity from this terrain by its ID.
     * @param entityId - The unique ID of the entity to remove.
     */
    removeEntity(entityId: string): void {
        this._entities = this._entities.filter(e => e.id !== entityId);
    }

    /**
     * Retrieves all entities currently in this terrain.
     * @returns An array of {@link Entity} objects.
     */
    getEntities(): Entity[] {
        return this.entities;
    }

    /**
     * Calculates the final, dynamic attributes of the terrain based on various contextual factors.
     * This method allows for environmental effects (e.g., weather, time of day) to modify base terrain attributes.
     * @param _position - The {@link GridPosition} of the terrain cell.
     * @param _time - The current in-game time.
     * @param _weather - The current weather context.
     * @returns The calculated {@link TerrainAttributes} for this terrain at the given context.
     * @todo Implement actual attribute modification logic based on context.
     */
    calculateAttributes(_position: GridPosition, _time: number, _weather: any): TerrainAttributes {
        // This will be implemented to modify base attributes based on context
        // Parameters prefixed with _ are intentionally unused for now
        return {
           ...this._attributes
        };
    }
}
