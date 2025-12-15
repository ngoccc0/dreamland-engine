/**
 * Offline Search/Explore Action
 *
 * @remarks
 * Handles player search actions within chunks. Combines biome item candidates
 * with a small sample of non-spawnable items to allow occasional discovery of
 * rare/crafted gear, with proper chance weighting and caps.
 */

import type { Chunk, Language, ItemDefinition } from "@/core/types/game";
import { getTranslatedText, resolveItemId } from "@/lib/utils";
import { getTemplates } from "@/lib/game/templates";
import type { TranslationKey } from "@/lib/core/i18n";
import { check_conditions } from "./templates";

/**
 * Handles a player's search/explore action within a chunk.
 *
 * @remarks
 * **Item Selection Algorithm:**
 * 1. Collect natural biome items from templates that meet chunk conditions
 * 2. Add a small sample of non-spawnable items (capped at 3) for occasional rare finds
 * 3. Calculate final chance per candidate:
 *    - Base chance: template chance or sensible default
 *    - Apply softcapped spawnMultiplier (diminishing returns for >1)
 *    - Apply searchBoost (1.4x) to make searching more generous than passive discovery
 *    - Cap non-natural items at 0.3 to prevent trivialization
 * 4. Shuffle candidates and perform per-candidate rolls
 * 5. Return first passing candidate, or report finding nothing
 *
 * **Softcap Formula:**
 * `softcap(m) = m <= 1 ? m : m / (1 + (m - 1) * 0.4)`
 *
 * This prevents extreme multipliers from making items guaranteed.
 *
 * @param currentChunk - Current chunk state
 * @param actionId - Action ID to remove from chunk.actions after execution
 * @param language - Language code for localized narrative
 * @param t - Translation function
 * @param allItemDefinitions - Registry of all item definitions
 * @param rng - RNG function for quantity selection `(range: {min, max}) => number`
 * @param spawnMultiplier - Optional multiplier to scale find-chance (softcapped). Default: 1
 * @returns Object with updated chunk, narrative string, and optional toast info
 */
export const handleSearchAction = (
    currentChunk: Chunk,
    actionId: number,
    language: Language,
    t: (key: TranslationKey, replacements?: any) => string,
    allItemDefinitions: Record<string, ItemDefinition>,
    rng: (range: { min: number, max: number }) => number,
    spawnMultiplier: number = 1
) => {
    // Remove action from chunk
    let newChunk = { ...currentChunk, items: [...currentChunk.items] };
    newChunk.actions = newChunk.actions.filter(a => a.id !== actionId);

    // Get biome item templates
    const templates = getTemplates(language);
    const biomeTemplates = templates[currentChunk.terrain];
    if (!biomeTemplates || !biomeTemplates.items) {
        return { newChunk, narrative: t('exploreFoundNothing'), toastInfo: null };
    }

    // Filter biome items by condition
    const possibleItems = biomeTemplates.items.filter((itemTmpl: any) => {
        const itemDef = allItemDefinitions[itemTmpl.name];
        return itemDef && check_conditions(itemTmpl.conditions, currentChunk);
    });

    if (possibleItems.length > 0) {
        // Build candidate pool: natural (biome) + sample of non-spawnable items
        const extraCandidates = Object.keys(allItemDefinitions)
            .filter(k => !allItemDefinitions[k].spawnEnabled)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3)
            .map(name => ({ name, conditions: { chance: 0.02 }, __isNatural: false }));

        const naturalCandidates = possibleItems.map((t: any) => ({ ...t, __isNatural: true }));
        const allCandidates = [...naturalCandidates, ...extraCandidates];

        // Softcap function for multiplier (diminishing returns for >1)
        const softcap = (m: number, k = 0.4) => m <= 1 ? m : m / (1 + (m - 1) * k);
        const effectiveMultiplier = softcap(spawnMultiplier);
        const searchBoost = 1.4; // Search is more generous than passive

        // Shuffle to avoid ordering bias
        const shuffledCandidates = allCandidates.sort(() => 0.5 - Math.random());

        // Per-candidate rolls
        let chosen: any = null;
        for (const c of shuffledCandidates) {
            const baseChance = c.conditions?.chance ?? (c.__isNatural ? 0.5 : 0.02);
            let finalChance = Math.min(0.95, baseChance * effectiveMultiplier * searchBoost);
            if (!c.__isNatural) finalChance = Math.min(0.3, finalChance); // Cap non-natural finds
            if (Math.random() < finalChance) {
                chosen = c;
                break;
            }
        }

        if (chosen) {
            const foundItemTemplate = chosen;
            const itemDef = allItemDefinitions[foundItemTemplate.name];
            const quantity = itemDef ? rng(itemDef.baseQuantity) : rng({ min: 1, max: 1 });

            // Add or update item in chunk
            const existingItem = newChunk.items.find(i => (
                (i as any).id === foundItemTemplate.name ||
                resolveItemId(getTranslatedText(i.name, 'en'), allItemDefinitions) === foundItemTemplate.name ||
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
