

"use client";

import { useState } from "react";
import type { GameState, World, PlayerStatus, NarrativeEntry, Chunk, Season, WorldProfile, Region, PlayerItem, ItemDefinition, GeneratedItem, WeatherZone, Recipe, WorldConcept, Skill, PlayerBehaviorProfile, Structure, Pet, PlayerAttributes } from "@/lib/game/types";
import { recipes as staticRecipes } from '@/lib/game/recipes';
import { buildableStructures as staticBuildableStructures } from '@/lib/game/structures';
import { itemDefinitions as staticItemDefinitions } from '@/lib/game/items';

interface GameStateProps {
    worldSetup?: Omit<WorldConcept, 'playerInventory' | 'customItemCatalog' | 'customStructures'> & { playerInventory: PlayerItem[] };
    initialGameState?: GameState;
    customItemDefinitions?: Record<string, ItemDefinition>;
    customItemCatalog?: GeneratedItem[];
    customStructures?: Structure[];
}

export function useGameState({ worldSetup, initialGameState, customItemDefinitions: initialCustomDefs, customItemCatalog: initialCustomCatalog, customStructures: initialCustomStructures }: GameStateProps) {
    const [worldProfile, setWorldProfile] = useState<WorldProfile>(
        initialGameState?.worldProfile || {
            climateBase: 'temperate',
            magicLevel: 5,
            mutationFactor: 2,
            sunIntensity: 7,
            weatherTypesAllowed: ['clear', 'rain', 'fog'],
            moistureBias: 0,
            tempBias: 0,
            resourceDensity: 5,
            theme: 'Normal',
        }
    );
    const [currentSeason, setCurrentSeason] = useState<Season>(initialGameState?.currentSeason || 'spring');
    const [gameTime, setGameTime] = useState(initialGameState?.gameTime || 360); // 6 AM
    const [day, setDay] = useState(initialGameState?.day || 1);
    const [turn, setTurn] = useState(initialGameState?.turn || 1);
    const [weatherZones, setWeatherZones] = useState<{ [zoneId: string]: WeatherZone }>(initialGameState?.weatherZones || {});

    const [world, setWorld] = useState<World>(initialGameState?.world || {});
    const [recipes, setRecipes] = useState<Record<string, Recipe>>(initialGameState?.recipes || staticRecipes);
    const [buildableStructures, setBuildableStructures] = useState<Record<string, Structure>>(initialGameState?.buildableStructures || staticBuildableStructures);
    const [regions, setRegions] = useState<{ [id: number]: Region }>(initialGameState?.regions || {});
    const [regionCounter, setRegionCounter] = useState<number>(initialGameState?.regionCounter || 0);
    const [playerPosition, setPlayerPosition] = useState(initialGameState?.playerPosition || { x: 0, y: 0 });
    const [playerBehaviorProfile, setPlayerBehaviorProfile] = useState<PlayerBehaviorProfile>(
        initialGameState?.playerBehaviorProfile || { moves: 0, attacks: 0, crafts: 0, customActions: 0 }
    );
    const [playerStats, setPlayerStats] = useState<PlayerStatus>(
        initialGameState?.playerStats || {
            hp: 100,
            mana: 50,
            stamina: 100,
            bodyTemperature: 37,
            items: worldSetup?.playerInventory || [],
            equipment: {
                weapon: null,
                armor: null,
                accessory: null,
            },
            quests: worldSetup?.initialQuests || [],
            questsCompleted: 0,
            skills: worldSetup?.startingSkill ? [worldSetup.startingSkill] : [],
            pets: [],
            persona: 'none',
            attributes: {
                physicalAttack: 10,
                magicalAttack: 5,
                critChance: 5,
                attackSpeed: 1.0,
                cooldownReduction: 0,
            },
            unlockProgress: { kills: 0, damageSpells: 0, moves: 0 },
            journal: {},
            dailyActionLog: [],
            questHints: {},
        }
    );
    const [customItemDefinitions, setCustomItemDefinitions] = useState<Record<string, ItemDefinition>>(initialGameState?.customItemDefinitions || initialCustomDefs || staticItemDefinitions);
    const [customItemCatalog, setCustomItemCatalog] = useState<GeneratedItem[]>(initialGameState?.customItemCatalog || initialCustomCatalog || []);
    const [customStructures, setCustomStructures] = useState<Structure[]>(initialGameState?.customStructures || initialCustomStructures || []);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [narrativeLog, setNarrativeLog] = useState<NarrativeEntry[]>(initialGameState?.narrativeLog || []);
    const [currentChunk, setCurrentChunk] = useState<Chunk | null>(null);

    const finalWorldSetup = worldSetup || initialGameState?.worldSetup;

    return {
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
        narrativeLog, setNarrativeLog,
        currentChunk, setCurrentChunk,
        finalWorldSetup,
    };
}
