/**
 * Core Offline Narrative Generation
 *
 * @remarks
 * Generates ambient descriptions for chunks using mood-based template
 * selection and synthesis. Combines template library with fallback
 * synthesis for varied, context-sensitive output.
 */

import type { Chunk, NarrativeLength, NarrativeTemplate, Language, PlayerStatus, World } from "@/core/types/game";
import { SmartJoinSentences, getTranslatedText } from "@/lib/utils";
import type { TranslationKey } from "@/lib/core/i18n";
import { logger } from "@/lib/core/logger";
import { biomeNarrativeTemplates, getKeywordVariations, selectRandom } from "@/core/data/narrative/templates";
import { analyze_chunk_mood, has_mood_overlap } from "./mood";
import { check_conditions, fill_template, get_sentence_limits, select_template_by_weight } from "./templates";

/**
 * Synthesizes a detail sentence from chunk properties when templates are sparse.
 *
 * @remarks
 * **Algorithm:**
 * 1. Score prominence of temperature, moisture, and light based on deviation from neutral (50/50/50)
 * 2. Select primary condition with highest score
 * 3. Choose adjective from language-specific keyword variations
 * 4. Select feature from biome data, falling back to enemy or item
 * 5. Compose sentence using one of several patterns (English or Vietnamese)
 *
 * @internal
 */
const synthesizeDetailSentence = (
    currentChunk: Chunk,
    language: Language,
    t: (key: TranslationKey, replacements?: any) => string,
    currentBiomeData: any
): string => {
    try {
        const kv = getKeywordVariations(language);

        // Score prominence for temperature/moisture/light
        const scores: { key: string; score: number }[] = [];
        if (typeof currentChunk.temperature === 'number') {
            const temp = currentChunk.temperature;
            const score = Math.abs(temp - 50) + (temp >= 80 || temp <= 10 ? 20 : 0);
            scores.push({ key: 'temperature', score });
        }
        if (typeof currentChunk.moisture === 'number') {
            const m = currentChunk.moisture;
            const score = Math.abs(m - 50) + (m >= 80 || m <= 20 ? 15 : 0);
            scores.push({ key: 'moisture', score });
        }
        if (typeof currentChunk.lightLevel === 'number') {
            const l = currentChunk.lightLevel;
            const score = Math.abs((l <= 0 ? 0 - l : 100 - l)) + (l <= 10 ? 10 : 0);
            scores.push({ key: 'light', score });
        }

        // Determine primary condition
        scores.sort((a, b) => b.score - a.score);
        const primary = scores[0]?.key;

        // Pick an adjective from keyword variations
        let adj = '';
        if (primary === 'temperature' && kv.temp_adj) {
            if (typeof currentChunk.temperature === 'number' && currentChunk.temperature >= 80) {
                adj = selectRandom((kv.temp_adj as any).hot as string[]);
            } else if (typeof currentChunk.temperature === 'number' && currentChunk.temperature <= 10) {
                adj = selectRandom((kv.temp_adj as any).cold as string[]);
            } else {
                adj = selectRandom((kv.temp_adj as any).mild as string[]);
            }
        } else if (primary === 'moisture' && kv.moisture_adj) {
            if (typeof currentChunk.moisture === 'number' && currentChunk.moisture >= 80) {
                adj = selectRandom((kv.moisture_adj as any).high as string[]);
            } else if (typeof currentChunk.moisture === 'number' && currentChunk.moisture <= 20) {
                adj = selectRandom((kv.moisture_adj as any).low as string[]);
            } else {
                adj = selectRandom((kv.moisture_adj as any).medium as string[]);
            }
        } else if (primary === 'light' && kv.light_adj) {
            if (typeof currentChunk.lightLevel === 'number' && currentChunk.lightLevel <= 10) {
                adj = selectRandom((kv.light_adj as any).dark as string[]);
            } else if (typeof currentChunk.lightLevel === 'number' && currentChunk.lightLevel <= 40) {
                adj = selectRandom((kv.light_adj as any).medium as string[]);
            } else {
                adj = selectRandom((kv.light_adj as any).bright as string[]);
            }
        }

        // Feature: prefer biome feature, then enemy, then item
        let featureText = '';
        if (currentBiomeData && currentBiomeData.features && Object.keys(currentBiomeData.features).length > 0) {
            const keys = Object.keys(currentBiomeData.features);
            for (const k of keys) {
                const arr = (currentBiomeData.features as any)[k];
                if (Array.isArray(arr) && arr.length > 0) {
                    featureText = selectRandom(arr as string[]);
                    break;
                }
            }
        }
        if (!featureText) {
            if (currentChunk.enemy && currentChunk.enemy.type) {
                featureText = getTranslatedText(currentChunk.enemy.type, language, t);
            } else if (currentChunk.items && currentChunk.items.length > 0) {
                featureText = getTranslatedText(currentChunk.items[0].name, language, t);
            }
        }

        const patternsEn = [
            `You notice ${featureText || 'something'}. ${adj}`,
            `${adj} — you catch sight of ${featureText || 'something nearby'}.`,
            `As you move, ${adj} and ${featureText ? `you see ${featureText}` : 'there is a change in the scene'}.`,
            `You step forward; ${featureText ? `${featureText} comes into view` : 'the surroundings shift'}, ${adj}.`,
            `${featureText ? featureText + ',' : ''} ${adj}`
        ];
        const patternsVi = [
            `${featureText || 'một thứ gì đó'} được chú ý. ${adj}`,
            `${adj} — bạn chợt thấy ${featureText || 'một điều gì đó'}.`,
            `Khi bạn tiến lên, ${adj} và ${featureText ? `bạn nhìn thấy ${featureText}` : 'cảnh vật thay đổi'}.`,
            `Bạn tiến thêm một bước; ${featureText ? `${featureText} hiện ra` : 'cảnh vật thay đổi'}, ${adj}.`,
            `${featureText ? featureText + ',' : ''} ${adj}`
        ];

        const picks = language === 'vi' ? patternsVi : patternsEn;
        return picks[Math.floor(Math.random() * picks.length)];
    } catch {
        // Fallback to a simple sensory phrase
        if (currentChunk.temperature && currentChunk.temperature >= 80) return t('temp_hot') || 'it is hot';
        if (currentChunk.lightLevel && currentChunk.lightLevel <= 10) return t('light_level_dark') || 'it is dark';
        return '';
    }
};

/**
 * Generates offline ambient narrative for a chunk.
 *
 * @remarks
 * **Algorithm:**
 * 1. Analyze chunk mood from attributes (danger, light, moisture, temperature, terrain, etc.)
 * 2. Filter biome templates that match current mood AND satisfy conditions
 * 3. Select Opening sentence (if available)
 * 4. Generate detail sentences up to target count (determined by narrativeLength)
 * 5. Join sentences with SmartJoinSentences for proper punctuation and pacing
 *
 * **Fallback Strategy:**
 * - If no mood-matched templates exist, use unconditional templates (mood=[])
 * - If templates are sparse (<3), inject synthesized detail sentences (40% chance per slot)
 * - If chunk has no templates at all, return chunk.description or generic fallback
 *
 * @param currentChunk - Current chunk state
 * @param narrativeLength - Requested verbosity ("short", "medium", "long", "detailed")
 * @param world - World context (for future expansion)
 * @param playerPosition - Current player position (for future expansion)
 * @param t - Translation function
 * @param language - Language code
 * @param playerState - Optional player state for condition checks
 * @returns Joined narrative string
 */
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

    // Filter templates matching current mood and conditions
    let candidateTemplates = narrativeTemplates.filter((tmpl: NarrativeTemplate) => {
        return tmpl && typeof tmpl === 'object' && !Array.isArray(tmpl) && 'id' in tmpl && 'template' in tmpl &&
            has_mood_overlap(tmpl.mood, currentMoods) && check_conditions(tmpl.conditions, currentChunk, playerState);
    });

    // Fallback: use unconditional templates if no mood match
    if (candidateTemplates.length === 0) {
        candidateTemplates = narrativeTemplates.filter((tmpl: NarrativeTemplate) => tmpl && tmpl.mood && tmpl.mood.length === 0);
    }
    if (candidateTemplates.length === 0) return currentChunk.description || "An unknown area.";

    // Determine target sentence count based on narrative length
    const { min_s, max_s } = get_sentence_limits(narrativeLength);
    const targetSentences = Math.max(min_s, Math.min(max_s, Math.floor(Math.random() * (max_s - min_s + 1)) + min_s));
    let finalSentences: string[] = [];
    let sentenceCount = 0;

    // Generate opening sentence
    const openingTemplates = candidateTemplates.filter(t => t.type === 'Opening');
    if (openingTemplates.length > 0) {
        const chosen = select_template_by_weight(openingTemplates);
        finalSentences.push(fill_template(chosen.template, currentChunk, world, playerPosition, t, language, playerState));
        sentenceCount++;
    }

    // Generate detail sentences
    const detailTemplates = candidateTemplates.filter(t => t.type === 'EnvironmentDetail' || t.type === 'SensoryDetail');
    while (sentenceCount < targetSentences && detailTemplates.length > 0) {
        // If sparse templates or random chance, synthesize instead
        if (detailTemplates.length < 3 || Math.random() < 0.4) {
            finalSentences.push(synthesizeDetailSentence(currentChunk, language, t, currentBiomeData));
            sentenceCount++;
            continue;
        }
        const chosen = select_template_by_weight(detailTemplates);
        finalSentences.push(fill_template(chosen.template, currentChunk, world, playerPosition, t, language, playerState));
        sentenceCount++;
        const index = detailTemplates.indexOf(chosen);
        if (index > -1) detailTemplates.splice(index, 1);
    }

    return SmartJoinSentences(finalSentences, narrativeLength);
};
