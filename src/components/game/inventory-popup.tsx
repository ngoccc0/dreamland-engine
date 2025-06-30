"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/context/language-context";
import type { PlayerItem, ItemDefinition } from "@/lib/game/types";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { TranslationKey } from "@/lib/i18n";

interface InventoryPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: PlayerItem[];
  itemDefinitions: Record<string, ItemDefinition>;
}

export function InventoryPopup({ open, onOpenChange, items, itemDefinitions }: InventoryPopupProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{t('inventoryPopupTitle')}</DialogTitle>
          <DialogDescription>
            {t('inventoryPopupDesc')}
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <ScrollArea className="h-60">
          <TooltipProvider>
            <div className="p-4">
              {items.length > 0 ? (
                <ul className="space-y-2">
                  {items.map((item, index) => {
                    const definition = itemDefinitions[item.name];
                    return (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <li className="flex justify-between items-center p-2 bg-muted rounded-md text-muted-foreground cursor-help">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span>{item.name}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary-foreground font-semibold">{t('tier', { tier: item.tier })}</span>
                              {definition && definition.category && <span className="text-xs px-1.5 py-0.5 rounded-full bg-accent/80 text-accent-foreground">{t(definition.category as TranslationKey)}</span>}
                            </div>
                            <span className="font-mono text-sm font-bold text-foreground">x{item.quantity}</span>
                          </li>
                        </TooltipTrigger>
                        {definition && (
                          <TooltipContent className="max-w-xs">
                            <p className="font-bold">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{definition.description}</p>
                            {definition.effects.length > 0 && (
                              <div className="mt-2 pt-2 border-t">
                                {definition.effects.map((effect, i) => (
                                  <p key={i} className="text-green-400 text-xs">
                                    {effect.type === 'HEAL' && `+${effect.amount} HP`}
                                    {effect.type === 'RESTORE_STAMINA' && `+${effect.amount} Stamina`}
                                  </p>
                                ))}
                              </div>
                            )}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-center text-muted-foreground">{t('inventoryEmpty')}</p>
              )}
            </div>
          </TooltipProvider>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
