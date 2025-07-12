
// src/infrastructure/persistence/indexed-db.config.ts
import Dexie, { type Table } from 'dexie';
import type { GameState } from '@/lib/game/types';

// Dexie requires an indexable primary key. We'll add `id` to the GameState
// for this purpose when saving, but the core GameState type remains unchanged.
export interface IIndexedDbGameState extends GameState {
  id: string; // Dexie requires a primary key, which will be our slotId
}

class GameDB extends Dexie {
  gameState!: Table<IIndexedDbGameState, string>; // 'gameState' is the store name, string is the key type

  constructor() {
    super("DreamlandEngineDB"); // The name of the IndexedDB database

    this.version(1).stores({
      // '&id' means 'id' is the primary key and is unique.
      // Other fields can be indexed for fast queries if needed.
      gameState: '&id, day, gameTime',
    });
  }
}

export const db = new GameDB();
