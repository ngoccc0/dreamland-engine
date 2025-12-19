/**
 * Game Event System - Discriminated Union Types
 *
 * @remarks
 * All game events are strongly typed using discriminated unions.
 * This ensures:
 * - TypeScript enforces exhaustiveness checking (no missed event types)
 * - Payload shape is known at compile time
 * - EventBus can validate event structure
 *
 * Event emission rule: STRICTLY AFTER state transition is complete.
 * Example: CREATURE_KILLED emitted only after HP becomes 0 and isDead=true.
 */

/**
 * Creature death event
 * Emitted when a creature's HP reaches 0 or below
 */
export type CreatureKilledEvent = {
    type: 'CREATURE_KILLED';
    payload: {
        creatureId: string;
        creatureType: string;
        location: {
            biome: string;
            x: number;
            y: number;
        };
        weapon: string | null;
        timestamp: number;
    };
};

/**
 * Item gathering event
 * Emitted when player collects items from the world
 */
export type ItemGatheredEvent = {
    type: 'ITEM_GATHERED';
    payload: {
        itemId: string;
        quantity: number;
        location: {
            biome: string;
            x?: number;
            y?: number;
        };
        tool: string | null;
        timestamp: number;
    };
};

/**
 * Item crafting event
 * Emitted when player successfully crafts an item
 */
export type ItemCraftedEvent = {
    type: 'ITEM_CRAFTED';
    payload: {
        itemId: string;
        quantity: number;
        recipeId: string;
        timestamp: number;
    };
};

/**
 * Item equipment change event
 * Emitted when player equips or unequips gear
 */
export type ItemEquippedEvent = {
    type: 'ITEM_EQUIPPED';
    payload: {
        itemId: string;
        slot: 'mainHand' | 'offHand' | 'head' | 'body' | 'feet';
        equipped: boolean;
        timestamp: number;
    };
};

/**
 * Quest completion event
 * Emitted when a quest is marked as complete
 */
export type QuestCompletedEvent = {
    type: 'QUEST_COMPLETED';
    payload: {
        questId: string;
        rewards: {
            xp: number;
            items: string[];
        };
        timestamp: number;
    };
};

/**
 * Achievement unlock event
 * Emitted when player satisfies achievement criteria
 */
export type AchievementUnlockedEvent = {
    type: 'ACHIEVEMENT_UNLOCKED';
    payload: {
        achievementId: string;
        timestamp: number;
    };
};

/**
 * Damage event
 * Emitted when player takes or deals damage
 */
export type DamageEvent = {
    type: 'DAMAGE';
    payload: {
        source: 'creature' | 'environment' | 'trap';
        damageAmount: number;
        timestamp: number;
    };
};

/**
 * Level up event
 * Emitted when player gains enough XP to level up
 */
export type LevelUpEvent = {
    type: 'LEVEL_UP';
    payload: {
        newLevel: number;
        totalExperience: number;
        timestamp: number;
    };
};

/**
 * World exploration event
 * Emitted when player discovers new biome or location
 */
export type ExplorationEvent = {
    type: 'EXPLORATION';
    payload: {
        discoveryType: 'biome' | 'location';
        biomeName?: string;
        locationName?: string;
        timestamp: number;
    };
};

/**
 * Discriminated union of all game events
 */
export type GameEvent =
    | CreatureKilledEvent
    | ItemGatheredEvent
    | ItemCraftedEvent
    | ItemEquippedEvent
    | QuestCompletedEvent
    | AchievementUnlockedEvent
    | DamageEvent
    | LevelUpEvent
    | ExplorationEvent;

/**
 * Extract event type from union
 * Useful for type narrowing and handlers
 */
export function getEventType(event: GameEvent): GameEvent['type'] {
    return event.type;
}

/**
 * Type guard for exhaustiveness checking
 * Ensures all event handlers cover all cases
 */
export function assertNever(x: never): never {
    throw new Error(`Unhandled event type: ${x}`);
}

/**
 * Helper to create typed event handlers
 * Ensures handler signature matches event payload
 */
export type EventHandler<T extends GameEvent> = (event: T) => void;

/**
 * Event listener registry type
 */
export type EventListener = (event: GameEvent) => void;
