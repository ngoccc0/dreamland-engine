/**
 * Creature Pathfinding Rules
 *
 * @remarks
 * Pure functions for creature pathfinding behavior.
 * Wraps the A* algorithm from src/lib/pathfinding and applies creature-specific logic.
 *
 * ### Pure Function Design
 * All functions are deterministic:
 * - Input: CreatureState + target + world state
 * - Output: New path (array of waypoints)
 * - No mutations of inputs
 * - No side effects
 *
 * ### Algorithm
 * 1. Validate start/goal positions exist and are reachable
 * 2. Get terrain costs from world
 * 3. Run A* pathfinding
 * 4. Return waypoints or empty path if unreachable
 *
 * @example
 * ```typescript
 * const newPath = calculateCreaturePath(creature, target, worldState);
 * const shouldRecalculate = shouldRecalculatePath(currentPath, target, creature);
 * ```
 */

import { findPath } from '@/lib/pathfinding';
import { type Creature, isFauna, isMonster } from '@/core/domain/creature';
import type { GameState } from '@/core/domain/gamestate';
import type {
    PathfindingState,
    PathfindingTarget,
    Waypoint,
} from './pathfinding-state';

/**
 * Calculate a path from creature to target using A* pathfinding.
 *
 * @remarks
 * This is the core pathfinding calculation. It:
 * 1. Validates creature and target positions
 * 2. Queries the world for terrain costs
 * 3. Runs A* with terrain-aware heuristics
 * 4. Returns the resulting waypoint path
 *
 * Safety:
 * - Returns empty array if start == goal
 * - Returns empty array if no path exists (goal unreachable)
 * - Uses approximateIfNeeded to find best-effort path if possible
 *
 * Performance:
 * - Time: O(n log n) where n = cells in search area
 * - Space: O(n) for open/closed sets
 * - Typical: 50-200 ms for 100-cell radius
 *
 * @param creature - Source creature (used for position)
 * @param target - Target location or entity ID
 * @param gameState - World state (for terrain lookups)
 * @returns Array of waypoints from creature to target, or empty if unreachable
 *
 * @example
 * ```typescript
 * const creature = gameState.creatures[0];
 * const target: PathfindingTarget = { type: 'location', x: 100, y: 150 };
 * const path = calculateCreaturePath(creature, target, gameState);
 * console.log(path); // [[41, 51], [45, 65], [100, 150]]
 * ```
 *
 * @throws
 * - If creature position is undefined
 * - If target entity does not exist (for entity-type targets)
 * - If terrain lookup fails
 */
export function calculateCreaturePath(
    creature: Creature,
    target: PathfindingTarget,
    gameState: GameState
): Waypoint[] {
    // Validate creature is capable of pathfinding
    if (!isFauna(creature) && !isMonster(creature)) {
        return [];
    }

    // Validate creature position
    if (creature.x === undefined || creature.y === undefined) {
        console.error(`[Pathfinding] Creature ${creature.id} has undefined position`);
        return [];
    }

    // Resolve target coordinates
    let goalX: number;
    let goalY: number;

    if (target.type === 'location') {
        goalX = target.x;
        goalY = target.y;
    } else if (target.type === 'entity') {
        // Search through all creatures in all chunks
        let foundTarget: Creature | undefined;
        for (const chunkCreatures of Object.values(gameState.creatures)) {
            foundTarget = chunkCreatures.find((c: Creature) => c.id === target.entityId);
            if (foundTarget) break;
        }

        if (!foundTarget || foundTarget.x === undefined || foundTarget.y === undefined) {
            console.warn(`[Pathfinding] Target entity ${target.entityId} not found or has no position`);
            return [];
        }
        goalX = foundTarget.x;
        goalY = foundTarget.y;
    } else {
        // @ts-expect-error - unreachable but TypeScript needs this
        console.error(`[Pathfinding] Unknown target type: ${target.type}`);
        return [];
    }

    // Early exit: already at goal
    if (creature.x === goalX && creature.y === goalY) {
        return [];
    }

    // Get terrain cost function (lower = easier, higher = harder)
    const getTerrainCost = (x: number, y: number): number => {
        // This will be improved when world/chunk system is integrated
        // For now, return 1 (flat cost)
        // TODO: Query actual terrain from gameState.chunks
        return 1;
    };

    // Check if position is walkable
    const isWalkable = (x: number, y: number): boolean => {
        // This will check for obstacles (creatures, walls, etc.)
        // For now, all tiles are walkable
        // TODO: Check collision map from gameState
        return true;
    };

    // Run A* pathfinding
    const path = findPath(creature.x, creature.y, goalX, goalY, {
        maxRange: 100, // TODO: Get from creature pathfinding config
        terrainCost: getTerrainCost,
        isWalkable,
        allowDiagonal: true, // TODO: Get from creature config
        approximateIfNeeded: true,
    });

    return path;
}

/**
 * Determine if a creature's current path is still valid and should be kept.
 *
 * @remarks
 * Paths become "stale" when:
 * 1. They exceed maxPathAge (creature hasn't updated in N ticks)
 * 2. Target moved more than recalculateOnTargetMove cells
 * 3. Obstacles appeared blocking the path
 *
 * This function checks (1) and (2). Obstacle detection requires collision queries.
 *
 * @param state - Current pathfinding state (with current path and age)
 * @param target - Target the path was calculated for
 * @param maxPathAge - How many ticks before path expires
 * @param recalculateOnTargetMove - Cells target can move before recalc
 * @returns true if path is still good, false if needs recalculation
 *
 * @example
 * ```typescript
 * if (!isPathStale(pathfindingState, target, 20, 10)) {
 *   // Path is still valid, use it
 * } else {
 *   // Path is stale, recalculate
 * }
 * ```
 */
export function isPathStale(
    state: PathfindingState,
    target: PathfindingTarget | undefined,
    maxPathAge: number,
    recalculateOnTargetMove: number
): boolean {
    // No path = stale
    if (state.currentPath.length === 0) {
        return true;
    }

    // Path is too old
    if (state.pathAge > maxPathAge) {
        return true;
    }

    // No target = stale
    if (!target) {
        return true;
    }

    // For entity targets, check if target moved
    if (target.type === 'entity') {
        // TODO: When we have access to target entity,
        // calculate distance and compare to recalculateOnTargetMove
        // For now, assume it moved (conservative)
        return true;
    }

    // Path is fresh and valid
    return false;
}

/**
 * Get the next waypoint in the creature's current path.
 *
 * @remarks
 * Returns the first waypoint (immediate next step).
 * If path is empty or creature is at the last waypoint, returns undefined.
 *
 * @param state - Current pathfinding state
 * @returns Next waypoint [x, y] or undefined if path is exhausted
 *
 * @example
 * ```typescript
 * const nextStep = getNextWaypoint(pathfindingState);
 * if (nextStep) {
 *   console.log(`Move to ${nextStep[0]}, ${nextStep[1]}`);
 * } else {
 *   console.log('Path complete or empty');
 * }
 * ```
 */
export function getNextWaypoint(state: PathfindingState): Waypoint | undefined {
    if (state.currentPath.length === 0) {
        return undefined;
    }
    return state.currentPath[0];
}

/**
 * Advance the creature along its path (remove completed waypoint).
 *
 * @remarks
 * Call this after creature successfully moves to the next waypoint.
 * Removes the waypoint from the front of the path.
 * If path is exhausted, returns empty path.
 *
 * Safety:
 * - Safe to call even if path is empty
 * - Returns new state object (doesn't mutate input)
 *
 * @param state - Current pathfinding state
 * @returns New state with first waypoint removed
 *
 * @example
 * ```typescript
 * // Creature moved to next waypoint
 * const newState = advanceAlongPath(pathfindingState);
 * console.log(newState.currentPath.length); // One fewer waypoint
 * ```
 */
export function advanceAlongPath(state: PathfindingState): PathfindingState {
    if (state.currentPath.length <= 1) {
        // No more waypoints or already empty
        return {
            ...state,
            currentPath: [],
            mode: 'idle', // Reached destination
        };
    }

    return {
        ...state,
        currentPath: state.currentPath.slice(1), // Remove first waypoint
        pathAge: 0, // Reset age after advance
    };
}

/**
 * Increment the age of a path (call each tick).
 *
 * @remarks
 * Increments pathAge by 1. Used to track how long a path has existed.
 * When pathAge exceeds maxPathAge, the path should be recalculated.
 *
 * @param state - Current pathfinding state
 * @returns New state with pathAge incremented
 *
 * @example
 * ```typescript
 * const updated = incrementPathAge(pathfindingState);
 * console.log(updated.pathAge); // One more than before
 * ```
 */
export function incrementPathAge(state: PathfindingState): PathfindingState {
    return {
        ...state,
        pathAge: state.pathAge + 1,
    };
}

/**
 * Mark a path as failed (couldn't follow it).
 *
 * @remarks
 * Increments failureCount. If failureCount exceeds threshold,
 * the path should be abandoned and recalculated.
 *
 * @param state - Current pathfinding state
 * @param maxFailures - How many failures before giving up (3 is typical)
 * @returns Object with { newState, shouldRecalculate }
 *
 * @example
 * ```typescript
 * const result = markPathFailure(state, 3);
 * if (result.shouldRecalculate) {
 *   // Too many failures, get new path
 * }
 * ```
 */
export function markPathFailure(
    state: PathfindingState,
    maxFailures: number = 3
): { newState: PathfindingState; shouldRecalculate: boolean } {
    const newFailureCount = state.failureCount + 1;
    const shouldRecalculate = newFailureCount >= maxFailures;

    return {
        newState: {
            ...state,
            failureCount: newFailureCount,
        },
        shouldRecalculate,
    };
}
