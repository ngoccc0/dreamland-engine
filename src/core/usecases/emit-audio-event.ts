/**
 * @overview
 * Pure usecase for dispatching audio events with filtering and context resolution.
 * Core logic: receives audio action request, applies playback mode filtering,
 * resolves SFX files from registry, returns normalized audio event payload (or null if filtered).
 *
 * @example
 * ```typescript
 * const event = emitAudioEvent(
 *   AudioActionType.PLAYER_MOVE,
 *   { biome: 'forest' },
 *   'always'
 * );
 * if (event) {
 *   console.log(event.sfxFiles); // ['digital_footstep_grass_2.wav']
 * }
 * ```
 */

import {
    AudioActionType,
    AudioEventContext,
    AudioEventPayload,
    AUDIO_EVENTS_REGISTRY,
    isCriticalAudioEvent,
    getPriorityForAction,
} from '@/core/data/audio-events';

/**
 * Dispatch an audio event, applying playback mode filtering and context resolution.
 * Pure function with no side effects (except calling registry mappers).
 * Returns normalized AudioEventPayload or null if the event is filtered.
 *
 * Playback Mode Filtering Logic:
 * - 'off': All events filtered (return null)
 * - 'occasional': Only critical events play + 50% chance for others
 * - 'always': All events play
 *
 * @param actionType - The action that triggered audio (must exist in AUDIO_EVENTS_REGISTRY)
 * @param context - Optional metadata for context-aware SFX selection (biome, rarity, etc.)
 * @param playbackMode - Audio playback preference: 'off' (silent), 'occasional' (50% events), 'always' (all)
 * @returns AudioEventPayload if event should play, or null if filtered
 *
 * @example
 * ```typescript
 * // Craft success (critical event): always plays
 * emitAudioEvent(AudioActionType.CRAFT_SUCCESS, {}, 'occasional')
 * // → { actionType: 'CRAFT_SUCCESS', sfxFiles: [...], priority: 'high' }
 *
 * // Player move (low priority): filtered in occasional mode (50% chance)
 * emitAudioEvent(AudioActionType.PLAYER_MOVE, { biome: 'forest' }, 'occasional')
 * // → { ... } (50% chance) or null (50% chance)
 *
 * // Playback off: nothing plays
 * emitAudioEvent(AudioActionType.PLAYER_ATTACK, {}, 'off')
 * // → null
 * ```
 */
export function emitAudioEvent(
    actionType: AudioActionType,
    context: AudioEventContext = {},
    playbackMode: 'off' | 'occasional' | 'always'
): AudioEventPayload | null {
    // Step 1: Apply playback mode filtering
    if (playbackMode === 'off') {
        // All events are suppressed in 'off' mode
        return null;
    }

    if (playbackMode === 'occasional') {
        // Critical events always play; others have 50% chance
        const critical = isCriticalAudioEvent(actionType);
        if (!critical && Math.random() > 0.5) {
            // Non-critical event filtered by dice roll (50% drop)
            return null;
        }
    }

    // Step 2: Resolve SFX files from registry
    const mapper = AUDIO_EVENTS_REGISTRY[actionType];
    if (!mapper) {
        // Action type not mapped; skip silently
        return null;
    }

    // Call mapper with context to resolve SFX file(s)
    let sfxResult: string | string[] | null;
    try {
        sfxResult = mapper(context);
    } catch (err) {
        // Silently handle SFX resolution errors
        return null;
    }

    // Handle null result (e.g., if mapper decides to skip)
    if (sfxResult === null) {
        return null;
    }

    // Normalize to array
    const sfxFiles = Array.isArray(sfxResult) ? sfxResult : [sfxResult];

    // Filter out empty/invalid entries
    const validSfxFiles = sfxFiles.filter(
        (f) => f && typeof f === 'string' && f.length > 0
    );
    if (validSfxFiles.length === 0) {
        // No valid SFX files resolved; skip silently
        return null;
    }

    // Step 3: Determine priority
    const priority = getPriorityForAction(actionType);

    // Step 4: Build and return event payload
    const payload: AudioEventPayload = {
        actionType,
        sfxFiles: validSfxFiles,
        context,
        priority,
    };

    return payload;
}

/**
 * Batch emit multiple audio events.
 * Useful for simultaneous actions (e.g., multi-hit combo).
 * Events are returned in order of priority (high, medium, low).
 *
 * @param events - Array of [actionType, context] tuples
 * @param playbackMode - Audio playback preference
 * @returns Array of non-filtered AudioEventPayload objects, sorted by priority (descending)
 *
 * @example
 * ```typescript
 * const events = emitAudioEventBatch(
 *   [
 *     [AudioActionType.PLAYER_ATTACK, {}],
 *     [AudioActionType.ENEMY_HIT, {}],
 *     [AudioActionType.PLAYER_MOVE, { biome: 'forest' }],
 *   ],
 *   'always'
 * );
 * // Returns: [PLAYER_ATTACK (high), ENEMY_HIT (medium), PLAYER_MOVE (low)]
 * ```
 */
export function emitAudioEventBatch(
    events: Array<[AudioActionType, AudioEventContext?]>,
    playbackMode: 'off' | 'occasional' | 'always'
): AudioEventPayload[] {
    const payloads = events
        .map(([actionType, context]) => emitAudioEvent(actionType, context, playbackMode))
        .filter((p) => p !== null) as AudioEventPayload[];

    // Sort by priority: high → medium → low
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    payloads.sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    return payloads;
}

/**
 * Helper: Check if an audio event is likely to play in a given playback mode.
 * Useful for UI state predictions or analytics.
 * Note: For 'occasional' mode, returns true if event is critical or has >50% chance.
 *
 * @param actionType - The action type to check
 * @param playbackMode - Current playback mode
 * @returns true if the action will likely produce audio
 */
export function willAudioEventPlay(
    actionType: AudioActionType,
    playbackMode: 'off' | 'occasional' | 'always'
): boolean {
    if (playbackMode === 'off') return false;
    if (playbackMode === 'always') return true;
    // 'occasional': critical events play, others are 50/50
    if (playbackMode === 'occasional') {
        return isCriticalAudioEvent(actionType);
    }
    return false;
}
