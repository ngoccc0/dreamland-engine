import type { ItemDefinition } from "../../definitions/item";

export const materialItems: Record<string, ItemDefinition> = {
    'Lá cây lớn': {
        description: { en: 'A large, broad leaf, suitable for wrapping or shelter.', vi: 'Một chiếc lá lớn, rộng bản, thích hợp để gói đồ hoặc làm nơi trú ẩn.' },
        tier: 1,
        category: 'Material',
        emoji: '🍃',
        effects: [],
        baseQuantity: { min: 2, max: 5 }
    },
    'Sỏi': {
        description: { en: 'A handful of small, smooth pebbles.', vi: 'Một nắm sỏi nhỏ, nhẵn.' },
        tier: 1,
        category: 'Material',
        emoji: '🪨',
        effects: [],
        baseQuantity: { min: 2, max: 4 }
    },
    'Đá Cuội': {
        description: { en: 'A fist-sized cobblestone, good for building or as a crude tool.', vi: 'Một hòn đá cuội cỡ nắm tay, tốt để xây dựng hoặc làm công cụ thô sơ.' },
        tier: 1,
        category: 'Material',
        emoji: '🗿',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Đất Sét': {
        description: { en: 'A lump of soft, malleable clay.', vi: 'Một cục đất sét mềm, dễ uốn nắn.' },
        tier: 1,
        category: 'Material',
        emoji: '🧱',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Cát Thường': {
        description: { en: 'A handful of common sand.', vi: 'Một nắm cát thường.' },
        tier: 1,
        category: 'Material',
        emoji: '⏳',
        effects: [],
        baseQuantity: { min: 2, max: 5 }
    },
    'Mảnh Xương': {
        description: { en: 'A fragment of bone from some unfortunate creature.', vi: 'Một mảnh xương của một sinh vật xấu số nào đó.' },
        tier: 1,
        category: 'Material',
        emoji: '🦴',
        effects: [],
        baseQuantity: { min: 1, max: 4 }
    },
    'Dây Gai': {
        description: { en: 'A thorny vine, strong and flexible.', vi: 'Một sợi dây leo có gai, chắc và dẻo.' },
        tier: 1,
        category: 'Material',
        emoji: '🌿',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Da Thú Nhỏ': {
        description: { en: 'The hide of a small animal.', vi: 'Da của một con thú nhỏ.' },
        tier: 1,
        category: 'Material',
        emoji: '🩹',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Mảnh Vải Rách': {
        description: { en: 'A tattered piece of cloth.', vi: 'Một mảnh vải rách.' },
        tier: 1,
        category: 'Material',
        emoji: ' rags ',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Lõi Gỗ': {
        description: { en: 'The hard, dense core of a tree branch.', vi: 'Lõi cứng, đặc của một cành cây.' },
        tier: 2,
        category: 'Material',
        emoji: '🪵',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Bột Xương': {
        description: { en: 'Ground bones, useful in alchemy and agriculture.', vi: 'Xương được nghiền thành bột, hữu ích trong giả kim thuật và nông nghiệp.' },
        tier: 2,
        category: 'Material',
        emoji: '💀',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Nanh Sói': {
        description: { en: "A sharp fang from a wolf's jaw.", vi: 'Một chiếc nanh sắc nhọn từ hàm của một con sói.' },
        tier: 2,
        category: 'Material',
        emoji: '🦷',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Tơ Nhện Khổng lồ': {
        description: { en: 'Strong, sticky silk from a giant spider.', vi: 'Sợi tơ bền, dính từ một con nhện khổng lồ.' },
        tier: 2,
        category: 'Material',
        emoji: '🕸️',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Mắt Nhện': {
        description: { en: 'A multi-faceted eye of a spider.', vi: 'Một con mắt đa diện của một con nhện.' },
        tier: 2,
        category: 'Material',
        emoji: '👁️',
        effects: [],
        baseQuantity: { min: 2, max: 8 }
    },
    'Da Heo Rừng': {
        description: { en: 'The tough hide of a wild boar.', vi: 'Lớp da cứng của một con heo rừng hoang dã.' },
        tier: 2,
        category: 'Material',
        emoji: '🐗',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Móng Vuốt Gấu': {
        description: { en: 'A large, sharp claw from a bear.', vi: 'Một móng vuốt lớn, sắc nhọn của một con gấu.' },
        tier: 4,
        category: 'Material',
        emoji: '🐾',
        effects: [],
        baseQuantity: { min: 2, max: 4 }
    },
    'Da Gấu': {
        description: { en: 'The thick, insulating hide of a bear.', vi: 'Lớp da dày, cách nhiệt của một con gấu.' },
        tier: 4,
        category: 'Material',
        emoji: '🐻',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Da Cáo': {
        description: { en: 'The soft pelt of a fox.', vi: 'Lớp da mềm của một con cáo.' },
        tier: 2,
        category: 'Material',
        emoji: '🦊',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Cánh Châu Chấu': {
        description: { en: 'The iridescent wing of a locust.', vi: 'Cánh óng ánh của một con châu chấu.' },
        tier: 1,
        category: 'Material',
        emoji: '🦗',
        effects: [],
        baseQuantity: { min: 2, max: 4 }
    },
    'Răng Linh Cẩu': {
        description: { en: 'A powerful tooth from a hyena.', vi: 'Một chiếc răng mạnh mẽ từ một con linh cẩu.' },
        tier: 2,
        category: 'Material',
        emoji: '🦷',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Da Rắn': {
        description: { en: 'The shed skin of a snake.', vi: 'Lớp da đã lột của một con rắn.' },
        tier: 2,
        category: 'Material',
        emoji: '🐍',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Đuôi Bọ Cạp': {
        description: { en: 'The venomous tail of a scorpion.', vi: 'Chiếc đuôi có độc của một con bọ cạp.' },
        tier: 3,
        category: 'Material',
        emoji: '🦂',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Lông Kền Kền': {
        description: { en: 'A sturdy feather from a vulture.', vi: 'Một chiếc lông vũ chắc chắn từ một con kền kền.' },
        tier: 2,
        category: 'Material',
        emoji: '🪶',
        effects: [],
        baseQuantity: { min: 2, max: 5 }
    },
    'Chất nhờn của Đỉa': {
        description: { en: 'A sticky slime from a giant leech.', vi: 'Một chất nhờn dính từ một con đỉa khổng lồ.' },
        tier: 2,
        category: 'Material',
        emoji: '💧',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Da Cá Sấu': {
        description: { en: 'The tough, scaly hide of an alligator.', vi: 'Lớp da cứng, có vảy của một con cá sấu.' },
        tier: 4,
        category: 'Material',
        emoji: '🐊',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Răng Cá Sấu': {
        description: { en: 'A conical tooth from an alligator.', vi: 'Một chiếc răng hình nón của một con cá sấu.' },
        tier: 3,
        category: 'Material',
        emoji: '🦷',
        effects: [],
        baseQuantity: { min: 1, max: 4 }
    },
    'Cánh Muỗi': {
        description: { en: 'The fragile wing of a giant mosquito.', vi: 'Cánh mỏng manh của một con muỗi khổng lồ.' },
        tier: 1,
        category: 'Material',
        emoji: '🦟',
        effects: [],
        baseQuantity: { min: 2, max: 4 }
    },
    'Sừng Dê Núi': {
        description: { en: 'A curved horn from a mountain goat.', vi: 'Một chiếc sừng cong của một con dê núi.' },
        tier: 3,
        category: 'Material',
        emoji: '🐐',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Lông Harpie': {
        description: { en: 'A large, strong feather from a harpy.', vi: 'Một chiếc lông vũ lớn, mạnh mẽ từ một con harpy.' },
        tier: 3,
        category: 'Material',
        emoji: '🪶',
        effects: [],
        baseQuantity: { min: 3, max: 6 }
    },
    'Da Báo Tuyết': {
        description: { en: 'The thick, spotted pelt of a snow leopard.', vi: 'Lớp da dày, có đốm của một con báo tuyết.' },
        tier: 4,
        category: 'Material',
        emoji: '🐆',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Cánh Dơi': {
        description: { en: 'The leathery wing of a giant bat.', vi: 'Cánh da của một con dơi khổng lồ.' },
        tier: 2,
        category: 'Material',
        emoji: '🦇',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Nọc Độc Nhện Hang': {
        description: { en: 'Potent venom from a cave spider.', vi: 'Nọc độc mạnh từ một con nhện hang.' },
        tier: 3,
        category: 'Material',
        emoji: '☠️',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Chất nhờn Slime': {
        description: { en: 'A gelatinous substance dropped by a slime.', vi: 'Một chất sền sệt do một con slime đánh rơi.' },
        tier: 2,
        category: 'Material',
        emoji: '💧',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Răng Sâu Bò': {
        description: { en: 'A powerful mandible from a giant crawler.', vi: 'Một chiếc hàm mạnh mẽ từ một con sâu bọ khổng lồ.' },
        tier: 5,
        category: 'Material',
        emoji: '🦷',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Cành Cây Chắc Chắn': {
        description: { en: 'A sturdy, reliable tree branch.', vi: 'Một cành cây chắc chắn, đáng tin cậy.' },
        tier: 1,
        category: 'Material',
        emoji: '🪵',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Vỏ Cây Cổ Thụ': {
        description: { en: 'The thick, gnarled bark of an ancient tree.', vi: 'Lớp vỏ cây dày, sần sùi của một cây cổ thụ.' },
        tier: 3,
        category: 'Material',
        emoji: '🌳',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Nhựa Cây Dính': {
        description: { en: 'Sticky sap from a tree, useful as an adhesive.', vi: 'Nhựa cây dính từ một cái cây, hữu ích như một chất kết dính.' },
        tier: 2,
        category: 'Material',
        emoji: '💧',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Rêu Xanh': {
        description: { en: 'A clump of soft, green moss.', vi: 'Một cụm rêu xanh, mềm mại.' },
        tier: 1,
        category: 'Material',
        emoji: ' moss ',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Hoa Dại': {
        description: { en: 'A common wildflower. Can be pretty.', vi: 'Một bông hoa dại thông thường. Có thể đẹp.' },
        tier: 1,
        category: 'Material',
        emoji: '🌻',
        effects: [],
        baseQuantity: { min: 2, max: 4 }
    },
    'Lông Chim Ưng': {
        description: { en: 'A stiff, aerodynamic feather from a hawk.', vi: 'Một chiếc lông vũ cứng, có tính khí động học từ một con diều hâu.' },
        tier: 2,
        category: 'Material',
        emoji: '🪶',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Hạt Giống Hoa Dại': {
        description: { en: 'Seeds from a common wildflower.', vi: 'Hạt giống từ một bông hoa dại thông thường.' },
        tier: 1,
        category: 'Material',
        emoji: '🌱',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Cỏ Khô': {
        description: { en: 'Dry grass, useful as tinder or for weaving.', vi: 'Cỏ khô, hữu ích làm mồi lửa hoặc để dệt.' },
        tier: 1,
        category: 'Material',
        emoji: '🌿',
        effects: [],
        baseQuantity: { min: 1, max: 4 }
    },
    'Đá Sa Thạch': {
        description: { en: 'A piece of soft, layered sandstone.', vi: 'Một mảnh đá sa thạch mềm, có lớp.' },
        tier: 1,
        category: 'Material',
        emoji: '🏜️',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Nọc Bọ Cạp': {
        description: { en: 'A vial of potent scorpion venom.', vi: 'Một lọ nọc độc bọ cạp mạnh.' },
        tier: 4,
        category: 'Material',
        emoji: '☠️',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Thủy tinh sa mạc': {
        description: { en: 'Glass naturally formed by lightning striking sand.', vi: 'Thủy tinh được hình thành tự nhiên do sét đánh vào cát.' },
        tier: 3,
        category: 'Material',
        emoji: '🔍',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Rêu Phát Sáng': {
        description: { en: 'A type of moss that emits a soft, biological light.', vi: 'Một loại rêu phát ra ánh sáng sinh học dịu nhẹ.' },
        tier: 2,
        category: 'Material',
        emoji: '✨',
        effects: [],
        baseQuantity: { min: 1, max: 4 },
        growthConditions: {
            optimal: { moisture: { min: 8 }, lightLevel: { max: -5 } },
            subOptimal: { moisture: { min: 6, max: 7 }, lightLevel: { min: -4, max: -2 } }
        }
    },
    'Cây Sậy': {
        description: { en: 'Hollow reeds, useful for crafting tubes or shafts.', vi: 'Những cây sậy rỗng, hữu ích để chế tạo ống hoặc cán.' },
        tier: 1,
        category: 'Material',
        emoji: '🌿',
        effects: [],
        baseQuantity: { min: 3, max: 7 }
    },
    'Hoa Độc': {
        description: { en: 'A beautiful but poisonous flower.', vi: 'Một bông hoa đẹp nhưng có độc.' },
        tier: 2,
        category: 'Material',
        emoji: '🌺',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Nước Bùn': {
        description: { en: 'Dirty, undrinkable water from a swamp.', vi: 'Nước bẩn, không thể uống được từ một đầm lầy.' },
        tier: 1,
        category: 'Material',
        emoji: '💧',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Quặng Sắt': {
        description: { en: 'A rock containing raw iron ore.', vi: 'Một tảng đá chứa quặng sắt thô.' },
        tier: 2,
        category: 'Material',
        emoji: '⛏️',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Lông Đại Bàng': {
        description: { en: 'A large tail feather from a majestic eagle.', vi: 'Một chiếc lông đuôi lớn từ một con đại bàng uy nghi.' },
        tier: 3,
        category: 'Material',
        emoji: '🪶',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Đá Vỏ Chai': {
        description: { en: 'A shard of volcanic glass.', vi: 'Một mảnh thủy tinh núi lửa.' },
        tier: 3,
        category: 'Material',
        emoji: '🪨',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Đá Granit': {
        description: { en: 'A hard, igneous rock.', vi: 'Một loại đá mácma cứng.' },
        tier: 2,
        category: 'Material',
        emoji: '🪨',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Cây Địa Y': {
        description: { en: 'A composite organism of algae and fungi, clinging to a rock.', vi: 'Một sinh vật phức hợp của tảo và nấm, bám vào một tảng đá.' },
        tier: 2,
        category: 'Material',
        emoji: '🌿',
        effects: [],
        baseQuantity: { min: 2, max: 4 }
    },
    'Xương Cổ': {
        description: { en: 'The fossilized bone of an ancient creature.', vi: 'Xương hóa thạch của một sinh vật cổ đại.' },
        tier: 2,
        category: 'Material',
        emoji: '💀',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Mỏ Vàng': {
        description: { en: 'A rock laced with veins of pure gold.', vi: 'Một tảng đá có các đường gân vàng nguyên chất.' },
        tier: 5,
        category: 'Material',
        emoji: '💰',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Đá Vôi': {
        description: { en: 'A sedimentary rock rich in calcium carbonate.', vi: 'Một loại đá trầm tích giàu canxi cacbonat.' },
        tier: 2,
        category: 'Material',
        emoji: '🪨',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Guano (Phân dơi)': {
        description: { en: 'Bat droppings, a potent fertilizer.', vi: 'Phân dơi, một loại phân bón mạnh.' },
        tier: 1,
        category: 'Material',
        emoji: '💩',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Dây leo Titan': {
        description: { en: 'An incredibly thick and strong vine.', vi: 'Một sợi dây leo cực kỳ dày và chắc.' },
        tier: 3,
        category: 'Material',
        emoji: '🌿',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Hoa ăn thịt': {
        description: { en: 'A carnivorous plant with a sweet scent.', vi: 'Một loài thực vật ăn thịt có mùi thơm ngọt ngào.' },
        tier: 3,
        category: 'Material',
        emoji: '🌺',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Nọc Ếch độc': {
        description: { en: 'A highly toxic venom from a poison dart frog.', vi: 'Một loại nọc độc cực mạnh từ một con ếch phi tiêu độc.' },
        tier: 4,
        category: 'Material',
        emoji: '🐸',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Lông Vẹt Sặc Sỡ': {
        description: { en: 'A vibrantly colored feather from a parrot.', vi: 'Một chiếc lông vũ có màu sắc rực rỡ từ một con vẹt.' },
        tier: 2,
        category: 'Material',
        emoji: '🦜',
        effects: [],
        baseQuantity: { min: 2, max: 5 }
    },
    'Đá Obsidian': {
        description: { en: 'A piece of naturally occurring volcanic glass.', vi: 'Một mảnh thủy tinh núi lửa tự nhiên.' },
        tier: 3,
        category: 'Material',
        emoji: '🪨',
        effects: [],
        baseQuantity: { min: 2, max: 4 }
    },
    'Lưu huỳnh': {
        description: { en: 'A yellow, non-metallic element found near volcanic vents.', vi: 'Một nguyên tố phi kim màu vàng được tìm thấy gần các miệng núi lửa.' },
        tier: 2,
        category: 'Material',
        emoji: '✨',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Tro núi lửa': {
        description: { en: 'Fine powder ejected from a volcano.', vi: 'Bột mịn bị đẩy ra từ một ngọn núi lửa.' },
        tier: 1,
        category: 'Material',
        emoji: '🌋',
        effects: [],
        baseQuantity: { min: 1, max: 5 }
    },
};
