"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * ClientInit: small client-only initializer mounted in RootLayout.
 * - Unregisters any service workers (helps when a stale SW caches old chunks during dev).
 * - Clears caches (best-effort) to avoid serving stale assets.
 * - Listens for chunk load errors and attempts a full reload so the client can fetch the latest bundles.
 */
export default function ClientInit() {
  const pathname = usePathname?.() ?? null;

  useEffect(() => {
    // Unregister service workers (helpful in dev when a previously-registered SW is interfering)
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(reg => {
          try {
            reg.unregister();
            console.debug('[ClientInit] Unregistered service worker', reg);
          } catch {
            console.warn('[ClientInit] Failed to unregister service worker');
          }
        });
      }).catch(() => {/* ignore */});
    }

    // Clear CacheStorage if available (best-effort)
    if (typeof caches !== 'undefined' && caches.keys) {
      caches.keys().then(keys => {
        keys.forEach(key => {
          caches.delete(key).then(() => {
            console.debug('[ClientInit] Deleted cache', key);
          }).catch(() => {/* ignore */});
        });
      }).catch(() => {/* ignore */});
    }

    // Dev-only: auto-enable debug break flag for the first client mount so developers
    // who want to immediately pause in instrumented locations can do so without
    // needing to open the console manually. Only enable in non-production builds.
    try {
      if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
        // Don't override if already set by the developer
        const w = window as any;
        if (w.__DEBUG_BREAK !== true) {
          w.__DEBUG_BREAK = true;
          console.info('[ClientInit] Auto-enabled window.__DEBUG_BREAK for first mount (dev only).');
        }
      }
    } catch {
      // ignore any issues (this is purely developer convenience)
    }

    const onError = (ev: ErrorEvent) => {
      try {
        const msg = ev?.error?.message || ev?.message || '';
        if (msg && (msg.includes('Loading chunk') || msg.includes('ChunkLoadError') || msg.includes('failed to load'))) {
           
          console.warn('[ClientInit] Detected chunk load error, reloading page to recover', msg);
          // Force reload: bypass cache
          window.location.reload();
        }
      } catch {
        // noop
      }
    };

    const onRejection = (ev: PromiseRejectionEvent) => {
      try {
        const reason = ev?.reason;
        const msg = typeof reason === 'string' ? reason : reason?.message || '';
        if (msg && (msg.includes('Loading chunk') || msg.includes('ChunkLoadError') || msg.includes('failed to load'))) {
           
          console.warn('[ClientInit] Detected chunk load rejection, reloading page to recover', msg);
          window.location.reload();
        }
      } catch {
        // noop
      }
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  // Clear any residual pointer-events on mount and whenever the route changes.
  // Some floating/dismissable layers (Radix or other libs) temporarily set
  // `document.body.style.pointerEvents = 'none'` to block outside clicks while
  // a layer is open. If that value is not restored (e.g. due to an exception or
  // interrupted lifecycle) the UI becomes unclickable. This effect is a
  // defensive measure to recover from that state on navigation.
  useEffect(() => {
    try {
      if (typeof document !== 'undefined' && document?.body) {
        document.body.style.pointerEvents = '';
      }
      if (typeof document !== 'undefined' && document?.documentElement) {
        document.documentElement.style.pointerEvents = '';
      }
    } catch {
      // noop - defensive only
    }
  }, [pathname]);

  return null;
}
