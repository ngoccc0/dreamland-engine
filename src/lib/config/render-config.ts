/**
 * Rendering & Camera Configuration
 *
 * @remarks
 * Defines view radius, chunk rendering, and visibility calculation parameters.
 * Affects both performance and gameplay visibility/fog of war mechanics.
 *
 * TODO: Add difficulty-based view radius adjustments
 * TODO: Add performance profiles (low/medium/high detail)
 */

/**
 * Rendering and visibility configuration
 *
 * @remarks
 * View radius directly impacts performance (O(R²) complexity).
 * Larger radius = more chunks loaded = more computation.
 */
export const renderConfig = {
    /**
     * Initial chunk generation radius on game start
     * @remarks Player sees this many chunks in each direction
     */
    initialChunkRadius: 7,

    /**
     * Default view radius for player visibility
     * @remarks How many tiles player can see in each direction
     */
    defaultViewRadius: 5,

    /**
     * Minimum view radius
     * @remarks Cannot be configured lower than this
     */
    minViewRadius: 3,

    /**
     * Maximum view radius
     * @remarks Limits performance impact on mobile devices
     */
    maxViewRadius: 15,

    /**
     * Fog of war visibility threshold on minimap
     * @remarks Tiles beyond this distance show as fog
     */
    minimapFogOfWarThreshold: 3,

    /**
     * Fog of war visibility threshold on full map
     * @remarks Tiles beyond this distance show as fog
     */
    fullMapFogOfWarThreshold: 15,

    /**
     * Chunk update optimization
     * @remarks Cache visible chunks to avoid recalculating every frame
     */
    cacheVisibleChunks: true,

    /**
     * Chunk cache update interval (game ticks)
     * @remarks Recalculate visible chunks every N ticks
     */
    chunkCacheUpdateInterval: 1,

    /**
     * Render distance scaling with device capability
     * @remarks Multiplier based on device performance (0.5-1.5)
     */
    deviceScalingFactor: 1.0,

    /**
     * Performance optimization: chunk LOD (Level of Detail)
     * @remarks Reduce detail on far chunks to improve performance
     */
    enableChunkLOD: false,

    /**
     * World boundary checks
     * @remarks Enable hard boundary preventing exploration beyond limits
     */
    enableWorldBoundary: false,

    /**
     * World size (in chunks)
     * @remarks Maximum explorable world dimensions
     */
    worldSizeChunks: 100,
} as const;

/**
 * Export type for TypeScript consumers
 */
export type RenderConfig = typeof renderConfig;
