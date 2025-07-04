
"use client";

import { useState, useEffect, useCallback } from 'react';
import GameLayout from '@/components/game/game-layout';
import { WorldSetup } from '@/components/game/world-setup';
import { SettingsPopup } from '@/components/game/settings-popup';
import type { GameState, PlayerItem, ItemDefinition, GeneratedItem, WorldConcept, Skill } from '@/lib/game/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { itemDefinitions as staticItemDefinitions } from '@/lib/game/items';
import { useLanguage } from '@/context/language-context';
import { Loader2, Settings } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { TranslationKey } from '@/lib/i18n';

type NewGameData = {
  worldSetup: Omit<WorldConcept, 'playerInventory' | 'customItemCatalog'> & { playerInventory: PlayerItem[], startingSkill: Skill };
  customItemDefinitions: Record<string, ItemDefinition>;
  customItemCatalog: GeneratedItem[];
}

export default function Home() {
  const { t } = useLanguage();
  const [loadState, setLoadState] = useState<'loading' | 'prompt' | 'new_game' | 'continue_game'>('loading');
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
    // The LanguageProvider will handle loading the language from localStorage.
    // We can directly proceed to check for a saved game.
    parseAndSetSavedGame();
  }, [parseAndSetSavedGame]);

  const handleContinue = () => setLoadState('continue_game');
  
  const handleNewGame = () => {
    localStorage.removeItem('gameState');
    setSavedGameState(null);
    setNewGameData(null);
    setLoadState('new_game');
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
            className="h-32 w-32"
            viewBox="0 0 120 120"
          >
            <defs>
              <style>
                {`.gear-logo { animation: spin 10s linear infinite; transform-origin: 22px 92px; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
              </style>
            </defs>
            
            <path 
              d="M 15 115 C 0 115, 0 90, 20 90 C 20 70, 60 70, 60 90 C 80 85, 100 85, 110 95 C 125 95, 125 115, 105 115 Z"
              fill="#f0f4f8"
              stroke="#cfd8dc"
              strokeWidth="0.5"
            />
          
            <path 
              d="M 15 103 C 30 98, 95 98, 110 103 A 15 15 0 0 0 110 103 Z"
              fill="#A1887F"
            />
            <path 
              d="M 20 98 C 30 82, 95 82, 105 98 Z"
              fill="#689F38"
            />
            <path 
              d="M 25 93 C 40 78, 90 78, 100 93 A 10 10 0 0 0 100 93 Z"
              fill="#4CAF50"
            />
          
            <g>
              <rect x="52" y="59" width="6" height="14" rx="2" fill="#F5EFE6"/>
              <path d="M 50 59 C 50 48, 66 48, 66 59 Z" fill="#EF5350"/>
              <circle cx="53" cy="54" r="1.2" fill="white"/>
              <circle cx="58" cy="52" r="1.4" fill="white"/>
              <circle cx="63" cy="55" r="1.2" fill="white"/>
            </g>
            <g>
              <rect x="75" y="64" width="5" height="10" rx="2" fill="#F5EFE6"/>
              <path d="M 73 64 C 73 56, 83 56, 83 64 Z" fill="#E53935"/>
              <circle cx="76" cy="61" r="1" fill="white"/>
              <circle cx="80" cy="59" r="1.2" fill="white"/>
            </g>
            
            <g className="gear-logo">
              <path 
                d="M22,82 a10,10 0 1,0 0,20 a10,10 0 1,0 0,-20" 
                stroke="#B0BEC5" strokeWidth="3" fill="#E0E0E0"
              />
              <path 
                d="M22 77 L22 107 M12 92 L32 92 M15 80 L29 104 M29 80 L15 104" 
                stroke="#B0BEC5" strokeWidth="2.5"
              />
              <circle cx="22" cy="92" r="3" fill="#CFD8DC"/>
            </g>
          </svg>
          <div className="flex items-center justify-center">
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
