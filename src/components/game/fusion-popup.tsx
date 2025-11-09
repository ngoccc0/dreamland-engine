
"use client";

import * as React from "react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
// Separator not used in this component
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useLanguage } from "@/context/language-context";
import type { PlayerItem, ItemDefinition } from "@/lib/game/types";
import type { TranslationKey } from "@/lib/i18n";
import { getTranslatedText } from "@/lib/utils";
import { resolveItemDef } from '@/lib/game/item-utils';
import { FlaskConical, X } from "./icons";
import { IconRenderer } from "@/components/ui/icon-renderer";

interface FusionPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerItems: PlayerItem[];
  itemDefinitions: Record<string, ItemDefinition>;
  onFuse: (itemsToFuse: PlayerItem[]) => void;
  isLoading: boolean;
}

export function FusionPopup({ open, onOpenChange, playerItems, itemDefinitions, onFuse, isLoading }: FusionPopupProps) {
  const { t } = useLanguage();
  const [selectedItems, setSelectedItems] = useState<PlayerItem[]>([]);

  const handleSelectItem = (item: PlayerItem) => {
    if (selectedItems.length >= 3) return;
    // Check if we can select one more of this item
    const key = getTranslatedText(item.name as any, 'en');
    const countInSelection = selectedItems.filter(i => getTranslatedText(i.name as any, 'en') === key).length;
    if (item.quantity > countInSelection) {
      setSelectedItems(prev => [...prev, { ...item, quantity: 1 }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleFuseClick = () => {
    if (!canFuse()) return;
    onFuse(selectedItems);
    setSelectedItems([]);
    onOpenChange(false);
  };

  const getAvailablePlayerItems = (): PlayerItem[] => {
    const availableMap = new Map<string, PlayerItem>();
    playerItems.forEach(item => {
      const key = getTranslatedText(item.name as any, 'en');
      const selectedCount = selectedItems.filter(sel => getTranslatedText(sel.name as any, 'en') === key).length;
      if (item.quantity - selectedCount > 0) {
        availableMap.set(key, { ...item, quantity: item.quantity - selectedCount });
      }
    });
    return Array.from(availableMap.values());
  };

  const canFuse = (): boolean => {
    if (selectedItems.length < 2 || selectedItems.length > 3) return false;
    const hasTool = selectedItems.some(item => {
      const def = resolveItemDef(getTranslatedText(item.name as any, 'en'), itemDefinitions);
      return def?.category === 'Tool';
    });
    return hasTool;
  };

  // Memoize the onOpenChange handler to avoid infinite update loops
  const handleDialogOpenChange = React.useCallback(
    (isOpen: boolean) => {
      if (!isOpen) setSelectedItems([]);
      onOpenChange(isOpen);
    },
    [onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <FlaskConical /> {t('fusionAltar')}
          </DialogTitle>
          <DialogDescription>{t('fusionDesc')}</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] -mx-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6">
              {/* Left side: Your Inventory */}
              <div className="flex flex-col gap-2">
                  <h3 className="font-semibold text-center text-muted-foreground">{t('yourInventory')}</h3>
                  <div className="h-72 border rounded-md p-2 bg-muted/20 overflow-y-auto">
                      <div className="space-y-2">
                        {getAvailablePlayerItems().map((item) => (
                          // Use a stable unique key: prefer the canonical id, fall back to the English string
                          <TooltipProvider key={item.id ?? getTranslatedText(item.name as any, 'en')}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  className="w-full flex justify-between items-center p-2 bg-muted rounded-md text-left text-sm cursor-pointer hover:bg-accent/20"
                                  onClick={() => handleSelectItem(item)}
                                >
                                    <div className="flex items-center gap-2">
                                    <IconRenderer icon={resolveItemDef(getTranslatedText(item.name as any, 'en'), itemDefinitions)?.emoji || item.emoji} size={20} alt={getTranslatedText(item.name as any, 'en')} />
                                    <span>{getTranslatedText(item.name as any, 'en') /* EN label for layout; use language if desired */}</span>
                                  </div>
                                  <span className="font-mono text-sm font-bold">x{item.quantity}</span>
                                </button>
                              </TooltipTrigger>
              <TooltipContent>
                {
                  (() => {
                    const def = resolveItemDef(getTranslatedText(item.name as any, 'en'), itemDefinitions);
                    return <p>{getTranslatedText(def?.description ?? '', 'en', t)}</p>;
                  })()
                }
              </TooltipContent>
                             </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                  </div>
              </div>
              {/* Right side: Fusion Slots */}
              <div className="flex flex-col gap-2">
                   <h3 className="font-semibold text-center text-muted-foreground">{t('fusionSlots')}</h3>
                   <div className="h-72 border rounded-md p-4 bg-muted/20 flex flex-col justify-between">
                      <div className="space-y-3">
                          {[0, 1, 2].map(index => (
                              <div key={index} className="h-14 w-full bg-background rounded-md border-2 border-dashed flex items-center justify-between px-4">
                                  {selectedItems[index] ? (
                                      <>
                                          <div className="flex items-center gap-2">
                                              <IconRenderer icon={resolveItemDef(getTranslatedText(selectedItems[index].name as any, 'en'), itemDefinitions)?.emoji || selectedItems[index].emoji} size={20} alt={getTranslatedText(selectedItems[index].name as any, 'en')} />
                                              <span className="text-sm">{getTranslatedText(selectedItems[index].name as any, 'en', t)}</span>
                                          </div>
                                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveItem(index)}>
                                              <X className="h-4 w-4"/>
                                          </Button>
                                      </>
                                  ) : (
                                      <span className="text-sm text-muted-foreground italic">{t('emptySlot')}</span>
                                  )}
                              </div>
                          ))}
                      </div>
                      <Button onClick={handleFuseClick} disabled={!canFuse() || isLoading}>
                          {isLoading ? t('fusing') : t('fuseItems')}
                      </Button>
                   </div>
              </div>
          </div>
        </ScrollArea>

      </DialogContent>
    </Dialog>
  );
}
