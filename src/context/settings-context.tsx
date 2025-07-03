
'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import type { GameMode, DiceType, AiModel, NarrativeLength } from '@/lib/game/types';

interface GameSettings {
  gameMode: GameMode;
  diceType: DiceType;
  aiModel: AiModel;
  narrativeLength: NarrativeLength;
}

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
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettingsState] = useState<GameSettings>(defaultSettings);

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('gameSettings');
      if (savedSettings) {
        setSettingsState(JSON.parse(savedSettings));
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
