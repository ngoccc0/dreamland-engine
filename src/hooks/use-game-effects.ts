

'use client';

import { useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase-config';
import { useAuth } from '@/context/auth-context';
import { useSettings } from '@/context/settings-context';
import { generateNewRecipe } from '@/ai/flows/generate-new-recipe';
import { generateJournalEntry } from '@/ai/flows/generate-journal-entry';
import { skillDefinitions } from '@/lib/game/skills';
import { randomEvents } from '@/lib/game/events';
import { ensureChunkExists, getEffectiveChunk, generateWeatherForZone } from '@/lib/game/engine/generation';
import { generateOfflineNarrative } from '@/lib/game/engine/offline';
import { clamp } from '@/lib/utils';
import { seasonConfig } from '@/lib/game/world-config';
import { rollDice, getSuccessLevel, type SuccessLevel } from '@/lib/game/dice';
import type { GameState, PlayerStatus, NarrativeEntry, Chunk, Season, WorldProfile, Region, PlayerItem, ItemDefinition, GeneratedItem, WeatherZone, Recipe, WorldConcept, Skill, PlayerBehaviorProfile, Structure, Pet, ItemEffect, Terrain, PlayerPersona, EquipmentSlot, NarrativeLength, Action } from "@/lib/game/types";
import type { TranslationKey } from "@/lib/i18n";
import { recipes as staticRecipes } from '@/lib/game/recipes';
import { buildableStructures as staticBuildableStructures } from '@/lib/game/structures';
import { itemDefinitions as staticItemDefinitions } from '@/lib/game/items';
import { translations } from '@/lib/i18n';


const getRandomInRange = (range: { min: number, max: number }) => Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

type GameEffectsDeps = {
  isLoaded: boolean;
  isLoading: boolean;
  isGameOver: boolean;
  isSaving: boolean;
  setIsLoaded: (loaded: boolean) => void;
  setIsGameOver: (gameOver: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  playerStats: PlayerStatus;
  setPlayerStats: (fn: (prev: PlayerStatus) => PlayerStatus) => void;
  playerBehaviorProfile: PlayerBehaviorProfile;
  setPlayerBehaviorProfile: (fn: (prev: any) => any) => void;
  world: GameState['world'];
  setWorld: (fn: (prev: GameState['world']) => GameState['world']) => void;
  playerPosition: GameState['playerPosition'];
  setPlayerPosition: (pos: GameState['playerPosition']) => void;
  narrativeLogRef: React.RefObject<NarrativeEntry[]>;
  setNarrativeLog: (log: NarrativeEntry[]) => void;
  addNarrativeEntry: (text: string, type: NarrativeEntry['type'], entryId?: string) => void;
  finalWorldSetup: GameState['worldSetup'] | null;
  setFinalWorldSetup: (setup: GameState['worldSetup']) => void;
  turn: number;
  setTurn: (turn: number) => void;
  day: number;
  setDay: (day: number) => void;
  gameTime: number;
  setGameTime: (time: number) => void;
  currentSeason: Season;
  setCurrentSeason: (season: Season) => void;
  worldProfile: WorldProfile;
  setWorldProfile: (profile: WorldProfile) => void;
  weatherZones: GameState['weatherZones'];
  setWeatherZones: (zones: GameState['weatherZones']) => void;
  regions: GameState['regions'];
  setRegions: (regions: GameState['regions']) => void;
  regionCounter: number;
  setRegionCounter: (counter: number) => void;
  setCurrentChunk: (chunk: Chunk | null) => void;
  customItemDefinitions: Record<string, ItemDefinition>;
  setCustomItemDefinitions: (defs: Record<string, ItemDefinition>) => void;
  customItemCatalog: GeneratedItem[];
  setCustomItemCatalog: (catalog: GeneratedItem[]) => void;
  customStructures: Structure[];
  setCustomStructures: (structures: Structure[]) => void;
  recipes: Record<string, Recipe>;
  setRecipes: (recipes: Record<string, Recipe>) => void;
  buildableStructures: Record<string, Structure>;
  setBuildableStructures: (structures: Record<string, Structure>) => void;
  gameSlot: number;
  advanceGameTime: (stats?: PlayerStatus) => void;
};


export function useGameEffects(deps: GameEffectsDeps) {
  const {
    isLoaded, isGameOver, isSaving, setIsLoaded, setIsGameOver, setIsSaving,
    playerStats, setPlayerStats, playerBehaviorProfile, setPlayerBehaviorProfile,
    world, setWorld, playerPosition, setPlayerPosition,
    narrativeLogRef, setNarrativeLog, addNarrativeEntry, finalWorldSetup, setFinalWorldSetup,
    turn, setTurn, day, setDay, gameTime, setGameTime,
    currentSeason, setCurrentSeason, worldProfile, setWorldProfile, 
    weatherZones, setWeatherZones, regions, setRegions, regionCounter, setRegionCounter,
    setCurrentChunk, customItemDefinitions, setCustomItemDefinitions,
    customItemCatalog, setCustomItemCatalog, customStructures, setCustomStructures,
    recipes, setRecipes, buildableStructures, setBuildableStructures, gameSlot,
    advanceGameTime,
  } = deps;

  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings } = useSettings();
  const isOnline = settings.gameMode === 'ai';

  // Master Game Initialization Effect
  useEffect(() => {
    let isMounted = true;
    const loadGame = async () => {
        setIsLoaded(false);

        let loadedState: GameState | null = null;
        try {
            if (user) {
                const docRef = doc(db, "users", user.uid, "games", `slot_${gameSlot}`);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    loadedState = docSnap.data() as GameState;
                }
            }
            // Fallback to localStorage if not found on Firebase or not logged in
            if (!loadedState) {
                const localData = localStorage.getItem(`gameState_${gameSlot}`);
                if (localData) {
                    loadedState = JSON.parse(localData);
                }
            }
        } catch (err) {
            console.error('Error loading game state:', err);
        }

        if (!isMounted) return;
        
        // This is the CRITICAL part: we need a valid state to initialize from.
        // If loadedState is null, it means it's a new game, and `finalWorldSetup` should have been passed from the setup screen.
        // However, the `useGameEngine` flow might not guarantee `finalWorldSetup` is set when this effect runs.
        // The most robust way is to ensure we have a valid GameState object, either from loading or from scratch.
        let stateToInitialize = loadedState;
        
        // If there's no loaded state, AND we don't have a finalWorldSetup yet, it's too early to run.
        if (!stateToInitialize && !finalWorldSetup) {
             // This can happen on the very first render. We wait for the state to catch up.
            return;
        }

        if (!stateToInitialize) {
            // This is a NEW GAME. We construct the initial state from `finalWorldSetup`.
            if (!finalWorldSetup) {
                console.error("CRITICAL: New game started but no world setup data is available.");
                return;
            }
            stateToInitialize = {
                worldSetup: finalWorldSetup,
                playerStats: {
                    hp: 100, mana: 50, stamina: 100, bodyTemperature: 37, items: finalWorldSetup.playerInventory,
                    equipment: { weapon: null, armor: null, accessory: null },
                    quests: finalWorldSetup.initialQuests, questsCompleted: 0,
                    skills: finalWorldSetup.startingSkill ? [finalWorldSetup.startingSkill] : [],
                    pets: [], persona: 'none',
                    attributes: { physicalAttack: 10, magicalAttack: 5, critChance: 5, attackSpeed: 1.0, cooldownReduction: 0 },
                    unlockProgress: { kills: 0, damageSpells: 0, moves: 0 },
                    journal: {}, dailyActionLog: [], questHints: {},
                },
                customItemCatalog: customItemCatalog, // This should be set from WorldSetup
                customItemDefinitions: customItemDefinitions,
                customStructures: finalWorldSetup.customStructures,
                day: 1, turn: 1, narrativeLog: [],
                worldProfile: { climateBase: 'temperate', magicLevel: 5, mutationFactor: 2, sunIntensity: 7, weatherTypesAllowed: ['clear', 'rain', 'fog'], moistureBias: 0, tempBias: 0, resourceDensity: 5, theme: 'Normal' },
                currentSeason: 'spring', gameTime: 360,
                weatherZones: {}, world: {}, recipes: {}, buildableStructures: {},
                regions: {}, regionCounter: 0,
                playerPosition: { x: 0, y: 0 },
                playerBehaviorProfile: { moves: 0, attacks: 0, crafts: 0, customActions: 0 },
            };
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
        
        // --- Set up all game data based on the loaded state ---
        const finalCatalogMap = new Map<string, GeneratedItem>();
        Object.entries(staticItemDefinitions).forEach(([name, def]) => {
            finalCatalogMap.set(name, { name, ...def } as unknown as GeneratedItem);
        });
        (stateToInitialize.customItemCatalog || []).forEach(item => {
            const nameKey = typeof item.name === 'string' ? item.name : (item.name as any).en;
            finalCatalogMap.set(nameKey, item);
        });
        firestoreItems.forEach((item, name) => finalCatalogMap.set(name, item));
        
        const finalCatalogArray: GeneratedItem[] = Array.from(finalCatalogMap.values());
        const finalRecipes = { ...staticRecipes, ...(stateToInitialize.recipes || {}) };
        firestoreRecipes.forEach((value, key) => {
            if (!finalRecipes[key]) finalRecipes[key] = value;
        });

        const finalDefs = { ...staticItemDefinitions, ...(stateToInitialize.customItemDefinitions || {}) };
        
        // --- Apply the state to React ---
        setWorldProfile(stateToInitialize.worldProfile);
        setCurrentSeason(stateToInitialize.currentSeason);
        setGameTime(stateToInitialize.gameTime || 360);
        setDay(stateToInitialize.day);
        setTurn(stateToInitialize.turn || 1);
        setWeatherZones(stateToInitialize.weatherZones || {});
        setRecipes(finalRecipes);
        setCustomItemCatalog(finalCatalogArray);
        setCustomItemDefinitions(finalDefs);
        setCustomStructures(stateToInitialize.customStructures || []);
        setBuildableStructures(staticBuildableStructures);
        setPlayerStats(stateToInitialize.playerStats);
        setFinalWorldSetup(stateToInitialize.worldSetup);
        setPlayerPosition(stateToInitialize.playerPosition || { x: 0, y: 0 });
        setPlayerBehaviorProfile(stateToInitialize.playerBehaviorProfile || { moves: 0, attacks: 0, crafts: 0, customActions: 0 });

        // --- Initialize the world and first narrative ---
        let worldSnapshot = stateToInitialize.world || {};
        let regionsSnapshot = stateToInitialize.regions || {};
        let regionCounterSnapshot = stateToInitialize.regionCounter || 0;
        let weatherZonesSnapshot = stateToInitialize.weatherZones || {};

        const initialPosKey = `${stateToInitialize.playerPosition.x},${stateToInitialize.playerPosition.y}`;
        
        const chunkGenResult = ensureChunkExists(
            stateToInitialize.playerPosition, 
            worldSnapshot, 
            regionsSnapshot, 
            regionCounterSnapshot, 
            stateToInitialize.worldProfile, 
            stateToInitialize.currentSeason, 
            finalDefs, 
            finalCatalogArray, 
            stateToInitialize.customStructures || [], 
            language
        );
        worldSnapshot = chunkGenResult.worldWithChunk;
        regionsSnapshot = chunkGenResult.newRegions;
        regionCounterSnapshot = chunkGenResult.newRegionCounter;
        
        Object.keys(regionsSnapshot).filter(id => !weatherZonesSnapshot[id]).forEach(regionId => {
            const region = regionsSnapshot[Number(regionId)];
            if (region) {
                const initialWeather = generateWeatherForZone(region.terrain, stateToInitialize!.currentSeason);
                weatherZonesSnapshot[regionId] = { id: regionId, terrain: region.terrain, currentWeather: initialWeather, nextChangeTime: (stateToInitialize!.gameTime || 360) + Math.floor(Math.random() * (initialWeather.duration_range[1] - initialWeather.duration_range[0] + 1)) + initialWeather.duration_range[0] * 10 };
            }
        });

        setWorld(worldSnapshot);
        setRegions(regionsSnapshot);
        setRegionCounter(regionCounterSnapshot);
        setWeatherZones(weatherZonesSnapshot);

        if ((stateToInitialize.narrativeLog || []).length === 0) {
             const startingChunk = worldSnapshot[initialPosKey];
             if (startingChunk) {
                const chunkDescription = generateOfflineNarrative(startingChunk, 'long', worldSnapshot, stateToInitialize.playerPosition, t);
                const fullIntro = `${t(stateToInitialize.worldSetup.initialNarrative as any)}\n\n${chunkDescription}`;
                addNarrativeEntry(fullIntro, 'narrative');
            }
        } else {
             setNarrativeLog(stateToInitialize.narrativeLog);
        }

        setIsLoaded(true);
    };

    loadGame();

    return () => {
      isMounted = false;
    };
  }, [gameSlot, user, language, finalWorldSetup]); // Rerun if user or language changes. Added finalWorldSetup to re-trigger on new game.


  const triggerRandomEvent = useCallback(() => {
    const baseChunk = world[`${playerPosition.x},${playerPosition.y}`];
    if (!baseChunk) return;

    const possibleEvents = randomEvents.filter(event =>
        (event.theme === 'Normal' || event.theme === worldProfile.theme) &&
        event.canTrigger(baseChunk, playerStats, currentSeason)
    );

    if (possibleEvents.length === 0) return;

    const triggeredEvents = possibleEvents.filter(event => Math.random() < (event.chance ?? 1.0));

    if (triggeredEvents.length === 0) {
        return;
    }

    const event = triggeredEvents[Math.floor(Math.random() * triggeredEvents.length)];

    const eventName = t(event.name as TranslationKey);
    addNarrativeEntry(t('eventTriggered', { eventName }), 'system');

    const { roll } = rollDice('d20');
    const successLevel: SuccessLevel = getSuccessLevel(roll, 'd20');

    const outcome = event.outcomes[successLevel] || event.outcomes['Success'];
    if (!outcome) return;

    addNarrativeEntry(t(outcome.descriptionKey as TranslationKey), 'narrative');

    const effects = outcome.effects;

    let newPlayerStats = { ...playerStats };
    let worldWasModified = false;
    let newWorld = { ...world };

    const hasShelter = world[`${playerPosition.x},${playerPosition.y}`]?.structures.some(s => s.providesShelter);

    if (effects.hpChange) {
        let applyChange = true;
        if (event.id === 'magicRain' || event.id === 'blizzard') {
            if (hasShelter) applyChange = false;
        }
        if (applyChange) newPlayerStats.hp = clamp(newPlayerStats.hp + effects.hpChange, 0, 100);
    }
    if (effects.staminaChange) {
        let applyChange = true;
        if (event.id === 'blizzard') {
            if (hasShelter) applyChange = false;
        }
        if (applyChange) newPlayerStats.stamina = clamp(newPlayerStats.stamina + effects.staminaChange, 0, 100);
    }
    if (effects.manaChange) {
        newPlayerStats.mana = clamp(newPlayerStats.mana + 50, 0, 50);
    }

    if (effects.items) {
        const newItems = [...newPlayerStats.items];
        effects.items.forEach(itemToAdd => {
            const existing = newItems.find(i => i.name === itemToAdd.name);
            if (existing) {
                existing.quantity += itemToAdd.quantity;
            } else {
                const def = customItemDefinitions[itemToAdd.name];
                if (def) {
                    newItems.push({ ...itemToAdd, tier: def.tier, emoji: def.emoji });
                }
            }
        });
        newPlayerStats.items = newItems;
    }

    if (effects.spawnEnemy) {
        const key = `${playerPosition.x},${playerPosition.y}`;
        const chunkToUpdate = newWorld[key];
        if (chunkToUpdate && !chunkToUpdate.enemy) {
            const templates = getTemplates(language);
            const enemyTemplate = templates[baseChunk.terrain]?.enemies.find((e: any) => e.data.type === effects.spawnEnemy!.type)?.data;
            if (enemyTemplate) {
                chunkToUpdate.enemy = {
                    ...enemyTemplate,
                    hp: effects.spawnEnemy.hp,
                    damage: effects.spawnEnemy.damage,
                    satiation: 0,
                };
                worldWasModified = true;
            }
        }
    }

    setPlayerStats(prev => ({ ...prev, ...newPlayerStats }));
    if (worldWasModified) {
        setWorld(newWorld);
    }
  }, [world, playerPosition, playerStats, currentSeason, worldProfile.theme, addNarrativeEntry, t, customItemDefinitions, language, setPlayerStats, setWorld]);

  // EFFECT: Check for game over.
  useEffect(() => {
    if (playerStats.hp <= 0 && !isGameOver) {
        addNarrativeEntry(t('gameOverMessage'), 'system');
        setIsGameOver(true);
    }
  }, [playerStats.hp, isGameOver, addNarrativeEntry, t, setIsGameOver]);

  // EFFECT: Check for skill unlocks based on player's actions.
  useEffect(() => {
    if (!isLoaded) return;
    const { kills, damageSpells, moves } = playerStats.unlockProgress;
    const currentSkillNames = new Set(playerStats.skills.map(s => s.name));

    const newlyUnlockedSkills = skillDefinitions.filter(skillDef => {
        if (currentSkillNames.has(skillDef.name) || !skillDef.unlockCondition) return false;
        const progress = playerStats.unlockProgress[skillDef.unlockCondition.type];
        return progress >= skillDef.unlockCondition.count;
    });

    if (newlyUnlockedSkills.length > 0) {
        setPlayerStats(prev => ({
            ...prev,
            skills: [...prev.skills, ...newlyUnlockedSkills]
        }));
        
        newlyUnlockedSkills.forEach(skill => {
            const skillName = t(skill.name as TranslationKey);
            addNarrativeEntry(t('skillUnlocked', { skillName }), 'system');
            toast({
                title: t('skillUnlockedTitle'),
                description: t('skillUnlockedDesc', { skillName })
            });
        });
    }
  }, [playerStats.unlockProgress.kills, playerStats.unlockProgress.damageSpells, playerStats.unlockProgress.moves, isLoaded, playerStats.skills, setPlayerStats, t, addNarrativeEntry, toast]);

  // EFFECT: Update player persona based on behavior profile.
  useEffect(() => {
    if (!isLoaded) return;
    const { moves, attacks, crafts } = playerBehaviorProfile;
    const totalActions = moves + attacks + crafts;
    
    if (totalActions < 20) return;

    let newPersona: PlayerPersona = playerStats.persona;
    const movePercentage = moves / totalActions;
    const attackPercentage = attacks / totalActions;
    const craftPercentage = crafts / totalActions;
    
    if (movePercentage > 0.6 && newPersona !== 'explorer') newPersona = 'explorer';
    else if (attackPercentage > 0.6 && newPersona !== 'warrior') newPersona = 'warrior';
    else if (craftPercentage > 0.5 && newPersona !== 'artisan') newPersona = 'artisan';

    if (newPersona !== playerStats.persona) {
        setPlayerStats(prev => ({ ...prev, persona: newPersona }));
        const messageKey = newPersona === 'explorer' ? 'personaExplorer' : newPersona === 'warrior' ? 'personaWarrior' : 'personaArtisan';
        addNarrativeEntry(t(messageKey), 'system');
        toast({ title: t('personaUnlockedTitle'), description: t(messageKey) });
    }
  }, [playerBehaviorProfile.moves, playerBehaviorProfile.attacks, playerBehaviorProfile.crafts, isLoaded, playerStats.persona, setPlayerStats, addNarrativeEntry, t, toast]);
  
  // EFFECT: Update the visual representation of the current chunk whenever the environment changes.
  useEffect(() => {
    if (!isLoaded) return;
    const baseChunk = world[`${playerPosition.x},${playerPosition.y}`];
    if (baseChunk) {
        const newEffectiveChunk = getEffectiveChunk(baseChunk, weatherZones, gameTime);
        setCurrentChunk(newEffectiveChunk);
    } else {
        setCurrentChunk(null);
    }
  }, [world, playerPosition, gameTime, weatherZones, setCurrentChunk, isLoaded]);

  // EFFECT: Auto-saving
  useEffect(() => {
    if (!isLoaded || isSaving || isGameOver) return;

    const gameState: GameState = {
        worldProfile, currentSeason, world, recipes, buildableStructures,
        regions, regionCounter, playerPosition, playerBehaviorProfile,
        playerStats, narrativeLog: narrativeLogRef.current!, worldSetup: finalWorldSetup!,
        customItemDefinitions, customItemCatalog, customStructures, weatherZones, gameTime, day,
        turn,
    };

    const save = async () => {
        setIsSaving(true);
        try {
            if (user && db) {
                await setDoc(doc(db, "users", user.uid, "games", `slot_${gameSlot}`), gameState);
            } else {
                localStorage.setItem(`gameState_${gameSlot}`, JSON.stringify(gameState));
            }
        } catch (error) {
            console.error("Failed to save game state:", error);
            toast({ title: "Save Error", description: "Could not save your progress.", variant: "destructive"});
        } finally {
            setIsSaving(false);
        }
    };
    
    const timerId = setTimeout(save, 1500); 
    return () => clearTimeout(timerId);

  }, [
    worldProfile, currentSeason, world, recipes, buildableStructures, regions, regionCounter,
    playerPosition, playerBehaviorProfile, playerStats, narrativeLogRef, finalWorldSetup,
    customItemDefinitions, customItemCatalog, customStructures, weatherZones, gameTime, day, user, isSaving, toast, isGameOver,
    turn, gameSlot, isLoaded, setIsSaving,
  ]);
}
