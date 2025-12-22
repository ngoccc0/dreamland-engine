/**
 * @file src/hooks/use-responsive-layout.ts
 * @description Hook for responsive layout detection (mobile/desktop/landscape)
 * 
 * @remarks
 * Detects device layout and screen size to determine UI presentation.
 * Handles window resize and orientation change events.
 * 
 * Returns:
 * - isDesktop: true if width >= 1024 OR landscape mode (width > height && width > 480)
 */

import { useState, useEffect } from 'react';

interface ResponsiveLayoutState {
  isDesktop: boolean;
  isLandscape: boolean;
  windowWidth: number;
  windowHeight: number;
}

/**
 * Hook for responsive layout detection
 * 
 * @remarks
 * Automatically updates when window resizes or orientation changes
 * 
 * @returns ResponsiveLayoutState with layout information
 * 
 * @example
 * ```tsx
 * const { isDesktop, isLandscape } = useResponsiveLayout();
 * return isDesktop ? <DesktopLayout /> : <MobileLayout />;
 * ```
 */
export function useResponsiveLayout(): ResponsiveLayoutState {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const [windowHeight, setWindowHeight] = useState(0);

  useEffect(() => {
    const handleLayoutChange = () => {
      if (typeof window === 'undefined') return;

      const width = window.innerWidth;
      const height = window.innerHeight;

      setWindowWidth(width);
      setWindowHeight(height);

      // Landscape: width > height AND width > 480px
      const landscape = width > height && width > 480;
      setIsLandscape(landscape);

      // Desktop: width >= 1024 OR landscape mode
      const desktop = width >= 1024 || landscape;
      setIsDesktop(desktop);
    };

    handleLayoutChange();

    window.addEventListener('resize', handleLayoutChange);
    window.addEventListener('orientationchange', handleLayoutChange);

    return () => {
      window.removeEventListener('resize', handleLayoutChange);
      window.removeEventListener('orientationchange', handleLayoutChange);
    };
  }, []);

  return {
    isDesktop,
    isLandscape,
    windowWidth,
    windowHeight,
  };
}

export default useResponsiveLayout;
