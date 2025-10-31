
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
 * Intelligently joins an array of sentences into a single narrative string.
 * It adds appropriate connectors based on the desired narrative length and cleans up punctuation.
 * @param {string[]} sentences - An array of sentences to join.
 * @param {NarrativeLength} narrativeLength - The desired length, which influences the choice of connectors.
 * @returns {string} A single, grammatically coherent narrative string.
 * @example
 * const sentences = ["It's getting dark.", "You should find shelter."];
 * SmartJoinSentences(sentences, 'medium'); // "It's getting dark. Suddenly, you should find shelter."
 */
export const SmartJoinSentences = (sentences: string[], narrativeLength: NarrativeLength): string => {
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
        switch (narrativeLength) {
            case "short":
                connector = " và "; // Ít từ nối, đơn giản
                break;
            case "medium":
                const mediumConnectors = [" và ", ". Bỗng nhiên, ", ". Ngoài ra, ", "."];
                connector = mediumConnectors[Math.floor(Math.random() * mediumConnectors.length)];
                break;
            case "long":
            case "detailed":
                const longConnectors = [
                    ", thêm vào đó ", ". Hơn thế nữa, ", ". Không chỉ vậy, ", ". Đáng chú ý là, ",
                    ". Trong khi đó, ", ". Tuy nhiên, "
                ];
                connector = longConnectors[Math.floor(Math.random() * longConnectors.length)];
                break;
            default:
                connector = ". ";
                break;
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
