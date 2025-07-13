import {
    analyze_chunk_mood,
    get_sentence_limits,
    check_conditions,
    has_mood_overlap,
    select_template_by_weight,
    fill_template,
} from './offline'; 

import { SmartJoinSentences } from '../../utils';

import type { Chunk, NarrativeTemplate, MoodTag, NarrativeLength, BiomeTemplateData, PlayerStatus } from '../types';
import { Language } from '../../i18n'; 

// Mock translation function (hàm dịch giả định)
const mockT = (key: string, replacements?: any) => {
    const translations: { [key: string]: string } = {
        'light_level_dark': 'một màn đêm u tối',
        'light_level_dim': 'ánh sáng lờ mờ',
        'light_level_normal': 'ánh sáng bình thường',
        'temp_cold': 'lạnh buốt',
        'temp_hot': 'nóng như thiêu đốt',
        'temp_mild': 'ôn hòa',
        'moisture_humid': 'ẩm ướt',
        'moisture_dry': 'khô cằn',
        'moisture_normal': 'có độ ẩm vừa phải',
        'jungle_feeling_dark_phrase': 'cảm giác rùng rợn của rừng sâu',
        'no_enemy_found': 'không có kẻ địch nào',
        'no_item_found': 'không có vật phẩm nào',
        'Goblin': 'Goblin',
        'Healing Potion': 'Bình Hồi Phục',
        'Kiếm Thần': 'Kiếm Thần',
        'player_health_low': 'sức khỏe yếu',
        'player_health_normal': 'sức khỏe tốt',
        'player_stamina_low': 'thể lực cạn kiệt',
        'player_stamina_normal': 'thể lực dồi dào',
    };
    let text = translations[key] || `MISSING_TRANSLATION:${key}`;
    if (replacements) {
        for (const rKey in replacements) {
            text = text.replace(`{${rKey}}`, replacements[rKey]);
        }
    }
    return text;
};

// Mock getTranslatedText function for consistency with fill_template
const mockGetTranslatedText = (translatable: any, lang: Language): string => {
    const actualLang = lang === Language.Vietnamese ? 'vi' : 'en'; // Ánh xạ Language enum sang string
    if (typeof translatable === 'string') {
        return mockT(translatable);
    }
    if (typeof translatable === 'object' && translatable !== null) {
        return translatable[actualLang] || translatable['en'] || 'MISSING_TRANSLATION';
    }
    return 'INVALID_TRANSLATABLE';
};


// -------------------- TEST SUITES --------------------

// Test analyze_chunk_mood
describe('analyze_chunk_mood', () => {
    it('should return correct moods for a dangerous, dark and wet swamp', () => {
        const chunk: Chunk = {
            x: 0, y: 0, terrain: 'swamp', description: '', NPCs: [], items: [], structures: [], explored: false,
            lastVisited: 0, enemy: null, actions: [], regionId: 1, travelCost: 1, vegetationDensity: 70,
            moisture: 90, elevation: 5, lightLevel: 5, dangerLevel: 80, magicAffinity: 20, humanPresence: 0,
            explorability: 50, soilType: 'loamy', predatorPresence: 70, temperature: 30, windLevel: 0
        };
        const moods = analyze_chunk_mood(chunk);
        expect(moods).toEqual(expect.arrayContaining(["Danger", "Foreboding", "Threatening", "Dark", "Gloomy", "Mysterious", "Lush", "Wet", "Vibrant", "Wild"]));
        // Kiểm tra không có mood trùng lặp
        expect(new Set(moods).size).toBe(moods.length);
    });

    it('should return correct moods for a peaceful, bright forest', () => {
        const chunk: Chunk = {
            x: 0, y: 0, terrain: 'forest', description: '', NPCs: [], items: [], structures: [], explored: false,
            lastVisited: 0, enemy: null, actions: [], regionId: 1, travelCost: 1, vegetationDensity: 80,
            moisture: 50, elevation: 60, lightLevel: 90, dangerLevel: 10, magicAffinity: 10, humanPresence: 5,
            explorability: 70, soilType: 'loamy', predatorPresence: 10, temperature: 55, windLevel: 0
        };
        const moods = analyze_chunk_mood(chunk);
        expect(moods).toEqual(expect.arrayContaining(["Vibrant", "Peaceful", "Lush", "Abandoned"]));
        expect(new Set(moods).size).toBe(moods.length);
    });

    it('should handle extreme temperatures', () => {
        const coldChunk: Chunk = {
            x: 0, y: 0, terrain: 'tundra', description: '', NPCs: [], items: [], structures: [], explored: false,
            lastVisited: 0, enemy: null, actions: [], regionId: 1, travelCost: 1, vegetationDensity: 10,
            moisture: 60, elevation: 20, lightLevel: 60, dangerLevel: 20, magicAffinity: 0, humanPresence: 0,
            explorability: 30, soilType: 'rocky', predatorPresence: 30, temperature: 10, windLevel: 0
        };
        expect(analyze_chunk_mood(coldChunk)).toEqual(expect.arrayContaining(["Cold", "Harsh", "Desolate", "Barren"]));

        const hotChunk: Chunk = {
            x: 0, y: 0, terrain: 'desert', description: '', NPCs: [], items: [], structures: [], explored: false,
            lastVisited: 0, enemy: null, actions: [], regionId: 1, travelCost: 1, vegetationDensity: 5,
            moisture: 5, elevation: 10, lightLevel: 95, dangerLevel: 45, magicAffinity: 5, humanPresence: 15,
            explorability: 40, soilType: 'sandy', predatorPresence: 25, temperature: 90, windLevel: 0
        };
        expect(analyze_chunk_mood(hotChunk)).toEqual(expect.arrayContaining(["Hot", "Harsh", "Arid", "Desolate", "Threatening", "Vibrant", "Abandoned"]));
    });

    it('should return default terrain moods if other stats are neutral', () => {
        const neutralChunk: Chunk = {
            x: 0, y: 0, terrain: 'grassland', description: '', NPCs: [], items: [], structures: [], explored: false,
            lastVisited: 0, enemy: null, actions: [], regionId: 1, travelCost: 1, vegetationDensity: 50,
            moisture: 50, elevation: 50, lightLevel: 50, dangerLevel: 20, magicAffinity: 20, humanPresence: 20,
            explorability: 50, soilType: 'loamy', predatorPresence: 20, temperature: 50, windLevel: 0
        };
        const moods = analyze_chunk_mood(neutralChunk);
        expect(moods).toEqual(expect.arrayContaining(["Peaceful", "Abandoned"]));
    });

    it('should handle all values at min/max (0/100) correctly', () => {
        const minChunk: Chunk = {
            x: 0, y: 0, terrain: 'cave', description: '', NPCs: [], items: [], structures: [], explored: false,
            lastVisited: 0, enemy: null, actions: [], regionId: 1, travelCost: 1, vegetationDensity: 0,
            moisture: 0, elevation: 0, lightLevel: 0, dangerLevel: 0, magicAffinity: 0, humanPresence: 0,
            explorability: 0, soilType: 'rocky', predatorPresence: 0, temperature: 0, windLevel: 0
        };
         expect(analyze_chunk_mood(minChunk)).toEqual(expect.arrayContaining([
            "Dark", "Gloomy", "Mysterious", "Arid", "Desolate", "Cold", "Harsh", "Foreboding", "Confined"
        ]));
        
        const maxChunk: Chunk = {
            x: 0, y: 0, terrain: 'volcanic', description: '', NPCs: [], items: [], structures: [], explored: false,
            lastVisited: 0, enemy: null, actions: [], regionId: 1, travelCost: 1, vegetationDensity: 100,
            moisture: 100, elevation: 100, lightLevel: 100, dangerLevel: 100, magicAffinity: 100, humanPresence: 100,
            explorability: 100, soilType: 'rocky', predatorPresence: 100, temperature: 100, windLevel: 100
        };
        expect(analyze_chunk_mood(maxChunk)).toEqual(expect.arrayContaining([
            "Danger", "Foreboding", "Threatening", "Vibrant", "Peaceful", "Lush", "Wet", "Wild", "Magic", "Mysterious", "Ethereal", "Civilized", "Historic", "Hot", "Harsh", "Elevated", "Smoldering"
        ]));
    });
});

// Test get_sentence_limits
describe('get_sentence_limits', () => {
    it('should return correct limits for "short"', () => {
        expect(get_sentence_limits('short')).toEqual({ min_s: 1, max_s: 2 });
    });
    it('should return correct limits for "medium"', () => {
        expect(get_sentence_limits('medium')).toEqual({ min_s: 2, max_s: 4 });
    });
    it('should return correct limits for "long"', () => {
        expect(get_sentence_limits('long')).toEqual({ min_s: 4, max_s: 7 });
    });
    it('should return correct limits for "detailed"', () => {
        expect(get_sentence_limits('detailed')).toEqual({ min_s: 4, max_s: 7 });
    });
    it('should return default limits for unknown length', () => {
        expect(get_sentence_limits('unknown' as NarrativeLength)).toEqual({ min_s: 1, max_s: 2 });
    });
});

// Test check_conditions
describe('check_conditions', () => {
    const baseChunk: any = {
        x: 0, y: 0, terrain: 'forest', description: '', NPCs: [], items: [], structures: [], explored: false,
        lastVisited: 0, enemy: null, actions: [], regionId: 1, travelCost: 1, vegetationDensity: 60,
        moisture: 50, elevation: 50, lightLevel: 70, dangerLevel: 30, magicAffinity: 20, humanPresence: 10,
        explorability: 70, soilType: 'loamy', predatorPresence: 15, temperature: 50, windLevel: 0,
        timeOfDay: 'day', // Thêm timeOfDay vào chunk
        visibility: 80, humidity: 40 // Thêm visibility, humidity
    };
    const basePlayerState: PlayerStatus = {
        hp: 75, mana: 50, stamina: 80, bodyTemperature: 37, items: [], equipment: { weapon: null, armor: null, accessory: null },
        quests: [], questsCompleted: 0, skills: [], persona: 'explorer', attributes: {physicalAttack: 0, magicalAttack: 0, critChance: 0, attackSpeed: 0, cooldownReduction: 0}, unlockProgress: { kills: 0, damageSpells: 0, moves: 0 },
        language: 'en', journal: {}, dailyActionLog: [], questHints: {}, trackedEnemy: undefined
    };

    it('should return true if no conditions are provided', () => {
        expect(check_conditions(undefined, baseChunk)).toBe(true);
    });

    it('should return true for satisfied chunk numerical conditions (0-100 scale)', () => {
        const conditions = {
            vegetationDensity: { min: 50, max: 80 },
            lightLevel: { min: 60 }
        };
        expect(check_conditions(conditions, baseChunk)).toBe(true);
    });

    it('should return false for unsatisfied chunk numerical conditions', () => {
        const conditions = {
            dangerLevel: { min: 50 }, // baseChunk.dangerLevel is 30
        };
        expect(check_conditions(conditions, baseChunk)).toBe(false);
    });

    it('should handle timeOfDay condition', () => {
        const dayConditions = { timeOfDay: 'day' as 'day' | 'night' };
        expect(check_conditions(dayConditions, baseChunk)).toBe(true); // Chunk is day
        const nightConditions = { timeOfDay: 'night' as 'day' | 'night' };
        expect(check_conditions(nightConditions, baseChunk)).toBe(false); // Chunk is day, condition is night
    });

    it('should handle soilType condition', () => {
        const conditions = { soilType: ['loamy', 'sandy'] };
        expect(check_conditions(conditions, baseChunk)).toBe(true); // Chunk is loamy
        const wrongSoilConditions = { soilType: ['clay'] };
        expect(check_conditions(wrongSoilConditions, baseChunk)).toBe(false);
    });

    it('should handle playerHealth condition', () => {
        const conditions = { playerHealth: { min: 70 } };
        expect(check_conditions(conditions, baseChunk, basePlayerState)).toBe(true);
        const lowHealthConditions = { playerHealth: { max: 50 } };
        expect(check_conditions(lowHealthConditions, baseChunk, basePlayerState)).toBe(false);
    });

    it('should handle requiredEntities (enemy)', () => {
        const enemyChunk: Chunk = { ...baseChunk, enemy: { type: { en: 'Goblin', vi: 'Goblin' }, hp: 50, damage: 10, behavior: 'aggressive', size: 'medium', diet: [], satiation: 0, maxSatiation: 1, emoji: '👺' } };
        const conditions = { requiredEntities: { enemyType: 'Goblin' } };
        expect(check_conditions(conditions, enemyChunk, basePlayerState)).toBe(true);
        const noEnemyConditions = { requiredEntities: { enemyType: 'Dragon' } };
        expect(check_conditions(noEnemyConditions, enemyChunk, basePlayerState)).toBe(false);
    });

    it('should handle requiredEntities (item)', () => {
        const itemChunk: Chunk = { ...baseChunk, items: [{ name: { en: 'Healing Potion', vi: 'Bình Hồi Phục' }, description: {en: '', vi: ''}, quantity: 1, tier: 1, emoji: '🧪' }] };
        const conditions = { requiredEntities: { itemType: 'Bình Hồi Phục' } };
        expect(check_conditions(conditions, itemChunk, basePlayerState)).toBe(true);
        const noItemConditions = { requiredEntities: { itemType: 'Kiếm Thần' } };
        expect(check_conditions(noItemConditions, itemChunk, basePlayerState)).toBe(false);
    });

    it('should handle multiple mixed conditions', () => {
        const conditions = {
            lightLevel: { min: 60 },
            dangerLevel: { max: 40 },
            soilType: ['loamy'],
            playerHealth: { min: 70 },
            timeOfDay: 'day' as 'day' | 'night'
        };
        expect(check_conditions(conditions, baseChunk, basePlayerState)).toBe(true);

        const failingConditions = {
            ...conditions,
            playerHealth: { max: 50 } // This will make it fail
        };
        expect(check_conditions(failingConditions, baseChunk, basePlayerState)).toBe(false);
    });
});

// Test has_mood_overlap
describe('has_mood_overlap', () => {
    it('should return true if template has no moods defined', () => {
        expect(has_mood_overlap([], ['Danger', 'Peaceful'])).toBe(true);
    });

    it('should return false if current moods are empty but template requires moods', () => {
        expect(has_mood_overlap(['Danger'], [])).toBe(false);
    });

    it('should return true if there is at least one overlapping mood', () => {
        expect(has_mood_overlap(['Danger', 'Magic'], ['Peaceful', 'Magic', 'Lush'])).toBe(true);
    });

    it('should return false if there are no overlapping moods', () => {
        expect(has_mood_overlap(['Danger', 'Magic'], ['Peaceful', 'Lush', 'Wild'])).toBe(false);
    });
});

// Test select_template_by_weight
describe('select_template_by_weight', () => {
    const templates: NarrativeTemplate[] = [
        { id: 't1', type: 'Opening', mood: [], length: 'short', weight: 10, template: 'Template 1' },
        { id: 't2', type: 'Opening', mood: [], length: 'short', weight: 20, template: 'Template 2' },
        { id: 't3', type: 'Opening', mood: [], length: 'short', weight: 30, template: 'Template 3' },
    ];

    it('should throw error if no templates are provided', () => {
        expect(() => select_template_by_weight([])).toThrow("No templates provided for weighted selection.");
    });

    it('should select templates based on their weights over many iterations', () => {
        const selectionCounts: { [key: string]: number } = { t1: 0, t2: 0, t3: 0 };
        const numIterations = 10000;

        for (let i = 0; i < numIterations; i++) {
            const selected = select_template_by_weight(templates);
            selectionCounts[selected.id]++;
        }

        const totalWeight = 60;
        expect(selectionCounts.t1 / numIterations).toBeCloseTo(10 / totalWeight, 1);
        expect(selectionCounts.t2 / numIterations).toBeCloseTo(20 / totalWeight, 1);
        expect(selectionCounts.t3 / numIterations).toBeCloseTo(30 / totalWeight, 1);
    });
});

// Test fill_template (basic functionality)
describe('fill_template', () => {
    const mockChunk: any = {
        x: 0, y: 0, terrain: 'jungle', description: '', NPCs: [], items: [
            { name: { en: 'Healing Potion', vi: 'Bình Hồi Phục' }, description: {en: '', vi: ''}, quantity: 1, tier: 1, emoji: '🧪' }
        ], structures: [], explored: false,
        lastVisited: 0, enemy: { type: { en: 'Goblin', vi: 'Goblin' }, hp: 50, damage: 10, behavior: 'aggressive', size: 'medium', diet: [], satiation: 0, maxSatiation: 1, emoji: '👺' }, actions: [], regionId: 1, travelCost: 1, vegetationDensity: 80,
        moisture: 90, elevation: 30, lightLevel: 5, dangerLevel: 60, magicAffinity: 75, humanPresence: 0,
        explorability: 40, soilType: 'loamy', predatorPresence: 70, temperature: 85, windLevel: 0
    };
    const mockWorld: any = {};
    const mockPlayerPosition = { x: 0, y: 0 };
    const mockBiomeTemplateData: BiomeTemplateData = {
        terrain: 'jungle',
        descriptionTemplates: [],
        adjectives: {
            'jungle_adjective_lush': ['rậm rạp', 'xanh tươi'],
            'jungle_adjective_mysterious': ['bí ẩn', 'huyền bí']
        },
        features: {}, smells: {}, sounds: {}, sky: {}
    };
     const basePlayerState: PlayerStatus = {
        hp: 75, mana: 50, stamina: 80, bodyTemperature: 37, items: [], equipment: { weapon: null, armor: null, accessory: null },
        quests: [], questsCompleted: 0, skills: [], persona: 'explorer', attributes: {physicalAttack: 0, magicalAttack: 0, critChance: 0, attackSpeed: 0, cooldownReduction: 0}, unlockProgress: { kills: 0, damageSpells: 0, moves: 0 },
        language: 'en', journal: {}, dailyActionLog: [], questHints: {}, trackedEnemy: undefined
    };

    it('should fill static placeholders correctly', () => {
        const template = "Đây là một khu rừng {{jungle_adjective_lush}} và {{jungle_adjective_mysterious}}.";
        const result = fill_template(template, mockChunk, mockWorld, mockPlayerPosition, mockT, 'vi' as Language, mockBiomeTemplateData, undefined);
        expect(result).toMatch(/Đây là một khu rừng (rậm rạp|xanh tươi) và (bí ẩn|huyền bí)\./);
    });

    it('should replace dynamic chunk-based placeholders (0-100 scale)', () => {
        const template = "Ánh sáng: {light_level_detail}. Nhiệt độ: {temp_detail}. Độ ẩm: {moisture_detail}.";
        const result = fill_template(template, mockChunk, mockWorld, mockPlayerPosition, mockT, 'vi' as Language, mockBiomeTemplateData, undefined);
        expect(result).toContain('Ánh sáng: một màn đêm u tối.');
        expect(result).toContain('Nhiệt độ: nóng như thiêu đốt.');
        expect(result).toContain('Độ ẩm: ẩm ướt.');
    });

    it('should replace enemy and item placeholders', () => {
        const template = "Bạn nhìn thấy {enemy_name} và một {item_found}.";
        const result = fill_template(template, mockChunk, mockWorld, mockPlayerPosition, mockT, 'vi' as Language, mockBiomeTemplateData, undefined);
        expect(result).toContain('Bạn nhìn thấy Goblin và một Bình Hồi Phục.');
    });

    it('should handle missing enemy/item gracefully', () => {
        const noEnemyNoItemChunk: Chunk = { ...mockChunk, enemy: null, items: [] };
        const template = "Bạn nhìn thấy {enemy_name} và một {item_found}.";
        const result = fill_template(template, noEnemyNoItemChunk, mockWorld, mockPlayerPosition, mockT, 'vi' as Language, mockBiomeTemplateData, undefined);
        expect(result).toContain('Bạn nhìn thấy không có kẻ địch nào và một không có vật phẩm nào.');
    });

    it('should return original placeholder if category not found', () => {
        const template = "Đây là một điều {{non_existent_adjective}}.";
        const result = fill_template(template, mockChunk, mockWorld, mockPlayerPosition, mockT, 'vi' as Language, mockBiomeTemplateData, undefined);
        expect(result).toContain('Đây là một điều {{non_existent_adjective}}.');
    });

    it('should replace playerState related placeholders', () => {
        const template = "Bạn cảm thấy {player_health_status} và {player_stamina_status}.";
        const mockPlayerStatus: PlayerStatus = {
            ...basePlayerState,
            hp: 25,
            stamina: 10 
        };
        const result = fill_template(template, mockChunk, mockWorld, mockPlayerPosition, mockT, 'vi' as Language, mockBiomeTemplateData, mockPlayerStatus);
        expect(result).toContain('Bạn cảm thấy sức khỏe yếu và thể lực cạn kiệt.');
    });
});


// Test SmartJoinSentences
describe('SmartJoinSentences', () => {
    it('should return empty string for empty array', () => {
        expect(SmartJoinSentences([], 'medium')).toBe('');
    });

    it('should return single sentence as is', () => {
        expect(SmartJoinSentences(['Hello world.'], 'medium')).toBe('Hello world.');
    });

    it('should join short sentences with simple connectors', () => {
        const sentences = ['Trời tối.', 'Đường khó đi.'];
        expect(SmartJoinSentences(sentences, 'short')).toMatch(/Trời tối và Đường khó đi\./);
    });

    it('should join medium sentences with varied connectors', () => {
        const sentences = ['Ngọn lửa bập bùng.', 'Tiếng gió rít.', 'Cảm giác lạnh lẽo bao trùm.'];
        const result = SmartJoinSentences(sentences, 'medium');
        expect(result).toMatch(/Ngọn lửa bập bùng(\. Bỗng nhiên, |\.\sNgoài ra, |\.\s| và )Tiếng gió rít(\. Bỗng nhiên, |\.\sNgoài ra, |\.\s| và )Cảm giác lạnh lẽo bao trùm\./);
    });

    it('should join long/detailed sentences with rich connectors', () => {
        const longConnectorsRegex = "(?:,\\s*thêm vào đó\\s*|\\.\\s*Hơn thế nữa,\\s*|\\.\\s*Không chỉ vậy,\\s*|\\.\\s*Đáng chú ý là,\\s*|\\.\\s*Trong khi đó,\\s*|\\.\\s*Tuy nhiên,\\s*)";
        const sentences = [
            'Dưới ánh trăng mờ nhạt, khu rừng hiện ra đầy bí ẩn.',
            'Những cái cây cổ thụ vươn mình như những ngón tay gầy guộc.',
            'Tiếng côn trùng rỉ rả không ngừng, tạo nên một bản giao hưởng kinh dị.'
        ];
        const result = SmartJoinSentences(sentences, 'long');
        const regex = new RegExp(`Dưới ánh trăng mờ nhạt, khu rừng hiện ra đầy bí ẩn${longConnectorsRegex}Những cái cây cổ thụ vươn mình như những ngón tay gầy guộc${longConnectorsRegex}Tiếng côn trùng rỉ rả không ngừng, tạo nên một bản giao hưởng kinh dị.`);
        expect(result).toMatch(regex);
    });

    it('should handle sentences with existing punctuation', () => {
        const sentences = ['Đã xảy ra chuyện gì đó!', 'Có tiếng động lạ?'];
        expect(SmartJoinSentences(sentences, 'short')).toMatch(/Đã xảy ra chuyện gì đó! và Có tiếng động lạ\?/);
    });

    it('should remove redundant spaces and punctuation', () => {
        const sentences = ['  Câu đầu.  ', '  câu hai..  ', '   câu ba   '];
        const result = SmartJoinSentences(sentences, 'medium');
        expect(result.trim()).not.toMatch(/\s{2,}/);
        expect(result).not.toMatch(/\.\./);
        expect(result).toMatch(/\.$/); 
    });

    it('should handle sentences with quotes', () => {
        const sentences = [`"Trời ơi!"`, `Cô ấy kêu lên.`];
        expect(SmartJoinSentences(sentences, 'short')).toMatch(/"Trời ơi!" và Cô ấy kêu lên\./);
    });
});
