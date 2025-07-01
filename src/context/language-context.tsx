'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { translations, Language, TranslationKey } from '@/lib/i18n';

// A type for our t function to handle replacements
type TFunction = (key: TranslationKey, replacements?: { [key: string]: string | number }) => string;

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: TFunction;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // Default to 'vi' on server, will be corrected by useEffect on client.
  // This prevents hydration mismatches.
  const [language, setLanguageState] = useState<Language>('vi');

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
    // Fallback to English if translation is missing in the current language
    let translation = (translations[language] as any)[key] || (translations.en as any)[key] || key;
    
    // Handle nested keys for custom action responses
    if (typeof translation !== 'string') {
        if (replacements && replacements.subKey && typeof translation === 'object') {
            translation = translation[replacements.subKey as any] || key;
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
