import type { BiomeTemplateData, Language, NarrativeLength, NarrativeTemplate, MoodTag } from '@/lib/game/types';
import { logger } from '@/lib/logger';

// This file holds structured narrative templates and keyword variations.

// A generic map type for our databases
type PlaceholderMap = {
    [key: string]: string[] | { [subKey: string]: string[] | string };
};

// --- HELPER FUNCTIONS ---

/**
 * Selects a random item from an array of strings.
 * @param arr The array of strings.
 * @returns A random string from the array, or an empty string if the array is empty.
 */
export function selectRandom(arr: string[] | undefined): string {
    if (!arr || arr.length === 0) return '';
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Selects a descriptive phrase based on a numerical value and defined ranges.
 * @param map A map of level keys (e.g., 'high', 'medium', 'low') to arrays of phrases.
 * @param value The numerical value to check.
 * @param ranges A map defining the numerical ranges for each level key.
 * @returns A random phrase for the matching level, or an empty string.
 */
export function selectByRange(map: { [key: string]: string[] }, value: number | undefined, ranges: { [key: string]: [number, number] }): string {
    if (value === undefined) return '';
    for (const key in ranges) {
        if (value >= ranges[key][0] && value <= ranges[key][1]) {
            return selectRandom(map[key]);
        }
    }
    return '';
}


// --- KEYWORD VARIATION DATABASES ---
// These hold different ways to say the same thing.

const keyword_variations_vi: PlaceholderMap = {
    danger_feeling_high: ["nguy hiểm rình rập", "bất an sâu sắc", "rờn rợn đến sống lưng"],
    danger_source: ["một hiểm họa khôn lường", "những ánh mắt không mời", "một thế lực thù địch"],
    danger_feeling_moderate: ["căng thẳng", "cảnh giác cao độ", "bất ổn"],
    explorability_adj_low: ["dày đặc", "chằng chịt", "khó lường"],
    movement_difficulty_adj: ["khó khăn", "chậm chạp", "gian nan"],
    explorability_adj_moderate: ["thử thách", "đòi hỏi sự khéo léo", "cần sự tập trung"],
    magic_aura_high: ["rung động mãnh liệt với phép thuật", "như một cơn bão ma thuật", "tràn ngập năng lượng huyền bí"],
    magic_effect_sense: ["rung lên", "nhạy bén lạ thường", "ù đi vì năng lượng"],
    magic_aura_moderate: ["ma mị", "kỳ ảo", "phảng phất"],
    human_presence_sign: ["nghe thấy tiếng vọng của sự sống con người", "thấy những dấu vết nhạt nhòa của văn minh", "có cảm giác ai đó đã đi qua đây"],
    human_presence_faint: ["cũ kỹ", "lờ mờ", "gần như đã bị xóa sổ"],
    predator_feeling_high: ["kinh hoàng", "buốt sống lưng", "như bị săn đuổi"],
    predator_eyes_adj: ["đỏ ngầu", "sắc lạnh", "đầy tham vọng"],
    predator_sounds: ["gầm gừ", "xào xạc đáng ngại", "khẽ khàng chết chóc"],
    conclusion_danger: ["Một cảm giác lo lắng len lỏi trong từng thớ thịt bạn. Bạn nên cẩn trọng.", "Bản năng mách bảo bạn rằng nơi này không an toàn. Mọi quyết định đều phải được cân nhắc."],
    conclusion_confusing: ["Mọi thứ chìm trong một sự hỗn loạn và khó hiểu, gần như không thể tiến xa hơn.", "Nơi này như một mê cung, khiến bạn mất phương hướng."],
    conclusion_neutral: ["Bạn đứng đó, sẵn sàng cho những gì tiếp theo.", "Bạn hít một hơi thật sâu, chuẩn bị tinh thần cho thử thách phía trước."],
    temp_adj: { hot: ["nóng bỏng", "oi ả", "ngột ngạt"], mild: ["dịu mát", "ấm áp"], cold: ["se lạnh", "giá buốt"] },
    moisture_adj: { high: ["đặc quánh", "như súp", "ẩm ướt"], medium: ["trong lành", "thoáng đãng"], low: ["khô hanh"] },
    light_adj: { dark: ["mờ ảo", "leo lét", "chập choạng"], medium: ["lấp lánh", "le lói"], bright: ["chói chang", "rực rỡ"] },
};

const keyword_variations_en: PlaceholderMap = {
    danger_feeling_high: ["imminent danger", "deep unease", "a chill down your spine"],
    danger_source: ["an unseen threat", "unwelcome eyes", "a hostile force"],
    danger_feeling_moderate: ["tension", "high alert", "instability"],
    explorability_adj_low: ["dense", "impenetrable", "treacherous"],
    movement_difficulty_adj: ["difficult", "slow", "arduous"],
    explorability_adj_moderate: ["challenging", "requiring finesse", "demanding focus"],
    magic_aura_high: ["vibrates intensely with magic", "like a magical storm", "overflows with arcane energy"],
    magic_effect_sense: ["tingle", "become unusually sharp", "buzz with power"],
    magic_aura_moderate: ["eerie", "fantastical", "faint"],
    human_presence_sign: ["you hear an echo of civilization", "you see faint traces of past visitors", "you feel that someone has passed through here"],
    human_presence_faint: ["old", "faded", "almost erased"],
    predator_feeling_high: ["terror", "a spine-chilling sensation", "the feeling of being hunted"],
    predator_eyes_adj: ["glowing red", "ice-cold", "full of ambition"],
    predator_sounds: ["growls", "ominous rustling", "deadly silence"],
    conclusion_danger: ["A sense of anxiety creeps into your every fiber. You should be cautious.", "Your instincts tell you this place isn't safe. Every decision must be weighed carefully."],
    conclusion_confusing: ["Everything is shrouded in chaos and confusion, making it nearly impossible to proceed.", "This place is like a maze, leaving you disoriented."],
    conclusion_neutral: ["You stand there, ready for what comes next.", "You take a deep breath, preparing yourself for the challenges ahead."],
    temp_adj: { hot: ["scorching", "sweltering", "oppressive"], mild: ["mild", "warm"], cold: ["chilly", "freezing"] },
    moisture_adj: { high: ["soupy", "cloying", "damp"], medium: ["fresh", "pleasant"], low: ["dry"] },
    light_adj: { dark: ["dim", "flickering", "eerie"], medium: ["dappled", "mottled"], bright: ["blazing", "vivid"] },
};


// --- EXPORTED BIOME TEMPLATES ---

export const biomeNarrativeTemplates: Record<string, BiomeTemplateData> = {
  "Jungle": {
    terrain: "Jungle",
    descriptionTemplates: [
      {
        id: "jungle_opening_gloomy",
        type: "Opening",
        mood: ["Foreboding", "Gloomy"],
        length: "long",
        conditions: {"lightLevel": {"max": 0}},
        weight: 0.7,
        template: "Một bức màn {{adjective_dark}} bao trùm {{jungle_terrain_desc}}. Ánh sáng {{light_level_detail}} chỉ đủ để nhận ra những hình thù {{vague_shape_adj}} mờ ảo, như thể khu rừng đang {{jungle_feeling_dark}}."
      },
      {
        id: "jungle_opening_lush",
        type: "Opening",
        mood: ["Peaceful", "Lush"],
        length: "medium",
        conditions: {"lightLevel": {"min": 5}, "moisture": {"min": 5}},
        weight: 0.5,
        template: "Bạn đang len lỏi giữa {{jungle_terrain_desc_lush}}. Không khí {{temp_detail}} và {{moisture_detail}} bao trùm, mang theo {{smell_detail_lush}}."
      },
      {
        id: "entity_report_danger",
        type: "EntityReport",
        mood: ["Danger"],
        length: "medium",
        conditions: {"predatorPresence": {"min": 5}},
        weight: 1.0,
        template: "Đột nhiên, bạn cảm nhận được {sensory_detail_danger}. {entity_report_detail}!"
      },
      {
        id: "sensory_detail_gloomy",
        type: "SensoryDetail",
        mood: ["Gloomy", "Dark"],
        length: "long",
        conditions: {"lightLevel": {"max": 0}},
        weight: 0.8,
        template: "Không khí {{temp_detail_gloomy}} và {{moisture_detail_gloomy}}, khiến bạn cảm thấy {{feeling_gloomy}}."
      },
      {
        id: "closing_peaceful",
        type: "Closing",
        mood: ["Peaceful"],
        length: "medium",
        conditions: {},
        weight: 0.6,
        template: "Tâm trí bạn được xoa dịu bởi sự yên bình của nơi này."
      }
    ],
    adjectives: {
      "adjective_dark": ["âm u", "u ám", "tăm tối", "lạnh lẽo"],
      "jungle_terrain_desc": ["thảm thực vật chằng chịt", "khu rừng bạt ngàn", "tán lá dày đặc", "lối đi rậm rạp"],
      "jungle_terrain_desc_lush": ["những tán lá xanh tươi", "thảm thực vật sum suê", "khu rừng trù phú"],
      "vague_shape_adj": ["kỳ dị", "ma mị", "không rõ ràng", "ẩn hiện"],
    },
    features: {
        "main_feature": ["một dòng suối nhỏ", "một cụm cây cổ thụ", "một vách đá phủ rêu"],
    },
    smells: {
        "smell_dark": ["mùi ẩm mốc", "mùi đất mục", "mùi nồng của lá chết"],
        "smell_lush": ["mùi hoa dại", "mùi đất ẩm tươi", "hương vị của sự sống"],
    },
    sounds: {
        "sound_dark": ["tiếng côn trùng rỉ rả", "tiếng gió rít qua kẽ lá", "âm thanh ghê rợn"],
        "sound_lush": ["tiếng chim hót líu lo", "tiếng nước chảy róc rách", "tiếng lá xào xạc"],
    },
    sky: {
        "sky_general": ["bầu trời u ám", "những vệt sáng hiếm hoi", "tán lá che khuất bầu trời"],
    }
  },
  "forest": {
    terrain: "forest",
    descriptionTemplates: [
      { id: "forest_1", type: "Opening", mood: ["Peaceful", "Lush"], length: "medium", weight: 1, template: "Bạn đang ở trong một khu rừng {{adjective_lush}} với những cây {{feature_tree}} vươn cao, che khuất bầu trời {{sky_general}}. Không khí có mùi {{smell_lush}}." },
      { id: "forest_2", type: "Opening", mood: ["Gloomy", "Mysterious"], length: "long", weight: 0.8, template: "Bạn đang ở sâu trong một khu rừng {{adjective_dark}}. Ánh sáng yếu ớt xuyên qua kẽ lá, và bạn nghe thấy tiếng {{sound_dark}} của sự sống hoang dã. {sensory_details} {entity_report} {surrounding_peek}" },
    ],
    adjectives: {
        "adjective_lush": ["rậm rạp", "yên tĩnh", "xanh tươi"],
        "adjective_dark": ["u ám", "ma mị", "cổ xưa"],
        "feature_tree": ["sồi", "thông", "dương xỉ"],
        "sky_general": ["xanh biếc", "vàng úa", "xám xịt"],
    },
    features: {},
    smells: {
        "smell_lush": ["đất ẩm", "lá cây mục", "nhựa thông"],
    },
    sounds: {
        "sound_dark": ["cành cây gãy", "sự im lặng đáng sợ", "tiếng côn trùng kêu"],
    },
    sky: {}
  },
  "grassland": { terrain: "grassland", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
  "beach": { terrain: "beach", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
  "desert": { terrain: "desert", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
  "swamp": { terrain: "swamp", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
  "mesa": { terrain: "mesa", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
  "tundra": { terrain: "tundra", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
  "mountain": { terrain: "mountain", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
  "cave": { terrain: "cave", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
  "volcanic": { terrain: "volcanic", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
  "floptropica": { terrain: "floptropica", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
  "wall": { terrain: "wall", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
  "ocean": { terrain: "ocean", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
  "city": { terrain: "city", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
  "space_station": { terrain: "space_station", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
  "underwater": { terrain: "underwater", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
  "mushroom_forest": { terrain: "mushroom_forest", descriptionTemplates: [], adjectives: {}, features: {}, smells: {}, sounds: {}, sky: {} },
};


// --- EXPORT FUNCTIONS ---

export function getKeywordVariations(language: Language) {
    return language === 'vi' ? keyword_variations_vi : keyword_variations_en;
}

/**
 * Finds a template string from the database.
 * @param language The current language ('vi' or 'en').
 * @param category The main category (e.g., 'description_templates').
 * @param topic The specific topic (e.g., 'jungle_general').
 * @param level The desired detail level ('short', 'medium', 'detailed').
 * @returns An array of template strings.
 */
export function findTemplate(language: Language, category: string, topic: string, level: NarrativeLength): string[] {
    const db: Record<string,any> = language === 'vi' ? keyword_variations_vi : keyword_variations_en;
    
    const categoryObj = (db as any)[category];
    if (!categoryObj) return [];

    const topicObj = categoryObj[topic];
    if (!topicObj) return [];

    // Fallback logic: if 'detailed' is requested but doesn't exist, try 'medium', then 'short'.
    let templates = topicObj[level];
    if (!templates || templates.length === 0) {
        templates = topicObj.medium;
    }
    if (!templates || templates.length === 0) {
        templates = topicObj.short;
    }

    return templates || [];
}
