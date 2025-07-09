
'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import type { GameSettings } from '@/lib/game/types';

interface SettingsContextType {
  settings: GameSettings;
  setSettings: (settings: Partial<GameSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const defaultSettings: GameSettings = {
  gameMode: 'ai',
  diceType: 'd20',
  aiModel: 'balanced',
  narrativeLength: 'medium',
  fontFamily: 'literata',
  fontSize: 'base',
  theme: 'dark',
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettingsState] = useState<GameSettings>(defaultSettings);

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('gameSettings');
      if (savedSettings) {
        // Merge saved settings with defaults to ensure all keys are present after updates
        const parsed = JSON.parse(savedSettings);
        setSettingsState(prev => ({...defaultSettings, ...parsed}));
      }
    } catch (error) {
      console.error("Failed to load game settings from localStorage", error);
    }
  }, []);

  const setSettings = useCallback((newSettings: Partial<GameSettings>) => {
    setSettingsState(prevSettings => {
      const updatedSettings = { ...prevSettings, ...newSettings };
      try {
        localStorage.setItem('gameSettings', JSON.stringify(updatedSettings));
      } catch (error) {
        console.error("Failed to save game settings to localStorage", error);
      }
      return updatedSettings;
    });
  }, []);

  // Effect to apply theme and font settings to the document
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      const body = document.body;

      // Theme
      root.classList.remove('light', 'dark');
      root.classList.add(settings.theme);

      // Font Family
      body.classList.remove('font-literata', 'font-inter', 'font-source-code-pro');
      body.classList.add(`font-${settings.fontFamily.replace(/_/g, '-')}`);

      // Font Size
      body.classList.remove('text-sm', 'text-base', 'text-lg');
      body.classList.add(`text-${settings.fontSize}`);
    }
  }, [settings.theme, settings.fontFamily, settings.fontSize]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
