
import type { Recipe } from '@/lib/game/definitions/recipe';

export const naturePlusRecipes: Record<string, Recipe> = {
    'plant_fiber': {
        result: { name: 'plant_fiber', quantity: 2, emoji: '🌾' },
        ingredients: [
            { name: 'dry_grass', quantity: 2 },
            { name: 'large_leaf', quantity: 1 }
        ],
        description: {en: 'Weave together dried grass and leaves to create basic plant fibers.', vi: 'Dệt cỏ khô và lá cây lại với nhau để tạo ra sợi thực vật cơ bản.'},
    },
    'durable_cloth': {
        result: { name: 'durable_cloth', quantity: 1, emoji: '👕💪' },
        ingredients: [
            { name: 'thorny_vine', quantity: 2 },
            { name: 'plant_fiber', quantity: 3 }
        ],
        description: {en: 'Weave together vines and fibers to create a strong cloth.', vi: 'Dệt các sợi dây leo và sợi thực vật lại với nhau để tạo ra một loại vải chắc chắn.'},
        requiredTool: 'whetstone',
    },
    'camouflage_cloak': {
        result: { name: 'camouflage_cloak', quantity: 1, emoji: '🌿🧥' },
        ingredients: [
            { name: 'durable_cloth', quantity: 2 },
            { name: 'large_leaf', quantity: 5 },
            { name: 'thorny_vine', quantity: 2 }
        ],
        description: {en: 'Sew leaves onto a cloak for better stealth in forests.', vi: 'May lá cây lên áo choàng để ẩn mình tốt hơn trong rừng.'},
        requiredTool: 'whetstone',
    },
    'charcoal': {
        result: { name: 'charcoal', quantity: 1, emoji: '⚫🔥' },
        ingredients: [
            { name: 'wood_core', quantity: 1 }
        ],
        description: {en: 'Process wood into a more efficient fuel source.', vi: 'Chế biến gỗ thành một nguồn nhiên liệu hiệu quả hơn.'},
        requiredTool: 'flint',
    },
    'wrought_iron': {
        result: { name: 'wrought_iron', quantity: 1, emoji: '🔗⚔️' },
        ingredients: [
            { name: 'iron_ore', quantity: 2 },
            { name: 'charcoal', quantity: 1 }
        ],
        description: {en: 'Smelt iron ore into a usable metal.', vi: 'Nung chảy quặng sắt thành một kim loại có thể sử dụng được.'},
        requiredTool: 'forge',
    },
    'thick_fur': {
        result: { name: 'thick_fur', quantity: 1, emoji: '🐻‍❄️🧶' },
        ingredients: [
            { name: 'black_wolf_pelt', quantity: 2 }
        ],
        description: {en: 'Process multiple pelts into a thick, insulating fur.', vi: 'Chế biến nhiều tấm da thành một lớp lông thú dày, cách nhiệt.'},
        requiredTool: 'whetstone',
    },
    'optical_glass': {
        result: { name: 'optical_glass', quantity: 1, emoji: '🔍💡' },
        ingredients: [
            { name: 'plain_sand', quantity: 3 },
            { name: 'charcoal', quantity: 1 }
        ],
        description: {en: 'Melt sand at high temperatures to create clear glass.', vi: 'Nung chảy cát ở nhiệt độ cao để tạo ra thủy tinh trong suốt.'},
        requiredTool: 'kiln',
    },
    'activated_charcoal': {
        result: { name: 'activated_charcoal', quantity: 1, emoji: '⚫💧' },
        ingredients: [
            { name: 'charcoal', quantity: 2 }
        ],
        description: {en: 'Purify charcoal to create a filter.', vi: 'Tinh chế than củi để tạo ra một bộ lọc.'},
        requiredTool: 'kiln',
    },
    'clean_water': {
        result: { name: 'clean_water', quantity: 1, emoji: '💧✅' },
        ingredients: [
            { name: 'old_canteen', quantity: 1 },
            { name: 'muddy_water', quantity: 1 },
            { name: 'activated_charcoal', quantity: 1 }
        ],
        description: {en: 'Filter muddy water to make it safe to drink.', vi: 'Lọc nước bùn để làm cho nó an toàn để uống.'},
        requiredTool: 'whetstone',
    },
    'strong_stamina_potion': {
        result: { name: 'strong_stamina_potion', quantity: 1, emoji: '🧪🏃' },
        ingredients: [
            { name: 'healing_herb', quantity: 2 },
            { name: 'magic_root', quantity: 1 },
            { name: 'clean_water', quantity: 1 }
        ],
        description: {en: 'Brew a powerful potion to restore a large amount of stamina.', vi: 'Pha một lọ thuốc mạnh để phục hồi một lượng lớn thể lực.'},
        requiredTool: 'whetstone',
    },
    'sturdy_rope': {
        result: { name: 'sturdy_rope', quantity: 1, emoji: '🔗🧵' },
        ingredients: [
            { name: 'thorny_vine', quantity: 2 },
            { name: 'plant_fiber', quantity: 3 }
        ],
        description: {en: 'Twist together plant fibers to make a strong rope.', vi: 'Xoắn các sợi thực vật lại với nhau để làm một sợi dây thừng chắc chắn.'},
        requiredTool: 'whetstone',
    },
    'tree_sap_glue': {
        result: { name: 'tree_sap_glue', quantity: 1, emoji: '🍯🌳' },
        ingredients: [
            { name: 'wood_core', quantity: 2 },
            { name: 'charcoal', quantity: 1 }
        ],
        description: {en: 'Boil down tree sap to create a sticky adhesive.', vi: 'Đun sôi nhựa cây để tạo ra một chất kết dính.'},
        requiredTool: 'kiln',
    },
    'tanned_leather': {
        result: { name: 'tanned_leather', quantity: 1, emoji: '🧷🐻' },
        ingredients: [
            { name: 'bear_hide', quantity: 1 },
            { name: 'charcoal', quantity: 1 }
        ],
        description: {en: 'Treat animal hides to make them more durable and flexible.', vi: 'Xử lý da động vật để làm cho chúng bền hơn và linh hoạt hơn.'},
        requiredTool: 'whetstone',
    },
    'steel_alloy': {
        result: { name: 'steel_alloy', quantity: 1, emoji: '💎⚔️' },
        ingredients: [
            { name: 'wrought_iron', quantity: 2 },
            { name: 'iron_ore', quantity: 1 }
        ],
        description: {en: 'Forge wrought iron with other minerals to create a stronger steel alloy.', vi: 'Rèn sắt rèn với các khoáng chất khác để tạo ra một hợp kim thép mạnh hơn.'},
        requiredTool: 'forge',
    },
    'clay_pot': {
        result: { name: 'clay_pot', quantity: 1, emoji: '🏺💧' },
        ingredients: [
            { name: 'clay', quantity: 3 },
        ],
        description: {en: 'Fire clay in a kiln to create a sturdy pot for carrying water or cooking.', vi: 'Nung đất sét trong lò để tạo ra một cái nồi chắc chắn để đựng nước hoặc nấu ăn.'},
        requiredTool: 'kiln',
    },
    'hoe_recipe': {
        result: { name: 'hoe', quantity: 1, emoji: '🪓' },
        ingredients: [
            { name: 'hollow_wood_core', quantity: 1 },
            { name: 'plant_fiber', quantity: 2 }
        ],
        description: { en: 'Assemble a simple hoe for preparing soil for planting.', vi: 'Lắp ráp một chiếc cuốc đơn giản để chuẩn bị đất trồng.' },
    },
    'watering_can_recipe': {
        result: { name: 'watering_can', quantity: 1, emoji: '🪣' },
        ingredients: [
            { name: 'clay_pot', quantity: 1 },
            { name: 'sturdy_branch', quantity: 1 },
            { name: 'plant_fiber', quantity: 1 }
        ],
        description: { en: 'Create a basic watering can for irrigating small plots.', vi: 'Tạo một bình tưới cơ bản để tưới các mảnh ruộng nhỏ.' },
    },
    'fertilizer_compost_recipe': {
        result: { name: 'fertilizer_compost', quantity: 1, emoji: '🧴' },
        ingredients: [
            { name: 'plant_fiber', quantity: 2 },
            { name: 'large_leaf', quantity: 2 }
        ],
        description: { en: 'Mix plant material into a simple compost to enrich soil nutrition.', vi: 'Trộn vật liệu thực vật thành phân hữu cơ đơn giản để làm giàu dinh dưỡng đất.' },
    },
    'mortar': {
        result: { name: 'mortar', quantity: 1, emoji: '🧱💧' },
        ingredients: [
            { name: 'clay', quantity: 2 },
            { name: 'plain_sand', quantity: 1 },
            { name: 'muddy_water', quantity: 1 }
        ],
        description: {en: 'Mix clay, sand, and water to create a basic building mortar.', vi: 'Trộn đất sét, cát và nước để tạo ra một loại vữa xây dựng cơ bản.'},
        requiredTool: 'whetstone',
    },
    'firefly_lantern': {
        result: { name: 'firefly_lantern', quantity: 1, emoji: '💡✨' },
        ingredients: [
            { name: 'hollow_wood_core', quantity: 1 },
            { name: 'glowing_firefly', quantity: 5 },
            { name: 'thorny_vine', quantity: 2 }
        ],
        description: {en: 'Create a gentle, continuous light source using a hollow log and captured fireflies.', vi: 'Tạo ra một nguồn sáng nhẹ nhàng, liên tục bằng cách sử dụng một khúc gỗ rỗng và những con đom đóm bị bắt.'},
        requiredTool: 'simple_stone_axe',
    },
    'herbal_antidote': {
        result: { name: 'herbal_antidote', quantity: 1, emoji: '💉🌿' },
        ingredients: [
            { name: 'snake_venom', quantity: 1 },
            { name: 'healing_herb', quantity: 3 },
            { name: 'magic_root', quantity: 1 }
        ],
        description: {en: 'Brew a potent antidote to cure poisoning.', vi: 'Pha một loại thuốc giải độc mạnh để chữa ngộ độc.'},
        requiredTool: 'whetstone',
    },
    'wolf_pelt_armor': {
        result: { name: 'wolf_pelt_armor', quantity: 1, emoji: '🧥🐺' },
        ingredients: [
            { name: 'black_wolf_pelt', quantity: 5 },
            { name: 'bear_hide', quantity: 2 },
            { name: 'thorny_vine', quantity: 3 }
        ],
        description: {en: 'Craft a warm and intimidating set of armor from wolf pelts.', vi: 'Chế tạo một bộ áo giáp ấm áp và đáng sợ từ da sói.'},
        requiredTool: 'whetstone',
    },
    'tanned_leather_armor': {
        result: { name: 'tanned_leather_armor', quantity: 1, emoji: '🛡️🐻' },
        ingredients: [
            { name: 'tanned_leather', quantity: 3 },
            { name: 'durable_cloth', quantity: 2 },
            { name: 'sturdy_rope', quantity: 1 }
        ],
        description: {en: 'Create a sturdy and flexible set of armor from tanned leather.', vi: 'Tạo một bộ áo giáp chắc chắn và linh hoạt từ da thuộc.'},
        requiredTool: 'whetstone',
    },
    'survival_knife': {
        result: { name: 'survival_knife', quantity: 1, emoji: '🔪🛠️' },
        ingredients: [
            { name: 'wrought_iron', quantity: 2 },
            { name: 'wood_core', quantity: 1 },
            { name: 'thorny_vine', quantity: 1 }
        ],
        description: {en: 'Forge a versatile knife that is both a tool and a reliable weapon.', vi: 'Rèn một con dao đa năng vừa là công cụ vừa là vũ khí đáng tin cậy.'},
        requiredTool: 'forge',
    },
    'water_filter_canteen': {
        result: { name: 'water_filter_canteen', quantity: 1, emoji: '🥤💧' },
        ingredients: [
            { name: 'hollow_wood_core', quantity: 1 },
            { name: 'durable_cloth', quantity: 1 },
            { name: 'activated_charcoal', quantity: 1 }
        ],
        description: {en: 'Construct a canteen that can purify water on the go.', vi: 'Chế tạo một bình đựng nước có thể lọc nước khi đang di chuyển.'},
        requiredTool: 'whetstone',
    },
    'insulated_sleeping_bag': {
        result: { name: 'insulated_sleeping_bag', quantity: 1, emoji: '🛌🌡️' },
        ingredients: [
            { name: 'durable_cloth', quantity: 3 },
            { name: 'thick_fur', quantity: 2 },
            { name: 'thorny_vine', quantity: 2 }
        ],
        description: {en: 'Craft a warm sleeping bag to protect against extreme cold.', vi: 'Chế tạo một túi ngủ ấm áp để bảo vệ khỏi cái lạnh khắc nghiệt.'},
        requiredTool: 'whetstone',
    },
    'large_animal_trap': {
        result: { name: 'large_animal_trap', quantity: 1, emoji: '🪤🐻' },
        ingredients: [
            { name: 'wood_core', quantity: 5 },
            { name: 'thorny_vine', quantity: 3 },
            { name: 'wrought_iron', quantity: 1 }
        ],
        description: {en: 'Build a heavy-duty trap capable of catching large prey.', vi: 'Xây dựng một cái bẫy hạng nặng có khả năng bắt những con mồi lớn.'},
        requiredTool: 'simple_stone_axe',
    },
    'food_preservation_box': {
        result: { name: 'food_preservation_box', quantity: 1, emoji: '📦🍎' },
        ingredients: [
            { name: 'wood_core', quantity: 4 },
            { name: 'pebbles', quantity: 2 },
            { name: 'crystal_water', quantity: 1 }
        ],
        description: {en: 'Construct an insulated box to keep food fresh for longer.', vi: 'Xây dựng một cái hộp cách nhiệt để giữ thức ăn tươi lâu hơn.'},
        requiredTool: 'whetstone',
    },
    'exquisite_compass': {
        result: { name: 'exquisite_compass', quantity: 1, emoji: '🧭✨' },
        ingredients: [
            { name: 'wrought_iron', quantity: 1 },
            { name: 'optical_glass', quantity: 1 }
        ],
        description: {en: 'Craft a precise compass to help navigate.', vi: 'Chế tạo một la bàn chính xác để giúp điều hướng.'},
        requiredTool: 'whetstone',
    },
    'improved_wooden_bow': {
        result: { name: 'improved_wooden_bow', quantity: 1, emoji: '🏹🌳' },
        ingredients: [
            { name: 'wood_core', quantity: 3 },
            { name: 'sturdy_rope', quantity: 1 },
            { name: 'tree_sap_glue', quantity: 1 }
        ],
        description: {en: 'Reinforce a wooden bow to increase its power and accuracy.', vi: 'Gia cố một cây cung gỗ để tăng sức mạnh và độ chính xác của nó.'},
        requiredTool: 'whetstone',
    },
    'heavy_iron_axe': {
        result: { name: 'heavy_iron_axe', quantity: 1, emoji: '🪓💪' },
        ingredients: [
            { name: 'steel_alloy', quantity: 2 },
            { name: 'wood_core', quantity: 2 }
        ],
        description: {en: 'Forge a heavy axe, excellent for felling large trees or as a powerful weapon.', vi: 'Rèn một chiếc rìu nặng, tuyệt vời để đốn hạ những cây lớn hoặc làm vũ khí mạnh mẽ.'},
        requiredTool: 'forge',
    },
    'large_bag': {
        result: { name: 'large_bag', quantity: 1, emoji: '🎒🎒' },
        ingredients: [
            { name: 'durable_cloth', quantity: 3 },
            { name: 'tanned_leather', quantity: 2 },
            { name: 'sturdy_rope', quantity: 2 }
        ],
        description: {en: 'Sew together leather and cloth to create a bag with more inventory space.', vi: 'May da và vải lại với nhau để tạo ra một chiếc túi có nhiều không gian hơn.'},
        requiredTool: 'whetstone',
    },
    'handheld_flashlight': {
        result: { name: 'handheld_flashlight', quantity: 1, emoji: '🔦✨' },
        ingredients: [
            { name: 'steel_alloy', quantity: 1 },
            { name: 'optical_glass', quantity: 1 },
            { name: 'crystal_water', quantity: 2 }
        ],
        description: {en: 'Construct a powerful, focused light source using advanced materials.', vi: 'Chế tạo một nguồn sáng mạnh, tập trung bằng cách sử dụng các vật liệu tiên tiến.'},
        requiredTool: 'forge',
    },
    'steel_alloy_armor_set': {
        result: { name: 'steel_alloy_armor_set', quantity: 1, emoji: '🪖🛡️' },
        ingredients: [
            { name: 'steel_alloy', quantity: 5 },
            { name: 'tanned_leather', quantity: 2 },
            { name: 'wood_core', quantity: 3 }
        ],
        description: {en: 'Forge a complete set of formidable steel alloy armor.', vi: 'Rèn một bộ áo giáp hợp kim thép hoàn chỉnh, đáng gờm.'},
        requiredTool: 'forge',
    },
    'steel_alloy_sword': {
        result: { name: 'steel_alloy_sword', quantity: 1, emoji: '⚔️✨' },
        ingredients: [
            { name: 'steel_alloy', quantity: 3 },
            { name: 'wood_core', quantity: 1 },
            { name: 'tree_sap_glue', quantity: 1 }
        ],
        description: {en: 'Forge a sharp and durable sword from steel alloy.', vi: 'Rèn một thanh kiếm sắc và bền từ hợp kim thép.'},
        requiredTool: 'forge',
    },
    'portable_camping_tent': {
        result: { name: 'portable_camping_tent', quantity: 1, emoji: '⛺️' },
        ingredients: [
            { name: 'durable_cloth', quantity: 5 },
            { name: 'wood_core', quantity: 4 },
            { name: 'sturdy_rope', quantity: 3 }
        ],
        description: {en: 'Craft a lightweight tent that offers good protection from the elements.', vi: 'Chế tạo một chiếc lều nhẹ mang lại sự bảo vệ tốt khỏi các yếu tố thời tiết.'},
        requiredTool: 'whetstone',
    },
    'repair_kit': {
        result: { name: 'repair_kit', quantity: 1, emoji: '🔧🛠️' },
        ingredients: [
            { name: 'wrought_iron', quantity: 1 },
            { name: 'wood_core', quantity: 1 },
            { name: 'thorny_vine', quantity: 2 }
        ],
        description: {en: 'Assemble a kit with basic tools and materials for repairing equipment.', vi: 'Lắp ráp một bộ dụng cụ với các công cụ và vật liệu cơ bản để sửa chữa thiết bị.'},
        requiredTool: 'whetstone',
    },
    'fishing_hook': {
        result: { name: 'fishing_hook', quantity: 1, emoji: '🎣' },
        ingredients: [
            { name: 'wrought_iron', quantity: 1 },
            { name: 'sturdy_branch', quantity: 1 },
            { name: 'thorny_vine', quantity: 1 }
        ],
        description: {en: 'Craft a simple fishing hook to catch fish.', vi: 'Chế tạo một lưỡi câu đơn giản để bắt cá.'},
        requiredTool: 'whetstone',
    },
    'grilled_fish_meat': {
        result: { name: 'grilled_fish_meat', quantity: 1, emoji: '🐟🔥' },
        ingredients: [
            { name: 'raw_wolf_meat', quantity: 1 },
        ],
        description: {en: 'Grill fish over a fire for a nutritious meal.', vi: 'Nướng cá trên lửa để có một bữa ăn bổ dưỡng.'},
        requiredTool: 'Lửa trại',
    },
    'fishing_net': {
        result: { name: 'fishing_net', quantity: 1, emoji: '🎣🕸️' },
        ingredients: [
            { name: 'sturdy_rope', quantity: 3 },
            { name: 'wood_core', quantity: 1 }
        ],
        description: {en: 'Weave a net to catch multiple fish at once.', vi: 'Đan một tấm lưới để bắt nhiều cá cùng một lúc.'},
        requiredTool: 'whetstone',
    },
    'sun_rain_hat': {
        result: { name: 'protection_hat', quantity: 1, emoji: '👒☔' },
        ingredients: [
            { name: 'wood_core', quantity: 1 },
            { name: 'durable_cloth', quantity: 1 },
            { name: 'thorny_vine', quantity: 1 }
        ],
        description: {en: 'Craft a wide-brimmed hat for protection against sun and rain.', vi: 'Chế tạo một chiếc mũ rộng vành để bảo vệ khỏi nắng và mưa.'},
        requiredTool: 'whetstone',
    },
    'thermos_flask': {
        result: { name: 'thermos_flask', quantity: 1, emoji: '☕️❄️' },
        ingredients: [
            { name: 'wrought_iron', quantity: 2 },
            { name: 'crystal_water', quantity: 1 },
            { name: 'tree_sap_glue', quantity: 1 }
        ],
        description: {en: 'Construct a flask that can maintain the temperature of liquids.', vi: 'Chế tạo một bình giữ nhiệt có thể duy trì nhiệt độ của chất lỏng.'},
        requiredTool: 'forge',
    },
    'strong_recovery_potion': {
        result: { name: 'strong_recovery_potion', quantity: 1, emoji: '🧪❤️‍🩹' },
        ingredients: [
            { name: 'weak_health_potion', quantity: 2 },
            { name: 'stamina_potion', quantity: 1 },
            { name: 'magic_root', quantity: 2 }
        ],
        description: {en: 'Brew a powerful elixir that restores both health and stamina.', vi: 'Pha một loại thuốc tiên mạnh mẽ giúp phục hồi cả máu và thể lực.'},
        requiredTool: 'whetstone',
    },
};
