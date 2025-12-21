/**
 * @fileoverview Unit tests for audio event dispatcher system
 * @description Tests emitAudioEvent, biome footsteps, playback mode filtering, and action-to-SFX mapping
 */

import { emitAudioEvent } from '@/core/usecases/emit-audio-event';
import { AudioActionType, isCriticalAudioEvent } from '@/core/data/audio-events';
import { getFootstepForBiome, getTerrainCategory } from '@/lib/audio/biome-footsteps';

describe('Audio Event Dispatcher System', () => {
    describe('emitAudioEvent - Playback Mode Filtering', () => {
        it('should return null when playback mode is "off"', () => {
            const result = emitAudioEvent(AudioActionType.PLAYER_MOVE, {}, 'off');
            expect(result).toBeNull();
        });

        it('should always play critical events even in "occasional" mode', () => {
            // ENEMY_DEFEATED is a critical event
            const result = emitAudioEvent(AudioActionType.ENEMY_DEFEATED, {}, 'occasional');
            expect(result).not.toBeNull();
            expect(result?.actionType).toBe(AudioActionType.ENEMY_DEFEATED);
        });

        it('should play all events in "always" mode', () => {
            const result = emitAudioEvent(AudioActionType.PLAYER_MOVE, {}, 'always');
            expect(result).not.toBeNull();
            expect(result?.actionType).toBe(AudioActionType.PLAYER_MOVE);
        });

        it('should occasionally filter non-critical events in "occasional" mode (~50% chance)', () => {
            // Run many times and verify approximately 50% play
            let playedCount = 0;
            const trials = 100;

            for (let i = 0; i < trials; i++) {
                const result = emitAudioEvent(AudioActionType.PLAYER_MOVE, {}, 'occasional');
                if (result !== null) playedCount++;
            }

            // Should be roughly 50% (allowing 20-80% variance for randomness)
            const percentage = (playedCount / trials) * 100;
            expect(percentage).toBeGreaterThan(20);
            expect(percentage).toBeLessThan(80);
        });
    });

    describe('emitAudioEvent - Context Resolution', () => {
        it('should include context in payload', () => {
            const context: Parameters<typeof emitAudioEvent>[1] = { itemRarity: 'epic', biome: 'forest' };
            const result = emitAudioEvent(AudioActionType.ITEM_PICKUP, context, 'always');

            expect(result).not.toBeNull();
            expect(result?.context).toEqual(context);
        });

        it('should resolve SFX for action type', () => {
            const result = emitAudioEvent(AudioActionType.PLAYER_ATTACK, {}, 'always');

            expect(result).not.toBeNull();
            expect(result?.sfxFiles).toBeDefined();
            expect(Array.isArray(result?.sfxFiles) || typeof result?.sfxFiles === 'string').toBe(true);
        });
    });

    describe('Biome Footsteps - Terrain Mapping', () => {
        it('should map known biomes to terrain categories', () => {
            expect(getTerrainCategory('forest')).toBe('grass');
            expect(getTerrainCategory('tundra')).toBe('snow');
            expect(getTerrainCategory('cave')).toBe('gravel');
            expect(getTerrainCategory('wall')).toBe('wood');
        });

        it('should return undefined for unknown biomes', () => {
            expect(getTerrainCategory('unknown_biome')).toBeUndefined();
        });

        it('should return valid footstep SFX for registered biomes', () => {
            const footsteps = getFootstepForBiome('forest');
            expect(Array.isArray(footsteps)).toBe(true);
            expect(footsteps.length).toBe(3);
            footsteps.forEach(step => {
                expect(typeof step).toBe('string');
                // Biome-specific footsteps use .wav, generic fallback uses .flac
                const isValidFile = step.endsWith('.wav') || step.endsWith('.flac');
                expect(isValidFile).toBe(true);
            });
        });

        it('should return generic footstep fallback for unregistered biomes', () => {
            const footsteps = getFootstepForBiome('unknown_biome');
            expect(Array.isArray(footsteps)).toBe(true);
            expect(footsteps.length).toBe(3);
            footsteps.forEach(step => {
                expect(typeof step).toBe('string');
                expect(step.endsWith('.flac')).toBe(true);
            });
        });
    });

    describe('Critical Event Detection', () => {
        it('should identify critical events', () => {
            // Test known critical events
            expect(isCriticalAudioEvent(AudioActionType.ENEMY_DEFEATED)).toBe(true);
            expect(isCriticalAudioEvent(AudioActionType.CRAFT_SUCCESS)).toBe(true);
            expect(isCriticalAudioEvent(AudioActionType.BUILD_SUCCESS)).toBe(true);
        });

        it('should identify non-critical events', () => {
            expect(isCriticalAudioEvent(AudioActionType.PLAYER_MOVE)).toBe(false);
            expect(isCriticalAudioEvent(AudioActionType.UI_BUTTON_CLICK)).toBe(false);
        });
    });

    describe('Audio Event Payload Structure', () => {
        it('should provide complete payload with all required fields', () => {
            const result = emitAudioEvent(AudioActionType.CRAFT_SUCCESS, { success: true }, 'always');

            expect(result).toMatchObject({
                actionType: expect.any(String),
                sfxFiles: expect.anything(), // Could be string or array
                context: expect.any(Object),
                priority: expect.any(String),
            });
        });

        it('should include priority level in payload', () => {
            const result = emitAudioEvent(AudioActionType.PLAYER_ATTACK, {}, 'always');

            expect(result).toBeDefined();
            expect(typeof result?.priority).toBe('string');
            expect(['low', 'medium', 'high']).toContain(result?.priority);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty context gracefully', () => {
            const result = emitAudioEvent(AudioActionType.PLAYER_MOVE, {}, 'always');
            expect(result).not.toBeNull();
        });

        it('should handle batch event emission', () => {
            // Test multiple events in succession
            const result1 = emitAudioEvent(AudioActionType.PLAYER_MOVE, {}, 'always');
            const result2 = emitAudioEvent(AudioActionType.PLAYER_ATTACK, {}, 'always');

            expect(result1).not.toBeNull();
            expect(result2).not.toBeNull();
            expect(result1?.actionType).not.toBe(result2?.actionType);
        });

        it('should return consistent results for same action and playback mode "always"', () => {
            const result1 = emitAudioEvent(AudioActionType.HARVEST_COMPLETE, {}, 'always');
            const result2 = emitAudioEvent(AudioActionType.HARVEST_COMPLETE, {}, 'always');

            expect(result1).not.toBeNull();
            expect(result2).not.toBeNull();
            expect(result1?.actionType).toBe(result2?.actionType);
        });
    });

    describe('Action Type Coverage', () => {
        it('should have SFX mapping for all major action types', () => {
            const majorActions = [
                AudioActionType.PLAYER_MOVE,
                AudioActionType.PLAYER_ATTACK,
                AudioActionType.ENEMY_HIT,
                AudioActionType.ITEM_PICKUP,
                AudioActionType.CRAFT_SUCCESS,
                AudioActionType.HARVEST_ITEM,
                AudioActionType.UI_BUTTON_CLICK,
            ];

            majorActions.forEach(action => {
                const result = emitAudioEvent(action, {}, 'always');
                expect(result).not.toBeNull();
                expect(result?.sfxFiles).toBeDefined();
            });
        });
    });
});
