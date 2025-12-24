'use client';

import { useState } from "react";
import type { Recipe, Structure, ItemDefinition, GeneratedItem } from "@/core/types/game";
import { allRecipes as staticRecipes } from '@/core/data/recipes';
import { buildableStructures as staticBuildableStructures } from '@/core/data/structures';
import { allItems as staticItemDefinitions } from '@/core/data/items';
import { biomeDefinitions as staticBiomeDefinitions } from '@/core/data/biomes';

export function useContentRegistry() {
    const [recipes, setRecipes] = useState<Record<string, Recipe>>(staticRecipes);
    const [buildableStructures, setBuildableStructures] = useState<Record<string, Structure>>(staticBuildableStructures);
    const [biomeDefinitions, setBiomeDefinitions] = useState<any>(staticBiomeDefinitions);
    const [customItemDefinitions, setCustomItemDefinitions] = useState<Record<string, ItemDefinition>>(staticItemDefinitions);
    const [customItemCatalog, setCustomItemCatalog] = useState<GeneratedItem[]>([]);
    const [customStructures, setCustomStructures] = useState<Structure[]>([]);

    return {
        recipes, setRecipes,
        buildableStructures, setBuildableStructures,
        biomeDefinitions, setBiomeDefinitions,
        customItemDefinitions, setCustomItemDefinitions,
        customItemCatalog, setCustomItemCatalog,
        customStructures, setCustomStructures
    };
}
