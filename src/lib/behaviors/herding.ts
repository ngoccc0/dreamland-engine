/**
 * Herding & Pack Behavior Module
 *
 * @remarks
 * Handles flocking, pack cohesion, leader election, and coordinated group behavior.
 * Only applies to herd creatures (pack-based species).
 */

import type { WildlifeCreature } from '@/core/types/wildlife-creature';

/**
 * Pack state for behavioral calculations.
 */
export interface PackState {
    /** Pack ID */
    packId: string;

    /** Alpha/leader creature ID */
    alphaId: string;

    /** All member positions */
    memberPositions: Array<{ creatureId: string; position: [number, number] }>;

    /** Average pack position (center of mass) */
    centerOfMass: [number, number];

    /** Pack cohesion (0-100) */
    cohesion: number;
}

/**
 * Determine if creature should join/stay in pack.
 *
 * @remarks
 * Creatures with high sociability prefer packs.
 * Other creatures are mostly solitary (unless already in pack).
 *
 * @param creature Creature to evaluate
 * @returns true if creature prefers pack behavior
 */
export function prefersPack(creature: WildlifeCreature): boolean {
    const sociability = creature.personality.sociability ?? 50;
    return sociability > 40;
}

/**
 * Calculate flocking movement toward pack center.
 *
 * @remarks
 * Implements basic flocking: align, cohere, separate.
 * Creatures move toward pack center but maintain spacing.
 *
 * @param creature Member creature
 * @param packState Current pack state
 * @returns Movement vector [dx, dy]
 */
export function calculateFlockingMovement(
    creature: WildlifeCreature,
    packState: PackState
): [number, number] {
    const [creatureX, creatureY] = creature.position;
    const [centerX, centerY] = packState.centerOfMass;

    // Direction toward center
    const dx = centerX - creatureX;
    const dy = centerY - creatureY;
    const distance = Math.hypot(dx, dy) || 1;

    // If too close to center, move away slightly (separation)
    if (distance < 3) {
        const separationX = (creatureX - centerX) / distance * creature.genetics.speed * 0.5;
        const separationY = (creatureY - centerY) / distance * creature.genetics.speed * 0.5;
        return [Math.round(separationX), Math.round(separationY)];
    }

    // Move toward center (cohesion)
    const moveX = (dx / distance) * creature.genetics.speed;
    const moveY = (dy / distance) * creature.genetics.speed;

    // Apply sociability (social creatures follow more closely)
    const sociability = (creature.personality.sociability ?? 50) / 100;

    return [
        Math.round(moveX * sociability),
        Math.round(moveY * sociability),
    ];
}

/**
 * Elect alpha/leader for pack.
 *
 * @remarks
 * Alpha is strongest/healthiest creature.
 * Aggression increases chance of being alpha.
 *
 * @param members Pack member creatures
 * @returns ID of elected alpha
 */
export function electAlpha(members: WildlifeCreature[]): string {
    if (members.length === 0) return '';

    let alpha = members[0];
    for (const member of members) {
        const memberScore = member.health * 0.5 + member.genetics.speed * 10 + (member.personality.aggression ?? 50);
        const alphaScore = alpha.health * 0.5 + alpha.genetics.speed * 10 + (alpha.personality.aggression ?? 50);

        if (memberScore > alphaScore) {
            alpha = member;
        }
    }

    return alpha.id;
}

/**
 * Check if pack is coherent (not scattered).
 *
 * @remarks
 * Packs with scattered members have reduced cohesion.
 * Returns cohesion factor (0-1).
 *
 * @param packState Pack to evaluate
 * @param maxSpread Maximum distance between members before scatter penalty
 * @returns Cohesion factor
 */
export function evaluatePackCohesion(
    packState: PackState,
    maxSpread: number = 15
): number {
    if (packState.memberPositions.length < 2) return 1.0;

    // Calculate max distance from center
    let maxDist = 0;
    for (const { position } of packState.memberPositions) {
        const [centerX, centerY] = packState.centerOfMass;
        const dist = Math.hypot(position[0] - centerX, position[1] - centerY);
        maxDist = Math.max(maxDist, dist);
    }

    // Cohesion = 1.0 if packed, decreases with scatter
    if (maxDist > maxSpread) {
        return Math.max(0, 1.0 - (maxDist - maxSpread) / maxSpread);
    }

    return 1.0;
}

/**
 * Determine if pack should hunt together.
 *
 * @remarks
 * Packs with high cohesion hunt more effectively together.
 * Aggression in pack members increases hunting tendency.
 *
 * @param packState Pack state
 * @param members Pack creatures
 * @returns true if pack should hunt
 */
export function shouldPackHunt(packState: PackState, members: WildlifeCreature[]): boolean {
    // Need high cohesion to hunt together
    if (packState.cohesion < 0.6) return false;

    // Need aggressive members
    const avgAggression = members.reduce((sum, m) => sum + (m.personality.aggression ?? 50), 0) / members.length;
    return avgAggression > 40;
}

/**
 * Calculate pack hunting formation bonus.
 *
 * @remarks
 * Coordinated pack hunting has higher success rate.
 * Larger, more coherent packs get bigger bonus.
 *
 * @param packSize Number of hunters
 * @param cohesion Pack cohesion factor (0-1)
 * @returns Bonus to hunting success (0-0.5)
 */
export function getPackHuntingBonus(packSize: number, cohesion: number): number {
    const sizeBonus = Math.min(0.3, packSize * 0.05);
    const cohesionBonus = cohesion * 0.2;
    return sizeBonus + cohesionBonus;
}

/**
 * Handle pack member separation detection.
 *
 * @remarks
 * When member gets too far from pack, triggers "lost member" event.
 * Creature may rejoin or go solitary.
 *
 * @param creature Member to check
 * @param packCenter Pack center position
 * @param maxDistance Max distance before considered lost
 * @returns true if creature is lost from pack
 */
export function isLostFromPack(
    creature: WildlifeCreature,
    packCenter: [number, number],
    maxDistance: number = 20
): boolean {
    const [creatureX, creatureY] = creature.position;
    const [centerX, centerY] = packCenter;
    const distance = Math.hypot(creatureX - centerX, creatureY - centerY);
    return distance > maxDistance;
}

/**
 * Calculate movement toward lost pack.
 *
 * @remarks
 * Separated creature seeks pack center with urgency.
 *
 * @param creature Lost creature
 * @param packCenter Pack center position
 * @returns Movement toward pack [dx, dy]
 */
export function seekPackMovement(
    creature: WildlifeCreature,
    packCenter: [number, number]
): [number, number] {
    const [creatureX, creatureY] = creature.position;
    const [centerX, centerY] = packCenter;

    const dx = centerX - creatureX;
    const dy = centerY - creatureY;
    const distance = Math.hypot(dx, dy) || 1;

    // Move toward pack with extra urgency
    const moveX = (dx / distance) * creature.genetics.speed * 1.5;
    const moveY = (dy / distance) * creature.genetics.speed * 1.5;

    return [Math.round(moveX), Math.round(moveY)];
}
