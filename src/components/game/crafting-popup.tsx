

"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogPortal } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuPortal } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useLanguage } from "@/context/language-context";
import type { PlayerItem, Recipe, ItemDefinition, RecipeIngredient } from "@/lib/game/types";
import type { TranslationKey } from "@/lib/i18n";
import { calculateCraftingOutcome, type CraftingOutcome } from "@/lib/game/engine/crafting";
import { Hammer } from "./icons";
import { cn, getTranslatedText } from "@/lib/utils";

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
              const outcome = calculateCraftingOutcome(playerItems, recipe, itemDefinitions);
              const hasRequiredTool = outcome.hasRequiredTool;
              const resultName = getTranslatedText(recipe.result.name, language, t);
              const resultDescKey = recipe.description;
              const requiredToolName = recipe.requiredTool ? getTranslatedText(recipe.requiredTool, language, t) : '';

              return (
                <div key={index} className="p-4 border rounded-lg bg-muted/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-grow">
                    <h4 className="font-bold text-lg text-foreground flex items-center gap-2">
                      <span className="text-2xl">{recipe.result.emoji}</span>
                      {resultName}
                    </h4>
                    <p className="text-sm text-muted-foreground italic mb-2">{getTranslatedText(resultDescKey, language, t)}</p>
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

                             const usedItemName = getTranslatedText(itemToShow.name, language, t);
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
                                    <p>{reqDesc}</p>
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
