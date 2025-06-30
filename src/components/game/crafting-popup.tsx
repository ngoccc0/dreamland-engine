"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useLanguage } from "@/context/language-context";
import type { PlayerItem, Recipe } from "@/lib/game/types";
import { recipes } from "@/lib/game/recipes";
import { Hammer } from "lucide-react";

interface CraftingPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerItems: PlayerItem[];
  onCraft: (recipe: Recipe) => void;
}

const hasIngredients = (playerItems: PlayerItem[], ingredients: { name: string; quantity: number }[]) => {
  return ingredients.every(ingredient => {
    const playerItem = playerItems.find(item => item.name === ingredient.name);
    return playerItem && playerItem.quantity >= ingredient.quantity;
  });
};

export function CraftingPopup({ open, onOpenChange, playerItems, onCraft }: CraftingPopupProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Hammer /> {t('crafting')}
          </DialogTitle>
          <DialogDescription>{t('craftingDesc')}</DialogDescription>
        </DialogHeader>
        <Separator />
        <ScrollArea className="h-96">
          <div className="p-4 space-y-4">
            {Object.values(recipes).map((recipe, index) => {
              const canCraft = hasIngredients(playerItems, recipe.ingredients);
              return (
                <div key={index} className="p-4 border rounded-lg bg-muted/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-grow">
                    <h4 className="font-bold text-lg text-foreground">{recipe.result.name}</h4>
                    <p className="text-sm text-muted-foreground italic mb-2">{recipe.description}</p>
                    <div className="text-sm">
                      <span className="font-semibold">{t('ingredients')}:</span>
                      <ul className="list-disc list-inside ml-4">
                        {recipe.ingredients.map(ing => {
                          const playerItem = playerItems.find(pi => pi.name === ing.name);
                          const playerQty = playerItem ? playerItem.quantity : 0;
                          const hasEnough = playerQty >= ing.quantity;
                          return (
                            <li key={ing.name} className={hasEnough ? 'text-green-400' : 'text-red-400'}>
                              {ing.name} ({playerQty}/{ing.quantity})
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex-shrink-0">
                          <Button onClick={() => onCraft(recipe)} disabled={!canCraft}>
                            {t('craft')}
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {!canCraft && <TooltipContent><p>{t('notEnoughIngredients')}</p></TooltipContent>}
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
