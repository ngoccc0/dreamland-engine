/**
 * Action Handlers Facade
 *
 * FOLDER PURPOSE: Consolidates all action handler factories
 * Exports action creators that build handlers with injected dependencies
 */

// Online/Offline Narrative
export { createHandleOnlineNarrative } from '../use-action-handlers.online';

// Combat
export { createHandleOfflineAttack } from '../use-action-handlers.offlineAttack';
export { createHandleCombatActions } from '../use-combat-actions';

// Item Usage
export { createHandleOfflineItemUse } from '../use-action-handlers.itemUse';

// Skill Usage
export { createHandleOfflineSkillUse } from '../use-action-handlers.offlineSkillUse';

// Action System
export { createHandleOfflineAction } from '../use-action-handlers.offlineAction';

// Movement
export { createHandleMove } from '../use-action-handlers.move';

// Item Fusion
export { createHandleFuseItems } from '../use-action-handlers.fuseItems';

// Harvesting
export { createHandleHarvest } from '../use-action-handlers.harvest';
// Helpers
export { createActionHelpers } from '../action-helpers';