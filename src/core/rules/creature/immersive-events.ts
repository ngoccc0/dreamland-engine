/**
 * Immersive Creature Event System
 *
 * @remarks
 * Generates narrative events for player immersion:
 * - Lost pack members seeking their group
 * - Territorial fights between packs
 * - Birth celebrations
 * - Predator-prey chases
 * - Creature curiosity/defection
 * - Death narratives
 */

import type { WildlifeCreature } from '@/core/types/wildlife-creature';

/**
 * Types of immersive events that can occur.
 */
export type CreatureEventType =
    | 'lost_member_seek'
    | 'pack_territorial_fight'
    | 'creature_birth'
    | 'predator_chase'
    | 'creature_death'
    | 'pack_separation'
    | 'curiosity_wander'
    | 'scavenging';

/**
 * An immersive event for player notification.
 *
 * @remarks
 * Events are generated and displayed to make creature life visible and engaging.
 * Format: translatable narrative with creature/location context.
 */
export interface CreatureEvent {
    /** Unique event ID */
    id: string;

    /** Event type */
    type: CreatureEventType;

    /** Which creature(s) involved */
    creatureIds: string[];

    /** Where it happened */
    location: [number, number];

    /** English narrative (can be translated) */
    narrative: { en: string; vi: string };

    /** Game tick when event occurred */
    tick: number;

    /** Severity (0-100): affects whether player notices */
    severity: number;
}

/**
 * Generate event for lost pack member seeking its group.
 *
 * @remarks
 * Creature separated from pack triggers narrative event.
 * Higher sociability = more distressed.
 *
 * @param creature Lost creature
 * @param tick Game tick
 * @returns Event to display
 */
export function createLostMemberEvent(creature: WildlifeCreature, tick: number): CreatureEvent {
    const sociability = creature.personality.sociability ?? 50;
    const severity = Math.min(100, sociability * 0.8);

    return {
        id: `event_lost_${creature.id}_${tick}`,
        type: 'lost_member_seek',
        creatureIds: [creature.id],
        location: creature.position,
        narrative: {
            en: `A lonely ${creature.speciesId} searches for its pack at [${creature.position[0]}, ${creature.position[1]}]...`,
            vi: `Một con ${creature.speciesId} cô đơn đang tìm kiếm bầy của nó tại [${creature.position[0]}, ${creature.position[1]}]...`,
        },
        tick,
        severity,
    };
}

/**
 * Generate event for territorial pack fight.
 *
 * @remarks
 * Two packs encounter and fight over territory.
 *
 * @param packAId First pack ID
 * @param packBId Second pack ID
 * @param location Fight location
 * @param tick Game tick
 * @returns Event to display
 */
export function createTerritorialFightEvent(
    packAId: string,
    packBId: string,
    location: [number, number],
    tick: number
): CreatureEvent {
    const severity = 85;

    return {
        id: `event_fight_${packAId}_vs_${packBId}_${tick}`,
        type: 'pack_territorial_fight',
        creatureIds: [packAId, packBId],
        location,
        narrative: {
            en: `Two packs clash in a territorial dispute at [${location[0]}, ${location[1]}]!`,
            vi: `Hai bầy đụng độ trong cuộc tranh chấp lãnh thổ tại [${location[0]}, ${location[1]}]!`,
        },
        tick,
        severity,
    };
}

/**
 * Generate event for creature birth.
 *
 * @remarks
 * A baby is born! Celebrate new life in the ecosystem.
 *
 * @param offspring Baby creature
 * @param tick Game tick
 * @returns Event to display
 */
export function createBirthEvent(offspring: WildlifeCreature, tick: number): CreatureEvent {
    return {
        id: `event_birth_${offspring.id}_${tick}`,
        type: 'creature_birth',
        creatureIds: [offspring.id],
        location: offspring.position,
        narrative: {
            en: `A baby ${offspring.speciesId} is born at [${offspring.position[0]}, ${offspring.position[1]}]! 🎉`,
            vi: `Một con non ${offspring.speciesId} được sinh ra tại [${offspring.position[0]}, ${offspring.position[1]}]! 🎉`,
        },
        tick,
        severity: 60,
    };
}

/**
 * Generate event for predator chase.
 *
 * @remarks
 * A predator is hunting prey - exciting chase sequence.
 *
 * @param predatorId Hunting creature
 * @param preyId Fleeing creature
 * @param location Chase location
 * @param tick Game tick
 * @returns Event to display
 */
export function createPredatorChaseEvent(
    predatorId: string,
    preyId: string,
    location: [number, number],
    tick: number
): CreatureEvent {
    const severity = 80;

    return {
        id: `event_chase_${predatorId}_vs_${preyId}_${tick}`,
        type: 'predator_chase',
        creatureIds: [predatorId, preyId],
        location,
        narrative: {
            en: `A tense hunt unfolds at [${location[0]}, ${location[1]}] - predator and prey in a deadly chase!`,
            vi: `Một cuộc săn bắn căng thẳng diễn ra tại [${location[0]}, ${location[1]}] - thợ săn và con mồi trong một cuộc rượt đuổi chết chóc!`,
        },
        tick,
        severity,
    };
}

/**
 * Generate event for creature death.
 *
 * @remarks
 * A creature dies (from starvation, predation, or age).
 *
 * @param creature Deceased creature
 * @param cause Cause of death
 * @param tick Game tick
 * @returns Event to display
 */
export function createDeathEvent(
    creature: WildlifeCreature,
    cause: 'starvation' | 'predation' | 'old_age',
    tick: number
): CreatureEvent {
    const causes = {
        starvation: { en: 'of starvation', vi: 'vì đói' },
        predation: { en: 'in the jaws of a predator', vi: 'dưới nanh vuốt của kẻ thợ săn' },
        old_age: { en: 'of old age', vi: 'vì tuổi tác' },
    };

    const causeText = causes[cause];

    return {
        id: `event_death_${creature.id}_${tick}`,
        type: 'creature_death',
        creatureIds: [creature.id],
        location: creature.position,
        narrative: {
            en: `A ${creature.speciesId} dies ${causeText.en} at [${creature.position[0]}, ${creature.position[1]}].`,
            vi: `Một con ${creature.speciesId} chết ${causeText.vi} tại [${creature.position[0]}, ${creature.position[1]}].`,
        },
        tick,
        severity: 50,
    };
}

/**
 * Generate event for pack separation.
 *
 * @remarks
 * A pack splits apart - members scatter.
 *
 * @param packId Pack that scattered
 * @param location Where separation occurred
 * @param tick Game tick
 * @returns Event to display
 */
export function createPackSeparationEvent(
    packId: string,
    location: [number, number],
    tick: number
): CreatureEvent {
    return {
        id: `event_separation_${packId}_${tick}`,
        type: 'pack_separation',
        creatureIds: [packId],
        location,
        narrative: {
            en: `A pack scatters and disperses at [${location[0]}, ${location[1]}]...`,
            vi: `Một bầy phân tán tại [${location[0]}, ${location[1]}]...`,
        },
        tick,
        severity: 40,
    };
}

/**
 * Generate event for curious creature wandering.
 *
 * @remarks
 * A creature with high curiosity explores something unusual.
 *
 * @param creature Curious creature
 * @param tick Game tick
 * @returns Event to display
 */
export function createCuriosityEvent(creature: WildlifeCreature, tick: number): CreatureEvent {
    const curiosity = creature.personality.curiosity ?? 50;
    const severity = Math.min(100, curiosity);

    return {
        id: `event_curious_${creature.id}_${tick}`,
        type: 'curiosity_wander',
        creatureIds: [creature.id],
        location: creature.position,
        narrative: {
            en: `A curious ${creature.speciesId} investigates something interesting at [${creature.position[0]}, ${creature.position[1]}].`,
            vi: `Một con ${creature.speciesId} tò mò đang khám phá một cái gì đó thú vị tại [${creature.position[0]}, ${creature.position[1]}].`,
        },
        tick,
        severity,
    };
}

/**
 * Generate event for scavenging behavior.
 *
 * @remarks
 * Creature finds and eats a carcass or resource.
 *
 * @param creature Scavenging creature
 * @param food What was found
 * @param tick Game tick
 * @returns Event to display
 */
export function createScavengingEvent(
    creature: WildlifeCreature,
    food: string,
    tick: number
): CreatureEvent {
    return {
        id: `event_scavenge_${creature.id}_${tick}`,
        type: 'scavenging',
        creatureIds: [creature.id],
        location: creature.position,
        narrative: {
            en: `A ${creature.speciesId} finds and eats ${food} at [${creature.position[0]}, ${creature.position[1]}].`,
            vi: `Một con ${creature.speciesId} tìm thấy và ăn ${food} tại [${creature.position[0]}, ${creature.position[1]}].`,
        },
        tick,
        severity: 20,
    };
}

/**
 * Determine if event is significant enough to display.
 *
 * @remarks
 * Uses severity and player proximity to decide visibility.
 *
 * @param event Event to evaluate
 * @param playerX Player X position
 * @param playerY Player Y position
 * @param viewRadius Render view radius
 * @returns true if player should see event
 */
export function shouldDisplayEvent(
    event: CreatureEvent,
    playerX: number,
    playerY: number,
    viewRadius: number = 21
): boolean {
    // Distance from player
    const distance = Math.hypot(event.location[0] - playerX, event.location[1] - playerY);

    // Always show if within immediate view
    if (distance < viewRadius) return true;

    // Show very severe events even at distance
    if (event.severity > 80) return true;

    return false;
}
