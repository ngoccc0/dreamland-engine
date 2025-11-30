/**
 * @overview
 * Provides random footstep sound selection from a pool of 20+ stepping sounds.
 * Returns 3 random footsteps per action for natural audio variation.
 */

/**
 * Pool of footstep sounds available for random selection.
 * Contains 20+ generic stepping/rustling sounds for varied audio.
 */
const FOOTSTEP_SOUNDS = [
    'rustle01.flac',
    'rustle02.flac',
    'rustle03.flac',
    'rustle04.flac',
    'rustle05.flac',
    'rustle06.flac',
    'rustle07.flac',
    'rustle08.flac',
    'rustle09.flac',
    'rustle10.flac',
    'rustle11.flac',
    'rustle12.flac',
    'rustle13.flac',
    'rustle14.flac',
    'rustle15.flac',
    'rustle16.flac',
    'rustle17.flac',
    'rustle18.flac',
    'rustle19.flac',
    'rustle20.flac',
];

/**
 * Selects 3 random footstep sounds from the available pool.
 * Provides natural audio variation by returning a different set each time.
 *
 * @param biome - Biome parameter (currently unused; reserved for future tech-themed biome support)
 * @returns Array of 3 random footstep sound filenames
 *
 * @example
 * ```typescript
 * getFootstepForBiome() // → ['rustle03.flac', 'rustle15.flac', 'rustle08.flac']
 * getFootstepForBiome('forest') // → ['rustle07.flac', 'rustle02.flac', 'rustle19.flac']
 * ```
 */
export function getFootstepForBiome(biome?: string | null): string[] {
    const selected: string[] = [];

    // Select 3 random footsteps (with possible repeats for simplicity)
    for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * FOOTSTEP_SOUNDS.length);
        selected.push(FOOTSTEP_SOUNDS[randomIndex]);
    }

    return selected;
}

/**
 * Returns all available footstep sounds (for documentation or UI purposes).
 *
 * @returns Array of all footstep sound filenames
 */
export function getRegisteredBiomes(): string[] {
    return FOOTSTEP_SOUNDS;
}

/**
 * Gets the terrain category for a given biome.
 * Currently unused; reserved for future tech-themed biome audio.
 *
 * @param biome - Biome name
 * @returns 'generic' for all biomes (placeholder for future expansion)
 */
export function getTerrainCategory(
    biome?: string | null
): string | undefined {
    // Reserved for future use when tech-themed biome audio is implemented
    return 'generic';
}
