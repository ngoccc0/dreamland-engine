import { calculateCraftingOutcome } from '../crafting';

describe('calculateCraftingOutcome', () => {
  const allItemDefinitions = {
    iron_ingot: {
      id: 'iron_ingot',
      name: 'Iron Ingot',
      description: 'A bar of iron.',
      tier: 1,
      emoji: '🔩',
      baseQuantity: { min: 1, max: 1 },
    },
    oak_plank: {
      id: 'oak_plank',
      name: 'Oak Plank',
      description: 'A plank of oak wood.',
      tier: 1,
      emoji: '🪵',
      baseQuantity: { min: 1, max: 3 },
      relationship: { substituteFor: 'wood_plank', quality: 2 }
    }
  } as any;

  test('uses explicit id on player item to match recipe requirement', () => {
    const playerItems = [{ name: 'Iron Ingot', quantity: 2, id: 'iron_ingot' } as any];
    const recipe = { ingredients: [{ name: 'iron_ingot', quantity: 1 }], requiredTool: undefined } as any;

    const outcome = calculateCraftingOutcome(playerItems, recipe, allItemDefinitions);
    expect(outcome.canCraft).toBe(true);
    expect(outcome.chance).toBe(100);
    expect(outcome.ingredientsToConsume.length).toBeGreaterThan(0);
    expect(outcome.ingredientsToConsume[0].quantity).toBe(1);
  });

  test('resolves substitute via relationship and adjusts chance (quality)', () => {
    const playerItems = [{ name: 'Oak Plank', quantity: 5 } as any];
    const recipe = { ingredients: [{ name: 'wood_plank', quantity: 2 }], requiredTool: undefined } as any;

    const outcome = calculateCraftingOutcome(playerItems, recipe, allItemDefinitions);
    // oak_plank is a substitute for wood_plank with quality 2, so worstTier should be 2 => 50%
    expect(outcome.canCraft).toBe(true);
    expect(outcome.chance).toBe(50);
    expect(outcome.ingredientsToConsume[0].quantity).toBe(2);
  });
});
