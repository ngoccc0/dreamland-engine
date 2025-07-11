

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { GameState, World, PlayerStatus, NarrativeEntry, Chunk, Season, WorldProfile, Region, PlayerItem, ItemDefinition, GeneratedItem, WeatherZone, Recipe, WorldConcept, Skill, PlayerBehaviorProfile, Structure, Pet, PlayerAttributes, ItemEffect } from "@/lib/game/types";
import { recipes as staticRecipes } from '@/lib/game/recipes';
import { buildableStructures as staticBuildableStructures } from '@/lib/game/structures';
import { itemDefinitions as staticItemDefinitions } from '@/lib/game/items';
import { useAuth } from "@/context/auth-context";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase-config";

interface GameStateProps {
    gameSlot: number;
}

export function useGameState({ gameSlot }: GameStateProps) {
    const { user } = useAuth();
    const [isLoaded, setIsLoaded] = useState(false);
    const hasLoaded = useRef(false);

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
        questsCompleted: 0, skills: [], pets: [], persona: 'none', attributes: { physicalAttack: 10, magicalAttack: 5, critChance: 5, attackSpeed: 1.0, cooldownReduction: 0, },
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

     const addNarrativeEntry = useCallback((text: string, type: NarrativeEntry['type']) => {
        const uniqueId = `${Date.now()}-${Math.random()}`;
        setNarrativeLog(prev => [...prev, { id: uniqueId, text, type }]);
    }, []);

    const advanceGameTime = useCallback((newPlayerStats?: PlayerStatus) => {
        setTurn(prev => prev + 1);
        const finalStats = newPlayerStats || playerStats;

        const newTime = (gameTime + 10) % 1440;
        setGameTime(newTime);
        if (newTime < gameTime) { // Day changed
            setDay(d => d + 1);
        }
        
        // Update stats after advancing time. If new stats are passed, use them.
        setPlayerStats(finalStats);

    }, [gameTime, playerStats, setTurn, setGameTime, setDay, setPlayerStats]);

    useEffect(() => {
        const loadGame = async () => {
            // --- 1. Load persistent GLOBAL data from Firestore ---
            const firestoreItems = new Map<string, GeneratedItem>();
            const firestoreRecipes = new Map<string, Recipe>();
            if (db) {
                try {
                    const itemsSnap = await getDocs(collection(db, 'world-catalog', 'items', 'generated'));
                    itemsSnap.forEach(doc => firestoreItems.set(doc.id, doc.data() as GeneratedItem));
                    
                    const recipesSnap = await getDocs(collection(db, 'world-catalog', 'recipes', 'generated'));
                    recipesSnap.forEach(doc => firestoreRecipes.set(doc.id, doc.data() as Recipe));
                } catch (error) {
                    console.warn("Could not load world catalog from Firestore.", error);
                }
            }
            
            // --- 2. Load the specific game slot data ---
            let loadedState: GameState | null = null;
            if (user) {
                const docRef = doc(db, "users", user.uid, "games", `slot_${gameSlot}`);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    loadedState = docSnap.data() as GameState;
                }
            } else {
                const localData = localStorage.getItem(`gameState_${gameSlot}`);
                if (localData) {
                    try {
                        loadedState = JSON.parse(localData);
                    } catch (e) { console.error("Failed to parse local save data", e); }
                }
            }
            
            // --- 3. Prepare session-specific data from save or props ---
            let sessionCatalog: GeneratedItem[] = [];
            let sessionDefs: Record<string, ItemDefinition> = {};
            let sessionRecipes: Record<string, Recipe> = {};
            let sessionStructures: Structure[] = [];

            if (loadedState) {
                // Loading existing game
                setWorldProfile(loadedState.worldProfile);
                setCurrentSeason(loadedState.currentSeason);
                setGameTime(loadedState.gameTime || 360);
                setDay(loadedState.day);
                setTurn(loadedState.turn || 1);
                setWeatherZones(loadedState.weatherZones || {});
                setWorld(loadedState.world || {});
                setRegions(loadedState.regions || {});
                setRegionCounter(loadedState.regionCounter || 0);
                setPlayerPosition(loadedState.playerPosition || { x: 0, y: 0 });
                setPlayerBehaviorProfile(loadedState.playerBehaviorProfile || { moves: 0, attacks: 0, crafts: 0, customActions: 0 });
                setPlayerStats(loadedState.playerStats);
                setNarrativeLog(loadedState.narrativeLog);
                setFinalWorldSetup(loadedState.worldSetup);

                sessionCatalog = loadedState.customItemCatalog || [];
                sessionDefs = loadedState.customItemDefinitions || {};
                sessionRecipes = loadedState.recipes || {};
                sessionStructures = loadedState.customStructures || [];

            }
            // --- 4. MERGE global data into the session data before setting state ---
            const finalCatalogMap = new Map<string, GeneratedItem>();
            sessionCatalog.forEach(item => finalCatalogMap.set(item.name, item));
            firestoreItems.forEach((item, name) => finalCatalogMap.set(name, item));
            const finalCatalogArray = Array.from(finalCatalogMap.values());
            
            const finalRecipes = { ...staticRecipes, ...sessionRecipes };
            firestoreRecipes.forEach((value, key) => {
                if (!finalRecipes[key]) finalRecipes[key] = value;
            });

            const finalDefs = { ...staticItemDefinitions, ...sessionDefs };
            finalCatalogArray.forEach((item) => {
                if (!finalDefs[item.name]) {
                    finalDefs[item.name] = {
                        description: item.description, tier: item.tier, category: item.category,
                        emoji: item.emoji, effects: item.effects as ItemEffect[], baseQuantity: item.baseQuantity,
                        growthConditions: item.growthConditions, equipmentSlot: item.equipmentSlot,
                        attributes: item.attributes,
                    };
                }
            });

            // --- 5. Set the final, merged state ---
            setRecipes(finalRecipes);
            setCustomItemCatalog(finalCatalogArray);
            setCustomItemDefinitions(finalDefs);
            setCustomStructures(sessionStructures);
            setBuildableStructures(staticBuildableStructures); // This was missing, ensure it's always set.
            
            // IMPORTANT: Set loaded to true ONLY after all state has been set.
            if (!hasLoaded.current) {
                setIsLoaded(true);
                hasLoaded.current = true;
            }
        };

        loadGame();
    // The dependency array is intentionally kept minimal to run this only once on initial load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameSlot, user]);


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
        narrativeLog, addNarrativeEntry,
        currentChunk, setCurrentChunk,
        finalWorldSetup,
        advanceGameTime,
    };
}
