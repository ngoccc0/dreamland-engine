

'use client';

import { useState, useCallback, useRef } from "react";
import type { GameState, World, PlayerStatus, NarrativeEntry, Chunk, Season, WorldProfile, Region, PlayerItem, ItemDefinition, WeatherZone, Recipe, WorldConcept, Skill, PlayerBehaviorProfile, Structure, Pet, PlayerAttributes, ItemEffect, Terrain, GeneratedItem } from "@/lib/game/types";
import { recipes as staticRecipes } from '@/lib/game/recipes';
import { buildableStructures as staticBuildableStructures } from '@/lib/game/structures';
import { itemDefinitions as staticItemDefinitions } from '@/lib/game/items';
import { logger } from "@/lib/logger";


interface GameStateProps {
    gameSlot: number;
}

/**
 * @fileOverview This hook is the single source of truth for the game's state.
 * @description It encapsulates all `useState` calls for every piece of game data.
 * Its only job is to hold and update the state. It contains no complex game logic,
 * adhering to the principle of separating state management from business logic.
 *
 * @param {GameStateProps} props - The properties for initializing the game state, specifically the game slot.
 * @returns An object containing all state variables and their updater functions.
 */
export function useGameState({ gameSlot }: GameStateProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    
    // Default world state
    const [worldProfile, setWorldProfile] = useState<WorldProfile>({
        climateBase: 'temperate', magicLevel: 5, mutationFactor: 2, sunIntensity: 7, weatherTypesAllowed: ['clear', 'rain', 'fog'],
        moistureBias: 0, tempBias: 0, resourceDensity: 5, theme: 'Normal',
    });
    const [currentSeason, setCurrentSeason] = useState<Season>('spring');
    const [gameTime, setGameTime] = useState(360); // 6 AM
    const [day, setDay] = useState(1);
    const [turn, setTurn] = useState(1);
    const [weatherZones, setWeatherZones] = useState<{ [zoneId: string]: WeatherZone }>({});

    const [world, setWorld] = useState<World>({});
    const [recipes, setRecipes] = useState<Record<string, Recipe>>(staticRecipes);
    const [buildableStructures, setBuildableStructures] = useState<Record<string, Structure>>(staticBuildableStructures);
    const [regions, setRegions] = useState<{ [id: number]: Region }>({});
    const [regionCounter, setRegionCounter] = useState<number>(0);
    const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });
    const [playerBehaviorProfile, setPlayerBehaviorProfile] = useState<PlayerBehaviorProfile>({ moves: 0, attacks: 0, crafts: 0, customActions: 0 });
    const [playerStats, setPlayerStats] = useState<PlayerStatus>({
        hp: 100, mana: 50, stamina: 100, bodyTemperature: 37, items: [], equipment: { weapon: null, armor: null, accessory: null }, quests: [],
        questsCompleted: 0, skills: [], pets: [], persona: 'none', 
        attributes: { physicalAttack: 10, magicalAttack: 5, physicalDefense: 0, magicalDefense: 0, critChance: 5, attackSpeed: 1.0, cooldownReduction: 0, },
        unlockProgress: { kills: 0, damageSpells: 0, moves: 0 }, journal: {}, dailyActionLog: [], questHints: {},
    });
    const [customItemDefinitions, setCustomItemDefinitions] = useState<Record<string, ItemDefinition>>(staticItemDefinitions);
    const [customItemCatalog, setCustomItemCatalog] = useState<GeneratedItem[]>([]);
    const [customStructures, setCustomStructures] = useState<Structure[]>([]);
    const [finalWorldSetup, setFinalWorldSetup] = useState<GameState['worldSetup'] | null>(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [narrativeLog, setNarrativeLog] = useState<NarrativeEntry[]>([]);
    const [currentChunk, setCurrentChunk] = useState<Chunk | null>(null);

    const narrativeLogRef = useRef(narrativeLog);
    narrativeLogRef.current = narrativeLog;

    /**
     * @description Appends a new entry to the narrative log.
     * @param {string} text - The text content of the narrative entry.
     * @param {NarrativeEntry['type']} type - The type of entry ('narrative', 'action', 'system').
     * @param {string} [entryId] - An optional unique ID for the entry, useful for targeting with DOM selectors.
     */
    const addNarrativeEntry = useCallback((text: string, type: NarrativeEntry['type'], entryId?: string) => {
        const id = entryId || `${Date.now()}-${Math.random()}`;
        setNarrativeLog(prev => [...prev, { id, text, type }]);
    }, []);

    /**
     * @description Advances the game's internal clock and turn counter.
     * Also responsible for updating player stats that might have changed during the turn.
     * @param {PlayerStatus} [newPlayerStats] - The player's updated status after an action. If not provided, the existing stats are used.
     * @param {{x: number, y: number}} [pos] - The player's position for this new turn.
     */
    const advanceGameTime = useCallback((newPlayerStats?: PlayerStatus, pos?: { x: number, y: number }) => {
        const nextTurn = turn + 1;
        setTurn(nextTurn);
        const finalStats = newPlayerStats || playerStats;

        const newTime = (gameTime + 10) % 1440;
        setGameTime(newTime);
        if (newTime < gameTime) { // Day changed
            setDay(d => d + 1);
        }
        
        // Update stats after advancing time. If new stats are passed, use them.
        setPlayerStats(finalStats);
        
        // Mark the current chunk as explored
        const currentPosition = pos || playerPosition;
        const chunkKey = `${currentPosition.x},${currentPosition.y}`;
        setWorld(prevWorld => {
            const chunkToUpdate = prevWorld[chunkKey];
            if (chunkToUpdate) {
                logger.debug(`[EXPLORATION] Marked tile (${currentPosition.x},${currentPosition.y}) as explored and visited at turn ${nextTurn}`);
                const newWorld = { ...prevWorld };
                newWorld[chunkKey] = { ...chunkToUpdate, explored: true, lastVisited: nextTurn };
                return newWorld;
            }
            return prevWorld;
        });

    }, [gameTime, playerStats, turn, playerPosition]);


    return {
        isLoaded, setIsLoaded,
        worldProfile, setWorldProfile,
        currentSeason, setCurrentSeason,
        gameTime, setGameTime,
        day, setDay,
        turn, setTurn,
        weatherZones, setWeatherZones,
        world, setWorld,
        recipes, setRecipes,
        buildableStructures, setBuildableStructures,
        regions, setRegions,
        regionCounter, setRegionCounter,
        playerPosition, setPlayerPosition,
        playerBehaviorProfile, setPlayerBehaviorProfile,
        playerStats, setPlayerStats,
        customItemDefinitions, setCustomItemDefinitions,
        customItemCatalog, setCustomItemCatalog,
        customStructures, setCustomStructures,
        isLoading, setIsLoading,
        isGameOver, setIsGameOver,
        isSaving, setIsSaving,
        narrativeLog, setNarrativeLog, addNarrativeEntry,
        currentChunk, setCurrentChunk,
        finalWorldSetup, setFinalWorldSetup,
        advanceGameTime,
        narrativeLogRef,
        gameSlot
    };
}
