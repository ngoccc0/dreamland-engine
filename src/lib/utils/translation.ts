/**
 * Translation & Localization Utilities
 *
 * @remarks
 * Provides functions for handling multilingual text in the game.
 * Supports both translation keys (i18n strings) and inline translations
 * (objects with 'en' and 'vi' properties).
 */

import type { Language } from '@/lib/game/types';
import type { TranslationKey } from '@/lib/i18n';
import type { TranslatableString } from '@/core/types/i18n';
import { isTranslationObject, isInlineTranslation } from '@/core/types/i18n';

/**
 * Get translated text with support for multiple formats
 *
 * @remarks
 * Handles both translation keys (strings that resolve via i18n)
 * and inline translations (objects with language-specific text).
 *
 * Always falls back to English if requested language is unavailable.
 *
 * @param translatable - String (translation key) or multilingual object
 * @param language - Target language code ('en', 'vi', etc.)
 * @param t - Optional translation function for key-based lookups
 * @returns Translated string, or empty string if input is null/undefined
 *
 * @example
 * // Inline translation
 * getTranslatedText({ en: "Hello", vi: "Xin chào" }, "vi");
 * // → "Xin chào"
 *
 * // Translation key (requires i18n function)
 * getTranslatedText("menu_start", "en", i18nFunction);
 * // → "Start Game"
 */
export function getTranslatedText(
    translatable: TranslatableString | undefined | null,
    language: Language,
    t?: (key: TranslationKey, options?: any) => string
): string {
    if (!translatable) return '';

    // Handle direct translation keys (strings)
    if (typeof translatable === 'string') {
        if (t) {
            return t(translatable);
        }
        return translatable;
    }

    // Handle translation objects with key + params
    if (isTranslationObject(translatable)) {
        if (t) {
            return t(translatable.key, translatable.params);
        }
        return translatable.key;
    }

    // Handle inline translations (direct language object)
    if (isInlineTranslation(translatable)) {
        // Fallback to English if requested language unavailable
        return translatable[language] || translatable.en;
    }

    // Fallback for unexpected cases
    return '';
}
