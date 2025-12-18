'use client';

import { useMemo } from 'react';
import type { Region } from '@/core/types/game';

/**
 * Slice of game state related to world management.
 *
 * @remarks
 * Isolated from other game state to prevent unnecessary re-renders.
 * Only includes world/region-related fields.
 */
export interface WorldState {
  /** Currently active region where player is */
  currentRegion: Region | null;
  /** All discovered regions */
  discoveredRegions: Region[];
  /** Player's current chunk coordinates */
  currentChunk: { x: number; y: number } | null;
  /** Number of chunks explored */
  chunksExplored: number;
}

/**
 * Create world state slice from game state.
 *
 * @remarks
 * Selector that returns only world/region-related state.
 * Uses `useMemo` to prevent re-render on unrelated state changes.
 *
 * **Dependency Array:**
 * Only includes regions and playerPosition. Changes to playerStats,
 * inventory, or weather don't trigger re-render.
 *
 * @param regions - All regions from game state
 * @param playerPosition - Current player position
 * @returns WorldState - Current region, discovered regions, chunks explored
 */
export function createWorldStateSelector(
  regions: { [id: number]: Region } | undefined,
  playerPosition: { x: number; y: number }
): WorldState {
  return useMemo(() => {
    const allRegions = regions ? Object.values(regions) : [];

    // Determine current region based on player position
    // TODO: Implement region lookup based on position
    const currentRegion = allRegions.length > 0 ? allRegions[0] : null;

    // Get discovered regions (those with visitation count > 0)
    const discoveredRegions = allRegions.filter((r) => r && (r as any).visitationCount > 0);

    return {
      currentRegion,
      discoveredRegions,
      currentChunk: playerPosition,
      chunksExplored: discoveredRegions.length,
    };
  }, [regions, playerPosition]);
}
