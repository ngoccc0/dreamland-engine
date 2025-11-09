

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
import type { PlayerStatus, Skill, EquipmentSlot } from "@/lib/game/types";
import { skillDefinitions } from "@/lib/game/skills";
import type { TranslationKey } from "@/lib/i18n";
import { cn, getTranslatedText } from "@/lib/utils";
import { Heart, Loader2, Book, Star, Sparkles, SwordIcon } from "./icons";
import { Button } from "../ui/button";
import { IconRenderer } from "@/components/ui/icon-renderer";
import { resolveItemDef } from '@/lib/game/item-utils';

interface StatusPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: PlayerStatus;
  itemDefinitions?: Record<string, any>;
  onRequestHint: (questText: string) => Promise<void>;
  onUnequipItem: (slot: EquipmentSlot) => void;
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

const getNextUnlockableSkills = (currentSkills: Skill[]): Skill[] => {
    const currentSkillNames = new Set(currentSkills.map(s => getTranslatedText(s.name, 'en')));
    return skillDefinitions.filter(
        skillDef => !currentSkillNames.has(getTranslatedText(skillDef.name, 'en')) && skillDef.unlockCondition
    );
};


export function StatusPopup({ open, onOpenChange, stats, itemDefinitions, onRequestHint, onUnequipItem }: StatusPopupProps) {
  const { t, language } = useLanguage();
  const quests = stats.quests;
  const pets = stats.pets || [];
  const bodyTemp = stats.bodyTemperature ?? 37.0;
  const mana = stats.mana ?? 0;

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
    } catch (error: any) {
        setHintFetchStatus(prev => ({ ...prev, [questText]: { isLoading: false, error: t('suggestionError') } }));
    }
  };

  const nextUnlockableSkills = getNextUnlockableSkills(stats.skills);

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
              <label htmlFor="mana" className="text-sm font-medium">{t('mana', { mana })}</label>
              <Progress id="mana" value={(mana / 50) * 100} className="h-4" indicatorClassName="bg-gradient-to-r from-blue-500 to-purple-600" />
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
                <h3 className="mb-2 font-headline font-semibold">{t('equipment')}</h3>
                <div className="space-y-2 text-sm bg-muted p-2 rounded-md">
                    {stats.equipment && Object.entries(stats.equipment).map(([slot, item]) => (
                    <div key={slot} className="flex justify-between items-center">
                        <span className="capitalize text-muted-foreground">{t(slot)}:</span>
                        {item ? (
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground flex items-center gap-1">
                                <IconRenderer icon={resolveItemDef(getTranslatedText(item.name, 'en'), itemDefinitions)?.emoji || item.emoji} size={18} alt={getTranslatedText(item.name, language)} />
                                {getTranslatedText(item.name, language, t)}
                            </span>
                            <Button variant="ghost" size="sm" onClick={() => onUnequipItem(slot as EquipmentSlot)}>
                            {t('unequipItem')}
                            </Button>
                        </div>
                        ) : (
                        <span className="text-foreground italic">{t('emptySlot')}</span>
                        )}
                    </div>
                    ))}
                </div>
            </div>
          <Separator />
          <div className="py-4">
            <h3 className="mb-2 font-headline font-semibold flex items-center gap-2"><SwordIcon /> {t('combatStats')}</h3>
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
              <Star className="h-4 w-4" /> {t('skillUnlockProgressTitle')}
            </h3>
             <div className="p-2 bg-muted rounded-md text-sm">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span className="text-muted-foreground">{t('moves')}:</span>
                    <span className="font-medium text-right text-foreground">{stats.unlockProgress.moves ?? 0}</span>
                    <span className="text-muted-foreground">{t('kills')}:</span>
                    <span className="font-medium text-right text-foreground">{stats.unlockProgress.kills}</span>
                    <span className="text-muted-foreground">{t('damageSpells')}:</span>
                    <span className="font-medium text-right text-foreground">{stats.unlockProgress.damageSpells}</span>
                </div>
                {nextUnlockableSkills.length > 0 && (
                    <>
                        <Separator className="my-2" />
                        <div className="space-y-1">
              {nextUnlockableSkills.map(skill => (
                <div key={String(skill.name)}>
                  <p className="text-xs text-accent-foreground font-semibold">{t(skill.name)}</p>
                  <p className="text-xs text-muted-foreground">({t('unlockCondition')}: {skill.unlockCondition!.count} {t(skill.unlockCondition!.type)})</p>
                </div>
              ))}
                        </div>
                    </>
                )}
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
                  <li key={`${pet.name}-${pet.type}-${index}`} className="p-2 bg-muted rounded-md text-muted-foreground">
                    <div className="font-semibold text-foreground">{pet.name || t(pet.type)}</div>
                    <div className="text-xs">{t('levelLabel')} {pet.level} {t(pet.type)}</div>
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
                {quests.map((quest, index) => {
                  const questText = t(quest);
                  const isLegendary = questText.startsWith('[Legendary]') || questText.startsWith('[Huyền thoại]');
                  return (
                    <AccordionItem value={`item-${index}`} key={index} className="p-2 bg-muted rounded-md border-none">
                      <AccordionTrigger onClick={() => handleQuestClick(questText)} className="py-0 text-left hover:no-underline text-muted-foreground">
                        <div className="flex items-center gap-2">
                          {isLegendary && <Sparkles className="h-4 w-4 text-yellow-400 flex-shrink-0" />}
                          <span className={cn(isLegendary && "text-yellow-300/90")}>{questText}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 text-accent-foreground italic">
                        {hintFetchStatus[questText]?.isLoading && (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin"/>
                            <span>{t('suggesting')}...</span>
                          </div>
                        )}
                        {hintFetchStatus[questText]?.error && <p className="text-destructive">{hintFetchStatus[questText]?.error}</p>}
                        {stats.questHints?.[questText] && <p>"{stats.questHints[questText]}"</p>}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
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
                      {String(entry)}
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
