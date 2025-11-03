import fs from 'fs';
import path from 'path';
import type { RNG } from './rng';

export type LexiconEntry = { id: string; text: string; toneTags?: string[]; voice?: string[]; detailLevel?: number; biomes?: string[]; weight?: number };

export class Lexicon {
  private data: Record<string, LexiconEntry[]> = {};

  constructor() {}

  loadFromFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(content);
    this.data = json;
  }

  getSlot(slotName: string): LexiconEntry[] {
    return this.data[slotName] ?? [];
  }

  pick(slotName: string, options: { tone?: string; voice?: string; detail?: number; biome?: string } = {}, rng?: RNG): LexiconEntry | null {
    const pool = this.getSlot(slotName);
    if (!pool || pool.length === 0) return null;
    // simple filtering by detail/biome
    let candidates = pool.filter(e => (options.detail == null || e.detailLevel == null || e.detailLevel <= options.detail));
    if (options.biome) candidates = candidates.filter(e => !e.biomes || e.biomes.length === 0 || e.biomes.includes(options.biome as string));

    // If a voice is requested, prefer entries matching that voice. If none
    // match, fall back to tone filter or full candidate set.
    if (options.voice) {
      const voiceMatches = candidates.filter(e => Array.isArray(e.voice) && e.voice.includes(options.voice as string));
      if (voiceMatches.length > 0) candidates = voiceMatches;
    }

    // Tone fallback: if a tone is requested, prefer entries matching toneTags
    if ((options.voice == null || candidates.length === 0) && options.tone) {
      const toneMatches = candidates.filter(e => Array.isArray(e.toneTags) && e.toneTags.includes(options.tone as string));
      if (toneMatches.length > 0) candidates = toneMatches;
    }
    const weights = candidates.map(e => e.weight ?? 1);
    if (!rng) {
      // fallback to Math.random
      const total = weights.reduce((a,b) => a+b, 0);
      let r = Math.random() * total;
      for (let i=0;i<candidates.length;i++){
        r -= weights[i];
        if (r <= 0) return candidates[i];
      }
      return candidates[candidates.length-1];
    }
    return rng.weightedChoice(candidates, weights) ?? null;
  }
}

export default Lexicon;
