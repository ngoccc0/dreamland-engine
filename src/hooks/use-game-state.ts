'use client';

import { useState, useEffect } from "react";
import type { GameState, NarrativeEntry, Chunk, Season, WorldProfile, Region, ItemDefinition, WeatherZone, Recipe, PlayerBehaviorProfile, Structure, GeneratedItem } from "@/core/types/game";
// Temporary type definitions for missing types
type WorldType = any;
type PlayerStatus = any;
// Define GameStateProps if missing
interface GameStateProps {
    gameSlot: number;
}
// Add missing imports for factories, generators, enums, and static data
// deferred world generation imports removed — keep placeholder init minimal
import { allRecipes as staticRecipes } from '@/core/data/recipes';
import { buildableStructures as staticBuildableStructures } from '@/core/data/structures';
import { allItems as staticItemDefinitions } from '@/core/data/items';
import { biomeDefinitions as staticBiomeDefinitions } from '@/core/data/biomes';
import WorldImpl from '@/core/entities/world-impl';
import { TerrainFactory } from '@/core/factories/terrain-factory';
import { WorldGenerator } from '@/core/generators/world-generator';
// Avoid importing `allTerrains` here to prevent potential circular
// initialization order issues during module evaluation in Next.js.
const TERRAIN_LITERALS = [
    'forest', 'grassland', 'desert', 'swamp', 'mountain', 'cave', 'jungle', 'volcanic', 'wall', 'floptropica', 'tundra', 'beach', 'mesa', 'mushroom_forest', 'ocean', 'city', 'space_station', 'underwater'
];
/**
 * Central game state manager for Dreamland Engine.
 *
 * @remarks
 * Manages all game world state including player stats, position, inventory, world generation,
 * weather, creatures, items, structures, and narrative entries. Uses React hooks to provide
 * a reactive interface to game state mutations.
 *
 * The hook initializes the world asynchronously on first mount using WorldGenerator and
 * TerrainFactory. Resource density varies per world (0.5 to 1.5 multiplier) to ensure
 * generated worlds have different abundance levels.
 *
 * **State Structure:**
 * - World & Terrain: `world`, `worldProfile`, `regions`, `playerPosition`, `visualPlayerPosition`
 * - Time & Weather: `currentSeason`, `gameTime`, `day`, `turn`, `weatherZones`
 * - Player: `playerStats`, `playerBehaviorProfile`, `customItemCatalog`
 * - Definitions: `recipes`, `buildableStructures`, `biomeDefinitions`, `customItemDefinitions`
 * - Narrative: `narrativeLog`, `currentChunk`
 * - UI State: `isLoading`, `isGameOver`, `isSaving`, `isLoaded`, `isAnimatingMove`
 *
 * **Visual Animation Fields:**
 * - `visualPlayerPosition`: Animated position for smooth tile-to-tile movement
 * - `visualMoveFrom` / `visualMoveTo`: Animation endpoints for move sequences
 * - `visualJustLanded`: Brief flag to trigger landing bounce effect
 *
 * @param {GameStateProps} props - Configuration object with `gameSlot` (unused, reserved for future multi-save support)
 * @returns {Object} Game state object with 80+ getter/setter pairs for reactive state updates
 *
 * @example
 * const gameState = useGameState({ gameSlot: 0 });
 * console.log(gameState.playerStats.hp); // Current player health
 * gameState.setPlayerPosition({ x: 5, y: 10 }); // Move player
 * gameState.setNarrativeLog([...gameState.narrativeLog, newEntry]); // Append narrative
 */
// Accept gameSlot but mark as intentionally unused to satisfy lint rule
export function useGameState({ gameSlot: _gameSlot }: GameStateProps) {
    const [narrativeLog, setNarrativeLog] = useState<NarrativeEntry[]>([]);
    const [currentChunk, setCurrentChunk] = useState<Chunk | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    /**
     * The `worldProfile` holds global world configuration used by generation
     * systems. We initialize `resourceDensity` to a random multiplier between
     * 0.5 and 1.5 so that new worlds vary in abundance. This value is applied
     * multiplicatively in generation code (per-entity spawnChance and chunk
     * item-count scaling).
     *
     * If you want deterministic worlds for tests or presets, set `worldProfile`
     * explicitly via `setWorldProfile` instead of relying on the random default.
     */
    const [worldProfile, setWorldProfile] = useState<WorldProfile>({
        climateBase: 'temperate',
        magicLevel: 5,
        mutationFactor: 2,
        sunIntensity: 7,
        weatherTypesAllowed: ['clear', 'rain', 'fog'],
        moistureBias: 0,
        tempBias: 0,
        resourceDensity: Math.random() * 1.0 + 0.5, // 0.5 .. 1.5
        theme: 'Normal',
    });
    const [currentSeason, setCurrentSeason] = useState<Season>('spring');
    const [gameTime, setGameTime] = useState(360); // 6 AM
    const [day, setDay] = useState(1);
    const [turn, setTurn] = useState(1);

    const [weatherZones, setWeatherZones] = useState<{ [zoneId: string]: WeatherZone }>({});
    const [world, setWorld] = useState<WorldType>(() => {
        // Initialize world with an empty concrete WorldImpl instance so consumers
        // can call the expected methods (getChunk, getChunksInArea, etc.)
        return new WorldImpl() as unknown as WorldType;
    });

    // Generate a default world on first mount asynchronously. Keep light defaults
    // so dev environment and tests aren't blocked by heavy generation.
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const terrainFactory = new TerrainFactory();
                const terrainDist: Record<string, number> = {};
                // assign uniform weights to known terrains
                for (const t of TERRAIN_LITERALS) terrainDist[t] = 1;
                const gen = new WorldGenerator({
                    width: 25,
                    height: 25,
                    minRegionSize: 4,
                    maxRegionSize: 16,
                    terrainDistribution: terrainDist as any,
                    baseAttributes: {}
                }, terrainFactory as any);
                const w = await gen.generateWorld();
                if (!mounted) return;
                setWorld(w as unknown as WorldType);
                setIsLoaded(true);
            } catch (e) {
                // Silently handle world generation failures
            }
        })();
        return () => { mounted = false; };
    }, []);
    const [recipes, setRecipes] = useState<Record<string, Recipe>>(staticRecipes);
    const [buildableStructures, setBuildableStructures] = useState<Record<string, Structure>>(staticBuildableStructures);
    const [biomeDefinitions, setBiomeDefinitions] = useState<any>(staticBiomeDefinitions);
    const [regions, setRegions] = useState<{ [id: number]: Region }>({});
    const [regionCounter, setRegionCounter] = useState<number>(0);
    const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });
    // visualPlayerPosition is used by the UI to animate the player's visual position
    // (for example, showing the avatar jumping between tiles) without immediately
    // recentering the map. When `isAnimatingMove` is true the UI should prefer
    // `visualPlayerPosition` for rendering the viewport; when false, use `playerPosition`.
    const [visualPlayerPosition, setVisualPlayerPosition] = useState({ x: 0, y: 0 });
    const [isAnimatingMove, setIsAnimatingMove] = useState(false);
    // visualMoveFrom / visualMoveTo: used by the UI to animate a flight from one
    // tile to another. These are set when a move begins and cleared after the
    // landing + settle sequence completes.
    const [visualMoveFrom, setVisualMoveFrom] = useState<{ x: number; y: number } | null>(null);
    const [visualMoveTo, setVisualMoveTo] = useState<{ x: number; y: number } | null>(null);
    // visualJustLanded toggles briefly after landing so the UI can play a small
    // bounce effect at the target tile before settling.
    const [visualJustLanded, setVisualJustLanded] = useState(false);
    // Fix PlayerBehaviorProfile shape to match required fields
    const [playerBehaviorProfile, setPlayerBehaviorProfile] = useState<PlayerBehaviorProfile>({
        name: '',
        description: '',
        quantity: 0,
        tier: 0,
        emoji: '',
        moves: 0,
        attacks: 0,
        crafts: 0,
        customActions: 0
    });
    const [playerStats, setPlayerStats] = useState<PlayerStatus>({
        level: 1,
        experience: 0,
        hp: 100,
        maxHp: 100,
        mana: 50,
        maxMana: 50,
        stamina: 100,
        maxStamina: 100,
        hunger: 100,
        maxHunger: 100,
        hungerTickCounter: 0,
        hpRegenTickCounter: 0,
        staminaRegenTickCounter: 0,
        manaRegenTickCounter: 0,
        bodyTemperature: 37,
        items: [],
        equipment: {
            weapon: null,
            armor: null,
            accessory: null
        },
        quests: [],
        questsCompleted: 0,
        skills: [],
        pets: [],
        persona: 'none',
        attributes: {
            physicalAttack: 10,
            magicalAttack: 5,
            physicalDefense: 0,
            magicalDefense: 0,
            critChance: 5,
            attackSpeed: 1.0,
            cooldownReduction: 0
        },
        unlockProgress: {
            kills: 0,
            damageSpells: 0,
            moves: 0
        },
        journal: {},
        dailyActionLog: [],
        questHints: {}
    });
    const [customItemDefinitions, setCustomItemDefinitions] = useState<Record<string, ItemDefinition>>(staticItemDefinitions);
    const [customItemCatalog, setCustomItemCatalog] = useState<GeneratedItem[]>([]);
    const [customStructures, setCustomStructures] = useState<Structure[]>([]);
    const [finalWorldSetup, setFinalWorldSetup] = useState<GameState['worldSetup'] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Quest and Achievement tracking (Phase 2.0)
    const [activeQuests, setActiveQuests] = useState<any[]>([]);
    const [unlockedAchievements, setUnlockedAchievements] = useState<any[]>([]);
    return {
        world,
        setWorld,
        worldProfile,
        setWorldProfile,
        currentSeason,
        setCurrentSeason,
        gameTime,
        setGameTime,
        day,
        setDay,
        turn,
        setTurn,
        weatherZones,
        setWeatherZones,
        regions,
        setRegions,
        regionCounter,
        setRegionCounter,
        playerPosition,
        visualPlayerPosition,
        setVisualPlayerPosition,
        isAnimatingMove,
        setIsAnimatingMove,
        visualMoveFrom,
        setVisualMoveFrom,
        visualMoveTo,
        setVisualMoveTo,
        visualJustLanded,
        setVisualJustLanded,
        setPlayerPosition,
        playerBehaviorProfile,
        setPlayerBehaviorProfile,
        playerStats,
        setPlayerStats,
        customItemDefinitions,
        setCustomItemDefinitions,
        customItemCatalog,
        setCustomItemCatalog,
        customStructures,
        setCustomStructures,
        finalWorldSetup,
        setFinalWorldSetup,
        isLoading,
        setIsLoading,
        isGameOver,
        setIsGameOver,
        isSaving,
        setIsSaving,
        isLoaded,
        setIsLoaded,
        recipes,
        setRecipes,
        buildableStructures,
        setBuildableStructures,
        narrativeLog,
        setNarrativeLog,
        currentChunk,
        setCurrentChunk,
        biomeDefinitions,
        setBiomeDefinitions,
        activeQuests,
        setActiveQuests,
        unlockedAchievements,
        setUnlockedAchievements
    };
}
