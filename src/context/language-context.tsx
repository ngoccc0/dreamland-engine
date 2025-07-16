
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
    // --- NEW: Handle TranslatableString objects directly ---
    if (typeof key === 'object' && key !== null && 'en' in key && 'vi' in key) {
        return key[language] || key['en'] || '';
    }

    // Fallback to English if translation is missing in the current language
    const primaryTranslation = (translations[language] as any)[key];
    const fallbackTranslation = (translations.en as any)[key];
    const translationPool = primaryTranslation || fallbackTranslation;

    if (process.env.NODE_ENV === 'development') {
        if (!translationPool || translationPool === key) {
             console.warn(`[TRANSLATION_DEBUG] Key not found in any language: '${key}'`);
        }
    }
    
    let translation: string;
    if (Array.isArray(translationPool)) {
        translation = translationPool[Math.floor(Math.random() * translationPool.length)];
    } else {
        translation = translationPool || key;
    }
    
    // Handle nested keys for custom action responses
    if (typeof translation !== 'string') {
        if (replacements && replacements.subKey && typeof translation === 'object') {
            translation = (translation as any)[replacements.subKey as any] || key;
        } else {
            return key; // or a default error string
        }
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
