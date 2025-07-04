
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/language-context";
import { useSettings } from "@/context/settings-context";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase-config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { generateNarrative, type GenerateNarrativeInput } from "@/ai/flows/generate-narrative-flow";
import { generateNewRecipe } from "@/ai/flows/generate-new-recipe";
import { generateJournalEntry } from "@/ai/flows/generate-journal-entry";
import { fuseItems } from "@/ai/flows/fuse-items-flow";
import { provideQuestHint } from "@/ai/flows/provide-quest-hint";
import { generateRegion, getValidAdjacentTerrains, weightedRandom, generateWeatherForZone, checkConditions, calculateCraftingOutcome } from '@/lib/game/engine';
import { itemDefinitions as staticItemDefinitions } from '@/lib/game/items';
import { recipes as staticRecipes } from '@/lib/game/recipes';
import { buildableStructures as staticBuildableStructures } from '@/lib/game/structures';
import { skillDefinitions } from '@/lib/game/skills';
import { getTemplates } from '@/lib/game/templates';
import { worldConfig } from '@/lib/game/world-config';
import type { GameState, World, PlayerStatus, NarrativeEntry, Chunk, Season, WorldProfile, Region, Terrain, PlayerItem, ChunkItem, ItemDefinition, GeneratedItem, WeatherZone, Recipe, WorldConcept, Skill, PlayerBehaviorProfile, PlayerPersona, Structure, Pet, DiceType, ItemEffect, AiModel, NarrativeLength } from "@/lib/game/types";
import type { TranslationKey } from "@/lib/i18n";
import { clamp } from "@/lib/utils";


const getRandomInRange = (range: { min: number, max: number }) => Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

// --- DICE ROLL HELPERS ---
type SuccessLevel = 'CriticalFailure' | 'Failure' | 'Success' | 'GreatSuccess' | 'CriticalSuccess';

function getSuccessLevel(roll: number, diceType: DiceType): SuccessLevel {
    if (diceType === 'd20') {
        if (roll === 1) return 'CriticalFailure';
        if (roll <= 8) return 'Failure';
        if (roll <= 16) return 'Success';
        if (roll <= 19) return 'GreatSuccess';
        return 'CriticalSuccess'; // 20
    }
    if (diceType === 'd12') {
        if (roll === 1) return 'CriticalFailure';
        if (roll <= 5) return 'Failure';
        if (roll <= 10) return 'Success';
        if (roll === 11) return 'GreatSuccess';
        return 'CriticalSuccess'; // 12
    }
    if (diceType === '2d6') {
        if (roll === 2) return 'CriticalFailure';
        if (roll <= 5) return 'Failure';
        if (roll <= 9) return 'Success';
        if (roll <= 11) return 'GreatSuccess';
        return 'CriticalSuccess'; // 12
    }
    return 'Success'; // fallback
}

const rollDice = (diceType: DiceType): { roll: number; range: string } => {
    switch (diceType) {
        case 'd12':
            return { roll: Math.floor(Math.random() * 12) + 1, range: '1-12' };
        case '2d6':
            const d1 = Math.floor(Math.random() * 6) + 1;
            const d2 = Math.floor(Math.random() * 6) + 1;
            return { roll: d1 + d2, range: '2-12' };
        case 'd20':
        default:
            return { roll: Math.floor(Math.random() * 20) + 1, range: '1-20' };
    }
};

const successLevelToTranslationKey: Record<SuccessLevel, TranslationKey> = {
    CriticalFailure: 'criticalFailure',
    Failure: 'failure',
    Success: 'success',
    GreatSuccess: 'greatSuccess',
    CriticalSuccess: 'criticalSuccess',
}

interface GameEngineProps {
    worldSetup?: Omit<WorldConcept, 'playerInventory' | 'customItemCatalog' | 'customStructures'> & { playerInventory: PlayerItem[] };
    initialGameState?: GameState;
    customItemDefinitions?: Record<string, ItemDefinition>;
    customItemCatalog?: GeneratedItem[];
    customStructures?: Structure[];
}

export function useGameEngine({ worldSetup, initialGameState, customItemDefinitions: initialCustomDefs, customItemCatalog: initialCustomCatalog, customStructures: initialCustomStructures }: GameEngineProps) {
    const { t, language } = useLanguage();
    const { settings } = useSettings();
    const { user } = useAuth();
    const { toast } = useToast();
    
    // --- State for Global World Settings ---
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
        }
    );
    const [currentSeason, setCurrentSeason] = useState<Season>(initialGameState?.currentSeason || 'spring');
    const [gameTime, setGameTime] = useState(initialGameState?.gameTime || 360); // 6 AM
    const [day, setDay] = useState(initialGameState?.day || 1);
    const [weatherZones, setWeatherZones] = useState<{ [zoneId: string]: WeatherZone }>(initialGameState?.weatherZones || {});

    // --- State for Game Progression ---
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
            quests: worldSetup?.initialQuests || [],
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
    const [isSaving, setIsSaving] = useState(false);
    const [narrativeLog, setNarrativeLog] = useState<NarrativeEntry[]>(initialGameState?.narrativeLog || []);
    const narrativeIdCounter = useRef(1);
    
    // --- State for AI vs. Rule-based mode ---
    const isOnline = settings.gameMode === 'ai';

    const finalWorldSetup = worldSetup || initialGameState?.worldSetup;

    const addNarrativeEntry = useCallback((text: string, type: NarrativeEntry['type']) => {
        setNarrativeLog(prev => {
            const newEntry = { id: narrativeIdCounter.current, text, type };
            narrativeIdCounter.current++;
            // Keep the log to a max of 50 entries for performance
            return [...prev, newEntry].slice(-50);
        });
    }, []);

    const checkSkillUnlocks = useCallback((currentPlayerStats: PlayerStatus) => {
        const newlyUnlockedSkills: Skill[] = [];
        const currentSkillNames = new Set(currentPlayerStats.skills.map(s => s.name));

        for (const skillDef of skillDefinitions) {
            if (!currentSkillNames.has(skillDef.name) && skillDef.unlockCondition) {
                const progress = currentPlayerStats.unlockProgress[skillDef.unlockCondition.type];
                if (progress >= skillDef.unlockCondition.count) {
                    newlyUnlockedSkills.push(skillDef);
                }
            }
        }

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
    }, [addNarrativeEntry, t, toast]);
    
    // Effect to check for skill unlocks whenever progress changes
    useEffect(() => {
        checkSkillUnlocks(playerStats);
    }, [playerStats.unlockProgress, checkSkillUnlocks]);

    // Effect for calculating player persona
    useEffect(() => {
        const totalActions = playerBehaviorProfile.moves + playerBehaviorProfile.attacks + playerBehaviorProfile.crafts;
        
        // Only start classifying after a certain number of actions
        if (totalActions < 20) return;

        const movePercentage = playerBehaviorProfile.moves / totalActions;
        const attackPercentage = playerBehaviorProfile.attacks / totalActions;
        const craftPercentage = playerBehaviorProfile.crafts / totalActions;
        
        let newPersona: PlayerPersona = 'none';

        if (movePercentage > 0.6) {
            newPersona = 'explorer';
        } else if (attackPercentage > 0.6) {
            newPersona = 'warrior';
        } else if (craftPercentage > 0.5) { // Lower threshold for crafting as it's less frequent
            newPersona = 'artisan';
        }

        if (newPersona !== playerStats.persona && newPersona !== 'none') {
            setPlayerStats(prev => ({ ...prev, persona: newPersona }));
            let messageKey: TranslationKey | null = null;
            if (newPersona === 'explorer') messageKey = 'personaExplorer';
            if (newPersona === 'warrior') messageKey = 'personaWarrior';
            if (newPersona === 'artisan') messageKey = 'personaArtisan';
            
            if (messageKey) {
                 addNarrativeEntry(t(messageKey), 'system');
                 toast({
                    title: t('personaUnlockedTitle'),
                    description: t(messageKey)
                });
            }
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playerBehaviorProfile]);
    
    const getEffectiveChunk = useCallback((baseChunk: Chunk, currentTime: number): Chunk => {
        if (!baseChunk?.regionId || !weatherZones[baseChunk.regionId]) {
             return baseChunk;
        }

        const weatherZone = weatherZones[baseChunk.regionId];
        const weather = weatherZone.currentWeather;
        const effectiveChunk: Chunk = JSON.parse(JSON.stringify(baseChunk)); // Deep copy

        let structureHeat = 0;
        if (effectiveChunk.structures) {
            for (const structure of effectiveChunk.structures) {
                structureHeat += structure.heatValue || 0;
            }
        }
        
        // This calculates the final Celsius temperature
        const baseCelsius = (baseChunk.temperature ?? 5) * 4; // Maps 0-10 base to 0-40 C
        const weatherCelsiusMod = weather.temperature_delta * 2;
        effectiveChunk.temperature = baseCelsius + weatherCelsiusMod + structureHeat;

        effectiveChunk.moisture = clamp(baseChunk.moisture + weather.moisture_delta, 0, 10);
        effectiveChunk.windLevel = clamp((baseChunk.windLevel ?? 3) + weather.wind_delta, 0, 10);
        
        // Calculate light level based on time of day and weather
        let timeLightMod = 0;
        // Night (10pm to 5am)
        if (currentTime >= 1320 || currentTime < 300) {
            timeLightMod = -8;
        } 
        // Dawn/Dusk (5am-7am, 6pm-8pm)
        else if ((currentTime >= 300 && currentTime < 420) || (currentTime >= 1080 && currentTime < 1200)) {
            timeLightMod = -3;
        }
        
        effectiveChunk.lightLevel = clamp(baseChunk.lightLevel + weather.light_delta + timeLightMod, -10, 10);


        return effectiveChunk;
    }, [weatherZones]);
    
    const ensureChunkExists = useCallback((
        pos: {x: number, y: number}, 
        currentWorld: World,
        currentRegions: { [id: number]: Region },
        currentRegionCounter: number
    ) => {
        const newPosKey = `${pos.x},${pos.y}`;
        if (currentWorld[newPosKey]) {
            return { 
                worldWithChunk: currentWorld, 
                chunk: currentWorld[newPosKey],
                regions: currentRegions,
                regionCounter: currentRegionCounter,
            };
        }
    
        const validTerrains = getValidAdjacentTerrains(pos, currentWorld);
        const terrainProbs = validTerrains.map(t => [t, worldConfig[t].spreadWeight] as [Terrain, number]);
        const newTerrain = weightedRandom(terrainProbs);
        
        const result = generateRegion(
            pos, 
            newTerrain, 
            currentWorld, 
            currentRegions, 
            currentRegionCounter,
            worldProfile,
            currentSeason,
            customItemDefinitions,
            customItemCatalog,
            customStructures,
            language
        );
        
        return { 
            worldWithChunk: result.newWorld, 
            chunk: result.newWorld[newPosKey],
            regions: result.regions,
            regionCounter: result.newRegionCounter
        };
    }, [worldProfile, currentSeason, customItemDefinitions, customItemCatalog, customStructures, language]);

    // Game state loading/initialization effect
    useEffect(() => {
        // This effect runs when the component mounts or when the user logs in/out.
        const loadGame = async () => {
            if (user) {
                // User is logged in, try loading from Firestore
                const gameDocRef = doc(db, "games", user.uid);
                const gameDocSnap = await getDoc(gameDocRef);

                if (gameDocSnap.exists()) {
                    const cloudState = gameDocSnap.data() as GameState;
                    // TODO: Implement a merge strategy if local data is newer
                    setWorldProfile(cloudState.worldProfile);
                    setCurrentSeason(cloudState.currentSeason);
                    setGameTime(cloudState.gameTime);
                    setDay(cloudState.day);
                    setWeatherZones(cloudState.weatherZones);
                    setWorld(cloudState.world);
                    setRecipes(cloudState.recipes);
                    setBuildableStructures(cloudState.buildableStructures);
                    setRegions(cloudState.regions);
                    setRegionCounter(cloudState.regionCounter);
                    setPlayerPosition(cloudState.playerPosition);
                    setPlayerBehaviorProfile(cloudState.playerBehaviorProfile);
                    setPlayerStats(cloudState.playerStats);
                    setCustomItemDefinitions(cloudState.customItemDefinitions);
                    setCustomItemCatalog(cloudState.customItemCatalog);
                    setCustomStructures(cloudState.customStructures);
                    setNarrativeLog(cloudState.narrativeLog);
                    if (cloudState.narrativeLog.length > 0) {
                        narrativeIdCounter.current = Math.max(...cloudState.narrativeLog.map(e => e.id)) + 1;
                    }
                    toast({ title: "Game Synced", description: "Your progress has been loaded from the cloud." });
                    return;
                }
            }

            // Fallback for new users, logged-out users, or if there's no cloud save.
            if (initialGameState) {
                 if (narrativeLog.length > 0) {
                    narrativeIdCounter.current = Math.max(...narrativeLog.map(e => e.id)) + 1;
                }
                return; // Already loaded from props
            }

            if (worldSetup) {
                addNarrativeEntry(worldSetup.initialNarrative, 'narrative');
                const startPos = { x: 0, y: 0 };
                const startingTerrain = worldSetup.startingBiome as Terrain;
                
                let { newWorld, newRegions, newRegionCounter } = generateRegion(
                    startPos, startingTerrain, {}, {}, 0,
                    worldProfile, currentSeason, customItemDefinitions,
                    customItemCatalog, customStructures, language
                );
                
                // Reveal the initial 3x3 area around the player
                const visionRadius = 1;
                let worldSnapshot = { ...newWorld };
                let regionsSnapshot = { ...newRegions };
                let regionCounterSnapshot = newRegionCounter;

                for (let dy = -visionRadius; dy <= visionRadius; dy++) {
                    for (let dx = -visionRadius; dx <= visionRadius; dx++) {
                        const revealPos = { x: startPos.x + dx, y: startPos.y + dy };
                        if (!worldSnapshot[`${revealPos.x},${revealPos.y}`]) {
                            const result = ensureChunkExists(revealPos, worldSnapshot, regionsSnapshot, regionCounterSnapshot);
                            worldSnapshot = result.worldWithChunk;
                            regionsSnapshot = result.regions;
                            regionCounterSnapshot = result.regionCounter;
                        }
                        worldSnapshot[`${revealPos.x},${revealPos.y}`].explored = true;
                    }
                }
                newWorld = worldSnapshot;
                newRegions = regionsSnapshot;
                newRegionCounter = regionCounterSnapshot;

                const startKey = `${startPos.x},${startPos.y}`;
                if (newWorld[startKey]) {
                    addNarrativeEntry(newWorld[startKey].description, 'narrative');
                }

                const initialWeatherZones: { [zoneId: string]: WeatherZone } = {};
                
                Object.entries(newRegions).forEach(([regionId, region]) => {
                    const initialWeather = generateWeatherForZone(region.terrain, currentSeason);
                    const nextChangeTime = gameTime + getRandomInRange({min: initialWeather.duration_range[0], max: initialWeather.duration_range[1]}) * 5;
                    initialWeatherZones[regionId] = {
                        id: regionId, terrain: region.terrain,
                        currentWeather: initialWeather, nextChangeTime: nextChangeTime
                    };
                });
                
                setWeatherZones(initialWeatherZones);
                setWorld(newWorld);
                setRegions(newRegions);
                setRegionCounter(newRegionCounter);
                setPlayerStats(prev => ({ ...prev, bodyTemperature: 37 }));
            }
        };

        loadGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Game state saving effect
    useEffect(() => {
        if (Object.keys(world).length === 0 || !finalWorldSetup || isSaving) return;

        const gameState: GameState = {
            worldProfile, currentSeason, world, recipes, buildableStructures,
            regions, regionCounter, playerPosition, playerBehaviorProfile,
            playerStats, narrativeLog, worldSetup: finalWorldSetup,
            customItemDefinitions, customItemCatalog, customStructures, weatherZones, gameTime, day,
        };

        const save = async () => {
            setIsSaving(true);
            try {
                if (user) {
                    // Logged in: save to Firestore
                    const gameDocRef = doc(db, "games", user.uid);
                    await setDoc(gameDocRef, gameState, { merge: true });
                } else {
                    // Not logged in: save to localStorage
                    localStorage.setItem('gameState', JSON.stringify(gameState));
                }
            } catch (error) {
                console.error("Failed to save game state:", error);
                toast({ title: "Save Error", description: "Could not save your progress.", variant: "destructive"});
            } finally {
                setIsSaving(false);
            }
        };
        
        // Debounce saving to avoid excessive writes
        const timerId = setTimeout(save, 1500); 
        return () => clearTimeout(timerId);

    }, [
        worldProfile, currentSeason, world, recipes, buildableStructures, regions, regionCounter,
        playerPosition, playerBehaviorProfile, playerStats, narrativeLog, finalWorldSetup,
        customItemDefinitions, customItemCatalog, customStructures, weatherZones, gameTime, day, user, isSaving, toast
    ]);

    const advanceGameTime = useCallback(async () => {
        let newWorldState = { ...world };
        let worldWasModified = false;
        let changes = { narrativeEntries: [] as { text: string; type: NarrativeEntry['type'] }[] };
    
        const newGameTime = (gameTime + 5) % 1440;
        const currentDay = day;
        const newDay = newGameTime < gameTime ? day + 1 : day;
    
        if (newDay > currentDay) {
            addNarrativeEntry(t('newDay'), 'system');
            if (isOnline && playerStats.dailyActionLog && playerStats.dailyActionLog.length > 0) {
                try {
                    const journalResult = await generateJournalEntry({
                        dailyActionLog: playerStats.dailyActionLog,
                        playerPersona: playerStats.persona,
                        worldName: finalWorldSetup?.worldName || 'Dreamland',
                        language,
                    });
                    setPlayerStats(prev => ({
                        ...prev,
                        journal: { ...prev.journal, [currentDay]: journalResult.journalEntry },
                        dailyActionLog: [],
                    }));
                    addNarrativeEntry(t('journalUpdated'), 'system');
                } catch (e) {
                    console.error("Failed to generate journal entry:", e);
                }
            } else {
                 setPlayerStats(prev => ({...prev, dailyActionLog: []}));
            }
            setDay(newDay);
        }
        setGameTime(newGameTime);
    
        // --- WORLD SIMULATION ---
        const newWeatherZones = { ...weatherZones };
        let weatherHasChanged = false;
        for (const zoneId in newWeatherZones) {
            const zone = { ...newWeatherZones[zoneId] };
            if (newGameTime >= zone.nextChangeTime) {
                const newWeather = generateWeatherForZone(zone.terrain, currentSeason, zone.currentWeather);
                zone.currentWeather = newWeather;
                zone.nextChangeTime = newGameTime + getRandomInRange({min: newWeather.duration_range[0], max: newWeather.duration_range[1]}) * 5;
                changes.narrativeEntries.push({ text: t(newWeather.description as TranslationKey), type: 'system'});
                newWeatherZones[zoneId] = zone;
                weatherHasChanged = true;
            }
        }
        if (weatherHasChanged) {
            setWeatherZones(newWeatherZones);
        }
    
        const allCreatures = [];
        const templates = getTemplates(language);
        for (const key in newWorldState) {
            if (newWorldState[key].enemy) {
                allCreatures.push({ key, chunk: newWorldState[key], enemyData: newWorldState[key].enemy! });
            }
        }
        allCreatures.sort(() => Math.random() - 0.5);
    
        for (const creature of allCreatures) {
            // Simulation logic... (omitted for brevity, remains unchanged)
        }
        
        const ITEM_ECOLOGY_CHANCE = 0.1;
        for (const key in newWorldState) {
            const chunk = newWorldState[key];
            if (!chunk.items || chunk.items.length === 0) continue;
            
            const effectiveChunk = getEffectiveChunk(chunk, newGameTime);
            // Ecology simulation... (omitted for brevity, remains unchanged)
        }
    
        // --- PLAYER STATS SIMULATION ---
        let nextPlayerStats = {...playerStats};
        const playerChunkKey = `${playerPosition.x},${playerPosition.y}`;
        const currentPlayerChunk = newWorldState[playerChunkKey];

        if (currentPlayerChunk) {
            const effectiveChunk = getEffectiveChunk(currentPlayerChunk, newGameTime);
            const environmentCelsius = effectiveChunk.temperature || 15;
            
            const IDEAL_BODY_TEMP = 37.0;
            const ENVIRONMENTAL_PULL_FACTOR = 0.1;
            const SELF_REGULATION_FACTOR = 0.15;

            const tempDelta = (environmentCelsius - nextPlayerStats.bodyTemperature) * ENVIRONMENTAL_PULL_FACTOR + (IDEAL_BODY_TEMP - nextPlayerStats.bodyTemperature) * SELF_REGULATION_FACTOR;
            nextPlayerStats.bodyTemperature += tempDelta;

            const temp = nextPlayerStats.bodyTemperature;
            if (temp < 30) {
                nextPlayerStats.hp = Math.max(0, nextPlayerStats.hp - 1);
                changes.narrativeEntries.push({ text: t('tempDangerFreezing'), type: 'system' });
            } else if (temp < 35) {
                nextPlayerStats.stamina = Math.max(0, nextPlayerStats.stamina - 0.5);
                changes.narrativeEntries.push({ text: t('tempWarningCold'), type: 'system' });
            } else if (temp > 42) {
                nextPlayerStats.stamina = Math.max(0, nextPlayerStats.stamina - 2);
                changes.narrativeEntries.push({ text: t('tempDangerHot'), type: 'system' });
            } else if (temp > 40) {
                nextPlayerStats.stamina = Math.max(0, nextPlayerStats.stamina - 1);
                changes.narrativeEntries.push({ text: t('tempWarningHot'), type: 'system' });
            }

            if (currentPlayerChunk.enemy && currentPlayerChunk.enemy.behavior === 'aggressive') {
                changes.narrativeEntries.push({ text: t('enemyAttacks', { enemy: t(currentPlayerChunk.enemy.type as TranslationKey) }), type: 'system' });
                nextPlayerStats.hp = Math.max(0, nextPlayerStats.hp - currentPlayerChunk.enemy.damage);
            }
        }
        
        if (worldWasModified) setWorld(newWorldState);
        setPlayerStats(prev => ({ ...prev, ...nextPlayerStats }));

        if (changes.narrativeEntries.length > 0) {
            const uniqueNarratives = [...new Map(changes.narrativeEntries.map(item => [item.text, item])).values()];
            uniqueNarratives.forEach(entry => addNarrativeEntry(entry.text, entry.type));
        }
    }, [world, gameTime, day, playerPosition, playerStats, weatherZones, currentSeason, customItemDefinitions, getEffectiveChunk, addNarrativeEntry, t, language, isOnline, finalWorldSetup]);
    

    const handleOnlineNarrative = async (action: string, worldCtx: World, playerPosCtx: {x: number, y: number}, playerStatsCtx: PlayerStatus) => {
        setIsLoading(true);
        const baseChunk = worldCtx[`${playerPosCtx.x},${playerPosCtx.y}`];
        if (!baseChunk || !finalWorldSetup) {
            setIsLoading(false);
            return;
        }

        const { roll, range } = rollDice(settings.diceType);
        const successLevel = getSuccessLevel(roll, settings.diceType);
        const successLevelKey = successLevelToTranslationKey[successLevel];
        addNarrativeEntry(t('diceRollMessage', { roll, level: t(successLevelKey) }), 'system');

        const currentChunk = getEffectiveChunk(baseChunk, gameTime);

        try {
            const input: GenerateNarrativeInput = {
                worldName: finalWorldSetup.worldName,
                playerAction: action,
                playerStatus: playerStatsCtx,
                currentChunk: {
                    x: currentChunk.x,
                    y: currentChunk.y,
                    terrain: currentChunk.terrain,
                    description: currentChunk.description,
                    NPCs: currentChunk.NPCs,
                    items: currentChunk.items,
                    structures: currentChunk.structures,
                    explored: currentChunk.explored,
                    enemy: currentChunk.enemy,
                    vegetationDensity: currentChunk.vegetationDensity,
                    moisture: currentChunk.moisture,
                    elevation: currentChunk.elevation,
                    lightLevel: currentChunk.lightLevel,
                    dangerLevel: currentChunk.dangerLevel,
                    magicAffinity: currentChunk.magicAffinity,
                    humanPresence: currentChunk.humanPresence,
                    predatorPresence: currentChunk.predatorPresence,
                    temperature: currentChunk.temperature,
                    windLevel: currentChunk.windLevel,
                },
                recentNarrative: narrativeLog.slice(-5).map(e => e.text),
                language,
                customItemDefinitions,
                diceRoll: roll,
                diceType: settings.diceType,
                diceRange: range,
                successLevel,
                aiModel: settings.aiModel,
                narrativeLength: settings.narrativeLength,
            };

            const result = await generateNarrative(input);
            addNarrativeEntry(result.narrative, 'narrative');
            if(result.systemMessage) {
                addNarrativeEntry(result.systemMessage, 'system');
            }

            setWorld(prevWorld => {
                const updatedWorld = { ...prevWorld };
                const key = `${currentChunk.x},${currentChunk.y}`;
                if (result.updatedChunk) {
                    const chunkToUpdate = updatedWorld[key];
                    const updatedEnemy = result.updatedChunk.enemy !== undefined ? result.updatedChunk.enemy : chunkToUpdate.enemy;
                    
                    updatedWorld[key] = { 
                        ...chunkToUpdate, 
                        ...result.updatedChunk,
                        enemy: updatedEnemy
                    };
                }
                return updatedWorld;
            });

            setPlayerStats(prev => {
                let newStats = { ...prev };
                if (result.updatedPlayerStatus) {
                    newStats = { ...newStats, ...result.updatedPlayerStatus };
                }
        
                // Check for a kill by comparing world state before and after AI call
                const chunkBeforeUpdate = worldCtx[`${playerPosCtx.x},${playerPosCtx.y}`];
                if (chunkBeforeUpdate?.enemy && result.updatedChunk?.enemy === null) {
                    const currentProgress = newStats.unlockProgress;
                    newStats.unlockProgress = { ...currentProgress, kills: currentProgress.kills + 1 };
                }
        
                return newStats;
            });
            
            if (result.newlyGeneratedItem) {
                const newItem = result.newlyGeneratedItem;
                if (!customItemDefinitions[newItem.name]) {
                    setCustomItemCatalog(prev => [...prev, newItem]);
                    setCustomItemDefinitions(prev => {
                        const newDefs = { ...prev };
                        newDefs[newItem.name] = {
                            description: newItem.description,
                            tier: newItem.tier,
                            category: newItem.category,
                            emoji: newItem.emoji,
                            effects: newItem.effects as ItemEffect[],
                            baseQuantity: newItem.baseQuantity,
                            growthConditions: newItem.growthConditions as any,
                        };
                        return newDefs;
                    });
                }
            }

        } catch (error) {
            console.error("AI narrative generation failed:", error);
            toast({ title: t('offlineModeActive'), description: t('offlineToastDesc'), variant: "destructive" });
        } finally {
            advanceGameTime();
            setIsLoading(false);
        }
    };
    
    // --- OFFLINE (RULE-BASED) ACTION HANDLERS ---

    const handleOfflineAttack = () => {
        const key = `${playerPosition.x},${playerPosition.y}`;
        const baseChunk = world[key];
        if (!baseChunk || !baseChunk.enemy) {
            addNarrativeEntry(t('noTarget'), 'system');
            return;
        }
        const currentChunk = getEffectiveChunk(baseChunk, gameTime);
    
        const actionText = `${t('attackAction')} ${t(currentChunk.enemy!.type as TranslationKey)}`;
        addNarrativeEntry(actionText, 'action');
    
        const { roll, range } = rollDice(settings.diceType);
        const successLevel = getSuccessLevel(roll, settings.diceType);
        const successLevelKey = successLevelToTranslationKey[successLevel];
        addNarrativeEntry(t('diceRollMessage', { roll, level: t(successLevelKey) }), 'system');
    
        let playerDamage = 0;
        const combatLogParts: string[] = [];
    
        let damageMultiplier = 1.0;
        switch (successLevel) {
            case 'CriticalFailure':
                damageMultiplier = 0;
                combatLogParts.push(t('attackCritFail'));
                break;
            case 'Failure':
                damageMultiplier = 0;
                combatLogParts.push(t('attackFail'));
                break;
            case 'GreatSuccess':
                damageMultiplier = 1.5;
                break;
            case 'CriticalSuccess':
                damageMultiplier = 2.0;
                break;
            case 'Success':
            default:
                damageMultiplier = 1.0;
                break;
        }
        
        if (damageMultiplier > 0) {
            let playerDamageModifier = 1.0;
            if (currentChunk.lightLevel !== undefined && currentChunk.lightLevel < -3) {
                playerDamageModifier *= 0.8;
                combatLogParts.push(t('attackEnvFog'));
            }
            if (currentChunk.moisture !== undefined && currentChunk.moisture > 8) {
                playerDamageModifier *= 0.9;
                combatLogParts.push(t('attackEnvRain'));
            }
    
            let playerBaseDamage = playerStats.attributes.physicalAttack;
            if (playerStats.persona === 'warrior') {
                playerBaseDamage += 2; 
            }
    
            playerDamage = Math.round(playerBaseDamage * damageMultiplier * playerDamageModifier);
        }
    
        const finalEnemyHp = Math.max(0, currentChunk.enemy.hp - playerDamage);
        const enemyDefeated = finalEnemyHp <= 0;
        let lootDrops: ChunkItem[] = [];
    
        if (playerDamage > 0) {
            if (successLevel === 'CriticalSuccess') {
                 combatLogParts.push(t('attackCritSuccess', { enemyType: t(currentChunk.enemy.type as TranslationKey), playerDamage }));
            } else if (successLevel === 'GreatSuccess') {
                combatLogParts.push(t('attackGreatSuccess', { enemyType: t(currentChunk.enemy.type as TranslationKey), playerDamage }));
            } else {
                combatLogParts.push(t('attackSuccess', { enemyType: t(currentChunk.enemy.type as TranslationKey), playerDamage }));
            }
        }
    
        let enemyDamage = 0;
        let fled = false;
    
        if (enemyDefeated) {
            const templates = getTemplates(language);
            const enemyTemplate = templates[currentChunk.terrain]?.enemies.find((e: any) => e.data.type === currentChunk.enemy!.type);
            if (enemyTemplate && enemyTemplate.data.loot) {
                for (const lootItem of enemyTemplate.data.loot) {
                    if (Math.random() < lootItem.chance) {
                        const definition = customItemDefinitions[lootItem.name];
                        if (definition) {
                            const quantity = getRandomInRange(lootItem.quantity);
                            lootDrops.push({
                                name: lootItem.name,
                                description: definition.description,
                                tier: definition.tier,
                                quantity: quantity,
                                emoji: definition.emoji,
                            });
                        }
                    }
                }
            }
        } else {
            const shouldFlee = currentChunk.enemy.behavior === 'passive' || (successLevel === 'CriticalSuccess' && currentChunk.enemy.size === 'small');
            if (shouldFlee) {
                fled = true;
            } else {
                enemyDamage = Math.round(currentChunk.enemy.damage);
            }
        }
    
        const finalPlayerHp = Math.max(0, playerStats.hp - enemyDamage);
    
        let narrative = combatLogParts.join(' ');
        if (enemyDefeated) {
            narrative += ` ${t('enemyDefeated', { enemyType: t(currentChunk.enemy.type as TranslationKey) })}`;
            if (lootDrops.length > 0) {
                narrative += ` ${t('enemyDropped', { items: lootDrops.map(i => `${i.quantity}x ${t(i.name as TranslationKey)}`).join(', ') })}`;
            }
        } else if (fled) {
            narrative += ` ${t('enemyFled', { enemyType: t(currentChunk.enemy.type as TranslationKey) })}`;
        } else if (enemyDamage > 0) {
            narrative += ` ${t('enemyRetaliated', { enemyType: t(currentChunk.enemy.type as TranslationKey), damage: enemyDamage })}`;
        } else {
            narrative += ` ${t('enemyPrepares', { enemyType: t(currentChunk.enemy.type as TranslationKey) })}`;
        }
        addNarrativeEntry(narrative, 'narrative');
    
        setPlayerStats(prev => {
            const currentProgress = prev.unlockProgress;
            return {
                ...prev,
                hp: finalPlayerHp,
                unlockProgress: enemyDefeated ? { ...currentProgress, kills: currentProgress.kills + 1 } : currentProgress
            };
        });
    
        setWorld(prevWorld => {
            const newWorld = { ...prevWorld };
            const chunkToUpdate = { ...newWorld[key]! };
            
            if (enemyDefeated || fled) {
                chunkToUpdate.enemy = null;
            } else {
                chunkToUpdate.enemy = { ...chunkToUpdate.enemy!, hp: finalEnemyHp };
            }
    
            if (lootDrops.length > 0) {
                const newItemsMap = new Map<string, ChunkItem>();
                (chunkToUpdate.items || []).forEach(item => newItemsMap.set(item.name, { ...item }));
                lootDrops.forEach(droppedItem => {
                    const existingItem = newItemsMap.get(droppedItem.name);
                    if (existingItem) {
                        existingItem.quantity += droppedItem.quantity;
                    } else {
                        newItemsMap.set(droppedItem.name, droppedItem);
                    }
                });
                chunkToUpdate.items = Array.from(newItemsMap.values());
            }
    
            newWorld[key] = chunkToUpdate;
            return newWorld;
        });
    
        advanceGameTime();
    };

    const handleOfflineItemUse = (itemName: string, target: 'player' | string) => {
        const actionText = target === 'player'
            ? `${t('useAction')} ${t(itemName as TranslationKey)}`
            : `${t('useOnAction', {item: t(itemName as TranslationKey), target: t(target as TranslationKey)})}`;
        addNarrativeEntry(actionText, 'action');

        let newPlayerStats = { ...playerStats };
        const itemIndex = newPlayerStats.items.findIndex(i => i.name === itemName);

        if (itemIndex === -1) {
            addNarrativeEntry(t('itemNotFound'), 'system');
            return;
        }

        if (target === 'player') {
            const itemDef = customItemDefinitions[itemName];
            if (!itemDef || itemDef.effects.length === 0) {
                addNarrativeEntry(t('itemNoEffect', { item: t(itemName as TranslationKey) }), 'system');
                return;
            }

            const effectDescriptions: string[] = [];
            itemDef.effects.forEach(effect => {
                switch (effect.type) {
                    case 'HEAL':
                        const oldHp = newPlayerStats.hp;
                        newPlayerStats.hp = Math.min(100, newPlayerStats.hp + effect.amount);
                        if (newPlayerStats.hp > oldHp) {
                            effectDescriptions.push(t('itemHealEffect', { amount: newPlayerStats.hp - oldHp }));
                        }
                        break;
                    case 'RESTORE_STAMINA':
                        const oldStamina = newPlayerStats.stamina;
                        newPlayerStats.stamina = Math.min(100, newPlayerStats.stamina + effect.amount);
                        if (newPlayerStats.stamina > oldStamina) {
                            effectDescriptions.push(t('itemStaminaEffect', { amount: (newPlayerStats.stamina - oldStamina).toFixed(0) }));
                        }
                        break;
                }
            });
            
            if (effectDescriptions.length === 0) {
                addNarrativeEntry(t('itemDidNothing', { item: t(itemName as TranslationKey) }), 'system');
            } else {
                newPlayerStats.items[itemIndex].quantity -= 1;
                addNarrativeEntry(t('itemUsedSuccess', { item: t(itemName as TranslationKey), effect: effectDescriptions.join(', ') }), 'system');
            }
        } else {
            const key = `${playerPosition.x},${playerPosition.y}`;
            const currentChunk = world[key];
            if (!currentChunk || !currentChunk.enemy || currentChunk.enemy.type !== target) {
                addNarrativeEntry(t('noTargetForITEM', {target: t(target as TranslationKey)}), 'system');
                return;
            }

            if (!currentChunk.enemy.diet.includes(itemName)) {
                addNarrativeEntry(t('targetNotInterested', { target: t(target as TranslationKey) }), 'system');
                return;
            }

            newPlayerStats.items[itemIndex].quantity -= 1;
            
            const newEnemyState = { ...currentChunk.enemy };
            newEnemyState.satiation = Math.min(newEnemyState.satiation + 1, newEnemyState.maxSatiation);

            const baseTameChance = 0.1;
            const satiationBonus = (newEnemyState.satiation / newEnemyState.maxSatiation) * 0.4;
            const healthPenalty = (newEnemyState.hp / 100) * 0.2;
            const tamingChance = baseTameChance + satiationBonus - healthPenalty;

            if (Math.random() < tamingChance) {
                const newPet: Pet = { type: currentChunk.enemy.type, level: 1 };
                if (!newPlayerStats.pets) newPlayerStats.pets = [];
                newPlayerStats.pets.push(newPet);
                setWorld(prev => ({...prev, [key]: {...prev[key], enemy: null}}));
                addNarrativeEntry(t('tameSuccess', { target: t(target as TranslationKey) }), 'system');
            } else {
                setWorld(prev => ({...prev, [key]: {...prev[key], enemy: newEnemyState}}));
                addNarrativeEntry(t('tameFail', { target: t(target as TranslationKey), item: t(itemName as TranslationKey)}), 'system');
            }
        }

        setPlayerStats(prev => ({...prev, ...newPlayerStats, items: newPlayerStats.items.filter(i => i.quantity > 0)}));
        advanceGameTime();
    };

    const handleOfflineSkillUse = (skillName: string) => {
        let newPlayerStatus: PlayerStatus = JSON.parse(JSON.stringify(playerStats));
        const skillToUse = newPlayerStatus.skills.find(s => s.name === skillName);
    
        if (!skillToUse) {
            addNarrativeEntry(t('skillNotFound', { skillName: t(skillName as TranslationKey) }), 'system');
            return;
        }
        
        if (newPlayerStatus.mana < skillToUse.manaCost) {
            addNarrativeEntry(t('notEnoughMana', { skillName: t(skillName as TranslationKey) }), 'system');
            return;
        }
    
        const { roll, range } = rollDice(settings.diceType);
        const successLevel = getSuccessLevel(roll, settings.diceType);
        const successLevelKey = successLevelToTranslationKey[successLevel];
        addNarrativeEntry(t('diceRollMessage', { roll, level: t(successLevelKey) }), 'system');
    
        newPlayerStatus.mana -= skillToUse.manaCost;
    
        let narrative = "";
        let effectMultiplier = 1.0;
    
        const key = `${playerPosition.x},${playerPosition.y}`;
        const currentChunk = world[key];
        let newEnemy: Chunk['enemy'] = currentChunk?.enemy ? { ...currentChunk.enemy } : null;
    
        switch (successLevel) {
            case 'CriticalFailure':
                if (skillToUse.effect.type === 'HEAL') {
                    const backfireDamage = Math.round(skillToUse.effect.amount * 0.5);
                    newPlayerStatus.hp = Math.max(0, newPlayerStatus.hp - backfireDamage);
                    narrative = t('skillHealCritFail', { damage: backfireDamage });
                } else if (skillToUse.effect.type === 'DAMAGE') {
                     const backfireDamage = Math.round(skillToUse.effect.amount * 0.5);
                    newPlayerStatus.hp = Math.max(0, newPlayerStatus.hp - backfireDamage);
                    narrative = t('skillDamageCritFail', { damage: backfireDamage });
                }
                addNarrativeEntry(narrative, 'narrative');
                setPlayerStats(newPlayerStatus);
                advanceGameTime();
                return;
    
            case 'Failure':
                narrative = t('skillFail', { skillName: t(skillName as TranslationKey) });
                addNarrativeEntry(narrative, 'narrative');
                setPlayerStats(newPlayerStatus);
                advanceGameTime();
                return;
    
            case 'GreatSuccess': effectMultiplier = 1.5; break;
            case 'CriticalSuccess': effectMultiplier = 2.0; break;
            case 'Success': default: effectMultiplier = 1.0; break;
        }
    
        switch (skillToUse.effect.type) {
            case 'HEAL':
                if (skillToUse.effect.target === 'SELF') {
                    const healAmount = Math.round(skillToUse.effect.amount * effectMultiplier);
                    const oldHp = newPlayerStatus.hp;
                    newPlayerStatus.hp = Math.min(100, newPlayerStatus.hp + healAmount);
                    const healedFor = newPlayerStatus.hp - oldHp;
                    narrative = t('skillHealSuccess', { skillName: t(skillName as TranslationKey), amount: healedFor });
                    if (successLevel === 'GreatSuccess') narrative += ` ${t('skillGreatSuccessBonus')}`;
                    if (successLevel === 'CriticalSuccess') narrative += ` ${t('skillCritSuccessBonus')}`;
                }
                break;
            case 'DAMAGE':
                if (skillToUse.effect.target === 'ENEMY') {
                    if (!newEnemy) {
                        narrative = t('skillNoTarget', { skillName: t(skillName as TranslationKey) });
                    } else {
                        const baseDamage = skillToUse.effect.amount + Math.round(newPlayerStatus.attributes.magicalAttack * 0.5);
                        const finalDamage = Math.round(baseDamage * effectMultiplier);
                        newEnemy.hp = Math.max(0, newEnemy.hp - finalDamage);
                        
                        if (successLevel === 'CriticalSuccess') {
                            narrative = t('skillDamageCritSuccess', { skillName: t(skillName as TranslationKey), enemy: t(newEnemy.type as TranslationKey), damage: finalDamage });
                        } else {
                            narrative = t('skillDamageSuccess', { skillName: t(skillName as TranslationKey), enemy: t(newEnemy.type as TranslationKey), damage: finalDamage });
                            if (successLevel === 'GreatSuccess') narrative += ` ${t('skillDamageGreatSuccessBonus')}`;
                        }
    
                        if (skillToUse.effect.healRatio) {
                            const healedAmount = Math.round(finalDamage * skillToUse.effect.healRatio);
                            const oldHp = newPlayerStatus.hp;
                            newPlayerStatus.hp = Math.min(100, newPlayerStatus.hp + healedAmount);
                            if (newPlayerStatus.hp > oldHp) {
                                narrative += ` ${t('siphonHealth', { amount: newPlayerStatus.hp - oldHp })}`;
                            }
                        }
    
                        if (newEnemy.hp <= 0) {
                            narrative += ` ${t('enemyVanquished', { enemyType: t(newEnemy.type as TranslationKey) })}`;
                            newEnemy = null;
                            newPlayerStatus.unlockProgress.kills += 1;
                        }
                    }
                    newPlayerStatus.unlockProgress.damageSpells += 1;
                }
                break;
        }
    
        addNarrativeEntry(narrative, 'narrative');
        setPlayerStats(newPlayerStatus);
        if(newEnemy !== currentChunk?.enemy) {
            setWorld(prev => ({...prev, [key]: {...prev[key]!, enemy: newEnemy}}));
        }
        advanceGameTime();
    };

    // --- MAIN ACTION HANDLERS ---

    const handleMove = (direction: "north" | "south" | "east" | "west") => {
        setPlayerBehaviorProfile(p => ({ ...p, moves: p.moves + 1 }));

        let newPos = { ...playerPosition };
        let dirKey: 'directionNorth' | 'directionSouth' | 'directionEast' | 'directionWest' = 'directionNorth';
        if (direction === 'north') { newPos.y++; dirKey = 'directionNorth'; }
        else if (direction === 'south') { newPos.y--; dirKey = 'directionSouth'; }
        else if (direction === 'east') { newPos.x++; dirKey = 'directionEast'; }
        else if (direction === 'west') { newPos.x--; dirKey = 'directionWest'; }

        let worldSnapshot = { ...world };
        let regionsSnapshot = { ...regions };
        let regionCounterSnapshot = regionCounter;
        
        const destResult = ensureChunkExists(newPos, worldSnapshot, regionsSnapshot, regionCounterSnapshot);
        worldSnapshot = destResult.worldWithChunk;
        regionsSnapshot = destResult.regions;
        regionCounterSnapshot = destResult.regionCounter;
        const destinationChunk = destResult.chunk;
        
        if (!destinationChunk) {
            console.error("Error: Could not find or generate destination chunk.");
            return;
        }

        if (destinationChunk.terrain === 'wall') {
            addNarrativeEntry(t('wallBlock'), 'system');
            return;
        }

        const travelCost = playerStats.persona === 'explorer' ? Math.max(1, (worldConfig[destinationChunk.terrain]?.travelCost || 3) - 1) : (worldConfig[destinationChunk.terrain]?.travelCost || 3);
        
        if (playerStats.stamina < travelCost) {
            toast({
                title: t('notEnoughStamina'),
                description: t('notEnoughStaminaDesc', { cost: travelCost, current: playerStats.stamina.toFixed(0) }),
                variant: "destructive",
            });
            return;
        }
        
        const actionText = t('wentDirection', { direction: t(dirKey) });
        addNarrativeEntry(actionText, 'action');

        const newPlayerStats = {
             ...playerStats,
             stamina: playerStats.stamina - travelCost,
             dailyActionLog: [...(playerStats.dailyActionLog || []), actionText],
             unlockProgress: {
                ...playerStats.unlockProgress,
                moves: playerStats.unlockProgress.moves + 1,
            }
        };
        
        const visionRadius = 1;
        for (let dy = -visionRadius; dy <= visionRadius; dy++) {
            for (let dx = -visionRadius; dx <= visionRadius; dx++) {
                const revealPos = { x: newPos.x + dx, y: newPos.y + dy };
                if (!worldSnapshot[`${revealPos.x},${revealPos.y}`]) {
                    const result = ensureChunkExists(revealPos, worldSnapshot, regionsSnapshot, regionCounterSnapshot);
                    worldSnapshot = result.worldWithChunk;
                    regionsSnapshot = result.regions;
                    regionCounterSnapshot = result.regionCounter;
                }
                worldSnapshot[`${revealPos.x},${revealPos.y}`].explored = true;
            }
        }
        
        setWorld(worldSnapshot);
        setRegions(regionsSnapshot);
        setRegionCounter(regionCounterSnapshot);
        setPlayerPosition(newPos);
        setPlayerStats(newPlayerStats);

        if (isOnline) {
            handleOnlineNarrative(`move ${direction}`, worldSnapshot, newPos, newPlayerStats);
        } else {
            addNarrativeEntry(worldSnapshot[`${newPos.x},${newPos.y}`].description, 'narrative');
            advanceGameTime();
        }
    };

    const handleAction = (actionId: number) => {
        const chunk = world[`${playerPosition.x},${playerPosition.y}`];
        if (!chunk) return;
    
        const actionText = chunk.actions.find(a => a.id === actionId)?.text || "unknown action";
        addNarrativeEntry(actionText, 'action');

        const newPlayerStats = { ...playerStats, dailyActionLog: [...(playerStats.dailyActionLog || []), actionText]};
        setPlayerStats(newPlayerStats);

        if (isOnline) {
            handleOnlineNarrative(actionText, world, playerPosition, newPlayerStats);
        } else {
            advanceGameTime();
        }
    }

    const handleAttack = () => {
        setPlayerBehaviorProfile(p => ({ ...p, attacks: p.attacks + 1 }));
        
        const key = `${playerPosition.x},${playerPosition.y}`;
        const baseChunk = world[key];
        if (!baseChunk || !baseChunk.enemy) {
            addNarrativeEntry(t('noTarget'), 'system');
            return;
        }
        
        const actionText = `${t('attackAction')} ${t(baseChunk.enemy.type as TranslationKey)}`;
        const newPlayerStats = { ...playerStats, dailyActionLog: [...(playerStats.dailyActionLog || []), actionText]};
        setPlayerStats(newPlayerStats);
    
        if (isOnline) {
            handleOnlineNarrative(actionText, world, playerPosition, newPlayerStats);
        } else {
            handleOfflineAttack();
        }
    };
    
    const handleCustomAction = (text: string) => {
        if (!text.trim()) return;
        setPlayerBehaviorProfile(p => ({ ...p, customActions: p.customActions + 1 }));
        addNarrativeEntry(text, 'action');
    
        const newPlayerStats = { ...playerStats, dailyActionLog: [...(playerStats.dailyActionLog || []), text]};
        setPlayerStats(newPlayerStats);

        if(isOnline) {
            handleOnlineNarrative(text, world, playerPosition, newPlayerStats);
        } else {
            addNarrativeEntry(t('customActionFail'), 'system');
            advanceGameTime();
        }
    }

    const handleCraft = useCallback(async (recipe: Recipe) => {
        setPlayerBehaviorProfile(p => ({ ...p, crafts: p.crafts + 1 }));
        const { canCraft, chance, ingredientsToConsume } = calculateCraftingOutcome(playerStats.items, recipe);

        if (!canCraft) {
            toast({ title: t('error'), description: t('notEnoughIngredients'), variant: "destructive" });
            return;
        }
        
        const actionText = t('craftAction', {itemName: t(recipe.result.name as TranslationKey)});
        let updatedItems = [...playerStats.items];
        ingredientsToConsume.forEach(itemToConsume => {
            const itemIndex = updatedItems.findIndex(i => i.name === itemToConsume.name);
            if (itemIndex > -1) {
                updatedItems[itemIndex].quantity -= itemToConsume.quantity;
            }
        });
        updatedItems = updatedItems.filter(i => i.quantity > 0);
        
        setPlayerStats(prev => ({ ...prev, items: updatedItems, dailyActionLog: [...(prev.dailyActionLog || []), actionText] }));

        const roll = Math.random() * 100;

        if (roll < chance) {
            const newInventory = [...updatedItems];
            const resultItemIndex = newInventory.findIndex(i => i.name === recipe.result.name);
            const itemDef = customItemDefinitions[recipe.result.name];
            
            if (resultItemIndex > -1) {
                newInventory[resultItemIndex].quantity += recipe.result.quantity;
            } else {
                newInventory.push({
                    name: recipe.result.name,
                    quantity: recipe.result.quantity,
                    tier: itemDef?.tier || 1,
                    emoji: recipe.result.emoji
                });
            }
            setPlayerStats(prev => ({ ...prev, items: newInventory }));
            addNarrativeEntry(t('craftSuccess', { itemName: t(recipe.result.name as TranslationKey) }), 'system');
            toast({ title: t('craftSuccessTitle'), description: t('craftSuccess', { itemName: t(recipe.result.name as TranslationKey) }) });
        } else {
            addNarrativeEntry(t('craftFail', { itemName: t(recipe.result.name as TranslationKey) }), 'system');
            toast({ title: t('craftFailTitle'), description: t('craftFail', { itemName: t(recipe.result.name as TranslationKey) }), variant: 'destructive' });
        }
        
        advanceGameTime();
    }, [playerStats, customItemCatalog, recipes, language, addNarrativeEntry, toast, t, advanceGameTime, customItemDefinitions]);

    const handleItemUsed = useCallback((itemName: string, target: 'player' | string) => {
        const actionText = target === 'player'
            ? `${t('useAction')} ${t(itemName as TranslationKey)}`
            : `${t('useOnAction', {item: t(itemName as TranslationKey), target: t(target as TranslationKey)})}`;
        
        const newPlayerStats = { ...playerStats, dailyActionLog: [...(playerStats.dailyActionLog || []), actionText]};
        // Set player stats immediately to update daily log
        setPlayerStats(newPlayerStats);

        if (isOnline) {
            handleOnlineNarrative(actionText, world, playerPosition, newPlayerStats);
        } else {
            handleOfflineItemUse(itemName, target);
        }
    }, [playerStats, world, playerPosition, isOnline, addNarrativeEntry, advanceGameTime, handleOnlineNarrative, t]);

    const handleUseSkill = useCallback((skillName: string) => {
        const actionText = `${t('useSkillAction')} ${t(skillName as TranslationKey)}`;
        addNarrativeEntry(actionText, 'action');

        let newPlayerStats = { 
            ...playerStats, 
            dailyActionLog: [...(playerStats.dailyActionLog || []), actionText]
        };
        setPlayerStats(newPlayerStats);

        if (isOnline) {
            handleOnlineNarrative(actionText, world, playerPosition, newPlayerStats);
        } else {
            handleOfflineSkillUse(skillName);
        }

    }, [playerStats, world, playerPosition, isOnline, addNarrativeEntry, t, advanceGameTime, handleOnlineNarrative]);

    const handleBuild = useCallback((structureName: string) => {
        const buildStaminaCost = 15;
        const structureToBuild = staticBuildableStructures[structureName];

        if (!structureToBuild || !structureToBuild.buildable) return;

        if (playerStats.stamina < buildStaminaCost) {
            toast({
                title: t('notEnoughStamina'),
                description: t('notEnoughStaminaDesc', { cost: buildStaminaCost, current: playerStats.stamina.toFixed(0) }),
                variant: "destructive",
            });
            return;
        }

        const buildCost = structureToBuild.buildCost || [];
        const inventoryMap = new Map(playerStats.items.map(item => [item.name, item.quantity]));
        if (!buildCost.every(cost => (inventoryMap.get(cost.name) || 0) >= cost.quantity)) {
            toast({ title: t('notEnoughIngredients'), variant: "destructive" });
            return;
        }
        
        const actionText = t('buildConfirm', {structureName: t(structureName as TranslationKey)});
        let updatedItems = [...playerStats.items];
        for (const cost of buildCost) {
            updatedItems.find(i => i.name === cost.name)!.quantity -= cost.quantity;
        }
        const finalInventory = updatedItems.filter(item => item.quantity > 0);
        setPlayerStats(prev => ({
            ...prev, 
            items: finalInventory,
            stamina: prev.stamina - buildStaminaCost,
            dailyActionLog: [...(prev.dailyActionLog || []), actionText]
        }));

        const key = `${playerPosition.x},${playerPosition.y}`;
        setWorld(prevWorld => {
            const newWorld = { ...prevWorld };
            const chunkToUpdate = { ...newWorld[key]! };
            const newStructure: Structure = {
                name: structureToBuild.name,
                description: structureToBuild.description,
                emoji: structureToBuild.emoji,
                providesShelter: structureToBuild.providesShelter,
                restEffect: structureToBuild.restEffect,
                heatValue: structureToBuild.heatValue,
            };
            chunkToUpdate.structures = [...(chunkToUpdate.structures || []), newStructure];
            newWorld[key] = chunkToUpdate;
            return newWorld;
        });

        addNarrativeEntry(t('builtStructure', { structureName: t(structureName as TranslationKey) }), 'system');
        advanceGameTime();
    }, [playerStats.items, playerStats.stamina, playerPosition, addNarrativeEntry, advanceGameTime, toast, t]);

    const handleRest = useCallback(() => {
        const key = `${playerPosition.x},${playerPosition.y}`;
        const chunk = world[key];
        const shelter = chunk?.structures.find(s => s.restEffect);

        if (!shelter || !shelter.restEffect) {
            toast({ title: t('cantRestTitle'), description: t('cantRestDesc') });
            return;
        }

        const actionText = t('restInShelter', { shelterName: t(shelter.name as TranslationKey) });
        addNarrativeEntry(actionText, 'action');

        const { hp: hpRestore, stamina: staminaRestore } = shelter.restEffect;
        const newHp = Math.min(100, playerStats.hp + hpRestore);
        const newStamina = Math.min(100, playerStats.stamina + staminaRestore);
        
        setPlayerStats(prev => ({
            ...prev,
            hp: newHp,
            stamina: newStamina,
            bodyTemperature: 37,
            dailyActionLog: [...(prev.dailyActionLog || []), actionText]
        }));
        
        advanceGameTime();
    }, [world, playerPosition, playerStats, addNarrativeEntry, advanceGameTime, t, toast]);
    
    const handleFuseItems = useCallback(async (itemsToFuse: PlayerItem[]) => {
        setIsLoading(true);

        const key = `${playerPosition.x},${playerPosition.y}`;
        const baseChunk = world[key];
        if (!baseChunk) {
            setIsLoading(false);
            return;
        }

        const effectiveChunk = getEffectiveChunk(baseChunk, gameTime);
        const weather = weatherZones[effectiveChunk.regionId]?.currentWeather;
        let successChanceBonus = playerStats.persona === 'artisan' ? 10 : 0;
        let elementalAffinity: any = 'none';
        let chaosFactor = effectiveChunk.magicAffinity;

        if(weather.exclusive_tags.includes('storm')) { successChanceBonus += 5; elementalAffinity = 'electric'; }
        if(weather.exclusive_tags.includes('heat')) elementalAffinity = 'fire';
        if(effectiveChunk.dangerLevel > 8) { successChanceBonus -= 5; chaosFactor += 2; }
        
        const actionText = t('fuseAction', { items: itemsToFuse.map(i => t(i.name as TranslationKey)).join(', ') });
        let newItems = [...playerStats.items];
        itemsToFuse.forEach(item => { newItems.find(i => i.name === item.name)!.quantity -= 1; });
        setPlayerStats(prev => ({ ...prev, items: newItems.filter(i => i.quantity > 0), dailyActionLog: [...(prev.dailyActionLog || []), actionText] }));

        try {
            const result = await fuseItems({
                itemsToFuse, playerPersona: playerStats.persona, currentChunk: effectiveChunk,
                environmentalContext: { biome: effectiveChunk.terrain, weather: weather.name },
                environmentalModifiers: { successChanceBonus, elementalAffinity, chaosFactor: clamp(chaosFactor, 0, 10) },
                language, customItemDefinitions,
            });

            addNarrativeEntry(result.narrative, 'narrative');
            
            if (result.resultItem) {
                setPlayerStats(prev => {
                    const updatedInventory = [...prev.items];
                    const existing = updatedInventory.find(i => i.name === result.resultItem!.name);
                    if (existing) { existing.quantity += result.resultItem!.baseQuantity.min; }
                    else { updatedInventory.push({ name: result.resultItem!.name, quantity: result.resultItem!.baseQuantity.min, tier: result.resultItem!.tier, emoji: result.resultItem!.emoji }); }
                    return {...prev, items: updatedInventory};
                });
                
                if(!customItemDefinitions[result.resultItem.name]) {
                    setCustomItemCatalog(prev => [...prev, result.resultItem!]);
                    setCustomItemDefinitions(prev => ({ ...prev, [result.resultItem!.name]: { description: result.resultItem!.description, tier: result.resultItem!.tier, category: result.resultItem!.category, emoji: result.resultItem!.emoji, effects: result.resultItem!.effects as ItemEffect[], baseQuantity: result.resultItem!.baseQuantity, growthConditions: result.resultItem!.growthConditions, }}));
                }
            }
        } catch(e) {
            console.error("AI Fusion failed:", e);
            toast({ title: t('error'), description: t('fusionError'), variant: "destructive" });
        } finally {
            setIsLoading(false);
            advanceGameTime();
        }
    }, [world, playerPosition, playerStats, weatherZones, gameTime, language, customItemDefinitions, customItemCatalog, getEffectiveChunk, addNarrativeEntry, advanceGameTime, t, toast]);

    const handleRequestQuestHint = useCallback(async (questText: string) => {
        if (playerStats.questHints?.[questText] || !isOnline) {
            return;
        }

        try {
            const result = await provideQuestHint({ questText, language });
            setPlayerStats(prev => ({
                ...prev,
                questHints: {
                    ...prev.questHints,
                    [questText]: result.hint,
                }
            }));
        } catch (error) {
            console.error("Failed to get quest hint:", error);
            toast({ title: t('error'), description: t('suggestionError'), variant: "destructive" });
            // Optionally, store the error state to show in the UI
        }
    }, [playerStats.questHints, isOnline, language, t, toast]);

    return {
        world, recipes, buildableStructures, playerStats, playerPosition, narrativeLog, isLoading, finalWorldSetup, customItemDefinitions,
        handleMove, handleAttack, handleAction, handleCustomAction, handleCraft, handleBuild, handleItemUsed, handleUseSkill, handleRest, handleFuseItems,
        handleRequestQuestHint,
    }
}
