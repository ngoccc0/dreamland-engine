import type { RNG } from './rng';

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
  updateWithSnapshot(snapshot: any, decision?: any, rng?: RNG): Partial<NarrativeState> {
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

    // rotate connector if rng provided
    if (rng) {
      const connectors = ['và', 'rồi', 'sau đó', 'đồng thời'];
      const pick = rng.choice(connectors);
      this.state.lastConnector = pick || this.state.lastConnector;
    }

    return this.getState();
  }
}

export default StateManager;
