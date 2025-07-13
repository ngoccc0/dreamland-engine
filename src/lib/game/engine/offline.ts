

import type { Chunk, ChunkItem, Action, Language, ItemDefinition, World, PlayerItem, Skill, TranslationKey, MoodTag, NarrativeLength, NarrativeTemplate, ConditionType, BiomeAdjectiveCategory, PlayerStatus } from "../types";
import { getTemplates } from "../templates";
import { translations } from "../../i18n";
import { clamp, getTranslatedText } from "../../utils";
import type { SuccessLevel } from "../dice";
import { getEffectiveChunk, ensureChunkExists } from "./generation";

const getRandomInRange = (range: { min: number, max: number }) => Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

export { getEffectiveChunk, ensureChunkExists };

/**
 * Phân tích các thuộc tính của chunk để xác định các MoodTag chủ đạo.
 * Hàm này đọc các giá trị số và gán các nhãn tâm trạng dựa trên ngưỡng đã định.
 * @param chunk Dữ liệu chunk hiện tại.
 * @returns Mảng các MoodTag mô tả tâm trạng của chunk.
 */
const analyze_chunk_mood = (chunk: Chunk): MoodTag[] => {
    const moods: MoodTag[] = [];

    // 1. Mức độ Nguy hiểm (dangerLevel)
    if (chunk.dangerLevel >= 7) { // Rất nguy hiểm
        moods.push("Danger", "Foreboding");
    } else if (chunk.dangerLevel >= 4) { // Có thể nguy hiểm
        moods.push("Danger");
    }

    // 2. Mức độ Ánh sáng (lightLevel)
    if (chunk.lightLevel <= 0) { // Tối hoàn toàn
        moods.push("Dark", "Gloomy", "Mysterious");
    } else if (chunk.lightLevel < 5) { // Mờ ảo, thiếu sáng
        moods.push("Mysterious", "Gloomy");
    } else if (chunk.lightLevel >= 8) { // Rất sáng
        moods.push("Vibrant", "Peaceful"); // Nếu ánh sáng tốt có thể liên quan đến sự sống động
    }

    // 3. Độ ẩm (moisture)
    if (chunk.moisture >= 8) { // Rất ẩm ướt, đầm lầy, rừng rậm
        moods.push("Lush", "Wet", "Vibrant");
    } else if (chunk.moisture <= 2) { // Khô hạn
        moods.push("Arid", "Desolate");
    }

    // 4. Sự hiện diện của kẻ săn mồi (predatorPresence)
    if (chunk.predatorPresence >= 6) { // Nhiều kẻ săn mồi
        moods.push("Danger", "Wild");
    }

    // 5. Liên kết ma thuật (magicAffinity)
    if (chunk.magicAffinity >= 7) { // Năng lượng ma thuật mạnh
        moods.push("Magic", "Mysterious", "Ethereal"); // Thêm "Ethereal" nếu muốn
    } else if (chunk.magicAffinity >= 4) { // Có dấu hiệu ma thuật
        moods.push("Mysterious");
    }

    // 6. Sự hiện diện của con người (humanPresence)
    if (chunk.humanPresence >= 6) { // Có dấu hiệu con người đáng kể
        moods.push("Civilized", "Historic"); // Hoặc "Abandoned", "Ruined" tùy ngữ cảnh
    }

    // 7. Nhiệt độ (temperature)
    if (chunk.temperature && chunk.temperature >= 8) { // Rất nóng
        moods.push("Hot", "Harsh");
    } else if (chunk.temperature && chunk.temperature <= 2) { // Rất lạnh
        moods.push("Cold", "Harsh");
    }

    // 8. Địa hình (terrain) - Gán mood dựa trên loại địa hình cơ bản
    // Đây là cách bạn có thể ánh xạ terrain trực tiếp sang mood tag
    switch (chunk.terrain) {
        case "swamp":
            moods.push("Gloomy", "Wet", "Mysterious");
            break;
        case "desert":
            moods.push("Arid", "Desolate", "Harsh");
            break;
        case "mountain":
            moods.push("Harsh", "Rugged");
            break;
        case "forest":
            moods.push("Lush", "Peaceful");
            break;
        case "cave":
            moods.push("Dark", "Mysterious", "Foreboding");
            break;
        case "volcanic":
            moods.push("Danger", "Harsh");
            break;
        // Thêm các terrain khác nếu cần
    }


    // Loại bỏ các mood trùng lặp và trả về
    return Array.from(new Set(moods));
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

    const successChance = 0.8 * (newChunk.explorability / 10);

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

        const newItemsMap = new Map((newChunk.items || []).map((item: ChunkItem) => [item.name, { ...item }]));
        foundItems.forEach(foundItem => {
            const existing = newItemsMap.get(foundItem.name as string);
            if (existing) {
                existing.quantity += foundItem.quantity;
            } else {
                newItemsMap.set(foundItem.name as string, foundItem);
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
    language: Language
): string => {
    const chunk = baseChunk;
    const templates = getTemplates();
    const biomeTemplateData = templates[chunk.terrain];

    if (!biomeTemplateData?.descriptionTemplates) {
        return chunk.description || "You are in an unknown area.";
    }
    
    const templateSet = (biomeTemplateData as any).descriptionTemplates[narrativeLength] || (biomeTemplateData as any).descriptionTemplates.medium || (biomeTemplateData as any).descriptionTemplates.short;
    let baseTemplate = Array.isArray(templateSet) ? templateSet[Math.floor(Math.random() * templateSet.length)] : templateSet;

    // --- 1. PRE-BUILD CONTENT FOR PLACEHOLDERS ---

    // Build {sensory_details}
    const sensoryDetailsParts: string[] = [];
    if (chunk.explorability < 3) sensoryDetailsParts.push(t('offline_explorability_low'));
    if (chunk.dangerLevel > 8) sensoryDetailsParts.push(t('offline_danger_high'));
    if (chunk.magicAffinity > 7) sensoryDetailsParts.push(t('offline_magic_high'));
    if (chunk.temperature && chunk.temperature >= 9) sensoryDetailsParts.push(t('sensoryFeedback_hot'));
    if (chunk.temperature && chunk.temperature <= 2) sensoryDetailsParts.push(t('sensoryFeedback_cold'));
    if (chunk.moisture && chunk.moisture >= 8) sensoryDetailsParts.push(t('offline_moisture_high'));
    if (chunk.lightLevel && chunk.lightLevel <= -5) sensoryDetailsParts.push(t('sensoryFeedback_dark'));
    if (chunk.humanPresence > 5) sensoryDetailsParts.push(t('offline_human_presence'));
    if (chunk.predatorPresence > 7) sensoryDetailsParts.push(t('offline_predator_presence'));
    const sensoryDetailsText = sensoryDetailsParts.join(' ');

    // Build {entity_report}
    const entityReportParts: string[] = [];
    if (chunk.items.length > 0) {
        const itemsHere = chunk.items.map(i => `${i.quantity} ${getTranslatedText(i.name, language, t)}`).join(', ');
        entityReportParts.push(t('offlineNarrativeItems', { items: itemsHere }));
    }
    if (chunk.enemy) {
        entityReportParts.push(t('offlineNarrativeEnemy', { enemy: getTranslatedText(chunk.enemy.type, language, t) }));
    }
    if (chunk.NPCs.length > 0) {
        entityReportParts.push(t('offlineNarrativeNPC', { npc: getTranslatedText(chunk.NPCs[0].name, language, t) }));
    }
    if (chunk.structures.length > 0) {
        entityReportParts.push(t('offlineNarrativeStructure', { structure: getTranslatedText(chunk.structures[0].name, language, t) }));
    }
    const entityReportText = entityReportParts.join(' ');
    
    // Build {surrounding_peek}
    const surroundingPeekParts: string[] = [];
    if (narrativeLength !== 'short') {
        const directions = [{ x: 0, y: 1, dir: 'North' }, { x: 0, y: -1, dir: 'South' }, { x: 1, y: 0, dir: 'East' }, { x: -1, y: 0, dir: 'West' }];
        for (const dir of directions) {
            const key = `${playerPosition.x + dir.x},${playerPosition.y + dir.y}`;
            const adjacentChunk = world[key];
            if (adjacentChunk && adjacentChunk.explored && ((chunk.lastVisited - adjacentChunk.lastVisited) < 50)) {
                if (adjacentChunk.enemy) {
                    surroundingPeekParts.push(t('surrounding_peek_enemy', { direction: t(`direction${dir.dir}` as TranslationKey), enemy: getTranslatedText(adjacentChunk.enemy.type, language, t) }));
                } else if (adjacentChunk.structures.length > 0) {
                    surroundingPeekParts.push(t('surrounding_peek_structure', { direction: t(`direction${dir.dir}` as TranslationKey), structure: getTranslatedText(adjacentChunk.structures[0].name, language, t) }));
                }
            }
        }
    }
    const surroundingPeekText = surroundingPeekParts.length > 0 ? t('offlineNarrativeSurroundings') + ' ' + surroundingPeekParts.join(' ') : '';
    
    // --- 2. PERFORM REPLACEMENTS ---
    
    baseTemplate = baseTemplate
        .replace(/\[adjective\]/g, () => biomeTemplateData.adjectives[Math.floor(Math.random() * biomeTemplateData.adjectives.length)])
        .replace(/\[feature\]/g, () => biomeTemplateData.features[Math.floor(Math.random() * biomeTemplateData.features.length)])
        .replace(/\[smell\]/g, () => biomeTemplateData.smells[Math.floor(Math.random() * biomeTemplateData.smells.length)])
        .replace(/\[sound\]/g, () => biomeTemplateData.sounds[Math.floor(Math.random() * biomeTemplateData.sounds.length)])
        .replace(/\[sky\]/g, () => biomeTemplateData.sky ? biomeTemplateData.sky[Math.floor(Math.random() * biomeTemplateData.sky.length)] : '');

    let finalNarrative = baseTemplate
        .replace('{sensory_details}', sensoryDetailsText)
        .replace('{entity_report}', entityReportText)
        .replace('{surrounding_peek}', surroundingPeekText);
        
    // --- 3. CLEAN UP ---
    // Remove any extra whitespace that might result from empty replacements
    finalNarrative = finalNarrative.replace(/\s{2,}/g, ' ').trim();
    // Remove dangling sentences or sentence fragments that might end with a period followed by nothing.
    finalNarrative = finalNarrative.replace(/\. \./g, '.');
    finalNarrative = finalNarrative.replace(/ \./g, '.');
    finalNarrative = finalNarrative.replace(/\s,/g, ',');


    return finalNarrative;
};


export const generateOfflineActionNarrative = (
    actionType: 'attack' | 'useSkill' | 'useItem',
    result: any,
    chunk: Chunk,
    t: (key: TranslationKey, replacements?: any) => string,
    language: Language
): string => {
    let narrativeParts: string[] = [];
    const sensoryFeedbackParts: string[] = [];

    if (chunk.temperature && chunk.temperature >= 9) sensoryFeedbackParts.push(t('sensoryFeedback_hot'));
    if (chunk.temperature && chunk.temperature <= 2) sensoryFeedbackParts.push(t('sensoryFeedback_cold'));
    if (chunk.lightLevel && chunk.lightLevel <= -5) sensoryFeedbackParts.push(t('sensoryFeedback_dark'));
    if (chunk.moisture && chunk.moisture >= 8) sensoryFeedbackParts.push(t('sensoryFeedback_rain'));
    
    const sensory_feedback = sensoryFeedbackParts.join(' ');
    
    let templateKey: TranslationKey = 'exploreAction'; // Fallback
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
    
    // Fallback if templateKey wasn't set correctly
    if (templateKey === 'exploreAction') return t('customActionFail');
    
    return t(templateKey, replacements);
};
