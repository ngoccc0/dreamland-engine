/**
 * @file src/core/events/GameEvents.ts
 * @description Global, type-safe event bus for cross-system communication
 *
 * @remarks
 * Decouples core game logic from React UI layer by providing a centralized
 * event emitter. Enables multiple independent listeners (UI overlay, audio, particles)
 * to react to same event without coupling.
 *
 * **Usage Pattern:**
 * ```typescript
 * // Core logic (rules/usecases) emits event
 * GameEvents.emit('LEVEL_UP', { character: player, newLevel: 6 })
 *
 * // UI components subscribe independently
 * useGlobalEvents('LEVEL_UP', (payload) => showLevelUpOverlay(payload))
 * ```
 *
 * **Memory Safety:**
 * Each subscribe() returns unsubscribe function. Use with useEffect cleanup
 * to prevent memory leaks and "zombie listeners" in React Strict Mode.
 */

export type EventType =
  | 'LEVEL_UP'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'CREATURE_DIED'
  | 'CREATURE_SPAWNED'
  | 'QUEST_STARTED'
  | 'QUEST_COMPLETED'
  | 'ITEM_CRAFTED'
  | 'ITEM_ACQUIRED'
  | 'GAME_PAUSED'
  | 'GAME_RESUMED'
  | 'COMBAT_START'
  | 'COMBAT_END'
  | 'NARRATIVE_IMPORTANT'
  | 'NARRATIVE_TRIVIAL';

export interface GameEventPayloads {
  LEVEL_UP: {
    character: { id: string; name: string };
    newLevel: number;
    statBonus: {
      maxHealth: number;
      skillPoints: number;
      statPoints: number;
    };
  };
  ACHIEVEMENT_UNLOCKED: {
    id: string;
    name: string;
    description: string;
  };
  CREATURE_DIED: {
    creatureId: string;
    creatureName: string;
    killedBy: string;
  };
  CREATURE_SPAWNED: {
    creatureId: string;
    creatureName: string;
    x: number;
    y: number;
  };
  QUEST_STARTED: {
    questId: string;
    questName: string;
  };
  QUEST_COMPLETED: {
    questId: string;
    questName: string;
    reward: { xp: number; items: string[] };
  };
  ITEM_CRAFTED: {
    itemId: string;
    itemName: string;
    quantity: number;
  };
  ITEM_ACQUIRED: {
    itemId: string;
    itemName: string;
    quantity: number;
  };
  GAME_PAUSED: {
    reason: string;
  };
  GAME_RESUMED: {
    reason: string;
  };
  COMBAT_START: {
    player: { id: string; name: string };
    enemy: { id: string; name: string };
  };
  COMBAT_END: {
    winner: string;
    loser: string;
    reward: { xp: number };
  };
  NARRATIVE_IMPORTANT: {
    text: string;
    type: string;
  };
  NARRATIVE_TRIVIAL: {
    text: string;
    type: string;
  };
}

type EventCallback<T extends EventType> = (
  payload: GameEventPayloads[T],
) => void | Promise<void>;

/**
 * Global event emitter for game events.
 *
 * @remarks
 * Singleton instance. All subscribers share same event bus.
 * Use with caution in tests—consider creating new instances for test isolation.
 */
class EventEmitter {
  private subscribers: Map<EventType, Set<EventCallback<any>>> = new Map();

  /**
   * Subscribe to an event type.
   *
   * @param eventType - Type of event to listen for
   * @param callback - Function to call when event emitted
   * @returns Unsubscribe function (call to remove listener)
   *
   * @remarks
   * Must be used in useEffect cleanup to prevent memory leaks:
   * ```typescript
   * useEffect(() => {
   *   const unsubscribe = GameEvents.subscribe('LEVEL_UP', handler)
   *   return unsubscribe  // Cleanup
   * }, [])
   * ```
   */
  public subscribe<T extends EventType>(
    eventType: T,
    callback: EventCallback<T>,
  ): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }

    const callbacks = this.subscribers.get(eventType)!;
    callbacks.add(callback);

    // Return unsubscribe function
    return () => {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subscribers.delete(eventType);
      }
    };
  }

  /**
   * Unsubscribe a specific callback from an event type.
   *
   * @param eventType - Type of event
   * @param callback - Callback to remove
   *
   * @remarks
   * Less common than using returned unsubscribe function.
   * Prefer pattern: `const unsub = subscribe(...); return unsub;`
   */
  public unsubscribe<T extends EventType>(
    eventType: T,
    callback: EventCallback<T>,
  ): void {
    const callbacks = this.subscribers.get(eventType);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subscribers.delete(eventType);
      }
    }
  }

  /**
   * Emit an event to all subscribers.
   *
   * @param eventType - Type of event to emit
   * @param payload - Data to pass to subscribers
   *
   * @remarks
   * Callbacks execute synchronously. If a callback throws,
   * subsequent callbacks will not execute (fail-fast behavior).
   * Consider wrapping callbacks in try-catch if needed.
   */
  public emit<T extends EventType>(
    eventType: T,
    payload: GameEventPayloads[T],
  ): void {
    const callbacks = this.subscribers.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error(
            `Error in ${eventType} subscriber:`,
            error,
          );
        }
      });
    }
  }

  /**
   * Get subscriber count for an event type (for debugging/testing).
   *
   * @param eventType - Event type to check
   * @returns Number of active subscribers
   */
  public getSubscriberCount(eventType: EventType): number {
    return this.subscribers.get(eventType)?.size ?? 0;
  }

  /**
   * Clear all subscribers (for testing/reset).
   *
   * @remarks
   * Use sparingly. Mainly for test cleanup.
   */
  public clear(): void {
    this.subscribers.clear();
  }
}

/**
 * Global singleton instance of event emitter.
 * @remarks
 * All game events go through this instance.
 */
export const GameEvents = new EventEmitter();
