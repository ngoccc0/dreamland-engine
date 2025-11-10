/**
 * Centralized game configuration for tunable simulation parameters.
 * Keep all major numeric knobs here so designers can tweak behaviour from one place.
 */
export interface GameConfig {
    plant: {
        /** Base growth multiplier for plant maturity. */
        baseGrowthMultiplier: number;
        /** Base maturity gain per tick when conditions are optimal. */
        baseMaturityGain: number;
        /** Maximum maturity a plant can have (%). */
        maxMaturity: number;
        /** Threshold for severe stress damage (0..1). */
        severeStressThreshold: number;
        /** Damage per tick when under severe stress. */
        stressDamagePerTick: number;
        /** How quickly plants mature in optimal conditions. */
        maturityRate: number;
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
    };
    creature: {
        /** How many ticks between automatic movement checks (lower = more frequent). */
        moveTickInterval: number;
        /** Hunger decay per hunger tick. */
        hungerDecayPerTick: number;
        /** Number of ticks between hunger decay events. */
        hungerDecayInterval: number;
    };
}

export const defaultGameConfig: GameConfig = {
    plant: {
        baseGrowthMultiplier: 1.0,
        baseMaturityGain: 2.0,
        maxMaturity: 100,
        severeStressThreshold: 0.7,
        stressDamagePerTick: 5,
        maturityRate: 1.0,
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
        plantNutrition: 0.5
    },
    creature: {
        moveTickInterval: 5,
        hungerDecayPerTick: 1,
        hungerDecayInterval: 10
    }
};

export default defaultGameConfig;
