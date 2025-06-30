"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Minimap } from "@/components/game/minimap";
import { StatusPopup } from "@/components/game/status-popup";
import { InventoryPopup } from "@/components/game/inventory-popup";
import { FullMapPopup } from "@/components/game/full-map-popup";
import { CraftingPopup } from "@/components/game/crafting-popup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Backpack, Shield, Cpu, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Hammer } from "lucide-react";
import type { WorldConcept } from "@/ai/flows/generate-world-setup";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/context/language-context";
import { SwordIcon } from "@/components/game/icons";

// Import AI flow
import { generateNarrative, type GenerateNarrativeInput } from "@/ai/flows/generate-narrative-flow";

// Import modularized game engine components
import { generateRegion, getValidAdjacentTerrains, weightedRandom, generateWeatherForZone, checkConditions } from '@/lib/game/engine';
import { worldConfig, templates, itemDefinitions as staticItemDefinitions } from '@/lib/game/config';
import { recipes } from "@/lib/game/recipes";
import type { World, PlayerStatus, NarrativeEntry, MapCell, Chunk, Season, WorldProfile, Region, GameState, Terrain, PlayerItem, ChunkItem, ItemDefinition, GeneratedItem, WeatherZone, Recipe, RecipeIngredient } from "@/lib/game/types";
import { cn } from "@/lib/utils";
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

interface GameLayoutProps {
    worldSetup?: Omit<WorldConcept, 'playerInventory' | 'customItemCatalog'> & { playerInventory: PlayerItem[] };
    initialGameState?: GameState;
    customItemDefinitions?: Record<string, ItemDefinition>;
    customItemCatalog?: GeneratedItem[];
}

export default function GameLayout({ worldSetup, initialGameState, customItemDefinitions: initialCustomDefs, customItemCatalog: initialCustomCatalog }: GameLayoutProps) {
    const { t, language } = useLanguage();
    
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
            attributes: {
                physicalAttack: 10,
                magicalAttack: 5,
                critChance: 5,
                attackSpeed: 1.0,
                cooldownReduction: 0,
            }
        }
    );
    // The full definition of all items (static + custom) for use by tools
    const [customItemDefinitions, setCustomItemDefinitions] = useState<Record<string, ItemDefinition>>(initialGameState?.customItemDefinitions || initialCustomDefs || staticItemDefinitions);
    // The catalog of AI-generated items for spawning purposes
    const [customItemCatalog, setCustomItemCatalog] = useState<GeneratedItem[]>(initialGameState?.customItemCatalog || initialCustomCatalog || []);

    
    const [isStatusOpen, setStatusOpen] = useState(false);
    const [isInventoryOpen, setInventoryOpen] = useState(false);
    const [isCraftingOpen, setCraftingOpen] = useState(false);
    const [isFullMapOpen, setIsFullMapOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [narrativeLog, setNarrativeLog] = useState<NarrativeEntry[]>(initialGameState?.narrativeLog || []);
    const [inputValue, setInputValue] = useState("");
    const { toast } = useToast();
    const narrativeIdCounter = useRef(1);
    const pageEndRef = useRef<HTMLDivElement>(null);
    const desktopButtonSize = "h-[60px] w-[60px]";
    
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
    
    /**
     * Calculates the effective state of a chunk by applying dynamic weather effects.
     * @param baseChunk The base chunk data from the world state.
     * @returns A new chunk object with weather effects applied.
     */
    const getEffectiveChunk = useCallback((baseChunk: Chunk): Chunk => {
        if (!baseChunk?.regionId || !weatherZones[baseChunk.regionId]) {
             return baseChunk;
        }

        const weatherZone = weatherZones[baseChunk.regionId];
        const weather = weatherZone.currentWeather;
        const effectiveChunk: Chunk = JSON.parse(JSON.stringify(baseChunk)); // Deep copy

        // Apply weather deltas
        effectiveChunk.temperature = clamp((baseChunk.temperature ?? 5) + weather.temperature_delta, 0, 10);
        effectiveChunk.moisture = clamp(baseChunk.moisture + weather.moisture_delta, 0, 10);
        effectiveChunk.windLevel = clamp((baseChunk.windLevel ?? 3) + weather.wind_delta, 0, 10);
        effectiveChunk.lightLevel = clamp(baseChunk.lightLevel + weather.light_delta, -10, 10);

        return effectiveChunk;
    }, [weatherZones]);

    // Initial setup effect
    useEffect(() => {
        // If we are loading a game, the state is already initialized.
        // We just need to set the narrative counter correctly.
        if (initialGameState) {
            if (narrativeLog.length > 0) {
                narrativeIdCounter.current = Math.max(...narrativeLog.map(e => e.id)) + 1;
            }
            return;
        };

        // This part only runs for a NEW game
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
                customItemDefinitions, // Pass definitions
                customItemCatalog      // Pass catalog
            );
            
            const startKey = `${startPos.x},${startPos.y}`;
            if (newWorld[startKey]) {
                newWorld[startKey].explored = true;
                addNarrativeEntry(newWorld[startKey].description, 'narrative');
            }

            // --- Initialize Weather Zones ---
            const initialWeatherZones: { [zoneId: string]: WeatherZone } = {};
            let currentTick = 0; // Start at tick 0
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
    }, [worldSetup, initialGameState]); // This effect should only run once on initialization

    // Game state saving effect
    useEffect(() => {
        // Don't save if the world hasn't been generated yet
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
            // Optionally, inform the user that saving has failed
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


    useEffect(() => {
        // Scroll to the bottom of the page to show the latest narrative entry
        // Use a timeout to ensure the DOM has updated before scrolling
        const timer = setTimeout(() => {
            pageEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        return () => clearTimeout(timer);
    }, [narrativeLog]);

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
            customItemDefinitions, // Pass definitions
            customItemCatalog      // Pass catalog
        );
        
        return { 
            worldWithChunk: result.newWorld, 
            chunk: result.newWorld[newPosKey],
            regions: result.newRegions,
            regionCounter: result.newRegionCounter
        };
    }, [worldProfile, currentSeason, customItemDefinitions, customItemCatalog]);
    
    // Proactively generate the world around the player after they move.
    useEffect(() => {
        // This effect is intentionally dependent only on playerPosition to prevent infinite loops,
        // as it modifies the other state variables (world, regions, etc.).
        // We run this in a timeout to avoid blocking the UI thread immediately after a move.
        const generationTimer = setTimeout(() => {
            let worldSnapshot = world;
            let regionsSnapshot = regions;
            let regionCounterSnapshot = regionCounter;
            let needsUpdate = false;
    
            const generationRadius = 10;
            for (let dx = -generationRadius; dx <= generationRadius; dx++) {
                for (let dy = -generationRadius; dy <= generationRadius; dy++) {
                    const pos = { x: playerPosition.x + dx, y: playerPosition.y + dy };
                    const key = `${pos.x},${pos.y}`;
    
                    if (!worldSnapshot[key]) {
                        const validTerrains = getValidAdjacentTerrains(pos, worldSnapshot);
                        if (validTerrains.length === 0) continue; // Safeguard
                        
                        const terrainProbs = validTerrains.map(t => [t, worldConfig[t].spreadWeight] as [Terrain, number]);
                        const newTerrain = weightedRandom(terrainProbs);
                        
                        const result = generateRegion(
                            pos, 
                            newTerrain, 
                            worldSnapshot, 
                            regionsSnapshot, 
                            regionCounterSnapshot,
                            worldProfile,
                            currentSeason,
                            customItemDefinitions,
                            customItemCatalog
                        );
                        
                        worldSnapshot = result.newWorld;
                        regionsSnapshot = result.newRegions;
                        regionCounterSnapshot = result.newRegionCounter;
                        needsUpdate = true;
                    }
                }
            }
            
            if (needsUpdate) {
                setWorld(worldSnapshot);
                setRegions(regionsSnapshot);
                setRegionCounter(regionCounterSnapshot);
            }
        }, 100);
    
        return () => clearTimeout(generationTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playerPosition]);

    const handleGameTick = useCallback(() => {
        const nextTick = gameTicks + 1;
        setGameTicks(nextTick);
    
        let newWorldState = { ...world }; // Create a shallow copy to modify
        let worldWasModified = false;
        const changes = {
            playerHpChange: 0,
            narrativeEntries: [] as { text: string; type: NarrativeEntry['type'] }[],
        };
    
        // --- WEATHER SYSTEM TICK ---
        const newWeatherZones = { ...weatherZones };
        let weatherHasChanged = false;
        for (const zoneId in newWeatherZones) {
            const zone = { ...newWeatherZones[zoneId] }; // Ensure zone is a copy
            if (nextTick >= zone.nextChangeTime) {
                const newWeather = generateWeatherForZone(zone.terrain, currentSeason, zone.currentWeather);
                zone.currentWeather = newWeather;
                zone.nextChangeTime = nextTick + getRandomInRange({min: newWeather.duration_range[0], max: newWeather.duration_range[1]});
                changes.narrativeEntries.push({ text: newWeather.description, type: 'system'});
                newWeatherZones[zoneId] = zone; // Assign the modified copy back
                weatherHasChanged = true;
            }
        }
        if (weatherHasChanged) {
            setWeatherZones(newWeatherZones);
        }
    
        // --- CREATURE ECOLOGY TICK ---
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
                                    // Make copies before modifying
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
        
        // --- PLANT & ITEM ECOLOGY TICK ---
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

        // --- NEW DICE ROLL LOGIC ---
        const diceRoll = Math.floor(Math.random() * 20) + 1;
        const successLevel = getSuccessLevel(diceRoll);
        const successLevelKey = successLevelToTranslationKey[successLevel];
        addNarrativeEntry(t('diceRollMessage', { roll: diceRoll, level: t(successLevelKey) }), 'system');

        // Apply dynamic weather effects to the chunk before sending to the AI
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

            // Apply updates from AI
            setWorld(prevWorld => {
                const updatedWorld = { ...prevWorld };
                const key = `${currentChunk.x},${currentChunk.y}`;
                if (result.updatedChunk) {
                    const chunkToUpdate = updatedWorld[key];
                    // Ensure enemy object is fully formed if partially updated
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
            setIsOnline(false); // Fallback to offline mode
        } finally {
            handleGameTick();
            setIsLoading(false);
        }
    };
    
    const handleMove = (direction: "north" | "south" | "east" | "west") => {
        let newPos = { ...playerPosition };
        let dirKey: 'directionNorth' | 'directionSouth' | 'directionEast' | 'directionWest' = 'directionNorth';
        if (direction === 'north') { newPos.y++; dirKey = 'directionNorth'; }
        else if (direction === 'south') { newPos.y--; dirKey = 'directionSouth'; }
        else if (direction === 'east') { newPos.x++; dirKey = 'directionEast'; }
        else if (direction === 'west') { newPos.x--; dirKey = 'directionWest'; }

        // Create snapshots of the state to update
        let worldSnapshot = { ...world };
        let regionsSnapshot = { ...regions };
        let regionCounterSnapshot = regionCounter;
        
        // Ensure destination chunk exists to check for travel cost
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
        
        // --- REVEAL 3x3 VISION ---
        const visionRadius = 1;
        for (let dy = -visionRadius; dy <= visionRadius; dy++) {
            for (let dx = -visionRadius; dx <= visionRadius; dx++) {
                const revealPos = { x: newPos.x + dx, y: newPos.y + dy };
                const key = `${revealPos.x},${revealPos.y}`;

                // Ensure chunk exists, updating our snapshots
                const result = ensureChunkExists(revealPos, worldSnapshot, regionsSnapshot, regionCounterSnapshot);
                worldSnapshot = result.worldWithChunk;
                regionsSnapshot = result.regions;
                regionCounterSnapshot = result.regionCounter;

                // Mark the chunk as explored
                if (worldSnapshot[key]) {
                    worldSnapshot[key] = { ...worldSnapshot[key], explored: true };
                }
            }
        }
        
        const newPosKey = `${newPos.x},${newPos.y}`;

        addNarrativeEntry(t('wentDirection', { direction: t(dirKey) }), 'action');
        
        // Apply all state updates at once
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
        
        // --- OFFLINE LOGIC ---
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

            // Update Player Inventory
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

            // Update Chunk Items and Actions
            setWorld(prevWorld => {
                const newWorld = { ...prevWorld };
                const currentKey = `${playerPosition.x},${playerPosition.y}`;
                const newChunk: Chunk = JSON.parse(JSON.stringify(newWorld[currentKey]));
                
                // Remove the picked up item stack
                newChunk.items = newChunk.items.filter(i => i.name !== itemToPick.name);
                
                // Re-generate actions based on remaining items
                newChunk.actions = newChunk.actions.filter(a => a.id !== 3);
                if (newChunk.items.length > 0) {
                    // This creates a new pickup action for the *next* item in the list
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
    
        // --- OFFLINE LOGIC ---
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
        setInputValue("");
    
        if(isOnline) {
            handleOnlineNarrative(text, world, playerPosition, playerStats);
            return;
        }
    
        // --- OFFLINE LOGIC ---
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

    const getPossibleItemsForIngredient = (ingredient: RecipeIngredient): { name: string, tier: 1 | 2 | 3}[] => {
        const options = [{ name: ingredient.name, tier: 1 as const }];
        if (ingredient.alternatives) {
            options.push(...ingredient.alternatives);
        }
        return options.sort((a, b) => (a.tier || 1) - (b.tier || 1)); // Sort by best tier first
    };

    const handleCraft = useCallback((recipe: Recipe) => {
        // For now, crafting is always successful if ingredients are available.
        // The probabilistic system will be added in a future update.
        const itemsToConsume: { name: string, quantity: number }[] = [];
        const tempPlayerItems = new Map(playerStats.items.map(item => [item.name, item.quantity]));
        let canCraft = true;

        for (const ing of recipe.ingredients) {
            let foundItemForIngredient: string | null = null;
            const possibleItems = getPossibleItemsForIngredient(ing);
            
            for (const possibleItem of possibleItems) {
                 if ((tempPlayerItems.get(possibleItem.name) || 0) >= ing.quantity) {
                    foundItemForIngredient = possibleItem.name;
                    break;
                }
            }

            if (foundItemForIngredient) {
                const existing = itemsToConsume.find(i => i.name === foundItemForIngredient);
                if (existing) {
                    existing.quantity += ing.quantity;
                } else {
                    itemsToConsume.push({ name: foundItemForIngredient, quantity: ing.quantity });
                }
                tempPlayerItems.set(foundItemForIngredient, tempPlayerItems.get(foundItemForIngredient)! - ing.quantity);
            } else {
                canCraft = false;
                break;
            }
        }

        if (!canCraft) {
            toast({ title: t('error'), description: t('notEnoughIngredients'), variant: "destructive" });
            return;
        }

        // 2. Remove consumed ingredients from player's inventory
        let updatedItems = [...playerStats.items];
        itemsToConsume.forEach(itemToConsume => {
            const itemIndex = updatedItems.findIndex(i => i.name === itemToConsume.name);
            if (itemIndex > -1) {
                updatedItems[itemIndex].quantity -= itemToConsume.quantity;
            }
        });
        updatedItems = updatedItems.filter(i => i.quantity > 0);

        // 3. Add the crafted item
        const resultItem = updatedItems.find(i => i.name === recipe.result.name);
        const itemDef = customItemDefinitions[recipe.result.name];
        if (resultItem) {
            resultItem.quantity += recipe.result.quantity;
        } else {
            updatedItems.push({
                name: recipe.result.name,
                quantity: recipe.result.quantity,
                tier: itemDef?.tier || 1
            });
        }

        // 4. Update state and give feedback
        setPlayerStats(prev => ({ ...prev, items: updatedItems }));
        addNarrativeEntry(t('craftSuccess', { itemName: recipe.result.name }), 'system');
        toast({ title: t('craftSuccessTitle'), description: t('craftSuccess', { itemName: recipe.result.name }) });
        handleGameTick();
    }, [playerStats.items, customItemDefinitions, addNarrativeEntry, toast, t, handleGameTick]);


    const generateMapGrid = useCallback((): MapCell[][] => {
        const radius = 2; // This creates a 5x5 grid
        const size = radius * 2 + 1;
        const grid: MapCell[][] = [];

        for (let gy = 0; gy < size; gy++) {
            const row: MapCell[] = [];
            for (let gx = 0; gx < size; gx++) {
                const wx = playerPosition.x - radius + gx;
                const wy = playerPosition.y + radius - gy;
                const chunkKey = `${wx},${wy}`;
                const chunk = world[chunkKey];
    
                // If the chunk has been explored, show its details
                if (chunk && chunk.explored) { 
                    row.push({
                        biome: chunk.terrain,
                        hasEnemy: !!chunk.enemy,
                        hasPlayer: false,
                        hasNpc: chunk.NPCs.length > 0,
                        hasItem: chunk.items.length > 0,
                    });
                } else {
                    // Otherwise, show a gray, 'empty' cell for the fog of war
                    row.push({
                        biome: 'empty',
                        hasEnemy: false,
                        hasPlayer: false,
                        hasNpc: false,
                        hasItem: false,
                    });
                }
            }
            grid.push(row);
        }
        
        // Mark the player's current position in the center of the grid
        const center = radius;
        if(grid[center]?.[center]) {
            grid[center][center].hasPlayer = true;
        }
        
        return grid;
    }, [world, playerPosition.x, playerPosition.y]);
    
    const currentChunk = world[`${playerPosition.x},${playerPosition.y}`];

    if (!finalWorldSetup) {
        return (
            <div className="flex items-center justify-center min-h-dvh bg-background">
                <p className="text-foreground text-destructive">Error: Game data is missing or corrupted.</p>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="flex flex-col md:flex-row min-h-dvh bg-background text-foreground font-body">
                {/* Left Panel: Narrative */}
                <div className="w-full md:w-[70%] flex flex-col">
                    <header className="p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                        <h1 className="text-2xl font-bold font-headline">{finalWorldSetup.worldName}</h1>
                    </header>

                    <main className="flex-grow p-4 md:p-6 overflow-y-auto">
                        <div className="prose prose-stone dark:prose-invert max-w-none">
                            {narrativeLog.map((entry) => (
                                <p key={entry.id} className={`animate-in fade-in duration-500 ${entry.type === 'action' ? 'italic text-accent-foreground/80' : ''} ${entry.type === 'system' ? 'font-semibold text-accent' : ''}`}>
                                    {entry.text}
                                </p>
                            ))}
                            {isLoading && (
                                <div className="flex items-center gap-2 text-muted-foreground italic mt-4">
                                    <Cpu className="h-4 w-4 animate-pulse" />
                                    <p>{isOnline ? "AI is thinking..." : "Loading..."}</p>
                                </div>
                            )}
                        </div>
                         <div ref={pageEndRef} />
                    </main>
                </div>

                {/* Right Panel: Controls & Actions */}
                <aside className="w-full md:w-[30%] bg-card border-l p-4 md:p-6 flex flex-col gap-6">
                    <div className="flex-shrink-0">
                        <Minimap grid={generateMapGrid()} onTitleClick={() => setIsFullMapOpen(true)} playerPosition={playerPosition} />
                    </div>
                    
                    {/* UNIFIED CONTROLS SECTION */}
                    <div className="flex flex-col items-center gap-4 w-full">
                        <h3 className="text-lg font-headline font-semibold text-center text-foreground/80">{t('moveAndAttack')}</h3>
                        
                        {/* Mobile Layout */}
                        <div className="md:hidden w-full flex flex-col items-center space-y-2">
                             <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
                                <Button variant="outline" onClick={() => setStatusOpen(true)} className="w-full justify-center text-xs px-2">
                                    <Shield className="mr-1 h-4 w-4"/> <span>{t('status')}</span>
                                </Button>
                                <Button variant="outline" onClick={() => setInventoryOpen(true)} className="w-full justify-center text-xs px-2">
                                    <Backpack className="mr-1 h-4 w-4"/> <span>{t('inventory')}</span>
                                </Button>
                                <Button variant="outline" onClick={() => setCraftingOpen(true)} className="w-full justify-center text-xs px-2">
                                    <Hammer className="mr-1 h-4 w-4"/> <span>{t('crafting')}</span>
                                </Button>
                            </div>
                            <Button variant="accent" className="w-full max-w-xs justify-center" onClick={() => handleMove("north")}>
                                <ArrowUp className="mr-2" /> {t('moveUp')}
                            </Button>
                            <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
                                <Button variant="accent" className="justify-center" onClick={() => handleMove("west")}>
                                    <ArrowLeft className="mr-2" /> {t('moveLeft')}
                                </Button>
                                <Button variant="destructive" onClick={handleAttack} aria-label="Attack">
                                    <SwordIcon />
                                </Button>
                                <Button variant="accent" className="justify-center" onClick={() => handleMove("east")}>
                                    {t('moveRight')} <ArrowRight className="ml-2" />
                                </Button>
                            </div>
                            <Button variant="accent" className="w-full max-w-xs justify-center" onClick={() => handleMove("south")}>
                                <ArrowDown className="mr-2" /> {t('moveDown')}
                            </Button>
                        </div>

                        {/* Desktop Layout (with Tooltips) */}
                        <div className="hidden md:grid grid-cols-3 grid-rows-3 gap-2 w-fit">
                            <div className="col-start-1 row-start-1 flex justify-center items-center">
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" className={desktopButtonSize} onClick={() => setStatusOpen(true)} aria-label="Player Status">
                                    <Shield />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('statusTooltip')}</p></TooltipContent>
                                </Tooltip>
                            </div>

                            <div className="col-start-2 row-start-1 flex justify-center items-center">
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="accent" className={desktopButtonSize} onClick={() => handleMove("north")} aria-label="Move North">
                                    <ArrowUp />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('moveNorthTooltip')}</p></TooltipContent>
                                </Tooltip>
                            </div>

                            <div className="col-start-3 row-start-1 flex justify-center items-center">
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" className={desktopButtonSize} onClick={() => setInventoryOpen(true)} aria-label="Inventory">
                                    <Backpack />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('inventoryTooltip')}</p></TooltipContent>
                                </Tooltip>
                            </div>

                            <div className="col-start-1 row-start-2 flex justify-center items-center">
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="accent" className={desktopButtonSize} onClick={() => handleMove("west")} aria-label="Move West">
                                    <ArrowLeft />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('moveWestTooltip')}</p></TooltipContent>
                                </Tooltip>
                            </div>
                            
                            <div className="col-start-2 row-start-2 flex justify-center items-center">
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="destructive" className={desktopButtonSize} onClick={handleAttack} aria-label="Attack">
                                    <SwordIcon />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('attackTooltip')}</p></TooltipContent>
                                </Tooltip>
                            </div>

                            <div className="col-start-3 row-start-2 flex justify-center items-center">
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="accent" className={desktopButtonSize} onClick={() => handleMove("east")} aria-label="Move East">
                                    <ArrowRight />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('moveEastTooltip')}</p></TooltipContent>
                                </Tooltip>
                            </div>

                             <div className="col-start-1 row-start-3 flex justify-center items-center">
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" className={desktopButtonSize} onClick={() => setCraftingOpen(true)} aria-label="Crafting">
                                    <Hammer />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('craftingTooltip')}</p></TooltipContent>
                                </Tooltip>
                            </div>

                            <div className="col-start-2 row-start-3 flex justify-center items-center">
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="accent" className={desktopButtonSize} onClick={() => handleMove("south")} aria-label="Move South">
                                    <ArrowDown />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('moveSouthTooltip')}</p></TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                    
                    <Separator className="flex-shrink-0" />
                    
                    <div className="space-y-4 flex-grow flex flex-col">
                        <h2 className="font-headline text-lg font-semibold text-center text-foreground/80 flex-shrink-0">{t('availableActions')}</h2>
                        <div className="space-y-2 overflow-y-auto flex-grow">
                            {currentChunk?.actions.map(action => (
                                <Tooltip key={action.id}>
                                    <TooltipTrigger asChild>
                                        <Button variant="secondary" className="w-full justify-center" onClick={() => handleAction(action.id)} disabled={isLoading}>
                                            {action.text}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{action.text}</p></TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                        <div className="flex flex-col gap-2 mt-4 flex-shrink-0">
                            <Input 
                                placeholder={t('customActionPlaceholder')}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCustomAction(inputValue)}
                                disabled={isLoading}
                            />
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="accent" onClick={() => handleCustomAction(inputValue)} disabled={isLoading}>{t('submit')}</Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('submitTooltip')}</p></TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                </aside>
                
                <StatusPopup open={isStatusOpen} onOpenChange={setStatusOpen} stats={playerStats} />
                <InventoryPopup open={isInventoryOpen} onOpenChange={setInventoryOpen} items={playerStats.items} itemDefinitions={customItemDefinitions} />
                <CraftingPopup open={isCraftingOpen} onOpenChange={setCraftingOpen} playerItems={playerStats.items} onCraft={handleCraft} />
                <FullMapPopup open={isFullMapOpen} onOpenChange={setIsFullMapOpen} world={world} playerPosition={playerPosition} />
            </div>
        </TooltipProvider>
    );
}
