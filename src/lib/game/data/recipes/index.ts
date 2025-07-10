import { consumableRecipes } from "./consumables";
import { equipmentRecipes } from "./equipment";
import { toolRecipes } from "./tools";
import { foodRecipes } from "./food";

export const recipes = {
    ...consumableRecipes,
    ...equipmentRecipes,
    ...toolRecipes,
    ...foodRecipes,
};
