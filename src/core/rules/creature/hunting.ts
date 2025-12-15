/**
 * Hunting & Foraging Behavior Module
 *
 * @remarks
 * Handles food-seeking behavior for both predators (hunting prey) and herbivores (foraging plants).
 * Influenced by hunger, greediness, and creature genetics.
 */

import type { WildlifeCreature } from '@/core/types/wildlife-creature';

/**
 * Food source detected by a creature.
 */
export interface FoodSource {
    /** Position of food [x, y] */
    position: [number, number];

    /** Type: 'plant', 'animal', 'item', 'carcass' */
    type: 'plant' | 'animal' | 'item' | 'carcass';

    /** For 'animal' sources: the creature being hunted */
    preyCreatureId?: string;

    /** Quality/preference of this food (0-100) */
    quality: number;

    /** Nutritional value (how much hunger it satisfies) */
    nutrition: number;
}

/**
 * Determine if a creature should hunt/forage.
 *
 * @remarks
 * Creature hunts when hungry, with threshold influenced by personality.
 *
 * @param creature Creature to evaluate
 * @param hunger Current hunger level (0-100)
 * @returns true if creature should actively hunt for food
 */
export function shouldHunt(creature: WildlifeCreature, hunger: number): boolean {
    // Base hunting threshold
    let huntThreshold = 70; // Hunt when hunger > 70

    // Adjust for greediness (greedy creatures hunt earlier)
    const greediness = creature.personality.greediness ?? 50;
    huntThreshold -= greediness / 10; // 0-100 greediness reduces threshold by 0-10

    // Adjust for laziness (lazy creatures delay hunting)
    const laziness = creature.personality.laziness ?? 0;
    huntThreshold += laziness / 15; // 0-100 laziness increases threshold by 0-6.67

    return hunger > huntThreshold;
}

/**
 * Calculate hunting range based on creature traits.
 *
 * @remarks
 * Faster creatures hunt farther, greedy creatures search wider.
 * Returns max distance to search for prey.
 *
 * @param creature Creature hunting
 * @returns Search range in cells
 */
export function getHuntingRange(creature: WildlifeCreature): number {
    const baseRange = 15;
    const speedBonus = creature.genetics.speed * 2;
    const greediness = (creature.personality.greediness ?? 50) / 100;

    return Math.round(baseRange + speedBonus + greediness * 10);
}

/**
 * Evaluate food source desirability.
 *
 * @remarks
 * Scores food based on distance, nutrition, and creature preferences.
 * Used to select best target when multiple food sources available.
 *
 * @param creature Hunting creature
 * @param foodSource Target food
 * @param creatureX Creature X position
 * @param creatureY Creature Y position
 * @returns Desirability score (higher = better)
 */
export function evaluateFoodSource(
    creature: WildlifeCreature,
    foodSource: FoodSource,
    creatureX: number,
    creatureY: number
): number {
    const distance = Math.hypot(
        foodSource.position[0] - creatureX,
        foodSource.position[1] - creatureY
    );

    // Distance penalty (closer is better)
    const distanceFactor = Math.max(0, 1 - distance / getHuntingRange(creature));

    // Quality/preference bonus
    const qualityFactor = foodSource.quality / 100;

    // Nutrition factor (how satisfying)
    const nutritionFactor = foodSource.nutrition / 100;

    // Combine factors
    const score = (distanceFactor * 0.4 + qualityFactor * 0.3 + nutritionFactor * 0.3) * 100;

    return score;
}

/**
 * Calculate movement direction toward food.
 *
 * @remarks
 * Direct pathfinding toward target food source, scaled by creature speed.
 *
 * @param creature Creature hunting
 * @param targetFood Target to move toward
 * @returns Movement vector [dx, dy]
 */
export function calculateHuntingMovement(
    creature: WildlifeCreature,
    targetFood: FoodSource
): [number, number] {
    const [creatureX, creatureY] = creature.position;
    const [foodX, foodY] = targetFood.position;

    // Direction toward food
    const dx = foodX - creatureX;
    const dy = foodY - creatureY;
    const distance = Math.hypot(dx, dy) || 1;

    // Normalize to unit vector
    const unitX = dx / distance;
    const unitY = dy / distance;

    // Scale by creature speed
    const moveX = unitX * creature.genetics.speed;
    const moveY = unitY * creature.genetics.speed;

    // Apply laziness reduction
    const laziness = creature.personality.laziness ?? 0;
    const effort = 1 - laziness / 100;

    return [
        Math.round(moveX * effort),
        Math.round(moveY * effort),
    ];
}

/**
 * Determine if creature can successfully hunt a prey.
 *
 * @remarks
 * Predators have success chance based on stats.
 * Small/young prey are easier to catch.
 *
 * @param predator Predator creature
 * @param preyCreature Prey creature info
 * @returns true if hunt succeeds
 */
export function attemptHunt(
    predator: WildlifeCreature,
    preyCreature: WildlifeCreature
): boolean {
    // Base success rate
    let successRate = 0.5;

    // Predator speed advantage
    const speedDiff = (predator.genetics.speed - preyCreature.genetics.speed) / 10;
    successRate += speedDiff * 0.05;

    // Predator aggression bonus
    const aggression = (predator.personality.aggression ?? 50) / 100;
    successRate += aggression * 0.1;

    // Prey fearfulness bonus (easier to catch scared prey)
    const fear = preyCreature.genetics.fearfulness / 100;
    successRate += fear * 0.1;

    // Clamp to 0-0.95 (always some chance of escape)
    successRate = Math.max(0, Math.min(0.95, successRate));

    return Math.random() < successRate;
}

/**
 * Calculate hunger reduction when eating food.
 *
 * @remarks
 * Determines how much hunger is satisfied by eating.
 *
 * @param creature Creature eating
 * @param foodQuality Food quality (0-100)
 * @param foodNutrition Nutrition value
 * @returns Hunger reduction amount
 */
export function calculateHungerSatisfaction(
    creature: WildlifeCreature,
    foodQuality: number,
    foodNutrition: number
): number {
    // Base satisfaction
    let satisfaction = foodNutrition;

    // Size multiplier (larger creatures need more food)
    const sizeFactor = creature.genetics.size;
    satisfaction = satisfaction / sizeFactor;

    // Hunger multiplier (very hungry creatures get more from food)
    if (creature.hunger > 80) {
        satisfaction *= 1.2;
    }

    return Math.min(100 - creature.hunger, satisfaction);
}
