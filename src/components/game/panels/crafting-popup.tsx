/**
 * @overview
 * Crafting popup component featuring a 2-column grid layout with advanced filtering.
 * Displays recipes with images, names, and ingredients. Supports filtering by category,
 * craftability, missing ingredients, and tier-based sorting.
 * 
 * Key features:
 * - Default: Alphabetical + craftability sorting (always applied)
 * - Compact search bar + Advanced toggle (expands filters when clicked)
 * - Advanced section: Category dropdown, tier sort, craftable/missing toggles
 * - 2-column responsive grid with images, name, ingredients per recipe card
 * - Audio feedback: CRAFT_START sound on craft button click
 */

"use client";
"use client";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MorphDialogContent } from "@/components/ui/morph-dialog-content";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/context/language-context";
import type { PlayerItem, Recipe, ItemDefinition, CraftingOutcome } from "@/lib/game/types";
import { useAudio } from "@/lib/audio/useAudio";
import { AudioActionType } from "@/core/data/audio-events";
import { calculateCraftingOutcome } from "@/core/engines/game/crafting";
import { Hammer, Settings } from "./icons";
import { cn, getTranslatedText } from "@/lib/utils";
import { resolveItemDef } from '@/lib/utils/item-utils';
import { Switch } from "@/components/ui/switch";
import { IconRenderer } from "@/components/ui/icon-renderer";

import React, { useState, useMemo } from "react";


interface CraftingPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerItems: PlayerItem[];
  itemDefinitions: Record<string, ItemDefinition>;
  recipes: Record<string, Recipe>;
  onCraft: (recipe: Recipe, outcome: CraftingOutcome) => void;
}

/**
 * Extract all unique categories from recipes and their item definitions.
 * Used to populate the category dropdown in advanced filters.
 */
function extractCategories(recipes: Record<string, Recipe>, itemDefinitions: Record<string, ItemDefinition>): string[] {
  const categories = new Set<string>();

  Object.values(recipes).forEach(recipe => {
    const itemDef = itemDefinitions[recipe.result.name] || resolveItemDef(recipe.result.name, itemDefinitions);
    if (itemDef?.category) {
      categories.add(itemDef.category);
    }
  });

  return Array.from(categories).sort();
}

function CraftingPopupImpl({ open, onOpenChange, playerItems, itemDefinitions, recipes, onCraft }: CraftingPopupProps) {
  // Short-circuit render when popup is closed to avoid expensive work while hidden
  if (!open) return null;
  const { t, language } = useLanguage();
  const audio = useAudio();

  // State for advanced filters
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tierSort, setTierSort] = useState<'none' | 'asc' | 'desc'>('none');
  const [showOnlyCraftable, setShowOnlyCraftable] = useState(false);
  const [showOnlyMissingIngredients, setShowOnlyMissingIngredients] = useState(false);

  // Animation state for craft success feedback
  const [animatingRecipeIndex, setAnimatingRecipeIndex] = useState<number | null>(null);

  // Get all available categories
  const availableCategories = useMemo(() => {
    return extractCategories(recipes, itemDefinitions);
  }, [recipes, itemDefinitions]);

  // Process recipes with metadata: craftability, category, tier, translated name
  const processedRecipes = useMemo(() => {
    return Object.values(recipes).map(recipe => {
      const outcome = calculateCraftingOutcome(playerItems, recipe, itemDefinitions);
      const craftabilityScore = outcome.resolvedIngredients.filter(ing => ing.hasEnough).length / recipe.ingredients.length;

      // Get item definition for category and tier
      const itemDef = itemDefinitions[recipe.result.name] || resolveItemDef(recipe.result.name, itemDefinitions);
      const itemCategory = itemDef?.category || 'Misc';
      const itemTier = itemDef?.tier ?? 0;

      // Get translated item name for sorting/searching
      const translatedName = getTranslatedText(recipe.result.name, language, t).toLowerCase();

      return { recipe, outcome, craftabilityScore, itemCategory, itemTier, translatedName, itemDef };
    });
  }, [recipes, playerItems, itemDefinitions, language, t]);

  /**
   * Apply filters and sorting:
   * 1. Default: Always sort A-Z, then by craftability
   * 2. Filters: Search term, category, craftable-only, missing-only
   * 3. Advanced sort: Tier ascending/descending (applied after default sort)
   */
  const filteredRecipes = useMemo(() => {
    return processedRecipes
      .filter(({ craftabilityScore, outcome, translatedName, itemCategory }) => {
        // Search filter
        if (searchTerm && !translatedName.includes(searchTerm.toLowerCase())) {
          return false;
        }

        // Category filter
        if (selectedCategory && itemCategory !== selectedCategory) {
          return false;
        }

        // Craftable-only filter: show only 100% craftable recipes
        if (showOnlyCraftable && craftabilityScore < 1) {
          return false;
        }

        // Missing-only filter: show only recipes with 0% craftability (no ingredients at all)
        if (showOnlyMissingIngredients && outcome.resolvedIngredients.some(ing => ing.playerQuantity > 0)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Default sort 1: Alphabetical (A-Z)
        const nameComparison = a.translatedName.localeCompare(b.translatedName);
        if (nameComparison !== 0) {
          return nameComparison;
        }

        // Default sort 2: By craftability (descending: easier recipes first)
        return b.craftabilityScore - a.craftabilityScore;
      })
      .sort((a, b) => {
        // Advanced sort: By tier (if enabled)
        if (tierSort === 'asc') {
          return a.itemTier - b.itemTier;
        }
        if (tierSort === 'desc') {
          return b.itemTier - a.itemTier;
        }
        // If tierSort is 'none', maintain the previous sort order
        return 0;
      });
  }, [processedRecipes, searchTerm, selectedCategory, showOnlyCraftable, showOnlyMissingIngredients, tierSort]);

  /**
   * Build a compact ingredient display string: "2x Wood, 1x Stone"
   */
  const getIngredientsCompact = (outcome: CraftingOutcome): string => {
    return outcome.resolvedIngredients
      .map(ing => {
        const itemName = getTranslatedText(ing.requirement.name, language, t);
        const isMissing = !ing.hasEnough;
        const color = isMissing ? '❌' : '✓';
        return `${color} ${ing.requirement.quantity}x ${itemName}`;
      })
      .join(', ');
  };

  const handleCraft = (recipe: Recipe, outcome: CraftingOutcome) => {
    audio.playSfxForAction(AudioActionType.CRAFT_START);
    onCraft(recipe, outcome);

    // Find the recipe in filtered list to get its index for animation
    const recipeIndex = filteredRecipes.findIndex(r => r.recipe === recipe);
    if (recipeIndex >= 0) {
      setAnimatingRecipeIndex(recipeIndex);
      // Clear animation state after animation completes
      setTimeout(() => setAnimatingRecipeIndex(null), 800);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>

      <MorphDialogContent layoutId="popup-crafting" className="sm:max-w-2xl" containerClassName="p-6">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Hammer /> {t('crafting')}
          </DialogTitle>
          <DialogDescription>{t('craftingDesc')}</DialogDescription>
        </DialogHeader>

        {/* Compact filter row: Search + Advanced toggle */}
        <div className="flex gap-2 items-center mb-4">
          <Input
            placeholder={t('searchRecipes') || 'Search recipes...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
            aria-label="Search recipes by name"
          />
          <Button
            variant={showAdvanced ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2"
            aria-expanded={showAdvanced}
            aria-controls="advanced-filters"
          >
            <Settings className="w-4 h-4" />
            {t('advanced') || 'Advanced'}
          </Button>
        </div>

        {/* Advanced filters section (collapsible) */}
        {showAdvanced && (
          <>
            <div className="space-y-4 pb-4 px-1" id="advanced-filters">
              {/* Row 1: Category dropdown + Tier sort dropdown */}
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    {t('category') || 'Category'}
                  </label>
                  <Select value={selectedCategory || "all"} onValueChange={(val) => setSelectedCategory(val === "all" ? null : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('all') || 'All'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t('all') || 'All'}
                      </SelectItem>
                      {availableCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    {t('sortByTier') || 'Sort by Tier'}
                  </label>
                  <Select value={tierSort} onValueChange={(val) => setTierSort(val as 'none' | 'asc' | 'desc')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        {t('none') || 'None'}
                      </SelectItem>
                      <SelectItem value="asc">
                        {t('ascending') || 'Ascending'}
                      </SelectItem>
                      <SelectItem value="desc">
                        {t('descending') || 'Descending'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Craftable-only + Missing-only toggles */}
              <div className="flex gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={showOnlyCraftable}
                    onCheckedChange={setShowOnlyCraftable}
                    id="advanced-craftable-filter"
                  />
                  <label htmlFor="advanced-craftable-filter" className="text-sm cursor-pointer">
                    {t('showOnlyCraftable') || 'Show Only Craftable'}
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={showOnlyMissingIngredients}
                    onCheckedChange={setShowOnlyMissingIngredients}
                    id="advanced-missing-filter"
                  />
                  <label htmlFor="advanced-missing-filter" className="text-sm cursor-pointer">
                    {t('showOnlyMissing') || 'Missing Ingredients Only'}
                  </label>
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* 2-Column Grid Recipe Layout */}
        <ScrollArea className="max-h-[60vh] pr-4">
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4"
            role="region"
            aria-label="Crafting recipes"
            aria-live="polite"
          >
            {filteredRecipes.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                {t('noRecipesFound') || 'No recipes found'}
              </div>
            ) : (
              filteredRecipes.map(({ recipe, outcome, itemDef }, index) => {
                const resultName = getTranslatedText(recipe.result.name, language, t);
                const ingredientsCompact = getIngredientsCompact(outcome);
                const hasRequiredTool = outcome.hasRequiredTool;
                const requiredToolName = recipe.requiredTool ? getTranslatedText(recipe.requiredTool as any, language, t) : '';

                // Pick icon: prefer image objects, fallback to emoji
                let icon: string | { type: 'image'; url: string } = recipe.result.emoji;
                if (itemDef?.emoji && typeof itemDef.emoji === 'object' && itemDef.emoji.type === 'image') {
                  icon = itemDef.emoji;
                } else if (itemDef?.emoji) {
                  icon = itemDef.emoji;
                }

                return (
                  <div
                    key={index}
                    className={cn(
                      "border rounded-lg p-4 flex flex-col gap-3",
                      "bg-card hover:bg-accent/50 transition-colors",
                      "focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-accent rounded-lg",
                      outcome.canCraft ? "border-green-400/30" : "border-muted",
                      animatingRecipeIndex === index && "craft-success-animate"
                    )}
                    role="article"
                    aria-label={`Recipe: ${resultName}`}
                    aria-describedby={`recipe-${index}-desc`}
                  >
                    {/* Image + Name */}
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 flex-shrink-0 bg-muted rounded flex items-center justify-center" aria-hidden="false">
                        <IconRenderer icon={icon} size={48} alt={resultName} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-base line-clamp-2">{resultName}</h4>
                        <div className="text-xs mt-1" id={`recipe-${index}-desc`}>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded",
                              outcome.canCraft
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            )}
                            aria-label={`${Math.round((outcome.resolvedIngredients.filter(ing => ing.hasEnough).length / recipe.ingredients.length) * 100)}% craftable`}
                          >
                            {Math.round((outcome.resolvedIngredients.filter(ing => ing.hasEnough).length / recipe.ingredients.length) * 100)}% {t('craftable') || 'craftable'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ingredients (compact display) */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {ingredientsCompact}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="space-y-2">
                            <p className="font-semibold">{t('ingredients') || 'Ingredients'}:</p>
                            {outcome.resolvedIngredients.map((ing, i) => (
                              <div key={i} className={cn(
                                "text-xs",
                                ing.hasEnough ? "text-green-400" : "text-red-400"
                              )}>
                                {getTranslatedText(ing.requirement.name, language, t)}: {ing.playerQuantity}/{ing.requirement.quantity}
                              </div>
                            ))}
                            {recipe.requiredTool && (
                              <div className={cn(
                                "text-xs",
                                hasRequiredTool ? "text-green-400" : "text-red-400"
                              )}>
                                {t('requiredTool') || 'Required Tool'}: {requiredToolName}
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Craft Button */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => handleCraft(recipe, outcome)}
                            disabled={!outcome.canCraft}
                            className="w-full mt-2"
                            size="sm"
                            aria-label={`Craft ${resultName}${outcome.canCraft ? ` (${outcome.chance}% success)` : ' (not enough ingredients)'}`}
                          >
                            {outcome.canCraft ? `${t('craft') || 'Craft'} (${outcome.chance}%)` : t('craft') || 'Craft'}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {outcome.canCraft ? (
                            <p>{t('successChance', { chance: outcome.chance }) || `Success: ${outcome.chance}%`}</p>
                          ) : (
                            <p>{t('notEnoughIngredients') || 'Not enough ingredients'}</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </MorphDialogContent>
    </Dialog>
  );
}

export const CraftingPopup = React.memo(CraftingPopupImpl);
