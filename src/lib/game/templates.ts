/**
 * @fileOverview Central hub for accessing narrative templates.
 * @description This file aggregates biome-specific template data from various modular files.
 * It provides a single function, `getTemplates`, to retrieve the correct set of templates
 * based on the current game language. This architecture allows for easy expansion and modding
 * of narrative content.
 */

import type { GameTemplates } from "./types";
import { biomeNarrativeTemplates } from './data/narrative-templates';

/**
 * Retrieves the appropriate set of narrative templates for the game.
 * Currently, it returns a static set of templates but is designed to be
 * extensible for merging templates from different sources (e.g., mods) in the future.
 * @returns {GameTemplates} An object containing all biome-specific narrative templates.
 */
export const getTemplates = (): GameTemplates => {
    // For now, we directly return the imported templates.
    // This can be expanded later to merge templates from different sources (e.g., mods).
    return biomeNarrativeTemplates;
};
