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

interface StatusPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: {
    hp: number;
    mana: number;
  };
  quests: string[];
}

export function StatusPopup({ open, onOpenChange, stats, quests }: StatusPopupProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{t('playerStatus')}</DialogTitle>
          <DialogDescription>
            {t('playerStatusDesc')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label htmlFor="hp" className="text-sm font-medium">{t('health', { hp: stats.hp })}</label>
            <Progress id="hp" value={stats.hp} className="h-4" />
          </div>
          <div className="space-y-2">
            <label htmlFor="mana" className="text-sm font-medium">{t('mana', { mana: stats.mana })}</label>
            <Progress id="mana" value={(stats.mana / 50) * 100} className="h-4" />
          </div>
        </div>
        <Separator />
        <div>
          <h3 className="mb-2 font-headline font-semibold">{t('quests')}</h3>
          <ScrollArea className="h-40">
            <div className="p-4">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
