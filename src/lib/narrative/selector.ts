import compileCondition from './condition';
import type { RNG } from './rng';
import type { SlotSchema } from './schemas';

type Slot = typeof SlotSchema._type;

export type Template = {
  id: string;
  terrain?: string | string[];
  tags?: string[];
  conditions?: any;
  lengthHint?: number;
  weight?: number;
  patterns?: { id?: string; template: string; slots?: Slot[] }[];
  reactionPatterns?: { id?: string; template: string; weight?: number; slots?: Slot[]; conditions?: any }[];
};

export function scoreTemplate(
  tmpl: Template,
  context: any,
  state: any,
  desiredDetail: number,
): number {
  const base = tmpl.weight ?? 1;
  const condFn = compileCondition(tmpl.conditions);
  const cond = condFn(context, state);
  if (!cond.matches && cond.score === 0) return 0;

  // moodScore: presence of tags matching context.moods
  const moods: string[] = context?.moods ?? [];
  const tmplTags: string[] = tmpl.tags ?? [];
  const overlap = tmplTags.filter(t => moods.includes(t)).length;
  const moodScore = tmplTags.length === 0 ? 1 : Math.max(0.1, overlap / tmplTags.length);

  const motifsSeen = state?.motifsSeen?.[tmpl.id] ?? 0;
  const novelty = 1 / (1 + motifsSeen);

  const lenHint = tmpl.lengthHint ?? 2;
  const detailPenalty = Math.exp(-Math.abs(lenHint - desiredDetail) * 0.5);
  let final = base * cond.score * moodScore * novelty * detailPenalty;

  // Boost transition templates when biome changes
  const biomeChanged = state?.lastBiome && context?.chunk?.terrain && state.lastBiome !== context.chunk.terrain;
  if (biomeChanged && tmplTags.includes('transition')) {
    final *= 2.0; // strong boost for transition templates
  }

  // If the player is repeating actions, prefer templates that include a
  // continuation fragment slot so the phrasing can reflect continuation
  // instead of a fresh description.
  const repeatCount = state?.repeatCount ?? 0;
  const hasContinuation = (tmpl.patterns || []).some(p => {
    if (p.slots && p.slots.some(slot => slot.id === 'continuation_fragment')) return true;
    if (typeof p.template === 'string' && /{{\s*continuation_fragment\s*}}/.test(p.template)) return true;
    return false;
  });
  if (repeatCount >= 2 && hasContinuation) {
    final *= 1.6; // boost templates intended for continuation
  }
  return final;
}

export function selectPrimaryTemplate(
  templates: Template[],
  context: any,
  state: any,
  desiredDetail: number,
  rng: RNG,
): Template | null {
  const scored = templates.map(t => ({ t, score: scoreTemplate(t, context, state, desiredDetail) }));
  const filtered = scored.filter(s => s.score > 0.001);
  if (filtered.length === 0) return null;
  const items = filtered.map(f => f.t);
  const weights = filtered.map(f => f.score);
  return rng.weightedChoice(items, weights) || null;
}

export default { scoreTemplate, selectPrimaryTemplate };
