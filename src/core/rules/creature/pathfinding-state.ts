/**
 * Creature Pathfinding State & Types
 *
 * @remarks
 * Defines the data structures and enums for creature pathfinding behavior.
 * Creatures can be in various pathfinding states: idle, seeking target, patrolling, etc.
 * This file provides the type system for all pathfinding-related creature state.
 *
 * ### Design Philosophy
 * - **Pure types**: No logic, only data structures
 * - **Discriminated unions**: Type-safe state tracking via Zod
 * - **TSDoc coverage**: 100% of exports documented
 * - **Creature-specific**: Tailored to fauna, monsters (not flora/minerals)
 *
 * @example
 * ```typescript
 * // Type-safe path management
 * const creatureState: PathfindingCreatureState = {
 *   type: 'fauna',
 *   pathfindingState: {
 *     mode: 'seeking-target',
 *     target: { x: 45, y: 60 },
 *     currentPath: [[40, 55], [42, 57], [45, 60]],
 *     pathAge: 0,
 *   }
 * };
 * ```
 */

import { z } from 'zod';

/**
 * Pathfinding behavior modes for creatures.
 *
 * @remarks
 * - `idle`: No target, creature stays put or wanders
 * - `seeking-target`: Moving toward a specific goal (food, prey, waypoint)
 * - `patrolling`: Repeating a set of waypoints
 * - `fleeing`: Running away from threat
 * - `pursuing`: Active chase mode (high priority)
 * - `stuck`: Path blocked, attempting alternative routes
 *
 * @enum
 */
export const PathfindingModeSchema = z.enum([
    'idle',
    'seeking-target',
    'patrolling',
    'fleeing',
    'pursuing',
    'stuck',
]);

export type PathfindingMode = z.infer<typeof PathfindingModeSchema>;

/**
 * A single waypoint in a creature's path.
 *
 * @remarks
 * Waypoints are stored as [x, y] tuples for compactness.
 * The creature moves from waypoint to waypoint until reaching the target.
 *
 * @example
 * ```typescript
 * const waypoint: Waypoint = [45, 60];
 * console.log(waypoint[0]); // x = 45
 * console.log(waypoint[1]); // y = 60
 * ```
 */
export const WaypointSchema = z.tuple([
    z.number().int().describe('X coordinate'),
    z.number().int().describe('Y coordinate'),
]);

export type Waypoint = z.infer<typeof WaypointSchema>;

/**
 * Pathfinding target that a creature is trying to reach.
 *
 * @remarks
 * Targets can be explicit coordinates (fixed location) or entity-based (prey ID).
 * Entity-based targets are resolved at runtime.
 *
 * @example
 * ```typescript
 * // Food source at fixed location
 * const foodTarget: PathfindingTarget = {
 *   type: 'location',
 *   x: 100,
 *   y: 150,
 * };
 *
 * // Prey creature (will track moving target)
 * const preyTarget: PathfindingTarget = {
 *   type: 'entity',
 *   entityId: 'creature-42',
 * };
 * ```
 */
export const PathfindingTargetSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('location').describe('Fixed coordinate target'),
        x: z.number().int().describe('Target X coordinate'),
        y: z.number().int().describe('Target Y coordinate'),
    }),
    z.object({
        type: z.literal('entity').describe('Entity ID target (moves with entity)'),
        entityId: z.string().describe('ID of target creature/entity'),
    }),
]);

export type PathfindingTarget = z.infer<typeof PathfindingTargetSchema>;

/**
 * Complete pathfinding state for a creature.
 *
 * @remarks
 * Encapsulates all pathfinding-related data:
 * - Current mode (seeking, patrolling, fleeing, etc.)
 * - Target being pursued
 * - Current path (list of waypoints)
 * - Age of path (to detect stale paths)
 * - Failure count (how many times this path failed)
 *
 * The pathfinding system updates this state each tick.
 *
 * @example
 * ```typescript
 * const state: PathfindingState = {
 *   mode: 'seeking-target',
 *   target: { type: 'location', x: 100, y: 150 },
 *   currentPath: [[40, 50], [60, 80], [100, 150]],
 *   pathAge: 2,
 *   failureCount: 0,
 * };
 * ```
 */
export const PathfindingStateSchema = z.object({
    mode: PathfindingModeSchema.describe('Current pathfinding behavior mode'),
    target: PathfindingTargetSchema.optional().describe('Where creature is trying to go'),
    currentPath: z.array(WaypointSchema).describe('Queued waypoints'),
    pathAge: z.number().int().min(0).describe('Ticks since path was calculated'),
    failureCount: z.number().int().min(0).describe('How many times this path failed'),
});

export type PathfindingState = z.infer<typeof PathfindingStateSchema>;

/**
 * Pathfinding configuration per creature type.
 *
 * @remarks
 * Different creatures have different pathfinding preferences:
 * - Herbivores avoid danger, search in wider radius
 * - Predators pursue aggressively, narrow focus
 * - Monsters ignore terrain cost, direct aggression
 *
 * This schema allows per-creature customization.
 *
 * @example
 * ```typescript
 * const deerPathfinding: PathfindingConfig = {
 *   maxRange: 60,
 *   allowDiagonal: true,
 *   terrainCostMultiplier: 1.5, // Avoid difficult terrain
 *   maxPathAge: 20,
 *   recalculateOnTargetMove: 15,
 * };
 * ```
 */
export const PathfindingConfigSchema = z.object({
    maxRange: z.number().positive().describe('Maximum search distance (cells)'),
    allowDiagonal: z.boolean().describe('Can creature move diagonally?'),
    terrainCostMultiplier: z.number().positive().describe('How much to weight terrain difficulty'),
    maxPathAge: z.number().positive().describe('Ticks before path is considered stale'),
    recalculateOnTargetMove: z.number().positive().describe('Retarget if entity moves N cells'),
});

export type PathfindingConfig = z.infer<typeof PathfindingConfigSchema>;

/**
 * Pathfinding capability for fauna creatures.
 *
 * @remarks
 * Wraps PathfindingState + PathfindingConfig together.
 * Creatures that can pathfind have both state (current behavior) and config (preferences).
 *
 * @example
 * ```typescript
 * const capability: PathfindingCapability = {
 *   enabled: true,
 *   state: { mode: 'seeking-target', ... },
 *   config: { maxRange: 60, ... },
 * };
 * ```
 */
export const PathfindingCapabilitySchema = z.object({
    enabled: z.boolean().describe('Is pathfinding active for this creature?'),
    state: PathfindingStateSchema.describe('Current pathfinding state'),
    config: PathfindingConfigSchema.describe('Creature pathfinding preferences'),
});

export type PathfindingCapability = z.infer<typeof PathfindingCapabilitySchema>;
