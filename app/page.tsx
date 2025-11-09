"use client";

import { useState, useEffect, useCallback } from 'react';
import GameLayout from '@/components/game/game-layout';
import { WorldSetup } from '@/components/game/world-setup';
import { SettingsPopup } from '@/components/game/settings-popup';
import type { GameState, ItemDefinition } from '@/lib/game/types';
import type { GenerateWorldSetupOutput } from "@/ai/flows/generate-world-setup";
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/context/language-context';
import { usePwaInstall } from '@/context/pwa-install-context';
import { useAuth } from '@/context/auth-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Settings, Download, Trash2, Play, PlusCircle, Star, User, Backpack, Swords } from 'lucide-react';
import { Language } from '@/lib/i18n';
import { LanguageSelector } from '@/components/game/language-selector';
import { cn, getTranslatedText } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import type { IGameStateRepository } from '@/lib/game/ports/game-state.repository';
import { LocalStorageGameStateRepository } from '@/infrastructure/persistence/local-storage.repository';
import { FirebaseGameStateRepository } from '@/infrastructure/persistence/firebase.repository';
import { IndexedDbGameStateRepository } from '@/infrastructure/persistence/indexed-db.repository';
import { logger } from '@/lib/logger';


type SaveSlotSummary = Pick<GameState, 'worldSetup' | 'day' | 'gameTime' | 'playerStats'> | null;

export default function Home() {
  const { t, language, setLanguage } = useLanguage();
  const { installPrompt, setInstallPrompt } = usePwaInstall();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [gameStateRepository, setGameStateRepository] = useState<IGameStateRepository>(new LocalStorageGameStateRepository());
  const [loadState, setLoadState] = useState<'loading' | 'language_select' | 'slot_selection' | 'new_game' | 'continue_game'>('loading');
  const [saveSlots, setSaveSlots] = useState<SaveSlotSummary[]>([null, null, null]);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const [isSettingsOpen, setSettingsOpen] = useState(false);

  // Determine which repository to use based on auth state and browser capabilities
  useEffect(() => {
    let repo: IGameStateRepository;
    if (user) {
      repo = new FirebaseGameStateRepository(user.uid);
    } else if (typeof window !== 'undefined' && 'indexedDB' in window) {
      repo = new IndexedDbGameStateRepository();
    } else {
      repo = new LocalStorageGameStateRepository();
    }
    setGameStateRepository(repo);
  }, [user]);

  // Dev-only: log loadState and activeSlot transitions to help diagnose unexpected navigation/unmounts
  useEffect(() => {
    logger.debug('[Home] loadState changed', { loadState, activeSlot });
    // expose for quick console checks
    try { (window as any).__HOME_LOAD_STATE = { loadState, activeSlot }; } catch {}
  }, [loadState, activeSlot]);

  useEffect(() => {
    logger.debug('[Home] gameStateRepository set', { repo: (gameStateRepository as any)?.constructor?.name });
    try { (window as any).__GAME_STATE_REPO = (gameStateRepository as any)?.constructor?.name || null; } catch {}
  }, [gameStateRepository]);

  const loadSaveSlots = useCallback(async () => {
    setLoadState('loading');
    try {
      const summaries = await gameStateRepository.listSaveSummaries();
      setSaveSlots(summaries);
    } catch (error) {
      console.error("Failed to load save slots:", error);
      toast({ title: "Error", description: "Failed to load save data.", variant: "destructive" });
      setSaveSlots([null, null, null]); // Fallback to empty slots on error
    } finally {
      setLoadState('slot_selection');
    }
  }, [gameStateRepository, toast]);

  // Main effect to drive the initial state of the application
  useEffect(() => {
    if (authLoading) {
      setLoadState('loading');
      return;
    }
    const savedLanguage = localStorage.getItem('gameLanguage') as Language | null;
    if (savedLanguage) {
      if (language !== savedLanguage) {
        setLanguage(savedLanguage);
      }
      loadSaveSlots();
    } else {
      setLoadState('language_select');
    }
  }, [authLoading, user, language, setLanguage, loadSaveSlots]);

  const handleLanguageSelected = (lang: Language) => {
    setLanguage(lang);
    loadSaveSlots(); // After selecting language, load the slots
  };

  const handlePlay = (slotIndex: number) => {
    setActiveSlot(slotIndex);
    setLoadState('continue_game');
  };

  const handleNewGame = (slotIndex: number) => {
    setActiveSlot(slotIndex);
    setLoadState('new_game');
  };

  const handleDelete = async (slotIndex: number) => {
    try {
        await gameStateRepository.delete(`slot_${slotIndex}`);
        setSaveSlots(prev => {
            const newSlots = [...prev];
            newSlots[slotIndex] = null;
            return newSlots;
        });
    } catch (error) {
        console.error("Failed to delete save slot:", error);
        toast({ title: "Error", description: "Failed to delete save.", variant: "destructive" });
    }
  };

  const onWorldCreated = async (worldSetupData: GenerateWorldSetupOutput) => {
    if (activeSlot === null) return;
    const conceptIndex = Math.floor(Math.random() * worldSetupData.concepts.length);
    const selectedConcept = worldSetupData.concepts[conceptIndex];
    const allCustomItems = worldSetupData.customItemCatalog || [];

    const customDefs = allCustomItems.reduce((acc, item) => {
        const itemName = typeof item.name === 'object' ? t(item.name) : item.name;
        const itemDesc = typeof item.description === 'object' ? t(item.description) : item.description;
        acc[itemName] = {
            ...item,
            name: itemName,
            description: itemDesc,
            spawnEnabled: true
        };
        return acc;
    }, {} as Record<string, ItemDefinition>);

    const initialPlayerInventory = selectedConcept.playerInventory.map(item => {
        const def = allCustomItems.find(def => {
            const defName = typeof def.name === 'object' ? t(def.name) : def.name;
            const itemName = typeof item.name === 'object' ? t(item.name) : item.name;
            return defName === itemName;
        });
        const itemName = typeof item.name === 'object' ? t(item.name) : item.name;
        return {
            name: itemName,
            quantity: item.quantity,
            tier: def?.tier || 1,
            emoji: def?.emoji || '❓'
        };
    });

    const worldConceptForState: GameState['worldSetup'] = {
      worldName: selectedConcept.worldName,
      initialNarrative: selectedConcept.initialNarrative,
      startingBiome: selectedConcept.startingBiome,
      initialQuests: selectedConcept.initialQuests,
      startingSkill: selectedConcept.startingSkill,
      customStructures: worldSetupData.customStructures || [],
      playerInventory: initialPlayerInventory,
    };
    const newGameState: GameState = {
      worldSetup: worldConceptForState,
      playerStats: {
        hp: 100, mana: 50, stamina: 100, hunger: 100, maxHunger: 100, bodyTemperature: 37, items: initialPlayerInventory, equipment: { weapon: null, armor: null, accessory: null },
  // playerStats.quests expects a string[] of quest ids — translate the concept's translatable quests
  quests: (selectedConcept.initialQuests || []).map(q => getTranslatedText(q as any, language, t)),
  questsCompleted: 0, skills: selectedConcept.startingSkill ? [selectedConcept.startingSkill] : [], pets: [], persona: 'none',
        attributes: { physicalAttack: 10, magicalAttack: 5, critChance: 5, attackSpeed: 1.0, cooldownReduction: 0, physicalDefense: 0, magicalDefense: 0 },
        unlockProgress: { kills: 0, damageSpells: 0, moves: 0 }, journal: {}, dailyActionLog: [], questHints: {},
        level: 1,
        experience: 0,
      },
      customItemCatalog: allCustomItems,
      customItemDefinitions: customDefs,
      customStructures: worldSetupData.customStructures || [],
      day: 1, turn: 1, narrativeLog: [], worldProfile: { climateBase: 'temperate', magicLevel: 5, mutationFactor: 2, sunIntensity: 7, weatherTypesAllowed: ['clear', 'rain', 'fog'], moistureBias: 0, tempBias: 0, resourceDensity: 5, theme: 'Normal', },
      currentSeason: 'spring', gameTime: 360, weatherZones: {}, world: {}, recipes: {}, buildableStructures: {}, regions: {}, regionCounter: 0,
      playerPosition: { x: 0, y: 0 }, playerBehaviorProfile: { moves: 0, attacks: 0, crafts: 0, customActions: 0 },
    };
    
    try {
      await gameStateRepository.save(`slot_${activeSlot}`, newGameState);
      
      setSaveSlots(prev => {
        const newSlots = [...prev];
        newSlots[activeSlot!] = { worldSetup: newGameState.worldSetup, day: newGameState.day, gameTime: newGameState.gameTime, playerStats: newGameState.playerStats };
        return newSlots;
      });
      setLoadState('continue_game');
    } catch (error) {
      console.error("Failed to save new game state:", error);
      toast({ title: t('worldGenError'), description: "Could not save the new world. Please try again.", variant: "destructive" });
    }
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
  
  const getGameTimeAsString = (gameTime: number): string => {
      const hour = Math.floor(gameTime / 60);
      const minute = gameTime % 60;
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  // Render loading screen
  if (loadState === 'loading' || authLoading) {
    return (
      <div className="flex flex-col items-center justify-end min-h-dvh bg-gradient-to-br from-[#181824] via-[#23234a] to-[#23234a] text-foreground pb-4">
        <div className="flex flex-col items-center md:relative md:w-[480px] md:h-[480px] md:flex-none">
          <img src="/asset/images/logo.png" alt="Dreamland Engine" className="max-w-full h-auto object-contain md:absolute md:inset-0 md:w-full md:h-full" style={{ maxWidth: '480px', maxHeight: '480px' }} />
          <div className="md:absolute md:inset-0 md:flex md:flex-col md:items-center md:justify-end md:z-10 md:pb-4">
            <h1 className="text-5xl font-bold tracking-tight text-primary drop-shadow-lg text-shadow-black mb-6" style={{ fontFamily: language ? `var(--font-${language})` : undefined }}>
              Dreamland Engine
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p className="text-shadow-black">{t('loadingAdventure')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Render language selector if needed
  if (loadState === 'language_select') {
    return <LanguageSelector onLanguageSelected={handleLanguageSelected} />;
  }
  
  // Render the main slot selection menu
  if (loadState === 'slot_selection') {
    return (
      <TooltipProvider>
        <div className="flex flex-col items-center justify-center min-h-dvh bg-background text-foreground p-4 relative">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Button onClick={() => setSettingsOpen(true)} variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="w-full sm:w-auto">
                        <Button onClick={handleInstallClick} variant="ghost" size="icon" disabled={!installPrompt}>
                            <Download className="h-5 w-5" />
                        </Button>
                    </span>
                </TooltipTrigger>
                {!installPrompt && (
                    <TooltipContent>
                        <p>{t('installNotAvailableTooltip')}</p>
                    </TooltipContent>
                )}
            </Tooltip>
          </div>

          <header className="text-center mb-8">
            <h1 className="text-5xl font-bold font-headline tracking-tighter">
              {t('gameTitle')}
            </h1>
            <p className="text-muted-foreground">{t('welcomeBack')}</p>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
            {saveSlots.map((slot, index) => (
               <Card key={index} className={cn("flex flex-col", slot ? "border-primary" : "border-dashed")}>
                 <div className="p-4 flex flex-col flex-grow">
                   {slot ? (
                     <>
                        <div className="flex-grow space-y-4">
                            <CardTitle className="truncate">{getTranslatedText(slot.worldSetup.worldName, language, t)}</CardTitle>
                            <CardDescription>{t('dayX_time', { day: slot.day, time: getGameTimeAsString(slot.gameTime ?? 360) })}</CardDescription>

                            <Separator />

                            <div className="text-sm text-muted-foreground space-y-2">
                                <div className="flex items-center gap-2">
                                    <Star className="h-4 w-4 text-primary" />
                                    <span>{t('levelLabel')}: {(slot.playerStats.questsCompleted ?? 0) + 1}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary" />
                                    <span>{t(slot.playerStats.persona)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Backpack className="h-4 w-4 text-primary" />
                                    <span>{t('itemsLabel')}: {slot.playerStats.items.reduce((acc, item) => acc + item.quantity, 0)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Swords className="h-4 w-4 text-primary" />
                                    <span>{t('killsLabel')}: {slot.playerStats.unlockProgress.kills}</span>
                                </div>
                            </div>
                        </div>

                       <div className="mt-auto pt-6">
                         <div className="grid grid-cols-2 gap-2">
                           <Button onClick={() => handlePlay(index)} className="w-full">
                             <Play className="mr-2 h-4 w-4" /> {t('continueJourney')}
                           </Button>
                           <AlertDialog>
                             <AlertDialogTrigger asChild>
                               <Button variant="destructive" className="w-full">
                                 <Trash2 className="mr-2 h-4 w-4" /> {t('deleteSave')}
                               </Button>
                             </AlertDialogTrigger>
                             <AlertDialogContent>
                               <AlertDialogHeader>
                                 <AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle>
                                 <AlertDialogDescription>
                                   {slot.worldSetup?.worldName
                                     ? t('confirmDeleteDesc', { worldName: getTranslatedText(slot.worldSetup.worldName, language, t) })
                                     : t('confirmDeleteDescGeneric')
                                   }
                                 </AlertDialogDescription>
                               </AlertDialogHeader>
                               <AlertDialogFooter>
                                 <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                 <AlertDialogAction onClick={() => handleDelete(index)}>{t('confirm')}</AlertDialogAction>
                               </AlertDialogFooter>
                             </AlertDialogContent>
                           </AlertDialog>
                         </div>
                       </div>
                     </>
                   ) : (
                     <div className="flex flex-col h-full">
                        <div className="flex-grow">
                            <CardTitle>{t('emptySlot')}</CardTitle>
                            <CardDescription>{t('newAdventureHint')}</CardDescription>
                        </div>
                        <div className="mt-auto">
                            <Button onClick={() => handleNewGame(index)} className="w-full">
                                <PlusCircle className="mr-2 h-4 w-4" /> {t('startNewAdventure')}
                            </Button>
                        </div>
                     </div>
                   )}
                 </div>
               </Card>
            ))}
          </div>
        </div>
        <SettingsPopup open={isSettingsOpen} onOpenChange={setSettingsOpen} isInGame={false} />
      </TooltipProvider>
    );
  }

  // Render the new game creation flow
  if (loadState === 'new_game' && activeSlot !== null) {
     return <WorldSetup onWorldCreated={onWorldCreated} />;
  }

  // Render the actual game layout
  if (loadState === 'continue_game' && activeSlot !== null) {
    return <GameLayout gameSlot={activeSlot} />;
  }

  return null;
}
