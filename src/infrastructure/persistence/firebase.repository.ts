import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase-config";
import type { IGameStateRepository } from "@/lib/game/ports/game-state.repository";
import type { GameState } from "@/lib/game/types";

export class FirebaseGameStateRepository implements IGameStateRepository {
    private readonly basePath: string;

    constructor(userId: string) {
        if (!db) {
            throw new Error("Firestore is not initialized. Cannot use FirebaseGameStateRepository.");
        }
        this.basePath = `users/${userId}/games`;
    }

    async load(slotId: string): Promise<GameState | null> {
        if (!db) return null;
        try {
            const docRef = doc(db, this.basePath, slotId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data() as GameState;
            }
            return null;
        } catch (error) {
            console.error("Error loading game state from Firebase:", error);
            throw error;
        }
    }

    async save(slotId: string, state: GameState): Promise<void> {
        if (!db) return;
        try {
            const docRef = doc(db, this.basePath, slotId);
            await setDoc(docRef, state);
        } catch (error) {
            console.error("Error saving game state to Firebase:", error);
            throw error;
        }
    }

    async delete(slotId: string): Promise<void> {
        if (!db) return;
        try {
            const docRef = doc(db, this.basePath, slotId);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting game state from Firebase:", error);
            throw error;
        }
    }

    async listSaveSummaries(): Promise<Array<Pick<GameState, 'worldSetup' | 'day' | 'gameTime' | 'playerStats'> | null>> {
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
        } catch (error) {
            console.error("Error listing save summaries from Firebase:", error);
            throw error;
        }
    }
}

    