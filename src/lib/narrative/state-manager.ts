import type { RNG } from './rng';
import type Lexicon from './lexicon';

/**
 * Type guard to detect if an object is a Lexicon by checking for the pick method.
 * Lexicon has a pick(slotName, options?, rng?) method for template slot filling.
 */
function isLexicon(obj: any): obj is Lexicon {
  return obj && typeof obj.pick === 'function';
}

/**
 * NARRATIVE STATE - Tracks narrative generation state for repetition avoidance and continuity.
 *
 * Extended fields for Phase 1a (polish):
 *   - lastNarrativeTimestamp: For movement throttling (don't generate narrative faster than MIN_INTERVAL)
 *   - biomeVisitCount: Track cumulative visits to each biome (for familiarity-aware density)
 *   - biomeLastVisitTime: Timestamp of last visit (for time-based freshness reset)
 *   - lastAnimationType: Remember last animation type to avoid repeats
 */
export type NarrativeState = {
  lastBiome?: string | null;
  lastActionId?: string | null;
  repeatCount: number;
  lastNarrationTick?: number | null;
  lastDetailLevel?: number | null;
  motifsSeen: Record<string, number>;
  lastConnector?: string | null;
  // eventMemory stores counts per action/event key so selectors/assemblers
  // can decide to reduce detail or add continuation fragments when an
  // event repeats frequently.
  eventMemory?: Record<string, number>;

  // Phase 1a: Movement throttling & animation
  /** Timestamp (ms) of last narrative generation - used for MIN_NARRATIVE_INTERVAL throttling */
  lastNarrativeTimestamp?: number | null;
  /** Per-biome visit tracking: { biomeId: visitCount } */
  biomeVisitCount?: Record<string, number>;
  /** Per-biome last visit timestamp: { biomeId: timestamp } */
  biomeLastVisitTime?: Record<string, number>;
  /** Remember last animation type to avoid repeats */
  lastAnimationType?: 'typing' | 'fade' | 'instant' | null;
};

export class StateManager {
  private state: NarrativeState;

  constructor(initial?: Partial<NarrativeState>) {
    this.state = {
      lastBiome: initial?.lastBiome ?? null,
      lastActionId: initial?.lastActionId ?? null,
      repeatCount: initial?.repeatCount ?? 0,
      lastNarrationTick: initial?.lastNarrationTick ?? null,
      lastDetailLevel: initial?.lastDetailLevel ?? null,
      motifsSeen: initial?.motifsSeen ? { ...initial?.motifsSeen } : {},
      lastConnector: initial?.lastConnector ?? null,
      eventMemory: initial?.eventMemory ? { ...initial.eventMemory } : {},
      // Phase 1a: Initialize throttling fields
      lastNarrativeTimestamp: initial?.lastNarrativeTimestamp ?? null,
      biomeVisitCount: initial?.biomeVisitCount ? { ...initial.biomeVisitCount } : {},
      biomeLastVisitTime: initial?.biomeLastVisitTime ? { ...initial.biomeLastVisitTime } : {},
      lastAnimationType: initial?.lastAnimationType ?? null,
    };
  }

  getState(): NarrativeState {
    // return a shallow copy to avoid external mutation
    return { ...this.state, motifsSeen: { ...this.state.motifsSeen } };
  }

  reset(): void {
    this.state = {
      lastBiome: null,
      lastActionId: null,
      repeatCount: 0,
      lastNarrationTick: null,
      lastDetailLevel: null,
      motifsSeen: {},
      lastConnector: null,
      eventMemory: {},
      // Phase 1a: Reset throttling fields
      lastNarrativeTimestamp: null,
      biomeVisitCount: {},
      biomeLastVisitTime: {},
      lastAnimationType: null,
    };
  }

  /**
   * Update state using a new snapshot and optional decision metadata.
   * The RNG parameter is optional and may be used to rotate connectors or
   * pick a variation deterministically when needed.
   */
  // Backwards-compatible signature: older callers sometimes pass RNG as the
  // third parameter (lexicon missing). Accept either a Lexicon or RNG as the
  // third argument and normalize to (lex, rng).
  updateWithSnapshot(snapshot: any, decision?: any, lexOrRng?: Lexicon | RNG, maybeRng?: RNG): Partial<NarrativeState> {
    let lex: Lexicon | undefined;
    let rng: RNG | undefined;
    if (lexOrRng) {
      // Use type guard to distinguish Lexicon from RNG
      if (isLexicon(lexOrRng)) {
        lex = lexOrRng;
        rng = maybeRng;
      } else {
        // third argument is RNG
        rng = lexOrRng as RNG;
        lex = maybeRng as unknown as Lexicon | undefined;
      }
    } else {
      lex = undefined;
      rng = maybeRng;
    }
    const prevBiome = this.state.lastBiome;
    const newBiome = snapshot?.chunk?.terrain ?? null;

    if (newBiome && prevBiome === newBiome) {
      this.state.repeatCount = (this.state.repeatCount || 0) + 1;
    } else if (newBiome) {
      this.state.repeatCount = 0;
      this.state.lastBiome = newBiome;
    }

    if (snapshot?.action?.id) {
      const aid = snapshot.action.id as string;
      if (this.state.lastActionId === aid) {
        this.state.repeatCount = (this.state.repeatCount || 0) + 1;
        // increment eventMemory for this action
        this.state.eventMemory = this.state.eventMemory || {};
        this.state.eventMemory[aid] = (this.state.eventMemory[aid] || 0) + 1;
      } else {
        this.state.lastActionId = aid;
        this.state.repeatCount = 0;
        // initialize memory for new action
        this.state.eventMemory = this.state.eventMemory || {};
        this.state.eventMemory[aid] = (this.state.eventMemory[aid] || 0) + 1;
      }
    }

    if (typeof decision?.detailLevel === 'number') this.state.lastDetailLevel = decision.detailLevel;
    if (typeof decision?.tick === 'number') this.state.lastNarrationTick = decision.tick;

    // motifsSeen: increment counts for the templates used in the decision
    if (decision?.templateIds && Array.isArray(decision.templateIds)) {
      for (const id of decision.templateIds) {
        this.state.motifsSeen[id] = (this.state.motifsSeen[id] || 0) + 1;
      }
    }

    // Cập nhật connector dựa trên ngữ cảnh
    const biomeChanged = newBiome && prevBiome !== newBiome;
    const actionRepeated = this.state.repeatCount > 0 && snapshot?.action?.id;

    let connectorCondition = 'default';
    if (biomeChanged) {
      connectorCondition = 'biome_change';
    } else if (actionRepeated) {
      connectorCondition = 'action_repeat';
    }

    if (lex && rng) {
      const pick = lex.pick('narrative_connector', { condition: connectorCondition }, rng);
      if (pick) {
        this.state.lastConnector = pick.text;
      }
    } else if (rng) {
      // No lexicon available but RNG provided (some older callers/tests pass
      // only an RNG). Pick a deterministic short connector string using the
      // RNG so callers receive a string result (tests assert typeof string).
      const defaultConnectors = ['...', 'then', 'meanwhile', 'after a while', 'and then'];
      const picked = rng.choice(defaultConnectors) || '...';
      this.state.lastConnector = String(picked);
    }

    return this.getState();
  }

  /**
   * Phase 1a: Check if narrative should be throttled based on MIN_NARRATIVE_INTERVAL.
   * Prevents spam when player moves rapidly in same biome.
   *
   * @param minIntervalMs - Minimum milliseconds between narratives (default: 1500ms)
   * @returns true if should generate narrative, false if throttled
   */
  shouldGenerateNarrative(minIntervalMs: number = 1500): boolean {
    const now = Date.now();
    if (!this.state.lastNarrativeTimestamp) {
      this.state.lastNarrativeTimestamp = now;
      return true;
    }

    const timeSinceLast = now - this.state.lastNarrativeTimestamp;
    if (timeSinceLast >= minIntervalMs) {
      this.state.lastNarrativeTimestamp = now;
      return true;
    }

    return false;
  }

  /**
   * Phase 1a: Update biome visit tracking for adaptive narrative density.
   * Tracks how many times player has visited a biome and when.
   *
   * @param biomeId - Biome terrain ID
   * @returns Visit count after increment
   */
  recordBiomeVisit(biomeId: string): number {
    const now = Date.now();
    const visits = (this.state.biomeVisitCount?.[biomeId] ?? 0) + 1;

    this.state.biomeVisitCount = this.state.biomeVisitCount || {};
    this.state.biomeVisitCount[biomeId] = visits;

    this.state.biomeLastVisitTime = this.state.biomeLastVisitTime || {};
    this.state.biomeLastVisitTime[biomeId] = now;

    return visits;
  }

  /**
   * Phase 1a: Get adaptive narrative frequency based on biome familiarity.
   * First visit: every move
   * 2-3 visits: every 2-3 moves
   * 4+ visits (< 1 hour): every 4-5 moves
   * After 24 hours: reset to first visit
   *
   * @param biomeId - Biome terrain ID
   * @param maxAge - Max time (ms) to keep visit history (default: 86400000 = 24h)
   * @returns Frequency: generate every N moves (1 = every move)
   */
  getNarrativeFrequency(biomeId: string, maxAge: number = 86400000): number {
    const visits = this.state.biomeVisitCount?.[biomeId] ?? 0;
    const lastVisit = this.state.biomeLastVisitTime?.[biomeId] ?? 0;
    const now = Date.now();
    const timeSinceLastVisit = now - lastVisit;

    // If too old, treat as first visit
    if (timeSinceLastVisit > maxAge) {
      return 1;
    }

    // Adaptive density: first visit → 1, 2-3 visits → 2-3, 4+ visits → 4-5
    if (visits <= 1) return 1;
    if (visits <= 3) return visits;
    if (timeSinceLastVisit < 3600000) return 4; // < 1 hour: every 4th move
    return 1; // > 1 hour: reset to every move
  }

  /**
   * Phase 1a: Record animation type to avoid repeats.
   * @param animationType - 'typing' | 'fade' | 'instant'
   */
  recordAnimationType(animationType: 'typing' | 'fade' | 'instant'): void {
    this.state.lastAnimationType = animationType;
  }

  /**
   * Phase 1a: Get last animation type used.
   * @returns Last animation type or null
   */
  getLastAnimationType(): 'typing' | 'fade' | 'instant' | null {
    return this.state.lastAnimationType ?? null;
  }
}

export default StateManager;
