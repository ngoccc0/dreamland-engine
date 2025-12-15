/**
 * Offline/Ambient Narrative Engine - Barrel Export
 *
 * @remarks
 * Complete offline narrative generation system including:
 * - Mood analysis from chunk attributes
 * - Template selection and filtering
 * - Narrative generation with sensory details
 * - Action narration (attack, items, skills)
 * - Search/explore action handling
 *
 * @see mood.ts for chunk mood analysis
 * @see templates.ts for template processing
 * @see narrative.ts for ambient narrative generation
 * @see actions.ts for action narrative feedback
 * @see search.ts for search/explore handling
 */

export { analyze_chunk_mood, has_mood_overlap } from './mood';
export { check_conditions, fill_template, get_sentence_limits, select_template_by_weight } from './templates';
export { generateOfflineNarrative } from './narrative';
export { generateOfflineActionNarrative } from './actions';
export { handleSearchAction } from './search';
