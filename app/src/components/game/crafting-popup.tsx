
"use client";

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useLanguage } from "@/context/language-context";
import type { PlayerItem, Recipe, ItemDefinition } from "@/lib/game/types";
import type { TranslationKey } from "@/lib/i18n";
import { calculateCraftingOutcome, type CraftingOutcome } from "@/lib/game/engine/crafting";
import { Hammer, SortAsc } from "./icons";
import { cn, getTranslatedText } from "@/lib/utils";
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

interface CraftingPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerItems: PlayerItem[];
  itemDefinitions: Record<string, ItemDefinition>;
  recipes: Record<string, Recipe>;
  onCraft: (recipe: Recipe, outcome: CraftingOutcome) => void;
}

export function CraftingPopup({ open, onOpenChange, playerItems, itemDefinitions, recipes, onCraft }: CraftingPopupProps) {
  const { t, language } = useLanguage();
  const [showOnlyCraftable, setShowOnlyCraftable] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<'default' | 'craftability'>('craftability');

  const processedRecipes = React.useMemo(() => {
    return Object.values(recipes).map(recipe => {
      const outcome = calculateCraftingOutcome(playerItems, recipe, itemDefinitions);
      const ownedIngredients = outcome.resolvedIngredients.filter(ing => ing.hasEnough).length;
      const totalIngredients = outcome.resolvedIngredients.length;
      const craftabilityScore = totalIngredients > 0 ? (ownedIngredients / totalIngredients) : 0;
      
      const missingIngredients = outcome.resolvedIngredients
        .filter(ing => !ing.hasEnough)
        .map(ing => {
            const reqName = getTranslatedText(ing.requirement.name, language, t);
            return `${ing.requirement.quantity - ing.playerQuantity}x ${reqName}`;
        });
        
      const resultName = getTranslatedText(recipe.result.name, language, t);

      return { recipe, outcome, craftabilityScore, missingIngredients, resultName };
    });
  }, [recipes, playerItems, itemDefinitions, language, t]);

  const displayedRecipes = React.useMemo(() => {
    let filtered = processedRecipes;

    if (showOnlyCraftable) {
      filtered = filtered.filter(p => p.outcome.canCraft);
    }

    if (sortBy === 'craftability') {
      filtered.sort((a, b) => {
        if (b.craftabilityScore !== a.craftabilityScore) {
            return b.craftabilityScore - a.craftabilityScore;
        }
        return a.resultName.localeCompare(b.resultName, language);
      });
    } else {
      filtered.sort((a, b) => a.resultName.localeCompare(b.resultName, language));
    }

    return filtered;
  }, [processedRecipes, showOnlyCraftable, sortBy, language]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Hammer /> {t('crafting')}
          </DialogTitle>
          <DialogDescription>{t('craftingDesc')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center justify-between gap-4 p-4 -m-6 mb-0 border-y bg-muted/50">
            <div className="flex items-center space-x-2">
                <Switch 
                    id="show-craftable-switch" 
                    checked={showOnlyCraftable} 
                    onCheckedChange={setShowOnlyCraftable}
                />
                <Label htmlFor="show-craftable-switch" className="text-sm">
                    {t('showOnlyCraftable')}
                </Label>
            </div>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSortBy(prev => prev === 'craftability' ? 'default' : 'craftability')}
                        >
                           <SortAsc className="mr-2 h-4 w-4" />
                           {sortBy === 'craftability' ? t('sortByCraftability') : t('sortByAlphabetical')}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t('sortTooltip')}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
        
        <ScrollArea className="max-h-[60vh] -mx-6">
          <div className="p-6 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedRecipes.map(({ recipe, outcome, missingIngredients, resultName }) => {
              const resultDescText = getTranslatedText(recipe.description, language, t);
              const requiredToolName = recipe.requiredTool ? t(recipe.requiredTool as TranslationKey) : '';
              const tooltipContent = outcome.canCraft 
                ? t('canCraftTooltip')
                : `${t('missingIngredientsTooltip')}: ${missingIngredients.join(', ')}`;
              const recipeKey = getTranslatedText(recipe.result.name, 'en');

              return (
                <TooltipProvider key={recipeKey}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <div className="p-4 border rounded-lg bg-card flex flex-col justify-between gap-4 h-full">
                          <div className="flex-grow">
                            <h4 className="font-bold text-lg text-foreground flex items-center gap-2">
                              <span className="text-2xl">{recipe.result.emoji}</span>
                              {resultName}
                            </h4>
                            <p className="text-xs text-muted-foreground italic mb-2 line-clamp-2">{resultDescText}</p>
                            <div className="text-sm space-y-1">
                              <div>
                                <span className="font-semibold">{t('ingredients')}:</span>
                                <ul className="list-disc list-inside ml-4">
                                  {outcome.resolvedIngredients.map((resolvedIng, i) => {
                                     const itemToShow = resolvedIng.usedItem;
                                     const requirement = resolvedIng.requirement;
                                     const playerQty = resolvedIng.playerQuantity;
                                     const hasEnough = playerQty >= requirement.quantity;
                                     
                                     const requirementName = getTranslatedText(requirement.name, language, t);

                                    return (
                                        <li key={`${recipeKey}-ing-${i}`} className={cn("text-xs", hasEnough ? "text-green-400" : "text-red-400")}>
                                          {requirementName} ({playerQty}/{requirement.quantity})
                                        </li>
                                    )
                                  })}
                                </ul>
                              </div>
                               {recipe.requiredTool && (
                                <div>
                                   <span className={cn("text-xs font-semibold", outcome.hasRequiredTool ? 'text-green-400' : 'text-red-400')}>
                                     {t('requiredTool')}: {requiredToolName}
                                   </span>
                                </div>
                               )}
                            </div>
                          </div>
                          <div className="flex-shrink-0 mt-auto pt-2">
                             <Button className="w-full" onClick={() => onCraft(recipe, outcome)} disabled={!outcome.canCraft}>
                               {outcome.canCraft ? `${t('craft')} (${outcome.chance}%)` : t('craft')}
                             </Button>
                          </div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{tooltipContent}</p>
                    </TooltipContent>
                   </Tooltip>
                </TooltipProvider>
              );
            })}
             {displayedRecipes.length === 0 && (
                <div className="col-span-full text-center text-muted-foreground py-10">
                    <p>{t('noMatchingRecipes')}</p>
                </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

