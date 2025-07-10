

"use client";

import { useState, useEffect } from "react";
import type { GameState, World, PlayerStatus, NarrativeEntry, Chunk, Season, WorldProfile, Region, PlayerItem, ItemDefinition, GeneratedItem, WeatherZone, Recipe, WorldConcept, Skill, PlayerBehaviorProfile, Structure, Pet, PlayerAttributes, ItemEffect, Terrain, ModDefinition, EnemySpawn } from "@/lib/game/types";
import { recipes as staticRecipes } from '@/lib/game/recipes';
import { buildableStructures as staticBuildableStructures } from '@/lib/game/structures';
import { itemDefinitions as staticItemDefinitions } from '@/lib/game/items';
import { useAuth } from "@/context/auth-context";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase-config";
import { allMods } from "@/lib/game/mods";
import { getTemplates } from "../lib/game/templates";


// --- MOD VALIDATION HELPER ---
function validateAndMergeMods(initialItems: Record<string, ItemDefinition>, initialRecipes: Record<string, Recipe>, initialEnemies: Record<Terrain, any>) {
    const finalItems = { ...initialItems };
    const finalRecipes = { ...initialRecipes };
    const finalEnemies: Record<Terrain, EnemySpawn[]> = JSON.parse(JSON.stringify(initialEnemies));

    allMods.forEach((mod, modIndex) => {
        // Validate and merge items
        if (mod.items) {
            for (const itemName in mod.items) {
                const item = mod.items[itemName];
                if (!item.description || !item.tier || !item.category || !item.emoji || !item.effects || !item.baseQuantity) {
                    throw new Error(`Mod validation failed in mods[${modIndex}] for item "${itemName}". Missing one or more required fields: description, tier, category, emoji, effects, baseQuantity.`);
                }
                if (finalItems[itemName]) console.warn(`Mod Warning: Item "${itemName}" from mod ${modIndex} is overwriting an existing item.`);
                finalItems[itemName] = item;
            }
        }
        // Validate and merge recipes
        if (mod.recipes) {
            for (const recipeName in mod.recipes) {
                const recipe = mod.recipes[recipeName];
                if (!recipe.result || !recipe.ingredients || !recipe.description || recipe.ingredients.length === 0) {
                     throw new Error(`Mod validation failed in mods[${modIndex}] for recipe "${recipeName}". Missing one or more required fields: result, ingredients, description.`);
                }
                if (finalRecipes[recipeName]) console.warn(`Mod Warning: Recipe "${recipeName}" from mod ${modIndex} is overwriting an existing recipe.`);
                finalRecipes[recipeName] = recipe;
            }
        }
        // Validate and merge enemies
        if (mod.enemies) {
            for (const biome in mod.enemies) {
                const biomeKey = biome as Terrain;
                if (!finalEnemies[biomeKey]) finalEnemies[biomeKey] = { enemies: [] } as any; // Should not happen with getTemplates
                
                const enemySpawns = mod.enemies[biomeKey];
                if(enemySpawns) {
                    enemySpawns.forEach((spawn, spawnIndex) => {
                        const enemyData = spawn.data;
                         if (!enemyData.type || !enemyData.emoji || !enemyData.hp || !enemyData.damage || !enemyData.behavior || !enemyData.size || !enemyData.diet) {
                             throw new Error(`Mod validation failed in mods[${modIndex}] for enemy #${spawnIndex} in biome "${biomeKey}". Missing one or more required fields in 'data'.`);
                         }
                         if (!spawn.conditions) {
                              throw new Error(`Mod validation failed in mods[${modIndex}] for enemy "${enemyData.type}". Missing 'conditions' field.`);
                         }
                    });
                    finalEnemies[biomeKey].push(...enemySpawns);
                }
            }
        }
    });

    return { finalItems, finalRecipes, finalEnemies };
}


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
            // --- Merge mods with base game data ---
            const templates = getTemplates('en'); // Use 'en' as a base, language doesn't matter for structure
            const baseEnemies = (Object.keys(templates) as Terrain[]).reduce((acc, biome) => {
                acc[biome] = templates[biome].enemies || [];
                return acc;
            }, {} as Record<Terrain, any>);
            
            const { finalItems, finalRecipes, finalEnemies } = validateAndMergeMods(staticItemDefinitions, staticRecipes, baseEnemies);
            
            // Re-integrate merged enemy data back into templates
            const mergedTemplates = getTemplates('en'); // A fresh copy to modify
            for (const biome in finalEnemies) {
                if (mergedTemplates[biome as Terrain]) {
                     mergedTemplates[biome as Terrain].enemies = finalEnemies[biome as Terrain];
                }
            }


            // --- Load persistent GLOBAL data from Firestore ---
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
            
            // --- Load the specific game slot data ---
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
            
            // --- Prepare session-specific data from save or props ---
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

            } else if (propsWorldSetup && propsCustomDefs && propsCustomCatalog && propsCustomStructures) {
                // Starting a new game from props
                setFinalWorldSetup(propsWorldSetup);
                setPlayerStats(prev => ({
                    ...prev,
                    items: propsWorldSetup.playerInventory,
                    quests: propsWorldSetup.initialQuests,
                    skills: propsWorldSetup.startingSkill ? [propsWorldSetup.startingSkill] : [],
                }));
                 if(propsWorldSetup.initialNarrative) {
                    setNarrativeLog([{ id: 0, text: propsWorldSetup.initialNarrative, type: 'narrative' }]);
                 }
                
                sessionCatalog = propsCustomCatalog;
                sessionDefs = propsCustomDefs;
                sessionRecipes = staticRecipes;
                sessionStructures = propsCustomStructures;
            }

            // --- 4. MERGE global data into the session data before setting state ---
            const finalCatalogMap = new Map<string, GeneratedItem>();
            sessionCatalog.forEach(item => finalCatalogMap.set(item.name, item));
            firestoreItems.forEach((item, name) => finalCatalogMap.set(name, item));
            const finalCatalogArray = Array.from(finalCatalogMap.values());
            
            const mergedRecipes = { ...finalRecipes, ...sessionRecipes };
            firestoreRecipes.forEach((value, key) => {
                if (!mergedRecipes[key]) mergedRecipes[key] = value;
            });

            const finalMergedDefs = { ...finalItems, ...sessionDefs };
            finalCatalogArray.forEach((item) => {
                if (!finalMergedDefs[item.name]) {
                    finalMergedDefs[item.name] = {
                        description: item.description, tier: item.tier, category: item.category,
                        emoji: item.emoji, effects: item.effects as ItemEffect[], baseQuantity: item.baseQuantity,
                        growthConditions: item.growthConditions, equipmentSlot: item.equipmentSlot,
                        attributes: item.attributes,
                    };
                }
            });

            // --- 5. Set the final, merged state ---
            setRecipes(mergedRecipes);
            setCustomItemDefinitions(finalMergedDefs);
            setCustomItemCatalog(finalCatalogArray);
            setCustomStructures(sessionStructures);
            setBuildableStructures(staticBuildableStructures); // This was missing, ensure it's always set.
            
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
