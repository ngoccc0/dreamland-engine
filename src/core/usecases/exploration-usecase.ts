import { ExplorationManager, ExplorationResult, Discovery, DiscoveryType } from '../entities/exploration';
import { GridPosition } from '../values/grid-position';
import { GridCell } from '../entities/world';
import type { DiscoveredSettlement, UnlockedNPC, DungeonMonster } from '../types/game';
import { SideEffect } from '../entities/side-effects';
import {
    rollDice,
    rollPercentage,
    randomBetween,
} from '@/core/rules/rng';

/**
 * Result of exploring a location - returns new state + effects
 *
 * @remarks
 * Pure function pattern: (state, action) → {newState, effects[]}
 * Hooks execute effects after state update
 */
export interface ExploreLocationResult {
    explorationResult: ExplorationResult;
    effects: SideEffect[];
}

export interface IExplorationUseCase {
    exploreLocation(position: GridPosition): Promise<ExplorationResult>;
    getDiscoveriesInArea(center: GridPosition, radius: number): Promise<Discovery[]>;
    getExplorationProgress(position: GridPosition): Promise<number>;
    getExplorationSkills(): Promise<Map<string, number>>;
}

export class ExplorationUseCase implements IExplorationUseCase {
    constructor(
        private readonly explorationManager: ExplorationManager,
        private readonly worldRepository: any,  // Will be defined in infrastructure
        private readonly playerRepository: any  // Will be defined in infrastructure
    ) { }

    /**
     * Explore a location and return result + side effects
     * 
     * @remarks
     * **Pattern:** Pure function returns (result, effects[])
     * 
     * Effects generated:
     * - SaveGameEffect: Auto-save on successful exploration
     * - NotificationEffect: Show discoveries to player
     * - TriggerEventEffect: Fire exploration complete event
     * - UnlockContentEffect: Unlock newly discovered content
     */
    async exploreLocation(position: GridPosition): Promise<ExplorationResult> {
        const cell = await this.worldRepository.getCell(position);
        if (!cell) {
            throw new Error(`No cell found at position ${position.toString()}`);
        }

        const player = await this.playerRepository.getCurrentPlayer();
        const explorationSkills = player.getExplorationSkills();

        const result = this.explorationManager.exploreCell(cell, explorationSkills);

        if (result.type === 'success') {
            // Update player's exploration progress
            await this.updatePlayerProgress(player, result);

            // Generate effects from discoveries
            const effects: SideEffect[] = [];

            if (result.discoveries && result.discoveries.length > 0) {
                const discoveryEffects = await this.handleDiscoveriesWithEffects(result.discoveries);
                effects.push(...discoveryEffects);
            }

            // Always save on successful exploration
            effects.push({
                type: 'saveGame',
                timestamp: Date.now(),
                reason: 'exploration-complete'
            });

            // Trigger exploration event
            effects.push({
                type: 'triggerEvent',
                eventName: 'exploration.completed',
                data: { position: { x: position.x, y: position.y }, discoveries: result.discoveries?.length ?? 0 }
            });

            // Save updated state
            await this.worldRepository.save();
            await this.playerRepository.save(player);
        }

        return result;
    }

    async getDiscoveriesInArea(center: GridPosition, radius: number): Promise<Discovery[]> {
        const cells = await this.worldRepository.getCellsInRadius(center, radius);
        const discoveries: Discovery[] = [];

        for (const cell of cells) {
            const progress = this.explorationManager.getProgress();
            if (progress.revealedCells.has(cell.position.toString())) {
                const cellDiscoveries = Array.from(progress.discoveries.values())
                    .filter(d => this.isDiscoveryInCell(d, cell));
                discoveries.push(...cellDiscoveries);
            }
        }

        return discoveries;
    }

    async getExplorationProgress(position: GridPosition): Promise<number> {
        const region = await this.worldRepository.getRegionForPosition(position);
        const progress = this.explorationManager.getProgress();

        let exploredCells = 0;
        region.cells.forEach((cell: import('../entities/world').GridCell) => {
            if (progress.revealedCells.has(cell.position.toString())) {
                exploredCells++;
            }
        });

        return (exploredCells / region.cells.length) * 100;
    }

    async getExplorationSkills(): Promise<Map<string, number>> {
        const progress = this.explorationManager.getProgress();
        return progress.skillLevels;
    }

    private async updatePlayerProgress(player: any, result: ExplorationResult): Promise<void> {
        if (result.explorationPoints) {
            await player.addExplorationExperience(result.explorationPoints);
        }

        if (result.newSkillLevels) {
            for (const [skill, level] of result.newSkillLevels.entries()) {
                await player.setExplorationSkillLevel(skill, level);
            }
        }
    }

    private async handleDiscoveriesWithEffects(discoveries: Discovery[]): Promise<SideEffect[]> {
        /**
         * Generate side effects from discoveries
         *
         * @remarks
         * **Pattern:** Pure side effect generation
         * 
         * For each discovery type:
         * 1. Settlement → UnlockContentEffect + Notification
         * 2. Dungeon → UnlockContentEffect + Notification
         * 3. Artifact → UnlockContentEffect + Notification + ParticleEffect
         */
        const effects: SideEffect[] = [];

        for (const discovery of discoveries) {
            switch (discovery.type) {
                case DiscoveryType.SETTLEMENT:
                    effects.push(...this.generateSettlementEffects(discovery));
                    break;
                case DiscoveryType.DUNGEON:
                    effects.push(...this.generateDungeonEffects(discovery));
                    break;
                case DiscoveryType.ARTIFACT:
                    effects.push(...this.generateArtifactEffects(discovery));
                    break;
            }
        }

        return effects;
    }

    private generateSettlementEffects(discovery: Discovery): SideEffect[] {
        /**
         * Generate side effects for settlement discovery
         *
         * @remarks
         * Effects:
         * - UnlockContentEffect: Unlock settlement
         * - NotificationEffect: Show discovery message
         * - TriggerEventEffect: Fire settlement-discovered event
         */
        return [
            {
                type: 'unlockContent',
                contentType: 'area',
                contentId: discovery.id
            },
            {
                type: 'showNotification',
                message: `Discovered Settlement: ${discovery.name}`,
                duration: 4000,
                type_: 'success'
            },
            {
                type: 'triggerEvent',
                eventName: 'discovery.settlement',
                data: { settlementId: discovery.id, name: discovery.name }
            }
        ];
    }

    private generateDungeonEffects(discovery: Discovery): SideEffect[] {
        /**
         * Generate side effects for dungeon discovery
         *
         * @remarks
         * Effects:
         * - UnlockContentEffect: Unlock dungeon
         * - NotificationEffect: Show discovery message with difficulty
         * - TriggerEventEffect: Fire dungeon-discovered event
         */
        return [
            {
                type: 'unlockContent',
                contentType: 'area',
                contentId: discovery.id
            },
            {
                type: 'showNotification',
                message: `Discovered Dungeon: ${discovery.name}`,
                duration: 4000,
                type_: 'success'
            },
            {
                type: 'triggerEvent',
                eventName: 'discovery.dungeon',
                data: { dungeonId: discovery.id, name: discovery.name }
            }
        ];
    }

    private generateArtifactEffects(discovery: Discovery): SideEffect[] {
        /**
         * Generate side effects for artifact discovery
         *
         * @remarks
         * Effects:
         * - UnlockContentEffect: Unlock artifact knowledge
         * - NotificationEffect: Show special discovery message
         * - ParticleEffect: Sparkle/glow animation at discovery location
         * - TriggerEventEffect: Fire artifact-discovered event
         * - PlayAudioEffect: Special sound cue
         */
        const effects: SideEffect[] = [
            {
                type: 'unlockContent',
                contentType: 'artifact',
                contentId: discovery.id
            },
            {
                type: 'showNotification',
                message: `Discovered Artifact: ${discovery.name}!`,
                duration: 5000,
                type_: 'success'
            },
            {
                type: 'triggerEvent',
                eventName: 'discovery.artifact',
                data: { artifactId: discovery.id, name: discovery.name }
            },
            {
                type: 'playAudio',
                sound: 'artifact-discovery',
                volume: 0.8
            }
        ];

        // Add particle effect if position available
        if (discovery.position) {
            effects.push({
                type: 'spawnParticle',
                particleType: 'magic_sparkles',
                position: { x: discovery.position.x, y: discovery.position.y },
                count: 20,
                duration: 1500
            });
        }

        return effects;
    }

    private generateDungeonMonsters(difficulty: number, count: number): DungeonMonster[] {
        /**
         * generateDungeonMonsters
         *
         * Create monster spawn list for dungeon based on difficulty.
         *
         * @remarks
         * **Logic:**
         * 1. Difficulty levels map to monster types (goblin→2, slime→2, dragon→25)
         * 2. Select monsters within difficulty band (±5 levels of dungeon)
         * 3. Level monsters relative to difficulty (level = difficulty / 3)
         * 4. Generate loot based on monster type
         *
         * @param {number} difficulty - The dungeon's difficulty level
         * @param {number} count - Number of monsters to spawn
         * @returns {DungeonMonster[]} Array of typed dungeon monster definitions
         */
        const monsterList = [
            { name: 'goblin', baseDifficulty: 3 },
            { name: 'slime', baseDifficulty: 2 },
            { name: 'wolf', baseDifficulty: 5 },
            { name: 'spider', baseDifficulty: 6 },
            { name: 'orc', baseDifficulty: 10 },
            { name: 'stone_golem', baseDifficulty: 12 },
            { name: 'demon', baseDifficulty: 18 },
            { name: 'dragon', baseDifficulty: 25 }
        ];

        const spawns: DungeonMonster[] = [];
        for (let i = 0; i < count; i++) {
            // Select monsters appropriate for difficulty
            const viableMonsters = monsterList.filter(m => m.baseDifficulty <= difficulty);
            const monster = viableMonsters[Math.floor(Math.random() * viableMonsters.length)] || monsterList[0];

            const spawn: DungeonMonster = {
                id: `${monster.name}_${i}`,
                creatureType: monster.name,
                level: Math.ceil(difficulty / 3),
                health: 20 + difficulty * 2,
                loot: this.generateMonsterLoot(monster.name, difficulty)
            };
            spawns.push(spawn);
        }

        return spawns;
    }

    private generateMonsterLoot(monsterType: string, difficulty: number): unknown[] {
        /**
         * generateMonsterLoot
         *
         * Generate loot table for monster type based on difficulty.
         *
         * @remarks
         * **Logic:**
         * Maps monster type to base loot table with item IDs, drop chances, and quantities
         */
        const baseLootTables: { [key: string]: unknown[] } = {
            goblin: [
                { itemId: 'copper_coin', chance: 0.7, quantity: { min: 1, max: 5 } },
                { itemId: 'torn_cloth', chance: 0.3, quantity: { min: 1, max: 1 } }
            ],
            slime: [
                { itemId: 'slime_gel', chance: 0.8, quantity: { min: 1, max: 2 } },
                { itemId: 'healing_herb', chance: 0.2, quantity: { min: 1, max: 1 } }
            ],
            wolf: [
                { itemId: 'wolf_fang', chance: 0.6, quantity: { min: 1, max: 2 } },
                { itemId: 'leather_armor_scrap', chance: 0.4, quantity: { min: 1, max: 1 } }
            ],
            spider: [
                { itemId: 'spider_silk', chance: 0.7, quantity: { min: 1, max: 3 } }
            ],
            orc: [
                { itemId: 'orcish_weapon', chance: 0.5, quantity: { min: 1, max: 1 } },
                { itemId: 'iron_ore', chance: 0.6, quantity: { min: 2, max: 5 } }
            ],
            stone_golem: [
                { itemId: 'golem_core', chance: 0.4, quantity: { min: 1, max: 1 } },
                { itemId: 'granite', chance: 0.7, quantity: { min: 3, max: 8 } }
            ],
            demon: [
                { itemId: 'demon_heart', chance: 0.3, quantity: { min: 1, max: 1 } },
                { itemId: 'cursed_gem', chance: 0.5, quantity: { min: 1, max: 2 } }
            ],
            dragon: [
                { itemId: 'dragon_scale', chance: 0.8, quantity: { min: 5, max: 10 } },
                { itemId: 'dragon_tooth', chance: 0.6, quantity: { min: 2, max: 4 } }
            ]
        };

        return baseLootTables[monsterType] || [];
    }

    private async checkArtifactSetBonuses(player: any): Promise<void> {
        /**
         * checkArtifactSetBonuses
         *
         * Verify if player has completed artifact sets.
         *
         * @remarks
         * **Logic:**
         * - "Elemental Set" (Fire Gem, Ice Crystal, Storm Core)
         * - "Ancient Set" (Ancient Tome, Ancient Scroll, Ancient Artifact)
         * - When complete, log entry and unlock bonuses
         */
        if (!player.artifactCollection) return;

        const artifactIds = player.artifactCollection.map((a: any) => a.itemId);

        // Define artifact sets
        const sets = [
            {
                name: 'Elemental Set',
                required: ['fire_gem', 'ice_crystal', 'storm_core'],
                bonus: { intelligence: 10, magicalAttack: 5 }
            },
            {
                name: 'Ancient Set',
                required: ['ancient_tome', 'ancient_scroll', 'ancient_artifact'],
                bonus: { intelligence: 15, wisdom: 10 }
            }
        ];

        for (const set of sets) {
            const hasAll = set.required.every(id => artifactIds.includes(id));
            if (hasAll && !player.unlockedArtifactSets?.includes(set.name)) {
                if (!player.unlockedArtifactSets) {
                    player.unlockedArtifactSets = [];
                }
                player.unlockedArtifactSets.push(set.name);

                // Log achievement
                await this.addJournalEntry(
                    `Artifact Set Completed: ${set.name}`,
                    `You have collected all artifacts in the ${set.name}. Special bonuses have been unlocked!`
                );
            }
        }
    }

    private addJournalEntry(title: string, text: string): Promise<void> {
        /**
         * Helper to add a journal entry for the player.
         */
        const player = this.playerRepository.getCurrentPlayer();
        if (!player) return Promise.resolve();

        if (!player.journal) {
            player.journal = [];
        }

        player.journal.push({
            timestamp: new Date(),
            title,
            text
        });

        return this.playerRepository.save(player);
    }

    private isDiscoveryInCell(discovery: Discovery, cell: GridCell): boolean {
        /**
         * isDiscoveryInCell
         *
         * Verify if a discovery belongs to a specific grid cell.
         *
         * @remarks
         * **Logic:**
         * 1. Direct position match: discovery.position === cell.position
         * 2. Area check: If discovery.areaRadius, check distance ≤ radius
         *
         * @param {Discovery} discovery - The discovery to check
         * @param {GridCell} cell - The cell to check against
         * @returns {boolean} True if discovery belongs to this cell
         */
        if (!discovery || !cell) return false;

        const cellPosX = (cell.position as any)?.x ?? 0;
        const cellPosY = (cell.position as any)?.y ?? 0;

        // Direct position match
        if (discovery.position &&
            discovery.position.x === cellPosX &&
            discovery.position.y === cellPosY) {
            return true;
        }

        // If discovery has an area, check if cell is within bounds
        if (discovery.areaRadius && discovery.position) {
            const dx = discovery.position.x - cellPosX;
            const dy = discovery.position.y - cellPosY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= discovery.areaRadius;
        }

        return false;
    }
}
