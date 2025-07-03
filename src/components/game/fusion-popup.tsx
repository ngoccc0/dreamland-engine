
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useLanguage } from "@/context/language-context";
import type { PlayerItem, ItemDefinition } from "@/lib/game/types";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { FlaskConical, X } from "lucide-react";

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
    const countInSelection = selectedItems.filter(i => i.name === item.name).length;
    if (item.quantity > countInSelection) {
        setSelectedItems(prev => [...prev, { ...item, quantity: 1 }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleFuseClick = () => {
    if (selectedItems.length < 2) return;
    onFuse(selectedItems);
    setSelectedItems([]);
    onOpenChange(false);
  }
  
  const getAvailablePlayerItems = (): PlayerItem[] => {
      const availableMap = new Map<string, PlayerItem>();
      playerItems.forEach(item => {
          const selectedCount = selectedItems.filter(sel => sel.name === item.name).length;
          if(item.quantity - selectedCount > 0) {
              availableMap.set(item.name, { ...item, quantity: item.quantity - selectedCount });
          }
      });
      return Array.from(availableMap.values());
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if(!isOpen) setSelectedItems([]); onOpenChange(isOpen); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <FlaskConical /> {t('fusionAltar')}
          </DialogTitle>
          <DialogDescription>{t('fusionDesc')}</DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left side: Your Inventory */}
            <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-center text-muted-foreground">{t('yourInventory')}</h3>
                <ScrollArea className="h-64 border rounded-md p-2 bg-muted/20">
                    <div className="space-y-2">
                      {getAvailablePlayerItems().map((item) => (
                        <TooltipProvider key={item.name}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className="w-full flex justify-between items-center p-2 bg-muted rounded-md text-left text-sm cursor-pointer hover:bg-accent/20"
                                onClick={() => handleSelectItem(item)}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">{item.emoji}</span>
                                  <span>{t(item.name as TranslationKey)}</span>
                                </div>
                                <span className="font-mono text-sm font-bold">x{item.quantity}</span>
                              </button>
                            </TooltipTrigger>
                             <TooltipContent>
                                <p>{t(itemDefinitions[item.name]?.description as TranslationKey)}</p>
                            </TooltipContent>
                           </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                </ScrollArea>
            </div>
            {/* Right side: Fusion Slots */}
            <div className="flex flex-col gap-2">
                 <h3 className="font-semibold text-center text-muted-foreground">{t('fusionSlots')}</h3>
                 <div className="h-64 border rounded-md p-4 bg-muted/20 flex flex-col justify-between">
                    <div className="space-y-3">
                        {[0, 1, 2].map(index => (
                            <div key={index} className="h-14 w-full bg-background rounded-md border-2 border-dashed flex items-center justify-between px-4">
                                {selectedItems[index] ? (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{selectedItems[index].emoji}</span>
                                            <span className="text-sm">{t(selectedItems[index].name as TranslationKey)}</span>
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
                    <Button onClick={handleFuseClick} disabled={selectedItems.length < 2 || isLoading}>
                        {isLoading ? t('fusing') : t('fuseItems')}
                    </Button>
                 </div>
            </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
