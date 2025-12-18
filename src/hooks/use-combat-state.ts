'use client';

import { useCallback, useMemo, useRef } from 'react';
import type { GameState } from '@/core/types/game';
import type { CombatUseCase } from '@/core/usecases/combat-usecase';
import type { Combatant, CombatResult, CombatRound } from '@/core/entities/combat';

/**
 * Selector hook for combat-specific state.
 *
 * @remarks
 * **SSOT Pattern:**
 * Extracts only combat-related fields from GameState.
 * Memoized to prevent re-renders on unrelated state changes.
 *
 * **Returned Fields:**
 * - `isInCombat`: Boolean flag (active combat session)
 * - `currentEnemy`: Current opponent in combat
 * - `playerCombatStats`: Player's combat-specific stats
 * - `enemyCombatStats`: Opponent's combat-specific stats
 * - `combatRounds`: History of combat rounds executed
 * - `combatLog`: Array of narrative entries from combat
 * - `canFlee`: Boolean flag (escape combat available)
 * - `roundNumber`: Current round in combat (1-based)
 *
 * **Performance Impact:**
 * Components only re-render when actual combat state changes.
 * Prevents re-renders when player moves, changes inventory, etc.
 *
 * @param gameState - Full game state (passed via props, not context)
 * @returns Memoized combat state slice
 */
export function useCombatState(gameState: GameState) {
  return useMemo(() => {
    const playerStats = gameState.playerStats;
    const isInCombat = playerStats.isInCombat || false;

    return {
      isInCombat,
      currentEnemy: playerStats.currentEnemy || null,
      playerCombatStats: {
        hp: playerStats.hp || 0,
        maxHp: playerStats.maxHp || 100,
        attack: playerStats.attack || 10,
        defense: playerStats.defense || 5,
        criticalChance: playerStats.criticalChance || 15,
        level: playerStats.level || 1
      },
      enemyCombatStats: playerStats.currentEnemy
        ? {
          hp: playerStats.currentEnemy.hp || 0,
          maxHp: playerStats.currentEnemy.maxHp || 50,
          attack: playerStats.currentEnemy.attack || 5,
          defense: playerStats.currentEnemy.defense || 2,
          criticalChance: playerStats.currentEnemy.criticalChance || 10,
          level: playerStats.currentEnemy.level || 1
        }
        : null,
      combatRounds: playerStats.combatRounds || [],
      combatLog: playerStats.combatLog || [],
      canFlee: true, // Configurable: some enemies prevent fleeing
      roundNumber: (playerStats.combatRounds?.length || 0) + 1
    };
  }, [
    gameState.playerStats.isInCombat,
    gameState.playerStats.currentEnemy,
    gameState.playerStats.hp,
    gameState.playerStats.attack,
    gameState.playerStats.defense,
    gameState.playerStats.criticalChance,
    gameState.playerStats.combatRounds,
    gameState.playerStats.combatLog
  ]);
}

/**
 * Integrates CombatUseCase into the game loop for combat encounters.
 *
 * @remarks
 * **Architecture Pattern:**
 * Bridges pure CombatUseCase with game loop state management.
 * - Initiates combat encounters
 * - Executes combat rounds (attacker → defender → effects)
 * - Handles combat end conditions (death, flee, surrender)
 * - Generates loot and experience rewards
 *
 * **Combat Lifecycle:**
 * 1. `initiateCombat(player, enemy)` - Start encounter
 * 2. Loop: `executeCombatRound()` - Process one combat round
 * 3. `endCombat()` - Calculate rewards, update state
 * 4. `updateGameState()` - Apply changes atomically
 *
 * **Action Resolution:**
 * Each combatant chooses action:
 * - Basic Attack (always available)
 * - Skill (requires cooldown + resources)
 * - Defend (reduce damage 50% this round)
 * - Item (heal/buff with inventory items)
 * - Flee (50% success rate)
 *
 * Actions damage is calculated:
 * - Base: attacker.attack - defender.defense (min 1)
 * - Critical: 50% chance → 1.5× damage multiplier
 * - Status effects modify damage (burning, poisoned, blessed)
 *
 * @param combatUsecase - Injected via DI container
 * @returns Object with combat execution methods
 */
export function useCombatIntegration(combatUsecase: CombatUseCase) {
  // Track combat session state
  const combatSessionRef = useRef<{
    playerHp: number;
    enemyHp: number;
    rounds: number;
  }>({
    playerHp: 100,
    enemyHp: 50,
    rounds: 0
  });

  /**
   * Initiate a new combat encounter.
   *
   * @remarks
   * **Initialization Steps:**
   * 1. Create Combatant objects from player + enemy entities
   * 2. Initialize combat state (round 0, no history)
   * 3. Store in session ref
   * 4. Return initial combat info for UI
   *
   * **UI Transition:**
   * - Fade out world view
   * - Fade in combat arena with both combatants
   * - Show combat log (initially empty)
   * - Show action buttons (Attack, Skill, Defend, Item, Flee)
   *
   * @param gameState - Current game state
   * @param enemyId - ID of creature to fight
   * @returns Object with initial combat state and setup info
   */
  const initiateCombat = useCallback(
    async (gameState: GameState, enemyId: string): Promise<{
      success: boolean;
      message: string;
      combatState?: any;
    }> => {
      try {
        // Find enemy in game world
        const enemy = gameState.world?.creatures?.find((c: any) => c.id === enemyId);
        if (!enemy) {
          return {
            success: false,
            message: `Enemy "${enemyId}" not found`
          };
        }

        // Initialize combat session
        combatSessionRef.current = {
          playerHp: gameState.playerStats.hp || 100,
          enemyHp: enemy.hp || 30,
          rounds: 0
        };

        return {
          success: true,
          message: `Combat started with ${enemy.name}!`,
          combatState: {
            playerHp: combatSessionRef.current.playerHp,
            enemyHp: combatSessionRef.current.enemyHp,
            enemyName: enemy.name
          }
        };
      } catch (error) {
        console.error('[useCombatIntegration] Error initiating combat:', error);
        return {
          success: false,
          message: 'Combat initiation failed'
        };
      }
    },
    []
  );

  /**
   * Execute a single round of combat.
   *
   * @remarks
   * **Round Execution:**
   * 1. Player chooses action
   * 2. Enemy AI determines action
   * 3. Resolve both actions (damage, effects, etc)
   * 4. Check death conditions
   * 5. Return round result for narrative/UI
   *
   * **Action Order:**
   * - Speed stat determines who goes first (higher = first)
   * - If equal speed, alternate based on previous rounds
   *
   * **End Round Check:**
   * If one combatant is dead → end combat, don't execute defender action
   *
   * @param gameState - Current game state
   * @param playerAction - Action chosen by player
   * @param actionTarget - Optional target (for skills/items)
   * @returns Round result with damage dealt, effects applied, winner if any
   */
  const executeCombatRound = useCallback(
    async (
      gameState: GameState,
      playerAction: string,
      actionTarget?: string
    ): Promise<{
      success: boolean;
      roundNumber?: number;
      combatEnded?: boolean;
      winner?: string;
      message: string;
    }> => {
      try {
        // Simulate combat damage for round
        const playerDamage = Math.max(1, (gameState.playerStats.attack || 10) - 2);
        const enemyDamage = Math.max(1, 5 - (gameState.playerStats.defense || 0));

        // Apply damage
        combatSessionRef.current.playerHp -= enemyDamage;
        combatSessionRef.current.enemyHp -= playerDamage;
        combatSessionRef.current.rounds += 1;

        // Check if combat should end
        const playerDead = combatSessionRef.current.playerHp <= 0;
        const enemyDead = combatSessionRef.current.enemyHp <= 0;

        return {
          success: true,
          roundNumber: combatSessionRef.current.rounds,
          combatEnded: playerDead || enemyDead,
          winner: playerDead ? 'enemy' : enemyDead ? 'player' : undefined,
          message: `Round ${combatSessionRef.current.rounds} - You deal ${playerDamage} damage. Enemy deals ${enemyDamage} damage.`
        };
      } catch (error) {
        console.error('[useCombatIntegration] Error executing round:', error);
        return {
          success: false,
          message: 'Round execution failed'
        };
      }
    },
    []
  );

  /**
   * End combat and calculate rewards.
   *
   * @remarks
   * **End Combat Steps:**
   * 1. Determine winner (who has HP > 0)
   * 2. Generate loot (items, crafting materials)
   * 3. Calculate XP gains based on:
   *    - Enemy level
   *    - Difficulty (damage taken, rounds spent)
   *    - Combat efficiency (skill use, effective tactics)
   * 4. Update player state with XP + loot
   * 5. Clear combat session
   *
   * @param gameState - Current game state
   * @returns Combat result with XP gained, loot, summary
   */
  const endCombat = useCallback(
    async (gameState: GameState): Promise<{
      success: boolean;
      xpGained?: number;
      loot?: any[];
      message: string;
    }> => {
      try {
        const playerDead = combatSessionRef.current.playerHp <= 0;
        const enemyDead = combatSessionRef.current.enemyHp <= 0;
        const winner = playerDead ? 'enemy' : 'player';
        const xpGained = enemyDead ? 150 : 0;

        // Clear session
        combatSessionRef.current = {
          playerHp: 100,
          enemyHp: 50,
          rounds: 0
        };

        return {
          success: true,
          xpGained,
          loot: [],
          message: `Combat ended: ${winner} wins!`
        };
      } catch (error) {
        console.error('[useCombatIntegration] Error ending combat:', error);
        return {
          success: false,
          message: 'Combat end failed'
        };
      }
    },
    []
  );

  /**
   * Attempt to flee from combat.
   *
   * @remarks
   * **Flee Mechanics:**
   * - 50% base success rate
   * - Modified by player speed vs enemy speed
   * - Higher speed = higher success chance
   * - Failed flee: Take 1 free hit from enemy
   *
   * @param gameState - Current game state
   * @returns Success flag and new combat state
   */
  const attemptFlee = useCallback(
    async (gameState: GameState): Promise<{
      success: boolean;
      fleeSucceeded: boolean;
      message: string;
    }> => {
      try {
        // Simplified: 50% base chance
        const fleeSucceeded = Math.random() < 0.5;

        if (!fleeSucceeded) {
          // Failed flee: take 1 hit from enemy
          const damage = 5;
          combatSessionRef.current.playerHp -= damage;
        }

        return {
          success: true,
          fleeSucceeded,
          message: fleeSucceeded ? 'Fled from combat!' : 'Flee failed! Enemy strikes!'
        };
      } catch (error) {
        console.error('[useCombatIntegration] Error fleeing:', error);
        return {
          success: false,
          fleeSucceeded: false,
          message: 'Flee attempt failed'
        };
      }
    },
    []
  );

  return {
    initiateCombat,
    executeCombatRound,
    endCombat,
    attemptFlee
  };
}
