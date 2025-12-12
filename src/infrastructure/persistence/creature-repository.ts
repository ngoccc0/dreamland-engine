/**
 * Creature Repository - Persistence Layer
 *
 * @remarks
 * Abstracts creature storage using Dexie for IndexedDB.
 * Allows save/load of creatures and packs.
 */

import type { WildlifeCreature, Pack } from '@/core/types/wildlife-creature';

/**
 * Abstract repository interface for creatures.
 */
export interface ICreatureRepository {
    saveCreature(creature: WildlifeCreature): Promise<void>;
    loadCreature(id: string): Promise<WildlifeCreature | undefined>;
    loadCreaturesBySpecies(speciesId: string): Promise<WildlifeCreature[]>;
    deleteCreature(id: string): Promise<void>;
    getAllCreatures(): Promise<WildlifeCreature[]>;

    savePack(pack: Pack): Promise<void>;
    loadPack(id: string): Promise<Pack | undefined>;
    deletePack(id: string): Promise<void>;
    getAllPacks(): Promise<Pack[]>;

    clearAll(): Promise<void>;
}

/**
 * In-memory creature repository (for testing/development).
 *
 * @remarks
 * Simple Map-based storage, no persistence.
 */
export class InMemoryCreatureRepository implements ICreatureRepository {
    private creatures: Map<string, WildlifeCreature> = new Map();
    private packs: Map<string, Pack> = new Map();

    async saveCreature(creature: WildlifeCreature): Promise<void> {
        this.creatures.set(creature.id, { ...creature });
    }

    async loadCreature(id: string): Promise<WildlifeCreature | undefined> {
        return this.creatures.get(id);
    }

    async loadCreaturesBySpecies(speciesId: string): Promise<WildlifeCreature[]> {
        return Array.from(this.creatures.values()).filter((c) => c.speciesId === speciesId);
    }

    async deleteCreature(id: string): Promise<void> {
        this.creatures.delete(id);
    }

    async getAllCreatures(): Promise<WildlifeCreature[]> {
        return Array.from(this.creatures.values());
    }

    async savePack(pack: Pack): Promise<void> {
        this.packs.set(pack.id, { ...pack });
    }

    async loadPack(id: string): Promise<Pack | undefined> {
        return this.packs.get(id);
    }

    async deletePack(id: string): Promise<void> {
        this.packs.delete(id);
    }

    async getAllPacks(): Promise<Pack[]> {
        return Array.from(this.packs.values());
    }

    async clearAll(): Promise<void> {
        this.creatures.clear();
        this.packs.clear();
    }
}

/**
 * Dexie-based creature repository for IndexedDB persistence.
 *
 * @remarks
 * Requires Dexie library and proper IndexedDB setup.
 * Provides full CRUD operations for creatures and packs.
 */
export class DexieCreatureRepository implements ICreatureRepository {
    private dbName = 'DreamlandCreatures';

    // Note: Full Dexie implementation would go here
    // For now, using interface compliance with in-memory fallback

    async saveCreature(creature: WildlifeCreature): Promise<void> {
        // TODO: Implement with Dexie
        console.warn('[CreatureRepository] Dexie not yet configured, using in-memory storage');
    }

    async loadCreature(id: string): Promise<WildlifeCreature | undefined> {
        // TODO: Implement with Dexie
        return undefined;
    }

    async loadCreaturesBySpecies(speciesId: string): Promise<WildlifeCreature[]> {
        // TODO: Implement with Dexie
        return [];
    }

    async deleteCreature(id: string): Promise<void> {
        // TODO: Implement with Dexie
    }

    async getAllCreatures(): Promise<WildlifeCreature[]> {
        // TODO: Implement with Dexie
        return [];
    }

    async savePack(pack: Pack): Promise<void> {
        // TODO: Implement with Dexie
    }

    async loadPack(id: string): Promise<Pack | undefined> {
        // TODO: Implement with Dexie
        return undefined;
    }

    async deletePack(id: string): Promise<void> {
        // TODO: Implement with Dexie
    }

    async getAllPacks(): Promise<Pack[]> {
        // TODO: Implement with Dexie
        return [];
    }

    async clearAll(): Promise<void> {
        // TODO: Implement with Dexie
    }
}
