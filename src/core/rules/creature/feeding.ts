import type { CreatureState } from './core';
import type { Chunk } from '@/core/types/game';

/**
 * Updates creature hunger and satiation levels.
 * @remarks
 * **Hunger Decay Cycle:**
 * - Decreases satiation by hungerDecayPerTick every hungerDecayInterval ticks
 * - When satiation < 20% of max: creature becomes aggressive (passive→territorial)
 * - When satiation <= 0: creature dies (removed from world)
 * @param creature The creature to update
 * @param currentTick Current game tick number
 */
export function updateHunger(creature: CreatureState, currentTick: number): void {
    // Hunger decay every 10 ticks (default)
    const hungerDecayInterval = 10;
    const hungerDecayPerTick = 0.5;

    if (currentTick % hungerDecayInterval === 0) {
        creature.satiation = Math.max(0, creature.satiation - hungerDecayPerTick);

        // If very hungry, creature becomes more aggressive
        if (creature.satiation < creature.maxSatiation * 0.2) {
            if (creature.behavior === 'passive') {
                creature.behavior = 'territorial';
            }
        }
    }
}

/**
 * Determine if the creature is allowed to eat plants based on trophic tag or diet keywords.
 * @remarks
 * **Trophic Checks:**
 * - herbivore: YES
 * - omnivore: YES
 * - carnivore: NO
 * 
 * **Fallback:** Searches diet array for keywords: "plant", "berry", "grass", "herb", "leaf"
 * @param creature The creature to check
 * @returns true if creature can eat plants, false otherwise
 */
export function canEatPlants(creature: CreatureState): boolean {
    if (creature.trophic === 'herbivore') return true;
    if (creature.trophic === 'carnivore') return false;
    if (creature.trophic === 'omnivore') return true;

    // Fallback: look for plant-like keywords in diet
    const plantKeywords = ['plant', 'berry', 'grass', 'herb', 'leaf'];
    if (Array.isArray(creature.diet)) {
        for (const d of creature.diet) {
            if (!d) continue;
            const lower = d.toString().toLowerCase();
            if (plantKeywords.some(k => lower.includes(k))) return true;
        }
    }

    return false;
}

/**
 * Attempt to eat plants in the creature's current chunk.
 * @remarks
 * **Eating Conditions:**
 * 1. Creature must be herbivore/omnivore (canEatPlants check)
 * 2. Satiation < 60% of max (only eat when moderately hungry)
 * 3. Chunk has vegetationDensity > 0
 * 4. Random chance (default 60%) succeeds
 * 5. Vegetation amount > 0 after calculation
 * 
 * **Effects:**
 * - Reduces chunk.vegetationDensity by consumption amount
 * - Increases creature.satiation by amount × plantNutrition (default 0.5 per unit)
 * - Returns narrative message if eating succeeds
 * 
 * @param creature The creature eating
 * @param t Translation function for i18n
 * @param config Game configuration object with plant and creature settings
 * @returns Object with eaten flag and optional narrative message, or null if no eating occurred
 */
export function attemptEatPlants(
    creature: CreatureState,
    t: (key: string, params?: any) => string,
    config: any
): { eaten: boolean; message?: { text: string; type: 'narrative' | 'system' } } | null {
    try {
        if (!canEatPlants(creature)) return null;

        // Only attempt eating when hungry
        const hungry = creature.satiation < creature.maxSatiation * 0.6;
        if (!hungry) return null;

        const chunk = creature.currentChunk;
        if (!chunk || typeof chunk.vegetationDensity !== 'number') return null;

        const veg = chunk.vegetationDensity;
        if (veg <= 0) return null;

        // Chance to eat
        if (Math.random() > (config?.plant?.eatChance ?? 0.6)) return null;

        const amount = Math.min(veg, config?.plant?.consumptionPerEat ?? 5);
        if (amount <= 0) return null;

        // Apply consumption
        chunk.vegetationDensity = Math.max(0, veg - amount);

        // Increase satiation based on plantNutrition per vegetation unit
        const nutritionPerUnit = config?.plant?.plantNutrition ?? 0.5;
        const satiationGain = amount * nutritionPerUnit;
        creature.satiation = Math.min(creature.maxSatiation, creature.satiation + satiationGain);

        const creatureName = (creature as any).name?.en || creature.type || 'creature';
        const text = t('creatureEating', { creature: creatureName });
        return { eaten: true, message: { text, type: 'narrative' } };
    } catch {
        return null;
    }
}
