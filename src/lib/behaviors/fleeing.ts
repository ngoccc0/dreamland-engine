/**
 * Fleeing Behavior Module
 *
 * @remarks
 * Handles escape/avoidance behavior for creatures when threatened.
 * Considers creature's fearfulness stat and threat proximity.
 */

import type { WildlifeCreature } from '@/core/types/wildlife-creature';

/**
 * Threat assessment for a creature.
 */
export interface Threat {
    /** Threat source position [x, y] */
    position: [number, number];

    /** Threat severity (0-100) */
    severity: number;

    /** Type of threat: 'predator', 'player', 'fire', etc. */
    type: string;
}

/**
 * Calculate if creature should flee.
 *
 * @remarks
 * Creature flees if there's a nearby threat and health is low.
 * Personality-influenced: more cautious creatures flee earlier.
 *
 * @param creature The creature to evaluate
 * @param threats Nearby threats
 * @returns true if creature should flee
 */
export function shouldFlee(creature: WildlifeCreature, threats: Threat[]): boolean {
    if (threats.length === 0) return false;

    // Check if any threat is close enough to trigger fleeing
    const threat = threats[0];
    const distance = Math.hypot(threat.position[0] - creature.position[0], threat.position[1] - creature.position[1]);

    // Creature's flee threshold (influenced by caution personality)
    const caution = creature.personality.caution ?? 50;
    const fearfulness = creature.genetics.fearfulness;
    const fleeThreshold = Math.max(3, (caution + fearfulness) / 10); // 3-15 cell range

    if (distance > fleeThreshold) return false;

    // Check health (flee if badly hurt)
    if (creature.health < 30 && threat.severity > 20) return true;

    // Check threat severity vs creature fearfulness
    const threatRisk = (threat.severity * fearfulness) / 100;
    return threatRisk > 40;
}

/**
 * Calculate flee direction away from threats.
 *
 * @remarks
 * Moves away from the closest threat, considering movement speed.
 *
 * @param creature Creature to move
 * @param threats Threats to avoid
 * @returns Desired movement direction [dx, dy], or [0, 0] if no need to flee
 */
export function calculateFleeDirection(
    creature: WildlifeCreature,
    threats: Threat[]
): [number, number] {
    if (threats.length === 0) return [0, 0];

    // Find primary threat
    const threat = threats[0];
    const [creatureX, creatureY] = creature.position;
    const [threatX, threatY] = threat.position;

    // Direction away from threat
    const dx = creatureX - threatX;
    const dy = creatureY - threatY;
    const dist = Math.hypot(dx, dy) || 1;

    // Normalize and scale by creature speed
    const moveX = (dx / dist) * creature.genetics.speed;
    const moveY = (dy / dist) * creature.genetics.speed;

    // Apply laziness reduction (lazy creatures don't flee as far)
    const laziness = creature.personality.laziness ?? 0;
    const effortMultiplier = 1 - laziness / 100;

    return [
        Math.round(moveX * effortMultiplier),
        Math.round(moveY * effortMultiplier),
    ];
}

/**
 * Find safe refuge position for fleeing creature.
 *
 * @remarks
 * Looks for terrain or obstacle that might provide cover.
 * Used to guide creature toward safety (dense forest, terrain feature, etc).
 *
 * @param creatureX Current X
 * @param creatureY Current Y
 * @param threats Nearby threats
 * @param isSafeLocation Function to check if location is safe
 * @param range How far to search (cells)
 * @returns Safe position [x, y], or undefined if none found
 */
export function findSafeRefuge(
    creatureX: number,
    creatureY: number,
    threats: Threat[],
    isSafeLocation: (x: number, y: number) => boolean,
    range: number = 10
): [number, number] | undefined {
    if (threats.length === 0) return undefined;

    const threat = threats[0];
    const [threatX, threatY] = threat.position;

    // Direction away from threat
    const dirX = Math.sign(creatureX - threatX) || 1;
    const dirY = Math.sign(creatureY - threatY) || 1;

    // Scan for safe locations in flee direction
    for (let dist = 1; dist <= range; dist++) {
        const checkX = creatureX + dirX * dist;
        const checkY = creatureY + dirY * dist;

        if (isSafeLocation(checkX, checkY)) {
            return [checkX, checkY];
        }
    }

    return undefined;
}

/**
 * Panic response when cornered (all exits blocked).
 *
 * @remarks
 * Returns random erratic movement when creature can't escape normally.
 * Increases damage taken but might break through thin obstacles.
 *
 * @returns Random panic movement [dx, dy]
 */
export function panicMovement(): [number, number] {
    const x = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
    const y = Math.floor(Math.random() * 3) - 1;
    return [x, y];
}
