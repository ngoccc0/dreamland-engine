
'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import type { GameSettings, FontFamily, FontSize, Theme, ModBundle } from '@/lib/game/types';

interface SettingsContextType {
  settings: GameSettings;
  setSettings: (settings: Partial<GameSettings>) => void;
  applyMods: (modCode: string) => void;
  clearMods: () => void;
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
  mods: null,
  controlsPreventScroll: true,
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettingsState] = useState<GameSettings>(defaultSettings);

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('gameSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);

        // --- VALIDATION START ---
        const validThemes: Theme[] = ['light', 'dark'];
        if (!validThemes.includes(parsed.theme)) parsed.theme = defaultSettings.theme;
        
        const validFonts: FontFamily[] = ['literata', 'inter', 'source_code_pro'];
        if (!validFonts.includes(parsed.fontFamily)) parsed.fontFamily = defaultSettings.fontFamily;
        
        const validFontSizes: FontSize[] = ['sm', 'base', 'lg'];
        if (!validFontSizes.includes(parsed.fontSize)) parsed.fontSize = defaultSettings.fontSize;
        
        // Also load mods from localStorage
        const savedMods = localStorage.getItem('gameMods');
        if (savedMods) {
          try {
            parsed.mods = JSON.parse(savedMods);
          } catch {
            parsed.mods = null;
          }
        }
        // --- VALIDATION END ---
  // Ensure controlsPreventScroll is a boolean (backwards compatibility)
  if (typeof parsed.controlsPreventScroll !== 'boolean') parsed.controlsPreventScroll = defaultSettings.controlsPreventScroll;

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
        const { mods, ...settingsToSave } = updatedSettings;
        localStorage.setItem('gameSettings', JSON.stringify(settingsToSave));
      } catch (error) {
        console.error("Failed to save game settings to localStorage", error);
      }
      return updatedSettings;
    });
  }, []);

  const applyMods = useCallback((modCode: string) => {
    try {
        const parsedMods: ModBundle = JSON.parse(modCode);
        // Basic validation
        if (typeof parsedMods !== 'object' || !parsedMods.id) {
            throw new Error("Invalid mod format: must be an object with an 'id' property.");
        }
        localStorage.setItem('gameMods', modCode);
        setSettings({ mods: parsedMods });
    } catch (error) {
        console.error("Failed to apply mods:", error);
        alert(`Error applying mods: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [setSettings]);

  const clearMods = useCallback(() => {
    localStorage.removeItem('gameMods');
    setSettings({ mods: null });
  }, [setSettings]);

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
    <SettingsContext.Provider value={{ settings, setSettings, applyMods, clearMods }}>
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
