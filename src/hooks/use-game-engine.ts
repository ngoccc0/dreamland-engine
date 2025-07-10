
"use client";

import { useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/language-context";
import { useSettings } from "@/context/settings-context";
import { useAuth } from "@/context/auth-context";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase-config";

import { generateJournalEntry } from "@/ai/flows/generate-journal-entry";

import { useGameState } from "./use-game-state";
import { useGameActions } from "./use-game-actions";

import { generateWeatherForZone } from "@/lib/game/engine";
import { skillDefinitions } from '@/lib/game/skills';
import { seasonConfig, worldConfig } from '@/lib/game/world-config';
import { clamp } from "@/lib/utils";
import { randomEvents } from "@/lib/game/events";

import type { GameState, World, PlayerStatus, NarrativeEntry, Chunk, Region, PlayerItem, ItemDefinition, GeneratedItem, WeatherZone, Recipe, WorldConcept, Skill, PlayerBehaviorProfile, Structure, Pet, ItemEffect, Terrain, PlayerPersona, EquipmentSlot, NarrativeLength, Action, PlayerAttributes } from "@/lib/game/types";
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
    const { settings, setSettings } = useSettings();
    const { toast } = useToast();
    const { user } = useAuth();
    
    const gameState = useGameState(props);

    const {
        isLoaded,
        worldProfile,
        currentSeason,
        gameTime, setGameTime,
        day, setDay,
        turn, setTurn,
        weatherZones, setWeatherZones,
        world, setWorld,
        playerBehaviorProfile, setPlayerBehaviorProfile,
        playerStats, setPlayerStats,
        customItemDefinitions,
        isLoading,
        isGameOver, setIsGameOver,
        isSaving, setIsSaving,
        narrativeLog, setNarrativeLog,
        currentChunk, setCurrentChunk,
        finalWorldSetup,
    } = gameState;

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
    
        const { roll } = require('@/lib/game/dice').rollDice('d20');
        const successLevel: SuccessLevel = require('@/lib/game/dice').getSuccessLevel(roll, 'd20');
    
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
                const templates = require('@/lib/game/templates').getTemplates(language);
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
            if (chunk.terrain !== 'wall' && chunk.terrain !== 'ocean') { // Exclude non-growing terrains
                const itemDefsToSimulate = Object.values(customItemDefinitions).filter(def => def.naturalSpawn && def.naturalSpawn.some(s => s.biome === chunk.terrain));
                for (const itemDef of itemDefsToSimulate) {
                    const spawnRule = itemDef.naturalSpawn!.find(s => s.biome === chunk.terrain)!;
                    const existingItem = chunk.items.find(i => i.name === itemDef.name);
                    const growthChance = spawnRule.chance / 5; // Slower regrowth

                    if (Math.random() < growthChance && require('@/lib/game/engine').checkConditions(spawnRule.conditions || {}, getEffectiveChunk(chunk))) {
                        worldWasModified = true;
                        if (existingItem) {
                            existingItem.quantity = Math.min(existingItem.quantity + 1, itemDef.baseQuantity.max * 2);
                        } else {
                            chunk.items.push({
                                name: itemDef.name,
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
                        if (foodDef && (foodDef.category === 'Food' || (foodDef.naturalSpawn && foodDef.naturalSpawn.length > 0))) {
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
    
    // --- ACTIONS ---
    const gameActions = useGameActions({
        ...gameState,
        addNarrativeEntry,
        advanceGameTime,
        getEffectiveChunk
    });
    
    // --- EFFECTS ---

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
                    title: t('skillUnlockedTitle') as TranslationKey,
                    description: t('skillUnlockedDesc', { skillName })
                });
            });
        }
    }, [isLoaded, playerStats.unlockProgress, playerStats.skills, setPlayerStats, addNarrativeEntry, t, toast]);

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
            addNarrativeEntry(t(messageKey as TranslationKey), 'system');
            toast({ title: t('personaUnlockedTitle') as TranslationKey, description: t(messageKey as TranslationKey) });
        }
    }, [isLoaded, playerBehaviorProfile, playerStats.persona, setPlayerStats, addNarrativeEntry, t, toast]);
    
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

        const gameStateToSave: GameState = {
            ...gameState,
            worldProfile: gameState.worldProfile,
            currentSeason: gameState.currentSeason,
            world: gameState.world,
            recipes: gameState.recipes,
            buildableStructures: gameState.buildableStructures,
            regions: gameState.regions,
            regionCounter: gameState.regionCounter,
            playerPosition: gameState.playerPosition,
            playerBehaviorProfile: gameState.playerBehaviorProfile,
            playerStats: gameState.playerStats,
            narrativeLog: gameState.narrativeLog,
            worldSetup: gameState.finalWorldSetup!,
            customItemDefinitions: gameState.customItemDefinitions,
            customItemCatalog: gameState.customItemCatalog,
            customStructures: gameState.customStructures,
            weatherZones: gameState.weatherZones,
            gameTime: gameState.gameTime,
            day: gameState.day,
            turn: gameState.turn,
        };

        const save = async () => {
            setIsSaving(true);
            try {
                if (user && db) {
                    await setDoc(doc(db, "users", user.uid, "games", `slot_${props.gameSlot}`), gameStateToSave);
                } else {
                    localStorage.setItem(`gameState_${props.gameSlot}`, JSON.stringify(gameStateToSave));
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
        gameState, user, isSaving, toast, isGameOver, props.gameSlot, isLoaded, setIsSaving,
    ]);
    
    const handleReturnToMenu = () => {
        window.location.href = '/';
    };

    return {
        ...gameState, // Pass all state down
        ...gameActions, // Pass all actions down
        getEffectiveChunk,
        handleReturnToMenu,
    };
}
