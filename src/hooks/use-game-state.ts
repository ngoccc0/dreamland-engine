
"use client";

import { useState, useEffect } from "react";
import type { GameState, World, PlayerStatus, NarrativeEntry, Chunk, Season, WorldProfile, Region, PlayerItem, ItemDefinition, GeneratedItem, WeatherZone, Recipe, WorldConcept, Skill, PlayerBehaviorProfile, Structure, Pet, PlayerAttributes, ItemEffect, Terrain, ModDefinition, EnemySpawn, Action, TranslationKey } from "@/lib/game/types";
import { recipes as staticRecipes } from '@/lib/game/data/recipes';
import { buildableStructures as staticBuildableStructures } from '@/lib/game/structures';
import { itemDefinitions as staticItemDefinitions } from '@/lib/game/data/items';
import { useAuth } from "@/context/auth-context";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase-config";
import { allMods } from "@/lib/game/mods";
import { getTemplates } from "../lib/game/templates";
import { translations } from "../lib/i18n";
import { CreatureDefinitionSchema } from "../lib/game/definitions/creature";


// --- MOD VALIDATION HELPER ---
function validateAndMergeMods(initialItems: Record<string, ItemDefinition>, initialRecipes: Record<string, Recipe>, initialEnemies: Record<string, z.infer<typeof CreatureDefinitionSchema>>) {
    const finalItems = { ...initialItems };
    const finalRecipes = { ...initialRecipes };
    const finalCreatures = { ...initialEnemies };

    allMods.forEach((mod, modIndex) => {
        // Merge items
        if (mod.items) {
            for (const itemName in mod.items) {
                if (finalItems[itemName]) console.warn(`Mod Warning: Item "${itemName}" from mod ${modIndex} is overwriting an existing item.`);
                finalItems[itemName] = mod.items[itemName];
            }
        }
        // Merge recipes
        if (mod.recipes) {
            for (const recipeName in mod.recipes) {
                if (finalRecipes[recipeName]) console.warn(`Mod Warning: Recipe "${recipeName}" from mod ${modIndex} is overwriting an existing recipe.`);
                finalRecipes[recipeName] = mod.recipes[recipeName];
            }
        }
        // Merge creatures
        if (mod.creatures) {
            for (const creatureName in mod.creatures) {
                if (finalCreatures[creatureName]) console.warn(`Mod Warning: Creature "${creatureName}" from mod ${modIndex} is overwriting an existing creature.`);
                finalCreatures[creatureName] = mod.creatures[creatureName];
            }
        }
    });

    return { finalItems, finalRecipes, finalCreatures };
}

const regenerateChunkActions = (chunk: Chunk, t: (key: TranslationKey, params?: any) => string): Action[] => {
    const actions: Action[] = [];
    let actionIdCounter = 1;

    if (chunk.enemy) {
        actions.push({ id: actionIdCounter++, textKey: 'observeAction_enemy', params: { enemyType: t(chunk.enemy.type as TranslationKey) as TranslationKey } });
    }
    if (chunk.NPCs.length > 0) {
        actions.push({ id: actionIdCounter++, textKey: 'talkToAction_npc', params: { npcName: t(chunk.NPCs[0].name as TranslationKey) as TranslationKey } });
    }

    chunk.items.forEach(item => {
        actions.push({ id: actionIdCounter++, textKey: 'pickUpAction_item', params: { itemName: t(item.name as TranslationKey) as TranslationKey } });
    });
    
    actions.push({ id: actionIdCounter++, textKey: 'exploreAction' });
    actions.push({ id: actionIdCounter++, textKey: 'listenToSurroundingsAction' });

    return actions;
};

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
        unlockProgress: { kills: 0, damageSpells: 0, moves: 0 }, journal: {}, dailyActionLog: [], questHints: {}, trackedEnemy: null,
    });
    const [customItemDefinitions, setCustomItemDefinitions] = useState<Record<string, ItemDefinition>>(staticItemDefinitions);
    const [customCreatureDefinitions, setCustomCreatureDefinitions] = useState<Record<string, z.infer<typeof CreatureDefinitionSchema>>>({});
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
            const baseCreatures = templates.creatures;
            
            const { finalItems, finalRecipes, finalCreatures } = validateAndMergeMods(staticItemDefinitions, staticRecipes, baseCreatures);
            

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
                    console.warn("Could not load world catalog from Firestore. This might be due to permissions.", error);
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
            let sessionItemDefs: Record<string, ItemDefinition> = {};
            let sessionCreatureDefs: Record<string, z.infer<typeof CreatureDefinitionSchema>> = {};
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
                
                // Regenerate actions on load
                const worldWithActions = loadedState.world;
                const lang = loadedState.playerStats.language || 'en';
                const t = (key: TranslationKey, params?: any) => {
                    const entry = (translations[lang] as any)[key] || (translations.en as any)[key];
                    if (typeof entry === 'string') {
                      return entry.replace(/\{(\w+)\}/g, (_, k) => params?.[k] ?? `{${k}}`);
                    }
                    return key;
                  };
                for (const key in worldWithActions) {
                    worldWithActions[key].actions = regenerateChunkActions(worldWithActions[key], t);
                }
                setWorld(worldWithActions || {});
                
                setRegions(loadedState.regions || {});
                setRegionCounter(loadedState.regionCounter || 0);
                setPlayerPosition(loadedState.playerPosition || { x: 0, y: 0 });
                setPlayerBehaviorProfile(loadedState.playerBehaviorProfile || { moves: 0, attacks: 0, crafts: 0, customActions: 0 });
                setPlayerStats(loadedState.playerStats);
                setNarrativeLog(loadedState.narrativeLog);
                setFinalWorldSetup(loadedState.worldSetup);

                sessionCatalog = loadedState.customItemCatalog || [];
                sessionItemDefs = loadedState.customItemDefinitions || {};
                sessionCreatureDefs = loadedState.customCreatureDefinitions || {};
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
                    setNarrativeLog([{ id: 0, text: t(propsWorldSetup.initialNarrative as TranslationKey), type: 'narrative' }]);
                 }
                
                sessionCatalog = propsCustomCatalog;
                sessionItemDefs = propsCustomDefs;
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

            const finalMergedItemDefs = { ...finalItems, ...sessionItemDefs };
            finalCatalogArray.forEach((item) => {
                if (!finalMergedItemDefs[item.name]) {
                    finalMergedItemDefs[item.name] = item;
                }
            });
            const finalMergedCreatureDefs = { ...finalCreatures, ...sessionCreatureDefs };

            // --- 5. Set the final, merged state ---
            setRecipes(mergedRecipes);
            setCustomItemDefinitions(finalMergedItemDefs);
            setCustomCreatureDefinitions(finalMergedCreatureDefs);
            setCustomItemCatalog(finalCatalogArray);
            setCustomStructures(sessionStructures);
            setBuildableStructures(staticBuildableStructures);
            
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
        customCreatureDefinitions, setCustomCreatureDefinitions,
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
