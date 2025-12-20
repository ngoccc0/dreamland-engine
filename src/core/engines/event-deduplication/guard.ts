/**
 * Event Deduplication Guard - Prevent duplicate event processing
 *
 * OVERVIEW: Tracks in-flight events to prevent duplicate stats updates
 * when multiple events fire for the same game state change.
 *
 * ## Edge Case: Race Condition
 *
 * **Scenario:** Player attacks creature in turn 1, creature dies
 *
 * **Without guard:**
 * 1. Event 1: CREATURE_KILLED fired at 12:00:00.000
 * 2. Event 2: CREATURE_KILLED fired at 12:00:00.001 (same kill)
 * 3. Statistics updated twice → creature count inflated
 *
 * **With guard:**
 * 1. Event 1: CREATURE_KILLED fired → recorded in dedup buffer
 * 2. Event 2: CREATURE_KILLED fired → detected as duplicate
 * 3. Statistics updated once → correct count
 *
 * ## Implementation Strategy
 *
 * **Key-based deduplication:**
 * - Generate unique key from event type + target + timestamp window
 * - Store keys in rolling buffer (last N events)
 * - Check before processing
 * - Auto-expire old keys (prevent unbounded growth)
 *
 * **For combat:**
 * - Key: `CREATURE_KILLED:${creatureId}:${roundedTimestamp}`
 * - Window: 100ms (allows legitimate rapid events, blocks duplicates)
 * - Buffer size: 100 keys max
 */

import type { GameEvent } from '@/core/types/events';

/**
 * Configuration for event deduplication
 */
export interface DeduplicationConfig {
    /** Time window (milliseconds) to consider events as duplicates */
    timeWindowMs: number;
    /** Maximum size of deduplication buffer (prevents memory bloat) */
    maxBufferSize: number;
}

/**
 * Default configuration: 100ms window, 100-event buffer
 */
export const DEFAULT_DEDUP_CONFIG: DeduplicationConfig = {
    timeWindowMs: 100,       // Events within 100ms are considered duplicates
    maxBufferSize: 100,      // Keep last 100 event keys
};

/**
 * Event deduplication buffer - tracks recent events
 */
export interface DeduplicationBuffer {
    /** Set of recent event keys (for O(1) lookup) */
    recentKeys: Set<string>;
    /** Timestamp of buffer creation (for expiry) */
    createdAt: number;
}

/**
 * EventDeduplicationGuard: Prevent duplicate event processing
 */
export class EventDeduplicationGuard {
    /**
     * createDeduplicationBuffer
     *
     * Initialize empty deduplication buffer.
     *
     * @remarks
     * Create once at game start, reuse for session lifetime.
     *
     * @returns Fresh deduplication buffer
     */
    static createDeduplicationBuffer(): DeduplicationBuffer {
        return {
            recentKeys: new Set<string>(),
            createdAt: Date.now(),
        };
    }

    /**
     * generateEventKey
     *
     * Create unique key for event to enable deduplication.
     *
     * @remarks
     * **Key format:** `${eventType}:${primaryId}:${timeWindow}`
     *
     * **Logic:**
     * 1. Extract event type (CREATURE_KILLED, ITEM_GATHERED, etc)
     * 2. Extract primary identifier:
     *    - CREATURE_KILLED: creatureId
     *    - ITEM_GATHERED: itemId
     *    - DAMAGE: targetId + creatureId
     * 3. Round timestamp to nearest timeWindow boundary
     * 4. Concatenate into unique key
     *
     * **Example:**
     * - Event: {type: 'CREATURE_KILLED', payload: {creatureId: 'dragon_1', timestamp: 1000}}
     * - timeWindow: 100ms
     * - Key: `CREATURE_KILLED:dragon_1:1000`
     *
     * @param event - Game event to key
     * @param timeWindowMs - Time window for rounding (default 100ms)
     * @returns Unique key string for deduplication
     */
    static generateEventKey(
        event: GameEvent,
        timeWindowMs: number = 100
    ): string {
        const timestamp = event.payload.timestamp ?? Date.now();
        const roundedTime = Math.floor(timestamp / timeWindowMs) * timeWindowMs;

        // Extract primary identifier based on event type
        let primaryId = '';
        switch (event.type) {
            case 'CREATURE_KILLED':
                primaryId = event.payload.creatureId;
                break;
            case 'ITEM_GATHERED':
                primaryId = event.payload.itemId;
                break;
            case 'ITEM_CRAFTED':
                primaryId = event.payload.itemId;
                break;
            case 'DAMAGE':
                // Combine source and target for unique key
                primaryId = `${event.payload.source}:${(event.payload as any).targetId || 'unknown'}`;
                break;
            case 'LEVEL_UP':
                // Level-ups are rare enough, use timestamp only
                primaryId = 'level_up';
                break;
            case 'EXPLORATION':
                primaryId = (event.payload as any).discoveryId || 'discovery';
                break;
            case 'ITEM_EQUIPPED':
                primaryId = (event.payload as any).itemId || 'equipped';
                break;
            case 'QUEST_COMPLETED':
                primaryId = (event.payload as any).questId || 'quest';
                break;
            case 'ACHIEVEMENT_UNLOCKED':
                primaryId = (event.payload as any).achievementId || 'achievement';
                break;
            default:
                // Fallback for unknown event types
                primaryId = 'unknown';
        }

        return `${event.type}:${primaryId}:${roundedTime}`;
    }

    /**
     * isDuplicate
     *
     * Check if event is duplicate based on deduplication buffer.
     *
     * @remarks
     * **Returns:**
     * - true: Event key already seen (is duplicate)
     * - false: Event key new (not seen before)
     *
     * **Uses:**
     * ```typescript
     * if (!EventDeduplicationGuard.isDuplicate(event, buffer, config)) {
     *     // Process event
     *     statistics = StatisticsEngine.processEvent(statistics, event);
     *     // Add to buffer
     *     buffer = EventDeduplicationGuard.recordEvent(event, buffer, config);
     * }
     * ```
     *
     * @param event - Game event to check
     * @param buffer - Current deduplication buffer
     * @param config - Deduplication configuration
     * @returns true if event is duplicate, false if new
     */
    static isDuplicate(
        event: GameEvent,
        buffer: DeduplicationBuffer,
        config: DeduplicationConfig = DEFAULT_DEDUP_CONFIG
    ): boolean {
        const key = this.generateEventKey(event, config.timeWindowMs);
        return buffer.recentKeys.has(key);
    }

    /**
     * recordEvent
     *
     * Add event to deduplication buffer for future duplicate detection.
     *
     * @remarks
     * **Behavior:**
     * 1. Generate key for event
     * 2. Add key to buffer
     * 3. If buffer size exceeds max, clear (LRU strategy)
     * 4. Return updated buffer
     *
     * **Idempotent:** Safe to call even if isDuplicate() already returned true
     *
     * @param event - Event to record
     * @param buffer - Current buffer (unchanged)
     * @param config - Deduplication configuration
     * @returns New buffer with event recorded
     *
     * @example
     * let buffer = createDeduplicationBuffer();
     * const event: GameEvent = { type: 'CREATURE_KILLED', ... };
     * buffer = recordEvent(event, buffer);
     * // Next call to isDuplicate(event, buffer) will return true
     */
    static recordEvent(
        event: GameEvent,
        buffer: DeduplicationBuffer,
        config: DeduplicationConfig = DEFAULT_DEDUP_CONFIG
    ): DeduplicationBuffer {
        const key = this.generateEventKey(event, config.timeWindowMs);

        // Create new set with existing keys + new key
        const newKeys = new Set(buffer.recentKeys);
        newKeys.add(key);

        // If buffer exceeded, clear to prevent unbounded growth
        if (newKeys.size > config.maxBufferSize) {
            newKeys.clear();
            newKeys.add(key);
        }

        return {
            ...buffer,
            recentKeys: newKeys,
        };
    }

    /**
     * clearBuffer
     *
     * Reset deduplication buffer.
     *
     * @remarks
     * **When to call:**
     * - Game restart/new save
     * - Long rest (day/night cycle)
     * - Game over/defeat
     *
     * Safe to call anytime; clears all tracked event keys.
     *
     * @param buffer - Current buffer (unchanged)
     * @returns Fresh buffer
     */
    static clearBuffer(_buffer: DeduplicationBuffer): DeduplicationBuffer {
        return this.createDeduplicationBuffer();
    }
}
