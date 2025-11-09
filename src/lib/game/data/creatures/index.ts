import type { CreatureDefinition } from '@/lib/game/definitions/creature';

/**
 * Canonical place for creature templates / data used by premade worlds and generators.
 * Populated with a small, sensible default catalog so generators and templates
 * can reference creature IDs like 'wolf' or 'common_tree'. Mod authors can
 * extend or replace this record via the mod system.
 */
export const creatureTemplates: Record<string, CreatureDefinition> = {
  common_tree: {
    id: 'common_tree',
    name: { en: 'Common Tree', vi: 'Cây Gỗ Thường' },
    description: { en: 'A medium-sized deciduous tree.', vi: 'Một cây gỗ tầm trung, thường gặp.' },
    emoji: '🌳',
    hp: 200,
    damage: 0,
    behavior: 'immobile',
    size: 'large',
    diet: [],
    satiation: 0,
    maxSatiation: 0,
    harvestable: {
      difficulty: 3,
      requiredTool: 'axe',
      loot: [] as any
    }
  },
  wolf: {
    id: 'wolf',
    name: { en: 'Wolf', vi: 'Sói' },
    description: { en: 'A cunning pack hunter.', vi: 'Một kẻ săn mồi tinh khôn theo bầy.' },
    emoji: '🐺',
    hp: 50,
    damage: 8,
    behavior: 'aggressive',
    size: 'medium',
    diet: ['meat'],
    satiation: 10,
    maxSatiation: 30
  },
  giant_spider: {
    id: 'giant_spider',
    name: { en: 'Giant Spider', vi: 'Nhện khổng lồ' },
    description: { en: 'A large spider lurking in the undergrowth.', vi: 'Một con nhện lớn ẩn nấp trong lớp thực vật.' },
    emoji: '🕷️',
    hp: 40,
    damage: 6,
    behavior: 'ambush',
    size: 'small',
    diet: ['insects', 'small_animals'],
    satiation: 8,
    maxSatiation: 20
  },
  wild_boar: {
    id: 'wild_boar',
    name: { en: 'Wild Boar', vi: 'Heo Rừng' },
    description: { en: 'A tough, aggressive omnivore rooting for food.', vi: 'Một loài lợn rừng dai sức, ăn tạp và hung hãn.' },
    emoji: '🐗',
    hp: 70,
    damage: 10,
    behavior: 'territorial',
    size: 'medium',
    diet: ['roots', 'berries', 'meat'],
    satiation: 15,
    maxSatiation: 40
  },
  forest_goblin: {
    id: 'forest_goblin',
    name: { en: 'Forest Goblin', vi: 'Yêu Tinh Rừng' },
    description: { en: 'Small humanoids that scavenge and ambush travelers.', vi: 'Sinh vật nhỏ, lục lọi và mai phục du khách.' },
    emoji: '👺',
    hp: 30,
    damage: 5,
    behavior: 'defensive',
    size: 'small',
    diet: ['berries', 'small_prey'],
    satiation: 8,
    maxSatiation: 25
  },
  bear: {
    id: 'bear',
    name: { en: 'Bear', vi: 'Gấu' },
    description: { en: 'A large, powerful omnivore that defends its territory.', vi: 'Một động vật lớn, mạnh mẽ, canh giữ lãnh thổ.' },
    emoji: '🐻',
    hp: 150,
    damage: 18,
    behavior: 'territorial',
    size: 'large',
    diet: ['berries', 'meat', 'fish'],
    satiation: 30,
    maxSatiation: 80
  }
};

export function getCreatureTemplate(id: string): CreatureDefinition | undefined {
  return creatureTemplates[id];
}
