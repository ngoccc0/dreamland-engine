"use client";

import { useState, useEffect } from 'react';
import GameLayout from '@/components/game/game-layout';
import { WorldSetup } from '@/components/game/world-setup';
import { LanguageSelector } from '@/components/game/language-selector';
import type { GameState, PlayerItem, ItemDefinition, GeneratedItem, WorldConcept } from '@/lib/game/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { itemDefinitions as staticItemDefinitions } from '@/lib/game/config';

type NewGameData = {
  worldSetup: Omit<WorldConcept, 'playerInventory' | 'customItemCatalog'> & { playerInventory: PlayerItem[] };
  customItemDefinitions: Record<string, ItemDefinition>;
  customItemCatalog: GeneratedItem[];
}

export default function Home() {
  const [loadState, setLoadState] = useState<'loading' | 'prompt' | 'new_game' | 'continue_game'>('loading');
  const [savedGameState, setSavedGameState] = useState<GameState | null>(null);
  const [newGameData, setNewGameData] = useState<NewGameData | null>(null);
  const [languageSelected, setLanguageSelected] = useState(false);

  useEffect(() => {
    try {
      const savedData = localStorage.getItem('gameState');
      if (savedData) {
        const gameState: GameState = JSON.parse(savedData);
        
        // Data migration for old save files where player items were strings
        if (gameState.playerStats?.items && gameState.playerStats.items.length > 0 && typeof (gameState.playerStats.items[0] as any) === 'string') {
          console.log("Migrating old inventory format...");
          gameState.playerStats.items = (gameState.playerStats.items as unknown as string[]).map((itemName): PlayerItem => ({
            name: itemName.replace(/ \(.*/, ''), // Attempt to clean up names like "Item (description)"
            quantity: 1,
            tier: 1, // Add a default tier
          }));
        }

        setSavedGameState(gameState);
        setLoadState('prompt');
      } else {
        setLoadState('new_game');
      }
    } catch (error) {
      console.error("Failed to load or migrate game state, starting a new game to prevent crash:", error);
      // If migration fails or any other error, treat as a new game to prevent crashes
      localStorage.removeItem('gameState');
      setLoadState('new_game');
    }
  }, []);

  const handleContinue = () => setLoadState('continue_game');
  
  const handleNewGame = () => {
    localStorage.removeItem('gameState');
    setSavedGameState(null);
    setNewGameData(null); // Clear new game data as well
    setLoadState('new_game');
  };

  const onWorldCreated = (world: WorldConcept) => {
    // 1. Process the AI's custom item catalog into the format the game engine uses.
    const customDefs: Record<string, ItemDefinition> = world.customItemCatalog.reduce((acc, item) => {
        acc[item.name] = {
            description: item.description,
            tier: item.tier,
            effects: item.effects,
            baseQuantity: item.baseQuantity,
        };
        return acc;
    }, {} as Record<string, ItemDefinition>);

    // Combine with static definitions, allowing customs to override.
    const allItemDefinitions = { ...staticItemDefinitions, ...customDefs };

    // 2. Transform the AI's chosen starting inventory into player items.
    // We need to look up the tier from the definitions we just created.
    const initialPlayerItems: PlayerItem[] = world.playerInventory.map(item => ({
        name: item.name,
        quantity: item.quantity,
        tier: allItemDefinitions[item.name]?.tier || 1 // Get tier from the combined list
    }));

    // 3. Create a version of the world setup suitable for the GameLayout
    const worldSetupForLayout = {
        worldName: world.worldName,
        initialNarrative: world.initialNarrative,
        startingBiome: world.startingBiome,
        initialQuests: world.initialQuests,
        playerInventory: initialPlayerItems,
    };
    
    // 4. Set the complete new game data in state
    setNewGameData({
        worldSetup: worldSetupForLayout,
        customItemDefinitions: allItemDefinitions,
        customItemCatalog: world.customItemCatalog, // Pass the raw catalog for spawning logic
    });
  };

  if (loadState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-background text-foreground">
        <p>Loading your adventure...</p>
      </div>
    );
  }
  
  if (loadState === 'prompt') {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-background text-foreground p-4">
        <Card className="w-full max-w-sm animate-in fade-in duration-500">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-headline">Welcome Back!</CardTitle>
            <CardDescription className="text-center">You have a game in progress.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button onClick={handleContinue} size="lg">
              Continue Journey
            </Button>
            <Button onClick={handleNewGame} size="lg" variant="outline">
              Start New Adventure
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadState === 'continue_game' && savedGameState) {
    return <GameLayout initialGameState={savedGameState} />;
  }

  // Flow for 'new_game'
  if (!languageSelected) {
    return <LanguageSelector onLanguageSelected={() => setLanguageSelected(true)} />;
  }
  
  if (!newGameData) {
    return <WorldSetup onWorldCreated={onWorldCreated} />;
  }
  
  return <GameLayout 
            worldSetup={newGameData.worldSetup} 
            customItemDefinitions={newGameData.customItemDefinitions}
            customItemCatalog={newGameData.customItemCatalog}
          />;
}
