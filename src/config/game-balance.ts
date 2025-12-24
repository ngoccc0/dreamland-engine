/**
 * Game Balance Configuration
 * 
 * @remarks
 * Centralized configuration for all game mechanics tuning parameters.
 * Extracted from hardcoded values throughout the codebase to enable
 * non-technical balance adjustments.
 * 
 * **Usage:**
 * ```typescript
 * import { GAME_BALANCE } from '@/config/game-balance';
 * const damage = baseDamage * GAME_BALANCE.COMBAT.CRIT_MULTIPLIER;
 * ```
 * 
 * **Modification Policy:**
 * Any change to these values should be documented with:
 * - Date of change
 * - Reason for change
 * - Expected gameplay impact
 */

export const GAME_BALANCE = {
    /**
     * World Generation Parameters
     */
    WORLD_GEN: {
        /** Random variance applied to terrain attributes (0.8 to 1.2 range) */
        BASE_VARIANCE: 0.4,
        /** Default difficulty level for regions */
        DEFAULT_DIFFICULTY: 50,
        /** Default fertility for regions */
        DEFAULT_FERTILITY: 50,
        /** Default biodiversity for regions */
        DEFAULT_BIODIVERSITY: 50,
        /** Default travel cost for terrain */
        DEFAULT_TRAVEL_COST: 1,
    },

    /**
     * Nature & Plant Growth Parameters
     */
    NATURE: {
        GROWTH: {
            /** Base probability of plant part growth per tick (5%) */
            BASE_CHANCE: 0.05,
            /** Base probability of plant part drop per tick (1%) */
            DROP_CHANCE: 0.01,
            /** Base environmental stress damage per tick */
            BASE_STRESS_DAMAGE: 5,
        },
        SUITABILITY: {
            /** Weight of moisture in environmental suitability (40%) */
            MOISTURE_WEIGHT: 0.4,
            /** Weight of temperature in environmental suitability (40%) */
            TEMP_WEIGHT: 0.4,
            /** Weight of light in environmental suitability (20%) */
            LIGHT_WEIGHT: 0.2,
            /** Waterlogging penalty curve factor */
            WET_PENALTY_FACTOR: 28.57,
            /** Minimum waterlogged suitability (30%) */
            WET_PENALTY_MIN: 0.3,
            /** Cold temperature margin (lethal = minOpt - this) */
            COLD_MARGIN: 15,
            /** Heat temperature margin (lethal = maxOpt + this) */
            HEAT_MARGIN: 20,
            /** Reproduction threshold (suitability > this) */
            REPRODUCTION_THRESHOLD: 0.7,
        },
        DEFAULTS: {
            /** Default moisture level */
            MOISTURE: 50,
            /** Default minimum required moisture */
            MIN_MOISTURE: 20,
            /** Default maximum tolerated moisture */
            MAX_MOISTURE: 80,
            /** Default temperature */
            TEMPERATURE: 15,
            /** Default minimum optimal temperature */
            MIN_TEMPERATURE: 10,
            /** Default maximum optimal temperature */
            MAX_TEMPERATURE: 30,
            /** Default light level */
            LIGHT: 50,
            /** Default minimum required light */
            MIN_LIGHT: 20,
        },
        DENSITY: {
            /** Density units per plant (1 plant = 10 density) */
            UNITS_PER_PLANT: 10,
            /** Maximum density cap */
            MAX_DENSITY: 100,
        },
    },

    /**
     * Creature Simulation Parameters
     */
    CREATURES: {
        SIMULATION: {
            /** Creature update radius (Chebyshev distance) */
            UPDATE_RADIUS: 10,
            /** Update delay for close creatures (distance <= 5) */
            UPDATE_DELAY_IMMEDIATE: { MIN: 0, MAX: 0 },
            /** Update delay for medium distance (5 < distance <= 10) */
            UPDATE_DELAY_SHORT: { MIN: 50, MAX: 150 },
            /** Update delay for far distance (10 < distance <= 15) */
            UPDATE_DELAY_MEDIUM: { MIN: 150, MAX: 300 },
            /** Update delay for very far distance (distance > 15) */
            UPDATE_DELAY_LONG: { MIN: 300, MAX: 500 },
            /** Distance threshold for immediate updates */
            DISTANCE_IMMEDIATE: 5,
            /** Distance threshold for short delay */
            DISTANCE_SHORT: 10,
            /** Distance threshold for medium delay */
            DISTANCE_MEDIUM: 15,
        },
        HUNGER: {
            /** Hunger threshold as percentage of max satiation (30%) */
            THRESHOLD_PERCENT: 0.3,
            /** Maximum hunger value for breeding eligibility */
            MAX_BREEDING_HUNGER: 60,
        },
        BREEDING: {
            /** Base hunger cost for breeding */
            BASE_COST: 20,
            /** Maximum breeding range (Chebyshev distance) */
            RANGE: 3,
            /** Population cost scaling thresholds */
            POPULATION_COST_SCALING: {
                /** Below 50% capacity: normal cost (1.0x) */
                THRESHOLD_1: 0.5,
                MULTIPLIER_1: 1.0,
                /** 50-75% capacity: increased cost (1.5x) */
                THRESHOLD_2: 0.75,
                MULTIPLIER_2: 1.5,
                /** 75-90% capacity: high cost (2.0x) */
                THRESHOLD_3: 0.9,
                MULTIPLIER_3: 2.0,
                /** Above 90% capacity: very high cost (3.0x) */
                MAX_MULTIPLIER: 3.0,
            },
            /** Default carrying capacity for population balance */
            DEFAULT_CARRYING_CAPACITY: 100,
            /** Hunger reduction when baby becomes adult */
            ADULT_HUNGER_BONUS: 10,
        },
        AI: {
            /** Default trophic search range (Chebyshev) */
            DEFAULT_TROPHIC_RANGE: 2,
        },
    },

    /**
     * Combat Parameters
     */
    COMBAT: {
        /** Critical hit damage multiplier */
        CRIT_MULTIPLIER: 1.5,
        /** Base experience points awarded for combat */
        BASE_XP: 50,
        /** XP scaling factor per HP difference */
        XP_SCALING_PER_HP: 0.002,
        /** Minimum XP awarded (even for trivial enemies) */
        MIN_XP: 10,
        /** Minimum XP multiplier (prevents negative XP) */
        MIN_XP_MULTIPLIER: 0.5,
        /** Default minimum damage (prevents zero damage stalemate) */
        MIN_DAMAGE: 1,
    },

    /**
     * Environmental Effects on Combat
     */
    ENVIRONMENT: {
        /** Damage penalty in darkness (light level < -3) */
        DARKNESS_PENALTY: 0.8,
        /** Darkness threshold (light level) */
        DARKNESS_THRESHOLD: -3,
        /** Damage penalty in high moisture (moisture > 8) */
        WET_PENALTY: 0.9,
        /** Wet conditions threshold (moisture level) */
        WET_THRESHOLD: 8,
    },

    /**
     * Loot & Drops
     */
    LOOT: {
        /** Equipment grade distribution thresholds */
        GRADE_DISTRIBUTION: {
            /** Common (Grade 0): 0.0 - 0.5 (50%) */
            COMMON_THRESHOLD: 0.5,
            /** Uncommon (Grade 1): 0.5 - 0.8 (30%) */
            UNCOMMON_THRESHOLD: 0.8,
            /** Rare (Grade 2): 0.8 - 1.0 (20%) */
            // Implicit: > UNCOMMON_THRESHOLD
        },
    },
} as const;

/**
 * Type for the game balance configuration
 */
export type GameBalanceConfig = typeof GAME_BALANCE;
