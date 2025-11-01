
'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { translations, Language, TranslationKey } from '@/lib/i18n';
import type { TranslatableString } from '@/lib/game/types';
import { logger } from '@/lib/logger';

// A type for our t function to handle replacements
type TFunction = (key: TranslationKey | TranslatableString, replacements?: { [key: string]: string | number }) => string;

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
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

  const setLanguage = (lang: Language) => {
    localStorage.setItem('gameLanguage', lang);
    setLanguageState(lang);
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

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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
