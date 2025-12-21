/**
 * @file src/core/usecases/actions/types.ts
 * @description All action type definitions (discriminated union)
 * 
 * @remarks
 * Actions represent player intent and system events.
 * Every state change in the game is triggered by an action.
 * ActionProcessor routes each action to the appropriate usecase.
 * 
 * Action hierarchy:
 * - GAME_TICK: System time progression
 * - PLAYER_MOVE: Player movement
 * - CONSUME_ITEM: Item consumption with risk/reward
 * - ATTACK: Combat action (dice-driven)
 */

/**
 * Enum of all action types.
 * Used for exhaustive switch statements in ActionProcessor.
 */
export enum ActionType {
  GAME_TICK = 'GAME_TICK',
  PLAYER_MOVE = 'PLAYER_MOVE',
  CONSUME_ITEM = 'CONSUME_ITEM',
  ATTACK = 'ATTACK',
}

/**
 * GAME_TICK action: Emitted by game loop every 500ms.
 * Triggers passive effects: satiety decay, effect aging, AI decisions.
 */
export interface GameTickAction {
  type: ActionType.GAME_TICK;
  /** Milliseconds elapsed since last tick */
  deltaMs: number;
}

/**
 * PLAYER_MOVE action: Emitted when player inputs movement command.
 */
export interface PlayerMoveAction {
  type: ActionType.PLAYER_MOVE;
  /** Direction vector: { x: -1|0|1, y: -1|0|1 } */
  direction: { x: number; y: number };
  /** Optional: distance to move (default 1 tile) */
  distance?: number;
}

/**
 * CONSUME_ITEM action: Emitted when player uses an item (food, potion, etc.).
 */
export interface ConsumeItemAction {
  type: ActionType.CONSUME_ITEM;
  /** ID of item in player inventory */
  itemId: string;
  /** Optional: quantity to consume (default 1) */
  quantity?: number;
}

/**
 * ATTACK action: Emitted during combat.
 */
export interface AttackAction {
  type: ActionType.ATTACK;
  /** ID of target creature */
  targetId: string;
  /** Optional: weapon to use (if different from equipped) */
  weaponId?: string;
}

/**
 * Union type of all possible actions.
 * Used by ActionProcessor's switch statement for exhaustive type checking.
 */
export type GameAction =
  | GameTickAction
  | PlayerMoveAction
  | ConsumeItemAction
  | AttackAction;

/**
 * Type guard to check if an action is a specific type.
 */
export function isGameTickAction(action: GameAction): action is GameTickAction {
  return action.type === ActionType.GAME_TICK;
}

export function isPlayerMoveAction(action: GameAction): action is PlayerMoveAction {
  return action.type === ActionType.PLAYER_MOVE;
}

export function isConsumeItemAction(action: GameAction): action is ConsumeItemAction {
  return action.type === ActionType.CONSUME_ITEM;
}

export function isAttackAction(action: GameAction): action is AttackAction {
  return action.type === ActionType.ATTACK;
}
