
'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/context/language-context';
import { generateWeatherForZone, generateChunksInRadius } from '@/lib/game/engine/generation';
import { generateOfflineNarrative } from '@/lib/game/engine/offline';
import { recipes as staticRecipes } from '@/lib/game/recipes';
import { buildableStructures as staticBuildableStructures } from '@/lib/game/structures';
import { itemDefinitions as staticItemDefinitions } from '@/lib/game/items';
import type { IGameStateRepository } from '@/lib/game/ports/game-state.repository';
import type { GameState, PlayerStatusDefinition, WorldDefinition, GeneratedItem, Recipe, StructureDefinition, ItemDefinition } from '@/lib/game/types';
import { logger } from '@/lib/logger';
import { getTranslatedText } from '@/lib/utils';
import { normalizePlayerStatus } from '@/lib/game/normalize';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-config';
import { useAuth } from '@/context/auth-context';


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
  setPlayerStats: React.Dispatch<React.SetStateAction<PlayerStatusDefinition>>;
  setFinalWorldSetup: React.Dispatch<React.SetStateAction<GameState['worldSetup'] | null>>;
  setPlayerPosition: (pos: GameState['playerPosition']) => void;
  setPlayerBehaviorProfile: (profile: GameState['playerBehaviorProfile']) => void;
  setWorld: React.Dispatch<React.SetStateAction<WorldDefinition>>;
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
  const { user } = useAuth();

  useEffect(() => {
    logger.debug('[GameInit] useGameInitialization effect triggered', {
      gameSlot,
      finalWorldSetup,
      user: user?.uid || null,
      language: language
    });

    // Strict slot validation
    if (typeof gameSlot !== 'number' || isNaN(gameSlot) || gameSlot < 0) {
      // In development, capture a small caller stack to aid debugging where the missing
      // `gameSlot` came from. Avoid exposing stack in production.
      const callerStack = (process?.env?.NODE_ENV !== 'production') ? (new Error('Missing gameSlot').stack) : undefined;
      logger.error('[GameInit] Invalid or missing gameSlot. Aborting initialization.', { gameSlot, deps, callerStack });
      setIsLoaded(false);
      return;
    }

    let isMounted = true;
    const loadGame = async () => {
      setIsLoaded(false);
      logger.info(`[GameInit] Starting to load game for slot ${gameSlot}.`);
      logger.debug('[GameInit] Initial parameters', {
        gameSlot,
        finalWorldSetup,
        user: user?.uid || null,
        language: language
      });

      let loadedState: GameState | null = null;
      try {
        loadedState = await gameStateRepository.load(`slot_${gameSlot}`);
        logger.debug('[GameInit] Loaded state from repository', loadedState);
      } catch (error) {
        logger.error('[GameInit] Failed to load game state', error);
      }

      if (!isMounted) {
        logger.info(`[GameInit] Component unmounted during load for slot ${gameSlot}. Aborting.`);
        return;
      }

      const stateToInitialize = loadedState;

      if (!stateToInitialize && !finalWorldSetup) {
        logger.warn(`[GameInit] No loaded state and no finalWorldSetup for slot ${gameSlot}. Waiting for world creation.`, {
          loadedState,
          finalWorldSetup
        });
        if (isMounted) setIsLoaded(false);
        return;
      }

      if (stateToInitialize) {
        logger.info(`[GameInit] Initializing game state from loaded data for slot ${gameSlot}.`);
        logger.debug('[GameInit] State to initialize', stateToInitialize);

        const finalCatalogMap = new Map<string, GeneratedItem>();
        Object.values(staticItemDefinitions).forEach((def) => {
          const defId = getTranslatedText(def.name, 'en');
          if (defId) finalCatalogMap.set(defId, def);
        });
        (stateToInitialize.customItemCatalog || []).forEach(item => {
          const itemId = getTranslatedText(item.name, 'en');
          if (itemId) finalCatalogMap.set(itemId, item);
        });

        const finalCatalogArray: GeneratedItem[] = Array.from(finalCatalogMap.values());
        const finalRecipes = { ...staticRecipes, ...(stateToInitialize.recipes || {}) };

        const finalDefs = finalCatalogArray.reduce((acc, item) => {
          const itemId = getTranslatedText(item.name, 'en');
          if (itemId) acc[itemId] = item;
          return acc;
        }, {} as Record<string, ItemDefinition>);

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
  setPlayerStats(() => normalizePlayerStatus(stateToInitialize.playerStats));
        setFinalWorldSetup(() => stateToInitialize.worldSetup);
        setPlayerPosition(stateToInitialize.playerPosition || { x: 0, y: 0 });
        setPlayerBehaviorProfile(stateToInitialize.playerBehaviorProfile || { moves: 0, attacks: 0, crafts: 0, customActions: 0 });

        let worldSnapshot: Record<string, any> = stateToInitialize.world || {};
        let regionsSnapshot: Record<string, any> = stateToInitialize.regions || {};
        let regionCounterSnapshot = stateToInitialize.regionCounter || 0;
        let weatherZonesSnapshot = stateToInitialize.weatherZones || {};

        const initialPosKey = `${stateToInitialize.playerPosition.x},${stateToInitialize.playerPosition.y}`;

        if (Object.keys(worldSnapshot).length === 0) {
          logger.info('[GameInit] World is empty, performing initial chunk generation.');
          logger.debug('[GameInit] Generating chunks in radius', {
            playerPosition: stateToInitialize.playerPosition,
            worldProfile: stateToInitialize.worldProfile,
            currentSeason: stateToInitialize.currentSeason
          });
          const { world: newWorld, regions: newRegions, regionCounter: newRegionCounter } = generateChunksInRadius(
            {}, {}, 0,
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
            weatherZonesSnapshot[regionId] = {
              id: regionId,
              terrain: region.terrain,
              currentWeather: initialWeather,
              nextChangeTime: (stateToInitialize!.gameTime || 360) + Math.floor(Math.random() * (initialWeather.duration_range[1] - initialWeather.duration_range[0] + 1)) + initialWeather.duration_range[0] * 10
            };
            logger.debug('[GameInit] Generated weather for region', {
              regionId,
              initialWeather
            });
          }
        });

        setWorld(() => worldSnapshot);
        setRegions(regionsSnapshot);
        setRegionCounter(regionCounterSnapshot);
        setWeatherZones(weatherZonesSnapshot);

        if ((stateToInitialize.narrativeLog || []).length === 0) {
          const startingChunk = worldSnapshot[initialPosKey];
          if (startingChunk) {
            const initialNarrative = getTranslatedText(stateToInitialize.worldSetup.initialNarrative, language, t);
            const chunkDescription = generateOfflineNarrative(startingChunk, 'long', worldSnapshot, stateToInitialize.playerPosition, t, language);
            addNarrativeEntry(`${initialNarrative}\n\n${chunkDescription}`, 'narrative');
            logger.debug('[GameInit] Added initial narrative entry', {
              initialNarrative,
              chunkDescription
            });
          }
        } else {
          setNarrativeLog(stateToInitialize.narrativeLog);
          logger.debug('[GameInit] Loaded narrative log', stateToInitialize.narrativeLog);
        }

        if (isMounted) setIsLoaded(true);
        logger.info(`[GameInit] Game for slot ${gameSlot} is fully loaded and initialized.`);
        logger.debug('[GameInit] Initialization complete', {
          isLoaded: true,
          finalWorldSetup: stateToInitialize.worldSetup
        });

      } else if (finalWorldSetup && isMounted) {
        logger.info(`[GameInit] New game initiated with finalWorldSetup for slot ${gameSlot}.`);
        setIsLoaded(true);
        logger.debug('[GameInit] New game setup', {
          isLoaded: true,
          finalWorldSetup
        });
      }
    };

    loadGame();

    return () => {
      isMounted = false;
      logger.debug('[GameInit] useGameInitialization effect cleanup (unmount)', { gameSlot });
    };
  }, [gameSlot, gameStateRepository, language, user]); // Removed finalWorldSetup from deps
}
