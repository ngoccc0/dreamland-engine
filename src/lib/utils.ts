
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Language, NarrativeLength } from "./game/types";
import type { TranslationKey } from "./i18n";
import type { TranslatableString } from "@/core/types/i18n";
import { isTranslationObject, isInlineTranslation } from "@/core/types/i18n";

/**
 * A utility function to merge Tailwind CSS classes conditionally.
 * It intelligently combines class strings, handling conflicts and removing duplicates.
 * @param {...ClassValue[]} inputs - A list of class names or conditional class objects.
 * @returns {string} The final, merged class string.
 * @example
 * cn("p-4", "font-bold", { "bg-red-500": isError });
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Clamps a number between a minimum and maximum value.
 * @param {number} num - The number to clamp.
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} The clamped number.
 */
export const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

/**
 * A helper function to get the correct text string based on the current language.
 * It handles both Translation Keys (strings) and direct multilingual objects.
 * @param {TranslatableString} translatable - The string or object to translate.
 * @param {Language} language - The current language ('en' or 'vi').
 * @param {Function} [t] - The translation function from the i18n library.
 * @returns {string} The translated string.
 * @example
 * getTranslatedText({ en: 'Hello', vi: 'Xin chào' }, 'vi'); // "Xin chào"
 * getTranslatedText('some_translation_key', 'en', t); // Looks up the key in the English translations
 */
/**
 * Gets the translated text for a given translatable string.
 * Handles both translation keys and inline translations with proper type safety.
 * 
 * @param translatable - The string or object to translate
 * @param language - The target language
 * @param t - Optional translation function for key-based translations
 * @returns The translated string
 */
export function getTranslatedText(
    translatable: TranslatableString | undefined | null,
    language: Language,
    t?: (key: TranslationKey, options?: any) => string
): string {
    if (!translatable) return '';
    // Handle direct translation keys
    if (typeof translatable === 'string') {
        if (t) {
            return t(translatable);
        }
        return translatable;
    }

    // Use type guards for better type safety
    if (isTranslationObject(translatable)) {
        if (t) {
            return t(translatable.key, translatable.params);
        }
        return translatable.key;
    }

    if (isInlineTranslation(translatable)) {
        // Always fall back to English if the requested language is not available
        return translatable[language] || translatable.en;
    }

    // Fallback for unexpected cases
    return '';
}


/**
 * Determines an appropriate emoji for a game item based on its name and category.
 * It uses a mapping of keywords to emojis for specific matches and falls back to
 * a category-based map for more general cases.
 *
 * @param {string} name - The name of the item.
 * @param {string} category - The category of the item (e.g., 'Weapon', 'Food').
 * @returns {string} A string containing a single emoji.
 * @example
 * getEmojiForItem("Healing Potion", "Support"); // "🧪"
 * getEmojiForItem("Iron Sword", "Weapon"); // "⚔️"
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

/**
 * Resolve a canonical item id from a translatable name or string.
 *
 * This helper prefers explicit record keys (when `itemDefs` is provided).
 * It will fall back to matching English translations to preserve backward
 * compatibility during migration. Callers should prefer using `id` fields
 * on items when available.
 *
 * @param itemOrName - TranslatableString or string representing the item
 * @param itemDefs - Optional record of item definitions keyed by id
 * @param t - Optional translation function used for key-based lookups
 * @param language - Optional language to use for translation fallbacks (defaults to 'en')
 * @returns The resolved canonical id if found, otherwise undefined
 */
export function resolveItemId(
    itemOrName: TranslatableString | string | undefined | null,
    itemDefs?: Record<string, any>,
    t?: (k: string, opts?: any) => string,
    language: Language = 'en'
): string | undefined {
    if (!itemOrName) return undefined;

    // If given a string and it's directly a key in itemDefs, return it
    if (typeof itemOrName === 'string') {
        if (itemDefs && itemDefs[itemOrName]) return itemOrName;
        // Try to match by definition id or English name
        if (itemDefs) {
            for (const [key, def] of Object.entries(itemDefs)) {
                if (def?.id && def.id === itemOrName) return def.id;
                try {
                    // Match against English and Vietnamese names to support localized
                    // inventory entries that may already be translated.
                    const defNameEn = getTranslatedText(def.name, 'en', t as any);
                    const defNameVi = getTranslatedText(def.name, 'vi', t as any);
                    if (defNameEn === itemOrName || defNameVi === itemOrName) return def.id ?? key;
                } catch (e) {
                    // ignore malformed defs
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
            } catch (e) {
                // ignore and continue
            }
        }
    }

    return undefined;
}

/**
 * Ensure a PlayerItem-like object has a canonical id field filled in.
 * If the item already has an `id` we leave it. Otherwise we try to resolve
 * a canonical id from the item's name using `resolveItemId`. If resolution
 * fails we fall back to the English translation string as a best-effort id.
 *
 * This is safe to call before inserting items into `playerStats.items` so
 * game logic can always rely on the presence of an `id` for deterministic
 * lookups.
 */
export function ensurePlayerItemId<T extends { name?: any; id?: string }>(
    item: T,
    itemDefs?: Record<string, any>,
    t?: (k: string, opts?: any) => string,
    language: Language = 'en'
): T {
    if (!item) return item;
    if (item.id) return item;
    try {
        const resolved = resolveItemId(item.name, itemDefs, t, language) ?? getTranslatedText(item.name as any, 'en', t as any);
        if (resolved) item.id = resolved as any;
    } catch (e) {
        // ignore errors and leave item as-is
    }
    return item;
}

/**
 * Converts an array of GeneratedItem (ItemDefinition) to a Record<string, ItemDefinition>.
 * Uses the English name of the item as the key for the record.
 * @param items - Array of GeneratedItem objects
 * @returns Record<string, ItemDefinition> where keys are English item names
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

/**
 * Intelligently joins an array of sentences into a single narrative string.
 * It adds appropriate connectors based on the desired narrative length and cleans up punctuation.
 * @param {string[]} sentences - An array of sentences to join.
 * @param {NarrativeLength} narrativeLength - The desired length, which influences the choice of connectors.
 * @returns {string} A single, grammatically coherent narrative string.
 * @example
 * const sentences = ["It's getting dark.", "You should find shelter."];
 * SmartJoinSentences(sentences, 'medium'); // "It's getting dark. Suddenly, you should find shelter."
 */
export const SmartJoinSentences = (sentences: string[], narrativeLength: NarrativeLength, language: 'vi' | 'en' = 'vi'): string => {
    if (!sentences || sentences.length === 0) return "";
    if (sentences.length === 1) return sentences[0];

    let result = sentences[0].trim();

    for (let i = 1; i < sentences.length; i++) {
        const currentSentence = sentences[i].trim();
        if (!currentSentence) continue;

        // Xóa dấu câu cuối câu trước đó để nối mượt hơn
        const lastCharOfPrev = result[result.length - 1];
        if (lastCharOfPrev === '.' || lastCharOfPrev === ',' || lastCharOfPrev === '!' || lastCharOfPrev === '?') {
            result = result.slice(0, -1);
        }

        let connector = "";
        // Choose connectors based on language so English narratives are assembled correctly.
        if (language === 'vi') {
            switch (narrativeLength) {
                case "short":
                    connector = " và "; // Ít từ nối, đơn giản
                    break;
                case "medium":
                    connector = [" và ", ". Bỗng nhiên, ", ". Ngoài ra, ", "."][Math.floor(Math.random() * 4)];
                    break;
                case "long":
                case "detailed":
                    connector = [
                        ", thêm vào đó ", ". Hơn thế nữa, ", ". Không chỉ vậy, ", ". Đáng chú ý là, ",
                        ". Trong khi đó, ", ". Tuy nhiên, "
                    ][Math.floor(Math.random() * 6)];
                    break;
                default:
                    connector = ". ";
                    break;
            }
        } else {
            // English connectors
            switch (narrativeLength) {
                case "short":
                    connector = " and ";
                    break;
                case "medium":
                    connector = [" and ", ". Suddenly, ", ". Additionally, ", "."][Math.floor(Math.random() * 4)];
                    break;
                case "long":
                case "detailed":
                    connector = [
                        ", moreover, ", ". Furthermore, ", ". Not only that, ", ". Notably, ",
                        ". Meanwhile, ", ". However, "
                    ][Math.floor(Math.random() * 6)];
                    break;
                default:
                    connector = ". ";
                    break;
            }
        }

        // Đảm bảo có khoảng trắng sau dấu câu nếu nối
        if (result.length > 0 && ['.', '!', '?'].includes(result[result.length - 1]) && !connector.startsWith(' ')) {
            result += ' ';
        }
        // Nếu câu hiện tại bắt đầu bằng dấu câu hoặc từ nối đã có dấu câu, chỉ thêm khoảng trắng
        if (currentSentence.startsWith('.') || currentSentence.startsWith(',') || currentSentence.startsWith('!') || currentSentence.startsWith('?')) {
             result += ' ';
        } else {
            result += connector;
        }

        result += currentSentence;
    }

    // Dọn dẹp cuối cùng
    result = result.replace(/\s{2,}/g, ' ').trim(); // Xóa khoảng trắng thừa
    result = result.replace(/\s+([.,!?;:])/g, '$1'); // Xóa khoảng trắng trước dấu câu
    result = result.replace(/([.,!?;:]){2,}/g, '$1'); // Xóa dấu câu lặp (ví dụ: ".." thành ".")
    result = result.replace(/([.,])([A-Z])/g, '$1 $2'); // Đảm bảo có khoảng trắng sau dấu chấm/phẩy nếu theo sau là chữ hoa

    // Đảm bảo câu kết thúc bằng dấu chấm (nếu có nội dung và chưa kết thúc bằng dấu câu)
    if (result.length > 0 && !result.endsWith('.') && !result.endsWith('!') && !result.endsWith('?')) {
        result += '.';
    }

    return result;
};
