/**
 * Persistence Layer Facade
 *
 * @remarks
 * This module provides a centralized factory for creating game state repositories.
 * It abstracts the implementation details (Firebase, IndexedDB, localStorage) from
 * the application layer, enforcing the Dependency Inversion Principle.
 *
 * All consumers (hooks, usecases) should depend on IGameStateRepository interface,
 * not concrete implementations.
 *
 * Usage:
 * ```typescript
 * import { createGameStateRepository, type IGameStateRepository } from '@/infrastructure/persistence';
 *
 * // Create repository based on auth state
 * const repository = createGameStateRepository({
 *   userId: user.id,
 *   preferOffline: false,
 * });
 *
 * // Use through interface
 * const gameState = await repository.load('slot_0');
 * ```
 */

import type { IGameStateRepository } from '@/lib/game/ports/game-state.repository';
import { FirebaseGameStateRepository } from './firebase.repository';
import { LocalStorageGameStateRepository } from './local-storage.repository';
import { IndexedDbGameStateRepository } from './indexed-db.repository';

/**
 * Configuration options for repository creation
 */
export interface RepositoryConfig {
  /** User ID for cloud-based persistence (Firebase). If null, uses local storage. */
  userId: string | null;
  /** Prefer offline storage even if userId is available */
  preferOffline?: boolean;
  /** Force specific storage backend (for testing) */
  forceBackend?: 'firebase' | 'indexeddb' | 'localstorage';
}

/**
 * Factory function to create a game state repository
 *
 * @param config - Repository configuration
 * @returns IGameStateRepository implementation appropriate for the environment
 *
 * @remarks
 * Selection logic:
 * 1. If forceBackend is set, use that backend (testing)
 * 2. If userId provided and preferOffline=false, use Firebase
 * 3. If no userId or preferOffline=true, use IndexedDB (preferred) or localStorage (fallback)
 *
 * @example
 * // Cloud-based (authenticated user)
 * const cloudRepo = createGameStateRepository({ userId: 'user123' });
 *
 * // Local offline (anonymous user)
 * const offlineRepo = createGameStateRepository({ userId: null });
 *
 * // Force specific backend (testing)
 * const testRepo = createGameStateRepository({
 *   userId: 'test',
 *   forceBackend: 'localstorage'
 * });
 */
export function createGameStateRepository(config: RepositoryConfig): IGameStateRepository {
  // Force specific backend (testing/debugging)
  if (config.forceBackend === 'firebase' && config.userId) {
    return new FirebaseGameStateRepository(config.userId);
  }
  if (config.forceBackend === 'indexeddb') {
    return new IndexedDbGameStateRepository();
  }
  if (config.forceBackend === 'localstorage') {
    return new LocalStorageGameStateRepository();
  }

  // Production logic: Cloud first, then local
  if (config.userId && !config.preferOffline) {
    return new FirebaseGameStateRepository(config.userId);
  }

  // Offline: Try IndexedDB first (better performance), fallback to localStorage
  try {
    // IndexedDB is available in most environments
    return new IndexedDbGameStateRepository();
  } catch {
    // Fallback to localStorage if IndexedDB is unavailable
    return new LocalStorageGameStateRepository();
  }
}

/**
 * Re-export interface for type-safe dependency injection
 */
export type { IGameStateRepository } from '@/lib/game/ports/game-state.repository';
