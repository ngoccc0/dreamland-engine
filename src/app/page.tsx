"use client";

import { useState, useEffect } from 'react';
import GameLayout from '@/components/game/game-layout';
import { WorldSetup } from '@/components/game/world-setup';
import type { WorldConcept } from '@/ai/flows/generate-world-setup';
import { LanguageSelector } from '@/components/game/language-selector';
import type { GameState, PlayerItem } from '@/lib/game/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Home() {
  const [loadState, setLoadState] = useState<'loading' | 'prompt' | 'new_game' | 'continue_game'>('loading');
  const [savedGameState, setSavedGameState] = useState<GameState | null>(null);
  const [worldSetup, setWorldSetup] = useState<WorldConcept | null>(null);
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
    setLoadState('new_game');
  };

  const onWorldCreated = (world: WorldConcept) => {
    setWorldSetup(world);
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
  
  if (!worldSetup) {
    return <WorldSetup onWorldCreated={onWorldCreated} />;
  }
  
  return <GameLayout worldSetup={worldSetup} />;
}
