/**
 * Wildlife Species Definitions
 *
 * @remarks
 * Base species templates for all wildlife creatures in the game.
 * Defines genetics, diet, behavior, and breeding characteristics.
 */

import type { SpeciesDefinition, DietType } from '@/core/types/wildlife-creature';
import type { CreatureGenetics, CreaturePersonality } from '@/core/types/creature-genetics';

/**
 * Base genetics for herbivores.
 */
const herbivoreBaseGenetics: CreatureGenetics = {
    hungerRate: 1.2,
    speed: 5,
    size: 1.0,
    fearfulness: 70,
};

/**
 * Base genetics for carnivores.
 */
const carnivoreBaseGenetics: CreatureGenetics = {
    hungerRate: 1.5,
    speed: 6,
    size: 1.2,
    fearfulness: 20,
};

/**
 * Base genetics for omnivores.
 */
const omnivoreBaseGenetics: CreatureGenetics = {
    hungerRate: 1.0,
    speed: 4,
    size: 0.8,
    fearfulness: 50,
};

/**
 * Deer - timid herbivore, pack animal.
 */
export const deerSpecies: SpeciesDefinition = {
    id: 'deer',
    name: { en: 'Deer', vi: 'Hươu' },
    dietType: 'herbivorous',
    baseGenetics: herbivoreBaseGenetics,
    personality: {
        caution: 80,
        sociability: 75,
        laziness: 30,
        aggression: 10,
    },
    size: 'medium',
    emoji: '🦌',
    trophicLevel: 'herbivore',
    foodItems: ['grass', 'leaves', 'berries'],
    adultFeedingThreshold: 10,
    packSize: 5,
    canBreed: true,
    hungerRateMultiplier: 1.0,
    description: { en: 'A graceful herbivore that travels in herds', vi: 'Một loài có thể ăn cỏ độc lập và di chuyển thành bầy' },
};

/**
 * Wolf - aggressive carnivore, pack hunter.
 */
export const wolfSpecies: SpeciesDefinition = {
    id: 'wolf',
    name: { en: 'Wolf', vi: 'Sói' },
    dietType: 'carnivorous',
    baseGenetics: carnivoreBaseGenetics,
    personality: {
        aggression: 85,
        sociability: 80,
        caution: 30,
        greediness: 70,
    },
    size: 'large',
    emoji: '🐺',
    trophicLevel: 'carnivore',
    preySpecies: ['deer', 'rabbit'],
    adultFeedingThreshold: 8,
    packSize: 6,
    canBreed: true,
    hungerRateMultiplier: 1.2,
    description: { en: 'A fierce predator that hunts in coordinated packs', vi: 'Một loài thợ săn hung dữ với khả năng đồng phục tấn công' },
};

/**
 * Rabbit - skittish, fast herbivore.
 */
export const rabbitSpecies: SpeciesDefinition = {
    id: 'rabbit',
    name: { en: 'Rabbit', vi: 'Thỏ' },
    dietType: 'herbivorous',
    baseGenetics: {
        hungerRate: 1.4,
        speed: 7,
        size: 0.5,
        fearfulness: 90,
    },
    personality: {
        caution: 90,
        laziness: 20,
        aggression: 0,
        sociability: 50,
        curiosity: 60,
    },
    size: 'small',
    emoji: '🐰',
    trophicLevel: 'herbivore',
    foodItems: ['grass', 'vegetables'],
    adultFeedingThreshold: 6,
    packSize: undefined,
    canBreed: true,
    hungerRateMultiplier: 0.9,
    description: { en: 'A small, quick herbivore prone to fleeing', vi: 'Một loài nhỏ, nhanh nhẹn có khuynh hướng chạy trốn' },
};

/**
 * Bear - omnivore, strong and independent.
 */
export const bearSpecies: SpeciesDefinition = {
    id: 'bear',
    name: { en: 'Bear', vi: 'Gấu' },
    dietType: 'omnivorous',
    baseGenetics: {
        hungerRate: 1.8,
        speed: 3,
        size: 2.0,
        fearfulness: 10,
    },
    personality: {
        aggression: 60,
        greediness: 80,
        laziness: 50,
        caution: 40,
        curiosity: 50,
    },
    size: 'large',
    emoji: '🐻',
    trophicLevel: 'omnivore',
    foodItems: ['berries', 'fish', 'honey'],
    preySpecies: ['deer', 'rabbit'],
    adultFeedingThreshold: 12,
    packSize: undefined,
    canBreed: true,
    hungerRateMultiplier: 1.3,
    description: { en: 'A large, powerful omnivore that forages widely', vi: 'Một loài lớn mạnh, ăn chạm cả động vật và thực vật' },
};

/**
 * Fox - cunning omnivore, solitary.
 */
export const foxSpecies: SpeciesDefinition = {
    id: 'fox',
    name: { en: 'Fox', vi: 'Cáo' },
    dietType: 'omnivorous',
    baseGenetics: {
        hungerRate: 1.1,
        speed: 6,
        size: 0.7,
        fearfulness: 40,
    },
    personality: {
        curiosity: 85,
        greediness: 75,
        aggression: 50,
        caution: 60,
        laziness: 40,
    },
    size: 'medium',
    emoji: '🦊',
    trophicLevel: 'omnivore',
    foodItems: ['berries', 'small rodents'],
    preySpecies: ['rabbit'],
    adultFeedingThreshold: 9,
    packSize: undefined,
    canBreed: true,
    hungerRateMultiplier: 1.0,
    description: { en: 'An intelligent omnivore known for cleverness', vi: 'Một loài thông minh, ngoạc động có tính tò mò cao' },
};

/**
 * Eagle - aerial predator.
 */
export const eagleSpecies: SpeciesDefinition = {
    id: 'eagle',
    name: { en: 'Eagle', vi: 'Đại Bàng' },
    dietType: 'carnivorous',
    baseGenetics: {
        hungerRate: 0.9,
        speed: 8,
        size: 0.6,
        fearfulness: 5,
    },
    personality: {
        aggression: 90,
        greediness: 70,
        curiosity: 50,
        laziness: 10,
    },
    size: 'medium',
    emoji: '🦅',
    trophicLevel: 'carnivore',
    preySpecies: ['rabbit', 'deer'],
    adultFeedingThreshold: 7,
    packSize: undefined,
    canBreed: true,
    hungerRateMultiplier: 1.0,
    description: { en: 'A swift aerial predator that hunts from above', vi: 'Một loài thợ săn nhanh nhẹn từ trên không' },
};

/**
 * All registered species.
 */
export const allSpecies: SpeciesDefinition[] = [deerSpecies, wolfSpecies, rabbitSpecies, bearSpecies, foxSpecies, eagleSpecies];

/**
 * Get a species definition by ID.
 *
 * @param speciesId Species to lookup
 * @returns Species definition or undefined
 */
export function getSpecies(speciesId: string): SpeciesDefinition | undefined {
    return allSpecies.find((s) => s.id === speciesId);
}
