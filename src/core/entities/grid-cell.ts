/**
 * OVERVIEW: GridCell entity (1×1 world tile)
 *
 * Represents a single cell (1×1 meter) within a 16×16 chunk.
 * Fine-grained world simulation at tile level.
 * Each cell has terrain, environmental attributes, and optional entities.
 * Enables detailed pathfinding, collision detection, and environmental effects.
 *
 * ## GridCell Basics
 *
 * ### Coordinate System
 * ```
 * Global position: {x: 35, y: -42}
 * Maps to chunk: {chunkX: 2, chunkY: -3}
 * Local in chunk: {localX: 3, localY: 6} (35 % 16 = 3, -42 % 16 = 6)
 * Cell is unique: chunk(2,-3).cell(3,6)
 * ```
 *
 * ### Cell Size & Scale
 * ```
 * 1 cell = 1 meter (real world analogy)
 * 16×16 chunk = 256 cells = ~16×16 meters
 * 1 region = ~100 chunks = ~1600×1600 meters = 1.6 km²
 * World = infinite cells in 2D plane
 * ```
 *
 * ## GridCellAttributes (Fine-Grained Properties)
 *
 * Detailed environmental data per cell:
 *
 * ```typescript
 * interface GridCellAttributes {
 *   vegetationDensity: number,    // 0-100: plant count
 *   elevation: number,            // -1000 to +1000: exact height
 *   dangerLevel: number,          // 0-100: threat level
 *   magicAffinity: number,        // 0-100: magical intensity
 *   humanPresence: number,        // 0-100: NPC/settlement
 *   predatorPresence: number,     // 0-100: boss/rare creature
 *   temperature: number,          // -30 to +50: °C
 *   moisture: number,             // 0-100: water content
 *   windLevel: number,            // 0-100: wind speed
 *   lightLevel: number,           // 0-100: sun exposure
 *   explorability: number,        // 0-100: discovery difficulty
 *   soilType: SoilType,          // FERTILE/SANDY/ROCKY/etc
 *   travelCost: number,           // 1-10: movement difficulty
 * }
 * ```
 *
 * ### Attribute Ranges & Effects
 *
 * | Attribute | Low | Medium | High | Effect |
 * |-----------|-----|--------|------|--------|
 * | Elevation | -1000 m | 0 m | +1000 m | Valley → Plains → Mountain |
 * | Danger | 0% | 50% | 100% | Safe → Monsters common → Lethal |
 * | Moisture | 0% (drought) | 50% (normal) | 100% (flooded) | Plant growth modifier |
 * | Temperature | -30°C (snow) | 15°C (temperate) | +50°C (heat) | Creature behavior, damage |
 * | TravelCost | 1 (road) | 5 (grass) | 10 (mountain) | Movement speed ÷ travelCost × 5 |
 *
 * ### Travel Cost Calculation
 *
 * ```typescript
 * // Movement formula
 * timeToTraverse = travelTime × (travelCost / 5)
 *
 * Examples (base 10 seconds):
 * Cost 1 (road): 10 × (1/5) = 2 seconds (fastest)
 * Cost 3 (grass): 10 × (3/5) = 6 seconds
 * Cost 5 (forest): 10 × (5/5) = 10 seconds (normal)
 * Cost 8 (swamp): 10 × (8/5) = 16 seconds (slow)
 * Cost 10 (mountain): 10 × (10/5) = 20 seconds (slowest)
 * ```
 *
 * ## GridCell Class (GridCell)
 *
 * Represents individual cell object:
 *
 * ```typescript
 * class GridCell {
 *   position: GridPosition,           // Global {x, y}
 *   terrain: Terrain,                 // Terrain type
 *   attributes: GridCellAttributes,   // Environment
 *   explored: boolean,                // Player visited?
 *   lastVisited: number,              // Timestamp
 *   regionId: number,                 // Biome grouping
 *   lastUpdated: number,              // Simulation tick
 * }
 * ```
 *
 * ## Cell State Tracking
 *
 * ### Exploration State
 * ```typescript
 * explored: boolean
 *
 * States:
 * - false: Unknown, not visited
 * - true: Discovered by player (permanently marked)
 *
 * Usage:
 * if (!cell.explored && player.canDiscover(cell)):
 *   cell.explored = true
 *   player.gainXP(5)
 * ```
 *
 * ### Visitation Tracking
 * ```typescript
 * lastVisited: number  // Unix timestamp
 *
 * Determines resource respawn:
 * if (now - cell.lastVisited > 7 days):
 *   respawnOre()
 *   respawnHerbs()
 * ```
 *
 * ### Update Tracking
 * ```typescript
 * lastUpdated: number  // Last engine tick
 *
 * Prevents duplicate processing:
 * if (cell.lastUpdated < currentTick):
 *   updateCell()
 *   cell.lastUpdated = currentTick
 * ```
 *
 * ## Cell Queries & Pathfinding
 *
 * ### Walkability Check
 * ```typescript
 * canWalk(cell): boolean {
 *   return cell.terrain.passable &&
 *          cell.travelCost <= maxCost &&
 *          !hasBlockingEntity(cell)
 * }
 * ```
 *
 * ### Distance Calculation (Chebyshev)
 * ```typescript
 * distance(cell1, cell2): number {
 *   return Math.max(
 *     Math.abs(cell1.x - cell2.x),
 *     Math.abs(cell1.y - cell2.y)
 *   )
 * }
 * // Distance from (5,10) to (12,8) = max(7, 2) = 7 cells
 * ```
 *
 * ### Area Queries
 * ```typescript
 * // All cells in radius 10
 * getNearby(cell, radius): GridCell[] {
 *   return cells.filter(c =>
 *     distance(cell, c) <= radius
 *   )
 * }
 *
 * // Cells in line of sight (8 directions)
 * getLineOfSight(cell, range): GridCell[] {
 *   return bresenhamLine(cell, direction, range)
 * }
 * ```
 *
 * ## Cell Environmental Effects
 *
 * ### Temperature Impact
 * ```typescript
 * // Cold cell (temp < 0°C)
 * if (player.inCell(coldCell)):
 *   player.takeDamage(2 * Math.abs(temperature))  // -2 HP per °C below 0
 *
 * // Hot cell (temp > 30°C)
 * if (player.inCell(hotCell)):
 *   player.takeDamage(1 * (temperature - 30))    // -1 HP per °C above 30
 * ```
 *
 * ### Moisture & Plant Growth
 * ```typescript
 * // Growth modifier based on moisture
 * growthBonus = 0.5 + (cell.moisture / 100) × 1.0
 * // At moisture 0%: 0.5× growth
 * // At moisture 50%: 1.0× growth
 * // At moisture 100%: 1.5× growth
 * ```
 *
 * ### Danger & Creature Spawning
 * ```typescript
 * // Spawn chance increases with danger
 * creatureSpawnChance = 0.01 × cell.dangerLevel
 * // 0% danger: 0% spawn chance (safe)
 * // 50% danger: 0.5% spawn chance (normal)
 * // 100% danger: 1% spawn chance (very likely per tick)
 * ```
 *
 * ## Cell Memory & Performance
 *
 * Memory per cell (minimal):
 * ```
 * position: 8 bytes (2 × int32)
 * terrain ref: 4 bytes
 * attributes (13 numbers): 104 bytes
 * state (3 booleans/timestamps): 12 bytes
 * Total: ~130 bytes per cell (sparse storage)
 * ```
 *
 * Chunk of 256 cells:
 * ```
 * 256 cells × 130 bytes ≈ 33 KB (attributes only)
 * With entities: +1-2 MB
 * ```
 *
 * ## Cell Caching & Optimization
 *
 * ### Precomputed Neighborhoods
 * ```typescript
 * // Cache 8 neighbors (O(1) lookup instead of O(n))
 * neighbors: Map<direction, GridCell>
 * ```
 *
 * ### Regional Grouping
 * ```typescript
 * // Cells share region (biome)
 * regionId: number  // 1-100 possible regions
 *
 * Query entire biome:
 * cells.filter(c => c.regionId === targetRegion)
 * ```
 *
 * ## Design Philosophy
 *
 * - **Fine-Grained Simulation**: Per-tile detail enables realistic world
 * - **Performance**: Attributes cached, updated only when needed
 * - **Scalability**: Can handle infinite cells (procedural generation)
 * - **Exploration**: Cells track state for discovery rewards
 * - **Navigation**: Travel cost enables varied terrain difficulty
 * - **Modding**: Custom attributes via flexible record system
 *
 */
// Fully removed: logic is now in world.ts
import { GridPosition } from '../values/grid-position';
import { Terrain } from './terrain';
import type { TerrainType, SoilType } from './terrain';

export interface GridCellAttributes {
    vegetationDensity: number;
    elevation: number;
    dangerLevel: number;
    magicAffinity: number;
    humanPresence: number;
    predatorPresence: number;
    temperature: number;
    moisture: number;
    windLevel: number;
    lightLevel: number;
    explorability: number;
    soilType: SoilType;
    travelCost: number;
}

export class GridCell {
    private _lastUpdated: number;

    constructor(
        private readonly _position: GridPosition,
        private readonly _terrain: Terrain,
        private _attributes: GridCellAttributes,
        private _explored: boolean = false,
        private _lastVisited: number = 0,
        private readonly _regionId: number
    ) {
        this._lastUpdated = Date.now();
    }

    get position(): GridPosition { return this._position; }
    get terrain(): Terrain { return this._terrain; }
    get attributes(): Readonly<GridCellAttributes> { return this._attributes; }
    get explored(): boolean { return this._explored; }
    get lastVisited(): number { return this._lastVisited; }
    get regionId(): number { return this._regionId; }
    get lastUpdated(): number { return this._lastUpdated; }

    visit(): void {
        this._explored = true;
        this._lastVisited = Date.now();
        this.update();
    }

    update(): void {
        const now = Date.now();
        const hoursSinceLastUpdate = (now - this._lastUpdated) / (1000 * 60 * 60);

        // Update attributes based on time passed and current conditions
        if (hoursSinceLastUpdate > 1) {
            this._attributes = this.calculateNewAttributes(hoursSinceLastUpdate);
            this._lastUpdated = now;
        }
    }

    private calculateNewAttributes(_hoursPassed: number): GridCellAttributes {
        // This will implement the actual attribute evolution over time
        // For now, return current attributes
        return { ...this._attributes };
    }

    static createFromData(data: any): GridCell {
        return new GridCell(
            new GridPosition(data.x, data.y),
            new Terrain(
                data.terrain as TerrainType,
                {} as any, // Need to add proper terrain attributes
                data.terrain, // Temporary: using terrain type as name
                '' // Need to add proper description
            ),
            {
                vegetationDensity: data.vegetationDensity,
                elevation: data.elevation,
                dangerLevel: data.dangerLevel,
                magicAffinity: data.magicAffinity,
                humanPresence: data.humanPresence,
                predatorPresence: data.predatorPresence,
                temperature: data.temperature,
                moisture: data.moisture,
                windLevel: data.windLevel,
                lightLevel: data.lightLevel,
                explorability: data.explorability,
                soilType: data.soilType as SoilType,
                travelCost: data.travelCost
            },
            data.explored,
            data.lastVisited,
            data.regionId
        );
    }

    toJSON() {
        return {
            x: this.position.x,
            y: this.position.y,
            explored: this._explored,
            lastVisited: this._lastVisited,
            regionId: this._regionId,
            terrain: this._terrain.type,
            ...this._attributes
        };
    }
}
