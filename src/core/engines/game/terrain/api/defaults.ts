import { TerrainType, TerrainTypeDefaults } from './types';

/**
 * Default extended attributes for each terrain type (moved to core engines)
 */
export const terrainDefaults: Record<TerrainType, TerrainTypeDefaults> = {
    forest: {
        type: 'forest',
        extendedAttributes: {
            windLevel: 40,        // Reduced wind due to trees
            lightLevel: 60,       // Partial shade from canopy
            dangerLevel: 30,      // Moderate danger from wildlife
            explorability: 70,    // Fairly explorable
            travelCost: 1.5,      // Slightly harder to traverse
            magicAffinity: 60,    // Good magical energy
            humanPresence: 20,    // Low human activity
            predatorPresence: 40  // Moderate predator activity
        }
    },
    desert: {
        type: 'desert',
        extendedAttributes: {
            windLevel: 80,        // High winds
            lightLevel: 100,      // Full sunlight
            dangerLevel: 60,      // High danger from environment
            explorability: 90,    // Very explorable (clear sight)
            travelCost: 3,        // Hard to traverse
            magicAffinity: 40,    // Moderate magical energy
            humanPresence: 10,    // Very low human activity
            predatorPresence: 20  // Low predator activity
        }
    },
    mountain: {
        type: 'mountain',
        extendedAttributes: {
            windLevel: 90,        // Very high winds
            lightLevel: 90,       // Good light (above treeline)
            dangerLevel: 70,      // Very dangerous
            explorability: 50,    // Moderately difficult to explore
            travelCost: 4,        // Very hard to traverse
            magicAffinity: 80,    // High magical energy
            humanPresence: 5,     // Very low human activity
            predatorPresence: 30  // Moderate predator activity
        }
    },
    // ... add other terrain types as needed ...
    grassland: {
        type: 'grassland',
        extendedAttributes: {
            windLevel: 70,
            lightLevel: 90,
            dangerLevel: 20,
            explorability: 100,
            travelCost: 1,
            magicAffinity: 30,
            humanPresence: 50,
            predatorPresence: 30
        }
    },
    swamp: {
        type: 'swamp',
        extendedAttributes: {
            windLevel: 20,
            lightLevel: 40,
            dangerLevel: 60,
            explorability: 40,
            travelCost: 3,
            magicAffinity: 70,
            humanPresence: 10,
            predatorPresence: 50
        }
    },
    cave: {
        type: 'cave',
        extendedAttributes: {
            windLevel: 10,
            lightLevel: 10,
            dangerLevel: 50,
            explorability: 30,
            travelCost: 2,
            magicAffinity: 90,
            humanPresence: 5,
            predatorPresence: 40
        }
    },
    jungle: {
        type: 'jungle',
        extendedAttributes: {
            windLevel: 30,
            lightLevel: 40,
            dangerLevel: 70,
            explorability: 40,
            travelCost: 3,
            magicAffinity: 70,
            humanPresence: 15,
            predatorPresence: 60
        }
    },
    volcanic: {
        type: 'volcanic',
        extendedAttributes: {
            windLevel: 60,
            lightLevel: 70,
            dangerLevel: 90,
            explorability: 30,
            travelCost: 4,
            magicAffinity: 100,
            humanPresence: 0,
            predatorPresence: 10
        }
    }
};
