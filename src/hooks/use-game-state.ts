'use client';

import { useState } from "react";
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
import { recipes as staticRecipes } from '@/lib/game/recipes';
import { buildableStructures as staticBuildableStructures } from '@/lib/game/structures';
import { itemDefinitions as staticItemDefinitions } from '@/lib/game/items';
import { biomeDefinitions as staticBiomeDefinitions } from '@/lib/game/biomes';
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
        // Initialize world using WorldUseCase
    // Placeholder world initialization — return minimal default to avoid heavy setup here
        // TODO: Implement world creation logic or use a factory if needed
        // Placeholder: return an empty object or suitable default
        return {} as WorldType;
    });
    const [recipes, setRecipes] = useState<Record<string, Recipe>>(staticRecipes);
    const [buildableStructures, setBuildableStructures] = useState<Record<string, Structure>>(staticBuildableStructures);
    const [biomeDefinitions, setBiomeDefinitions] = useState<any>(staticBiomeDefinitions);
    const [regions, setRegions] = useState<{ [id: number]: Region }>({});
    const [regionCounter, setRegionCounter] = useState<number>(0);
    const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });
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
        setCurrentChunk
        ,
        biomeDefinitions,
        setBiomeDefinitions
    };
}
