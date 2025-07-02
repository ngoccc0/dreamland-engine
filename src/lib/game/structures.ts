import type { Structure } from "./types";

export const structureDefinitions: Record<string, Omit<Structure, 'buildCost' | 'buildable' | 'restEffect' | 'heatValue'>> = {
    // --- Natural Structures ---
    'Tàn tích tháp canh': {
        name: 'Tàn tích tháp canh',
        description: 'Phế tích của một tháp canh bằng đá đứng im lặng, cung cấp một cái nhìn bao quát về xung quanh.',
        emoji: '🏰',
        providesShelter: true,
    },
    'Bàn thờ bị bỏ hoang': {
        name: 'Bàn thờ bị bỏ hoang',
        description: 'Một bàn thờ đá cổ xưa, phủ đầy rêu, tỏa ra một năng lượng yếu ớt.',
        emoji: '🗿',
        providesShelter: false,
    },
    'Mạch nước phun': {
        name: 'Mạch nước phun',
        description: 'Một mạch nước nóng tự nhiên, thỉnh thoảng phun lên một cột hơi nước và nước nóng.',
        emoji: '💨',
        providesShelter: false,
    },
    'Cửa hầm mỏ bỏ hoang': {
        name: 'Cửa hầm mỏ bỏ hoang',
        description: 'Lối vào một hầm mỏ cũ, được gia cố bằng những thanh gỗ đã mục nát. Có thể có những tài nguyên giá trị bên trong.',
        emoji: '⛏️',
        providesShelter: true,
    },
};

export const buildableStructures: Record<string, Structure> = {
    'Lửa trại': {
        name: 'Lửa trại',
        description: 'Một đống lửa nhỏ, được kiểm soát, cung cấp sự ấm áp, ánh sáng và tăng nhiệt độ khu vực xung quanh.',
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
        description: 'Một nơi trú ẩn đơn giản làm từ cành cây và lá, giúp che chắn khỏi các yếu tố thời tiết.',
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
        description: 'Một ngôi nhà nhỏ bằng gỗ và đá, cung cấp sự bảo vệ tốt hơn khỏi các yếu tố thời tiết và thú dữ.',
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

// Add a new item needed for building
export const newBuildItems = {
    'Lá cây lớn': {
        description: 'Những chiếc lá rộng bản, thích hợp để lợp mái.',
        tier: 1,
        category: 'Material',
        emoji: '🍃',
        effects: [],
        baseQuantity: { min: 5, max: 15 }
    }
}
