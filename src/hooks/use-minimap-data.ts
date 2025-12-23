/**
 * @file src/hooks/use-minimap-data.ts
 * @description Custom hook for minimap data subscriptions
 *
 * @remarks
 * Wraps all minimap store subscriptions into a single hook.
 * Returns grid data, animation state, and viewport size together.
 *
 * **Usage:**
 * ```typescript
 * const minimapData = useMinimapData();
 * // Returns: { grid, centerX, centerY, isAnimating, viewportSize }
 * ```
 */

import { useMinimapStore, selectGridData, selectGridCenter, selectAnimating, selectViewportSize } from '@/store/minimap.store';

/**
 * Custom hook providing all minimap data in a single subscription
 *
 * @remarks
 * Aggregates multiple atomic selectors for convenience.
 * Each selector still triggers independent re-renders, but this hook
 * provides a cleaner interface for MiniMapSection.
 *
 * @returns Object with all minimap data fields
 */
export function useMinimapData() {
  const grid = useMinimapStore(selectGridData);
  const { x: centerX, y: centerY } = useMinimapStore(selectGridCenter);
  const isAnimating = useMinimapStore(selectAnimating);
  const viewportSize = useMinimapStore(selectViewportSize);

  return {
    grid,
    centerX,
    centerY,
    isAnimating,
    viewportSize,
  };
}
