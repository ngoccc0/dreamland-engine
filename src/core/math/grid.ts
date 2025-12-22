/**
 * Grid Math Utilities - Centralized Grid Calculations
 *
 * @remarks
 * **Purpose:**
 * - Single source of truth for all grid-based math
 * - Prevents duplication between UI (minimap) and core (engine)
 * - Pure functions, fully testable without React
 *
 * **Pattern:**
 * All functions are pure (no side effects).
 * Hooks wrap these with useMemo for React integration.
 *
 * **Coverage:**
 * Grid coordinate calculations, distance metrics, visibility bounds, chunk positioning.
 */

/**
 * Grid position with x, y coordinates
 */
export interface GridPos {
    x: number;
    y: number;
}

/**
 * Visible tile data for rendering
 */
export interface VisibleTile {
    x: number;
    y: number;
    chunkX: number;
    chunkY: number;
    isExplored: boolean;
    type: 'terrain' | 'water' | 'mountain' | 'resource' | 'creature' | 'unknown';
}

/**
 * Calculate Manhattan distance between two positions.
 *
 * @remarks
 * Manhattan distance = |x1 - x2| + |y1 - y2|
 * Used for movement cost, visibility range, etc.
 *
 * @param from - Starting position
 * @param to - Ending position
 * @returns Manhattan distance
 */
export function manhattanDistance(from: GridPos, to: GridPos): number {
    return Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
}

/**
 * Calculate Chebyshev distance (chessboard distance) between two positions.
 *
 * @remarks
 * Chebyshev distance = max(|x1 - x2|, |y1 - y2|)
 * Used for visibility squares, square ranges, etc.
 *
 * @param from - Starting position
 * @param to - Ending position
 * @returns Chebyshev distance
 */
export function chebyshevDistance(from: GridPos, to: GridPos): number {
    return Math.max(Math.abs(from.x - to.x), Math.abs(from.y - to.y));
}

/**
 * Calculate Euclidean distance between two positions.
 *
 * @remarks
 * Euclidean distance = sqrt((x1-x2)^2 + (y1-y2)^2)
 * Used for circular visibility, ranged attacks, etc.
 *
 * @param from - Starting position
 * @param to - Ending position
 * @returns Euclidean distance
 */
export function euclideanDistance(from: GridPos, to: GridPos): number {
    const dx = from.x - to.x;
    const dy = from.y - to.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if position is within bounds.
 *
 * @remarks
 * Pure bounds check for grid validation.
 *
 * @param pos - Position to check
 * @param width - Map width (max x)
 * @param height - Map height (max y)
 * @returns True if position is within bounds
 */
export function isWithinBounds(pos: GridPos, width: number, height: number): boolean {
    return pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height;
}

/**
 * Get all tiles visible from a position within a radius.
 *
 * @remarks
 * Chebyshev distance used for square visibility (common in grid games).
 * Returns sorted array of visible positions.
 *
 * @param from - Center position
 * @param radius - Visibility radius
 * @param width - Map width (for bounds checking)
 * @param height - Map height (for bounds checking)
 * @returns Array of visible tile positions
 */
export function getVisibleTiles(
    from: GridPos,
    radius: number,
    width: number,
    height: number
): GridPos[] {
    const visible: GridPos[] = [];

    for (let x = from.x - radius; x <= from.x + radius; x++) {
        for (let y = from.y - radius; y <= from.y + radius; y++) {
            const pos = { x, y };
            if (isWithinBounds(pos, width, height)) {
                visible.push(pos);
            }
        }
    }

    return visible;
}

/**
 * Calculate visible grid tiles for minimap rendering.
 *
 * @remarks
 * **Algorithm:**
 * 1. Clamp player position to viewable area
 * 2. Calculate top-left corner of visible region
 * 3. Generate grid of tiles within bounds
 * 4. Return as 2D array for rendering
 *
 * @param playerPos - Current player position
 * @param visibleWidth - Number of tiles visible horizontally
 * @param visibleHeight - Number of tiles visible vertically
 * @param mapWidth - Total map width
 * @param mapHeight - Total map height
 * @returns 2D array of visible tiles [row][col]
 */
export function calculateMinimapGrid(
    playerPos: GridPos,
    visibleWidth: number,
    visibleHeight: number,
    mapWidth: number,
    mapHeight: number
): GridPos[][] {
    // Calculate center offset (player is in middle of visible area)
    const offsetX = Math.floor(visibleWidth / 2);
    const offsetY = Math.floor(visibleHeight / 2);

    // Calculate top-left corner of visible region
    const startX = Math.max(0, Math.min(playerPos.x - offsetX, mapWidth - visibleWidth));
    const startY = Math.max(0, Math.min(playerPos.y - offsetY, mapHeight - visibleHeight));

    // Generate grid
    const grid: GridPos[][] = [];
    for (let row = 0; row < visibleHeight; row++) {
        const gridRow: GridPos[] = [];
        for (let col = 0; col < visibleWidth; col++) {
            gridRow.push({
                x: startX + col,
                y: startY + row,
            });
        }
        grid.push(gridRow);
    }

    return grid;
}

/**
 * Convert world coordinates to chunk coordinates.
 *
 * @remarks
 * Chunks are grid tiles in larger world subdivisions.
 * Typically 64x64 world coordinates = 1 chunk.
 *
 * @param worldPos - World position
 * @param chunkSize - Tiles per chunk (default 64)
 * @returns Chunk coordinate
 */
export function worldToChunk(worldPos: GridPos, chunkSize: number = 64): GridPos {
    return {
        x: Math.floor(worldPos.x / chunkSize),
        y: Math.floor(worldPos.y / chunkSize),
    };
}

/**
 * Convert chunk coordinates to world coordinates (top-left corner).
 *
 * @remarks
 * Returns top-left position of the chunk in world space.
 *
 * @param chunkPos - Chunk coordinate
 * @param chunkSize - Tiles per chunk (default 64)
 * @returns World position (top-left of chunk)
 */
export function chunkToWorld(chunkPos: GridPos, chunkSize: number = 64): GridPos {
    return {
        x: chunkPos.x * chunkSize,
        y: chunkPos.y * chunkSize,
    };
}

/**
 * Get neighboring grid positions (4-directional: up, down, left, right).
 *
 * @remarks
 * Used for pathfinding, adjacency checks, etc.
 * Does not bounds-check; caller should filter.
 *
 * @param pos - Center position
 * @returns Array of 4 neighboring positions
 */
export function getNeighbors4(pos: GridPos): GridPos[] {
    return [
        { x: pos.x, y: pos.y - 1 }, // up
        { x: pos.x, y: pos.y + 1 }, // down
        { x: pos.x - 1, y: pos.y }, // left
        { x: pos.x + 1, y: pos.y }, // right
    ];
}

/**
 * Get neighboring grid positions (8-directional: includes diagonals).
 *
 * @remarks
 * Used for visibility checks, adjacency checks, etc.
 * Does not bounds-check; caller should filter.
 *
 * @param pos - Center position
 * @returns Array of 8 neighboring positions
 */
export function getNeighbors8(pos: GridPos): GridPos[] {
    return [
        { x: pos.x, y: pos.y - 1 },     // up
        { x: pos.x, y: pos.y + 1 },     // down
        { x: pos.x - 1, y: pos.y },     // left
        { x: pos.x + 1, y: pos.y },     // right
        { x: pos.x - 1, y: pos.y - 1 }, // up-left
        { x: pos.x + 1, y: pos.y - 1 }, // up-right
        { x: pos.x - 1, y: pos.y + 1 }, // down-left
        { x: pos.x + 1, y: pos.y + 1 }, // down-right
    ];
}

/**
 * Check if two positions are adjacent (4-directional).
 *
 * @param pos1 - First position
 * @param pos2 - Second position
 * @returns True if adjacent
 */
export function isAdjacent4(pos1: GridPos, pos2: GridPos): boolean {
    return manhattanDistance(pos1, pos2) === 1;
}

/**
 * Check if two positions are adjacent (8-directional, including diagonals).
 *
 * @param pos1 - First position
 * @param pos2 - Second position
 * @returns True if adjacent
 */
export function isAdjacent8(pos1: GridPos, pos2: GridPos): boolean {
    return chebyshevDistance(pos1, pos2) === 1;
}
