import { foodItems } from "./food";
import { equipmentItems } from "./equipment";
import { materialItems } from "./materials";
import { toolItems } from "./tools";
import { supportItems } from "./support";
import { dataItems } from "./data";
import { magicItems } from "./magic";
import { energySourceItems } from "./energy_source";
import { cookedFoodItems } from "../recipes/food";

export const itemDefinitions = {
    ...foodItems,
    ...equipmentItems,
    ...materialItems,
    ...toolItems,
    ...supportItems,
    ...dataItems,
    ...magicItems,
    ...energySourceItems,
    ...cookedFoodItems,
};
