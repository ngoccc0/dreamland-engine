
/**
 * Core implementation of the game's crafting system engine. This module orchestrates
 * the complex interactions between Recipe schemas, ItemDefinition data, and player inventory
 * to determine crafting feasibility, success probabilities, and resource consumption.
 *
 * Key responsibilities:
 * - Ingredient validation and substitution matching using ItemRelationshipSchema
 * - Tool requirement verification against player inventory
 * - Success probability calculation based on material quality and substitution penalties
 * - Resource consumption planning and inventory impact assessment
 * - Crafting feasibility scoring for UI display
 *
 * Data flow and interdependencies:
 * 1. RecipeSchema → provides crafting requirements and constraints
 * 2. ItemDefinitionSchema → supplies item properties and relationships
 * 3. Player inventory → checked for available materials and tools
 * 4. CraftingOutcome → returned to UI for display and execution
 * 5. Inventory system → updated with consumed ingredients and crafted results
 *
 * Algorithm complexity:
 * - O(n*m) where n=recipe ingredients, m=player inventory items
 * - Substitution lookup requires full item registry scan
 * - Quality-based sorting ensures optimal material selection
 */

import type { PlayerItem, Recipe, ItemDefinition, TranslatableString, RecipeIngredient } from "../types";

export interface CraftabilityInfo {
    score: number;  // Percentage of available ingredients (0-1)
    missingIngredients: string[];  // Names of missing ingredients
    availableIngredients: string[];  // Names of available ingredients
}

export interface CraftingOutcome {
    canCraft: boolean;
    chance: number;
    hasRequiredTool: boolean;
    ingredientsToConsume: { name: string; quantity: number }[];
    resolvedIngredients: {
        requirement: RecipeIngredient;
        usedItem: { name: TranslatableString, tier: number };
        isSubstitute: boolean;
        hasEnough: boolean;
        playerQuantity: number;
    }[];
    craftability?: CraftabilityInfo;
}
import { getTranslatedText, resolveItemId } from "@/lib/utils";

/**
 * Calculates the outcome of a crafting attempt based on the player's inventory and a given recipe.
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
    let availableIngredientsCount = 0;
    const missingIngredients: string[] = [];
    const availableIngredients: string[] = [];

    const hasRequiredTool = !recipe.requiredTool || playerItems.some(item => (
        // Prefer explicit id comparison
        (item as any).id === recipe.requiredTool ||
        // Try resolver to map the player's item to a canonical id
        resolveItemId(item.name, allItemDefinitions) === recipe.requiredTool ||
        // Fallback to legacy English name match
        getTranslatedText(item.name, 'en') === recipe.requiredTool
    ));

    for (const requirement of recipe.ingredients) {
        let bestAvailable: { item: PlayerItem, quality: number } | null = null;
        
        const possibleItems = Object.entries(allItemDefinitions)
            .filter(([key, def]) => (
                def.relationship?.substituteFor === requirement.name ||
                def.id === requirement.name ||
                key === requirement.name ||
                getTranslatedText(def.name, 'en') === requirement.name
            ))
            .map(([key, def]) => ({ id: def.id ?? key, name: getTranslatedText(def.name, 'en'), quality: def.relationship?.quality ?? 1 }));
            
        // Also add the primary ingredient itself if not already included via relationship
        if (!possibleItems.some(p => p.id === requirement.name)) {
            possibleItems.push({ id: requirement.name, name: requirement.name, quality: 1 });
        }
        
        // Find the best quality substitute the player has enough of
        possibleItems.sort((a, b) => a.quality - b.quality);
        
        for (const possible of possibleItems) {
            const playerItem = playerItems.find(pi => (
                // Prefer explicit id on player item
                ((pi as any).id && (pi as any).id === possible.id) ||
                // Resolve the player's item name to an id and compare
                resolveItemId(pi.name, allItemDefinitions) === possible.id ||
                // Legacy fallback to English-name comparison
                getTranslatedText(pi.name, 'en') === possible.id ||
                getTranslatedText(pi.name, 'en') === possible.name
            ));
            if (playerItem && playerItem.quantity >= requirement.quantity) {
                bestAvailable = { item: playerItem, quality: possible.quality };
                break;
            }
        }
        
        const playerItemForQtyCheck = playerItems.find(pi => (
            (pi as any).id === requirement.name ||
            resolveItemId(pi.name, allItemDefinitions) === requirement.name ||
            getTranslatedText(pi.name, 'en') === requirement.name
        ));
        const playerQuantity = playerItemForQtyCheck ? playerItemForQtyCheck.quantity : 0;

        if (bestAvailable) {
            resolvedIngredients.push({
                requirement,
                usedItem: { name: bestAvailable.item.name, tier: bestAvailable.quality },
                // Determine substitute status by comparing canonical ids when possible
                isSubstitute: !(((bestAvailable.item as any).id && (bestAvailable.item as any).id === requirement.name) || resolveItemId(bestAvailable.item.name, allItemDefinitions) === requirement.name || getTranslatedText(bestAvailable.item.name, 'en') === requirement.name),
                hasEnough: true,
                playerQuantity
            });
            availableIngredientsCount++;
            availableIngredients.push(getTranslatedText(bestAvailable.item.name, 'en'));
            worstTier = Math.max(worstTier, bestAvailable.quality);
            const consumptionKey = getTranslatedText(bestAvailable.item.name, 'en');
            const currentConsumption = ingredientsToConsumeMap.get(consumptionKey) || 0;
            ingredientsToConsumeMap.set(consumptionKey, currentConsumption + requirement.quantity);
        } else {
            canCraftAllIngredients = false;
            resolvedIngredients.push({
                requirement,
                usedItem: { name: requirement.name as unknown as TranslatableString, tier: 1 },
                isSubstitute: false,
                hasEnough: false,
                playerQuantity
            });
            missingIngredients.push(requirement.name);
        }
    }

    const canCraft = canCraftAllIngredients && hasRequiredTool;
    let chance = 100;
    if (worstTier === 2) chance = 50;
    if (worstTier === 3) chance = 10;
    if (!canCraft) chance = 0;

    const craftability: CraftabilityInfo = {
        score: availableIngredientsCount / recipe.ingredients.length,
        missingIngredients,
        availableIngredients
    };

    return {
        canCraft,
        chance,
        hasRequiredTool,
        ingredientsToConsume: Array.from(ingredientsToConsumeMap.entries()).map(([name, quantity]) => ({ name, quantity })),
        resolvedIngredients,
        craftability
    };
};
