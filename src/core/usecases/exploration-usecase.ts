import { ExplorationManager, ExplorationResult, Discovery, DiscoveryType } from '../entities/exploration';
import { GridPosition } from '../values/grid-position';
import { GridCell } from '../entities/world';

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
    ) {}

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
        // Implement settlement-specific logic
        // e.g., Update world map, trigger quest opportunities, etc.
    }

    private async handleDungeonDiscovery(discovery: Discovery): Promise<void> {
        // Implement dungeon-specific logic
        // e.g., Generate dungeon layout, populate with monsters, etc.
    }

    private async handleArtifactDiscovery(discovery: Discovery): Promise<void> {
        // Implement artifact-specific logic
        // e.g., Add to player's collection, trigger related quests, etc.
    }

    private isDiscoveryInCell(discovery: Discovery, cell: GridCell): boolean {
        // Implementation would check if the discovery belongs to the given cell
        return true; // Placeholder
    }
}
