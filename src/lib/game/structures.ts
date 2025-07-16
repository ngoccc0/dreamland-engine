
/**
 * @fileOverview Defines all structures in the game.
 * @description This file contains definitions for both naturally spawning structures
 * (like ruins) and structures that can be built by the player (like campfires and shelters).
 */

import type { Structure, StructureDefinition } from "./types";

/**
 * A record of naturally-occurring structures that can spawn in the world.
 * These are not buildable by the player.
 * @type {Record<string, StructureDefinition>}
 */
export const structureDefinitions: Record<string, StructureDefinition> = {
    'watchtower_ruin': {
        name: { en: 'Watchtower Ruin', vi: 'Tàn tích tháp canh' },
        description: { en: 'The ruins of a stone watchtower stand silently, offering a commanding view of the surroundings.', vi: 'Tàn tích của một tháp canh bằng đá đứng im lặng, cung cấp một tầm nhìn bao quát ra xung quanh.' },
        emoji: '🏰',
        providesShelter: true,
        conditions: { humanPresence: { min: 2 }, elevation: { min: 2 }, chance: 0.03 } 
    },
    'abandoned_altar': {
        name: { en: 'Abandoned Altar', vi: 'Bàn thờ bị bỏ hoang' },
        description: { en: 'An ancient stone altar, covered in moss, radiates a faint energy.', vi: 'Một bàn thờ đá cổ, phủ đầy rêu, tỏa ra một năng lượng mờ nhạt.' },
        emoji: '🗿',
        providesShelter: false,
        loot: [{ name: 'crystal_shard', chance: 0.1, quantity: { min: 1, max: 1 } }],
        conditions: { magicAffinity: { min: 6 }, chance: 0.01 }
    },
    'geyser': {
        name: { en: 'Geyser', vi: 'Mạch nước phun' },
        description: { en: 'A natural hot spring that occasionally erupts with a column of steam and hot water.', vi: 'Một suối nước nóng tự nhiên thỉnh thoảng phun ra một cột hơi nước và nước nóng.' },
        emoji: '💨',
        providesShelter: false,
        conditions: { temperature: { min: 7 }, chance: 0.15 }
    },
    'abandoned_mine_entrance': {
        name: { en: 'Abandoned Mine Entrance', vi: 'Cửa hầm mỏ bỏ hoang' },
        description: { en: 'The entrance to an old mine, reinforced with rotting wooden beams. Valuable resources may be inside.', vi: 'Lối vào một hầm mỏ cũ, được gia cố bằng những thanh gỗ mục nát. Có thể có tài nguyên quý giá bên trong.' },
        emoji: '⛏️',
        providesShelter: true,
        loot: [
            { name: 'iron_ore', chance: 0.3, quantity: { min: 1, max: 2 } },
            { name: 'rusty_key', chance: 0.1, quantity: { min: 1, max: 1 } }
        ],
        conditions: { elevation: { min: 5 }, dangerLevel: { min: 6 }, chance: 0.05 }
    },
    'floating_island': {
        name: { en: 'Floating Island', vi: 'Đảo Bay' },
        description: { en: 'A massive chunk of earth hangs impossibly in the sky, with waterfalls cascading into the clouds below.', vi: 'Một khối đất khổng lồ lơ lửng không thể tưởng tượng được trên bầu trời, với những thác nước đổ xuống những đám mây bên dưới.' },
        emoji: '☁️',
        providesShelter: false,
        conditions: { elevation: { min: 10 }, magicAffinity: { min: 8 }, chance: 0.01 } 
    },
};

/**
 * A record of structures that the player can build.
 * These definitions include build costs and functional effects.
 * @type {Record<string, Structure>}
 */
export const buildableStructures: Record<string, Structure> = {
    'Lửa trại': {
        name: { en: 'Campfire', vi: 'Lửa trại' },
        description: { en: 'A small, controlled fire that provides warmth, light, and raises the surrounding temperature.', vi: 'Một ngọn lửa nhỏ được kiểm soát cung cấp hơi ấm, ánh sáng và tăng nhiệt độ xung quanh.' },
        emoji: '🔥',
        providesShelter: false,
        buildable: true,
        buildCost: [
            { name: 'cobblestone', quantity: 4 },
            { name: 'sturdy_branch', quantity: 2 },
            { name: 'flint', quantity: 1}
        ],
        heatValue: 3,
    },
    'Lều trú ẩn': {
        name: { en: 'Shelter Tent', vi: 'Lều trú ẩn' },
        description: { en: 'A simple shelter made from branches and leaves, offering protection from the elements.', vi: 'Một nơi trú ẩn đơn giản làm từ cành cây và lá cây, cung cấp sự bảo vệ khỏi các yếu tố thời tiết.' },
        emoji: '⛺',
        providesShelter: true,
        buildable: true,
        buildCost: [
            { name: 'sturdy_branch', quantity: 5 },
            { name: 'thorny_vine', quantity: 3 },
            { name: 'large_leaf', quantity: 10 }
        ],
        restEffect: { hp: 20, stamina: 40, mana: 0 },
        heatValue: 1,
    },
    'Nhà trú ẩn kiên cố': {
        name: { en: 'Sturdy Shelter', vi: 'Nhà trú ẩn kiên cố' },
        description: { en: 'A small house of wood and stone, providing better protection from the elements and wild animals.', vi: 'Một ngôi nhà nhỏ bằng gỗ và đá, cung cấp sự bảo vệ tốt hơn khỏi các yếu tố thời tiết và động vật hoang dã.' },
        emoji: '🏠',
        providesShelter: true,
        buildable: true,
        buildCost: [
            { name: 'wood_core', quantity: 4 },
            { name: 'cobblestone', quantity: 8 },
            { name: 'thorny_vine', quantity: 4 }
        ],
        restEffect: { hp: 40, stamina: 80, mana: 0 },
        heatValue: 2,
    },
};
