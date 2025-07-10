import type { Recipe } from '@/lib/game/definitions/recipe';

export const naturePlusRecipes: Record<string, Recipe> = {
    'Than Củi': {
        result: { name: 'Than Củi', quantity: 1, emoji: '⚫🔥' },
        ingredients: [
            { name: 'Lõi Gỗ', quantity: 1 }
        ],
        description: 'recipe_charcoal_desc',
        requiredTool: 'Đá Lửa',
    },
    'Thép Rèn': {
        result: { name: 'Thép Rèn', quantity: 1, emoji: '🔗⚔️' },
        ingredients: [
            { name: 'Quặng Sắt', quantity: 2 },
            { name: 'Than Củi', quantity: 1 }
        ],
        description: 'recipe_wrought_iron_desc',
        requiredTool: 'Lò Rèn',
    },
    'Vải Bền': {
        result: { name: 'Vải Bền', quantity: 1, emoji: '👕💪' },
        ingredients: [
            { name: 'Dây Gai', quantity: 3 },
            { name: 'Sợi Thực Vật', quantity: 2 }
        ],
        description: 'recipe_durable_cloth_desc',
        requiredTool: 'Đá Mài',
    },
    'Lông Thú Dày': {
        result: { name: 'Lông Thú Dày', quantity: 1, emoji: '🐻‍❄️🧶' },
        ingredients: [
            { name: 'Lông Sói Đen', quantity: 2 }
        ],
        description: 'recipe_thick_fur_desc',
        requiredTool: 'Đá Mài',
    },
    'Kính Quang Học': {
        result: { name: 'Kính Quang Học', quantity: 1, emoji: '🔍💡' },
        ingredients: [
            { name: 'Cát Thường', quantity: 3 },
            { name: 'Than Củi', quantity: 1 }
        ],
        description: 'recipe_optical_glass_desc',
        requiredTool: 'Lò Nung',
    },
    'Than Hoạt Tính': {
        result: { name: 'Than Hoạt Tính', quantity: 1, emoji: '⚫💧' },
        ingredients: [
            { name: 'Than Củi', quantity: 2 }
        ],
        description: 'recipe_activated_charcoal_desc',
        requiredTool: 'Lò Nung',
    },
    'Nước Sạch': {
        result: { name: 'Nước Sạch', quantity: 1, emoji: '💧✅' },
        ingredients: [
            { name: 'Bình Nước Cũ', quantity: 1 },
            { name: 'Nước Bùn', quantity: 1 },
            { name: 'Than Hoạt Tính', quantity: 1 }
        ],
        description: 'recipe_clean_water_desc',
        requiredTool: 'Đá Mài',
    },
    'Thuốc Hồi Phục Thể Lực Mạnh': {
        result: { name: 'Thuốc Hồi Phục Thể Lực Mạnh', quantity: 1, emoji: '🧪🏃' },
        ingredients: [
            { name: 'Thảo Dược Chữa Lành', quantity: 2 },
            { name: 'Rễ Cây Ma Thuật', quantity: 1 },
            { name: 'Nước Sạch', quantity: 1 }
        ],
        description: 'recipe_strong_stamina_potion_desc',
        requiredTool: 'Đá Mài',
    },
    'Dây Thừng Chắc Chắn': {
        result: { name: 'Dây Thừng Chắc Chắn', quantity: 1, emoji: '🔗🧵' },
        ingredients: [
            { name: 'Dây Gai', quantity: 2 },
            { name: 'Sợi Thực Vật', quantity: 3 }
        ],
        description: 'recipe_sturdy_rope_desc',
        requiredTool: 'Đá Mài',
    },
    'Keo Nhựa Cây': {
        result: { name: 'Keo Nhựa Cây', quantity: 1, emoji: '🍯🌳' },
        ingredients: [
            { name: 'Lõi Gỗ', quantity: 2 },
            { name: 'Than Củi', quantity: 1 }
        ],
        description: 'recipe_tree_sap_glue_desc',
        requiredTool: 'Lò Nung',
    },
    'Da Thuộc': {
        result: { name: 'Da Thuộc', quantity: 1, emoji: '🧷🐻' },
        ingredients: [
            { name: 'Da Gấu', quantity: 1 },
            { name: 'Than Củi', quantity: 1 }
        ],
        description: 'recipe_tanned_leather_desc',
        requiredTool: 'Đá Mài',
    },
    'Thép Hợp Kim': {
        result: { name: 'Thép Hợp Kim', quantity: 1, emoji: '💎⚔️' },
        ingredients: [
            { name: 'Thép Rèn', quantity: 2 },
            { name: 'Quặng Sắt', quantity: 1 }
        ],
        description: 'recipe_steel_alloy_desc',
        requiredTool: 'Lò Rèn',
    },
    'Bình Đất Sét': {
        result: { name: 'Bình Đất Sét', quantity: 1, emoji: '🏺💧' },
        ingredients: [
            { name: 'Đất Sét', quantity: 3 },
        ],
        description: 'recipe_clay_pot_desc',
        requiredTool: 'Lò Nung',
    },
    'Vữa Xây Dựng': {
        result: { name: 'Vữa Xây Dựng', quantity: 1, emoji: '🧱💧' },
        ingredients: [
            { name: 'Đất Sét', quantity: 2 },
            { name: 'Cát Thường', quantity: 1 },
            { name: 'Nước Bùn', quantity: 1 }
        ],
        description: 'recipe_mortar_desc',
        requiredTool: 'Đá Mài',
    },
    'Đèn Lồng Đom Đóm': {
        result: { name: 'Đèn Lồng Đom Đóm', quantity: 1, emoji: '💡✨' },
        ingredients: [
            { name: 'Lõi Gỗ Rỗng', quantity: 1 },
            { name: 'Đom Đóm Phát Sáng', quantity: 5 },
            { name: 'Dây Gai', quantity: 2 }
        ],
        description: 'recipe_firefly_lantern_desc',
        requiredTool: 'Rìu Đá Đơn Giản',
    },
    'Thuốc Giải Độc Thảo Mộc': {
        result: { name: 'Thuốc Giải Độc Thảo Mộc', quantity: 1, emoji: '💉🌿' },
        ingredients: [
            { name: 'Nọc Rắn Độc', quantity: 1 },
            { name: 'Thảo Dược Chữa Lành', quantity: 3 },
            { name: 'Rễ Cây Ma Thuật', quantity: 1 }
        ],
        description: 'recipe_herbal_antidote_desc',
        requiredTool: 'Đá Mài',
    },
    'Áo Giáp Lông Sói': {
        result: { name: 'Áo Giáp Lông Sói', quantity: 1, emoji: '🧥🐺' },
        ingredients: [
            { name: 'Lông Sói Đen', quantity: 5 },
            { name: 'Da Gấu', quantity: 2 },
            { name: 'Dây Gai', quantity: 3 }
        ],
        description: 'recipe_wolf_pelt_armor_desc',
        requiredTool: 'Đá Mài',
    },
    'Áo Giáp Da Thuộc': {
        result: { name: 'Áo Giáp Da Thuộc', quantity: 1, emoji: '🛡️🐻' },
        ingredients: [
            { name: 'Da Thuộc', quantity: 3 },
            { name: 'Vải Bền', quantity: 2 },
            { name: 'Dây Thừng Chắc Chắn', quantity: 1 }
        ],
        description: 'recipe_tanned_leather_armor_desc',
        requiredTool: 'Đá Mài',
    },
    'Dao Sinh Tồn Đa Năng': {
        result: { name: 'Dao Sinh Tồn Đa Năng', quantity: 1, emoji: '🔪🛠️' },
        ingredients: [
            { name: 'Thép Rèn', quantity: 2 },
            { name: 'Lõi Gỗ', quantity: 1 },
            { name: 'Dây Gai', quantity: 1 }
        ],
        description: 'recipe_survival_knife_desc',
        requiredTool: 'Lò Rèn',
    },
    'Bình Lọc Nước Cầm Tay': {
        result: { name: 'Bình Lọc Nước Cầm Tay', quantity: 1, emoji: '🥤💧' },
        ingredients: [
            { name: 'Lõi Gỗ Rỗng', quantity: 1 },
            { name: 'Vải Bền', quantity: 1 },
            { name: 'Than Hoạt Tính', quantity: 1 }
        ],
        description: 'recipe_water_filter_canteen_desc',
        requiredTool: 'Đá Mài',
    },
    'Túi Ngủ Giữ Nhiệt': {
        result: { name: 'Túi Ngủ Giữ Nhiệt', quantity: 1, emoji: '🛌🌡️' },
        ingredients: [
            { name: 'Vải Bền', quantity: 3 },
            { name: 'Lông Thú Dày', quantity: 2 },
            { name: 'Dây Gai', quantity: 2 }
        ],
        description: 'recipe_insulated_sleeping_bag_desc',
        requiredTool: 'Đá Mài',
    },
    'Bẫy Động Vật Lớn': {
        result: { name: 'Bẫy Động Vật Lớn', quantity: 1, emoji: '🪤🐻' },
        ingredients: [
            { name: 'Lõi Gỗ', quantity: 5 },
            { name: 'Dây Gai', quantity: 3 },
            { name: 'Thép Rèn', quantity: 1 }
        ],
        description: 'recipe_large_animal_trap_desc',
        requiredTool: 'Rìu Đá Đơn Giản',
    },
    'Hộp Bảo Quản Thực Phẩm': {
        result: { name: 'Hộp Bảo Quản Thực Phẩm', quantity: 1, emoji: '📦🍎' },
        ingredients: [
            { name: 'Lõi Gỗ', quantity: 4 },
            { name: 'Sỏi', quantity: 2 },
            { name: 'Tinh Thể Nước Đọng', quantity: 1 }
        ],
        description: 'recipe_food_preservation_box_desc',
        requiredTool: 'Đá Mài',
    },
    'La Bàn Tinh Xảo': {
        result: { name: 'La Bàn Tinh Xảo', quantity: 1, emoji: '🧭✨' },
        ingredients: [
            { name: 'Thép Rèn', quantity: 1 },
            { name: 'Kính Quang Học', quantity: 1 }
        ],
        description: 'recipe_exquisite_compass_desc',
        requiredTool: 'Đá Mài',
    },
    'Cung Gỗ Cải Tiến': {
        result: { name: 'Cung Gỗ Cải Tiến', quantity: 1, emoji: '🏹🌳' },
        ingredients: [
            { name: 'Lõi Gỗ', quantity: 3 },
            { name: 'Dây Thừng Chắc Chắn', quantity: 1 },
            { name: 'Keo Nhựa Cây', quantity: 1 }
        ],
        description: 'recipe_improved_wooden_bow_desc',
        requiredTool: 'Đá Mài',
    },
    'Rìu Sắt Nặng': {
        result: { name: 'Rìu Sắt Nặng', quantity: 1, emoji: '🪓💪' },
        ingredients: [
            { name: 'Thép Hợp Kim', quantity: 2 },
            { name: 'Lõi Gỗ', quantity: 2 }
        ],
        description: 'recipe_heavy_iron_axe_desc',
        requiredTool: 'Lò Rèn',
    },
    'Túi Đồ Lớn': {
        result: { name: 'Túi Đồ Lớn', quantity: 1, emoji: '🎒🎒' },
        ingredients: [
            { name: 'Vải Bền', quantity: 3 },
            { name: 'Da Thuộc', quantity: 2 },
            { name: 'Dây Thừng Chắc Chắn', quantity: 2 }
        ],
        description: 'recipe_large_bag_desc',
        requiredTool: 'Đá Mài',
    },
    'Đèn Pin Cầm Tay': {
        result: { name: 'Đèn Pin Cầm Tay', quantity: 1, emoji: '🔦✨' },
        ingredients: [
            { name: 'Thép Hợp Kim', quantity: 1 },
            { name: 'Kính Quang Học', quantity: 1 },
            { name: 'Tinh Thể Nước Đọng', quantity: 2 }
        ],
        description: 'recipe_handheld_flashlight_desc',
        requiredTool: 'Lò Rèn',
    },
    'Bộ Giáp Thép Hợp Kim': {
        result: { name: 'Bộ Giáp Thép Hợp Kim', quantity: 1, emoji: '🪖🛡️' },
        ingredients: [
            { name: 'Thép Hợp Kim', quantity: 5 },
            { name: 'Da Thuộc', quantity: 2 },
            { name: 'Lõi Gỗ', quantity: 3 }
        ],
        description: 'recipe_steel_alloy_armor_set_desc',
        requiredTool: 'Lò Rèn',
    },
    'Kiếm Thép Hợp Kim': {
        result: { name: 'Kiếm Thép Hợp Kim', quantity: 1, emoji: '⚔️✨' },
        ingredients: [
            { name: 'Thép Hợp Kim', quantity: 3 },
            { name: 'Lõi Gỗ', quantity: 1 },
            { name: 'Keo Nhựa Cây', quantity: 1 }
        ],
        description: 'recipe_steel_alloy_sword_desc',
        requiredTool: 'Lò Rèn',
    },
    'Lều Cắm Trại Di Động': {
        result: { name: 'Lều Cắm Trại Di Động', quantity: 1, emoji: '⛺️' },
        ingredients: [
            { name: 'Vải Bền', quantity: 5 },
            { name: 'Lõi Gỗ', quantity: 4 },
            { name: 'Dây Thừng Chắc Chắn', quantity: 3 }
        ],
        description: 'recipe_portable_camping_tent_desc',
        requiredTool: 'Đá Mài',
    },
    'Bộ Dụng Cụ Sửa Chữa': {
        result: { name: 'Bộ Dụng Cụ Sửa Chữa', quantity: 1, emoji: '🔧🛠️' },
        ingredients: [
            { name: 'Thép Rèn', quantity: 1 },
            { name: 'Lõi Gỗ', quantity: 1 },
            { name: 'Dây Gai', quantity: 2 }
        ],
        description: 'recipe_repair_kit_desc',
        requiredTool: 'Đá Mài',
    },
    'Móc Câu Cá': {
        result: { name: 'Móc Câu Cá', quantity: 1, emoji: '🎣' },
        ingredients: [
            { name: 'Thép Rèn', quantity: 1 },
            { name: 'Cành Cây Chắc Chắn', quantity: 1 },
            { name: 'Dây Gai', quantity: 1 }
        ],
        description: 'recipe_fishing_hook_desc',
        requiredTool: 'Đá Mài',
    },
    'Thịt Cá Nướng': {
        result: { name: 'Thịt Cá Nướng', quantity: 1, emoji: '🐟🔥' },
        ingredients: [
            { name: 'Thịt Sói Sống', quantity: 1 },
        ],
        description: 'recipe_grilled_fish_meat_desc',
        requiredTool: 'Lửa trại',
    },
    'Lưới Bắt Cá': {
        result: { name: 'Lưới Bắt Cá', quantity: 1, emoji: '🎣🕸️' },
        ingredients: [
            { name: 'Dây Thừng Chắc Chắn', quantity: 3 },
            { name: 'Lõi Gỗ', quantity: 1 }
        ],
        description: 'recipe_fishing_net_desc',
        requiredTool: 'Đá Mài',
    },
    'Áo Choàng Ngụy Trang': {
        result: { name: 'Áo Choàng Ngụy Trang', quantity: 1, emoji: '🌿🧥' },
        ingredients: [
            { name: 'Vải Bền', quantity: 2 },
            { name: 'Lá cây lớn', quantity: 5 },
            { name: 'Dây Gai', quantity: 2 }
        ],
        description: 'recipe_camouflage_cloak_desc',
        requiredTool: 'Đá Mài',
    },
    'Mũ Bảo Vệ Nắng/Mưa': {
        result: { name: 'Mũ Bảo Vệ Nắng/Mưa', quantity: 1, emoji: '👒☔' },
        ingredients: [
            { name: 'Lõi Gỗ', quantity: 1 },
            { name: 'Vải Bền', quantity: 1 },
            { name: 'Dây Gai', quantity: 1 }
        ],
        description: 'recipe_sun_rain_hat_desc',
        requiredTool: 'Đá Mài',
    },
    'Bình Giữ Nhiệt': {
        result: { name: 'Bình Giữ Nhiệt', quantity: 1, emoji: '☕️❄️' },
        ingredients: [
            { name: 'Thép Rèn', quantity: 2 },
            { name: 'Tinh Thể Nước Đọng', quantity: 1 },
            { name: 'Keo Nhựa Cây', quantity: 1 }
        ],
        description: 'recipe_thermos_flask_desc',
        requiredTool: 'Lò Rèn',
    },
    'Thuốc Hồi Phục Mạnh': {
        result: { name: 'Thuốc Hồi Phục Mạnh', quantity: 1, emoji: '🧪❤️‍🩹' },
        ingredients: [
            { name: 'Thuốc Máu Yếu', quantity: 2 },
            { name: 'Thuốc Thể Lực', quantity: 1 },
            { name: 'Rễ Cây Ma Thuật', quantity: 2 }
        ],
        description: 'recipe_strong_recovery_potion_desc',
        requiredTool: 'Đá Mài',
    },
};
