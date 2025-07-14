
'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/context/language-context';
import { generateWeatherForZone, generateChunksInRadius } from '@/lib/game/engine/generation';
import { generateOfflineNarrative } from '@/lib/game/engine/offline';
import { recipes as staticRecipes } from '@/lib/game/recipes';
import { buildableStructures as staticBuildableStructures } from '@/lib/game/structures';
import { itemDefinitions as staticItemDefinitions } from '@/lib/game/items';
import type { IGameStateRepository } from '@/lib/game/ports/game-state.repository';
import type { GameState, GeneratedItem, Recipe } from "@/lib/game/types";
import { logger } from '@/lib/logger';
import { getTranslatedText } from '@/lib/utils';

type GameInitializationDeps = {
  setIsLoaded: (loaded: boolean) => void;
  gameStateRepository: IGameStateRepository;
  gameSlot: number;
  finalWorldSetup: GameState['worldSetup'] | null;
  setWorldProfile: (profile: GameState['worldProfile']) => void;
  setCurrentSeason: (season: GameState['currentSeason']) => void;
  setGameTime: (time: number) => void;
  setDay: (day: number) => void;
  setTurn: (turn: number) => void;
  setWeatherZones: (zones: GameState['weatherZones']) => void;
  setRecipes: (recipes: Record<string, Recipe>) => void;
  setCustomItemCatalog: (catalog: GeneratedItem[]) => void;
  setCustomItemDefinitions: (defs: Record<string, any>) => void;
  setCustomStructures: (structures: GameState['customStructures']) => void;
  setBuildableStructures: (structures: GameState['buildableStructures']) => void;
  setPlayerStats: React.Dispatch<React.SetStateAction<GameState['playerStats']>>;
  setFinalWorldSetup: (setup: GameState['worldSetup']) => void;
  setPlayerPosition: (pos: GameState['playerPosition']) => void;
  setPlayerBehaviorProfile: (profile: GameState['playerBehaviorProfile']) => void;
  setWorld: (world: GameState['world']) => void;
  setRegions: (regions: GameState['regions']) => void;
  setRegionCounter: (counter: number) => void;
  setNarrativeLog: (log: GameState['narrativeLog']) => void;
  addNarrativeEntry: (text: string, type: 'narrative' | 'action' | 'system', entryId?: string) => void;
};

export function useGameInitialization(deps: GameInitializationDeps) {
  const {
    setIsLoaded, gameStateRepository, gameSlot, finalWorldSetup,
    setWorldProfile, setCurrentSeason, setGameTime, setDay, setTurn,
    setWeatherZones, setRecipes, setCustomItemCatalog, setCustomItemDefinitions,
    setCustomStructures, setBuildableStructures, setPlayerStats, setFinalWorldSetup,
    setPlayerPosition, setPlayerBehaviorProfile, setWorld, setRegions,
    setRegionCounter, setNarrativeLog, addNarrativeEntry
  } = deps;

  const { t, language } = useLanguage();

  useEffect(() => {
    let isMounted = true;
    const loadGame = async () => {
      setIsLoaded(false);
      logger.info(`[GameInit] Starting to load game for slot ${gameSlot}.`);

      let loadedState: GameState | null = await gameStateRepository.load(`slot_${gameSlot}`);
      
      if (!isMounted) {
        logger.info(`[GameInit] Component unmounted during load for slot ${gameSlot}. Aborting.`);
        return;
      }
      
      if (!loadedState && !finalWorldSetup) {
        logger.warn(`[GameInit] No loaded state and no finalWorldSetup for slot ${gameSlot}. Waiting for world creation.`);
        return;
      }

      if (!loadedState) {
        logger.info(`[GameInit] No save data found for slot ${gameSlot}. Creating new game state from world setup.`);
        if (!finalWorldSetup) {
          logger.error("[GameInit] CRITICAL: New game started but no world setup data is available.");
          return;
        }
        loadedState = {
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
            customItemCatalog: finalWorldSetup.customItemCatalog || [],
            customItemDefinitions: {}, // Will be built below
            customStructures: finalWorldSetup.customStructures,
            day: 1, turn: 1, narrativeLog: [],
            worldProfile: { climateBase: 'temperate', magicLevel: 5, mutationFactor: 2, sunIntensity: 7, weatherTypesAllowed: ['clear', 'rain', 'fog'], moistureBias: 0, tempBias: 0, resourceDensity: 5, theme: 'Normal' },
            currentSeason: 'spring', gameTime: 360,
            weatherZones: {}, world: {}, recipes: {}, buildableStructures: {},
            regions: {}, regionCounter: 0,
            playerPosition: { x: 0, y: 0 },
            playerBehaviorProfile: { moves: 0, attacks: 0, crafts: 0, customActions: 0 },
        };
      } else {
        logger.info(`[GameInit] Successfully loaded game state for slot ${gameSlot}.`);
      }

      const stateToInitialize = loadedState;

      const finalCatalogMap = new Map<string, GeneratedItem>();
      Object.entries(staticItemDefinitions).forEach(([name, def]) => {
          finalCatalogMap.set(name, { id: name, ...def } as unknown as GeneratedItem);
      });
      (stateToInitialize.customItemCatalog || []).forEach(item => {
          const nameKey = item.id || (typeof item.name === 'string' ? item.name : getTranslatedText(item.name, 'en', t));
          finalCatalogMap.set(nameKey, item);
      });
      
      const finalCatalogArray: GeneratedItem[] = Array.from(finalCatalogMap.values());
      const finalRecipes = { ...staticRecipes, ...(stateToInitialize.recipes || {}) };
      const finalDefs = { ...staticItemDefinitions, ...(stateToInitialize.customItemDefinitions || {}) };
      
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

      let worldSnapshot = stateToInitialize.world || {};
      let regionsSnapshot = stateToInitialize.regions || {};
      let regionCounterSnapshot = stateToInitialize.regionCounter || 0;
      let weatherZonesSnapshot = stateToInitialize.weatherZones || {};

      const initialPosKey = `${stateToInitialize.playerPosition.x},${stateToInitialize.playerPosition.y}`;
      
      if (Object.keys(worldSnapshot).length === 0) {
        const { world: newWorld, regions: newRegions, regionCounter: newRegionCounter } = generateChunksInRadius(
          {},
          {},
          0,
          stateToInitialize.playerPosition.x,
          stateToInitialize.playerPosition.y,
          7, // Initial radius
          stateToInitialize.worldProfile,
          stateToInitialize.currentSeason,
          finalDefs,
          finalCatalogArray,
          stateToInitialize.customStructures || [],
          language
        );
        worldSnapshot = newWorld;
        regionsSnapshot = newRegions;
        regionCounterSnapshot = newRegionCounter;
      }
      
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
              const chunkDescription = generateOfflineNarrative(startingChunk, 'long', worldSnapshot, stateToInitialize.playerPosition, t, language);
              const fullIntro = `${getTranslatedText(stateToInitialize.worldSetup.initialNarrative, language, t)}\n\n${chunkDescription}`;
              addNarrativeEntry(fullIntro, 'narrative');
          }
      } else {
           setNarrativeLog(stateToInitialize.narrativeLog);
      }

      setIsLoaded(true);
      logger.info(`[GameInit] Game for slot ${gameSlot} is fully loaded and initialized.`);
    };

    loadGame();

    return () => {
      isMounted = false;
    };
  }, [gameSlot, finalWorldSetup, gameStateRepository, language]);
}
