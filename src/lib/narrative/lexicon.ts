import fs from 'fs';
import type { RNG } from './rng';

export type LexiconEntry = {
  id: string;
  text: string;
  toneTags?: string[];
  voice?: string[];
  detailLevel?: number;
  biomes?: string[];
  weight?: number;
  condition?: string;
};

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

  pick(
    slotName: string,
    options: { tone?: string; voice?: string; detail?: number; biome?: string; [key: string]: any } = {},
    rng?: RNG,
  ): LexiconEntry | null {
    const pool = this.getSlot(slotName);
    if (!pool || pool.length === 0) return null;

    let candidates = pool.filter(e => {
      if (options.detail != null && e.detailLevel != null && e.detailLevel > options.detail) {
        return false;
      }
      if (options.biome && e.biomes && e.biomes.length > 0 && !e.biomes.includes(options.biome)) {
        return false;
      }
      if (options.condition && e.condition && e.condition !== options.condition) {
        return false;
      }
      return true;
    });

    let voiceFilteredCandidates = candidates; // Keep a copy before voice filtering

    // If a voice is requested, try to filter by voice
    if (options.voice) {
      const matches = candidates.filter(e => Array.isArray(e.voice) && e.voice.includes(options.voice as string));
      if (matches.length > 0) {
        voiceFilteredCandidates = matches; // Use voice-matched candidates
      } else {
        // If no voice matches, revert to original candidates for further filtering (e.g., by tone)
        // This ensures we don't filter out everything if a specific voice isn't found.
        voiceFilteredCandidates = candidates;
      }
    }

    // Now apply tone filter to the (potentially voice-filtered or reverted) candidates
    let toneFilteredCandidates = voiceFilteredCandidates; // Keep a copy before tone filtering
    if (options.tone) {
      const matches = voiceFilteredCandidates.filter(e => Array.isArray(e.toneTags) && e.toneTags.includes(options.tone as string));
      if (matches.length > 0) {
        toneFilteredCandidates = matches; // Use tone-matched candidates
      } else {
        // If no tone matches, revert to candidates before tone filtering
        toneFilteredCandidates = voiceFilteredCandidates;
      }
    }

    // Use the final filtered candidates
    candidates = toneFilteredCandidates;
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
