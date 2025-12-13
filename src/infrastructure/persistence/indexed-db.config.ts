
// src/infrastructure/persistence/indexed-db.config.ts
import Dexie, { type Table } from 'dexie';
import type { GameState } from '@/core/types/game';

/**
 * Extended GameState for IndexedDB storage.
 *
 * @remarks
 * Adds `id` field required by Dexie (IndexedDB wrapper).
 * The core GameState type is unchanged - `id` is only used for storage.
 * When saving: GameState slotId becomes IIndexedDbGameState.id
 * When loading: IIndexedDbGameState.id ignored, slotId passed separately
 */
export interface IIndexedDbGameState extends GameState {
  id: string; // Dexie requires a primary key, which will be our slotId
}

/**
 * Dexie wrapper for Dreamland Engine IndexedDB database.
 *
 * @remarks
 * Provides type-safe access to game state storage.
 * Schema version 1: gameState table with id (primary), day, gameTime (indexes).
 */
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
 * Returns singleton IndexedDB instance (lazy-initialized).
 *
 * @remarks
 * Lazily creates GameDB on first call to avoid synchronous IndexedDB
 * work during module import (which can block main thread).
 * Safe to call multiple times (returns cached instance).
 *
 * @returns Dexie database instance for game state operations
 *
 * @example
 * const db = getIndexedDb();
 * const state = await db.gameState.get('slot_0');
 */
export function getIndexedDb(): GameDB {
  if (!_dbInstance) {
    _dbInstance = new GameDB();
  }
  return _dbInstance;
}
