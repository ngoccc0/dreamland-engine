/* Lightweight debug helper used to trigger `debugger;` in dev when a runtime flag is set.
 * Usage: import { maybeDebug } from '@/lib/debug'; maybeDebug('label');
 * To activate in the browser console: window.__DEBUG_BREAK = true
 * Or set process.env.DEBUG_BREAK = '1' for server-side debugging.
 */
export function maybeDebug(label?: string) {
  try {
    // Prefer client-side flag
    if (typeof window !== 'undefined') {
      const w = window as any;
      if (w.__DEBUG_BREAK) {
         
        debugger;
      }
      return;
    }

    // Server-side fallback via env
    if (process && process.env && process.env.DEBUG_BREAK === '1') {
       
      debugger;
    }
  } catch (_e) {
    // swallow
  }
}
