import { consumableRecipes } from "./consumables";
import { equipmentRecipes } from "./equipment";
import { toolRecipes } from "./tools";

export const recipes = {
    ...consumableRecipes,
    ...equipmentRecipes,
    ...toolRecipes,
};
