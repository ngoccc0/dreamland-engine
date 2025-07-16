/**
 * @fileOverview Defines all structures in the game.
 * @description This file contains definitions for both naturally spawning structures
 * (like ruins) and structures that can be built by the player (like campfires and shelters).
 */

import type { Structure } from "./types";

/**
 * A record of naturally-occurring structures that can spawn in the world.
 * These are not buildable by the player.
 * @type {Record<string, Omit<Structure, 'buildCost' | 'buildable' | 'restEffect' | 'heatValue'>>}
 */
export const structureDefinitions: Record<string, Omit<Structure, 'buildCost' | 'buildable' | 'restEffect' | 'heatValue'>> = {
    // --- Natural Structures ---
    'Tàn tích tháp canh': {
        name: 'Tàn tích tháp canh',
        description: 'structure_watchtower_ruin_desc',
        emoji: '🏰',
        providesShelter: true,
    },
    'Bàn thờ bị bỏ hoang': {
        name: 'Bàn thờ bị bỏ hoang',
        description: 'structure_abandoned_altar_desc',
        emoji: '🗿',
        providesShelter: false,
    },
    'Mạch nước phun': {
        name: 'Mạch nước phun',
        description: 'structure_geyser_desc',
        emoji: '💨',
        providesShelter: false,
    },
    'Cửa hầm mỏ bỏ hoang': {
        name: 'Cửa hầm mỏ bỏ hoang',
        description: 'structure_abandoned_mine_entrance_desc',
        emoji: '⛏️',
        providesShelter: true,
        // Loot and conditions moved here from templates
        loot: [
            { name: 'Quặng Sắt', chance: 0.3, quantity: { min: 1, max: 2 } },
            { name: 'Chìa Khóa Rỉ Sét', chance: 0.1, quantity: { min: 1, max: 1 } }
        ],
        conditions: { elevation: { min: 5 }, dangerLevel: { min: 6 }, chance: 0.05 }
    },
    'Đảo Bay': {
        name: 'Đảo Bay',
        description: 'structure_floating_island_desc',
        emoji: '☁️',
        providesShelter: false,
    },
};

/**
 * A record of structures that the player can build.
 * These definitions include build costs and functional effects.
 * @type {Record<string, Structure>}
 */
export const buildableStructures: Record<string, Structure> = {
    'Lửa trại': {
        name: 'Lửa trại',
        description: 'structure_campfire_desc',
        emoji: '🔥',
        providesShelter: false,
        buildable: true,
        buildCost: [
            { name: 'Đá Cuội', quantity: 4 },
            { name: 'Cành Cây Chắc Chắn', quantity: 2 },
            { name: 'Đá Lửa', quantity: 1}
        ],
        heatValue: 3,
    },
    'Lều trú ẩn': {
        name: 'Lều trú ẩn',
        description: 'structure_shelter_tent_desc',
        emoji: '⛺',
        providesShelter: true,
        buildable: true,
        buildCost: [
            { name: 'Cành Cây Chắc Chắn', quantity: 5 },
            { name: 'Dây Gai', quantity: 3 },
            { name: 'Lá cây lớn', quantity: 10 }
        ],
        restEffect: { hp: 20, stamina: 40 },
        heatValue: 1,
    },
    'Nhà trú ẩn kiên cố': {
        name: 'Nhà trú ẩn kiên cố',
        description: 'structure_sturdy_shelter_desc',
        emoji: '🏠',
        providesShelter: true,
        buildable: true,
        buildCost: [
            { name: 'Lõi Gỗ', quantity: 4 },
            { name: 'Đá Cuội', quantity: 8 },
            { name: 'Dây Gai', quantity: 4 }
        ],
        restEffect: { hp: 40, stamina: 80 },
        heatValue: 2,
    },
};
