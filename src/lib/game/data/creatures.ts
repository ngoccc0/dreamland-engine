import { CreatureDefinitionSchema } from "../definitions/creature";
import { z } from "zod";

export const creatures: Record<string, z.infer<typeof CreatureDefinitionSchema>> = {
    'Sói': {
        name: { en: 'Wolf', vi: 'Sói' },
        description: { en: 'A common predator, often hunts in packs.', vi: 'Một loài thú săn mồi phổ biến, thường đi săn theo bầy.' },
        emoji: '🐺',
        tier: 2,
        creatureType: 'animal',
        size: 'medium',
        behavior: 'territorial',
        diet: ['Thịt Heo Rừng', 'Thịt Thỏ'],
        hp: 30,
        damage: 10,
        dropTable: [
            { name: 'Thịt Sói Sống', chance: 0.7, quantity: { min: 1, max: 1 } },
            { name: 'Nanh Sói', chance: 0.15, quantity: { min: 1, max: 2 } }
        ]
    },
    'Nhện khổng lồ': {
        name: { en: 'Giant Spider', vi: 'Nhện khổng lồ' },
        description: { en: 'A massive arachnid that spins thick, sticky webs.', vi: 'Một loài nhện khổng lồ dệt những mạng nhện dày và dính.' },
        emoji: '🕷️',
        tier: 3,
        creatureType: 'animal',
        size: 'medium',
        behavior: 'territorial',
        diet: ['Heo Rừng', 'Yêu Tinh Rừng'],
        hp: 40,
        damage: 15,
        dropTable: [
            { name: 'Tơ Nhện Khổng lồ', chance: 0.6, quantity: { min: 1, max: 3 } },
            { name: 'Mắt Nhện', chance: 0.1, quantity: { min: 2, max: 8 } }
        ]
    },
    'Heo Rừng': {
        name: { en: 'Wild Boar', vi: 'Heo Rừng' },
        description: { en: 'A stout creature with sharp tusks. It becomes aggressive if provoked.', vi: 'Một sinh vật to khỏe với cặp nanh sắc nhọn. Nó sẽ trở nên hung dữ nếu bị khiêu khích.' },
        emoji: '🐗',
        tier: 2,
        creatureType: 'animal',
        size: 'medium',
        behavior: 'defensive',
        diet: ['Quả Mọng Ăn Được', 'Rễ Cây Hiếm'],
        hp: 50,
        damage: 8,
        dropTable: [
            { name: 'Thịt Heo Rừng', chance: 0.8, quantity: { min: 1, max: 2 } },
            { name: 'Da Heo Rừng', chance: 0.2, quantity: { min: 1, max: 1 } }
        ]
    },
    'Gấu': {
        name: { en: 'Bear', vi: 'Gấu' },
        description: { en: 'A large, powerful omnivore that fiercely defends its territory.', vi: 'Một loài động vật ăn tạp to lớn và mạnh mẽ, quyết liệt bảo vệ lãnh thổ của mình.' },
        emoji: '🐻',
        tier: 4,
        creatureType: 'animal',
        size: 'large',
        behavior: 'territorial',
        diet: ['Heo Rừng', 'Cá sấu', 'Mật Ong Hoang'],
        hp: 80,
        damage: 20,
        dropTable: [
            { name: 'Da Gấu', chance: 0.5, quantity: { min: 1, max: 1 } },
            { name: 'Móng Vuốt Gấu', chance: 0.3, quantity: { min: 2, max: 4 } }
        ]
    },
    'Thỏ hoang hung dữ': {
        name: { en: 'Aggressive Rabbit', vi: 'Thỏ hoang hung dữ' },
        description: { en: 'Don\'t let its cute appearance fool you. This rabbit has a mean streak.', vi: 'Đừng để vẻ ngoài dễ thương của nó đánh lừa. Con thỏ này rất xấu tính.' },
        emoji: '🐇',
        tier: 1,
        creatureType: 'animal',
        size: 'small',
        behavior: 'defensive',
        diet: ['Hoa Dại', 'Lúa Mì'],
        hp: 20,
        damage: 5,
        dropTable: [
            { name: 'Thịt Thỏ', chance: 0.6, quantity: { min: 1, max: 2 } },
            { name: 'Da Thú Nhỏ', chance: 0.2, quantity: { min: 1, max: 1 } }
        ]
    },
    'Cây Cổ Thụ': {
        name: { en: 'Ancient Tree', vi: 'Cây Cổ Thụ' },
        description: { en: 'A massive, ancient tree whose bark is as hard as rock.', vi: 'Một cây cổ thụ khổng lồ với lớp vỏ cứng như đá.' },
        emoji: '🌳',
        tier: 3,
        creatureType: 'plant',
        harvestable: true,
        harvestTool: 'Rìu Đá Đơn Giản',
        size: 'massive',
        behavior: 'immobile',
        hp: 100,
        damage: 0,
        diet: [],
        dropTable: [
            { name: 'Lõi Gỗ', chance: 1, quantity: { min: 5, max: 10 } },
            { name: 'Vỏ Cây Cổ Thụ', chance: 0.5, quantity: { min: 1, max: 2 } },
            { name: 'Nhựa Cây Dính', chance: 0.2, quantity: { min: 1, max: 1 } },
        ]
    },
     'Mỏ Sắt': {
        name: { en: 'Iron Deposit', vi: 'Mỏ Sắt' },
        description: { en: 'An outcropping of rock rich with iron ore.', vi: 'Một mỏ đá lộ thiên chứa đầy quặng sắt.' },
        emoji: '⛏️',
        tier: 2,
        creatureType: 'plant', // Categorized as a harvestable "plant"
        harvestable: true,
        harvestTool: 'Cuốc Đá',
        size: 'medium',
        behavior: 'immobile',
        hp: 50,
        damage: 0,
        diet: [],
        dropTable: [
            { name: 'Quặng Sắt', chance: 1, quantity: { min: 2, max: 5 } },
            { name: 'Đá Cuội', chance: 0.5, quantity: { min: 3, max: 6 } }
        ]
    },
}
