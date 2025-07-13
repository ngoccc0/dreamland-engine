import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Language, TranslatableString } from "./game/types";
import type { TranslationKey } from "./i18n";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

/**
 * A helper function to get the correct text string based on the current language.
 * It handles both Translation Keys (strings) and direct multilingual objects.
 * @param translatable - The string or object to translate.
 * @param language - The current language ('en' or 'vi').
 * @param t - The translation function from the i18n library.
 * @returns The translated string.
 */
export function getTranslatedText(
    translatable: TranslatableString,
    language: Language,
    t: (key: TranslationKey, options?: any) => string
): string {
    if (typeof translatable === 'string') {
        return t(translatable);
    }
    if (typeof translatable === 'object' && translatable !== null) {
        return translatable[language] || translatable['en'] || '';
    }
    return '';
}


/**
 * Determines an appropriate emoji for a game item based on its name and category.
 * It uses a mapping of keywords to emojis for specific matches and falls back to
 * a category-based map for more general cases.
 *
 * @param name The name of the item.
 * @param category The category of the item (e.g., 'Weapon', 'Food').
 * @returns A string containing a single emoji.
 */
export function getEmojiForItem(name: string, category: string): string {
    const lowerName = name.toLowerCase();
    const lowerCategory = category.toLowerCase();

    // Specific keywords in the name take precedence for more accurate emojis.
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

    for (const keyword in keywordMap) {
        if (lowerName.includes(keyword)) {
            return keywordMap[keyword];
        }
    }

    // If no keyword matches, fall back to a more general category-based emoji.
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
    
    // Return a default emoji if no specific or category match is found.
    return '❓';
}
