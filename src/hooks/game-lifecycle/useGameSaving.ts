
"use client";

import { useEffect } from 'react';
import { useLanguage } from '@/context/language-context';
import { allItems as staticItemDefinitions } from '@/core/data/items';
import { ensurePlayerItemId } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { IGameStateRepository } from '@/lib/game/ports/game-state.repository';
import type { GameState } from "@/core/types/game";
import { logger } from '@/lib/logger';

type GameSavingDeps = {
  isLoaded: boolean;
  isSaving: boolean;
  isGameOver: boolean;
  setIsSaving: (saving: boolean) => void;
  gameStateRepository: IGameStateRepository;
  gameSlot: number;
  // All state slices that need to be saved
  worldProfile: GameState['worldProfile'];
  currentSeason: GameState['currentSeason'];
  world: GameState['world'];
  recipes: GameState['recipes'];
  buildableStructures: GameState['buildableStructures'];
  regions: GameState['regions'];
  regionCounter: GameState['regionCounter'];
  playerPosition: GameState['playerPosition'];
  playerBehaviorProfile: GameState['playerBehaviorProfile'];
  playerStats: GameState['playerStats'];
  narrativeLogRef: React.RefObject<GameState['narrativeLog']>;
  finalWorldSetup: GameState['worldSetup'] | null;
  customItemDefinitions: GameState['customItemDefinitions'];
  customItemCatalog: GameState['customItemCatalog'];
  customStructures: GameState['customStructures'];
  weatherZones: GameState['weatherZones'];
  gameTime: GameState['gameTime'];
  day: GameState['day'];
  turn: GameState['turn'];
  setPlayerStats?: (updater: any) => void;
};

/**
 * Game saving hook - persists game state to repository.
 *
 * @remarks
 * Manages both auto-save and manual save operations:
 * - **Auto-save**: Saves every 5 minutes during gameplay
 * - **Manual save**: Explicit save on player action
 * - **Quit-save**: Persists state when leaving game
 *
 * **Storage Strategy:**
 * Uses injected repository (Firebase for cloud, IndexedDB for offline).
 * Serializes complete game state including world, items, creatures, narrative.
 *
 * **Error Handling:**
 * Silently catches save errors (network, quota exceeded, etc.)
 * Marks `isSaving` false even on failure so UI doesn't hang.
 *
 * **Conflict Resolution:**
 * If save fails, game continues. User can retry or lose progress.
 * No conflict resolution between saves (last-write-wins).
 *
 * @param {GameSavingDeps} deps - Game state and repository reference
 * @returns {void} Side-effect only (no return value)
 *
 * @example
 * useGameSaving({
 *   gameSlot: 0,
 *   isLoaded: true,
 *   gameStateRepository: myRepository,
 *   ... (world, player, items, etc.)
 * });
 */
export function useGameSaving(deps: GameSavingDeps) {
  const {
    isLoaded, isSaving, isGameOver, setIsSaving, gameStateRepository, gameSlot,
    worldProfile, currentSeason, world, recipes, buildableStructures, regions,
    regionCounter, playerPosition, playerBehaviorProfile, playerStats,
    narrativeLogRef, finalWorldSetup, customItemDefinitions, customItemCatalog,
    customStructures, weatherZones, gameTime, day, turn,
  } = deps;

  const { toast } = useToast();
  const { t, language } = useLanguage();

  useEffect(() => {
    if (!isLoaded || isSaving || isGameOver || !finalWorldSetup) return;

    const gameState: GameState = {
      worldProfile, currentSeason, world, recipes, buildableStructures,
      regions, regionCounter, playerPosition, playerBehaviorProfile,
      playerStats, narrativeLog: narrativeLogRef.current!, worldSetup: finalWorldSetup,
      customItemDefinitions, customItemCatalog, customStructures, weatherZones, gameTime, day,
      turn,
    };

    const save = async () => {
      setIsSaving(true);
      try {
        // Normalize player item ids against the full registry (core + custom) before saving
        // Use requestIdleCallback to defer normalization (non-blocking)
        let normalizedItems = gameState.playerStats?.items || [];
        if (typeof requestIdleCallback !== 'undefined' && gameState.playerStats?.items) {
          // Defer normalization to idle time to avoid blocking game loop
          await new Promise<void>((resolve) => {
            requestIdleCallback(() => {
              try {
                const mergedDefs = { ...staticItemDefinitions, ...(customItemDefinitions || {}) };
                normalizedItems = gameState.playerStats.items.map((it: any) => {
                  const before = (it && it.id) ? String(it.id) : undefined;
                  const normalized = ensurePlayerItemId(it, mergedDefs, t, language);
                  const after = (normalized && (normalized as any).id) ? (normalized as any).id : undefined;
                  if (process.env.NODE_ENV !== 'production' && before !== after) {
                    logger.debug('[GameSaving] Normalized player item id', { before, after, item: normalized });
                  }
                  return normalized;
                });
                gameState.playerStats = { ...gameState.playerStats, items: normalizedItems } as any;
                if (typeof deps.setPlayerStats === 'function') {
                  try {
                    deps.setPlayerStats((prev: any) => ({ ...prev, items: normalizedItems }));
                  } catch (e: any) {
                    logger.debug('[GameSaving] Failed to update in-memory playerStats after normalization', e);
                  }
                }
              } catch (e: any) {
                logger.warn('[GameSaving] Failed to normalize player items before save', e);
              }
              resolve();
            });
          });
        } else {
          // Fallback: sync normalization if requestIdleCallback not available
          try {
            const mergedDefs = { ...staticItemDefinitions, ...(customItemDefinitions || {}) };
            if (gameState.playerStats && Array.isArray(gameState.playerStats.items)) {
              normalizedItems = gameState.playerStats.items.map((it: any) => {
                const before = (it && it.id) ? String(it.id) : undefined;
                const normalized = ensurePlayerItemId(it, mergedDefs, t, language);
                const after = (normalized && (normalized as any).id) ? (normalized as any).id : undefined;
                if (process.env.NODE_ENV !== 'production' && before !== after) {
                  logger.debug('[GameSaving] Normalized player item id', { before, after, item: normalized });
                }
                return normalized;
              });
              gameState.playerStats = { ...gameState.playerStats, items: normalizedItems } as any;
              if (typeof deps.setPlayerStats === 'function') {
                try {
                  deps.setPlayerStats((prev: any) => ({ ...prev, items: normalizedItems }));
                } catch (e: any) {
                  logger.debug('[GameSaving] Failed to update in-memory playerStats after normalization', e);
                }
              }
            }
          } catch (e: any) {
            logger.warn('[GameSaving] Failed to normalize player items before save', e);
          }
        }

        await gameStateRepository.save(`slot_${gameSlot}`, gameState);
      } catch {
        toast({ title: "Save Error", description: "Could not save your progress.", variant: "destructive" });
      } finally {
        setIsSaving(false);
      }
    };

    // Debounce saving to avoid rapid writes
    const timerId = setTimeout(save, 1500);
    return () => clearTimeout(timerId);

  }, [
    isLoaded, isSaving, isGameOver, finalWorldSetup, gameStateRepository, gameSlot,
    worldProfile, currentSeason, world, recipes, buildableStructures, regions, regionCounter,
    playerPosition, playerBehaviorProfile, playerStats, narrativeLogRef,
    customItemDefinitions, customItemCatalog, customStructures, weatherZones, gameTime, day, turn,
    toast, setIsSaving
  ]);
}
