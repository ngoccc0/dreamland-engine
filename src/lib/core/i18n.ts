// TranslationKey is declared below in this module.
/**
 * Internationalization (i18n) setup for the application.
 * This file aggregates all translation strings from modular locale files
 * (e.g., `common.ts`, `items.ts`, `ui.ts`) and combines them into a single `translations`
 * object. It provides a structured way to manage multilingual content for both English and Vietnamese.
 */

import { commonTranslations } from '../locales/common';
import { errorTranslations } from '../locales/errors';
import { exampleTranslations } from '../locales/examples';
import { gameplayTranslations } from '../locales/gameplay';
import { itemTranslations } from '../locales/items';
import { uiTranslations } from '../locales/ui';
import { premadeWorldTranslations } from '../locales/premade-worlds';
import { recipeTranslations } from '../locales/recipes';
import { creatureTranslations } from '../locales/creatures';
import { structureTranslations } from '../locales/structures';
import { weatherTranslations } from '../locales/weather';
import { eventTranslations } from '../locales/events';
import { skillTranslations } from '../locales/skills';
import { narrativeTranslations } from '../locales/narrative';
import type { TranslatableString } from '@/core/types/definitions/base'; // Import TranslatableString

/**
 * Helper function to recursively merge nested objects.
 * This is used to combine translation modules into a single object per language.
 * @param {any} target - The target object to merge into.
 * @param {any} source - The source object to merge from.
 * @returns {any} The merged object.
 */
const mergeDeep = (target: any, source: any) => {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
};

/**
 * Checks if an item is a non-array object.
 * @param {any} item - The item to check.
 * @returns {boolean} True if the item is an object, false otherwise.
 */
const isObject = (item: any) => {
  return (item && typeof item === 'object' && !Array.isArray(item));
};

const modules = [
  commonTranslations,
  errorTranslations,
  exampleTranslations,
  gameplayTranslations,
  itemTranslations,
  uiTranslations,
  premadeWorldTranslations,
  recipeTranslations,
  creatureTranslations,
  structureTranslations,
  weatherTranslations,
  eventTranslations,
  skillTranslations,
  narrativeTranslations,
];

let translations_en = {};
let translations_vi = {};

modules.forEach(module => {
  // Some translation modules may only expose a subset of languages.
  // Guard access to `en`/`vi` to keep TypeScript happy and avoid runtime errors.
  if (module && 'en' in module) {
    translations_en = mergeDeep(translations_en, (module as any).en);
  }
  if (module && 'vi' in module) {
    translations_vi = mergeDeep(translations_vi, (module as any).vi);
  } else if (module && 'en' in module) {
    // If a module doesn't provide Vietnamese translations yet, fall back to
    // using the English keys as a placeholder in `vi`. This keeps the
    // translation shape consistent and avoids missing-key errors at runtime.
    translations_vi = mergeDeep(translations_vi, (module as any).en);
  }
});

/**
 * The master object containing all translations, organized by language.
 * @type {{ en: any; vi: any; }}
 */
export const translations = {
  en: translations_en,
  vi: translations_vi,
};

/**
 * @typedef {'en' | 'vi'} Language
 * Defines the supported languages for the application.
 */
export const LanguageEnum = {
  en: 'en',
  vi: 'vi'
} as const;

export type Language = typeof LanguageEnum[keyof typeof LanguageEnum];

/**
 * @typedef {string} TranslationKey
 * A type alias for a string, representing a key in the translation files.
 * This simplifies type definitions and makes it clear when a string is intended for translation.
 */
export type TranslationKey = string; // This type is still useful for simple string keys

/**
 * Retrieves a translated string based on the current language.
 * If the input is a TranslationKey (string), it looks up the translation in the
 * global `translations` object. If the input is a TranslatableString (object with 'en'/'vi' properties),
 * it returns the string for the specified language.
 *
 * @param {TranslatableString | string | undefined | null} text - The text to translate. Can be a translation key (string) or an object with 'en' and 'vi' properties.
 * @param {Language} lang - The target language ('en' or 'vi'). Defaults to 'en' if not provided or invalid.
 * @returns {string} The translated string or the original key if not found.
 */
export function getTranslatedText(
  text: TranslatableString | string | undefined | null,
  lang: Language = 'en'
): string {
  if (text === undefined || text === null) {
    return '';
  }

  // If text is an object with 'en' and 'vi' properties
  if (typeof text === 'object' && text !== null && 'en' in text && 'vi' in text) {
    return (text as { en: string; vi: string })[lang] || (text as { en: string; vi: string })['en'];
  }

  // If text is a string (translation key)
  if (typeof text === 'string') {
    // Attempt to find the translation in the global translations object
    let currentTranslations = (translations as any)[lang];
    let translated = text.split('.').reduce((o, i) => (o ? o[i] : undefined), currentTranslations);

    if (translated === undefined || translated === null || typeof translated !== 'string') {
      // Fallback to English if translation not found for the requested language
      currentTranslations = (translations as any)['en'];
      translated = text.split('.').reduce((o, i) => (o ? o[i] : undefined), currentTranslations);
    }

    if (translated === undefined || translated === null || typeof translated !== 'string') {
      // If still not found, return the original key as a fallback
      return text;
    }
    return translated;
  }

  // Fallback for any other unexpected type
  return String(text);
}
