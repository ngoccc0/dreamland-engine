
"use client";

import { useState, useEffect, useCallback } from 'react';
import GameLayout from '@/components/game/game-layout';
import { WorldSetup } from '@/components/game/world-setup';
import { SettingsPopup } from '@/components/game/settings-popup';
import type { GameState } from '@/lib/game/types';
import type { GenerateWorldSetupOutput } from "@/ai/flows/generate-world-setup";
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
import { doc, setDoc, deleteDoc, getDocs, collection } from "firebase/firestore";
import { db } from "@/lib/firebase-config";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type SaveSlotSummary = Pick<GameState, 'worldSetup' | 'day'> | null;

export default function Home() {
  const { t, language, setLanguage } = useLanguage();
  const { installPrompt, setInstallPrompt } = usePwaInstall();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [loadState, setLoadState] = useState<'loading' | 'language_select' | 'slot_selection' | 'new_game' | 'continue_game'>('loading');
  const [saveSlots, setSaveSlots] = useState<SaveSlotSummary[]>([null, null, null]);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const [isSettingsOpen, setSettingsOpen] = useState(false);

  const loadSaveSlots = useCallback(async () => {
    setLoadState('loading');
    let slots: SaveSlotSummary[] = [null, null, null];
    if (user && db) { // Load from Firebase
      try {
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
      } catch (error) {
        console.error("Failed to load save slots from Firebase:", error);
      }
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
    if (user && db) {
        try {
            await deleteDoc(doc(db, "users", user.uid, "games", `slot_${slotIndex}`));
        } catch (error) {
            console.error("Failed to delete from Firebase:", error);
            toast({ title: "Error", description: "Failed to delete cloud save.", variant: "destructive" });
        }
    } else {
        localStorage.removeItem(`gameState_${slotIndex}`);
    }
    setSaveSlots(prev => {
        const newSlots = [...prev];
        newSlots[slotIndex] = null;
        return newSlots;
    });
  };

  const onWorldCreated = async (worldSetupData: GenerateWorldSetupOutput) => {
      if (activeSlot === null) return;
      
      const conceptIndex = Math.floor(Math.random() * worldSetupData.concepts.length);
      const selectedConcept = worldSetupData.concepts[conceptIndex];
      
      const allCustomItems = worldSetupData.customItemCatalog || [];
      const customDefs = allCustomItems.reduce((acc, item) => {
            acc[item.name] = {
                description: item.description, tier: item.tier, category: item.category, emoji: item.emoji, effects: item.effects,
                baseQuantity: item.baseQuantity, growthConditions: item.growthConditions, equipmentSlot: item.equipmentSlot, attributes: item.attributes,
            };
            return acc;
        }, {} as Record<string, any>);
        
      const initialPlayerInventory = selectedConcept.playerInventory.map(item => ({
          ...item,
          tier: allCustomItems.find(def => def.name === item.name)?.tier || 1,
          emoji: allCustomItems.find(def => def.name === item.name)?.emoji || '❓'
      }));

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
              hp: 100, mana: 50, stamina: 100, bodyTemperature: 37, items: initialPlayerInventory, equipment: { weapon: null, armor: null, accessory: null },
              quests: selectedConcept.initialQuests, questsCompleted: 0, skills: selectedConcept.startingSkill ? [selectedConcept.startingSkill] : [], pets: [], persona: 'none',
              attributes: { physicalAttack: 10, magicalAttack: 5, critChance: 5, attackSpeed: 1.0, cooldownReduction: 0 },
              unlockProgress: { kills: 0, damageSpells: 0, moves: 0 }, journal: {}, dailyActionLog: [], questHints: {},
          },
          customItemCatalog: allCustomItems,
          customItemDefinitions: customDefs,
          customStructures: worldSetupData.customStructures || [],
          day: 1, turn: 1, narrativeLog: [], worldProfile: { climateBase: 'temperate', magicLevel: 5, mutationFactor: 2, sunIntensity: 7, weatherTypesAllowed: ['clear', 'rain', 'fog'], moistureBias: 0, tempBias: 0, resourceDensity: 5, theme: 'Normal', },
          currentSeason: 'spring', gameTime: 360, weatherZones: {}, world: {}, recipes: {}, buildableStructures: {}, regions: {}, regionCounter: 0,
          playerPosition: { x: 0, y: 0 }, playerBehaviorProfile: { moves: 0, attacks: 0, crafts: 0, customActions: 0 },
      };

    try {
        if (user && db) {
            await setDoc(doc(db, "users", user.uid, "games", `slot_${activeSlot}`), newGameState);
        } else {
            localStorage.setItem(`gameState_${activeSlot}`, JSON.stringify(newGameState));
        }

        setSaveSlots(prev => {
            const newSlots = [...prev];
            newSlots[activeSlot!] = { worldSetup: newGameState.worldSetup, day: newGameState.day };
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
            {saveSlots.map((slot, index) => (
               <Card key={index} className={cn("flex flex-col", slot ? "border-primary" : "border-dashed")}>
                 <div className="md:flex md:flex-row md:items-start md:justify-between p-6 flex-grow">
                   <div className="flex-grow">
                     <CardHeader className="p-0">
                       <CardTitle className="truncate">{slot?.worldSetup?.worldName ? t(slot.worldSetup.worldName as TranslationKey) : t('emptySlot')}</CardTitle>
                       <CardDescription>{slot ? `${t('dayX', {day: slot.day})}` : t('newAdventureHint')}</CardDescription>
                     </CardHeader>
                     <CardContent className="p-0 pt-4 text-sm text-muted-foreground">
                       {slot?.worldSetup && (
                         <div className="space-y-1">
                           <div><span className="font-semibold text-foreground/80">{t('biomeLabel')}:</span> {t(slot.worldSetup.startingBiome as TranslationKey)}</div>
                           {slot.worldSetup.startingSkill && (
                             <div><span className="font-semibold text-foreground/80">{t('skillLabel')}:</span> {t(slot.worldSetup.startingSkill.name as TranslationKey)}</div>
                           )}
                           {slot.worldSetup.initialQuests && (
                             <div><span className="font-semibold text-foreground/80">{t('questsLabel')}:</span> {slot.worldSetup.initialQuests.length}</div>
                           )}
                         </div>
                       )}
                     </CardContent>
                   </div>
                   <CardFooter className="p-0 pt-4 md:pt-0 md:pl-6 flex flex-col sm:flex-row md:flex-col lg:flex-row gap-2 self-start sm:self-center md:self-start lg:self-center flex-shrink-0">
                     {slot ? (
                       <>
                         <Button onClick={() => handlePlay(index)} className="w-full sm:w-auto">
                           <Play className="mr-2 h-4 w-4" /> {t('continueJourney')}
                         </Button>
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <Button variant="destructive" className="w-full sm:w-auto">
                               <Trash2 className="mr-2 h-4 w-4" /> {t('deleteSave')}
                             </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle>
                               <AlertDialogDescription>
                                 {slot.worldSetup?.worldName
                                   ? t('confirmDeleteDesc', { worldName: t(slot.worldSetup.worldName as TranslationKey) })
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
                       </>
                     ) : (
                       <Button onClick={() => handleNewGame(index)} className="w-full">
                         <PlusCircle className="mr-2 h-4 w-4" /> {t('startNewAdventure')}
                       </Button>
                     )}
                   </CardFooter>
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

    