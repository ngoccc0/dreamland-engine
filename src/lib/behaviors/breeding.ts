/**
 * Breeding & Reproduction Behavior Module
 *
 * @remarks
 * Handles creature reproduction, offspring generation, and lifecycle transitions.
 * Simple breeding: 2 creatures same species in same cell → offspring.
 */

import type { WildlifeCreature, SpeciesDefinition } from '@/core/types/wildlife-creature';
import type { CreaturePersonality } from '@/core/types/creature-genetics';
import { generateOffspringGenetics } from '@/core/types/creature-genetics';

/**
 * Check if creature is ready to breed.
 *
 * @remarks
 * Creature must be adult and not too hungry.
 * Only applies to species that can breed.
 *
 * @param creature Creature to evaluate
 * @param species Species definition
 * @returns true if creature can breed
 */
export function canBreed(creature: WildlifeCreature, species: SpeciesDefinition): boolean {
    // Must be adult
    if (creature.stage !== 'adult') return false;

    // Must not be too hungry (energy for breeding)
    if (creature.hunger > 60) return false;

    // Species must support breeding
    return species.canBreed;
}

/**
 * Find potential mate in nearby creatures.
 *
 * @remarks
 * Looks for another creature of same species that is ready to breed.
 *
 * @param creature Current creature
 * @param nearbyCreatures Creatures nearby
 * @param speciesId Species ID to match
 * @param breedingRange Max distance for mating
 * @returns Mate creature if found
 */
export function findMate(
    creature: WildlifeCreature,
    nearbyCreatures: WildlifeCreature[],
    speciesId: string,
    breedingRange: number = 3
): WildlifeCreature | undefined {
    for (const other of nearbyCreatures) {
        // Must be same species
        if (other.speciesId !== speciesId) continue;

        // Must be in range
        const distance = Math.hypot(
            other.position[0] - creature.position[0],
            other.position[1] - creature.position[1]
        );
        if (distance > breedingRange) continue;

        // Must not be same creature
        if (other.id === creature.id) continue;

        // Must be in same cell (for simple breeding)
        if (
            other.position[0] !== creature.position[0] ||
            other.position[1] !== creature.position[1]
        )
            continue;

        // Other must also be ready to breed
        if (other.stage !== 'adult' || other.hunger > 60) continue;

        return other;
    }

    return undefined;
}

/**
 * Generate offspring from two parents.
 *
 * @remarks
 * Creates new creature with inherited genetics from both parents.
 * Offspring genetics = average of parents ± 10% + environmental factors.
 *
 * @param parent1 First parent
 * @param parent2 Second parent
 * @param offspringId ID for new creature
 * @param spawnTick Current game tick
 * @param temperature Birth location temperature
 * @param vegetation Birth location vegetation
 * @param moisture Birth location moisture
 * @returns New offspring creature
 */
export function generateOffspring(
    parent1: WildlifeCreature,
    parent2: WildlifeCreature,
    offspringId: string,
    spawnTick: number,
    temperature: number,
    vegetation: number,
    moisture: number
): WildlifeCreature {
    // Inherit genetics from both parents
    const genetics = generateOffspringGenetics(
        parent1.genetics,
        parent2.genetics,
        temperature,
        vegetation,
        moisture
    );

    // Inherit random subset of personality traits
    const personality = inheritPersonality(parent1.personality, parent2.personality);

    return {
        id: offspringId,
        speciesId: parent1.speciesId,
        position: parent1.position,
        genetics,
        personality,
        stage: 'baby',
        hunger: 50,
        health: 100,
        feedingCount: 0,
        spawnedAt: spawnTick,
        parentIds: [parent1.id, parent2.id],
    };
}

/**
 * Inherit personality from both parents.
 *
 * @remarks
 * Randomly selects which parent's traits to inherit.
 *
 * @param personality1 Parent 1 personality
 * @param personality2 Parent 2 personality
 * @returns Offspring personality (subset of both parents)
 */
function inheritPersonality(
    personality1: Partial<CreaturePersonality>,
    personality2: Partial<CreaturePersonality>
): Partial<CreaturePersonality> {
    const result: Partial<CreaturePersonality> = {};

    const traits = ['laziness', 'aggression', 'caution', 'greediness', 'sociability', 'curiosity'] as const;

    for (const trait of traits) {
        // 50/50 inherit from parent or blend
        if (Math.random() < 0.5) {
            if (personality1[trait] !== undefined) {
                result[trait] = personality1[trait];
            }
        } else {
            if (personality2[trait] !== undefined) {
                result[trait] = personality2[trait];
            }
        }
    }

    return result;
}

/**
 * Handle breeding energy cost.
 *
 * @remarks
 * Both parents lose hunger/energy from breeding effort.
 * Offspring is born hungry.
 *
 * @param parent1 Parent to modify (mutates)
 * @param parent2 Parent to modify (mutates)
 * @param breedingCost Energy cost of breeding (0-50)
 */
export function applyBreedingCost(
    parent1: WildlifeCreature,
    parent2: WildlifeCreature,
    breedingCost: number = 20
): void {
    parent1.hunger = Math.min(100, parent1.hunger + breedingCost);
    parent2.hunger = Math.min(100, parent2.hunger + breedingCost);
}

/**
 * Check if creature should transition from baby to adult.
 *
 * @remarks
 * Happens when feeding count reaches threshold.
 *
 * @param creature Baby creature to check
 * @param species Species definition
 * @returns true if should become adult
 */
export function shouldBecomeAdult(
    creature: WildlifeCreature,
    species: SpeciesDefinition
): boolean {
    return creature.stage === 'baby' && creature.feedingCount >= species.adultFeedingThreshold;
}

/**
 * Transition creature from baby to adult.
 *
 * @remarks
 * Updates life stage and resets hunger somewhat.
 *
 * @param creature Creature to mature (mutates)
 */
export function promoteToAdult(creature: WildlifeCreature): void {
    creature.stage = 'adult';
    creature.hunger = Math.max(0, creature.hunger - 10); // Give small hunger reset
}

/**
 * Increment feeding counter for baby creature.
 *
 * @remarks
 * Called each time baby eats. When counter reaches threshold, baby becomes adult.
 *
 * @param creature Baby creature (mutates)
 */
export function recordFeeding(creature: WildlifeCreature): void {
    creature.feedingCount += 1;
}

/**
 * Calculate reproduction energetic cost for population balance.
 *
 * @remarks
 * Prevents population explosion.
 * Higher energy cost when population is large.
 *
 * @param currentPopulation Current population count
 * @param maxCarryingCapacity Population limit
 * @returns Breeding cost multiplier (1.0-3.0)
 */
export function getBreedingCostMultiplier(
    currentPopulation: number,
    maxCarryingCapacity: number = 100
): number {
    const ratio = currentPopulation / maxCarryingCapacity;

    if (ratio < 0.5) return 1.0; // Normal cost
    if (ratio < 0.75) return 1.5; // Increased cost
    if (ratio < 0.9) return 2.0; // High cost
    return 3.0; // Very high cost
}
