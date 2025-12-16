/**
 * Game Side Effects - Tagged Union for All Non-Pure Operations
 *
 * These represent all side effects that usecases produce. Usecases are pure
 * and return {newState, effects[]} tuples. Hooks then execute effects.
 *
 * **Design Pattern (Decision #2):**
 * - Side effects as tagged unions (discriminated by `type`)
 * - Plain objects, no classes (serializable, debuggable)
 * - No function calls in effects (data only)
 * - Handlers in infrastructure/hooks layer execute effects
 *
 * @example
 * ```typescript
 * const [newState, effects] = craftItemUsecase(state, action);
 *
 * // Effects might be:
 * [
 *   { type: 'playAudio', sound: 'craft-success' },
 *   { type: 'saveGame', timestamp: Date.now() },
 *   { type: 'showNotification', message: 'Crafted Iron Sword!' }
 * ]
 *
 * // Hooks execute each effect
 * effects.forEach(effect => {
 *   if (effect.type === 'playAudio') audioService.play(effect.sound);
 *   if (effect.type === 'saveGame') saveManager.save(effect.timestamp);
 *   // etc
 * })
 * ```
 */

/**
 * Audio effect - Play a sound
 */
export interface AudioEffect {
    type: 'playAudio';
    sound: string; // Sound ID from audio/assets.ts
    volume?: number; // 0-1, default 0.5
    pitch?: number; // 0.5-2.0, default 1.0
    loop?: boolean; // Default false
}

/**
 * Particle effect - Show visual particles
 */
export interface ParticleEffect {
    type: 'spawnParticle';
    particleType: string; // e.g., 'leaf_fall', 'water_splash', 'magic_burst'
    position: { x: number; y: number };
    duration?: number; // Milliseconds, default 1000
    count?: number; // Number of particles, default 1
}

/**
 * Notification effect - Show UI notification
 */
export interface NotificationEffect {
    type: 'showNotification';
    message: string;
    duration?: number; // Milliseconds, default 3000
    type_?: 'info' | 'success' | 'warning' | 'error'; // Avoid conflict with 'type'
}

/**
 * Save game effect - Persist state to storage
 */
export interface SaveGameEffect {
    type: 'saveGame';
    timestamp: number;
    reason?: string; // e.g., 'auto-save', 'manual', 'crash-recovery'
}

/**
 * Camera effect - Move camera in world
 */
export interface CameraEffect {
    type: 'moveCamera';
    targetX: number;
    targetY: number;
    duration?: number; // Milliseconds for smooth pan
    easing?: 'linear' | 'easeInOut' | 'easeIn' | 'easeOut';
}

/**
 * Animation effect - Trigger animation on entity
 */
export interface AnimationEffect {
    type: 'triggerAnimation';
    entityId: string;
    animation: string; // Animation name (e.g., 'attack', 'hurt', 'die')
    speed?: number; // Animation speed multiplier, default 1.0
}

/**
 * Dialogue effect - Display dialogue/narrative text
 */
export interface DialogueEffect {
    type: 'showDialogue';
    text: string;
    speaker?: string; // NPC name or 'system'
    duration?: number; // Milliseconds, default 3000
    choices?: Array<{ text: string; action: string }>; // For branching dialogue
}

/**
 * Damage apply effect - Reduce health (visual/audio feedback)
 */
export interface ApplyDamageEffect {
    type: 'applyDamage';
    targetId: string;
    amount: number;
    damageType?: 'physical' | 'magical' | 'fire' | 'cold' | 'poison';
}

/**
 * Healing apply effect - Restore health (visual/audio feedback)
 */
export interface ApplyHealEffect {
    type: 'applyHeal';
    targetId: string;
    amount: number;
    source?: string; // What caused the heal (skill, item, etc)
}

/**
 * Status effect application - Add buff/debuff to entity
 */
export interface ApplyStatusEffect {
    type: 'applyStatus';
    targetId: string;
    statusType: string; // e.g., 'poison', 'slow', 'regenerate'
    duration: number; // Ticks
    stacks?: number;
}

/**
 * Spawn entity effect - Create new creature/object in world
 */
export interface SpawnEntityEffect {
    type: 'spawnEntity';
    entityType: string; // 'creature', 'item', 'structure', etc
    position: { x: number; y: number };
    entityData: Record<string, unknown>; // Creature/item definition
}

/**
 * Despawn entity effect - Remove entity from world
 */
export interface DespawnEntityEffect {
    type: 'despawnEntity';
    entityId: string;
}

/**
 * Move entity effect - Change position of entity
 */
export interface MoveEntityEffect {
    type: 'moveEntity';
    entityId: string;
    toX: number;
    toY: number;
    duration?: number; // Milliseconds for animation
}

/**
 * Trigger event effect - Fire game event (for event bus)
 */
export interface TriggerEventEffect {
    type: 'triggerEvent';
    eventName: string; // e.g., 'creature.died', 'player.leveled-up'
    data?: Record<string, unknown>;
}

/**
 * Update UI effect - Refresh UI state
 */
export interface UpdateUIEffect {
    type: 'updateUI';
    component: string; // e.g., 'inventory', 'health-bar', 'minimap'
    data?: Record<string, unknown>;
}

/**
 * Log debug effect - Write to debug log (dev only)
 */
export interface LogDebugEffect {
    type: 'logDebug';
    message: string;
    data?: Record<string, unknown>;
}

/**
 * Weather change effect - Update environmental conditions
 */
export interface ChangeWeatherEffect {
    type: 'changeWeather';
    weatherType: string; // e.g., 'sunny', 'rainy', 'stormy'
    duration?: number; // Ticks
}

/**
 * Complete achievement effect - Award player achievement
 */
export interface CompleteAchievementEffect {
    type: 'completeAchievement';
    achievementId: string;
}

/**
 * Start battle effect - Initiate combat
 */
export interface StartBattleEffect {
    type: 'startBattle';
    enemies: Array<{ id: string; type: string }>;
    location?: string;
    environment?: Record<string, unknown>;
}

/**
 * Grant loot effect - Give items to player
 */
export interface GrantLootEffect {
    type: 'grantLoot';
    items: Array<{ id: string; quantity: number }>;
    source?: string; // What dropped the loot
}

/**
 * Add experience effect - Award exp points
 */
export interface AddExperienceEffect {
    type: 'addExperience';
    amount: number;
    type_?: string; // 'combat', 'exploration', 'crafting', etc
}

/**
 * Unlock content effect - Reveal new game content
 */
export interface UnlockContentEffect {
    type: 'unlockContent';
    contentType: string; // 'area', 'skill', 'recipe', 'npc'
    contentId: string;
}

/**
 * **UNION TYPE: All possible side effects**
 *
 * Use discriminated pattern:
 * ```typescript
 * effects.forEach(effect => {
 *   switch(effect.type) {
 *     case 'playAudio': audioService.play(effect.sound); break;
 *     case 'spawnParticle': particles.spawn(effect.particleType, effect.position); break;
 *     // ... handle all cases
 *   }
 * })
 * ```
 */
export type SideEffect =
    | AudioEffect
    | ParticleEffect
    | NotificationEffect
    | SaveGameEffect
    | CameraEffect
    | AnimationEffect
    | DialogueEffect
    | ApplyDamageEffect
    | ApplyHealEffect
    | ApplyStatusEffect
    | SpawnEntityEffect
    | DespawnEntityEffect
    | MoveEntityEffect
    | TriggerEventEffect
    | UpdateUIEffect
    | LogDebugEffect
    | ChangeWeatherEffect
    | CompleteAchievementEffect
    | StartBattleEffect
    | GrantLootEffect
    | AddExperienceEffect
    | UnlockContentEffect;

/**
 * Type guard for effect type checking
 *
 * @example
 * ```typescript
 * if (isEffectType(effect, 'playAudio')) {
 *   audioService.play(effect.sound);
 * }
 * ```
 */
export function isEffectType<T extends SideEffect['type']>(
    effect: SideEffect,
    type: T
): effect is Extract<SideEffect, { type: T }> {
    return effect.type === type;
}

/**
 * Empty effects array - useful for usecases with no side effects
 */
export const NO_EFFECTS: SideEffect[] = [];
