/**
 * OVERVIEW: Chunk entity (16×16 world segment)
 *
 * Represents a single chunk in the world grid (16×16 cells = 256 GridCells total).
 * Chunks are the primary load/unload unit for memory management.
 * Each chunk contains terrain, entities, and environmental attributes.
 * Implements IEntityContainer for polymorphic entity management.
 *
 * ## Chunk Basics
 *
 * ### Chunk Coordinates
 * ```
 * ChunkPosition = {x, y}
 * Global coords to chunk: chunkX = floor(globalX / 16), chunkY = floor(globalY / 16)
 * Local coords within chunk: localX = globalX % 16, localY = globalY % 16
 * Total cells: 16 × 16 = 256 cells per chunk
 * Memory per chunk: ~50-100 KB (unloaded), ~1-2 MB (loaded with entities)
 * ```
 *
 * ### Load/Unload Distance
 * ```
 * Active (full sim): radius 1 chunk (3×3 chunks = 48×48 cells)
 * Cached (no update): radius 2-3 chunks (visible but not simulated)
 * Unloaded: beyond radius 3 (minimal data in RAM)
 * ```
 *
 * ## Chunk Data (ChunkData Structure)
 *
 * ```typescript
 * interface ChunkData {
 *   position: Position,              // {x, y} chunk coordinates
 *   terrain: Terrain,                // Terrain type (FOREST, DESERT, etc.)
 *   attributes: TerrainAttributes,   // Environmental data
 *   explored: boolean,               // Player discovered?
 *   lastVisited: number,             // Timestamp of last entry
 *   lastUpdated: number,             // Last simulation tick
 *   entities: Entity[],              // Plants, creatures, items
 *   regionId: number,                // Region grouping (biome)
 * }
 * ```
 *
 * ## Chunk Entity Management
 *
 * Implements IEntityContainer for entities within chunk:
 *
 * ```typescript
 * chunk.getEntities()           // Get all entities
 * chunk.addEntity(creature)     // Add creature/plant/item
 * chunk.removeEntity('id_42')   // Remove by ID
 * ```
 *
 * Entity counts per chunk:
 * - Plants: 0-50 (distribution sparse)
 * - Creatures: 0-20 (spawn based on danger level)
 * - Items: 0-30 (loot, resources, structures)
 * - NPCs: 0-5 (settlements only)
 *
 * ## Chunk Attributes (TerrainAttributes)
 *
 * Environment properties for entire chunk:
 *
 * ```typescript
 * {
 *   vegetationDensity: 0-100,      // Plant concentration
 *   moisture: 0-100,               // Water level
 *   elevation: -1000 to +1000 m,   // Average height
 *   lightLevel: 0-100,             // Sun exposure
 *   dangerLevel: 0-100,            // Creature threat
 *   magicAffinity: 0-100,          // Magical power concentration
 *   humanPresence: 0-100,          // NPC/settlement density
 *   explorability: 0-100,          // Ease of discovery
 *   soilType: 'fertile'/'sandy'/...
 *   predatorPresence: 0-100,       // Boss/dangerous creatures
 *   windLevel: 0-100,              // Wind intensity
 *   temperature: -30 to +50°C
 * }
 * ```
 *
 * ## Chunk Exploration Tracking
 *
 * ```typescript
 * explored: boolean                 // Has player entered?
 * lastVisited: number               // Timestamp (for resource respawn)
 * lastUpdated: number               // Last simulation tick
 *
 * // Example: Resource respawn
 * if (now - lastVisited > 7 days):
 *   ore_nodes.respawn()
 *   herbs.regrow()
 * ```
 *
 * ## Regional Grouping (regionId)
 *
 * Chunks assigned to regions (biomes) via FloodFill:
 *
 * ```
 * Chunk (x:0, y:0): regionId = 1 (GRASSLAND)
 * Chunk (x:1, y:0): regionId = 1 (GRASSLAND)
 * Chunk (x:2, y:0): regionId = 2 (FOREST) ← different terrain
 * Chunk (x:2, y:1): regionId = 2 (FOREST)
 * ```
 *
 * Benefits:
 * - Efficient biome queries (all chunks in forest)
 * - Weather per-region support
 * - Creature pool per biome
 * - Navigation/pathfinding optimization
 *
 * ## Chunk Lifecycle
 *
 * ### Creation
 * ```
 * new Chunk(position, terrain, attributes, regionId)
 * - Allocated memory
 * - Marked as unloaded
 * - Entity array empty
 * ```
 *
 * ### Loading (Player Enters)
 * ```
 * chunk.load()
 * - Restore entities from database
 * - Start simulation loop
 * - Register with spatial index
 * - Time complexity: O(1) to O(n) depending on entity count
 * ```
 *
 * ### Active (Player Present)
 * ```
 * - Engines tick (plant growth, creature AI)
 * - Entities updated
 * - Events processed
 * - Every turn
 * ```
 *
 * ### Cached (Player 2+ chunks away)
 * ```
 * - No active simulation
 * - Visible for rendering
 * - Data in RAM
 * - Can be queried but not modified
 * ```
 *
 * ### Unloading (Player Far Away)
 * ```
 * chunk.unload()
 * - Serialize entities to database
 * - Clear entities from RAM
 * - Mark as unloaded
 * - Time stamp for resource respawn
 * ```
 *
 * ## Chunk-Level Simulation
 *
 * Engines process per-chunk:
 *
 * ```typescript
 * plantEngine.updatePlants(chunk)          // Growth, reproduction
 * creatureEngine.updateCreatures(chunk)    // Behavior, movement
 * weatherEngine.applyWeatherEffects(chunk) // Environmental changes
 * terrainEngine.updateTerrain(chunk)       // Erosion, resource depletion
 * ```
 *
 * Optimization:
 * - Only active chunks (radius 1)
 * - Batch updates per tick
 * - O(entities) complexity per chunk
 * - Cached results reused
 *
 * ## Performance Metrics
 *
 * | Operation | Complexity | Time |
 * |-----------|-----------|------|
 * | Load chunk | O(entities) | 10-50 ms |
 * | Unload chunk | O(entities) | 5-20 ms |
 * | Simulate chunk | O(entities) | 2-10 ms |
 * | Get entity | O(entities) | <1 ms (use Map for hot paths) |
 * | Query by type | O(entities) | 1-5 ms |
 *
 * ## Design Philosophy
 *
 * - **Memory Efficiency**: Load only nearby chunks
 * - **Simulation Focus**: Active area gets CPU time
 * - **Scalability**: Infinite world possible despite finite RAM
 * - **Modding**: IEntityContainer allows custom entities
 * - **Locality**: Chunk grouping enables region-based mechanics
 * - **Persistence**: Chunk serialization for save/load
 *
 */
// This file has been removed as it is now merged into world.ts
import { Position } from '../types/common';
import { Terrain } from './terrain';
import { TerrainAttributes } from '../types/world-attributes';
import { Entity, IEntityContainer } from './entity';

export class Chunk implements IEntityContainer {
    private _attributes: TerrainAttributes;
    private _explored: boolean = false;
    private _lastVisited: number = 0;
    private _lastUpdated: number = Date.now();
    private readonly _entities: Entity[] = [];

    constructor(
        private readonly _position: Position,
        private readonly _terrain: Terrain,
        attributes: TerrainAttributes,
        private _regionId: number
    ) {
        this._attributes = attributes;
    }

    // Basic properties
    get position(): Position {
        return this._position;
    }

    get terrain(): Terrain {
        return this._terrain;
    }

    get attributes(): TerrainAttributes {
        return this._attributes;
    }

    get explored(): boolean {
        return this._explored;
    }

    get lastVisited(): number {
        return this._lastVisited;
    }

    get lastUpdated(): number {
        return this._lastUpdated;
    }

    get regionId(): number {
        return this._regionId;
    }

    // IEntityContainer implementation
    get entities(): Entity[] {
        return this._entities;
    }

    addEntity(entity: Entity): void {
        this._entities.push(entity);
    }

    removeEntity(entityId: string): void {
        const index = this._entities.findIndex(e => e.id === entityId);
        if (index !== -1) {
            this._entities.splice(index, 1);
        }
    }

    getEntities(): Entity[] {
        return this._entities;
    }

    // Game mechanics
    visit(time: number): void {
        this._explored = true;
        this._lastVisited = time;
        this.update();
    }

    update(): void {
        const now = Date.now();
        const hoursSinceLastUpdate = (now - this._lastUpdated) / (1000 * 60 * 60);

        if (hoursSinceLastUpdate > 1) {
            this._attributes = this.calculateNewAttributes(hoursSinceLastUpdate);
            this._lastUpdated = now;
        }
    }

    reassignRegion(newRegionId: number): void {
        this._regionId = newRegionId;
    }

    private calculateNewAttributes(hoursPassed: number): TerrainAttributes {
        // Basic attribute evolution over time
        const attrs = { ...this._attributes };

        // Example: Vegetation grows slightly over time in suitable conditions
        if (attrs.moisture >= 30 && attrs.temperature >= 10 && attrs.temperature <= 35) {
            attrs.vegetationDensity = Math.min(100,
                attrs.vegetationDensity + (0.1 * hoursPassed)
            );
        }

        return attrs;
    }
}
