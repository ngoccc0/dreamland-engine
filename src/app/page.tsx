

"use client";

import { useState, useEffect, useCallback } from 'react';
import GameLayout from '@/components/game/game-layout';
import { WorldSetup } from '@/components/game/world-setup';
import { SettingsPopup } from '@/components/game/settings-popup';
import type { GameState, PlayerItem, ItemDefinition, GeneratedItem, WorldConcept, Skill, Structure } from '@/lib/game/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { itemDefinitions as staticItemDefinitions } from '@/lib/game/items';
import { useLanguage } from '@/context/language-context';
import { usePwaInstall } from '@/context/pwa-install-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Settings, Download } from 'lucide-react';
import type { TranslationKey } from '@/lib/i18n';

type NewGameData = {
  worldSetup: Omit<WorldConcept, 'playerInventory' | 'customItemCatalog' | 'customStructures'> & { playerInventory: PlayerItem[], startingSkill: Skill };
  customItemDefinitions: Record<string, ItemDefinition>;
  customItemCatalog: GeneratedItem[];
  customStructures: Structure[];
}

export default function Home() {
  const { t } = useLanguage();
  const { installPrompt, setInstallPrompt } = usePwaInstall();
  const [loadState, setLoadState] = useState<'loading' | 'prompt' | 'new_game' | 'continue_game'>('loading');
  const [savedGameState, setSavedGameState] = useState<GameState | null>(null);
  const [newGameData, setNewGameData] = useState<NewGameData | null>(null);
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  const parseAndSetSavedGame = useCallback(() => {
    try {
      const savedData = localStorage.getItem('gameState');
      if (savedData) {
        const gameState: GameState = JSON.parse(savedData);
        
        if (gameState.playerStats?.items && gameState.playerStats.items.length > 0 && typeof (gameState.playerStats.items[0] as any) === 'string') {
          gameState.playerStats.items = (gameState.playerStats.items as unknown as string[]).map((itemName): PlayerItem => ({
            name: itemName.replace(/ \(.*/, ''),
            quantity: 1,
            tier: 1,
            emoji: '❓',
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
            emoji: item.emoji,
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
        tier: allItemDefinitions[item.name]?.tier || 1,
        emoji: allItemDefinitions[item.name]?.emoji || '❓'
    }));

    const worldSetupForLayout = {
        worldName: world.worldName,
        initialNarrative: world.initialNarrative,
        startingBiome: world.startingBiome,
        initialQuests: world.initialQuests,
        playerInventory: initialPlayerItems,
        startingSkill: world.startingSkill,
        customStructures: world.customStructures,
    };
    
    setNewGameData({
        worldSetup: worldSetupForLayout,
        customItemDefinitions: allItemDefinitions,
        customItemCatalog: world.customItemCatalog,
        customStructures: world.customStructures,
    });
  };
  
  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the PWA installation');
      } else {
        console.log('User dismissed the PWA installation');
      }
      setInstallPrompt(null);
    });
  };

  if (loadState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-background text-foreground">
        <div className="flex flex-col items-center text-center p-4 animate-in fade-in duration-1000">
          <img src="/assets/logo.svg" alt="Dreamland Engine Logo" className="h-[384px] w-[384px]" />
          <div className="flex items-center justify-center">
            <h1 className="text-5xl font-bold font-headline tracking-tighter -mt-36">
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
      <TooltipProvider>
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
            <CardFooter className='justify-center gap-2'>
                 <Button onClick={() => setSettingsOpen(true)} variant="ghost">
                    <Settings className="mr-2 h-4 w-4" />
                    {t('gameSettings')}
                </Button>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span>
                            <Button onClick={handleInstallClick} variant="ghost" disabled={!installPrompt}>
                                <Download className="mr-2 h-4 w-4" />
                                {t('installAppButton')}
                            </Button>
                        </span>
                    </TooltipTrigger>
                    {!installPrompt && (
                        <TooltipContent>
                            <p>{t('installNotAvailableTooltip')}</p>
                        </TooltipContent>
                    )}
                </Tooltip>
            </CardFooter>
          </Card>
        </div>
        <SettingsPopup open={isSettingsOpen} onOpenChange={setSettingsOpen} />
      </TooltipProvider>
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
              customStructures={newGameData.customStructures}
            />;
  }

  return null;
}
