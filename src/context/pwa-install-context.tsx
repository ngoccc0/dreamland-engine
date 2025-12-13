
'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface PwaInstallContextType {
  installPrompt: any | null;
  setInstallPrompt: (prompt: any | null) => void;
}

const PwaInstallContext = createContext<PwaInstallContextType | undefined>(undefined);

export const PwaInstallProvider = ({ children }: { children: ReactNode }) => {
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return (
    <PwaInstallContext.Provider value={{ installPrompt, setInstallPrompt }}>
      {children}
    </PwaInstallContext.Provider>
  );
};

/**
 * PWA install context hook - provides app installation prompts.
 *
 * @remarks
 * Manages PWA (Progressive Web App) installation for mobile/desktop.
 * Captures 'beforeinstallprompt' event and exposes it for custom install UI.
 * Allows triggering native install dialog from game menu.
 *
 * **Installation Flow:**
 * 1. Browser fires 'beforeinstallprompt' event (mobile Chrome, Edge, etc)
 * 2. Event is captured and stored in context
 * 3. App can show custom install button
 * 4. User clicks button → installPrompt.prompt() triggers install dialog
 *
 * **Supported Platforms:**
 * - Chrome/Edge on Android: Full PWA install
 * - iOS Safari: Shows "Add to Home Screen" instructions
 * - Desktop Chrome: Shows install prompt
 * - Firefox: May support installation
 *
 * **UI Strategy:**
 * Don't show install button automatically. Provide menu option
 * so users can install if they choose (non-intrusive).
 *
 * @returns Object with { installPrompt, setInstallPrompt }
 * @throws Error if hook used outside PwaInstallProvider
 *
 * @example
 * function MenuButton() {
 *   const { installPrompt } = usePwaInstall();
 *   
 *   const handleInstall = async () => {
 *     if (installPrompt) {
 *       installPrompt.prompt();
 *       const { outcome } = await installPrompt.userChoice;
 *       if (outcome === 'accepted') {
 *         console.log('User accepted installation');
 *       }
 *     }
 *   };
 *   
 *   return installPrompt ? (
 *     <button onClick={handleInstall}>Install Game</button>
 *   ) : null;
 * }
 */
export const usePwaInstall = () => {
  const context = useContext(PwaInstallContext);
  if (context === undefined) {
    throw new Error('usePwaInstall must be used within a PwaInstallProvider');
  }
  return context;
};
