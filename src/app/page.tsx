
"use client";

import { useState, useEffect, useCallback } from 'react';
import GameLayout from '@/components/game/game-layout';
import { WorldSetup } from '@/components/game/world-setup';
import { LanguageSelector } from '@/components/game/language-selector';
import { SettingsPopup } from '@/components/game/settings-popup';
import type { GameState, PlayerItem, ItemDefinition, GeneratedItem, WorldConcept, Skill } from '@/lib/game/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { itemDefinitions as staticItemDefinitions } from '@/lib/game/items';
import { useLanguage } from '@/context/language-context';
import { Loader2, Settings } from 'lucide-react';
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
  const [isSettingsOpen, setSettingsOpen] = useState(false);

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
            <g className="gear-group animate-spin-gear" transform="translate(4.5, 17) scale(0.025)">
              <path 
                fill="#C5B4C8"
                d="M12 8c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm-9.33 4.41c0-1.07.62-1.99 1.5-2.41 1.07-.5 2.29-.8 3.5-.8s2.43.3 3.5.8c.88.42 1.5 1.34 1.5 2.41V16H2.67v-1.59zM12 1c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM20 18v-2c0-2.66-5.33-4-8-4s-8 1.34-8 4v2h16zm-2 0H4v-.59c0-1.07.62-1.99 1.5-2.41 1.07-.5 2.29-.8 3.5-.8s2.43.3 3.5.8c.88.42 1.5 1.34 1.5 2.41V18z"
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
      <>
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
            <CardFooter className='justify-center'>
                 <Button onClick={() => setSettingsOpen(true)} variant="ghost">
                    <Settings className="mr-2 h-4 w-4" />
                    {t('gameSettings')}
                </Button>
            </CardFooter>
          </Card>
        </div>
        <SettingsPopup open={isSettingsOpen} onOpenChange={setSettingsOpen} />
      </>
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
