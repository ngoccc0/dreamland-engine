import { consumableItems } from "./consumables";
import { equipmentItems } from "./equipment";
import { materialItems } from "./materials";
import { toolItems } from "./tools";

export const itemDefinitions = {
    ...consumableItems,
    ...equipmentItems,
    ...materialItems,
    ...toolItems
};
