/**
 * Creature Engine - Main Orchestrator
 *
 * @remarks
 * Coordinates all creature behaviors:
 * - Decision making (hunt, breed, herd, flee)
 * - State updates (hunger, health, lifecycle)
 * - Event generation for immersion
 * - Population management
 */

import type { WildlifeCreature, SpeciesDefinition, Pack } from '@/core/types/wildlife-creature';
import { shouldFlee, calculateFleeDirection } from '@/lib/behaviors/fleeing';
import { shouldHunt, getHuntingRange, calculateHuntingMovement } from '@/lib/behaviors/hunting';
import {
    prefersPack,
    calculateFlockingMovement,
    electAlpha,
    isLostFromPack,
    seekPackMovement,
} from '@/lib/behaviors/herding';
import { canBreed, findMate, generateOffspring, applyBreedingCost, shouldBecomeAdult, promoteToAdult, recordFeeding } from '@/lib/behaviors/breeding';
import { findPath, findNearbyPositions } from '@/lib/pathfinding';
import type { CreatureEvent } from '@/lib/creature-behaviors/immersive-events';
import {
    createLostMemberEvent,
    createTerritorialFightEvent,
    createBirthEvent,
    createPredatorChaseEvent,
    createDeathEvent,
} from '@/lib/creature-behaviors/immersive-events';

/**
 * Result of creature AI decision-making.
 */
export interface CreatureAction {
    /** Movement direction [dx, dy] */
    movement: [number, number];

    /** What creature is doing */
    action: 'idle' | 'hunting' | 'herding' | 'fleeing' | 'breeding' | 'transitioning';

    /** Optional target creature/food */
    targetId?: string;

    /** Events generated this tick */
    events: CreatureEvent[];
}

/**
 * Creature engine configuration.
 */
export interface CreatureEngineConfig {
    /** Max creatures per species */
    maxPopulation: number;

    /** Chunk size in tiles */
    chunkSize: number;

    /** Game tick duration (ms) */
    tickDuration: number;

    /** View radius for creature awareness (cells) */
    creatureViewRadius: number;

    /** World width/height (cells) */
    worldSize: number;
}

/**
 * Main creature engine - coordinates all creature logic.
 *
 * @remarks
 * Call `decideBehavior()` each game tick for each creature in loaded chunks.
 * Engine handles:
 * - Hunger/health management
 * - Behavioral decisions (hunt, breed, herd, flee)
 * - Movement calculation
 * - Event generation
 * - Population balance
 */
export class CreatureEngine {
    private config: CreatureEngineConfig;
    private creatures: Map<string, WildlifeCreature> = new Map();
    private packs: Map<string, Pack> = new Map();
    private speciesDefinitions: Map<string, SpeciesDefinition> = new Map();

    constructor(config: CreatureEngineConfig) {
        this.config = config;
    }

    /**
     * Register a species definition.
     *
     * @param species Species to register
     */
    public registerSpecies(species: SpeciesDefinition): void {
        this.speciesDefinitions.set(species.id, species);
    }

    /**
     * Add creature to engine.
     *
     * @param creature Creature to manage
     */
    public addCreature(creature: WildlifeCreature): void {
        this.creatures.set(creature.id, creature);
    }

    /**
     * Remove creature from engine.
     *
     * @param creatureId Creature to remove
     */
    public removeCreature(creatureId: string): void {
        this.creatures.delete(creatureId);
    }

    /**
     * Main decision-making loop for a creature.
     *
     * @remarks
     * Called each tick to determine creature behavior.
     * Updates creature state and returns action/events.
     *
     * @param creatureId Creature to decide for
     * @param nearbyCreatures Creatures in range
     * @param chunkTemperature Current chunk temp
     * @param chunkVegetation Current chunk vegetation
     * @param chunkMoisture Current chunk moisture
     * @param threats Nearby threats (predators, player)
     * @returns Action with movement and events
     */
    public decideBehavior(
        creatureId: string,
        nearbyCreatures: WildlifeCreature[],
        chunkTemperature: number,
        chunkVegetation: number,
        chunkMoisture: number,
        threats: Array<{ position: [number, number]; severity: number; type: string }> = []
    ): CreatureAction {
        const creature = this.creatures.get(creatureId);
        if (!creature) {
            return { movement: [0, 0], action: 'idle', events: [] };
        }

        const species = this.speciesDefinitions.get(creature.speciesId);
        if (!species) {
            return { movement: [0, 0], action: 'idle', events: [] };
        }

        const events: CreatureEvent[] = [];

        // Update hunger each tick
        const hungerIncrease = species.hungerRateMultiplier * creature.genetics.hungerRate * 0.1;
        creature.hunger = Math.min(100, creature.hunger + hungerIncrease);

        // Check for death from starvation
        if (creature.hunger > 100) {
            creature.health -= 5;
            if (creature.health <= 0) {
                events.push(createDeathEvent(creature, 'starvation', 0));
                this.removeCreature(creatureId);
                return { movement: [0, 0], action: 'idle', events };
            }
        }

        // Check life stage transition
        if (shouldBecomeAdult(creature, species)) {
            promoteToAdult(creature);
        }

        // Threat assessment - flee takes highest priority
        if (threats.length > 0) {
            const threatsTyped = threats.map((t) => ({
                position: t.position,
                severity: t.severity,
                type: t.type,
            }));

            if (shouldFlee(creature, threatsTyped)) {
                const fleeDir = calculateFleeDirection(creature, threatsTyped);
                return { movement: fleeDir, action: 'fleeing', events };
            }
        }

        // Pack/herd behavior
        if (prefersPack(creature) && creature.packId) {
            const pack = this.packs.get(creature.packId);
            if (pack) {
                // Check if separated from pack
                const packCenter = this.calculatePackCenter(pack.memberIds);
                if (isLostFromPack(creature, packCenter)) {
                    events.push(createLostMemberEvent(creature, 0));
                    const seekDir = seekPackMovement(creature, packCenter);
                    return { movement: seekDir, action: 'herding', events };
                }

                // Normal flocking
                const packState = {
                    packId: pack.id,
                    alphaId: pack.alphaId || '',
                    memberPositions: pack.memberIds.map((id) => ({
                        creatureId: id,
                        position: this.creatures.get(id)?.position || [0, 0],
                    })),
                    centerOfMass: packCenter,
                    cohesion: pack.cohesion,
                };

                const flockDir = calculateFlockingMovement(creature, packState);
                return { movement: flockDir, action: 'herding', events };
            }
        }

        // Breeding check
        if (canBreed(creature, species) && creature.stage === 'adult') {
            const mate = findMate(creature, nearbyCreatures, creature.speciesId);
            if (mate) {
                // Generate offspring
                const offspringId = `${creature.speciesId}_${Date.now()}_${Math.random()}`;
                const offspring = generateOffspring(
                    creature,
                    mate,
                    offspringId,
                    0,
                    chunkTemperature,
                    chunkVegetation,
                    chunkMoisture
                );

                // Apply breeding costs
                applyBreedingCost(creature, mate, 20);

                // Add offspring to engine
                this.addCreature(offspring);

                events.push(createBirthEvent(offspring, 0));

                return { movement: [0, 0], action: 'breeding', events };
            }
        }

        // Hunting check
        if (shouldHunt(creature, creature.hunger)) {
            const huntRange = getHuntingRange(creature);
            const nearbyFood = findNearbyPositions(creature.position[0], creature.position[1], huntRange);

            if (nearbyFood.length > 0) {
                // Pick closest food
                const closest = nearbyFood[0];
                const moveDir = calculateHuntingMovement(creature, {
                    position: closest,
                    type: 'plant',
                    quality: 70,
                    nutrition: 30,
                });
                return { movement: moveDir, action: 'hunting', events };
            }
        }

        // Idle/wander
        const laziness = creature.personality.laziness ?? 50;
        if (Math.random() * 100 > laziness) {
            // Random wander
            const range = creature.genetics.speed / 2;
            const moveX = Math.floor((Math.random() - 0.5) * 2 * range);
            const moveY = Math.floor((Math.random() - 0.5) * 2 * range);
            return { movement: [moveX, moveY], action: 'idle', events };
        }

        return { movement: [0, 0], action: 'idle', events };
    }

    /**
     * Calculate center of mass for a pack.
     *
     * @param memberIds Pack member IDs
     * @returns Center position
     */
    private calculatePackCenter(memberIds: string[]): [number, number] {
        let totalX = 0;
        let totalY = 0;

        for (const id of memberIds) {
            const creature = this.creatures.get(id);
            if (creature) {
                totalX += creature.position[0];
                totalY += creature.position[1];
            }
        }

        return [Math.round(totalX / memberIds.length), Math.round(totalY / memberIds.length)];
    }

    /**
     * Get all creatures currently managed.
     *
     * @returns Array of creatures
     */
    public getAllCreatures(): WildlifeCreature[] {
        return Array.from(this.creatures.values());
    }

    /**
     * Get creatures in a specific region.
     *
     * @param x Center X
     * @param y Center Y
     * @param radius Search radius
     * @returns Creatures in range
     */
    public getCreaturesInRange(x: number, y: number, radius: number): WildlifeCreature[] {
        return Array.from(this.creatures.values()).filter((c) => {
            const dist = Math.hypot(c.position[0] - x, c.position[1] - y);
            return dist <= radius;
        });
    }

    /**
     * Get pack information.
     *
     * @param packId Pack to retrieve
     * @returns Pack data or undefined
     */
    public getPack(packId: string): Pack | undefined {
        return this.packs.get(packId);
    }

    /**
     * Create new pack.
     *
     * @param packId Pack ID
     * @param speciesId Species
     * @param initialMembers Starting creatures
     */
    public createPack(packId: string, speciesId: string, initialMembers: WildlifeCreature[]): void {
        const alpha = electAlpha(initialMembers);
        const pack: Pack = {
            id: packId,
            speciesId,
            memberIds: initialMembers.map((c) => c.id),
            alphaId: alpha,
            cohesion: 80,
            ticksSinceHunt: 0,
        };

        this.packs.set(packId, pack);

        // Assign pack to creatures
        for (const creature of initialMembers) {
            creature.packId = packId;
        }
    }

    /**
     * Disband pack (all members become solitary).
     *
     * @param packId Pack to disband
     */
    public disbandPack(packId: string): void {
        const pack = this.packs.get(packId);
        if (pack) {
            for (const memberId of pack.memberIds) {
                const creature = this.creatures.get(memberId);
                if (creature) {
                    creature.packId = undefined;
                }
            }
            this.packs.delete(packId);
        }
    }
}
