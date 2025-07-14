
/**
 * @fileOverview Contains the core logic for the game's crafting system.
 * @description This file provides functions to determine the outcome of a crafting attempt,
 * including checking for required tools, substituting ingredients, and calculating the
 * success chance based on the quality of materials used.
 */

import type { PlayerItem, Recipe, ItemDefinition, CraftingOutcome } from "../types";
import { getTranslatedText } from "@/lib/utils";

/**
 * @description Calculates the outcome of a crafting attempt based on the player's inventory and a given recipe.
 * This function is a pure calculation and does not modify any state. It determines if the craft
 * is possible, what the success chance is, and which items would be consumed.
 *
 * @param {PlayerItem[]} playerItems - The player's current inventory.
 * @param {Recipe} recipe - The recipe the player is attempting to craft.
 * @param {Record<string, ItemDefinition>} allItemDefinitions - A map of all available item definitions for looking up relationships.
 * @returns {CraftingOutcome} An object detailing the potential outcome of the craft.
 * @example
 * const outcome = calculateCraftingOutcome(player.items, recipes['torch'], allItems);
 * if (outcome.canCraft) {
 *   console.log(`Success chance: ${outcome.chance}%`);
 * }
 */
export const calculateCraftingOutcome = (
    playerItems: PlayerItem[], 
    recipe: Recipe,
    allItemDefinitions: Record<string, ItemDefinition>
): CraftingOutcome => {
    const resolvedIngredients: CraftingOutcome['resolvedIngredients'] = [];
    const ingredientsToConsumeMap = new Map<string, number>();
    let worstTier = 1;
    let canCraftAllIngredients = true;

    const hasRequiredTool = !recipe.requiredTool || playerItems.some(item => getTranslatedText(item.name, 'en') === recipe.requiredTool);

    for (const requirement of recipe.ingredients) {
        let bestAvailable: { item: PlayerItem, quality: number } | null = null;
        
        const possibleItems = Object.entries(allItemDefinitions)
            .filter(([_, def]) => def.relationship?.substituteFor === requirement.name || _ === requirement.name)
            .map(([name, def]) => ({ name, quality: def.relationship?.quality ?? 1 }));
            
        // Also add the primary ingredient itself if not already included via relationship
        if (!possibleItems.some(p => p.name === requirement.name)) {
            possibleItems.push({ name: requirement.name, quality: 1 });
        }
        
        // Find the best quality substitute the player has enough of
        possibleItems.sort((a, b) => a.quality - b.quality);
        
        for (const possible of possibleItems) {
            const playerItem = playerItems.find(pi => getTranslatedText(pi.name, 'en') === possible.name);
            if (playerItem && playerItem.quantity >= requirement.quantity) {
                bestAvailable = { item: playerItem, quality: possible.quality };
                break;
            }
        }
        
        const playerItemForQty = playerItems.find(pi => pi.name === (bestAvailable?.item.name || requirement.name));
        const playerQuantity = playerItemForQty ? getTranslatedText(playerItemForQty.name, 'en') === getTranslatedText(requirement.name, 'en') ? playerItemForQty.quantity : 0 : 0;


        if (bestAvailable) {
            resolvedIngredients.push({
                requirement,
                usedItem: { name: bestAvailable.item.name, tier: bestAvailable.quality },
                isSubstitute: getTranslatedText(bestAvailable.item.name, 'en') !== requirement.name,
                hasEnough: true,
                playerQuantity
            });
            worstTier = Math.max(worstTier, bestAvailable.quality);
            const consumptionKey = getTranslatedText(bestAvailable.item.name, 'en');
            const currentConsumption = ingredientsToConsumeMap.get(consumptionKey) || 0;
            ingredientsToConsumeMap.set(consumptionKey, currentConsumption + requirement.quantity);
        } else {
            canCraftAllIngredients = false;
            resolvedIngredients.push({
                requirement,
                usedItem: { name: requirement.name, tier: 1 },
                isSubstitute: false,
                hasEnough: false,
                playerQuantity
            });
        }
    }

    const canCraft = canCraftAllIngredients && hasRequiredTool;
    let chance = 100;
    if (worstTier === 2) chance = 50;
    if (worstTier === 3) chance = 10;
    if (!canCraft) chance = 0;

    return {
        canCraft,
        chance,
        hasRequiredTool,
        ingredientsToConsume: Array.from(ingredientsToConsumeMap.entries()).map(([name, quantity]) => ({ name, quantity })),
        resolvedIngredients
    };
};
