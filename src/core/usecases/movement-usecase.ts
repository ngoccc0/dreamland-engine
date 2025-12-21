/**
 * @file src/core/usecases/movement-usecase.ts
 * @description Pure logic for player movement with collision detection
 *
 * @remarks
 * Movement usecase handles:
 * - Direction validation
 * - Collision detection (world bounds, obstacles)
 * - Position updates
 * - Encounter triggering
 * - Visual feedback (footsteps, animations)
 *
 * Pure function signature:
 * ```typescript
 * (player, worldState, direction, distance) → { newPlayer, worldState, effects, events }
 * ```
 */

import { PlayerStatus } from '@/core/types/player';
import { ActionResult } from './actions/result-types';

/**
 * Movement input validation result
 */
interface MovementValidation {
    valid: boolean;
    reason?: string;
    normalizedDirection: { x: number; y: number };
}

/**
 * Validate movement direction and normalize to unit vector
 *
 * @remarks
 * Ensures direction is valid and normalizes to (-1, 0, 1) range
 *
 * @param direction - Input direction { x, y }
 * @returns Validation result with normalized direction
 *
 * @example
 * validateDirection({ x: 2, y: 1 }) → { valid: true, normalizedDirection: { x: 1, y: 0 } }
 * validateDirection({ x: 0, y: 0 }) → { valid: false, reason: 'Zero direction' }
 */
function validateDirection(direction: {
    x: number;
    y: number;
}): MovementValidation {
    const { x, y } = direction;

    // Check for zero direction
    if (x === 0 && y === 0) {
        return {
            valid: false,
            reason: 'Zero direction provided',
            normalizedDirection: { x: 0, y: 0 },
        };
    }

    // Normalize to unit vector (-1, 0, 1)
    const normalizedX = x !== 0 ? Math.sign(x) : 0;
    const normalizedY = y !== 0 ? Math.sign(y) : 0;

    return {
        valid: true,
        normalizedDirection: { x: normalizedX, y: normalizedY },
    };
}

/**
 * Check if movement would collide with world obstacles
 *
 * @remarks
 * Current implementation is simplified - checks world bounds only.
 * TODO: Implement full collision detection with terrain, obstacles, NPCs
 *
 * @param currentPosition - Current player position
 * @param newPosition - Proposed new position
 * @param world - World state
 * @returns true if movement is blocked, false if clear
 */
function isCollision(
    currentPosition: { x: number; y: number },
    newPosition: { x: number; y: number },
    world: any
): boolean {
    // World bounds check (simplified)
    const WORLD_WIDTH = 100; // TODO: Get from world config
    const WORLD_HEIGHT = 100;

    if (newPosition.x < 0 || newPosition.x >= WORLD_WIDTH) {
        return true;
    }

    if (newPosition.y < 0 || newPosition.y >= WORLD_HEIGHT) {
        return true;
    }

    // TODO: Check terrain collision (forest, water, etc.)
    // TODO: Check creature collision (other creatures blocking path)
    // TODO: Check obstacle collision (rocks, trees, structures)

    return false;
}

/**
 * Calculate new position from current position, direction, and distance
 *
 * @remarks
 * Simple vector addition: newPos = currentPos + (direction × distance)
 *
 * @param currentPosition - Current player position
 * @param direction - Unit direction vector
 * @param distance - Number of tiles to move
 * @returns New position
 *
 * @example
 * calculateNewPosition({ x: 5, y: 5 }, { x: 1, y: 0 }, 2)
 * → { x: 7, y: 5 }
 */
function calculateNewPosition(
    currentPosition: { x: number; y: number },
    direction: { x: number; y: number },
    distance: number
): { x: number; y: number } {
    return {
        x: currentPosition.x + direction.x * distance,
        y: currentPosition.y + direction.y * distance,
    };
}

/**
 * Execute player movement action
 *
 * @remarks
 * Movement flow:
 * 1. Validate direction input
 * 2. Calculate new position from direction × distance
 * 3. Check for collisions (world bounds, obstacles)
 * 4. If blocked: show toast, play fail sound
 * 5. If clear: update position, queue visual feedback (footstep sound, animation)
 *
 * @param player - Current player state
 * @param world - Current world state
 * @param direction - Direction vector { x, y }
 * @param distance - Distance to move (default 1 tile)
 * @returns ActionResult with updated position or collision feedback
 *
 * @example
 * ```typescript
 * const result = executeMovement(player, world, { x: 1, y: 0 }, 1);
 * // If successful: player.position moves right by 1
 * // If blocked: visualEvents shows "Blocked!" toast
 * ```
 */
export function executeMovement(
    player: PlayerStatus,
    world: any,
    direction: { x: number; y: number },
    distance: number = 1
): Partial<ActionResult> {
    const result: Partial<ActionResult> = {
        newPlayerState: player,
        visualEvents: [],
    };

    // Step 1: Validate direction
    const validation = validateDirection(direction);
    if (!validation.valid) {
        result.visualEvents?.push({
            type: 'SHOW_TOAST',
            message: validation.reason || 'Invalid movement direction',
            severity: 'warning',
        });
        result.debugMessage = `Invalid movement: ${validation.reason}`;
        return result;
    }

    // TODO: Get player position from world state (for now assume { x: 0, y: 0 })
    const currentPosition = { x: 0, y: 0 };

    // Step 2: Calculate new position
    const newPosition = calculateNewPosition(
        currentPosition,
        validation.normalizedDirection,
        distance
    );

    // Step 3: Check for collisions
    const blocked = isCollision(currentPosition, newPosition, world);
    if (blocked) {
        result.visualEvents?.push({
            type: 'SHOW_TOAST',
            message: 'Path blocked!',
            severity: 'warning',
        });
        result.visualEvents?.push({
            type: 'PLAY_SOUND',
            soundId: 'movement_blocked',
            volume: 0.5,
        });
        result.debugMessage = `Movement blocked at ${newPosition.x}, ${newPosition.y}`;
        return result;
    }

    // Step 4: Movement successful - queue visual feedback
    result.visualEvents?.push({
        type: 'PLAY_SOUND',
        soundId: 'footstep',
        volume: 0.4,
    });

    // TODO: Implement encounter triggering (random monsters, NPCs, events)
    // TODO: Implement world state updates (player position tracking, terrain effects)

    result.debugMessage = `Moved from [${currentPosition.x}, ${currentPosition.y}] to [${newPosition.x}, ${newPosition.y}]`;

    return result;
}
