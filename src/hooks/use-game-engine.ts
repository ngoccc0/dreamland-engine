
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/language-context";
import { generateNarrative, type GenerateNarrativeInput } from "@/ai/flows/generate-narrative-flow";
import { generateRegion, getValidAdjacentTerrains, weightedRandom, generateWeatherForZone, checkConditions, calculateCraftingOutcome } from '@/lib/game/engine';
import { itemDefinitions as staticItemDefinitions } from '@/lib/game/items';
import { skillDefinitions } from '@/lib/game/skills';
import { templates } from '@/lib/game/templates';
import { worldConfig } from '@/lib/game/world-config';
import type { GameState, World, PlayerStatus, NarrativeEntry, Chunk, Season, WorldProfile, Region, Terrain, PlayerItem, ChunkItem, ItemDefinition, GeneratedItem, WeatherZone, Recipe, WorldConcept, Skill } from "@/lib/game/types";
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
    const [regions, setRegions] = useState<{ [id: number]: Region }>(initialGameState?.regions || {});
    const [regionCounter, setRegionCounter] = useState<number>(initialGameState?.regionCounter || 0);
    const [playerPosition, setPlayerPosition] = useState(initialGameState?.playerPosition || { x: 0, y: 0 });
    const [playerStats, setPlayerStats] = useState<PlayerStatus>(
        initialGameState?.playerStats || {
            hp: 100,
            mana: 50,
            stamina: 100,
            items: worldSetup?.playerInventory || [],
            quests: worldSetup?.initialQuests || [],
            skills: worldSetup?.startingSkill ? [worldSetup.startingSkill] : [], // Start with only the chosen skill for new games. Fallback to empty for old saves.
            pets: [],
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
    
    const getEffectiveChunk = useCallback((baseChunk: Chunk): Chunk => {
        if (!baseChunk?.regionId || !weatherZones[baseChunk.regionId]) {
             return baseChunk;
        }

        const weatherZone = weatherZones[baseChunk.regionId];
        const weather = weatherZone.currentWeather;
        const effectiveChunk: Chunk = JSON.parse(JSON.stringify(baseChunk)); // Deep copy

        effectiveChunk.temperature = clamp((baseChunk.temperature ?? 5) + weather.temperature_delta, 0, 10);
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
            regions,
            regionCounter,
            playerPosition,
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
        regions,
        regionCounter,
        playerPosition,
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
        setGameTicks(nextTick);
    
        let newWorldState = { ...world };
        let worldWasModified = false;
        const changes = {
            playerHpChange: 0,
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
                                    const birthChunkCopy = { ...newWorldState[birthKey], enemy: { ...enemyTemplate, satiation: 0 }};

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
                            changes.playerHpChange -= enemyData.damage;
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
    
        if (worldWasModified) {
            setWorld(newWorldState);
        }
    
        if (changes.playerHpChange !== 0) {
            setPlayerStats(prev => {
                const newHp = prev.hp + changes.playerHpChange;
                if (newHp <= 0 && prev.hp > 0) {
                    changes.narrativeEntries.push({ text: t('youFell'), type: 'system' });
                }
                return { ...prev, hp: Math.max(0, newHp) };
            });
        }
    
        if (changes.narrativeEntries.length > 0) {
            changes.narrativeEntries.forEach(entry => addNarrativeEntry(entry.text, entry.type));
        }
    }, [world, gameTicks, weatherZones, currentSeason, customItemDefinitions, getEffectiveChunk, addNarrativeEntry, t, playerPosition]);
    

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

        const travelCost = destinationChunk.travelCost;
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
                    newItems.push({ name: itemToPick.name, quantity: pickupQuantity, tier: itemToPick.tier });
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
    
                playerDamage = Math.round(playerStats.attributes.physicalAttack * damageMultiplier * envDamageModifier);
    
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
                        newItems.push({ name: 'Cỏ Khô', quantity: quantityToAdd, tier: 1 });
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

    const handleCraft = useCallback((recipe: Recipe) => {
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
            const itemDef = customItemDefinitions[recipe.result.name];
            
            if (resultItemIndex > -1) {
                newInventory[resultItemIndex].quantity += recipe.result.quantity;
            } else {
                newInventory.push({
                    name: recipe.result.name,
                    quantity: recipe.result.quantity,
                    tier: itemDef?.tier || 1
                });
            }
            setPlayerStats(prev => ({ ...prev, items: newInventory }));
            addNarrativeEntry(t('craftSuccess', { itemName: recipe.result.name }), 'system');
            toast({ title: t('craftSuccessTitle'), description: t('craftSuccess', { itemName: recipe.result.name }) });
        } else {
            addNarrativeEntry(t('craftFail', { itemName: recipe.result.name }), 'system');
            toast({ title: t('craftFailTitle'), description: t('craftFail', { itemName: recipe.result.name }), variant: 'destructive' });
        }
        
        handleGameTick();
    }, [playerStats.items, customItemDefinitions, addNarrativeEntry, toast, t, handleGameTick]);

    const handleItemUsed = useCallback((itemName: string, target: 'player' | string) => {
        const actionText = target === 'player'
            ? `use ${itemName}`
            : `use ${itemName} on ${target}`;
        
        handleCustomAction(actionText);
    }, [handleCustomAction]);

    const handleUseSkill = useCallback((skillName: string) => {
        const actionText = `use skill ${skillName}`;
        handleCustomAction(actionText);
    }, [handleCustomAction]);

    return {
        // State
        world,
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
        handleItemUsed,
        handleUseSkill,
    }
}
