/**
 * Small seeded PRNG utilities.
 * Uses a string -> 32-bit hash then mulberry32 PRNG for deterministic sequences.
 */

/** Create a 32-bit hash from a string (FNV-1a inspired simple hash). */
export function hashStringTo32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** mulberry32 PRNG - returns function that yields floats in [0,1) */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export type RNG = {
  float: () => number;
  int: (min: number, max: number) => number;
  choice: <T>(arr: T[]) => T | undefined;
  weightedChoice: <T>(items: T[], weights: number[]) => T | undefined;
  shuffle: <T>(arr: T[]) => T[];
  seedHex: string;
};

export function createRng(seed?: string | number): RNG {
  const seedNum = typeof seed === 'number' ? seed >>> 0 : hashStringTo32(String(seed ?? Date.now().toString()));
  const floatFn = mulberry32(seedNum);
  const rng: RNG = {
    float: () => floatFn(),
    int: (min: number, max: number) => {
      const f = floatFn();
      return Math.floor(f * (max - min + 1)) + min;
    },
    choice: <T,>(arr: T[]) => {
      if (!arr || arr.length === 0) return undefined;
      return arr[Math.floor(floatFn() * arr.length)];
    },
    weightedChoice: <T,>(items: T[], weights: number[]) => {
      if (!items || items.length === 0) return undefined;
      const total = weights.reduce((a, b) => a + b, 0);
      if (total <= 0) return undefined;
      let r = floatFn() * total;
      for (let i = 0; i < items.length; i++) {
        r -= weights[i];
        if (r <= 0) return items[i];
      }
      return items[items.length - 1];
    },
    shuffle: <T,>(arr: T[]) => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(floatFn() * (i + 1));
        const tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
      }
      return a;
    },
    seedHex: '0x' + seedNum.toString(16).padStart(8, '0'),
  };
  return rng;
}

export default createRng;
