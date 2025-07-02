"use client";

import { useState, useEffect, useCallback } from 'react';
import GameLayout from '@/components/game/game-layout';
import { WorldSetup } from '@/components/game/world-setup';
import { LanguageSelector } from '@/components/game/language-selector';
import type { GameState, PlayerItem, ItemDefinition, GeneratedItem, WorldConcept, Skill } from '@/lib/game/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { itemDefinitions as staticItemDefinitions } from '@/lib/game/items';
import { useLanguage } from '@/context/language-context';
import { BrainCircuit, Loader2 } from 'lucide-react';

type NewGameData = {
  worldSetup: Omit<WorldConcept, 'playerInventory' | 'customItemCatalog'> & { playerInventory: PlayerItem[], startingSkill: Skill };
  customItemDefinitions: Record<string, ItemDefinition>;
  customItemCatalog: GeneratedItem[];
}

export default function Home() {
  const { t } = useLanguage();
  const [loadState, setLoadState] = useState<'loading' | 'select_language' | 'prompt' | 'new_game' | 'continue_game'>('loading');
  const [savedGameState, setSavedGameState] = useState<GameState | null>(null);
  const [newGameData, setNewGameData] = useState<NewGameData | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This ensures that we only render the text on the client, after the language has been determined.
    // This prevents a hydration mismatch error and language flicker.
    setIsClient(true);
  }, []);

  const parseAndSetSavedGame = useCallback(() => {
    try {
      const savedData = localStorage.getItem('gameState');
      if (savedData) {
        const gameState: GameState = JSON.parse(savedData);
        
        // Data migration for old save files
        if (gameState.playerStats?.items && gameState.playerStats.items.length > 0 && typeof (gameState.playerStats.items[0] as any) === 'string') {
          gameState.playerStats.items = (gameState.playerStats.items as unknown as string[]).map((itemName): PlayerItem => ({
            name: itemName.replace(/ \(.*/, ''),
            quantity: 1,
            tier: 1,
          }));
        }
        if (!gameState.playerStats.unlockProgress) {
          gameState.playerStats.unlockProgress = { kills: 0, damageSpells: 0, moves: 0 };
        }
        if (!gameState.playerStats.skills) {
          gameState.playerStats.skills = [];
        }


        setSavedGameState(gameState);
        setLoadState('prompt');
      } else {
        setLoadState('new_game');
      }
    } catch (error) {
      console.error("Failed to load or migrate game state, starting a new game to prevent crash:", error);
      localStorage.removeItem('gameState');
      setLoadState('new_game');
    }
  }, []);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('gameLanguage');
    if (!savedLanguage) {
      setLoadState('select_language');
    } else {
      parseAndSetSavedGame();
    }
  }, [parseAndSetSavedGame]);

  const handleContinue = () => setLoadState('continue_game');
  
  const handleNewGame = () => {
    localStorage.removeItem('gameState');
    setSavedGameState(null);
    setNewGameData(null);
    setLoadState('new_game');
  };

  const handleLanguageSelected = () => {
    // After language is selected, determine where to go next.
    parseAndSetSavedGame();
  };

  const onWorldCreated = (world: WorldConcept) => {
    const customDefs: Record<string, ItemDefinition> = world.customItemCatalog.reduce((acc, item) => {
        acc[item.name] = {
            description: item.description,
            tier: item.tier,
            category: item.category,
            effects: item.effects,
            baseQuantity: item.baseQuantity,
            growthConditions: item.growthConditions as any,
        };
        return acc;
    }, {} as Record<string, ItemDefinition>);

    const allItemDefinitions = { ...staticItemDefinitions, ...customDefs };

    const initialPlayerItems: PlayerItem[] = world.playerInventory.map(item => ({
        name: item.name,
        quantity: item.quantity,
        tier: allItemDefinitions[item.name]?.tier || 1
    }));

    const worldSetupForLayout = {
        worldName: world.worldName,
        initialNarrative: world.initialNarrative,
        startingBiome: world.startingBiome,
        initialQuests: world.initialQuests,
        playerInventory: initialPlayerItems,
        startingSkill: world.startingSkill,
    };
    
    setNewGameData({
        worldSetup: worldSetupForLayout,
        customItemDefinitions: allItemDefinitions,
        customItemCatalog: world.customItemCatalog,
    });
  };

  if (loadState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-background text-foreground">
        <div className="flex flex-col items-center gap-4 text-center p-4 animate-in fade-in duration-1000">
          <BrainCircuit className="h-20 w-20 text-primary" />
          <h1 className="text-5xl font-bold font-headline tracking-tighter h-[60px]">
            {isClient ? t('gameTitle') : <>&nbsp;</>}
          </h1>
          <div className="flex items-center gap-2 mt-4 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p>{isClient ? t('loadingAdventure') : <>&nbsp;</>}</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadState === 'select_language') {
    return <LanguageSelector onLanguageSelected={handleLanguageSelected} />;
  }
  
  if (loadState === 'prompt') {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-background text-foreground p-4">
        <Card className="w-full max-w-sm animate-in fade-in duration-500">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-headline">{t('welcomeBack')}</CardTitle>
            <CardDescription className="text-center">{t('gameInProgress')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button onClick={handleContinue} size="lg">
              {t('continueJourney')}
            </Button>
            <Button onClick={handleNewGame} size="lg" variant="outline">
              {t('startNewAdventure')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadState === 'continue_game' && savedGameState) {
    return <GameLayout initialGameState={savedGameState} />;
  }
  
  if (loadState === 'new_game') {
     if (!newGameData) {
        return <WorldSetup onWorldCreated={onWorldCreated} />;
    }
    return <GameLayout 
              worldSetup={newGameData.worldSetup} 
              customItemDefinitions={newGameData.customItemDefinitions}
              customItemCatalog={newGameData.customItemCatalog}
            />;
  }

  return null; // Fallback for unexpected states
}
