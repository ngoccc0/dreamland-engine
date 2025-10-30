

"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useLanguage } from "@/context/language-context";
import type { PlayerItem, Structure } from "@/lib/game/types";
import { getTranslatedText } from '@/lib/utils';
// TranslationKey type not required here
import { Home } from "./icons";

interface BuildingPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerItems: PlayerItem[];
  buildableStructures: Record<string, Structure>;
  onBuild: (structureName: string) => void;
}

export function BuildingPopup({ open, onOpenChange, playerItems, buildableStructures, onBuild }: BuildingPopupProps) {
  const { t } = useLanguage();
  const playerItemsMap = new Map(playerItems.map(item => [getTranslatedText(item.name as any, 'en'), item.quantity]));

  const canBuild = (structure: Structure): boolean => {
    if (!structure.buildCost) return true; // Can always build if no cost
    return structure.buildCost.every(cost => (playerItemsMap.get(cost.name) || 0) >= cost.quantity);
  };
  
  const handleBuildClick = (structureName: string) => {
    onBuild(structureName);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Home /> {t('building')}
          </DialogTitle>
          <DialogDescription>{t('buildingDesc')}</DialogDescription>
        </DialogHeader>
        <Separator />
        <ScrollArea className="max-h-[65vh] pr-4">
          <div className="p-4 space-y-4">
            {Object.values(buildableStructures).map((structure, index) => {
              const buildable = canBuild(structure);
              return (
                <div key={index} className="p-4 border rounded-lg bg-muted/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-grow">
                    <h4 className="font-bold text-lg text-foreground flex items-center gap-2">
                      <span className="text-2xl">{structure.emoji}</span>
                      {t(structure.name)}
                    </h4>
                    <p className="text-sm text-muted-foreground italic mb-2">{t(structure.description)}</p>
                    <div className="text-sm">
                      <span className="font-semibold">{t('materialsNeeded')}:</span>
                      {structure.buildCost && structure.buildCost.length > 0 ? (
                        <ul className="list-disc list-inside ml-4">
                          {structure.buildCost.map(cost => {
                            const playerQty = playerItemsMap.get(cost.name) || 0;
                            const hasEnough = playerQty >= cost.quantity;
                            return (
                              <li key={cost.name} className={hasEnough ? 'text-green-400' : 'text-red-400'}>
                                {t(cost.name)} ({playerQty}/{cost.quantity})
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="ml-4 italic text-muted-foreground">{t('noMaterialsNeeded')}</p>
                      )}
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex-shrink-0">
                          <Button onClick={() => handleBuildClick(getTranslatedText(structure.name as any, 'en'))} disabled={!buildable}>
                            {t('build')}
                          </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {buildable ? <p>{t('buildStructure', { structureName: t(structure.name) })}</p> : <p>{t('notEnoughIngredients')}</p>}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
