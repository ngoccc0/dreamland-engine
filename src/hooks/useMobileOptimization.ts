/**
 * Mobile Optimization Hook
 *
 * OVERVIEW: useMobileOptimization provides adaptive animation and rendering configuration
 * for mobile devices, ensuring smooth performance while maintaining visual quality.
 *
 * Detects:
 * - Mobile viewport (window.innerWidth < 768px or touch capability)
 * - Network quality (via navigator.connection or estimated)
 * - Device memory (via navigator.deviceMemory)
 * - Reduced motion preference (prefers-reduced-motion)
 *
 * Provides:
 * - Optimized animation timing (300ms/word on mobile vs 150ms on desktop)
 * - Animation type adjustments (fade-in for low-bandwidth)
 * - Responsive font scaling (sm → md on mobile)
 * - Reduced emphasis complexity
 *
 * Usage:
 * ```tsx
 * const { isMobile, animationSpeed, animationType, fontSize } = useMobileOptimization();
 * ```
 */

import { useState, useEffect, useMemo } from 'react';

export interface MobileOptimizationConfig {
    /** True if device is mobile (viewport < 768px or touch-capable) */
    isMobile: boolean;

    /** Animation speed multiplier (1.0 on desktop, 0.5-0.8 on mobile) */
    animationSpeedMultiplier: number;

    /** Delay per word in milliseconds (60 on desktop, 300 on mobile) */
    delayPerWord: number;

    /** Recommended animation type (typing on desktop, fadeIn on mobile if network is poor) */
    animationType: 'typing' | 'fadeIn' | 'typing-mobile';

    /** Font size class for responsive design (text-base on desktop, text-sm on mobile) */
    fontSize: string;

    /** Padding class for responsive design (p-6 on desktop, p-3 on mobile) */
    padding: string;

    /** Maximum viewport height for narrative panel (full on desktop, 50dvh on mobile) */
    maxHeight: string;

    /** Whether user prefers reduced motion */
    prefersReducedMotion: boolean;

    /** Estimated network quality (4g, 3g, 2g, unknown) */
    networkQuality: 'unknown' | '4g' | '3g' | '2g';

    /** Device memory in GB (if available) */
    deviceMemory: number | null;
}

/**
 * Hook to get mobile-optimized animation and UI configuration
 *
 * @returns MobileOptimizationConfig with adaptive settings
 */
export function useMobileOptimization(): MobileOptimizationConfig {
    const [config, setConfig] = useState<MobileOptimizationConfig>({
        isMobile: false,
        animationSpeedMultiplier: 1.0,
        delayPerWord: 150,
        animationType: 'typing',
        fontSize: 'text-base',
        padding: 'p-6',
        maxHeight: 'full',
        prefersReducedMotion: false,
        networkQuality: 'unknown',
        deviceMemory: null
    });

    // Update configuration on mount and window resize
    useEffect(() => {
        const updateConfig = () => {
            // 1. Detect mobile viewport
            const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
            const isMobileViewport = viewportWidth < 768;
            const isTouchCapable = typeof window !== 'undefined' &&
                ('ontouchstart' in window || navigator.maxTouchPoints > 0);
            const isMobile = isMobileViewport || isTouchCapable;

            // 2. Check for reduced motion preference
            const prefersReducedMotion = typeof window !== 'undefined' &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            // 3. Detect network quality
            let networkQuality: 'unknown' | '4g' | '3g' | '2g' = 'unknown';
            if (typeof navigator !== 'undefined') {
                // @ts-ignore - experimental API
                const connection = navigator.connection ||
                    // @ts-ignore - webkit prefix
                    navigator.webkitConnection;
                if (connection) {
                    const effectiveType = connection.effectiveType || 'unknown';
                    networkQuality = effectiveType as '4g' | '3g' | '2g' | 'unknown';
                }
            }

            // 4. Get device memory
            let deviceMemory: number | null = null;
            if (typeof navigator !== 'undefined') {
                // @ts-ignore - experimental API
                deviceMemory = navigator.deviceMemory || null;
            }

            // 5. Calculate animation settings based on device characteristics
            let animationSpeedMultiplier = 1.0;
            let delayPerWord = 150;
            let animationType: 'typing' | 'fadeIn' | 'typing-mobile' = 'typing';

            if (isMobile) {
                // Mobile devices get slower animation (300ms/word)
                delayPerWord = 300;
                animationSpeedMultiplier = 0.5;
                animationType = 'typing-mobile';

                // Low bandwidth → fade-in instead of typing
                if (networkQuality === '2g' || networkQuality === '3g') {
                    animationType = 'fadeIn';
                    delayPerWord = 500; // Slower fade-in
                    animationSpeedMultiplier = 0.4;
                }

                // Low memory devices get even slower animation
                if (deviceMemory && deviceMemory <= 2) {
                    delayPerWord = Math.min(delayPerWord * 1.5, 500);
                    animationSpeedMultiplier = Math.max(animationSpeedMultiplier * 0.8, 0.3);
                }

                // Reduce motion preference
                if (prefersReducedMotion) {
                    animationType = 'fadeIn';
                    delayPerWord = 1000; // Very slow fade-in
                    animationSpeedMultiplier = 0.2;
                }
            } else {
                // Desktop: fast animation (60ms/word = ~17 words/sec, very readable)
                delayPerWord = 60;
                animationSpeedMultiplier = 1.0;
                animationType = 'typing';

                // Even on desktop, respect reduced motion
                if (prefersReducedMotion) {
                    animationType = 'fadeIn';
                    delayPerWord = 800;
                    animationSpeedMultiplier = 0.5;
                }
            }

            // 6. Responsive UI settings
            const fontSize = isMobile ? 'text-sm' : 'text-base';
            const padding = isMobile ? 'p-3' : 'p-6';
            const maxHeight = isMobile ? '50dvh' : 'h-screen';

            setConfig({
                isMobile,
                animationSpeedMultiplier,
                delayPerWord,
                animationType,
                fontSize,
                padding,
                maxHeight,
                prefersReducedMotion,
                networkQuality,
                deviceMemory
            });
        };

        // Update on mount
        updateConfig();

        // Update on resize
        window.addEventListener('resize', updateConfig);

        // Listen for reduced motion changes
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        mediaQuery.addEventListener('change', updateConfig);

        return () => {
            window.removeEventListener('resize', updateConfig);
            mediaQuery.removeEventListener('change', updateConfig);
        };
    }, []);

    return config;
}

/**
 * Detects device network quality for bandwidth optimization.
 *
 * @remarks
 * Checks `navigator.connection.effectiveType` or estimates based on
 * device memory and user agent. Returns effective network type for
 * conditional feature loading (e.g., AI narrative in 4g, text-only in 2g).
 *
 * @returns Network quality: '4g' (best), '3g' (good), '2g' (poor), 'unknown'
 *
 * @example
 * const quality = useNetworkQuality();
 * if (quality === '2g') {
 *   useOfflineNarrative();  // Disable AI on slow networks
 * }
 */
export function useNetworkQuality(): 'unknown' | '4g' | '3g' | '2g' {
    const [quality, setQuality] = useState<'unknown' | '4g' | '3g' | '2g'>('unknown');

    useEffect(() => {
        const detectNetwork = () => {
            if (typeof navigator === 'undefined') return;

            // @ts-ignore - experimental API
            const connection = navigator.connection || navigator.webkitConnection;
            if (connection) {
                const type = connection.effectiveType || 'unknown';
                setQuality(type);

                // Listen for network type changes
                connection.addEventListener('change', () => {
                    const newType = connection.effectiveType || 'unknown';
                    setQuality(newType);
                });
            }
        };

        detectNetwork();
    }, []);

    return quality;
}

/**
 * Detects user's motion reduction preference.
 *
 * @remarks
 * Checks `prefers-reduced-motion` media query to respect accessibility
 * settings. Should disable animations/transitions when true to prevent
 * vestibular disorders and seizure risk.
 *
 * @returns true if user prefers reduced motion (accessibility enabled)
 *
 * @example
 * const prefersReduced = usePrefersReducedMotion();
 * const animationDuration = prefersReduced ? 0 : 300;
 */
export function usePrefersReducedMotion(): boolean {
    const [prefersReduced, setPrefersReduced] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        // Set initial value
        setPrefersReduced(mediaQuery.matches);

        // Listen for changes
        const handler = (e: MediaQueryListEvent) => {
            setPrefersReduced(e.matches);
        };

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    return prefersReduced;
}

/**
 * Gets current responsive design breakpoint.
 *
 * @remarks
 * Returns breakpoint based on viewport width and touch capability.
 * Used to conditionally render layouts or adjust spacing for different
 * screen sizes. Matches Tailwind breakpoints: mobile (< 768px),
 * tablet (768px - 1024px), desktop (> 1024px).
 *
 * @returns Breakpoint category: 'mobile' | 'tablet' | 'desktop'
 *
 * @example
 * const breakpoint = useResponsiveBreakpoint();
 * const gridColumns = breakpoint === 'desktop' ? 3 : breakpoint === 'tablet' ? 2 : 1;
 */
export function useResponsiveBreakpoint(): 'mobile' | 'tablet' | 'desktop' {
    const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

    useEffect(() => {
        const updateBreakpoint = () => {
            if (typeof window === 'undefined') return;

            const width = window.innerWidth;
            if (width < 640) {
                setBreakpoint('mobile');
            } else if (width < 1024) {
                setBreakpoint('tablet');
            } else {
                setBreakpoint('desktop');
            }
        };

        updateBreakpoint();
        window.addEventListener('resize', updateBreakpoint);
        return () => window.removeEventListener('resize', updateBreakpoint);
    }, []);

    return breakpoint;
}

/**
 * Example usage in a narrative component:
 *
 * ```tsx
 * export function GameNarrativePanel() {
 *   const { delayPerWord, animationType, fontSize, padding, maxHeight } = useMobileOptimization();
 *   const { displayedText } = useTypingAnimation(narrative, { delayPerWord });
 *
 *   return (
 *     <div className={`${padding} ${maxHeight} overflow-y-auto`}>
 *       <p className={fontSize}>{displayedText}</p>
 *     </div>
 *   );
 * }
 * ```
 *
 * Example for conditional animation:
 *
 * ```tsx
 * const { animationType } = useMobileOptimization();
 *
 * if (animationType === 'fadeIn') {
 *   // Use fade-in animation (better for low-bandwidth)
 *   return <FadeInNarrative text={narrative} />;
 * } else {
 *   // Use typing animation (default)
 *   return <TypingNarrative text={narrative} />;
 * }
 * ```
 */
