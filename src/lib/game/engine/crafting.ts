
import type { PlayerItem, Recipe, ItemDefinition, CraftingOutcome } from "../types";

// --- CRAFTING SYSTEM ---
export const calculateCraftingOutcome = (
    playerItems: PlayerItem[], 
    recipe: Recipe,
    allItemDefinitions: Record<string, ItemDefinition>
): CraftingOutcome => {
    const resolvedIngredients: CraftingOutcome['resolvedIngredients'] = [];
    const ingredientsToConsumeMap = new Map<string, number>();
    let worstTier = 1;
    let canCraftAllIngredients = true;

    const hasRequiredTool = !recipe.requiredTool || playerItems.some(item => item.name === recipe.requiredTool);

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
            const playerItem = playerItems.find(pi => pi.name === possible.name);
            if (playerItem && playerItem.quantity >= requirement.quantity) {
                bestAvailable = { item: playerItem, quality: possible.quality };
                break;
            }
        }
        
        const playerQuantity = playerItems.find(pi => pi.name === (bestAvailable?.item.name || requirement.name))?.quantity || 0;

        if (bestAvailable) {
            resolvedIngredients.push({
                requirement,
                usedItem: { name: bestAvailable.item.name, tier: bestAvailable.quality },
                isSubstitute: bestAvailable.item.name !== requirement.name,
                hasEnough: true,
                playerQuantity
            });
            worstTier = Math.max(worstTier, bestAvailable.quality);
            const currentConsumption = ingredientsToConsumeMap.get(bestAvailable.item.name) || 0;
            ingredientsToConsumeMap.set(bestAvailable.item.name, currentConsumption + requirement.quantity);
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
