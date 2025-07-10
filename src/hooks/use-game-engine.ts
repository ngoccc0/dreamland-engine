
"use client";

import { useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/language-context";
import { useSettings } from "@/context/settings-context";
import { useAuth } from "@/context/auth-context";
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase-config";

import { generateNarrative, type GenerateNarrativeInput } from "@/ai/flows/generate-narrative-flow";
import { generateNewRecipe } from "@/ai/flows/generate-new-recipe";
import { generateJournalEntry } from "@/ai/flows/generate-journal-entry";
import { fuseItems } from "@/ai/flows/fuse-items-flow";
import { provideQuestHint } from "@/ai/flows/provide-quest-hint";

import { useGameState } from "./use-game-state";
import { rollDice, getSuccessLevel, successLevelToTranslationKey, type SuccessLevel } from "@/lib/game/dice";
import { generateRegion, getValidAdjacentTerrains, weightedRandom, generateWeatherForZone, checkConditions, calculateCraftingOutcome, type CraftingOutcome, handleSearchAction, generateOfflineNarrative, generateOfflineActionNarrative } from "@/lib/game/engine";
import { skillDefinitions } from '@/lib/game/skills';
import { getTemplates } from '@/lib/game/templates';
import { worldConfig, seasonConfig } from '@/lib/game/world-config';
import { clamp } from "@/lib/utils";
import { randomEvents } from "@/lib/game/events";

import type { GameState, World, PlayerStatus, NarrativeEntry, Chunk, Season, WorldProfile, Region, PlayerItem, ChunkItem, ItemDefinition, GeneratedItem, WeatherZone, Recipe, WorldConcept, Skill, PlayerBehaviorProfile, Structure, Pet, ItemEffect, Terrain, PlayerPersona, EquipmentSlot, NarrativeLength, Action } from "@/lib/game/types";
import type { TranslationKey } from "@/lib/i18n";


const getRandomInRange = (range: { min: number, max: number }) => Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

interface GameEngineProps {
    gameSlot: number;
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
    } = useGameState(props);

    const isOnline = settings.gameMode === 'ai';
    const narrativeIdCounter = useRef(1);
    
    useEffect(() => {
        if (narrativeLog.length > 0) {
            const maxId = Math.max(...narrativeLog.map(entry => entry.id));
            narrativeIdCounter.current = maxId + 1;
        } else {
            narrativeIdCounter.current = 1;
        }
    }, [narrativeLog]);

    const addNarrativeEntry = useCallback((text: string, type: NarrativeEntry['type']) => {
        setNarrativeLog(prev => {
            const newEntry = { id: narrativeIdCounter.current, text, type };
            narrativeIdCounter.current++;
            return [...prev, newEntry].slice(-50);
        });
    }, [setNarrativeLog]);

    const getEffectiveChunk = useCallback((baseChunk: Chunk): Chunk => {
        if (!baseChunk) return baseChunk;

        const effectiveChunk: Chunk = { ...baseChunk };
        
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
                newRegions: currentRegions,
                newRegionCounter: currentRegionCounter,
            };
        }
    
        let newTerrain: Terrain;
        const validTerrains = getValidAdjacentTerrains(pos, currentWorld);
        const distanceFromStart = Math.abs(pos.x) + Math.abs(pos.y);

        if (distanceFromStart >= 100 && validTerrains.includes('floptropica') && Math.random() < 0.001) {
            newTerrain = 'floptropica';
        } else {
            const standardTerrains = validTerrains.filter(t => t !== 'floptropica');
            
            if (standardTerrains.length > 0) {
                 const terrainProbs = standardTerrains.map(t => [t, worldConfig[t].spreadWeight] as [Terrain, number]);
                 newTerrain = weightedRandom(terrainProbs);
            } else {
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
            newRegions: result.newRegions,
            newRegionCounter: result.newRegionCounter,
        };
    }, [worldProfile, currentSeason, customItemDefinitions, customItemCatalog, customStructures, language]);
    
    // EFFECT 1: Game Initialization (runs only once when isLoaded becomes true).
    useEffect(() => {
        if (!isLoaded || !finalWorldSetup) return;

        const initializeFirstChunk = () => {
            let worldSnapshot = { ...world };
            let regionsSnapshot = { ...regions };
            let regionCounterSnapshot = regionCounter;
            let weatherZonesSnapshot = { ...weatherZones };
        
            const initialPosKey = `${playerPosition.x},${playerPosition.y}`;
            let initialChunkExists = !!worldSnapshot[initialPosKey];
        
            if (!initialChunkExists) {
                const result = ensureChunkExists(playerPosition, worldSnapshot, regionsSnapshot, regionCounterSnapshot);
                worldSnapshot = result.worldWithChunk;
                regionsSnapshot = result.newRegions;
                regionCounterSnapshot = result.newRegionCounter;
            }
        
            // Ensure chunks around player exist and are explored
            const visionRadius = 1;
            for (let dy = -visionRadius; dy <= visionRadius; dy++) {
                for (let dx = -visionRadius; dx <= visionRadius; dx++) {
                    const revealPos = { x: playerPosition.x + dx, y: playerPosition.y + dy };
                    if (!worldSnapshot[`${revealPos.x},${revealPos.y}`]) {
                        const revealResult = ensureChunkExists(revealPos, worldSnapshot, regionsSnapshot, regionCounterSnapshot);
                        worldSnapshot = revealResult.worldWithChunk;
                        regionsSnapshot = revealResult.newRegions;
                        regionCounterSnapshot = revealResult.newRegionCounter;
                    }
                    if (worldSnapshot[`${revealPos.x},${revealPos.y}`]) {
                        worldSnapshot[`${revealPos.x},${revealPos.y}`].explored = true;
                    }
                }
            }
        
            // Initialize weather for any new regions
            Object.keys(regionsSnapshot).filter(id => !weatherZonesSnapshot[id]).forEach(regionId => {
                const region = regionsSnapshot[Number(regionId)];
                if (region) {
                    const initialWeather = generateWeatherForZone(region.terrain, currentSeason);
                    weatherZonesSnapshot[regionId] = { id: regionId, terrain: region.terrain, currentWeather: initialWeather, nextChangeTime: gameTime + getRandomInRange({min: initialWeather.duration_range[0], max: initialWeather.duration_range[1]}) * 10 };
                }
            });
        
            // Write initial narrative only if it's a brand new game
            if (narrativeLog.length <= 1) { 
                const startingChunk = worldSnapshot[initialPosKey];
                if (startingChunk) {
                    const chunkDescription = generateOfflineNarrative(startingChunk, 'long', worldSnapshot, playerPosition, t, language);
                    const fullIntro = `${t(finalWorldSetup.initialNarrative as TranslationKey)}\n\n${chunkDescription}`;
                    addNarrativeEntry(fullIntro, 'narrative');
                }
            }
        
            setWorld(worldSnapshot);
            setRegions(regionsSnapshot);
            setRegionCounter(regionCounterSnapshot);
            setWeatherZones(weatherZonesSnapshot);
        };

        initializeFirstChunk();
    }, [isLoaded, finalWorldSetup]);

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
    
        const eventName = t(event.id as TranslationKey);
        addNarrativeEntry(t('eventTriggered', { eventName }), 'system');
    
        const { roll } = rollDice('d20');
        const successLevel: SuccessLevel = getSuccessLevel(roll, 'd20');
    
        const outcome = event.outcomes[successLevel] || event.outcomes['Success'];
        if (!outcome) return;
    
        addNarrativeEntry(t(outcome.descriptionKey), 'narrative');
    
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
    
        setPlayerStats(prev => ({ ...prev, ...newPlayerStats }));
        if (worldWasModified) {
            setWorld(newWorld);
        }
    }, [world, playerPosition, playerStats, currentSeason, worldProfile.theme, addNarrativeEntry, t, customItemDefinitions, language, setPlayerStats, setWorld]);

    const advanceGameTime = useCallback(async (statsAfterAction?: PlayerStatus) => {
        let nextPlayerStats = { ...(statsAfterAction || playerStats) };
        let newWorldState = { ...world };
        let worldWasModified = false;
        
        const oldGameTime = gameTime;
        const newGameTime = (gameTime + 10) % 1440;
        const newDay = newGameTime < oldGameTime ? day + 1 : day;
    
        if (Math.floor(newGameTime / 60) !== Math.floor(oldGameTime / 60)) {
            const hour = Math.floor(newGameTime / 60);
            const minute = newGameTime % 60;
            const formattedTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            addNarrativeEntry(t('timeUpdate', { time: formattedTime }), 'system');
        }

        if (turn % getRandomInRange({min: 2, max: 4}) === 0) {
             const chunk = newWorldState[`${playerPosition.x},${playerPosition.y}`];
            if (chunk) {
                const isNight = newGameTime > 1200 || newGameTime < 360; // 8 PM to 6 AM
                const weatherZone = weatherZones[chunk.regionId];
                const isRaining = weatherZone?.currentWeather.exclusive_tags.includes('rain');

                let dynamicSentences: TranslationKey[] = [];
                if (isNight) dynamicSentences.push('dynamicNight');
                else dynamicSentences.push('dynamicDay');

                if (isRaining) dynamicSentences.push('dynamicRain');
                
                if(chunk.enemy) {
                    dynamicSentences.push('dynamicEnemy');
                } else {
                    dynamicSentences.push('dynamicNoEnemy');
                }

                const chosenSentenceKey = dynamicSentences[Math.floor(Math.random() * dynamicSentences.length)];
                addNarrativeEntry(t(chosenSentenceKey, { enemyType: chunk.enemy ? t(chunk.enemy.type as TranslationKey) : '' }), 'narrative');
            }
        }

        if (newDay > day) {
            addNarrativeEntry(t('newDay'), 'system');
            if (isOnline && nextPlayerStats.dailyActionLog && nextPlayerStats.dailyActionLog.length > 0) {
                try {
                    const journalResult = await generateJournalEntry({
                        dailyActionLog: nextPlayerStats.dailyActionLog,
                        playerPersona: nextPlayerStats.persona,
                        worldName: finalWorldSetup?.worldName || 'Dreamland',
                        language,
                    });
                    nextPlayerStats.journal = { ...nextPlayerStats.journal, [day]: journalResult.journalEntry };
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
                zone.nextChangeTime = newGameTime + getRandomInRange({min: newWeather.duration_range[0], max: newWeather.duration_range[1]}) * 10;
                addNarrativeEntry(t(newWeather.description as TranslationKey), 'system');
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

            if (nextPlayerStats.bodyTemperature < 30) { nextPlayerStats.hp = Math.max(0, nextPlayerStats.hp - 1); addNarrativeEntry(t('tempDangerFreezing'), 'system'); }
            else if (nextPlayerStats.bodyTemperature < 35) { nextPlayerStats.stamina = Math.max(0, nextPlayerStats.stamina - 0.5); addNarrativeEntry(t('tempWarningCold'), 'system'); }
            else if (nextPlayerStats.bodyTemperature > 42) { nextPlayerStats.stamina = Math.max(0, nextPlayerStats.stamina - 2); addNarrativeEntry(t('tempDangerHot'), 'system'); }
            else if (nextPlayerStats.bodyTemperature > 40) { nextPlayerStats.stamina = Math.max(0, nextPlayerStats.stamina - 1); addNarrativeEntry(t('tempWarningHot'), 'system'); }

            if (currentPlayerBaseChunk.enemy?.behavior === 'aggressive') {
                addNarrativeEntry(t('enemyAttacks', { enemy: t(currentPlayerBaseChunk.enemy.type as TranslationKey) }), 'system');
                nextPlayerStats.hp = Math.max(0, nextPlayerStats.hp - currentPlayerBaseChunk.enemy.damage);
            }
        }
        
        const STAMINA_REGEN_RATE = 1.5;
        const MANA_REGEN_RATE = 0.5;
        nextPlayerStats.stamina = clamp(nextPlayerStats.stamina + STAMINA_REGEN_RATE, 0, 100);
        nextPlayerStats.mana = clamp(nextPlayerStats.mana + MANA_REGEN_RATE, 0, 50);

        // --- Player-centric World Simulation ---
        const simulationRadius = 2; // Simulate within a 5x5 square
        const chunksToProcess: string[] = [];
        for (let dy = -simulationRadius; dy <= simulationRadius; dy++) {
            for (let dx = -simulationRadius; dx <= simulationRadius; dx++) {
                const key = `${playerPosition.x + dx},${playerPosition.y + dy}`;
                if (newWorldState[key]) {
                    chunksToProcess.push(key);
                }
            }
        }

        for (const key of chunksToProcess) {
            const chunk = newWorldState[key];
            if (!chunk) continue;
            
            // --- Resource Growth Simulation ---
            for (const itemDefName in customItemDefinitions) {
                const itemDef = customItemDefinitions[itemDefName];
                if (itemDef.growthConditions) {
                    const effectiveChunkForGrowth = getEffectiveChunk(chunk); 
                    const existingItem = chunk.items.find(i => i.name === itemDefName);
                    
                    let growthChance = 0;
                    if (checkConditions(itemDef.growthConditions.optimal, effectiveChunkForGrowth)) {
                        growthChance = 0.2; // 20% chance in optimal conditions
                    } else if (checkConditions(itemDef.growthConditions.subOptimal, effectiveChunkForGrowth)) {
                        growthChance = 0.05; // 5% chance in sub-optimal conditions
                    }

                    if (Math.random() < growthChance) {
                        worldWasModified = true;
                        if (existingItem) {
                            existingItem.quantity = Math.min(existingItem.quantity + 1, itemDef.baseQuantity.max * 2);
                        } else {
                            chunk.items.push({
                                name: itemDefName,
                                description: itemDef.description,
                                tier: itemDef.tier,
                                quantity: itemDef.baseQuantity.min,
                                emoji: itemDef.emoji,
                            });
                        }
                    }
                }
            }
            
            // --- Enemy Behavior Simulation ---
            if (chunk.enemy) {
                // Hunger increases over time
                chunk.enemy.satiation = Math.max(0, chunk.enemy.satiation - 0.5);

                // If hungry, try to eat from the chunk
                if (chunk.enemy.satiation < chunk.enemy.maxSatiation / 2) {
                    const foodSource = chunk.items.find(item => chunk.enemy!.diet.includes(item.name));
                    if (foodSource) {
                        worldWasModified = true;
                        foodSource.quantity -= 1;
                        chunk.enemy.satiation = Math.min(chunk.enemy.maxSatiation, chunk.enemy.satiation + 2);
                        
                        const foodDef = customItemDefinitions[foodSource.name];
                        if (foodDef && (foodDef.category === 'Food' || foodDef.growthConditions)) {
                            chunk.vegetationDensity = clamp(chunk.vegetationDensity - 0.1, 0, 10);
                        }

                        if (foodSource.quantity <= 0) {
                            chunk.items = chunk.items.filter(i => i.name !== foodSource.name);
                        }
                    }
                }
                
                // If well-fed, try to reproduce
                const REPRODUCE_CHANCE = 0.1;
                if (chunk.enemy.satiation >= chunk.enemy.maxSatiation && Math.random() < REPRODUCE_CHANCE) {
                    const directions = [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }];
                    const emptyAdjacent = directions.find(dir => {
                        const adjKey = `${chunk.x + dir.x},${chunk.y + dir.y}`;
                        const adjChunk = newWorldState[adjKey];
                        // Can only reproduce in an adjacent, explored chunk of the same terrain with no enemy
                        return adjChunk && adjChunk.terrain === chunk.terrain && !adjChunk.enemy;
                    });

                    if (emptyAdjacent) {
                        worldWasModified = true;
                        const adjKey = `${chunk.x + emptyAdjacent.x},${chunk.y + emptyAdjacent.y}`;
                        // The new creature is weaker
                        newWorldState[adjKey]!.enemy = {
                            ...chunk.enemy,
                            hp: Math.round(chunk.enemy.hp * 0.75),
                            satiation: 0,
                        };
                        // Reset the parent's satiation after reproducing
                        chunk.enemy.satiation = 0;
                    }
                }
            }
            newWorldState[key] = chunk;
        }
        
        const eventChance = (seasonConfig[currentSeason]?.eventChance || 0.1) / 20; 
        if (Math.random() < eventChance) {
            triggerRandomEvent();
        }

        if (worldWasModified) setWorld(newWorldState);
        setPlayerStats(nextPlayerStats);
    }, [playerStats, world, gameTime, day, addNarrativeEntry, t, isOnline, finalWorldSetup, language, weatherZones, currentSeason, playerPosition, customItemDefinitions, getEffectiveChunk, triggerRandomEvent, setDay, setGameTime, setWeatherZones, setWorld, setPlayerStats, turn]);
    
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
    }, [playerStats.unlockProgress.kills, playerStats.unlockProgress.damageSpells, playerStats.unlockProgress.moves]);

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
    }, [playerBehaviorProfile.moves, playerBehaviorProfile.attacks, playerBehaviorProfile.crafts]);
    
    // EFFECT: Update the visual representation of the current chunk whenever the environment changes.
    useEffect(() => {
        if (!isLoaded) return;
        const baseChunk = world[`${playerPosition.x},${playerPosition.y}`];
        if (baseChunk) {
            const newEffectiveChunk = getEffectiveChunk(baseChunk);
            setCurrentChunk(newEffectiveChunk);
        } else {
            setCurrentChunk(null);
        }
    }, [world, playerPosition, gameTime, weatherZones, getEffectiveChunk, setCurrentChunk, isLoaded]);

    // EFFECT: Auto-saving
    useEffect(() => {
        if (!isLoaded || isSaving || isGameOver) return;

        const gameState: GameState = {
            worldProfile, currentSeason, world, recipes, buildableStructures,
            regions, regionCounter, playerPosition, playerBehaviorProfile,
            playerStats, narrativeLog, worldSetup: finalWorldSetup,
            customItemDefinitions, customItemCatalog, customStructures, weatherZones, gameTime, day,
            turn,
        };

        const save = async () => {
            setIsSaving(true);
            try {
                if (user) {
                    await setDoc(doc(db, "users", user.uid, "games", `slot_${props.gameSlot}`), gameState);
                } else {
                    localStorage.setItem(`gameState_${props.gameSlot}`, JSON.stringify(gameState));
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
        playerPosition, playerBehaviorProfile, playerStats, narrativeLog, finalWorldSetup,
        customItemDefinitions, customItemCatalog, customStructures, weatherZones, gameTime, day, user, isSaving, toast, isGameOver,
        turn, props.gameSlot, isLoaded, setIsSaving,
    ]);
    
    const handleOnlineNarrative = useCallback(async (action: string, worldCtx: World, playerPosCtx: {x: number, y: number}, playerStatsCtx: PlayerStatus) => {
        setIsLoading(true);
        const baseChunk = worldCtx[`${playerPosCtx.x},${playerPosCtx.y}`];
        if (!baseChunk || !finalWorldSetup) { setIsLoading(false); return; }

        const { roll, range } = rollDice(settings.diceType);
        const successLevel = getSuccessLevel(roll, settings.diceType);
        addNarrativeEntry(t('diceRollMessage', { roll, level: t(successLevelToTranslationKey[successLevel]) }), 'system');

        const currentChunk = getEffectiveChunk(baseChunk);

        const surroundingChunks: Chunk[] = [];
        if (settings.narrativeLength === 'long') {
            for (let dy = 1; dy >= -1; dy--) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const key = `${playerPosCtx.x + dx},${playerPosCtx.y + dy}`;
                    const adjacentChunk = worldCtx[key];
                    if (adjacentChunk && adjacentChunk.explored) {
                        surroundingChunks.push(getEffectiveChunk(adjacentChunk));
                    }
                }
            }
        }
        
        try {
            const input: GenerateNarrativeInput = {
                worldName: finalWorldSetup.worldName, playerAction: action, playerStatus: playerStatsCtx,
                currentChunk,
                surroundingChunks: surroundingChunks.length > 0 ? surroundingChunks : undefined,
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
                if (db) {
                    await setDoc(doc(db, "world-catalog", "items", "generated", newItem.name), newItem);
                }
            }
            advanceGameTime(finalPlayerStats);
        } catch (error) {
            console.error("AI narrative generation failed:", error);
            toast({ title: t('offlineModeActive'), description: t('offlineToastDesc'), variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [settings.diceType, settings.aiModel, settings.narrativeLength, addNarrativeEntry, getEffectiveChunk, narrativeLog, language, customItemDefinitions, toast, advanceGameTime, finalWorldSetup, setIsLoading, setWorld, setCustomItemCatalog, setCustomItemDefinitions, t, setPlayerStats]);
    
    const handleOfflineAttack = useCallback(() => {
        const key = `${playerPosition.x},${playerPosition.y}`;
        const baseChunk = world[key];
        if (!baseChunk || !baseChunk.enemy) { addNarrativeEntry(t('noTarget'), 'system'); return; }
        
        const currentChunk = getEffectiveChunk(baseChunk);
    
        const { roll } = rollDice(settings.diceType);
        const successLevel = getSuccessLevel(roll, settings.diceType);
        addNarrativeEntry(t('diceRollMessage', { roll, level: t(successLevelToTranslationKey[successLevel]) }), 'system');
    
        let playerDamage = 0;
        const damageMultiplier = successLevel === 'CriticalFailure' ? 0 : successLevel === 'Failure' ? 0 : successLevel === 'GreatSuccess' ? 1.5 : successLevel === 'CriticalSuccess' ? 2.0 : 1.0;
        
        if (damageMultiplier > 0) {
            let playerDamageModifier = 1.0;
            if (currentChunk.lightLevel < -3) { playerDamageModifier *= 0.8; }
            if (currentChunk.moisture > 8) { playerDamageModifier *= 0.9; }
            
            let playerBaseDamage = playerStats.attributes.physicalAttack + (playerStats.persona === 'warrior' ? 2 : 0);
            playerDamage = Math.round(playerBaseDamage * damageMultiplier * playerDamageModifier);
        }
    
        const finalEnemyHp = Math.max(0, currentChunk.enemy.hp - playerDamage);
        const enemyDefeated = finalEnemyHp <= 0;
        let lootDrops: ChunkItem[] = [];
    
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

        const narrativeResult = { successLevel, playerDamage, enemyDamage, enemyDefeated, fled, enemyType: currentChunk.enemy.type };
        const narrative = generateOfflineActionNarrative('attack', narrativeResult, currentChunk, t);
        addNarrativeEntry(narrative, 'narrative');
    
        if (enemyDefeated && lootDrops.length > 0) {
            addNarrativeEntry(t('enemyDropped', { items: lootDrops.map(i => `${i.quantity} ${t(i.name as TranslationKey)}`).join(', ') }), 'system');
        }
    
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
        const newPlayerStats: PlayerStatus = JSON.parse(JSON.stringify(playerStats));
        const itemIndex = newPlayerStats.items.findIndex(i => i.name.toLowerCase() === itemName.toLowerCase());
        
        if (itemIndex === -1) {
            addNarrativeEntry(t('itemNotFound'), 'system');
            return;
        }

        const itemDef = customItemDefinitions[itemName];
        if (!itemDef) return;
    
        const key = `${playerPosition.x},${playerPosition.y}`;
        const currentChunk = world[key];
        if (!currentChunk) return;
    
        let narrativeResult: any = { itemName, target };
        let itemWasConsumed = false;
        let finalWorldUpdate: Partial<World> | null = null;
    
        if (target === 'player') {
            if (!itemDef.effects.length) {
                addNarrativeEntry(t('itemNoEffect', { item: t(itemName as TranslationKey) }), 'system');
                return;
            }
            itemWasConsumed = true;
            let effectDescriptions: string[] = [];
            itemDef.effects.forEach(effect => {
                if (effect.type === 'HEAL') {
                    const old = newPlayerStats.hp;
                    newPlayerStats.hp = Math.min(100, newPlayerStats.hp + effect.amount);
                    if (newPlayerStats.hp > old) effectDescriptions.push(t('itemHealEffect', { amount: newPlayerStats.hp - old }));
                }
                if (effect.type === 'RESTORE_STAMINA') {
                    const old = newPlayerStats.stamina;
                    newPlayerStats.stamina = Math.min(100, newPlayerStats.stamina + effect.amount);
                    if (newPlayerStats.stamina > old) effectDescriptions.push(t('itemStaminaEffect', { amount: (newPlayerStats.stamina - old).toFixed(0) }));
                }
            });
            narrativeResult.wasUsed = effectDescriptions.length > 0;
            narrativeResult.effectDescription = effectDescriptions.join(', ');
        } else { // Taming logic
            if (!currentChunk.enemy || currentChunk.enemy.type !== target) {
                addNarrativeEntry(t('noTargetForITEM', { target: t(target as TranslationKey) }), 'system');
                return;
            }
            if (!currentChunk.enemy.diet.includes(itemName)) {
                addNarrativeEntry(t('targetNotInterested', { target: t(target as TranslationKey), item: t(itemName as TranslationKey) }), 'system');
                return;
            }
    
            itemWasConsumed = true;
            narrativeResult.itemConsumed = true;
            const newEnemyState = { ...currentChunk.enemy, satiation: Math.min(currentChunk.enemy.satiation + 1, currentChunk.enemy.maxSatiation) };
            const tamingChance = 0.1 + (newEnemyState.satiation / newEnemyState.maxSatiation) * 0.4 - (newEnemyState.hp / 100) * 0.2;
    
            if (Math.random() < tamingChance) {
                newPlayerStats.pets = [...(newPlayerStats.pets || []), { type: currentChunk.enemy.type, level: 1 }];
                finalWorldUpdate = { [key]: { ...currentChunk, enemy: null } };
                narrativeResult.wasTamed = true;
                narrativeResult.newPet = newPlayerStats.pets.at(-1);
            } else {
                finalWorldUpdate = { [key]: { ...currentChunk, enemy: newEnemyState } };
                narrativeResult.wasTamed = false;
            }
        }
        
        if (itemWasConsumed) {
            newPlayerStats.items[itemIndex].quantity -= 1;
        }
        
        const narrative = generateOfflineActionNarrative('useItem', narrativeResult, currentChunk, t);
        addNarrativeEntry(narrative, 'narrative');
    
        // Apply state changes at the end
        if (finalWorldUpdate) {
            setWorld(prev => ({ ...prev, ...finalWorldUpdate! }));
        }
        
        newPlayerStats.items = newPlayerStats.items.filter(i => i.quantity > 0);
        advanceGameTime(newPlayerStats);
    }, [playerStats, customItemDefinitions, playerPosition, world, addNarrativeEntry, t, advanceGameTime, setWorld]);
    
    const handleOfflineSkillUse = useCallback((skillName: string) => {
        let newPlayerStats: PlayerStatus = JSON.parse(JSON.stringify(playerStats));
        const skillToUse = newPlayerStats.skills.find(s => s.name === skillName);
    
        if (!skillToUse) { addNarrativeEntry(t('skillNotFound', { skillName: t(skillName as TranslationKey) }), 'system'); return; }
        if (newPlayerStats.mana < skillToUse.manaCost) { addNarrativeEntry(t('notEnoughMana', { skillName: t(skillName as TranslationKey) }), 'system'); return; }
    
        const { roll } = rollDice(settings.diceType);
        const successLevel = getSuccessLevel(roll, settings.diceType);
        addNarrativeEntry(t('diceRollMessage', { roll, level: t(successLevelToTranslationKey[successLevel]) }), 'system');
        newPlayerStats.mana -= skillToUse.manaCost;
    
        const key = `${playerPosition.x},${playerPosition.y}`;
        const currentChunk = world[key]!;
        let newEnemy: Chunk['enemy'] = currentChunk.enemy ? { ...currentChunk.enemy } : null;
        
        let narrativeResult: any = { skill: skillToUse, successLevel, enemy: newEnemy };

        if (successLevel === 'CriticalFailure') {
            const backfireDamage = Math.round(skillToUse.effect.amount * 0.5);
            newPlayerStats.hp = Math.max(0, newPlayerStats.hp - backfireDamage);
            narrativeResult.backfireDamage = backfireDamage;
        } else if (successLevel !== 'Failure') {
            const effectMultiplier = successLevel === 'GreatSuccess' ? 1.5 : successLevel === 'CriticalSuccess' ? 2.0 : 1.0;

            if (skillToUse.effect.type === 'HEAL') {
                const healAmount = Math.round(skillToUse.effect.amount * effectMultiplier);
                const oldHp = newPlayerStats.hp;
                newPlayerStats.hp = Math.min(100, newPlayerStats.hp + healAmount);
                narrativeResult.healedAmount = newPlayerStats.hp - oldHp;
            } else if (skillToUse.effect.type === 'DAMAGE' && newEnemy) {
                const baseDamage = skillToUse.effect.amount + Math.round(newPlayerStats.attributes.magicalAttack * 0.5);
                const finalDamage = Math.round(baseDamage * effectMultiplier);
                newEnemy.hp = Math.max(0, newEnemy.hp - finalDamage);
                narrativeResult.finalDamage = finalDamage;

                if (skillToUse.effect.healRatio) {
                    const healedAmount = Math.round(finalDamage * skillToUse.effect.healRatio);
                    const oldHp = newPlayerStats.hp;
                    newPlayerStats.hp = Math.min(100, newPlayerStats.hp + healedAmount);
                    if (newPlayerStats.hp > oldHp) narrativeResult.siphonedAmount = newPlayerStats.hp - oldHp;
                }
                if (newEnemy.hp <= 0) {
                    newEnemy = null;
                    newPlayerStats.unlockProgress.kills += 1;
                }
                newPlayerStats.unlockProgress.damageSpells += 1;
                narrativeResult.enemy = newEnemy;
            }
        }
        
        const narrative = generateOfflineActionNarrative('useSkill', narrativeResult, currentChunk, t);
        addNarrativeEntry(narrative, 'narrative');

        if(newEnemy !== currentChunk.enemy) setWorld(prev => ({...prev, [key]: {...prev[key]!, enemy: newEnemy}}));
        advanceGameTime(newPlayerStats);
    }, [playerStats, settings.diceType, t, addNarrativeEntry, playerPosition, world, advanceGameTime, setWorld, language]);
    
    const handleOfflineAction = useCallback((action: Action) => {
        let newPlayerStats = { ...playerStats, dailyActionLog: [...(playerStats.dailyActionLog || []), t(action.textKey, action.params)] };
        const currentChunk = world[`${playerPosition.x},${playerPosition.y}`];
        if (!currentChunk) return;

        const { textKey } = action;

        if (textKey === 'talkToAction_npc') {
            const npcName = t(action.params!.npcName as TranslationKey);
            const npc = currentChunk.NPCs.find(n => t(n.name as TranslationKey) === npcName);
            if (npc) {
                const templates = getTemplates(language);
                let npcDef: Npc | undefined;
                 for (const terrain of Object.keys(templates)) {
                    const templateNpc = templates[terrain as Terrain].NPCs.find((n: any) => n.data.name === npc.name);
                    if (templateNpc) {
                        npcDef = templateNpc.data;
                        break;
                    }
                }
                if (npcDef?.quest && npcDef.questItem) {
                    if (newPlayerStats.quests.includes(npcDef.quest)) {
                        const itemInInventory = newPlayerStats.items.find(i => i.name === npcDef.questItem!.name);
                        if (itemInInventory && itemInInventory.quantity >= npcDef.questItem!.quantity) {
                            addNarrativeEntry(t('gaveItemToNpc', { quantity: npcDef.questItem.quantity, itemName: t(npcDef.questItem.name as TranslationKey), npcName: t(npc.name as TranslationKey)}), 'system');
                            itemInInventory.quantity -= npcDef.questItem.quantity;
                            if (itemInInventory.quantity <= 0) newPlayerStats.items = newPlayerStats.items.filter(i => i.name !== npcDef!.questItem!.name);
                            (npcDef.rewardItems || []).forEach((reward: PlayerItem) => {
                                const existingItem = newPlayerStats.items.find(i => i.name === reward.name);
                                if (existingItem) existingItem.quantity += reward.quantity;
                                else newPlayerStats.items.push({...reward});
                            });
                            newPlayerStats.quests = newPlayerStats.quests.filter(q => q !== npcDef!.quest);
                            addNarrativeEntry(t('npcQuestCompleted', { npcName: t(npc.name as TranslationKey) }), 'narrative');
                            toast({ title: t('questCompletedTitle'), description: t(npcDef.quest as TranslationKey) });
                        } else addNarrativeEntry(t('npcQuestNotEnoughItems', { npcName: t(npc.name as TranslationKey), needed: npcDef.questItem.quantity - (itemInInventory?.quantity || 0), itemName: t(npcDef.questItem.name as TranslationKey) }), 'narrative');
                    } else { newPlayerStats.quests.push(npcDef.quest); addNarrativeEntry(t('npcQuestGive', { npcName: t(npc.name as TranslationKey), questText: t(npcDef.quest as TranslationKey) }), 'narrative'); }
                } else addNarrativeEntry(t('npcNoQuest', { npcName: t(npc.name as TranslationKey) }), 'narrative');
            }
        } else if (textKey === 'exploreAction') {
            const result = handleSearchAction(
                currentChunk,
                action.id,
                language,
                t,
                customItemDefinitions,
                getRandomInRange
            );
            
            if (result.toastInfo) {
                toast({
                    title: t(result.toastInfo.title),
                    description: t(result.toastInfo.description, result.toastInfo.params)
                });
            }
            addNarrativeEntry(result.narrative, 'narrative');
            setWorld(prev => ({...prev, [`${playerPosition.x},${playerPosition.y}`]: result.newChunk}));
        } else if (textKey === 'pickUpAction_item') {
            const chunkKey = `${playerPosition.x},${playerPosition.y}`;
            const itemInChunk = currentChunk.items.find(i => i.name === action.params!.itemName);
            
            if (!itemInChunk) {
                toast({ title: t('actionNotAvailableTitle'), description: t('itemNotFoundNarrative', {itemName: t(action.params!.itemName as TranslationKey)}), variant: 'destructive' });
                 setWorld(prev => {
                    const newWorld = { ...prev };
                    const chunkToUpdate = { ...newWorld[chunkKey]! };
                    chunkToUpdate.actions = chunkToUpdate.actions.filter(a => a.id !== action.id);
                    newWorld[chunkKey] = chunkToUpdate;
                    return newWorld;
                });
                return;
            }

            toast({
                title: t('itemPickedUpTitle'),
                description: t('pickedUpItemToast', { quantity: itemInChunk.quantity, itemName: t(itemInChunk.name as TranslationKey) }),
            });
            
            const itemInInventory = newPlayerStats.items.find(i => i.name === itemInChunk.name);
            if (itemInInventory) {
                itemInInventory.quantity += itemInChunk.quantity;
            } else {
                newPlayerStats.items.push({...itemInChunk});
            }
            
            addNarrativeEntry(t('pickedUpItemNarrative', { quantity: itemInChunk.quantity, itemName: t(itemInChunk.name as TranslationKey) }), 'narrative');

            setWorld(prev => {
                const newWorld = { ...prev };
                const chunkToUpdate = { ...newWorld[chunkKey]! };
                chunkToUpdate.items = chunkToUpdate.items.filter(i => i.name !== itemInChunk.name);
                chunkToUpdate.actions = chunkToUpdate.actions.filter(a => a.id !== action.id);
                newWorld[chunkKey] = chunkToUpdate;
                return newWorld;
            });
        } else if (textKey === 'listenToSurroundingsAction') {
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
        } else if (textKey === 'analyzeAction') {
            const chunk = getEffectiveChunk(currentChunk);
            const analysis = `
[Analysis Report]
Coordinates: (${chunk.x}, ${chunk.y})
Terrain: ${t(chunk.terrain as TranslationKey)}
- Temperature: ${chunk.temperature?.toFixed(1)}°C
- Moisture: ${chunk.moisture}/10
- Light Level: ${chunk.lightLevel}/10
- Danger Level: ${chunk.dangerLevel}/10
- Explorability: ${chunk.explorability.toFixed(1)}/10
- Magic Affinity: ${chunk.magicAffinity}/10
- Human Presence: ${chunk.humanPresence}/10
- Predator Presence: ${chunk.predatorPresence}/10
Items: ${chunk.items.map(i => `${t(i.name as TranslationKey)} (x${i.quantity})`).join(', ') || 'None'}
Enemy: ${chunk.enemy ? t(chunk.enemy.type as TranslationKey) : 'None'}
NPCs: ${chunk.NPCs.map(n => t(n.name as TranslationKey)).join(', ') || 'None'}
Structures: ${chunk.structures.map(s => t(s.name as TranslationKey)).join(', ') || 'None'}
`;
            addNarrativeEntry(analysis, 'system');
        }

        advanceGameTime(newPlayerStats);
    }, [addNarrativeEntry, playerStats, t, world, playerPosition, language, toast, advanceGameTime, customItemDefinitions, setWorld, getEffectiveChunk]);
    
    const handleMove = useCallback((direction: "north" | "south" | "east" | "west") => {
        if (isLoading || isGameOver || !isLoaded) return;
        setPlayerBehaviorProfile(p => ({ ...p, moves: p.moves + 1 }));

        let newPos = { ...playerPosition };
        if (direction === 'north') newPos.y++;
        else if (direction === 'south') newPos.y--;
        else if (direction === 'east') newPos.x++;
        else if (direction === 'west') newPos.x--;

        let worldSnapshot = { ...world };
        let regionsSnapshot = { ...regions };
        let regionCounterSnapshot = regionCounter;

        const destResult = ensureChunkExists(newPos, worldSnapshot, regionsSnapshot, regionCounterSnapshot);
        worldSnapshot = destResult.worldWithChunk;
        regionsSnapshot = destResult.newRegions;
        regionCounterSnapshot = destResult.newRegionCounter;

        const destinationTerrain = destResult.chunk.terrain;
        if (destinationTerrain === 'ocean') {
            const hasRaft = playerStats.items.some(item => item.name === 'Thuyền Phao');
            if (!hasRaft) {
                toast({ title: t('oceanTravelBlocked'), variant: "destructive" });
                return;
            }
        }

        if (destResult.chunk?.terrain === 'wall') {
            addNarrativeEntry(t('wallBlock'), 'system');
            return;
        }

        const travelCost = playerStats.persona === 'explorer' ? Math.max(1, (worldConfig[destResult.chunk.terrain]?.travelCost || 3) - 1) : (worldConfig[destResult.chunk.terrain]?.travelCost || 3);
        if (playerStats.stamina < travelCost) {
            toast({ title: t('notEnoughStamina'), description: t('notEnoughStaminaDesc', { cost: travelCost, current: playerStats.stamina.toFixed(0) }), variant: "destructive" });
            return;
        }

        const capitalizedDirection = direction.charAt(0).toUpperCase() + direction.slice(1);
        const directionKey = `direction${capitalizedDirection}` as TranslationKey;
        const actionText = t('wentDirection', { direction: t(directionKey) });
        addNarrativeEntry(actionText, 'action');

        const newTurn = turn + 1;

        const visionRadius = 1;
        for (let dy = -visionRadius; dy <= visionRadius; dy++) {
            for (let dx = -visionRadius; dx <= visionRadius; dx++) {
                const revealPos = { x: newPos.x + dx, y: newPos.y + dy };
                if (!worldSnapshot[`${revealPos.x},${revealPos.y}`]) {
                    const result = ensureChunkExists(revealPos, worldSnapshot, regionsSnapshot, regionCounterSnapshot);
                    worldSnapshot = result.worldWithChunk;
                    regionsSnapshot = result.newRegions;
                    regionCounterSnapshot = result.newRegionCounter;
                }
                if (worldSnapshot[`${revealPos.x},${revealPos.y}`]) {
                    worldSnapshot[`${revealPos.x},${revealPos.y}`].explored = true;
                }
            }
        }

        const destChunkKey = `${newPos.x},${newPos.y}`;
        worldSnapshot[destChunkKey] = { ...worldSnapshot[destChunkKey], lastVisited: newTurn };

        const wasNewRegionCreated = regionCounterSnapshot > regionCounter;
        if (wasNewRegionCreated) {
            const newWeatherZones = { ...weatherZones };
            const currentRegions = regionsSnapshot || {};
            Object.keys(currentRegions).filter(id => !newWeatherZones[id]).forEach(regionId => {
                const region = currentRegions[Number(regionId)];
                if (region) {
                    const initialWeather = generateWeatherForZone(region.terrain, currentSeason);
                    newWeatherZones[regionId] = { id: regionId, terrain: region.terrain, currentWeather: initialWeather, nextChangeTime: gameTime + getRandomInRange({ min: initialWeather.duration_range[0], max: initialWeather.duration_range[1] }) * 10 };
                }
            });
            setWeatherZones(newWeatherZones);
        }
        
        setTurn(newTurn);
        setWorld(worldSnapshot);
        setRegions(regionsSnapshot);
        setRegionCounter(regionCounterSnapshot);
        setPlayerPosition(newPos);

        const newPlayerStats = { ...playerStats, stamina: playerStats.stamina - travelCost, dailyActionLog: [...(playerStats.dailyActionLog || []), actionText], unlockProgress: { ...playerStats.unlockProgress, moves: playerStats.unlockProgress.moves + 1 } };

        if (isOnline) {
            handleOnlineNarrative(actionText, worldSnapshot, newPos, newPlayerStats);
        } else {
            const narrative = generateOfflineNarrative(worldSnapshot[destChunkKey], settings.narrativeLength, worldSnapshot, newPos, t, language);
            addNarrativeEntry(narrative, 'narrative');
            advanceGameTime(newPlayerStats);
        }
    }, [isLoading, isGameOver, isLoaded, setPlayerBehaviorProfile, playerPosition, world, regions, regionCounter, turn, playerStats, toast, addNarrativeEntry, t, ensureChunkExists, weatherZones, currentSeason, gameTime, setWeatherZones, setWorld, setRegions, setRegionCounter, setPlayerPosition, isOnline, handleOnlineNarrative, advanceGameTime, settings.narrativeLength, language, customItemDefinitions]);

    const handleAction = useCallback((actionId: number) => {
        if (isLoading || isGameOver || !isLoaded) return;
        const chunk = world[`${playerPosition.x},${playerPosition.y}`];
        if(!chunk) return;
        
        const action = chunk.actions.find(a => a.id === actionId);
        if (!action) {
            toast({ title: t('actionNotAvailableTitle'), description: t('actionNotAvailableDesc'), variant: 'destructive' });
            return;
        }
        
        const actionText = t(action.textKey, action.params);
        addNarrativeEntry(actionText, 'action');
        if (isOnline && action.textKey === 'talkToAction_npc') {
            const newPlayerStats = { ...playerStats, dailyActionLog: [...(playerStats.dailyActionLog || []), actionText]};
            handleOnlineNarrative(actionText, world, playerPosition, newPlayerStats);
        } else {
            handleOfflineAction(action);
        }
    }, [isLoading, isGameOver, isLoaded, world, playerPosition, playerStats, isOnline, handleOnlineNarrative, handleOfflineAction, toast, t, addNarrativeEntry]);
    
    const handleAttack = useCallback(() => {
        if (isLoading || isGameOver || !isLoaded) return;
        setPlayerBehaviorProfile(p => ({ ...p, attacks: p.attacks + 1 }));
        const baseChunk = world[`${playerPosition.x},${playerPosition.y}`];
        if (!baseChunk?.enemy) { addNarrativeEntry(t('noTarget'), 'system'); return; }
        
        const actionText = `${t('attackAction')} ${t(baseChunk.enemy.type as TranslationKey)}`;
        addNarrativeEntry(actionText, 'action');
        const newPlayerStats = { ...playerStats, dailyActionLog: [...(playerStats.dailyActionLog || []), actionText]};
    
        handleOfflineAttack();
    }, [isLoading, isGameOver, isLoaded, setPlayerBehaviorProfile, world, playerPosition, addNarrativeEntry, t, playerStats, handleOfflineAttack]);
    
    const handleCustomAction = useCallback((text: string) => {
        if (!text.trim() || isLoading || isGameOver || !isLoaded) return;
        setPlayerBehaviorProfile(p => ({ ...p, customActions: p.customActions + 1 }));

        if (text.trim().toLowerCase() === 'analyze') {
            handleOfflineAction({id: -1, textKey: 'analyzeAction'});
            return;
        }

        const newPlayerStats = { ...playerStats, dailyActionLog: [...(playerStats.dailyActionLog || []), text]};
        addNarrativeEntry(text, 'action');
        if (isOnline) handleOnlineNarrative(text, world, playerPosition, newPlayerStats);
        else {
             addNarrativeEntry(t('customActionFail'), 'narrative');
             advanceGameTime();
        }
    }, [isLoading, isGameOver, isLoaded, setPlayerBehaviorProfile, playerStats, isOnline, handleOnlineNarrative, handleOfflineAction, world, playerPosition, addNarrativeEntry, t, advanceGameTime]);

    const handleCraft = useCallback(async (recipe: Recipe, outcome: CraftingOutcome) => {
        if (isLoading || isGameOver) return;
        setPlayerBehaviorProfile(p => ({ ...p, crafts: p.crafts + 1 }));

        if (!outcome.canCraft) { toast({ title: t('error'), description: t('notEnoughIngredients'), variant: "destructive" }); return; }
        
        const actionText = t('craftAction', {itemName: t(recipe.result.name as TranslationKey)});
        addNarrativeEntry(actionText, 'action');
        let updatedItems = playerStats.items.map(i => ({...i}));
        outcome.ingredientsToConsume.forEach(itemToConsume => {
            const itemIndex = updatedItems.findIndex(i => i.name === itemToConsume.name);
            if (itemIndex > -1) updatedItems[itemIndex].quantity -= itemToConsume.quantity;
        });
        
        let nextPlayerStats = { ...playerStats, items: updatedItems.filter(i => i.quantity > 0), dailyActionLog: [...(playerStats.dailyActionLog || []), actionText] };

        if (Math.random() * 100 < outcome.chance) {
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
    }, [isLoading, isGameOver, setPlayerBehaviorProfile, playerStats, customItemDefinitions, addNarrativeEntry, toast, t, advanceGameTime, setPlayerStats]);

    const handleItemUsed = useCallback((itemName: string, target: 'player' | string) => {
        if (isLoading || isGameOver || !isLoaded) return;
        const actionText = target === 'player' ? `${t('useAction')} ${t(itemName as TranslationKey)}` : `${t('useOnAction', {item: t(itemName as TranslationKey), target: t(target as TranslationKey)})}`;
        addNarrativeEntry(actionText, 'action');
        
        handleOfflineItemUse(itemName, target);

    }, [isLoading, isGameOver, isLoaded, t, handleOfflineItemUse, addNarrativeEntry]);

    const handleUseSkill = useCallback((skillName: string) => {
        if (isLoading || isGameOver || !isLoaded) return;
        const actionText = `${t('useSkillAction')} ${t(skillName as TranslationKey)}`;
        addNarrativeEntry(actionText, 'action');

        handleOfflineSkillUse(skillName);
    }, [isLoading, isGameOver, isLoaded, t, handleOfflineSkillUse, addNarrativeEntry]);

    const handleBuild = useCallback((structureName: string) => {
        if (isLoading || isGameOver) return;

        const currentChunk = world[`${playerPosition.x},${playerPosition.y}`];
        if (currentChunk?.structures.length > 0) {
            toast({ title: t('structureLimitTitle'), description: t('structureLimitDesc'), variant: "destructive" });
            return;
        }

        const structureToBuild = buildableStructures[structureName];
        if (!structureToBuild?.buildable) return;

        const buildStaminaCost = 15;
        if (playerStats.stamina < buildStaminaCost) { toast({ title: t('notEnoughStamina'), description: t('notEnoughStaminaDesc', { cost: buildStaminaCost, current: playerStats.stamina.toFixed(0) }), variant: "destructive" }); return; }

        const inventoryMap = new Map(playerStats.items.map(item => [item.name, item.quantity]));
        if (!structureToBuild.buildCost?.every(cost => (inventoryMap.get(cost.name) || 0) >= cost.quantity)) { toast({ title: t('notEnoughIngredients'), variant: "destructive" }); return; }
        
        const actionText = t('buildConfirm', {structureName: t(structureName as TranslationKey)});
        addNarrativeEntry(actionText, 'action');
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
    }, [isLoading, isGameOver, buildableStructures, playerStats, playerPosition, addNarrativeEntry, advanceGameTime, toast, t, setWorld, world]);

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
    }, [isLoading, isGameOver, world, playerPosition, addNarrativeEntry, advanceGameTime, t, toast, playerStats, setPlayerStats]);
    
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
        addNarrativeEntry(actionText, 'action');
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
                nextPlayerStats = { ...nextPlayerStats, items: [...nextPlayerStats.items] }; 
                const existing = nextPlayerStats.items.find(i => i.name === result.resultItem!.name);
                if (existing) existing.quantity += result.resultItem!.baseQuantity.min;
                else nextPlayerStats.items.push({ name: result.resultItem!.name, quantity: result.resultItem!.baseQuantity.min, tier: result.resultItem!.tier, emoji: result.resultItem!.emoji });
                
                if(!customItemDefinitions[result.resultItem.name]) {
                    const newItem = result.resultItem;
                    setCustomItemCatalog(prev => [...prev, newItem]);
                    setCustomItemDefinitions(prev => ({ ...prev, [newItem.name]: { description: newItem.description, tier: newItem.tier, category: newItem.category, emoji: newItem.emoji, effects: newItem.effects as ItemEffect[], baseQuantity: newItem.baseQuantity, growthConditions: newItem.growthConditions, }}));
                    if(db) {
                        await setDoc(doc(db, "world-catalog", "items", "generated", newItem.name), newItem);
                    }
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

    const handleEquipItem = useCallback((itemName: string) => {
        if (isLoading || isGameOver) return;
    
        const itemDef = customItemDefinitions[itemName];
        if (!itemDef || !itemDef.equipmentSlot) return;
    
        setPlayerStats(prevStats => {
            const newStats: PlayerStatus = JSON.parse(JSON.stringify(prevStats));
            const itemToEquipIndex = newStats.items.findIndex(i => i.name === itemName);
            if (itemToEquipIndex === -1) return prevStats; 
    
            const itemToEquip = newStats.items[itemToEquipIndex];
            const slot = itemDef.equipmentSlot!;
    
            const currentEquipped = newStats.equipment[slot];
            if (currentEquipped) {
                const existingInInventory = newStats.items.find(i => i.name === currentEquipped.name);
                if (existingInInventory) {
                    existingInInventory.quantity += 1;
                } else {
                    newStats.items.push({ ...currentEquipped, quantity: 1 });
                }
            }
    
            newStats.equipment[slot] = { name: itemToEquip.name, quantity: 1, tier: itemToEquip.tier, emoji: itemToEquip.emoji };
    
            if (itemToEquip.quantity > 1) {
                itemToEquip.quantity -= 1;
            } else {
                newStats.items.splice(itemToEquipIndex, 1);
            }
            
            let basePhysAtk = 10, baseMagAtk = 5, baseCrit = 5, baseAtkSpd = 1.0, baseCd = 0;
            Object.values(newStats.equipment).forEach(equipped => {
                if (equipped) {
                    const def = customItemDefinitions[equipped.name];
                    if (def?.attributes) {
                        basePhysAtk += def.attributes.physicalAttack || 0;
                        baseMagAtk += def.attributes.magicalAttack || 0;
                        baseCrit += def.attributes.critChance || 0;
                        baseAtkSpd += def.attributes.attackSpeed || 0;
                        baseCd += def.attributes.cooldownReduction || 0;
                    }
                }
            });
            newStats.attributes = { physicalAttack: basePhysAtk, magicalAttack: baseMagAtk, critChance: baseCrit, attackSpeed: baseAtkSpd, cooldownReduction: baseCd };

            return newStats;
        });
    }, [isLoading, isGameOver, customItemDefinitions, setPlayerStats]);
    
    const handleUnequipItem = useCallback((slot: EquipmentSlot) => {
        if (isLoading || isGameOver) return;

        setPlayerStats(prevStats => {
            const newStats: PlayerStatus = JSON.parse(JSON.stringify(prevStats));
            const itemToUnequip = newStats.equipment[slot];
            if (!itemToUnequip) return prevStats;

            const existingInInventory = newStats.items.find(i => i.name === itemToUnequip.name);
            if (existingInInventory) {
                existingInInventory.quantity += 1;
            } else {
                newStats.items.push({ ...itemToUnequip, quantity: 1 });
            }

            newStats.equipment[slot] = null;
            
            let basePhysAtk = 10, baseMagAtk = 5, baseCrit = 5, baseAtkSpd = 1.0, baseCd = 0;
            Object.values(newStats.equipment).forEach(equipped => {
                if (equipped) {
                    const def = customItemDefinitions[equipped.name];
                    if (def?.attributes) {
                        basePhysAtk += def.attributes.physicalAttack || 0;
                        baseMagAtk += def.attributes.magicalAttack || 0;
                        baseCrit += def.attributes.critChance || 0;
                        baseAtkSpd += def.attributes.attackSpeed || 0;
                        baseCd += def.attributes.cooldownReduction || 0;
                    }
                }
            });
            newStats.attributes = { physicalAttack: basePhysAtk, magicalAttack: baseMagAtk, critChance: baseCrit, attackSpeed: baseAtkSpd, cooldownReduction: baseCd };
            
            return newStats;
        });
    }, [isLoading, isGameOver, customItemDefinitions, setPlayerStats]);

    const handleReturnToMenu = () => {
        window.location.href = '/';
    };

    return {
        world, recipes, buildableStructures, playerStats, playerPosition, narrativeLog, isLoading, isGameOver, finalWorldSetup, customItemDefinitions,
        currentChunk, turn,
        handleMove, handleAttack, handleAction, handleCustomAction, handleCraft, handleBuild, handleItemUsed, handleUseSkill, handleRest, handleFuseItems,
        handleRequestQuestHint, handleEquipItem, handleUnequipItem,
        handleReturnToMenu,
    };
}
