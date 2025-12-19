/**
 * Quest Templates - Static Quest Data
 *
 * @remarks
 * **NOT SAVED to GameState.** This is authoritative quest content.
 *
 * **Data Lifecycle:**
 * 1. Player accepts quest → Creates runtime entry in activeQuests
 * 2. On load, merge template + runtime to get full quest object
 * 3. On save, only runtime state persisted
 *
 * **Content Strategy:**
 * - Simple quests: 1-step, quick completion (5-10 minutes)
 * - Legendary quests: Multi-step, complex chains (30+ minutes)
 * - Chain quests: Prerequisite dependencies
 *
 * **Progression Logic:**
 * Early game: Wood gathering, basic creature kills
 * Mid game: Crafting, exploration
 * Late game: Rare creatures, legendary items
 */

import { QuestTemplate } from '@/core/domain/quest';

/**
 * Quest template registry
 * Key: questId, Value: full template definition
 */
export const QUEST_TEMPLATES: Record<string, QuestTemplate> = {
    // ============================================
    // TIER 1: BEGINNER QUESTS
    // ============================================

    'slay-five-slimes': {
        id: 'slay-five-slimes',
        title: 'Slay the Slime Horde',
        description:
            'The forest is overrun with aggressive slimes. Defeat five of them to prove your combat prowess.',
        giver: 'village_elder',
        type: 'simple',
        criteria: {
            type: 'KILL_CREATURE',
            params: {
                creatureType: 'slime',
                count: 5,
            },
        },
        rewards: {
            xp: 50,
            items: ['gold_25'],
            achievements: [],
        },
        repeatable: false,
    },

    'gather-wood-from-forest': {
        id: 'gather-wood-from-forest',
        title: 'Gather Firewood',
        description: 'Collect 10 pieces of wood from the forest to help the village prepare for winter.',
        giver: 'village_elder',
        type: 'simple',
        criteria: {
            type: 'GATHER_ITEM',
            params: {
                itemId: 'wood',
                count: 10,
                biome: 'forest',
            },
        },
        rewards: {
            xp: 40,
            items: ['gold_15'],
            achievements: [],
        },
        repeatable: true,
    },

    'craft-your-first-item': {
        id: 'craft-your-first-item',
        title: 'Master the Craft',
        description: 'Prove your crafting skills by creating any item at a crafting station.',
        type: 'simple',
        criteria: {
            type: 'CRAFT_ITEM',
            params: {
                itemId: 'wood_plank',
                count: 1,
            },
        },
        rewards: {
            xp: 30,
            items: [],
            achievements: [],
        },
        repeatable: false,
    },

    // ============================================
    // TIER 2: INTERMEDIATE QUESTS
    // ============================================

    'hunt-goblins-in-mountains': {
        id: 'hunt-goblins-in-mountains',
        title: 'Mountain Hunters',
        description:
            'The goblin tribes in the mountains have become too bold. Eliminate 8 of them to restore peace.',
        giver: 'captain_guard',
        type: 'simple',
        criteria: {
            type: 'KILL_CREATURE',
            params: {
                creatureType: 'goblin',
                count: 8,
                biome: 'mountain',
            },
        },
        rewards: {
            xp: 150,
            items: ['gold_75', 'iron_ore_5'],
            achievements: [],
        },
        prerequisites: ['slay-five-slimes'],
        repeatable: false,
    },

    'gather-rare-herbs': {
        id: 'gather-rare-herbs',
        title: 'Herbalist\'s Request',
        description: 'Gather 15 rare herbs from the forest for the village herbalist\'s medicine.',
        giver: 'herbalist',
        type: 'simple',
        criteria: {
            type: 'GATHER_ITEM',
            params: {
                itemId: 'rare_herb',
                count: 15,
                biome: 'forest',
            },
        },
        rewards: {
            xp: 100,
            items: ['healing_potion_3'],
            achievements: [],
        },
        repeatable: true,
    },

    'craft-iron-sword': {
        id: 'craft-iron-sword',
        title: 'Blacksmith\'s Pride',
        description: 'Craft an iron sword to show the blacksmith your improved skills.',
        giver: 'blacksmith',
        type: 'simple',
        criteria: {
            type: 'CRAFT_ITEM',
            params: {
                itemId: 'sword_iron',
                count: 1,
                recipeId: 'basic_iron_sword',
            },
        },
        rewards: {
            xp: 120,
            items: ['gold_50'],
            achievements: [],
        },
        prerequisites: ['craft-your-first-item'],
        repeatable: true,
    },

    // ============================================
    // TIER 3: ADVANCED QUESTS
    // ============================================

    'defeat-dragon': {
        id: 'defeat-dragon',
        title: 'The Dragon\'s Flame',
        description:
            'A dragon has taken residence in the mountain peaks. Defeat this legendary beast and bring peace to the realm.',
        giver: 'king',
        type: 'legendary',
        criteria: {
            type: 'KILL_CREATURE',
            params: {
                creatureType: 'dragon',
                count: 1,
                biome: 'mountain',
            },
        },
        rewards: {
            xp: 1000,
            items: ['dragon_scale_5', 'legendary_sword'],
            achievements: ['dragon-slayer'],
        },
        prerequisites: ['hunt-goblins-in-mountains'],
        repeatable: false,
    },

    'explore-all-biomes': {
        id: 'explore-all-biomes',
        title: 'World Explorer',
        description: 'Discover all the different biomes in the world and return with knowledge of each.',
        type: 'legendary',
        criteria: {
            type: 'CUSTOM',
            params: {
                action: 'discover_all_biomes',
            },
        },
        rewards: {
            xp: 500,
            items: ['world_map'],
            achievements: ['world-explorer'],
        },
        repeatable: false,
    },

    // ============================================
    // TIER 4: CHAIN QUESTS
    // ============================================

    'royal-quest-line-1': {
        id: 'royal-quest-line-1',
        title: 'The King\'s First Request',
        description: 'The king has tasked you with retrieving a lost artifact. Begin your search in the ancient ruins.',
        giver: 'king',
        type: 'chain',
        criteria: {
            type: 'CUSTOM',
            params: {
                action: 'reach_ancient_ruins',
            },
        },
        rewards: {
            xp: 300,
            items: [],
            achievements: [],
        },
        repeatable: false,
    },

    'royal-quest-line-2': {
        id: 'royal-quest-line-2',
        title: 'The Artifact\'s Guardian',
        description: 'The artifact is guarded by a powerful golem. Defeat it to claim your prize.',
        giver: 'king',
        type: 'chain',
        criteria: {
            type: 'KILL_CREATURE',
            params: {
                creatureType: 'golem',
                count: 1,
            },
        },
        rewards: {
            xp: 500,
            items: ['ancient_artifact'],
            achievements: [],
        },
        prerequisites: ['royal-quest-line-1'],
        repeatable: false,
    },

    'royal-quest-line-3': {
        id: 'royal-quest-line-3',
        title: 'Return of the Artifact',
        description: 'Bring the artifact back to the king. You shall be rewarded greatly.',
        giver: 'king',
        type: 'chain',
        criteria: {
            type: 'CUSTOM',
            params: {
                action: 'return_artifact_to_king',
            },
        },
        rewards: {
            xp: 800,
            items: ['gold_500', 'noble_ring'],
            achievements: ['quest-master'],
        },
        prerequisites: ['royal-quest-line-2'],
        repeatable: false,
    },
};

/**
 * Get a quest template by ID
 */
export function getQuestTemplate(questId: string): QuestTemplate | undefined {
    return QUEST_TEMPLATES[questId];
}

/**
 * Get all available quests for a given tier
 */
export function getQuestsByTier(tier: 'beginner' | 'intermediate' | 'advanced' | 'chain'): QuestTemplate[] {
    const tiers: Record<string, string[]> = {
        beginner: ['slay-five-slimes', 'gather-wood-from-forest', 'craft-your-first-item'],
        intermediate: [
            'hunt-goblins-in-mountains',
            'gather-rare-herbs',
            'craft-iron-sword',
        ],
        advanced: ['defeat-dragon', 'explore-all-biomes'],
        chain: ['royal-quest-line-1', 'royal-quest-line-2', 'royal-quest-line-3'],
    };

    return tiers[tier]
        .map(id => QUEST_TEMPLATES[id])
        .filter((q): q is QuestTemplate => q !== undefined);
}
