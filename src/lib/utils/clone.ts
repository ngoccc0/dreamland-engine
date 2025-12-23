/**
 * Deep Clone Utility
 * 
 * @remarks
 * Provides safe deep cloning for game state objects.
 * Uses structuredClone when available, falls back to JSON for compatibility.
 * 
 * **Why not JSON.parse(JSON.stringify())?**
 * - Fails silently on undefined, functions, symbols
 * - Loses Date objects, RegExp, Maps, Sets
 * - No error handling for circular references
 * 
 * @example
 * const cloned = deepClone(playerStats);
 */

/**
 * Deep clone an object safely.
 * 
 * @param obj - Object to clone
 * @returns Deep cloned copy
 * 
 * @remarks
 * Uses structuredClone (modern browsers) or JSON fallback.
 * For game state objects (primitives, arrays, plain objects), both work identically.
 */
export function deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    // Use structuredClone if available (Node 17+, modern browsers)
    if (typeof structuredClone === 'function') {
        try {
            return structuredClone(obj);
        } catch {
            // Fall through to JSON fallback
        }
    }

    // JSON fallback for older environments
    return JSON.parse(JSON.stringify(obj));
}
