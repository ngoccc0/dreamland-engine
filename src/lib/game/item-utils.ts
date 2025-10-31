import { itemDefinitions } from '@/lib/game/items';
import type { ItemDefinition } from '@/lib/game/types';

/**
 * Resolve an item definition by name.
 * Prefer world-specific/custom definitions, but fall back to the global catalog.
 */
export const resolveItemDef = (name: string | undefined | null, customDefs?: Record<string, ItemDefinition> | null): ItemDefinition | undefined => {
  if (!name) return undefined;
  if (customDefs && customDefs[name]) return customDefs[name];
  return itemDefinitions[name];
};

export default resolveItemDef;
