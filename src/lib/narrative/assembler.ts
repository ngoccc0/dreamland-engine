import { getTranslatedText } from '@/lib/utils';
import type { Language } from '@/core/types/game';
import type Lexicon from './lexicon';
import type { RNG } from './rng';

/**
 * Small narrative assembler: assemble template parts into a localized sentence.
 * This is intentionally minimal and focused on movement continuation and pickup summaries.
 */
function postProcess(text: string, language: Language) {
  // Basic cleanup: collapse multiple spaces and fix punctuation spacing
  let s = String(text).replace(/\s+/g, ' ').trim();
  if (language === 'vi') {
    // Vietnamese: ensure no space before punctuation marks like ',' and '.'
    s = s.replace(/\s+([.,!?;:])/g, '$1');
  }
  return s;
}

/**
 * Build a narrative from a small template parts object.
 * templateParts: { [partName]: string[] }
 * pattern: array of part names to include in order
 * ctx: replacements for placeholders (direction, feature, itemName, sensoryKey, language)
 */
function buildNarrative(templateParts: Record<string, string[]>, pattern: string[], ctx: any) {
  const pieces: string[] = [];
  const lang: Language = ctx.language || 'en';
  const pick = (arr: string[] = []) => arr[Math.floor(Math.random() * arr.length)];

  for (const partName of pattern) {
    let variants = templateParts[partName] || [];
    if (!variants || variants.length === 0) continue;
    let piece = pick(variants);
    piece = piece.replace(/\{direction\}/g, ctx.direction || '');
    piece = piece.replace(/\{feature\}/g, ctx.feature || '');
    piece = piece.replace(/\{item\}/g, ctx.itemName || '');
    // sensory replacement: if ctx.sensoryKey is a translation key, resolve it
    if (piece.includes('{sensory}')) {
      const sensoryText = ctx.sensoryKey ? getTranslatedText(ctx.sensoryKey, lang) : (ctx.sensory || '');
      piece = piece.replace(/\{sensory\}/g, sensoryText);
    }
    pieces.push(piece);
  }

  return postProcess(pieces.join(' '), lang);
}


function fillTemplate(
  template: string,
  lex: Lexicon,
  context: any,
  opts: { lang?: string; detail?: number; biome?: string; rng?: RNG; state?: any; persona?: any; tone?: string; slots?: any[] } = {},
) {
  // If the player is repeating an action (state.repeatCount >= 2), try to
  // include a continuation fragment. If template already contains
  // {{continuation_fragment}} that will be replaced normally by the regex
  // below. If not, we prepend a picked continuation phrase.
  const repeatCount = opts.state?.repeatCount ?? 0;

  const replaced = template.replace(/{{\s*([^}]+?)\s*}}/g, (m, p1) => {
    const slotName = p1.trim();
    // Find slot definition if available
    const slotDef = opts.slots?.find((s: any) => s.id === slotName);
    const filters = slotDef?.filters || {};

    // Build pick options from slot filters and global options
    const pickOpts = {
      detail: filters.detailLevel ?? opts.detail,
      biome: filters.biomeTags?.includes(opts.biome || '') ? opts.biome : undefined,
      tone: filters.toneTags?.find((t: string) => t === opts.tone) ? opts.tone : undefined,
      voice: opts.persona?.voice,  // Use persona voice directly
    };

    const pick = lex.pick(slotName, pickOpts, opts.rng as any);
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
// Export named functions; avoid default exports to keep module tree-shakable and
// to prevent multiple-default-export TypeScript errors.
export { buildNarrative, postProcess, fillTemplate };
