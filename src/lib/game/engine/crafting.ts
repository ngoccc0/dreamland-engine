
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

/**
 * Assessment of how craftable a recipe is based on current player inventory.
 * Used by UI to show crafting progress and missing requirements.
 *
 * Score calculation: available_ingredients / total_required_ingredients
 * - 1.0 = all ingredients available (ready to craft)
 * - 0.5 = half ingredients available (partially ready)
 * - 0.0 = no ingredients available (cannot craft)
 */
export interface CraftabilityInfo {
    score: number;  // Percentage of available ingredients (0-1), used for UI progress bars
    missingIngredients: string[];  // Names of ingredients not available in sufficient quantity
    availableIngredients: string[];  // Names of ingredients that are available and sufficient
}

/**
 * Comprehensive result of crafting feasibility analysis. This interface encapsulates
 * all information needed to display crafting status and execute the craft.
 *
 * Data flow: RecipeSchema + PlayerInventory + ItemDefinitions → CraftingOutcome → UI/CraftingExecution
 *
 * Key calculations within this structure:
 * - canCraft: canCraftAllIngredients AND hasRequiredTool
 * - chance: Based on worst substitution quality (1=100%, 2=50%, 3=10%)
 * - ingredientsToConsume: Deduplicated list of actual items to remove from inventory
 * - resolvedIngredients: Detailed mapping of requirements to available substitutes
 */
export interface CraftingOutcome {
    canCraft: boolean;  // True if all requirements met and craft can proceed
    chance: number;  // Success probability percentage (0-100), affected by material quality
    hasRequiredTool: boolean;  // Whether player has the tool specified in recipe.requiredTool
    ingredientsToConsume: { name: string; quantity: number }[];  // Actual items to remove from inventory
    resolvedIngredients: {  // Detailed breakdown of each ingredient requirement
        requirement: RecipeIngredient;  // Original recipe requirement
        usedItem: { name: TranslatableString, tier: number };  // Item that will be used (may be substitute)
        isSubstitute: boolean;  // Whether this is a substitute rather than exact match
        hasEnough: boolean;  // Whether player has sufficient quantity
        playerQuantity: number;  // How many of this item the player actually has
    }[];
    craftability?: CraftabilityInfo;  // Optional UI helper for showing crafting readiness
}
import { getTranslatedText, resolveItemId } from "@/lib/utils";

/**
 * Core crafting feasibility algorithm that analyzes player inventory against recipe requirements.
 * This pure function performs complex substitution matching and quality-based calculations
 * to determine crafting viability without modifying any game state.
 *
 * Algorithm breakdown:
 * 1. **Tool Verification**: Checks recipe.requiredTool against player inventory using multiple ID resolution strategies
 * 2. **Ingredient Resolution Loop**: For each recipe ingredient:
 *    - Finds all possible substitutes via ItemRelationshipSchema.substituteFor
 *    - Sorts substitutes by quality (lower = better)
 *    - Selects best available substitute that meets quantity requirements
 *    - Tracks worst quality used for success chance calculation
 * 3. **Success Probability**: Based on substitution quality tiers:
 *    - Quality 1 (perfect/exact match): 100% success
 *    - Quality 2 (good substitute): 50% success
 *    - Quality 3 (poor substitute): 10% success
 * 4. **Consumption Planning**: Deduplicates ingredients and calculates total quantities to remove
 * 5. **Craftability Scoring**: Percentage of ingredients available for UI feedback
 *
 * Item matching complexity:
 * - Supports 4 identification methods: explicit ID, resolved ID, English name, relationship lookup
 * - Handles legacy data migration with fallback matching strategies
 * - Prioritizes exact matches over substitutes, quality over availability
 *
 * Performance characteristics:
 * - O(n*m*p) where n=ingredients, m=player items, p=item registry size
 * - Substitution lookup is the most expensive operation
 * - Results are cached by calling systems for repeated calculations
 *
 * @param {PlayerItem[]} playerItems - The player's current inventory items with quantities
 * @param {Recipe} recipe - The recipe schema defining crafting requirements
 * @param {Record<string, ItemDefinition>} allItemDefinitions - Complete item registry for relationship lookups
 * @returns {CraftingOutcome} Comprehensive analysis of crafting feasibility and requirements
 *
 * @example
 * ```typescript
 * const outcome = calculateCraftingOutcome(player.items, recipes['torch'], allItems);
 * if (outcome.canCraft && outcome.chance > 50) {
 *   console.log(`Ready to craft with ${outcome.chance}% success rate`);
 *   // outcome.ingredientsToConsume shows exactly what will be used
 * }
 * ```
 */
export const calculateCraftingOutcome = (
    playerItems: PlayerItem[],
    recipe: Recipe,
    allItemDefinitions: Record<string, ItemDefinition>
): CraftingOutcome => {
    // Helper to robustly resolve a player's item to a canonical id.
    // Try explicit `id`, then resolver using English and Vietnamese fallbacks,
    // then fall back to translated text strings. This helps handle items stored
    // as localized strings or inline translation objects.
    const getPlayerItemId = (pi: PlayerItem | { name?: any; id?: string } | undefined): string | undefined => {
        if (!pi) return undefined;
        // If item already has an id, validate it against known definitions.
        // Some saved/legacy items may have an `id` that is actually a translated string
        // (e.g., "Sturdy Branch") which will not match recipe ids like `sturdy_branch`.
        // Only accept the existing id if it exists in the provided definitions.
        const existingId = (pi as any).id;
        if (existingId) {
            if (allItemDefinitions && allItemDefinitions[existingId]) return existingId;
            // otherwise fall through to attempt resolving from the item's name
        }
        // Try resolver with English then Vietnamese
        const byEn = resolveItemId((pi as any).name, allItemDefinitions, undefined, 'en');
        if (byEn) return byEn;
        const byVi = resolveItemId((pi as any).name, allItemDefinitions, undefined, 'vi');
        if (byVi) return byVi;
        // Fallback to raw translations
        try {
            const nameEn = getTranslatedText((pi as any).name as TranslatableString, 'en');
            if (nameEn && allItemDefinitions[nameEn]) return nameEn;
        } catch (e) {
            // ignore
        }
        try {
            const nameVi = getTranslatedText((pi as any).name as TranslatableString, 'vi');
            if (nameVi && allItemDefinitions[nameVi]) return nameVi;
        } catch (e) {
            // ignore
        }
        return undefined;
    };
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
        // Try robust resolver to map the player's item to a canonical id (checks en/vi)
        getPlayerItemId(item) === recipe.requiredTool ||
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
            const playerItem = playerItems.find(pi => {
                // Prefer explicit id on player item
                if ((pi as any).id && (pi as any).id === possible.id) return true;
                // Resolve the player's item name to an id using robust resolver
                const playerId = getPlayerItemId(pi);
                if (playerId && playerId === possible.id) return true;
                // Legacy fallback to English-name comparison
                if (getTranslatedText(pi.name, 'en') === possible.id) return true;
                if (getTranslatedText(pi.name, 'en') === possible.name) return true;
                return false;
            });
            if (playerItem && playerItem.quantity >= requirement.quantity) {
                bestAvailable = { item: playerItem, quality: possible.quality };
                break;
            }
        }
        
        const playerItemForQtyCheck = playerItems.find(pi => {
            if ((pi as any).id === requirement.name) return true;
            const playerId = getPlayerItemId(pi);
            if (playerId && playerId === requirement.name) return true;
            if (getTranslatedText(pi.name, 'en') === requirement.name) return true;
            return false;
        });
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
