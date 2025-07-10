
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useLanguage } from "@/context/language-context";
import type { PlayerItem, Recipe, RecipeIngredient, ItemDefinition } from "@/lib/game/types";
import type { TranslationKey } from "@/lib/i18n";
import { calculateCraftingOutcome, type CraftingOutcome } from "@/lib/game/engine";
import { Hammer } from "./icons";
import { cn } from "@/lib/utils";

interface CraftingPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerItems: PlayerItem[];
  itemDefinitions: Record<string, ItemDefinition>;
  recipes: Record<string, Recipe>;
  onCraft: (recipe: Recipe, outcome: CraftingOutcome) => void;
}

export function CraftingPopup({ open, onOpenChange, playerItems, itemDefinitions, recipes, onCraft }: CraftingPopupProps) {
  const { t } = useLanguage();

  const getTooltipContent = (ingredient: RecipeIngredient): string => {
    return `${t('buildNeed')}: ${t(ingredient.name as TranslationKey)}`;
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
        <ScrollArea className="max-h-[65vh] pr-4">
          <div className="p-4 space-y-4">
            {Object.values(recipes).map((recipe, index) => {
              const outcome = calculateCraftingOutcome(playerItems, itemDefinitions, recipe);
              return (
                <div key={index} className="p-4 border rounded-lg bg-muted/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-grow">
                    <h4 className="font-bold text-lg text-foreground flex items-center gap-2">
                      <span className="text-2xl">{recipe.result.emoji}</span>
                      {t(recipe.result.name as TranslationKey)}
                    </h4>
                    <p className="text-sm text-muted-foreground italic mb-2">{t(recipe.description as TranslationKey)}</p>
                    <div className="text-sm">
                      <div className="font-semibold mb-1">{t('ingredients')}:</div>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        {outcome.resolvedIngredients.map((resolvedIng, i) => {
                           const requirement = resolvedIng.requirement;
                           const used = resolvedIng.usedItem;

                           let itemClass = "text-red-400";
                           if (resolvedIng.hasEnough) {
                               itemClass = resolvedIng.isSubstitute ? "text-yellow-400" : "text-green-400";
                           }

                          return (
                            <TooltipProvider key={i}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <li className={cn(itemClass, "cursor-help")}>
                                    {t(requirement.name as TranslationKey)} ({used.playerQuantity}/{requirement.quantity})
                                    {resolvedIng.isSubstitute && <span className="text-xs italic"> ({t('usingLabel')} {t(used.name as TranslationKey)})</span>}
                                  </li>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{getTooltipContent(requirement)}</p>
                                  {resolvedIng.isSubstitute && <p className="text-xs text-yellow-300">{t('substitutePenaltyWarning', { tier: used.tier})}</p>}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )
                        })}
                      </ul>
                      {recipe.requiredTool && (
                        <div className="mt-2 text-xs">
                           <span className={cn("font-semibold", outcome.hasRequiredTool ? 'text-green-400' : 'text-red-400')}>
                                {t('requiredToolLabel')}: {t(recipe.requiredTool as TranslationKey)} ({outcome.hasRequiredTool ? t('hasToolLabel') : t('missingToolLabel')})
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
