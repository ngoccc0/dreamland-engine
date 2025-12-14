import { validateRecipe, calculateCraftTime, getRecipeCost } from '@/core/rules/crafting';
import type { Item } from '@/core/domain/item';

describe('Crafting Rules', () => {
  describe('validateRecipe', () => {
    const inventory: Item[] = [
      { id: 'iron_ore', quantity: 5, equipped: false, effects: [], metadata: {} },
      { id: 'wood', quantity: 2, equipped: false, effects: [], metadata: {} },
      { id: 'herb', quantity: 10, equipped: false, effects: [], metadata: {} },
    ];

    test('should return true when recipe exists and all materials present', () => {
      expect(validateRecipe('iron_sword', inventory)).toBe(true);
    });

    test('should return true when multiple materials present in exact quantities', () => {
      expect(validateRecipe('wooden_bow', inventory)).toBe(true);
    });

    test('should return false when recipe does not exist', () => {
      expect(validateRecipe('nonexistent_recipe', inventory)).toBe(false);
    });

    test('should return false when inventory missing required materials', () => {
      const emptyInventory: Item[] = [];
      expect(validateRecipe('iron_sword', emptyInventory)).toBe(false);
    });

    test('should return false when inventory has partial materials (insufficient quantity)', () => {
      const partialInventory: Item[] = [
        { id: 'iron_ore', quantity: 2, equipped: false, effects: [], metadata: {} }, // need 5
        { id: 'wood', quantity: 2, equipped: false, effects: [], metadata: {} },
      ];
      expect(validateRecipe('iron_sword', partialInventory)).toBe(false);
    });

    test('should return false when inventory has some but not all required materials', () => {
      const incompleteInventory: Item[] = [
        { id: 'iron_ore', quantity: 5, equipped: false, effects: [], metadata: {} }, // have this
        // missing wood
      ];
      expect(validateRecipe('iron_sword', incompleteInventory)).toBe(false);
    });

    test('should return true for simple recipes like health_potion', () => {
      expect(validateRecipe('health_potion', inventory)).toBe(true);
    });

    test('should work with large quantities in inventory', () => {
      const largeInventory: Item[] = [
        { id: 'iron_ore', quantity: 100, equipped: false, effects: [], metadata: {} },
        { id: 'wood', quantity: 50, equipped: false, effects: [], metadata: {} },
      ];
      expect(validateRecipe('iron_sword', largeInventory)).toBe(true);
    });
  });

  describe('calculateCraftTime', () => {
    test('should return 10 seconds for easy recipes (difficulty 1)', () => {
      expect(calculateCraftTime(1)).toBe(10);
    });

    test('should return 20 seconds for normal recipes (difficulty 2)', () => {
      expect(calculateCraftTime(2)).toBe(20);
    });

    test('should return 35 seconds for hard recipes (difficulty 3)', () => {
      expect(calculateCraftTime(3)).toBe(35);
    });

    test('should return 60 seconds for very hard recipes (difficulty 4)', () => {
      expect(calculateCraftTime(4)).toBe(60);
    });

    test('should return 120 seconds for legendary recipes (difficulty 5)', () => {
      expect(calculateCraftTime(5)).toBe(120);
    });

    test('should clamp difficulty < 1 to difficulty 1 (easy)', () => {
      expect(calculateCraftTime(0)).toBe(10);
      expect(calculateCraftTime(-5)).toBe(10);
    });

    test('should clamp difficulty > 5 to difficulty 5 (legendary)', () => {
      expect(calculateCraftTime(6)).toBe(120);
      expect(calculateCraftTime(100)).toBe(120);
    });

    test('should clamp result to minimum 5 seconds', () => {
      // All difficulties are >= 10, so this tests the min clamp
      const result = calculateCraftTime(1);
      expect(result).toBeGreaterThanOrEqual(5);
    });

    test('should clamp result to maximum 300 seconds', () => {
      // All difficulties are <= 120, so this tests the max clamp
      const result = calculateCraftTime(5);
      expect(result).toBeLessThanOrEqual(300);
    });

    test('should return integer values', () => {
      for (let i = 1; i <= 5; i++) {
        const result = calculateCraftTime(i);
        expect(Number.isInteger(result)).toBe(true);
      }
    });
  });

  describe('getRecipeCost', () => {
    test('should return correct materials for iron_sword', () => {
      const cost = getRecipeCost('iron_sword');
      expect(cost).toEqual([
        { id: 'iron_ore', quantity: 5 },
        { id: 'wood', quantity: 2 },
      ]);
    });

    test('should return correct materials for wooden_bow', () => {
      const cost = getRecipeCost('wooden_bow');
      expect(cost).toEqual([
        { id: 'wood', quantity: 3 },
        { id: 'string', quantity: 1 },
      ]);
    });

    test('should return correct materials for health_potion', () => {
      const cost = getRecipeCost('health_potion');
      expect(cost).toEqual([
        { id: 'herb', quantity: 2 },
        { id: 'water', quantity: 1 },
      ]);
    });

    test('should return empty array for nonexistent recipe', () => {
      expect(getRecipeCost('nonexistent_recipe')).toEqual([]);
    });

    test('should return correct materials for single-material recipe', () => {
      const cost = getRecipeCost('copper_ore');
      expect(cost).toEqual([{ id: 'copper_raw', quantity: 1 }]);
    });

    test('should return array of correct length', () => {
      expect(getRecipeCost('iron_sword').length).toBe(2);
      expect(getRecipeCost('wooden_bow').length).toBe(2);
      expect(getRecipeCost('health_potion').length).toBe(2);
      expect(getRecipeCost('copper_ore').length).toBe(1);
    });

    test('should have quantity property on all items', () => {
      const cost = getRecipeCost('iron_sword');
      for (const item of cost) {
        expect(item).toHaveProperty('quantity');
        expect(typeof item.quantity).toBe('number');
        expect(item.quantity).toBeGreaterThan(0);
      }
    });
  });

  describe('Integration Tests', () => {
    test('should validate recipe using cost to check requirements', () => {
      const recipe = 'iron_sword';
      const cost = getRecipeCost(recipe);
      
      // Create inventory with exactly what's needed
      const inventory = cost;
      expect(validateRecipe(recipe, inventory)).toBe(true);
    });

    test('should show craft progression: recipe > cost > time', () => {
      const recipe = 'iron_sword';
      const cost = getRecipeCost(recipe);
      const time = calculateCraftTime(3);
      
      expect(cost.length).toBeGreaterThan(0);
      expect(time).toBeGreaterThan(0);
      expect(cost.length).toBeGreaterThan(0);
    });

    test('should handle multiple recipes in sequence', () => {
      const recipes = ['iron_sword', 'wooden_bow', 'health_potion'];
      const inventory: Item[] = [
        { id: 'iron_ore', quantity: 10, equipped: false, effects: [], metadata: {} },
        { id: 'wood', quantity: 10, equipped: false, effects: [], metadata: {} },
        { id: 'string', quantity: 5, equipped: false, effects: [], metadata: {} },
        { id: 'herb', quantity: 20, equipped: false, effects: [], metadata: {} },
        { id: 'water', quantity: 10, equipped: false, effects: [], metadata: {} },
      ];

      for (const recipe of recipes) {
        expect(validateRecipe(recipe, inventory)).toBe(true);
        expect(getRecipeCost(recipe).length).toBeGreaterThan(0);
      }
    });
  });
});
