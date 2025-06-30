import type { Recipe } from "./types";

export const recipes: Record<string, Recipe> = {
    'Rìu Đá Đơn Giản': {
        result: { name: 'Rìu Đá Đơn Giản', quantity: 1 },
        ingredients: [
            { name: 'Cành Cây Chắc Chắn', quantity: 2 },
            { name: 'Đá Cuội', quantity: 1 },
            { name: 'Dây Gai', quantity: 1 }
        ],
        description: 'Chế tạo một chiếc rìu đá cơ bản. Công cụ cần thiết để sinh tồn.',
    },
    'Thuốc Máu Yếu': {
        result: { name: 'Thuốc Máu Yếu', quantity: 1 },
        ingredients: [
            { name: 'Thảo Dược Chữa Lành', quantity: 1 },
            { name: 'Nước Ngầm', quantity: 1 }
        ],
        description: 'Pha chế một lọ thuốc hồi máu từ thảo dược và nước sạch.',
    },
    'Bó Đuốc': {
        result: { name: 'Bó Đuốc', quantity: 1 },
        ingredients: [
            { name: 'Cành Cây Chắc Chắn', quantity: 1 },
            { name: 'Mảnh Vải Rách', quantity: 1 },
            { name: 'Nhựa Cây Dính', quantity: 1 }
        ],
        description: 'Tạo ra một nguồn sáng tạm thời để khám phá những nơi tối tăm.',
    },
};
