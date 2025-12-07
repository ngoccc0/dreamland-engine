/**
 * @overview
 * Provides biome-specific footstep sound selection with terrain category mapping.
 * Maps biomes to terrain types (grass, snow, gravel, wood) and returns 3 random footsteps per action.
 * Supports differentiated audio feedback for different environmental surfaces.
 *
 * @example
 * ```typescript
 * getFootstepForBiome('forest') // → ['Footsteps_Walk_Grass_Mono_03.wav', ...]
 * getFootstepForBiome('tundra') // → ['Footsteps_Snow_Walk_02.wav', ...]
 * getTerrainCategory('cave') // → 'gravel'
 * ```
 */

/**
 * Generic fallback footstep sounds (used when biome is unknown or null).
 * Contains 20 generic stepping/rustling sounds for varied audio.
 */
const FOOTSTEP_SOUNDS_GENERIC = [
    'steping_sounds/rustle01.flac',
    'steping_sounds/rustle02.flac',
    'steping_sounds/rustle03.flac',
    'steping_sounds/rustle04.flac',
    'steping_sounds/rustle05.flac',
    'steping_sounds/rustle06.flac',
    'steping_sounds/rustle07.flac',
    'steping_sounds/rustle08.flac',
    'steping_sounds/rustle09.flac',
    'steping_sounds/rustle10.flac',
    'steping_sounds/rustle11.flac',
    'steping_sounds/rustle12.flac',
    'steping_sounds/rustle13.flac',
    'steping_sounds/rustle14.flac',
    'steping_sounds/rustle15.flac',
    'steping_sounds/rustle16.flac',
    'steping_sounds/rustle17.flac',
    'steping_sounds/rustle18.flac',
    'steping_sounds/rustle19.flac',
    'steping_sounds/rustle20.flac',
];

/**
 * Grass terrain footsteps (forest, grassland, jungle, mushroom_forest, etc).
 * Imported at runtime from assets.ts to keep file organization clean.
 * Lazy-loaded to avoid circular dependencies.
 */
let cachedGrassSteps: string[] = FOOTSTEP_SOUNDS_GENERIC;
let cachedSnowSteps: string[] = FOOTSTEP_SOUNDS_GENERIC;
let cachedGravelSteps: string[] = FOOTSTEP_SOUNDS_GENERIC;
let cachedWoodSteps: string[] = FOOTSTEP_SOUNDS_GENERIC;
let isInitialized = false;

/**
 * Initialize cache once by lazy-loading biome footstep arrays from assets module.
 * Avoids circular dependency issues by delaying import.
 */
function initializeCache(): void {
    if (isInitialized) return;

    try {
        const {
            FOOTSTEP_BIOME_GRASS_SFX,
            FOOTSTEP_BIOME_SNOW_SFX,
            FOOTSTEP_BIOME_GRAVEL_SFX,
            FOOTSTEP_BIOME_WOOD_SFX,
        } = require('./assets');

        if (FOOTSTEP_BIOME_GRASS_SFX && FOOTSTEP_BIOME_GRASS_SFX.length > 0) {
            cachedGrassSteps = FOOTSTEP_BIOME_GRASS_SFX;
        }
        if (FOOTSTEP_BIOME_SNOW_SFX && FOOTSTEP_BIOME_SNOW_SFX.length > 0) {
            cachedSnowSteps = FOOTSTEP_BIOME_SNOW_SFX;
        }
        if (FOOTSTEP_BIOME_GRAVEL_SFX && FOOTSTEP_BIOME_GRAVEL_SFX.length > 0) {
            cachedGravelSteps = FOOTSTEP_BIOME_GRAVEL_SFX;
        }
        if (FOOTSTEP_BIOME_WOOD_SFX && FOOTSTEP_BIOME_WOOD_SFX.length > 0) {
            cachedWoodSteps = FOOTSTEP_BIOME_WOOD_SFX;
        }
    } catch {
        // Fallback to generic if import fails
        cachedGrassSteps = FOOTSTEP_SOUNDS_GENERIC;
        cachedSnowSteps = FOOTSTEP_SOUNDS_GENERIC;
        cachedGravelSteps = FOOTSTEP_SOUNDS_GENERIC;
        cachedWoodSteps = FOOTSTEP_SOUNDS_GENERIC;
    }

    isInitialized = true;
}

/**
 * Get grass footstep sounds (lazy-initialized).
 */
function getGrassSteps(): string[] {
    initializeCache();
    return cachedGrassSteps;
}

/**
 * Get snow footstep sounds (lazy-initialized).
 */
function getSnowSteps(): string[] {
    initializeCache();
    return cachedSnowSteps;
}

/**
 * Get gravel footstep sounds (lazy-initialized).
 */
function getGravelSteps(): string[] {
    initializeCache();
    return cachedGravelSteps;
}

/**
 * Get wood footstep sounds (lazy-initialized).
 */
function getWoodSteps(): string[] {
    initializeCache();
    return cachedWoodSteps;
}

/**
 * Maps all game biomes to their terrain audio category.
 * Terrain category determines which footstep sounds are used.
 *
 * Mapping Logic:
 * - 'grass' → Forest, grasslands, jungle, lush biomes
 * - 'snow' → Tundra, cold environments
 * - 'gravel' → Rocky, desert, volcanic, cave environments
 * - 'wood' → Built structures, wooden outposts, city
 *
 * Tech biomes (space_station, underwater, city) use gravel as fallback for now.
 */
const BIOME_TERRAIN_MAP: Record<string, 'grass' | 'snow' | 'gravel' | 'wood'> = {
    // Lush/green biomes → Grass footsteps
    'forest': 'grass',
    'grassland': 'grass',
    'jungle': 'grass',
    'mushroom_forest': 'grass',
    'swamp': 'grass', // Muddy/grassy

    // Cold biomes → Snow footsteps
    'tundra': 'snow',

    // Rocky/harsh biomes → Gravel footsteps
    'cave': 'gravel',
    'mountain': 'gravel',
    'desert': 'gravel',
    'volcanic': 'gravel',
    'mesa': 'gravel',
    'beach': 'gravel', // Sandy/rocky

    // Built/wooden structures → Wood footsteps
    'wall': 'wood',
    'floptropica': 'wood',

    // Tech/special biomes → Gravel fallback
    'ocean': 'gravel',
    'city': 'gravel',
    'space_station': 'gravel',
    'underwater': 'gravel',
};

/**
 * Gets the terrain category for a given biome.
 * Determines which footstep sound pool to use (grass, snow, gravel, or wood).
 *
 * @param biome - Biome name (e.g., 'forest', 'tundra', 'cave')
 * @returns Terrain category ('grass' | 'snow' | 'gravel' | 'wood') or undefined if unknown
 *
 * @example
 * ```typescript
 * getTerrainCategory('forest') // → 'grass'
 * getTerrainCategory('tundra') // → 'snow'
 * getTerrainCategory('cave') // → 'gravel'
 * getTerrainCategory('unknown') // → undefined
 * ```
 */
export function getTerrainCategory(
    biome?: string | null
): 'grass' | 'snow' | 'gravel' | 'wood' | undefined {
    if (!biome) return undefined;

    // Direct lookup in biome terrain map
    const terrain = BIOME_TERRAIN_MAP[biome];
    if (terrain) return terrain;

    // Case-insensitive fallback
    const lowerBiome = String(biome).toLowerCase();
    return BIOME_TERRAIN_MAP[lowerBiome];
}

/**
 * Selects 3 random footstep sounds based on the biome's terrain category.
 * Provides natural audio variation and biome-specific audio feedback.
 * Falls back to generic rustles if biome is unknown.
 *
 * @param biome - Biome parameter (e.g., 'forest', 'cave', 'tundra')
 * @returns Array of 3 random footstep sound filenames from the biome's category
 *
 * @example
 * ```typescript
 * getFootstepForBiome() // → Generic rustles (biome unknown)
 * getFootstepForBiome('forest') // → ['Footsteps_Walk_Grass_Mono_03.wav', ...]
 * getFootstepForBiome('tundra') // → ['Footsteps_Snow_Walk_02.wav', ...]
 * ```
 */
export function getFootstepForBiome(biome?: string | null): string[] {
    const selected: string[] = [];

    // Determine terrain category from biome
    const terrainCategory = getTerrainCategory(biome);

    // Select the appropriate footstep array for this terrain
    let footstepPool: string[];
    switch (terrainCategory) {
        case 'grass':
            footstepPool = getGrassSteps();
            break;
        case 'snow':
            footstepPool = getSnowSteps();
            break;
        case 'gravel':
            footstepPool = getGravelSteps();
            break;
        case 'wood':
            footstepPool = getWoodSteps();
            break;
        default:
            footstepPool = FOOTSTEP_SOUNDS_GENERIC;
            break;
    }

    // Select 3 random footsteps from the pool (with possible repeats for simplicity)
    for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * footstepPool.length);
        selected.push(footstepPool[randomIndex]);
    }

    return selected;
}

/**
 * Returns all available footstep sounds (for documentation or UI purposes).
 * Includes generic fallback sounds.
 *
 * @returns Array of all registered footstep sound filenames
 */
export function getRegisteredBiomes(): string[] {
    return FOOTSTEP_SOUNDS_GENERIC;
}
