
'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import { translations, Language, TranslationKey } from '@/lib/i18n';
import type { TranslatableString } from '@/lib/game/types';


// A type for our t function to handle replacements
type TFunction = (key: TranslationKey | TranslatableString, replacements?: { [key: string]: string | number }) => string;

interface LanguageContextType {
  language: Language;
  // Optionally accept a currentBiome so the purge can preserve bundles for the current biome.
  setLanguage: (language: Language, currentBiome?: string) => void;
  t: TFunction;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // Default to 'en' on server, will be corrected by useEffect on client.
  // This prevents hydration mismatches.
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // On mount, check localStorage for a saved language preference.
    const savedLanguage = localStorage.getItem('gameLanguage') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'vi')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language, currentBiome?: string) => {
    localStorage.setItem('gameLanguage', lang);
    setLanguageState(lang);

    // Lazy-clear precomputed bundles for other locales to free cache and avoid keeping
    // unused language bundles in memory. We'll perform this asynchronously so it
    // doesn't block rendering. Also attempt to prefetch a small 'default' bundle
    // for the newly selected language.
    (async () => {
      try {
        // lazy-require to avoid adding IndexedDB code to server bundles

        const cache = require('@/lib/narrative/cache').default as { keys: () => Promise<string[]>; del: (k: string) => Promise<boolean> };
        const loader = require('@/lib/narrative/loader') as any;
        const keys = await cache.keys();
        for (const k of keys) {
          // our cache keys are in the shape 'nl_precomputed_v1:biome:locale'
          const parts = k.split(':');
          const localePart = parts[parts.length - 1];
          const biomePart = parts.length >= 3 ? parts[parts.length - 2] : undefined;
          // Delete if the key is for a different locale AND not for the current biome (if provided).
          if (localePart && localePart !== lang && biomePart !== currentBiome) {
            await cache.del(k);
          }
        }
        // warm a default bundle for the language; non-blocking
        try {
          loader.loadPrecomputedBundle('default', lang).catch(() => { });
        } catch {
          // ignore
        }
      } catch {
        // ignore any cache errors
      }
    })();
  };

  const t: TFunction = (key, replacements) => {
    // If key is an object-shaped TranslatableString, return the matching language variant.
    if (typeof key !== 'string') {
      if (key && typeof key === 'object' && 'en' in key && 'vi' in key) {
        return (key as any)[language] || (key as any)['en'] || '';
      }
      // Unknown object shape -> coerce to string to satisfy callers that expect a string
      return String(key);
    }

    // At this point TS knows `key` is a string (TranslationKey)
    const k = key as TranslationKey;
    const primaryTranslation = (translations[language] as any)[k];
    const fallbackTranslation = (translations.en as any)[k];
    const translationPool = primaryTranslation || fallbackTranslation;

    if (process.env.NODE_ENV === 'development') {
      if (!translationPool || translationPool === k) {
        console.warn(`[TRANSLATION_DEBUG] Key not found in any language: '${k}'`);
      }
    }

    let translation: string = '';
    if (Array.isArray(translationPool)) {
      translation = translationPool[Math.floor(Math.random() * translationPool.length)];
    } else if (typeof translationPool === 'string') {
      translation = translationPool;
    } else if (translationPool && typeof translationPool === 'object' && replacements && replacements.subKey) {
      translation = (translationPool as any)[replacements.subKey] || '';
    } else {
      translation = k;
    }

    if (replacements) {
      Object.entries(replacements).forEach(([replaceKey, value]) => {
        translation = translation.replace(`{${replaceKey}}`, String(value));
      });
    }

    return translation;
  };

  // Memoize context value to prevent consumer re-renders when only other state changes
  const contextValue = useMemo(() => ({ language, setLanguage, t }), [language]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
