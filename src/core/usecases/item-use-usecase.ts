/**
 * @file src/core/usecases/item-use-usecase.ts
 * @description Pure domain logic for item consumption
 * 
 * @remarks
 * Implements: Satiety restoration, Difficulty-based risk, Poison on failure, Effect application.
 * This is completely pure: no React, no side effects, no async.
 * Takes PlayerStatus + Item, returns [newPlayerState, effects[], events[]].
 */

import { PlayerStatus } from '@/core/types/player';
import { Item } from '@/core/types/items';
import { Effect, EffectType } from '@/core/types/effects';
import { VisualEvent } from './actions/result-types';

interface ItemUseInput {
  player: PlayerStatus;
  item: Item;
  diceRoll: number; // d20 result (1-20)
}

interface ItemUseOutput {
  newPlayerState: PlayerStatus;
  addedEffects: Effect[];
  visualEvents: VisualEvent[];
}

/**
 * Executes item consumption logic.
 * 
 * @remarks
 * **Flow:**
 * 1. Determine difficulty from item rarity
 * 2. Compare player's d20 roll vs difficulty
 * 3. **Success:** Apply positive effects (satiety/health restore)
 * 4. **Failure:** Apply negative effect (poison) and pain effect
 * 5. Consume item from inventory (quantity -= 1)
 * 6. Return updated state + effects + events
 * 
 * **Example:**
 * - Player eats "Exotic Mushroom" (rarity='exotic', difficulty=18)
 * - Roll d20, get 10
 * - 10 < 18 = FAILURE
 * - Instead of +30 satiety, player gets POISON (5 damage/turn for 3 turns)
 * - Mushroom removed from inventory
 * 
 * @param input - Player state, item, and dice roll result
 * @returns Updated player state, new effects, and visual feedback
 */
export function executeItemUse(input: ItemUseInput): ItemUseOutput {
  const { player, item, diceRoll } = input;
  const events: VisualEvent[] = [];
  const addedEffects: Effect[] = [];
  let newPlayerState = { ...player };

  // Step 1: Determine item difficulty based on rarity
  const difficultyMap: Record<string, number> = {
    common: 5,
    uncommon: 10,
    rare: 15,
    epic: 18,
    legendary: 20,
  };
  const difficulty = difficultyMap[item.rarity || 'common'] || 5;

  // Step 2: Check success (dice roll vs difficulty)
  const isSuccess = diceRoll >= difficulty;

  if (isSuccess) {
    // === SUCCESS CASE ===
    // Extract display name safely (handle both string and InlineTranslation)
    const itemName = typeof item.name === 'string' 
      ? item.name 
      : (item.name as any).en || 'an item';
    
    events.push({
      type: 'SHOW_TOAST',
      message: `You used ${itemName}`,
      severity: 'success',
    });
    events.push({
      type: 'PLAY_SOUND',
      soundId: 'item_use_success',
      volume: 0.7,
    });

    // Apply positive effects based on item type
    if (item.type === 'consumable') {
      // Restore satiety (food)
      const satietyRestore = item.value || 10;
      newPlayerState = {
        ...newPlayerState,
        satiety: Math.min(100, Math.max(0, newPlayerState.satiety) + satietyRestore),
      };

      if (item.effects && item.effects.length > 0) {
        // Item has defined effects (potions, special foods)
        addedEffects.push(...item.effects);

        // Show effect toast
        events.push({
          type: 'SHOW_TOAST',
          message: `Gained ${item.effects.length} effect(s)`,
          severity: 'info',
        });
      }
    }

    // Show positive visual feedback
    events.push({
      type: 'PARTICLE_EFFECT',
      effectId: 'item_use_sparkles',
      position: { x: 0, y: 0 }, // TODO: Use actual player position
    });
  } else {
    // === FAILURE CASE ===
    // Extract display name safely (handle both string and InlineTranslation)
    const itemName = typeof item.name === 'string' 
      ? item.name 
      : (item.name as any).en || 'the item';
    
    events.push({
      type: 'SHOW_TOAST',
      message: `${itemName} didn't agree with you!`,
      severity: 'warning',
    });
    events.push({
      type: 'PLAY_SOUND',
      soundId: 'item_use_failure',
      volume: 1.0,
    });
    events.push({
      type: 'SCREEN_SHAKE',
      intensity: 'LOW',
      duration: 300,
    });

    // Apply failure effect (usually poison)
    if (item.failureEffect) {
      const failureEffect: Effect = {
        id: `poison_${Date.now()}_${Math.random()}`,
        name: { en: 'Poisoned', vi: 'Nhiễm độc' },
        description: { en: 'Taking damage over time', vi: 'Bị mất máu theo thời gian' },
        type: EffectType.DAMAGE_OVER_TIME,
        target: 'self' as any,
        value: item.failureEffect.value || 5,
        modifier: { type: 'flat', value: item.failureEffect.value || 5 },
        duration: item.failureEffect.duration || 3,
        tickRate: 1,
        source: `item_${item.id}`,
      };
      addedEffects.push(failureEffect);

      // Apply immediate damage
      newPlayerState = {
        ...newPlayerState,
        hp: Math.max(0, newPlayerState.hp - failureEffect.value),
      };

      // Show damage number
      events.push({
        type: 'SHOW_DAMAGE_NUMBER',
        value: failureEffect.value,
        position: { x: 0, y: -20 },
        isCrit: false,
        color: '#FF6B6B',
      });
    } else {
      // No specific failure effect defined; apply generic poison
      const poisonEffect: Effect = {
        id: `poison_${Date.now()}_${Math.random()}`,
        name: { en: 'Food Poisoning', vi: 'Ngộ độc thực phẩm' },
        description: { en: 'Stomach ache', vi: 'Đau dạ dày' },
        type: EffectType.DAMAGE_OVER_TIME,
        target: 'self' as any,
        value: 3,
        modifier: { type: 'flat', value: 3 },
        duration: 4,
        tickRate: 1,
        source: `item_${item.id}`,
      };
      addedEffects.push(poisonEffect);

      newPlayerState = {
        ...newPlayerState,
        hp: Math.max(0, newPlayerState.hp - 3),
      };

      events.push({
        type: 'SHOW_DAMAGE_NUMBER',
        value: 3,
        position: { x: 0, y: -20 },
        isCrit: false,
        color: '#FF6B6B',
      });
    }
  }

  // Step 3: Remove item from inventory (consumed)
  newPlayerState = {
    ...newPlayerState,
    items: newPlayerState.items
      .map((invItem) =>
        invItem.id === item.id
          ? { ...invItem, quantity: Math.max(0, (invItem.quantity || 1) - 1) }
          : invItem
      )
      .filter((invItem) => invItem.quantity > 0), // Remove items with 0 quantity
  };

  return {
    newPlayerState,
    addedEffects,
    visualEvents: events,
  };
}
