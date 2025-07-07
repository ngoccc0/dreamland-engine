
"use client";

import { useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/language-context";
import { useSettings } from "@/context/settings-context";
import { useAuth } from "@/context/auth-context";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase-config";

import { generateNarrative, type GenerateNarrativeInput } from "@/ai/flows/generate-narrative-flow";
import { generateNewRecipe } from "@/ai/flows/generate-new-recipe";
import { generateJournalEntry } from "@/ai/flows/generate-journal-entry";
import { fuseItems } from "@/ai/flows/fuse-items-flow";
import { provideQuestHint } from "@/ai/flows/provide-quest-hint";

import { useGameState } from "./use-game-state";
import { rollDice, getSuccessLevel, successLevelToTranslationKey, type SuccessLevel } from "@/lib/game/dice";
import { generateRegion, getValidAdjacentTerrains, weightedRandom, generateWeatherForZone, checkConditions, calculateCraftingOutcome } from "@/lib/game/engine";
import { skillDefinitions } from '@/lib/game/skills';
import { getTemplates } from '@/lib/game/templates';
import { worldConfig, seasonConfig } from '@/lib/game/world-config';
import { clamp } from "@/lib/utils";
import { randomEvents } from "@/lib/game/events";

import type { GameState, World, PlayerStatus, NarrativeEntry, Chunk, Season, WorldProfile, Region, PlayerItem, ChunkItem, ItemDefinition, GeneratedItem, WeatherZone, Recipe, WorldConcept, Skill, PlayerBehaviorProfile, Structure, Pet, ItemEffect, Terrain, PlayerPersona } from "@/lib/game/types";
import type { TranslationKey } from "@/lib/i18n";


const getRandomInRange = (range: { min: number, max: number }) => Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

interface GameEngineProps {
    worldSetup?: Omit<WorldConcept, 'playerInventory' | 'customItemCatalog' | 'customStructures'> & { playerInventory: PlayerItem[] };
    initialGameState?: GameState;
    customItemDefinitions?: Record<string, ItemDefinition>;
    customItemCatalog?: GeneratedItem[];
    customStructures?: Structure[];
}

export function useGameEngine(props: GameEngineProps) {
    const { t, language } = useLanguage();
    const { settings } = useSettings();
    const { user } = useAuth();
    const { toast } = useToast();
    
    const {
        worldProfile, setWorldProfile,
        currentSeason, setCurrentSeason,
        gameTime, setGameTime,
        day, setDay,
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
    } = useGameState(props);

    const isOnline = settings.gameMode === 'ai';
    const narrativeIdCounter = useRef(1);
    
    useEffect(() => {
        // This effect synchronizes the narrative ID counter with the current state of the log.
        // It runs whenever the narrativeLog changes (e.g., loaded from save, or a new entry is added),
        // ensuring the counter is always set to a value higher than any existing ID.
        // This prevents React's "duplicate key" error.
        if (narrativeLog.length > 0) {
            // Find the highest existing ID in the log
            const maxId = Math.max(...narrativeLog.map(entry => entry.id));
            // Set the counter to be one higher than the max
            narrativeIdCounter.current = maxId + 1;
        } else {
            // If the log is empty, reset the counter.
            narrativeIdCounter.current = 1;
        }
    }, [narrativeLog]);

    const addNarrativeEntry = useCallback((text: string, type: NarrativeEntry['type']) => {
        setNarrativeLog(prev => {
            const newEntry = { id: narrativeIdCounter.current, text, type };
            narrativeIdCounter.current++;
            // Keep the log to a max of 50 entries for performance
            return [...prev, newEntry].slice(-50);
        });
    }, [setNarrativeLog]);

    const getEffectiveChunk = useCallback((baseChunk: Chunk): Chunk => {
        if (!baseChunk) return baseChunk;

        const effectiveChunk: Chunk = JSON.parse(JSON.stringify(baseChunk));
        
        let structureHeat = effectiveChunk.structures?.reduce((sum, s) => sum + (s.heatValue || 0), 0) || 0;

        if (!weatherZones[effectiveChunk.regionId]) {
            effectiveChunk.temperature = (baseChunk.temperature ?? 15) + structureHeat;
            return effectiveChunk;
        }

        const weatherZone = weatherZones[baseChunk.regionId];
        const weather = weatherZone.currentWeather;
        
        const baseCelsius = (baseChunk.temperature ?? 5) * 4;
        const weatherCelsiusMod = weather.temperature_delta * 2;
        effectiveChunk.temperature = baseCelsius + weatherCelsiusMod + structureHeat;

        effectiveChunk.moisture = clamp(baseChunk.moisture + weather.moisture_delta, 0, 10);
        effectiveChunk.windLevel = clamp((baseChunk.windLevel ?? 3) + weather.wind_delta, 0, 10);
        
        let timeLightMod = 0;
        if (gameTime >= 1320 || gameTime < 300) timeLightMod = -8;
        else if ((gameTime >= 300 && gameTime < 420) || (gameTime >= 1080 && gameTime < 1200)) timeLightMod = -3;
        
        effectiveChunk.lightLevel = clamp(baseChunk.lightLevel + weather.light_delta + timeLightMod, -10, 10);

        return effectiveChunk;
    }, [weatherZones, gameTime]);

    const triggerRandomEvent = useCallback(() => {
        const baseChunk = world[`${playerPosition.x},${playerPosition.y}`];
        if (!baseChunk) return;
    
        const possibleEvents = randomEvents.filter(event =>
            (event.theme === 'Normal' || event.theme === worldProfile.theme) &&
            event.canTrigger(baseChunk, playerStats, currentSeason)
        );
    
        if (possibleEvents.length === 0) return;
    
        // Filter the possible events by their individual chance
        const triggeredEvents = possibleEvents.filter(event => Math.random() < (event.chance ?? 1.0));
    
        if (triggeredEvents.length === 0) {
            return; // No rare event was lucky enough to trigger this time
        }
    
        // Pick one from the ones that passed their chance roll
        const event = triggeredEvents[Math.floor(Math.random() * triggeredEvents.length)];
    
        const eventName = t(event.id as TranslationKey);
        addNarrativeEntry(t('eventTriggered', { eventName }), 'system');
    
        const { roll } = rollDice('d20');
        const successLevel: SuccessLevel = getSuccessLevel(roll, 'd20');
    
        const outcome = event.outcomes[successLevel] || event.outcomes['Success']; // Fallback to success
        if (!outcome) return;
    
        addNarrativeEntry(t(outcome.descriptionKey), 'narrative');
    
        const effects = outcome.effects;
    
        // Apply effects
        let newPlayerStats = { ...playerStats };
        let worldWasModified = false;
        let newWorld = { ...world };
    
        const hasShelter = world[`${playerPosition.x},${playerPosition.y}`]?.structures.some(s => s.providesShelter);
    
        // Conditional effects
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
            newPlayerStats.mana = clamp(newPlayerStats.mana + effects.manaChange, 0, 50);
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
    
        if (effects.unlockRecipe) {
            // Future logic to unlock a recipe
        }
    
        setPlayerStats(prev => ({ ...prev, ...newPlayerStats }));
        if (worldWasModified) {
            setWorld(newWorld);
        }
    }, [world, playerPosition, playerStats, currentSeason, worldProfile.theme, addNarrativeEntry, t, customItemDefinitions, language, setPlayerStats, setWorld]);

    const advanceGameTime = useCallback(async (statsAfterAction?: PlayerStatus) => {
        const initialStats = statsAfterAction || playerStats;
        let nextPlayerStats = { ...initialStats };
        let newWorldState = { ...world };
        let worldWasModified = false;
        let changes = { narrativeEntries: [] as { text: string; type: NarrativeEntry['type'] }[] };
    
        const newGameTime = (gameTime + 5) % 1440;
        const currentDay = day;
        const newDay = newGameTime < gameTime ? day + 1 : day;
    
        if (newDay > currentDay) {
            addNarrativeEntry(t('newDay'), 'system');
            if (isOnline && nextPlayerStats.dailyActionLog && nextPlayerStats.dailyActionLog.length > 0) {
                try {
                    const journalResult = await generateJournalEntry({
                        dailyActionLog: nextPlayerStats.dailyActionLog,
                        playerPersona: nextPlayerStats.persona,
                        worldName: finalWorldSetup?.worldName || 'Dreamland',
                        language,
                    });
                    nextPlayerStats.journal = { ...nextPlayerStats.journal, [currentDay]: journalResult.journalEntry };
                    nextPlayerStats.dailyActionLog = [];
                    addNarrativeEntry(t('journalUpdated'), 'system');
                } catch (e) { console.error("Failed to generate journal entry:", e); }
            } else { nextPlayerStats.dailyActionLog = []; }
            setDay(newDay);
        }
        setGameTime(newGameTime);
    
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
        if (weatherHasChanged) setWeatherZones(newWeatherZones);
    
        const playerChunkKey = `${playerPosition.x},${playerPosition.y}`;
        const currentPlayerBaseChunk = newWorldState[playerChunkKey];

        if (currentPlayerBaseChunk) {
            const effectiveChunk = getEffectiveChunk(currentPlayerBaseChunk);
            const envTemp = effectiveChunk.temperature || 15;
            
            const tempDelta = ((envTemp - nextPlayerStats.bodyTemperature) * 0.1) + ((37.0 - nextPlayerStats.bodyTemperature) * 0.15);
            nextPlayerStats.bodyTemperature += tempDelta;

            if (nextPlayerStats.bodyTemperature < 30) { nextPlayerStats.hp = Math.max(0, nextPlayerStats.hp - 1); changes.narrativeEntries.push({ text: t('tempDangerFreezing'), type: 'system' }); }
            else if (nextPlayerStats.bodyTemperature < 35) { nextPlayerStats.stamina = Math.max(0, nextPlayerStats.stamina - 0.5); changes.narrativeEntries.push({ text: t('tempWarningCold'), type: 'system' }); }
            else if (nextPlayerStats.bodyTemperature > 42) { nextPlayerStats.stamina = Math.max(0, nextPlayerStats.stamina - 2); changes.narrativeEntries.push({ text: t('tempDangerHot'), type: 'system' }); }
            else if (nextPlayerStats.bodyTemperature > 40) { nextPlayerStats.stamina = Math.max(0, nextPlayerStats.stamina - 1); changes.narrativeEntries.push({ text: t('tempWarningHot'), type: 'system' }); }

            if (currentPlayerBaseChunk.enemy?.behavior === 'aggressive') {
                changes.narrativeEntries.push({ text: t('enemyAttacks', { enemy: t(currentPlayerBaseChunk.enemy.type as TranslationKey) }), type: 'system' });
                nextPlayerStats.hp = Math.max(0, nextPlayerStats.hp - currentPlayerBaseChunk.enemy.damage);
            }
        }
        
        // Natural Regeneration
        const STAMINA_REGEN_RATE = 1.5;
        const MANA_REGEN_RATE = 0.5;
        nextPlayerStats.stamina = clamp(nextPlayerStats.stamina + STAMINA_REGEN_RATE, 0, 100);
        nextPlayerStats.mana = clamp(nextPlayerStats.mana + MANA_REGEN_RATE, 0, 50);

        const eventChance = (seasonConfig[currentSeason]?.eventChance || 0.1) / 20; 
        if (Math.random() < eventChance) {
            triggerRandomEvent();
        }

        if (worldWasModified) setWorld(newWorldState);
        setPlayerStats(nextPlayerStats);

        if (changes.narrativeEntries.length > 0) {
            const uniqueNarratives = [...new Map(changes.narrativeEntries.map(item => [item.text, item])).values()];
            uniqueNarratives.forEach(entry => addNarrativeEntry(entry.text, entry.type));
        }
    }, [playerStats, world, gameTime, day, addNarrativeEntry, t, isOnline, finalWorldSetup, language, weatherZones, currentSeason, playerPosition, setDay, setGameTime, setWeatherZones, setWorld, getEffectiveChunk, triggerRandomEvent, setPlayerStats]);

    useEffect(() => {
        if (playerStats.hp <= 0 && !isGameOver) {
            addNarrativeEntry(t('gameOverMessage'), 'system');
            setIsGameOver(true);
        }
    }, [playerStats.hp, isGameOver, addNarrativeEntry, t, setIsGameOver]);

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
    }, [addNarrativeEntry, t, toast, setPlayerStats]);
    
    useEffect(() => {
        checkSkillUnlocks(playerStats);
    }, [playerStats.unlockProgress, checkSkillUnlocks]);

    useEffect(() => {
        const totalActions = playerBehaviorProfile.moves + playerBehaviorProfile.attacks + playerBehaviorProfile.crafts;
        
        if (totalActions < 20) return;

        const movePercentage = playerBehaviorProfile.moves / totalActions;
        const attackPercentage = playerBehaviorProfile.attacks / totalActions;
        const craftPercentage = playerBehaviorProfile.crafts / totalActions;
        
        let newPersona: PlayerPersona = 'none';

        if (movePercentage > 0.6) newPersona = 'explorer';
        else if (attackPercentage > 0.6) newPersona = 'warrior';
        else if (craftPercentage > 0.5) newPersona = 'artisan';

        if (newPersona !== playerStats.persona && newPersona !== 'none') {
            setPlayerStats(prev => ({ ...prev, persona: newPersona }));
            const messageKey = newPersona === 'explorer' ? 'personaExplorer' : newPersona === 'warrior' ? 'personaWarrior' : 'personaArtisan';
            addNarrativeEntry(t(messageKey), 'system');
            toast({ title: t('personaUnlockedTitle'), description: t(messageKey) });
        }
    }, [playerBehaviorProfile, playerStats.persona, setPlayerStats, addNarrativeEntry, t, toast]);
    
    useEffect(() => {
        const baseChunk = world[`${playerPosition.x},${playerPosition.y}`];
        if (baseChunk) {
            setCurrentChunk(getEffectiveChunk(baseChunk));
        } else {
            setCurrentChunk(null);
        }
    }, [world, playerPosition, gameTime, weatherZones, getEffectiveChunk, setCurrentChunk]);
    
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
    
        let newTerrain: Terrain;
        const validTerrains = getValidAdjacentTerrains(pos, currentWorld);
        const distanceFromStart = Math.abs(pos.x) + Math.abs(pos.y);

        // Check for the special Floptropica case
        if (distanceFromStart >= 100 && validTerrains.includes('floptropica') && Math.random() < 0.001) {
            newTerrain = 'floptropica';
        } else {
            // Otherwise, proceed with normal generation, but exclude Floptropica
            const standardTerrains = validTerrains.filter(t => t !== 'floptropica');
            
            // This fallback is important. If floptropica was the only valid option and the 0.1% roll failed,
            // we need to generate *something*. We can default to grassland as a safe default.
            if (standardTerrains.length > 0) {
                 const terrainProbs = standardTerrains.map(t => [t, worldConfig[t].spreadWeight] as [Terrain, number]);
                 newTerrain = weightedRandom(terrainProbs);
            } else {
                 // This case means either no valid terrains were found, or Floptropica was the only one.
                 // Defaulting to grassland is a safe fallback.
                 newTerrain = 'grassland';
            }
        }
        
        const result = generateRegion(
            pos, newTerrain, currentWorld, currentRegions, currentRegionCounter,
            worldProfile, currentSeason, customItemDefinitions,
            customItemCatalog, customStructures, language
        );
        
        return { 
            worldWithChunk: result.newWorld, 
            chunk: result.newWorld[newPosKey],
            regions: result.newRegions,
            regionCounter: result.newRegionCounter,
        };
    }, [worldProfile, currentSeason, customItemDefinitions, customItemCatalog, customStructures, language]);

    useEffect(() => {
        const loadGame = async () => {
            if (user) {
                const gameDocRef = doc(db, "games", user.uid);
                const gameDocSnap = await getDoc(gameDocRef);
                if (gameDocSnap.exists()) {
                    const cloudState = gameDocSnap.data() as GameState;
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

            if (props.initialGameState) return;

            if (props.worldSetup) {
                addNarrativeEntry(props.worldSetup.initialNarrative, 'narrative');
                const startPos = { x: 0, y: 0 };
                
                let worldSnapshot = {};
                let regionsSnapshot = {};
                let regionCounterSnapshot = 0;
                
                const visionRadius = 1;
                for (let dy = -visionRadius; dy <= visionRadius; dy++) {
                    for (let dx = -visionRadius; dx <= visionRadius; dx++) {
                         const revealPos = { x: startPos.x + dx, y: startPos.y + dy };
                         if (!worldSnapshot[`${revealPos.x},${revealPos.y}`]) {
                             const terrainToGenerate = (dx === 0 && dy === 0) ? props.worldSetup.startingBiome : getValidAdjacentTerrains(revealPos, worldSnapshot)[0] || 'grassland';
                             const result = generateRegion(
                                revealPos, terrainToGenerate, worldSnapshot, regionsSnapshot, regionCounterSnapshot,
                                worldProfile, currentSeason, customItemDefinitions,
                                customItemCatalog, customStructures, language
                            );
                             worldSnapshot = result.newWorld;
                             regionsSnapshot = result.newRegions;
                             regionCounterSnapshot = result.newRegionCounter;
                         }
                    }
                }

                Object.keys(worldSnapshot).forEach(key => {
                    worldSnapshot[key].explored = true;
                });
                
                const newWorld = worldSnapshot;
                const newRegions = regionsSnapshot;
                const newRegionCounter = regionCounterSnapshot;

                const startKey = `${startPos.x},${startPos.y}`;
                if (newWorld[startKey]) addNarrativeEntry(newWorld[startKey].description, 'narrative');

                const initialWeatherZones: { [zoneId: string]: WeatherZone } = {};
                Object.entries(newRegions).forEach(([regionId, region]) => {
                    const initialWeather = generateWeatherForZone(region.terrain, currentSeason);
                    const nextChangeTime = gameTime + getRandomInRange({min: initialWeather.duration_range[0], max: initialWeather.duration_range[1]}) * 5;
                    initialWeatherZones[regionId] = { id: regionId, terrain: region.terrain, currentWeather: initialWeather, nextChangeTime: nextChangeTime };
                });
                
                setWeatherZones(initialWeatherZones);
                setWorld(newWorld);
                setRegions(newRegions);
                setRegionCounter(newRegionCounter);
                setPlayerStats(prev => ({ ...prev, bodyTemperature: 37 }));
            }
        };
        loadGame();
    }, [user, props.initialGameState, props.worldSetup]);

    useEffect(() => {
        if (Object.keys(world).length === 0 || !finalWorldSetup || isSaving || isGameOver) return;

        const gameState: GameState = {
            worldProfile, currentSeason, world, recipes, buildableStructures,
            regions, regionCounter, playerPosition, playerBehaviorProfile,
            playerStats, narrativeLog, worldSetup: finalWorldSetup,
            customItemDefinitions, customItemCatalog, customStructures, weatherZones, gameTime, day,
        };

        const save = async () => {
            setIsSaving(true);
            try {
                if (user) await setDoc(doc(db, "games", user.uid), gameState, { merge: true });
                else localStorage.setItem('gameState', JSON.stringify(gameState));
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
        playerPosition, playerBehaviorProfile, playerStats, narrativeLog, finalWorldSetup,
        customItemDefinitions, customItemCatalog, customStructures, weatherZones, gameTime, day, user, isSaving, toast, isGameOver
    ]);
    
    const handleOnlineNarrative = useCallback(async (action: string, worldCtx: World, playerPosCtx: {x: number, y: number}, playerStatsCtx: PlayerStatus) => {
        setIsLoading(true);
        const baseChunk = worldCtx[`${playerPosCtx.x},${playerPosCtx.y}`];
        if (!baseChunk || !finalWorldSetup) { setIsLoading(false); return; }

        const { roll, range } = rollDice(settings.diceType);
        const successLevel = getSuccessLevel(roll, settings.diceType);
        addNarrativeEntry(t('diceRollMessage', { roll, level: t(successLevelToTranslationKey[successLevel]) }), 'system');

        const currentChunk = getEffectiveChunk(baseChunk);
        try {
            const input: GenerateNarrativeInput = {
                worldName: finalWorldSetup.worldName, playerAction: action, playerStatus: playerStatsCtx,
                currentChunk: { ...currentChunk, regionId: undefined }, // regionId is not in Zod schema
                recentNarrative: narrativeLog.slice(-5).map(e => e.text), language, customItemDefinitions,
                diceRoll: roll, diceType: settings.diceType, diceRange: range, successLevel,
                aiModel: settings.aiModel, narrativeLength: settings.narrativeLength,
            };
            const result = await generateNarrative(input);
            addNarrativeEntry(result.narrative, 'narrative');
            if(result.systemMessage) addNarrativeEntry(result.systemMessage, 'system');

            let finalPlayerStats: PlayerStatus = { ...playerStatsCtx, ...(result.updatedPlayerStatus || {})};
            
            if (worldCtx[`${playerPosCtx.x},${playerPosCtx.y}`]?.enemy && result.updatedChunk?.enemy === null) {
                finalPlayerStats.unlockProgress = { ...finalPlayerStats.unlockProgress, kills: finalPlayerStats.unlockProgress.kills + 1 };
            }

            setWorld(prev => {
                const newWorld = { ...prev };
                const key = `${currentChunk.x},${currentChunk.y}`;
                if (result.updatedChunk) {
                    const chunkToUpdate = newWorld[key];
                    const updatedEnemy = result.updatedChunk.enemy !== undefined ? result.updatedChunk.enemy : chunkToUpdate.enemy;
                    newWorld[key] = { ...chunkToUpdate, ...result.updatedChunk, enemy: updatedEnemy };
                }
                return newWorld;
            });
            
            if (result.newlyGeneratedItem && !customItemDefinitions[result.newlyGeneratedItem.name]) {
                const newItem = result.newlyGeneratedItem;
                setCustomItemCatalog(prev => [...prev, newItem]);
                setCustomItemDefinitions(prev => ({ ...prev, [newItem.name]: { description: newItem.description, tier: newItem.tier, category: newItem.category, emoji: newItem.emoji, effects: newItem.effects as ItemEffect[], baseQuantity: newItem.baseQuantity, growthConditions: newItem.growthConditions as any } }));
            }
            advanceGameTime(finalPlayerStats);
        } catch (error) {
            console.error("AI narrative generation failed:", error);
            toast({ title: t('offlineModeActive'), description: t('offlineToastDesc'), variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [settings.diceType, settings.aiModel, settings.narrativeLength, addNarrativeEntry, getEffectiveChunk, narrativeLog, language, customItemDefinitions, toast, advanceGameTime, finalWorldSetup, setIsLoading, setWorld, setCustomItemCatalog, setCustomItemDefinitions, t]);
    
    const handleOfflineAttack = useCallback(() => {
        const key = `${playerPosition.x},${playerPosition.y}`;
        const baseChunk = world[key];
        if (!baseChunk || !baseChunk.enemy) { addNarrativeEntry(t('noTarget'), 'system'); return; }
        
        const currentChunk = getEffectiveChunk(baseChunk);
        const actionText = `${t('attackAction')} ${t(currentChunk.enemy!.type as TranslationKey)}`;
        addNarrativeEntry(actionText, 'action');
    
        const { roll } = rollDice(settings.diceType);
        const successLevel = getSuccessLevel(roll, settings.diceType);
        addNarrativeEntry(t('diceRollMessage', { roll, level: t(successLevelToTranslationKey[successLevel]) }), 'system');
    
        let playerDamage = 0;
        const combatLogParts: string[] = [];
        const damageMultiplier = successLevel === 'CriticalFailure' ? 0 : successLevel === 'Failure' ? 0 : successLevel === 'GreatSuccess' ? 1.5 : successLevel === 'CriticalSuccess' ? 2.0 : 1.0;
        
        if (damageMultiplier > 0) {
            let playerDamageModifier = 1.0;
            if (currentChunk.lightLevel < -3) { playerDamageModifier *= 0.8; combatLogParts.push(t('attackEnvFog')); }
            if (currentChunk.moisture > 8) { playerDamageModifier *= 0.9; combatLogParts.push(t('attackEnvRain')); }
            
            let playerBaseDamage = playerStats.attributes.physicalAttack + (playerStats.persona === 'warrior' ? 2 : 0);
            playerDamage = Math.round(playerBaseDamage * damageMultiplier * playerDamageModifier);
        } else { combatLogParts.push(successLevel === 'CriticalFailure' ? t('attackCritFail') : t('attackFail')); }
    
        const finalEnemyHp = Math.max(0, currentChunk.enemy.hp - playerDamage);
        const enemyDefeated = finalEnemyHp <= 0;
        let lootDrops: ChunkItem[] = [];
    
        if (playerDamage > 0) combatLogParts.push(t(successLevel === 'CriticalSuccess' ? 'attackCritSuccess' : successLevel === 'GreatSuccess' ? 'attackGreatSuccess' : 'attackSuccess', { enemyType: t(currentChunk.enemy.type as TranslationKey), playerDamage }));
    
        let enemyDamage = 0;
        let fled = false;
    
        if (enemyDefeated) {
            const templates = getTemplates(language);
            const enemyTemplate = templates[currentChunk.terrain]?.enemies.find((e: any) => e.data.type === currentChunk.enemy!.type);
            if (enemyTemplate?.data.loot) {
                for (const lootItem of enemyTemplate.data.loot) {
                    if (Math.random() < lootItem.chance) {
                        const definition = customItemDefinitions[lootItem.name];
                        if (definition) { lootDrops.push({ name: lootItem.name, description: definition.description, tier: definition.tier, quantity: getRandomInRange(lootItem.quantity), emoji: definition.emoji }); }
                    }
                }
            }
        } else {
            fled = currentChunk.enemy.behavior === 'passive' || (successLevel === 'CriticalSuccess' && currentChunk.enemy.size === 'small');
            if (!fled) enemyDamage = Math.round(currentChunk.enemy.damage);
        }
    
        let nextPlayerStats = {...playerStats};
        nextPlayerStats.hp = Math.max(0, nextPlayerStats.hp - enemyDamage);
        if (enemyDefeated) {
            nextPlayerStats.unlockProgress = { ...nextPlayerStats.unlockProgress, kills: nextPlayerStats.unlockProgress.kills + 1 };
        }
    
        let narrative = combatLogParts.join(' ');
        if (enemyDefeated) narrative += ` ${t('enemyDefeated', { enemyType: t(currentChunk.enemy.type as TranslationKey) })}` + (lootDrops.length > 0 ? ` ${t('enemyDropped', { items: lootDrops.map(i => `${i.quantity}x ${t(i.name as TranslationKey)}`).join(', ') })}` : "");
        else if (fled) narrative += ` ${t('enemyFled', { enemyType: t(currentChunk.enemy.type as TranslationKey) })}`;
        else if (enemyDamage > 0) narrative += ` ${t('enemyRetaliated', { enemyType: t(currentChunk.enemy.type as TranslationKey), damage: enemyDamage })}`;
        else narrative += ` ${t('enemyPrepares', { enemyType: t(currentChunk.enemy.type as TranslationKey) })}`;
        addNarrativeEntry(narrative, 'narrative');
    
        setWorld(prev => {
            const newWorld = { ...prev };
            const chunkToUpdate = { ...newWorld[key]! };
            chunkToUpdate.enemy = (enemyDefeated || fled) ? null : { ...chunkToUpdate.enemy!, hp: finalEnemyHp };
            if (lootDrops.length > 0) {
                const newItemsMap = new Map((chunkToUpdate.items || []).map(item => [item.name, { ...item }]));
                lootDrops.forEach(droppedItem => newItemsMap.set(droppedItem.name, { ...droppedItem, quantity: (newItemsMap.get(droppedItem.name)?.quantity || 0) + droppedItem.quantity }));
                chunkToUpdate.items = Array.from(newItemsMap.values());
            }
            newWorld[key] = chunkToUpdate;
            return newWorld;
        });
    
        advanceGameTime(nextPlayerStats);
    }, [playerPosition, world, addNarrativeEntry, settings.diceType, t, getEffectiveChunk, playerStats, language, customItemDefinitions, advanceGameTime, setWorld]);
    
    const handleOfflineItemUse = useCallback((itemName: string, target: 'player' | string) => {
        addNarrativeEntry(target === 'player' ? `${t('useAction')} ${t(itemName as TranslationKey)}` : `${t('useOnAction', {item: t(itemName as TranslationKey), target: t(target as TranslationKey)})}`, 'action');
        let newPlayerStats = { ...playerStats };
        const itemIndex = newPlayerStats.items.findIndex(i => i.name === itemName);

        if (itemIndex === -1) { addNarrativeEntry(t('itemNotFound'), 'system'); return; }

        if (target === 'player') {
            const itemDef = customItemDefinitions[itemName];
            if (!itemDef?.effects.length) { addNarrativeEntry(t('itemNoEffect', { item: t(itemName as TranslationKey) }), 'system'); return; }
            const effectDescriptions: string[] = [];
            itemDef.effects.forEach(effect => {
                if (effect.type === 'HEAL') { const old = newPlayerStats.hp; newPlayerStats.hp = Math.min(100, newPlayerStats.hp + effect.amount); if(newPlayerStats.hp > old) effectDescriptions.push(t('itemHealEffect', { amount: newPlayerStats.hp - old })); }
                if (effect.type === 'RESTORE_STAMINA') { const old = newPlayerStats.stamina; newPlayerStats.stamina = Math.min(100, newPlayerStats.stamina + effect.amount); if(newPlayerStats.stamina > old) effectDescriptions.push(t('itemStaminaEffect', { amount: (newPlayerStats.stamina - old).toFixed(0) })); }
            });
            if (effectDescriptions.length === 0) addNarrativeEntry(t('itemDidNothing', { item: t(itemName as TranslationKey) }), 'system');
            else { newPlayerStats.items[itemIndex].quantity -= 1; addNarrativeEntry(t('itemUsedSuccess', { item: t(itemName as TranslationKey), effect: effectDescriptions.join(', ') }), 'system'); }
        } else {
            const key = `${playerPosition.x},${playerPosition.y}`;
            const currentChunk = world[key];
            if (!currentChunk?.enemy || currentChunk.enemy.type !== target) { addNarrativeEntry(t('noTargetForITEM', {target: t(target as TranslationKey)}), 'system'); return; }
            if (!currentChunk.enemy.diet.includes(itemName)) { addNarrativeEntry(t('targetNotInterested', { target: t(target as TranslationKey), item: t(itemName as TranslationKey) }), 'system'); return; }

            newPlayerStats.items[itemIndex].quantity -= 1;
            const newEnemyState = { ...currentChunk.enemy, satiation: Math.min(currentChunk.enemy.satiation + 1, currentChunk.enemy.maxSatiation) };
            const tamingChance = 0.1 + (newEnemyState.satiation / newEnemyState.maxSatiation) * 0.4 - (newEnemyState.hp / 100) * 0.2;

            if (Math.random() < tamingChance) {
                newPlayerStats.pets = [...(newPlayerStats.pets || []), { type: currentChunk.enemy.type, level: 1 }];
                setWorld(prev => ({...prev, [key]: {...prev[key]!, enemy: null}}));
                addNarrativeEntry(t('tameSuccess', { target: t(target as TranslationKey) }), 'system');
            } else {
                setWorld(prev => ({...prev, [key]: {...prev[key]!, enemy: newEnemyState}}));
                addNarrativeEntry(t('tameFail', { target: t(target as TranslationKey), item: t(itemName as TranslationKey)}), 'system');
            }
        }
        newPlayerStats.items = newPlayerStats.items.filter(i => i.quantity > 0);
        advanceGameTime(newPlayerStats);
    }, [addNarrativeEntry, playerStats, t, customItemDefinitions, playerPosition, world, advanceGameTime, setWorld]);
    
    const handleOfflineSkillUse = useCallback((skillName: string) => {
        let newPlayerStats: PlayerStatus = JSON.parse(JSON.stringify(playerStats));
        const skillToUse = newPlayerStats.skills.find(s => s.name === skillName);
    
        if (!skillToUse) { addNarrativeEntry(t('skillNotFound', { skillName: t(skillName as TranslationKey) }), 'system'); return; }
        if (newPlayerStats.mana < skillToUse.manaCost) { addNarrativeEntry(t('notEnoughMana', { skillName: t(skillName as TranslationKey) }), 'system'); return; }
    
        const { roll } = rollDice(settings.diceType);
        const successLevel = getSuccessLevel(roll, settings.diceType);
        addNarrativeEntry(t('diceRollMessage', { roll, level: t(successLevelToTranslationKey[successLevel]) }), 'system');
        newPlayerStats.mana -= skillToUse.manaCost;
    
        let narrative = "";
        const effectMultiplier = successLevel === 'GreatSuccess' ? 1.5 : successLevel === 'CriticalSuccess' ? 2.0 : 1.0;
        const key = `${playerPosition.x},${playerPosition.y}`;
        const currentChunk = world[key];
        let newEnemy: Chunk['enemy'] = currentChunk?.enemy ? { ...currentChunk.enemy } : null;
    
        if (successLevel === 'CriticalFailure') {
            const backfireDamage = Math.round(skillToUse.effect.amount * 0.5);
            newPlayerStats.hp = Math.max(0, newPlayerStats.hp - backfireDamage);
            narrative = t(skillToUse.effect.type === 'HEAL' ? 'skillHealCritFail' : 'skillDamageCritFail', { damage: backfireDamage });
        } else if (successLevel === 'Failure') {
            narrative = t('skillFail', { skillName: t(skillName as TranslationKey) });
        } else {
            if (skillToUse.effect.type === 'HEAL') {
                const healAmount = Math.round(skillToUse.effect.amount * effectMultiplier);
                const oldHp = newPlayerStats.hp;
                newPlayerStats.hp = Math.min(100, newPlayerStats.hp + healAmount);
                narrative = t('skillHealSuccess', { skillName: t(skillName as TranslationKey), amount: newPlayerStats.hp - oldHp });
                if (successLevel === 'GreatSuccess') narrative += ` ${t('skillGreatSuccessBonus')}`;
                if (successLevel === 'CriticalSuccess') narrative += ` ${t('skillCritSuccessBonus')}`;
            } else if (skillToUse.effect.type === 'DAMAGE' && newEnemy) {
                const baseDamage = skillToUse.effect.amount + Math.round(newPlayerStats.attributes.magicalAttack * 0.5);
                const finalDamage = Math.round(baseDamage * effectMultiplier);
                newEnemy.hp = Math.max(0, newEnemy.hp - finalDamage);
                narrative = t(successLevel === 'CriticalSuccess' ? 'skillDamageCritSuccess' : 'skillDamageSuccess', { skillName: t(skillName as TranslationKey), enemy: t(newEnemy.type as TranslationKey), damage: finalDamage });
                if (skillToUse.effect.healRatio) {
                    const healedAmount = Math.round(finalDamage * skillToUse.effect.healRatio);
                    const oldHp = newPlayerStats.hp;
                    newPlayerStats.hp = Math.min(100, newPlayerStats.hp + healedAmount);
                    if (newPlayerStats.hp > oldHp) narrative += ` ${t('siphonHealth', { amount: newPlayerStats.hp - oldHp })}`;
                }
                if (newEnemy.hp <= 0) {
                    narrative += ` ${t('enemyVanquished', { enemyType: t(newEnemy.type as TranslationKey) })}`;
                    newEnemy = null;
                    newPlayerStats.unlockProgress.kills += 1;
                }
                newPlayerStats.unlockProgress.damageSpells += 1;
            } else { narrative = t('skillNoTarget', { skillName: t(skillName as TranslationKey) }); }
        }
    
        addNarrativeEntry(narrative, 'narrative');
        if(newEnemy !== currentChunk?.enemy) setWorld(prev => ({...prev, [key]: {...prev[key]!, enemy: newEnemy}}));
        advanceGameTime(newPlayerStats);
    }, [playerStats, settings.diceType, t, addNarrativeEntry, playerPosition, world, advanceGameTime, setWorld]);
    
    const handleOfflineAction = useCallback((actionText: string) => {
        addNarrativeEntry(actionText, 'action');
        let newPlayerStats = { ...playerStats, dailyActionLog: [...(playerStats.dailyActionLog || []), actionText] };
        const lowerAction = actionText.toLowerCase();

        // Define action keys
        const talkToAction = t('talkToAction', {}).toLowerCase();
        const pickUpAction = t('pickUpAction', {}).toLowerCase();
        const exploreActionText = t('exploreAction', {}).toLowerCase();
        const forageActionText = t('forageForFoodAction', {}).toLowerCase();
        const searchMaterialsActionText = t('searchForMaterialsAction', {}).toLowerCase();
        const listenActionText = t('listenToSurroundingsAction', {}).toLowerCase();

        const currentChunk = world[ `${playerPosition.x},${playerPosition.y}`];
        if (!currentChunk) return;

        if (lowerAction.startsWith(talkToAction)) {
            const npcName = actionText.substring(talkToAction.length).trim();
            const npc = currentChunk.NPCs.find(n => t(n.name as TranslationKey).toLowerCase() === npcName.toLowerCase());
            if (npc) {
                const templates = getTemplates(language);
                let npcDef: any;
                Object.keys(templates).some(terrain => {
                    const found = templates[terrain as Terrain].NPCs.find((n: any) => n.data.name === npc.name);
                    if (found) { npcDef = found.data; return true; } return false;
                });
                if (npcDef?.quest && npcDef.questItem) {
                    if (newPlayerStats.quests.includes(npcDef.quest)) {
                        const itemInInventory = newPlayerStats.items.find(i => i.name === npcDef.questItem.name);
                        if (itemInInventory && itemInInventory.quantity >= npcDef.questItem.quantity) {
                            addNarrativeEntry(t('gaveItemToNpc', { quantity: npcDef.questItem.quantity, itemName: t(npcDef.questItem.name as TranslationKey), npcName: t(npc.name as TranslationKey)}), 'system');
                            itemInInventory.quantity -= npcDef.questItem.quantity;
                            if (itemInInventory.quantity <= 0) newPlayerStats.items = newPlayerStats.items.filter(i => i.name !== npcDef.questItem.name);
                            (npcDef.rewardItems || []).forEach((reward: PlayerItem) => {
                                const existingItem = newPlayerStats.items.find(i => i.name === reward.name);
                                if (existingItem) existingItem.quantity += reward.quantity;
                                else newPlayerStats.items.push({...reward});
                            });
                            newPlayerStats.quests = newPlayerStats.quests.filter(q => q !== npcDef.quest);
                            addNarrativeEntry(t('npcQuestCompleted', { npcName: t(npc.name as TranslationKey) }), 'narrative');
                            toast({ title: t('questCompletedTitle'), description: t(npcDef.quest as TranslationKey) });
                        } else addNarrativeEntry(t('npcQuestNotEnoughItems', { npcName: t(npc.name as TranslationKey), needed: npcDef.questItem.quantity - (itemInInventory?.quantity || 0), itemName: t(npcDef.questItem.name as TranslationKey) }), 'narrative');
                    } else { newPlayerStats.quests.push(npcDef.quest); addNarrativeEntry(t('npcQuestGive', { npcName: t(npc.name as TranslationKey), questText: t(npcDef.quest as TranslationKey) }), 'narrative'); }
                } else addNarrativeEntry(t('npcNoQuest', { npcName: t(npc.name as TranslationKey) }), 'narrative');
            }
        } else if (lowerAction.startsWith(pickUpAction)) {
            const itemName = actionText.substring(pickUpAction.length).trim();
            const chunkKey = `${playerPosition.x},${playerPosition.y}`;
            const itemInChunk = currentChunk.items.find(i => t(i.name as TranslationKey).toLowerCase() === itemName.toLowerCase());
            if (itemInChunk) {
                setWorld(prev => ({ ...prev, [chunkKey]: { ...prev[chunkKey]!, items: currentChunk.items.filter(i => i.name !== itemInChunk.name) }}));
                const itemInInventory = newPlayerStats.items.find(i => i.name === itemInChunk.name);
                if (itemInInventory) itemInInventory.quantity += itemInChunk.quantity;
                else newPlayerStats.items.push({...itemInChunk});
                addNarrativeEntry(t('pickedUpItem', { quantity: itemInChunk.quantity, itemName: t(itemInChunk.name as TranslationKey) }), 'narrative');
            }
        } else if (lowerAction === exploreActionText) {
            const templates = getTemplates(language);
            const biomeTemplate = templates[currentChunk.terrain];
            let foundItems: ChunkItem[] = [];

            if (biomeTemplate && biomeTemplate.items) {
                for (const itemTemplate of biomeTemplate.items) {
                    if (Math.random() < (itemTemplate.conditions.chance || 0.1)) {
                        const itemDef = customItemDefinitions[itemTemplate.name];
                        if (itemDef) {
                            const quantity = getRandomInRange(itemDef.baseQuantity);
                            foundItems.push({
                                name: itemTemplate.name,
                                description: itemDef.description,
                                tier: itemDef.tier,
                                quantity: quantity,
                                emoji: itemDef.emoji,
                            });
                        }
                    }
                }
            }

            if (foundItems.length > 0) {
                const itemToGive = foundItems[Math.floor(Math.random() * foundItems.length)];
                
                const itemInInventory = newPlayerStats.items.find(i => i.name === itemToGive.name);
                if (itemInInventory) {
                    itemInInventory.quantity += itemToGive.quantity;
                } else {
                    newPlayerStats.items.push({
                        name: itemToGive.name,
                        quantity: itemToGive.quantity,
                        tier: itemToGive.tier,
                        emoji: itemToGive.emoji
                    });
                }
                addNarrativeEntry(t('exploreFoundItem', { quantity: itemToGive.quantity, itemName: t(itemToGive.name as TranslationKey) }), 'narrative');
            } else {
                addNarrativeEntry(t('exploreFoundNothing'), 'narrative');
            }
        } else if (lowerAction === forageActionText) {
            const biomeTemplate = getTemplates(language)[currentChunk.terrain];
            let foundItems: ChunkItem[] = [];
            if (biomeTemplate?.items) {
                const foodItems = biomeTemplate.items.filter(i => {
                    const def = customItemDefinitions[i.name];
                    return def && def.category === 'Food';
                });
                if (foodItems.length > 0 && Math.random() < 0.6) { // 60% chance to find food
                     const itemTemplate = foodItems[Math.floor(Math.random() * foodItems.length)];
                     const itemDef = customItemDefinitions[itemTemplate.name];
                     if (itemDef) {
                         foundItems.push({ name: itemTemplate.name, description: itemDef.description, tier: itemDef.tier, quantity: getRandomInRange(itemDef.baseQuantity), emoji: itemDef.emoji });
                     }
                }
            }
            if (foundItems.length > 0) {
                const item = foundItems[0];
                addNarrativeEntry(t('forageSuccess', { quantity: item.quantity, itemName: t(item.name as TranslationKey) }), 'narrative');
                const itemInInventory = newPlayerStats.items.find(i => i.name === item.name);
                if (itemInInventory) itemInInventory.quantity += item.quantity;
                else newPlayerStats.items.push({ ...item });
            } else {
                addNarrativeEntry(t('forageFail'), 'narrative');
            }
        } else if (lowerAction === searchMaterialsActionText) {
            const biomeTemplate = getTemplates(language)[currentChunk.terrain];
            let foundItems: ChunkItem[] = [];
            if (biomeTemplate?.items) {
                const materialItems = biomeTemplate.items.filter(i => {
                    const def = customItemDefinitions[i.name];
                    return def && def.category === 'Material';
                });
                if (materialItems.length > 0 && Math.random() < 0.75) { // 75% chance
                     const itemTemplate = materialItems[Math.floor(Math.random() * materialItems.length)];
                     const itemDef = customItemDefinitions[itemTemplate.name];
                     if (itemDef && itemDef.tier <= 2) { // only common materials
                         foundItems.push({ name: itemTemplate.name, description: itemDef.description, tier: itemDef.tier, quantity: getRandomInRange(itemDef.baseQuantity), emoji: itemDef.emoji });
                     }
                }
            }
             if (foundItems.length > 0) {
                const item = foundItems[0];
                addNarrativeEntry(t('searchMaterialsSuccess', { quantity: item.quantity, itemName: t(item.name as TranslationKey) }), 'narrative');
                const itemInInventory = newPlayerStats.items.find(i => i.name === item.name);
                if (itemInInventory) itemInInventory.quantity += item.quantity;
                else newPlayerStats.items.push({ ...item });
            } else {
                addNarrativeEntry(t('searchMaterialsFail'), 'narrative');
            }
        } else if (lowerAction === listenActionText) {
            const directions = [{ x: 0, y: 1, dir: 'North' }, { x: 0, y: -1, dir: 'South' }, { x: 1, y: 0, dir: 'East' }, { x: -1, y: 0, dir: 'West' }];
            let heardSomething = false;
            for (const dir of directions) {
                const checkPos = { x: playerPosition.x + dir.x, y: playerPosition.y + dir.y };
                const chunkKey = `${checkPos.x},${checkPos.y}`;
                if (world[chunkKey] && world[chunkKey].enemy) {
                    addNarrativeEntry(t('listenHearSomething', { direction: t(`direction${dir.dir}` as TranslationKey), sound: t('enemySoundGeneric') }), 'narrative');
                    heardSomething = true;
                    break;
                }
            }
            if (!heardSomething) {
                addNarrativeEntry(t('listenHearNothing'), 'narrative');
            }
        }

        advanceGameTime(newPlayerStats);
    }, [addNarrativeEntry, playerStats, t, world, playerPosition, language, toast, advanceGameTime, customItemDefinitions, setWorld]);
    
    const handleMove = useCallback((direction: "north" | "south" | "east" | "west") => {
        if (isLoading || isGameOver) return;
        setPlayerBehaviorProfile(p => ({ ...p, moves: p.moves + 1 }));

        let newPos = { ...playerPosition };
        let dirKey: TranslationKey = 'directionNorth';
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
        regionCounterSnapshot = destResult.newRegionCounter;
        
        const destinationTerrain = destResult.chunk.terrain;
        if (destinationTerrain === 'ocean') {
            const hasRaft = playerStats.items.some(item => item.name === 'Thuyền Phao');
            if (!hasRaft) {
                toast({ title: t('oceanTravelBlocked'), variant: "destructive" });
                return; // Block movement
            }
        }

        if (destResult.chunk?.terrain === 'wall') { addNarrativeEntry(t('wallBlock'), 'system'); return; }

        const travelCost = playerStats.persona === 'explorer' ? Math.max(1, (worldConfig[destResult.chunk.terrain]?.travelCost || 3) - 1) : (worldConfig[destResult.chunk.terrain]?.travelCost || 3);
        if (playerStats.stamina < travelCost) { toast({ title: t('notEnoughStamina'), description: t('notEnoughStaminaDesc', { cost: travelCost, current: playerStats.stamina.toFixed(0) }), variant: "destructive" }); return; }
        
        const actionText = t('wentDirection', { direction: t(dirKey) });
        addNarrativeEntry(actionText, 'action');
        
        const visionRadius = 1;
        for (let dy = -visionRadius; dy <= visionRadius; dy++) {
            for (let dx = -visionRadius; dx <= visionRadius; dx++) {
                const revealPos = { x: newPos.x + dx, y: newPos.y + dy };
                if (!worldSnapshot[`${revealPos.x},${revealPos.y}`]) {
                    const result = ensureChunkExists(revealPos, worldSnapshot, regionsSnapshot, regionCounterSnapshot);
                    worldSnapshot = result.worldWithChunk;
                    regionsSnapshot = result.regions;
                    regionCounterSnapshot = result.newRegionCounter;
                }
                if (worldSnapshot[`${revealPos.x},${revealPos.y}`]) worldSnapshot[`${revealPos.x},${revealPos.y}`].explored = true;
            }
        }
        
        const wasNewRegionCreated = regionCounterSnapshot > regionCounter;
        if (wasNewRegionCreated) {
            const newWeatherZones = {...weatherZones};
            const currentRegions = regionsSnapshot || {};
            Object.keys(currentRegions).filter(id => !newWeatherZones[id]).forEach(regionId => {
                const region = currentRegions[Number(regionId)];
                if (region) {
                    const initialWeather = generateWeatherForZone(region.terrain, currentSeason);
                    newWeatherZones[regionId] = { id: regionId, terrain: region.terrain, currentWeather: initialWeather, nextChangeTime: gameTime + getRandomInRange({min: initialWeather.duration_range[0], max: initialWeather.duration_range[1]}) * 5 };
                }
            });
            setWeatherZones(newWeatherZones);
        }

        setWorld(worldSnapshot);
        setRegions(regionsSnapshot);
        setRegionCounter(regionCounterSnapshot);
        setPlayerPosition(newPos);

        const newPlayerStats = { ...playerStats, stamina: playerStats.stamina - travelCost, dailyActionLog: [...(playerStats.dailyActionLog || []), actionText], unlockProgress: { ...playerStats.unlockProgress, moves: playerStats.unlockProgress.moves + 1 } };

        if (isOnline) handleOnlineNarrative(`move ${direction}`, worldSnapshot, newPos, newPlayerStats);
        else { addNarrativeEntry(worldSnapshot[`${newPos.x},${newPos.y}`].description, 'narrative'); advanceGameTime(newPlayerStats); }
    }, [isLoading, isGameOver, setPlayerBehaviorProfile, playerPosition, world, regions, regionCounter, playerStats, toast, addNarrativeEntry, t, ensureChunkExists, weatherZones, currentSeason, gameTime, setWeatherZones, setWorld, setRegions, setRegionCounter, setPlayerPosition, isOnline, handleOnlineNarrative, advanceGameTime]);

    const handleAction = useCallback((actionId: number) => {
        if (isLoading || isGameOver) return;
        const chunk = world[`${playerPosition.x},${playerPosition.y}`];
        const actionText = chunk?.actions.find(a => a.id === actionId)?.text || "unknown action";
        const newPlayerStats = { ...playerStats, dailyActionLog: [...(playerStats.dailyActionLog || []), actionText]};
        addNarrativeEntry(actionText, 'action');
        if (isOnline) handleOnlineNarrative(actionText, world, playerPosition, newPlayerStats);
        else handleOfflineAction(actionText);
    }, [isLoading, isGameOver, world, playerPosition, playerStats, addNarrativeEntry, isOnline, handleOnlineNarrative, handleOfflineAction]);

    const handleAttack = useCallback(() => {
        if (isLoading || isGameOver) return;
        setPlayerBehaviorProfile(p => ({ ...p, attacks: p.attacks + 1 }));
        const baseChunk = world[`${playerPosition.x},${playerPosition.y}`];
        if (!baseChunk?.enemy) { addNarrativeEntry(t('noTarget'), 'system'); return; }
        
        const actionText = `${t('attackAction')} ${t(baseChunk.enemy.type as TranslationKey)}`;
        const newPlayerStats = { ...playerStats, dailyActionLog: [...(playerStats.dailyActionLog || []), actionText]};
    
        if (isOnline) handleOnlineNarrative(actionText, world, playerPosition, newPlayerStats);
        else handleOfflineAttack();
    }, [isLoading, isGameOver, setPlayerBehaviorProfile, world, playerPosition, addNarrativeEntry, t, playerStats, isOnline, handleOnlineNarrative, handleOfflineAttack]);
    
    const handleCustomAction = useCallback((text: string) => {
        if (!text.trim() || isLoading || isGameOver) return;
        setPlayerBehaviorProfile(p => ({ ...p, customActions: p.customActions + 1 }));
        const newPlayerStats = { ...playerStats, dailyActionLog: [...(playerStats.dailyActionLog || []), text]};
        addNarrativeEntry(text, 'action');
        if (isOnline) handleOnlineNarrative(text, world, playerPosition, newPlayerStats);
        else handleOfflineAction(text);
    }, [isLoading, isGameOver, setPlayerBehaviorProfile, playerStats, addNarrativeEntry, isOnline, handleOnlineNarrative, world, playerPosition, handleOfflineAction]);

    const handleCraft = useCallback(async (recipe: Recipe) => {
        if (isLoading || isGameOver) return;
        setPlayerBehaviorProfile(p => ({ ...p, crafts: p.crafts + 1 }));
        const { canCraft, chance, ingredientsToConsume } = calculateCraftingOutcome(playerStats.items, recipe);

        if (!canCraft) { toast({ title: t('error'), description: t('notEnoughIngredients'), variant: "destructive" }); return; }
        
        const actionText = t('craftAction', {itemName: t(recipe.result.name as TranslationKey)});
        let updatedItems = playerStats.items.map(i => ({...i}));
        ingredientsToConsume.forEach(itemToConsume => {
            const itemIndex = updatedItems.findIndex(i => i.name === itemToConsume.name);
            if (itemIndex > -1) updatedItems[itemIndex].quantity -= itemToConsume.quantity;
        });
        
        let nextPlayerStats = { ...playerStats, items: updatedItems.filter(i => i.quantity > 0), dailyActionLog: [...(playerStats.dailyActionLog || []), actionText] };

        if (Math.random() * 100 < chance) {
            const newInventory = [...nextPlayerStats.items];
            const resultItemIndex = newInventory.findIndex(i => i.name === recipe.result.name);
            if (resultItemIndex > -1) newInventory[resultItemIndex].quantity += recipe.result.quantity;
            else newInventory.push({ ...recipe.result, tier: customItemDefinitions[recipe.result.name]?.tier || 1 });
            nextPlayerStats.items = newInventory;
            
            const successKeys: TranslationKey[] = ['craftSuccess1', 'craftSuccess2', 'craftSuccess3'];
            const randomKey = successKeys[Math.floor(Math.random() * successKeys.length)];
            addNarrativeEntry(t(randomKey, { itemName: t(recipe.result.name as TranslationKey) }), 'system');
            toast({ title: t('craftSuccessTitle'), description: t('craftSuccess', { itemName: t(recipe.result.name as TranslationKey) }) });
        } else {
            const failKeys: TranslationKey[] = ['craftFail1', 'craftFail2', 'craftFail3'];
            const randomKey = failKeys[Math.floor(Math.random() * failKeys.length)];
            addNarrativeEntry(t(randomKey, { itemName: t(recipe.result.name as TranslationKey) }), 'system');
            toast({ title: t('craftFailTitle'), description: t('craftFail', { itemName: t(recipe.result.name as TranslationKey) }), variant: 'destructive' });
        }
        advanceGameTime(nextPlayerStats);
    }, [isLoading, isGameOver, setPlayerBehaviorProfile, playerStats, customItemDefinitions, addNarrativeEntry, toast, t, advanceGameTime]);

    const handleItemUsed = useCallback((itemName: string, target: 'player' | string) => {
        if (isLoading || isGameOver) return;
        const actionText = target === 'player' ? `${t('useAction')} ${t(itemName as TranslationKey)}` : `${t('useOnAction', {item: t(itemName as TranslationKey), target: t(target as TranslationKey)})}`;
        const newPlayerStats = { ...playerStats, dailyActionLog: [...(playerStats.dailyActionLog || []), actionText]};

        if (isOnline) handleOnlineNarrative(actionText, world, playerPosition, newPlayerStats);
        else handleOfflineItemUse(itemName, target);
    }, [isLoading, isGameOver, playerStats, world, playerPosition, isOnline, handleOnlineNarrative, t, handleOfflineItemUse]);

    const handleUseSkill = useCallback((skillName: string) => {
        if (isLoading || isGameOver) return;
        const actionText = `${t('useSkillAction')} ${t(skillName as TranslationKey)}`;
        const newPlayerStats = { ...playerStats, dailyActionLog: [...(playerStats.dailyActionLog || []), actionText]};
        addNarrativeEntry(actionText, 'action');
        if (isOnline) handleOnlineNarrative(actionText, world, playerPosition, newPlayerStats);
        else handleOfflineSkillUse(skillName);
    }, [isLoading, isGameOver, playerStats, world, playerPosition, isOnline, addNarrativeEntry, t, handleOnlineNarrative, handleOfflineSkillUse]);

    const handleBuild = useCallback((structureName: string) => {
        if (isLoading || isGameOver) return;
        const structureToBuild = buildableStructures[structureName];
        if (!structureToBuild?.buildable) return;

        const buildStaminaCost = 15;
        if (playerStats.stamina < buildStaminaCost) { toast({ title: t('notEnoughStamina'), description: t('notEnoughStaminaDesc', { cost: buildStaminaCost, current: playerStats.stamina.toFixed(0) }), variant: "destructive" }); return; }

        const inventoryMap = new Map(playerStats.items.map(item => [item.name, item.quantity]));
        if (!structureToBuild.buildCost?.every(cost => (inventoryMap.get(cost.name) || 0) >= cost.quantity)) { toast({ title: t('notEnoughIngredients'), variant: "destructive" }); return; }
        
        const actionText = t('buildConfirm', {structureName: t(structureName as TranslationKey)});
        let updatedItems = playerStats.items.map(i => ({...i}));
        structureToBuild.buildCost?.forEach(cost => { updatedItems.find(i => i.name === cost.name)!.quantity -= cost.quantity; });
        
        const nextPlayerStats = { ...playerStats, items: updatedItems.filter(item => item.quantity > 0), stamina: playerStats.stamina - buildStaminaCost, dailyActionLog: [...(playerStats.dailyActionLog || []), actionText] };
        
        const key = `${playerPosition.x},${playerPosition.y}`;
        setWorld(prev => {
            const newWorld = { ...prev };
            const chunkToUpdate = { ...newWorld[key]! };
            const newStructure: Structure = { name: structureToBuild.name, description: structureToBuild.description, emoji: structureToBuild.emoji, providesShelter: structureToBuild.providesShelter, restEffect: structureToBuild.restEffect, heatValue: structureToBuild.heatValue };
            chunkToUpdate.structures = [...(chunkToUpdate.structures || []), newStructure];
            newWorld[key] = chunkToUpdate;
            return newWorld;
        });

        addNarrativeEntry(t('builtStructure', { structureName: t(structureName as TranslationKey) }), 'system');
        advanceGameTime(nextPlayerStats);
    }, [isLoading, isGameOver, buildableStructures, playerStats, playerPosition, addNarrativeEntry, advanceGameTime, toast, t, setWorld]);

    const handleRest = useCallback(() => {
        if (isLoading || isGameOver) return;
        const shelter = world[`${playerPosition.x},${playerPosition.y}`]?.structures.find(s => s.restEffect);
        if (!shelter?.restEffect) { toast({ title: t('cantRestTitle'), description: t('cantRestDesc') }); return; }

        const actionText = t('restInShelter', { shelterName: t(shelter.name as TranslationKey) });
        addNarrativeEntry(actionText, 'action');
        
        const oldStats = {...playerStats};
        const newHp = Math.min(100, oldStats.hp + shelter.restEffect.hp);
        const newStamina = Math.min(100, oldStats.stamina + shelter.restEffect.stamina);
        const newTemp = 37;

        let restoredParts: string[] = [];
        if (newHp > oldStats.hp) {
            restoredParts.push(t('restHP', { amount: newHp - oldStats.hp }));
        }
        if (newStamina > oldStats.stamina) {
            restoredParts.push(t('restStamina', { amount: (newStamina - oldStats.stamina).toFixed(0) }));
        }

        if(restoredParts.length > 0) {
            addNarrativeEntry(t('restSuccess', { restoration: restoredParts.join(t('andConnector')) }), 'system');
        } else {
            addNarrativeEntry(t('restNoEffect'), 'system');
        }

        if(oldStats.bodyTemperature !== newTemp) {
            addNarrativeEntry(t('restSuccessTemp'), 'system');
        }

        const nextPlayerStats = { ...playerStats, hp: newHp, stamina: newStamina, bodyTemperature: newTemp, dailyActionLog: [...(playerStats.dailyActionLog || []), actionText] };
        advanceGameTime(nextPlayerStats);
    }, [isLoading, isGameOver, world, playerPosition, addNarrativeEntry, advanceGameTime, t, toast, playerStats]);
    
    const handleFuseItems = useCallback(async (itemsToFuse: PlayerItem[]) => {
        if (isLoading || isGameOver) return;
        setIsLoading(true);

        const baseChunk = world[`${playerPosition.x},${playerPosition.y}`];
        if (!baseChunk) { setIsLoading(false); return; }

        const effectiveChunk = getEffectiveChunk(baseChunk);
        const weather = weatherZones[effectiveChunk.regionId]?.currentWeather;
        let successChanceBonus = playerStats.persona === 'artisan' ? 10 : 0;
        let elementalAffinity: any = 'none';
        let chaosFactor = effectiveChunk.magicAffinity;

        if(weather?.exclusive_tags.includes('storm')) { successChanceBonus += 5; elementalAffinity = 'electric'; }
        if(weather?.exclusive_tags.includes('heat')) elementalAffinity = 'fire';
        if(effectiveChunk.dangerLevel > 8) { successChanceBonus -= 5; chaosFactor += 2; }
        
        const actionText = t('fuseAction', { items: itemsToFuse.map(i => t(i.name as TranslationKey)).join(', ') });
        let newItems = playerStats.items.map(i => ({...i}));
        itemsToFuse.forEach(item => { newItems.find(i => i.name === item.name)!.quantity -= 1; });
        let nextPlayerStats = { ...playerStats, items: newItems.filter(i => i.quantity > 0), dailyActionLog: [...(playerStats.dailyActionLog || []), actionText] };
        setPlayerStats(nextPlayerStats);

        try {
            const result = await fuseItems({
                itemsToFuse, playerPersona: playerStats.persona, currentChunk: effectiveChunk,
                environmentalContext: { biome: effectiveChunk.terrain, weather: weather?.name || 'clear' },
                environmentalModifiers: { successChanceBonus, elementalAffinity, chaosFactor: clamp(chaosFactor, 0, 10) },
                language, customItemDefinitions,
            });

            addNarrativeEntry(result.narrative, 'narrative');
            
            if (result.resultItem) {
                // Update player stats with the new item
                nextPlayerStats = { ...nextPlayerStats, items: [...nextPlayerStats.items] }; // create new copy
                const existing = nextPlayerStats.items.find(i => i.name === result.resultItem!.name);
                if (existing) existing.quantity += result.resultItem!.baseQuantity.min;
                else nextPlayerStats.items.push({ name: result.resultItem!.name, quantity: result.resultItem!.baseQuantity.min, tier: result.resultItem!.tier, emoji: result.resultItem!.emoji });
                
                if(!customItemDefinitions[result.resultItem.name]) {
                    setCustomItemCatalog(prev => [...prev, result.resultItem!]);
                    setCustomItemDefinitions(prev => ({ ...prev, [result.resultItem!.name]: { description: result.resultItem!.description, tier: result.resultItem!.tier, category: result.resultItem!.category, emoji: result.resultItem!.emoji, effects: result.resultItem!.effects as ItemEffect[], baseQuantity: result.resultItem!.baseQuantity, growthConditions: result.resultItem!.growthConditions, }}));
                }
            }
            advanceGameTime(nextPlayerStats);
        } catch(e) {
            console.error("AI Fusion failed:", e);
            toast({ title: t('error'), description: t('fusionError'), variant: "destructive" });
            advanceGameTime(nextPlayerStats);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, isGameOver, world, playerPosition, playerStats, weatherZones, language, customItemDefinitions, getEffectiveChunk, addNarrativeEntry, advanceGameTime, t, toast, setIsLoading, setPlayerStats, setCustomItemCatalog, setCustomItemDefinitions]);

    const handleRequestQuestHint = useCallback(async (questText: string) => {
        if (playerStats.questHints?.[questText] || !isOnline) return;

        try {
            const result = await provideQuestHint({ questText, language });
            setPlayerStats(prev => ({ ...prev, questHints: { ...prev.questHints, [questText]: result.hint } }));
        } catch (error) {
            console.error("Failed to get quest hint:", error);
            toast({ title: t('error'), description: t('suggestionError'), variant: "destructive" });
        }
    }, [playerStats.questHints, isOnline, language, setPlayerStats, toast, t]);

    return {
        world, recipes, buildableStructures, playerStats, playerPosition, narrativeLog, isLoading, isGameOver, finalWorldSetup, customItemDefinitions,
        currentChunk,
        handleMove, handleAttack, handleAction, handleCustomAction, handleCraft, handleBuild, handleItemUsed, handleUseSkill, handleRest, handleFuseItems,
        handleRequestQuestHint,
    }
}
