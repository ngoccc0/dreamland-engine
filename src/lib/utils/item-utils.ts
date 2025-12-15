import { allItems as itemDefinitions } from '@/core/data/items';
import type { ItemDefinition } from '@/core/types/game';
import type { PlayerItem } from '@/core/types/game';
import { getTranslatedText } from './translation';

/**
 * Resolve an item definition by a key or display name.
 * @remarks
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

/**
 * Resolve an item ID by name and language.
 * @remarks
 * Attempts to resolve item by name in the specified language, returning the canonical item ID.
 * Falls back to the English name if not found in the specified language.
 *
 * @param name - Item name to resolve
 * @param definitions - Item definitions record
 * @param _unused - Unused parameter (kept for backward compatibility)
 * @param language - Language preference ('en' or 'vi')
 * @returns The canonical item ID if found, undefined otherwise
 */
export const resolveItemId = (
  name: string | undefined | null,
  definitions?: Record<string, ItemDefinition> | null,
  _unused?: any,
  language: string = 'en'
): string | undefined => {
  if (!name) return undefined;

  // Direct key lookup first
  if (definitions?.[typeof name === 'string' ? name : '']) {
    const def = definitions[typeof name === 'string' ? name : ''];
    return def?.id || (typeof name === 'string' ? name : undefined);
  }

  // Try to find by translated name
  const allDefs = definitions || itemDefinitions;
  for (const [key, def] of Object.entries(allDefs)) {
    const defName = def?.name;
    if (!defName) continue;

    if (typeof defName === 'string') {
      if (defName === name) {
        return def?.id || key;
      }
    } else if (typeof defName === 'object' && defName !== null) {
      const langName = (defName as any)[language];
      if (langName === name) {
        return def?.id || key;
      }
      // Also try English as fallback
      if (language !== 'en' && (defName as any).en === name) {
        return def?.id || key;
      }
    }
  }

  // Return as-is if it looks like an ID
  if (typeof name === 'string' && name.includes('_')) {
    return name;
  }

  return undefined;
};

/**
 * Get emoji representation for a game item.
 * @remarks
 * Uses keyword-matching on item name for precision, then falls back
 * to category-based emoji mapping. Returns '❓' if no match found.
 *
 * @param name - Item name (will be matched case-insensitively)
 * @param category - Item category (weapon, food, material, etc.)
 * @returns Single emoji character
 *
 * @example
 * getEmojiForItem("Iron Sword", "Weapon") // → "⚔️"
 * getEmojiForItem("Healing Potion", "Support") // → "🧪"
 */
export const getEmojiForItem = (name: string, category: string): string => {
  const lowerName = name.toLowerCase();
  const lowerCategory = category.toLowerCase();

  // Specific keywords in name take precedence for accuracy
  const keywordMap: Record<string, string> = {
    'axe': '🪓',
    'pickaxe': '⛏️',
    'hammer': '🔨',
    'sword': '⚔️',
    'blade': '🔪',
    'knife': '🔪',
    'dagger': '🔪',
    'bow': '🏹',
    'arrow': '🏹',
    'shield': '🛡️',
    'potion': '🧪',
    'elixir': '🧪',
    'herb': '🌿',
    'flower': '🌸',
    'seed': '🌱',
    'stone': '🪨',
    'ore': '⛓️',
    'coal': '⚫',
    'gem': '💎',
    'crystal': '💠',
    'wood': '🪵',
    'log': '🪵',
    'rope': '🪢',
    'cloth': '🧵',
    'leather': '🎒',
    'metal': '🔩',
    'glass': '🍸',
    'gold': '🪙',
    'copper': '🪙',
    'silver': '🪙',
    'bread': '🍞',
    'meat': '🍖',
    'fish': '🐟',
    'fruit': '🍎',
    'vegetable': '🥬',
    'egg': '🥚',
    'milk': '🥛',
    'cheese': '🧀',
    'book': '📖',
    'scroll': '📜',
    'key': '🔑',
    'map': '🗺️',
    'torch': '🔦',
    'lantern': '🏮',
    'bell': '🔔',
    'bottle': '🍾',
    'bucket': '🪣',
    'shovel': '🪣',
    'hooka': '🎣',
    'rod': '🎣',
    'wand': '✨',
  };

  for (const [keyword, emoji] of Object.entries(keywordMap)) {
    if (lowerName.includes(keyword)) {
      return emoji;
    }
  }

  // Fallback to category-based emoji
  const categoryMap: Record<string, string> = {
    'weapon': '⚔️',
    'armor': '🛡️',
    'food': '🍖',
    'consumable': '🧪',
    'support': '🧪',
    'material': '🪨',
    'tool': '🔧',
    'misc': '📦',
  };

  return categoryMap[lowerCategory] || '❓';
};

/**
 * Ensure a player inventory item has a canonical ID.
 * @remarks
 * Assigns a canonical ID based on definition or English name translation.
 * Necessary for tracking items across save/load cycles.
 */
export const ensurePlayerItemId = (
  item: PlayerItem,
  definitions: Record<string, ItemDefinition>,
  t: (key: string, params?: any) => string,
  language: string
): PlayerItem => {
  if (item.id) return item;

  const itemName = getTranslatedText(item.name, 'en');
  const def = definitions?.[itemName];
  const id = def?.id || itemName;

  return {
    ...item,
    id,
  };
};

/**
 * Convert an array of items to a record (map) indexed by item name.
 * @remarks
 * Useful for quick lookups and aggregations of item arrays.
 */
export const convertItemArrayToRecord = (
  items: PlayerItem[] | ItemDefinition[]
): Record<string, PlayerItem | ItemDefinition> => {
  const record: Record<string, PlayerItem | ItemDefinition> = {};
  for (const item of items) {
    const key = getTranslatedText(item.name, 'en');
    record[key] = item;
  }
  return record;
};

export default resolveItemDef;
