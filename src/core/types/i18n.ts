/**
 * Core translation types.
 * @module i18n
 */

export interface TranslationMap {
    [key: string]: string | number | TranslationMap;
}

export interface I18nDictionary {
    en: TranslationMap;
    vi: TranslationMap;
}

/**
 * A translation key that can include variables to be interpolated.
 * E.g., { key: 'items.sword.name', params: { type: 'iron' } }
 */
export interface TranslationObject {
    key: string;
    params?: { [key: string]: string | number };
}

/**
 * Inline translation object, e.g. { en: 'Sword', vi: 'Kiếm' }
 */
export interface InlineTranslation {
    en: string;  // Made required for type safety
    vi?: string; // Optional but will fallback to English
}

/**
 * Type guards for translation types
 */
export const isTranslationObject = (value: unknown): value is TranslationObject => {
    return typeof value === 'object' && value !== null && 'key' in value;
};

export const isInlineTranslation = (value: unknown): value is InlineTranslation => {
    return typeof value === 'object' && value !== null &&
        'en' in value && typeof (value as any).en === 'string';
};

/**
 * A string that can be translated. Can be:
 * - a direct key (string)
 * - an object with a key and params
 * - an inline translation object (e.g. { en: 'Sword', vi: 'Kiếm' })
 */
export type TranslatableString = string | TranslationObject | InlineTranslation;

// Re-export language enum from lib/i18n
export { LanguageEnum, type Language } from '@/lib/i18n';
