
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
import { rollDice, getSuccessLevel, successLevelToTranslationKey } from "@/lib/game/dice";
import { generateRegion, getValidAdjacentTerrains, weightedRandom, generateWeatherForZone, checkConditions, calculateCraftingOutcome } from '@/lib/game/engine';
import { skillDefinitions } from '@/lib/game/skills';
import { getTemplates } from '@/lib/game/templates';
import { worldConfig } from '@/lib/game/world-config';
import { clamp } from "@/lib/utils";

import type { GameState, World, PlayerStatus, NarrativeEntry, Chunk, Season, WorldProfile, Region, PlayerItem, ChunkItem, ItemDefinition, GeneratedItem, WeatherZone, Recipe, WorldConcept, Skill, PlayerBehaviorProfile, PlayerPersona, Structure, Pet, ItemEffect } from "@/lib/game/types";
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
        // This effect runs once when the engine mounts.
        // It initializes the narrative ID counter based on the loaded game state
        // from localStorage, preventing key collisions.
        if (narrativeLog.length > 0) {
            // Find the highest existing ID in the log
            const maxId = Math.max(...narrativeLog.map(entry => entry.id));
            // Set the counter to be one higher than the max
            narrativeIdCounter.current = maxId + 1;
        }
    }, []); // The empty dependency array is crucial. It ensures this runs only once on mount.

    const addNarrativeEntry = useCallback((text: string, type: NarrativeEntry['type']) => {
        setNarrativeLog(prev => {
            const newEntry = { id: narrativeIdCounter.current, text, type };
            narrativeIdCounter.current++;
            // Keep the log to a max of 50 entries for performance
            return [...prev, newEntry].slice(-50);
        });
    }, [setNarrativeLog]);

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
    
        const validTerrains = getValidAdjacentTerrains(pos, currentWorld);
        const terrainProbs = validTerrains.map(t => [t, worldConfig[t].spreadWeight] as [Terrain, number]);
        const newTerrain = weightedRandom(terrainProbs);
        
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
                
                let { newWorld, newRegions, newRegionCounter } = generateRegion(
                    startPos, props.worldSetup.startingBiome, {}, {}, 0,
                    worldProfile, currentSeason, customItemDefinitions,
                    customItemCatalog, customStructures, language
                );
                
                let worldSnapshot = { ...newWorld };
                let regionsSnapshot = { ...newRegions };
                let regionCounterSnapshot = newRegionCounter;
                const visionRadius = 1;

                for (let dy = -visionRadius; dy <= visionRadius; dy++) {
                    for (let dx = -visionRadius; dx <= visionRadius; dx++) {
                         const revealPos = { x: startPos.x + dx, y: startPos.y + dy };
                         if (!worldSnapshot[`${revealPos.x},${revealPos.y}`]) {
                             const result = ensureChunkExists(revealPos, worldSnapshot, regionsSnapshot, regionCounterSnapshot);
                             worldSnapshot = result.worldWithChunk;
                             regionsSnapshot = result.regions;
                             regionCounterSnapshot = result.newRegionCounter;
                         }
                         if (worldSnapshot[`${revealPos.x},${revealPos.y}`]) {
                             worldSnapshot[`${revealPos.x},${revealPos.y}`].explored = true;
                         }
                    }
                }
                newWorld = worldSnapshot;
                newRegions = regionsSnapshot;
                newRegionCounter = regionCounterSnapshot;

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
                    setPlayerStats(prev => ({ ...prev, journal: { ...prev.journal, [currentDay]: journalResult.journalEntry }, dailyActionLog: [] }));
                    addNarrativeEntry(t('journalUpdated'), 'system');
                } catch (e) { console.error("Failed to generate journal entry:", e); }
            } else { setPlayerStats(prev => ({...prev, dailyActionLog: []})); }
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
    
        let nextPlayerStats = {...playerStats};
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
        
        if (worldWasModified) setWorld(newWorldState);
        setPlayerStats(prev => ({ ...prev, ...nextPlayerStats }));

        if (changes.narrativeEntries.length > 0) {
            const uniqueNarratives = [...new Map(changes.narrativeEntries.map(item => [item.text, item])).values()];
            uniqueNarratives.forEach(entry => addNarrativeEntry(entry.text, entry.type));
        }
    }, [world, gameTime, day, playerPosition, playerStats, weatherZones, currentSeason, addNarrativeEntry, t, isOnline, language, setDay, setGameTime, setWeatherZones, setPlayerStats, setWorld, getEffectiveChunk, finalWorldSetup]);
    
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

            setPlayerStats(prev => {
                let newStats = { ...prev, ...(result.updatedPlayerStatus || {}) };
                if (worldCtx[`${playerPosCtx.x},${playerPosCtx.y}`]?.enemy && result.updatedChunk?.enemy === null) {
                    newStats.unlockProgress = { ...newStats.unlockProgress, kills: newStats.unlockProgress.kills + 1 };
                }
                return newStats;
            });
            
            if (result.newlyGeneratedItem && !customItemDefinitions[result.newlyGeneratedItem.name]) {
                const newItem = result.newlyGeneratedItem;
                setCustomItemCatalog(prev => [...prev, newItem]);
                setCustomItemDefinitions(prev => ({ ...prev, [newItem.name]: { description: newItem.description, tier: newItem.tier, category: newItem.category, emoji: newItem.emoji, effects: newItem.effects as ItemEffect[], baseQuantity: newItem.baseQuantity, growthConditions: newItem.growthConditions as any } }));
            }
        } catch (error) {
            console.error("AI narrative generation failed:", error);
            toast({ title: t('offlineModeActive'), description: t('offlineToastDesc'), variant: "destructive" });
        } finally {
            advanceGameTime();
            setIsLoading(false);
        }
    }, [settings.diceType, settings.aiModel, settings.narrativeLength, addNarrativeEntry, getEffectiveChunk, narrativeLog, language, customItemDefinitions, toast, advanceGameTime, finalWorldSetup, setIsLoading, setWorld, setPlayerStats, setCustomItemCatalog, setCustomItemDefinitions, t]);
    
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
                        if (definition) lootDrops.push({ name: lootItem.name, description: definition.description, tier: definition.tier, quantity: getRandomInRange(lootItem.quantity), emoji: definition.emoji });
                    }
                }
            }
        } else {
            fled = currentChunk.enemy.behavior === 'passive' || (successLevel === 'CriticalSuccess' && currentChunk.enemy.size === 'small');
            if (!fled) enemyDamage = Math.round(currentChunk.enemy.damage);
        }
    
        const finalPlayerHp = Math.max(0, playerStats.hp - enemyDamage);
    
        let narrative = combatLogParts.join(' ');
        if (enemyDefeated) narrative += ` ${t('enemyDefeated', { enemyType: t(currentChunk.enemy.type as TranslationKey) })}` + (lootDrops.length > 0 ? ` ${t('enemyDropped', { items: lootDrops.map(i => `${i.quantity}x ${t(i.name as TranslationKey)}`).join(', ') })}` : "");
        else if (fled) narrative += ` ${t('enemyFled', { enemyType: t(currentChunk.enemy.type as TranslationKey) })}`;
        else if (enemyDamage > 0) narrative += ` ${t('enemyRetaliated', { enemyType: t(currentChunk.enemy.type as TranslationKey), damage: enemyDamage })}`;
        else narrative += ` ${t('enemyPrepares', { enemyType: t(currentChunk.enemy.type as TranslationKey) })}`;
        addNarrativeEntry(narrative, 'narrative');
    
        setPlayerStats(prev => ({ ...prev, hp: finalPlayerHp, unlockProgress: enemyDefeated ? { ...prev.unlockProgress, kills: prev.unlockProgress.kills + 1 } : prev.unlockProgress }));
    
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
    
        advanceGameTime();
    }, [playerPosition, world, addNarrativeEntry, settings.diceType, t, getEffectiveChunk, playerStats, language, customItemDefinitions, advanceGameTime]);

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
            if (!currentChunk.enemy.diet.includes(itemName)) { addNarrativeEntry(t('targetNotInterested', { target: t(target as TranslationKey) }), 'system'); return; }

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
        setPlayerStats({ ...newPlayerStats, items: newPlayerStats.items.filter(i => i.quantity > 0) });
        advanceGameTime();
    }, [addNarrativeEntry, playerStats, t, customItemDefinitions, playerPosition, world, advanceGameTime]);
    
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
        setPlayerStats(newPlayerStats);
        if(newEnemy !== currentChunk?.enemy) setWorld(prev => ({...prev, [key]: {...prev[key]!, enemy: newEnemy}}));
        advanceGameTime();
    }, [playerStats, settings.diceType, t, addNarrativeEntry, playerPosition, world, advanceGameTime]);
    
    const handleOfflineAction = useCallback((actionText: string) => {
        addNarrativeEntry(actionText, 'action');
        let newPlayerStats = { ...playerStats, dailyActionLog: [...(playerStats.dailyActionLog || []), actionText] };
        const lowerAction = actionText.toLowerCase();
        const talkToAction = t('talkToAction', {}).toLowerCase();
        const pickUpAction = t('pickUpAction', {}).toLowerCase();
        const exploreActionText = t('exploreAction', {}).toLowerCase();

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
                            toast({ title: t('questCompletedTitle'), description: npcDef.quest });
                        } else addNarrativeEntry(t('npcQuestNotEnoughItems', { npcName: t(npc.name as TranslationKey), needed: npcDef.questItem.quantity - (itemInInventory?.quantity || 0), itemName: t(npcDef.questItem.name as TranslationKey) }), 'narrative');
                    } else { newPlayerStats.quests.push(npcDef.quest); addNarrativeEntry(t('npcQuestGive', { npcName: t(npc.name as TranslationKey), questText: npcDef.quest }), 'narrative'); }
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
            const { roll } = rollDice('d20');
            if (roll > 15 && currentChunk.terrain !== 'desert' && currentChunk.terrain !== 'cave') { 
                const quantity = getRandomInRange({ min: 1, max: 3 });
                const itemInInventory = newPlayerStats.items.find(i => i.name === 'Sỏi');
                if (itemInInventory) itemInInventory.quantity += quantity;
                else newPlayerStats.items.push({ name: 'Sỏi', quantity, tier: customItemDefinitions['Sỏi'].tier, emoji: customItemDefinitions['Sỏi'].emoji });
                addNarrativeEntry(t('exploreFoundItem', { quantity, itemName: t('Sỏi' as TranslationKey) }), 'narrative');
            } else addNarrativeEntry(t('exploreFoundNothing'), 'narrative');
        }

        setPlayerStats(newPlayerStats);
        advanceGameTime();
    }, [addNarrativeEntry, playerStats, t, world, playerPosition, language, toast, advanceGameTime, customItemDefinitions]);
    
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
        regionCounterSnapshot = destResult.regionCounter;
        
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
        setPlayerStats(newPlayerStats);

        if (isOnline) handleOnlineNarrative(`move ${direction}`, worldSnapshot, newPos, newPlayerStats);
        else { addNarrativeEntry(worldSnapshot[`${newPos.x},${newPos.y}`].description, 'narrative'); advanceGameTime(); }
    }, [isLoading, isGameOver, setPlayerBehaviorProfile, playerPosition, world, regions, regionCounter, playerStats, toast, addNarrativeEntry, t, ensureChunkExists, weatherZones, currentSeason, gameTime, setWeatherZones, setWorld, setRegions, setRegionCounter, setPlayerPosition, setPlayerStats, isOnline, handleOnlineNarrative, advanceGameTime]);

    const handleAction = useCallback((actionId: number) => {
        if (isLoading || isGameOver) return;
        const chunk = world[`${playerPosition.x},${playerPosition.y}`];
        const actionText = chunk?.actions.find(a => a.id === actionId)?.text || "unknown action";
        const newPlayerStats = { ...playerStats, dailyActionLog: [...(playerStats.dailyActionLog || []), actionText]};
        setPlayerStats(newPlayerStats);
        addNarrativeEntry(actionText, 'action');
        if (isOnline) handleOnlineNarrative(actionText, world, playerPosition, newPlayerStats);
        else handleOfflineAction(actionText);
    }, [isLoading, isGameOver, world, playerPosition, playerStats, setPlayerStats, addNarrativeEntry, isOnline, handleOnlineNarrative, handleOfflineAction]);

    const handleAttack = useCallback(() => {
        if (isLoading || isGameOver) return;
        setPlayerBehaviorProfile(p => ({ ...p, attacks: p.attacks + 1 }));
        const baseChunk = world[`${playerPosition.x},${playerPosition.y}`];
        if (!baseChunk?.enemy) { addNarrativeEntry(t('noTarget'), 'system'); return; }
        
        const actionText = `${t('attackAction')} ${t(baseChunk.enemy.type as TranslationKey)}`;
        const newPlayerStats = { ...playerStats, dailyActionLog: [...(playerStats.dailyActionLog || []), actionText]};
        setPlayerStats(newPlayerStats);
    
        if (isOnline) handleOnlineNarrative(actionText, world, playerPosition, newPlayerStats);
        else handleOfflineAttack();
    }, [isLoading, isGameOver, setPlayerBehaviorProfile, world, playerPosition, addNarrativeEntry, t, playerStats, setPlayerStats, isOnline, handleOnlineNarrative, handleOfflineAttack]);
    
    const handleCustomAction = useCallback((text: string) => {
        if (!text.trim() || isLoading || isGameOver) return;
        setPlayerBehaviorProfile(p => ({ ...p, customActions: p.customActions + 1 }));
        const newPlayerStats = { ...playerStats, dailyActionLog: [...(playerStats.dailyActionLog || []), text]};
        setPlayerStats(newPlayerStats);
        addNarrativeEntry(text, 'action');
        if (isOnline) handleOnlineNarrative(text, world, playerPosition, newPlayerStats);
        else handleOfflineAction(text);
    }, [isLoading, isGameOver, setPlayerBehaviorProfile, playerStats, setPlayerStats, addNarrativeEntry, isOnline, handleOnlineNarrative, world, playerPosition, handleOfflineAction]);

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
        
        setPlayerStats(prev => ({ ...prev, items: updatedItems.filter(i => i.quantity > 0), dailyActionLog: [...(prev.dailyActionLog || []), actionText] }));

        if (Math.random() * 100 < chance) {
            setPlayerStats(prev => {
                const newInventory = [...prev.items];
                const resultItemIndex = newInventory.findIndex(i => i.name === recipe.result.name);
                if (resultItemIndex > -1) newInventory[resultItemIndex].quantity += recipe.result.quantity;
                else newInventory.push({ ...recipe.result, tier: customItemDefinitions[recipe.result.name]?.tier || 1 });
                return { ...prev, items: newInventory };
            });
            addNarrativeEntry(t('craftSuccess', { itemName: t(recipe.result.name as TranslationKey) }), 'system');
            toast({ title: t('craftSuccessTitle'), description: t('craftSuccess', { itemName: t(recipe.result.name as TranslationKey) }) });
        } else {
            addNarrativeEntry(t('craftFail', { itemName: t(recipe.result.name as TranslationKey) }), 'system');
            toast({ title: t('craftFailTitle'), description: t('craftFail', { itemName: t(recipe.result.name as TranslationKey) }), variant: 'destructive' });
        }
        advanceGameTime();
    }, [isLoading, isGameOver, setPlayerBehaviorProfile, playerStats, customItemDefinitions, addNarrativeEntry, toast, t, advanceGameTime]);

    const handleItemUsed = useCallback((itemName: string, target: 'player' | string) => {
        if (isLoading || isGameOver) return;
        const actionText = target === 'player' ? `${t('useAction')} ${t(itemName as TranslationKey)}` : `${t('useOnAction', {item: t(itemName as TranslationKey), target: t(target as TranslationKey)})}`;
        const newPlayerStats = { ...playerStats, dailyActionLog: [...(playerStats.dailyActionLog || []), actionText]};
        setPlayerStats(newPlayerStats);

        if (isOnline) handleOnlineNarrative(actionText, world, playerPosition, newPlayerStats);
        else handleOfflineItemUse(itemName, target);
    }, [isLoading, isGameOver, playerStats, world, playerPosition, isOnline, handleOnlineNarrative, t, setPlayerStats, handleOfflineItemUse]);

    const handleUseSkill = useCallback((skillName: string) => {
        if (isLoading || isGameOver) return;
        const actionText = `${t('useSkillAction')} ${t(skillName as TranslationKey)}`;
        const newPlayerStats = { ...playerStats, dailyActionLog: [...(playerStats.dailyActionLog || []), actionText]};
        setPlayerStats(newPlayerStats);
        addNarrativeEntry(actionText, 'action');
        if (isOnline) handleOnlineNarrative(actionText, world, playerPosition, newPlayerStats);
        else handleOfflineSkillUse(skillName);
    }, [isLoading, isGameOver, playerStats, world, playerPosition, isOnline, addNarrativeEntry, t, setPlayerStats, handleOnlineNarrative, handleOfflineSkillUse]);

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
        
        setPlayerStats(prev => ({ ...prev, items: updatedItems.filter(item => item.quantity > 0), stamina: prev.stamina - buildStaminaCost, dailyActionLog: [...(prev.dailyActionLog || []), actionText] }));

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
        advanceGameTime();
    }, [isLoading, isGameOver, buildableStructures, playerStats, playerPosition, addNarrativeEntry, advanceGameTime, toast, t, setPlayerStats, setWorld]);

    const handleRest = useCallback(() => {
        if (isLoading || isGameOver) return;
        const shelter = world[`${playerPosition.x},${playerPosition.y}`]?.structures.find(s => s.restEffect);
        if (!shelter?.restEffect) { toast({ title: t('cantRestTitle'), description: t('cantRestDesc') }); return; }

        const actionText = t('restInShelter', { shelterName: t(shelter.name as TranslationKey) });
        addNarrativeEntry(actionText, 'action');
        setPlayerStats(prev => ({ ...prev, hp: Math.min(100, prev.hp + shelter.restEffect!.hp), stamina: Math.min(100, prev.stamina + shelter.restEffect!.stamina), bodyTemperature: 37, dailyActionLog: [...(prev.dailyActionLog || []), actionText] }));
        advanceGameTime();
    }, [isLoading, isGameOver, world, playerPosition, addNarrativeEntry, advanceGameTime, t, toast, setPlayerStats]);
    
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
        setPlayerStats(prev => ({ ...prev, items: newItems.filter(i => i.quantity > 0), dailyActionLog: [...(prev.dailyActionLog || []), actionText] }));

        try {
            const result = await fuseItems({
                itemsToFuse, playerPersona: playerStats.persona, currentChunk: effectiveChunk,
                environmentalContext: { biome: effectiveChunk.terrain, weather: weather?.name || 'clear' },
                environmentalModifiers: { successChanceBonus, elementalAffinity, chaosFactor: clamp(chaosFactor, 0, 10) },
                language, customItemDefinitions,
            });

            addNarrativeEntry(result.narrative, 'narrative');
            
            if (result.resultItem) {
                setPlayerStats(prev => {
                    const updatedInventory = [...prev.items];
                    const existing = updatedInventory.find(i => i.name === result.resultItem!.name);
                    if (existing) existing.quantity += result.resultItem!.baseQuantity.min;
                    else updatedInventory.push({ name: result.resultItem!.name, quantity: result.resultItem!.baseQuantity.min, tier: result.resultItem!.tier, emoji: result.resultItem!.emoji });
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
