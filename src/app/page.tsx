
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
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
        if (!gameState.playerStats.skills) {
          gameState.playerStats.skills = [];
        }
        if (gameState.playerStats.bodyTemperature === undefined) {
          gameState.playerStats.bodyTemperature = 37;
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-20 w-20"
            viewBox="0 0 24 24"
          >
            <style>
              {`
                .gear-group {
                  transform-origin: 4px 16px;
                }
              `}
            </style>
            <path
              d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10Z"
              fill="#fce7f3"
              stroke="#fbcfe8"
              strokeWidth="0.5"
            />
            <g className="gear-group animate-spin-gear" transform="translate(1, 13) scale(0.25)">
              <path
                fill="#C5B4C8"
                d="M19.9,12.6c0-0.3,0-0.5,0-0.8c-0.1-1.3-0.4-2.6-1-3.8c-0.2-0.3-0.5-0.5-0.9-0.6l-3-0.9c-0.2,0-0.5-0.1-0.7-0.2 c-1.2-0.8-2.5-1.4-3.8-1.7l-0.9-3c-0.1-0.4-0.4-0.6-0.8-0.7c-1.3-0.3-2.6-0.4-3.9-0.4c-0.4,0-0.7,0.2-0.8,0.5l-0.9,3 C6.6,4.5,5.5,5.1,4.5,5.9L1.6,5C1.2,4.8,0.8,5,0.6,5.4c-0.8,1.3-1.4,2.7-1.7,4.2c-0.1,0.4,0.1,0.8,0.4,1l2.5,2.1 c-0.1,0.5-0.1,1-0.1,1.6c0,0.6,0,1.1,0.1,1.6l-2.5,2.1c-0.3,0.2-0.5,0.7-0.4,1c0.3,1.5,0.9,2.9,1.7,4.2c0.2,0.4,0.7,0.6,1.1,0.4 l2.9-0.9c1,0.8,2.1,1.4,3.3,1.8l0.9,3c0.1,0.4,0.4,0.6,0.8,0.7c1.3,0.3,2.6,0.4,3.9,0.4c0.4,0,0.7-0.2,0.8,0.5l0.9-3 c1.2-0.4,2.3-1,3.3-1.8l2.9,0.9c0.4,0.2,0.9,0,1.1-0.4c0.8-1.3,1.4-2.7,1.7-4.2c0.1-0.4-0.1-0.8-0.4-1l-2.5-2.1 C19.8,13.6,19.9,13.1,19.9,12.6z M12,16.4c-2.4,0-4.4-2-4.4-4.4s2-4.4,4.4-4.4s4.4,2,4.4,4.4S14.4,16.4,12,16.4z"
              />
            </g>
          </svg>
          <div className="h-[60px] flex items-center justify-center">
            <h1 className="text-5xl font-bold font-headline tracking-tighter">
              Dreamland Engine
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-4 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p>{t('loadingAdventure')}</p>
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
