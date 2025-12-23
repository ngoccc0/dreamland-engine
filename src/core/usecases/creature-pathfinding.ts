/**
 * Creature Pathfinding Orchestration Usecase
 *
 * @remarks
 * High-level orchestration for creature pathfinding behavior.
 * Combines pathfinding rules with game loop integration.
 *
 * This usecase handles:
 * 1. Deciding when to calculate paths
 * 2. Updating path age each tick
 * 3. Handling path failures and recalculation
 * 4. Returning state changes to the engine
 *
 * ### Design
 * - Pure function: Input state + target → Output new state + effects
 * - Stateless: No side effects or mutations
 * - Event-based: Returns effects for the engine to apply
 *
 * @example
 * ```typescript
 * const { newCreature, effects } = updateCreaturePathfinding(
 *   creature,
 *   { type: 'location', x: 100, y: 150 },
 *   gameState,
 *   { maxRange: 60, ... }
 * );
 * ```
 */

import { type Creature, isFauna, isMonster } from '@/core/domain/creature';
import type { GameState } from '@/core/domain/gamestate';
import type {
    PathfindingTarget,
    PathfindingConfig,
    PathfindingState,
} from '@/core/rules/creature/pathfinding-state';
import {
    calculateCreaturePath,
    isPathStale,
    getNextWaypoint,
    incrementPathAge,
    markPathFailure,
} from '@/core/rules/creature/pathfinding';

/** Generic effect type for logging/messaging */
type GameEffect = {
    type: 'log' | 'message' | string;
    message?: string;
    [key: string]: any;
};

/**
 * Result of updating creature pathfinding state.
 *
 * @remarks
 * Returned by updateCreaturePathfinding().
 * Contains the updated creature and any effects to apply.
 */
export interface CreaturePathfindingResult {
    /** Updated creature with new pathfinding state */
    newCreature: Creature;

    /** Effects to apply (logging, messages, etc.) */
    effects: GameEffect[];
}

/**
 * Configuration for the pathfinding system
 */
export interface PathfindingSystemConfig {
    /** Whether to enable pathfinding for all creatures (debug flag) */
    enabled: boolean;
    /** Default config for creatures that don't satisfy specific conditions */
    defaultConfig: PathfindingConfig;
}

/**
 * Helper to get pathfinding config for a specific creature
 */
export function getPathfindingConfigForCreature(creature: Creature): PathfindingConfig {
    // Default config
    const config: PathfindingConfig = {
        maxRange: 50,
        allowDiagonal: true,
        terrainCostMultiplier: 1.0,
        maxPathAge: 20,
        recalculateOnTargetMove: 5,
    };

    if (isFauna(creature)) {
        config.maxRange = creature.roamRange;
    } else if (isMonster(creature)) {
        config.maxRange = creature.patrolRange;
    }

    return config;
}

/**
 * Update a creature's pathfinding state for one tick.
 *
 * @remarks
 * This is the main orchestration function for creature pathfinding.
 *
 * Algorithm:
 * 1. Check if current path is stale
 * 2. If stale, calculate new path using A*
 * 3. Increment path age
 * 4. Return updated creature + effects
 *
 * Pure function: No mutations, no side effects.
 *
 * @param creature - Creature to update
 * @param target - Where creature is trying to go
 * @param gameState - Current world state (for terrain lookups)
 * @param config - Pathfinding configuration for this creature
 * @returns Updated creature and effects
 *
 * @example
 * ```typescript
 * const deer = gameState.creatures[0];
 * const target: PathfindingTarget = { type: 'location', x: 100, y: 150 };
 * const config: PathfindingConfig = {
 *   maxRange: 60,
 *   allowDiagonal: true,
 *   terrainCostMultiplier: 1.5,
 *   maxPathAge: 20,
 *   recalculateOnTargetMove: 15,
 * };
 *
 * const { newCreature } = updateCreaturePathfinding(deer, target, gameState, config);
 * console.log(newCreature.pathfinding?.state.currentPath);
 * ```
 *
 * @throws
 * - If creature lacks pathfinding capability
 * - If target entity doesn't exist (for entity-type targets)
 */
export function updateCreaturePathfinding(
    creature: Creature,
    target: PathfindingTarget,
    gameState: GameState,
    config: PathfindingConfig
): CreaturePathfindingResult {
    const effects: GameEffect[] = [];

    // Validate creature has pathfinding state (only fauna/monsters can pathfind)
    // Strict Type Guard Check
    if (!isFauna(creature) && !isMonster(creature)) {
        return {
            newCreature: creature,
            effects: [],
        };
    }

    if (!creature.pathfinding) {
        // Warning: Mobile creature without pathfinding state
        // This is expected upon creation before init
        return {
            newCreature: creature,
            effects: [],
        };
    }

    let state = creature.pathfinding.state;

    // Check if path needs recalculation
    const stale = isPathStale(state, target, config.maxPathAge, config.recalculateOnTargetMove);

    if (stale) {
        // Calculate new path
        const newPath = calculateCreaturePath(creature, target, gameState);

        if (newPath.length === 0) {
            // Path calculation failed
            effects.push({
                type: 'log',
                message: `[Pathfinding] No path found for ${creature.id} to target`,
            } as GameEffect);

            // Mark as stuck
            state = {
                ...state,
                mode: 'stuck',
                currentPath: [],
            };
        } else {
            // Path found
            state = {
                ...state,
                mode: 'seeking-target',
                target,
                currentPath: newPath,
                pathAge: 0,
                failureCount: 0,
            };

            effects.push({
                type: 'log',
                message: `[Pathfinding] Calculated path for ${creature.id}: ${newPath.length} waypoints`,
            } as GameEffect);
        }
    }

    // Increment path age (every tick)
    state = incrementPathAge(state);

    return {
        newCreature: {
            ...creature,
            pathfinding: {
                ...creature.pathfinding,
                state,
            },
        },
        effects,
    };
}

/**
 * Update a batch of visible creatures' pathfinding.
 *
 * @remarks
 * Orchestrates pathfinding updates for all relevant creatures in the viewport.
 * Filters out simple entities (Flora/Mineral) and processes Fauna/Monsters.
 * **Throttled:** Only processes 20% of eligible creatures per tick to avoid CPU spikes.
 *
 * @param creatures - List of all visible creatures
 * @param gameState - Current game state
 * @returns Updated creatures and aggregated log effects
 */
export function updateVisibleCreaturesPathfindingBatch(
    creatures: Creature[],
    gameState: GameState
): { updatedCreatures: Creature[]; effects: GameEffect[] } {
    const updatedCreatures: Creature[] = [];
    const allEffects: GameEffect[] = [];

    // Collect eligible creatures first
    const eligibleForPathfinding: Creature[] = [];
    const nonEligible: Creature[] = [];

    for (const creature of creatures) {
        // 1. Filter: Only Fauna and Monsters need pathfinding
        if (!isFauna(creature) && !isMonster(creature)) {
            nonEligible.push(creature);
            continue;
        }

        // 2. Filter: Only creatures with active pathfinding state
        if (!creature.pathfinding) {
            nonEligible.push(creature);
            continue;
        }

        const target = creature.pathfinding.state.target;
        if (!target) {
            // No target, no pathfinding needed
            nonEligible.push(creature);
            continue;
        }

        eligibleForPathfinding.push(creature);
    }

    // Throttle: Select 20% of eligible creatures (minimum 1 if any exist)
    const throttleRatio = 0.2;
    const countToProcess = Math.max(1, Math.ceil(eligibleForPathfinding.length * throttleRatio));

    // Shuffle and select (simple random selection)
    const shuffled = [...eligibleForPathfinding].sort(() => Math.random() - 0.5);
    const toProcess = shuffled.slice(0, countToProcess);
    const deferred = shuffled.slice(countToProcess);

    // Process selected creatures
    for (const creature of toProcess) {
        // Re-validate type guard (required for TS narrowing)
        if (!isFauna(creature) && !isMonster(creature)) continue;
        if (!creature.pathfinding?.state?.target) continue;

        const target = creature.pathfinding.state.target;
        const config = getPathfindingConfigForCreature(creature);
        const result = updateCreaturePathfinding(creature, target, gameState, config);

        updatedCreatures.push(result.newCreature);
        allEffects.push(...result.effects);
    }

    // Add deferred and non-eligible creatures unchanged
    updatedCreatures.push(...deferred);
    updatedCreatures.push(...nonEligible);

    return { updatedCreatures, effects: allEffects };
}

/**
 * Handle creature failing to follow its path.
 *
 * @remarks
 * Called when creature couldn't move to next waypoint (obstacle appeared, etc.).
 * Increments failure count and recalculates if threshold exceeded.
 *
 * @param creature - Creature with failed path
 * @param gameState - Current world state
 * @param config - Pathfinding config
 * @returns Updated creature and effects
 *
 * @example
 * ```typescript
 * const { newCreature } = handlePathfindingFailure(creature, gameState, config);
 * ```
 */
export function handlePathfindingFailure(
    creature: Creature,
    gameState: GameState,
    config: PathfindingConfig
): CreaturePathfindingResult {
    // Strict Type Guard Check
    if (!isFauna(creature) && !isMonster(creature)) {
        return { newCreature: creature, effects: [] };
    }

    if (!creature.pathfinding) {
        return { newCreature: creature, effects: [] };
    }

    const { newState, shouldRecalculate } = markPathFailure(creature.pathfinding.state, 3);

    const effects: GameEffect[] = [
        {
            type: 'log',
            message: `[Pathfinding] Path failure for ${creature.id} (count: ${newState.failureCount})`,
        } as GameEffect,
    ];

    let state = newState;

    if (shouldRecalculate) {
        // Too many failures, clear path and recalculate next tick
        state = {
            ...state,
            mode: 'stuck',
            currentPath: [],
            failureCount: 0,
        };

        effects.push({
            type: 'log',
            message: `[Pathfinding] Path abandoned for ${creature.id}, will recalculate`,
        } as GameEffect);
    }

    return {
        newCreature: {
            ...creature,
            pathfinding: {
                ...creature.pathfinding,
                state,
            },
        },
        effects,
    };
}

/**
 * Get the next waypoint a creature should move toward.
 *
 * @remarks
 * Used by movement system to determine where creature goes next.
 * Returns undefined if path is empty or complete.
 *
 * @param creature - Creature to get waypoint for
 * @returns Next waypoint [x, y] or undefined
 *
 * @example
 * ```typescript
 * const waypoint = getCreatureNextWaypoint(creature);
 * if (waypoint) {
 *   moveCreature(creature, waypoint[0], waypoint[1]);
 * }
 * ```
 */
export function getCreatureNextWaypoint(
    creature: Creature
): [number, number] | undefined {
    // Strict Type Guard Check
    if (!isFauna(creature) && !isMonster(creature)) {
        return undefined;
    }

    if (!creature.pathfinding) {
        return undefined;
    }

    return getNextWaypoint(creature.pathfinding.state);
}

/**
 * Check if creature is pathfinding to a specific target.
 *
 * @remarks
 * Useful for behavior systems to check current goal.
 *
 * @param creature - Creature to check
 * @param targetId - Entity ID to check for
 * @returns true if creature is targeting this entity
 */
export function isCreatureTargeting(creature: Creature, targetId: string): boolean {
    // Strict Type Guard Check
    if (!isFauna(creature) && !isMonster(creature)) {
        return false;
    }

    if (!creature.pathfinding?.state.target) {
        return false;
    }

    const target = creature.pathfinding.state.target;
    return target.type === 'entity' && target.entityId === targetId;
}
