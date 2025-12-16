'use client';
// NOTE: react-hooks/exhaustive-deps is being audited. Removed the file-level disable
// so ESLint can report missing/unnecessary deps per-hook. We'll fix each hook's deps in small commits.

import { useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { useSettings } from '@/context/settings-context';
import { useEffectExecutor } from '@/hooks/use-effect-executor';

import type { GenerateNarrativeInput } from '@/ai/flows/generate-narrative-flow';
import { createHandleOnlineNarrative } from '@/hooks/use-action-handlers.online';
import { createHandleOfflineAttack } from '@/hooks/use-action-handlers.offlineAttack';
import { createHandleOfflineItemUse } from '@/hooks/use-action-handlers.itemUse';
import { createHandleOfflineSkillUse } from '@/hooks/use-action-handlers.offlineSkillUse';
import { createHandleOfflineAction } from '@/hooks/use-action-handlers.offlineAction';
import { createHandleMove } from '@/hooks/move-orchestrator';
import { createActionHelpers } from '@/hooks/action-helpers';
import { createHandleFuseItems } from '@/hooks/use-action-handlers.fuseItems';
import { createHandleHarvest } from '@/hooks/use-action-handlers.harvest';
import { tillSoil, waterTile, fertilizeTile, plantSeed } from '@/core/usecases/farming-usecase';
import {
  validateRecipe,
  calculateCraftTime,
} from '@/core/rules/crafting';

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
const generateNarrative = async (payload: any) => callApi('/api/narrative', payload);
import { rollDice, getSuccessLevel, successLevelToTranslationKey } from '@/lib/utils/dice';

import { resolveItemDef as resolveItemDefHelper } from '@/lib/utils/item-utils';
import { generateOfflineNarrative, generateOfflineActionNarrative, handleSearchAction, analyze_chunk_mood } from '@/core/engines/game/offline';
import { getEffectiveChunk } from '@/core/engines/game/weather-generation';
import { generateCombatEffects } from '@/core/engines/combat-effects-bridge';
import { generateSkillEffects } from '@/core/engines/skill-effects-bridge';
import { generateItemEffects } from '@/core/engines/item-effects-bridge';
import { useAudio } from '@/lib/audio/useAudio';
import { AudioActionType } from '@/core/data/audio-events';
import { getTemplates } from '@/lib/game/templates';
import { clamp, getTranslatedText, resolveItemId, ensurePlayerItemId } from '@/lib/utils';
import { getKeywordVariations } from '@/core/data/narrative/templates';

import type { GameState, World, PlayerStatus, Recipe, CraftingOutcome, EquipmentSlot, Action, TranslationKey, PlayerItem, ItemEffect, ChunkItem, NarrativeEntry, GeneratedItem, TranslatableString, ItemDefinition, Chunk, Enemy } from '@/core/types/game';
import type { LootDrop } from '@/core/types/definitions/base';
import { doc, setDoc } from 'firebase/firestore';
import { getDb } from '@/lib/core/firebase-config';
import { logger } from '@/lib/core/logger';

export type ActionHandlerDeps = {
  isLoaded: boolean;
  isLoading: boolean;
  isGameOver: boolean;
  setIsLoading: (loading: boolean) => void;
  playerStats: PlayerStatus;
  setPlayerStats: React.Dispatch<React.SetStateAction<PlayerStatus>>;
  world: World;
  setWorld: React.Dispatch<React.SetStateAction<World>>;
  recipes: Record<string, Recipe>;
  buildableStructures: Record<string, any>;
  customItemDefinitions: Record<string, ItemDefinition>;
  setCustomItemCatalog: React.Dispatch<React.SetStateAction<GeneratedItem[]>>;
  setCustomItemDefinitions: React.Dispatch<React.SetStateAction<Record<string, ItemDefinition>>>;
  finalWorldSetup: GameState['worldSetup'] | null;
  addNarrativeEntry: (text: string, type: 'narrative' | 'action' | 'system' | 'monologue', entryId?: string) => void;
  advanceGameTime: (stats?: PlayerStatus, pos?: { x: number, y: number }) => void;
  setPlayerBehaviorProfile: (fn: (prev: any) => any) => void;
  playerPosition: { x: number, y: number };
  setPlayerPosition: (pos: { x: number, y: number }) => void;
  setCurrentChunk: (chunk: Chunk | null) => void;
  weatherZones: Record<string, any>;
  turn: number;
  gameTime: number;
  regions: GameState['regions'];
  setRegions: (regions: GameState['regions']) => void;
  regionCounter: number;
  setRegionCounter: (counter: number) => void;
  worldProfile: GameState['worldProfile'];
  currentSeason: GameState['currentSeason'];
  customItemCatalog: GameState['customItemCatalog'];
  customStructures: GameState['customStructures'];
  narrativeLogRef: React.RefObject<NarrativeEntry[]>;
  activeMoveOpsRef?: React.RefObject<Set<string>>;
};

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

  // Phase 4B: Hook effect executor for centralized side-effect handling
  const { executeEffects } = useEffectExecutor();

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
  const onlineNarrativeRef = useRef<any>(null);
  const offlineAttackRef = useRef<any>(null);
  const offlineItemUseRef = useRef<any>(null);
  const offlineSkillRef = useRef<any>(null);
  const offlineActionRef = useRef<any>(null);
  const moveRef = useRef<any>(null);
  const fuseRef = useRef<any>(null);
  const harvestRef = useRef<any>(null);

  const flushPickupBuffer = () => {
    const buf = pickupBufferRef.current;
    if (!buf || !buf.items || buf.items.length === 0) return;
    const items = buf.items.splice(0, buf.items.length);
    if (buf.timer) { clearTimeout(buf.timer); buf.timer = undefined; }

    try {
      // If only one distinct item and qty ===1, render the detailed single-pick template
      if (items.length === 1 && items[0].quantity <= 1) {
        const it = items[0];

        // Emit audio for single item pickup
        const itemName = getTranslatedText(it.name, 'en');
        const resolvedDef = resolveItemDef(itemName);
        const rarity = (resolvedDef as any)?.rarity || 'common';
        audio.playSfxForAction(AudioActionType.ITEM_PICKUP, { itemRarity: rarity });

        // try to recreate the previous single-item detailed narrative path
        const buildSensoryText = (def: ItemDefinition | undefined, itemName?: string) => {
          if (!def || !def.senseEffect || !Array.isArray(def.senseEffect.keywords) || def.senseEffect.keywords.length === 0) return '';
          const raw = def.senseEffect.keywords[Math.floor(Math.random() * def.senseEffect.keywords.length)];
          const [kindRaw, ...rest] = raw.split(':');
          const kind = kindRaw || 'generic';
          const valRaw = rest.join(':') || '';
          // fallback translation helper (keep minimal)
          const sensory = valRaw || raw;
          return sensory;
        };
        const itemNameText = t(it.name as TranslationKey);
        const sensory = buildSensoryText(resolvedDef, itemNameText);
        const narrativeText = t('pickedUpItem_single_1' as TranslationKey, { itemName: itemNameText, sensory });
        addNarrativeEntry(narrativeText, 'narrative');
        return;
      }

      // Multi-item pickup: emit audio
      audio.playSfxForAction(AudioActionType.ITEM_PICKUP, { itemRarity: 'common' });

      // Multi-summary: group by name and sum quantities
      const grouped: Record<string, number> = {};
      items.forEach((it: any) => { const key = getTranslatedText(it.name, language); grouped[key] = (grouped[key] || 0) + (it.quantity || 1); });
      const summaryList = Object.keys(grouped).map(k => `${grouped[k]} ${k}`).slice(0, 6).join(', ');
      const totalCount = Object.values(grouped).reduce((s, v) => s + v, 0);
      const summaryText = language === 'vi' ? `Bạn gom được ${summaryList}.` : `You picked up ${summaryList}.`;
      addNarrativeEntry(summaryText, 'narrative');

      // Optionally add a brief monologue if many distinct items found, but throttle it
      const distinct = Object.keys(grouped).length;
      const now = Date.now();
      if (distinct >= 3 && now - lastPickupMonologueAt.current > 60_000) {
        const db = getKeywordVariations(language as any);
        const pool = (db as any)['monologue_tired'] || [];
        if (pool.length > 0) {
          const line = pool[Math.floor(Math.random() * pool.length)];
          addNarrativeEntry(line, 'monologue');
          lastPickupMonologueAt.current = now;
        }
      }
    } catch {
      // fallback: nothing
    }
  };

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
    });
    return handler();
  }, [playerPosition, world, addNarrativeEntry, t, logger, getEffectiveChunk, weatherZones, gameTime, sStart, sDayDuration, rollDice, getSuccessLevel, settings, successLevelToTranslationKey, setPlayerStats, advanceGameTime, setWorld, getTemplates, language, resolveItemDef, playerStats, generateOfflineActionNarrative, getTranslatedText]);

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

  const handleAttack = useCallback(() => {
    if (isLoading || isGameOver || !isLoaded) return;
    setPlayerBehaviorProfile((p: any) => ({ ...p, attacks: p.attacks + 1 }));
    const baseChunk = world[`${playerPosition.x},${playerPosition.y}`];
    if (!baseChunk?.enemy) { addNarrativeEntry(t('noTarget'), 'system'); return; }

    const actionText = `${t('attackAction')} ${t(baseChunk.enemy.type as TranslationKey)}`;
    addNarrativeEntry(actionText, 'action');

    // Emit audio for attack
    audio.playSfxForAction(AudioActionType.PLAYER_ATTACK, {});

    const newPlayerStats = { ...playerStats, dailyActionLog: [...(playerStats.dailyActionLog || []), actionText] };

    setPlayerStats(() => newPlayerStats);

    // Phase 4B: Execute combat and generate effects
    const outcome = handleOfflineAttack();
    if (outcome) {
      // Generate and execute side effects from combat outcome
      const effects = generateCombatEffects(outcome);
      executeEffects(effects);
    }
  }, [isLoading, isGameOver, isLoaded, setPlayerBehaviorProfile, world, playerPosition, addNarrativeEntry, t, playerStats, handleOfflineAttack, setPlayerStats, audio, executeEffects]);

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

  const handleCraft = useCallback(async (recipe: Recipe, outcome: CraftingOutcome) => {
    /**
     * Execute a crafting action using Phase 3.A pure rules.
     *
     * @remarks
     * Integrates validateRecipe and calculateCraftTime from core/rules/crafting:
     * - validateRecipe: Check player has all required materials
     * - calculateCraftTime: Calculate duration based on recipe difficulty (10-120s)
     *
     * **Flow:**
     * 1. Validate recipe using pure rule (checks inventory)
     * 2. Get craft time from pure rule
     * 3. Consume materials from inventory
     * 4. Run success roll (outcome.chance)
     * 5. Add crafted item or fail
     * 6. Emit audio and narrative
     *
     * Pure rule integration ensures:
     * - Consistent crafting logic across all game systems
     * - Deterministic, testable time/cost calculations
     */
    if (isLoading || isGameOver) return;
    setPlayerBehaviorProfile((p: any) => ({ ...p, crafts: p.crafts + 1 }));

    if (!outcome.canCraft) { toast({ title: t('error'), description: t('notEnoughIngredients'), variant: "destructive" }); return; }

    // Validate using pure rule (double-check using recipe result name as key)
    const canCraft = validateRecipe(recipe.result.name, playerStats.items || []);
    if (!canCraft) {
      toast({ title: t('error'), description: t('notEnoughIngredients'), variant: "destructive" });
      return;
    }

    const actionText = t('craftAction', { itemName: t(recipe.result.name as TranslationKey) });
    addNarrativeEntry(actionText, 'action');
    let updatedItems = (playerStats.items || []).map((i: any) => ({ ...i }));
    outcome.ingredientsToConsume.forEach((itemToConsume: any) => {
      const itemIndex = updatedItems.findIndex((i: PlayerItem) => getTranslatedText(i.name, 'en') === itemToConsume.name);
      if (itemIndex > -1) updatedItems[itemIndex].quantity -= itemToConsume.quantity;
    });

    let nextPlayerStats = { ...playerStats, items: updatedItems.filter((i: any) => i.quantity > 0), dailyActionLog: [...(playerStats.dailyActionLog || []), actionText] };

    if (Math.random() * 100 < outcome.chance) {
      const newInventory = [...nextPlayerStats.items];
      const resultItemIndex = newInventory.findIndex(i => getTranslatedText(i.name, 'en') === recipe.result.name);
      if (resultItemIndex > -1) newInventory[resultItemIndex].quantity += recipe.result.quantity;
      else newInventory.push({ ...(recipe.result as PlayerItem), tier: resolveItemDef(recipe.result.name)?.tier || 1, emoji: recipe.result.emoji || resolveItemDef(recipe.result.name)?.emoji || '📦' });
      nextPlayerStats.items = newInventory;

      const successKeys: TranslationKey[] = ['craftSuccess1', 'craftSuccess2', 'craftSuccess3'];
      const randomKey = successKeys[Math.floor(Math.random() * successKeys.length)];
      addNarrativeEntry(t(randomKey, { itemName: t(recipe.result.name as TranslationKey) }), 'system');

      // Emit audio for craft success (play twice in succession with 100ms delay)
      audio.playSfxForAction(AudioActionType.CRAFT_SUCCESS, {});
      setTimeout(() => {
        audio.playSfxForAction(AudioActionType.CRAFT_SUCCESS, {});
      }, 100);

      toast({ title: t('craftSuccessTitle'), description: t('craftSuccess', { itemName: t(recipe.result.name as TranslationKey) }) });
    } else {
      const failKeys: TranslationKey[] = ['craftFail1', 'craftFail2', 'craftFail3'];
      const randomKey = failKeys[Math.floor(Math.random() * failKeys.length)];
      addNarrativeEntry(t(randomKey, { itemName: t(recipe.result.name as TranslationKey) }), 'system');

      // Emit audio for craft fail (play twice in succession with 100ms delay)
      audio.playSfxForAction(AudioActionType.CRAFT_FAIL, {});
      setTimeout(() => {
        audio.playSfxForAction(AudioActionType.CRAFT_FAIL, {});
      }, 100);

      toast({ title: t('craftFailTitle'), description: t('craftFail', { itemName: t(recipe.result.name as TranslationKey) }), variant: 'destructive' });
    }
    setPlayerStats(() => nextPlayerStats);
    advanceGameTime(nextPlayerStats);
  }, [isLoading, isGameOver, setPlayerBehaviorProfile, playerStats, customItemDefinitions, addNarrativeEntry, toast, t, advanceGameTime, setPlayerStats, audio]);

  const handleItemUsed = useCallback((itemName: TranslatableString, target: 'player' | TranslatableString) => {
    if (isLoading || isGameOver || !isLoaded) return;
    const actionText = target === 'player' ? `${t('useAction')} ${t(itemName as TranslationKey)}` : `${t('useOnAction', { item: t(itemName as TranslationKey), target: t(target as TranslationKey) })}`;
    addNarrativeEntry(actionText, 'action');

    const outcome = handleOfflineItemUse(getTranslatedText(itemName, 'en'), getTranslatedText(target, 'en'));
    if (outcome) {
      const effects = generateItemEffects(outcome);
      executeEffects(effects);
    }

  }, [isLoading, isGameOver, isLoaded, t, handleOfflineItemUse, addNarrativeEntry, executeEffects]);

  const handleUseSkill = useCallback((skillName: string) => {
    if (isLoading || isGameOver || !isLoaded) return;
    const actionText = `${t('useSkillAction')} ${skillName}`;
    addNarrativeEntry(actionText, 'action');

    const outcome = handleOfflineSkillUse(skillName);
    if (outcome) {
      const effects = generateSkillEffects(outcome);
      executeEffects(effects);
    }
  }, [isLoading, isGameOver, isLoaded, t, handleOfflineSkillUse, addNarrativeEntry, executeEffects]);

  const handleBuild = useCallback((structureName: string) => {
    if (isLoading || isGameOver) return;

    const currentChunk = world[`${playerPosition.x},${playerPosition.y}`];
    if (currentChunk?.structures.length > 0) {
      toast({ title: t('structureLimitTitle'), description: t('structureLimitDesc'), variant: "destructive" });
      return;
    }

    const structureToBuild = buildableStructures[structureName];
    if (!structureToBuild?.buildable) return;

    const buildStaminaCost = 15;
    if ((playerStats.stamina ?? 0) < buildStaminaCost) { toast({ title: t('notEnoughStamina'), description: t('notEnoughStaminaDesc', { cost: buildStaminaCost, current: (playerStats.stamina ?? 0).toFixed(0) }), variant: "destructive" }); return; }

    const inventoryMap = new Map((playerStats.items || []).map((item: any) => [getTranslatedText(item.name, 'en'), item.quantity]));
    if (!structureToBuild.buildCost?.every((cost: any) => (inventoryMap.get(cost.name) || 0) >= cost.quantity)) { toast({ title: t('notEnoughIngredients'), variant: "destructive" }); return; }

    const actionText = t('buildConfirm', { structureName: t(structureName as TranslationKey) });
    addNarrativeEntry(actionText, 'action');
    let updatedItems = (playerStats.items || []).map((i: any) => ({ ...i }));
    structureToBuild.buildCost?.forEach((cost: any) => { updatedItems.find((i: PlayerItem) => getTranslatedText(i.name, 'en') === cost.name)!.quantity -= cost.quantity; });

    const nextPlayerStats = { ...playerStats, items: updatedItems.filter((item: any) => item.quantity > 0), stamina: playerStats.stamina - buildStaminaCost, dailyActionLog: [...(playerStats.dailyActionLog || []), actionText] };

    const key = `${playerPosition.x},${playerPosition.y}`;
    setWorld((prev: any) => {
      const newWorld = { ...prev };
      const chunkToUpdate = { ...newWorld[key]! };
      const newStructure = { name: structureToBuild.name, description: t(structureToBuild.description as TranslationKey), emoji: structureToBuild.emoji, providesShelter: structureToBuild.providesShelter, restEffect: structureToBuild.restEffect, heatValue: structureToBuild.heatValue };
      chunkToUpdate.structures = [...(chunkToUpdate.structures || []), newStructure];
      newWorld[key] = chunkToUpdate;
      return newWorld;
    });

    addNarrativeEntry(t('builtStructure', { structureName: t(structureName as TranslationKey) }), 'system');
    setPlayerStats(() => nextPlayerStats);
    advanceGameTime(nextPlayerStats);
  }, [isLoading, isGameOver, buildableStructures, playerStats, playerPosition, addNarrativeEntry, advanceGameTime, toast, t, setWorld, world, setPlayerStats]);

  const handleRest = useCallback(() => {
    if (isLoading || isGameOver) return;
    const shelter = world[`${playerPosition.x},${playerPosition.y}`]?.structures.find((s: any) => s.restEffect);
    if (!shelter?.restEffect) { toast({ title: t('cantRestTitle'), description: t('cantRestDesc') }); return; }

    audio.playSfxForAction(AudioActionType.REST_ENTER, {});

    const actionText = t('restInShelter', { shelterName: t(shelter.name as TranslationKey) });
    addNarrativeEntry(actionText, 'action');

    const oldStats = { ...playerStats };
    const newHp = Math.min(100, oldStats.hp + shelter.restEffect.hp);
    const newStamina = Math.min(100, oldStats.stamina + shelter.restEffect.stamina);
    const newTemp = 37;

    let restoredParts: string[] = [];
    if (newHp > oldStats.hp) {
      restoredParts.push(t('restHP', { amount: newHp - oldStats.hp }));
    }
    if (newStamina > oldStats.stamina) {
      restoredParts.push(t('restStamina', { amount: (newStamina - oldStats.stamina).toFixed(0) }));
    }

    if (restoredParts.length > 0) {
      addNarrativeEntry(t('restSuccess', { restoration: restoredParts.join(t('andConnector')) }), 'system');
    } else {
      addNarrativeEntry(t('restNoEffect'), 'system');
    }

    if (oldStats.bodyTemperature !== newTemp) {
      addNarrativeEntry(t('restSuccessTemp'), 'system');
    }

    const nextPlayerStats = { ...playerStats, hp: newHp, stamina: newStamina, bodyTemperature: newTemp, dailyActionLog: [...(playerStats.dailyActionLog || []), actionText] };
    setPlayerStats(() => nextPlayerStats);
    advanceGameTime(nextPlayerStats);
  }, [isLoading, isGameOver, world, playerPosition, addNarrativeEntry, advanceGameTime, t, toast, playerStats, setPlayerStats]);



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


  const handleEquipItem = useCallback((itemName: string) => {
    if (isLoading || isGameOver) return;

    setPlayerStats((prevStats: any) => {
      const newStats: any = JSON.parse(JSON.stringify(prevStats));
      const itemDef = resolveItemDef(getTranslatedText(itemName as any, 'en'));
      if (!itemDef || !itemDef.equipmentSlot) return prevStats;

      const itemToEquipIndex = newStats.items.findIndex((i: any) => getTranslatedText(i.name, 'en') === getTranslatedText(itemName as any, 'en'));
      if (itemToEquipIndex === -1) return prevStats;

      const itemToEquip = newStats.items[itemToEquipIndex];
      const slot = itemDef.equipmentSlot;

      const currentEquipped = (newStats.equipment as any)[slot];
      if (currentEquipped) {
        const existingInInventory = newStats.items.find((i: any) => getTranslatedText(i.name, 'en') === getTranslatedText(currentEquipped.name, 'en'));
        if (existingInInventory) {
          existingInInventory.quantity += 1;
        } else {
          newStats.items.push(ensurePlayerItemId({ ...currentEquipped, quantity: 1 }, customItemDefinitions, t, language));
        }
      }

      (newStats.equipment as any)[slot] = { name: itemToEquip.name, quantity: 1, tier: itemToEquip.tier, emoji: itemDef.emoji };

      if (itemToEquip.quantity > 1) {
        itemToEquip.quantity -= 1;
      } else {
        newStats.items.splice(itemToEquipIndex, 1);
      }

      let basePhysAtk = 10, baseMagAtk = 5, baseCrit = 5, baseAtkSpd = 1.0, baseCd = 0, basePhysDef = 0, baseMagDef = 0;
      Object.values(newStats.equipment).forEach((equipped: any) => {
        if (equipped) {
          const def = resolveItemDef(getTranslatedText(equipped.name, 'en'));
          if (def?.attributes) {
            basePhysAtk += def.attributes.physicalAttack || 0;
            baseMagAtk += def.attributes.magicalAttack || 0;
            baseCrit += def.attributes.critChance || 0;
            baseAtkSpd += def.attributes.attackSpeed || 0;
            baseCd += def.attributes.cooldownReduction || 0;
            basePhysDef += def.attributes.physicalDefense || 0;
            baseMagDef += def.attributes.magicalDefense || 0;
          }
        }
      });
      newStats.attributes = { physicalAttack: basePhysAtk, magicalAttack: baseMagAtk, physicalDefense: basePhysDef, magicalDefense: baseMagDef, critChance: baseCrit, attackSpeed: baseAtkSpd, cooldownReduction: baseCd };

      return newStats;
    });
  }, [isLoading, isGameOver, customItemDefinitions, setPlayerStats]);

  const handleUnequipItem = useCallback((slot: any) => {
    if (isLoading || isGameOver) return;

    setPlayerStats((prevStats: any) => {
      const newStats: any = JSON.parse(JSON.stringify(prevStats));
      const itemToUnequip = newStats.equipment[slot];
      if (!itemToUnequip) return prevStats;

      const existingInInventory = newStats.items.find((i: any) => getTranslatedText(i.name, 'en') === getTranslatedText(itemToUnequip.name, 'en'));
      if (existingInInventory) {
        existingInInventory.quantity += 1;
      } else {
        const itemDef = resolveItemDef(getTranslatedText(itemToUnequip.name, 'en'));
        newStats.items.push(ensurePlayerItemId({ ...itemToUnequip, quantity: 1, emoji: itemDef?.emoji || '📦' }, customItemDefinitions, t, language));
      }

      (newStats.equipment as any)[slot] = null;

      let basePhysAtk = 10, baseMagAtk = 5, baseCrit = 5, baseAtkSpd = 1.0, baseCd = 0, basePhysDef = 0, baseMagDef = 0;
      Object.values(newStats.equipment).forEach((equipped: any) => {
        if (equipped) {
          const def = resolveItemDef(getTranslatedText(equipped.name, 'en'));
          if (def?.attributes) {
            basePhysAtk += def.attributes.physicalAttack || 0;
            baseMagAtk += def.attributes.magicalAttack || 0;
            baseCrit += def.attributes.critChance || 0;
            baseAtkSpd += def.attributes.attackSpeed || 0;
            baseCd += def.attributes.cooldownReduction || 0;
            basePhysDef += def.attributes.physicalDefense || 0;
            baseMagDef += def.attributes.magicalDefense || 0;
          }
        }
      });
      newStats.attributes = { physicalAttack: basePhysAtk, magicalAttack: baseMagAtk, physicalDefense: basePhysDef, magicalDefense: baseMagDef, critChance: baseCrit, attackSpeed: baseAtkSpd, cooldownReduction: baseCd };

      return newStats;
    });
  }, [isLoading, isGameOver, customItemDefinitions, setPlayerStats]);

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

  const handleDropItem = useCallback((itemName: string, quantity: number = 1) => {
    try {
      const key = `${playerPosition.x},${playerPosition.y}`;
      setPlayerStats((prev: any) => {
        const next = JSON.parse(JSON.stringify(prev));
        next.items = next.items || [];
        const idx = next.items.findIndex((i: any) => getTranslatedText(i.name, 'en') === itemName);
        if (idx === -1) return prev;
        next.items[idx].quantity = (next.items[idx].quantity || 0) - quantity;
        if (next.items[idx].quantity <= 0) next.items = next.items.filter((i: any) => getTranslatedText(i.name, 'en') !== itemName);
        return next;
      });
      // Build the updated chunk locally and set world + refresh currentChunk so UI sees the item
      const baseChunk = world[`${playerPosition.x},${playerPosition.y}`];
      if (!baseChunk) return;
      const dropItem = { name: { en: itemName, vi: t(itemName as TranslationKey) }, quantity, emoji: '📦' } as any;
      const newChunk = { ...baseChunk, items: [...(baseChunk.items || []), dropItem] };

      setWorld((prev: any) => {
        const nw = { ...prev };
        nw[key] = newChunk;
        return nw;
      });

      // Refresh the live currentChunk used by UI/handlers
      try { if (typeof setCurrentChunk === 'function') setCurrentChunk(getEffectiveChunk(newChunk, weatherZones, gameTime, sStart, sDayDuration)); } catch { }

      addNarrativeEntry(t('droppedItem', { itemName: t(itemName as TranslationKey) }), 'system');
      advanceGameTime(playerStats);
    } catch {
      // ignore
    }
  }, [playerPosition, setPlayerStats, setWorld, addNarrativeEntry, t, advanceGameTime, playerStats]);

  const handleHarvest = useCallback((actionId: number) => {
    if (!harvestRef.current) {
      harvestRef.current = createHandleHarvest({
        isLoading, isGameOver, isLoaded, world, playerPosition, toast, t,
        addNarrativeEntry, playerStats, customItemDefinitions, advanceGameTime,
        setWorld, setPlayerStats, resolveItemDef, clamp, ensurePlayerItemId, getTranslatedText
      });
    }
    return harvestRef.current(actionId);
  }, [isLoading, isGameOver, isLoaded, world, playerPosition, toast, t, addNarrativeEntry, playerStats, customItemDefinitions, advanceGameTime, setWorld, setPlayerStats, resolveItemDef, clamp, ensurePlayerItemId, getTranslatedText]);

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

