import { calculateCraftingOutcome } from '../crafting';

describe('calculateCraftingOutcome with localized inventory names', () => {
  const allItemDefinitions = {
    oak_plank: {
      id: 'oak_plank',
      name: { en: 'Oak Plank', vi: 'Thanh gỗ sồi' },
      description: { en: 'A plank of oak wood.', vi: 'Một thanh gỗ sồi.' },
      tier: 1,
      emoji: '🪵',
      baseQuantity: { min: 1, max: 3 },
      relationship: { substituteFor: 'wood_plank', quality: 2 }
    }
  } as any;

  test('player inventory contains Vietnamese name (no id) and recipe still resolves', () => {
    // Player inventory stored a localized name string (e.g., UI-saved), without canonical id
    const playerItems = [{ name: 'Thanh gỗ sồi', quantity: 5 } as any];
    const recipe = { ingredients: [{ name: 'wood_plank', quantity: 2 }], requiredTool: undefined } as any;

    const outcome = calculateCraftingOutcome(playerItems, recipe, allItemDefinitions);
    expect(outcome.canCraft).toBe(true);
    // oak_plank is a substitute for wood_plank with quality 2 => chance 50
    expect(outcome.chance).toBe(50);
    expect(outcome.ingredientsToConsume[0].quantity).toBe(2);
  });
});
