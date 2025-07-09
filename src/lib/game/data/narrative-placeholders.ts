// This file will hold generic descriptive phrases for building narratives.

type PlaceholderMap = {
    [key: string]: string[] | { [subKey: string]: string[] };
};

// Helper function to select a random item from an array
export function selectRandom(arr: string[] | undefined): string {
    if (!arr || arr.length === 0) return '';
    return arr[Math.floor(Math.random() * arr.length)];
}

// Helper function to select a phrase based on a numerical value and defined ranges.
export function selectByRange(map: { [key: string]: string[] }, value: number | undefined, ranges: { [key: string]: [number, number] }): string {
    if (value === undefined) return '';
    for (const key in ranges) {
        if (value >= ranges[key][0] && value <= ranges[key][1]) {
            return selectRandom(map[key]);
        }
    }
    return '';
}

export const placeholders_vi: PlaceholderMap = {
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
    conclusion_neutral: ["Bạn đứng đó, sẵn sàng cho những gì tiếp theo.", "Bạn hít một hơi thật sâu, chuẩn bị tinh thần cho thử thách phía trước."]
};

export const placeholders_en: PlaceholderMap = {
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
    conclusion_neutral: ["You stand there, ready for what comes next.", "You take a deep breath, preparing yourself for the challenges ahead."]
};

export const getPlaceholders = (language: 'vi' | 'en') => {
    return language === 'vi' ? placeholders_vi : placeholders_en;
}
