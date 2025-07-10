import { consumableRecipes } from "./consumables";
import { equipmentRecipes } from "./equipment";
import { toolRecipes } from "./tools";
import { foodRecipes } from "./food";
import type { Recipe } from "../../definitions/recipe";

export const recipes: Record<string, Recipe> = {
    ...consumableRecipes,
    ...equipmentRecipes,
    ...toolRecipes,
    ...foodRecipes,
};
