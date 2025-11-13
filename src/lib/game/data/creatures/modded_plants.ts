import type { CreatureDefinition } from '@/core/types/definitions/creature';

/**
 * Additional plant definitions for enhanced biodiversity and spawning.
 * These plants follow the same structure as core plants but are defined separately
 * to maintain moddability and avoid modifying core game files.
 */
export const moddedPlants: Record<string, CreatureDefinition> = {
  wildflower: {
    id: 'wildflower',
    name: { en: 'Wildflower', vi: 'Hoa Dại' },
    description: { en: 'A common, colorful wildflower that sways gently in the breeze.', vi: 'Một bông hoa dại phổ biến, đầy màu sắc, đung đưa nhẹ nhàng trong gió.' },
    emoji: '🌸',
    hp: 20,
    damage: 0,
    behavior: 'immobile',
    size: 'small',
    diet: [],
    satiation: 0,
    maxSatiation: 0,
    plantProperties: {
      vegetationContribution: 3,
      reproduction: {
        chance: 0.15,
        range: 1,
        maxOffspring: 4,
        requirements: {
          minMoisture: 15,
          minTemperature: 5,
          maxTemperature: 35,
          minVegetationDensity: 5
        }
      },
      resilience: {
        droughtResistance: 0.3,
        coldResistance: 0.4,
        heatResistance: 0.5
      }
    },
    harvestable: {
      difficulty: 1,
      requiredTool: '',
      loot: [
        { name: 'plant_fiber', chance: 0.9, quantity: { min: 1, max: 2 } }
      ]
    },
    naturalSpawn: [
      {
        biome: 'grassland',
        chance: 0.8,
        conditions: { vegetationDensity: { min: 2 } }
      },
      {
        biome: 'forest',
        chance: 0.6,
        conditions: { vegetationDensity: { min: 3 } }
      }
    ]
  },
  berry_bush: {
    id: 'berry_bush',
    name: { en: 'Berry Bush', vi: 'Bụi Cây Ăn Quả' },
    description: { en: 'A bush laden with juicy, edible berries and sturdy branches.', vi: 'Một bụi cây đầy quả mọng ngon ngọt, ăn được và cành cây chắc chắn.' },
    emoji: '🫐',
    hp: 60,
    damage: 0,
    behavior: 'immobile',
    size: 'medium',
    diet: [],
    satiation: 0,
    maxSatiation: 0,
    plantProperties: {
      vegetationContribution: 8,
      reproduction: {
        chance: 0.08,
        range: 2,
        maxOffspring: 2,
        requirements: {
          minMoisture: 25,
          minTemperature: 10,
          maxTemperature: 30,
          minVegetationDensity: 15
        }
      },
      resilience: {
        droughtResistance: 0.4,
        coldResistance: 0.6,
        heatResistance: 0.3
      }
    },
    harvestable: {
      difficulty: 2,
      requiredTool: '',
      loot: [
        { name: 'edible_berries', chance: 0.8, quantity: { min: 2, max: 4 } },
        { name: 'sturdy_branch', chance: 0.6, quantity: { min: 1, max: 1 } }
      ]
    },
    naturalSpawn: [
      {
        biome: 'forest',
        chance: 0.25,
        conditions: { vegetationDensity: { min: 5 } }
      }
    ]
  },
  tall_grass_patch: {
    id: 'tall_grass_patch',
    name: { en: 'Tall Grass Patch', vi: 'Bụi Cỏ Cao' },
    description: { en: 'A dense patch of tall grass that provides excellent cover and materials.', vi: 'Một bụi cỏ cao rậm rạp, cung cấp che chắn tuyệt vời và vật liệu.' },
    emoji: '🌾',
    hp: 25,
    damage: 0,
    behavior: 'immobile',
    size: 'small',
    diet: [],
    satiation: 0,
    maxSatiation: 0,
    plantProperties: {
      vegetationContribution: 4,
      reproduction: {
        chance: 0.2,
        range: 1,
        maxOffspring: 5,
        requirements: {
          minMoisture: 20,
          minTemperature: 0,
          maxTemperature: 40,
          minVegetationDensity: 0
        }
      },
      resilience: {
        droughtResistance: 0.5,
        coldResistance: 0.6,
        heatResistance: 0.7
      }
    },
    harvestable: {
      difficulty: 1,
      requiredTool: '',
      loot: [
        { name: 'dry_grass', chance: 0.95, quantity: { min: 2, max: 4 } }
      ]
    },
    naturalSpawn: [
      {
        biome: 'grassland',
        chance: 0.8,
        conditions: { vegetationDensity: { min: 0 } }
      }
    ]
  }
};

export default moddedPlants;
