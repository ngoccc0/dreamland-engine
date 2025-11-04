import { z } from 'zod';

// Lexicon entry used for small runtime picks (persona-aware picks should be a small subset)
export const LexiconEntrySchema = z.object({
  id: z.string(),
  text: z.string(),
  weight: z.number().optional().default(1),
  detailLevel: z.number().min(0).max(5).optional(),
  biomeTags: z.array(z.string()).optional(),
  toneTags: z.array(z.string()).optional(),
  voice: z.array(z.string()).optional(),
});
export type LexiconEntry = z.infer<typeof LexiconEntrySchema>;

// Template variant produced by precompute step. patternText should be almost-final text
// with only a small set of runtime placeholders allowed (e.g., {PERSONA_NAME}, {NUMBER}).
export const PrecomputedVariantSchema = z.object({
  id: z.string(),
  patternText: z.string(),
  weight: z.number().min(0).optional().default(1),
  detailLevel: z.number().min(0).max(5).optional().default(2),
  tags: z.array(z.string()).optional(),
});
export type PrecomputedVariant = z.infer<typeof PrecomputedVariantSchema>;

// Bundle for a (biome, locale) containing pre-rendered variants.
export const PrecomputedBundleSchema = z.object({
  version: z.string(),
  biome: z.string(),
  locale: z.string(),
  generatedAt: z.string(),
  variants: z.array(PrecomputedVariantSchema),
  metadata: z.object({
    templateCount: z.number().optional(),
    variantCount: z.number().optional(),
  }).optional(),
});

export type PrecomputedBundle = z.infer<typeof PrecomputedBundleSchema>;

// Template authoring schema (minimal) — used by precompute tool to validate authors' inputs
export const AuthorTemplateSchema = z.object({
  id: z.string(),
  type: z.string().optional(),
  mood: z.array(z.string()).optional(),
  length: z.string().optional(),
  conditions: z.record(z.any()).optional(),
  variants: z.array(z.object({ template: z.string(), weight: z.number().optional().default(1) })).optional(),
});
export type AuthorTemplate = z.infer<typeof AuthorTemplateSchema>;

export const AuthorTemplatesSchema = z.array(AuthorTemplateSchema);

// Helper validator exports
export function validateBundle(obj: unknown) {
  return PrecomputedBundleSchema.parse(obj);
}

export function validateLexiconEntry(obj: unknown) {
  return LexiconEntrySchema.parse(obj);
}

export default {
  PrecomputedBundleSchema,
  PrecomputedVariantSchema,
  LexiconEntrySchema,
  AuthorTemplateSchema,
};
