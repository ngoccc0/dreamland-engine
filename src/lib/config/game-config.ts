/**
 * Centralized game configuration for tunable simulation parameters.
 * Keep all major numeric knobs here so designers can tweak behaviour from one place.
 */
export interface GameConfig {
    plant: {
        /** Seasonal multipliers for growth and reproduction. */
        seasonMultiplier: {
            spring: number;
            summer: number;
            autumn: number;
            winter: number;
        };
        /** How strongly human presence affects plant growth and reproduction. */
        humanPenaltyFactor: number;
        /** Chance (0-1) a creature will attempt to eat when hungry */
        eatChance?: number;
        /** How many vegetation units a creature consumes in one eat action */
        consumptionPerEat?: number;
        /** Nutrition (satiation) provided per vegetation unit */
        plantNutrition?: number;
        /** How strongly magic affinity boosts growth probability or unique events (0-1). */
        magicAffinityGrowthFactor: number;
        /** How strongly wind affects the drop probability of plant parts (0-1). */
        windDropFactor: number;
        /** Base environmental factor applied to plant part growth/drop probabilities. */
        baseEnvironmentalFactor: number;
        /** Base growth multiplier for plant maturity (0-1). */
        baseGrowthMultiplier: number;
        /** Rate of maturity increase per growth event (0-1). */
        maturityRate: number;
        /** Nutrition consumed per unit of maturity gained. */
        nutritionPerMaturity: number;
        /** Fertilizer consumed per unit of maturity gained. */
        fertilizerPerMaturity: number;
        /** Water consumed per unit of maturity gained. */
        waterPerMaturity: number;
        /** Fertilizer decay per tick. */
        fertilizerDecayPerTick: number;
    };
    creature: {
        /** How many ticks between automatic movement checks (lower = more frequent). */
        moveTickInterval: number;
        /** Hunger decay per hunger tick. */
        hungerDecayPerTick: number;
        /** Number of ticks between hunger decay events. */
        hungerDecayInterval: number;
    };
    playerRegeneration: {
        /** Base HP regeneration per tick when not hungry. */
        hpRegenPerTick: number;
        /** Base stamina regeneration per tick when not hungry. */
        staminaRegenPerTick: number;
        /** Base mana regeneration per tick when not hungry. */
        manaRegenPerTick: number;
        /** Hunger threshold for mild regeneration penalty (0-100). */
        hungerThresholdMild: number;
        /** Hunger threshold for severe regeneration penalty (0-100). */
        hungerThresholdSevere: number;
        /** Regeneration penalty multiplier for mild hunger (0.5 = 50% reduction). */
        hungerRegenPenaltyMild: number;
        /** Regeneration penalty multiplier for severe hunger (0.0 = no regeneration). */
        hungerRegenPenaltySevere: number;
        /** HP damage per tick when severely hungry/starving. */
        starvationDamagePerTick: number;
        /** Hunger decay per hunger tick. */
        hungerDecayPerTick: number;
        /** Number of ticks between hunger decay events. */
        hungerDecayInterval: number;
        /** Number of ticks between HP regeneration events. */
        hpRegenInterval: number;
        /** Number of ticks between stamina regeneration events. */
        staminaRegenInterval: number;
        /** Number of ticks between mana regeneration events. */
        manaRegenInterval: number;
    };
}

export const defaultGameConfig: GameConfig = {
    plant: {
        seasonMultiplier: {
            spring: 1.3,
            summer: 1.1,
            autumn: 0.9,
            winter: 0.6,
        },
        humanPenaltyFactor: 0.5,
        /** Chance (0-1) a creature will attempt to eat when hungry */
        eatChance: 0.6,
        /** How many vegetation units a creature consumes in one eat action */
        consumptionPerEat: 5,
        /** Nutrition (satiation) provided per vegetation unit */
        plantNutrition: 0.5,
        magicAffinityGrowthFactor: 0.1, // Example value
        windDropFactor: 0.05, // Example value
        baseEnvironmentalFactor: 1.0, // Example value
        baseGrowthMultiplier: 0.05,
        maturityRate: 0.01,
        nutritionPerMaturity: 0.1,
        fertilizerPerMaturity: 0.2,
        waterPerMaturity: 0.15,
        fertilizerDecayPerTick: 0.01,
    },
    creature: {
        moveTickInterval: 5,
        hungerDecayPerTick: 1,
        hungerDecayInterval: 10
    },
    playerRegeneration: {
        /** Base HP regeneration per tick when not hungry. */
        hpRegenPerTick: 1,
        /** Base stamina regeneration per tick when not hungry. */
        staminaRegenPerTick: 2,
        /** Base mana regeneration per tick when not hungry. */
        manaRegenPerTick: 1.5,
        /** Hunger threshold for mild regeneration penalty (0-100). */
        hungerThresholdMild: 10,
        /** Hunger threshold for severe regeneration penalty (0-100). */
        hungerThresholdSevere: 30,
        /** Regeneration penalty multiplier for mild hunger (0.5 = 50% reduction). */
        hungerRegenPenaltyMild: 0.5,
        /** Regeneration penalty multiplier for severe hunger (0.0 = no regeneration). */
        hungerRegenPenaltySevere: 0.0,
        /** HP damage per tick when severely hungry/starving. */
        starvationDamagePerTick: 5,
        /** Hunger decay per hunger tick. */
        hungerDecayPerTick: 1,
        /** Number of ticks between hunger decay events. */
        hungerDecayInterval: 2,
        /** Number of ticks between HP regeneration events. */
        hpRegenInterval: 5,
        /** Number of ticks between stamina regeneration events. */
        staminaRegenInterval: 5,
        /** Number of ticks between mana regeneration events. */
        manaRegenInterval: 5
    }
};

export default defaultGameConfig;
