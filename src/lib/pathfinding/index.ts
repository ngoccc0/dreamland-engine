/**
 * Pathfinding Module
 *
 * @remarks
 * Reusable A* pathfinding algorithm for creatures and NPCs.
 * Optimized for grid-based world with tile costs.
 * Can be used by creatures for navigation, predators hunting, herbivores seeking food, etc.
 */

/**
 * Represents a node in the A* pathfinding grid.
 */
interface PathNode {
    x: number;
    y: number;
    gScore: number; // Cost from start
    hScore: number; // Heuristic estimate to goal
    fScore: number; // gScore + hScore
    parent?: PathNode;
}

/**
 * Configuration for pathfinding behavior.
 */
export interface PathfindingOptions {
    /** Maximum range to search (cells). Prevents infinite searches. */
    maxRange: number;

    /** Cost multiplier for terrain (default 1.0) */
    terrainCost?: (x: number, y: number) => number;

    /** Return false to block a tile. Default allows all. */
    isWalkable?: (x: number, y: number) => boolean;

    /** Diagonal movement allowed? Default true. */
    allowDiagonal?: boolean;

    /** If true, stop at first step toward goal even if can't reach. */
    approximateIfNeeded?: boolean;
}

/**
 * Heuristic: Manhattan distance (fast, works well for grid).
 */
function heuristic(x1: number, y1: number, x2: number, y2: number): number {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/**
 * Find path using A* algorithm.
 *
 * @remarks
 * Returns array of waypoints from start to goal.
 * If approximateIfNeeded is true, returns best-effort path even if goal unreachable.
 * If no path found and approximateIfNeeded is false, returns empty array.
 *
 * @param startX Start position X
 * @param startY Start position Y
 * @param goalX Goal position X
 * @param goalY Goal position Y
 * @param options Pathfinding configuration
 * @returns Array of [x, y] waypoints, or empty if no path
 */
export function findPath(
    startX: number,
    startY: number,
    goalX: number,
    goalY: number,
    options: PathfindingOptions
): Array<[number, number]> {
    const {
        maxRange,
        terrainCost = () => 1,
        isWalkable = () => true,
        allowDiagonal = true,
        approximateIfNeeded = true,
    } = options;

    // Early exit if start == goal
    if (startX === goalX && startY === goalY) return [];

    // Early exit if goal unreachable distance-wise
    if (heuristic(startX, startY, goalX, goalY) > maxRange) {
        if (approximateIfNeeded) {
            return findApproximatePath(startX, startY, goalX, goalY, options);
        }
        return [];
    }

    const openSet = new Map<string, PathNode>();
    const closedSet = new Set<string>();
    const startNode: PathNode = {
        x: startX,
        y: startY,
        gScore: 0,
        hScore: heuristic(startX, startY, goalX, goalY),
        fScore: heuristic(startX, startY, goalX, goalY),
    };

    openSet.set(`${startX},${startY}`, startNode);

    while (openSet.size > 0) {
        // Find node with lowest fScore
        let current: PathNode | null = null;
        let currentKey = '';
        for (const [key, node] of openSet) {
            if (!current || node.fScore < current.fScore) {
                current = node;
                currentKey = key;
            }
        }

        if (!current) break;

        // Goal reached
        if (current.x === goalX && current.y === goalY) {
            return reconstructPath(current);
        }

        openSet.delete(currentKey);
        closedSet.add(currentKey);

        // Explore neighbors
        const neighbors = getNeighbors(current.x, current.y, allowDiagonal);
        for (const [nx, ny] of neighbors) {
            const neighborKey = `${nx},${ny}`;

            // Skip if in closed set or not walkable
            if (closedSet.has(neighborKey) || !isWalkable(nx, ny)) continue;

            const moveCost = heuristic(current.x, current.y, nx, ny); // 1 or sqrt(2)
            const terrainCostValue = terrainCost(nx, ny);
            const tentativeGScore = current.gScore + moveCost * terrainCostValue;

            // Skip if we've seen this node with better score
            const neighbor = openSet.get(neighborKey);
            if (neighbor && tentativeGScore >= neighbor.gScore) continue;

            // Update or add neighbor
            const newNeighbor: PathNode = {
                x: nx,
                y: ny,
                gScore: tentativeGScore,
                hScore: heuristic(nx, ny, goalX, goalY),
                fScore: 0,
                parent: current,
            };
            newNeighbor.fScore = newNeighbor.gScore + newNeighbor.hScore;
            openSet.set(neighborKey, newNeighbor);
        }
    }

    // No path found
    if (approximateIfNeeded) {
        return findApproximatePath(startX, startY, goalX, goalY, options);
    }
    return [];
}

/**
 * Find best-effort path when exact path is unreachable.
 *
 * @remarks
 * Returns path to closest reachable point toward goal.
 * Used when goal is too far or blocked.
 */
function findApproximatePath(
    startX: number,
    startY: number,
    goalX: number,
    goalY: number,
    options: PathfindingOptions
): Array<[number, number]> {
    const { allowDiagonal = true, isWalkable = () => true } = options;

    // Get direction toward goal
    const dx = Math.sign(goalX - startX);
    const dy = Math.sign(goalY - startY);

    // Try to step in that direction
    // Prefer diagonal if allowed
    if (allowDiagonal && dx !== 0 && dy !== 0) {
        const diagonalX = startX + dx;
        const diagonalY = startY + dy;
        if (isWalkable(diagonalX, diagonalY)) {
            return [[diagonalX, diagonalY]];
        }
    }

    // Try cardinal directions
    if (dx !== 0 && isWalkable(startX + dx, startY)) {
        return [[startX + dx, startY]];
    }
    if (dy !== 0 && isWalkable(startX, startY + dy)) {
        return [[startX, startY + dy]];
    }

    // No movement possible
    return [];
}

/**
 * Get neighbors of a cell (4 or 8 directions).
 */
function getNeighbors(x: number, y: number, allowDiagonal: boolean): Array<[number, number]> {
    const neighbors: Array<[number, number]> = [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
    ];

    if (allowDiagonal) {
        neighbors.push([x + 1, y + 1], [x + 1, y - 1], [x - 1, y + 1], [x - 1, y - 1]);
    }

    return neighbors;
}

/**
 * Reconstruct path from goal node back to start.
 */
function reconstructPath(node: PathNode): Array<[number, number]> {
    const path: Array<[number, number]> = [];
    let current: PathNode | undefined = node;

    while (current) {
        path.unshift([current.x, current.y]);
        current = current.parent;
    }

    return path;
}

/**
 * Find nearby positions within range (flood fill).
 *
 * @remarks
 * Useful for finding food, pack members, or threats within range.
 * Returns all walkable cells within distance.
 *
 * @param startX Starting X position
 * @param startY Starting Y position
 * @param range Maximum distance (cells)
 * @param options Pathfinding config
 * @returns Array of reachable [x, y] positions
 */
export function findNearbyPositions(
    startX: number,
    startY: number,
    range: number,
    options: Partial<PathfindingOptions> = {}
): Array<[number, number]> {
    const { isWalkable = () => true, allowDiagonal = true } = options;

    const visited = new Set<string>();
    const queue: Array<[number, number, number]> = [[startX, startY, 0]];
    const result: Array<[number, number]> = [];

    while (queue.length > 0) {
        const [x, y, dist] = queue.shift()!;
        const key = `${x},${y}`;

        if (visited.has(key)) continue;
        visited.add(key);

        if (dist > 0) result.push([x, y]); // Don't include start position
        if (dist >= range) continue;

        const neighbors = getNeighbors(x, y, allowDiagonal);
        for (const [nx, ny] of neighbors) {
            const nKey = `${nx},${ny}`;
            if (!visited.has(nKey) && isWalkable(nx, ny)) {
                queue.push([nx, ny, dist + 1]);
            }
        }
    }

    return result;
}
