'use client';

import { useState, useCallback, useRef } from "react";
import type { GameState, World as WorldType, PlayerStatus, NarrativeEntry, Chunk, Season, WorldProfile, Region, PlayerItem, ItemDefinition, WeatherZone, Recipe, WorldConcept, Skill, PlayerBehaviorProfile, Structure, Pet, PlayerAttributes, ItemEffect, Terrain, GeneratedItem, TranslatableString } from "@/lib/game/types";
import { recipes as staticRecipes } from '@/lib/game/recipes';
import { buildableStructures as staticBuildableStructures } from '@/lib/game/structures';
import { itemDefinitions as staticItemDefinitions } from '@/lib/game/items';
import { logger } from "@/lib/logger";
import { TerrainFactory } from "@/core/factories/terrain-factory";
import { WorldGenerator } from "@/core/generators/world-generator";
import { WorldUseCase } from "@/core/usecases/world-usecase";
import { World } from "@/core/entities/world";
import { TerrainType } from "@/core/entities/terrain";
import { WeatherCondition, WeatherType, WeatherIntensity } from "@/core/types/weather";
import { SoilType } from "@/core/entities/terrain";

interface GameStateProps {
    gameSlot: number;
}

export function useGameState({ gameSlot }: GameStateProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    
    const [worldProfile, setWorldProfile] = useState<WorldProfile>({
        climateBase: 'temperate', 
        magicLevel: 5, 
        mutationFactor: 2, 
        sunIntensity: 7, 
        weatherTypesAllowed: ['clear', 'rain', 'fog'],
        moistureBias: 0, 
        tempBias: 0, 
        resourceDensity: 5, 
        theme: 'Normal',
    });
    
    const [currentSeason, setCurrentSeason] = useState<Season>('spring');
    const [gameTime, setGameTime] = useState(360); // 6 AM
    const [day, setDay] = useState(1);
    const [turn, setTurn] = useState(1);
    const [weatherZones, setWeatherZones] = useState<{ [zoneId: string]: WeatherZone }>({});

    const [world, setWorld] = useState<WorldType>(() => {
        // Initialize world using WorldUseCase
        const terrainFactory = new TerrainFactory();
        const worldGenerator = new WorldGenerator({
            width: 100,
            height: 100,
            minRegionSize: 5,
            maxRegionSize: 15,
            terrainDistribution: {
                [TerrainType.plains]: 0.3,
                [TerrainType.forest]: 0.3,
                [TerrainType.mountain]: 0.2,
                [TerrainType.desert]: 0.2
            },
            baseAttributes: {}
        }, terrainFactory);

        const weatherParams = {
            type: WeatherType.CLEAR,
            intensity: WeatherIntensity.NORMAL,
            conditions: []
        };

        const worldAttributes = {
            worldType: 'normal',
            magicalPotency: 5,
            vegetationDensity: 50,
            moisture: 50,
            elevation: 50,
            temperature: 20,
            windLevel: 5,
            lightLevel: 70,
            soilType: SoilType.LOAMY
        };

        const emptyWorld = new World(weatherParams, worldAttributes);
        const worldUseCase = new WorldUseCase(emptyWorld, worldGenerator, null);

        // Generate world asynchronously
        worldUseCase.generateWorld().then((generatedWorld: World) => {
            setWorld(generatedWorld as unknown as WorldType);
        });

        return emptyWorld as unknown as WorldType;
    });

    const [recipes, setRecipes] = useState<Record<string, Recipe>>(staticRecipes);
    const [buildableStructures, setBuildableStructures] = useState<Record<string, Structure>>(staticBuildableStructures);
    const [regions, setRegions] = useState<{ [id: number]: Region }>({});
    const [regionCounter, setRegionCounter] = useState<number>(0);
    const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });
    const [playerBehaviorProfile, setPlayerBehaviorProfile] = useState<PlayerBehaviorProfile>({ 
        moves: 0, 
        attacks: 0, 
        crafts: 0, 
        customActions: 0 
    });

    const [playerStats, setPlayerStats] = useState<PlayerStatus>({
        level: 1,
        experience: 0,
        hp: 100,
        mana: 50,
        stamina: 100,
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
        setIsLoaded
    };
}
