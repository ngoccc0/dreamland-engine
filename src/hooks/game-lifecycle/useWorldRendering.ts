

'use client';

import { useEffect } from 'react';
import { getEffectiveChunk } from '@/lib/game/engine/generation';
import { useSettings } from '@/context/settings-context';
import type { GameState, Chunk } from "@/lib/game/types";

/**
 * @typedef {object} WorldRenderingDeps
 * Dependencies for the useWorldRendering hook.
 */
type WorldRenderingDeps = {
  isLoaded: boolean;
  world: GameState['world'];
  playerPosition: GameState['playerPosition'];
  weatherZones: GameState['weatherZones'];
  gameTime: number;
  setCurrentChunk: (chunk: Chunk | null) => void;
};

/**
 * Manages the calculation of the "effective" chunk based on environmental factors.
 * This hook is responsible for taking the base chunk data and applying dynamic
 * modifiers like weather and time of day to produce the final, "effective" chunk that the
* player actually experiences and that the narrative is based on.
 *
 * @param {WorldRenderingDeps} deps - The dependencies required for rendering the world state.
 */
export function useWorldRendering(deps: WorldRenderingDeps) {
  const {
    isLoaded, world, playerPosition, weatherZones, gameTime, setCurrentChunk
  } = deps;

  const { settings } = useSettings();
  const sStart = (settings as any).startTime ?? 0;
  const sDayDuration = (settings as any).dayDuration ?? 24000;

  // EFFECT: Update the visual representation of the current chunk whenever the environment changes.
  useEffect(() => {
    if (!isLoaded) return;
    
    const baseChunk = world[`${playerPosition.x},${playerPosition.y}`];
    if (baseChunk) {
  const newEffectiveChunk = getEffectiveChunk(baseChunk, weatherZones, gameTime, sStart, sDayDuration);
        setCurrentChunk(newEffectiveChunk);
    } else {
        setCurrentChunk(null);
    }
  }, [world, playerPosition, gameTime, weatherZones, isLoaded, setCurrentChunk]);
}
