/**
 * Achievement Templates - Static Achievement Data
 *
 * @remarks
 * **Architecture:** Similar to quests. Template is static; only runtime unlock state is saved.
 *
 * **Auto-Evaluation:** Unlike quests (manual accept), achievements are evaluated
 * automatically when player statistics change.
 *
 * **Triggers:** Achievements unlock when StatsQuery criteria are satisfied.
 */

import { AchievementTemplate } from '@/core/domain/achievement';

export const ACHIEVEMENT_TEMPLATES: Record<string, AchievementTemplate> = {
  // ============================================
  // COMBAT ACHIEVEMENTS
  // ============================================

  'first-blood': {
    id: 'first-blood',
    title: 'First Blood',
    description: 'Defeat your first creature.',
    category: 'combat',
    criteria: {
      type: 'KILL_CREATURE',
      params: {
        creatureType: 'slime',
        count: 1,
      },
    },
    reward: {
      badge: '🩸',
      xp: 10,
    },
    hidden: false,
    rarity: 'common',
  },

  'creature-slayer': {
    id: 'creature-slayer',
    title: 'Creature Slayer',
    description: 'Defeat 50 creatures.',
    category: 'combat',
    criteria: {
      type: 'KILL_CREATURE',
      params: {
        creatureType: 'slime',
        count: 50,
      },
    },
    reward: {
      badge: '⚔️',
      title: 'Slayer',
      xp: 100,
    },
    rarity: 'rare',
  },

  'dragon-slayer': {
    id: 'dragon-slayer',
    title: 'Dragon Slayer',
    description: 'Slay the mighty dragon.',
    category: 'combat',
    criteria: {
      type: 'KILL_CREATURE',
      params: {
        creatureType: 'dragon',
        count: 1,
      },
    },
    reward: {
      badge: '🐉',
      title: 'Dragon Slayer',
      xp: 500,
    },
    rarity: 'legendary',
  },

  'mountain-warrior': {
    id: 'mountain-warrior',
    title: 'Mountain Warrior',
    description: 'Defeat 20 creatures in the mountains.',
    category: 'combat',
    criteria: {
      type: 'KILL_CREATURE',
      params: {
        creatureType: 'goblin',
        count: 20,
        biome: 'mountain',
      },
    },
    reward: {
      badge: '🏔️',
      xp: 150,
    },
    rarity: 'uncommon',
  },

  // ============================================
  // GATHERING ACHIEVEMENTS
  // ============================================

  'woodcutter': {
    id: 'woodcutter',
    title: 'Woodcutter',
    description: 'Collect 50 pieces of wood.',
    category: 'gathering',
    criteria: {
      type: 'GATHER_ITEM',
      params: {
        itemId: 'wood',
        count: 50,
      },
    },
    reward: {
      badge: '🌲',
      title: 'Woodcutter',
      xp: 75,
    },
    rarity: 'uncommon',
  },

  'master-forager': {
    id: 'master-forager',
    title: 'Master Forager',
    description: 'Collect 100 herbs from the forest.',
    category: 'gathering',
    criteria: {
      type: 'GATHER_ITEM',
      params: {
        itemId: 'rare_herb',
        count: 100,
        biome: 'forest',
      },
    },
    reward: {
      badge: '🌿',
      title: 'Master Forager',
      xp: 200,
    },
    rarity: 'rare',
  },

  'desert-explorer': {
    id: 'desert-explorer',
    title: 'Desert Explorer',
    description: 'Collect 50 resources from the desert.',
    category: 'gathering',
    criteria: {
      type: 'GATHER_ITEM',
      params: {
        itemId: 'sand_crystal',
        count: 50,
        biome: 'desert',
      },
    },
    reward: {
      badge: '🏜️',
      xp: 125,
    },
    rarity: 'uncommon',
  },

  // ============================================
  // CRAFTING ACHIEVEMENTS
  // ============================================

  'artisan': {
    id: 'artisan',
    title: 'Artisan',
    description: 'Craft 30 items.',
    category: 'crafting',
    criteria: {
      type: 'CRAFT_ITEM',
      params: {
        itemId: 'wood_plank',
        count: 30,
      },
    },
    reward: {
      badge: '🛠️',
      title: 'Artisan',
      xp: 100,
    },
    rarity: 'uncommon',
  },

  'master-smith': {
    id: 'master-smith',
    title: 'Master Smith',
    description: 'Craft 50 metal items.',
    category: 'crafting',
    criteria: {
      type: 'CRAFT_ITEM',
      params: {
        itemId: 'sword_iron',
        count: 50,
      },
    },
    reward: {
      badge: '⚒️',
      title: 'Master Smith',
      xp: 250,
    },
    rarity: 'rare',
  },

  'legendary-crafter': {
    id: 'legendary-crafter',
    title: 'Legendary Crafter',
    description: 'Craft a legendary item.',
    category: 'crafting',
    criteria: {
      type: 'CRAFT_ITEM',
      params: {
        itemId: 'legendary_sword',
        count: 1,
      },
    },
    reward: {
      badge: '✨',
      title: 'Legendary Crafter',
      xp: 500,
    },
    rarity: 'legendary',
  },

  // ============================================
  // EXPLORATION ACHIEVEMENTS
  // ============================================

  'world-explorer': {
    id: 'world-explorer',
    title: 'World Explorer',
    description: 'Discover all biomes.',
    category: 'exploration',
    criteria: {
      type: 'CUSTOM',
      params: {
        action: 'discover_all_biomes',
      },
    },
    reward: {
      badge: '🗺️',
      title: 'World Explorer',
      xp: 300,
    },
    rarity: 'rare',
  },

  'nomad': {
    id: 'nomad',
    title: 'Nomad',
    description: 'Travel 10,000 units.',
    category: 'exploration',
    criteria: {
      type: 'TRAVEL_DISTANCE',
      params: {
        distance: 10000,
      },
    },
    reward: {
      badge: '🚶',
      xp: 200,
    },
    rarity: 'uncommon',
  },

  // ============================================
  // LEGENDARY/META ACHIEVEMENTS
  // ============================================

  'quest-master': {
    id: 'quest-master',
    title: 'Quest Master',
    description: 'Complete 25 quests.',
    category: 'legendary',
    criteria: {
      type: 'CUSTOM',
      params: {
        action: 'complete_25_quests',
      },
    },
    reward: {
      badge: '👑',
      title: 'Quest Master',
      xp: 1000,
    },
    rarity: 'legendary',
  },

  'achievement-hunter': {
    id: 'achievement-hunter',
    title: 'Achievement Hunter',
    description: 'Unlock 30 achievements.',
    category: 'legendary',
    criteria: {
      type: 'CUSTOM',
      params: {
        action: 'unlock_30_achievements',
      },
    },
    reward: {
      badge: '🎖️',
      title: 'Achievement Hunter',
      xp: 500,
    },
    rarity: 'rare',
  },

  'completionist': {
    id: 'completionist',
    title: 'Completionist',
    description: 'Unlock all achievements.',
    category: 'legendary',
    criteria: {
      type: 'CUSTOM',
      params: {
        action: 'unlock_all_achievements',
      },
    },
    reward: {
      badge: '🏆',
      title: 'Completionist',
      xp: 5000,
    },
    rarity: 'mythic',
    hidden: true,
  },
};

/**
 * Get an achievement template by ID
 */
export function getAchievementTemplate(achievementId: string): AchievementTemplate | undefined {
  return ACHIEVEMENT_TEMPLATES[achievementId];
}

/**
 * Get all achievements by category
 */
export function getAchievementsByCategory(
  category: AchievementTemplate['category']
): AchievementTemplate[] {
  return Object.values(ACHIEVEMENT_TEMPLATES).filter(a => a.category === category);
}

/**
 * Get all non-hidden achievements
 */
/**
 * Get all non-hidden achievements
 */
export function getVisibleAchievements(): AchievementTemplate[] {
  return Object.values(ACHIEVEMENT_TEMPLATES).filter(a => !a.hidden);
}