"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/context/language-context";
import type { PlayerStatus } from "@/lib/game/types";
import { Heart } from "lucide-react";

interface StatusPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: PlayerStatus;
}

export function StatusPopup({ open, onOpenChange, stats }: StatusPopupProps) {
  const { t } = useLanguage();
  const quests = stats.quests;
  const pets = stats.pets || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{t('playerStatus')}</DialogTitle>
          <DialogDescription>
            {t('playerStatusDesc')}
          </DialogDescription>
        </DialogHeader>
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
              <label htmlFor="stamina" className="text-sm font-medium">{t('stamina', { stamina: stats.stamina })}</label>
              <Progress id="stamina" value={stats.stamina} className="h-4" indicatorClassName="bg-gradient-to-r from-yellow-400 to-orange-500" />
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
                    <div className="font-semibold text-foreground">{pet.name || pet.type}</div>
                    <div className="text-xs">Level {pet.level} {pet.type}</div>
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
              <ul className="space-y-2">
                {quests.map((quest, index) => (
                  <li key={index} className="p-2 bg-muted rounded-md text-muted-foreground">
                    {quest}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-muted-foreground">{t('noQuests')}</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
