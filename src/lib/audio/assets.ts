/**
 * @overview
 * Centralized audio asset inventory for Dreamland Engine.
 * Organizes music, SFX, and mood mappings by category.
 * Expanded to include 100+ SFX files from all categories while maintaining backward compatibility.
 */

// ===== AMBIENCE TRACKS (Dynamic Biome + Time + Weather + Mood) =====
/**
 * Ambience tracks organized by category.
 * Used for dynamic multi-layer soundscape from /public/asset/sound/ambience/ folder.
 */
export const AMBIENCE_TRACKS = {
  cave: [
    'Ambiance_Cave_Dark_Loop_Stereo.wav',
    'Ambiance_Cave_Deep_Loop_Stereo.wav',
    'Atmosphere_Eerie_Donjon_Loop_Stereo.wav',
    'Atmosphere_Hum_Eerie_Loop_Stereo.wav',
  ],
  forest: [
    'Ambiance_Forest_Birds_Loop_Stereo.wav',
    'Ambiance_Nature_Meadow_Birds_Flies_Calm_Loop_Stereo.wav',
    'Ambiance_Wind_Forest_Loop_Stereo.wav',
  ],
  nature: [
    'Ambiance_Nature_River_Moderate_Loop_Stereo.wav',
    'Ambiance_Nature_Rain_Calm_Leaves_Loop_Stereo.wav',
  ],
  water: [
    'Ambiance_Sea_Loop_Stereo.wav',
    'Ambiance_River_Moderate_Loop_Stereo.wav',
    'Ambiance_Stream_Calm_Loop_Stereo.wav',
    'Ambiance_Waterfall_Calm_Loop_Stereo.wav',
    'Ambiance_Waterfall_Strong_Loop_Stereo.wav',
  ],
  rain: [
    'Ambiance_Rain_Calm_Loop_Stereo.wav',
    'Ambiance_Rain_Strong_Loop_Stereo.wav',
    'Ambiance_Nature_Rain_Calm_Leaves_Loop_Stereo.wav',
  ],
  fire: [
    'Ambiance_Firecamp_Big_Loop_Mono.wav',
    'Ambiance_Firecamp_Medium_Loop_Mono.wav',
    'Ambiance_Firecamp_Small_Loop_Mono.wav',
  ],
  night: [
    'Ambiance_Night_Loop_Stereo.wav',
    'Ambiance_Cicadas_Loop_Stereo.wav',
  ],
  wind: [
    'Ambiance_Wind_Calm_Loop_Stereo.wav',
    'Ambiance_Wind_Forest_Loop_Stereo.wav',
  ],
  dark: [
    'Atmosphere_Eerie_Donjon_Loop_Stereo.wav',
    'Atmosphere_Hum_Eerie_Loop_Stereo.wav',
  ],
} as const;

/**
 * Biome → Ambience category mapping.
 * Maps each terrain type to its primary ambience atmosphere.
 */
export const BIOME_AMBIENCE_MAP: Record<string, keyof typeof AMBIENCE_TRACKS> = {
  // Caves & Underground
  'cave': 'cave',
  'mountain': 'cave',
  'volcanic': 'cave',

  // Forests & Nature
  'forest': 'forest',
  'jungle': 'forest',
  'grassland': 'nature',
  'swamp': 'nature',

  // Water
  'ocean': 'water',
  'beach': 'water',

  // Cold
  'tundra': 'wind',

  // Desert (wind-swept)
  'desert': 'wind',
  'mesa': 'wind',

  // Structures
  'wall': 'cave',
  'floptropica': 'nature',
};

// ===== BACKGROUND MUSIC =====
export const BACKGROUND_MUSIC = [
  'Ambience_Cave_00.mp3',
  'ChillLofiR.mp3',
  'Forest_Ambience.mp3',
  'winter-wind-short.mp3',
];

// ===== MENU MUSIC =====
export const MENU_MUSIC = [
  'morning.mp3',
  'afternoon.mp3',
  'evening.mp3',
  'night.mp3',
] as const;

// ===== SFX BY CATEGORY =====

/**
 * Legacy SFX (maintained for backward compatibility).
 * These are existing sounds that may be referenced in other parts of the codebase.
 */
export const LEGACY_SFX = [
  'Dragon_Growl_00.mp3',
  'Dragon_Growl_01.mp3',
  'Goblin_00.mp3',
  'Goblin_01.mp3',
  'Goblin_02.mp3',
  'Goblin_03.mp3',
  'Goblin_04.mp3',
  'Inventory_Open_00.mp3',
  'Inventory_Open_01.mp3',
  'Jingle_Achievement_00.mp3',
  'Jingle_Lose_00.mp3',
  'Jingle_Win_00.mp3',
  'Menu_Select_00.mp3',
  'Pickup_Gold_00.mp3',
  'Pickup_Gold_01.mp3',
  'Pickup_Gold_02.mp3',
  'Pickup_Gold_03.mp3',
  'Pickup_Gold_04.mp3',
  'Spell_00.mp3',
  'Spell_01.mp3',
  'Spell_02.mp3',
  'Spell_03.mp3',
  'Spell_04.mp3',
  'Trap_00.mp3',
  'Trap_01.mp3',
  'Trap_02.mp3',
];

// ===== MOVEMENT / FOOTSTEPS =====
/**
 * Generic fallback footsteps (rustle sounds) used when biome is unknown.
 * Legacy support for backward compatibility.
 */
export const FOOTSTEP_GENERIC_SFX = [
  'steping_sounds/rustle01.flac',
  'steping_sounds/rustle02.flac',
  'steping_sounds/rustle03.flac',
  'steping_sounds/rustle04.flac',
  'steping_sounds/rustle05.flac',
  'steping_sounds/rustle06.flac',
  'steping_sounds/rustle07.flac',
  'steping_sounds/rustle08.flac',
  'steping_sounds/rustle09.flac',
  'steping_sounds/rustle10.flac',
  'steping_sounds/rustle11.flac',
  'steping_sounds/rustle12.flac',
  'steping_sounds/rustle13.flac',
  'steping_sounds/rustle14.flac',
  'steping_sounds/rustle15.flac',
  'steping_sounds/rustle16.flac',
  'steping_sounds/rustle17.flac',
  'steping_sounds/rustle18.flac',
  'steping_sounds/rustle19.flac',
  'steping_sounds/rustle20.flac',
];

/**
 * Grass terrain footsteps: forest, grassland, jungle, mushroom_forest, swamp.
 * Realistic grass walking sounds with natural variation.
 * Contains 11 walk variations for audio diversity.
 */
export const FOOTSTEP_BIOME_GRASS_SFX = [
  'steping_sounds/Footsteps_Grass/Footsteps_Grass_Walk/Footsteps_Walk_Grass_Mono_01.wav',
  'steping_sounds/Footsteps_Grass/Footsteps_Grass_Walk/Footsteps_Walk_Grass_Mono_02.wav',
  'steping_sounds/Footsteps_Grass/Footsteps_Grass_Walk/Footsteps_Walk_Grass_Mono_03.wav',
  'steping_sounds/Footsteps_Grass/Footsteps_Grass_Walk/Footsteps_Walk_Grass_Mono_04.wav',
  'steping_sounds/Footsteps_Grass/Footsteps_Grass_Walk/Footsteps_Walk_Grass_Mono_05.wav',
  'steping_sounds/Footsteps_Grass/Footsteps_Grass_Walk/Footsteps_Walk_Grass_Mono_06.wav',
  'steping_sounds/Footsteps_Grass/Footsteps_Grass_Walk/Footsteps_Walk_Grass_Mono_07.wav',
  'steping_sounds/Footsteps_Grass/Footsteps_Grass_Walk/Footsteps_Walk_Grass_Mono_08.wav',
  'steping_sounds/Footsteps_Grass/Footsteps_Grass_Walk/Footsteps_Walk_Grass_Mono_10.wav',
  'steping_sounds/Footsteps_Grass/Footsteps_Grass_Walk/Footsteps_Walk_Grass_Mono_11.wav',
];

/**
 * Snow terrain footsteps: tundra and cold environments.
 * Contains both hard-packed snow and soft snow walk sounds.
 * Includes 24 variations for rich audio feedback in frozen biomes.
 */
export const FOOTSTEP_BIOME_SNOW_SFX = [
  'steping_sounds/Footsteps_Snow/Footsteps_Snow_Walk/Footsteps_Snow_Hard_Walk_01.wav',
  'steping_sounds/Footsteps_Snow/Footsteps_Snow_Walk/Footsteps_Snow_Hard_Walk_02.wav',
  'steping_sounds/Footsteps_Snow/Footsteps_Snow_Walk/Footsteps_Snow_Hard_Walk_03.wav',
  'steping_sounds/Footsteps_Snow/Footsteps_Snow_Walk/Footsteps_Snow_Hard_Walk_04.wav',
  'steping_sounds/Footsteps_Snow/Footsteps_Snow_Walk/Footsteps_Snow_Hard_Walk_05.wav',
  'steping_sounds/Footsteps_Snow/Footsteps_Snow_Walk/Footsteps_Snow_Hard_Walk_06.wav',
  'steping_sounds/Footsteps_Snow/Footsteps_Snow_Walk/Footsteps_Snow_Hard_Walk_07.wav',
  'steping_sounds/Footsteps_Snow/Footsteps_Snow_Walk/Footsteps_Snow_Hard_Walk_08.wav',
  'steping_sounds/Footsteps_Snow/Footsteps_Snow_Walk/Footsteps_Snow_Hard_Walk_09.wav',
  'steping_sounds/Footsteps_Snow/Footsteps_Snow_Walk/Footsteps_Snow_Hard_Walk_10.wav',
  'steping_sounds/Footsteps_Snow/Footsteps_Snow_Walk/Footsteps_Snow_Hard_Walk_11.wav',
  'steping_sounds/Footsteps_Snow/Footsteps_Snow_Walk/Footsteps_Snow_Hard_Walk_12.wav',
  'steping_sounds/Footsteps_Snow/Footsteps_Snow_Walk/Footsteps_Snow_Walk_01.wav',
  'steping_sounds/Footsteps_Snow/Footsteps_Snow_Walk/Footsteps_Snow_Walk_02.wav',
  'steping_sounds/Footsteps_Snow/Footsteps_Snow_Walk/Footsteps_Snow_Walk_03.wav',
  'steping_sounds/Footsteps_Snow/Footsteps_Snow_Walk/Footsteps_Snow_Walk_04.wav',
  'steping_sounds/Footsteps_Snow/Footsteps_Snow_Walk/Footsteps_Snow_Walk_05.wav',
  'steping_sounds/Footsteps_Snow/Footsteps_Snow_Walk/Footsteps_Snow_Walk_06.wav',
  'steping_sounds/Footsteps_Snow/Footsteps_Snow_Walk/Footsteps_Snow_Walk_07.wav',
  'steping_sounds/Footsteps_Snow/Footsteps_Snow_Walk/Footsteps_Snow_Walk_08.wav',
  'steping_sounds/Footsteps_Snow/Footsteps_Snow_Walk/Footsteps_Snow_Walk_09.wav',
  'steping_sounds/Footsteps_Snow/Footsteps_Snow_Walk/Footsteps_Snow_Walk_10.wav',
  'steping_sounds/Footsteps_Snow/Footsteps_Snow_Walk/Footsteps_Snow_Walk_11.wav',
  'steping_sounds/Footsteps_Snow/Footsteps_Snow_Walk/Footsteps_Snow_Walk_12.wav',
];

/**
 * Gravel terrain footsteps: cave, mountain, desert, volcanic, mesa, beach.
 * Contains 10 rocky/gravel walk variations for harsh terrain environments.
 */
export const FOOTSTEP_BIOME_GRAVEL_SFX = [
  'steping_sounds/Footsteps_Gravel/Footsteps_Gravel_Walk/Footsteps_Gravel_Walk_01.wav',
  'steping_sounds/Footsteps_Gravel/Footsteps_Gravel_Walk/Footsteps_Gravel_Walk_02.wav',
  'steping_sounds/Footsteps_Gravel/Footsteps_Gravel_Walk/Footsteps_Gravel_Walk_03.wav',
  'steping_sounds/Footsteps_Gravel/Footsteps_Gravel_Walk/Footsteps_Gravel_Walk_04.wav',
  'steping_sounds/Footsteps_Gravel/Footsteps_Gravel_Walk/Footsteps_Gravel_Walk_05.wav',
  'steping_sounds/Footsteps_Gravel/Footsteps_Gravel_Walk/Footsteps_Gravel_Walk_06.wav',
  'steping_sounds/Footsteps_Gravel/Footsteps_Gravel_Walk/Footsteps_Gravel_Walk_07.wav',
  'steping_sounds/Footsteps_Gravel/Footsteps_Gravel_Walk/Footsteps_Gravel_Walk_08.wav',
  'steping_sounds/Footsteps_Gravel/Footsteps_Gravel_Walk/Footsteps_Gravel_Walk_09.wav',
  'steping_sounds/Footsteps_Gravel/Footsteps_Gravel_Walk/Footsteps_Gravel_Walk_10.wav',
];

/**
 * Wood terrain footsteps: wall, floptropica (wooden structures).
 * Contains 10 wooden/solid walk sounds for built environment ambiance.
 */
export const FOOTSTEP_BIOME_WOOD_SFX = [
  'steping_sounds/Footsteps_Wood/Footsteps_Wood_Walk/Footsteps_Wood_Walk_01.wav',
  'steping_sounds/Footsteps_Wood/Footsteps_Wood_Walk/Footsteps_Wood_Walk_02.wav',
  'steping_sounds/Footsteps_Wood/Footsteps_Wood_Walk/Footsteps_Wood_Walk_03.wav',
  'steping_sounds/Footsteps_Wood/Footsteps_Wood_Walk/Footsteps_Wood_Walk_04.wav',
  'steping_sounds/Footsteps_Wood/Footsteps_Wood_Walk/Footsteps_Wood_Walk_05.wav',
  'steping_sounds/Footsteps_Wood/Footsteps_Wood_Walk/Footsteps_Wood_Walk_06.wav',
  'steping_sounds/Footsteps_Wood/Footsteps_Wood_Walk/Footsteps_Wood_Walk_07.wav',
  'steping_sounds/Footsteps_Wood/Footsteps_Wood_Walk/Footsteps_Wood_Walk_08.wav',
  'steping_sounds/Footsteps_Wood/Footsteps_Wood_Walk/Footsteps_Wood_Walk_09.wav',
  'steping_sounds/Footsteps_Wood/Footsteps_Wood_Walk/Footsteps_Wood_Walk_10.wav',
];

// ===== COMBAT & GORE =====
export const COMBAT_SFX = [
  'bone_snap.wav',
  'crunch.wav',
  'crunch_quick.wav',
  'crunch_splat.wav',
  'crunch_splat_2.wav',
  'kick.wav',
  'punch.wav',
  'punch_2.wav',
  'punch_3.wav',
  'slap.wav',
  'splat_double_quick.wav',
  'splat_quick.wav',
  'squelching_1.wav',
  'squelching_2.wav',
  'squelching_3.wav',
  'squelching_4.wav',
  'swipe.wav',
];

// ===== ENVIRONMENT =====
export const ENVIRONMENT_SFX = [
  'air_burst.wav',
  'ambient_wind.wav',
  'clock_ticking.wav',
  'clock_tick_only.wav',
  'clock_tock_only.wav',
  'creaky_door_long.wav',
  'creaky_door_short.wav',
  'door_close.wav',
  'door_knock.wav',
  'door_open.wav',
  'fire_lighting.wav',
  'gurgling.wav',
  'ice_in_water.wav',
  'lock_lock.wav',
  'lock_quick.wav',
  'lock_unlock.wav',
  'water_babbling_loop.wav',
  'water_boiling_loop.wav',
  'water_dripping.wav',
  'water_drop_medium.wav',
  'water_drop_synthetic.wav',
  'water_splashing.wav',
  'zipper_down.wav',
  'zipper_up.wav',
];

// ===== HUMAN / VOCALIZATION =====
export const HUMAN_SFX = [
  'belch_1.wav',
  'belch_2.wav',
  'belch_3.wav',
  'cough_double.wav',
  'cough_short.wav',
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
  'whistle.wav',
];

// ===== ITEMS =====
export const ITEM_SFX = [
  'air_pump.wav',
  'book_close.wav',
  'book_open.wav',
  'broom_sweep_1.wav',
  'broom_sweep_2.wav',
  'coins_gather_medium.wav',
  'coins_gather_quick.wav',
  'coins_gather_small.wav',
  'coin_collect.wav',
  'coin_jingle_small.wav',
  'gem_collect.wav',
  'heart_collect.wav',
  'item_equip.wav',
  'jingle_bells_1.wav',
  'jingle_bells_2.wav',
  'keys_jingling.wav',
  'map_close.wav',
  'map_open.wav',
  'page_turn.wav',
  'pencil_eraser.wav',
  'pencil_scribble.wav',
  'shovel_dig.wav',
  'tennis_ball_bounce_1.wav',
  'tennis_ball_bounce_2.wav',
];

// ===== MATERIALS =====
export const MATERIAL_SFX = [
  'aluminium_can_pick_up.wav',
  'aluminium_can_place.wav',
  'bamboo_drop.wav',
  'cardboard_box_close.wav',
  'cardboard_drop.wav',
  'cardboard_hit.wav',
  'cardboard_pick_up.wav',
  'cardboard_push.wav',
  'cardboard_tear.wav',
  'ceramic_jar_close.wav',
  'ceramic_jar_open.wav',
  'clothing_1.wav',
  'clothing_2.wav',
  'clothing_thud.wav',
  'concrete_scrape.wav',
  'cork_stabbed.wav',
  'glass_ping_big.wav',
  'glass_ping_small.wav',
  'metal_blunt_tap.wav',
  'metal_clang.wav',
  'paper_move.wav',
  'paper_scrunch.wav',
  'paper_sort.wav',
  'paper_tear_1.wav',
  'paper_tear_2.wav',
  'pottery_clang.wav',
  'stone_push_long.wav',
  'stone_push_medium.wav',
  'stone_push_short.wav',
  'wood_small_drop.wav',
  'wood_small_gather.wav',
  'wood_small_hollow.wav',
  'wood_small_pickup.wav',
];

// ===== MACHINES =====
export const MACHINE_SFX = [
  'drill_whizz.wav',
  'hairdryer.wav',
  'hydraulic_down.wav',
  'hydraulic_up.wav',
  'industrial_door_close.wav',
  'industrial_door_open.wav',
  'razor_buzz.wav',
];

// ===== WEAPONS =====
export const WEAPON_SFX = [
  'harsh_thud.wav',
  'shot_muffled.wav',
  'sword_clash.wav',
  'sword_clash_2.wav',
  'sword_drop.wav',
  'sword_light.wav',
  'sword_sharpen.wav',
  'sword_slice.wav',
  'sword_unsheath.wav',
  'weapon_drop.wav',
  'weapon_equip.wav',
  'weapon_equip_short.wav',
  'weapon_pick_up.wav',
  'weapon_unequip.wav',
  'weapon_upgrade.wav',
];

// ===== UI =====
/**
 * UI sound effects: button clicks, hovers, confirmations, cancellations.
 * Includes retro UI feedback sounds from /UI/ folder.
 * All sci-fi sound effects have been removed per user requirements.
 */
export const UI_SFX = [
  // Core UI button sounds
  'UI/button_click.m4a',
  'UI/cancel.wav',
  'UI/clicking.wav',
  'UI/click_double_off_2.wav',
  'UI/click_double_on.wav',
  'UI/crafting_fail.wav',
  'UI/craftting_success.wav',
  'UI/item_pick_up_1.wav',
  'UI/item_pick_up_2.wav',
  'UI/map_close.wav',
  'UI/map_open.wav',
  'UI/open_inventory.wav',
  'UI/pop_1.wav',
  'UI/pop_2.wav',

  // Synth & additional UI effects
  'synth_cancel.wav',
  'synth_confirmation.wav',
  'synth_error.wav',
  'synth_process_complete.wav',
  'synth_shut_down.wav',
  'synth_warning.wav',
  'toggle_off.wav',
  'toggle_on.wav',
];

// ===== RETRO STINGS & EFFECTS =====
export const RETRO_SFX = [
  'applause.wav',
  'controller_button_press.wav',
  'controller_button_press_2.wav',
  'drink_slurp.wav',
  'elastic_twang.wav',
  'explosion_large.wav',
  'explosion_medium.wav',
  'explosion_quick.wav',
  'explosion_small.wav',
  'fall_quick.wav',
  'finger_click.wav',
  'ghost_long.wav',
  'ghost.wav',
  'grow_big.wav',
  'hurt.wav',
  'itching.wav',
  'jump.wav',
  'jump_short.wav',
  'jump_square.wav',
  'keyboard_typing.wav',
  'light_match.wav',
  'lose.wav',
  'menu_blip.wav',
  'munching_food.wav',
  'paste.wav',
  'power_down.wav',
  'power_down_2.wav',
  'power_up.wav',
  'power_up_2.wav',
  'punch.wav',
  'record_scratch.wav',
  'slide_and_click.wav',
  'snap.wav',
  'subtle_knock.wav',
  'throw.wav',
  'undesired_effect.wav',
  'white_noise_long.wav',
  'white_noise_short.wav',
  'whoosh_1.wav',
  'whoosh_2.wav',
  'wobble.wav',
];

// ===== MUSICAL EFFECTS / STINGS (10 instruments × 11 variations) =====
export const MUSICAL_STINGS_8BIT = [
  '8_bit_chime_positive.wav',
  '8_bit_chime_quick.wav',
  '8_bit_defeated.wav',
  '8_bit_inn.wav',
  '8_bit_level_complete.wav',
  '8_bit_level_start.wav',
  '8_bit_mystery.wav',
  '8_bit_negative.wav',
  '8_bit_negative_long.wav',
  '8_bit_negative_quick.wav',
  '8_bit_positive_long.wav',
];

export const MUSICAL_STINGS_BRASS = [
  'brass_chime_positive.wav',
  'brass_chime_quick.wav',
  'brass_defeated.wav',
  'brass_inn.wav',
  'brass_level_complete.wav',
  'brass_level_start.wav',
  'brass_mystery.wav',
  'brass_negative.wav',
  'brass_negative_long.wav',
  'brass_negative_quick.wav',
  'brass_positive_long.wav',
];

export const MUSICAL_STINGS_SYNTH = [
  'synth_bass_chime_positive.wav',
  'synth_bass_chime_quick.wav',
  'synth_bass_defeated.wav',
  'synth_bass_inn.wav',
  'synth_bass_level_complete.wav',
  'synth_bass_level_start.wav',
  'synth_bass_mystery.wav',
  'synth_bass_negative.wav',
  'synth_bass_negative_long.wav',
  'synth_bass_negative_quick.wav',
  'synth_bass_positive_long.wav',
];

export const MUSICAL_STINGS_SFX = [
  ...MUSICAL_STINGS_8BIT,
  ...MUSICAL_STINGS_BRASS,
  ...MUSICAL_STINGS_SYNTH,
  'horror_sting.wav',
];

// ===== COMBINED SFX ARRAY (For backward compatibility) =====
export const SFX = [
  ...LEGACY_SFX,
  ...FOOTSTEP_GENERIC_SFX,
  ...FOOTSTEP_BIOME_GRASS_SFX,
  ...FOOTSTEP_BIOME_SNOW_SFX,
  ...FOOTSTEP_BIOME_GRAVEL_SFX,
  ...FOOTSTEP_BIOME_WOOD_SFX,
  ...COMBAT_SFX,
  ...ENVIRONMENT_SFX,
  ...HUMAN_SFX,
  ...ITEM_SFX,
  ...MATERIAL_SFX,
  ...MACHINE_SFX,
  ...WEAPON_SFX,
  ...UI_SFX,
  ...RETRO_SFX,
  ...MUSICAL_STINGS_SFX,
];

// Map mood tags to preferred background tracks (order is preference fallback).
export const MOOD_TRACK_MAP: Record<string, string[]> = {
  Peaceful: ['ChillLofiR.mp3', 'Forest_Ambience.mp3'],
  Lush: ['Forest_Ambience.mp3', 'ChillLofiR.mp3'],
  Gloomy: ['Ambience_Cave_00.mp3'],
  Dark: ['Ambience_Cave_00.mp3'],
  Foreboding: ['Ambience_Cave_00.mp3'],
  Danger: ['Ambience_Cave_00.mp3'],
  Cold: ['winter-wind-short.mp3'],
  Desolate: ['winter-wind-short.mp3'],
  Mysterious: ['Ambience_Cave_00.mp3', 'ChillLofiR.mp3'],
  Vibrant: ['ChillLofiR.mp3'],
};

