import type { GameState } from '../types';

/**
 * @interface IGameStateRepository
 * @description Defines the contract (the "port" in a Ports and Adapters architecture)
 * for any class that handles the persistence of game state. This allows the core
 * game logic to remain unaware of the specific storage mechanism (e.g., localStorage,
 * IndexedDB, Firebase), promoting modularity and testability.
 */
export interface IGameStateRepository {
  /**
   * @description Loads the full game state for a specific slot.
   * @param {string} slotId - The identifier for the save slot (e.g., 'slot_0').
   * @returns {Promise<GameState | null>} A promise that resolves to the GameState object or null if not found.
   */
  load(slotId: string): Promise<GameState | null>;

  /**
   * @description Saves the entire game state to a specific slot.
   * @param {string} slotId - The identifier for the save slot.
   * @param {GameState} state - The complete GameState object to save.
   * @returns {Promise<void>} A promise that resolves when the save is complete.
   */
  save(slotId: string, state: GameState): Promise<void>;

  /**
   * @description Deletes the game state for a specific slot.
   * @param {string} slotId - The identifier for the save slot to delete.
   * @returns {Promise<void>} A promise that resolves when the deletion is complete.
   */
  delete(slotId: string): Promise<void>;

  /**
   * @description Retrieves a summary of all available save slots.
   * This is used for the main menu screen to show which slots are occupied.
   * @returns {Promise<Array<Pick<GameState, 'worldSetup' | 'day' | 'gameTime' | 'playerStats'> | null>>} A promise that resolves to an array of save slot summaries.
   */
  listSaveSummaries(): Promise<Array<Pick<GameState, 'worldSetup' | 'day' | 'gameTime' | 'playerStats'> | null>>;
}
