import { z } from 'zod';
import { EntitySchema } from './entity';
import type { PathfindingCapability } from '@/core/rules/creature/pathfinding-state';
import { PathfindingCapabilitySchema } from '@/core/rules/creature/pathfinding-state';

/**
 * Polymorphic Creature Domain Type
 *
 * Uses Zod discriminated unions (Decision #1) to ensure type safety at schema level.
 * This prevents invalid states where fauna would have flora properties, etc.
 *
 * @example
 * ```typescript
 * // Type narrowing ensures fauna have required fields
 * const creature = CreatureSchema.parse(data);
 * if (creature.type === 'fauna') {
 *   console.log('Diet:', creature.diet);  // ✅ Always exists
 *   console.log('Roam range:', creature.roamRange);  // ✅ Always exists
 * }
 * ```
 */

export const CreatureTypeSchema = z.enum(['fauna', 'flora', 'mineral', 'monster']);
export type CreatureType = z.infer<typeof CreatureTypeSchema>;

/**
 * FAUNA: Intelligent animals (herbivores, omnivores)
 *
 * Fauna move within a roam range, eat from diet, and can be passive or aggressive.
 * Examples: deer, rabbits, wolves, bears
 */
const FaunaSchema = EntitySchema.extend({
    type: z.literal('fauna'),
    behavior: z.enum(['aggressive', 'passive', 'defensive']).describe('Combat behavior'),
    diet: z.array(z.string()).nonempty().describe('Food sources (item IDs)'),
    satiation: z.number().min(0).max(100).describe('Hunger level (0=starving, 100=full)'),
    roamRange: z.number().positive().describe('How far from spawn point creature roams'),
    spawnX: z.number().int().describe('Original spawn X position'),
    spawnY: z.number().int().describe('Original spawn Y position'),
    hp: z.number().min(0).describe('Current health points'),
    maxHp: z.number().positive().describe('Maximum health'),
    pathfinding: PathfindingCapabilitySchema.optional().describe('Pathfinding state and config'),
});

/**
 * FLORA: Plants and trees
 *
 * Flora are immobile, grow over time, and yield resources on harvest.
 * Examples: oak tree, berry bush, poison flower, magical plant
 */
const FloraSchema = EntitySchema.extend({
    type: z.literal('flora'),
    behavior: z.literal('immobile').describe('Flora never move'),
    diet: z.array(z.string()).length(0).describe('Flora have no diet (always empty)'),
    satiation: z.number().min(0).max(100).describe('Plant health/moisture (0=dead, 100=thriving)'),
    growthRate: z.number().positive().describe('Growth speed (0.1=slow, 1.0=normal, 10.0=fast)'),
    harvestDrop: z.string().describe('Item ID dropped on harvest'),
    thorns: z.number().min(0).describe('Damage dealt when touched (0=none)'),
    hp: z.number().min(0).describe('Plant integrity'),
    maxHp: z.number().positive().describe('Maximum plant integrity'),
});

/**
 * MINERAL: Rocks, ore deposits, gems
 *
 * Minerals are stationary resources that yield ores/gems on mining.
 * Examples: copper ore, gold vein, diamond crystal
 */
const MineralSchema = EntitySchema.extend({
    type: z.literal('mineral'),
    behavior: z.literal('immobile').describe('Minerals never move'),
    diet: z.array(z.string()).length(0).describe('Minerals have no diet (always empty)'),
    satiation: z.number().min(0).max(100).describe('Ore quality/richness (0=depleted, 100=rich)'),
    mineTool: z.string().describe('Required tool to mine (pickaxe ID)'),
    yield: z.string().describe('Item ID produced on successful mining'),
    hardness: z.number().min(1).describe('Difficulty to mine (1=soft, 10=diamond)'),
    hp: z.number().min(0).describe('Mineral integrity (health)'),
    maxHp: z.number().positive().describe('Maximum mineral integrity'),
});

/**
 * MONSTER: Aggressive creatures (bosses, dungeon creatures)
 *
 * Monsters are hostile, pursue targets, and have special abilities.
 * Examples: goblin, skeletal warrior, boss dragon, minion
 */
const MonsterSchema = EntitySchema.extend({
    type: z.literal('monster'),
    behavior: z.literal('aggressive').describe('Monsters always attack'),
    diet: z.array(z.string()).describe('Monster diet (what they hunt)'),
    satiation: z.number().min(0).max(100).describe('Hunger level'),
    intelligence: z.number().min(0).max(10).describe('Combat AI difficulty (0=dumb, 10=genius)'),
    patrolRange: z.number().positive().describe('Patrol radius from spawn'),
    spawnX: z.number().int().describe('Original spawn X position'),
    spawnY: z.number().int().describe('Original spawn Y position'),
    specialAbility: z.string().optional().describe('Unique ability ID'),
    hp: z.number().min(0).describe('Current health'),
    maxHp: z.number().positive().describe('Maximum health'),
    loot: z.array(z.object({
        itemId: z.string(),
        dropChance: z.number().min(0).max(1),
    })).describe('Items dropped on death'),
    pathfinding: PathfindingCapabilitySchema.optional().describe('Pathfinding state and config'),
});

/**
 * Complete Polymorphic Creature Type
 *
 * Zod discriminates on `type` field to ensure each variant has exactly the fields it needs.
 * Prevents fauna from having flora-only fields like `growthRate`.
 */
export const CreatureSchema = z.discriminatedUnion('type', [
    FaunaSchema,
    FloraSchema,
    MineralSchema,
    MonsterSchema,
]);

export type Creature = z.infer<typeof CreatureSchema>;

/**
 * Type guards for narrowing creature type
 */

export function isFauna(creature: Creature): creature is z.infer<typeof FaunaSchema> {
    return creature.type === 'fauna';
}

export function isFlora(creature: Creature): creature is z.infer<typeof FloraSchema> {
    return creature.type === 'flora';
}

export function isMineral(creature: Creature): creature is z.infer<typeof MineralSchema> {
    return creature.type === 'mineral';
}

export function isMonster(creature: Creature): creature is z.infer<typeof MonsterSchema> {
    return creature.type === 'monster';
}

/**
 * Create a new Fauna creature
 */
export function createFauna(params: Omit<z.infer<typeof FaunaSchema>, 'type'>): Creature {
    return FaunaSchema.parse({ ...params, type: 'fauna' });
}

/**
 * Create a new Flora creature
 */
export function createFlora(params: Omit<z.infer<typeof FloraSchema>, 'type' | 'diet'>): Creature {
    return FloraSchema.parse({ ...params, type: 'flora', diet: [] });
}

/**
 * Create a new Mineral creature
 */
export function createMineral(params: Omit<z.infer<typeof MineralSchema>, 'type' | 'diet'>): Creature {
    return MineralSchema.parse({ ...params, type: 'mineral', diet: [] });
}

/**
 * Create a new Monster creature
 */
export function createMonster(params: Omit<z.infer<typeof MonsterSchema>, 'type'>): Creature {
    return MonsterSchema.parse({ ...params, type: 'monster' });
}
