
"use client";

import { useState, useEffect, useCallback } from 'react';
import GameLayout from '@/components/game/game-layout';
import { WorldSetup } from '@/components/game/world-setup';
import { SettingsPopup } from '@/components/game/settings-popup';
import type { GameState, GeneratedItem, WorldConcept, Skill, Structure } from '@/lib/game/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useLanguage } from '@/context/language-context';
import { usePwaInstall } from '@/context/pwa-install-context';
import { useAuth } from '@/context/auth-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Settings, Download, Trash2, Play, PlusCircle } from 'lucide-react';
import type { TranslationKey, Language } from '@/lib/i18n';
import { LanguageSelector } from '@/components/game/language-selector';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase-config";

type SaveSlotSummary = Pick<GameState, 'worldSetup' | 'day'> | null;

export default function Home() {
  const { t, language, setLanguage } = useLanguage();
  const { installPrompt, setInstallPrompt } = usePwaInstall();
  const { user, loading: authLoading } = useAuth();

  const [loadState, setLoadState] = useState<'loading' | 'language_select' | 'slot_selection' | 'new_game' | 'continue_game'>('loading');
  const [saveSlots, setSaveSlots] = useState<SaveSlotSummary[]>([null, null, null]);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const [isSettingsOpen, setSettingsOpen] = useState(false);

  const loadSaveSlots = useCallback(async () => {
    setLoadState('loading');
    let slots: SaveSlotSummary[] = [null, null, null];
    if (user) { // Load from Firebase
      const gamesColRef = collection(db, "users", user.uid, "games");
      const querySnapshot = await getDocs(gamesColRef);
      querySnapshot.forEach(doc => {
        const docId = doc.id; // e.g., "slot_0"
        const slotIndex = parseInt(docId.split('_')[1], 10);
        if (slotIndex >= 0 && slotIndex < 3) {
          const data = doc.data() as GameState;
          slots[slotIndex] = { worldSetup: data.worldSetup, day: data.day };
        }
      });
    } else { // Load from localStorage
      slots = [0, 1, 2].map(i => {
        try {
          const savedData = localStorage.getItem(`gameState_${i}`);
          if (savedData) {
            const gameState: GameState = JSON.parse(savedData);
            return { worldSetup: gameState.worldSetup, day: gameState.day };
          }
          return null;
        } catch {
          return null;
        }
      });
    }
    setSaveSlots(slots);
    setLoadState('slot_selection');
  }, [user]);

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
    if (user) {
        await deleteDoc(doc(db, "users", user.uid, "games", `slot_${slotIndex}`));
    } else {
        localStorage.removeItem(`gameState_${slotIndex}`);
    }
    setSaveSlots(prev => {
        const newSlots = [...prev];
        newSlots[slotIndex] = null;
        return newSlots;
    });
  };

  const onWorldCreated = (world: WorldConcept, generatedItemCatalog: GeneratedItem[], allItemDefinitions: Record<string, any>, customStructures: Structure[]) => {
      if (activeSlot === null) return;
      
      const newGameState: Partial<GameState> = {
          worldSetup: {
              worldName: world.worldName,
              initialNarrative: world.initialNarrative,
              startingBiome: world.startingBiome,
              initialQuests: world.initialQuests,
              startingSkill: world.startingSkill,
          },
          customItemCatalog: generatedItemCatalog,
          customItemDefinitions: allItemDefinitions,
          customStructures: customStructures,
          day: 1,
      };

      setSaveSlots(prev => {
          const newSlots = [...prev];
          newSlots[activeSlot!] = newGameState as SaveSlotSummary;
          return newSlots;
      });
      setLoadState('continue_game');
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

  // Render loading screen
  if (loadState === 'loading' || authLoading) {
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
  
  // Render language selector if needed
  if (loadState === 'language_select') {
    return <LanguageSelector onLanguageSelected={handleLanguageSelected} />;
  }
  
  // Render the main slot selection menu
  if (loadState === 'slot_selection') {
    return (
      <TooltipProvider>
        <div className="flex flex-col items-center justify-center min-h-dvh bg-background text-foreground p-4">
          <header className="text-center mb-8">
            <h1 className="text-5xl font-bold font-headline tracking-tighter">
              {t('gameTitle')}
            </h1>
            <p className="text-muted-foreground">{t('welcomeBack')}</p>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
            {saveSlots.map((slot, index) => (
              <Card key={index} className={cn("flex flex-col justify-between", slot ? "border-primary" : "border-dashed")}>
                <CardHeader>
                  <CardTitle className="truncate">{slot ? slot.worldSetup.worldName : t('emptySlot')}</CardTitle>
                  <CardDescription>{slot ? `${t('dayX', {day: slot.day})}` : t('newAdventureHint')}</CardDescription>
                </CardHeader>
                <CardFooter className="flex flex-col gap-2">
                  {slot ? (
                    <>
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
                            <AlertDialogDescription>{t('confirmDeleteDesc', { worldName: slot.worldSetup.worldName })}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(index)}>{t('confirm')}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  ) : (
                    <Button onClick={() => handleNewGame(index)} variant="secondary" className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4" /> {t('startNewAdventure')}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>

          <footer className="absolute bottom-4 right-4 flex items-center gap-2">
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
          </footer>
        </div>
        <SettingsPopup open={isSettingsOpen} onOpenChange={setSettingsOpen} isInGame={false} />
      </TooltipProvider>
    );
  }

  // Render the new game creation flow
  if (loadState === 'new_game') {
     return <WorldSetup onWorldCreated={onWorldCreated} />;
  }

  // Render the actual game layout
  if (loadState === 'continue_game' && activeSlot !== null) {
    return <GameLayout gameSlot={activeSlot} />;
  }

  return null;
}
