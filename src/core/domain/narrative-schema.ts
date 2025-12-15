import { z } from 'zod';

/**
 * Zod schema for narrative template types.
 */
export const NarrativeTemplateTypeSchema = z.enum([
    'Opening',
    'EnvironmentDetail',
    'SensoryDetail',
    'EntityReport',
    'SurroundingPeek',
    'Closing',
    'Filler'
]);

/**
 * Zod schema for narrative lengths.
 */
export const NarrativeLengthSchema = z.enum(['short', 'medium', 'long', 'detailed']);

/**
 * Zod schema for mood tags.
 */
export const MoodTagSchema = z.enum([
    'Danger',
    'Peaceful',
    'Magic',
    'Foreboding',
    'Resourceful',
    'Lush',
    'Gloomy',
    'Dark',
    'Serene',
    'Vibrant',
    'Mysterious',
    'Desolate',
    'Threatening',
    'Wet',
    'Arid',
    'Wild',
    'Ethereal',
    'Civilized',
    'Historic',
    'Hot',
    'Cold',
    'Harsh',
    'Rugged',
    'Elevated',
    'Confined',
    'Smoldering',
    'Vast',
    'Structured',
    'Barren',
    'Abandoned'
]);

/**
 * Zod schema for condition ranges.
 */
export const ConditionRangeSchema = z.object({
    min: z.number().optional(),
    max: z.number().optional()
});

/**
 * Zod schema for condition types.
 */
export const ConditionTypeSchema = z.object({
    vegetationDensity: ConditionRangeSchema.optional(),
    moisture: ConditionRangeSchema.optional(),
    elevation: ConditionRangeSchema.optional(),
    dangerLevel: ConditionRangeSchema.optional(),
    magicAffinity: ConditionRangeSchema.optional(),
    humanPresence: ConditionRangeSchema.optional(),
    predatorPresence: ConditionRangeSchema.optional(),
    lightLevel: ConditionRangeSchema.optional(),
    temperature: ConditionRangeSchema.optional(),
    soilType: z.array(z.string()).optional(),
    timeOfDay: z.enum(['day', 'night']).optional(),
    visibility: ConditionRangeSchema.optional(),
    humidity: ConditionRangeSchema.optional(),
    playerHealth: ConditionRangeSchema.optional(),
    playerStamina: ConditionRangeSchema.optional(),
    requiredEntities: z.object({
        enemyType: z.string().optional(),
        itemType: z.string().optional()
    }).optional()
});

/**
 * Zod schema for a single narrative template.
 */
export const NarrativeTemplateSchema = z.object({
    id: z.string(),
    type: NarrativeTemplateTypeSchema,
    mood: z.array(MoodTagSchema),
    length: NarrativeLengthSchema,
    conditions: ConditionTypeSchema.optional(),
    weight: z.number().min(0),
    template: z.string()
});

/**
 * Zod schema for biome adjective categories.
 */
export const BiomeAdjectiveCategorySchema = z.record(z.array(z.string()));

/**
 * Zod schema for biome template data.
 */
export const BiomeTemplateDataSchema = z.object({
    terrain: z.string(),
    descriptionTemplates: z.array(NarrativeTemplateSchema),
    adjectives: BiomeAdjectiveCategorySchema,
    features: BiomeAdjectiveCategorySchema,
    smells: BiomeAdjectiveCategorySchema,
    sounds: BiomeAdjectiveCategorySchema,
    sky: BiomeAdjectiveCategorySchema.optional()
});

/**
 * Zod schema for the complete biome templates record.
 */
export const BiomeTemplatesRecordSchema = z.record(BiomeTemplateDataSchema);

/**
 * Validates biome template data against the schema.
 * @param data The data to validate.
 * @returns The validated data or throws an error.
 */
export function validateBiomeTemplateData(data: unknown): z.infer<typeof BiomeTemplateDataSchema> {
    return BiomeTemplateDataSchema.parse(data);
}

/**
 * Validates the complete biome templates record against the schema.
 * @param data The data to validate.
 * @returns The validated data or throws an error.
 */
export function validateBiomeTemplatesRecord(data: unknown): z.infer<typeof BiomeTemplatesRecordSchema> {
    return BiomeTemplatesRecordSchema.parse(data);
}
