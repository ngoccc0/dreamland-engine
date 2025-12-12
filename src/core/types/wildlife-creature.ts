/**
 * Wildlife Creature Entity
 *
 * @remarks
 * Represents an animal/herbivore/predator with genetics, personality, and lifecycle.
 * Separate from monsters (which are combat-only NPCs).
 * Creatures can hunt, breed, form herds, and starve.
 */

import type { CreatureGenetics, CreaturePersonality } from './creature-genetics';

/**
 * Diet type determines what food sources a creature will pursue.
 */
export type DietType = 'herbivorous' | 'carnivorous' | 'omnivorous';

/**
 * Life stage of a creature.
 */
export type LifeStage = 'baby' | 'adult';

/**
 * A wildlife creature entity with genetics, personality, and state.
 *
 * @remarks
 * Creatures have:
 * - Inherited genetics (hungerRate, speed, size, fearfulness)
 * - Personality traits (laziness, aggression, etc.)
 * - Hunger/health tracking
 * - Lifecycle (baby → adult → death)
 * - Pack membership (herds)
 * - Feeding counter (baby becomes adult after eating X times)
 */
export interface WildlifeCreature {
    /** Unique entity ID */
    id: string;

    /** Species template ID (e.g., "deer", "wolf", "rabbit") */
    speciesId: string;

    /** Current position [x, y] */
    position: [number, number];

    /** Inherited genetic traits */
    genetics: CreatureGenetics;

    /** Personality traits (subset of available traits) */
    personality: Partial<CreaturePersonality>;

    /** Life stage: baby or adult */
    stage: LifeStage;

    /** Hunger level (0-100). 0 = starving, 100 = full. */
    hunger: number;

    /** Health (0-100). 0 = dead, 100 = perfect health. */
    health: number;

    /** Number of times this creature has eaten (for baby→adult transition) */
    feedingCount: number;

    /** Pack/herd ID if member of a herd, undefined if solitary */
    packId?: string;

    /** Parent IDs if this is a bred offspring */
    parentIds?: [string, string];

    /** Game tick when this creature spawned */
    spawnedAt: number;

    /** Last tick this creature took a turn */
    lastActionTick?: number;
}

/**
 * Species definition for wildlife creatures.
 *
 * @remarks
 * Defines base stats, diet, size, breeding behavior, etc.
 */
export interface SpeciesDefinition {
    /** Unique species ID (e.g., "deer") */
    id: string;

    /** Display name */
    name: { en: string; vi: string };

    /** What this creature eats */
    dietType: DietType;

    /** Base genetics (average values for species) */
    baseGenetics: CreatureGenetics;

    /** Default personality trait ranges */
    personality: Partial<CreaturePersonality>;

    /** Physical size category */
    size: 'small' | 'medium' | 'large';

    /** Emoji or icon */
    emoji: string;

    /** Whether this creature is carnivorous/herbivorous/omnivorous */
    trophicLevel: 'producer' | 'herbivore' | 'carnivore' | 'omnivore';

    /** Food items/sources this creature eats (species-specific preferences) */
    foodItems?: string[];

    /** If carnivorous, which species can it prey on? */
    preySpecies?: string[];

    /** Feeding requirement threshold to grow from baby to adult */
    adultFeedingThreshold: number;

    /** Pack size (undefined = solitary) */
    packSize?: number;

    /** Can breed with others of same species */
    canBreed: boolean;

    /** Base hunger rate multiplier for species */
    hungerRateMultiplier: number;

    /** Display description */
    description?: { en: string; vi: string };
}

/**
 * Pack/herd collective data.
 *
 * @remarks
 * Represents a group of creatures moving together.
 */
export interface Pack {
    /** Unique pack ID */
    id: string;

    /** Species ID for this pack */
    speciesId: string;

    /** Member creature IDs */
    memberIds: string[];

    /** Alpha (leader) creature ID */
    alphaId?: string;

    /** Pack cohesion (0-100). Higher = stays together more. */
    cohesion: number;

    /** Last hunt location */
    lastHuntLocation?: [number, number];

    /** Ticks since last successful hunt */
    ticksSinceHunt: number;
}
