import type { RNG } from './rng';
import type Lexicon from './lexicon';

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
      // Heuristic: Lexicon has a `pick` method; RNG likely exposes `random` or is a function
      if ((lexOrRng as any).pick && typeof (lexOrRng as any).pick === 'function') {
        lex = lexOrRng as Lexicon;
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
    }

    return this.getState();
  }
}

export default StateManager;
