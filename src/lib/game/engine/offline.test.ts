import {
    analyze_chunk_mood,
    get_sentence_limits,
    check_conditions,
    has_mood_overlap,
    select_template_by_weight,
    fill_template,
} from './offline'; 

import { SmartJoinSentences } from '../../utils';
import type { Chunk, NarrativeTemplate, NarrativeLength, PlayerStatus, World } from '../types';
import { Language } from '../../i18n'; 

// Mock translation function
const mockT = (key: string, replacements?: any) => {
    const translations: { [key: string]: any } = {
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
        'player_health_low': 'sức khỏe yếu',
        'player_health_normal': 'sức khỏe tốt',
        'player_stamina_low': 'thể lực cạn kiệt',
        'player_stamina_normal': 'thể lực dồi dào',
        'Goblin': 'Goblin',
        'Healing Potion': 'Bình Hồi Phục',
        'Kiếm Thần': 'Kiếm Thần',
        'exploreFoundNothing': [ "Không tìm thấy gì." ],
    };
    let text = translations[key] || `MISSING_TRANSLATION:${key}`;
    if (replacements) {
        for (const rKey in replacements) {
            text = text.replace(`{${rKey}}`, replacements[rKey]);
        }
    }
    return text;
};

// Note: mockGetTranslatedText was removed — tests use mockT directly for translations.


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
        expect(analyze_chunk_mood(hotChunk)).toEqual(expect.arrayContaining(["Hot", "Harsh", "Arid", "Desolate", "Threatening", "Vibrant", "Peaceful", "Abandoned"]));
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
            "Dark", "Gloomy", "Mysterious", "Arid", "Desolate", "Cold", "Harsh", "Confined", "Foreboding"
        ]));
        
        const maxChunk: Chunk = {
            x: 0, y: 0, terrain: 'volcanic', description: '', NPCs: [], items: [], structures: [], explored: false,
            lastVisited: 0, enemy: null, actions: [], regionId: 1, travelCost: 1, vegetationDensity: 100,
            moisture: 100, elevation: 100, lightLevel: 100, dangerLevel: 100, magicAffinity: 100, humanPresence: 100,
            explorability: 100, soilType: 'rocky', predatorPresence: 100, temperature: 100, windLevel: 100
        };
        expect(analyze_chunk_mood(maxChunk)).toEqual(expect.arrayContaining([
            "Danger", "Foreboding", "Threatening", "Vibrant", "Peaceful", "Lush", "Wet", "Wild", "Magic", "Mysterious", "Ethereal", "Civilized", "Historic", "Hot", "Harsh", "Smoldering"
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
        gameTime: 540,
    };
    const basePlayerState: PlayerStatus = {
        hp: 75, mana: 50, stamina: 80, bodyTemperature: 37, items: [], equipment: { weapon: null, armor: null, accessory: null },
        quests: [], questsCompleted: 0, skills: [], persona: 'explorer', attributes: {physicalAttack: 0, magicalAttack: 0, physicalDefense: 0, magicalDefense: 0, critChance: 0, attackSpeed: 0, cooldownReduction: 0}, unlockProgress: { kills: 0, damageSpells: 0, moves: 0 },
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
            dangerLevel: { min: 50 },
        };
        expect(check_conditions(conditions, baseChunk)).toBe(false);
    });

    it('should handle timeOfDay condition', () => {
        const dayConditions = { timeOfDay: 'day' as 'day' | 'night' };
        expect(check_conditions(dayConditions, {...baseChunk, gameTime: 540})).toBe(true);
        const nightConditions = { timeOfDay: 'night' as 'day' | 'night' };
        expect(check_conditions(nightConditions, {...baseChunk, gameTime: 1200})).toBe(true);
        expect(check_conditions(nightConditions, baseChunk)).toBe(false);
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

// Test fill_template
describe('fill_template', () => {
    const mockChunk: Chunk = {
        x: 0, y: 0, terrain: 'jungle', description: '', NPCs: [], items: [
            { name: { en: 'Healing Potion', vi: 'Bình Hồi Phục' }, description: {en: '', vi: ''}, quantity: 1, tier: 1, emoji: '🧪' }
        ], structures: [], explored: false,
        lastVisited: 0, enemy: { type: { en: 'Goblin', vi: 'Goblin' }, hp: 50, damage: 10, behavior: 'aggressive', size: 'medium', diet: [], satiation: 0, maxSatiation: 1, emoji: '👺' }, actions: [], regionId: 1, travelCost: 1, vegetationDensity: 80,
        moisture: 90, elevation: 30, lightLevel: 5, dangerLevel: 60, magicAffinity: 75, humanPresence: 0,
        explorability: 40, soilType: 'loamy', predatorPresence: 70, temperature: 85, windLevel: 0
    };
    const mockWorld: World = {};
    const mockPlayerPosition = { x: 0, y: 0 };
    const basePlayerState: PlayerStatus = {
        hp: 75, mana: 50, stamina: 80, bodyTemperature: 37, items: [], equipment: { weapon: null, armor: null, accessory: null },
        quests: [], questsCompleted: 0, skills: [], persona: 'explorer', attributes: {physicalAttack: 0, magicalAttack: 0, physicalDefense: 0, magicalDefense: 0, critChance: 0, attackSpeed: 0, cooldownReduction: 0}, unlockProgress: { kills: 0, damageSpells: 0, moves: 0 },
        language: 'vi', journal: {}, dailyActionLog: [], questHints: {}, trackedEnemy: undefined
    };

    it('should fill static placeholders correctly', () => {
        const template = "Đây là một khu rừng {{jungle_adjective_lush}} và {{jungle_adjective_mysterious}}.";
        const result = fill_template(template, mockChunk, mockWorld, mockPlayerPosition, mockT, 'vi', basePlayerState);
        expect(result).toMatch(/Đây là một khu rừng (rậm rạp|xanh tươi) và (bí ẩn|huyền bí)\./);
    });

    it('should replace dynamic chunk-based placeholders (0-100 scale)', () => {
        const template = "Ánh sáng: {light_level_detail}. Nhiệt độ: {temp_detail}. Độ ẩm: {moisture_detail}.";
        const result = fill_template(template, mockChunk, mockWorld, mockPlayerPosition, mockT, 'vi', basePlayerState);
        expect(result).toContain('Ánh sáng: một màn đêm u tối.');
        expect(result).toContain('Nhiệt độ: nóng như thiêu đốt.');
        expect(result).toContain('Độ ẩm: ẩm ướt.');
    });

    it('should replace playerState related placeholders', () => {
        const template = "Bạn cảm thấy {player_health_status} và {player_stamina_status}.";
        const mockPlayerStatus: PlayerStatus = { ...basePlayerState, hp: 25, stamina: 10 };
        const result = fill_template(template, mockChunk, mockWorld, mockPlayerPosition, mockT, 'vi', mockPlayerStatus);
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

    it('should handle sentences with existing punctuation', () => {
        const sentences = ['Đã xảy ra chuyện gì đó!', 'Có tiếng động lạ?'];
        expect(SmartJoinSentences(sentences, 'short')).toBe('Đã xảy ra chuyện gì đó và Có tiếng động lạ?');
    });

    it('should remove redundant spaces and punctuation', () => {
        const sentences = ['  Câu đầu.  ', '  câu hai..  ', '   câu ba   '];
        const result = SmartJoinSentences(sentences, 'medium');
        expect(result.trim()).not.toMatch(/\s{2,}/);
        expect(result).not.toMatch(/\.\./);
        expect(result).toMatch(/\.$/); 
    });
});

    