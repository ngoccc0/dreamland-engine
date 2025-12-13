
'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/context/language-context';
import { generateWeatherForZone, generateChunksInRadius } from '@/lib/game/engine/generation';
import { generateOfflineNarrative } from '@/lib/game/engine/offline';
import { recipes as staticRecipes } from '@/lib/game/recipes';
import { buildableStructures as staticBuildableStructures } from '@/lib/game/structures';
import { itemDefinitions as staticItemDefinitions } from '@/lib/game/items';
import type { IGameStateRepository } from '@/lib/game/ports/game-state.repository';
import type { GameState, PlayerStatusDefinition, WorldDefinition, GeneratedItem, Recipe, ItemDefinition } from '@/core/types/game';
import { logger } from '@/lib/logger';
import { getTranslatedText, ensurePlayerItemId } from '@/lib/utils';
import { normalizePlayerStatus } from '@/lib/game/normalize';
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
  addNarrativeEntry: (text: string, type: 'narrative' | 'action' | 'system' | 'monologue', entryId?: string) => void;
};

/**
 * Game initialization hook - loads or generates new game world on startup.
 *
 * @remarks
 * Orchestrates the complete game startup sequence:
 * 1. **Load or Create World**: Loads from save slot or generates new world
 * 2. **Initialize Terrain**: Generates chunks around player start position
 * 3. **Setup Creatures**: Spawns initial creatures in world
 * 4. **Initialize Narrative**: Generates opening narrative entry
 * 5. **Set Game Clock**: Initialize time (6 AM default), season, day/turn counters
 *
 * **Generation Strategy:**
 * - Loads from repository first (fast path for existing saves)
 * - Falls back to full world generation for new games (slow, async)
 * - Prevents concurrent initialization via module-level flag
 * - Guards against StrictMode double-invoke in React 18
 *
 * **Performance:**
 * World generation is heavy (terrain, weather, creatures, items).
 * Only runs once per slot. Subsequent mounts reuse initialized world.
 *
 * **State Mutation:**
 * Updates 15+ state setters to initialize complete game world.
 * Called once during useGameEffects lifecycle.
 *
 * @param {GameInitializationDeps} deps - All game state setters and repository
 * @returns {void} Side-effect only (no return value)
 *
 * @example
 * useGameInitialization({
 *   gameSlot: 0,
 *   gameStateRepository: myRepository,
 *   setIsLoaded, setPlayerStats, setWorld,
 *   ... (13 more setters)
 * });
 */
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

  // Prevent concurrent initialization for the same slot across remounts/StrictMode double-invoke.
  // Module-level so it survives hook remounts and avoids overlapping heavy generation.
  // Key: gameSlot
  // Note: kept lightweight and only used in dev to avoid accidental production locking.
  const inProgressKey = `game-init-inprogress-${gameSlot}`;

  useEffect(() => {
    logger.debug('[GameInit] useGameInitialization effect triggered', {
      gameSlot,
      finalWorldSetup,
      user: user?.uid || null,
      language: language
    });

    // Strict slot validation
    if (typeof gameSlot !== 'number' || isNaN(gameSlot) || gameSlot < 0) {
      logger.error('[GameInit] Invalid or missing gameSlot. Aborting initialization.', { gameSlot, deps });
      setIsLoaded(false);
      return;
    }

    let isMounted = true;
    // track whether this effect instance registered the in-progress lock
    let didRegister = false;

    // module-scoped map to avoid duplicate work across mounts
    // Use a property on globalThis to keep the symbol across HMR and module reloads in dev

    const globalAny = globalThis as any;
    if (!globalAny.__gameInitInProgress) globalAny.__gameInitInProgress = new Set<number>();
    const inProgressSet: Set<number> = globalAny.__gameInitInProgress;

    if (inProgressSet.has(gameSlot)) {
      logger.info(`[GameInit] Initialization for slot ${gameSlot} already in progress elsewhere — skipping this instance.`);
      // we still return a cleanup to set isMounted false
      return () => {
        isMounted = false;
        logger.debug('[GameInit] useGameInitialization effect cleanup (unmount) - skipped start', { gameSlot });
      };
    }
    const loadGame = async () => {
      // register that we're doing work for this slot
      inProgressSet.add(gameSlot);
      didRegister = true;
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
      } catch (error: any) {
        logger.error('[GameInit] Failed to load game state', error);
      }

      if (!isMounted) {
        logger.info(`[GameInit] Component unmounted during load for slot ${gameSlot}. Aborting.`);
        // remove our registration so future mounts can try again
        if (didRegister) inProgressSet.delete(gameSlot);
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
        // Preserve canonical ids when constructing the runtime item catalog.
        // For static definitions the canonical key is the object key; for generated/custom
        // items prefer any explicit `id` on the item, otherwise fall back to the English name.
        Object.entries(staticItemDefinitions).forEach(([key, def]) => {
          const defId = (def as any).id ?? key;
          finalCatalogMap.set(defId, { ...(def as any), id: defId } as GeneratedItem);
        });
        (stateToInitialize.customItemCatalog || []).forEach(item => {
          const itemId = (item as any).id ?? getTranslatedText(item.name, 'en');
          if (itemId) finalCatalogMap.set(itemId, { ...(item as any), id: itemId } as GeneratedItem);
        });

        const finalCatalogArray: GeneratedItem[] = Array.from(finalCatalogMap.values());
        const finalRecipes = { ...staticRecipes, ...(stateToInitialize.recipes || {}) };

        const finalDefs = finalCatalogArray.reduce((acc, item) => {
          const itemId = (item as any).id ?? getTranslatedText(item.name, 'en');
          if (itemId) acc[itemId] = { ...(item as any), id: itemId } as ItemDefinition;
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
        // Normalize player stats and ensure each inventory item has a canonical id
        const normalizedStats = normalizePlayerStatus(stateToInitialize.playerStats);
        if (Array.isArray(normalizedStats.items) && normalizedStats.items.length > 0) {
          normalizedStats.items = normalizedStats.items.map((it: any) => ensurePlayerItemId(it, finalDefs, t, language));
        }
        setPlayerStats(() => normalizedStats);
        setFinalWorldSetup(() => stateToInitialize.worldSetup);
        try { logger.debug('[GameInit] initializing playerPosition', { pos: stateToInitialize.playerPosition || { x: 0, y: 0 }, at: Date.now() }); } catch { }
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
          // Debug breakpoint: pause before heavy generation (set window.__DEBUG_BREAK = true in browser)
          try { const { maybeDebug } = await import('@/lib/debug'); maybeDebug('useGameInitialization:before-generate'); } catch { }
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
          // Debug after generation
          try { const { maybeDebug } = await import('@/lib/debug'); maybeDebug('useGameInitialization:after-generate'); } catch { }
          worldSnapshot = newWorld;
          regionsSnapshot = newRegions;
          regionCounterSnapshot = newRegionCounter;
        }

        Object.keys(regionsSnapshot).filter(id => !weatherZonesSnapshot[id]).forEach(regionId => {
          const region = regionsSnapshot[Number(regionId)];
          if (region) {
            const initialWeather = generateWeatherForZone(region.terrain, stateToInitialize!.currentSeason);
            // Schedule the next weather change in game "turns". duration_range is expressed in turns,
            // so pick a random value between min and max (inclusive) and add it to the current gameTime.
            // Previous code mistakenly multiplied only the minimum by 10 which mixed units and produced
            // unexpectedly short/long schedules.
            const minDur = initialWeather.duration_range[0];
            const maxDur = initialWeather.duration_range[1];
            const randDur = Math.floor(Math.random() * (maxDur - minDur + 1));
            weatherZonesSnapshot[regionId] = {
              id: regionId,
              terrain: region.terrain,
              currentWeather: initialWeather,
              nextChangeTime: (stateToInitialize!.gameTime || 360) + (minDur + randDur)
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
        try { const { maybeDebug } = await import('@/lib/debug'); maybeDebug('useGameInitialization:setIsLoaded:true'); } catch { }
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

      // done with work for this slot
      if (didRegister) inProgressSet.delete(gameSlot);
    };

    loadGame();

    return () => {
      isMounted = false;
      // if this effect instance registered the in-progress marker, remove it so future mounts can proceed
      try {
        if (didRegister && inProgressSet && inProgressSet.has(gameSlot)) {
          inProgressSet.delete(gameSlot);
          logger.debug('[GameInit] Cleared in-progress marker during cleanup', { gameSlot });
        }
      } catch {
        // ignore
      }
      // include a short stack snippet to help identify what caused the unmount (useful while debugging)
      const stack = (new Error().stack || '').split('\n').slice(1, 6).map(s => s.trim());
      logger.debug('[GameInit] useGameInitialization effect cleanup (unmount)', { gameSlot, stack });
    };
    // Use a single serialized dependency so the dependency array length is always 1. This avoids
    // "final argument to useEffect changed size" errors when HMR or parent code changes the
    // shape/identity of many values across renders. We still only trigger when meaningful inputs
    // change (gameSlot, finalWorldSetup identity, repository type, language, user id).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    JSON.stringify({
      gameSlot,
      finalWorldSetupId: finalWorldSetup ? (finalWorldSetup as any).id || String(finalWorldSetup) : null,
      repoType: (gameStateRepository && (gameStateRepository as any).constructor && (gameStateRepository as any).constructor.name) || null,
      language,
      userUid: user?.uid || null
    })
  ]);
}
