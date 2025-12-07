import type { Chunk } from '@/core/types/game';
import plants from '@/lib/game/data/creatures/plants';
import type { CreatureDefinition } from '@/core/types/definitions/creature';

/**
 * Lightweight farming helpers. These are small, pure helpers that operate on a
 * chunk and return an updated chunk. They intentionally don't reach into
 * repositories or engines — the caller (usecases / action handlers) should
 * perform state wiring (setWorld / save) and any narrative side-effects.
 */

export function tillSoil(chunk: Chunk): Chunk {
    const next: Chunk = { ...chunk } as any;
    next.soilType = 'tilled' as any;
    // Ensure farming fields are initialized
    if ((next as any).waterRetention === undefined) (next as any).waterRetention = 1;
    if ((next as any).waterTimer === undefined) (next as any).waterTimer = 0;
    if ((next as any).nutrition === undefined) (next as any).nutrition = 0;
    if ((next as any).fertilizerLevel === undefined) (next as any).fertilizerLevel = 0;
    return next;
}

export function waterTile(chunk: Chunk, durationTicks = 6): Chunk {
    const next: Chunk = { ...chunk } as any;
    const retention = (next as any).waterRetention ?? 1;
    (next as any).waterTimer = Math.max((next as any).waterTimer ?? 0, Math.ceil(durationTicks * retention));
    return next;
}

export function fertilizeTile(chunk: Chunk, nutritionBoost = 20): Chunk {
    const next: Chunk = { ...chunk } as any;
    (next as any).nutrition = Math.min(100, ((next as any).nutrition ?? 0) + nutritionBoost);
    (next as any).fertilizerLevel = ((next as any).fertilizerLevel ?? 0) + 1;
    return next;
}

/**
 * Attempt to plant a seed into a tilled chunk. Returns updated chunk and a boolean
 * indicating whether planting happened.
 */
export function plantSeed(chunk: Chunk, seedId: string): { chunk: Chunk; planted: boolean } {
    // Map some conventional seed IDs to plant definitions. Extend as needed.
    const seedMap: Record<string, string> = {
        'wildflower_seeds': 'tall_grass',
        'wild_cotton_seed': 'wild_cotton',
        'bamboo_seed': 'bamboo',
        'tree_sapling': 'common_tree'
    };

    const plantId = seedMap[seedId];
    if (!plantId) return { chunk, planted: false };
    const plantDef: CreatureDefinition | undefined = (plants as any)[plantId];
    if (!plantDef) return { chunk, planted: false };

    // Require tilled soil for planting crops
    if (chunk.soilType !== 'tilled') return { chunk, planted: false };

    const next: Chunk = { ...chunk } as any;
    if (!next.plants) next.plants = [];

    next.plants.push({
        definition: plantDef,
        hp: plantDef.hp,
        maturity: 0,
        age: 0
    } as any);

    return { chunk: next, planted: true };
}

export default {
    tillSoil,
    waterTile,
    fertilizeTile,
    plantSeed,
};
