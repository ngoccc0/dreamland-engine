/**
 * Feature: Quest & Achievement System
 *
 * @remarks
 * Atomic hooks pattern: Each hook has a single responsibility.
 *
 * **Export Structure:**
 * - useQuestSelectors: Pure read-only (UI components)
 * - useQuestActions: Pure write/dispatch (action handlers)
 * - useQuestCalculations: Pure math helpers (no React)
 *
 * **Benefits:**
 * - Zero bundle bloat: Components import only what they need
 * - Clear responsibility: Read vs Write separation
 * - Testable: Calculation functions testable without React mocks
 */

export { useQuestSelectors } from './useQuestSelectors';
export { useQuestActions } from './useQuestActions';
export {
    calculateQuestDisplay,
    calculateAchievementDisplay,
    sortQuestsByProgress,
    sortAchievementsByProgress,
    getAllQuestsAsDisplay,
    getAllAchievementsAsDisplay,
} from './quest-calculations';

export type {
    QuestDisplay,
    AchievementDisplay,
    QuestSelectorResult,
    QuestActionResult,
} from './quest-types';
