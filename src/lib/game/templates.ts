import type { GameTemplates } from "./types";
import { biomeNarrativeTemplates } from './data/narrative-templates';

// This file is now the central point for accessing all template data.
// In a larger system, this might dynamically load templates from different files or a database.

export const getTemplates = (): GameTemplates => {
    // For now, we directly return the imported templates.
    // This can be expanded later to merge templates from different sources (e.g., mods).
    return biomeNarrativeTemplates;
};
