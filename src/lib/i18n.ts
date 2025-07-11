// src/lib/i18n.ts

import { commonTranslations } from './locales/common';
import { errorTranslations } from './locales/errors';
import { exampleTranslations } from './locales/examples';
import { gameplayTranslations } from './locales/gameplay';
import { itemTranslations } from './locales/items';
import { uiTranslations } from './locales/ui';
import { premadeWorldTranslations } from './locales/premade-worlds';
import { recipeTranslations } from './locales/recipes';
import { creatureTranslations } from './locales/creatures';
import { structureTranslations } from './locales/structures';
import { weatherTranslations } from './locales/weather';
import { eventTranslations } from './locales/events';
import { skillTranslations } from './locales/skills';
import { narrativeTranslations } from './locales/narrative';

// Helper function to merge nested objects
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
  translations_en = mergeDeep(translations_en, module.en);
  translations_vi = mergeDeep(translations_vi, module.vi);
});

export const translations = {
  en: translations_en,
  vi: translations_vi,
};

export type Language = keyof typeof translations;
// This creates a union of all possible keys from both languages, ensuring type safety.
// By using a union (|) instead of an intersection (&), a key is valid if it exists in AT LEAST ONE language file.
export type TranslationKey = keyof (typeof translations)['en'] | keyof (typeof translations)['vi'];
