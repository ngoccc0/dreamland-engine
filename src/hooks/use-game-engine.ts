
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/language-context";
import { generateNarrative, type GenerateNarrativeInput } from "@/ai/flows/generate-narrative-flow";
import { generateNewRecipe } from "@/ai/flows/generate-new-recipe";
import { generateRegion, getValidAdjacentTerrains, weightedRandom, generateWeatherForZone, checkConditions, calculateCraftingOutcome } from '@/lib/game/engine';
import { itemDefinitions as staticItemDefinitions } from '@/lib/game/items';
import { recipes as staticRecipes } from '@/lib/game/recipes';
import { buildableStructures as staticBuildableStructures } from '@/lib/game/structures';
import { skillDefinitions } from '@/lib/game/skills';
import { templates } from '@/lib/game/templates';
import { worldConfig } from '@/lib/game/world-config';
import type { GameState, World, PlayerStatus, NarrativeEntry, Chunk, Season, WorldProfile, Region, Terrain, PlayerItem, ChunkItem, ItemDefinition, GeneratedItem, WeatherZone, Recipe, WorldConcept, Skill, PlayerBehaviorProfile, PlayerPersona, Structure, Pet } from "@/lib/game/types";
import type { TranslationKey } from "@/lib/i18n";


const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);
const getRandomInRange = (range: { min: number, max: number }) => Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

// --- DICE ROLL HELPERS ---
type SuccessLevel = 'CriticalFailure' | 'Failure' | 'Success' | 'GreatSuccess' | 'CriticalSuccess';

function getSuccessLevel(roll: number): SuccessLevel {
    if (roll === 1) return 'CriticalFailure';
    if (roll <= 8) return 'Failure';
    if (roll <= 16) return 'Success';
    if (roll <= 19) return 'GreatSuccess';
    return 'CriticalSuccess'; // for roll === 20
}

const successLevelToTranslationKey: Record<SuccessLevel, TranslationKey> = {
    CriticalFailure: 'criticalFailure',
    Failure: 'failure',
    Success: 'success',
    GreatSuccess: 'greatSuccess',
    CriticalSuccess: 'criticalSuccess',
}

interface GameEngineProps {
    worldSetup?: Omit<WorldConcept, 'playerInventory' | 'customItemCatalog'> & { playerInventory: PlayerItem[], startingSkill: Skill };
    initialGameState?: GameState;
    customItemDefinitions?: Record<string, ItemDefinition>;
    customItemCatalog?: GeneratedItem[];
}

export function useGameEngine({ worldSetup, initialGameState, customItemDefinitions: initialCustomDefs, customItemCatalog: initialCustomCatalog }: GameEngineProps) {
    const { t, language } = useLanguage();
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
    const [gameTicks, setGameTicks] = useState(initialGameState?.gameTicks || 0);
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
            skills: worldSetup?.startingSkill ? [worldSetup.startingSkill] : [], // Start with only the chosen skill for new games. Fallback to empty for old saves.
            pets: [],
            persona: 'none',
            attributes: {
                physicalAttack: 10,
                magicalAttack: 5,
                critChance: 5,
                attackSpeed: 1.0,
                cooldownReduction: 0,
            }
        }
    );
    const [customItemDefinitions, setCustomItemDefinitions] = useState<Record<string, ItemDefinition>>(initialGameState?.customItemDefinitions || initialCustomDefs || staticItemDefinitions);
    const [customItemCatalog, setCustomItemCatalog] = useState<GeneratedItem[]>(initialGameState?.customItemCatalog || initialCustomCatalog || []);

    const [isLoading, setIsLoading] = useState(false);
    const [narrativeLog, setNarrativeLog] = useState<NarrativeEntry[]>(initialGameState?.narrativeLog || []);
    const narrativeIdCounter = useRef(1);
    
    // --- State for AI vs. Rule-based mode ---
    const [isOnline, setIsOnline] = useState(true);

    const finalWorldSetup = worldSetup || initialGameState?.worldSetup;

    // Effect for handling online/offline status
    useEffect(() => {
        if (typeof window === 'undefined' || !navigator) return;

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => {
            setIsOnline(false);
            toast({
                title: t('offlineModeActive'),
                description: t('offlineToastDesc'),
            });
        };

        // Set initial status
        setIsOnline(navigator.onLine);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [t, toast]);


    const addNarrativeEntry = useCallback((text: string, type: NarrativeEntry['type']) => {
        setNarrativeLog(prev => {
            const newEntry = { id: narrativeIdCounter.current, text, type };
            narrativeIdCounter.current++;
            // Keep the log to a max of 50 entries for performance
            return [...prev, newEntry].slice(-50);
        });
    }, []);

    // Effect for calculating player persona
    useEffect(() => {
        const totalActions = playerBehaviorProfile.moves + playerBehaviorProfile.attacks + playerBehaviorProfile.crafts + playerBehaviorProfile.customActions;
        
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
            let message = '';
            if (newPersona === 'explorer') message = 'Những chuyến đi liên tục đã giúp bạn dẻo dai hơn trên đường.';
            if (newPersona === 'warrior') message = 'Kinh nghiệm chiến đấu đã mài sắc các đòn tấn công của bạn.';
            if (newPersona === 'artisan') message = 'Đôi tay của bạn di chuyển với sự tự tin mới trong nghề thủ công.';
            addNarrativeEntry(message, 'system');
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playerBehaviorProfile]);
    
    const getEffectiveChunk = useCallback((baseChunk: Chunk): Chunk => {
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
        effectiveChunk.lightLevel = clamp(baseChunk.lightLevel + weather.light_delta, -10, 10);

        return effectiveChunk;
    }, [weatherZones]);

    // Initial setup effect
    useEffect(() => {
        if (initialGameState) {
            if (narrativeLog.length > 0) {
                narrativeIdCounter.current = Math.max(...narrativeLog.map(e => e.id)) + 1;
            }
            return;
        };

        if (worldSetup) {
            addNarrativeEntry(worldSetup.initialNarrative, 'narrative');
            const startPos = { x: 0, y: 0 };
            const startingTerrain = worldSetup.startingBiome as Terrain;
            
            let { newWorld, newRegions, newRegionCounter } = generateRegion(
                startPos, 
                startingTerrain, 
                {}, 
                {}, 
                0,
                worldProfile,
                currentSeason,
                customItemDefinitions,
                customItemCatalog
            );
            
            const startKey = `${startPos.x},${startPos.y}`;
            if (newWorld[startKey]) {
                newWorld[startKey].explored = true;
                addNarrativeEntry(newWorld[startKey].description, 'narrative');
            }

            const initialWeatherZones: { [zoneId: string]: WeatherZone } = {};
            let currentTick = 0;
            Object.entries(newRegions).forEach(([regionId, region]) => {
                const initialWeather = generateWeatherForZone(region.terrain, currentSeason);
                const nextChangeTime = currentTick + getRandomInRange({min: initialWeather.duration_range[0], max: initialWeather.duration_range[1]});
                initialWeatherZones[regionId] = {
                    id: regionId,
                    terrain: region.terrain,
                    currentWeather: initialWeather,
                    nextChangeTime: nextChangeTime
                };
            });
            
            setWeatherZones(initialWeatherZones);
            setWorld(newWorld);
            setRegions(newRegions);
            setRegionCounter(newRegionCounter);
            // Ensure new game starts with ideal body temperature
            setPlayerStats(prev => ({ ...prev, bodyTemperature: 37 }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [worldSetup, initialGameState]);

    // Game state saving effect
    useEffect(() => {
        if (Object.keys(world).length === 0 || !finalWorldSetup) return;

        const gameState: GameState = {
            worldProfile,
            currentSeason,
            world,
            recipes,
            buildableStructures,
            regions,
            regionCounter,
            playerPosition,
            playerBehaviorProfile,
            playerStats,
            narrativeLog,
            worldSetup: finalWorldSetup,
            customItemDefinitions,
            customItemCatalog,
            weatherZones,
            gameTicks,
        };

        try {
            localStorage.setItem('gameState', JSON.stringify(gameState));
        } catch (error) {
            console.error("Failed to save game state:", error);
        }
    }, [
        worldProfile,
        currentSeason,
        world,
        recipes,
        buildableStructures,
        regions,
        regionCounter,
        playerPosition,
        playerBehaviorProfile,
        playerStats,
        narrativeLog,
        finalWorldSetup,
        customItemDefinitions,
        customItemCatalog,
        weatherZones,
        gameTicks,
    ]);

    const handleGameTick = useCallback(() => {
        const nextTick = gameTicks + 1;
    
        // --- WORLD SIMULATION ---
        let newWorldState = { ...world };
        let worldWasModified = false;
        const changes = {
            narrativeEntries: [] as { text: string; type: NarrativeEntry['type'] }[],
        };
    
        const newWeatherZones = { ...weatherZones };
        let weatherHasChanged = false;
        for (const zoneId in newWeatherZones) {
            const zone = { ...newWeatherZones[zoneId] };
            if (nextTick >= zone.nextChangeTime) {
                const newWeather = generateWeatherForZone(zone.terrain, currentSeason, zone.currentWeather);
                zone.currentWeather = newWeather;
                zone.nextChangeTime = nextTick + getRandomInRange({min: newWeather.duration_range[0], max: newWeather.duration_range[1]});
                changes.narrativeEntries.push({ text: newWeather.description, type: 'system'});
                newWeatherZones[zoneId] = zone;
                weatherHasChanged = true;
            }
        }
        if (weatherHasChanged) {
            setWeatherZones(newWeatherZones);
        }
    
        const allCreatures = [];
        for (const key in newWorldState) {
            if (newWorldState[key].enemy) {
                allCreatures.push({
                    key,
                    chunk: newWorldState[key],
                    enemyData: newWorldState[key].enemy!,
                });
            }
        }
        allCreatures.sort(() => Math.random() - 0.5);
    
        for (const creature of allCreatures) {
            const { key: creatureKey } = creature;
    
            if (!newWorldState[creatureKey]?.enemy || newWorldState[creatureKey].enemy!.type !== creature.enemyData.type) {
                continue;
            }
    
            let hasActed = false;
            const directions = [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }].sort(() => Math.random() - 0.5);
    
            const creatureChunk = newWorldState[creatureKey];
            const enemyData = creatureChunk.enemy!;
    
            if (enemyData.satiation >= enemyData.maxSatiation) {
                for (const dir of directions) {
                    const partnerPos = { x: creatureChunk.x + dir.x, y: creatureChunk.y + dir.y };
                    const partnerKey = `${partnerPos.x},${partnerPos.y}`;
                    const partnerChunk = newWorldState[partnerKey];
                    
                    if (partnerChunk?.enemy && partnerChunk.enemy.type === enemyData.type && partnerChunk.enemy.satiation >= partnerChunk.enemy.maxSatiation) {
                        for (const birthDir of directions) {
                            const birthPos = { x: creatureChunk.x + birthDir.x, y: creatureChunk.y + birthDir.y };
                            const birthKey = `${birthPos.x},${birthPos.y}`;
                            
                            if (newWorldState[birthKey] && !newWorldState[birthKey].enemy) {
                                const enemyTemplate = templates[newWorldState[birthKey].terrain].enemies.find(e => e.data.type === enemyData.type)?.data;
                                if (enemyTemplate) {
                                    const currentCreatureChunkCopy = { ...newWorldState[creatureKey], enemy: { ...newWorldState[creatureKey].enemy!, satiation: 0 }};
                                    const partnerChunkCopy = { ...newWorldState[partnerKey], enemy: { ...newWorldState[partnerKey].enemy!, satiation: 0 }};
                                    const birthChunkCopy = { ...newWorldState[birthKey], enemy: { ...enemyTemplate, satiation: 0, emoji: enemyTemplate.emoji }};

                                    newWorldState[creatureKey] = currentCreatureChunkCopy;
                                    newWorldState[partnerKey] = partnerChunkCopy;
                                    newWorldState[birthKey] = birthChunkCopy;
                                    
                                    worldWasModified = true;
                                    hasActed = true;
                                    break;
                                }
                            }
                        }
                    }
                    if (hasActed) break;
                }
            }
            
            if (!hasActed && enemyData.satiation < enemyData.maxSatiation) {
                for (const dir of directions) {
                    const targetPos = { x: creatureChunk.x + dir.x, y: creatureChunk.y + dir.y };
                    const targetKey = `${targetPos.x},${targetPos.y}`;
                    const targetChunk = newWorldState[targetKey];
    
                    if (targetChunk) {
                        if (targetChunk.enemy && enemyData.diet.includes(targetChunk.enemy.type)) {
                            newWorldState[creatureKey] = { ...creatureChunk, enemy: { ...enemyData, satiation: enemyData.satiation + 1 }};
                            newWorldState[targetKey] = { ...targetChunk, enemy: null };
                            worldWasModified = true;
                            hasActed = true;
                            break;
                        }
    
                        const foodItemIndex = targetChunk.items.findIndex(item => enemyData.diet.includes(item.name));
                        if (foodItemIndex > -1) {
                            const newEnemyState = { ...enemyData, satiation: enemyData.satiation + 1 };
                            
                            const newTargetItems = [...targetChunk.items];
                            newTargetItems[foodItemIndex] = { ...newTargetItems[foodItemIndex], quantity: newTargetItems[foodItemIndex].quantity - 1};

                            newWorldState[targetKey] = { ...targetChunk, enemy: newEnemyState, items: newTargetItems.filter(i => i.quantity > 0) };
                            newWorldState[creatureKey] = { ...creatureChunk, enemy: null };

                            worldWasModified = true;
                            hasActed = true;
                            break;
                        }
                    }
                }
            }
    
            if (!hasActed && Math.random() < 0.2) {
                for (const dir of directions) {
                    const newPos = { x: creatureChunk.x + dir.x, y: creatureChunk.y + dir.y };
                    const newKey = `${newPos.x},${newPos.y}`;
    
                    if (newWorldState[newKey] && !newWorldState[newKey].enemy) {
                        newWorldState[newKey] = { ...newWorldState[newKey], enemy: { ...enemyData } };
                        newWorldState[creatureKey] = { ...creatureChunk, enemy: null };
    
                        if (newPos.x === playerPosition.x && newPos.y === playerPosition.y) {
                            changes.narrativeEntries.push({ text: `Một ${enemyData.type} hung hãn đã di chuyển vào và tấn công bạn!`, type: 'system' });
                            // This direct player damage is now handled in the player stat simulation part
                        }
                        
                        worldWasModified = true;
                        hasActed = true;
                        break; 
                    }
                }
            }
        }
        
        const ITEM_ECOLOGY_CHANCE = 0.1;
        for (const key in newWorldState) {
            const chunk = newWorldState[key];
            if (!chunk.items || chunk.items.length === 0) continue;
            
            const effectiveChunk = getEffectiveChunk(chunk);
            const originalItems = chunk.items;
            const newItems: ChunkItem[] = [];
            let itemsChanged = false;

            for (const item of originalItems) {
                if (Math.random() > ITEM_ECOLOGY_CHANCE) {
                    newItems.push(item);
                    continue;
                }

                const itemDef = customItemDefinitions[item.name];
                if (!itemDef?.growthConditions) {
                    newItems.push(item);
                    continue;
                }

                const { optimal, subOptimal } = itemDef.growthConditions;
                const newItem = { ...item };
                
                if (checkConditions(optimal, effectiveChunk)) {
                    newItem.quantity = Math.min(Math.round(newItem.quantity * 1.5), 50);
                } else if (checkConditions(subOptimal, effectiveChunk)) {
                    if (Math.random() < 0.5) {
                        newItem.quantity = Math.min(Math.round(newItem.quantity * 1.5), 50);
                    }
                } else {
                    newItem.quantity -= 1;
                }
                
                if (newItem.quantity !== item.quantity) {
                    itemsChanged = true;
                }

                if (newItem.quantity > 0) {
                    newItems.push(newItem);
                }
            }

            if (itemsChanged) {
                newWorldState[key] = { ...chunk, items: newItems };
                worldWasModified = true;
            }
        }
    
        // --- PLAYER STATS SIMULATION ---
        let nextPlayerStats = {...playerStats};
        const playerChunkKey = `${playerPosition.x},${playerPosition.y}`;
        const currentPlayerChunk = newWorldState[playerChunkKey];

        if (currentPlayerChunk) {
            const effectiveChunk = getEffectiveChunk(currentPlayerChunk);
            const environmentCelsius = effectiveChunk.temperature || 15;
            
            // Define constants for clarity
            const IDEAL_BODY_TEMP = 37.0;
            const ENVIRONMENTAL_PULL_FACTOR = 0.1; // How strongly the environment affects the player
            const SELF_REGULATION_FACTOR = 0.15; // How strongly the body tries to return to ideal temp

            const tempDelta = (environmentCelsius - nextPlayerStats.bodyTemperature) * ENVIRONMENTAL_PULL_FACTOR 
                              + (IDEAL_BODY_TEMP - nextPlayerStats.bodyTemperature) * SELF_REGULATION_FACTOR;
            
            nextPlayerStats.bodyTemperature += tempDelta;

            // Apply effects based on new body temperature
            const temp = nextPlayerStats.bodyTemperature;
            if (temp < 30) {
                nextPlayerStats.hp = Math.max(0, nextPlayerStats.hp - 1); // Freezing
                changes.narrativeEntries.push({ text: t('tempDangerFreezing'), type: 'system' });
            } else if (temp < 35) {
                nextPlayerStats.stamina = Math.max(0, nextPlayerStats.stamina - 0.5); // Cold
                changes.narrativeEntries.push({ text: t('tempWarningCold'), type: 'system' });
            } else if (temp > 42) {
                nextPlayerStats.stamina = Math.max(0, nextPlayerStats.stamina - 2); // Overheating
                 changes.narrativeEntries.push({ text: t('tempDangerHot'), type: 'system' });
            } else if (temp > 40) {
                nextPlayerStats.stamina = Math.max(0, nextPlayerStats.stamina - 1); // Hot
                 changes.narrativeEntries.push({ text: t('tempWarningHot'), type: 'system' });
            }


            if (currentPlayerChunk.enemy && currentPlayerChunk.enemy.behavior === 'aggressive') {
                 changes.narrativeEntries.push({ text: `The ${currentPlayerChunk.enemy.type} attacks you!`, type: 'system' });
                 nextPlayerStats.hp = Math.max(0, nextPlayerStats.hp - currentPlayerChunk.enemy.damage);
            }
        }
        
        // --- APPLY ALL STATE CHANGES AT THE END OF THE TICK ---
        if (worldWasModified) {
            setWorld(newWorldState);
        }
        setPlayerStats(nextPlayerStats);
        setGameTicks(nextTick);

        if (changes.narrativeEntries.length > 0) {
            const uniqueNarratives = [...new Map(changes.narrativeEntries.map(item => [item.text, item])).values()];
            uniqueNarratives.forEach(entry => addNarrativeEntry(entry.text, entry.type));
        }

    }, [world, gameTicks, playerPosition, playerStats, weatherZones, currentSeason, customItemDefinitions, getEffectiveChunk, addNarrativeEntry, t]);
    

    const handleOnlineNarrative = async (action: string, worldCtx: World, playerPosCtx: {x: number, y: number}, playerStatsCtx: PlayerStatus) => {
        setIsLoading(true);
        const baseChunk = worldCtx[`${playerPosCtx.x},${playerPosCtx.y}`];
        if (!baseChunk || !finalWorldSetup) {
            setIsLoading(false);
            return;
        }

        const diceRoll = Math.floor(Math.random() * 20) + 1;
        const successLevel = getSuccessLevel(diceRoll);
        const successLevelKey = successLevelToTranslationKey[successLevel];
        addNarrativeEntry(t('diceRollMessage', { roll: diceRoll, level: t(successLevelKey) }), 'system');

        const currentChunk = getEffectiveChunk(baseChunk);

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
                diceRoll,
                successLevel,
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

            if (result.updatedPlayerStatus) {
                setPlayerStats(prev => ({ ...prev, ...result.updatedPlayerStatus }));
            }
            
            if (result.newlyGeneratedItem) {
                const newItem = result.newlyGeneratedItem;
                // This should not happen, but as a safeguard
                if (!customItemDefinitions[newItem.name]) {
                    // Silently update the game state
                    setCustomItemCatalog(prev => [...prev, newItem]);
                    setCustomItemDefinitions(prev => {
                        const newDefs = { ...prev };
                        newDefs[newItem.name] = {
                            description: newItem.description,
                            tier: newItem.tier,
                            category: newItem.category,
                            emoji: newItem.emoji,
                            effects: newItem.effects,
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
            setIsOnline(false);
        } finally {
            handleGameTick();
            setIsLoading(false);
        }
    };
    
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
            customItemCatalog
        );
        
        return { 
            worldWithChunk: result.newWorld, 
            chunk: result.newWorld[newPosKey], // Use newPosKey here
            regions: result.newRegions,
            regionCounter: result.newRegionCounter
        };
    }, [worldProfile, currentSeason, customItemDefinitions, customItemCatalog]);

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

        const travelCost = (() => {
            let cost = destinationChunk.travelCost;
            if (playerStats.persona === 'explorer') {
                cost = Math.max(1, cost - 1); // Apply Explorer persona discount
            }
            return cost;
        })();
        
        if (playerStats.stamina < travelCost) {
            toast({
                title: "Quá mệt!",
                description: "Bạn không đủ thể lực để di chuyển tới vùng đất này. Hãy nghỉ ngơi.",
                variant: "destructive",
            });
            return;
        }

        const newStamina = playerStats.stamina - travelCost;
        const newPlayerStats = { ...playerStats, stamina: newStamina };
        
        const visionRadius = 1;
        for (let dy = -visionRadius; dy <= visionRadius; dy++) {
            for (let dx = -visionRadius; dx <= visionRadius; dx++) {
                const revealPos = { x: newPos.x + dx, y: newPos.y + dy };
                const key = `${revealPos.x},${revealPos.y}`;

                if (!worldSnapshot[key]) {
                    const result = ensureChunkExists(revealPos, worldSnapshot, regionsSnapshot, regionCounterSnapshot);
                    worldSnapshot = result.worldWithChunk;
                    regionsSnapshot = result.regions;
                    regionCounterSnapshot = result.regionCounter;
                }

                if (worldSnapshot[key]) {
                    worldSnapshot[key] = { ...worldSnapshot[key], explored: true };
                }
            }
        }
        
        const newPosKey = `${newPos.x},${newPos.y}`;

        addNarrativeEntry(t('wentDirection', { direction: t(dirKey) }), 'action');
        
        setWorld(worldSnapshot);
        setRegions(regionsSnapshot);
        setRegionCounter(regionCounterSnapshot);
        setPlayerPosition(newPos);
        setPlayerStats(newPlayerStats);

        if (isOnline) {
            handleOnlineNarrative(`move ${direction}`, worldSnapshot, newPos, newPlayerStats);
        } else {
            if (worldSnapshot[newPosKey]) {
                addNarrativeEntry(worldSnapshot[newPosKey].description, 'narrative');
            }
            handleGameTick();
        }
    };

    const handleAction = (actionId: number) => {
        const chunk = world[`${playerPosition.x},${playerPosition.y}`];
        if (!chunk) return;
    
        const actionText = chunk.actions.find(a => a.id === actionId)?.text || "unknown action";
        addNarrativeEntry(actionText, 'action');

        if (isOnline) {
            handleOnlineNarrative(actionText, world, playerPosition, playerStats);
            return;
        }
        
        if (actionId === 1 && chunk.enemy) {
            addNarrativeEntry(t('observeEnemy', { npc: chunk.enemy.type }), 'narrative');
        } else if (actionId === 1 && chunk.NPCs.length > 0) {
            addNarrativeEntry(t('talkToNpc', { npc: chunk.NPCs[0] }), 'narrative');
            setPlayerStats(prev => {
                const newQuests = [...prev.quests, 'Tìm kho báu'];
                return { ...prev, quests: [...new Set(newQuests)] };
            });
            addNarrativeEntry(t('questUpdated'), "system");
        } else if (actionId === 2) {
            addNarrativeEntry(t('exploreArea'), 'narrative');
        } else if (actionId === 3 && chunk.items.length > 0) {
            const itemToPick = chunk.items[0];
            const pickupQuantity = itemToPick.quantity;

            addNarrativeEntry(t('pickupItem', { item: `${itemToPick.name} (x${pickupQuantity})` }), 'narrative');
            addNarrativeEntry(`(${itemToPick.description})`, 'system');

            setPlayerStats(prev => {
                const newItems: PlayerItem[] = JSON.parse(JSON.stringify(prev.items));
                const existingItem = newItems.find(i => i.name === itemToPick.name);
                if (existingItem) {
                    existingItem.quantity += pickupQuantity;
                } else {
                    newItems.push({ 
                        name: itemToPick.name, 
                        quantity: pickupQuantity, 
                        tier: itemToPick.tier,
                        emoji: itemToPick.emoji,
                    });
                }
                return { ...prev, items: newItems };
            });

            setWorld(prevWorld => {
                const newWorld = { ...prevWorld };
                const currentKey = `${playerPosition.x},${playerPosition.y}`;
                const newChunk: Chunk = JSON.parse(JSON.stringify(newWorld[currentKey]));
                
                newChunk.items = newChunk.items.filter(i => i.name !== itemToPick.name);
                
                newChunk.actions = newChunk.actions.filter(a => a.id !== 3);
                if (newChunk.items.length > 0) {
                    newChunk.actions.push({ id: 3, text: `Nhặt ${newChunk.items[0].name}` });
                }

                newWorld[currentKey] = newChunk;
                return newWorld;
            });
        }
        handleGameTick();
    }

    const handleAttack = () => {
        setPlayerBehaviorProfile(p => ({ ...p, attacks: p.attacks + 1 }));
        const key = `${playerPosition.x},${playerPosition.y}`;
        const baseChunk = world[key];
        if (!baseChunk || !baseChunk.enemy) {
            addNarrativeEntry("Không có gì để tấn công ở đây.", 'system');
            return;
        }
    
        const actionText = `Attack ${baseChunk.enemy.type}`;
        addNarrativeEntry(actionText, 'action');
    
        if (isOnline) {
            handleOnlineNarrative(actionText, world, playerPosition, playerStats);
            return;
        }
    
        const currentChunkWithWeather = getEffectiveChunk(baseChunk);
        const diceRoll = Math.floor(Math.random() * 20) + 1;
        const successLevel = getSuccessLevel(diceRoll);
        const successLevelKey = successLevelToTranslationKey[successLevel];
        addNarrativeEntry(t('diceRollMessage', { roll: diceRoll, level: t(successLevelKey) }), 'system');
    
        let updatedWorld = { ...world };
        let updatedChunkInWorld = { ...updatedWorld[key]! };
        let enemyInWorld = { ...updatedChunkInWorld.enemy! };
    
        let playerDamage = 0;
    
        switch (successLevel) {
            case 'CriticalFailure':
                setPlayerStats(prev => ({ ...prev, stamina: Math.max(0, prev.stamina - 5) }));
                addNarrativeEntry("Bạn tấn công một cách vụng về và mất thăng bằng, lãng phí thể lực.", 'narrative');
                break;
            case 'Failure':
                addNarrativeEntry("Bạn vung vũ khí nhưng đánh trượt mục tiêu một cách đáng tiếc.", 'narrative');
                break;
            case 'Success':
            case 'GreatSuccess':
            case 'CriticalSuccess':
                let damageMultiplier = 1.0;
                if (successLevel === 'GreatSuccess') damageMultiplier = 1.5;
                if (successLevel === 'CriticalSuccess') damageMultiplier = 2.0;
    
                let envDamageModifier = 1.0;
                if (currentChunkWithWeather.lightLevel < -3) {
                    envDamageModifier *= 0.8;
                    addNarrativeEntry("Sương mù dày đặc làm giảm độ chính xác của bạn.", "system");
                }
                if (currentChunkWithWeather.moisture > 8) {
                    envDamageModifier *= 0.9;
                    addNarrativeEntry("Mưa lớn làm vũ khí nặng trĩu, cản trở đòn tấn công.", "system");
                }
    
                let baseDamage = playerStats.attributes.physicalAttack;
                if (playerStats.persona === 'warrior') {
                    baseDamage += 2;
                }
                playerDamage = Math.round(baseDamage * damageMultiplier * envDamageModifier);
    
                let attackNarrative = `Bạn tấn công ${enemyInWorld.type}, gây ${playerDamage} sát thương.`;
                if (successLevel === 'GreatSuccess') attackNarrative = `Một đòn đánh hiểm hóc! Bạn tấn công ${enemyInWorld.type}, gây ${playerDamage} sát thương.`;
                if (successLevel === 'CriticalSuccess') attackNarrative = `Một đòn CHÍ MẠNG! Bạn tấn công ${enemyInWorld.type}, gây ${playerDamage} sát thương khủng khiếp.`;
                addNarrativeEntry(attackNarrative, 'narrative');
                break;
        }
    
        if (playerDamage > 0) {
            enemyInWorld.hp -= playerDamage;
        }
    
        if (enemyInWorld.hp <= 0) {
            addNarrativeEntry(t('enemyDefeated', { enemyType: enemyInWorld.type }), 'system');
            updatedChunkInWorld.enemy = null;
            updatedChunkInWorld.actions = updatedChunkInWorld.actions.filter(a => a.id !== 1);
            if (updatedChunkInWorld.NPCs.length > 0) {
                updatedChunkInWorld.actions.unshift({ id: 1, text: `Nói chuyện với ${updatedChunkInWorld.NPCs[0]}` });
            }
        } else {
            if (playerDamage > 0) {
                addNarrativeEntry(t('enemyHpLeft', { enemyType: enemyInWorld.type, hp: enemyInWorld.hp }), 'narrative');
            }
    
            let enemyDamageModifier = 1.0;
            if (currentChunkWithWeather.lightLevel < -3) enemyDamageModifier *= 0.8;
            if (currentChunkWithWeather.moisture > 8) enemyDamageModifier *= 0.9;
            const enemyDamage = Math.round(enemyInWorld.damage * enemyDamageModifier);
    
            setPlayerStats(prev => {
                const newHp = prev.hp - enemyDamage;
                if (enemyDamage > 0) {
                    addNarrativeEntry(t('enemyRetaliates', { enemyType: enemyInWorld.type, enemyDamage }), 'narrative');
                } else {
                    addNarrativeEntry(`Kẻ địch tấn công nhưng bị trượt do ảnh hưởng của môi trường!`, 'narrative');
                }
                if (newHp <= 0 && prev.hp > 0) {
                    addNarrativeEntry(t('youFell'), 'system');
                }
                return { ...prev, hp: newHp };
            });
            updatedChunkInWorld.enemy = enemyInWorld;
        }
    
        updatedWorld[key] = updatedChunkInWorld;
        setWorld(updatedWorld);
        handleGameTick();
    };
    
    const handleCustomAction = (text: string) => {
        if (!text.trim()) return;
        setPlayerBehaviorProfile(p => ({ ...p, customActions: p.customActions + 1 }));
        addNarrativeEntry(text, 'action');
    
        if(isOnline) {
            handleOnlineNarrative(text, world, playerPosition, playerStats);
            return;
        }
    
        const diceRoll = Math.floor(Math.random() * 20) + 1;
        const successLevel = getSuccessLevel(diceRoll);
        const successLevelKey = successLevelToTranslationKey[successLevel];
        addNarrativeEntry(t('diceRollMessage', { roll: diceRoll, level: t(successLevelKey) }), 'system');
    
        const chunk = world[`${playerPosition.x},${playerPosition.y}`];
        if (!chunk) {
            handleGameTick();
            return;
        }
    
        if (successLevel === 'Failure' || successLevel === 'CriticalFailure') {
            let failureNarrative = "Nỗ lực của bạn không mang lại kết quả gì.";
            if (chunk.moisture > 8 && Math.random() < 0.5) {
                failureNarrative = "Bạn cố gắng hành động nhưng bị trượt chân trên mặt đất ẩm ướt.";
            }
            addNarrativeEntry(failureNarrative, 'narrative');
    
            if (successLevel === 'CriticalFailure') {
                setPlayerStats(prev => ({...prev, stamina: Math.max(0, prev.stamina - 5)}));
                addNarrativeEntry("Hành động vụng về khiến bạn mất một chút thể lực.", 'system');
            }
        } else {
            const terrain = chunk.terrain;
    
            const responses: Record<string, () => string> = {
                'kiểm tra cây': () => terrain === 'forest' ? t('customActionResponses.checkTree') : t('customActionResponses.noTree'),
                'đào đất': () => terrain === 'desert' ? t('customActionResponses.dig') : t('customActionResponses.groundTooHard'),
                'gặt cỏ': () => terrain === 'grassland' ? t('customActionResponses.reapGrass') : t('customActionResponses.noGrass'),
                'nhìn xung quanh': () => t('customActionResponses.lookAround')
            };
    
            const responseFunc = responses[text.toLowerCase()];
            const response = responseFunc ? responseFunc() : t('customActionResponses.actionFailed');
            let finalResponse = response;
            let gotItem = false;
    
            if (text.toLowerCase() === 'gặt cỏ' && terrain === 'grassland') {
                 setPlayerStats(prev => {
                    const newItems = [...prev.items];
                    const hay = newItems.find(i => i.name === 'Cỏ Khô');
                    const quantityToAdd = successLevel === 'CriticalSuccess' ? 2 : 1;
                    if (hay) {
                        hay.quantity += quantityToAdd;
                    } else {
                        newItems.push({ name: 'Cỏ Khô', quantity: quantityToAdd, tier: 1, emoji: '🌿' });
                    }
                    return { ...prev, items: newItems };
                });
                gotItem = true;
            }
    
            if (successLevel === 'GreatSuccess') {
                finalResponse = `Với kỹ năng đáng ngạc nhiên, bạn đã... ${response.toLowerCase()}`;
            } else if (successLevel === 'CriticalSuccess' && gotItem) {
                finalResponse = `Thật xuất sắc! ${response} Bạn còn nhận được thêm một chút!`;
            } else if (successLevel === 'CriticalSuccess') {
                finalResponse = `Thật xuất sắc! ${response}`;
            }
    
            addNarrativeEntry(finalResponse, 'narrative');
            if (gotItem) {
                 addNarrativeEntry('Bạn đã thêm Cỏ Khô vào túi đồ.', 'system');
            }
        }
    
        handleGameTick();
    }

    const handleCraft = useCallback(async (recipe: Recipe) => {
        setPlayerBehaviorProfile(p => ({ ...p, crafts: p.crafts + 1 }));
        const { canCraft, chance, ingredientsToConsume } = calculateCraftingOutcome(playerStats.items, recipe);

        if (!canCraft) {
            toast({ title: t('error'), description: t('notEnoughIngredients'), variant: "destructive" });
            return;
        }

        let updatedItems = [...playerStats.items];
        ingredientsToConsume.forEach(itemToConsume => {
            const itemIndex = updatedItems.findIndex(i => i.name === itemToConsume.name);
            if (itemIndex > -1) {
                updatedItems[itemIndex].quantity -= itemToConsume.quantity;
            }
        });
        updatedItems = updatedItems.filter(i => i.quantity > 0);
        
        setPlayerStats(prev => ({ ...prev, items: updatedItems }));

        const roll = Math.random() * 100;

        if (roll < chance) {
            const newInventory = [...updatedItems];
            const resultItemIndex = newInventory.findIndex(i => i.name === recipe.result.name);
            const itemDef = customItemDefinitions[recipe.result.name] || staticItemDefinitions[recipe.result.name];
            
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
            addNarrativeEntry(t('craftSuccess', { itemName: recipe.result.name }), 'system');
            toast({ title: t('craftSuccessTitle'), description: t('craftSuccess', { itemName: recipe.result.name }) });

            if (isOnline && Math.random() < 0.25) { // 25% chance to generate a new recipe
                try {
                    const allGameItems = [
                        ...customItemCatalog,
                        ...Object.keys(staticItemDefinitions).map(name => {
                            const def = staticItemDefinitions[name];
                            return {
                                name,
                                description: def.description,
                                tier: def.tier,
                                category: def.category,
                                emoji: def.emoji,
                                effects: def.effects,
                                baseQuantity: def.baseQuantity,
                                spawnBiomes: [],
                                growthConditions: undefined
                            } as GeneratedItem;
                        })
                    ];

                    const newRecipe = await generateNewRecipe({
                        customItemCatalog: allGameItems,
                        existingRecipes: Object.keys(recipes),
                        language,
                    });
                    
                    if (!recipes[newRecipe.result.name]) {
                         setRecipes(prev => ({ ...prev, [newRecipe.result.name]: newRecipe as Recipe }));
                         toast({ 
                            title: t('newRecipeIdea'), 
                            description: `Bạn đã nghĩ ra cách chế tạo: ${newRecipe.result.name}!` 
                        });
                    }
                } catch (error) {
                    console.error("Lỗi khi tạo công thức mới:", error);
                }
            }

        } else {
            addNarrativeEntry(t('craftFail', { itemName: recipe.result.name }), 'system');
            toast({ title: t('craftFailTitle'), description: t('craftFail', { itemName: recipe.result.name }), variant: 'destructive' });
        }
        
        handleGameTick();
    }, [playerStats, isOnline, customItemCatalog, recipes, language, addNarrativeEntry, toast, t, handleGameTick, customItemDefinitions]);

    const handleItemUsed = useCallback((itemName: string, target: 'player' | string) => {
        const actionText = target === 'player'
            ? `use ${itemName}`
            : `use ${itemName} on ${target}`;
        addNarrativeEntry(actionText, 'action');

        if (isOnline) {
            handleOnlineNarrative(actionText, world, playerPosition, playerStats);
            return;
        }

        // --- OFFLINE ITEM USAGE LOGIC ---
        const itemIndex = playerStats.items.findIndex(i => i.name.toLowerCase() === itemName.toLowerCase());
        if (itemIndex === -1) {
            addNarrativeEntry("Bạn không có vật phẩm đó.", "system");
            return;
        }

        // Logic for using item on self
        if (target === 'player') {
            const itemDef = customItemDefinitions[itemName] || staticItemDefinitions[itemName];
            if (!itemDef || itemDef.effects.length === 0) {
                addNarrativeEntry(`${itemName} không có tác dụng gì khi sử dụng theo cách này.`, 'narrative');
                handleGameTick();
                return;
            }

            const newStatus = { ...playerStats };
            const effectDescriptions: string[] = [];
            
            itemDef.effects.forEach(effect => {
                switch (effect.type) {
                    case 'HEAL':
                        const oldHp = newStatus.hp;
                        newStatus.hp = Math.min(100, newStatus.hp + effect.amount);
                        if (newStatus.hp > oldHp) {
                            effectDescriptions.push(`hồi ${newStatus.hp - oldHp} máu`);
                        }
                        break;
                    case 'RESTORE_STAMINA':
                        const oldStamina = newStatus.stamina;
                        newStatus.stamina = Math.min(100, newStatus.stamina + effect.amount);
                        if (newStatus.stamina > oldStamina) {
                            effectDescriptions.push(`phục hồi ${newStatus.stamina - oldStamina} thể lực`);
                        }
                        break;
                }
            });
            
            if (effectDescriptions.length === 0) {
                addNarrativeEntry(`${itemName} không có hiệu quả.`, 'narrative');
                handleGameTick();
                return;
            }

            // Consume item
            const newItems = [...newStatus.items];
            newItems[itemIndex].quantity -= 1;
            newStatus.items = newItems.filter(i => i.quantity > 0);

            addNarrativeEntry(`Bạn sử dụng ${itemName}. Nó ${effectDescriptions.join(' và ')}.`, 'narrative');
            setPlayerStats(newStatus);
        }
        // Logic for using item on an enemy (taming)
        else {
            const key = `${playerPosition.x},${playerPosition.y}`;
            const enemy = world[key]?.enemy;
            if (!enemy || enemy.type !== target) {
                addNarrativeEntry(`Không có ${target} ở đây để sử dụng vật phẩm lên.`, 'narrative');
                handleGameTick();
                return;
            }

            if (!enemy.diet.includes(itemName)) {
                addNarrativeEntry(`${enemy.type} không quan tâm đến ${itemName}.`, 'narrative');
                handleGameTick();
                return;
            }
            
            // Consume the item
            const newItems = [...playerStats.items];
            newItems[itemIndex].quantity -= 1;
            const newPlayerStatus = { ...playerStats, items: newItems.filter(i => i.quantity > 0) };
            
            const newEnemyState = { ...enemy };
            newEnemyState.satiation = Math.min(newEnemyState.satiation + 1, newEnemyState.maxSatiation);

            const baseTameChance = 0.1;
            const satiationBonus = (newEnemyState.satiation / newEnemyState.maxSatiation) * 0.4;
            const healthPenalty = (newEnemyState.hp / 100) * 0.2;
            const tamingChance = baseTameChance + satiationBonus - healthPenalty;

            if (Math.random() < tamingChance) {
                const newPet: Pet = { type: enemy.type, level: 1 };
                const updatedPets = [...(newPlayerStatus.pets || []), newPet];
                
                addNarrativeEntry(`Bạn đã thuần hóa thành công ${enemy.type}!`, 'system');
                setWorld(prev => ({...prev, [key]: {...prev[key]!, enemy: null}}));
                setPlayerStats({...newPlayerStatus, pets: updatedPets});

            } else {
                addNarrativeEntry(`${enemy.type} ăn ${itemName}, nhưng vẫn còn hoang dã.`, 'narrative');
                setWorld(prev => ({...prev, [key]: {...prev[key]!, enemy: newEnemyState}}));
                setPlayerStats(newPlayerStatus);
            }
        }
        
        handleGameTick();
    }, [playerStats, world, playerPosition, isOnline, customItemDefinitions, addNarrativeEntry, handleGameTick, handleOnlineNarrative]);

    const handleUseSkill = useCallback((skillName: string) => {
        const actionText = `use skill ${skillName}`;
        addNarrativeEntry(actionText, 'action');

        if (isOnline) {
            handleOnlineNarrative(actionText, world, playerPosition, playerStats);
            return;
        }

        // --- OFFLINE SKILL USAGE LOGIC ---
        // This logic is adapted from the `useSkillTool` to provide a rich offline experience.
        const skillToUse = playerStats.skills.find(s => s.name.toLowerCase() === skillName.toLowerCase());

        if (!skillToUse) {
            addNarrativeEntry(`Bạn không biết kỹ năng: ${skillName}.`, 'system');
            return;
        }

        if (playerStats.mana < skillToUse.manaCost) {
            addNarrativeEntry(`Không đủ mana để sử dụng ${skillToUse.name}.`, 'system');
            return;
        }

        const diceRoll = Math.floor(Math.random() * 20) + 1;
        const successLevel = getSuccessLevel(diceRoll);
        addNarrativeEntry(t('diceRollMessage', { roll: diceRoll, level: t(successLevelToTranslationKey[successLevel]) }), 'system');

        const newPlayerStatus = { ...playerStats, mana: playerStats.mana - skillToUse.manaCost };
        let log = "";
        let effectMultiplier = 1.0;
        
        // This logic is a direct adaptation from the online tool
        switch (successLevel) {
            case 'CriticalFailure':
                if (skillToUse.effect.type === 'HEAL') {
                    const backfireDamage = Math.round(skillToUse.effect.amount * 0.5);
                    newPlayerStatus.hp = Math.max(0, newPlayerStatus.hp - backfireDamage);
                    log = `Kỹ năng phản tác dụng! Phép thuật chữa lành của bạn gây ra ${backfireDamage} sát thương cho chính bạn.`;
                } else if (skillToUse.effect.type === 'DAMAGE') {
                     const backfireDamage = Math.round(skillToUse.effect.amount * 0.5);
                    newPlayerStatus.hp = Math.max(0, newPlayerStatus.hp - backfireDamage);
                    log = `Kỹ năng phản tác dụng! Quả cầu lửa nổ tung trên tay bạn, gây ${backfireDamage} sát thương.`;
                }
                break;

            case 'Failure':
                log = `Năng lượng ma thuật tiêu tán! Nỗ lực sử dụng ${skillToUse.name} của bạn đã thất bại.`;
                break;

            case 'GreatSuccess':
                effectMultiplier = 1.5;
                break;
            case 'CriticalSuccess':
                effectMultiplier = 2.0;
                break;
            case 'Success':
            default:
                effectMultiplier = 1.0;
                break;
        }

        if (log) {
            addNarrativeEntry(log, 'narrative');
            setPlayerStats(newPlayerStatus);
            handleGameTick();
            return;
        }

        // Apply skill effect if not a failure
        let finalLog = "";
        let newWorld = { ...world };
        const key = `${playerPosition.x},${playerPosition.y}`;
        const enemy = newWorld[key]?.enemy;

        switch (skillToUse.effect.type) {
            case 'HEAL':
                if (skillToUse.effect.target === 'SELF') {
                    const healAmount = Math.round(skillToUse.effect.amount * effectMultiplier);
                    const oldHp = newPlayerStatus.hp;
                    newPlayerStatus.hp = Math.min(100, newPlayerStatus.hp + healAmount);
                    const healedAmount = newPlayerStatus.hp - oldHp;
                    finalLog = `Sử dụng ${skillToUse.name}, hồi ${healedAmount} máu.`;
                    if (successLevel === 'GreatSuccess') finalLog += ' Luồng năng lượng mạnh mẽ giúp bạn cảm thấy sảng khoái hơn nhiều.';
                    if (successLevel === 'CriticalSuccess') finalLog += ' Một luồng năng lượng thần thánh bao bọc lấy bạn, chữa lành vết thương một cách thần kỳ!';
                }
                break;
            case 'DAMAGE':
                if (skillToUse.effect.target === 'ENEMY') {
                    if (!enemy) {
                        finalLog = `Sử dụng ${skillToUse.name}, nhưng không có mục tiêu.`;
                    } else {
                        let newEnemy = { ...enemy };
                        const baseDamage = skillToUse.effect.amount + Math.round(newPlayerStatus.attributes.magicalAttack * 0.5);
                        const finalDamage = Math.round(baseDamage * effectMultiplier);

                        newEnemy.hp = Math.max(0, newEnemy.hp - finalDamage);
                        finalLog = `Sử dụng ${skillToUse.name}, gây ${finalDamage} sát thương phép lên ${newEnemy.type}.`;
                         if (successLevel === 'GreatSuccess') finalLog += ' Quả cầu lửa bay nhanh và chính xác hơn, gây thêm sát thương.';
                        if (successLevel === 'CriticalSuccess') finalLog = `Một đòn CHÍ MẠNG phép thuật! ${skillToUse.name} của bạn bùng nổ dữ dội, gây ${finalDamage} sát thương hủy diệt lên ${newEnemy.type}.`;

                        if (newEnemy.hp <= 0) {
                            finalLog += ` ${newEnemy.type} đã bị tiêu diệt!`;
                            newWorld[key] = { ...newWorld[key]!, enemy: null };
                        } else {
                            newWorld[key] = { ...newWorld[key]!, enemy: newEnemy };
                        }
                    }
                }
                break;
        }

        addNarrativeEntry(finalLog, 'narrative');
        setPlayerStats(newPlayerStatus);
        setWorld(newWorld);
        handleGameTick();

    }, [playerStats, addNarrativeEntry, isOnline, handleOnlineNarrative, world, playerPosition, t, handleGameTick]);

    const handleBuild = useCallback((structureName: string) => {
        const buildStaminaCost = 15;
        const structureToBuild = staticBuildableStructures[structureName];

        if (!structureToBuild || !structureToBuild.buildable) {
            toast({ title: t('error'), description: `Không thể xây dựng ${structureName}.`, variant: "destructive" });
            return;
        }

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
        let canBuild = true;
        const missingItems: string[] = [];

        for (const cost of buildCost) {
            const playerQty = inventoryMap.get(cost.name) || 0;
            if (playerQty < cost.quantity) {
                canBuild = false;
                missingItems.push(`${cost.name} (cần ${cost.quantity}, có ${playerQty})`);
            }
        }

        if (!canBuild) {
            toast({ 
                title: t('notEnoughIngredients'), 
                description: `Thiếu: ${missingItems.join(', ')}`, 
                variant: "destructive" 
            });
            return;
        }

        // Consume items and stamina
        let updatedItems = [...playerStats.items];
        for (const cost of buildCost) {
            const itemIndex = updatedItems.findIndex(i => i.name === cost.name);
            if (itemIndex > -1) {
                updatedItems[itemIndex].quantity -= cost.quantity;
            }
        }
        const finalInventory = updatedItems.filter(item => item.quantity > 0);
        setPlayerStats(prev => ({
            ...prev, 
            items: finalInventory,
            stamina: prev.stamina - buildStaminaCost,
        }));

        // Add the structure to the current chunk
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

        addNarrativeEntry(t('builtStructure', { structureName }), 'system');
        handleGameTick();
    }, [playerStats.items, playerStats.stamina, playerPosition, addNarrativeEntry, handleGameTick, toast, t]);

    const handleRest = useCallback(() => {
        const key = `${playerPosition.x},${playerPosition.y}`;
        const chunk = world[key];
        const shelter = chunk?.structures.find(s => s.restEffect);

        if (!shelter || !shelter.restEffect) {
            toast({ title: "Không thể nghỉ ngơi", description: "Bạn cần ở trong một nơi trú ẩn phù hợp." });
            return;
        }

        addNarrativeEntry(t('restInShelter', { shelterName: shelter.name }), 'action');

        if (playerStats.hp >= 100 && playerStats.stamina >= 100) {
            addNarrativeEntry(t('restNoEffect'), 'narrative');
            handleGameTick();
            return;
        }

        const { hp: hpRestore, stamina: staminaRestore } = shelter.restEffect;

        const oldHp = playerStats.hp;
        const oldStamina = playerStats.stamina;

        const newHp = Math.min(100, oldHp + hpRestore);
        const newStamina = Math.min(100, oldStamina + staminaRestore);
        
        setPlayerStats(prev => ({ ...prev, hp: newHp, stamina: newStamina, bodyTemperature: 37 }));

        const restoredParts = [];
        if (newHp > oldHp) restoredParts.push(`${newHp - oldHp} máu`);
        if (newStamina > oldStamina) restoredParts.push(`${newStamina - oldStamina} thể lực`);

        if (restoredParts.length > 0) {
            addNarrativeEntry(t('restSuccess', { restoration: restoredParts.join(' và ') }), 'system');
            addNarrativeEntry(t('restSuccessTemp'), 'system');
        }

        handleGameTick();
    }, [world, playerPosition, playerStats, addNarrativeEntry, handleGameTick, t, toast]);

    return {
        // State
        world,
        recipes,
        buildableStructures,
        playerStats,
        playerPosition,
        narrativeLog,
        isLoading,
        finalWorldSetup,
        customItemDefinitions,

        // Actions
        handleMove,
        handleAttack,
        handleAction,
        handleCustomAction,
        handleCraft,
        handleBuild,
        handleItemUsed,
        handleUseSkill,
        handleRest,
    }
}
