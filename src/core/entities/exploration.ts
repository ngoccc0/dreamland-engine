import { GridPosition } from '../values/grid-position';
import { GridCell } from './grid-cell';
import type { TranslatableString } from '../types/i18n';

/**
 * OVERVIEW: Exploration discovery system
 *
 * Manages world discoveries (landmarks, resources, dungeons, artifacts, secrets) that players
 * find while exploring. Each discovery has type, difficulty, location, and rewards.
 * Supports discovery tracking, duplicate prevention, and player progression gates.
 *
 * ## Discovery Types (DiscoveryType)
 *
 * Six categories of discoverable locations:
 *
 * | Type | Description | Example | Rewards | Notes |
 * |------|-------------|---------|---------|-------|
 * | LANDMARK | Notable geographic feature | Mountain Peak, Waterfall | 10-50 XP | Safe, visual |
 * | RESOURCE | Valuable material source | Ore Deposit, Herb Field | 20-100 XP + materials | Respawns over time |
 * | SETTLEMENT | Populated area or ruin | Village, Ancient Ruins | 50-200 XP + NPC access | Quests/NPCs |
 * | DUNGEON | Dangerous challenge area | Goblin Cave, Lost Temple | 100-500 XP + rare loot | Combat required |
 * | ARTIFACT | Rare/unique item location | Legendary Sword Altar | 200+ XP + artifact | Quest-gated |
 * | SECRET | Hidden area or lore | Enchanted Grove, Map Easter Egg | 50-300 XP + knowledge | Difficult to find |
 *
 * ## Difficulty Levels (ExplorationDifficulty)
 *
 * Five-tier difficulty system gating rewards and accessibility:
 *
 * | Level | Description | Suggested Level | Combat? | XP Multiplier | Item Rarity |
 * |-------|-------------|-----------------|---------|---------------|-------------|
 * | EASY | Open to all, walk-in discovery | 1+ | No | 1.0× | Common |
 * | NORMAL | Moderate challenge | 5+ | Optional | 1.3× | Uncommon |
 * | HARD | Real danger, skills needed | 15+ | Likely | 1.8× | Rare |
 * | EXTREME | Very dangerous, group content | 25+ | Required | 2.5× | Epic |
 * | LEGENDARY | Peak difficulty, solo challenge | 35+ | Required | 3.5× | Legendary |
 *
 * ### Progression Gates
 *
 * ```
 * if player.level < discovery.recommendedLevel:
 *   apply damage multiplier: 1 + (recommendedLevel - player.level) × 0.2
 *   apply XP penalty: final = base × 0.5
 * elif player.level > discovery.recommendedLevel + 5:
 *   apply XP penalty: final = base × 0.8^(player.level - recommendation)
 * ```
 *
 * ## Discovery Interface (Discovery)
 *
 * Complete discovery definition:
 *
 * ```typescript
 * interface Discovery {
 *   id: string,                 // Unique identifier (e.g., 'goblin_cave_01')
 *   type: DiscoveryType,        // LANDMARK, RESOURCE, etc.
 *   name: TranslatableString,   // Localized name (EN/VI)
 *   description: TranslatableString, // Localized description with lore
 *   difficulty: ExplorationDifficulty, // Challenge level
 *   location: GridPosition,     // Map coordinates
 *   rewards: {
 *     experience: number,       // XP granted
 *     items?: string[],         // Item IDs dropped
 *     unlocks?: string[],       // Features/quests unlocked
 *   },
 *   enemies?: string[],         // Creature types present
 *   requirements?: {            // Optional gates
 *     minLevel?: number,
 *     questId?: string,
 *     items?: string[],
 *   }
 * }
 * ```
 *
 * ## Discovery Examples
 *
 * ### Example 1: LANDMARK (Waterfall)
 * ```typescript
 * {
 *   id: 'waterfall_spring',
 *   type: DiscoveryType.LANDMARK,
 *   name: {en: 'Crystal Waterfall', vi: 'Thác nước Tinh thể'},
 *   difficulty: ExplorationDifficulty.EASY,
 *   location: {x: 5, y: 12},
 *   rewards: {experience: 20},
 *   description: 'A serene waterfall with healing properties',
 *   requirements: {minLevel: 1}  // Open to all
 * }
 * ```
 * - No combat, just walk there
 * - Small XP reward
 * - Available immediately
 *
 * ### Example 2: RESOURCE (Ore Field)
 * ```typescript
 * {
 *   id: 'iron_ore_deposit_north',
 *   type: DiscoveryType.RESOURCE,
 *   name: {en: 'Iron Ore Field', vi: 'Mỏ sắt'},
 *   difficulty: ExplorationDifficulty.NORMAL,
 *   location: {x: 20, y: 8},
 *   rewards: {
 *     experience: 50,
 *     items: ['iron_ore', 'iron_ore', 'copper_ore']
 *   },
 *   requirements: {minLevel: 5}
 * }
 * ```
 * - Limited combat (maybe 1-2 mobs)
 * - Resources respawn weekly
 * - Travel time moderate
 *
 * ### Example 3: DUNGEON (Goblin Cave)
 * ```typescript
 * {
 *   id: 'goblin_cave_west',
 *   type: DiscoveryType.DUNGEON,
 *   name: {en: 'Goblin\'s Lair', vi: 'Hang ổ Goblin'},
 *   difficulty: ExplorationDifficulty.HARD,
 *   location: {x: -15, y: 30},
 *   rewards: {
 *     experience: 200,
 *     items: ['goblin_spear', 'crude_armor', 'emerald', 'gemstone'],
 *     unlocks: ['goblin_crafting_recipes']
 *   },
 *   enemies: ['goblin_warrior', 'goblin_shaman', 'goblin_boss'],
 *   requirements: {minLevel: 15, items: ['silver_sword']}
 * }
 * ```
 * - Boss fight required
 * - 3-5 combat encounters
 * - High risk/reward
 * - Special equipment recommended
 *
 * ### Example 4: ARTIFACT (Legendary Sword)
 * ```typescript
 * {
 *   id: 'excalibur_statue',
 *   type: DiscoveryType.ARTIFACT,
 *   name: {en: 'Excalibur Statue', vi: 'Bức tượng Excalibur'},
 *   difficulty: ExplorationDifficulty.EXTREME,
 *   location: {x: 0, y: 0},
 *   rewards: {
 *     experience: 500,
 *     items: ['excalibur_sword'],
 *     unlocks: ['ultimate_warrior_skill']
 *   },
 *   enemies: ['cursed_knight', 'cursed_knight', 'cursed_knight_elite'],
 *   requirements: {
 *     minLevel: 30,
 *     questId: 'sword_legend_quest',
 *     items: ['holy_water', 'ancient_scroll']
 *   }
 * }
 * ```
 * - Multiple story gates
 * - Dangerous bosses
 * - Most powerful reward
 * - End-game content
 *
 * ## Exploration State Machine
 *
 * ```
 * NOT_DISCOVERED
 *   ├─ [Enter area] → IN_PROGRESS
 *   └─ [Requirements unmet] → BLOCKED
 *
 * IN_PROGRESS
 *   ├─ [Defeat enemies] → COMPLETED
 *   └─ [Flee] → NOT_DISCOVERED (not yet)
 *
 * COMPLETED
 *   ├─ [Visit again] → REVISIT_AVAILABLE
 *   └─ [Resources respawned] → IN_PROGRESS
 *
 * BLOCKED
 *   ├─ [Gain level/item/quest] → IN_PROGRESS
 *   └─ [Time passes] → remains BLOCKED
 * ```
 *
 * ## XP Reward Calculation
 *
 * ```
 * baseXP = discovery.rewards.experience
 *
 * if player.level < discovery.minLevel:
 *   xp = baseXP × 0.5  (penalty for underlevel)
 * elif player.level > discovery.minLevel + 10:
 *   xp = baseXP × 0.7  (penalty for overlevel)
 * else:
 *   xp = baseXP  (base reward)
 *
 * if difficulty == EXTREME:
 *   xp *= 1.5  (bonus for hard content)
 * ```
 *
 * ## Design Philosophy
 *
 * - **Type Diversity**: Multiple discovery types create exploration goals
 * - **Difficulty Scaling**: Progressively challenging content over 30+ levels
 * - **Location-Based**: Discoveries tied to map coordinates reward exploration
 * - **Replayability**: Resources respawn, tough dungeons provide repeated challenge
 * - **Story Integration**: Quests and unlocks connect discoveries to narrative
 * - **Accessibility + Depth**: Easy discoveries for casual play, secrets for completionists
 *
 */
export enum DiscoveryType {
    LANDMARK = 'landmark',    // A notable geographical or structural feature.
    RESOURCE = 'resource',    // A source of valuable materials.
    SETTLEMENT = 'settlement',// A populated area or ruin.
    DUNGEON = 'dungeon',      // A dangerous area with challenges and rewards.
    ARTIFACT = 'artifact',    // A rare or unique item of significance.
    SECRET = 'secret'         // A hidden area or piece of lore.
}

/**
 * Defines the difficulty levels for exploration and discoveries.
 */
export enum ExplorationDifficulty {
    EASY = 'easy',
    NORMAL = 'normal',
    HARD = 'hard',
    EXTREME = 'extreme',
    LEGENDARY = 'legendary'
}

/**
 * Represents a single discovery made during exploration.
 */
export interface Discovery {
    /** Unique identifier for the discovery. */
    id: string;
    /** The type of discovery. */
    type: DiscoveryType;
    /** The multilingual name of the discovery. */
    name: TranslatableString;
    /** The multilingual description of the discovery. */
    description: TranslatableString;
    /** The difficulty associated with making or interacting with this discovery. */
    difficulty: ExplorationDifficulty;
    /** Optional: Rewards obtained upon making this discovery. */
    rewards?: {
        /** Experience points gained. */
        experience: number;
        /** Optional: List of item IDs obtained. */
        items?: string[];
        /** Optional: List of features or recipes unlocked. */
        unlocks?: string[];
    };
}

/**
 * Tracks the player's overall exploration progress and discoveries.
 */
export interface ExplorationProgress {
    /** A set of string representations of {@link GridPosition} for cells that have been revealed. */
    revealedCells: Set<string>;
    /** A map of all discoveries made, indexed by their ID. */
    discoveries: Map<string, Discovery>;
    /** A set of IDs for discoveries that have been fully completed or resolved. */
    completedDiscoveries: Set<string>;
    /** The total cumulative score from all exploration activities. */
    totalExplorationScore: number;
    /** A map of exploration-related skill levels, indexed by skill name. */
    skillLevels: Map<string, number>;
}

/**
 * Manages the player's exploration activities, including revealing cells,
 * discovering points of interest, and tracking exploration-related skills.
 */
export class ExplorationManager {
    private _progress: ExplorationProgress;
    private _activeCells: Map<string, GridCell>;
    private _discoveryChances: Map<string, number>;

    /**
     * Creates an instance of ExplorationManager.
     */
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

    /**
     * Explores a given grid cell, updating exploration progress and checking for new discoveries.
     * @param cell - The {@link GridCell} to explore.
     * @param explorationSkills - A map of the player's current exploration skill levels.
     * @returns An {@link ExplorationResult} detailing the outcome of the exploration.
     */
    exploreCell(cell: GridCell, explorationSkills: Map<string, number>): ExplorationResult {
        // If the cell has already been revealed, return 'already_explored' type.
        if (this._progress.revealedCells.has(cell.position.toString())) {
            return { type: 'already_explored', discoveries: [] };
        }

        // Mark the cell as revealed and add it to active cells.
        this._progress.revealedCells.add(cell.position.toString());
        this._activeCells.set(cell.position.toString(), cell);

        // Check for new discoveries within the cell.
        const discoveries = this.checkForDiscoveries(cell, explorationSkills);
        // Calculate exploration points gained from this action.
        const explorationPoints = this.calculateExplorationPoints(cell, discoveries);

        // Add points to total exploration score.
        this._progress.totalExplorationScore += explorationPoints;

        return {
            type: 'success',
            discoveries,
            explorationPoints,
            newSkillLevels: this.updateSkillLevels(discoveries)
        };
    }

    /**
     * Checks for potential discoveries within a given grid cell based on its attributes and player skills.
     * @param cell - The {@link GridCell} to check.
     * @param skills - A map of the player's current exploration skill levels.
     * @returns An array of {@link Discovery} objects found in the cell.
     */
    private checkForDiscoveries(cell: GridCell, skills: Map<string, number>): Discovery[] {
        const discoveries: Discovery[] = [];
        const baseChance = this.calculateBaseDiscoveryChance(cell);

        // Check each discovery type based on cell attributes and relevant skills.
        // Magic affinity influences artifact discovery, boosted by archaeology skill.
        if (this.rollForDiscovery(baseChance * cell.attributes.magicAffinity / 100, skills.get('archaeology') || 1)) {
            discoveries.push(this.generateDiscovery(DiscoveryType.ARTIFACT, cell));
        }

        // Human presence influences settlement discovery, boosted by archaeology skill.
        if (this.rollForDiscovery(baseChance * cell.attributes.humanPresence / 100, skills.get('archaeology') || 1)) {
            discoveries.push(this.generateDiscovery(DiscoveryType.SETTLEMENT, cell));
        }

        // Danger level influences dungeon discovery, boosted by survival skill.
        if (this.rollForDiscovery(baseChance * cell.attributes.dangerLevel / 100, skills.get('survival') || 1)) {
            discoveries.push(this.generateDiscovery(DiscoveryType.DUNGEON, cell));
        }

        // Vegetation density influences resource discovery, boosted by naturalism skill.
        if (this.rollForDiscovery(baseChance * cell.attributes.vegetationDensity / 100, skills.get('naturalism') || 1)) {
            discoveries.push(this.generateDiscovery(DiscoveryType.RESOURCE, cell));
        }

        return discoveries;
    }

    /**
     * Calculates the base chance of making a discovery in a given cell.
     * This chance is influenced by the cell's explorability and whether neighboring cells have already been explored.
     * @param cell - The {@link GridCell} for which to calculate the chance.
     * @returns The base discovery chance (0-1).
     */
    private calculateBaseDiscoveryChance(cell: GridCell): number {
        const key = cell.position.toString();
        // Cache the calculated chance to avoid redundant computations.
        if (!this._discoveryChances.has(key)) {
            let chance = 0.1; // 10% base chance for any discovery.
            // Explorability directly scales the chance.
            chance *= (cell.attributes.explorability / 100);
            // Reduce chance if many neighbors are already explored, simulating less "new" to find.
            chance *= (1 - (this.getNeighborExploredCount(cell.position) * 0.1));
            this._discoveryChances.set(key, chance);
        }
        return this._discoveryChances.get(key)!;
    }

    /**
     * Rolls a dice to determine if a discovery is made, considering base chance and skill level.
     * @param chance - The base probability (0-1) of discovery.
     * @param skillLevel - The player's relevant skill level.
     * @returns `true` if a discovery is made, `false` otherwise.
     */
    private rollForDiscovery(chance: number, skillLevel: number): boolean {
        // Skill level provides a bonus to the discovery chance.
        const skillBonus = (skillLevel - 1) * 0.05; // 5% bonus per skill level.
        return Math.random() < (chance + skillBonus);
    }

    /**
     * Generates a new {@link Discovery} object for a given type and cell.
     * @param type - The {@link DiscoveryType} to generate.
     * @param cell - The {@link GridCell} where the discovery was made.
     * @returns The newly generated {@link Discovery} object.
     */
    private generateDiscovery(type: DiscoveryType, cell: GridCell): Discovery {
        const id = `${type}_${cell.position.toString()}_${Date.now()}`;
        const discovery: Discovery = {
            id,
            type,
            name: { key: `discovery.${type}.name` }, // Placeholder for translatable name.
            description: { key: `discovery.${type}.description` }, // Placeholder for translatable description.
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

    /**
     * Calculates the {@link ExplorationDifficulty} for a discovery based on cell attributes.
     * @param cell - The {@link GridCell} where the discovery was made.
     * @returns The calculated {@link ExplorationDifficulty}.
     */
    private calculateDifficulty(cell: GridCell): ExplorationDifficulty {
        // Difficulty is a weighted sum of danger, travel cost, and inverse explorability.
        const difficultyScore =
            (cell.attributes.dangerLevel * 0.4) +
            (cell.attributes.travelCost * 0.3) +
            ((100 - cell.attributes.explorability) * 0.3);

        // Map the score to an enumeration of difficulty levels.
        if (difficultyScore >= 90) return ExplorationDifficulty.LEGENDARY;
        if (difficultyScore >= 75) return ExplorationDifficulty.EXTREME;
        if (difficultyScore >= 50) return ExplorationDifficulty.HARD;
        if (difficultyScore >= 25) return ExplorationDifficulty.NORMAL;
        return ExplorationDifficulty.EASY;
    }

    /**
     * Calculates the experience reward for a discovery based on its type and the cell's difficulty.
     * @param type - The {@link DiscoveryType}.
     * @param cell - The {@link GridCell} of the discovery.
     * @returns The calculated experience points.
     */
    private calculateExperienceReward(type: DiscoveryType, cell: GridCell): number {
        // Base XP for each discovery type.
        const baseXP = {
            [DiscoveryType.LANDMARK]: 100,
            [DiscoveryType.RESOURCE]: 50,
            [DiscoveryType.SETTLEMENT]: 150,
            [DiscoveryType.DUNGEON]: 200,
            [DiscoveryType.ARTIFACT]: 250,
            [DiscoveryType.SECRET]: 300
        }[type];

        // Difficulty multiplier for XP.
        const difficultyMultiplier = {
            [ExplorationDifficulty.EASY]: 1,
            [ExplorationDifficulty.NORMAL]: 1.5,
            [ExplorationDifficulty.HARD]: 2,
            [ExplorationDifficulty.EXTREME]: 3,
            [ExplorationDifficulty.LEGENDARY]: 5
        }[this.calculateDifficulty(cell)];

        return Math.floor(baseXP * difficultyMultiplier);
    }

    /**
     * Generates reward items for a discovery.
     * @param _type - The {@link DiscoveryType}.
     * @param _cell - The {@link GridCell} of the discovery.
     * @returns An array of item IDs to be rewarded.
     * @todo Implement actual item generation logic based on discovery type and cell attributes.
     */
    private generateRewardItems(_type: DiscoveryType, _cell: GridCell): string[] {
        // This would be implemented to generate appropriate rewards based on discovery type and cell attributes
        return [];
    }

    /**
     * Generates unlocks (e.g., recipes, skills) for a discovery.
     * @param _type - The {@link DiscoveryType}.
     * @param _cell - The {@link GridCell} of the discovery.
     * @returns An array of unlockable IDs.
     * @todo Implement actual unlock generation logic based on discovery type and cell attributes.
     */
    private generateUnlocks(_type: DiscoveryType, _cell: GridCell): string[] {
        // This would be implemented to generate appropriate unlocks based on discovery type and cell attributes
        return [];
    }

    /**
     * Calculates exploration points gained from exploring a cell and making discoveries.
     * @param cell - The {@link GridCell} explored.
     * @param discoveries - An array of {@link Discovery} objects made in the cell.
     * @returns The total exploration points gained.
     */
    private calculateExplorationPoints(cell: GridCell, discoveries: Discovery[]): number {
        let points = cell.attributes.explorability; // Base points from cell's explorability.
        // Add bonus points for each discovery made.
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

    /**
     * Updates player skill levels based on new discoveries.
     * @param discoveries - An array of {@link Discovery} objects made.
     * @returns The updated map of skill levels.
     */
    private updateSkillLevels(discoveries: Discovery[]): Map<string, number> {
        const _skillGains = new Map<string, number>(); // This variable is currently unused.

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

    /**
     * Awards experience to a specific exploration skill.
     * @param skill - The name of the skill to gain experience for.
     * @param amount - The amount of experience to award.
     */
    private gainSkillExp(skill: string, amount: number): void {
        const currentLevel = this._progress.skillLevels.get(skill) || 1;
        // Simplified experience gain: if amount >= expNeeded, level up.
        // In a real system, this would involve tracking current XP within a level.
        const expNeeded = Math.floor(100 * Math.pow(1.5, currentLevel - 1));

        if (amount >= expNeeded) {
            this._progress.skillLevels.set(skill, currentLevel + 1);
        }
    }

    /**
     * Counts how many of a cell's immediate neighbors have already been explored.
     * @param position - The {@link GridPosition} of the cell.
     * @returns The count of explored neighbors.
     */
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

    /**
     * Retrieves a copy of the current exploration progress.
     * @returns A copy of the {@link ExplorationProgress} object.
     */
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

/**
 * Represents the result of an exploration attempt on a single grid cell.
 */
export interface ExplorationResult {
    /** The type of result (e.g., 'success' if new discoveries were made, 'already_explored' if the cell was already known). */
    type: 'success' | 'already_explored';
    /** Optional: An array of {@link Discovery} objects made during this exploration. */
    discoveries?: Discovery[];
    /** Optional: The number of exploration points gained from this action. */
    explorationPoints?: number;
    /** Optional: The updated map of player skill levels if any skills gained experience. */
    newSkillLevels?: Map<string, number>;
}
