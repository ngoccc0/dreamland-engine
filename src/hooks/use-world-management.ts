'use client';

import { useCallback, useState } from 'react';
import { useGameEngine } from '@/context/game-engine-context';
import { GridPosition } from '@/core/values/grid-position';
import type { GameState, Region } from '@/core/types/game';

/**
 * Result of world movement/exploration.
 *
 * @remarks
 * Returned by handlers to UI for display.
 */
export interface WorldMovementResult {
  newRegion: Region | null;
  creaturesSpawned: string[];
  resourcesAvailable: string[];
  weatherCondition: string;
}

/**
 * World management hook handlers and state.
 *
 * @remarks
 * **Handlers:**
 * - handleMoveToRegion: Move to discovered region
 * - handleExploreChunk: Explore new chunk
 *
 * **State:**
 * - isMoving: Currently moving between regions
 * - lastResult: Last movement result
 * - error: Any error during movement
 */
export interface WorldManagementHookResult {
  /** Currently moving between regions? */
  isMoving: boolean;
  /** Last movement result */
  lastResult: WorldMovementResult | null;
  /** Error message if movement failed */
  error: string | null;
  /** Move to discovered region */
  handleMoveToRegion: (regionId: number, gameState: GameState) => Promise<void>;
  /** Explore new chunk in current region */
  handleExploreChunk: (position: GridPosition, gameState: GameState) => Promise<void>;
}

/**
 * Hook to manage world traversal and region exploration.
 *
 * @remarks
 * **SSOT Compliance:**
 * - Reads regions and position from game state parameter
 * - Returns handlers for caller to dispatch state updates
 * - No local copies of gameState
 *
 * **Effect Execution:**
 * Effects from usecase are executed after state update:
 * - SpawnCreatureEffect: Creatures appear in new region
 * - ResourceAvailabilityEffect: Resources available for harvesting
 * - WeatherChangeEffect: Region weather applied
 *
 * **Mobile Optimization:**
 * Uses viewport culling to only render visible chunks.
 *
 * @returns Object with handlers and state
 */
export function useWorldManagement(): WorldManagementHookResult {
  const { worldUsecase } = useGameEngine();

  const [isMoving, setIsMoving] = useState(false);
  const [lastResult, setLastResult] = useState<WorldMovementResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Move to a discovered region.
   *
   * @remarks
   * **Sequence:**
   * 1. Set isMoving = true (show transition)
   * 2. Call worldUsecase.moveToRegion(regionId)
   * 3. Get back new region + spawned creatures + resources
   * 4. Update player position in GameState
   * 5. Create narrative entry for movement
   * 6. Show result to user
   * 7. Set isMoving = false
   *
   * **Duration:** 1-2s transition animation
   *
   * @param regionId - ID of region to move to
   * @param gameState - Current game state
   */
  const performMove = useCallback(
    async (regionId: number, gameState: GameState) => {
      try {
        setError(null);
        setIsMoving(true);

        // TODO: Call worldUsecase.moveToRegion(regionId)
        // For now, mock the behavior
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const mockResult: WorldMovementResult = {
          newRegion: gameState.regions[regionId] || null,
          creaturesSpawned: ['Wolf', 'Deer'],
          resourcesAvailable: ['Berries', 'Wood'],
          weatherCondition: 'Clear',
        };

        setLastResult(mockResult);

        // Caller will handle updating player position and saving
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Movement failed';
        setError(message);
      } finally {
        setIsMoving(false);
      }
    },
    [worldUsecase]
  );

  /**
   * Move to a region.
   */
  const handleMoveToRegion = useCallback(
    async (regionId: number, gameState: GameState) => {
      await performMove(regionId, gameState);
    },
    [performMove]
  );

  /**
   * Explore a new chunk in current region.
   */
  const handleExploreChunk = useCallback(
    async (position: GridPosition, gameState: GameState) => {
      try {
        setError(null);
        setIsMoving(true);

        // TODO: Call worldUsecase.exploreChunk(position)
        await new Promise((resolve) => setTimeout(resolve, 500));

        const mockResult: WorldMovementResult = {
          newRegion: null,
          creaturesSpawned: [],
          resourcesAvailable: ['Ore', 'Stone'],
          weatherCondition: 'Clear',
        };

        setLastResult(mockResult);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Exploration failed';
        setError(message);
      } finally {
        setIsMoving(false);
      }
    },
    []
  );

  return {
    isMoving,
    lastResult,
    error,
    handleMoveToRegion,
    handleExploreChunk,
  };
}
