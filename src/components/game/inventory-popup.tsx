
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/context/language-context";
import type { PlayerItem, ItemDefinition, Chunk } from "@/lib/game/types";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface InventoryPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: PlayerItem[];
  itemDefinitions: Record<string, ItemDefinition>;
  enemy: Chunk['enemy'];
  onUseItem: (itemName: string, target: 'player' | string) => void;
}

export function InventoryPopup({ open, onOpenChange, items, itemDefinitions, enemy, onUseItem }: InventoryPopupProps) {
  const { t } = useLanguage();

  const handleUseItem = (itemName: string, target: 'player' | string) => {
    onUseItem(itemName, target);
    onOpenChange(false); // Close popup after using item
  }

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
            <div className="p-4">
              {items.length > 0 ? (
                <ul className="space-y-2">
                  {items.map((item, index) => {
                    const definition = itemDefinitions[item.name];
                    const isUsableOnSelf = definition && definition.effects.length > 0;
                    const isUsableOnEnemy = enemy && definition && enemy.diet.includes(item.name);
                    const isInteractable = isUsableOnSelf || isUsableOnEnemy;

                    return (
                      <li key={index}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className={cn(
                                        "w-full flex justify-between items-center p-2 bg-muted rounded-md text-left text-sm",
                                        isInteractable ? "cursor-pointer hover:bg-accent/20" : "cursor-default"
                                    )}
                                    disabled={!isInteractable}
                                >
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-foreground">{item.name}</span>
                                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary-foreground font-semibold">{t('tier', { tier: item.tier })}</span>
                                        {definition && definition.category && <span className="text-xs px-1.5 py-0.5 rounded-full bg-accent/80 text-accent-foreground">{t(definition.category as TranslationKey)}</span>}
                                    </div>
                                    <span className="font-mono text-sm font-bold text-foreground">x{item.quantity}</span>
                                </button>
                            </DropdownMenuTrigger>
                            
                            {isInteractable && (
                                <DropdownMenuContent className="w-56">
                                    <DropdownMenuLabel className="font-normal">
                                        <p className="font-bold">{item.name}</p>
                                        <p className="text-xs text-muted-foreground whitespace-normal">{definition?.description}</p>
                                    </DropdownMenuLabel>
                                    
                                    {definition && definition.effects.length > 0 && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <div className="px-2 py-1.5 text-xs space-y-1">
                                                <p className="font-semibold text-muted-foreground">{t('effects')}:</p>
                                                {definition.effects.map((effect, i) => (
                                                    <p key={i} className="text-green-500 ml-2">
                                                        {effect.type === 'HEAL' && `+${effect.amount} ${t('healthShort')}`}
                                                        {effect.type === 'RESTORE_STAMINA' && `+${effect.amount} ${t('staminaShort')}`}
                                                    </p>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    <DropdownMenuSeparator />
                                    {isUsableOnSelf && <DropdownMenuItem onClick={() => handleUseItem(item.name, 'player')}>{t('useOnSelf')}</DropdownMenuItem>}
                                    {isUsableOnEnemy && <DropdownMenuItem onClick={() => handleUseItem(item.name, enemy!.type)}>{t('useOnTarget', { target: enemy!.type })}</DropdownMenuItem>}
                                </DropdownMenuContent>
                            )}
                        </DropdownMenu>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-center text-muted-foreground">{t('inventoryEmpty')}</p>
              )}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
