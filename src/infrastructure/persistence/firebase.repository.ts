import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, limit } from "firebase/firestore";
import type { Firestore } from 'firebase/firestore'
import { getDb } from "@/lib/core/firebase-config";
import type { IGameStateRepository } from "@/lib/game/ports/game-state.repository";
import type { GameState } from "@/core/types/game";

/**
 * Firebase Firestore game state repository - cloud-based persistence.
 *
 * @remarks
 * Implements IGameStateRepository using Firebase Firestore for multi-device sync.
 * Allows authenticated users to save/load game state across devices securely.
 *
 * **Key Features:**
 * - Cloud synchronization: Player progress syncs across devices
 * - User isolation: Each user's saves stored under their UID
 * - Lazy initialization: Firestore connection created on first use
 * - Error handling: Gracefully handles network failures
 *
 * **Storage Structure:**
 * ```
 * users/{userId}/games/{slotId} → GameState document
 * ```
 *
 * **Online-Only:** Requires internet connection and Firebase Auth.
 * For offline mode, use IndexedDbGameStateRepository instead.
 *
 * @param userId - Unique identifier for authenticated Firebase user
 *
 * @example
 * const repo = new FirebaseGameStateRepository(user.uid);
 * const state = await repo.load('slot_0');
 * await repo.save('slot_0', newGameState);
 */
export class FirebaseGameStateRepository implements IGameStateRepository {
    private readonly basePath: string;

    constructor(userId: string) {
        // Do not access Firestore at construction time. Methods will lazily
        // obtain the DB instance to avoid forcing firebase module load on import.
        this.basePath = `users/${userId}/games`;
    }

    /**
     * Loads the full game state for a specific slot from Firestore.
     * @param {string} slotId - The identifier for the save slot (e.g., 'slot_0').
     * @returns {Promise<GameState | null>} A promise that resolves to the GameState object or null if not found.
     */
    async load(slotId: string): Promise<GameState | null> {
        const db = await getDb();
        if (!db) return null;
        try {
            const docRef = doc(db, this.basePath, slotId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data() as GameState;
            }
            return null;
        } catch (error: any) {
            // Silently handle Firebase load errors
            throw error;
        }
    }

    /**
     * Saves the entire game state to a specific slot in Firestore.
     * @param {string} slotId - The identifier for the save slot.
     * @param {GameState} state - The complete GameState object to save.
     * @returns {Promise<void>} A promise that resolves when the save is complete.
     */
    async save(slotId: string, state: GameState): Promise<void> {
        const db = await getDb();
        if (!db) return;
        try {
            const docRef = doc(db, this.basePath, slotId);
            await setDoc(docRef, state);
        } catch (error: any) {
            // Silently handle Firebase save errors
            throw error;
        }
    }

    /**
     * Deletes the game state for a specific slot from Firestore.
     * @param {string} slotId - The identifier for the save slot to delete.
     * @returns {Promise<void>} A promise that resolves when the deletion is complete.
     */
    async delete(slotId: string): Promise<void> {
        const db = await getDb();
        if (!db) return;
        try {
            const docRef = doc(db, this.basePath, slotId);
            await deleteDoc(docRef);
        } catch (error: any) {
            // Silently handle Firebase delete errors
            throw error;
        }
    }

    /**
     * Retrieves a summary of all available save slots from Firestore for the current user.
     * This is used for the main menu screen to show which slots are occupied.
     * @returns {Promise<Array<Pick<GameState, 'worldSetup' | 'day' | 'gameTime' | 'playerStats'> | null>>} A promise that resolves to an array of up to 3 save slot summaries.
     */
    async listSaveSummaries(): Promise<Array<Pick<GameState, 'worldSetup' | 'day' | 'gameTime' | 'playerStats'> | null>> {
        const db = await getDb();
        if (!db) return [null, null, null];
        try {
            const slots: Array<Pick<GameState, 'worldSetup' | 'day' | 'gameTime' | 'playerStats'> | null> = [null, null, null];
            const q = query(collection(db, this.basePath), limit(3));
            const querySnapshot = await getDocs(q);

            querySnapshot.forEach(docSnap => {
                const docId = docSnap.id; // e.g., "slot_0"
                const slotIndex = parseInt(docId.split('_')[1], 10);
                if (slotIndex >= 0 && slotIndex < 3) {
                    const data = docSnap.data() as GameState;
                    slots[slotIndex] = {
                        worldSetup: data.worldSetup,
                        day: data.day,
                        gameTime: data.gameTime,
                        playerStats: data.playerStats
                    };
                }
            });
            return slots;
        } catch (error: any) {
            // Silently handle Firebase listing errors
            throw error;
        }
    }
}


