'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import type { GameSettings, FontFamily, FontSize, Theme, ModBundle } from '@/lib/game/types';

interface SettingsContextType {
  settings: GameSettings;
  setSettings: (settings: Partial<GameSettings>) => void;
  applyMods: (modCode: string) => void;
  clearMods: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const defaultSettings = {
  gameMode: 'ai',
  diceType: 'd20',
  aiModel: 'balanced',
  narrativeLength: 'medium',
  fontFamily: 'literata',
  fontSize: 'base',
  theme: 'dark',
  mods: null,
  controlsPreventScroll: true,
  autoPickup: false,
  minimapViewportSize: 5,
  startTime: 360, // 6 AM
  dayDuration: 1440, // 24 hours
  timePerTurn: 15, // 15 minutes per turn (1 day = 96 turns)
  keyBindings: {
    moveUp: ['w', 'ArrowUp'],
    moveDown: ['s', 'ArrowDown'],
    moveLeft: ['a', 'ArrowLeft'],
    moveRight: ['d', 'ArrowRight'],
    attack: [' '],
    openInventory: ['e'],
    openStatus: ['p'],
    openMap: ['m'],
    openCrafting: ['c'],
    customAction: ['/'],
    pickUp: ['Tab'],
    hot1: ['1'],
    hot2: ['2'],
    hot3: ['3'],
    hot4: ['4'],
    hot5: ['5']
  }
} as GameSettings;

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

        // Ensure time settings are numbers
        if (typeof parsed.startTime !== 'number') parsed.startTime = (defaultSettings as any).startTime;
        if (typeof parsed.dayDuration !== 'number') parsed.dayDuration = (defaultSettings as any).dayDuration;
        if (typeof parsed.timePerTurn !== 'number') parsed.timePerTurn = (defaultSettings as any).timePerTurn;

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
        // Ensure autoPickup is a boolean (backwards compatibility)
        if (typeof parsed.autoPickup !== 'boolean') parsed.autoPickup = defaultSettings.autoPickup;

        // Validate minimapViewportSize
        if (![5, 7, 9].includes(parsed.minimapViewportSize)) parsed.minimapViewportSize = defaultSettings.minimapViewportSize;

        // Validate keyBindings shape if present
        if (parsed.keyBindings && typeof parsed.keyBindings === 'object') {
          const kb = parsed.keyBindings;
          const ensureList = (v: any) => (Array.isArray(v) ? v : (typeof v === 'string' ? [v] : undefined));
          parsed.keyBindings = {
            moveUp: ensureList(kb.moveUp) ?? (defaultSettings as any).keyBindings.moveUp,
            moveDown: ensureList(kb.moveDown) ?? (defaultSettings as any).keyBindings.moveDown,
            moveLeft: ensureList(kb.moveLeft) ?? (defaultSettings as any).keyBindings.moveLeft,
            moveRight: ensureList(kb.moveRight) ?? (defaultSettings as any).keyBindings.moveRight,
            attack: ensureList(kb.attack) ?? (defaultSettings as any).keyBindings.attack,
            openInventory: ensureList(kb.openInventory) ?? (defaultSettings as any).keyBindings.openInventory,
            openStatus: ensureList(kb.openStatus) ?? (defaultSettings as any).keyBindings.openStatus,
            openMap: ensureList(kb.openMap) ?? (defaultSettings as any).keyBindings.openMap,
            openCrafting: ensureList(kb.openCrafting) ?? (defaultSettings as any).keyBindings.openCrafting,
            customAction: ensureList(kb.customAction) ?? (defaultSettings as any).keyBindings.customAction,
          };
        }

        setSettingsState(_prev => ({ ...defaultSettings, ...parsed }));
      }
    } catch (error: any) {
      console.error("Failed to load game settings from localStorage", error);
    }
  }, []);

  const setSettings = useCallback((newSettings: Partial<GameSettings>) => {
    setSettingsState(prevSettings => {
      const updatedSettings = { ...prevSettings, ...newSettings };
      try {
        const { mods: _mods, ...settingsToSave } = updatedSettings;
        localStorage.setItem('gameSettings', JSON.stringify(settingsToSave));
      } catch (error: any) {
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
    } catch (error: any) {
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

  // Memoize context value to prevent consumer re-renders when only other state changes
  const contextValue = useMemo(() => ({ settings, setSettings, applyMods, clearMods }), [settings, setSettings, applyMods, clearMods]);

  return (
    <SettingsContext.Provider value={contextValue}>
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
