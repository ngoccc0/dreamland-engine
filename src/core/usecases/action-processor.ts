/**
 * @file src/core/usecases/action-processor.ts
 * @description Central Action Processor - The heart of the game engine
 * 
 * @remarks
 * All game state changes flow through this single bottleneck.
 * Input: Any action (player click, game tick, AI decision)
 * Output: Updated game state + effects + visual events
 * 
 * This is the critical design pattern:
 * - Deterministic: same action + state = same result
 * - Synchronous: no async, no race conditions
 * - Decoupled: handlers don't know about processor
 * - Replayable: can record actions and replay
 * - Auditable: all changes go through one place
 */

import { GameAction, ActionType } from './actions/types';
import { ActionResult } from './actions/result-types';
import { PlayerStatus } from '@/core/types/player';
import { Effect } from '@/core/types/effects';
import { Item } from '@/core/types/items';
import { World } from '@/core/types/world';

// Import usecases
import { executeItemUse } from './item-use-usecase';
import { executeGameTick } from './game-tick-usecase';
import { executeMovement } from './movement-usecase';
import { executeCombatAction } from './combat-action-usecase';

export interface ActionProcessorContext {
  player: PlayerStatus;
  world?: World;
  items?: Item[]; // Available items in game (definitions)
  activeEffects: Effect[];
  accumulatedMs: number;
  diceRoll?: (sides: number) => number; // Dependency injection for RNG
}

/**
 * Processes a single action synchronously.
 * 
 * @remarks
 * **Entry point for all game logic.**
 * 
 * Returns ActionResult containing:
 * - newPlayerState: Updated player stats
 * - activeEffects: All effects now active
 * - visualEvents: UI events (sounds, animations, etc.)
 * 
 * Example flow:
 * 1. Player clicks food in inventory
 * 2. UI emits action: { type: 'CONSUME_ITEM', itemId: 'apple_1' }
 * 3. Processor receives action + context
 * 4. Routes to executeItemUse usecase
 * 5. Usecase rolls dice, applies effect, returns result
 * 6. Processor accumulates result and returns ActionResult
 * 
 * @param action - The game action to process
 * @param context - Current game state (player, world, items, etc.)
 * @returns ActionResult with new state, effects, and UI events
 */
export function processAction(
  action: GameAction,
  context: ActionProcessorContext
): ActionResult {
  // Default result (no change)
  let result: ActionResult = {
    newPlayerState: { ...context.player },
    activeEffects: [...context.activeEffects],
    visualEvents: [],
  };

  // Route action to appropriate usecase
  switch (action.type) {
    case ActionType.CONSUME_ITEM: {
      // Find item in definitions
      const itemDef = (context.items || []).find((i) => i.id === action.itemId);
      if (!itemDef) {
        result.visualEvents.push({
          type: 'SHOW_TOAST',
          message: 'Item not found!',
          severity: 'error',
        });
        break;
      }

      // Check if item is in player's inventory
      const invItem = context.player.items.find((i) => i.id === action.itemId);
      if (!invItem || (invItem.quantity || 1) <= 0) {
        result.visualEvents.push({
          type: 'SHOW_TOAST',
          message: 'You don\'t have this item!',
          severity: 'error',
        });
        break;
      }

      // Roll d20 for item use difficulty check
      const roll = context.diceRoll ? context.diceRoll(20) : Math.floor(Math.random() * 20) + 1;

      // Execute item use usecase
      const itemResult = executeItemUse({
        player: context.player,
        item: itemDef,
        diceRoll: roll,
      });

      result.newPlayerState = itemResult.newPlayerState;
      result.activeEffects = [...result.activeEffects, ...itemResult.addedEffects];
      result.visualEvents = [...result.visualEvents, ...itemResult.visualEvents];

      result.debugMessage = `Item use: ${itemDef.name} (roll=${roll})`;
      break;
    }

    case ActionType.GAME_TICK: {
      // Execute game tick usecase
      const tickResult = executeGameTick({
        player: context.player,
        accumulatedMs: context.accumulatedMs,
        deltaMs: action.deltaMs,
        activeEffects: context.activeEffects,
      });

      result.newPlayerState = tickResult.newPlayer;
      result.activeEffects = tickResult.updatedEffects;
      result.visualEvents = [...result.visualEvents, ...tickResult.visualEvents];

      result.debugMessage = `Game tick: deltaMs=${action.deltaMs}, accum=${tickResult.newAccumulatedMs}`;
      break;
    }

    case ActionType.PLAYER_MOVE: {
      const movementResult = executeMovement(
        context.player,
        context.world || {},
        action.direction,
        action.distance
      );

      result.newPlayerState = movementResult.newPlayerState || context.player;
      result.visualEvents = [...result.visualEvents, ...(movementResult.visualEvents || [])];

      result.debugMessage = movementResult.debugMessage || 'Movement executed';
      break;
    }

    case ActionType.ATTACK: {
      const combatResult = executeCombatAction(
        context.player,
        context.world || {},
        action.targetId,
        action.weaponId
      );

      result.newPlayerState = combatResult.newPlayerState || context.player;
      result.visualEvents = [...result.visualEvents, ...(combatResult.visualEvents || [])];

      result.debugMessage = combatResult.debugMessage || 'Combat action executed';
      break;
    }

    default: {
      const _exhaustiveCheck: never = action;
      return _exhaustiveCheck;
    }
  }

  return result;
}

/**
 * Default dice roller (can be overridden via context).
 * Rolls an N-sided die and returns result (1 to N).
 */
export function defaultDiceRoll(sides: number): number {
  if (sides < 1) return 0;
  return Math.floor(Math.random() * sides) + 1;
}
