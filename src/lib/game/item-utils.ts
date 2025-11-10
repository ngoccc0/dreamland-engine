import { itemDefinitions } from '@/lib/game/items';
import type { ItemDefinition } from '@/core/types/game';

/**
 * Resolve an item definition by a key or display name.
 * Priority:
 * 1) customDefs by key
 * 2) itemDefinitions by key
 * 3) customDefs by translated/display name (en/vi)
 * 4) itemDefinitions by translated/display name (en/vi)
 */
export const resolveItemDef = (name: string | undefined | null, customDefs?: Record<string, ItemDefinition> | null): ItemDefinition | undefined => {
  if (!name) return undefined;

  // direct key lookup
  if (customDefs && customDefs[name]) return customDefs[name];
  if (itemDefinitions[name]) return itemDefinitions[name];

  // otherwise search by translated/display name
  const tryMatchIn = (map: Record<string, ItemDefinition> | undefined) => {
    if (!map) return undefined;
    for (const key of Object.keys(map)) {
      const def = map[key] as any;
      const defName = def?.name;
      if (!defName) continue;
      if (typeof defName === 'string') {
        if (defName === name) return def as ItemDefinition;
      } else {
        if (defName.en === name || defName.vi === name) return def as ItemDefinition;
      }
    }
    return undefined;
  };

  const fromCustomByDisplay = tryMatchIn(customDefs || undefined);
  if (fromCustomByDisplay) return fromCustomByDisplay;

  const fromMasterByDisplay = tryMatchIn(itemDefinitions as any);
  if (fromMasterByDisplay) return fromMasterByDisplay;

  return undefined;
};

export default resolveItemDef;
