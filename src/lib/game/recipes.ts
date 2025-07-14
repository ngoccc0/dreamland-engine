/**
 * @fileOverview Central recipe book for the game's crafting system.
 * @description This file aggregates crafting recipes from various modular files
 * (e.g., base game recipes, mod-added recipes) into a single, comprehensive
 * `recipes` object that the game engine can use.
 */

import type { Recipe } from "./definitions/recipe";
import { naturePlusRecipes } from "./data/recipes/nature_plus";

/**
 * The master record of all crafting recipes available in the game.
 * It combines recipes from the base game with those added by mods.
 * @type {Record<string, Recipe>}
 */
export const recipes: Record<string, Recipe> = {
    'Rìu Đá Đơn Giản': {
        result: { name: 'Rìu Đá Đơn Giản', quantity: 1, emoji: '🪓' },
        ingredients: [
            { 
                name: 'Cành Cây Chắc Chắn', 
                quantity: 1, 
            },
            { 
                name: 'Đá Cuội', 
                quantity: 1, 
            },
            { 
                name: 'Dây Gai', 
                quantity: 1, 
            }
        ],
        description: { en: 'Craft a basic stone axe. An essential tool for survival.', vi: 'Chế tạo một chiếc rìu đá cơ bản. Một công cụ cần thiết để sinh tồn.' },
    },
    'Thuốc Máu Yếu': {
        result: { name: 'Thuốc Máu Yếu', quantity: 1, emoji: '🧪' },
        ingredients: [
            { 
                name: 'Thảo Dược Chữa Lành', 
                quantity: 1,
            },
            { 
                name: 'Nước Ngầm', 
                quantity: 1, 
            }
        ],
        description: { en: 'Brew a simple health potion from herbs and clean water.', vi: 'Pha chế một lọ thuốc máu đơn giản từ thảo dược và nước sạch.' },
    },
    'Bó Đuốc': {
        result: { name: 'Bó Đuốc', quantity: 1, emoji: '🔥' },
        ingredients: [
            { name: 'Cành Cây Chắc Chắn', quantity: 1 },
            { 
                name: 'Mảnh Vải Rách', 
                quantity: 1,
            },
            { name: 'Nhựa Cây Dính', quantity: 1 }
        ],
        description: { en: 'Create a temporary light source to explore dark places.', vi: 'Tạo một nguồn sáng tạm thời để khám phá những nơi tối tăm.' },
    },
    'Thuyền Phao': {
        result: { name: 'Thuyền Phao', quantity: 1, emoji: '🛶' },
        ingredients: [
            { name: 'Da Gấu', quantity: 1 },
            { name: 'Lõi Gỗ', quantity: 5 },
            { name: 'Dây Gai', quantity: 10 }
        ],
        description: { en: 'Craft a simple raft to travel across water.', vi: 'Chế tạo một chiếc bè đơn giản để đi qua mặt nước.' },
    },
    'Dao Găm Đá': {
        result: { name: 'Dao Găm Đá', quantity: 1, emoji: '🗡️' },
        ingredients: [
            { name: 'Đá Cuội', quantity: 2 },
            { name: 'Mảnh Vải Rách', quantity: 1 }
        ],
        description: { en: 'Craft a stone dagger for self-defense.', vi: 'Chế tạo một con dao găm bằng đá để tự vệ.' },
    },
    'Khiên Gỗ': {
        result: { name: 'Khiên Gỗ', quantity: 1, emoji: '🛡️' },
        ingredients: [
            { name: 'Lõi Gỗ', quantity: 4 },
            { name: 'Da Heo Rừng', quantity: 1 }
        ],
        description: { en: 'Craft a wooden shield to block attacks.', vi: 'Chế tạo một chiếc khiên gỗ để chặn các cuộc tấn công.' },
    },
    'Băng Gạc': {
        result: { name: 'Băng Gạc', quantity: 1, emoji: '🩹' },
        ingredients: [
            { name: 'Mảnh Vải Rách', quantity: 2 },
            { name: 'Thảo Dược Chữa Lành', quantity: 1 }
        ],
        description: { en: 'Create a clean bandage to treat wounds.', vi: 'Tạo một miếng băng sạch để băng bó vết thương.' },
    },
    'Cuốc Đá': {
        result: { name: 'Cuốc Đá', quantity: 1, emoji: '⛏️' },
        ingredients: [
            { name: 'Lõi Gỗ', quantity: 2 },
            { name: 'Đá Cuội', quantity: 3 },
            { name: 'Dây Gai', quantity: 2 }
        ],
        description: { en: 'Craft a stone pickaxe for mining minerals.', vi: 'Chế tạo một chiếc cuốc đá để khai thác khoáng sản.' },
    },
    'Giáo Xương': {
        result: { name: 'Giáo Xương', quantity: 1, emoji: '🔱' },
        ingredients: [
            { name: 'Lõi Gỗ', quantity: 1 },
            { name: 'Nanh Sói', quantity: 1 },
            { name: 'Dây Gai', quantity: 2 }
        ],
        description: { en: 'Craft a bone spear for hunting and combat.', vi: 'Chế tạo một cây giáo xương để săn bắn và chiến đấu.' },
    },
    'Rìu Chiến Obsidian': {
        result: { name: 'Rìu Chiến Obsidian', quantity: 1, emoji: '🪓' },
        ingredients: [
            { name: 'Lõi Gỗ', quantity: 2 },
            { name: 'Đá Obsidian', quantity: 3 },
            { name: 'Da Gấu', quantity: 1 }
        ],
        description: { en: 'Craft a fearsome battleaxe from obsidian.', vi: 'Chế tạo một chiếc rìu chiến đáng sợ từ obsidian.' },
    },
    'Áo Giáp Da Cá Sấu': {
        result: { name: 'Áo Giáp Da Cá Sấu', quantity: 1, emoji: '👕' },
        ingredients: [
            { name: 'Da Cá Sấu', quantity: 2 },
            { name: 'Tơ Nhện Khổng lồ', quantity: 5 }
        ],
        description: { en: 'Craft a durable set of alligator hide armor.', vi: 'Chế tạo một bộ giáp bền từ da cá sấu.' },
    },
    'Thuốc Máu Mạnh': {
        result: { name: 'Thuốc Máu Mạnh', quantity: 1, emoji: '🧪' },
        ingredients: [
            { name: 'Thuốc Máu Yếu', quantity: 1 },
            { name: 'Cây Thuốc Núi', quantity: 1 },
            { name: 'Nước Ngầm', quantity: 1 }
        ],
        description: { en: 'Brew a potent healing potion.', vi: 'Pha chế một lọ thuốc chữa bệnh mạnh.' },
    },
    'Cung Tên Harpy': {
        result: { name: 'Cung Tên Harpy', quantity: 1, emoji: '🏹' },
        ingredients: [
            { name: 'Lõi Gỗ', quantity: 3 },
            { name: 'Lông Harpie', quantity: 5 },
            { name: 'Tơ Nhện Khổng lồ', quantity: 3 }
        ],
        description: { en: 'Craft a lightweight and precise bow.', vi: 'Chế tạo một cây cung nhẹ và chính xác.' },
    },
    'Trượng Lõi Đá': {
        result: { name: 'Trượng Lõi Đá', quantity: 1, emoji: '🪄' },
        ingredients: [
            { name: 'Lõi Người Đá', quantity: 1 },
            { name: 'Lõi Gỗ', quantity: 1 },
            { name: 'Pha Lê Núi', quantity: 2 }
        ],
        description: { en: 'Imbue a staff with the power of a golem core.', vi: 'Thấm nhuần một cây trượng với sức mạnh của lõi người đá.' },
    },
    'Thuốc Thể Lực': {
        result: { name: 'Thuốc Thể Lực', quantity: 1, emoji: '🥤' },
        ingredients: [
            { name: 'Quả Mọng Ăn Được', quantity: 5 },
            { name: 'Mật Ong Hoang', quantity: 1 },
            { name: 'Nước Ngầm', quantity: 1 }
        ],
        description: { en: 'Mix a potion to rapidly restore stamina.', vi: 'Pha một lọ thuốc để phục hồi thể lực nhanh chóng.' },
    },
    'Búa Chiến Người Lùn': {
        result: { name: 'Búa Chiến Người Lùn', quantity: 1, emoji: '🔨' },
        ingredients: [
            { name: 'Quặng Sắt', quantity: 5 },
            { name: 'Lõi Người Đá', quantity: 1 },
            { name: 'Da Gấu', quantity: 2 }
        ],
        description: { en: 'Forge a mighty war hammer.', vi: 'Rèn một chiếc búa chiến hùng mạnh.' },
    },
    ...naturePlusRecipes,
};
