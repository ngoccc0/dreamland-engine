import type { CreatureDefinition } from '@/core/types/creature';
import type { Chunk } from '@/core/types/world'; // Correct import path for Chunk
import type { GameConfig } from '@/lib/config/game-config';
import type { LootDrop } from '@/core/types/definitions/base'; // Import LootDrop for explicit typing
import { createRng, RNG } from '@/lib/narrative/rng';
import { getTranslatedText } from '@/lib/i18n'; // Moved to top-level

export interface PlantTickInput {
    plant: CreatureDefinition;
    chunk: Chunk;
    config: GameConfig;
    rngSeed: string | number;
    gameTime: number; // Current game time tick for generating unique seeds
}

export interface PlantTickOutput {
    newPlant: CreatureDefinition; // Changed from Creature to CreatureDefinition
    envUpdates: {
        lightLevelDelta?: number;
        nutritionDelta?: number;
        attractCreaturesDelta?: number; // Representing a factor to increase creature attraction
        vegetationDensityDelta?: number;
        // Add other environment-related changes here
    };
    droppedItems: Array<{ name: string; quantity: number; sourcePlantId: string }>;
    narrativeEvents: Array<{ key: string; params?: Record<string, any> }>;
    plantRemoved?: boolean; // If the plant wilts completely
}

/**
 * Environmental suitability state for a plant or part.
 */
export type EnvironmentalState = 'SUITABLE' | 'UNFAVORABLE' | 'UNSUITABLE';

/**
 * Return value for environmental multiplier calculation.
 * Includes both the multiplier and the suitability state.
 */
export interface EnvironmentalMultiplierResult {
    multiplier: number;
    state: EnvironmentalState;
    reason?: string; // Optional human-readable reason for the state
}

/**
 * Calculates the environmental multiplier and state for plant growth/decay.
 * This combines moisture, light, season, and human presence.
 * Optionally accepts a plant definition and part definition to apply per-plant preferences.
 * 
 * @param chunk - The chunk where the plant exists
 * @param config - Game config with plant settings
 * @param gameTime - Current game time (for seasonal calculation)
 * @param plant - Optional plant definition for applying preferences
 * @param part - Optional part definition for per-part preference overrides
 * @returns Object containing multiplier, state (SUITABLE/UNFAVORABLE/UNSUITABLE), and optional reason
 */
export const calculateEnvironmentalMultiplier = (
    chunk: Chunk,
    config: GameConfig,
    gameTime: number,
    plant?: CreatureDefinition,
    part?: any
): EnvironmentalMultiplierResult => {
    const { plant: plantConfig } = config;
    const { seasonMultiplier } = plantConfig;

    // Get preferences from part (override) or plant (default) or use standard factors
    const waterPref = part?.waterPreference ?? plant?.plantProperties?.waterPreference ?? 0.5;
    const lightPref = part?.lightPreference ?? plant?.plantProperties?.lightPreference ?? 0.5;
    const tempRange = part?.temperatureRange ?? plant?.plantProperties?.temperatureRange ?? [0, 50];

    // Calculate base factors with preferences applied
    const moistureFactor = ((chunk.moisture || 0) / 100) * waterPref;
    const lightFactor = ((chunk.lightLevel || 0) / 100) * lightPref;
    const humanPenaltyFactor = (chunk.humanPresence || 0) / 100 * plantConfig.humanPenaltyFactor;

    // Determine current season
    const season = ['winter', 'spring', 'summer', 'autumn'][Math.floor((gameTime / 100) % 4)];
    const currentSeasonMultiplier = seasonMultiplier[season as keyof typeof seasonMultiplier] || 1.0;

    // Check temperature suitability
    const chunkTemp = chunk.temperature || 20; // Default to 20°C if not set
    const [minTemp, maxTemp] = tempRange;
    let tempFactor = 1.0;
    let state: EnvironmentalState = 'SUITABLE';
    let reason = 'Conditions are favorable';

    if (chunkTemp < minTemp || chunkTemp > maxTemp) {
        // Temperature is outside suitable range
        state = 'UNSUITABLE';
        reason = `Temperature ${chunkTemp}°C is outside ideal range [${minTemp}–${maxTemp}°C]`;
        tempFactor = 0; // No growth in unsuitable conditions
    } else if (
        (chunkTemp < minTemp + 5 || chunkTemp > maxTemp - 5) ||
        (chunk.moisture || 0) < 20 ||
        (chunk.lightLevel || 0) < 20
    ) {
        // Conditions are marginal but survivable
        state = 'UNFAVORABLE';
        reason = 'Conditions are marginal; growth is slow';
        tempFactor = 0.5; // Reduced growth
    }

    // If already unsuitable, don't bother with further calculations
    if (state === 'UNSUITABLE') {
        return { multiplier: 0, state, reason };
    }

    // Calculate raw multiplier
    const rawMultiplier = state === 'UNFAVORABLE'
        ? (moistureFactor + lightFactor + currentSeasonMultiplier) / 3 * 0.5 // 50% reduction
        : (moistureFactor + lightFactor + currentSeasonMultiplier) / 3;

    const finalMultiplier = Math.max(0.1, rawMultiplier * (1 - humanPenaltyFactor));

    return {
        multiplier: finalMultiplier,
        state,
        reason
    };
};

/**
 * Sample a discrete geometric waiting time (in ticks) given success probability p in (0,1].
 * Returns the number of ticks to wait (>= 1). Uses provided RNG.
 */
const sampleGeometricWait = (p: number, rng: RNG): number => {
    if (p <= 0) return Infinity as any; // caller should treat as no-event
    if (p >= 1) return 1;
    // Ensure U in (0,1]
    let u = rng.float();
    if (u <= 0) u = Number.EPSILON;
    // k = ceil( log(U) / log(1-p) )
    const k = Math.ceil(Math.log(u) / Math.log(1 - p));
    return Math.max(1, k);
};

/**
 * Schedule the next event tick for a part using chunk-level env multiplier.
 * Returns integer tick or null if no event will ever occur (p_eff <= 0).
 * rngSeed may be any value accepted by createRng (string|number).
 */
export function scheduleNextEvent(part: any, chunkEnvMultiplier: number, nowTick: number, rngSeed: string | number): number | null {
    const rng = createRng(rngSeed);
    const baseP = (part.growProb || 0);
    const pEff = Math.max(0, Math.min(0.95, baseP * (chunkEnvMultiplier || 1)));
    if (!(pEff > 0)) return null;
    const wait = sampleGeometricWait(pEff, rng);
    if (!isFinite(wait)) return null;
    return nowTick + wait;
}

/**
 * Calculates the adaptive tick logic for a single plant.
 * Handles growth, dropping, and environmental impacts probabilistically.
 */
export function adaptivePlantTick({ plant, chunk, config, rngSeed, gameTime }: PlantTickInput): PlantTickOutput {
    if (!plant.plantProperties || !plant.plantProperties.parts) {
        return { newPlant: plant, envUpdates: {}, droppedItems: [], narrativeEvents: [] };
    }

    let newPlant: CreatureDefinition = { ...plant };
    let newParts = newPlant.plantProperties!.parts ? [...newPlant.plantProperties!.parts] : []; // Non-null assertion after check
    const droppedItems: PlantTickOutput['droppedItems'] = [];
    const narrativeEvents: PlantTickOutput['narrativeEvents'] = [];
    let plantRemoved = false;

    const rng = createRng(rngSeed);
    const envResult = calculateEnvironmentalMultiplier(chunk, config, gameTime, plant);
    const envMultiplier = envResult.multiplier;
    const totalMaxQty = newParts.reduce((sum, part) => sum + part.maxQty, 0);
    let totalCurrentQty = newParts.reduce((sum, part) => sum + (part.currentQty || 0), 0);
    let livingPartsCount = newParts.filter(p => (p.currentQty || 0) > 0).length;

    // Track parent part quantities to check triggerFrom dependencies
    const partQuantities: Record<string, number> = newParts.reduce((acc, p) => {
        acc[p.name] = p.currentQty || 0;
        return acc;
    }, {} as Record<string, number>);

    newParts = newParts.map(part => {
        let newPart = { ...part };
        let currentQty = newPart.currentQty || 0;

        // Ensure plantProperties is not undefined before accessing it within the loop
        if (!newPlant.plantProperties) {
            return newPart;
        }

        // Check triggerFrom dependency
        if (newPart.triggerFrom && partQuantities[newPart.triggerFrom] === 0) {
            // If the parent part has no quantity, this part cannot grow
            return newPart;
        }

        // --- Growth Probability ---
        const growProb = newPart.growProb * envMultiplier;
        if (currentQty < newPart.maxQty && rng.float() < growProb) {
            newPart.currentQty = Math.min(newPart.maxQty, currentQty + 1);
            narrativeEvents.push({ key: 'growEvent', params: { part: newPart.name, target: getTranslatedText(newPlant.name, 'en') } });
        }

        // --- Drop/Decay Probability ---
        const dropProb = newPart.dropProb * envMultiplier; // Env multiplier affects decay too (e.g., drought increases decay)
        const windFactor = (chunk.windLevel || 0) / 100; // Wind increases drop chance
        const finalDropProb = dropProb + (newPart.name === 'leaves' ? windFactor * 0.005 : 0); // Leaves more affected by wind

        if (currentQty > 0 && rng.float() < finalDropProb) {
            newPart.currentQty = currentQty - 1;
            narrativeEvents.push({ key: 'dropEvent', params: { part: newPart.name, target: getTranslatedText(newPlant.name, 'en') } });

            // Add dropped loot to list
            if (newPart.droppedLoot && newPart.droppedLoot.length > 0) {
                newPart.droppedLoot.forEach((lootDef: LootDrop) => { // Explicitly type lootDef
                    if (rng.float() < lootDef.chance) {
                        const quantity = rng.int(lootDef.quantity.min, lootDef.quantity.max);
                        if (quantity > 0) {
                            droppedItems.push({ name: lootDef.name, quantity, sourcePlantId: newPlant.id || 'unknown' });
                        }
                    }
                });
            }
        }
        return newPart;
    });

    // Re-check plantProperties before accessing
    if (!newPlant.plantProperties) {
        return { newPlant: plant, envUpdates: {}, droppedItems: [], narrativeEvents: [], plantRemoved: true }; // Should not happen with initial check
    }

    // Update total current quantity after all parts have been processed
    totalCurrentQty = newParts.reduce((sum, part) => sum + (part.currentQty || 0), 0);
    livingPartsCount = newParts.filter(p => (p.currentQty || 0) > 0).length;

    // --- Environmental Impacts (Bi-Directional) ---
    const envUpdates: PlantTickOutput['envUpdates'] = {};
    const currentVegetationRatio = totalCurrentQty / Math.max(1, totalMaxQty);

    // Shade effect from leaves
    const leavesPart = newParts.find(p => p.name === 'leaves');
    if (leavesPart && (leavesPart.currentQty || 0) > (leavesPart.maxQty || 0) / 2) {
        envUpdates.lightLevelDelta = -Math.floor((leavesPart.currentQty || 0) / (leavesPart.maxQty || 1) * 3); // -0 to -3 light
    } else if (leavesPart && (leavesPart.currentQty || 0) === 0) {
        envUpdates.lightLevelDelta = 1; // Slight light increase if no leaves
    }

    // Nutrition from roots
    const rootsPart = newParts.find(p => p.name === 'roots');
    if (rootsPart && (rootsPart.currentQty || 0) > 0) {
        envUpdates.nutritionDelta = 0.05 * (rootsPart.currentQty || 0); // Increase chunk nutrition slightly
    }

    // Creature attraction from fruits
    const fruitsPart = newParts.find(p => p.name === 'fruits');
    if (fruitsPart && (fruitsPart.currentQty || 0) > 0) {
        envUpdates.attractCreaturesDelta = 0.1 * (fruitsPart.currentQty || 0); // Increase chance for creatures
    }

    // Overall vegetation density contribution from total current parts
    envUpdates.vegetationDensityDelta = (newPlant.plantProperties.vegetationContribution || 0) * (currentVegetationRatio - (newPlant.plantProperties.initialVegetationRatio || 0)); // initialVegetationRatio should be defined or default to 0

    // Check if plant wilts/dies (all parts gone or severely low)
    if (livingPartsCount === 0 && totalCurrentQty === 0) {
        plantRemoved = true;
        narrativeEvents.push({ key: 'plantWilts', params: { target: getTranslatedText(newPlant.name, 'en') } });
    }

    newPlant.plantProperties.parts = newParts;

    return { newPlant, envUpdates, droppedItems, narrativeEvents, plantRemoved };
}
