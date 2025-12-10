/**
 * Item Utilities
 *
 * @remarks
 * Contains helper functions for item management, including emoji rendering,
 * item ID resolution, and format conversions for item data structures.
 */

import type { Language } from '@/lib/game/types';
import type { TranslatableString } from '@/core/types/i18n';
import { getTranslatedText } from './translation';

/**
 * Get emoji representation for a game item
 *
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
export function getEmojiForItem(name: string, category: string): string {
  const lowerName = name.toLowerCase();
  const lowerCategory = category.toLowerCase();

  // Specific keywords in name take precedence for accuracy
  const keywordMap: Record<string, string> = {
    'axe': '🪓', 'pickaxe': '⛏️', 'hammer': '🔨', 'sword': '⚔️', 'blade': '🔪', 'knife': '🔪',
    'dagger': '🔪', 'bow': '🏹', 'arrow': '🏹', 'shield': '🛡️',
    'potion': '🧪', 'elixir': '🧪', 'vial': '🧪', 'flask': '🧪',
    'herb': '🌿', 'leaf': '🍃', 'flower': '🌸', 'root': '🌱', 'moss': '🌿',
    'wood': '🪵', 'log': '🪵', 'branch': '🌿', 'plank': '🪵',
    'stone': '🪨', 'rock': '🪨', 'pebble': '🪨', 'ore': '⛏️', 'ingot': '🔩',
    'gem': '💎', 'crystal': '💎', 'ruby': '💎', 'sapphire': '💎',
    'meat': '🍖', 'fruit': '🍎', 'berry': '🍓', 'fish': '🐟', 'bread': '🍞', 'egg': '🥚',
    'hide': '🩹', 'pelt': '🩹', 'leather': '👜', 'scale': '🐉',
    'scroll': '📜', 'book': '📖', 'tome': '📖', 'map': '🗺️', 'key': '🗝️',
    'fire': '🔥', 'flame': '🔥', 'torch': '🔥', 'lava': '🌋', 'magma': '🌋',
    'water': '💧', 'ice': '❄️', 'snow': '❄️', 'frost': '❄️',
    'lightning': '⚡', 'storm': '⛈️', 'wind': '💨',
    'heart': '❤️', 'soul': '👻', 'spirit': '👻',
    'bone': '🦴', 'skull': '💀', 'fang': '🦷', 'tooth': '🦷', 'claw': '🐾',
    'cloth': '🧣', 'silk': '🕸️', 'thread': '🧵', 'string': '🧵', 'rope': '🪢',
    'seed': '🌱',
  };

  // Check for keyword matches
  for (const keyword in keywordMap) {
    if (lowerName.includes(keyword)) {
      return keywordMap[keyword];
    }
  }

  // Fall back to category-based mapping
  const categoryMap: Record<string, string> = {
    'weapon': '⚔️',
    'material': '🧱',
    'energy source': '⚡',
    'food': '🍴',
    'data': '📜',
    'tool': '🛠️',
    'equipment': '🛡️',
    'support': '❤️‍🩹',
    'magic': '✨',
    'fusion': '🌀',
  };

  if (lowerCategory in categoryMap) {
    return categoryMap[lowerCategory];
  }

  // Default emoji if no match
  return '❓';
}

/**
 * Resolve canonical item ID from translatable name or string
 *
 * @remarks
 * Prefers explicit record keys when `itemDefs` is provided.
 * Falls back to matching English translations for backward compatibility.
 * Callers should prefer using `id` fields on items when available.
 *
 * @param itemOrName - Item name or translatable string
 * @param itemDefs - Optional record of item definitions keyed by id
 * @param t - Optional translation function for key-based lookups
 * @param language - Language for translation fallbacks (default: 'en')
 * @returns Resolved canonical id, or undefined if not found
 *
 * @example
 * const id = resolveItemId("Iron Sword", itemDefs);
 * // → "iron_sword" (if that's the record key)
 */
export function resolveItemId(
  itemOrName: TranslatableString | string | undefined | null,
  itemDefs?: Record<string, any>,
  t?: (k: string, opts?: any) => string,
  _language: Language = 'en'
): string | undefined {
  if (!itemOrName) return undefined;

  // If string and directly a key in itemDefs, return it
  if (typeof itemOrName === 'string') {
    if (itemDefs && itemDefs[itemOrName]) return itemOrName;

    // Try to match by definition id or English name
    if (itemDefs) {
      for (const [key, def] of Object.entries(itemDefs)) {
        if (def?.id && def.id === itemOrName) return def.id;
        try {
          // Match against English and Vietnamese names
          const defNameEn = getTranslatedText(def.name, 'en', t as any);
          const defNameVi = getTranslatedText(def.name, 'vi', t as any);
          if (defNameEn === itemOrName || defNameVi === itemOrName) return def.id ?? key;
        } catch {
          // Ignore malformed definitions
        }
      }
    }
    return undefined;
  }

  // itemOrName is a TranslatableString-like object
  if (itemDefs) {
    const inputNameEn = getTranslatedText(itemOrName as TranslatableString, 'en', t as any);
    for (const [key, def] of Object.entries(itemDefs)) {
      if (def?.id && (itemOrName as any).id && def.id === (itemOrName as any).id) return def.id;
      try {
        const defNameEn = getTranslatedText(def.name, 'en', t as any);
        if (defNameEn === inputNameEn) return def.id ?? key;
      } catch {
        // Ignore and continue
      }
    }
  }

  return undefined;
}

/**
 * Ensure a PlayerItem-like object has a canonical ID
 *
 * @remarks
 * If item already has an `id`, leaves it unchanged.
 * Otherwise attempts to resolve a canonical id from item's name.
 * Falls back to English translation string as best-effort id.
 *
 * Safe to call before inserting items into `playerStats.items`
 * to ensure deterministic lookups.
 *
 * @param item - Player item object
 * @param itemDefs - Optional record of item definitions
 * @param t - Optional translation function
 * @param language - Language for fallbacks (default: 'en')
 * @returns Item with id field populated
 */
export function ensurePlayerItemId<T extends { name?: any; id?: string }>(
  item: T,
  itemDefs?: Record<string, any>,
  t?: (k: string, opts?: any) => string,
  _language: Language = 'en'
): T {
  if (!item) return item;
  if (item.id) return item;

  try {
    const resolved =
      resolveItemId(item.name, itemDefs, t, _language) ??
      getTranslatedText(item.name as any, 'en', t as any);
    if (resolved) item.id = resolved as any;
  } catch {
    // Ignore errors and leave item as-is
  }

  return item;
}

/**
 * Convert array of GeneratedItem to Record format
 *
 * @remarks
 * Uses English name of each item as the record key.
 * Useful for converting API responses to indexed lookup tables.
 *
 * @param items - Array of item definitions
 * @returns Record keyed by English item names
 */
export function convertItemArrayToRecord(items: any[]): Record<string, any> {
  const record: Record<string, any> = {};
  for (const item of items) {
    if (item && item.name) {
      const englishName = getTranslatedText(item.name, 'en');
      if (englishName) {
        record[englishName] = item;
      }
    }
  }
  return record;
}
