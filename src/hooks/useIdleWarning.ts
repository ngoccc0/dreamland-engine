/**
 * OVERVIEW
 *
 * Hook for monitoring idle time and displaying warning notifications before the idle progression threshold.
 * When player hasn't interacted for `idleWarningThresholdMs` (default 4 minutes, warning 1 min before 5-min idle),
 * a toast notification is shown to alert them that idle progression will be paused/applied.
 *
 * Listens to user activity (mouse, keyboard, touch) and resets timer on interaction.
 * Automatically cancels on unmount or when pauseGameIdleProgression is enabled.
 *
 * @module useIdleWarning
 */

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import { logger } from '@/lib/logger';

interface UseIdleWarningOptions {
  /** Whether to disable idle progression (pause mode). If true, warning is skipped. */
  pauseGameIdleProgression?: boolean;
  /** Time in milliseconds before warning is shown. Default: 4 * 60_000 (4 minutes) */
  idleWarningThresholdMs?: number;
}

/**
 * Monitors user activity and shows a toast warning when idle threshold is approaching.
 * Resets timer on any user interaction (mouse, keyboard, touch).
 *
 * @param options Configuration for idle warning behavior
 *
 * @example
 * ```tsx
 * function GameComponent() {
 *   const { settings } = useSettings();
 *   useIdleWarning({
 *     pauseGameIdleProgression: settings?.pauseGameIdleProgression,
 *     idleWarningThresholdMs: settings?.idleWarningThresholdMs,
 *   });
 *   return <div>Game...</div>;
 * }
 * ```
 */
export function useIdleWarning(options: UseIdleWarningOptions): void {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { pauseGameIdleProgression, idleWarningThresholdMs = 4 * 60_000 } = options;

  useEffect(() => {
    // Skip if pause is enabled (game time is frozen)
    if (pauseGameIdleProgression) {
      logger.debug('[useIdleWarning] Skipped (pauseGameIdleProgression=true)');
      return;
    }

    let idleTimer: NodeJS.Timeout | null = null;
    let toastShown = false;

    /**
     * Reset idle timer and prepare for next warning.
     * Sets a timeout for idleWarningThresholdMs to show the warning toast.
     */
    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      toastShown = false;

      idleTimer = setTimeout(() => {
        // Only show if app is not hidden (not backgrounded) and not already shown
        if (!toastShown && !document.hidden) {
          toastShown = true;
          toast({
            title: t('idleWarningTitle'),
            description: t('idleWarningDesc'),
            variant: 'default',
          });
          logger.debug('[useIdleWarning] Warning toast shown', { idleWarningThresholdMs });
        }
      }, idleWarningThresholdMs);
    };

    /**
     * Handler for user activity events.
     * Resets the idle timer when player interacts (only if app is not backgrounded).
     */
    const handleUserActivity = () => {
      if (!document.hidden) {
        resetIdleTimer();
      }
    };

    // Activity event types to monitor
    const activityEvents = ['mousedown', 'keydown', 'touchstart'];

    // Register activity listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleUserActivity);
    });

    // Initial timer setup
    resetIdleTimer();

    logger.debug('[useIdleWarning] Idle warning hook mounted', { idleWarningThresholdMs });

    // Cleanup on unmount or dependency change
    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleUserActivity);
      });
      if (idleTimer) clearTimeout(idleTimer);
      logger.debug('[useIdleWarning] Idle warning hook unmounted');
    };
  }, [pauseGameIdleProgression, idleWarningThresholdMs, t, toast]);
}
