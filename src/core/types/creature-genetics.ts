/**
 * Creature Genetics & Inheritance System
 *
 * @remarks
 * Implements a simplified quantitative genetics system for wildlife creatures.
 * - 4 inheritable traits: hungerRate, speed, size, fearfulness
 * - Offspring genetics = (parentA + parentB) / 2 ± 10% random + environmental modifiers
 * - Environmental modifiers based on chunk attributes (temperature, vegetation)
 * - Only wildlife creatures have genetics; monsters are combat-only
 */

/**
 * Genetic traits that are inherited from parents.
 * All values are numerical (0-100 scale typically, but can vary).
 */
export interface CreatureGenetics {
    /** How fast hunger increases (multiplier 0.5-2.0). Higher = hunts more. */
    hungerRate: number;

    /** Movement range in cells per turn (2-8). Higher = can move farther. */
    speed: number;

    /** Visual size and hunger consumption multiplier (0.5-2.0). Larger = eats more. */
    size: number;

    /** Flee distance when scared (0-100 cells). Higher = runs away farther. */
    fearfulness: number;
}

/**
 * Personality traits that influence decision-making.
 * Range: 0-100 scale.
 */
export interface CreaturePersonality {
    /** Reduces movement range and hunting activity. 0=active, 100=lazy. */
    laziness?: number;

    /** Increases hunting range and aggression. 0=calm, 100=highly aggressive. */
    aggression?: number;

    /** Increases flee distance and caution. 0=bold, 100=very cautious. */
    caution?: number;

    /** Increases food-seeking range. 0=picky, 100=very greedy. */
    greediness?: number;

    /** Increases herd cohesion. 0=solitary, 100=very social. */
    sociability?: number;

    /** Tendency to explore. 0=stays put, 100=very curious. */
    curiosity?: number;
}

/**
 * Genetic modification bonuses from environmental factors.
 *
 * @remarks
 * Applied during offspring generation based on chunk attributes:
 * - Cold biomes (temp < 0): size +20%, speed -10%
 * - Lush biomes (vegetation > 70%): speed +15%, size -5%
 * - Hot biomes (temp > 25): speed +15%, size -10%, hungerRate +20%
 * - Dry biomes (moisture < 30%): hungerRate -10%, fearfulness +10%
 */
export interface EnvironmentalBonus {
    hungerRate: number;
    speed: number;
    size: number;
    fearfulness: number;
}

/**
 * Calculate environmental bonuses based on chunk conditions.
 *
 * @remarks
 * Maps biome/weather conditions to genetic modifiers.
 * This allows creatures to gradually adapt to their environment over generations.
 *
 * @param temperature Chunk temperature (-50 to 50)
 * @param vegetation Vegetation density (0-100)
 * @param moisture Moisture level (0-100)
 * @returns Bonuses to apply to genetics
 */
export function calculateEnvironmentalBonus(
    temperature: number,
    vegetation: number,
    moisture: number
): EnvironmentalBonus {
    let hungerRate = 0;
    let speed = 0;
    let size = 0;
    let fearfulness = 0;

    // Cold biome effects
    if (temperature < 0) {
        size += 20;
        speed -= 10;
    }

    // Lush biome effects (high vegetation)
    if (vegetation > 70) {
        speed += 15;
        size -= 5;
    }

    // Hot biome effects
    if (temperature > 25) {
        speed += 15;
        size -= 10;
        hungerRate += 20;
    }

    // Dry biome effects
    if (moisture < 30) {
        hungerRate -= 10;
        fearfulness += 10;
    }

    return { hungerRate, speed, size, fearfulness };
}

/**
 * Inherit a single trait from two parents.
 *
 * @remarks
 * Formula: average parent values ± 10% random variation + environmental bonus
 * Result is clamped to reasonable bounds.
 *
 * @param parentA First parent's trait value
 * @param parentB Second parent's trait value
 * @param environmentalBonus Environmental modifier for this trait
 * @returns Inherited trait value
 */
export function inheritTrait(
    parentA: number,
    parentB: number,
    environmentalBonus: number
): number {
    // Average parent values
    const average = (parentA + parentB) / 2;

    // Apply ±10% random variation
    const randomFactor = 1 + (Math.random() - 0.5) * 0.2;

    // Combine: average * randomness + environmental bonus
    const result = average * randomFactor + environmentalBonus;

    // Clamp based on trait type
    // hungerRate: 0.5-2.0
    // speed: 2-8
    // size: 0.5-2.0
    // fearfulness: 0-100
    // Generic: 0.1-100
    return Math.max(0.1, Math.min(100, result));
}

/**
 * Generate offspring genetics from two parents.
 *
 * @remarks
 * Each offspring inherits averaged genetics from both parents,
 * with environmental modifiers based on biome conditions.
 *
 * @param parentA First parent's genetics
 * @param parentB Second parent's genetics
 * @param temperature Birth location temperature
 * @param vegetation Birth location vegetation
 * @param moisture Birth location moisture
 * @returns Offspring genetics
 */
export function generateOffspringGenetics(
    parentA: CreatureGenetics,
    parentB: CreatureGenetics,
    temperature: number,
    vegetation: number,
    moisture: number
): CreatureGenetics {
    const environmental = calculateEnvironmentalBonus(temperature, vegetation, moisture);

    return {
        hungerRate: inheritTrait(parentA.hungerRate, parentB.hungerRate, environmental.hungerRate / 100),
        speed: inheritTrait(parentA.speed, parentB.speed, environmental.speed / 100),
        size: inheritTrait(parentA.size, parentB.size, environmental.size / 100),
        fearfulness: inheritTrait(parentA.fearfulness, parentB.fearfulness, environmental.fearfulness / 100),
    };
}

/**
 * Mutate genetics slightly for variation.
 *
 * @remarks
 * Small random mutations in genetics to ensure population diversity.
 * Mutation rate: ±5% per trait.
 *
 * @param genetics Current genetics
 * @returns Mutated genetics
 */
export function mutateGenetics(genetics: CreatureGenetics): CreatureGenetics {
    const mutationRate = 0.05;

    return {
        hungerRate: genetics.hungerRate * (1 + (Math.random() - 0.5) * 2 * mutationRate),
        speed: genetics.speed * (1 + (Math.random() - 0.5) * 2 * mutationRate),
        size: genetics.size * (1 + (Math.random() - 0.5) * 2 * mutationRate),
        fearfulness: Math.max(0, genetics.fearfulness + (Math.random() - 0.5) * 2 * mutationRate * 100),
    };
}
