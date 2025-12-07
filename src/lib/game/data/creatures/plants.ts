import type { CreatureDefinition } from '@/core/types/definitions/creature';
import type { PlantPartDefinition } from '@/core/types/definitions/plant-properties';
import { createRng } from '@/lib/narrative/rng'; // Import createRng for initial part quantity

// Helper to initialize currentQty for plant parts based on maxQty and an RNG seed
const initializePlantParts = (parts: PlantPartDefinition[], seed: string | number): PlantPartDefinition[] => {
  const rng = createRng(seed);
  return parts.map(part => ({
    ...part,
    currentQty: Math.floor(part.maxQty * (0.8 + rng.float() * 0.2)), // Init between 80-100% of max
  }));
};

export const plants: Record<string, CreatureDefinition> = {
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
    plantProperties: {
      vegetationContribution: 20,
      parts: initializePlantParts([
        {
          name: 'leaves',
          maxQty: 5,
          growProb: 0.05,
          dropProb: 0.01,
          loot: [{ name: 'plant_fiber', chance: 0.9, quantity: { min: 1, max: 2 } }],
          droppedLoot: [{ name: 'fallen_leaf', chance: 1, quantity: { min: 1, max: 1 } }],
        },
        {
          name: 'flowers',
          maxQty: 3,
          growProb: 0.03,
          dropProb: 0.005,
          loot: [{ name: 'white_flower', chance: 0.7, quantity: { min: 1, max: 1 } }],
          droppedLoot: [{ name: 'petal', chance: 1, quantity: { min: 1, max: 1 } }],
          triggerFrom: 'leaves',
        },
        {
          name: 'fruits',
          maxQty: 3,
          growProb: 0.02,
          dropProb: 0.01,
          loot: [{ name: 'strange_fruit', chance: 0.8, quantity: { min: 1, max: 1 } }],
          droppedLoot: [{ name: 'tree_seed', chance: 0.2, quantity: { min: 1, max: 1 } }],
          triggerFrom: 'flowers',
        },
        {
          name: 'trunk',
          maxQty: 1,
          growProb: 0.005,
          dropProb: 0,
          loot: [{ name: 'sturdy_branch', chance: 0.6, quantity: { min: 1, max: 1 } }, { name: 'wood_core', chance: 0.9, quantity: { min: 1, max: 1 } }],
          structural: true,
        },
        {
          name: 'roots',
          maxQty: 1,
          growProb: 0.008,
          dropProb: 0,
          loot: [{ name: 'root', chance: 0.5, quantity: { min: 1, max: 1 } }],
          structural: true,
          hidden: true,
        },
      ], 'common_tree_seed'), // Pass a unique seed for deterministic part initialization
      reproduction: {
        chance: 0.01,
        range: 2,
        maxOffspring: 1,
        requirements: {
          minMoisture: 30,
          minTemperature: 5,
          maxTemperature: 35,
          minVegetationDensity: 20
        }
      },
      resilience: {
        droughtResistance: 0.6,
        coldResistance: 0.7,
        heatResistance: 0.5
      }
    },
    // Natural spawn rules migrated from terrain templates (e.g., forest).
    naturalSpawn: [
      {
        biome: 'forest',
        chance: 0.9,
        conditions: { vegetationDensity: { min: 3 } }
      }
    ]
  },
  tall_grass: {
    id: 'tall_grass',
    name: { en: 'Tall Grass', vi: 'Cỏ Cao' },
    description: { en: 'A patch of tall grass swaying in the wind.', vi: 'Một đám cỏ cao đang đung đưa trong gió.' },
    emoji: '🌿',
    hp: 30,
    damage: 0,
    behavior: 'immobile',
    size: 'small',
    diet: [],
    satiation: 0,
    maxSatiation: 0,
    plantProperties: {
      vegetationContribution: 2,
      reproduction: {
        chance: 0.1,
        range: 1,
        maxOffspring: 3,
        requirements: {
          minMoisture: 20,
          minTemperature: 0,
          maxTemperature: 40,
          minVegetationDensity: 0
        }
      },
      resilience: {
        droughtResistance: 0.4,
        coldResistance: 0.5,
        heatResistance: 0.6
      }
    },
    harvestable: {
      difficulty: 1,
      requiredTool: '',
      loot: [
        { name: 'dry_grass', chance: 0.9, quantity: { min: 1, max: 2 } }
      ]
    }
    ,
    // Allow tall grass to naturally appear in multiple grassy biomes by default.
    naturalSpawn: [
      { chance: 0.8, conditions: { vegetationDensity: { min: 0 } } }
    ]
  },
  wild_cotton: {
    id: 'wild_cotton',
    name: { en: 'Wild Cotton', vi: 'Bông Dại' },
    description: { en: 'A cotton plant with soft, fluffy bolls ready for harvesting.', vi: 'Một cây bông dại với những quả bông mềm mại, sẵn sàng thu hoạch.' },
    emoji: '🌸',
    hp: 40,
    damage: 0,
    behavior: 'immobile',
    size: 'small',
    diet: [],
    satiation: 0,
    maxSatiation: 0,
    plantProperties: {
      vegetationContribution: 3,
      reproduction: {
        chance: 0.05,
        range: 1,
        maxOffspring: 2,
        requirements: {
          minMoisture: 40,
          minTemperature: 15,
          maxTemperature: 35,
          minVegetationDensity: 10
        }
      },
      resilience: {
        droughtResistance: 0.3,
        coldResistance: 0.2,
        heatResistance: 0.7
      }
    },
    harvestable: {
      difficulty: 2,
      requiredTool: '',
      loot: [
        { name: 'cotton_boll', chance: 0.8, quantity: { min: 1, max: 2 } }
      ]
    },
    naturalSpawn: [
      {
        biome: 'grassland',
        chance: 0.5,
        conditions: { vegetationDensity: { min: 5 } }
      }
    ]
  },
  thorny_vine: {
    id: 'thorny_vine',
    name: { en: 'Thorny Vine', vi: 'Dây Leo Gai' },
    description: { en: 'A strong, flexible vine covered in sharp thorns.', vi: 'Một loại dây leo mạnh mẽ, dẻo dai và có nhiều gai nhọn.' },
    emoji: '🌿',
    hp: 50,
    damage: 5,
    behavior: 'immobile',
    size: 'medium',
    diet: [],
    satiation: 0,
    maxSatiation: 0,
    plantProperties: {
      vegetationContribution: 5,
      reproduction: {
        chance: 0.08,
        range: 2,
        maxOffspring: 2,
        requirements: {
          minMoisture: 30,
          minTemperature: 10,
          maxTemperature: 40,
          minVegetationDensity: 15
        }
      },
      resilience: {
        droughtResistance: 0.7,
        coldResistance: 0.4,
        heatResistance: 0.8
      }
    },
    harvestable: {
      difficulty: 3,
      requiredTool: 'knife',
      loot: [
        { name: 'thorny_vine', chance: 0.7, quantity: { min: 1, max: 2 } },
        { name: 'plant_fiber', chance: 0.5, quantity: { min: 1, max: 1 } }
      ]
    },
    naturalSpawn: [
      {
        biome: 'forest',
        chance: 0.4,
        conditions: { vegetationDensity: { min: 10 } }
      }
    ]
  },
  bamboo: {
    id: 'bamboo',
    name: { en: 'Bamboo', vi: 'Tre' },
    description: { en: 'A tall bamboo plant with strong, flexible stalks.', vi: 'Một cây tre cao với những thân cây chắc chắn và dẻo dai.' },
    emoji: '🎋',
    hp: 100,
    damage: 0,
    behavior: 'immobile',
    size: 'large',
    diet: [],
    satiation: 0,
    maxSatiation: 0,
    plantProperties: {
      vegetationContribution: 15,
      reproduction: {
        chance: 0.05,
        range: 1,
        maxOffspring: 2,
        requirements: {
          minMoisture: 50,
          minTemperature: 15,
          maxTemperature: 35,
          minVegetationDensity: 30
        }
      },
      resilience: {
        droughtResistance: 0.5,
        coldResistance: 0.6,
        heatResistance: 0.6
      }
    },
    harvestable: {
      difficulty: 2,
      requiredTool: 'knife',
      loot: [
        { name: 'bamboo_shoot', chance: 0.6, quantity: { min: 1, max: 2 } }
      ]
    },
    naturalSpawn: [
      {
        biome: 'forest',
        chance: 0.3,
        conditions: { vegetationDensity: { min: 20 } }
      }
    ]
  },
  flax_plant: {
    id: 'flax_plant',
    name: { en: 'Flax Plant', vi: 'Cây Lanh' },
    description: { en: 'A plant cultivated for its strong fibers and nutritious seeds.', vi: 'Một loại cây được trồng để lấy sợi chắc chắn và hạt dinh dưỡng.' },
    emoji: '🌱',
    hp: 60,
    damage: 0,
    behavior: 'immobile',
    size: 'small',
    diet: [],
    satiation: 0,
    maxSatiation: 0,
    plantProperties: {
      vegetationContribution: 7,
      reproduction: {
        chance: 0.12,
        range: 1,
        maxOffspring: 3,
        requirements: {
          minMoisture: 30,
          minTemperature: 10,
          maxTemperature: 25,
          minVegetationDensity: 10
        }
      },
      resilience: {
        droughtResistance: 0.4,
        coldResistance: 0.6,
        heatResistance: 0.3
      }
    },
    harvestable: {
      difficulty: 1,
      requiredTool: '',
      loot: [
        { name: 'plant_fiber', chance: 0.9, quantity: { min: 1, max: 3 } },
        { name: 'flax_seed', chance: 0.6, quantity: { min: 1, max: 2 } }
      ]
    },
    naturalSpawn: [
      {
        biome: 'grassland',
        chance: 0.4,
        conditions: { vegetationDensity: { min: 8 } }
      }
    ]
  },
  cactus: {
    id: 'cactus',
    name: { en: 'Cactus', vi: 'Xương Rồng' },
    description: { en: 'A resilient desert plant with sharp spines, sometimes bearing vibrant flowers and edible fruit.', vi: 'Một loại cây sa mạc kiên cường với gai nhọn, đôi khi ra hoa rực rỡ và quả ăn được.' },
    emoji: '🌵',
    hp: 80,
    damage: 5,
    behavior: 'immobile',
    size: 'medium',
    diet: [],
    satiation: 0,
    maxSatiation: 0,
    plantProperties: {
      vegetationContribution: 10,
      reproduction: {
        chance: 0.05,
        range: 2,
        maxOffspring: 1,
        requirements: {
          minMoisture: 5,
          minTemperature: 20,
          maxTemperature: 50,
          minVegetationDensity: 5
        }
      },
      resilience: {
        droughtResistance: 0.9,
        coldResistance: 0.1,
        heatResistance: 0.95
      }
    },
    harvestable: {
      difficulty: 2,
      requiredTool: '',
      loot: [
        { name: 'cactus_flower', chance: 0.4, quantity: { min: 1, max: 1 } },
        { name: 'cactus_fruit', chance: 0.6, quantity: { min: 1, max: 2 } }
      ]
    },
    naturalSpawn: [
      {
        biome: 'desert',
        chance: 0.6,
        conditions: { vegetationDensity: { min: 2 } }
      }
    ]
  }
};

export default plants;
