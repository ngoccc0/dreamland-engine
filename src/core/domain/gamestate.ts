import { z } from 'zod';
import { CreatureSchema } from './creature';
import { ItemSchema } from './item';

/**
 * Complete Game State - The save file structure
 *
 * This represents the entire game state that gets persisted.
 * All mutations should result in a new GameState object (immutability).
 *
 * DECISION #7: Hard reset on save incompatibility (no migration layer).
 * Users can't load old saves if major schema changes occur.
 */

/**
 * Player attributes and stats
 */
export const PlayerSchema = z.object({
    id: z.string().uuid().describe('Player entity ID'),
    hp: z.number().min(0).describe('Current health'),
    maxHp: z.number().positive().describe('Maximum health'),
    stamina: z.number().min(0).describe('Current stamina'),
    maxStamina: z.number().positive().describe('Maximum stamina'),
    experience: z.number().int().min(0).describe('Current XP'),
    level: z.number().int().positive().describe('Character level'),
    inventory: z.array(ItemSchema).describe('Inventory items'),
    equipment: z.object({
        mainHand: ItemSchema.optional(),
        offHand: ItemSchema.optional(),
        head: ItemSchema.optional(),
        body: ItemSchema.optional(),
        feet: ItemSchema.optional(),
    }).describe('Equipped gear'),
    attributes: z.record(z.number()).describe('Attributes (strength, dexterity, etc.)'),
    position: z.object({
        x: z.number().int(),
        y: z.number().int(),
    }).describe('Current player position'),
    health_history: z.array(z.number()).max(100).describe('HP history for graphs (last 100 turns)'),
});

export type Player = z.infer<typeof PlayerSchema>;

/**
 * World state (seed, discovered areas, weather, time)
 */
export const WorldSchema = z.object({
    seed: z.number().int().describe('World generation seed (for reproducibility)'),
    currentBiome: z.string().describe('Current biome ID'),
    discoveredBiomes: z.array(z.string()).describe('Biomes player has visited'),
    discoveredLocations: z.record(
        z.object({
            name: z.string(),
            x: z.number().int(),
            y: z.number().int(),
            visited: z.boolean(),
        })
    ).describe('Points of interest'),
    weather: z.object({
        type: z.enum(['clear', 'rain', 'snow', 'storm']),
        intensity: z.number().min(0).max(1),
        remainingTurns: z.number().int(),
    }).describe('Current weather'),
    timeOfDay: z.number().min(0).max(24).describe('Hour (0-24)'),
    dayCount: z.number().int().positive().describe('Days elapsed'),
    explorationProgress: z.number().min(0).max(1).describe('World exploration %'),
});

export type World = z.infer<typeof WorldSchema>;

/**
 * Narrative state (text history, mood, context)
 */
export const NarrativeSchema = z.object({
    lastText: z.string().describe('Last generated narrative text'),
    history: z.array(z.string()).max(100).describe('Narrative history (last 100 entries)'),
    currentMood: z.string().describe('Current narrative mood'),
    context: z.record(z.unknown()).describe('Context variables for narrative generation'),
});

export type Narrative = z.infer<typeof NarrativeSchema>;

/**
 * Complete Game State
 */
export const GameStateSchema = z.object({
    version: z.literal(1).describe('Save file schema version (for migrations)'),
    playerId: z.string().uuid().describe('Player entity ID'),
    timestamp: z.coerce.date().describe('Last save time'),
    turnCount: z.number().int().min(0).describe('Total turns elapsed'),
    currentChunkX: z.number().int().describe('Current chunk X'),
    currentChunkY: z.number().int().describe('Current chunk Y'),

    // Core entities
    player: PlayerSchema,
    world: WorldSchema,
    narrative: NarrativeSchema,

    // Creatures by chunk ID: "x,y" → Array of creatures
    creatures: z.record(z.string(), z.array(CreatureSchema)).describe('Creatures in each chunk'),

    // Quest/task tracking
    activeQuests: z.array(z.object({
        id: z.string(),
        name: z.string(),
        progress: z.record(z.number()),
        completed: z.boolean(),
    })).describe('Active quests'),

    // Achievements
    achievements: z.array(z.string()).describe('Unlocked achievement IDs'),

    // Game stats
    stats: z.object({
        creaturesKilled: z.number().int().default(0),
        itemsCrafted: z.number().int().default(0),
        distanceTraveled: z.number().default(0),
        timeSpent: z.number().int().default(0),
    }).describe('Game statistics'),

    // Modding state
    enabledMods: z.array(z.string()).default([]).describe('Enabled mod IDs'),
});

export type GameState = z.infer<typeof GameStateSchema>;

/**
 * Create initial game state
 */
export function createGameState(playerId: string, seed: number): GameState {
    return {
        version: 1,
        playerId,
        timestamp: new Date(),
        turnCount: 0,
        currentChunkX: 0,
        currentChunkY: 0,

        player: {
            id: playerId,
            hp: 100,
            maxHp: 100,
            stamina: 100,
            maxStamina: 100,
            experience: 0,
            level: 1,
            inventory: [],
            equipment: {},
            attributes: {
                strength: 10,
                dexterity: 10,
                constitution: 10,
                intelligence: 10,
                wisdom: 10,
                charisma: 10,
            },
            position: { x: 0, y: 0 },
            health_history: [],
        },

        world: {
            seed,
            currentBiome: 'forest',
            discoveredBiomes: ['forest'],
            discoveredLocations: {},
            weather: {
                type: 'clear',
                intensity: 0,
                remainingTurns: 100,
            },
            timeOfDay: 12,
            dayCount: 1,
            explorationProgress: 0,
        },

        narrative: {
            lastText: 'You wake up in a mysterious forest...',
            history: [],
            currentMood: 'adventurous',
            context: {},
        },

        creatures: {},
        activeQuests: [],
        achievements: [],
        stats: {
            creaturesKilled: 0,
            itemsCrafted: 0,
            distanceTraveled: 0,
            timeSpent: 0,
        },
        enabledMods: [],
    };
}

/**
 * Validate game state integrity (debugging helper)
 */
export function validateGameState(state: unknown): state is GameState {
    try {
        GameStateSchema.parse(state);
        return true;
    } catch {
        return false;
    }
}
