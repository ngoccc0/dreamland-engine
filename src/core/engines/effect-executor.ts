/**
 * Effect Executor - Executes side effects returned from usecases
 *
 * Implements the infrastructure layer that converts pure side effects (data)
 * into actual game mutations and UI updates.
 *
 * **Architecture:**
 * Usecases return pure {newState, effects[]} tuples.
 * Hooks apply state changes, then call executeEffect() for each side effect.
 * This executor dispatches effects to appropriate handlers (audio, particles, etc).
 *
 * @remarks
 * **Design Pattern (Decision #2):**
 * - Pure usecases generate effects as plain objects
 * - No async/await in usecase layer (pure functions)
 * - Effects execute after state update (in hooks)
 * - Side effects isolated to this executor module
 *
 * **Effect Types Supported:**
 * - Audio: playAudio, stopAudio
 * - Particles: spawnParticles
 * - UI: showNotification, updateUI
 * - State: saveGame
 * - Combat: applyDamage, applyHeal, applyStatus
 * - Narrative: showDialogue, triggerEvent
 * - Animation: triggerAnimation
 */

import type { SideEffect } from '../entities/side-effects';

/**
 * Dependencies needed to execute effects
 *
 * @remarks
 * Injected into executor to decouple from specific implementations.
 * In production: Real audio service, particle engine, save manager.
 * In tests: Mock implementations.
 */
export interface EffectExecutorDeps {
    // Audio effects
    audioService?: {
        play(sound: string, volume?: number, pitch?: number): void;
        stop(sound: string): void;
    };

    // Particle effects
    particleEngine?: {
        spawn(type: string, position: { x: number; y: number }, options?: Record<string, unknown>): void;
    };

    // UI notifications
    notificationService?: {
        show(message: string, duration?: number, type?: 'info' | 'success' | 'warning' | 'error'): void;
    };

    // Game state persistence
    saveManager?: {
        save(timestamp: number, reason?: string): Promise<void>;
    };

    // Event bus for triggering events
    eventBus?: {
        emit(eventName: string, data?: Record<string, unknown>): void;
    };

    // Narrative/dialogue system
    narrativeService?: {
        showDialogue(text: string, speaker?: string, duration?: number): void;
    };

    // Animation system
    animationService?: {
        trigger(entityId: string, animation: string, speed?: number): void;
    };

    // Combat effects
    combatEngine?: {
        applyDamage(targetId: string, amount: number, damageType?: string): void;
        applyHeal(targetId: string, amount: number): void;
        applyStatus(targetId: string, statusType: string, duration: number, stacks?: number): void;
    };

    // Debug logger
    logger?: {
        debug(message: string, data?: unknown): void;
    };
}

/**
 * Execute a single side effect
 *
 * @remarks
 * **Pattern:** Pure dispatch function (effect, deps) → void
 *
 * Each effect type routes to appropriate executor:
 * - `playAudio` → audioService.play()
 * - `spawnParticle` → particleEngine.spawn()
 * - `showNotification` → notificationService.show()
 * - etc
 *
 * Missing dependencies silently skip effect (in production).
 * Logs unhandled effects in debug mode.
 *
 * @param effect - The side effect to execute
 * @param deps - Services to use for execution
 *
 * @example
 * ```typescript
 * const effect = { type: 'playAudio', sound: 'fireball-cast' };
 * executeEffect(effect, { audioService });
 * ```
 */
export function executeEffect(effect: SideEffect, deps: EffectExecutorDeps): void {
    /**
     * Execute side effect
     *
     * @remarks
     * **Logic:**
     * 1. Pattern match on effect.type (discriminated union)
     * 2. Route to appropriate service
     * 3. Handle missing services gracefully
     * 4. Log unhandled effects in development
     */
    switch (effect.type) {
        case 'playAudio': {
            deps.audioService?.play(effect.sound, effect.volume, effect.pitch);
            break;
        }

        case 'spawnParticle': {
            deps.particleEngine?.spawn(effect.particleType, effect.position, {
                duration: effect.duration,
                count: effect.count
            });
            break;
        }

        case 'showNotification': {
            deps.notificationService?.show(
                effect.message,
                effect.duration,
                effect.type_
            );
            break;
        }

        case 'saveGame': {
            deps.saveManager?.save(effect.timestamp, effect.reason);
            break;
        }

        case 'triggerEvent': {
            deps.eventBus?.emit(effect.eventName, effect.data);
            break;
        }

        case 'showDialogue': {
            deps.narrativeService?.showDialogue(
                effect.text,
                effect.speaker,
                effect.duration
            );
            break;
        }

        case 'triggerAnimation': {
            deps.animationService?.trigger(
                effect.entityId,
                effect.animation,
                effect.speed
            );
            break;
        }

        case 'applyDamage': {
            deps.combatEngine?.applyDamage(
                effect.targetId,
                effect.amount,
                effect.damageType
            );
            break;
        }

        case 'applyHeal': {
            deps.combatEngine?.applyHeal(
                effect.targetId,
                effect.amount
            );
            break;
        }

        case 'applyStatus': {
            deps.combatEngine?.applyStatus(
                effect.targetId,
                effect.statusType,
                effect.duration,
                effect.stacks
            );
            break;
        }

        case 'moveCamera': {
            // Camera movement would integrate with game engine
            // For now, just log
            deps.logger?.debug('moveCamera effect', effect);
            break;
        }

        case 'updateUI': {
            // UI updates typically handled by React state
            // This is for cases where UI needs external triggers
            deps.logger?.debug('updateUI effect', effect);
            break;
        }

        case 'logDebug': {
            deps.logger?.debug(effect.message, effect.data);
            break;
        }

        case 'changeWeather': {
            // Weather changes would trigger environmental updates
            deps.logger?.debug('changeWeather effect', effect);
            break;
        }

        case 'completeAchievement': {
            deps.eventBus?.emit('achievement.completed', { achievementId: effect.achievementId });
            break;
        }

        case 'startBattle': {
            deps.eventBus?.emit('battle.started', {
                enemies: effect.enemies,
                location: effect.location,
                environment: effect.environment
            });
            break;
        }

        case 'grantLoot': {
            deps.eventBus?.emit('loot.granted', {
                items: effect.items,
                source: effect.source
            });
            break;
        }

        case 'addExperience': {
            deps.eventBus?.emit('experience.gained', {
                amount: effect.amount,
                type: effect.type_
            });
            break;
        }

        case 'unlockContent': {
            deps.eventBus?.emit('content.unlocked', {
                contentType: effect.contentType,
                contentId: effect.contentId
            });
            break;
        }

        case 'spawnEntity': {
            deps.logger?.debug('spawnEntity effect', effect);
            break;
        }

        case 'despawnEntity': {
            deps.logger?.debug('despawnEntity effect', effect);
            break;
        }

        case 'moveEntity': {
            deps.logger?.debug('moveEntity effect', effect);
            break;
        }

        default: {
            const _exhaustive: never = effect;
            deps.logger?.debug('Unhandled effect type', _exhaustive);
        }
    }
}

/**
 * Execute multiple side effects in sequence
 *
 * @remarks
 * **Pattern:** Execute effects array one-by-one
 *
 * Used by hooks after state update:
 * ```typescript
 * const [newState, effects] = await skillUsecase(state, action);
 * setGameState(newState); // Update React state first
 * executeEffects(effects, { audioService, particleEngine, ... }); // Then effects
 * ```
 *
 * @param effects - Array of side effects to execute
 * @param deps - Services to use for execution
 */
export function executeEffects(effects: SideEffect[], deps: EffectExecutorDeps): void {
    for (const effect of effects) {
        try {
            executeEffect(effect, deps);
        } catch (error) {
            deps.logger?.debug('Effect execution error', { effect, error });
        }
    }
}
