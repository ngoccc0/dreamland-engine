
'use client';

import { useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { doc, setDoc } from 'firebase/firestore';
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
  setPlayerBehaviorProfile: (fn: (prev: PlayerBehaviorProfile) => PlayerBehaviorProfile) => void;
  world: GameState['world'];
  setWorld: (fn: (prev: GameState['world']) => GameState['world']) => void;
  playerPosition: GameState['playerPosition'];
  setPlayerPosition: (pos: GameState['playerPosition']) => void;
  narrativeLog: NarrativeEntry[];
  addNarrativeEntry: (text: string, type: NarrativeEntry['type']) => void;
  finalWorldSetup: GameState['worldSetup'] | null;
  turn: number;
  setTurn: (turn: number) => void;
  day: number;
  setDay: (day: number) => void;
  gameTime: number;
  setGameTime: (time: number) => void;
  currentSeason: Season;
  worldProfile: WorldProfile;
  weatherZones: GameState['weatherZones'];
  setWeatherZones: (zones: GameState['weatherZones']) => void;
  regions: GameState['regions'];
  setRegions: (regions: GameState['regions']) => void;
  regionCounter: number;
  setRegionCounter: (counter: number) => void;
  setCurrentChunk: (chunk: Chunk | null) => void;
  customItemDefinitions: Record<string, ItemDefinition>;
  customItemCatalog: GeneratedItem[];
  customStructures: Structure[];
  recipes: Record<string, Recipe>;
  buildableStructures: Record<string, Structure>;
  gameSlot: number;
  handleOnlineNarrative: (action: string, worldCtx: GameState['world'], playerPosCtx: {x: number, y: number}, playerStatsCtx: PlayerStatus) => Promise<void>;
  advanceGameTime: (stats?: PlayerStatus) => void;
};


export function useGameEffects(deps: GameEffectsDeps) {
  const {
    isLoaded, isGameOver, isSaving, setIsGameOver, setIsSaving,
    playerStats, setPlayerStats, playerBehaviorProfile, setPlayerBehaviorProfile,
    world, setWorld, playerPosition, setPlayerPosition,
    narrativeLog, addNarrativeEntry, finalWorldSetup,
    turn, setTurn, day, setDay, gameTime, setGameTime,
    currentSeason, worldProfile, weatherZones, setWeatherZones,
    regions, setRegions, regionCounter, setRegionCounter,
    setCurrentChunk, customItemDefinitions, customItemCatalog, customStructures,
    recipes, buildableStructures, gameSlot,
    handleOnlineNarrative, advanceGameTime
  } = deps;

  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings } = useSettings();
  const isOnline = settings.gameMode === 'ai';

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

    const eventName = t(event.name[language] as TranslationKey);
    addNarrativeEntry(t('eventTriggered', { eventName }), 'system');

    const { roll } = rollDice('d20');
    const successLevel: SuccessLevel = getSuccessLevel(roll, 'd20');

    const outcome = event.outcomes[successLevel] || event.outcomes['Success'];
    if (!outcome) return;

    addNarrativeEntry(t(outcome.description[language] as TranslationKey), 'narrative');

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
            const result = ensureChunkExists(playerPosition, worldSnapshot, regionsSnapshot, regionCounterSnapshot, worldProfile, currentSeason, customItemDefinitions, customItemCatalog, customStructures, language);
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
                    const revealResult = ensureChunkExists(revealPos, worldSnapshot, regionsSnapshot, regionCounterSnapshot, worldProfile, currentSeason, customItemDefinitions, customItemCatalog, customStructures, language);
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
                const chunkDescription = generateOfflineNarrative(startingChunk, 'long', worldSnapshot, playerPosition, t);
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
        playerStats, narrativeLog, worldSetup: finalWorldSetup!,
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
    playerPosition, playerBehaviorProfile, playerStats, narrativeLog, finalWorldSetup,
    customItemDefinitions, customItemCatalog, customStructures, weatherZones, gameTime, day, user, isSaving, toast, isGameOver,
    turn, gameSlot, isLoaded, setIsSaving,
  ]);
}
