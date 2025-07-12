import type { IGameStateRepository } from '@/lib/game/ports/game-state.repository';
import type { GameState } from '@/lib/game/types';

export class LocalStorageGameStateRepository implements IGameStateRepository {
  private getKey(slotId: string): string {
    return `gameState_${slotId.replace('slot_', '')}`;
  }

  async load(slotId: string): Promise<GameState | null> {
    if (typeof window === 'undefined') return null;
    const key = this.getKey(slotId);
    const data = localStorage.getItem(key);

    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error parsing JSON from localStorage for key "${key}":`, error);
      // Optional: Corrupted data could be removed to prevent future errors
      // localStorage.removeItem(key);
      return null;
    }
  }

  async save(slotId: string, state: GameState): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.getKey(slotId), JSON.stringify(state));
    } catch (error) {
      console.error('Error saving game state to localStorage:', error);
      throw error;
    }
  }

  async delete(slotId: string): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.getKey(slotId));
  }

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
        } catch (error) {
            console.error(`Error loading summary for slot ${i}:`, error);
            summaries[i] = null;
        }
    }
    return summaries;
  }
}
