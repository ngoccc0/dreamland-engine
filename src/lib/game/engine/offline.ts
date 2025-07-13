import type { Chunk, ChunkItem, World, PlayerStatus, Action, ItemDefinition, Skill, MoodTag, NarrativeLength, NarrativeTemplate, ConditionType, BiomeAdjectiveCategory, Language } from "../types";
import { getTemplates } from "../templates";
import { translations } from "../../i18n";
import type { TranslationKey } from "../../i18n";
import { clamp, getTranslatedText, SmartJoinSentences } from "../../utils";
import type { SuccessLevel } from "../dice";

/**
 * Phân tích các thuộc tính của chunk để xác định các MoodTag chủ đạo.
 * Hàm này đọc các giá trị số và gán các nhãn tâm trạng dựa trên ngưỡng đã định (dải 0-100).
 * @param chunk Dữ liệu chunk hiện tại.
 * @returns Mảng các MoodTag mô tả tâm trạng của chunk.
 */
const analyze_chunk_mood = (chunk: Chunk): MoodTag[] => {
    const moods: MoodTag[] = [];

    // 1. Mức độ Nguy hiểm (dangerLevel) - Dải 0-100
    if (chunk.dangerLevel >= 70) { // Rất nguy hiểm
        moods.push("Danger", "Foreboding", "Threatening");
    } else if (chunk.dangerLevel >= 40) { // Có thể nguy hiểm
        moods.push("Threatening");
    }

    // 2. Mức độ Ánh sáng (lightLevel) - Dải 0-100 (0: pitch black, 100: bright sun)
    if (chunk.lightLevel <= 10) { // Tối hoàn toàn (ví dụ, trong hang động hoặc đêm tối)
        moods.push("Dark", "Gloomy", "Mysterious");
    } else if (chunk.lightLevel < 50) { // Mờ ảo, thiếu sáng (ví dụ, hoàng hôn, rừng rậm)
        moods.push("Mysterious", "Gloomy");
    } else if (chunk.lightLevel >= 80) { // Rất sáng (ban ngày, khu vực trống trải)
        moods.push("Vibrant", "Peaceful");
    }

    // 3. Độ ẩm (moisture) - Dải 0-100
    if (chunk.moisture >= 80) { // Rất ẩm ướt, đầm lầy, rừng rậm
        moods.push("Lush", "Wet", "Vibrant");
    } else if (chunk.moisture <= 20) { // Khô hạn (sa mạc, khu vực nứt nẻ)
        moods.push("Arid", "Desolate");
    }

    // 4. Sự hiện diện của kẻ săn mồi (predatorPresence) - Dải 0-100
    if (chunk.predatorPresence >= 60) { // Nhiều kẻ săn mồi
        moods.push("Danger", "Wild");
    }

    // 5. Liên kết ma thuật (magicAffinity) - Dải 0-100
    if (chunk.magicAffinity >= 70) { // Năng lượng ma thuật mạnh
        moods.push("Magic", "Mysterious", "Ethereal");
    } else if (chunk.magicAffinity >= 40) { // Có dấu hiệu ma thuật
        moods.push("Mysterious");
    }

    // 6. Sự hiện diện của con người (humanPresence) - Dải 0-100
    if (chunk.humanPresence >= 60) { // Có dấu hiệu con người đáng kể (làng mạc, tàn tích)
        moods.push("Civilized", "Historic");
    } else if (chunk.humanPresence > 0) { // Có chút dấu hiệu nhưng không đáng kể
        moods.push("Abandoned");
    }

    // 7. Nhiệt độ (temperature) - Dải 0-100 (0: đóng băng, 100: cực nóng, 50: dễ chịu)
    if (chunk.temperature && chunk.temperature >= 80) { // Rất nóng
        moods.push("Hot", "Harsh");
    } else if (chunk.temperature && chunk.temperature <= 20) { // Rất lạnh
        moods.push("Cold", "Harsh");
    } else if (chunk.temperature && chunk.temperature > 35 && chunk.temperature < 65) { // Nhiệt độ dễ chịu
        moods.push("Peaceful");
    }

    // 8. Địa hình (terrain) - Gán mood dựa trên loại địa hình cơ bản
    switch (chunk.terrain) {
        case "swamp":
            moods.push("Gloomy", "Wet", "Mysterious");
            break;
        case "desert":
            moods.push("Arid", "Desolate", "Harsh");
            break;
        case "mountain":
            moods.push("Harsh", "Rugged", "Elevated");
            break;
        case "forest":
            moods.push("Lush", "Peaceful");
            break;
        case "cave":
            moods.push("Dark", "Mysterious", "Foreboding", "Confined");
            break;
        case "jungle":
            moods.push("Lush", "Vibrant", "Mysterious", "Wild");
            break;
        case "volcanic":
            moods.push("Danger", "Harsh", "Smoldering");
            break;
        case "ocean":
        case "underwater":
            moods.push("Serene", "Mysterious", "Vast");
            break;
        case "city":
        case "space_station":
            moods.push("Civilized", "Structured");
            break;
        case "tundra":
            moods.push("Cold", "Desolate", "Barren");
            break;
    }

    return Array.from(new Set(moods));
};

const get_sentence_limits = (narrativeLength: NarrativeLength): { min_s: number; max_s: number; } => {
    switch (narrativeLength) {
        case "short":
            return { min_s: 1, max_s: 2 };
        case "medium":
            return { min_s: 2, max_s: 4 };
        case "long":
        case "detailed":
            return { min_s: 4, max_s: 7 };
        default:
            return { min_s: 1, max_s: 2 };
    }
};

/**
 * Kiểm tra xem chunk và playerState có đáp ứng tất cả các điều kiện của template hay không.
 * @param template_conditions Các điều kiện được định nghĩa trong template.
 * @param chunk Dữ liệu chunk hiện tại.
 * @param playerState Trạng thái hiện tại của người chơi (tùy chọn).
 * @returns true nếu tất cả điều kiện được đáp ứng, ngược lại false.
 */
const check_conditions = (template_conditions: ConditionType | undefined, chunk: Chunk, playerState?: PlayerStatus): boolean => {
    if (!template_conditions) return true; // Không có điều kiện nào, luôn đúng

    if (template_conditions.vegetationDensity) {
        if (chunk.vegetationDensity < (template_conditions.vegetationDensity.min ?? 0) ||
            chunk.vegetationDensity > (template_conditions.vegetationDensity.max ?? 100)) return false;
    }
    if (template_conditions.moisture) {
        if (chunk.moisture < (template_conditions.moisture.min ?? 0) ||
            chunk.moisture > (template_conditions.moisture.max ?? 100)) return false;
    }
    if (template_conditions.elevation) {
        if (chunk.elevation < (template_conditions.elevation.min ?? -100) ||
            chunk.elevation > (template_conditions.elevation.max ?? 100)) return false;
    }
    if (template_conditions.dangerLevel) {
        if (chunk.dangerLevel < (template_conditions.dangerLevel.min ?? 0) ||
            chunk.dangerLevel > (template_conditions.dangerLevel.max ?? 100)) return false;
    }
    if (template_conditions.magicAffinity) {
        if (chunk.magicAffinity < (template_conditions.magicAffinity.min ?? 0) ||
            chunk.magicAffinity > (template_conditions.magicAffinity.max ?? 100)) return false;
    }
    if (template_conditions.humanPresence) {
        if (chunk.humanPresence < (template_conditions.humanPresence.min ?? 0) ||
            chunk.humanPresence > (template_conditions.humanPresence.max ?? 100)) return false;
    }
    if (template_conditions.predatorPresence) {
        if (chunk.predatorPresence < (template_conditions.predatorPresence.min ?? 0) ||
            chunk.predatorPresence > (template_conditions.predatorPresence.max ?? 100)) return false;
    }
    if (template_conditions.lightLevel) {
        if (chunk.lightLevel < (template_conditions.lightLevel.min ?? -100) ||
            chunk.lightLevel > (template_conditions.lightLevel.max ?? 100)) return false;
    }
    if (chunk.temperature && template_conditions.temperature) {
        if (chunk.temperature < (template_conditions.temperature.min ?? 0) ||
            chunk.temperature > (template_conditions.temperature.max ?? 100)) return false;
    }
    if (template_conditions.visibility && (chunk as any).visibility) {
        if ((chunk as any).visibility < (template_conditions.visibility.min ?? 0) ||
            (chunk as any).visibility > (template_conditions.visibility.max ?? 100)) return false;
    }
    if (template_conditions.humidity && (chunk as any).humidity) {
        if ((chunk as any).humidity < (template_conditions.humidity.min ?? 0) ||
            (chunk as any).humidity > (template_conditions.humidity.max ?? 100)) return false;
    }

    if (template_conditions.soilType && template_conditions.soilType.length > 0) {
        if (!template_conditions.soilType.includes(chunk.soilType)) return false;
    }
    
    // This logic assumes time of day is calculated and attached to the chunk object dynamically.
    // if (template_conditions.timeOfDay && (chunk as any).timeOfDay !== template_conditions.timeOfDay) {
    //     return false;
    // }

    if (playerState) {
        if (template_conditions.playerHealth) {
            if (playerState.hp < (template_conditions.playerHealth.min ?? 0) ||
                playerState.hp > (template_conditions.playerHealth.max ?? 100)) return false;
        }
        if (template_conditions.playerStamina) {
            if (playerState.stamina < (template_conditions.playerStamina.min ?? 0) ||
                playerState.stamina > (template_conditions.playerStamina.max ?? 100)) return false;
        }
    }

    if (template_conditions.requiredEntities) {
        const { enemyType, itemType } = template_conditions.requiredEntities;
        let entityFound = false;

        if (enemyType) {
            if (chunk.enemy && getTranslatedText(chunk.enemy.type, 'en') === enemyType) {
                entityFound = true;
            }
        }
        if (itemType && !entityFound) {
            if (chunk.items.some(item => getTranslatedText(item.name, 'en') === itemType)) {
                entityFound = true;
            }
        }
        if (!entityFound && (enemyType || itemType)) return false;
    }

    return true;
};

const has_mood_overlap = (template_moods: MoodTag[], current_moods: MoodTag[]): boolean => {
    if (!template_moods || template_moods.length === 0) return true;
    if (!current_moods || current_moods.length === 0) return false;

    return template_moods.some(mood => current_moods.includes(mood));
};

const select_template_by_weight = (templates: NarrativeTemplate[]): NarrativeTemplate => {
    if (templates.length === 0) throw new Error("No templates provided for weighted selection.");

    const totalWeight = templates.reduce((sum, tmpl) => sum + tmpl.weight, 0);
    let randomNum = Math.random() * totalWeight;

    for (const tmpl of templates) {
        randomNum -= tmpl.weight;
        if (randomNum <= 0) {
            return tmpl;
        }
    }
    
    return templates[0];
};

const fill_template = (
    template_string: string,
    chunk: Chunk,
    world: World,
    playerPosition: { x: number; y: number; },
    t: (key: TranslationKey, replacements?: any) => string,
    language: Language,
    biomeTemplateData: BiomeTemplateData,
    playerState?: PlayerStatus
): string => {
    let filled_template = template_string;

    filled_template = filled_template.replace(/{{(.*?)}}/g, (match, p1) => {
        const key = p1.trim();
        const category =
            biomeTemplateData.adjectives[key] ||
            biomeTemplateData.features[key] ||
            biomeTemplateData.smells[key] ||
            biomeTemplateData.sounds[key] ||
            (biomeTemplateData.sky ? biomeTemplateData.sky[key] : undefined);

        if (category && category.length > 0) {
            return category[Math.floor(Math.random() * category.length)];
        }
        console.warn(`Placeholder category not found: ${key}`);
        return match;
    });

    if (filled_template.includes('{light_level_detail}')) {
        filled_template = filled_template.replace('{light_level_detail}', (() => {
            if (chunk.lightLevel <= 10) return t('light_level_dark');
            if (chunk.lightLevel < 50) return t('light_level_dim');
            return t('light_level_normal');
        })());
    }

    if (filled_template.includes('{temp_detail}')) {
        filled_template = filled_template.replace('{temp_detail}', (() => {
            if (chunk.temperature && chunk.temperature <= 20) return t('temp_cold');
            if (chunk.temperature && chunk.temperature >= 80) return t('temp_hot');
            return t('temp_mild');
        })());
    }

    if (filled_template.includes('{moisture_detail}')) {
        filled_template = filled_template.replace('{moisture_detail}', (() => {
            if (chunk.moisture >= 80) return t('moisture_humid');
            if (chunk.moisture <= 20) return t('moisture_dry');
            return t('moisture_normal');
        })());
    }

    if (filled_template.includes('{jungle_feeling_dark_phrase}')) {
        filled_template = filled_template.replace('{jungle_feeling_dark_phrase}', t('jungle_feeling_dark_phrase'));
    }

    if (chunk.enemy) {
        filled_template = filled_template.replace('{enemy_name}', getTranslatedText(chunk.enemy.type, language, t));
    } else {
        filled_template = filled_template.replace(/{enemy_name}/g, t('no_enemy_found'));
    }

    if (chunk.items && chunk.items.length > 0) {
        const randomItem = chunk.items[Math.floor(Math.random() * chunk.items.length)];
        filled_template = filled_template.replace('{item_found}', getTranslatedText(randomItem.name, language, t));
    } else {
        filled_template = filled_template.replace(/{item_found}/g, t('no_item_found'));
    }

    return filled_template;
};


export const handleSearchAction = (
    currentChunk: Chunk,
    actionId: number,
    language: Language,
    t: (key: TranslationKey, replacements?: any) => string,
    customItemDefinitions: Record<string, ItemDefinition>,
    getRandomInRange: (range: { min: number, max: number }) => number
): { narrative: string, newChunk: Chunk, toastInfo?: { title: TranslationKey, description: TranslationKey, params: any } } => {
    
    const templates = getTemplates();
    const biomeTemplate = templates[currentChunk.terrain];

    const newChunk: Chunk = JSON.parse(JSON.stringify(currentChunk));
    
    newChunk.actions = newChunk.actions.filter(a => a.id !== actionId);
    
    if (!biomeTemplate || !biomeTemplate.items || biomeTemplate.items.length === 0) {
        return { narrative: t('exploreFoundNothing'), newChunk };
    }

    const successChance = 0.8 * (newChunk.explorability / 100);

    if (Math.random() > successChance) {
        return { narrative: t('exploreFoundNothing'), newChunk };
    }
    
    const potentialItems = biomeTemplate.items;
    const itemsToFindCount = getRandomInRange({ min: 1, max: 3 });
    const foundItems: ChunkItem[] = [];

    const shuffledPotentialItems = [...potentialItems].sort(() => 0.5 - Math.random());

    for (const itemTemplate of shuffledPotentialItems) {
        if (foundItems.length >= itemsToFindCount) break;

        if (newChunk.items.some((i: ChunkItem) => i.name === itemTemplate.name)) continue;

        if (Math.random() < (itemTemplate.conditions.chance || 0.25)) { 
            const itemDef = customItemDefinitions[itemTemplate.name];
            if (itemDef) {
                const quantity = getRandomInRange(itemDef.baseQuantity);
                if (quantity > 0) {
                    foundItems.push({
                        name: itemTemplate.name,
                        description: getTranslatedText(itemDef.description, language, t),
                        tier: itemDef.tier,
                        quantity,
                        emoji: itemDef.emoji,
                    });
                }
            }
        }
    }
    
    if (foundItems.length > 0) {
        const foundItemsText = foundItems.map(item => `${item.quantity} ${getTranslatedText(item.name, language, t)}`).join(', ');
        
        const toastInfo = {
            title: 'exploreSuccessTitle' as TranslationKey,
            description: 'exploreFoundItems' as TranslationKey,
            params: { items: foundItemsText }
        };

        const narrative = t('exploreFoundItemsNarrative', { items: foundItemsText });

        const newItemsMap = new Map((newChunk.items || []).map((item: ChunkItem) => [item.name as string, { ...item }]));
        foundItems.forEach(foundItem => {
            const foundItemName = getTranslatedText(foundItem.name, 'en', t);
            const existing = newItemsMap.get(foundItemName);
            if (existing) {
                existing.quantity += foundItem.quantity;
            } else {
                newItemsMap.set(foundItemName, foundItem);
            }
        });
        newChunk.items = Array.from(newItemsMap.values());
        
        const otherActions = newChunk.actions.filter((a: Action) => a.textKey !== 'pickUpAction_item');
        let actionIdCounter = newChunk.actions.reduce((maxId: number, a: Action) => Math.max(a.id, maxId), 0) + 1;

        const pickUpActions = newChunk.items.map((item: ChunkItem) => ({
            id: actionIdCounter++,
            textKey: 'pickUpAction_item' as TranslationKey,
            params: { itemName: item.name as TranslationKey }
        }));
        newChunk.actions = [...otherActions, ...pickUpActions];

        return { narrative, newChunk, toastInfo };
    } else {
        const narrative = t('exploreFoundNothing');
        return { narrative, newChunk };
    }
};

export const generateOfflineNarrative = (
    baseChunk: Chunk,
    narrativeLength: "short" | "medium" | "long",
    world: { [key: string]: Chunk },
    playerPosition: { x: number; y: number; },
    t: (key: TranslationKey, replacements?: any) => string,
    language?: Language
): string => {
    const chunk = baseChunk;
    const resolvedLanguage = language || 'en';
    const templates = getTemplates();
    const biomeTemplateData = templates[chunk.terrain];

    if (!biomeTemplateData?.descriptionTemplates) {
        return getTranslatedText(chunk.description, resolvedLanguage, t) || "You are in an unknown area.";
    }
    
    const moods = analyze_chunk_mood(chunk);

    const validTemplates = biomeTemplateData.descriptionTemplates.filter(template => {
        const lengthMatch = template.length === narrativeLength || (narrativeLength === 'detailed' && template.length === 'long');
        const moodMatch = has_mood_overlap(template.mood, moods);
        const conditionsMatch = check_conditions(template.conditions, chunk);
        return lengthMatch && moodMatch && conditionsMatch;
    });

    if (validTemplates.length === 0) {
        return getTranslatedText(chunk.description, resolvedLanguage, t);
    }
    
    const selectedTemplate = select_template_by_weight(validTemplates);
    
    const narrative = fill_template(selectedTemplate.template, chunk, world, playerPosition, t, resolvedLanguage, biomeTemplateData);
    
    return narrative;
};

export const generateOfflineActionNarrative = (
    actionType: 'attack' | 'useSkill' | 'useItem',
    result: any,
    chunk: Chunk,
    t: (key: TranslationKey, replacements?: any) => string
): string => {
    const language = 'en'; // Fallback
    let narrativeParts: string[] = [];
    const sensoryFeedbackParts: string[] = [];

    if (chunk.temperature && chunk.temperature >= 90) sensoryFeedbackParts.push(t('sensoryFeedback_hot'));
    if (chunk.temperature && chunk.temperature <= 20) sensoryFeedbackParts.push(t('sensoryFeedback_cold'));
    if (chunk.lightLevel && chunk.lightLevel <= 0) sensoryFeedbackParts.push(t('sensoryFeedback_dark'));
    if (chunk.moisture && chunk.moisture >= 80) sensoryFeedbackParts.push(t('sensoryFeedback_rain'));
    
    const sensory_feedback = sensoryFeedbackParts.join(' ');
    
    let templateKey: TranslationKey = 'exploreAction';
    const replacements: any = { sensory_feedback };
    
    switch (actionType) {
        case 'attack':
            const { successLevel, playerDamage, enemyDamage, enemyDefeated, fled, enemyType } = result;
            const enemyName = getTranslatedText(enemyType, language, t);

            if (successLevel === 'CriticalSuccess') {
                templateKey = 'actionNarrative_attack_critSuccess';
                replacements.attack_description = t('attackNarrative_critSuccess', { enemyType: enemyName });
            } else if (successLevel === 'Success' || successLevel === 'GreatSuccess') {
                templateKey = 'actionNarrative_attack_success';
                replacements.attack_description = t('attackNarrative_success', { enemyType: enemyName });
            } else if (successLevel === 'Failure') {
                templateKey = 'actionNarrative_attack_fail';
                replacements.attack_description = t('attackNarrative_fail', { enemyType: enemyName });
            } else if (successLevel === 'CriticalFailure') {
                templateKey = 'actionNarrative_attack_critFail';
                replacements.attack_description = t('attackNarrative_critFail', { enemyType: enemyName });
            }

            replacements.damage_report = t('attackDamageDealt', { damage: playerDamage });
            
            if (enemyDefeated) replacements.enemy_reaction = t('enemyDefeatedNarrative', { enemyType: enemyName });
            else if (fled) replacements.enemy_reaction = t('enemyFledNarrative', { enemyType: enemyName });
            else if (enemyDamage > 0) replacements.enemy_reaction = t('enemyRetaliationNarrative', { enemyType: enemyName, damage: enemyDamage });
            else replacements.enemy_reaction = t('enemyPreparesNarrative', { enemyType: enemyName });
            
            break;
        
        case 'useItem': {
            const { itemName, target, wasUsed, effectDescription, wasTamed, itemConsumed } = result;
            const translatedItemName = getTranslatedText(itemName, language, t);

            if (target === 'player') {
                if(wasUsed) return t('itemUsePlayerSuccessNarrative', { item: translatedItemName, effect: effectDescription, sensory_feedback });
                else return t('itemUsePlayerFailNarrative', { item: translatedItemName, sensory_feedback });
            } else {
                const translatedTarget = getTranslatedText(target, language, t);
                if(itemConsumed) {
                    if(wasTamed) return t('itemTameSuccessNarrative', { item: translatedItemName, target: translatedTarget, sensory_feedback });
                    else return t('itemTameFailNarrative', { item: translatedItemName, target: translatedTarget, sensory_feedback });
                }
            }
            break;
        }

        case 'useSkill': {
            const { skill, successLevel, backfireDamage, healedAmount, finalDamage, siphonedAmount, enemy } = result as { skill: Skill, successLevel: SuccessLevel, backfireDamage?: number, healedAmount?: number, finalDamage?: number, siphonedAmount?: number, enemy: Chunk['enemy'] };
            const skillName = getTranslatedText(skill.name, language, t);
            const enemyName = enemy ? getTranslatedText(enemy.type, language, t) : '';

            if (successLevel === 'CriticalFailure') {
                return t('skillCritFailNarrative', { skillName, damage: backfireDamage, sensory_feedback });
            } else if (successLevel === 'Failure') {
                return t('skillFailNarrative', { skillName, sensory_feedback });
            } else {
                if (skill.effect.type === 'HEAL') {
                    return t('skillHealSuccessNarrative', { skillName, amount: healedAmount, sensory_feedback });
                } else if (skill.effect.type === 'DAMAGE' && enemy) {
                    let text = t('skillDamageSuccessNarrative', { skillName, enemy: enemyName, damage: finalDamage, sensory_feedback });
                    if (siphonedAmount) text += ' ' + t('skillSiphonNarrative', { amount: siphonedAmount });
                    if (!result.enemy) text += ' ' + t('enemyDefeatedNarrative', { enemyType: enemyName });
                    return text;
                }
            }
            break;
        }
    }
    
    if (templateKey === 'exploreAction') return t('customActionFail');
    
    return t(templateKey, replacements);
};
