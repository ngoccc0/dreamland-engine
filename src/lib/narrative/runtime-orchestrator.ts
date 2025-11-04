import createRng from './rng';
import type { PrecomputedBundle } from './loader';

export type Persona = { id?: string; name?: string; voice?: string | string[] } | undefined;

/**
 * Pick a variant for a template from a precomputed bundle.
 * - If seed is provided, the pick is deterministic.
 * - Replaces simple persona placeholders like {{persona_name}} and {{internal_monologue}}.
 */
export function pickVariantFromBundle(
  bundle: PrecomputedBundle,
  templateId: string,
  options?: { seed?: string | number; persona?: Persona }
): { text: string; meta: { templateId: string; variantSeed?: string; picks?: (string | null)[] } } {
  const tpl = bundle.templates.find((t) => t.id === templateId);
  if (!tpl) return { text: '', meta: { templateId } };
  const seedBase = options?.seed ?? `${templateId}::runtime`;
  const rng = createRng(seedBase);
  const variant = tpl.variants.length ? tpl.variants[Math.floor(rng.float() * tpl.variants.length)] : undefined;
  if (!variant) return { text: '', meta: { templateId } };
  let text = variant.text;

  // basic persona substitutions
  if (options?.persona) {
    const p = options.persona;
    if (p?.name) {
      text = text.replace(/{{\s*persona_name\s*}}/g, p.name);
    }
    // internal_monologue: if bundle has internal_monologue lexicon picks embedded, leave as-is; else try persona.name injection
    if (p?.name) {
      text = text.replace(/{{\s*internal_monologue\s*}}/g, `(${p.name} thinks...)`);
    }
  }

  return {
    text,
    meta: { templateId, variantSeed: variant.seed, picks: variant.picks },
  };
}

export default { pickVariantFromBundle };
