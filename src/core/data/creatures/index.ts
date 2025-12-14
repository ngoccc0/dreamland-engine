import type { CreatureDefinition } from '@/core/types/definitions/creature';

import { animals } from './animals';
import { plants } from './plants';
import { minerals } from './minerals';

/**
 * Combined canonical creature catalog built from per-category modules.
 * MIGRATION NOTE (PHASE 2b):
 * - moddedPlants have been merged into plants.ts
 * - Keep this object for callers that expect the single `creatureTemplates` map.
 */
export const creatureTemplates: Record<string, CreatureDefinition> = {
  ...animals,
  ...plants,
  ...minerals
};

export { animals, plants, minerals };

export function getCreatureTemplate(id: string): CreatureDefinition | undefined {
  return creatureTemplates[id];
}
