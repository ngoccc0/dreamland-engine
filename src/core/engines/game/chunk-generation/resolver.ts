/**
 * Item resolver helper for chunk generation
 *
 * @remarks
 * Resolves an item by display name or key against the provided
 * `allItemDefinitions` registry. First attempts direct key lookup,
 * then checks translated/display names (en/vi) to find a match.
 */

import type { ItemDefinition } from "@/core/types/game";

export const resolveItemByName = (displayOrKey: string, allItemDefinitions: Record<string, ItemDefinition>): ItemDefinition | undefined => {
    if (!displayOrKey) return undefined;
    // Direct key lookup first.
    if (allItemDefinitions[displayOrKey]) return allItemDefinitions[displayOrKey];

    // Otherwise search definitions for a translated/display name match (en/vi).
    for (const key of Object.keys(allItemDefinitions)) {
        const def = allItemDefinitions[key];
        const defNameAny: any = def.name;
        if (typeof defNameAny === 'string') {
            if (defNameAny === displayOrKey) return def;
        } else if (defNameAny) {
            if (defNameAny.en === displayOrKey || defNameAny.vi === displayOrKey) return def;
        }
    }
    return undefined;
};