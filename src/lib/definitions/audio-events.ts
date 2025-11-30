/**
 * @overview
 * Centralized audio event system mapping game actions to sound effects.
 * Defines AudioActionType enum, context interfaces, and SFX registry functions.
 * Enables dynamic audio without coupling sound logic to business logic.
 *
 * @example
 * ```typescript
 * const event = emitAudioEvent(
 *   AudioActionType.PLAYER_MOVE,
 *   { biome: 'forest' },
 *   'always'
 * );
 * // Returns: { sfxFiles: ['rustle03.flac', 'rustle15.flac', 'rustle08.flac'], ... }
 * ```
 */

import { getFootstepForBiome } from '../audio/biome-footsteps';

/**
 * All game actions that can emit audio feedback.
 * Organized by category: movement, combat, items, crafting, farming, harvesting, building, environment, UI, skills.
 */
export enum AudioActionType {
    // Movement
    PLAYER_MOVE = 'PLAYER_MOVE',

    // Combat
    PLAYER_ATTACK = 'PLAYER_ATTACK',
    ENEMY_HIT = 'ENEMY_HIT',
    ENEMY_DEFEATED = 'ENEMY_DEFEATED',

    // Items
    ITEM_PICKUP = 'ITEM_PICKUP',
    ITEM_EQUIP_WEAPON = 'ITEM_EQUIP_WEAPON',
    ITEM_EQUIP_ARMOR = 'ITEM_EQUIP_ARMOR',
    ITEM_UNEQUIP = 'ITEM_UNEQUIP',
    ITEM_USE = 'ITEM_USE',
    ITEM_DROP = 'ITEM_DROP',

    // Crafting
    CRAFT_START = 'CRAFT_START',
    CRAFT_SUCCESS = 'CRAFT_SUCCESS',
    CRAFT_FAIL = 'CRAFT_FAIL',

    // Farming
    FARM_TILL = 'FARM_TILL',
    FARM_WATER = 'FARM_WATER',
    FARM_FERTILIZE = 'FARM_FERTILIZE',
    FARM_PLANT = 'FARM_PLANT',

    // Harvesting
    HARVEST_START = 'HARVEST_START',
    HARVEST_ITEM = 'HARVEST_ITEM',
    HARVEST_COMPLETE = 'HARVEST_COMPLETE',

    // Building
    BUILD_CONSTRUCT = 'BUILD_CONSTRUCT',
    BUILD_SUCCESS = 'BUILD_SUCCESS',

    // Environment
    ENVIRONMENT_DOOR_OPEN = 'ENVIRONMENT_DOOR_OPEN',
    ENVIRONMENT_DOOR_CLOSE = 'ENVIRONMENT_DOOR_CLOSE',

    // Rest/Shelter
    REST_ENTER = 'REST_ENTER',
    REST_EXIT = 'REST_EXIT',
    REST_COMPLETE = 'REST_COMPLETE',

    // UI
    UI_BUTTON_CLICK = 'UI_BUTTON_CLICK',
    UI_CONFIRM = 'UI_CONFIRM',
    UI_CANCEL = 'UI_CANCEL',

    // Skills
    SKILL_CAST = 'SKILL_CAST',
    SKILL_SUCCESS = 'SKILL_SUCCESS',
    SKILL_FAIL = 'SKILL_FAIL',

    // NPC
    NPC_TALK = 'NPC_TALK',
    NPC_FAREWELL = 'NPC_FAREWELL',

    // Other Actions
    ANALYZE = 'ANALYZE',
}

/**
 * Context object containing metadata for audio event resolution.
 * Allows SFX selection logic to consider biome, item rarity, tool type, etc.
 */
export interface AudioEventContext {
    /** Current biome/terrain for footstep selection (e.g., 'forest', 'cave') */
    biome?: string;

    /** Item rarity for pickup sound differentiation ('common' | 'uncommon' | 'rare' | 'epic' | 'legendary') */
    itemRarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

    /** Item type/category for context-aware selection */
    itemType?: string;

    /** Tool type (shovel, sword, etc.) */
    toolType?: string;

    /** Whether action succeeded (used for craft success vs. fail) */
    success?: boolean;

    /** Whether attack is a heavy/power attack */
    isHeavyAttack?: boolean;

    /** Creature or NPC type for context-aware enemy audio */
    creatureType?: string;

    /** Whether the action is a critical/high-priority event */
    isCritical?: boolean;
}

/**
 * Result of audio event dispatch after filtering and resolution.
 * Ready to be passed to audio playback system.
 */
export interface AudioEventPayload {
    /** The action type that triggered this event */
    actionType: AudioActionType;

    /** Array of SFX filenames (one will be randomly selected) */
    sfxFiles: string[];

    /** Original context passed to emitter */
    context: AudioEventContext;

    /** Priority: 'high' = always play; 'medium' = normal; 'low' = can be filtered */
    priority: 'low' | 'medium' | 'high';
}

/**
 * Import biome-footsteps helper to avoid circular dependencies.
 * This will be imported in the registry functions below.
 */
// NOTE: Imported dynamically in getFootstepForBiome() to avoid circular deps
// import { getFootstepForBiome } from './biome-footsteps';

/**
 * Central registry mapping AudioActionType to SFX resolver functions.
 * Each function takes a context and returns SFX filename(s).
 * Enables flexible, context-aware SFX selection logic.
 *
 * Example:
 * ```
 * AUDIO_EVENTS_REGISTRY[AudioActionType.PLAYER_MOVE] = (ctx) => getFootstepForBiome(ctx.biome)
 * // Returns: ['rustle03.flac', 'rustle15.flac', 'rustle08.flac'] (3 random footsteps)
 * ```
 */
export const AUDIO_EVENTS_REGISTRY: Record<
    AudioActionType,
    (context: AudioEventContext) => string | string[] | null
> = {
    // MOVEMENT
    [AudioActionType.PLAYER_MOVE]: (ctx) => {
        return getFootstepForBiome(ctx.biome);
    },

    // COMBAT
    [AudioActionType.PLAYER_ATTACK]: (ctx) => [
        'punch.wav',
        'punch_2.wav',
        'punch_3.wav',
        'kick.wav',
    ],

    [AudioActionType.ENEMY_HIT]: () => [
        'slap.wav',
        'swipe.wav',
        'splat_quick.wav',
    ],

    [AudioActionType.ENEMY_DEFEATED]: () => [
        'crunch_splat.wav',
        'squelching_2.wav',
        'squelching_3.wav',
    ],

    // ITEMS
    [AudioActionType.ITEM_PICKUP]: (ctx) => {
        // Differentiate by rarity: rare items get gem sound, common get coin jingle
        if (ctx.itemRarity === 'rare' || ctx.itemRarity === 'epic' || ctx.itemRarity === 'legendary') {
            return 'gem_collect.wav';
        }
        return ['coin_jingle_small.wav', 'coins_gather_quick.wav'];
    },

    [AudioActionType.ITEM_EQUIP_WEAPON]: () => [
        'weapon_equip.wav',
        'weapon_equip_short.wav',
    ],

    [AudioActionType.ITEM_EQUIP_ARMOR]: () => [
        'clothing_1.wav',
        'clothing_2.wav',
        'item_equip.wav',
    ],

    [AudioActionType.ITEM_UNEQUIP]: () => 'weapon_unequip.wav',

    [AudioActionType.ITEM_USE]: () => [
        'drink_slurp.wav',
        'munching_food.wav',
    ],

    [AudioActionType.ITEM_DROP]: () => [
        'wood_small_drop.wav',
        'cardboard_drop.wav',
    ],

    // CRAFTING
    [AudioActionType.CRAFT_START]: () => [
        'pencil_scribble.wav',
        'pencil_eraser.wav',
    ],

    [AudioActionType.CRAFT_SUCCESS]: () => [
        'brass_chime_positive.wav',
        '8_bit_chime_positive.wav',
        'synth_confirmation.wav',
    ],

    [AudioActionType.CRAFT_FAIL]: () => [
        'synth_error.wav',
        'UI/crafting_fail.wav',
    ],

    // FARMING
    [AudioActionType.FARM_TILL]: () => 'shovel_dig.wav',

    [AudioActionType.FARM_WATER]: () => [
        'water_dripping.wav',
        'water_drop_medium.wav',
        'water_drop_synthetic.wav',
    ],

    [AudioActionType.FARM_FERTILIZE]: () => [
        'paper_move.wav',
        'concrete_scrape.wav',
    ],

    [AudioActionType.FARM_PLANT]: () => [
        'snap.wav',
        'subtle_knock.wav',
    ],

    // HARVESTING
    [AudioActionType.HARVEST_START]: () => 'shovel_dig.wav',

    [AudioActionType.HARVEST_ITEM]: () => [
        'gem_collect.wav',
        'coins_gather_quick.wav',
        'wood_small_gather.wav',
    ],

    [AudioActionType.HARVEST_COMPLETE]: () => [
        'brass_level_complete.wav',
        '8_bit_level_complete.wav',
    ],

    // BUILDING
    [AudioActionType.BUILD_CONSTRUCT]: () => [
        'metal_clang.wav',
        'wood_small_gather.wav',
    ],

    [AudioActionType.BUILD_SUCCESS]: () => [
        'brass_chime_positive.wav',
        '8_bit_chime_positive.wav',
    ],

    // ENVIRONMENT
    [AudioActionType.ENVIRONMENT_DOOR_OPEN]: () => 'door_open.wav',

    [AudioActionType.ENVIRONMENT_DOOR_CLOSE]: () => 'door_close.wav',

    // REST/SHELTER
    [AudioActionType.REST_ENTER]: () => [
        'door_open.wav',
        'creaky_door_short.wav',
    ],

    [AudioActionType.REST_EXIT]: () => [
        'door_close.wav',
        'creaky_door_short.wav',
    ],

    [AudioActionType.REST_COMPLETE]: () => [
        'brass_inn.wav',
        '8_bit_inn.wav',
    ],

    // UI
    [AudioActionType.UI_BUTTON_CLICK]: () => 'UI/button_click.m4a',

    [AudioActionType.UI_CONFIRM]: () => 'UI/craftting_success.wav',

    [AudioActionType.UI_CANCEL]: () => 'UI/cancel.wav',

    // SKILLS
    [AudioActionType.SKILL_CAST]: () => 'whoosh_1.wav',

    [AudioActionType.SKILL_SUCCESS]: () => [
        'brass_chime_quick.wav',
        'synth_confirmation.wav',
    ],

    [AudioActionType.SKILL_FAIL]: () => [
        'synth_error.wav',
        'synth_warning.wav',
    ],

    // NPC
    [AudioActionType.NPC_TALK]: () => [
        'man_0.wav',
        'man_1.wav',
        'man_2.wav',
        'man_3.wav',
        'man_4.wav',
        'man_5.wav',
        'man_6.wav',
        'man_7.wav',
        'man_8.wav',
        'man_9.wav',
        'man_10.wav',
    ],

    [AudioActionType.NPC_FAREWELL]: () => 'whistle.wav',

    // OTHER
    [AudioActionType.ANALYZE]: () => [
        'whoosh_1.wav',
        'whoosh_2.wav',
    ],
};

/**
 * Utility function to determine if an action is considered "critical" (should always play).
 * Critical events override playback mode filtering.
 *
 * @param actionType - The action type to evaluate
 * @returns true if this action should always emit audio (even in 'occasional' mode)
 */
export function isCriticalAudioEvent(actionType: AudioActionType): boolean {
    const criticalActions = [
        AudioActionType.UI_CONFIRM,
        AudioActionType.UI_CANCEL,
        AudioActionType.CRAFT_SUCCESS,
        AudioActionType.CRAFT_FAIL,
        AudioActionType.BUILD_SUCCESS,
        AudioActionType.HARVEST_COMPLETE,
        AudioActionType.ENEMY_DEFEATED,
        AudioActionType.REST_COMPLETE,
        AudioActionType.SKILL_SUCCESS,
        AudioActionType.SKILL_FAIL,
    ];
    return criticalActions.includes(actionType);
}

/**
 * Utility function to get priority level for an action.
 * Used to inform audio dispatch decisions (deduplication, queueing).
 *
 * @param actionType - The action type to evaluate
 * @returns Priority level: 'high' = always play; 'medium' = normal; 'low' = can be filtered
 */
export function getPriorityForAction(
    actionType: AudioActionType
): 'low' | 'medium' | 'high' {
    if (isCriticalAudioEvent(actionType)) return 'high';

    const mediumPriorityActions = [
        AudioActionType.PLAYER_ATTACK,
        AudioActionType.ENEMY_HIT,
        AudioActionType.HARVEST_ITEM,
        AudioActionType.ITEM_EQUIP_WEAPON,
        AudioActionType.ITEM_EQUIP_ARMOR,
        AudioActionType.BUILD_CONSTRUCT,
    ];

    if (mediumPriorityActions.includes(actionType)) return 'medium';

    return 'low';
}
