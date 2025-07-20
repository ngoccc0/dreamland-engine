import { GridPosition } from '../values/grid-position';
import { GridCell } from './grid-cell';
import { TranslatableString } from '../types/i18n';

export enum DiscoveryType {
    LANDMARK = 'landmark',
    RESOURCE = 'resource',
    SETTLEMENT = 'settlement',
    DUNGEON = 'dungeon',
    ARTIFACT = 'artifact',
    SECRET = 'secret'
}

export enum ExplorationDifficulty {
    EASY = 'easy',
    NORMAL = 'normal',
    HARD = 'hard',
    EXTREME = 'extreme',
    LEGENDARY = 'legendary'
}

export interface Discovery {
    id: string;
    type: DiscoveryType;
    name: TranslatableString;
    description: TranslatableString;
    difficulty: ExplorationDifficulty;
    rewards?: {
        experience: number;
        items?: string[];
        unlocks?: string[];
    };
}

export interface ExplorationProgress {
    revealedCells: Set<string>;
    discoveries: Map<string, Discovery>;
    completedDiscoveries: Set<string>;
    totalExplorationScore: number;
    skillLevels: Map<string, number>;
}

export class ExplorationManager {
    private _progress: ExplorationProgress;
    private _activeCells: Map<string, GridCell>;
    private _discoveryChances: Map<string, number>;

    constructor() {
        this._progress = {
            revealedCells: new Set(),
            discoveries: new Map(),
            completedDiscoveries: new Set(),
            totalExplorationScore: 0,
            skillLevels: new Map([
                ['tracking', 1],
                ['survival', 1],
                ['archaeology', 1],
                ['naturalism', 1]
            ])
        };
        this._activeCells = new Map();
        this._discoveryChances = new Map();
    }

    exploreCell(cell: GridCell, explorationSkills: Map<string, number>): ExplorationResult {
        if (this._progress.revealedCells.has(cell.position.toString())) {
            return { type: 'already_explored', discoveries: [] };
        }

        this._progress.revealedCells.add(cell.position.toString());
        this._activeCells.set(cell.position.toString(), cell);

        const discoveries = this.checkForDiscoveries(cell, explorationSkills);
        const explorationPoints = this.calculateExplorationPoints(cell, discoveries);
        
        this._progress.totalExplorationScore += explorationPoints;
        
        return {
            type: 'success',
            discoveries,
            explorationPoints,
            newSkillLevels: this.updateSkillLevels(discoveries)
        };
    }

    private checkForDiscoveries(cell: GridCell, skills: Map<string, number>): Discovery[] {
        const discoveries: Discovery[] = [];
        const baseChance = this.calculateBaseDiscoveryChance(cell);

        // Check each discovery type based on cell attributes and skills
        if (this.rollForDiscovery(baseChance * cell.attributes.magicAffinity / 100, skills.get('archaeology') || 1)) {
            discoveries.push(this.generateDiscovery(DiscoveryType.ARTIFACT, cell));
        }

        if (this.rollForDiscovery(baseChance * cell.attributes.humanPresence / 100, skills.get('archaeology') || 1)) {
            discoveries.push(this.generateDiscovery(DiscoveryType.SETTLEMENT, cell));
        }

        if (this.rollForDiscovery(baseChance * cell.attributes.dangerLevel / 100, skills.get('survival') || 1)) {
            discoveries.push(this.generateDiscovery(DiscoveryType.DUNGEON, cell));
        }

        if (this.rollForDiscovery(baseChance * cell.attributes.vegetationDensity / 100, skills.get('naturalism') || 1)) {
            discoveries.push(this.generateDiscovery(DiscoveryType.RESOURCE, cell));
        }

        return discoveries;
    }

    private calculateBaseDiscoveryChance(cell: GridCell): number {
        const key = cell.position.toString();
        if (!this._discoveryChances.has(key)) {
            // Base chance affected by cell attributes
            let chance = 0.1; // 10% base chance
            chance *= (cell.attributes.explorability / 100);
            chance *= (1 - (this.getNeighborExploredCount(cell.position) * 0.1)); // Reduced chance if neighbors explored
            this._discoveryChances.set(key, chance);
        }
        return this._discoveryChances.get(key)!;
    }

    private rollForDiscovery(chance: number, skillLevel: number): boolean {
        const skillBonus = (skillLevel - 1) * 0.05; // 5% bonus per skill level
        return Math.random() < (chance + skillBonus);
    }

    private generateDiscovery(type: DiscoveryType, cell: GridCell): Discovery {
        const id = `${type}_${cell.position.toString()}_${Date.now()}`;
        const discovery: Discovery = {
            id,
            type,
            name: { key: `discovery.${type}.name` },
            description: { key: `discovery.${type}.description` },
            difficulty: this.calculateDifficulty(cell),
            rewards: {
                experience: this.calculateExperienceReward(type, cell),
                items: this.generateRewardItems(type, cell),
                unlocks: this.generateUnlocks(type, cell)
            }
        };

        this._progress.discoveries.set(id, discovery);
        return discovery;
    }

    private calculateDifficulty(cell: GridCell): ExplorationDifficulty {
        const difficultyScore = 
            (cell.attributes.dangerLevel * 0.4) +
            (cell.attributes.travelCost * 0.3) +
            ((100 - cell.attributes.explorability) * 0.3);

        if (difficultyScore >= 90) return ExplorationDifficulty.LEGENDARY;
        if (difficultyScore >= 75) return ExplorationDifficulty.EXTREME;
        if (difficultyScore >= 50) return ExplorationDifficulty.HARD;
        if (difficultyScore >= 25) return ExplorationDifficulty.NORMAL;
        return ExplorationDifficulty.EASY;
    }

    private calculateExperienceReward(type: DiscoveryType, cell: GridCell): number {
        const baseXP = {
            [DiscoveryType.LANDMARK]: 100,
            [DiscoveryType.RESOURCE]: 50,
            [DiscoveryType.SETTLEMENT]: 150,
            [DiscoveryType.DUNGEON]: 200,
            [DiscoveryType.ARTIFACT]: 250,
            [DiscoveryType.SECRET]: 300
        }[type];

        const difficultyMultiplier = {
            [ExplorationDifficulty.EASY]: 1,
            [ExplorationDifficulty.NORMAL]: 1.5,
            [ExplorationDifficulty.HARD]: 2,
            [ExplorationDifficulty.EXTREME]: 3,
            [ExplorationDifficulty.LEGENDARY]: 5
        }[this.calculateDifficulty(cell)];

        return Math.floor(baseXP * difficultyMultiplier);
    }

    private generateRewardItems(type: DiscoveryType, cell: GridCell): string[] {
        // This would be implemented to generate appropriate rewards based on discovery type and cell attributes
        return [];
    }

    private generateUnlocks(type: DiscoveryType, cell: GridCell): string[] {
        // This would be implemented to generate appropriate unlocks based on discovery type and cell attributes
        return [];
    }

    private calculateExplorationPoints(cell: GridCell, discoveries: Discovery[]): number {
        let points = cell.attributes.explorability;
        discoveries.forEach(discovery => {
            points += {
                [DiscoveryType.LANDMARK]: 50,
                [DiscoveryType.RESOURCE]: 30,
                [DiscoveryType.SETTLEMENT]: 100,
                [DiscoveryType.DUNGEON]: 150,
                [DiscoveryType.ARTIFACT]: 200,
                [DiscoveryType.SECRET]: 250
            }[discovery.type];
        });
        return points;
    }

    private updateSkillLevels(discoveries: Discovery[]): Map<string, number> {
        const skillGains = new Map<string, number>();
        
        discoveries.forEach(discovery => {
            switch (discovery.type) {
                case DiscoveryType.ARTIFACT:
                    this.gainSkillExp('archaeology', 10);
                    break;
                case DiscoveryType.RESOURCE:
                    this.gainSkillExp('naturalism', 10);
                    break;
                case DiscoveryType.DUNGEON:
                    this.gainSkillExp('survival', 10);
                    break;
            }
        });

        return this._progress.skillLevels;
    }

    private gainSkillExp(skill: string, amount: number): void {
        const currentLevel = this._progress.skillLevels.get(skill) || 1;
        const expNeeded = Math.floor(100 * Math.pow(1.5, currentLevel - 1));
        
        if (amount >= expNeeded) {
            this._progress.skillLevels.set(skill, currentLevel + 1);
        }
    }

    private getNeighborExploredCount(position: GridPosition): number {
        let count = 0;
        const neighbors = [
            new GridPosition(position.x + 1, position.y),
            new GridPosition(position.x - 1, position.y),
            new GridPosition(position.x, position.y + 1),
            new GridPosition(position.x, position.y - 1)
        ];

        neighbors.forEach(pos => {
            if (this._progress.revealedCells.has(pos.toString())) {
                count++;
            }
        });

        return count;
    }

    getProgress(): ExplorationProgress {
        return {
            ...this._progress,
            revealedCells: new Set(this._progress.revealedCells),
            discoveries: new Map(this._progress.discoveries),
            completedDiscoveries: new Set(this._progress.completedDiscoveries),
            skillLevels: new Map(this._progress.skillLevels)
        };
    }
}

export interface ExplorationResult {
    type: 'success' | 'already_explored';
    discoveries?: Discovery[];
    explorationPoints?: number;
    newSkillLevels?: Map<string, number>;
}
