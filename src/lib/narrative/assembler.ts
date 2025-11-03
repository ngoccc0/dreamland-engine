import type Lexicon from './lexicon';
import type { RNG } from './rng';

export function fillTemplate(
  template: string,
  lex: Lexicon,
  context: any,
  opts: { lang?: string; detail?: number; biome?: string; rng?: RNG; state?: any; persona?: any; tone?: string } = {},
) {
  // If the player is repeating an action (state.repeatCount >= 2), try to
  // include a continuation fragment. If template already contains
  // {{continuation_fragment}} that will be replaced normally by the regex
  // below. If not, we prepend a picked continuation phrase.
  const repeatCount = opts.state?.repeatCount ?? 0;

  const replaced = template.replace(/{{\s*([^}]+?)\s*}}/g, (m, p1) => {
    const slot = p1.trim();
    const pick = lex.pick(slot, { detail: opts.detail, biome: opts.biome, tone: opts.tone, voice: opts.persona?.voice }, opts.rng as any);
    if (!pick) return m; // leave placeholder if not found
    return pick.text;
  });

  if (repeatCount >= 2) {
    // if the template did not include continuation_fragment slot, prefix one
    if (!/{{\s*continuation_fragment\s*}}/.test(template)) {
      const cont = lex.pick('continuation_phrase', { detail: opts.detail, biome: opts.biome, tone: opts.tone, voice: opts.persona?.voice }, opts.rng as any);
      if (cont && cont.text) {
        return `${cont.text} ${replaced}`;
      }
    }
  }
  return replaced;
}

export default { fillTemplate };
