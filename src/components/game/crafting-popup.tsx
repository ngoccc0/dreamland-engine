

"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogPortal } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuPortal } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useLanguage } from "@/context/language-context";
import type { PlayerItem, Recipe, ItemDefinition, RecipeIngredient, CraftingOutcome } from "@/lib/game/types";
import type { TranslationKey } from "@/lib/i18n";
import { calculateCraftingOutcome } from "@/lib/game/engine/crafting";
import { Hammer } from "./icons";
import { cn, getTranslatedText } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

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
  const [showOnlyCraftable, setShowOnlyCraftable] = useState(false);
  const [sortByCraftability, setSortByCraftability] = useState(false);

  // Process recipes with craftability scores
  const processedRecipes = Object.values(recipes).map(recipe => {
    const outcome = calculateCraftingOutcome(playerItems, recipe, itemDefinitions);
    const craftabilityScore = outcome.resolvedIngredients.filter(ing => ing.hasEnough).length / recipe.ingredients.length;
    return { recipe, outcome, craftabilityScore };
  });

  // Filter and sort recipes
  const filteredRecipes = processedRecipes
    .filter(({ craftabilityScore }) => !showOnlyCraftable || craftabilityScore === 1)
    .sort((a, b) => {
      if (sortByCraftability) {
        return b.craftabilityScore - a.craftabilityScore;
      }
      return 0;
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Hammer /> {t('crafting')}
          </DialogTitle>
          <DialogDescription>{t('craftingDesc')}</DialogDescription>
        </DialogHeader>
        <div className="flex gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={showOnlyCraftable}
              onCheckedChange={setShowOnlyCraftable}
              id="craftable-filter"
            />
            <label htmlFor="craftable-filter" className="text-sm">
              {t('showOnlyCraftable')}
            </label>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortByCraftability(!sortByCraftability)}
            className={cn("text-sm", sortByCraftability && "bg-accent")}
          >
            {t('sortByCraftability')}
          </Button>
        </div>
        <Separator />
        <ScrollArea className="max-h-[65vh] pr-4">
          <div className="p-4 space-y-4">
            {filteredRecipes.map(({ recipe, outcome }, index) => {
              const hasRequiredTool = outcome.hasRequiredTool;
              const resultName = getTranslatedText(recipe.result.name, language, t);
              const resultDescText = getTranslatedText(recipe.description, language, t);
              const requiredToolName = recipe.requiredTool ? t(recipe.requiredTool as TranslationKey) : '';

              return (
                <div key={index} 
                  className={cn(
                    "p-4 border rounded-lg bg-muted/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4",
                    outcome.canCraft && "border-green-400/20"
                  )}>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-lg text-foreground flex items-center gap-2">
                        <span className="text-2xl">{recipe.result.emoji}</span>
                        {resultName}
                      </h4>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className={cn(
                              "px-2 py-0.5 rounded text-xs",
                              outcome.canCraft ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                            )}>
                              {Math.round((outcome.resolvedIngredients.filter(ing => ing.hasEnough).length / recipe.ingredients.length) * 100)}% craftable
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">
                              {outcome.canCraft 
                                ? t('readyToCraft')
                                : t('missingIngredients')}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-sm text-muted-foreground italic mb-2">{resultDescText}</p>
                    <div className="text-sm space-y-1">
                      <div>
                        <span className="font-semibold">{t('ingredients')}:</span>
                        <ul className="list-disc list-inside ml-4">
                          {outcome.resolvedIngredients.map((resolvedIng, i) => {
                             const itemToShow = resolvedIng.usedItem;
                             const requirement = resolvedIng.requirement;
                             const playerQty = resolvedIng.playerQuantity;

                             let itemClass = "text-red-400";
                             if (resolvedIng.hasEnough) {
                                 itemClass = resolvedIng.isSubstitute ? "text-yellow-400" : "text-green-400";
                             }

                             const usedItemName = itemToShow ? getTranslatedText(itemToShow.name, language, t) : '';
                             const requirementName = getTranslatedText(requirement.name, language, t);
                             const reqDef = itemDefinitions[getTranslatedText(requirement.name, 'en')];
                             const reqDesc = reqDef ? getTranslatedText(reqDef.description, language, t) : '';

                            return (
                              <TooltipProvider key={i}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <li className={itemClass}>
                                      {itemToShow ? usedItemName : requirementName} ({playerQty}/{requirement.quantity})
                                    </li>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="space-y-1">
                                      <p>{reqDesc}</p>
                                      {resolvedIng.hasEnough ? (
                                        <p className="text-green-400">{t('ingredientAvailable')}</p>
                                      ) : (
                                        <p className="text-red-400">{t('ingredientMissing', { quantity: resolvedIng.requirement.quantity - resolvedIng.playerQuantity })}</p>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )
                          })}
                        </ul>
                      </div>
                       {recipe.requiredTool && (
                        <div>
                           <span className={cn("font-semibold", hasRequiredTool ? 'text-green-400' : 'text-red-400')}>
                             {t('requiredTool')}: {requiredToolName}
                           </span>
                        </div>
                       )}
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex-shrink-0">
                          <Button onClick={() => onCraft(recipe, outcome)} disabled={!outcome.canCraft}>
                            {outcome.canCraft ? `${t('craft')} (${outcome.chance}%)` : t('craft')}
                          </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {outcome.canCraft ? <p>{t('successChance', { chance: outcome.chance })}</p> : <p>{t('notEnoughIngredients')}</p>}
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
