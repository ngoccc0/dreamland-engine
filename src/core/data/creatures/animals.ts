import type { CreatureDefinition } from '@/core/types/definitions/creature';

export const animals: Record<string, CreatureDefinition> = {
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
    ,
    // Natural spawn migrated from terrain templates (forest)
    naturalSpawn: [
      {
        biome: 'forest',
        chance: 0.3,
        conditions: { predatorPresence: { min: 5 } }
      }
    ]
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
    ,
    naturalSpawn: [
      {
        biome: 'forest',
        chance: 0.25,
        conditions: { vegetationDensity: { min: 8 }, dangerLevel: { min: 6 } }
      }
    ]
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
    ,
    naturalSpawn: [
      {
        biome: 'forest',
        chance: 0.25,
        conditions: { predatorPresence: { min: 4 } }
      }
    ]
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
    ,
    naturalSpawn: [
      {
        biome: 'forest',
        chance: 0.2,
        conditions: { dangerLevel: { min: 5 }, humanPresence: { min: 1 } }
      }
    ]
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
    ,
    naturalSpawn: [
      {
        biome: 'forest',
        chance: 0.08,
        conditions: { predatorPresence: { min: 8 }, dangerLevel: { min: 7 } }
      }
    ]
  }
};

export default animals;
