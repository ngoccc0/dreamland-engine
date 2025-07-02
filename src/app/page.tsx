
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
                  transform-origin: 12px 12px;
                }
              `}
            </style>
            <path
              d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10Z"
              fill="#fce7f3"
              stroke="#fbcfe8"
              strokeWidth="0.5"
            />
            <g className="gear-group animate-spin-gear" transform="translate(2, 15) scale(0.2)">
              <path 
                fill="#C5B4C8"
                d="M16.5,12A4.5,4.5 0 0,1 12,16.5A4.5,4.5 0 0,1 7.5,12A4.5,4.5 0 0,1 12,7.5A4.5,4.5 0 0,1 16.5,12M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M19.9,12C19.9,11.7 19.9,11.3 19.8,11L22.4,9.1C22.6,8.9 22.7,8.6 22.5,8.4L20.1,4.6C20,4.4 19.7,4.4 19.5,4.5L16.6,5.7C16.1,5.3 15.6,5 15,4.8L14.6,1.9C14.6,1.6 14.3,1.4 14,1.4H10C9.7,1.4 9.4,1.6 9.4,1.9L9,4.8C8.4,5 7.9,5.3 7.4,5.7L4.5,4.5C4.3,4.4 4,4.4 3.9,4.6L1.5,8.4C1.3,8.6 1.4,8.9 1.6,9.1L4.2,11C4.1,11.3 4.1,11.7 4.1,12C4.1,12.3 4.1,12.7 4.2,13L1.6,14.9C1.4,15.1 1.3,15.4 1.5,15.6L3.9,19.4C4,19.6 4.3,19.6 4.5,19.5L7.4,18.3C7.9,18.7 8.4,19 9,19.2L9.4,22.1C9.4,22.4 9.7,22.6 10,22.6H14C14.3,22.6 14.6,22.4 14.6,22.1L15,19.2C15.6,19 16.1,18.7 16.6,18.3L19.5,19.5C19.7,19.6 20,19.6 20.1,19.4L22.5,15.6C22.7,15.4 22.6,15.1 22.4,14.9L19.8,13C19.9,12.7 19.9,12.3 19.9,12Z" 
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
