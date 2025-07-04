
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/context/language-context";
import type { PlayerStatus } from "@/lib/game/types";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Heart, Loader2, Book } from "lucide-react";

interface StatusPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: PlayerStatus;
  onRequestHint: (questText: string) => Promise<void>;
}

const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);
const normalizeTemp = (temp: number) => {
    const minTemp = 20;
    const maxTemp = 50;
    return clamp(((temp - minTemp) / (maxTemp - minTemp)) * 100, 0, 100);
}

type HintFetchStatus = {
  isLoading: boolean;
  error?: string;
}

export function StatusPopup({ open, onOpenChange, stats, onRequestHint }: StatusPopupProps) {
  const { t, language } = useLanguage();
  const quests = stats.quests;
  const pets = stats.pets || [];
  const bodyTemp = stats.bodyTemperature ?? 37.0;

  const [hintFetchStatus, setHintFetchStatus] = useState<Record<string, HintFetchStatus>>({});

  const handleQuestClick = async (questText: string) => {
    // Don't re-fetch if hint exists or is already loading
    if (stats.questHints?.[questText] || hintFetchStatus[questText]?.isLoading) {
      return;
    }

    setHintFetchStatus(prev => ({ ...prev, [questText]: { isLoading: true } }));
    
    try {
        await onRequestHint(questText);
        setHintFetchStatus(prev => ({ ...prev, [questText]: { isLoading: false } }));
    } catch (e) {
        setHintFetchStatus(prev => ({ ...prev, [questText]: { isLoading: false, error: t('suggestionError') } }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{t('playerStatus')}</DialogTitle>
          <DialogDescription>
            {t('playerStatusDesc')}
          </DialogDescription>
        </DialogHeader>
        <Separator />
        
        <ScrollArea className="max-h-[70vh] pr-6">
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="hp" className="text-sm font-medium">{t('health', { hp: stats.hp })}</label>
              <Progress id="hp" value={stats.hp} className="h-4" indicatorClassName="bg-destructive" />
            </div>
            <div className="space-y-2">
              <label htmlFor="mana" className="text-sm font-medium">{t('mana', { mana: stats.mana })}</label>
              <Progress id="mana" value={(stats.mana / 50) * 100} className="h-4" indicatorClassName="bg-gradient-to-r from-blue-500 to-purple-600" />
            </div>
            <div className="space-y-2">
              <label htmlFor="stamina" className="text-sm font-medium">{t('stamina', { stamina: stats.stamina.toFixed(0) })}</label>
              <Progress id="stamina" value={stats.stamina} className="h-4" indicatorClassName="bg-gradient-to-r from-yellow-400 to-orange-500" />
            </div>
             <div className="space-y-2">
              <label htmlFor="bodyTemp" className="text-sm font-medium">{t('bodyTemperature', { temp: bodyTemp.toFixed(1) })}</label>
              <p className="text-xs text-muted-foreground px-1">{t('bodyTempDesc')}</p>
              <div className="relative h-4 w-full overflow-hidden rounded-full bg-gradient-to-r from-blue-400 via-green-400 to-red-600 mt-2">
                  <div 
                      className="absolute top-0 h-full w-1 bg-white/80 border-x border-black/50" 
                      style={{ left: `${normalizeTemp(bodyTemp)}%` }}
                      title={`Current: ${bodyTemp.toFixed(1)}°C`}
                  />
                  <div 
                      className="absolute top-0 h-full w-0.5 bg-white/50" 
                      style={{ left: `${normalizeTemp(37)}%` }}
                       title="Ideal: 37°C"
                  />
              </div>
            </div>
          </div>
          <Separator />
          <div className="py-4">
            <h3 className="mb-2 font-headline font-semibold">{t('combatStats')}</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span>{t('physicalAttack')}:</span>
              <span className="font-medium text-right text-foreground">{stats.attributes.physicalAttack}</span>
              
              <span>{t('magicalAttack')}:</span>
              <span className="font-medium text-right text-foreground">{stats.attributes.magicalAttack}</span>

              <span>{t('critChance')}:</span>
              <span className="font-medium text-right text-foreground">{stats.attributes.critChance}%</span>

              <span>{t('attackSpeed')}:</span>
              <span className="font-medium text-right text-foreground">{stats.attributes.attackSpeed.toFixed(1)}</span>

              <span>{t('cooldownReduction')}:</span>
              <span className="font-medium text-right text-foreground">{stats.attributes.cooldownReduction}%</span>
            </div>
          </div>
          <Separator />
          <div className="py-4">
            <h3 className="mb-2 font-headline font-semibold flex items-center gap-2">
              <Heart className="h-4 w-4" /> {t('companions')}
            </h3>
            {pets.length > 0 ? (
              <ul className="space-y-2">
                {pets.map((pet, index) => (
                  <li key={index} className="p-2 bg-muted rounded-md text-muted-foreground">
                    <div className="font-semibold text-foreground">{pet.name || t(pet.type as TranslationKey)}</div>
                    <div className="text-xs">{t('levelLabel')} {pet.level} {t(pet.type as TranslationKey)}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-muted-foreground">{t('noCompanions')}</p>
            )}
          </div>
          <Separator />
          <div className="py-4">
            <h3 className="mb-2 font-headline font-semibold">{t('quests')}</h3>
            {quests.length > 0 ? (
              <Accordion type="single" collapsible className="w-full space-y-2">
                {quests.map((quest, index) => (
                  <AccordionItem value={`item-${index}`} key={index} className="p-2 bg-muted rounded-md border-none">
                    <AccordionTrigger onClick={() => handleQuestClick(quest)} className="py-0 text-left hover:no-underline text-muted-foreground">
                      {quest}
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 text-accent-foreground italic">
                      {hintFetchStatus[quest]?.isLoading && (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin"/>
                          <span>{t('suggesting')}...</span>
                        </div>
                      )}
                      {hintFetchStatus[quest]?.error && <p className="text-destructive">{hintFetchStatus[quest]?.error}</p>}
                      {stats.questHints?.[quest] && <p>"{stats.questHints[quest]}"</p>}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className="text-center text-muted-foreground">{t('noQuests')}</p>
            )}
          </div>
          <Separator />
          <div className="py-4">
            <h3 className="mb-2 font-headline font-semibold flex items-center gap-2">
              <Book className="h-4 w-4" /> {t('journal')}
            </h3>
            {stats.journal && Object.keys(stats.journal).length > 0 ? (
              <Accordion type="single" collapsible className="w-full space-y-2">
                {Object.entries(stats.journal).reverse().map(([day, entry]) => (
                  <AccordionItem value={`day-${day}`} key={day} className="p-2 bg-muted rounded-md border-none">
                    <AccordionTrigger className="py-0 text-left hover:no-underline text-muted-foreground">
                      {t('dayX', { day })}
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 text-accent-foreground/90 italic whitespace-pre-line">
                      {entry}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className="text-center text-muted-foreground">{t('noJournalEntries')}</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

    