

"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useLanguage } from "@/context/language-context";
import type { PlayerItem, Recipe, ItemDefinition, CraftingOutcome } from "@/lib/game/types";
import type { TranslationKey } from "@/lib/i18n";
import { calculateCraftingOutcome } from "@/lib/game/engine/crafting";
import { Hammer } from "./icons";
import { cn, getTranslatedText } from "@/lib/utils";
import { resolveItemDef } from '@/lib/game/item-utils';
import { Switch } from "@/components/ui/switch";

import React, { useState, useMemo } from "react";

interface CraftingPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerItems: PlayerItem[];
  itemDefinitions: Record<string, ItemDefinition>;
  recipes: Record<string, Recipe>;
  onCraft: (recipe: Recipe, outcome: CraftingOutcome) => void;
}

function CraftingPopupImpl({ open, onOpenChange, playerItems, itemDefinitions, recipes, onCraft }: CraftingPopupProps) {
  // Short-circuit render when popup is closed to avoid expensive work while hidden
  if (!open) return null;
  const { t, language } = useLanguage();
  const [showOnlyCraftable, setShowOnlyCraftable] = useState(false);
  const [showOnlyWithAnyIngredient, setShowOnlyWithAnyIngredient] = useState(false);
  const [sortByCraftability, setSortByCraftability] = useState(false);
  const [sortByAlphabet, setSortByAlphabet] = useState(false);
  const [sortByItemType, setSortByItemType] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Process recipes with craftability scores and item categories
  const processedRecipes = useMemo(() => {
    return Object.values(recipes).map(recipe => {
      const outcome = calculateCraftingOutcome(playerItems, recipe, itemDefinitions);
      const craftabilityScore = outcome.resolvedIngredients.filter(ing => ing.hasEnough).length / recipe.ingredients.length;

      // Get item category from itemDefinitions
      const itemDef = itemDefinitions[recipe.result.name] || resolveItemDef(recipe.result.name, itemDefinitions);
      const itemCategory = itemDef?.category || 'Misc';

      // Get translated item name for sorting/searching
      const translatedName = getTranslatedText(recipe.result.name, language, t).toLowerCase();

      return { recipe, outcome, craftabilityScore, itemCategory, translatedName };
    });
  }, [recipes, playerItems, itemDefinitions, language, t]);

  // Filter and sort recipes
  const filteredRecipes = useMemo(() => {
    return processedRecipes
      .filter(({ craftabilityScore, outcome, translatedName }) => {
        if (showOnlyCraftable && craftabilityScore < 1) {
          return false;
        }
        if (showOnlyWithAnyIngredient && outcome.resolvedIngredients.every(ing => ing.playerQuantity === 0)) {
          return false;
        }
        if (searchTerm && !translatedName.includes(searchTerm.toLowerCase())) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortByCraftability) {
          return b.craftabilityScore - a.craftabilityScore;
        }
        if (sortByAlphabet) {
          return a.translatedName.localeCompare(b.translatedName);
        }
        if (sortByItemType) {
          return a.itemCategory.localeCompare(b.itemCategory);
        }
        return 0;
      });
  }, [processedRecipes, showOnlyCraftable, showOnlyWithAnyIngredient, searchTerm, sortByCraftability, sortByAlphabet, sortByItemType]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Hammer /> {t('crafting')}
          </DialogTitle>
          <DialogDescription>{t('craftingDesc')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mb-4">
          <div className="flex gap-4">
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
            <div className="flex items-center gap-2">
              <Switch
                checked={showOnlyWithAnyIngredient}
                onCheckedChange={setShowOnlyWithAnyIngredient}
                id="any-ingredient-filter"
              />
              <label htmlFor="any-ingredient-filter" className="text-sm">
                {t('showOnlyWithAnyIngredient')}
              </label>
            </div>
          </div>
          <div className="flex gap-4">
            <Input
              placeholder={t('searchRecipes') || 'Search recipes...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSortByAlphabet(!sortByAlphabet);
                if (!sortByAlphabet) {
                  setSortByCraftability(false);
                  setSortByItemType(false);
                }
              }}
              className={cn("text-sm", sortByAlphabet && "bg-accent")}
            >
              {t('sortByAlphabet') || 'A-Z'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSortByItemType(!sortByItemType);
                if (!sortByItemType) {
                  setSortByCraftability(false);
                  setSortByAlphabet(false);
                }
              }}
              className={cn("text-sm", sortByItemType && "bg-accent")}
            >
              {t('sortByItemType') || 'By Type'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSortByCraftability(!sortByCraftability);
                if (!sortByCraftability) {
                  setSortByAlphabet(false);
                  setSortByItemType(false);
                }
              }}
              className={cn("text-sm", sortByCraftability && "bg-accent")}
            >
              {t('sortByCraftability')}
            </Button>
          </div>
        </div>
        <Separator />
        <ScrollArea className="max-h-[65vh] pr-4">
          <div className="p-4 space-y-4">
            {filteredRecipes.map(({ recipe, outcome }, index) => {
              const hasRequiredTool = outcome.hasRequiredTool;
              const resultName = getTranslatedText(recipe.result.name, language, t);
              const resultDescText = getTranslatedText(recipe.description, language, t);
              const requiredToolName = recipe.requiredTool ? getTranslatedText(recipe.requiredTool as any, language, t) : '';

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
                             const reqDef = resolveItemDef(getTranslatedText(requirement.name, 'en'), itemDefinitions);
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

export const CraftingPopup = React.memo(CraftingPopupImpl);
