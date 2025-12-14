import { z } from 'zod';

/**
 * Base Entity - Represents any game object with world position and lifecycle.
 *
 * All interactive game objects (creatures, items, structures) inherit from Entity.
 * The `isDestroyed` flag implements lazy garbage collection.
 *
 * @example
 * ```typescript
 * // Type narrowing works with discriminated unions
 * const creature = await loadCreature(id);
 * if (creature.type === 'fauna') {
 *   console.log('Aggressive:', creature.aggressive);  // ✅ Type-safe
 * }
 * ```
 */
export const EntitySchema = z.object({
    id: z.string().uuid().describe('Unique identifier (UUID)'),
    x: z.number().int().describe('World X position (tiles)'),
    y: z.number().int().describe('World Y position (tiles)'),
    isDestroyed: z.boolean().default(false).describe('Garbage collection flag (true = pending removal)'),
});

export type Entity = z.infer<typeof EntitySchema>;

/**
 * Create a new entity with default values.
 *
 * @param id - Unique entity identifier
 * @param x - World X position
 * @param y - World Y position
 * @returns New Entity instance
 */
export function createEntity(id: string, x: number, y: number): Entity {
    return {
        id,
        x,
        y,
        isDestroyed: false,
    };
}
