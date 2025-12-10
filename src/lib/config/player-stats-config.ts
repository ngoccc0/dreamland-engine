/**
 * Player Stats & Attributes Configuration
 *
 * @remarks
 * Defines default values for player statistics and character attributes.
 * Used during character creation and stat initialization.
 *
 * TODO: Add attribute scaling formulas (e.g., strength -> damage conversion)
 */

/**
 * Player statistics configuration
 *
 * @remarks
 * These defaults are applied when a new player character is created.
 * Modifying these affects game difficulty and starting power level.
 */
export const playerStatsConfig = {
    /**
     * Default maximum health points
     * @remarks Player starts with full HP
     */
    defaultMaxHealth: 100,

    /**
     * Default maximum stamina
     * @remarks Used for movement and action stamina costs
     */
    defaultMaxStamina: 100,

    /**
     * Default starting stamina (as percentage of max)
     * @remarks 1.0 = full stamina, 0.5 = half stamina
     */
    defaultStartingStaminaPercent: 1.0,

    /**
     * Player body temperature baseline (°C)
     * @remarks Normal human body temperature
     */
    bodyTempBaseline: 37,

    /**
     * Player stat names for UI display
     * @remarks Used in inventory, character sheet, etc.
     */
    statNames: {
        health: 'Health',
        stamina: 'Stamina',
        strength: 'Strength',
        defense: 'Defense',
        intelligence: 'Intelligence',
        speed: 'Speed',
    },

    /**
     * Class definitions with display names
     * @remarks Used for class selection and identification
     */
    classes: {
        warrior: { name: 'Warrior', bonus: 'Physical Attack' },
        scholar: { name: 'Scholar', bonus: 'Spell Damage' },
        explorer: { name: 'Explorer', bonus: 'Exploration Speed' },
    },

    /**
     * Equipment slot definitions
     * @remarks Determines which items can be equipped where
     */
    equipmentSlots: [
        'head',
        'chest',
        'legs',
        'feet',
        'hands',
        'back',
        'neck',
        'hand',
    ] as const,

    /**
     * Default equipment slot limit
     * @remarks Maximum items that can be equipped simultaneously
     */
    maxEquippedItems: 8,
} as const;

/**
 * Export type for TypeScript consumers
 */
export type PlayerStatsConfig = typeof playerStatsConfig;
