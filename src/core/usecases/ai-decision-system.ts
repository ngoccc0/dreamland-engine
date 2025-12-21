/**
 * @file src/core/usecases/ai-decision-system.ts
 * @description Pure AI logic for creature decision making
 *
 * @remarks
 * Each creature decides its next action based on:
 * - Current creature state (HP, effects, position)
 * - Environmental state (nearby creatures, terrain)
 * - Personality type (aggressive, defensive, fearful, neutral)
 *
 * Decision flow:
 * 1. Evaluate threat (is player in range? how much damage?)
 * 2. Evaluate resources (HP %, stamina, available skills)
 * 3. Select action based on personality and state
 * 4. Return GameAction for creature
 */

import { ActionType, GameAction } from './actions/types';

/**
 * Creature personality type determines decision priorities
 */
export enum PersonalityType {
  AGGRESSIVE = 'aggressive', // Always attack if possible
  DEFENSIVE = 'defensive', // Attack, but heal if HP low
  FEARFUL = 'fearful', // Flee if possible, attack only if cornered
  NEUTRAL = 'neutral', // Patrol, attack if provoked
}

/**
 * AI Decision Context - all info creature has when deciding
 */
export interface AIDecisionContext {
  creatureId: string;
  creatureHp: number;
  creatureMaxHp: number;
  creatureType: PersonalityType;
  creatureX: number;
  creatureY: number;
  
  playerX: number;
  playerY: number;
  playerHp: number;
  playerMaxHp: number;
  
  nearbyCreatures: Array<{ id: string; x: number; y: number; hp: number }>;
  visibleEnemies: string[]; // Creature IDs
  
  currentEffects: any[]; // Active effects on creature
}

/**
 * Threat assessment result
 */
interface ThreatAssessment {
  isPlayerVisible: boolean;
  isPlayerInMeleeRange: boolean;
  playerDistance: number;
  playerThreatLevel: 'LOW' | 'MEDIUM' | 'HIGH'; // Based on player HP vs creature power
}

/**
 * Calculate distance between two points
 *
 * @remarks
 * Uses Manhattan distance (grid-based movement)
 *
 * @param x1 - Source X
 * @param y1 - Source Y
 * @param x2 - Target X
 * @param y2 - Target Y
 * @returns Manhattan distance
 *
 * @example
 * getDistance(0, 0, 3, 4) → 7 (3 + 4 steps)
 */
function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

/**
 * Assess threat level from player
 *
 * @remarks
 * Visibility: Player visible if distance ≤ 10 tiles
 * Melee range: Distance ≤ 1 tile
 * Threat calculation: (player HP / creature power) vs creature HP
 *
 * @param context - Decision context
 * @returns Threat assessment
 */
function assessThreat(context: AIDecisionContext): ThreatAssessment {
  const playerDistance = getDistance(
    context.creatureX,
    context.creatureY,
    context.playerX,
    context.playerY
  );

  const isPlayerVisible = playerDistance <= 10; // Visibility range
  const isPlayerInMeleeRange = playerDistance <= 1;

  // Simple threat calculation
  let threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (context.playerHp > context.creatureMaxHp * 2) {
    threatLevel = 'HIGH'; // Player is much stronger
  } else if (context.playerHp > context.creatureMaxHp) {
    threatLevel = 'MEDIUM'; // Player is stronger
  } else {
    threatLevel = 'LOW'; // Creature is equal or stronger
  }

  return {
    isPlayerVisible,
    isPlayerInMeleeRange,
    playerDistance,
    playerThreatLevel: threatLevel,
  };
}

/**
 * Evaluate creature state (health, effects, resources)
 *
 * @remarks
 * Determines if creature should:
 * - Fight normally (HP > 50%)
 * - Fight defensively (HP 25-50%)
 * - Flee (HP < 25%)
 *
 * @param context - Decision context
 * @returns State evaluation
 */
function evaluateCreatureState(
  context: AIDecisionContext
): { shouldHeal: boolean; shouldFlee: boolean; hpPercent: number } {
  const hpPercent = context.creatureHp / context.creatureMaxHp;

  return {
    shouldHeal: hpPercent < 0.5, // Try to heal if below 50%
    shouldFlee: hpPercent < 0.25, // Try to flee if below 25%
    hpPercent,
  };
}

/**
 * Aggressive personality decision
 *
 * @remarks
 * - Always attack if enemy visible
 * - Chase enemies beyond melee range
 * - Ignore low HP (rarely flee)
 */
function decideAggressive(
  context: AIDecisionContext,
  threat: ThreatAssessment
): GameAction {
  if (threat.isPlayerInMeleeRange) {
    // Attack player
    return {
      type: ActionType.ATTACK,
      targetId: 'player',
    };
  }

  if (threat.isPlayerVisible && threat.playerDistance <= 5) {
    // Chase player
    const direction = {
      x: context.playerX > context.creatureX ? 1 : context.playerX < context.creatureX ? -1 : 0,
      y: context.playerY > context.creatureY ? 1 : context.playerY < context.creatureY ? -1 : 0,
    };

    return {
      type: ActionType.PLAYER_MOVE,
      direction,
      distance: 1,
    };
  }

  // Default: patrol (move randomly)
  return {
    type: ActionType.PLAYER_MOVE,
    direction: { x: Math.random() > 0.5 ? 1 : -1, y: Math.random() > 0.5 ? 1 : -1 },
  };
}

/**
 * Defensive personality decision
 *
 * @remarks
 * - Attack if enemy in melee range
 * - Heal if HP low
 * - Maintain distance
 */
function decideDefensive(
  context: AIDecisionContext,
  threat: ThreatAssessment,
  state: ReturnType<typeof evaluateCreatureState>
): GameAction {
  if (state.shouldHeal) {
    // TODO: Use healing item/skill
    // For now, just try to distance
    const direction = {
      x: context.playerX > context.creatureX ? -1 : context.playerX < context.creatureX ? 1 : 0,
      y: context.playerY > context.creatureY ? -1 : context.playerY < context.creatureY ? 1 : 0,
    };

    return {
      type: ActionType.PLAYER_MOVE,
      direction,
      distance: 1,
    };
  }

  if (threat.isPlayerInMeleeRange) {
    // Attack if forced to engage
    return {
      type: ActionType.ATTACK,
      targetId: 'player',
    };
  }

  if (threat.isPlayerVisible && threat.playerDistance <= 3) {
    // Maintain distance by circling
    const direction = {
      x: Math.random() > 0.5 ? 1 : -1,
      y: Math.random() > 0.5 ? 1 : -1,
    };

    return {
      type: ActionType.PLAYER_MOVE,
      direction,
      distance: 1,
    };
  }

  // Patrol
  return {
    type: ActionType.PLAYER_MOVE,
    direction: { x: Math.random() > 0.5 ? 1 : -1, y: Math.random() > 0.5 ? 1 : -1 },
  };
}

/**
 * Fearful personality decision
 *
 * @remarks
 * - Flee first
 * - Only attack if cornered (no escape route)
 * - Avoid threats
 */
function decideFearful(
  context: AIDecisionContext,
  threat: ThreatAssessment,
  state: ReturnType<typeof evaluateCreatureState>
): GameAction {
  if (state.shouldFlee || threat.isPlayerVisible) {
    // Try to flee away from player
    const direction = {
      x: context.playerX > context.creatureX ? -1 : context.playerX < context.creatureX ? 1 : 0,
      y: context.playerY > context.creatureY ? -1 : context.playerY < context.creatureY ? 1 : 0,
    };

    return {
      type: ActionType.PLAYER_MOVE,
      direction,
      distance: 2, // Move faster
    };
  }

  if (threat.isPlayerInMeleeRange) {
    // Cornered - attack as last resort
    return {
      type: ActionType.ATTACK,
      targetId: 'player',
    };
  }

  // Patrol safely
  return {
    type: ActionType.PLAYER_MOVE,
    direction: { x: Math.random() > 0.5 ? 1 : -1, y: Math.random() > 0.5 ? 1 : -1 },
  };
}

/**
 * Neutral personality decision
 *
 * @remarks
 * - Patrol peacefully
 * - Attack only if attacked
 * - Maintain distance from threats
 */
function decideNeutral(
  context: AIDecisionContext,
  threat: ThreatAssessment
): GameAction {
  // If player attacked us, fight back
  if (threat.isPlayerInMeleeRange && context.creatureHp < context.creatureMaxHp) {
    return {
      type: ActionType.ATTACK,
      targetId: 'player',
    };
  }

  // Otherwise patrol
  return {
    type: ActionType.PLAYER_MOVE,
    direction: { x: Math.random() > 0.5 ? 1 : -1, y: Math.random() > 0.5 ? 1 : -1 },
  };
}

/**
 * Main AI decision maker
 *
 * @remarks
 * Decision hierarchy:
 * 1. Assess threat from player
 * 2. Evaluate creature state
 * 3. Apply personality-specific logic
 * 4. Return chosen action
 *
 * @param context - Complete decision context
 * @returns GameAction to execute
 *
 * @example
 * ```typescript
 * const action = decideCreatureAction({
 *   creatureId: 'goblin_1',
 *   creatureHp: 30,
 *   creatureMaxHp: 50,
 *   creatureType: PersonalityType.AGGRESSIVE,
 *   ...
 * });
 * // Returns: { type: 'ATTACK', targetId: 'player' }
 * ```
 */
export function decideCreatureAction(context: AIDecisionContext): GameAction {
  // Step 1: Assess threat
  const threat = assessThreat(context);

  // Step 2: Evaluate state
  const state = evaluateCreatureState(context);

  // Step 3: Apply personality logic
  switch (context.creatureType) {
    case PersonalityType.AGGRESSIVE:
      return decideAggressive(context, threat);

    case PersonalityType.DEFENSIVE:
      return decideDefensive(context, threat, state);

    case PersonalityType.FEARFUL:
      return decideFearful(context, threat, state);

    case PersonalityType.NEUTRAL:
      return decideNeutral(context, threat);

    default: {
      const _exhaustive: never = context.creatureType;
      return _exhaustive;
    }
  }
}
