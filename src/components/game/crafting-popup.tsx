
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useLanguage } from "@/context/language-context";
import type { PlayerItem, Recipe, RecipeIngredient, RecipeAlternative } from "@/lib/game/types";
import type { TranslationKey } from "@/lib/i18n";
import { calculateCraftingOutcome } from "@/lib/game/engine";
import { Hammer } from "lucide-react";

interface CraftingPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerItems: PlayerItem[];
  recipes: Record<string, Recipe>;
  onCraft: (recipe: Recipe) => void;
}

const getPlayerQuantityForIngredient = (playerItems: PlayerItem[], ingredient: RecipeIngredient): number => {
    const possibleItems = [{ name: ingredient.name, tier: 1 as const }, ...(ingredient.alternatives || [])];
    let total = 0;
    for (const item of possibleItems) {
        const playerItem = playerItems.find(pi => pi.name === item.name);
        if (playerItem) {
            total += playerItem.quantity;
        }
    }
    return total;
};

export function CraftingPopup({ open, onOpenChange, playerItems, recipes, onCraft }: CraftingPopupProps) {
  const { t } = useLanguage();

  const getTooltipContent = (ingredient: RecipeIngredient): string => {
    let content = `${t('buildNeed')}: ${t(ingredient.name as TranslationKey)}`;
    if (ingredient.alternatives && ingredient.alternatives.length > 0) {
        const altStrings = ingredient.alternatives.map(alt => `${t(alt.name as TranslationKey)} (${t('tierLabel')} ${alt.tier})`);
        content += ` (${t('orLabel')}: ${altStrings.join(', ')})`;
    }
    return content;
  };

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
              const { canCraft, chance } = calculateCraftingOutcome(playerItems, recipe);
              return (
                <div key={index} className="p-4 border rounded-lg bg-muted/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-grow">
                    <h4 className="font-bold text-lg text-foreground flex items-center gap-2">
                      <span className="text-2xl">{recipe.result.emoji}</span>
                      {t(recipe.result.name as TranslationKey)}
                    </h4>
                    <p className="text-sm text-muted-foreground italic mb-2">{t(recipe.description as TranslationKey)}</p>
                    <div className="text-sm">
                      <span className="font-semibold">{t('ingredients')}:</span>
                      <ul className="list-disc list-inside ml-4">
                        {recipe.ingredients.map(ing => {
                          const playerQty = getPlayerQuantityForIngredient(playerItems, ing);
                          const hasEnough = playerQty >= ing.quantity;

                          return (
                            <TooltipProvider key={ing.name}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <li className={hasEnough ? 'text-green-400' : 'text-red-400'}>
                                    {t(ing.name as TranslationKey)} ({playerQty}/{ing.quantity})
                                  </li>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{getTooltipContent(ing)}</p>
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
                            {canCraft ? `${t('craft')} (${chance}%)` : t('craft')}
                          </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {canCraft ? <p>{t('successChance', { chance })}</p> : <p>{t('notEnoughIngredients')}</p>}
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
