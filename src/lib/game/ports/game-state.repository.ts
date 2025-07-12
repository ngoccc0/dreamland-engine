import type { GameState } from '../types';

export interface IGameStateRepository {
  /**
   * Loads the full game state for a specific slot.
   * @param slotId The identifier for the save slot (e.g., 'slot_0').
   * @returns A promise that resolves to the GameState object or null if not found.
   */
  load(slotId: string): Promise<GameState | null>;

  /**
   * Saves the entire game state to a specific slot.
   * @param slotId The identifier for the save slot.
   * @param state The complete GameState object to save.
   * @returns A promise that resolves when the save is complete.
   */
  save(slotId: string, state: GameState): Promise<void>;

  /**
   * Deletes the game state for a specific slot.
   * @param slotId The identifier for the save slot to delete.
   * @returns A promise that resolves when the deletion is complete.
   */
  delete(slotId: string): Promise<void>;

  /**
   * Retrieves a summary of all available save slots.
   * This is used for the main menu screen to show which slots are occupied.
   * @returns A promise that resolves to an array of save slot summaries.
   */
  listSaveSummaries(): Promise<Array<Pick<GameState, 'worldSetup' | 'day' | 'gameTime' | 'playerStats'> | null>>;
}

    