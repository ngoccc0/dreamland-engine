import type { Chunk, MoodTag, NarrativeLength, NarrativeTemplate, ConditionType, BiomeAdjectiveCategory, Language, PlayerStatus, World, ChunkItem, Action, ItemDefinition, Skill } from "../types";
import { getTranslatedText, SmartJoinSentences } from "../../utils"; 
import { getTemplates } from '../templates';
import { translations } from "../../i18n";
import type { TranslationKey } from "../../i18n";
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
    if (chunk.dangerLevel >= 70) { 
        moods.push("Danger", "Foreboding", "Threatening");
    } else if (chunk.dangerLevel >= 40) { 
        moods.push("Threatening");
    }

    // 2. Mức độ Ánh sáng (lightLevel) - Dải -100 đến 100
    if (chunk.lightLevel <= 0) { 
        moods.push("Dark", "Gloomy", "Mysterious");
    } else if (chunk.lightLevel < 50) { 
        moods.push("Mysterious", "Gloomy");
    } else if (chunk.lightLevel >= 80) { 
        moods.push("Vibrant", "Peaceful"); 
    }

    // 3. Độ ẩm (moisture) - Dải 0-100
    if (chunk.moisture >= 80) { 
        moods.push("Lush", "Wet", "Vibrant");
    } else if (chunk.moisture <= 20) { 
        moods.push("Arid", "Desolate");
    }

    // 4. Sự hiện diện của kẻ săn mồi (predatorPresence) - Dải 0-100
    if (chunk.predatorPresence >= 60) { 
        moods.push("Danger", "Wild");
    }

    // 5. Liên kết ma thuật (magicAffinity) - Dải 0-100
    if (chunk.magicAffinity >= 70) { 
        moods.push("Magic", "Mysterious", "Ethereal");
    } else if (chunk.magicAffinity >= 40) { 
        moods.push("Mysterious");
    }

    // 6. Sự hiện diện của con người (humanPresence) - Dải 0-100
    if (chunk.humanPresence >= 60) { 
        moods.push("Civilized", "Historic"); 
    } else if (chunk.humanPresence > 0) { 
        moods.push("Abandoned");
    }

    // 7. Nhiệt độ (temperature) - Dải 0-100
    if (chunk.temperature >= 80) { 
        moods.push("Hot", "Harsh");
    } else if (chunk.temperature <= 20) { 
        moods.push("Cold", "Harsh");
    } else if (chunk.temperature > 35 && chunk.temperature < 65) { 
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

    const chunkAny = chunk as any;

    for (const key in template_conditions) {
        const conditionValue = (template_conditions as any)[key];
        const chunkValue = chunkAny[key];

        if (key === 'soilType') {
            if (!conditionValue.includes(chunk.soilType)) return false;
        } else if (key === 'timeOfDay') {
            if (chunkAny.timeOfDay !== conditionValue) return false;
        } else if (key === 'playerHealth' || key === 'playerStamina') {
            if (!playerState) return false; // Cần playerState để kiểm tra
            const playerValue = key === 'playerHealth' ? playerState.hp : playerState.stamina;
            if (playerValue < (conditionValue.min ?? 0) || playerValue > (conditionValue.max ?? 100)) return false;
        } else if (key === 'requiredEntities') {
            const { enemyType, itemType } = conditionValue;
            let entityFound = false;

            if (enemyType) {
                if (chunk.enemy && getTranslatedText(chunk.enemy.type, Language.Vietnamese) === enemyType) {
                    entityFound = true;
                }
            }
            if (itemType && !entityFound) {
                if (chunk.items.some(item => getTranslatedText(item.name, Language.Vietnamese) === itemType)) {
                    entityFound = true;
                }
            }
            if (!entityFound && (enemyType || itemType)) return false;
        } else if (typeof chunkValue === 'number' && typeof conditionValue === 'object' && conditionValue !== null) {
            const range = conditionValue as { min?: number, max?: number };
            if (chunkValue < (range.min ?? -Infinity) || chunkValue > (range.max ?? Infinity)) return false;
        }
    }

    return true; // Tất cả điều kiện đều được đáp ứng
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
            (biomeTemplateData.adjectives as any)[key] ||
            (biomeTemplateData.features as any)[key] ||
            (biomeTemplateData.smells as any)[key] ||
            (biomeTemplateData.sounds as any)[key] ||
            (biomeTemplateData.sky ? (biomeTemplateData.sky as any)[key] : undefined);

        if (category && category.length > 0) {
            return category[Math.floor(Math.random() * category.length)];
        }
        console.warn(`Placeholder category not found: ${key}`); 
        return match; 
    });
    
    filled_template = filled_template.replace(/{light_level_detail}/g, (() => {
        if (chunk.lightLevel <= 10) return t('light_level_dark');
        if (chunk.lightLevel < 50) return t('light_level_dim');
        return t('light_level_normal');
    })());

    filled_template = filled_template.replace(/{temp_detail}/g, (() => {
        if (chunk.temperature <= 20) return t('temp_cold');
        if (chunk.temperature >= 80) return t('temp_hot');
        return t('temp_mild');
    })());

    filled_template = filled_template.replace(/{moisture_detail}/g, (() => {
        if (chunk.moisture >= 80) return t('moisture_humid');
        if (chunk.moisture <= 20) return t('moisture_dry');
        return t('moisture_normal');
    })());

    filled_template = filled_template.replace(/{jungle_feeling_dark_phrase}/g, t('jungle_feeling_dark_phrase'));

    if (chunk.enemy) {
        filled_template = filled_template.replace(/{enemy_name}/g, getTranslatedText(chunk.enemy.type, language, t));
    } else {
        filled_template = filled_template.replace(/{enemy_name}/g, t('no_enemy_found'));
    }

    if (chunk.items && chunk.items.length > 0) {
        const randomItem = chunk.items[Math.floor(Math.random() * chunk.items.length)];
        filled_template = filled_template.replace(/{item_found}/g, getTranslatedText(randomItem.name, language, t));
    } else {
        filled_template = filled_template.replace(/{item_found}/g, t('no_item_found')); 
    }

    if (playerState) {
        filled_template = filled_template.replace(/{player_health_status}/g, playerState.hp < 30 ? t('player_health_low') : t('player_health_normal'));
        filled_template = filled_template.replace(/{player_stamina_status}/g, playerState.stamina < 30 ? t('player_stamina_low') : t('player_stamina_normal'));
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

        const newItemsMap = new Map((newChunk.items || []).map((item: ChunkItem) => [getTranslatedText(item.name, 'en', t), { ...item }]));
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
            params: { itemName: getTranslatedText(item.name, language, t) as TranslationKey }
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
    t: (key: TranslationKey, replacements?: any) => string,
    language?: Language
): string => {
    const resolvedLanguage = language || 'en'; 
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
            const enemyName = getTranslatedText(enemyType, resolvedLanguage, t);

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
            const translatedItemName = getTranslatedText(itemName, resolvedLanguage, t);

            if (target === 'player') {
                if(wasUsed) return t('itemUsePlayerSuccessNarrative', { item: translatedItemName, effect: effectDescription, sensory_feedback });
                else return t('itemUsePlayerFailNarrative', { item: translatedItemName, sensory_feedback });
            } else {
                const translatedTarget = getTranslatedText(target, resolvedLanguage, t);
                if(itemConsumed) {
                    if(wasTamed) return t('itemTameSuccessNarrative', { item: translatedItemName, target: translatedTarget, sensory_feedback });
                    else return t('itemTameFailNarrative', { item: translatedItemName, target: translatedTarget, sensory_feedback });
                }
            }
            break;
        }

        case 'useSkill': {
            const { skill, successLevel, backfireDamage, healedAmount, finalDamage, siphonedAmount, enemy } = result as { skill: Skill, successLevel: SuccessLevel, backfireDamage?: number, healedAmount?: number, finalDamage?: number, siphonedAmount?: number, enemy: Chunk['enemy'] };
            const skillName = getTranslatedText(skill.name, resolvedLanguage, t);
            const enemyName = enemy ? getTranslatedText(enemy.type, resolvedLanguage, t) : '';

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
