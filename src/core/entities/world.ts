import { GridPosition } from '../values/grid-position';
import { Terrain, SoilType } from './terrain';

/**
 * OVERVIEW: World structure entities
 *
 * Defines the hierarchical world structure: GridCell (fine-grained tiles) → Chunk (16×16 groups) → Region (connected chunks).
 * Each level has attributes affecting gameplay (moisture, danger, elevation, temperature).
 * Supports efficient world queries, lazy loading, and modding through clean architecture.
 *
 * ## World Hierarchy
 *
 * ```
 * World (infinite grid)
 *   └─ Chunk (16×16 GridCells)        [Load/unload unit]
 *       └─ GridCell (1×1 tile)         [Fine-grained simulation]
 *           └─ Terrain + Entities      [Actual content]
 *       └─ Region (multiple chunks)    [Biome grouping]
 * ```
 *
 * ### Coordinate System
 *
 * **GridPosition (Global):**
 * ```
 * {x, y} = world coordinates
 * x: -∞ to +∞ (east-west)
 * y: -∞ to +∞ (north-south)
 * Origin (0, 0) = world center
 * ```
 *
 * **Chunk Coordinates:**
 * ```
 * ChunkX = floor(globalX / 16)
 * ChunkY = floor(globalY / 16)
 * Example: GlobalX=35 → ChunkX=2, LocalX=3
 * ```
 *
 * **Local Cell Coordinates (within chunk):**
 * ```
 * LocalX = globalX % 16  (0-15)
 * LocalY = globalY % 16  (0-15)
 * Total cells per chunk: 16 × 16 = 256
 * ```
 *
 * ## WorldAttributes (Global Environment)
 *
 * Base environment properties for a world tile:
 *
 * ```typescript
 * interface WorldAttributes {
 *   vegetationDensity: number,    // 0-100: plant concentration
 *   moisture: number,             // 0-100: water availability
 *   elevation: number,            // meters: terrain height
 *   lightLevel: number,           // 0-100: sun exposure
 *   dangerLevel: number,          // 0-100: creature threat
 *   magicAffinity: number,        // 0-100: magical power
 *   humanPresence: number,        // 0-100: NPC/settlement density
 *   explorability: number,        // 0-100: ease of discovery
 *   soilType: SoilType,          // Fertile, Sandy, Rocky, etc.
 *   predatorPresence: number,     // 0-100: dangerous creatures
 *   windLevel: number,            // 0-100: wind speed
 *   temperature: number,          // -30 to 50°C
 * }
 * ```
 *
 * ### Attribute Effects
 *
 * | Attribute | Low (0-33) | Medium (34-66) | High (67-100) |
 * |-----------|-----------|-----------|-----------|
 * | Vegetation | Barren | Normal | Jungle |
 * | Moisture | Drought | Temperate | Flooded |
 * | Elevation | Valley | Hills | Mountains |
 * | Danger | Safe | Challenge | Lethal |
 * | Magic | Inert | Active | Wild |
 *
 * ## GridCellAttributes (Fine-Grained Tile)
 *
 * Detailed properties for single 1×1 tile:
 *
 * ```typescript
 * interface GridCellAttributes {
 *   vegetationDensity: number,    // Plant count on tile
 *   elevation: number,            // Exact height
 *   dangerLevel: number,          // Creature threat here
 *   magicAffinity: number,        // Magic concentration
 *   humanPresence: number,        // NPCs/structures
 *   predatorPresence: number,     // Boss/rare creatures
 *   temperature: number,          // Local temperature
 *   moisture: number,             // Water content
 *   windLevel: number,            // Local wind
 *   lightLevel: number,           // Sunlight
 *   explorability: number,        // Discovery difficulty
 *   soilType: SoilType,          // Soil composition
 *   travelCost: number,           // Movement difficulty (1-10)
 * }
 * ```
 *
 * **travelCost** affects movement speed:
 * ```
 * actual_time = base_time × (travelCost / 5)
 * Cost 1 (road): 20% normal time
 * Cost 5 (grass): 100% normal time
 * Cost 10 (mountain): 200% normal time
 * ```
 *
 * ## GridCell Class
 *
 * Single world tile entity:
 *
 * ```typescript
 * class GridCell {
 *   position: GridPosition,           // Global coordinates
 *   terrain: Terrain,                 // Terrain type
 *   attributes: GridCellAttributes,   // Environment data
 *   explored: boolean,                // Discovered by player?
 *   lastVisited: number,              // Timestamp of visit
 *   regionId: number,                 // Region group ID
 *   lastUpdated: number,              // Last simulation tick
 * }
 * ```
 *
 * ### Cell State Machine
 *
 * ```
 * UNEXPLORED
 *   ├─ [Enter cell] → EXPLORED
 *   └─ [Scan with skill] → PARTIALLY_KNOWN
 *
 * EXPLORED
 *   ├─ [Time passes] → may generate random encounter
 *   └─ [Resources spawn] → updated attributes
 *
 * PARTIALLY_KNOWN
 *   ├─ [Enter] → EXPLORED (full data)
 *   └─ [Info expires after 24h] → UNEXPLORED
 * ```
 *
 * ## Chunk Class
 *
 * 16×16 grid of cells (256 total):
 *
 * ```typescript
 * class Chunk {
 *   position: ChunkPosition,          // Chunk grid coordinates
 *   cells: GridCell[256],             // Flat array or 2D array
 *   loaded: boolean,                  // In memory?
 *   entities: Entity[],               // Creatures, plants
 *   lastUpdated: number,              // Simulation tick
 *
 *   // Methods
 *   getCell(x, y): GridCell           // Fetch cell
 *   getEntityAt(x, y): Entity[]       // Creatures at position
 *   updateCell(x, y, attrs): void     // Modify cell
 *   serialize(): ChunkData            // For storage
 * }
 * ```
 *
 * ### Memory Management
 *
 * ```
 * Load distance: 3 chunks (radius 48 tiles)
 *   ┌─────────────┐
 *   │  UNLOADED   │
 *   │ ┌───────┐   │
 *   │ │ LOADED│   │
 *   │ │ CACHE │   │
 *   │ └───────┘   │
 *   └─────────────┘
 *
 * Unloaded: Minimal data in RAM
 * Cached: Full data, no updates
 * Active: Full updates every tick
 * ```
 *
 * ## Region Class
 *
 * Grouping of connected chunks (biome/area):
 *
 * ```typescript
 * interface Region {
 *   id: number,                       // Unique identifier
 *   chunkPositions: ChunkPosition[],  // Chunks in region
 *   dominantTerrain: TerrainType,    // Primary terrain
 *   weatherPattern: WeatherType,      // Current weather
 *   creatures: Creature[],            // Regional spawn pool
 *   difficulty: number,               // 1-30+ (level range)
 *   discovered: boolean,              // Player knows of it?
 * }
 * ```
 *
 * ### Region Detection
 *
 * Uses FloodFill algorithm to group connected chunks:
 *
 * ```
 * 1. Start with unvisited chunk of terrain A
 * 2. Recursively add all adjacent chunks of same terrain
 * 3. Stop at terrain boundaries
 * 4. Assign region ID to all visited chunks
 * 5. Repeat until map complete
 * ```
 *
 * Result: Realistic continents/biomes instead of scattered tiles
 *
 * ## Performance Characteristics
 *
 * | Operation | Complexity | Time @ 1M tiles |
 * |-----------|-----------|-----------------|
 * | Get cell | O(1) | <1 ms |
 * | Query cells in radius | O(r²) | 1-10 ms (r=100) |
 * | Load/unload chunk | O(1) | <5 ms |
 * | Pathfinding (chunk) | O(n log n) | 5-20 ms |
 * | Serialize world | O(n) | 100-500 ms |
 * | Generation (Perlin) | O(n log n) | 1-5 sec |
 *
 * ## Design Philosophy
 *
 * - **Hierarchical**: Chunks enable efficient memory management
 * - **Lazy Loading**: Only active area simulated in detail
 * - **Modding**: Clean interfaces for custom terrains/entities
 * - **Scalability**: Infinite world with constant memory footprint
 * - **Realism**: Perlin noise + FloodFill = natural terrain
 * - **Exploration**: Regions create biome discovery goals
 *
 */
export interface WorldAttributes {
    /** Mật độ thực vật (0-100) */
    vegetationDensity: number;
    /** Độ ẩm (0-100) */
    moisture: number;
    /** Độ cao địa hình */
    elevation: number;
    /** Mức độ ánh sáng */
    lightLevel: number;
    /** Mức độ nguy hiểm */
    dangerLevel: number;
    /** Độ tương tác với ma thuật */
    magicAffinity: number;
    /** Mức độ hiện diện của con người */
    humanPresence: number;
    /** Độ dễ khám phá */
    explorability: number;
    /** Loại đất */
    soilType: SoilType;
    /** Mức độ xuất hiện thú săn mồi */
    predatorPresence: number;
    /** Mức độ gió */
    windLevel: number;
    /** Nhiệt độ */
    temperature: number;
}

/**
 * Đại diện cho một ô (chunk) trong thế giới, chứa thông tin vị trí, địa hình và thuộc tính môi trường.
/**
 * World structure entities: Chunk, GridCell, Region
 * Merged and refactored for clarity, modding, and clean architecture.
 * @module src/core/entities/world
 */



/**
 * Attributes for a grid cell (fine-grained world tile)
 */
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

/**
 * Represents a single cell in the world grid.
 * @remarks Used for fine-grained world simulation and modding.
 */
export class GridCell {
    private _lastUpdated!: number;

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

    /**
     * Vị trí của ô trong lưới thế giới.
     */
    get position(): GridPosition {
        return this._position;
    }

    /**
     * Địa hình của ô.
     */
    get terrain(): Terrain {
        return this._terrain;
    }

    /**
     * Thuộc tính của ô.
     */
    get attributes(): GridCellAttributes {
        return this._attributes;
    }

    /**
     * Kiểm tra xem ô đã được khám phá hay chưa.
     */
    get explored(): boolean {
        return this._explored;
    }

    /**
     * Thời gian lần cuối ô được truy cập.
     */
    get lastVisited(): number {
        return this._lastVisited;
    }

    /**
     * ID của vùng mà ô thuộc về.
     */
    get regionId(): number {
        return this._regionId;
    }

    /**
     * Cập nhật thuộc tính cho ô.
     * @param attributes - Thuộc tính mới để cập nhật.
     */
    updateAttributes(attributes: Partial<GridCellAttributes>): void {
        this._attributes = { ...this._attributes, ...attributes };
        this._lastUpdated = Date.now();
    }

    /**
     * Đánh dấu ô là đã được khám phá.
     */
    markExplored(): void {
        this._explored = true;
        this._lastVisited = Date.now();
    }

    /**
     * Đánh dấu ô là chưa được khám phá.
     */
    markUnexplored(): void {
        this._explored = false;
    }
}
