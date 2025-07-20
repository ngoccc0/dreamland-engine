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
 * A string that can be translated. Either a direct key or an object with a key and params.
 */
export type TranslatableString = string | TranslationObject;

// Re-export language enum from lib/i18n
export { LanguageEnum, type Language } from '../../lib/i18n';
