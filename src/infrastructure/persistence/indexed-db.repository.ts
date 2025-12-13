import type { IGameStateRepository } from '@/lib/game/ports/game-state.repository';
import type { GameState } from '@/core/types/game';
import { getIndexedDb } from './indexed-db.config';

/**
 * IndexedDB game state repository - client-side offline persistence.
 *
 * @remarks
 * Implements IGameStateRepository using browser IndexedDB (Dexie wrapper).
 * Provides large storage capacity (~50MB+) and asynchronous access.
 * Preferred method for offline-first game design.
 *
 * **Key Features:**
 * - Offline-first: Works without internet connection
 * - Large capacity: Can store multiple large game states
 * - Asynchronous API: Non-blocking storage operations
 * - Indexes: Supports fast queries by day/gameTime
 * - Auto-cleanup: Old saves can be pruned per retention policy
 *
 * **Storage Structure:**
 * ```
 * DreamlandEngineDB
 *   └─ gameState [slotId] → GameState document
 *      indexed by: id (primary key), day, gameTime
 * ```
 *
 * **Fallback Chain:**
 * 1. Try IndexedDB (preferred, large capacity)
 * 2. Fall back to localStorage (if IndexedDB unavailable)
 * 3. Error: Storage unavailable (rare)
 *
 * @example
 * const repo = new IndexedDbGameStateRepository();
 * const state = await repo.load('slot_0');
 * await repo.save('slot_0', newGameState);
 * await repo.delete('slot_1'); // Clear slot
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
            const db = getIndexedDb();
            const data = await db.gameState.get(slotId);
            return data || null;
        } catch (error: any) {
            // Silently handle IndexedDB load errors
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
            // To avoid IndexedDB transaction failures caused by non-serializable values
            // (functions, circular refs, etc.), first create a JSON-safe clone of the state.
            let safeState: any;
            try {
                safeState = JSON.parse(JSON.stringify(state));
            } catch (serErr) {
                // Silently handle serialization errors
                throw serErr;
            }
            const _db = getIndexedDb();
            await _db.gameState.put({ ...safeState, id: slotId });
        } catch (error: any) {
            // Silently handle IndexedDB save errors
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
            const _db = getIndexedDb();
            await _db.gameState.delete(slotId);
        } catch (error: any) {
            // Silently handle IndexedDB delete errors
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
            const _db = getIndexedDb();
            const allStates = await _db.gameState.toArray();
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
        } catch (error: any) {
            // Silently handle IndexedDB listing errors
            throw error;
        }
    }
}
