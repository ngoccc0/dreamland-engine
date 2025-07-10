/**
 * @fileoverview This is an example mod file.
 * You can copy this structure to create your own mods.
 *
 * To activate this mod, ensure it is imported and added to the
 * `allMods` array in `src/lib/game/mods/index.ts`.
 */

import type { ModDefinition, ItemDefinition, Recipe, EnemySpawn } from '@/lib/game/types';

// Define new items. All fields are required for validation.
const items: Record<string, ItemDefinition> = {
  'Dragon Scale': {
    description: 'A scale as hard as steel, shimmering with red light.',
    tier: 5,
    category: 'Material',
    emoji: '🐉',
    effects: [],
    baseQuantity: { min: 1, max: 3 },
  },
  'Dragon Tooth': {
    description: 'A tooth as sharp as a dagger.',
    tier: 5,
    category: 'Material',
    emoji: '🦷',
    effects: [],
    baseQuantity: { min: 1, max: 2 },
  },
  'Dragon Tooth Spear': {
    description: 'A powerful spear crafted from a Dragon Tooth.',
    tier: 5,
    category: 'Weapon',
    emoji: '🔱',
    effects: [],
    baseQuantity: { min: 1, max: 1 },
    equipmentSlot: 'weapon',
    attributes: { physicalAttack: 18, critChance: 5 },
  },
};

// Define new crafting recipes.
const recipes: Record<string, Recipe> = {
  'Dragon Tooth Spear': {
    result: { name: 'Dragon Tooth Spear', quantity: 1, emoji: '🔱' },
    ingredients: [
      { name: 'Dragon Tooth', quantity: 1 },
      { name: 'Lõi Gỗ', quantity: 2 },
      { name: 'Dây Gai', quantity: 3 }
    ],
    description: 'Craft a powerful spear from a Dragon Tooth.',
  }
};

// Define new enemies and specify which biomes they can spawn in.
const enemies: Partial<Record<"forest" | "grassland" | "desert" | "swamp" | "mountain" | "cave" | "jungle" | "volcanic", EnemySpawn[]>> = {
  'forest': [
    {
      data: {
        type: 'Young Dragon',
        emoji: '🐲',
        hp: 200,
        damage: 35,
        behavior: 'aggressive',
        size: 'large',
        diet: ['Gấu'],
        satiation: 0,
        maxSatiation: 1,
        loot: [
          { name: 'Dragon Scale', chance: 0.8, quantity: { min: 1, max: 5 } },
          { name: 'Dragon Tooth', chance: 0.5, quantity: { min: 1, max: 2 } },
        ]
      },
      // Spawn conditions: only in very dangerous forests.
      conditions: { dangerLevel: { min: 9 }, chance: 0.1 }
    }
  ],
  'mountain': [
     {
      data: {
        type: 'Wyvern',
        emoji: '🐉',
        hp: 120,
        damage: 25,
        behavior: 'territorial',
        size: 'large',
        diet: ['Dê núi hung hãn'],
        satiation: 0,
        maxSatiation: 2,
        loot: [
          { name: 'Dragon Scale', chance: 0.5, quantity: { min: 1, max: 2 } },
        ]
      },
      // Spawn conditions: only on high, windy mountains.
      conditions: { elevation: { min: 8 }, windLevel: { min: 6 }, chance: 0.15 }
    }
  ]
};

// Export all definitions in a single 'mod' object.
// This is the object the game engine will load.
export const mod: ModDefinition = {
  items,
  recipes,
  enemies,
};
