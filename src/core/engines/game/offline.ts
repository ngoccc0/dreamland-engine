

/**
 * Offline/Ambient Narrative Engine
 *
 * @remarks
 * This module provides all narrative generation functions for ambient
 * descriptions and action feedback. It re-exports from specialized
 * submodules organized by concern.
 *
 * @see offline/index.ts for implementation details
 */

// Re-export all functions from the offline narrative module
export {
    analyze_chunk_mood,
    has_mood_overlap,
    check_conditions,
    fill_template,
    get_sentence_limits,
    select_template_by_weight,
    generateOfflineNarrative,
    generateOfflineActionNarrative,
    handleSearchAction
} from './offline/index';

