

"use client";

import { useState, useEffect } from "react";
import type { GameState, World, PlayerStatus, NarrativeEntry, Chunk, Season, WorldProfile, Region, PlayerItem, ItemDefinition, GeneratedItem, WeatherZone, Recipe, WorldConcept, Skill, PlayerBehaviorProfile, Structure, Pet, PlayerAttributes } from "@/lib/game/types";
import { recipes as staticRecipes } from '@/lib/game/recipes';
import { buildableStructures as staticBuildableStructures } from '@/lib/game/structures';
import { itemDefinitions as staticItemDefinitions } from '@/lib/game/items';
import { useAuth } from "@/context/auth-context";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase-config";
import type { ItemEffect } from "@/lib/game/types";

interface GameStateProps {
    gameSlot: number;
    worldSetup?: Omit<WorldConcept, 'playerInventory' | 'customItemCatalog' | 'customStructures'> & { playerInventory: PlayerItem[] };
    customItemDefinitions?: Record<string, ItemDefinition>;
    customItemCatalog?: GeneratedItem[];
    customStructures?: Structure[];
}

export function useGameState({ gameSlot, worldSetup: propsWorldSetup, customItemDefinitions: propsCustomDefs, customItemCatalog: propsCustomCatalog, customStructures: propsCustomStructures }: GameStateProps) {
    const { user } = useAuth();
    const [isLoaded, setIsLoaded] = useState(false);

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
            
            // --- 3. Set initial state from save or props ---
            if (loadedState) {
                // Loading existing game
                setWorldProfile(loadedState.worldProfile);
                setCurrentSeason(loadedState.currentSeason);
                setGameTime(loadedState.gameTime || 360);
                setDay(loadedState.day);
                setTurn(loadedState.turn);
                setWeatherZones(loadedState.weatherZones);
                setWorld(loadedState.world);
                setBuildableStructures(loadedState.buildableStructures);
                setRegions(loadedState.regions);
                setRegionCounter(loadedState.regionCounter);
                setPlayerPosition(loadedState.playerPosition);
                setPlayerBehaviorProfile(loadedState.playerBehaviorProfile);
                setPlayerStats(loadedState.playerStats);
                setNarrativeLog(loadedState.narrativeLog);
                setFinalWorldSetup(loadedState.worldSetup);
                // The catalogs/definitions from the save file are the source of truth for THIS session
                setCustomItemCatalog(loadedState.customItemCatalog || []);
                setCustomItemDefinitions(loadedState.customItemDefinitions || {});
                setRecipes(loadedState.recipes || {});

            } else if (propsWorldSetup && propsCustomDefs && propsCustomCatalog && propsCustomStructures) {
                // Starting a new game from props
                setFinalWorldSetup(propsWorldSetup);
                setCustomItemDefinitions(propsCustomDefs);
                setCustomItemCatalog(propsCustomCatalog);
                setCustomStructures(propsCustomStructures);
                setPlayerStats(prev => ({
                    ...prev,
                    items: propsWorldSetup.playerInventory,
                    quests: propsWorldSetup.initialQuests,
                    skills: propsWorldSetup.startingSkill ? [propsWorldSetup.startingSkill] : [],
                }));
                 if(propsWorldSetup.initialNarrative) {
                    setNarrativeLog([{ id: 0, text: propsWorldSetup.initialNarrative, type: 'narrative' }]);
                 }
            }

            // --- 4. MERGE global data into the current state ---
            // This ensures that even old save files get access to newly discovered items from other games.
            setRecipes(prev => {
                const combined = { ...staticRecipes, ...prev };
                firestoreRecipes.forEach((value, key) => combined[key] = value);
                return combined;
            });

            const finalItemCatalog = new Map<string, GeneratedItem>();
            customItemCatalog.forEach(item => finalItemCatalog.set(item.name, item));
            firestoreItems.forEach((item, name) => finalItemCatalog.set(name, item));
            setCustomItemCatalog(Array.from(finalItemCatalog.values()));
            
            setCustomItemDefinitions(prev => {
                const combined = { ...staticItemDefinitions, ...prev };
                finalItemCatalog.forEach((item) => {
                    if (!combined[item.name]) {
                        combined[item.name] = {
                            description: item.description, tier: item.tier, category: item.category,
                            emoji: item.emoji, effects: item.effects as ItemEffect[], baseQuantity: item.baseQuantity,
                            growthConditions: item.growthConditions, equipmentSlot: item.equipmentSlot,
                            attributes: item.attributes,
                        };
                    }
                });
                return combined;
            });
            
            setIsLoaded(true);
        };

        loadGame();
    // The dependency array is intentionally kept minimal to run this only once on initial load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameSlot, user]);


    return {
        isLoaded,
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
