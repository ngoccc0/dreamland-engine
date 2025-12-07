import { TerrainDefinition } from '../api/types';

/**
 * Minimal TerrainManager implementation used by loader/tests.
 * Provides registration and simple lookup for terrain definitions.
 */
export class TerrainManager {
    private static instance: TerrainManager | null = null;
    private registry: Map<string, TerrainDefinition> = new Map();

    private constructor() {}

    public static getInstance(): TerrainManager {
        if (!this.instance) this.instance = new TerrainManager();
        return this.instance;
    }

    public registerTerrain(def: TerrainDefinition): void {
        if (!def || !def.id) throw new Error('Invalid terrain definition');
        this.registry.set(def.id, def);
    }

    public getTerrain(id: string): TerrainDefinition | undefined {
        return this.registry.get(id);
    }

    public clear(): void {
        this.registry.clear();
    }
}
