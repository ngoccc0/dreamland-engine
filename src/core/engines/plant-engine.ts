import type { Chunk, WorldProfile, Season } from '@/lib/game/types';
import defaultGameConfig from '@/lib/config/game-config';

/**
 * Simple PlantEngine that simulates vegetation density on chunks.
 * It operates on Chunk.vegetationDensity (0-100) and adjusts it based on
 * moisture, temperature, season, and neighboring chunks.
 */
export class PlantEngine {
    private config = defaultGameConfig;

    constructor(private t: (key: string, params?: any) => string, config?: Partial<typeof defaultGameConfig>) {
        if (config) {
            // shallow merge of provided config into defaults for the keys we care about
            this.config = {
                ...this.config,
                ...config,
                plant: { ...this.config.plant, ...(config as any).plant },
                creature: { ...this.config.creature, ...(config as any).creature }
            } as any;
        }
    }

    /**
     * Update plants for the provided chunks for a single tick.
     * Returns narrative messages describing notable events (bloom/wither/spread).
     */
    updatePlants(
        currentTick: number,
        chunks: Map<string, Chunk>,
        season: Season,
        worldProfile?: WorldProfile
    ): Array<{ text: string; type: 'narrative' | 'system' }> {
        const messages: Array<{ text: string; type: 'narrative' | 'system' }> = [];

        // RNG helper
        const rand = () => Math.random();

        for (const [key, chunk] of chunks) {
            // Ensure chunk has vegetationDensity
            if (typeof chunk.vegetationDensity !== 'number') continue;

            const oldDensity = chunk.vegetationDensity;

            // Base growth depends on biome and worldProfile.resourceDensity
            const resourceFactor = worldProfile?.resourceDensity ?? 1;
            const baseGrowth = 0.2 * resourceFactor * this.config.plant.baseGrowthMultiplier;

            // Environmental modifiers
            const moistureMod = (chunk.moisture ?? 50) / 100; // 0..1
            const temp = chunk.temperature ?? 20;
            const tempOptimal = 20;
            const tempDiff = Math.abs(temp - tempOptimal);
            const tempMod = Math.max(0, 1 - tempDiff / 40); // declines as temperature deviates

            // Season modifier from config
            const seasonMod = this.config.plant.seasonMultiplier[season] ?? 1;

            // Human presence reduces growth (configurable)
            const humanPenalty = 1 - Math.min(0.9, (chunk.humanPresence ?? 0) / 100) * (1 - this.config.plant.humanPenaltyFactor);

            // Compute growth potential
            const growthPotential = baseGrowth * moistureMod * tempMod * seasonMod * humanPenalty;

            // Apply growth (bounded by maxGrowthPerTick)
            const growthAmount = Math.round(Math.min(this.config.plant.maxGrowthPerTick, growthPotential * this.config.plant.maxGrowthPerTick * (rand() + 0.5)));

            // Apply drought/stress if moisture is very low or extreme temps
            let declineAmount = 0;
            if ((chunk.moisture ?? 50) < this.config.plant.droughtMoistureThreshold || temp > 35 || temp < -5) {
                declineAmount = Math.round((1 - moistureMod) * (this.config.plant.maxGrowthPerTick - 1) * (rand() + 0.2));
            }

            // Spread to neighbors: if dense and random roll passes, nudge neighbors
            if (oldDensity >= 60 && rand() < this.config.plant.spreadChance) {
                const [sx, sy] = key.split(',').map(s => parseInt(s, 10));
                const neighbors = [
                    `${sx - 1},${sy}`, `${sx + 1},${sy}`, `${sx},${sy - 1}`, `${sx},${sy + 1}`
                ];
                for (const nkey of neighbors) {
                    const nchunk = chunks.get(nkey);
                    if (nchunk && typeof nchunk.vegetationDensity === 'number') {
                        nchunk.vegetationDensity = Math.min(100, nchunk.vegetationDensity + 1);
                    }
                }
            }

            // Update density
            let next = Math.max(0, Math.min(100, oldDensity + growthAmount - declineAmount));

            // Small random variation
            if (rand() < 0.03) {
                next = Math.max(0, Math.min(100, next + (rand() < 0.5 ? -1 : 1)));
            }

            chunk.vegetationDensity = next;

            // Narrative triggers (configurable thresholds could be added later)
            if (oldDensity < 30 && next >= 30) {
                messages.push({ text: this.t('vegetationGrowing', { x: chunk.x, y: chunk.y }), type: 'narrative' });
            }
            if (oldDensity < 70 && next >= 70) {
                messages.push({ text: this.t('vegetationBloom', { x: chunk.x, y: chunk.y }), type: 'narrative' });
            }
            if (oldDensity >= 30 && next < 10) {
                messages.push({ text: this.t('vegetationWithered', { x: chunk.x, y: chunk.y }), type: 'narrative' });
            }
        }

        return messages;
    }
}
