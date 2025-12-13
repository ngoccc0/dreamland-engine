import type { IGameStateRepository } from '@/lib/game/ports/game-state.repository';
import type { GameState } from '@/core/types/game';

/**
 * localStorage game state repository - lightweight fallback persistence.
 *
 * @remarks
 * Implements IGameStateRepository using browser localStorage API.
 * Serves as fallback when IndexedDB unavailable (older browsers).
 * WARNING: Limited capacity (~5-10MB), may fail for large game states.
 *
 * **Key Features:**
 * - Synchronous access: Simple, no async complexity
 * - Lightweight: Minimal memory overhead
 * - Fallback: Used when IndexedDB not available
 * - Simple format: JSON strings in localStorage
 *
 * **Limitations:**
 * - Capacity: Only 5-10MB per domain (vs 50MB+ for IndexedDB)
 * - Sync API: Blocks main thread during save/load
 * - No indexing: Can't query by date/time
 * - Risk: May lose data if storage full
 *
 * **Storage Format:**
 * ```
 * localStorage['gameState_0'] → JSON string of GameState
 * localStorage['gameState_1'] → JSON string of GameState
 * ```
 *
 * **Usage Priority:**
 * 1. Firebase (online users, cloud sync)
 * 2. IndexedDB (offline, large capacity)
 * 3. localStorage (fallback only, limited size)
 *
 * @example
 * const repo = new LocalStorageGameStateRepository();
 * const state = await repo.load('slot_0');
 * await repo.save('slot_0', newGameState);
 */
export class LocalStorageGameStateRepository implements IGameStateRepository {
  private getKey(slotId: string): string {
    return `gameState_${slotId.replace('slot_', '')}`;
  }

  /**
   * Loads the full game state for a specific slot from localStorage.
   * @param {string} slotId - The identifier for the save slot (e.g., 'slot_0').
   * @returns {Promise<GameState | null>} A promise that resolves to the GameState object or null if not found.
   */
  async load(slotId: string): Promise<GameState | null> {
    if (typeof window === 'undefined') return null;
    const key = this.getKey(slotId);
    const data = localStorage.getItem(key);

    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data);
    } catch (error: any) {
      // Silently handle JSON parse errors
      // Optional: Corrupted data could be removed to prevent future errors
      // localStorage.removeItem(key);
      return null;
    }
  }

  /**
   * Saves the entire game state to a specific slot in localStorage.
   * @param {string} slotId - The identifier for the save slot.
   * @param {GameState} state - The complete GameState object to save.
   * @returns {Promise<void>} A promise that resolves when the save is complete.
   */
  async save(slotId: string, state: GameState): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.getKey(slotId), JSON.stringify(state));
    } catch (error: any) {
      // Silently handle localStorage save errors
      throw error;
    }
  }

  /**
   * Deletes the game state for a specific slot from localStorage.
   * @param {string} slotId - The identifier for the save slot to delete.
   * @returns {Promise<void>} A promise that resolves when the deletion is complete.
   */
  async delete(slotId: string): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.getKey(slotId));
  }

  /**
   * Retrieves a summary of all available save slots from localStorage.
   * This is used for the main menu screen to show which slots are occupied.
   * @returns {Promise<Array<Pick<GameState, 'worldSetup' | 'day' | 'gameTime' | 'playerStats'> | null>>} A promise that resolves to an array of up to 3 save slot summaries.
   */
  async listSaveSummaries(): Promise<Array<Pick<GameState, 'worldSetup' | 'day' | 'gameTime' | 'playerStats'> | null>> {
    if (typeof window === 'undefined') return [null, null, null];
    const summaries: Array<Pick<GameState, 'worldSetup' | 'day' | 'gameTime' | 'playerStats'> | null> = [null, null, null];
    for (let i = 0; i < 3; i++) {
      try {
        const data = await this.load(`slot_${i}`);
        if (data) {
          summaries[i] = {
            worldSetup: data.worldSetup,
            day: data.day,
            gameTime: data.gameTime,
            playerStats: data.playerStats
          };
        }
      } catch (error: any) {
        // Silently handle summary load errors
        summaries[i] = null;
      }
    }
    return summaries;
  }
}
