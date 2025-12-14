import type { CreatureDefinition } from '@/core/types/definitions/creature';

/**
 * Minerals bucket — currently empty placeholder. Add mineral creatures (e.g. rock golems)
 * here when available. Keeping this separate makes it clear which templates are
 * organisms vs resources.
 */
export const minerals: Record<string, CreatureDefinition> = {};

export default minerals;
