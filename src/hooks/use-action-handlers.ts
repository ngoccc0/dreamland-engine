'use client';
// NOTE: react-hooks/exhaustive-deps is being audited. Removed the file-level disable
// so ESLint can report missing/unnecessary deps per-hook. We'll fix each hook's deps in small commits.

import { useCallback, useEffect, useRef } from 'react';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';
import { validateRecipe } from '@/core/rules/crafting';
import { EventDeduplicationGuard, DEFAULT_DEDUP_CONFIG, type DeduplicationBuffer } from '@/core/engines/event-deduplication/guard';

// UI & Context Hooks
import { useToast } from '@/hooks/ui';

// Core Engine Hooks
import { useEffectExecutor, useActionTracker } from '@/hooks/engine';
import { useQuestActions } from '@/hooks/features/quest';

// Action Handlers
import {
  createHandleOnlineNarrative,
  createHandleOfflineAttack,
  createHandleOfflineItemUse,
  createHandleOfflineSkillUse,
  createHandleOfflineAction,
  createHandleMove,
  createActionHelpers,
  createHandleFuseItems,
  createHandleHarvest,
  createHandleCombatActions,
  createHandleInventoryActions,
  createHandleCraftingActions,
  createHandleInteractionActions,
} from '@/hooks/actions';

// NOTE: Genkit flows are server-only. Call them via server API routes to
// avoid bundling server-only packages into the client bundle.
async function callApi(path: string, payload: any) {
  const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Server error');
  return data;
}

const fuseItems = async (payload: any) => callApi('/api/fuse-items', payload);
const provideQuestHint = async (payload: any) => callApi('/api/provide-quest-hint', payload);
import { rollDice, getSuccessLevel, successLevelToTranslationKey } from '@/lib/utils/dice';

import { resolveItemDef as resolveItemDefHelper } from '@/lib/utils/item-utils';
import { generateOfflineNarrative, generateOfflineActionNarrative, handleSearchAction, analyze_chunk_mood } from '@/core/engines/game/offline';
import { getEffectiveChunk } from '@/core/engines/game/weather-generation';
import { generateCombatEffects } from '@/core/engines/combat-effects-bridge';
import { generateSkillEffects } from '@/core/engines/skill-effects-bridge';
import { generateItemEffects } from '@/core/engines/item-effects-bridge';
import { generateHarvestEffects } from '@/core/engines/harvest-effects-bridge';
import { StatisticsEngine } from '@/core/engines/statistics/engine';
import { createEmptyStatistics } from '@/core/engines/statistics/schemas';
import { useAudio } from '@/lib/audio/useAudio';
import { AudioActionType } from '@/core/data/audio-events';
import { getTemplates } from '@/lib/game/templates';
import { clamp, getTranslatedText, resolveItemId, ensurePlayerItemId } from '@/lib/utils';
import { getKeywordVariations } from '@/core/data/narrative/templates';

import type { GameState, World, PlayerStatus, Recipe, CraftingOutcome, Action, TranslationKey, PlayerItem, NarrativeEntry, GeneratedItem, TranslatableString, ItemDefinition, Chunk } from '@/core/types/game';
import type { GameEvent } from '@/core/types/events';
import { doc, setDoc } from 'firebase/firestore';
import { getDb } from '@/lib/core/firebase-config';
import { logger } from '@/lib/core/logger';
import { ActionHandlerDeps } from '@/hooks/actions/types';


/**
 * Player action handlers - processes all user-initiated game actions.
 *
 * @remarks
 * Coordinates action execution by delegating to specialized handler functions:
 * - **Movement**: Tile-to-tile navigation, turn advancement
 * - **Combat**: Attack creatures, process damage and status effects
 * - **Harvesting**: Gather items from chunks (plants, stones, creatures)
 * - **Crafting**: Fuse items, cook food, create tools, transmute materials
 * - **Farming**: Till soil, water crops, fertilize, plant seeds
 * - **Narrative**: Generate story content (online via API, offline via engine)
 * - **Items**: Use items (consumables, equipment), manage inventory
 * - **Skills**: Cast spells, execute special abilities
 *
 * **Architecture:**
 * Each action type is implemented in a separate handler file and imported here.
 * Handlers receive a dependencies object with all game state (deps) and return
 * immutable state updates or side-effect definitions.
 *
 * **Turn System:**
 * Most actions advance game time by 1 tick (2 hours). Player position and
 * creature positions are updated atomically. Effects (damage, status) are
 * resolved after movement.
 *
 * **Item Resolution:**
 * Resolves items via custom/world-specific definitions first, then falls back
 * to master item catalog. This allows generated worlds to have unique items.
 *
 * @param {ActionHandlerDeps} deps - Game state including world, player, items, recipes, regions
 * @returns {Object} Map of handler functions (handleMove, handleAttack, handleHarvest, etc.)
 *
 * @example
 * const handlers = useActionHandlers(gameState);
 * handlers.handleMove({ x: 5, y: 10 }); // Move to tile
 * handlers.handleAttack(creatureId); // Attack creature at current tile
 * handlers.handleHarvest(itemId); // Gather item
 */
export function useActionHandlers(deps: ActionHandlerDeps) {
  const {
    isLoaded, isLoading, isGameOver, setIsLoading, playerStats, setPlayerStats, world, setWorld, buildableStructures,
    customItemDefinitions, setCustomItemCatalog, setCustomItemDefinitions, finalWorldSetup, addNarrativeEntry, advanceGameTime,
    setPlayerBehaviorProfile, playerPosition, setPlayerPosition, weatherZones, turn, gameTime, customItemCatalog, narrativeLogRef,
    setCurrentChunk
  } = deps as any;
  // worldProfile contains global spawn/config modifiers (e.g., spawnMultiplier)
  const { worldProfile } = deps;

  // Hook effect executor for centralized side-effect handling
  const { executeEffects } = useEffectExecutor();

  // Hook for quest and achievement actions (Phase 2.0)
  const { evaluateQuestsAndAchievements } = useQuestActions();

  // Hook for action tracking (Phase I-2)
  const {
    recordCombatAction,
    recordHarvestingAction,
    recordCraftingAction,
    getActionHistory
  } = useActionTracker(deps.actionHistory || { actions: [], lastActionId: '', totalActionCount: 0 }, deps.setActionHistory || (() => { }));

  // Helper to execute effects AND evaluate quests/achievements
  const executeEffectsWithQuests = useCallback((effects: any[]) => {
    // 1. Execute the side effects (audio, UI, etc)
    executeEffects(effects);

    // 2. Evaluate quests and achievements based on current state
    // This allows quests to auto-complete when criteria are met
    try {
      const questState = {
        playerId: 'player',
        timestamp: new Date(),
        turnCount: deps.turn,
        currentChunkX: deps.playerPosition.x,
        currentChunkY: deps.playerPosition.y,
        activeQuests: deps.activeQuests || [],
        unlockedAchievements: deps.unlockedAchievements || [],
        // TODO: Add statistics tracking after Statistics Engine integration
      };

      const { newState: updatedState, effects: questEffects } = evaluateQuestsAndAchievements(questState);

      // Apply quest/achievement updates if any
      if (updatedState.activeQuests && deps.setActiveQuests) {
        deps.setActiveQuests(updatedState.activeQuests);
      }
      if (updatedState.unlockedAchievements && deps.setUnlockedAchievements) {
        deps.setUnlockedAchievements(updatedState.unlockedAchievements);
      }

      // Execute any cascading effects (quest completion notifications, etc)
      if (questEffects && questEffects.length > 0) {
        executeEffects(questEffects);
      }
    } catch (err) {
      console.warn('[ActionHandlers] Failed to evaluate quests:', err);
      // Silently ignore quest evaluation errors to prevent blocking gameplay
    }
  }, [executeEffects, evaluateQuestsAndAchievements, deps]);

  // Helper to resolve an item definition by name. Prefer custom/generated definitions
  // (world-specific), but fall back to the built-in master item catalog when needed.
  const resolveItemDef = (name: string) => {
    return resolveItemDefHelper(name, customItemDefinitions);
  };

  const { t, language } = useLanguage();
  const { settings } = useSettings();
  // Defensive typed aliases for legacy fields that may be missing from GameSettings type
  // Some code expects startTime/dayDuration to exist; cast to any and provide sensible defaults
  const sStart = (settings as any).startTime ?? 0;
  const sDayDuration = (settings as any).dayDuration ?? 24000;
  const { toast } = useToast();
  const isOnline = settings.gameMode === 'ai';

  // audio: auto-play background based on mood when player moves or environment changes
  // useAudio must be used inside AudioProvider (layouts already wrap the app)
  const audio = useAudio();

  // Track last move biome/time so we can emit a shorter "continuation" narrative when
  // the player moves repeatedly within the same biome.
  const lastMoveRef = useRef<{ biome?: string; time?: number }>({});
  // Numeric timestamp ref used for throttling move clicks. Kept separate from
  // `lastMoveRef` which stores continuation metadata (biome/time).
  const lastMoveAtRef = useRef<number>(0);

  // Buffer pick-up events that occur within a short window so we aggregate multi-pick
  // events into a single summary narrative instead of spamming detailed lines per item.
  const pickupBufferRef = useRef<{ items: Array<any>; timer?: ReturnType<typeof setTimeout> }>({ items: [] });
  const lastPickupMonologueAt = useRef(0);
  const offlineItemUseRef = useRef<any>(null);
  const offlineSkillRef = useRef<any>(null);
  const offlineActionRef = useRef<any>(null);
  const fuseRef = useRef<any>(null);
  const harvestRef = useRef<any>(null);
  const dedupBufferRef = useRef<DeduplicationBuffer>(EventDeduplicationGuard.createDeduplicationBuffer());

  // When the player's current chunk or environment changes, prefer playing
  // biome-specific ambience (files named like Ambience_<Biome>) and fall back
  // to mood-based background tracks when a matching ambience isn't available.
  // We respect the playbackMode in the provider by checking it before
  // triggering playback.
  useEffect(() => {
    try {
      if (!audio || audio.playbackMode === 'off') return;
      const key = `${playerPosition.x},${playerPosition.y}`;
      const baseChunk = world[key];
      if (!baseChunk) return;
      const currentChunk = getEffectiveChunk(baseChunk, weatherZones, gameTime, sStart, sDayDuration);
      // prefer biome-based ambience when possible (matches filenames like Ambience_Cave_00.mp3)
      const biome = (currentChunk.terrain || (currentChunk as any).biome) as string | undefined | null;
      if (biome) {
        // playAmbienceForBiome will no-op if no matching file exists
        audio.playAmbienceForBiome(biome);
      } else {
        const moods = analyze_chunk_mood(currentChunk);
        audio.playBackgroundForMoods(moods);
      }
    } catch {
      // non-fatal: don't block game logic if audio fails
    }
  }, [world, playerPosition.x, playerPosition.y, weatherZones, gameTime, audio, sStart, sDayDuration]);

  const handleOnlineNarrative = useCallback((action: string, worldCtx: World, playerPosCtx: { x: number, y: number }, playerStatsCtx: PlayerStatus) => {
    // Create a fresh handler each call to avoid stale closures capturing old state.
    const handler = createHandleOnlineNarrative({
      setIsLoading,
      logger,
      finalWorldSetup,
      settings,
      addNarrativeEntry,
      t,
      narrativeLogRef,
      weatherZones,
      gameTime,
      sStart,
      sDayDuration,
      customItemDefinitions,
      setCustomItemCatalog,
      setCustomItemDefinitions,
      getDb: getDb,
      setWorld,
      setDoc,
      doc,
      resolveItemId,
      resolveItemDef,
      setPlayerStats,
      advanceGameTime,
      toast,
      language,
      rollDice,
      getSuccessLevel,
      successLevelToTranslationKey,
      getEffectiveChunk,
      getTranslatedText,
    });
    return handler(action, worldCtx, playerPosCtx, playerStatsCtx);
  }, [setIsLoading, logger, finalWorldSetup, settings, addNarrativeEntry, t, narrativeLogRef, weatherZones, gameTime, sStart, sDayDuration, customItemDefinitions, setCustomItemCatalog, setCustomItemDefinitions, setDoc, resolveItemId, resolveItemDef, setPlayerStats, advanceGameTime, toast, language, rollDice, getSuccessLevel, successLevelToTranslationKey, getEffectiveChunk, getTranslatedText, getDb]);

  const handleOfflineAttack = useCallback(() => {
    // Create a fresh handler each call to ensure it closes over current state
    const handler = createHandleOfflineAttack({
      playerPosition,
      world,
      addNarrativeEntry,
      t,
      logger,
      getEffectiveChunk,
      weatherZones,
      gameTime,
      sStart,
      sDayDuration,
      rollDice,
      getSuccessLevel,
      settings,
      successLevelToTranslationKey,
      setPlayerStats,
      advanceGameTime,
      setWorld,
      getTemplates,
      language,
      resolveItemDef,
      playerStats,
      generateOfflineActionNarrative,
      getTranslatedText,
      statistics: deps.statistics,
      setStatistics: deps.setStatistics,
      recordHarvestingAction: recordHarvestingAction,
      turn: deps.turn,
    });
    return handler();
  }, [playerPosition, world, addNarrativeEntry, t, logger, getEffectiveChunk, weatherZones, gameTime, sStart, sDayDuration, rollDice, getSuccessLevel, settings, successLevelToTranslationKey, setPlayerStats, advanceGameTime, setWorld, getTemplates, language, resolveItemDef, playerStats, generateOfflineActionNarrative, getTranslatedText, deps.statistics, deps.setStatistics, recordHarvestingAction, deps.turn]);

  const handleOfflineItemUse = useCallback((itemName: string, target: string) => {
    if (!offlineItemUseRef.current) {
      offlineItemUseRef.current = createHandleOfflineItemUse({
        resolveItemDef,
        addNarrativeEntry,
        t,
        getTranslatedText,
        playerStats,
        setPlayerStats,
        playerPosition,
        world,
        setWorld,
        advanceGameTime,
        toast,
        audio,
      });
    }
    return offlineItemUseRef.current(itemName, target);
  }, [resolveItemDef, addNarrativeEntry, t, getTranslatedText, playerStats, setPlayerStats, playerPosition, world, setWorld, advanceGameTime, toast, audio]);

  const handleOfflineSkillUse = useCallback((skillName: string) => {
    if (!offlineSkillRef.current) {
      offlineSkillRef.current = createHandleOfflineSkillUse({
        playerStats,
        addNarrativeEntry,
        t,
        rollDice,
        settings,
        getSuccessLevel,
        getTranslatedText,
        world,
        playerPosition,
        setWorld,
        setPlayerStats,
        advanceGameTime,
        generateOfflineActionNarrative,
        language,
        successLevelToTranslationKey,
      });
    }
    return offlineSkillRef.current(skillName);
  }, [playerStats, addNarrativeEntry, t, rollDice, settings, getSuccessLevel, getTranslatedText, world, playerPosition, setWorld, setPlayerStats, advanceGameTime, generateOfflineActionNarrative, language, successLevelToTranslationKey]);

  const handleOfflineAction = useCallback((action: Action) => {
    if (!offlineActionRef.current) {
      offlineActionRef.current = createHandleOfflineAction({
        playerStats,
        addNarrativeEntry,
        t,
        getTranslatedText,
        world,
        playerPosition,
        handleSearchAction,
        language,
        customItemDefinitions,
        clamp,
        toast,
        resolveItemDef,
        ensurePlayerItemId,
        setWorld,
        setPlayerStats,
        advanceGameTime,
        turn,
        weatherZones,
        gameTime,
        getTemplates,
        pickupBufferRef,
        getEffectiveChunk,
        sStart,
        sDayDuration,
        worldProfile,
      });
    }
    return offlineActionRef.current(action);
  }, [playerStats, addNarrativeEntry, t, getTranslatedText, world, playerPosition, handleSearchAction, language, customItemDefinitions, clamp, toast, resolveItemDef, ensurePlayerItemId, setWorld, setPlayerStats, advanceGameTime, turn, weatherZones, gameTime, getTemplates, pickupBufferRef, getEffectiveChunk, sStart, sDayDuration, worldProfile]);

  const handleAction = useCallback((actionId: number) => {
    if (isLoading || isGameOver || !isLoaded) return;
    const chunk = world[`${playerPosition.x},${playerPosition.y}`];
    if (!chunk) return;

    const action = chunk.actions.find((a: any) => a.id === actionId);
    if (!action) {
      toast({ title: t('actionNotAvailableTitle'), description: t('actionNotAvailableDesc'), variant: 'destructive' });
      return;
    }

    const actionText = t(action.textKey as TranslationKey, action.params);
    addNarrativeEntry(actionText, 'action');
    if (isOnline && action.textKey === 'talkToAction_npc') {
      const newPlayerStats = { ...playerStats, dailyActionLog: [...(playerStats.dailyActionLog || []), actionText] };
      handleOnlineNarrative(actionText, world, playerPosition, newPlayerStats);
    } else {
      handleOfflineAction(action);
    }
  }, [isLoading, isGameOver, isLoaded, world, playerPosition, playerStats, isOnline, handleOnlineNarrative, handleOfflineAction, toast, t, addNarrativeEntry]);

  // Combat actions (extracted to use-combat-actions.ts for Precursor split)
  const { handleAttack: handleAttackFromFactory } = createHandleCombatActions({
    ...(deps as any),
    isLoading,
    isGameOver,
    isLoaded,
    setPlayerBehaviorProfile,
    world,
    playerPosition,
    addNarrativeEntry,
    t,
    playerStats,
    handleOfflineAttack,
    setPlayerStats,
    audio,
    executeEffectsWithQuests,
    dedupBuffer: dedupBufferRef.current,
  });

  const handleAttack = handleAttackFromFactory;

  const handleCustomAction = useCallback((text: string) => {
    if (!text.trim() || isLoading || isGameOver || !isLoaded) return;
    setPlayerBehaviorProfile((p: any) => ({ ...p, customActions: p.customActions + 1 }));

    if (text.trim().toLowerCase() === 'analyze') {
      handleOfflineAction({ id: -1, textKey: 'analyzeAction' });
      return;
    }

    const newPlayerStats = { ...playerStats, dailyActionLog: [...(playerStats.dailyActionLog || []), text] };
    addNarrativeEntry(text, 'action');
    if (isOnline) {
      handleOnlineNarrative(text, world, playerPosition, newPlayerStats);
    }
    else {
      addNarrativeEntry(t('customActionFail'), 'narrative');
      setPlayerStats(() => newPlayerStats);
      advanceGameTime(newPlayerStats);
    }
  }, [isLoading, isGameOver, isLoaded, setPlayerBehaviorProfile, playerStats, isOnline, handleOnlineNarrative, handleOfflineAction, world, playerPosition, addNarrativeEntry, t, advanceGameTime, setPlayerStats]);

  const { handleCraft } = createHandleCraftingActions({
    ...deps,
    t,
    toast,
    audio
  });

  const handleItemUsed = useCallback((itemName: TranslatableString, target: 'player' | TranslatableString) => {
    if (isLoading || isGameOver || !isLoaded) return;
    const actionText = target === 'player' ? `${t('useAction')} ${t(itemName as TranslationKey)}` : `${t('useOnAction', { item: t(itemName as TranslationKey), target: t(target as TranslationKey) })}`;
    addNarrativeEntry(actionText, 'action');

    const outcome = handleOfflineItemUse(getTranslatedText(itemName, 'en'), getTranslatedText(target, 'en'));
    if (outcome) {
      const effects = generateItemEffects(outcome);
      executeEffectsWithQuests(effects);
    }

  }, [isLoading, isGameOver, isLoaded, t, handleOfflineItemUse, addNarrativeEntry, executeEffects]);

  const handleUseSkill = useCallback((skillName: string) => {
    if (isLoading || isGameOver || !isLoaded) return;
    const actionText = `${t('useSkillAction')} ${skillName}`;
    addNarrativeEntry(actionText, 'action');

    const outcome = handleOfflineSkillUse(skillName);
    if (outcome) {
      const effects = generateSkillEffects(outcome);
      executeEffectsWithQuests(effects);
    }
  }, [isLoading, isGameOver, isLoaded, t, handleOfflineSkillUse, addNarrativeEntry, executeEffects]);

  const { handleBuild, handleRest } = createHandleInteractionActions({
    ...deps,
    t,
    toast,
    audio
  });



  const handleRequestQuestHint = useCallback(async (questText: string) => {
    if (playerStats.questHints?.[questText] || !isOnline) return;

    try {
      const result = await provideQuestHint({ questText, language });
      setPlayerStats((prev: any) => ({ ...prev, questHints: { ...prev.questHints, [questText]: result.hint } }));
    } catch (error: any) {
      logger.error("Failed to get quest hint:", error);
      toast({ title: t('error'), description: t('suggestionError'), variant: "destructive" });
    }
  }, [playerStats.questHints, isOnline, language, setPlayerStats, toast, t]);

  const handleFuseItems = useCallback(async (itemsToFuse: PlayerItem[]) => {
    if (!fuseRef.current) {
      fuseRef.current = createHandleFuseItems({
        isLoading, isGameOver, setIsLoading, world, playerPosition, playerStats,
        weatherZones, language, customItemDefinitions, customItemCatalog,
        addNarrativeEntry, advanceGameTime, t, toast, setPlayerStats,
        setCustomItemCatalog, setCustomItemDefinitions, getEffectiveChunk,
        generateOfflineNarrative, fuseItems, getTranslatedText, resolveItemId,
        ensurePlayerItemId, resolveItemDef, getDb, doc, setDoc, logger, gameTime, sStart, sDayDuration
      });
    }
    return fuseRef.current(itemsToFuse);
  }, [isLoading, isGameOver, setIsLoading, world, playerPosition, playerStats, weatherZones, language, customItemDefinitions, customItemCatalog, addNarrativeEntry, advanceGameTime, t, toast, setPlayerStats, setCustomItemCatalog, setCustomItemDefinitions, getEffectiveChunk, generateOfflineNarrative, fuseItems, getTranslatedText, resolveItemId, ensurePlayerItemId, resolveItemDef, getDb, doc, setDoc, logger, gameTime, sStart, sDayDuration]);


  const { handleEquipItem, handleUnequipItem, handleDropItem } = createHandleInventoryActions({
    ...deps,
    t,
    toast,
    language
  });



  const handleReturnToMenu = () => {
    window.location.href = '/';
  };

  const handleWaitTick = useCallback(() => {
    try {
      // Minimal wait: advance game time without changing player stats
      advanceGameTime(playerStats);
    } catch {
      // non-fatal
    }
  }, [advanceGameTime, playerStats]);



  const handleHarvest = useCallback((actionId: number) => {
    if (!harvestRef.current) {
      harvestRef.current = createHandleHarvest({
        isLoading, isGameOver, isLoaded, world, playerPosition, toast, t,
        addNarrativeEntry, playerStats, customItemDefinitions, advanceGameTime,
        setWorld, setPlayerStats, resolveItemDef, clamp, ensurePlayerItemId, getTranslatedText
      });
    }
    const outcome = harvestRef.current(actionId);
    if (outcome) {
      const effects = generateHarvestEffects(outcome);
      executeEffectsWithQuests(effects);
    }
  }, [isLoading, isGameOver, isLoaded, world, playerPosition, toast, t, addNarrativeEntry, playerStats, customItemDefinitions, advanceGameTime, setWorld, setPlayerStats, resolveItemDef, clamp, ensurePlayerItemId, getTranslatedText, executeEffectsWithQuests]);

  const handleMove = useCallback((direction: "north" | "south" | "east" | "west") => {
    // Create a fresh handler per invocation so it captures the latest state
    const actionHelpers = createActionHelpers({ pickupBufferRef, lastPickupMonologueAt, resolveItemDef, t, language, addNarrativeEntry, audio, toast, customItemDefinitions });
    const { tryAddItemToInventory, flushPickupBuffer } = actionHelpers;
    const handler = createHandleMove({
      ...(deps as any),
      // local runtime dependencies
      settings,
      audio,
      toast,
      resolveItemDef,
      // local overrides / helpers
      // Provide both the numeric timestamp ref for throttle math and the
      // metadata ref used by continuation narrative logic.
      lastMoveAtRef: lastMoveAtRef,
      lastMoveRef: lastMoveRef,
      pickupBufferRef,
      tryAddItemToInventory,
      flushPickupBuffer,
      getKeywordVariations,
      getEffectiveChunk,
      generateOfflineNarrative,
      narrativeLogRef,
      activeMoveOpsRef: deps.activeMoveOpsRef,
      getTranslatedText,
      getTemplates,
      t,
      language,
    });
    try { (handler as any).__language = language; (handler as any).__hasT = typeof t === 'function'; } catch { }
    return (handler as any)(direction);
  }, [isLoading, isGameOver, playerPosition, world, addNarrativeEntry, t, settings, setPlayerBehaviorProfile, setPlayerPosition, playerStats, advanceGameTime, lastMoveRef, pickupBufferRef, getKeywordVariations, getEffectiveChunk, generateOfflineNarrative, narrativeLogRef, getTranslatedText, getTemplates, language, audio, toast, resolveItemDef, customItemDefinitions]);

  return {
    handleMove,
    handleAttack,
    handleAction,
    handleCustomAction,
    handleCraft,
    handleBuild,
    handleItemUsed,
    handleUseSkill,
    handleRest,
    handleFuseItems,
    handleRequestQuestHint,
    handleEquipItem,
    handleUnequipItem,
    handleReturnToMenu,
    handleWaitTick,
    handleDropItem,
    handleHarvest,
  };
}

