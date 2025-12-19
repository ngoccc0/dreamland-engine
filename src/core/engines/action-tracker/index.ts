/**
 * Action Tracker Module - Player action recording and querying
 *
 * @remarks
 * **Purpose:** Centralized tracking of all player actions
 * (combat, harvesting, crafting, movement, exploration, etc.)
 *
 * **Exports:**
 * - Schemas: Define all action types
 * - Engine: Record and query actions
 * - Hooks: React integration for action recording
 */

export {
    // Schemas
    BaseActionSchema,
    CombatActionSchema,
    HarvestingActionSchema,
    CraftingActionSchema,
    ItemUsageActionSchema,
    SkillUsageActionSchema,
    MovementActionSchema,
    ExplorationActionSchema,
    FarmingActionSchema,
    PlayerActionSchema,
    ActionHistorySchema,
    createEmptyActionHistory,
    estimateActionHistorySize,
    // Types
    type CombatAction,
    type HarvestingAction,
    type CraftingAction,
    type ItemUsageAction,
    type SkillUsageAction,
    type MovementAction,
    type ExplorationAction,
    type FarmingAction,
    type PlayerAction,
    type ActionHistory,
} from './schemas';

export { ActionTrackerEngine } from './engine';
