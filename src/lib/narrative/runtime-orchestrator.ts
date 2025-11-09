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

/**
 * Evaluate a simple conditions object against a context.
 * Supported keys: lightMax, moistureMin, temperatureMax, staminaBelow, hpBelow, terrainEquals, weather
 */
function resolvePath(obj: any, path: string) {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let cur: any = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function evalOp(lhs: any, op: string, rhs: any) {
  switch (op) {
    case '<': return lhs < rhs;
    case '<=': return lhs <= rhs;
    case '>': return lhs > rhs;
    case '>=': return lhs >= rhs;
    case '==': return lhs == rhs;  
    case '===': return lhs === rhs;
    case '!=': return lhs != rhs;  
    case '!==': return lhs !== rhs;
    default: return false;
  }
}

function templateMatchesConditions(conds: any, context: any) {
  if (!conds || (typeof conds === 'object' && Object.keys(conds).length === 0)) return true;
  const chunk = context.chunk || {};
  const player = context.playerStats || {};

  // If conds follows the older shape { all: [{path,op,value}, ...] } or { any: [...] }
  if (conds.all || conds.any) {
    const checks = (conds.all || conds.any);
    const results = checks.map((c: any) => {
      const lhs = resolvePath(context, c.path) ?? resolvePath(chunk, c.path.replace(/^chunk\./, ''));
      return evalOp(lhs, c.op, c.value);
    });
    return !!(conds.all ? results.every(Boolean) : results.some(Boolean));
  }

  // New-style direct keys
  if (typeof conds.lightMax === 'number') {
    if (typeof chunk.lightLevel !== 'number' || chunk.lightLevel > conds.lightMax) return false;
  }
  if (typeof conds.moistureMin === 'number') {
    if (typeof chunk.moisture !== 'number' || chunk.moisture < conds.moistureMin) return false;
  }
  if (typeof conds.temperatureMax === 'number') {
    if (typeof chunk.temperature !== 'number' || chunk.temperature > conds.temperatureMax) return false;
  }
  if (typeof conds.staminaBelow === 'number') {
    if (typeof player.stamina !== 'number' || player.stamina >= conds.staminaBelow) return false;
  }
  if (typeof conds.hpBelow === 'number') {
    if (typeof player.hp !== 'number' || player.hp >= conds.hpBelow) return false;
  }
  if (typeof conds.terrainEquals === 'string') {
    if (String(chunk.terrain || '').toLowerCase() !== String(conds.terrainEquals).toLowerCase()) return false;
  }
  if (typeof conds.weather === 'string') {
    const wk = chunk.weather || chunk.weatherZone || chunk.currentWeather || context.weather;
    if (!wk || String(wk).toLowerCase() !== String(conds.weather).toLowerCase()) return false;
  }

  // timeOfDay support: conds.timeOfDay can be a string or array
  if (conds.timeOfDay) {
    const tod = context.timeOfDay || context.gameTime || null;
    if (!tod) return false;
    if (Array.isArray(conds.timeOfDay)) {
      if (!conds.timeOfDay.map((s: any) => String(s).toLowerCase()).includes(String(tod).toLowerCase())) return false;
    } else {
      if (String(conds.timeOfDay).toLowerCase() !== String(tod).toLowerCase()) return false;
    }
  }

  // equipmentRequired: array of ids/names to check in player inventory
  if (conds.equipmentRequired) {
    const reqs = Array.isArray(conds.equipmentRequired) ? conds.equipmentRequired : [conds.equipmentRequired];
    const inv = (player.items || []).map((i: any) => (i.id || (i.name && (i.name.en || i.name)) || '').toString().toLowerCase());
    const ok = reqs.some((r: any) => inv.includes(String(r).toLowerCase()));
    if (!ok) return false;
  }

  return true;
}

/**
 * Pick a template+variant from a bundle given runtime context (e.g., chunk, playerStats).
 * Filters templates by optional `conditions` metadata and then picks deterministically by seed + weight.
 */
export function pickVariantFromBundleWithConditions(
  bundle: PrecomputedBundle,
  context: any,
  options?: { seed?: string | number; persona?: Persona }
): { text: string; meta: { templateId?: string; variantSeed?: string; picks?: (string | null)[] } } {
  if (!bundle || !Array.isArray(bundle.templates) || bundle.templates.length === 0) return { text: '', meta: { templateId: undefined } };
  // Collect templates that match conditions (or all if no conditions present)
  const candidates = bundle.templates.filter((t) => {
    return templateMatchesConditions((t as any).conditions, context);
  });

  const seedBase = options?.seed ?? `conditional::runtime`;
  const rng = createRng(seedBase);

  if (candidates.length === 0) {
    // fallback to any template
    const tpl = bundle.templates[Math.floor(rng.float() * bundle.templates.length)];
    if (!tpl || !tpl.variants || tpl.variants.length === 0) return { text: '', meta: { templateId: tpl?.id } };
    const variant = tpl.variants[Math.floor(rng.float() * tpl.variants.length)];
    return { text: variant.text, meta: { templateId: tpl.id, variantSeed: variant.seed, picks: variant.picks } };
  }

  // Choose one candidate deterministically by weight if present
  let totalWeight = 0;
  for (const c of candidates) totalWeight += (typeof c.weight === 'number' ? c.weight : 1);
  let pickVal = rng.float() * (totalWeight || candidates.length);
  let chosen: any = candidates[0];
  for (const c of candidates) {
    const w = (typeof c.weight === 'number' ? c.weight : 1);
    if (pickVal <= w) { chosen = c; break; }
    pickVal -= w;
  }

  // pick variant
  const variants = chosen.variants || [];
  if (!variants || variants.length === 0) return { text: '', meta: { templateId: chosen.id } };
  const variant = variants[Math.floor(rng.float() * variants.length)];
  let text = variant.text;
  if (options?.persona && options.persona?.name) {
    text = text.replace(/{{\s*persona_name\s*}}/g, options.persona.name as string);
    text = text.replace(/{{\s*internal_monologue\s*}}/g, `(${options.persona.name} thinks...)`);
  }

  return { text, meta: { templateId: chosen.id, variantSeed: variant.seed, picks: variant.picks } };
}

export default { pickVariantFromBundle, pickVariantFromBundleWithConditions };
