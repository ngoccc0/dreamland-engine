

import type { Chunk, MoodTag, NarrativeLength, NarrativeTemplate, ConditionType, Language, PlayerStatus, World } from "../types";
import { getTranslatedText, SmartJoinSentences, resolveItemId } from "../../utils"; 
import { getTemplates } from '../templates';
import type { TranslationKey } from "../../i18n";
import { logger } from "@/lib/logger";
import type { ItemDefinition } from "../types";
// clamp imported elsewhere when needed; not required here
import { biomeNarrativeTemplates } from "../data/narrative-templates";

/**
 * Phân tích các thuộc tính của chunk để xác định các MoodTag chủ đạo.
 * Hàm này đọc các giá trị số và gán các nhãn tâm trạng dựa trên ngưỡng đã định (dải 0-100).
 * @param chunk Dữ liệu chunk hiện tại.
 * @returns Mảng các MoodTag mô tả tâm trạng của chunk.
 */
export const analyze_chunk_mood = (chunk: Chunk): MoodTag[] => {
    const moods: MoodTag[] = [];

    // 1. Mức độ Nguy hiểm (dangerLevel) - Dải 0-100
    if (chunk.dangerLevel >= 70) { // Rất nguy hiểm
        moods.push("Danger", "Foreboding", "Threatening");
    } else if (chunk.dangerLevel >= 40) { // Có thể nguy hiểm
        moods.push("Threatening");
    }

    // 2. Mức độ Ánh sáng (lightLevel) - Dải -100 đến 100
    if (chunk.lightLevel <= 10) { // Tối hoàn toàn (ví dụ, trong hang động hoặc đêm tối)
        moods.push("Dark", "Gloomy", "Mysterious");
    } else if (chunk.lightLevel < 50) { // Mờ ảo, thiếu sáng (ví dụ, hoàng hôn, rừng rậm)
        moods.push("Mysterious", "Gloomy");
    } else if (chunk.lightLevel >= 80) { // Rất sáng (ban ngày, khu vực trống trải)
        moods.push("Vibrant", "Peaceful");
    }

    // 3. Độ ẩm (moisture) - Dải 0-100
    if (chunk.moisture >= 80) { // Rất ẩm ướt (đầm lầy, rừng mưa nhiệt đới)
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
        moods.push("Civilized", "Historic"); // Có thể thêm "Ruined" nếu thấp hơn
    } else if (chunk.humanPresence > 0) { // Có chút dấu hiệu nhưng không đáng kể
        moods.push("Abandoned");
    }

    // 7. Nhiệt độ (temperature) - Dải 0-100 (0: đóng băng, 100: cực nóng, 50: dễ chịu)
    // Use numeric existence checks (Number.isFinite) so that 0 is treated as a valid value.
    const temp: number = (chunk.temperature ?? NaN) as number;
    if (Number.isFinite(temp) && temp >= 80) { // Rất nóng
        moods.push("Hot", "Harsh");
    } else if (Number.isFinite(temp) && temp <= 20) { // Rất lạnh
        moods.push("Cold", "Harsh");
    } else if (Number.isFinite(temp) && temp > 35 && temp < 65) { // Nhiệt độ dễ chịu
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
            moods.push("Harsh", "Rugged", "Elevated"); // Thêm Elevated
            break;
        case "forest":
            moods.push("Lush", "Peaceful");
            break;
        case "cave":
            moods.push("Dark", "Mysterious", "Foreboding", "Confined"); // Thêm Confined
            break;
        case "jungle": // Bạn có biome Jungle trong template, nên thêm vào đây
            moods.push("Lush", "Vibrant", "Mysterious", "Wild");
            break;
        case "volcanic":
            moods.push("Danger", "Harsh", "Smoldering"); // Thêm Smoldering
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
        // ... (thêm các terrain khác nếu cần)
    }

    return Array.from(new Set(moods));
};

export const get_sentence_limits = (narrativeLength: NarrativeLength): { min_s: number; max_s: number; } => {
    switch (narrativeLength) {
        case "short":
            return { min_s: 1, max_s: 2 };
        case "medium":
            return { min_s: 2, max_s: 4 };
        case "long":
        case "detailed":
            return { min_s: 4, max_s: 7 };
        default:
            return { min_s: 1, max_s: 2 }; // Fallback an toàn
    }
};

export const check_conditions = (template_conditions: ConditionType | undefined, chunk: Chunk, playerState?: PlayerStatus): boolean => {
    if (!template_conditions) return true; // Không có điều kiện nào, luôn đúng

    // This is a comprehensive check that iterates over all possible condition keys.
    for (const key in template_conditions) {
        if (!Object.prototype.hasOwnProperty.call(template_conditions, key)) continue;

        const conditionValue = (template_conditions as any)[key];
        const chunkValue = (chunk as any)[key];

        // Handle special string-based conditions
        if (key === 'timeOfDay') {
            const gameTime = (chunk as any).gameTime;
            if (gameTime === undefined) continue;
            const isDay = gameTime >= 360 && gameTime < 1080;
            if (conditionValue === 'day' && !isDay) return false;
            if (conditionValue === 'night' && isDay) return false;
            continue;
        }

        if (key === 'soilType') {
            if (Array.isArray(conditionValue) && !conditionValue.includes(chunk.soilType)) return false;
            continue;
        }

        // Handle player-based conditions
        if (key === 'playerHealth' && playerState) {
            if (playerState.hp < (conditionValue.min ?? 0) || playerState.hp > (conditionValue.max ?? 100)) return false;
            continue;
        }

        if (key === 'playerStamina' && playerState) {
            if (playerState.stamina < (conditionValue.min ?? 0) || playerState.stamina > (conditionValue.max ?? 100)) return false;
            continue;
        }
        
        // Handle entity presence checks
        if (key === 'requiredEntities') {
            const { enemyType, itemType } = conditionValue;
            let entityFound = false;
            if (enemyType && chunk.enemy && chunk.enemy.type && getTranslatedText(chunk.enemy.type, 'vi') === enemyType) {
                entityFound = true;
            }
            if (itemType && !entityFound) {
                if (chunk.items.some(item => getTranslatedText(item.name, 'vi') === itemType)) {
                    entityFound = true;
                }
            }
            if (!entityFound && (enemyType || itemType)) return false;
            continue;
        }

        // Handle generic numerical range conditions
        if (typeof chunkValue === 'number' && typeof conditionValue === 'object' && conditionValue !== null) {
            if (chunkValue < (conditionValue.min ?? -Infinity) || chunkValue > (conditionValue.max ?? Infinity)) return false;
        }
    }

    return true; // Tất cả điều kiện đều được đáp ứng
};

export const has_mood_overlap = (template_moods: MoodTag[], current_moods: MoodTag[]): boolean => {
    if (!template_moods || template_moods.length === 0) return true; 
    if (!current_moods || current_moods.length === 0) return false;
    return template_moods.some(mood => current_moods.includes(mood));
};

export const select_template_by_weight = (templates: NarrativeTemplate[]): NarrativeTemplate => {
    if (templates.length === 0) throw new Error("No templates provided for weighted selection.");
    const totalWeight = templates.reduce((sum, tmpl) => sum + (tmpl.weight || 0.5), 0);
    let randomNum = Math.random() * totalWeight;

    for (const tmpl of templates) {
        randomNum -= (tmpl.weight || 0.5);
        if (randomNum <= 0) return tmpl;
    }
    return templates[0];
};

export const fill_template = (
    template_string: string,
    chunk: Chunk,
    world: World,
    playerPosition: { x: number; y: number; },
    t: (key: TranslationKey, replacements?: any) => string,
    language: Language,
    playerState?: PlayerStatus
): string => {
    let filled_template = template_string;
    const currentBiomeName: string = chunk.terrain;
    // Lookup biome templates in a case-insensitive and flexible way to handle dataset/casing differences.
    let biomeTemplateData = biomeNarrativeTemplates[currentBiomeName];
    if (!biomeTemplateData) {
        const lower = currentBiomeName.toLowerCase();
        biomeTemplateData = biomeNarrativeTemplates[lower] || biomeNarrativeTemplates[currentBiomeName.charAt(0).toUpperCase() + currentBiomeName.slice(1)];
    }
    if (!biomeTemplateData) {
        // Fallback: try to find a template whose declared terrain matches case-insensitively
        biomeTemplateData = Object.values(biomeNarrativeTemplates).find((b: any) => b && b.terrain && String(b.terrain).toLowerCase() === String(currentBiomeName).toLowerCase()) as any;
    }

    if (!biomeTemplateData) {
        logger.warn(`Placeholder data not found for ${chunk.terrain}`);
        return template_string;
    }

    filled_template = filled_template.replace(/{{(.*?)}}/g, (match, p1) => {
        const key = p1.trim();
        const category =
            (biomeTemplateData.adjectives as any)[key] ||
            (biomeTemplateData.features as any)[key] ||
            (biomeTemplateData.smells as any)[key] ||
            (biomeTemplateData.sounds as any)[key] ||
            (biomeTemplateData.sky ? (biomeTemplateData.sky as any)[key] : undefined);
        if (category && Array.isArray(category) && category.length > 0) {
            return category[Math.floor(Math.random() * category.length)];
        }
        logger.warn(`Placeholder category not found or empty: ${p1}`); 
        return match; 
    });
    
    filled_template = filled_template.replace('{light_level_detail}', () => chunk.lightLevel <= 10 ? t('light_level_dark') : chunk.lightLevel < 50 ? t('light_level_dim') : t('light_level_normal'));
    filled_template = filled_template.replace('{temp_detail}', () => chunk.temperature && chunk.temperature <= 20 ? t('temp_cold') : chunk.temperature && chunk.temperature >= 80 ? t('temp_hot') : t('temp_mild'));
    filled_template = filled_template.replace('{moisture_detail}', () => chunk.moisture >= 80 ? t('moisture_humid') : chunk.moisture <= 20 ? t('moisture_dry') : t('moisture_normal'));
    filled_template = filled_template.replace('{jungle_feeling_dark}', t('jungle_feeling_dark_phrase'));
    filled_template = filled_template.replace(/{enemy_name}/g, chunk.enemy && chunk.enemy.type ? getTranslatedText(chunk.enemy.type, language, t) : t('no_enemy_found'));
    filled_template = filled_template.replace(/{item_found}/g, chunk.items && chunk.items.length > 0 ? getTranslatedText(chunk.items[Math.floor(Math.random() * chunk.items.length)].name, language, t) : t('no_item_found'));

    if (playerState) {
        filled_template = filled_template.replace('{player_health_status}', playerState.hp < 30 ? t('player_health_low') : t('player_health_normal'));
        filled_template = filled_template.replace('{player_stamina_status}', playerState.stamina < 30 ? t('player_stamina_low') : t('player_stamina_normal'));
    }

    return filled_template;
};

// --- CORE OFFLINE NARRATIVE FUNCTIONS ---

export const generateOfflineNarrative = (
    currentChunk: Chunk,
    narrativeLength: NarrativeLength,
    world: World,
    playerPosition: { x: number; y: number; },
    t: (key: TranslationKey, replacements?: any) => string,
    language: Language,
    playerState?: PlayerStatus
): string => {
    const currentBiomeName: string = currentChunk.terrain;
    const currentBiomeData = biomeNarrativeTemplates[currentBiomeName];

    if (!currentBiomeData) {
        logger.warn(`[generateOfflineNarrative] No biome template data found for: ${currentBiomeName}`);
        return currentChunk.description || "An unknown area.";
    }

    const currentMoods = analyze_chunk_mood(currentChunk);

    const narrativeTemplates = (
        currentBiomeData && Array.isArray(currentBiomeData.descriptionTemplates)
    ) ? currentBiomeData.descriptionTemplates : [];

    let candidateTemplates = narrativeTemplates.filter((tmpl: NarrativeTemplate) => {
        return tmpl && typeof tmpl === 'object' && !Array.isArray(tmpl) && 'id' in tmpl && 'template' in tmpl &&
               has_mood_overlap(tmpl.mood, currentMoods) && check_conditions(tmpl.conditions, currentChunk, playerState);
    });
    
    if (candidateTemplates.length === 0) {
        candidateTemplates = narrativeTemplates.filter((tmpl: NarrativeTemplate) => tmpl && tmpl.mood && tmpl.mood.length === 0);
    }
    if (candidateTemplates.length === 0) return currentChunk.description;

    const { min_s, max_s } = get_sentence_limits(narrativeLength);
    // Choose a target sentence count within the allowed range so that
    // changing the narrativeLength actually affects how verbose the output is.
    const targetSentences = Math.max(min_s, Math.min(max_s, Math.floor(Math.random() * (max_s - min_s + 1)) + min_s));
    let finalSentences: string[] = [];
    let sentenceCount = 0;

    const openingTemplates = candidateTemplates.filter(t => t.type === 'Opening');
    if (openingTemplates.length > 0) {
        const chosen = select_template_by_weight(openingTemplates);
        finalSentences.push(fill_template(chosen.template, currentChunk, world, playerPosition, t, language, playerState));
        sentenceCount++;
    }

    const detailTemplates = candidateTemplates.filter(t => t.type === 'EnvironmentDetail' || t.type === 'SensoryDetail');
    while (sentenceCount < targetSentences && detailTemplates.length > 0) {
        const chosen = select_template_by_weight(detailTemplates);
        finalSentences.push(fill_template(chosen.template, currentChunk, world, playerPosition, t, language, playerState));
        sentenceCount++;
        const index = detailTemplates.indexOf(chosen);
        if (index > -1) detailTemplates.splice(index, 1);
    }

    return SmartJoinSentences(finalSentences, narrativeLength);
};


export const generateOfflineActionNarrative = (
    actionType: string,
    actionResult: any,
    currentChunk: Chunk,
    t: (key: TranslationKey, replacements?: any) => string,
    language: Language,
) => {
    let narrativeKey: TranslationKey = '';
    let replacements: any = {};
    const enemyType = currentChunk.enemy && currentChunk.enemy.type ? getTranslatedText(currentChunk.enemy.type, language, t) : ' существо';
    const sensoryFeedbackOptions = [
        `sensoryFeedback_${currentChunk.temperature && currentChunk.temperature > 80 ? 'hot' : 'cold'}`,
        `sensoryFeedback_${currentChunk.lightLevel < 20 ? 'dark' : 'normal'}`,
        `sensoryFeedback_${currentChunk.moisture > 70 ? 'rain' : 'normal'}`
    ];
    const sensory_feedback = t(sensoryFeedbackOptions[Math.floor(Math.random() * sensoryFeedbackOptions.length)]);

    switch (actionType) {
    case 'attack':
            // Map SuccessLevel values to existing locale suffixes
            const succ = actionResult.successLevel;
            const suffixMap: Record<string, string> = {
                CriticalFailure: 'critFail',
                Failure: 'fail',
                Success: 'success',
                GreatSuccess: 'success', // No separate GreatSuccess key; use 'success'
                CriticalSuccess: 'critSuccess'
            };
            const suffix = suffixMap[succ] ?? succ.toLowerCase();
            narrativeKey = `actionNarrative_attack_${suffix}`;
            let attack_description = t(`attackNarrative_${suffix}`, { enemyType });
            let damage_report = actionResult.playerDamage > 0 ? t('attackDamageDealt', { damage: actionResult.playerDamage }) : '';
            let enemy_reaction = '';
            
            
            
            
            if (actionResult.enemyDefeated) {
                enemy_reaction = t('enemyDefeatedNarrative', { enemyType });
            } else if (actionResult.fled) {
                enemy_reaction = t('enemyFledNarrative', { enemyType });
            } else if (actionResult.enemyDamage > 0) {
                enemy_reaction = t('enemyRetaliationNarrative', { enemyType, damage: actionResult.enemyDamage });
            } else {
                enemy_reaction = t('enemyPreparesNarrative', { enemyType });
            }
            replacements = { attack_description, damage_report, sensory_feedback, enemy_reaction };
            break;
        case 'useItem':
            if (actionResult.target === 'player') {
                narrativeKey = actionResult.wasUsed ? 'itemUsePlayerSuccessNarrative' : 'itemUsePlayerFailNarrative';
                replacements = { item: getTranslatedText(actionResult.itemName, language, t), effect: actionResult.effectDescription, sensory_feedback };
            } else {
                narrativeKey = actionResult.wasTamed ? 'itemTameSuccessNarrative' : 'itemTameFailNarrative';
                replacements = { item: getTranslatedText(actionResult.itemName, language, t), target: getTranslatedText(actionResult.target, language, t), sensory_feedback };
            }
            break;
        case 'useSkill':
            const skillName = getTranslatedText(actionResult.skill.name, language, t);
            if (actionResult.successLevel === 'CriticalFailure') {
                narrativeKey = 'skillCritFailNarrative';
                replacements = { skillName, damage: actionResult.backfireDamage, sensory_feedback };
            } else if (actionResult.successLevel === 'Failure') {
                narrativeKey = 'skillFailNarrative';
                replacements = { skillName, sensory_feedback };
            } else {
                if (actionResult.skill.effect.type === 'HEAL') {
                    narrativeKey = 'skillHealSuccessNarrative';
                    replacements = { skillName, amount: actionResult.healedAmount, sensory_feedback };
                } else if (actionResult.skill.effect.type === 'DAMAGE') {
                    let narrative = t('skillDamageSuccessNarrative', { skillName, enemy: enemyType, damage: actionResult.finalDamage, sensory_feedback });
                    if (actionResult.siphonedAmount) {
                        narrative += ' ' + t('skillSiphonNarrative', { amount: actionResult.siphonedAmount });
                    }
                    return narrative;
                }
            }
            break;
    }

    if (!narrativeKey) return "An unknown action occurred.";
    return t(narrativeKey, replacements);
};


/**
 * Handle a player's 'search' / 'explore' action inside a chunk.
 *
 * The search action uses biome templates (natural candidates) plus a small
 * sampled set of non-natural (spawnEnabled=false) items so that players can
 * occasionally discover crafted/rare items via searching. Search is intentionally
 * more generous than passive natural spawn: a modest `searchBoost` increases
 * the effective chance, but non-natural finds are capped to avoid being overpowered.
 *
 * Implementation details:
 * - Natural candidates use their defined `conditions.chance` or a sensible
 *   default. Non-natural candidates are given a very small base chance (e.g. 0.02).
 * - The function applies a softcapped `spawnMultiplier` before calculating
 *   the final chance for the search. A `searchBoost` (>1) is applied to make
 *   searching more effective than passive discovery.
 * - Non-natural items' final chance is capped (e.g. <= 0.3) so search cannot
 *   trivially expose high-tier crafted items every time.
 *
 * @param currentChunk - Current chunk state where the search occurs.
 * @param actionId - The id of the search action (removed from chunk.actions after use).
 * @param language - Language code for localized narrative text.
 * @param t - Translation function used to build narrative strings.
 * @param allItemDefinitions - Registry of item definitions used to resolve found items.
 * @param rng - Random integer helper for quantity selection.
 * @param spawnMultiplier - Optional multiplier to scale search find-chance (softcapped). Default: 1.
 * @returns An object containing the updated chunk, narrative string, and optional toast info.
 */
export const handleSearchAction = (
    currentChunk: Chunk,
    actionId: number,
    language: Language,
    t: (key: TranslationKey, replacements?: any) => string,
    allItemDefinitions: Record<string, ItemDefinition>,
    rng: (range: { min: number, max: number }) => number,
    /** Optional multiplier to scale search find-chance (softcapped). */
    spawnMultiplier: number = 1
) => {
    let newChunk = { ...currentChunk, items: [...currentChunk.items] };
    newChunk.actions = newChunk.actions.filter(a => a.id !== actionId);

    const templates = getTemplates(language);
    const biomeTemplates = templates[currentChunk.terrain];
    if (!biomeTemplates || !biomeTemplates.items) {
        return { newChunk, narrative: t('exploreFoundNothing'), toastInfo: null };
    }

    const possibleItems = biomeTemplates.items.filter((itemTmpl: any) => {
        const itemDef = allItemDefinitions[itemTmpl.name];
        return itemDef && check_conditions(itemTmpl.conditions, currentChunk);
    });

    if (possibleItems.length > 0) {
        // Build a combined candidate pool that includes both natural biome items
        // and a small sampled set of non-natural (spawnEnabled=false) items so
        // searches can sometimes find rarer or crafted-only gear (but not too often).
        const extraCandidates = Object.keys(allItemDefinitions)
            .filter(k => !allItemDefinitions[k].spawnEnabled)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3)
            .map(name => ({ name, conditions: { chance: 0.02 }, __isNatural: false }));

        const naturalCandidates = possibleItems.map((t: any) => ({ ...t, __isNatural: true }));
        const allCandidates = [...naturalCandidates, ...extraCandidates];

        // Compute final chance per candidate and perform per-candidate roll.
        // This ensures we use each candidate's own base chance and correctly apply
        // multipliers, search boost, and non-natural caps when evaluating finds.
        const softcap = (m: number, k = 0.4) => m <= 1 ? m : m / (1 + (m - 1) * k);
        const effectiveMultiplier = softcap(spawnMultiplier);
        const searchBoost = 1.4; // make search more generous than passive discovery

        // Shuffle candidates to avoid ordering bias when multiple have similar chances.
        const shuffledCandidates = allCandidates.sort(() => 0.5 - Math.random());
        let chosen: any = null;
        for (const c of shuffledCandidates) {
            const baseChance = c.conditions?.chance ?? (c.__isNatural ? 0.5 : 0.02);
            let finalChance = Math.min(0.95, baseChance * effectiveMultiplier * searchBoost);
            if (!c.__isNatural) finalChance = Math.min(0.3, finalChance); // cap non-natural finds
            // If this candidate passes its own roll, select it and stop.
            if (Math.random() < finalChance) {
                chosen = c;
                break;
            }
        }

        if (chosen) {
            const foundItemTemplate = chosen;
            const itemDef = allItemDefinitions[foundItemTemplate.name];
            const quantity = itemDef ? rng(itemDef.baseQuantity) : rng({ min: 1, max: 1 });
        
        const existingItem = newChunk.items.find(i => (
            // prefer explicit id if present
            (i as any).id === foundItemTemplate.name ||
            // resolve item's name to canonical id
            resolveItemId(i.name, allItemDefinitions) === foundItemTemplate.name ||
            // legacy fallback: english name
            getTranslatedText(i.name, 'en') === foundItemTemplate.name
        ));
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            newChunk.items.push({
                name: itemDef.name,
                description: itemDef.description,
                quantity,
                tier: itemDef.tier,
                emoji: itemDef.emoji,
            });
        }
        
            const itemName = getTranslatedText(foundItemTemplate.name, language, t);
        return {
            newChunk,
            narrative: t('exploreFoundItemsNarrative', { items: `${quantity} ${itemName}` }),
            toastInfo: {
                title: 'exploreSuccessTitle',
                description: 'exploreFoundItems',
                params: { items: `${quantity} ${itemName}` }
            }
        };
        }
    }

    return { newChunk, narrative: t('exploreFoundNothing'), toastInfo: null };
};

    