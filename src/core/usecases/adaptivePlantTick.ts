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
 * Calculates the environmental multiplier for plant growth/decay.
 * This combines moisture, light, season, and human presence.
 * Factors are normalized and averaged to create a single multiplier.
 */
const calculateEnvironmentalMultiplier = (chunk: Chunk, config: GameConfig, gameTime: number): number => {
    const { plant: plantConfig } = config;
    const { seasonMultiplier } = plantConfig;

    const moistureFactor = (chunk.moisture || 0) / 100;
    const lightFactor = (chunk.lightLevel || 0) / 100;
    const humanPenaltyFactor = (chunk.humanPresence || 0) / 100 * plantConfig.humanPenaltyFactor; // Higher penalty for higher human presence

    // Determine current season (simplified for now, can be expanded)
    const season = ['winter', 'spring', 'summer', 'autumn'][Math.floor((gameTime / 100) % 4)]; // Example: 100 ticks per season
    const currentSeasonMultiplier = seasonMultiplier[season as keyof typeof seasonMultiplier] || 1.0;

    // Average of factors, penalized by human presence
    const rawMultiplier = (moistureFactor + lightFactor + currentSeasonMultiplier) / 3;
    return Math.max(0.1, rawMultiplier * (1 - humanPenaltyFactor)); // Ensure a minimum multiplier
};

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
    const envMultiplier = calculateEnvironmentalMultiplier(chunk, config, gameTime);
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
