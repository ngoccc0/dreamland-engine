/**
 * Unit tests for resolveItemDef helper
 */
jest.mock('@/core/data/items', () => ({
  allItems: {
    MasterItem: {
      name: { en: 'MasterItem', vi: 'MasterItem' },
      description: 'A master item',
      tier: 2,
      emoji: '⭐',
      effects: [],
      spawnEnabled: true,
      baseQuantity: { min: 1, max: 1 },
      category: 'Material',
    },
  },
}));

import resolveItemDef from '@/lib/game/item-utils';

describe('resolveItemDef', () => {
  test('returns custom definition when present', () => {
    const customDefs: Record<string, any> = {
      CustomItem: {
        name: { en: 'CustomItem' },
        description: 'A custom item',
        tier: 1,
        emoji: '🧪',
        effects: [],
        spawnEnabled: true,
        baseQuantity: { min: 1, max: 1 },
        category: 'Material',
      },
    };

    const result = resolveItemDef('CustomItem', customDefs);
    expect(result).toBe(customDefs.CustomItem);
  });

  test('falls back to master definitions when custom is absent', () => {
    const result = resolveItemDef('MasterItem', {} as Record<string, any>);
    expect(result).toBeDefined();
    expect((result as any).description).toBe('A master item');
  });

  test('returns undefined for unknown items', () => {
    const result = resolveItemDef('NonExistent', {} as Record<string, any>);
    expect(result).toBeUndefined();
  });
});
