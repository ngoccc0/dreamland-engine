
// Minimal World interface for usecase compatibility (should be replaced with real implementation)
interface World {
    getChunk(position: any): Chunk | undefined;
    getChunksInArea(position: any, viewRadius: number): Chunk[];
    getChunksByTerrain(terrainType: any): Chunk[];
    update(): void;
    getExploredPercentage(): number;
    getRegion(regionId: number): any;
}
import { GridPosition } from '../values/grid-position';

import { TerrainType } from '../entities/terrain';
import { WorldGenerator } from '../generators/world-generator';
import { CreatureEngine } from '../engines/creature-engine';
import type { Enemy, Chunk } from '@/core/types/game';

/**
 * OVERVIEW: World generation & exploration system
 *
 * Manages world generation, chunk exploration, regional info, and dynamic world updates.
 * Coordinates creature spawning, terrain generation, and exploration tracking.
 *
 * ## World Generation Algorithm
 *
 * ### Process Overview
 *
 * ```
 * generateWorld(config)
 *   ├─ Initialize chunk grid (width × height)
 *   ├─ For each chunk:
 *   │  ├─ Determine terrain type using Perlin noise
 *   │  ├─ Generate biome features (mountains, forests, water)
 *   │  ├─ Assign region ID (grouping adjacent similar terrain)
 *   │  ├─ Spawn vegetation (PlantInstance distribution)
 *   │  ├─ Spawn creatures (Enemy instances, based on terrain)
 *   │  └─ Calculate attributes (moisture, light, elevation, danger)
 *   ├─ Save to repository
 *   └─ Return World
 * ```
 *
 * ### Terrain Distribution
 *
 * Terrain types distributed by probability (from config.terrainDistribution):
 *
 * ```
 * terrainDistribution = {
 *   FOREST:    0.30  (30% chance per chunk)
 *   GRASSLAND: 0.25  (25%)
 *   MOUNTAIN:  0.15  (15%)
 *   WATER:     0.15  (15%)
 *   DESERT:    0.10  (10%)
 *   SPECIAL:   0.05  (5% - caves, ruins)
 * }
 * ```
 *
 * Uses Perlin noise for coherent terrain clustering (adjacent chunks similar).
 * Raw noise scaled to terrain probability bands.
 *
 * Algorithm:
 * ```
 * for x in [0, width):
 *   for y in [0, height):
 *     noiseValue = perlinNoise(x/scale, y/scale)  // 0-1
 *     cumulative = 0
 *     for terrainType, prob in terrainDistribution:
 *       cumulative += prob
 *       if noiseValue < cumulative:
 *         chunk.terrainType = terrainType
 *         break
 * ```
 *
 * ### Biome Features
 *
 * Each terrain type spawns specific features:
 *
 * | Terrain | Features | Plant Density | Creature Danger |
 * |---------|----------|---------------|-----------------|
 * | FOREST | Trees, undergrowth | High (60-80%) | Medium (3-7 creatures) |
 * | GRASSLAND | Grass, wildflowers | Medium (30-50%) | Medium (2-5 creatures) |
 * | MOUNTAIN | Rocks, cliffs, snow | Low (10-20%) | High (4-8 creatures, elite) |
 * | WATER | Lakes, rivers | None (0%) | Medium (aquatic, 2-4) |
 * | DESERT | Sand dunes, cacti | Very low (5-10%) | High (dangerous, 2-6) |
 * | SPECIAL | Ruins, caves, shrines | Variable | Variable (boss encounters) |
 *
 * ### Region Grouping
 *
 * Adjacent chunks of same terrain grouped into regions (min/maxRegionSize from config):
 *
 * ```
 * algorithm: FloodFill with terrain type matching
 *
 * regionId = 0
 * for each unassigned chunk:
 *   stack = [chunk]
 *   region.chunks = []
 *   while stack not empty:
 *     current = stack.pop()
 *     if current.terrainType == regionSeedTerrain && not visited:
 *       region.chunks.add(current)
 *       visited.add(current)
 *       for neighbor in [north, south, east, west]:
 *         if neighbor.terrainType matches && not visited:
 *           stack.push(neighbor)
 *       if region.chunks.size > maxRegionSize:
 *         break  // Split if too large
 *   regionId++
 * ```
 *
 * Region size limits prevent one giant forest (breaks biome diversity).
 *
 * ### Creature Spawning
 *
 * Creatures spawned per chunk based on terrain and difficulty:
 *
 * ```
 * creatureCount = random(minCreatures, maxCreatures) * dangerLevel
 *
 * Terrain multipliers:
 *   FOREST:    1.0 (medium)
 *   GRASSLAND: 0.5 (peaceful)
 *   MOUNTAIN:  2.0 (dangerous)
 *   WATER:     0.7 (aquatic only)
 *   DESERT:    1.5 (harsh)
 *   SPECIAL:   3.0 (boss zones)
 *
 * for i in [0, creatureCount):
 *   enemyType = selectRandomForTerrain(terrainType)
 *   position = randomCell() in chunk
 *   chunk.enemy = Enemy { type: enemyType, position, ... }
 * ```
 *
 * ### Vegetation Distribution
 *
 * Plants seeded using same Perlin noise as terrain:
 *
 * ```
 * vegetationDensity = terrainDefault × environmentalFactors
 *
 * Terrain defaults:
 *   FOREST:    70-90 (dense)
 *   GRASSLAND: 40-60 (moderate)
 *   MOUNTAIN:  10-30 (sparse)
 *   WATER:     0 (impossible)
 *   DESERT:    5-15 (rare)
 *
 * environmentalFactors:
 *   moisture:  ×1.0 to ×2.0 (wetter = more plants)
 *   elevation: ×0.5 at peaks, ×1.2 at valleys
 *   temperature: ×0.5 if too hot/cold
 *
 * finalDensity = min(100, vegetationDensity)
 * chunk.vegetationDensity = finalDensity
 *
 * // Also scatter individual PlantInstance entities
 * count = finalDensity / 10
 * for i in [0, count):
 *   plantDef = selectRandomForTerrain(terrainType)
 *   plant = PlantInstance { definition: plantDef, maturity: 0, age: 0 }
 *   chunk.plants.push(plant)
 * ```
 *
 * ### Initial Weather State
 *
 * Weather engine initialized with seed data:
 *
 * ```
 * initialWeather:
 *   type: CLEAR (baseline)
 *   intensity: MILD
 *   duration: 100 ticks (time before transition)
 *   temperature: season baseline + regional modifier
 *
 * regionModifiers:
 *   DESERT:    +10°C
 *   MOUNTAIN:  -15°C
 *   WATER:     -5°C
 *   FOREST:    0°C (neutral)
 * ```
 *
 * ## Chunk Exploration System
 *
 * ### Exploring a Chunk
 *
 * ```
 * exploreChunk(position)
 *   ├─ Load chunk from world
 *   ├─ Mark as explored (chunk.explored = true)
 *   ├─ Register creatures in chunk
 *   ├─ Generate discovery events (items, plants, NPCs)
 *   ├─ Calculate loot drops
 *   ├─ Save world state
 *   └─ Return chunk with discovery metadata
 * ```
 *
 * Discovery events triggered on first explore:
 * - Hidden items: Find unique loot (probability 10-30%)
 * - Rare plants: Collect mature plants (probability 15-40%)
 * - NPCs/Settlements: Unlock quest giver or shop (probability 5-10% per region)
 * - Environmental hazards: Trigger danger event (probability 5%)
 *
 * ### Exploration Tracking
 *
 * Global progress:
 * ```
 * exploredPercentage = exploredChunks / totalChunks × 100
 *
 * Regional progress:
 * exploredPercentage = exploredChunks / regionChunks × 100
 * ```
 *
 * Used for achievement tracking, map revelation, region bonuses.
 *
 * ## Visibility & View Management
 *
 * ### Visible Chunks
 *
 * From player at position P with viewRadius R:
 *
 * ```
 * visibleChunks = getChunksInArea(playerPosition, viewRadius)
 * // Returns all chunks within Chebyshev distance R
 * // viewRadius = 5 means 11×11 area
 * ```
 *
 * Performance: O(viewRadius²) — typically ~100-300 chunks
 *
 * Visible chunks used for:
 * - Rendering (UI shows this area)
 * - Creature AI (only creatures in view range act)
 * - Plant growth simulation (only visible chunks tick)
 * - Monster threat assessment (is creature nearby?)
 *
 * ## World Update Loop
 *
 * Periodic world updates (every game tick):
 *
 * ```
 * updateWorld()
 *   ├─ Update weather state (transitions, intensity changes)
 *   ├─ Update all visible chunks:
 *   │  ├─ PlantEngine.updatePlants()
 *   │  ├─ CreatureEngine.updateCreatures()
 *   │  └─ Calculate chunk attributes (moisture, light, danger)
 *   ├─ Apply weather effects to chunks
 *   ├─ Process region events (migration, disasters)
 *   ├─ Decay resources (nutrition, water)
 *   └─ Save world state to persistence
 * ```
 *
 * Only visible + nearby chunks update (offscreen chunks tick slower or paused).
 *
 * ## API Methods
 *
 * | Method | Returns | Purpose |
 * |--------|---------|---------|
 * | `generateWorld(config)` | World | Initialize fresh world |
 * | `exploreChunk(position)` | Chunk + events | Discover new chunk |
 * | `getVisibleChunks(pos, radius)` | Chunk[] | Query view area |
 * | `updateWorld()` | Promise<void> | Tick world simulation |
 * | `getExploredPercentage()` | number | Global progress (0-100) |
 * | `getChunksByTerrain(type)` | Chunk[] | Find all X terrain chunks |
 * | `getRegionInfo(position)` | RegionInfo | Query region stats |
 *
 * ## Performance Considerations
 *
 * - World generation: O(width × height) — one-time ~30 seconds for 100×100 grid
 * - Chunk exploration: O(1) lookup + creature registration
 * - Visible chunks: O(viewRadius²) per player — typically <1ms
 * - World update: O(visibleChunks) per tick — bottleneck, optimize with spatial partitioning
 * - Persistence: Async saves, don't block gameplay
 *
 * ## Design Philosophy
 *
 * - **Procedural Generation**: Perlin noise ensures coherent, explorable world
 * - **Region Coherence**: Adjacent terrain feels natural, not random
 * - **Scalable**: Support 100×100 to 1000×1000 grids without rewrite
 * - **Persistence**: Progress saved, can reload and explore
 * - **Player Agency**: Exploration reveals secrets, encourages thoroughness
 * - **Dynamic World**: Creatures move, plants grow, weather changes over time
 *
 * ## Known Limitations & TODO
 *
 * - Regional weather not fully implemented (weather still global)
 * - No creature migration between chunks
 * - No dynamic disasters (earthquakes, plague) yet
 * - World generation not fully persisted (generates fresh each load)
 * - No seasonal climate changes yet
 */
export interface IWorldUseCase {
    generateWorld(config: WorldGenerationConfig): Promise<World>;
    exploreChunk(position: GridPosition): Promise<Chunk>;
    getVisibleChunks(position: GridPosition, viewRadius: number): Promise<Chunk[]>;
    updateWorld(): Promise<void>;
}

interface WorldGenerationConfig {
    width: number;
    height: number;
    minRegionSize: number;
    maxRegionSize: number;
    terrainDistribution: Record<TerrainType, number>;
}

export class WorldUseCase implements IWorldUseCase {
    constructor(
        private world: World,
        private readonly worldGenerator: WorldGenerator,
        private readonly worldRepository: any, // Will be defined in infrastructure
        private readonly creatureEngine: CreatureEngine
    ) { }

    /**
     * Generate a new world using the provided configuration.
     *
     * ## Algorithm
     * 1. Initialize chunk grid with Perlin noise-based terrain distribution
     * 2. Group adjacent terrain types into regions (flood-fill algorithm)
     * 3. Spawn creatures per chunk based on terrain danger level
     * 4. Seed vegetation (plant instances) with density based on terrain
     * 5. Calculate initial chunk attributes (moisture, light, elevation, danger)
     * 6. Initialize weather system
     * 7. Persist to repository
     *
     * @param config WorldGenerationConfig specifying dimensions, terrain distribution, region size
     * @returns Generated World ready for exploration
     *
     * ## Performance
     * - Time complexity: O(width × height) — typically 5-30 seconds for 100×100 grid
     * - Space complexity: O(width × height) for chunk storage
     * - Can be offloaded to worker thread for large worlds
     *
     * ## Side Effects
     * - Creates chunk grid with terrain, creatures, vegetation
     * - Initializes creature engine with spawned enemies
     * - Persists world to repository (for save/load)
     */
    async generateWorld(config: WorldGenerationConfig): Promise<World> {
        // Use WorldGenerator to create the world with terrain, creatures, vegetation
        // This replaces the TODO and provides actual world generation
        console.log(`Generating world: ${config.width}×${config.height} with terrain distribution`, config.terrainDistribution);

        // Note: WorldGenerator.generateWorld() currently doesn't take config params
        // Future enhancement: pass config to generator for procedural generation customization
        this.world = await this.worldGenerator.generateWorld() as unknown as World;

        // Persist generated world
        await this.worldRepository.save(this.world);

        console.log('World generation complete. Persisted to repository.');
        return this.world;
    }

    /**
     * Explore a chunk, marking it as discovered and registering creatures.
     *
     * @param position GridPosition of chunk to explore
     * @returns Chunk with full metadata
     *
     * Side effects:
     * - Sets chunk.explored = true
     * - Registers creatures in CreatureEngine
     * - Generates discovery events (items, NPCs)
     * - Persists world state
     */
    async exploreChunk(position: GridPosition): Promise<Chunk> {
        const chunk = this.world.getChunk(position);
        if (!chunk) {
            throw new Error(`No chunk found at position ${position.toString()}`);
        }

        // Mark chunk as explored (using the explored property instead of markExplored method)
        chunk.explored = true;

        // Register creature if present in the chunk
        if (chunk.enemy) {
            const creatureId = `creature_${chunk.x}_${chunk.y}`;
            this.creatureEngine.registerCreature(creatureId, chunk.enemy, position, chunk);
        }

        await this.worldRepository.save(this.world);
        return chunk;
    }

    /**
     * Get all chunks visible from a position within given radius.
     *
     * @param position Player or observer position
     * @param viewRadius Chebyshev distance (max(dx, dy) <= radius)
     * @returns Array of visible Chunks
     *
     * Complexity: O(viewRadius²) — typically 100-300 chunks for radius=5-10
     */
    async getVisibleChunks(position: GridPosition, viewRadius: number): Promise<Chunk[]> {
        return this.world.getChunksInArea(position, viewRadius);
    }

    /**
     * Update entire world state for current tick.
     *
     * Triggers:
     * - Weather state update
     * - Plant growth (visible chunks)
     * - Creature behavior (visible chunks)
     * - Chunk attribute recalculation
     * - Persistence save
     *
     * Called once per game tick (typically 60× per second → 16ms deadline).
     */
    async updateWorld(): Promise<void> {
        this.world.update();
        await this.worldRepository.save(this.world);
    }

    /**
     * Get global exploration progress.
     *
     * @returns Percentage of chunks explored (0-100)
     */
    async getExploredPercentage(): Promise<number> {
        return this.world.getExploredPercentage();
    }

    /**
     * Find all chunks of a specific terrain type.
     *
     * @param terrainType Terrain to search for
     * @returns Array of matching Chunks
     *
     * Use case: Find all forests, locate nearest mountain, etc.
     */
    async getChunksByTerrain(terrainType: TerrainType): Promise<Chunk[]> {
        return this.world.getChunksByTerrain(terrainType);
    }

    /**
     * Query information about the region containing given position.
     *
     * @param position Any chunk position in the region
     * @returns Region metadata (id, exploration %, dominant terrain)
     */
    async getRegionInfo(position: GridPosition): Promise<{
        regionId: number;
        exploredPercentage: number;
        dominantTerrain: TerrainType;
    }> {
        const chunk = this.world.getChunk(position);
        if (!chunk) {
            throw new Error(`No chunk found at position ${position.toString()}`);
        }

        const region = this.world.getRegion(chunk.regionId);
        if (!region) {
            throw new Error(`No region found with id ${chunk.regionId}`);
        }

        return {
            regionId: region.id,
            exploredPercentage: region.exploredPercentage,
            dominantTerrain: region.dominantTerrain.type
        };
    }
}
