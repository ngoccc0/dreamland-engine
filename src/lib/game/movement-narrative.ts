import movementTemplates from './movement-templates';
import type { PlayerStatus, Chunk } from '@/lib/game/types';
import { itemDefinitions } from '@/lib/game/items';
import { getTranslatedText } from '@/lib/utils';

type SelectArgs = {
  chunk: Chunk;
  playerStats: PlayerStatus;
  directionText: string;
  language?: string;
  briefSensory?: string;
};
/**
 * Heuristic: does the player have any light-source in their inventory?
 * Conservative, best-effort check using itemDefinitions and translated names.
 */
function hasLightSource(playerStats: PlayerStatus): boolean {
  try {
    const items = (playerStats as any)?.inventory || (playerStats as any)?.items || [];
    if (!Array.isArray(items)) return false;

    // Build a set of known light-source keys from the master itemDefinitions.
    const lightKeys = new Set<string>();
    for (const k of Object.keys(itemDefinitions)) {
      try {
        const def: any = (itemDefinitions as any)[k];
        const nameEn = (def && def.name && (def.name.en || def.name)) ? String(def.name.en || def.name).toLowerCase() : '';
        const descEn = (def && def.description && (def.description.en || def.description)) ? String(def.description.en || def.description).toLowerCase() : '';
        if (k.toLowerCase().includes('torch') || k.toLowerCase().includes('lantern') || k.toLowerCase().includes('lamp') || k.toLowerCase().includes('candle') || k.toLowerCase().includes('firefly')) {
          lightKeys.add(k);
        }
        // Some items are identified by their name/description instead of key
        if (nameEn.includes('torch') || nameEn.includes('lantern') || nameEn.includes('lamp') || descEn.includes('light') || nameEn.includes('candle')) {
          lightKeys.add(k);
        }
      } catch (_e) {
        // ignore problematic item definitions
      }
    }

    // Check player's inventory for any item that matches a known light key or has a translated name indicating light
    return items.some((i: any) => {
      try {
        const display = String(getTranslatedText(i?.name || i?.displayName || i?.label || '', 'en') || '').toLowerCase();
        if (display.includes('torch') || display.includes('lantern') || display.includes('lamp') || display.includes('candle') || display.includes('firefly')) return true;
      } catch (_e) {
        // ignore
      }
      // As a final fallback, compare translated display against itemDefinitions names
      for (const k of lightKeys) {
        const defName = (itemDefinitions as any)[k]?.name?.en;
        try {
          if (defName && String(defName).toLowerCase() === String(getTranslatedText(i?.name || '', 'en')).toLowerCase()) return true;
        } catch (_e) {
          // ignore
        }
      }
      return false;
    });
  } catch (_e) {
    return false;
  }
}

function matchesConditions(conds: any, chunk: Chunk, playerStats: PlayerStatus) {
  if (!conds || Object.keys(conds).length === 0) return true;
  if (typeof conds.lightMax === 'number') {
    if (typeof chunk.lightLevel !== 'number' || chunk.lightLevel > conds.lightMax) return false;
  }
  if (conds.requireNoLight) {
    if (hasLightSource(playerStats)) return false;
  }
  if (typeof conds.moistureMin === 'number') {
    if (typeof chunk.moisture !== 'number' || chunk.moisture < conds.moistureMin) return false;
  }
  if (typeof conds.temperatureMax === 'number') {
    if (typeof chunk.temperature !== 'number' || chunk.temperature > conds.temperatureMax) return false;
  }
  if (typeof conds.staminaBelow === 'number') {
    if (typeof playerStats.stamina !== 'number' || playerStats.stamina >= conds.staminaBelow) return false;
  }
  if (typeof conds.hpBelow === 'number') {
    if (typeof playerStats.hp !== 'number' || playerStats.hp >= conds.hpBelow) return false;
  }
  if (typeof conds.terrainEquals === 'string') {
    if (String(chunk.terrain).toLowerCase() !== String(conds.terrainEquals).toLowerCase()) return false;
  }
  if (typeof conds.weather === 'string') {
    // chunk may include weather info under chunk.weatherZone or similar; try common keys
    const wk = (chunk as any).weather || (chunk as any).weatherZone || (chunk as any).currentWeather;
    if (!wk || String(wk).toLowerCase() !== String(conds.weather).toLowerCase()) return false;
  }
  return true;
}

export function selectMovementNarrative({ chunk, playerStats, directionText, language = 'en', briefSensory = '' }: SelectArgs): string | undefined {
  try {
    const lang = (language && String(language).startsWith('vi')) ? 'vi' : 'en';
    const pool = (movementTemplates as any)[lang] || (movementTemplates as any)['en'];
    // Find first matching non-default template (priority order)
    for (const tpl of pool) {
      if (tpl.id === 'default') continue;
      if (matchesConditions(tpl.conditions || {}, chunk, playerStats)) {
        return (tpl.template || '').replace('{direction}', String(directionText)).replace('{brief_sensory}', String(briefSensory || '')).replace('{biome}', String(chunk.terrain || ''));
      }
    }
    // fallback to default
    const def = pool.find((p: any) => p.id === 'default');
    if (def) return def.template.replace('{direction}', String(directionText)).replace('{brief_sensory}', String(briefSensory || '')).replace('{biome}', String(chunk.terrain || ''));
  } catch (e) {
    // ignore errors and fallback to caller behavior
  }
  return undefined;
}

export default selectMovementNarrative;
