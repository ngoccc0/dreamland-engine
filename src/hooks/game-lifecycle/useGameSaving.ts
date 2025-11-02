
'use client';

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { IGameStateRepository } from '@/lib/game/ports/game-state.repository';
import type { GameState } from "@/lib/game/types";
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
};

export function useGameSaving(deps: GameSavingDeps) {
  const {
    isLoaded, isSaving, isGameOver, setIsSaving, gameStateRepository, gameSlot,
    worldProfile, currentSeason, world, recipes, buildableStructures, regions,
    regionCounter, playerPosition, playerBehaviorProfile, playerStats,
    narrativeLogRef, finalWorldSetup, customItemDefinitions, customItemCatalog,
    customStructures, weatherZones, gameTime, day, turn,
  } = deps;

  const { toast } = useToast();

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
            await gameStateRepository.save(`slot_${gameSlot}`, gameState);
        } catch (error) {
            toast({ title: "Save Error", description: "Could not save your progress.", variant: "destructive"});
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
