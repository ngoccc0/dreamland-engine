/**
 * Centralized game configuration for tunable simulation parameters.
 * Keep all major numeric knobs here so designers can tweak behaviour from one place.
 */
export interface GameConfig {
    plant: {
        /** Base growth multiplier applied to computed growthPotential. */
        baseGrowthMultiplier: number;
        /** Chance (0..1) for plants to attempt spreading from dense tiles each tick. */
        spreadChance: number;
        /** Maximum growth amount applied per tick (absolute units). */
        maxGrowthPerTick: number;
        /** Moisture threshold below which plant decline may occur. */
        droughtMoistureThreshold: number;
        /** Seasonal multipliers */
        seasonMultiplier: {
            spring: number;
            summer: number;
            autumn: number;
            winter: number;
        };
        /** How strongly human presence reduces growth (0..1 where 1 = no penalty). */
        humanPenaltyFactor: number;
        /** Amount of satiation gained per 1 unit of vegetation consumed. */
        plantNutrition?: number;
        /** Chance (0..1) that a hungry plant-eating creature will eat when given the opportunity. */
        eatChance?: number;
        /** How many vegetationDensity units are consumed per eating action. */
        consumptionPerEat?: number;
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
        spreadChance: 0.02,
        maxGrowthPerTick: 5,
        droughtMoistureThreshold: 20,
        seasonMultiplier: {
            spring: 1.3,
            summer: 1.1,
            autumn: 0.9,
            winter: 0.6,
        },
        humanPenaltyFactor: 0.5,
        plantNutrition: 0.5,
        eatChance: 0.6,
        consumptionPerEat: 5
    },
    creature: {
        moveTickInterval: 5,
        hungerDecayPerTick: 1,
        hungerDecayInterval: 10
    }
};

export default defaultGameConfig;
