import type { Language, NarrativeLength } from '../types';

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

// --- NARRATIVE TEMPLATE DATABASES ---
// These hold the sentence structures for the offline narrator.

const template_strings_vi = {
    description_templates: {
        jungle_general: {
            short: ["Bạn đang ở trong một khu rừng rậm {{JUNGLE_LOCATION_ADJ}}."],
            medium: ["Bạn đang {{JUNGLE_LOCATION_ADJ}} len lỏi giữa {{JUNGLE_TERRAIN_DESC}}. Không khí {{TEMP_ADJ}} với hơi ẩm {{MOISTURE_ADJ}}."],
            detailed: [
                "Bạn đang {{JUNGLE_LOCATION_ADJ}} len lỏi giữa {{JUNGLE_TERRAIN_DESC}}. Không khí {{TEMP_ADJ}} với hơi ẩm {{MOISTURE_ADJ}}. Ánh sáng {{LIGHT_ADJ}} chỉ đủ để nhận ra những hình thù mờ ảo, như thể khu rừng đang {{JUNGLE_FEELING}}."
            ],
        },
        danger_high: {
            medium: ["Một cảm giác {{DANGER_FEELING_HIGH}} bao trùm. Nơi đây dường như đang ẩn chứa {{DANGER_SOURCE}}."],
        },
        explorability_low: {
            medium: ["Địa hình quá {{EXPLORABILITY_ADJ_LOW}} khiến việc di chuyển trở nên {{MOVEMENT_DIFFICULTY_ADJ}}."],
        },
        magic_high: {
            medium: ["Không khí nơi đây dường như {{MAGIC_AURA_HIGH}}, khiến mọi giác quan của bạn {{MAGIC_EFFECT_SENSE}}."],
        },
        predator_high: {
            medium: ["Một cảm giác {{PREDATOR_FEELING_HIGH}} bao trùm, như có hàng trăm ánh mắt {{PREDATOR_EYES_ADJ}} đang dõi theo bạn từ trong bóng tối."],
        },
        items_present: {
            medium: ["\nNgổn ngang trên nền đất, bạn thấy: {{ITEM_LIST}}."],
        },
        enemy_present: {
            medium: ["\nBạn nhận thấy sự hiện diện của một {{ENEMY_ADJECTIVE}} {{ENEMY_TYPE}}."],
        },
        npc_present: {
            medium: ["\nTừ xa, bạn thấy {{NPC_NAME}}."],
        },
        structure_present: {
             medium: ["\nMột {{STRUCTURE_NAME}} hiện ra trong tầm mắt."],
        },
        surrounding_peek: {
            medium: ["Nhìn ra xa, bạn nhận thấy {{PEEK_DESCRIPTION}}."],
        },
    },
    action_templates: {
        attack: {
            detailed: ["{{ATTACK_NARRATIVE}}. {damage_report}. {sensory_feedback}. {enemy_reaction}"],
        }
    }
};

const template_strings_en = {
    description_templates: {
        jungle_general: {
            short: ["You are in a {{JUNGLE_LOCATION_ADJ}} jungle."],
            medium: ["You are {{JUNGLE_LOCATION_ADJ}} navigating through the {{JUNGLE_TERRAIN_DESC}}. The air is {{TEMP_ADJ}} with {{MOISTURE_ADJ}} humidity."],
            detailed: [
                "You are {{JUNGLE_LOCATION_ADJ}} navigating through the {{JUNGLE_TERRAIN_DESC}}. The air is {{TEMP_ADJ}} with {{MOISTURE_ADJ}} humidity. The {{LIGHT_ADJ}} light is just enough to make out vague shapes, as if the jungle itself is {{JUNGLE_FEELING}}."
            ],
        },
        danger_high: {
            medium: ["A feeling of {{DANGER_FEELING_HIGH}} pervades. This place seems to hide {{DANGER_SOURCE}}."],
        },
        explorability_low: {
            medium: ["The terrain is too {{EXPLORABILITY_ADJ_LOW}}, making movement {{MOVEMENT_DIFFICULTY_ADJ}}."],
        },
        magic_high: {
            medium: ["The air here seems to {{MAGIC_AURA_HIGH}}, making your senses {{MAGIC_EFFECT_SENSE}}."],
        },
        predator_high: {
            medium: ["A {{PREDATOR_FEELING_HIGH}} feeling takes over, as if hundreds of {{PREDATOR_EYES_ADJ}} eyes are watching you from the darkness."],
        },
        items_present: {
            medium: ["\nScattered on the ground, you see: {{ITEM_LIST}}."],
        },
        enemy_present: {
            medium: ["\nYou notice the presence of an {{ENEMY_ADJECTIVE}} {{ENEMY_TYPE}}."],
        },
        npc_present: {
            medium: ["\nIn the distance, you see {{NPC_NAME}}."],
        },
        structure_present: {
             medium: ["\nA {{STRUCTURE_NAME}} comes into view."],
        },
        surrounding_peek: {
            medium: ["Looking afar, you notice {{PEEK_DESCRIPTION}}."],
        },
    },
     action_templates: {
        attack: {
            detailed: ["{{ATTACK_NARRATIVE}}. {damage_report}. {sensory_feedback}. {enemy_reaction}"],
        }
    }
};


// --- EXPORT FUNCTIONS ---

export function getKeywordVariations(language: Language) {
    return language === 'vi' ? keyword_variations_vi : keyword_variations_en;
}

export function getTemplateStrings(language: Language) {
    return language === 'vi' ? template_strings_vi : template_strings_en;
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
    const db = getTemplateStrings(language);
    
    // Type assertions to navigate the nested object structure
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
