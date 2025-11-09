/**
 * Client-side loader for precomputed narrative bundles.
 * - lazy-fetches bundle JSON from /narrative/precomputed/{biome}/{locale}/bundle.json
 * - caches in localStorage (simple LRU/time-based invalidation could be added later)
 *
 * This module is client-only (uses fetch/localStorage). Calling from server will throw.
 */
export type PrecomputedBundle = {
  version: number;
  biome: string;
  locale: string;
  generatedAt: string;
  templates: Array<{
    id: string;
    weight?: number;
    patterns?: any[];
    // optional conditions metadata that can guide runtime selection
    conditions?: any;
    variants: Array<{ patternId: string | null; seed: string; text: string; picks: (string | null)[] }>;
  }>;
};

function ensureClient() {
  if (typeof window === 'undefined') throw new Error('precomputed loader is client-only');
}

const CACHE_PREFIX = 'nl_precomputed_v1:';

export async function loadPrecomputedBundle(biome: string, locale = 'en'): Promise<PrecomputedBundle | null> {
  ensureClient();
  const key = `${CACHE_PREFIX}${biome}:${locale}`;
  // Prefer IndexedDB cache (faster & larger). Fall back to localStorage on failure.
  try {
    // lazy-import cache to keep bundles small when not used
     
    const cache = require('./cache').default as { get: (k: string) => Promise<any>; set: (k: string, v: any) => Promise<boolean>; del: (k: string) => Promise<boolean> };
    const saved = await cache.get(key);
    if (saved) return saved as PrecomputedBundle;
  } catch {
    // IndexedDB may be unavailable or the module may fail to load; fall back to localStorage.
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {
          localStorage.removeItem(key);
        }
      }
      } catch {
      // ignore
    }
  }

  const url = `/narrative/precomputed/${encodeURIComponent(biome.toLowerCase())}/${encodeURIComponent(locale)}/bundle.json`;
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) return null;
    const json = await res.json();
    try {
      const cache = require('./cache').default as { set: (k: string, v: any) => Promise<boolean> };
      cache.set(key, json).catch(() => {
        try {
          localStorage.setItem(key, JSON.stringify(json));
        } catch {
          // ignore
        }
      });
    } catch {
      try {
        localStorage.setItem(key, JSON.stringify(json));
      } catch {
        // ignore
      }
    }
    return json as PrecomputedBundle;
  } catch (e) {
    console.warn('Failed to fetch precomputed bundle', url, String(e));
    return null;
  }
}

export function clearPrecomputedCache(biome?: string, locale?: string) {
  ensureClient();
  if (biome && locale) {
    localStorage.removeItem(`${CACHE_PREFIX}${biome}:${locale}`);
    return;
  }
  // remove all keys with prefix
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) localStorage.removeItem(k);
    }
  } catch {
    // ignore
  }
}

export default { loadPrecomputedBundle, clearPrecomputedCache };
