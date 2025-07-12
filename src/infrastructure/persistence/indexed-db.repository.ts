import type { IGameStateRepository } from '@/lib/game/ports/game-state.repository';
import type { GameState } from '@/lib/game/types';
import { db } from './indexed-db.config';

export class IndexedDbGameStateRepository implements IGameStateRepository {
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

    async save(slotId: string, state: GameState): Promise<void> {
        try {
            // put() will add a new document or update an existing one based on the primary key
            await db.gameState.put({ ...state, id: slotId });
        } catch (error) {
            console.error('Error saving game state to IndexedDB:', error);
            throw error;
        }
    }

    async delete(slotId: string): Promise<void> {
        try {
            await db.gameState.delete(slotId);
        } catch (error) {
            console.error('Error deleting game state from IndexedDB:', error);
            throw error;
        }
    }

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
