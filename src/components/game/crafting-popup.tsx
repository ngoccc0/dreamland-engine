"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useLanguage } from "@/context/language-context";
import type { PlayerItem, Recipe, RecipeIngredient } from "@/lib/game/types";
import { recipes } from "@/lib/game/recipes";
import { Hammer } from "lucide-react";

interface CraftingPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerItems: PlayerItem[];
  onCraft: (recipe: Recipe) => void;
}

// This check is now smarter, allowing for substitutes.
// It confirms if a craft is *possible* with any combination of available items.
const hasIngredients = (playerItems: PlayerItem[], ingredients: RecipeIngredient[]) => {
  // Use a map to track available items to "spend" them during the check.
  const availableItems = new Map(playerItems.map(item => [item.name, item.quantity]));

  for (const ingredient of ingredients) {
    let satisfied = false;
    // The list of possible items includes the primary one and any alternatives.
    const possibleItems = [ingredient.name, ...(ingredient.alternatives || [])];

    for (const itemName of possibleItems) {
      if ((availableItems.get(itemName) || 0) >= ingredient.quantity) {
        satisfied = true;
        break; // Found a valid item for this ingredient, move to the next ingredient.
      }
    }
    
    if (!satisfied) {
      return false; // If any single ingredient cannot be satisfied, the craft is impossible.
    }
  }

  return true; // All ingredients were satisfied.
};

// Helper to find the player's quantity of a specific ingredient, including substitutes
const getPlayerQuantity = (playerItems: PlayerItem[], ingredient: RecipeIngredient) => {
    const possibleItems = [ingredient.name, ...(ingredient.alternatives || [])];
    let total = 0;
    for(const itemName of possibleItems) {
        const playerItem = playerItems.find(pi => pi.name === itemName);
        if(playerItem) {
            total += playerItem.quantity;
        }
    }
    return total;
}

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
                          const playerQty = getPlayerQuantity(playerItems, ing);
                          const hasEnough = playerQty >= ing.quantity;
                          
                          // Tooltip to show alternatives
                          const alternativesTooltip = ing.alternatives?.length 
                            ? ` (hoặc: ${ing.alternatives.join(', ')})`
                            : '';

                          return (
                            <TooltipProvider key={ing.name}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <li className={hasEnough ? 'text-green-400' : 'text-red-400'}>
                                    {ing.name} ({playerQty}/{ing.quantity})
                                  </li>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Cần: {ing.name}{alternativesTooltip}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
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
