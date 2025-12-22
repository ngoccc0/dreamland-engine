/**
 * @file src/hooks/use-minimap-grid.ts
 * @description Hook for minimap grid generation and animation centering
 * 
 * @remarks
 * Handles complex minimap grid generation logic including:
 * - Chunk visibility calculation with Chebyshev distance (from grid.ts)
 * - Animation frame smoothing (smooth camera follow during movement)
 * - Grid exploration tracking
 * - Minimap viewport size configuration
 * 
 * **Integration:** Uses `chebyshevDistance()` from `@/core/math/grid.ts`
 * for consistent distance calculations across the codebase.
 */

import { useCallback, useEffect, useRef, useMemo } from 'react';
import { chebyshevDistance } from '@/core/math/grid';

type Position = { x: number; y: number };

interface MinimapGridState {
  memoizedGrid: any[];
  gridToPass: any[];
}

/**
 * Hook for minimap grid generation with animation smoothing
 * 
 * @remarks
 * Generates the visible portion of the world for minimap rendering.
 * Uses animation frame refs to smooth camera movement during player animation.
 * 
 * @param params.world - Game world object
 * @param params.playerPosition - Player's current grid position
 * @param params.visualPlayerPosition - Animated player position during movement
 * @param params.isAnimatingMove - Whether a move animation is in progress
 * @param params.visualMoveTo - Target position for move animation
 * @param params.turn - Current game turn (used for exploration tracking)
 * @param params.finalWorldSetup - World configuration (null if not loaded)
 * @param params.isLoaded - Whether world is fully loaded
 * @param params.minimapViewportSize - Minimap grid size (5, 7, or 9)
 * @param params.animationRefs - Object containing isAnimatingMoveRef, visualMoveToRef, etc.
 * 
 * @returns MinimapGridState with memoized and smoothed grids
 * 
 * @example
 * ```tsx
 * const { gridToPass } = useMinimapGrid({
 *   world,
 *   playerPosition,
 *   visualPlayerPosition,
 *   isAnimatingMove,
 *   // ... other params
 * });
 * return <Minimap grid={gridToPass} />;
 * ```
 */
export function useMinimapGrid({
  world,
  playerPosition,
  visualPlayerPosition: _visualPlayerPosition,
  isAnimatingMove: _isAnimatingMove,
  visualMoveTo: _visualMoveTo,
  turn: _turn,
  finalWorldSetup,
  isLoaded,
  minimapViewportSize,
  animationRefs,
}: {
  world: any;
  playerPosition: Position;
  visualPlayerPosition: Position;
  isAnimatingMove: boolean;
  visualMoveTo: Position | null;
  turn: number;
  finalWorldSetup: any;
  isLoaded: boolean;
  minimapViewportSize: number;
  animationRefs: {
    isAnimatingMoveRef: React.MutableRefObject<boolean>;
    visualMoveToRef: React.MutableRefObject<Position | null>;
    visualPlayerPositionRef: React.MutableRefObject<Position>;
    turnRef: React.MutableRefObject<number>;
    holdCenterUntilRef: React.MutableRefObject<number>;
    animationStartTimeRef: React.MutableRefObject<number>;
  };
}): MinimapGridState {
  const previousGridRef = useRef<any[]>([]);

  const generateMapGrid = useCallback(() => {
    if (!isLoaded || !finalWorldSetup) return [];

    const visibilityRadius = 1;
    const displayRadius = Math.floor(minimapViewportSize / 2);
    const size = displayRadius * 2 + 1;
    const grid = Array.from({ length: size }, () => Array(size).fill(null));

    const now = Date.now();
    const shouldUseVisualCenter =
      (animationRefs.isAnimatingMoveRef.current &&
        now > animationRefs.animationStartTimeRef.current &&
        (animationRefs.visualMoveToRef.current || animationRefs.visualPlayerPositionRef.current)) ||
      ((animationRefs.visualPlayerPositionRef.current || animationRefs.visualMoveToRef.current) &&
        animationRefs.holdCenterUntilRef.current > now);

    const playerForGrid = shouldUseVisualCenter
      ? animationRefs.visualMoveToRef.current || animationRefs.visualPlayerPositionRef.current || playerPosition
      : playerPosition;

    for (let gy = 0; gy < size; gy++) {
      for (let gx = 0; gx < size; gx++) {
        const wx = playerForGrid.x - displayRadius + gx;
        const wy = playerForGrid.y + displayRadius - gy;
        const chunkKey = `${wx},${wy}`;
        const chunk = world[chunkKey];

        if (chunk) {
          const refPos = playerForGrid || playerPosition;
          const distanceFromPlayer = chebyshevDistance(
            { x: wx, y: wy },
            { x: refPos.x, y: refPos.y }
          );

          if (distanceFromPlayer <= visibilityRadius) {
            if (!chunk.explored) chunk.explored = true;
            chunk.lastVisited = animationRefs.turnRef.current;
          }
        }

        grid[gy][gx] = chunk;
      }
    }
    return grid;
  }, [
    world,
    playerPosition,
    finalWorldSetup,
    isLoaded,
    minimapViewportSize,
    animationRefs.isAnimatingMoveRef,
    animationRefs.animationStartTimeRef,
    animationRefs.visualMoveToRef,
    animationRefs.visualPlayerPositionRef,
    animationRefs.holdCenterUntilRef,
    animationRefs.turnRef,
  ]);

  const memoizedGrid = useMemo(() => generateMapGrid(), [generateMapGrid]);

  const gridToPass = animationRefs.isAnimatingMoveRef.current ? previousGridRef.current : memoizedGrid;

  useEffect(() => {
    if (!animationRefs.isAnimatingMoveRef.current) {
      previousGridRef.current = memoizedGrid;
    }
  }, [memoizedGrid, animationRefs.isAnimatingMoveRef]);

  return {
    memoizedGrid,
    gridToPass,
  };
}

export default useMinimapGrid;
