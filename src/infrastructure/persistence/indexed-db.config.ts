
// src/infrastructure/persistence/indexed-db.config.ts
import Dexie, { type Table } from 'dexie';
import type { GameState } from '@/core/types/game';

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

let _dbInstance: GameDB | null = null;

/**
 * Lazily create and return the Dexie DB instance so module evaluation won't
 * synchronously run IndexedDB work on import.
 */
export function getIndexedDb(): GameDB {
  if (!_dbInstance) {
    _dbInstance = new GameDB();
  }
  return _dbInstance;
}
