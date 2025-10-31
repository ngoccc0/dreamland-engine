import type { IGameStateRepository } from '@/lib/game/ports/game-state.repository';
import type { GameState } from '@/lib/game/types';
import { db } from './indexed-db.config';

/**
 * @class IndexedDbGameStateRepository
 * Implements IGameStateRepository.
 * An implementation of the game state repository that uses the browser's
 * IndexedDB for client-side storage. This is the preferred offline storage method
 * due to its larger capacity and asynchronous nature.
 */
export class IndexedDbGameStateRepository implements IGameStateRepository {
    /**
     * Loads the full game state for a specific slot from IndexedDB.
     * @param {string} slotId - The identifier for the save slot (e.g., 'slot_0').
     * @returns {Promise<GameState | null>} A promise that resolves to the GameState object or null if not found.
     */
    async load(slotId: string): Promise<GameState | null> {
        try {
            // Dexie returns undefined if not found, which we convert to null
            const data = await db.gameState.get(slotId);
            return data || null;
        } catch (error) {
            console.error('Error loading game state from IndexedDB:', error);
            throw error;
        }
    }

    /**
     * Saves the entire game state to a specific slot in IndexedDB.
     * @param {string} slotId - The identifier for the save slot.
     * @param {GameState} state - The complete GameState object to save.
     * @returns {Promise<void>} A promise that resolves when the save is complete.
     */
    async save(slotId: string, state: GameState): Promise<void> {
        try {
            // put() will add a new document or update an existing one based on the primary key
            await db.gameState.put({ ...state, id: slotId });
        } catch (error) {
            console.error('Error saving game state to IndexedDB:', error);
            throw error;
        }
    }

    /**
     * Deletes the game state for a specific slot from IndexedDB.
     * @param {string} slotId - The identifier for the save slot to delete.
     * @returns {Promise<void>} A promise that resolves when the deletion is complete.
     */
    async delete(slotId: string): Promise<void> {
        try {
            await db.gameState.delete(slotId);
        } catch (error) {
            console.error('Error deleting game state from IndexedDB:', error);
            throw error;
        }
    }

    /**
     * Retrieves a summary of all available save slots from IndexedDB.
     * This is used for the main menu screen to show which slots are occupied.
     * @returns {Promise<Array<Pick<GameState, 'worldSetup' | 'day' | 'gameTime' | 'playerStats'> | null>>} A promise that resolves to an array of up to 3 save slot summaries.
     */
    async listSaveSummaries(): Promise<Array<Pick<GameState, 'worldSetup' | 'day' | 'gameTime' | 'playerStats'> | null>> {
        try {
            const allStates = await db.gameState.toArray();
            const summaries: Array<Pick<GameState, 'worldSetup' | 'day' | 'gameTime' | 'playerStats'> | null> = [null, null, null];

            allStates.forEach(data => {
                const slotIndex = parseInt(data.id.replace('slot_', ''), 10);
                if (!isNaN(slotIndex) && slotIndex >= 0 && slotIndex < 3) {
                    summaries[slotIndex] = {
                        worldSetup: data.worldSetup,
                        day: data.day,
                        gameTime: data.gameTime,
                        playerStats: data.playerStats
                    };
                }
            });
            return summaries;
        } catch (error) {
            console.error('Error listing save summaries from IndexedDB:', error);
            throw error;
        }
    }
}
