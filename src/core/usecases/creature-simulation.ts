/**
 * @file src/core/usecases/creature-simulation.ts
 * @description Pure creature simulation logic (testable without React)
 *
 * @remarks
 * **Separated from hook for testability:**
 * - Pure functions that don't depend on React
 * - No hooks, no context, just business logic
 * - Hooks call these functions to simulate creatures
 *
 * **Pattern: Sync-Back**
 * Functions return creature messages; caller applies to narrative atomically
 */

import { CreatureEngine } from '@/core/rules/creature';
import { processPlantGrowth } from './plant-growth.usecase';
import { GridPosition } from '@/core/values/grid-position';
import type { PlayerStatusDefinition } from '@/core/types/game';

/**
 * Result of creature simulation
 */
export interface CreatureSimulationResult {
    /** Messages from creature AI updates */
    creatureMessages: Array<{ text: string; type: 'narrative' | 'system' | 'action' | 'monologue' }>;
    /** Messages from plant growth */
    plantMessages: Array<{ text: string; type: 'narrative' | 'system' | 'action' | 'monologue' }>;
}

/**
 * Build map of visible chunks around player
 *
 * @param gameState Game state with world and current chunk
 * @param playerPosition Current player position
 * @param viewRadius Radius of visibility (tiles)
 * @returns Map of chunks keyed by "x,y"
 *
 * @remarks
 * Tries multiple strategies:
 * 1. Use world.getChunksInArea (fast)
 * 2. Fallback to getCellAt for each coordinate (slower)
 * 3. Return just current chunk if both fail
 *
 * @example
 * ```typescript
 * const chunks = buildVisibleChunks(gameState, playerPos, 5);
 * // chunks: Map with all cells/chunks within 5 tiles
 * ```
 */
export function buildVisibleChunks(
    gameState: any,
    playerPosition: GridPosition,
    viewRadius: number = 5,
): Map<string, any> {
    const visibleChunks = new Map<string, any>();

    // Add current chunk if it exists
    if (gameState.currentChunk) {
        const chunkKey = `${gameState.currentChunk.x},${gameState.currentChunk.y}`;
        visibleChunks.set(chunkKey, gameState.currentChunk);
    }

    // Add surrounding chunks if world data is available
    if (gameState.world && typeof gameState.world.getChunksInArea === 'function') {
        try {
            const surroundingChunks = gameState.world.getChunksInArea(playerPosition, viewRadius);
            for (const chunk of surroundingChunks) {
                const chunkKey = `${chunk.x},${chunk.y}`;
                visibleChunks.set(chunkKey, chunk);
            }
        } catch (err) {
            // Log strategy 1 failure for debugging
            console.warn(
                `[CreatureSimulation.buildVisibleChunks] Strategy 1 (getChunksInArea) failed: ${err instanceof Error ? err.message : String(err)}. Attempting fallback.`,
            );

            // Fallback to Strategy 2: getCellAt loop
            if (gameState.world && typeof gameState.world.getCellAt === 'function' && gameState.currentChunk) {
                const cx = gameState.currentChunk.x;
                const cy = gameState.currentChunk.y;
                let fallbackCount = 0;

                for (let dx = -viewRadius; dx <= viewRadius; dx++) {
                    for (let dy = -viewRadius; dy <= viewRadius; dy++) {
                        try {
                            const cell = gameState.world.getCellAt(new GridPosition(cx + dx, cy + dy));
                            if (cell) {
                                const key = `${cell.x},${cell.y}`;
                                visibleChunks.set(key, cell);
                                fallbackCount++;
                            }
                        } catch {
                            // Ignore missing cells in fallback
                        }
                    }
                }

                if (fallbackCount === 0) {
                    console.warn(
                        `[CreatureSimulation.buildVisibleChunks] Strategy 2 (getCellAt loop) yielded 0 chunks. Falling back to current chunk only.`,
                    );
                }
            }
        }
    }

    return visibleChunks;
}

/**
 * Register creatures from visible chunks into engine
 *
 * @param creatureEngineRef Reference to CreatureEngine instance
 * @param visibleChunks Map of visible chunks
 * @returns Number of creatures registered
 *
 * @remarks
 * **Idempotent:** Safe to call multiple times
 * - Only registers creatures not already in engine
 * - Skips empty/missing enemy slots
 * - Handles registration errors gracefully
 *
 * @example
 * ```typescript
 * const count = registerCreatures(engineRef, chunks);
 * console.log(`Registered ${count} creatures for simulation`);
 * ```
 */
export function registerCreatures(
    creatureEngineRef: { current?: any },
    visibleChunks: Map<string, any>,
): number {
    if (!creatureEngineRef.current) {
        return 0;
    }

    let registeredCount = 0;
    let failedCount = 0;

    for (const [chunkKey, chunk] of visibleChunks) {
        if (chunk && chunk.enemy) {
            const creatureId = `creature_${chunk.x}_${chunk.y}`;
            if (!creatureEngineRef.current.getCreature(creatureId)) {
                try {
                    creatureEngineRef.current.registerCreature(
                        creatureId,
                        chunk.enemy,
                        new GridPosition(chunk.x, chunk.y),
                        chunk,
                    );
                    registeredCount++;
                } catch (err) {
                    // Log individual creature registration failure but continue with next
                    console.warn(
                        `[CreatureSimulation.registerCreatures] Failed to register creature ${creatureId}: ${err instanceof Error ? err.message : String(err)}. Continuing with remaining creatures.`,
                    );
                    failedCount++;
                }
            }
        }
    }

    // Log summary if there were any failures
    if (failedCount > 0) {
        console.warn(
            `[CreatureSimulation.registerCreatures] Partial registration: ${registeredCount} succeeded, ${failedCount} failed`,
        );
    }

    return registeredCount;
}

/**
 * Process plant growth in visible area
 *
 * @param currentTurn Current game turn
 * @param visibleChunks Map of visible chunks
 * @param gameState Game state (season, worldProfile)
 * @param t Translation function
 * @returns Plant growth messages
 *
 * @remarks
 * **Handles errors gracefully:**
 * - Invalid chunks are skipped
 * - Missing seasons default to 'spring'
 * - Returns empty array if processPlantGrowth throws
 *
 * @example
 * ```typescript
 * const msgs = processPlants(turn, chunks, state, t);
 * // msgs: Array of plant growth narrative messages
 * ```
 */
export function processPlantsSync(
    currentTurn: number,
    visibleChunks: Map<string, any>,
    gameState: any,
    t: (key: string) => string,
): Array<{ text: string; type: string }> {
    try {
        const plantResult = processPlantGrowth({
            currentTick: currentTurn,
            chunks: visibleChunks,
            season: gameState.currentSeason || 'spring',
            worldProfile: gameState.worldProfile,
            t,
        });
        return plantResult.narrativeMessages || [];
    } catch (err: any) {
        // Log plant processing error but allow game to continue
        console.warn(
            `[CreatureSimulation.processPlantsSync] Plant growth processing failed: ${err instanceof Error ? err.message : String(err)}. Skipping plant updates this turn.`,
        );
        return [];
    }
}

/**
 * Update creature AI and return messages
 *
 * @param creatureEngineRef Reference to CreatureEngine instance
 * @param currentTurn Current game turn
 * @param playerPosition Player's current position
 * @param playerStats Player's current stats
 * @param visibleChunks Visible chunks for creature simulation
 * @returns Messages from creature AI
 *
 * @remarks
 * **Handles engine errors gracefully:**
 * - Returns empty array if engine unavailable
 * - Continues game if creature update fails
 * - Messages already sorted by engine
 *
 * @example
 * ```typescript
 * const msgs = updateCreaturesSync(engineRef, turn, pos, stats, chunks);
 * // msgs: Array of creature action messages
 * ```
 */
export function updateCreaturesSync(
    creatureEngineRef: { current?: any },
    currentTurn: number,
    playerPosition: GridPosition,
    playerStats: PlayerStatusDefinition,
    visibleChunks: Map<string, any>,
): Array<{ text: string; type: string }> {
    if (!creatureEngineRef.current) {
        return [];
    }

    try {
        const messages = creatureEngineRef.current.updateCreatures(
            currentTurn,
            playerPosition,
            playerStats,
            visibleChunks,
        ) || [];

        // Check for message count explosion (memory bomb prevention)
        if (messages.length > 1000) {
            console.warn(
                `[CreatureSimulation.updateCreaturesSync] Creature engine returned ${messages.length} messages (limit: 1000). Truncating to prevent memory bomb.`,
            );
            return messages.slice(0, 1000);
        }

        return messages;
    } catch (err) {
        // Log creature update error but allow game to continue
        console.warn(
            `[CreatureSimulation.updateCreaturesSync] Creature AI update failed: ${err instanceof Error ? err.message : String(err)}. Skipping creature actions this turn.`,
        );
        return [];
    }
}

/**
 * Run full creature simulation cycle
 *
 * @param creatureEngineRef Reference to CreatureEngine instance
 * @param currentTurn Current game turn
 * @param playerPosition Player position
 * @param playerStats Player stats
 * @param gameState Game state with world and chunks
 * @param t Translation function
 * @returns All creature and plant messages
 *
 * @remarks
 * **Complete Cycle:**
 * 1. Build visible chunks
 * 2. Register creatures
 * 3. Process plant growth
 * 4. Update creature AI
 * 5. Collect all messages
 *
 * **Atomic Application:**
 * Caller receives all messages together and applies to narrative atomically.
 *
 * **Example:**
 * ```typescript
 * const result = simulateCreaturesSync(engineRef, turn, playerPos, stats, gameState, t);
 * result.creatureMessages.forEach(msg => addNarrative(msg.text, msg.type));
 * result.plantMessages.forEach(msg => addNarrative(msg.text, msg.type));
 * ```
 */
export function simulateCreaturesSync(
    creatureEngineRef: { current?: any },
    currentTurn: number,
    playerPosition: GridPosition,
    playerStats: PlayerStatusDefinition,
    gameState: any,
    t: (key: string) => string,
): CreatureSimulationResult {
    // 1. Build visible chunks
    const visibleChunks = buildVisibleChunks(gameState, playerPosition, 5);

    // 2. Register creatures (idempotent, safe to call every turn)
    registerCreatures(creatureEngineRef, visibleChunks);

    // 3. Process plant growth
    const plantMessages = processPlantsSync(currentTurn, visibleChunks, gameState, t);

    // 4. Update creatures
    const creatureMessages = updateCreaturesSync(
        creatureEngineRef,
        currentTurn,
        playerPosition,
        playerStats,
        visibleChunks,
    );

    return {
        creatureMessages: creatureMessages.map((msg) => ({
            text: msg.text,
            type: msg.type as 'narrative' | 'system' | 'action' | 'monologue',
        })),
        plantMessages: plantMessages.map((msg) => ({
            text: msg.text,
            type: msg.type as 'narrative' | 'system' | 'action' | 'monologue',
        })),
    };
}
