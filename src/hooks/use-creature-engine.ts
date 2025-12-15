/**
 * Use Creature Engine Hook
 *
 * @remarks
 * React hook for managing creatures in the game world.
 * Handles spawn, behavior simulation, and cleanup.
 */

import { useEffect, useRef } from 'react';
import { CreatureEngine, type CreatureEngineConfig } from '@/core/engines/creature/engine';
import type { WildlifeCreature } from '@/core/types/wildlife-creature';
import { allSpecies } from '@/core/data/creatures/wildlife';
import { InMemoryCreatureRepository } from '@/infrastructure/persistence/creature-repository';

/**
 * Configuration for creature hook.
 */
export interface UseCreatureEngineConfig {
    enabled: boolean;
    maxCreatures: number;
    creatureViewRadius: number;
}

/**
 * Creature engine hook - manages NPC/creature spawning and lifecycle.
 *
 * @remarks
 * Orchestrates creature AI, behavior simulation, spawning, and cleanup.
 * Handles pathfinding, state updates, and per-tick creature behavior.
 *
 * **Engine responsibilities:**
 * - Register creature species (animal definitions, behavior profiles)
 * - Spawn creatures based on terrain, world density, biome rules
 * - Update creature AI per tick (movement, attacks, interactions)
 * - Manage creature population limits (max 100-500 active creatures)
 * - Cache creatures within view radius for rendering performance
 *
 * **Optimization:**
 * Only creatures within `creatureViewRadius` of player are processed each tick.
 * Uses in-memory repository for fast lookups (no persistence layer).
 *
 * @param {UseCreatureEngineConfig} config - Engine configuration (enabled, maxCreatures, viewRadius)
 * @returns {Object} Engine instance with spawn/update/cleanup control functions
 *
 * @example
 * const engine = useCreatureEngine({
 *   enabled: true,
 *   maxCreatures: 200,
 *   creatureViewRadius: 10
 * });
 * engine.spawnCreaturesNear({ x: 0, y: 0 });
 */
export function useCreatureEngine(config: UseCreatureEngineConfig) {
    const engineRef = useRef<CreatureEngine | null>(null);
    const repositoryRef = useRef(new InMemoryCreatureRepository());

    // Initialize engine once
    useEffect(() => {
        if (!config.enabled) return;

        const engineConfig: CreatureEngineConfig = {
            maxPopulation: config.maxCreatures,
            chunkSize: 16,
            tickDuration: 100,
            creatureViewRadius: config.creatureViewRadius,
            worldSize: 512,
        };

        const engine = new CreatureEngine(engineConfig);

        // Register all species
        for (const species of allSpecies) {
            engine.registerSpecies(species);
        }

        engineRef.current = engine;

        return () => {
            // Cleanup
            engineRef.current = null;
        };
    }, [config.enabled, config.maxCreatures]);

    /**
     * Spawn a creature at a location.
     *
     * @param speciesId Which species to spawn
     * @param x Spawn X position
     * @param y Spawn Y position
     * @returns Spawned creature or undefined
     */
    const spawnCreature = (speciesId: string, x: number, y: number): WildlifeCreature | undefined => {
        if (!engineRef.current) return undefined;

        const creature: WildlifeCreature = {
            id: `${speciesId}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            speciesId,
            position: [x, y],
            genetics: {
                hungerRate: 1.0,
                speed: 5,
                size: 1.0,
                fearfulness: 50,
            },
            personality: {
                laziness: Math.random() * 100,
                aggression: Math.random() * 100,
                caution: Math.random() * 100,
            },
            stage: 'adult',
            hunger: 50,
            health: 100,
            feedingCount: 0,
            spawnedAt: Date.now(),
        };

        engineRef.current.addCreature(creature);
        return creature;
    };

    /**
     * Update creatures in a region.
     *
     * @param playerX Player X position
     * @param playerY Player Y position
     * @param temperature Chunk temperature
     * @param vegetation Chunk vegetation
     * @param moisture Chunk moisture
     */
    const updateCreaturesInView = (
        playerX: number,
        playerY: number,
        temperature: number = 15,
        vegetation: number = 50,
        moisture: number = 50
    ): void => {
        if (!engineRef.current) return;

        const creatures = engineRef.current.getCreaturesInRange(
            playerX,
            playerY,
            config.creatureViewRadius
        );

        for (const creature of creatures) {
            const nearby = engineRef.current.getCreaturesInRange(
                creature.position[0],
                creature.position[1],
                15
            );

            const action = engineRef.current.decideBehavior(
                creature.id,
                nearby,
                temperature,
                vegetation,
                moisture
            );

            // Apply movement
            const [newX, newY] = [creature.position[0] + action.movement[0], creature.position[1] + action.movement[1]];
            creature.position = [newX, newY];

            // Apply hunger changes based on action
            if (action.action === 'hunting') {
                creature.hunger = Math.max(0, creature.hunger - 15); // Gain food
            }
        }
    };

    /**
     * Get all visible creatures.
     *
     * @param playerX Player X
     * @param playerY Player Y
     * @returns Creatures in view
     */
    const getVisibleCreatures = (playerX: number, playerY: number): WildlifeCreature[] => {
        if (!engineRef.current) return [];
        return engineRef.current.getCreaturesInRange(playerX, playerY, config.creatureViewRadius);
    };

    /**
     * Remove a creature.
     *
     * @param creatureId Creature to remove
     */
    const removeCreature = (creatureId: string): void => {
        if (!engineRef.current) return;
        engineRef.current.removeCreature(creatureId);
    };

    /**
     * Get engine instance (for advanced usage).
     */
    const getEngine = (): CreatureEngine | null => {
        return engineRef.current;
    };

    return {
        spawnCreature,
        updateCreaturesInView,
        getVisibleCreatures,
        removeCreature,
        getEngine,
    };
}
