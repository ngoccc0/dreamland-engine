import { ExplorationManager, ExplorationResult, Discovery, DiscoveryType } from '../entities/exploration';
import { GridPosition } from '../values/grid-position';
import { GridCell } from '../entities/world';
import type { DiscoveredSettlement, UnlockedNPC, DungeonMonster } from '../types/game';
import {
    random,
    randomInt,
    weightedRandom,
} from '@/core/rules/rng';

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

            // Check for special discoveries that might trigger events
            if (result.discoveries && result.discoveries.length > 0) {
                await this.handleDiscoveries(result.discoveries);
            }

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

    private async handleDiscoveries(discoveries: Discovery[]): Promise<void> {
        for (const discovery of discoveries) {
            switch (discovery.type) {
                case DiscoveryType.SETTLEMENT:
                    await this.handleSettlementDiscovery(discovery);
                    break;
                case DiscoveryType.DUNGEON:
                    await this.handleDungeonDiscovery(discovery);
                    break;
                case DiscoveryType.ARTIFACT:
                    await this.handleArtifactDiscovery(discovery);
                    break;
            }
        }
    }

    private async handleSettlementDiscovery(discovery: Discovery): Promise<void> {
        /**
         * handleSettlementDiscovery
         *
         * Process discovery of a new settlement (village, town, outpost).
         *
         * @remarks
         * Effects:
         * - Update world map to show settlement location
         * - Unlock settlement NPCs and merchants
         * - Make quests available
         * - Add settlement to discovered locations journal
         *
         * Logic:
         * 1. Mark settlement as discovered in world state
         * 2. Unlock NPCs at this location
         * 3. Make quest opportunities available
         * 4. Log in player journal
         */
        if (!discovery) return;

        // Update world map
        const worldState = await this.worldRepository.getWorldState();
        if (!worldState) return;

        // Mark settlement as discovered
        if (!worldState.discoveredSettlements) {
            worldState.discoveredSettlements = [];
        }
        const settlement: DiscoveredSettlement = {
            id: discovery.id,
            name: discovery.name,
            position: discovery.position,
            type: 'settlement',
            discoveredAt: new Date().toISOString()
        };
        worldState.discoveredSettlements.push(settlement);

        // Unlock NPCs at this settlement
        const npcUnlocks: UnlockedNPC[] = [
            {
                npcId: `${discovery.id}_merchant`,
                name: discovery.name,
                role: 'merchant',
                settlementId: discovery.id,
                position: discovery.position,
                unlockedAt: new Date().toISOString()
            },
            {
                npcId: `${discovery.id}_questgiver`,
                name: discovery.name,
                role: 'quest_giver',
                settlementId: discovery.id,
                position: discovery.position,
                unlockedAt: new Date().toISOString()
            }
        ];

        if (!worldState.unlockedNPCs) {
            worldState.unlockedNPCs = [];
        }
        worldState.unlockedNPCs.push(...npcUnlocks);

        // Add to journal
        await this.addJournalEntry(
            `Discovered Settlement: ${discovery.name}`,
            `Found a new settlement at your position. Local NPCs and merchants are now available.`
        );

        await this.worldRepository.saveWorldState(worldState);
    }

    private async handleDungeonDiscovery(discovery: Discovery): Promise<void> {
        /**
         * handleDungeonDiscovery
         *
         * Process discovery of a new dungeon/cave/ruins.
         *
         * @remarks
         * Effects:
         * - Add dungeon to world map
         * - Generate dungeon layout (if applicable)
         * - Populate with enemies based on player level
         * - Make dungeon explorable
         *
         * Logic:
         * 1. Mark dungeon as discovered
         * 2. Generate dungeon layout (depth, difficulty)
         * 3. Place monsters at appropriate levels
         * 4. Add loot tables
         */
        if (!discovery) return;

        const worldState = await this.worldRepository.getWorldState();
        if (!worldState) return;

        // Calculate dungeon difficulty based on player level
        const player = await this.playerRepository.getCurrentPlayer();
        const playerLevel = player?.level ?? 1;
        const dungeonDifficulty = Math.ceil(playerLevel * 1.2); // Slightly harder than player

        // Generate initial monster spawns with typed structure
        const monsterSpawns = this.generateDungeonMonsters(dungeonDifficulty, 3 + Math.floor(playerLevel / 10));
        if (!worldState.dungeonMonsters) {
            worldState.dungeonMonsters = {};
        }
        worldState.dungeonMonsters[discovery.id] = monsterSpawns;

        // Add to journal
        await this.addJournalEntry(
            `Discovered Dungeon: ${discovery.name}`,
            `Found a dungeon of difficulty level ${dungeonDifficulty}. It may contain valuable loot and challenging enemies.`
        );

        await this.worldRepository.saveWorldState(worldState);
    }

    private async handleArtifactDiscovery(discovery: Discovery): Promise<void> {
        /**
         * handleArtifactDiscovery
         *
         * Process discovery of a magical artifact or special item.
         *
         * @remarks
         * Effects:
         * - Add artifact to player's collection
         * - Unlock related quests
         * - Trigger special events
         * - Grant bonus attributes
         *
         * Logic:
         * 1. Create artifact item instance
         * 2. Add to player inventory
         * 3. Check for artifact sets/collections
         * 4. Trigger associated quests
         */
        if (!discovery) return;

        const player = await this.playerRepository.getCurrentPlayer();
        if (!player) return;

        const discoveryAny = discovery as any;

        // Create artifact item
        const artifact = {
            itemId: discovery.id,
            name: discovery.name,
            tier: 5 + Math.floor(Math.random() * 2), // Tier 5-6 for artifacts
            grade: Math.floor(Math.random() * 3), // Random grade 0-2
            quantity: 1,
            type: 'artifact',
            rarity: 'legendary',
            discoveredAt: new Date(),
            position: discoveryAny.position
        };

        // Add to player inventory
        if (!player.artifactCollection) {
            player.artifactCollection = [];
        }
        player.artifactCollection.push(artifact);

        // Check for artifact set bonuses
        await this.checkArtifactSetBonuses(player);

        // Add to journal
        await this.addJournalEntry(
            `Discovered Artifact: ${discovery.name}`,
            `Found a legendary artifact! This may unlock new abilities or quests.`
        );

        // Trigger related quests
        const player_id = player.id;
        const artifactQuests = await this.worldRepository.getQuestsFor('artifact_discovery', discovery.id);
        if (artifactQuests && artifactQuests.length > 0) {
            await this.worldRepository.makeQuestsAvailable(player_id, artifactQuests);
        }

        await this.playerRepository.save(player);
    }

    private generateDungeonMonsters(difficulty: number, count: number): DungeonMonster[] {
        /**
         * generateDungeonMonsters
         *
         * Create monster spawn list for dungeon based on difficulty.
         *
         * @remarks
         * Difficulty scaling:
         * - Difficulty 5: Goblins, Slimes (easy)
         * - Difficulty 10: Wolves, Spiders (medium)
         * - Difficulty 15: Orc Shamans, Stone Golems (hard)
         * - Difficulty 20+: Demons, Dragons (very hard)
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

    private async checkArtifactSetBonuses(player: any): Promise<void> {
        /**
         * checkArtifactSetBonuses
         *
         * Check if player has collected artifact sets and apply bonuses.
         *
         * @remarks
         * Example sets:
         * - "Elemental Set" (Fire Gem, Ice Crystal, Storm Core)
         * - "Ancient Set" (Ancient Tome, Ancient Scroll, Ancient Artifact)
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

    private generateMonsterLoot(monsterType: string, difficulty: number): any[] {
        /**
         * generateMonsterLoot
         *
         * Generate loot table for monster type based on difficulty.
         */
        const baseLootTables: { [key: string]: any[] } = {
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

    private async addJournalEntry(title: string, text: string): Promise<void> {
        /**
         * Helper to add a journal entry for the player.
         */
        const player = await this.playerRepository.getCurrentPlayer();
        if (!player) return;

        if (!player.journal) {
            player.journal = [];
        }

        player.journal.push({
            timestamp: new Date(),
            title,
            text
        });

        await this.playerRepository.save(player);
    }

    private isDiscoveryInCell(discovery: Discovery, cell: GridCell): boolean {
        /**
         * isDiscoveryInCell
         *
         * Verify if a discovery belongs to a specific grid cell.
         *
         * @remarks
         * This checks if the discovery's position matches the cell's position
         * or falls within the cell's area (for multi-cell discoveries).
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
