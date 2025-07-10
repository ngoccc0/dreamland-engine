import type { Recipe } from '@/lib/game/definitions/recipe';

export const naturePlusRecipes: Record<string, Recipe> = {
    'Sợi Thực Vật': {
        result: { name: 'Sợi Thực Vật', quantity: 2, emoji: '🌾' },
        ingredients: [
            { name: 'Cỏ Khô', quantity: 2 },
            { name: 'Lá cây lớn', quantity: 1 }
        ],
        description: {en: 'Weave together dried grass and leaves to create basic plant fibers.', vi: 'Dệt cỏ khô và lá cây lại với nhau để tạo ra sợi thực vật cơ bản.'},
    },
    'Vải Bền': {
        result: { name: 'Vải Bền', quantity: 1, emoji: '👕💪' },
        ingredients: [
            { name: 'Dây Gai', quantity: 2 },
            { name: 'Sợi Thực Vật', quantity: 3 }
        ],
        description: {en: 'Weave together vines and fibers to create a strong cloth.', vi: 'Dệt các sợi dây leo và sợi thực vật lại với nhau để tạo ra một loại vải chắc chắn.'},
        requiredTool: 'Đá Mài',
    },
    'Áo Choàng Ngụy Trang': {
        result: { name: 'Áo Choàng Ngụy Trang', quantity: 1, emoji: '🌿🧥' },
        ingredients: [
            { name: 'Vải Bền', quantity: 2 },
            { name: 'Lá cây lớn', quantity: 5 },
            { name: 'Dây Gai', quantity: 2 }
        ],
        description: {en: 'Sew leaves onto a cloak for better stealth in forests.', vi: 'May lá cây lên áo choàng để ẩn mình tốt hơn trong rừng.'},
        requiredTool: 'Đá Mài',
    },
    'Than Củi': {
        result: { name: 'Than Củi', quantity: 1, emoji: '⚫🔥' },
        ingredients: [
            { name: 'Lõi Gỗ', quantity: 1 }
        ],
        description: {en: 'Process wood into a more efficient fuel source.', vi: 'Chế biến gỗ thành một nguồn nhiên liệu hiệu quả hơn.'},
        requiredTool: 'Đá Lửa',
    },
    'Thép Rèn': {
        result: { name: 'Thép Rèn', quantity: 1, emoji: '🔗⚔️' },
        ingredients: [
            { name: 'Quặng Sắt', quantity: 2 },
            { name: 'Than Củi', quantity: 1 }
        ],
        description: {en: 'Smelt iron ore into a usable metal.', vi: 'Nung chảy quặng sắt thành một kim loại có thể sử dụng được.'},
        requiredTool: 'Lò Rèn',
    },
    'Lông Thú Dày': {
        result: { name: 'Lông Thú Dày', quantity: 1, emoji: '🐻‍❄️🧶' },
        ingredients: [
            { name: 'Lông Sói Đen', quantity: 2 }
        ],
        description: {en: 'Process multiple pelts into a thick, insulating fur.', vi: 'Chế biến nhiều tấm da thành một lớp lông thú dày, cách nhiệt.'},
        requiredTool: 'Đá Mài',
    },
    'Kính Quang Học': {
        result: { name: 'Kính Quang Học', quantity: 1, emoji: '🔍💡' },
        ingredients: [
            { name: 'Cát Thường', quantity: 3 },
            { name: 'Than Củi', quantity: 1 }
        ],
        description: {en: 'Melt sand at high temperatures to create clear glass.', vi: 'Nung chảy cát ở nhiệt độ cao để tạo ra thủy tinh trong suốt.'},
        requiredTool: 'Lò Nung',
    },
    'Than Hoạt Tính': {
        result: { name: 'Than Hoạt Tính', quantity: 1, emoji: '⚫💧' },
        ingredients: [
            { name: 'Than Củi', quantity: 2 }
        ],
        description: {en: 'Purify charcoal to create a filter.', vi: 'Tinh chế than củi để tạo ra một bộ lọc.'},
        requiredTool: 'Lò Nung',
    },
    'Nước Sạch': {
        result: { name: 'Nước Sạch', quantity: 1, emoji: '💧✅' },
        ingredients: [
            { name: 'Bình Nước Cũ', quantity: 1 },
            { name: 'Nước Bùn', quantity: 1 },
            { name: 'Than Hoạt Tính', quantity: 1 }
        ],
        description: {en: 'Filter muddy water to make it safe to drink.', vi: 'Lọc nước bùn để làm cho nó an toàn để uống.'},
        requiredTool: 'Đá Mài',
    },
    'Thuốc Hồi Phục Thể Lực Mạnh': {
        result: { name: 'Thuốc Hồi Phục Thể Lực Mạnh', quantity: 1, emoji: '🧪🏃' },
        ingredients: [
            { name: 'Thảo Dược Chữa Lành', quantity: 2 },
            { name: 'Rễ Cây Ma Thuật', quantity: 1 },
            { name: 'Nước Sạch', quantity: 1 }
        ],
        description: {en: 'Brew a powerful potion to restore a large amount of stamina.', vi: 'Pha một lọ thuốc mạnh để phục hồi một lượng lớn thể lực.'},
        requiredTool: 'Đá Mài',
    },
    'Dây Thừng Chắc Chắn': {
        result: { name: 'Dây Thừng Chắc Chắn', quantity: 1, emoji: '🔗🧵' },
        ingredients: [
            { name: 'Dây Gai', quantity: 2 },
            { name: 'Sợi Thực Vật', quantity: 3 }
        ],
        description: {en: 'Twist together plant fibers to make a strong rope.', vi: 'Xoắn các sợi thực vật lại với nhau để làm một sợi dây thừng chắc chắn.'},
        requiredTool: 'Đá Mài',
    },
    'Keo Nhựa Cây': {
        result: { name: 'Keo Nhựa Cây', quantity: 1, emoji: '🍯🌳' },
        ingredients: [
            { name: 'Lõi Gỗ', quantity: 2 },
            { name: 'Than Củi', quantity: 1 }
        ],
        description: {en: 'Boil down tree sap to create a sticky adhesive.', vi: 'Đun sôi nhựa cây để tạo ra một chất kết dính.'},
        requiredTool: 'Lò Nung',
    },
    'Da Thuộc': {
        result: { name: 'Da Thuộc', quantity: 1, emoji: '🧷🐻' },
        ingredients: [
            { name: 'Da Gấu', quantity: 1 },
            { name: 'Than Củi', quantity: 1 }
        ],
        description: {en: 'Treat animal hides to make them more durable and flexible.', vi: 'Xử lý da động vật để làm cho chúng bền hơn và linh hoạt hơn.'},
        requiredTool: 'Đá Mài',
    },
    'Thép Hợp Kim': {
        result: { name: 'Thép Hợp Kim', quantity: 1, emoji: '💎⚔️' },
        ingredients: [
            { name: 'Thép Rèn', quantity: 2 },
            { name: 'Quặng Sắt', quantity: 1 }
        ],
        description: {en: 'Forge wrought iron with other minerals to create a stronger steel alloy.', vi: 'Rèn sắt rèn với các khoáng chất khác để tạo ra một hợp kim thép mạnh hơn.'},
        requiredTool: 'Lò Rèn',
    },
    'Bình Đất Sét': {
        result: { name: 'Bình Đất Sét', quantity: 1, emoji: '🏺💧' },
        ingredients: [
            { name: 'Đất Sét', quantity: 3 },
        ],
        description: {en: 'Fire clay in a kiln to create a sturdy pot for carrying water or cooking.', vi: 'Nung đất sét trong lò để tạo ra một cái nồi chắc chắn để đựng nước hoặc nấu ăn.'},
        requiredTool: 'Lò Nung',
    },
    'Vữa Xây Dựng': {
        result: { name: 'Vữa Xây Dựng', quantity: 1, emoji: '🧱💧' },
        ingredients: [
            { name: 'Đất Sét', quantity: 2 },
            { name: 'Cát Thường', quantity: 1 },
            { name: 'Nước Bùn', quantity: 1 }
        ],
        description: {en: 'Mix clay, sand, and water to create a basic building mortar.', vi: 'Trộn đất sét, cát và nước để tạo ra một loại vữa xây dựng cơ bản.'},
        requiredTool: 'Đá Mài',
    },
    'Đèn Lồng Đom Đóm': {
        result: { name: 'Đèn Lồng Đom Đóm', quantity: 1, emoji: '💡✨' },
        ingredients: [
            { name: 'Lõi Gỗ Rỗng', quantity: 1 },
            { name: 'Đom Đóm Phát Sáng', quantity: 5 },
            { name: 'Dây Gai', quantity: 2 }
        ],
        description: {en: 'Create a gentle, continuous light source using a hollow log and captured fireflies.', vi: 'Tạo ra một nguồn sáng nhẹ nhàng, liên tục bằng cách sử dụng một khúc gỗ rỗng và những con đom đóm bị bắt.'},
        requiredTool: 'Rìu Đá Đơn Giản',
    },
    'Thuốc Giải Độc Thảo Mộc': {
        result: { name: 'Thuốc Giải Độc Thảo Mộc', quantity: 1, emoji: '💉🌿' },
        ingredients: [
            { name: 'Nọc Rắn Độc', quantity: 1 },
            { name: 'Thảo Dược Chữa Lành', quantity: 3 },
            { name: 'Rễ Cây Ma Thuật', quantity: 1 }
        ],
        description: {en: 'Brew a potent antidote to cure poisoning.', vi: 'Pha một loại thuốc giải độc mạnh để chữa ngộ độc.'},
        requiredTool: 'Đá Mài',
    },
    'Áo Giáp Lông Sói': {
        result: { name: 'Áo Giáp Lông Sói', quantity: 1, emoji: '🧥🐺' },
        ingredients: [
            { name: 'Lông Sói Đen', quantity: 5 },
            { name: 'Da Gấu', quantity: 2 },
            { name: 'Dây Gai', quantity: 3 }
        ],
        description: {en: 'Craft a warm and intimidating set of armor from wolf pelts.', vi: 'Chế tạo một bộ áo giáp ấm áp và đáng sợ từ da sói.'},
        requiredTool: 'Đá Mài',
    },
    'Áo Giáp Da Thuộc': {
        result: { name: 'Áo Giáp Da Thuộc', quantity: 1, emoji: '🛡️🐻' },
        ingredients: [
            { name: 'Da Thuộc', quantity: 3 },
            { name: 'Vải Bền', quantity: 2 },
            { name: 'Dây Thừng Chắc Chắn', quantity: 1 }
        ],
        description: {en: 'Create a sturdy and flexible set of armor from tanned leather.', vi: 'Tạo một bộ áo giáp chắc chắn và linh hoạt từ da thuộc.'},
        requiredTool: 'Đá Mài',
    },
    'Dao Sinh Tồn Đa Năng': {
        result: { name: 'Dao Sinh Tồn Đa Năng', quantity: 1, emoji: '🔪🛠️' },
        ingredients: [
            { name: 'Thép Rèn', quantity: 2 },
            { name: 'Lõi Gỗ', quantity: 1 },
            { name: 'Dây Gai', quantity: 1 }
        ],
        description: {en: 'Forge a versatile knife that is both a tool and a reliable weapon.', vi: 'Rèn một con dao đa năng vừa là công cụ vừa là vũ khí đáng tin cậy.'},
        requiredTool: 'Lò Rèn',
    },
    'Bình Lọc Nước Cầm Tay': {
        result: { name: 'Bình Lọc Nước Cầm Tay', quantity: 1, emoji: '🥤💧' },
        ingredients: [
            { name: 'Lõi Gỗ Rỗng', quantity: 1 },
            { name: 'Vải Bền', quantity: 1 },
            { name: 'Than Hoạt Tính', quantity: 1 }
        ],
        description: {en: 'Construct a canteen that can purify water on the go.', vi: 'Chế tạo một bình đựng nước có thể lọc nước khi đang di chuyển.'},
        requiredTool: 'Đá Mài',
    },
    'Túi Ngủ Giữ Nhiệt': {
        result: { name: 'Túi Ngủ Giữ Nhiệt', quantity: 1, emoji: '🛌🌡️' },
        ingredients: [
            { name: 'Vải Bền', quantity: 3 },
            { name: 'Lông Thú Dày', quantity: 2 },
            { name: 'Dây Gai', quantity: 2 }
        ],
        description: {en: 'Craft a warm sleeping bag to protect against extreme cold.', vi: 'Chế tạo một túi ngủ ấm áp để bảo vệ khỏi cái lạnh khắc nghiệt.'},
        requiredTool: 'Đá Mài',
    },
    'Bẫy Động Vật Lớn': {
        result: { name: 'Bẫy Động Vật Lớn', quantity: 1, emoji: '🪤🐻' },
        ingredients: [
            { name: 'Lõi Gỗ', quantity: 5 },
            { name: 'Dây Gai', quantity: 3 },
            { name: 'Thép Rèn', quantity: 1 }
        ],
        description: {en: 'Build a heavy-duty trap capable of catching large prey.', vi: 'Xây dựng một cái bẫy hạng nặng có khả năng bắt những con mồi lớn.'},
        requiredTool: 'Rìu Đá Đơn Giản',
    },
    'Hộp Bảo Quản Thực Phẩm': {
        result: { name: 'Hộp Bảo Quản Thực Phẩm', quantity: 1, emoji: '📦🍎' },
        ingredients: [
            { name: 'Lõi Gỗ', quantity: 4 },
            { name: 'Sỏi', quantity: 2 },
            { name: 'Tinh Thể Nước Đọng', quantity: 1 }
        ],
        description: {en: 'Construct an insulated box to keep food fresh for longer.', vi: 'Xây dựng một cái hộp cách nhiệt để giữ thức ăn tươi lâu hơn.'},
        requiredTool: 'Đá Mài',
    },
    'La Bàn Tinh Xảo': {
        result: { name: 'La Bàn Tinh Xảo', quantity: 1, emoji: '🧭✨' },
        ingredients: [
            { name: 'Thép Rèn', quantity: 1 },
            { name: 'Kính Quang Học', quantity: 1 }
        ],
        description: {en: 'Craft a precise compass to help navigate.', vi: 'Chế tạo một la bàn chính xác để giúp điều hướng.'},
        requiredTool: 'Đá Mài',
    },
    'Cung Gỗ Cải Tiến': {
        result: { name: 'Cung Gỗ Cải Tiến', quantity: 1, emoji: '🏹🌳' },
        ingredients: [
            { name: 'Lõi Gỗ', quantity: 3 },
            { name: 'Dây Thừng Chắc Chắn', quantity: 1 },
            { name: 'Keo Nhựa Cây', quantity: 1 }
        ],
        description: {en: 'Reinforce a wooden bow to increase its power and accuracy.', vi: 'Gia cố một cây cung gỗ để tăng sức mạnh và độ chính xác của nó.'},
        requiredTool: 'Đá Mài',
    },
    'Rìu Sắt Nặng': {
        result: { name: 'Rìu Sắt Nặng', quantity: 1, emoji: '🪓💪' },
        ingredients: [
            { name: 'Thép Hợp Kim', quantity: 2 },
            { name: 'Lõi Gỗ', quantity: 2 }
        ],
        description: {en: 'Forge a heavy axe, excellent for felling large trees or as a powerful weapon.', vi: 'Rèn một chiếc rìu nặng, tuyệt vời để đốn hạ những cây lớn hoặc làm vũ khí mạnh mẽ.'},
        requiredTool: 'Lò Rèn',
    },
    'Túi Đồ Lớn': {
        result: { name: 'Túi Đồ Lớn', quantity: 1, emoji: '🎒🎒' },
        ingredients: [
            { name: 'Vải Bền', quantity: 3 },
            { name: 'Da Thuộc', quantity: 2 },
            { name: 'Dây Thừng Chắc Chắn', quantity: 2 }
        ],
        description: {en: 'Sew together leather and cloth to create a bag with more inventory space.', vi: 'May da và vải lại với nhau để tạo ra một chiếc túi có nhiều không gian hơn.'},
        requiredTool: 'Đá Mài',
    },
    'Đèn Pin Cầm Tay': {
        result: { name: 'Đèn Pin Cầm Tay', quantity: 1, emoji: '🔦✨' },
        ingredients: [
            { name: 'Thép Hợp Kim', quantity: 1 },
            { name: 'Kính Quang Học', quantity: 1 },
            { name: 'Tinh Thể Nước Đọng', quantity: 2 }
        ],
        description: {en: 'Construct a powerful, focused light source using advanced materials.', vi: 'Chế tạo một nguồn sáng mạnh, tập trung bằng cách sử dụng các vật liệu tiên tiến.'},
        requiredTool: 'Lò Rèn',
    },
    'Bộ Giáp Thép Hợp Kim': {
        result: { name: 'Bộ Giáp Thép Hợp Kim', quantity: 1, emoji: '🪖🛡️' },
        ingredients: [
            { name: 'Thép Hợp Kim', quantity: 5 },
            { name: 'Da Thuộc', quantity: 2 },
            { name: 'Lõi Gỗ', quantity: 3 }
        ],
        description: {en: 'Forge a complete set of formidable steel alloy armor.', vi: 'Rèn một bộ áo giáp hợp kim thép hoàn chỉnh, đáng gờm.'},
        requiredTool: 'Lò Rèn',
    },
    'Kiếm Thép Hợp Kim': {
        result: { name: 'Kiếm Thép Hợp Kim', quantity: 1, emoji: '⚔️✨' },
        ingredients: [
            { name: 'Thép Hợp Kim', quantity: 3 },
            { name: 'Lõi Gỗ', quantity: 1 },
            { name: 'Keo Nhựa Cây', quantity: 1 }
        ],
        description: {en: 'Forge a sharp and durable sword from steel alloy.', vi: 'Rèn một thanh kiếm sắc và bền từ hợp kim thép.'},
        requiredTool: 'Lò Rèn',
    },
    'Lều Cắm Trại Di Động': {
        result: { name: 'Lều Cắm Trại Di Động', quantity: 1, emoji: '⛺️' },
        ingredients: [
            { name: 'Vải Bền', quantity: 5 },
            { name: 'Lõi Gỗ', quantity: 4 },
            { name: 'Dây Thừng Chắc Chắn', quantity: 3 }
        ],
        description: {en: 'Craft a lightweight tent that offers good protection from the elements.', vi: 'Chế tạo một chiếc lều nhẹ mang lại sự bảo vệ tốt khỏi các yếu tố thời tiết.'},
        requiredTool: 'Đá Mài',
    },
    'Bộ Dụng Cụ Sửa Chữa': {
        result: { name: 'Bộ Dụng Cụ Sửa Chữa', quantity: 1, emoji: '🔧🛠️' },
        ingredients: [
            { name: 'Thép Rèn', quantity: 1 },
            { name: 'Lõi Gỗ', quantity: 1 },
            { name: 'Dây Gai', quantity: 2 }
        ],
        description: {en: 'Assemble a kit with basic tools and materials for repairing equipment.', vi: 'Lắp ráp một bộ dụng cụ với các công cụ và vật liệu cơ bản để sửa chữa thiết bị.'},
        requiredTool: 'Đá Mài',
    },
    'Móc Câu Cá': {
        result: { name: 'Móc Câu Cá', quantity: 1, emoji: '🎣' },
        ingredients: [
            { name: 'Thép Rèn', quantity: 1 },
            { name: 'Cành Cây Chắc Chắn', quantity: 1 },
            { name: 'Dây Gai', quantity: 1 }
        ],
        description: {en: 'Craft a simple fishing hook to catch fish.', vi: 'Chế tạo một lưỡi câu đơn giản để bắt cá.'},
        requiredTool: 'Đá Mài',
    },
    'Thịt Cá Nướng': {
        result: { name: 'Thịt Cá Nướng', quantity: 1, emoji: '🐟🔥' },
        ingredients: [
            { name: 'Thịt Sói Sống', quantity: 1 },
        ],
        description: {en: 'Grill fish over a fire for a nutritious meal.', vi: 'Nướng cá trên lửa để có một bữa ăn bổ dưỡng.'},
        requiredTool: 'Lửa trại',
    },
    'Lưới Bắt Cá': {
        result: { name: 'Lưới Bắt Cá', quantity: 1, emoji: '🎣🕸️' },
        ingredients: [
            { name: 'Dây Thừng Chắc Chắn', quantity: 3 },
            { name: 'Lõi Gỗ', quantity: 1 }
        ],
        description: {en: 'Weave a net to catch multiple fish at once.', vi: 'Đan một tấm lưới để bắt nhiều cá cùng một lúc.'},
        requiredTool: 'Đá Mài',
    },
    'Mũ Bảo Vệ Nắng/Mưa': {
        result: { name: 'Mũ Bảo Vệ Nắng/Mưa', quantity: 1, emoji: '👒☔' },
        ingredients: [
            { name: 'Lõi Gỗ', quantity: 1 },
            { name: 'Vải Bền', quantity: 1 },
            { name: 'Dây Gai', quantity: 1 }
        ],
        description: {en: 'Craft a wide-brimmed hat for protection against sun and rain.', vi: 'Chế tạo một chiếc mũ rộng vành để bảo vệ khỏi nắng và mưa.'},
        requiredTool: 'Đá Mài',
    },
    'Bình Giữ Nhiệt': {
        result: { name: 'Bình Giữ Nhiệt', quantity: 1, emoji: '☕️❄️' },
        ingredients: [
            { name: 'Thép Rèn', quantity: 2 },
            { name: 'Tinh Thể Nước Đọng', quantity: 1 },
            { name: 'Keo Nhựa Cây', quantity: 1 }
        ],
        description: {en: 'Construct a flask that can maintain the temperature of liquids.', vi: 'Chế tạo một bình giữ nhiệt có thể duy trì nhiệt độ của chất lỏng.'},
        requiredTool: 'Lò Rèn',
    },
    'Thuốc Hồi Phục Mạnh': {
        result: { name: 'Thuốc Hồi Phục Mạnh', quantity: 1, emoji: '🧪❤️‍🩹' },
        ingredients: [
            { name: 'Thuốc Máu Yếu', quantity: 2 },
            { name: 'Thuốc Thể Lực', quantity: 1 },
            { name: 'Rễ Cây Ma Thuật', quantity: 2 }
        ],
        description: {en: 'Brew a powerful elixir that restores both health and stamina.', vi: 'Pha một loại thuốc tiên mạnh mẽ giúp phục hồi cả máu và thể lực.'},
        requiredTool: 'Đá Mài',
    },
};
