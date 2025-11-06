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

// Condition schemas for template authoring
export const ComparisonSchema = z.object({
  path: z.string(),
  op: z.enum(['<', '<=', '>', '>=', '==', '!=']),
  value: z.any(),
});

export const RequiredEntitiesSchema = z.object({
  enemyType: z.string().optional(),
  itemType: z.string().optional(),
});

export const ConditionExprSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    ComparisonSchema,
    RequiredEntitiesSchema,
    z.object({ all: z.array(ConditionExprSchema) }),
    z.object({ any: z.array(ConditionExprSchema) }),
    z.object({ not: ConditionExprSchema }),
  ])
);

// Slot definition for dynamic lexicon resolution
export const SlotSchema = z.object({
  id: z.string(), // lexicon entry type (e.g., "adjective_dark")
  filters: z.object({
    toneTags: z.array(z.string()).optional(),
    biomeTags: z.array(z.string()).optional(),
    detailLevel: z.number().min(0).max(5).optional(),
    voice: z.array(z.string()).optional(),
  }).optional(),
});

// Template authoring schema (minimal) — used by precompute tool to validate authors' inputs
export const AuthorTemplateSchema = z.object({
  id: z.string(),
  type: z.string().optional(),
  mood: z.array(z.string()).optional(),
  length: z.string().optional(),
  conditions: ConditionExprSchema.optional(),
  variants: z.array(z.object({
    template: z.string(),
    weight: z.number().optional().default(1),
    slots: z.array(SlotSchema).optional(), // Define slots for dynamic resolution
  })).optional(),
  // NEW FIELD: For separate emotional reactions/monologues
  reactionPatterns: z.array(z.object({
    template: z.string(),
    weight: z.number().optional().default(1),
    slots: z.array(SlotSchema).optional(),
    conditions: ConditionExprSchema.optional(), // Reactions can also have conditions
  })).optional(),
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
