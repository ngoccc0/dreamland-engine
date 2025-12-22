/**
 * @file src/store/action.store.ts
 * @description Zustand store for Game Actions - Wraps the action-processor
 * 
 * @remarks
 * This store provides a bridge between UI components and the pure action-processor.
 * It handles:
 * - Queueing actions from UI
 * - Processing actions through the action-processor
 * - Updating player and effect stores with results
 * - Emitting visual events for animations/sounds
 * 
 * Usage:
 * ```tsx
 * const { executeMove, executeCombat } = useActionStore();
 * await executeMove({ x: 1, y: 0 });
 * ```
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { processAction, ActionProcessorContext } from '@/core/usecases/action-processor';
import { GameAction, ActionType, PlayerMoveAction, ConsumeItemAction, GameTickAction, AttackAction } from '@/core/usecases/actions/types';
import { usePlayerStore } from './player.store';
import { useWorldStore } from './world.store';
import { useEffectStore } from './effect.store';
import { useTimeStore } from './time.store';

interface ActionStoreState {
  // Action queue
  isProcessing: boolean;
  lastActionResult: any | null;
  
  // Action execution methods (high-level API)
  executeMove: (direction: { x: number; y: number }, distance?: number) => Promise<void>;
  executeCombat: (targetId: string) => Promise<void>;
  executeItemUse: (itemId: string, quantity?: number) => Promise<void>;
  executeGameTick: (deltaMs: number) => Promise<void>;
  
  // Low-level action processor
  _processRawAction: (action: GameAction) => Promise<void>;
}

/**
 * Zustand Action Store
 * 
 * @remarks
 * This store is the command center for all game actions. It:
 * 1. Receives action requests from UI components
 * 2. Builds ActionProcessorContext from other stores
 * 3. Calls pure processAction function
 * 4. Updates all affected stores with results
 * 5. Emits visual events
 */
export const useActionStore = create<ActionStoreState>()(
  devtools(
    (set, get) => ({
      isProcessing: false,
      lastActionResult: null,

      // Execute movement action
      executeMove: async (direction: { x: number; y: number }, distance: number = 1) => {
        const { _processRawAction } = get();
        const action: PlayerMoveAction = {
          type: ActionType.PLAYER_MOVE,
          direction,
          distance,
        };
        await _processRawAction(action);
      },

      // Execute combat action
      executeCombat: async (targetId: string) => {
        const { _processRawAction } = get();
        const action: AttackAction = {
          type: ActionType.ATTACK,
          targetId,
        };
        await _processRawAction(action);
      },

      // Execute item consumption
      executeItemUse: async (itemId: string, quantity: number = 1) => {
        const { _processRawAction } = get();
        const action: ConsumeItemAction = {
          type: ActionType.CONSUME_ITEM,
          itemId,
          quantity,
        };
        await _processRawAction(action);
      },

      // Execute game tick
      executeGameTick: async (deltaMs: number) => {
        const { _processRawAction } = get();
        const action: GameTickAction = {
          type: ActionType.GAME_TICK,
          deltaMs,
        };
        await _processRawAction(action);
      },

      // Low-level action processor
      _processRawAction: async (action: GameAction) => {
        set({ isProcessing: true });

        try {
          // Build context from stores
          const playerStore = usePlayerStore.getState();
          const worldStore = useWorldStore.getState();
          const effectStore = useEffectStore.getState();
          const timeStore = useTimeStore.getState();

          const context: ActionProcessorContext = {
            player: playerStore.player,
            world: worldStore.currentChunk as any, // TODO: Proper world construction
            activeEffects: effectStore.activeEffects,
            accumulatedMs: timeStore.accumulatedMs,
            diceRoll: (sides: number) => Math.floor(Math.random() * sides) + 1,
          };

          // Process action
          const result = processAction(action, context);

          // Update stores with results
          if (result.newPlayerState) {
            playerStore.setPlayerState(result.newPlayerState);
          }

          if (result.activeEffects) {
            effectStore.setActiveEffects(result.activeEffects);
          }

          // Store result for UI reference
          set({
            lastActionResult: result,
          });

          // Emit visual events (TODO: wire to audio/animation system)
          if (result.visualEvents?.length > 0) {
            console.log('Visual events:', result.visualEvents);
          }
        } catch (error) {
          console.error('Action processing failed:', error);
          throw error;
        } finally {
          set({ isProcessing: false });
        }
      },
    }),
    { name: 'action-store' }
  )
);

export default useActionStore;
