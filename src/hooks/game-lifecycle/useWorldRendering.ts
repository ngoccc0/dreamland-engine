
'use client';

import { useEffect } from 'react';
import { getEffectiveChunk } from '@/lib/game/engine/generation';
import type { GameState, Chunk } from "@/lib/game/types";

type WorldRenderingDeps = {
  isLoaded: boolean;
  world: GameState['world'];
  playerPosition: GameState['playerPosition'];
  weatherZones: GameState['weatherZones'];
  gameTime: number;
  setCurrentChunk: (chunk: Chunk | null) => void;
};

export function useWorldRendering(deps: WorldRenderingDeps) {
  const {
    isLoaded, world, playerPosition, weatherZones, gameTime, setCurrentChunk
  } = deps;

  // EFFECT: Update the visual representation of the current chunk whenever the environment changes.
  useEffect(() => {
    if (!isLoaded) return;
    
    const baseChunk = world[`${playerPosition.x},${playerPosition.y}`];
    if (baseChunk) {
        const newEffectiveChunk = getEffectiveChunk(baseChunk, weatherZones, gameTime);
        setCurrentChunk(newEffectiveChunk);
    } else {
        setCurrentChunk(null);
    }
  }, [world, playerPosition, gameTime, weatherZones, isLoaded, setCurrentChunk]);
}
