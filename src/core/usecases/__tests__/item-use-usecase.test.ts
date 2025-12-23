/**
 * @file src/core/usecases/__tests__/item-use-usecase.test.ts
 * @description Unit tests for item consumption logic
 * 
 * @remarks
 * Tests verify:
 * 1. Success case: roll >= difficulty -> restore satiety
 * 2. Failure case: roll < difficulty -> poison effect
 * 3. Inventory consumption: item removed regardless
 * 4. Visual feedback: correct events emitted
 * 5. Edge cases: no satiety (0), full satiety (100), missing failureEffect
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { executeItemUse } from '../item-use-usecase';
import { PlayerStatus } from '@/core/types/player';
import { Item, ItemType, ItemRarity } from '@/core/types/items';
import { EffectType } from '@/core/types/effects';

describe('itemUseUsecase', () => {
  let mockPlayer: PlayerStatus;
  let mockItem: Item;

  beforeEach(() => {
    // Setup: Player at 50% satiety
    mockPlayer = {
      name: 'Test Player',
      level: 1,
      experience: 0,
      hp: 100,
      mana: 50,
      stamina: 100,
      satiety: 50,
      bodyTemperature: 37,
      items: [
        {
          id: 'apple_1',
          name: { en: 'Apple', vi: 'Táo' },
          description: { en: 'A red apple', vi: 'Một quả táo đỏ' },
          type: ItemType.CONSUMABLE,
          rarity: ItemRarity.COMMON,
          value: 20,
          weight: 0.5,
          stackable: true,
          maxStack: 99,
          effects: [],
          quantity: 1,
        },
      ],
      equipment: { weapon: null, armor: null, accessory: null },
      quests: [],
      questsCompleted: 0,
      skills: [],
      persona: { name: 'Test', class: 'Warrior' } as any,
      attributes: {
        strength: 10,
        dexterity: 10,
        intelligence: 10,
        constitution: 10,
      },
      unlockProgress: { kills: 0, damageSpells: 0, moves: 0 },
    };

    // Common item (difficulty 5)
    mockItem = {
      id: 'apple_1',
      name: { en: 'Apple', vi: 'Táo' },
      description: { en: 'A red apple', vi: 'Một quả táo đỏ' },
      type: ItemType.CONSUMABLE,
      rarity: ItemRarity.COMMON,
      value: 20,
      weight: 0.5,
      stackable: true,
      maxStack: 99,
      effects: [],
      failureEffect: {
        type: EffectType.DAMAGE_OVER_TIME,
        value: 5,
        duration: 3,
      },
    };
  });

  describe('Success Case', () => {
    it('should increase satiety when roll >= difficulty', () => {
      // Common item difficulty is 5
      // Roll 10 >= 5 -> SUCCESS
      const result = executeItemUse({
        player: mockPlayer,
        item: mockItem,
        diceRoll: 10,
      });

      // Satiety increased by item.value (20)
      expect(result.newPlayerState.satiety).toBe(70); // 50 + 20

      // No poison effect added
      expect(result.addedEffects).toHaveLength(0);

      // Success toast shown
      expect(result.visualEvents).toContainEqual(
        expect.objectContaining({
          type: 'SHOW_TOAST',
          severity: 'success',
        })
      );
    });

    it('should cap satiety at 100', () => {
      // Player near full satiety
      mockPlayer.satiety = 95;

      const result = executeItemUse({
        player: mockPlayer,
        item: mockItem,
        diceRoll: 10,
      });

      // Satiety capped at 100 (95 + 20 = 115 -> 100)
      expect(result.newPlayerState.satiety).toBe(100);
    });

    it('should play success sound', () => {
      const result = executeItemUse({
        player: mockPlayer,
        item: mockItem,
        diceRoll: 10,
      });

      expect(result.visualEvents).toContainEqual(
        expect.objectContaining({
          type: 'PLAY_SOUND',
          soundId: 'item_use_success',
        })
      );
    });

    it('should remove item from inventory', () => {
      const result = executeItemUse({
        player: mockPlayer,
        item: mockItem,
        diceRoll: 10,
      });

      // Item removed from inventory (quantity -= 1, then filtered)
      expect(result.newPlayerState.items).toHaveLength(0);
    });
  });

  describe('Failure Case', () => {
    it('should apply poison when roll < difficulty', () => {
      // Common item difficulty is 5
      // Roll 3 < 5 -> FAILURE
      const result = executeItemUse({
        player: mockPlayer,
        item: mockItem,
        diceRoll: 3,
      });

      // Poison effect added
      expect(result.addedEffects).toHaveLength(1);
      expect(result.addedEffects[0]).toMatchObject({
        type: EffectType.DAMAGE_OVER_TIME,
        value: 5,
        duration: 3,
      });
    });

    it('should apply damage on failure', () => {
      const result = executeItemUse({
        player: mockPlayer,
        item: mockItem,
        diceRoll: 3,
      });

      // HP decreased by failureEffect.value (5)
      expect(result.newPlayerState.hp).toBe(95); // 100 - 5
    });

    it('should show warning toast on failure', () => {
      const result = executeItemUse({
        player: mockPlayer,
        item: mockItem,
        diceRoll: 3,
      });

      expect(result.visualEvents).toContainEqual(
        expect.objectContaining({
          type: 'SHOW_TOAST',
          severity: 'warning',
        })
      );
    });

    it('should shake screen on failure', () => {
      const result = executeItemUse({
        player: mockPlayer,
        item: mockItem,
        diceRoll: 3,
      });

      expect(result.visualEvents).toContainEqual(
        expect.objectContaining({
          type: 'SCREEN_SHAKE',
          intensity: 'LOW',
        })
      );
    });

    it('should still remove item from inventory on failure', () => {
      const result = executeItemUse({
        player: mockPlayer,
        item: mockItem,
        diceRoll: 3,
      });

      // Item consumed regardless of success
      expect(result.newPlayerState.items).toHaveLength(0);
    });
  });

  describe('Rare Item (Higher Difficulty)', () => {
    beforeEach(() => {
      mockItem.rarity = ItemRarity.RARE; // difficulty = 15
    });

    it('should require high roll for rare items', () => {
      // Roll 10 < 15 -> FAILURE
      const result = executeItemUse({
        player: mockPlayer,
        item: mockItem,
        diceRoll: 10,
      });

      // Should trigger poison (failure)
      expect(result.addedEffects).toHaveLength(1);
    });

    it('should succeed with high roll on rare items', () => {
      // Roll 18 >= 15 -> SUCCESS
      const result = executeItemUse({
        player: mockPlayer,
        item: mockItem,
        diceRoll: 18,
      });

      // Should restore satiety (success)
      expect(result.newPlayerState.satiety).toBe(70); // 50 + 20
      expect(result.addedEffects).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero satiety (starving)', () => {
      mockPlayer.satiety = 0;

      const result = executeItemUse({
        player: mockPlayer,
        item: mockItem,
        diceRoll: 10,
      });

      // Satiety restored from 0
      expect(result.newPlayerState.satiety).toBe(20); // 0 + 20
    });

    it('should clamp HP at 0 (not negative)', () => {
      mockPlayer.hp = 2; // Low health

      const result = executeItemUse({
        player: mockPlayer,
        item: mockItem,
        diceRoll: 3, // Failure: takes 5 damage
      });

      // HP clamped at 0 (2 - 5 = -3 -> 0)
      expect(result.newPlayerState.hp).toBe(0);
    });

    it('should use failureEffect if defined', () => {
      mockItem.failureEffect = {
        type: EffectType.DAMAGE_OVER_TIME,
        value: 8,
        duration: 4,
      };

      const result = executeItemUse({
        player: mockPlayer,
        item: mockItem,
        diceRoll: 1,
      });

      // Should use custom failureEffect (not generic poison)
      expect(result.addedEffects[0].value).toBe(8);
      expect(result.addedEffects[0].duration).toBe(4);

      // Damage matches failureEffect.value
      expect(result.newPlayerState.hp).toBe(92); // 100 - 8
    });

    it('should use generic poison if no failureEffect defined', () => {
      mockItem.failureEffect = undefined;

      const result = executeItemUse({
        player: mockPlayer,
        item: mockItem,
        diceRoll: 1,
      });

      // Should create generic poison
      expect(result.addedEffects[0]).toMatchObject({
        value: 3,
        duration: 4,
      });

      // Damage is 3 (generic poison)
      expect(result.newPlayerState.hp).toBe(97); // 100 - 3
    });
  });

  describe('Inventory Management', () => {
    it('should decrement item quantity', () => {
      // Item with quantity > 1
      mockPlayer.items[0].quantity = 5;

      const result = executeItemUse({
        player: mockPlayer,
        item: mockItem,
        diceRoll: 10,
      });

      // Quantity decreased (5 - 1 = 4)
      expect(result.newPlayerState.items[0].quantity).toBe(4);
    });

    it('should remove item when quantity reaches 0', () => {
      // Item with quantity = 1
      mockPlayer.items[0].quantity = 1;

      const result = executeItemUse({
        player: mockPlayer,
        item: mockItem,
        diceRoll: 10,
      });

      // Item removed entirely
      expect(result.newPlayerState.items).toHaveLength(0);
    });

    it('should handle multiple items in inventory', () => {
      mockPlayer.items = [
        {
          id: 'apple_1',
          name: { en: 'Apple', vi: 'Táo' },
          description: { en: 'Red apple', vi: 'Táo đỏ' },
          type: ItemType.CONSUMABLE,
          rarity: ItemRarity.COMMON,
          value: 20,
          weight: 0.5,
          stackable: true,
          maxStack: 99,
          effects: [],
          quantity: 3,
        },
        {
          id: 'mushroom_1',
          name: { en: 'Mushroom', vi: 'Nấm' },
          description: { en: 'Strange mushroom', vi: 'Nấm lạ' },
          type: ItemType.CONSUMABLE,
          rarity: ItemRarity.RARE,
          value: 15,
          weight: 0.3,
          stackable: true,
          maxStack: 50,
          effects: [],
          quantity: 1,
        },
      ];

      const result = executeItemUse({
        player: mockPlayer,
        item: mockItem,
        diceRoll: 10,
      });

      // Apple quantity decreased, mushroom unchanged
      expect(result.newPlayerState.items).toHaveLength(2);
      expect(result.newPlayerState.items[0].quantity).toBe(2);
      expect(result.newPlayerState.items[1].quantity).toBe(1);
    });
  });
});
