/**
 * Cooking Usecase
 *
 * @remarks
 * **Logic Flow:**
 * 1. Validate recipe and cooking type
 * 2. Select engine based on recipe.cookingType (CAMPFIRE | POT | OVEN)
 * 3. Call appropriate engine with ingredients + recipe + spice
 * 4. Consume ingredients from inventory (remove items)
 * 5. Add cooked items to inventory
 * 6. Create effect events (sounds, particles, notifications)
 * 7. Return new game state + effects array
 *
 * **Dependency Chain:**
 * - Campfire Engine: Pattern matching → merged kebab (success) or grilled items (fail)
 * - Pot Engine: Bowl calculation → multiple soup items with staggered dispense
 * - Oven Engine: Temperature quality → items with quality metadata
 *
 * **State Mutations:**
 * - inventory.items: Remove ingredients, add cooked items
 * - effects[]: Append all engine effects + success/error notification
 */

import type { GameState } from '@/core/domain/gamestate';
import type { Item } from '@/core/domain/item';
import type { ItemDefinition } from '@/core/types/definitions/item';
import type { CookingRecipe } from '@/core/types/definitions/cooking-recipe';
import type { GameEffect, GameNotification } from '@/core/types/game';
import { cookOnCampfire } from '@/core/engines/cooking/campfire';
import { cookInPot } from '@/core/engines/cooking/cooking-pot';
import { cookInOven } from '@/core/engines/cooking/oven';

export interface CookingInput {
  gameState: GameState;
  recipe: CookingRecipe;
  ingredientIds: string[]; // Items to consume
  itemDefinitions: Record<string, ItemDefinition>;
  temperature?: number; // Only for oven
  spiceItemId?: string; // Optional spice enhancement
}

export interface CookingOutput {
  success: boolean;
  gameState: GameState;
  effects: GameEffect[];
}

/**
 * Execute cooking action (campfire, pot, or oven)
 *
 * @param input - Cooking parameters (recipe, ingredients, optionally temperature)
 * @returns Updated game state + effects
 */
export function executeCooking(input: CookingInput): CookingOutput {
  const {
    gameState,
    recipe,
    ingredientIds,
    itemDefinitions,
    temperature,
    spiceItemId,
  } = input;

  // Collect ingredient items from inventory
  const ingredientItems: Item[] = [];
  const ingredientsToRemove: string[] = [];

  for (const itemId of ingredientIds) {
    const item = gameState.player.inventory.find((i: Item) => i.id === itemId);
    if (!item) {
      return {
        success: false,
        gameState,
        effects: [
          {
            type: 'NOTIFICATION',
            value: {
              en: 'Missing ingredient',
              vi: 'Thiếu nguyên liệu',
            },
          },
        ],
      };
    }
    ingredientItems.push(item);
    ingredientsToRemove.push(itemId);
  }

  // Collect spice item if provided
  let spiceItem: Item | null = null;
  if (spiceItemId) {
    spiceItem = gameState.player.inventory.find((i: Item) => i.id === spiceItemId) || null;
  }

  // Select and execute engine
  const effects: GameEffect[] = [];
  let cookedItems: Item[] = [];
  let engineSuccess = false;
  let message: { en: string; vi: string } = { en: '', vi: '' };

  if (recipe.cookingType === 'CAMPFIRE') {
    const result = cookOnCampfire(ingredientItems, recipe, itemDefinitions, spiceItem);
    cookedItems = result.items;
    engineSuccess = result.success;
    message = result.message;
    effects.push(...result.effects);
  } else if (recipe.cookingType === 'POT') {
    if (!spiceItem) {
      // POT requires water as special ingredient
      // For now, assume water is implicit (user selected pot means water available)
      // TODO: Pass explicit water item if needed
    }
    const result = cookInPot(ingredientItems, recipe, itemDefinitions, spiceItem, spiceItem);
    cookedItems = result.items;
    engineSuccess = result.success;
    message = result.message;
    effects.push(...result.effects);
  } else if (recipe.cookingType === 'OVEN') {
    if (!temperature) {
      return {
        success: false,
        gameState,
        effects: [
          {
            type: 'NOTIFICATION',
            value: { en: 'Temperature required for oven', vi: 'Cần nhiệt độ để nấu lò' },
          },
        ],
      };
    }
    const result = cookInOven(ingredientItems, recipe, temperature, itemDefinitions, spiceItem);
    cookedItems = result.items.map((r) => r.item);
    engineSuccess = result.success;
    message = result.message;
    effects.push(...result.effects);
  }

  // If cooking failed, don't consume ingredients
  if (!engineSuccess) {
    effects.push({
      type: 'NOTIFICATION',
      value: message,
    });
    return {
      success: false,
      gameState,
      effects,
    };
  }

  // Remove consumed ingredients
  const newInventoryItems = gameState.player.inventory.filter(
    (item: Item) => !ingredientsToRemove.includes(item.id)
  );

  // Add cooked items
  newInventoryItems.push(...cookedItems);

  // Create success notification
  effects.push({
    type: 'NOTIFICATION',
    value: message,
  });

  return {
    success: true,
    gameState: {
      ...gameState,
      player: {
        ...gameState.player,
        inventory: newInventoryItems,
      },
    },
    effects,
  };
}
